import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import mongoose from "mongoose"

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export async function POST(request: Request) {
  try {
    await dbConnect("uniqbrio")
    const body = await request.json()
    
    const {
      sessionId,
      cohortId,
      courseId,
      originalInstructor,
      originalInstructorId,
      newInstructor,
      newInstructorId,
      sessionDate,
      startTime,
      endTime,
      location,
      reason,
      modifiedBy
    } = body

    // Validate required fields
    if (!sessionId || !cohortId || !courseId || !originalInstructor || !newInstructor || !sessionDate) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get database reference
    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not established')
    }
    
    const instructorReassignmentsCollection = db.collection('instructor_reassignments')
    const scheduleModificationsCollection = db.collection('schedule_modifications')

    // Create reassignment record
    const reassignmentData = {
      sessionId,
      cohortId,
      courseId,
      originalInstructor,
      originalInstructorId,
      newInstructor,
      newInstructorId,
      sessionDate: new Date(sessionDate),
      startTime,
      endTime,
      location,
      reason: reason || `Instructor reassigned from ${originalInstructor} to ${newInstructor}`,
      modifiedBy: modifiedBy || 'System',
      reassignedAt: new Date(),
      status: 'active',
      notificationsSent: true,
      affectedStudents: 0 // This should be updated based on actual enrollment
    }

    // Insert reassignment record
    const reassignmentResult = await instructorReassignmentsCollection.insertOne(reassignmentData)

    // Create schedule modification record
    const modificationData = {
      sessionId,
      cohortId,
      courseId,
      modificationType: 'instructor_changed',
      timestamp: new Date(),
      modifiedBy: modifiedBy || 'System',
      reason: reason || `Instructor reassigned from ${originalInstructor} to ${newInstructor}`,
      previousValues: {
        instructor: originalInstructor,
        instructorId: originalInstructorId,
      },
      newValues: {
        instructor: newInstructor,
        instructorId: newInstructorId,
      },
      reassignmentId: reassignmentResult.insertedId,
      metadata: {
        sessionDate: new Date(sessionDate),
        startTime,
        endTime,
        location
      }
    }

    // Insert modification record
    const modificationResult = await scheduleModificationsCollection.insertOne(modificationData)

    // Update the schedule document directly with modification data
    const schedulesCollection = db.collection('schedules')
    
    // Try to find the schedule by sessionId first
    let schedule = null
    
    // Check if sessionId is a valid ObjectId format
    if (mongoose.Types.ObjectId.isValid(sessionId)) {
      const scheduleQuery = { _id: new mongoose.Types.ObjectId(sessionId) }
      schedule = await schedulesCollection.findOne(scheduleQuery)
    }
    
    if (!schedule) {
      // Try multiple fallback queries to find the schedule
      const queries = [
        // Query by sessionId as string field (if it's stored as custom ID)
        { sessionId: sessionId },
        // Query by courseId, instructor and date combination
        { 
          courseId: courseId,
          instructorName: originalInstructor,
          date: new Date(sessionDate),
          startTime: startTime,
          endTime: endTime
        },
        // Query by title pattern and date (for generated sessions)
        {
          title: { $regex: new RegExp(courseId || cohortId, 'i') },
          date: new Date(sessionDate),
          startTime: startTime,
          endTime: endTime
        }
      ]
      
      for (const query of queries) {
        schedule = await schedulesCollection.findOne(query)
        if (schedule) {
          console.log(`Found schedule using query:`, query)
          break
        }
      }
    }

    if (schedule) {
      // Update the original schedule to mark as reassigned_from
      await schedulesCollection.updateOne(
        { _id: schedule._id },
        {
          $set: {
            'modifications.reassignment': {
              originalInstructor: originalInstructorId,
              originalInstructorName: originalInstructor,
              newInstructor: newInstructorId,
              newInstructorName: newInstructor,
              reassignedAt: new Date(),
              reason: reason || `Instructor reassigned from ${originalInstructor} to ${newInstructor}`,
              reassignedBy: modifiedBy || 'System',
              type: 'reassigned_from'
            },
            lastModifiedBy: modifiedBy || 'System',
            updatedAt: new Date()
          }
        }
      )

      // Create a new schedule entry for the reassigned session
      const reassignedSchedule = {
        ...schedule,
        _id: new mongoose.Types.ObjectId(),
        instructor: newInstructorId,
        instructorName: newInstructor,
        'modifications.reassignment': {
          originalInstructor: originalInstructorId,
          originalInstructorName: originalInstructor,
          newInstructor: newInstructorId,
          newInstructorName: newInstructor,
          reassignedAt: new Date(),
          reason: reason || `Instructor reassigned from ${originalInstructor} to ${newInstructor}`,
          reassignedBy: modifiedBy || 'System',
          type: 'reassigned_to'
        },
        createdBy: modifiedBy || 'System',
        lastModifiedBy: modifiedBy || 'System',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await schedulesCollection.insertOne(reassignedSchedule)
      
      console.log(`Updated schedule ${schedule._id} with reassignment modification`)
      var scheduleOperation = 'updated'
    } else {
      console.warn(`Could not find existing schedule for sessionId: ${sessionId}, creating new schedule documents`)
      
      // Create new schedule documents for both reassigned_from and reassigned_to
      const baseScheduleData = {
        title: `${courseId} - ${cohortId}`,
        courseId: courseId,
        instructor: originalInstructorId,
        instructorName: originalInstructor,
        students: 0,
        registeredStudents: [],
        maxCapacity: 20,
        waitlist: [],
        date: new Date(sessionDate),
        startTime: startTime,
        endTime: endTime,
        location: location || 'TBD',
        category: 'Teaching',
        status: 'Upcoming',
        isCancelled: false,
        isRecurring: false,
        mode: 'live',
        type: 'online',
        tags: [],
        attendanceRequired: true,
        reminderSent: false,
        notificationSettings: {
          reminderTime: 60,
          sendSMS: false,
          sendEmail: true,
          sendPush: false
        },
        currency: 'USD',
        paymentRequired: false,
        version: 1,
        createdBy: modifiedBy || 'System',
        lastModifiedBy: modifiedBy || 'System',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      // Create "reassigned from" schedule
      const reassignedFromSchedule = {
        ...baseScheduleData,
        _id: new mongoose.Types.ObjectId(),
        modifications: {
          reassignment: {
            originalInstructor: originalInstructorId,
            originalInstructorName: originalInstructor,
            newInstructor: newInstructorId,
            newInstructorName: newInstructor,
            reassignedAt: new Date(),
            reason: reason || `Instructor reassigned from ${originalInstructor} to ${newInstructor}`,
            reassignedBy: modifiedBy || 'System',
            type: 'reassigned_from'
          }
        }
      }
      
      // Create "reassigned to" schedule
      const reassignedToSchedule = {
        ...baseScheduleData,
        _id: new mongoose.Types.ObjectId(),
        instructor: newInstructorId,
        instructorName: newInstructor,
        modifications: {
          reassignment: {
            originalInstructor: originalInstructorId,
            originalInstructorName: originalInstructor,
            newInstructor: newInstructorId,
            newInstructorName: newInstructor,
            reassignedAt: new Date(),
            reason: reason || `Instructor reassigned from ${originalInstructor} to ${newInstructor}`,
            reassignedBy: modifiedBy || 'System',
            type: 'reassigned_to'
          }
        }
      }
      
      // Insert both schedule documents
      await schedulesCollection.insertMany([reassignedFromSchedule, reassignedToSchedule])
      console.log(`Created new schedule documents for reassignment`)
      var scheduleOperation = 'created'
    }

    return NextResponse.json({
      success: true,
      reassignmentId: reassignmentResult.insertedId.toString(),
      modificationId: modificationResult.insertedId.toString(),
      scheduleOperation: scheduleOperation || 'none',
      scheduleUpdated: !!schedule || scheduleOperation === 'created',
      message: 'Instructor reassignment recorded successfully',
      data: {
        ...reassignmentData,
        _id: reassignmentResult.insertedId.toString()
      }
    })

  } catch (error) {
    console.error('Error creating instructor reassignment:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create instructor reassignment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect("uniqbrio")
    const { searchParams } = new URL(request.url)
    
    // Get database reference
    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not established')
    }
    
    const instructorReassignmentsCollection = db.collection('instructor_reassignments')
    
    // Build query
    const query: any = { status: 'active' }
    
    // Optional filters
    if (searchParams.get('cohortId')) {
      query.cohortId = searchParams.get('cohortId')
    }
    
    if (searchParams.get('courseId')) {
      query.courseId = searchParams.get('courseId')
    }
    
    if (searchParams.get('instructorId')) {
      query.$or = [
        { originalInstructorId: searchParams.get('instructorId') },
        { newInstructorId: searchParams.get('instructorId') }
      ]
    }
    
    // Date range filter
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    if (startDate || endDate) {
      query.sessionDate = {}
      if (startDate) {
        query.sessionDate.$gte = new Date(startDate)
      }
      if (endDate) {
        query.sessionDate.$lte = new Date(endDate)
      }
    }
    
    // Fetch reassignments
    const reassignments = await instructorReassignmentsCollection
      .find(query)
      .sort({ reassignedAt: -1 })
      .toArray()
    
    // Convert ObjectId to string for JSON serialization
    const serializedReassignments = reassignments.map(reassignment => ({
      ...reassignment,
      _id: reassignment._id.toString()
    }))
    
    return NextResponse.json({
      success: true,
      reassignments: serializedReassignments,
      count: serializedReassignments.length
    })

  } catch (error) {
    console.error('Error fetching instructor reassignments:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch instructor reassignments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}