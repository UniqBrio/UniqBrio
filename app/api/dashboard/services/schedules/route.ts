import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { Schedule } from "@/models/dashboard"
import type { ISchedule } from "@/models/dashboard"
import { getUserSession } from "@/lib/tenant/api-helpers"
import { runWithTenantContext } from "@/lib/tenant/tenant-context"

export async function POST(request: Request) {
  const session = await getUserSession();
  
  return runWithTenantContext(
    { tenantId: session?.tenantId || 'default' },
    async () => {
  try {
    await dbConnect("uniqbrio")
    const body = await request.json()

    // Handle bulk creation with upsert based on sessionId
    if (Array.isArray(body)) {
      console.log('Bulk creating/updating', body.length, 'schedules')
      
      const results = []
      
      for (const scheduleData of body) {
        try {
          if (scheduleData.sessionId) {
            // Try to find existing schedule by sessionId
            const existing = await Schedule.findOne({ sessionId: scheduleData.sessionId })
            
            if (existing) {
              // Update existing schedule - bypass validation
              const updated = await Schedule.findByIdAndUpdate(
                existing._id,
                scheduleData,
                { 
                  new: true, 
                  runValidators: false,
                  strict: false // Allow fields not in schema
                }
              )
              results.push(updated)
            } else {
              // Create new schedule - bypass validation to avoid issues with empty modifications
              const newSchedule = await Schedule.create([scheduleData], { 
                validateBeforeSave: false 
              })
              results.push(newSchedule[0])
            }
          } else {
            // No sessionId, create new schedule - bypass validation
            const newSchedule = await Schedule.create([scheduleData], { 
              validateBeforeSave: false 
            })
            results.push(newSchedule[0])
          }
        } catch (error) {
          console.error('Error processing schedule:', error)
          // Continue with next schedule
        }
      }
      
      console.log('Successfully processed', results.length, 'schedules')
      return NextResponse.json({ 
        success: true, 
        insertedCount: results.length,
        schedules: results
      })
    }

    // Handle single schedule creation or update
    if (body._id || body.id) {
      const scheduleId = body._id || body.id
      const updatedSchedule = await Schedule.findByIdAndUpdate(
        scheduleId, 
        body, 
        { new: true, upsert: true, runValidators: true }
      )
      return NextResponse.json({ 
        success: true, 
        updated: true, 
        schedule: updatedSchedule 
      })
    }

    // Check for instructor conflicts
    if (body.instructor && body.date && body.startTime && body.endTime) {
      const conflicts = await Schedule.find({
        instructor: body.instructor,
        date: new Date(body.date),
        status: { $nin: ['Cancelled', 'Completed'] },
        $or: [
          { 
            startTime: { $lt: body.endTime }, 
            endTime: { $gt: body.startTime } 
          }
        ]
      })
      
      if (conflicts.length > 0) {
        return NextResponse.json({ 
          success: false, 
          error: "Instructor has a conflicting schedule",
          conflicts: conflicts
        }, { status: 409 })
      }
    }

    // Create new schedule
    const schedule = new Schedule(body)
    await schedule.save()
    
    return NextResponse.json({ 
      success: true, 
      schedule: schedule 
    }, { status: 201 })
    
  } catch (error) {
    console.error('Schedule creation error:', error)
    let message = "Failed to create schedule"
    let status = 500
    let details = null
    
    if (error instanceof Error) {
      message = error.message
      if (error.name === 'ValidationError') {
        status = 400
        // @ts-ignore - Mongoose validation errors have an errors property
        details = error.errors ? Object.keys(error.errors).map(key => ({
          field: key,
          // @ts-ignore
          message: error.errors[key].message
        })) : null
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      error: message,
      details: details
    }, { status })
  }
    }
  );
}

export async function GET(request: Request) {
  const session = await getUserSession();
  
  return runWithTenantContext(
    { tenantId: session?.tenantId || 'default' },
    async () => {
  try {
    await dbConnect("uniqbrio")
    const { searchParams } = new URL(request.url)
    
    // Build query based on search parameters
    const query: any = {}
    
    // Check if we should include modifications
    const includeModifications = searchParams.get('includeModifications') === 'true'
    
    // Filter by sessionId (custom identifier)
    if (searchParams.get('sessionId')) {
      query.sessionId = searchParams.get('sessionId')
    }
    
    // Filter by instructor
    if (searchParams.get('instructor')) {
      query.instructor = searchParams.get('instructor')
    }
    
    // Filter by student (registered or waitlisted)
    if (searchParams.get('student')) {
      const studentId = searchParams.get('student')
      query.$or = [
        { registeredStudents: studentId },
        { waitlist: studentId }
      ]
    }
    
    // Filter by category
    if (searchParams.get('category')) {
      query.category = searchParams.get('category')
    }
    
    // Filter by status
    if (searchParams.get('status')) {
      query.status = searchParams.get('status')
    }
    
    // Filter by mode
    if (searchParams.get('mode')) {
      query.mode = searchParams.get('mode')
    }
    
    // Filter by type
    if (searchParams.get('type')) {
      query.type = searchParams.get('type')
    }
    
    // Date range filtering
    if (searchParams.get('dateFrom') || searchParams.get('dateTo')) {
      query.date = {}
      if (searchParams.get('dateFrom')) {
        query.date.$gte = new Date(searchParams.get('dateFrom')!)
      }
      if (searchParams.get('dateTo')) {
        query.date.$lte = new Date(searchParams.get('dateTo')!)
      }
    }
    
    // Filter by specific date
    if (searchParams.get('date')) {
      const targetDate = new Date(searchParams.get('date')!)
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))
      query.date = { $gte: startOfDay, $lte: endOfDay }
    }
    
    // Search functionality
    if (searchParams.get('search')) {
      const searchTerm = searchParams.get('search')
      query.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { instructorName: { $regex: searchTerm, $options: 'i' } },
        { location: { $regex: searchTerm, $options: 'i' } },
        { tags: { $regex: searchTerm, $options: 'i' } }
      ]
    }
    
    // Special queries
    if (searchParams.get('upcoming') === 'true') {
      query.date = { $gte: new Date() }
      query.status = { $in: ['Upcoming', 'Pending'] }
    }
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    
    // Sorting
    let sort: any = { date: 1, startTime: 1 }
    const sortBy = searchParams.get('sortBy')
    if (sortBy) {
      const sortOrder = searchParams.get('sortOrder') === 'desc' ? -1 : 1
      sort = { [sortBy]: sortOrder }
    }
    
    // Execute query
    // Note: We don't populate references because we use custom IDs (not MongoDB ObjectIds)
    // The instructorName field already contains the instructor's name
    let schedules = await Schedule.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
    
    // Modifications are now stored directly in the schedule documents,
    // so no additional processing needed - they come automatically with the query
    
    // Get total count for pagination
    const total = await Schedule.countDocuments(query)
    
    return NextResponse.json({
      success: true,
      schedules,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      modificationsIncluded: includeModifications
    })
    
  } catch (error) {
    console.error('Schedule fetch error:', error)
    let message = "Failed to fetch schedules"
    if (error instanceof Error) message = error.message
    
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 500 })
  }
    }
  );
}

export async function PUT(request: Request) {
  const session = await getUserSession();
  
  return runWithTenantContext(
    { tenantId: session?.tenantId || 'default' },
    async () => {
  try {
    await dbConnect("uniqbrio")
    const body = await request.json()
    const { _id, ...updateData } = body
    
    if (!_id) {
      return NextResponse.json({ 
        success: false, 
        error: "Schedule ID is required for update" 
      }, { status: 400 })
    }
    
    // Check for conflicts if updating schedule details
    if (updateData.instructor && updateData.date && updateData.startTime && updateData.endTime) {
      const conflicts = await Schedule.find({
        _id: { $ne: _id },
        instructor: updateData.instructor,
        date: new Date(updateData.date),
        status: { $nin: ['Cancelled', 'Completed'] },
        $or: [
          { 
            startTime: { $lt: updateData.endTime }, 
            endTime: { $gt: updateData.startTime } 
          }
        ]
      })
      
      if (conflicts.length > 0) {
        return NextResponse.json({ 
          success: false, 
          error: "Instructor has a conflicting schedule",
          conflicts: conflicts
        }, { status: 409 })
      }
    }
    
    const schedule = await Schedule.findByIdAndUpdate(
      _id, 
      updateData, 
      { new: true, runValidators: true }
    )
    
    if (!schedule) {
      return NextResponse.json({ 
        success: false, 
        error: "Schedule not found" 
      }, { status: 404 })
    }
    
    return NextResponse.json({ 
      success: true, 
      schedule: schedule 
    })
    
  } catch (error) {
    console.error('Schedule update error:', error)
    let message = "Failed to update schedule"
    let status = 500
    
    if (error instanceof Error) {
      message = error.message
      if (error.name === 'ValidationError') {
        status = 400
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status })
  }
    }
  );
}

export async function DELETE(request: Request) {
  const session = await getUserSession();
  
  return runWithTenantContext(
    { tenantId: session?.tenantId || 'default' },
    async () => {
  try {
    await dbConnect("uniqbrio")
    const body = await request.json()
    const { _id, id } = body
    const scheduleId = _id || id
    
    if (!scheduleId) {
      return NextResponse.json({ 
        success: false, 
        error: "Schedule ID is required for deletion" 
      }, { status: 400 })
    }
    
    const schedule = await Schedule.findByIdAndDelete(scheduleId)
    
    if (!schedule) {
      return NextResponse.json({ 
        success: false, 
        error: "Schedule not found" 
      }, { status: 404 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Schedule deleted successfully",
      deletedSchedule: schedule
    })
    
  } catch (error) {
    console.error('Schedule deletion error:', error)
    let message = "Failed to delete schedule"
    if (error instanceof Error) message = error.message
    
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 500 })
  }
    }
  );
}
