import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import mongoose from "mongoose"
import { getInstructorIdFromName } from "@/lib/dashboard/instructorAvailability"
import { getUserSession } from "@/lib/tenant/api-helpers"
import { runWithTenantContext } from "@/lib/tenant/tenant-context"
import Instructor from "@/models/dashboard/staff/Instructor"
import { logEntityCreate, logEntityUpdate, logEntityDelete, getClientIp, getUserAgent } from "@/lib/audit-logger"
import { AuditModule } from "@/models/AuditLog"

export async function GET(request: Request) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio")
        const { searchParams } = new URL(request.url)
        
        // Build query for active instructors - use Mongoose model with tenant plugin
        const query: any = {
          status: { $regex: /active/i } // Case insensitive match for 'active'
        }
    
    // Search functionality
    if (searchParams.get('search')) {
      const searchTerm = searchParams.get('search')
      query.$or = [
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { middleName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { role: { $regex: searchTerm, $options: 'i' } },
        { specializations: { $regex: searchTerm, $options: 'i' } }
      ]
    }
    
    // Filter by expertise/specializations
    if (searchParams.get('expertise')) {
      query.specializations = { 
        $in: [searchParams.get('expertise')] 
      }
    }
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    
    // Sorting - default by first name
    let sort: any = { firstName: 1 }
    const sortBy = searchParams.get('sortBy')
    if (sortBy) {
      const sortOrder = searchParams.get('sortOrder') === 'desc' ? -1 : 1
      sort = { [sortBy]: sortOrder }
    }
    
    // Execute query using Mongoose model (tenant plugin auto-filters)
    const instructors = await Instructor
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
    
    // Transform data for dropdown usage
    const transformedInstructors = instructors.map((instructor: any) => {
      // Construct full name from firstName, middleName, lastName
      const nameParts = [
        instructor.firstName || '',
        instructor.middleName || '',
        instructor.lastName || ''
      ].filter(part => part.trim() !== '')
      
      const fullName = nameParts.join(' ') || 'Unknown Instructor'
      
      // Get instructorId from database or generate from name mapping
      const instructorId = instructor.instructorId || getInstructorIdFromName(fullName)
      
      return {
        id: instructor._id.toString(),
        name: fullName,
        instructorId: instructorId,
        email: instructor.email || '',
        avatar: instructor.avatar || null,
        phone: instructor.phone || '',
        // Map instructor-specific fields
        bio: instructor.bio || '',
        expertise: instructor.specializations || [],
        experience: instructor.yearsOfExperience ? parseInt(instructor.yearsOfExperience) : 0,
        role: instructor.role || '',
        specializations: instructor.specializations || [],
        assignedCourses: instructor.assignedCourses || [],
        status: instructor.status || 'Active',
        joiningDate: instructor.joiningDate || '',
        contractType: instructor.contractType || '',
        // Additional fields that might be useful
        firstName: instructor.firstName || '',
        lastName: instructor.lastName || '',
        middleName: instructor.middleName || '',
        gender: instructor.gender || '',
        department: instructor.department || '',
        branch: instructor.branch || ''
      }
    })
    
        // Get total count for pagination
        const total = await Instructor.countDocuments(query)
        
        return NextResponse.json({
          success: true,
          instructors: transformedInstructors,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        })
        
      } catch (error) {
        console.error('Instructor fetch error:', error)
        let message = "Failed to fetch instructors"
        if (error instanceof Error) message = error.message
        
        return NextResponse.json({ 
          success: false, 
          error: message 
        }, { status: 500 })
      }
    }
  );
}

// POST endpoint to create a new instructor
export async function POST(request: Request) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio")
        const body = await request.json()
        
        // Parse the name into firstName, middleName, lastName
        const nameParts = (body.name || '').trim().split(/\s+/)
        const firstName = nameParts[0] || ''
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''
        const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : ''
        
        // Check if email already exists (tenant plugin auto-filters)
        const existingInstructor = await Instructor.findOne({ email: body.email })
        if (existingInstructor) {
          return NextResponse.json({ 
            success: false, 
            error: "Instructor with this email already exists" 
          }, { status: 409 })
        }
        
        // Generate tenant-scoped instructor ID
        const { generateInstructorId } = await import('@/lib/dashboard/id-generators')
        const instructorId = await generateInstructorId(session.tenantId)
        
        // Create instructor document matching the existing schema using Mongoose model
        const instructor = await Instructor.create({
          tenantId: session.tenantId,
          instructorId, // Assign generated ID
          externalId: instructorId, // Use same ID for externalId
          firstName,
          middleName,
          lastName,
          email: body.email || '',
          phone: body.phone || '',
          role: body.role || 'Instructor',
          status: 'Active',
          bio: body.bio || '',
          specializations: body.expertise || body.specializations || [],
          yearsOfExperience: body.experience?.toString() || '0',
          gender: body.gender || '',
          department: body.department || '',
          branch: body.branch || '',
          joiningDate: new Date().toISOString().split('T')[0],
          contractType: body.contractType || 'Full-time',
          assignedCourses: body.assignedCourses || [],
          jobLevel: body.jobLevel || 'Instructor',
          jobLevelOther: body.jobLevelOther || ''
        })
        
        // Transform response
        const transformedInstructor = {
          id: instructor._id.toString(),
          name: [firstName, middleName, lastName].filter(part => part).join(' '),
          email: instructor.email,
          phone: instructor.phone,
          bio: instructor.bio,
          expertise: instructor.specializations,
          experience: parseInt(instructor.yearsOfExperience || '0'),
          role: instructor.role,
          status: instructor.status,
          firstName: instructor.firstName,
          lastName: instructor.lastName,
          middleName: instructor.middleName
        }
        
        // Audit log the instructor creation
        await logEntityCreate({
          module: AuditModule.STAFF,
          action: 'create_instructor',
          entityType: 'instructor',
          entityId: instructor._id.toString(),
          entityName: transformedInstructor.name,
          userId: session.userId,
          userEmail: session.email,
          userRole: 'super_admin',
          tenantId: session.tenantId,
          ipAddress: getClientIp(request.headers),
          userAgent: getUserAgent(request.headers),
          details: {
            instructorId: instructor._id.toString(),
            externalId: instructor.instructorId,
            name: transformedInstructor.name,
            email: instructor.email,
            phone: instructor.phone,
            role: instructor.role,
            specializations: instructor.specializations
          }
        })
        
        return NextResponse.json({ 
          success: true, 
          instructor: transformedInstructor 
        }, { status: 201 })
        
      } catch (error) {
        console.error('Instructor creation error:', error)
        let message = "Failed to create instructor"
        let status = 500
        
        if (error instanceof Error) {
          message = error.message
          if ((error as any).name === 'ValidationError') {
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

// PUT endpoint to update an existing instructor
export async function PUT(request: Request) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio")
        const body = await request.json()
        
        const { id, ...updateData } = body
        
        if (!id) {
          return NextResponse.json({ 
            success: false, 
            error: "Instructor ID is required" 
          }, { status: 400 })
        }
        
        // Get existing instructor for comparison (tenant plugin auto-filters)
        const existingInstructor = await Instructor.findOne({ _id: id, tenantId: session.tenantId })
        if (!existingInstructor) {
          return NextResponse.json({ 
            success: false, 
            error: "Instructor not found" 
          }, { status: 404 })
        }
        
        // Track field changes
        const fieldChanges: Record<string, { oldValue: any; newValue: any }> = {}
        
        // Parse name if provided
        if (updateData.name) {
          const nameParts = updateData.name.trim().split(/\s+/)
          const firstName = nameParts[0] || ''
          const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''
          const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : ''
          
          if (firstName !== existingInstructor.firstName) {
            fieldChanges.firstName = { oldValue: existingInstructor.firstName, newValue: firstName }
            updateData.firstName = firstName
          }
          if (lastName !== existingInstructor.lastName) {
            fieldChanges.lastName = { oldValue: existingInstructor.lastName, newValue: lastName }
            updateData.lastName = lastName
          }
          if (middleName !== existingInstructor.middleName) {
            fieldChanges.middleName = { oldValue: existingInstructor.middleName, newValue: middleName }
            updateData.middleName = middleName
          }
          delete updateData.name
        }
        
        // Map expertise to specializations
        if (updateData.expertise) {
          updateData.specializations = updateData.expertise
          delete updateData.expertise
        }
        
        // Map experience to yearsOfExperience
        if (updateData.experience !== undefined) {
          updateData.yearsOfExperience = updateData.experience.toString()
          delete updateData.experience
        }
        
        // Track other field changes
        const fieldsToTrack = ['email', 'phone', 'role', 'status', 'bio', 'specializations', 'yearsOfExperience', 'department', 'branch', 'contractType']
        for (const field of fieldsToTrack) {
          if (updateData[field] !== undefined && JSON.stringify(existingInstructor[field]) !== JSON.stringify(updateData[field])) {
            fieldChanges[field] = { 
              oldValue: existingInstructor[field], 
              newValue: updateData[field] 
            }
          }
        }
        
        // Update instructor (tenant plugin ensures tenant isolation)
        const updatedInstructor = await Instructor.findOneAndUpdate(
          { _id: id, tenantId: session.tenantId },
          { $set: updateData },
          { new: true, runValidators: true }
        )
        
        if (!updatedInstructor) {
          return NextResponse.json({ 
            success: false, 
            error: "Failed to update instructor" 
          }, { status: 500 })
        }
        
        // Transform response
        const fullName = [updatedInstructor.firstName, updatedInstructor.middleName, updatedInstructor.lastName]
          .filter(part => part).join(' ')
        
        const transformedInstructor = {
          id: updatedInstructor._id.toString(),
          name: fullName,
          email: updatedInstructor.email,
          phone: updatedInstructor.phone,
          bio: updatedInstructor.bio,
          expertise: updatedInstructor.specializations,
          experience: parseInt(updatedInstructor.yearsOfExperience || '0'),
          role: updatedInstructor.role,
          status: updatedInstructor.status,
          firstName: updatedInstructor.firstName,
          lastName: updatedInstructor.lastName,
          middleName: updatedInstructor.middleName
        }
        
        // Audit log the instructor update
        await logEntityUpdate({
          module: AuditModule.STAFF,
          action: 'update_instructor',
          entityType: 'instructor',
          entityId: updatedInstructor._id.toString(),
          entityName: fullName,
          userId: session.userId,
          userEmail: session.email,
          userRole: 'super_admin',
          tenantId: session.tenantId,
          ipAddress: getClientIp(request.headers),
          userAgent: getUserAgent(request.headers),
          fieldChanges,
          details: {
            instructorId: updatedInstructor._id.toString(),
            externalId: updatedInstructor.instructorId,
            name: fullName,
            email: updatedInstructor.email,
            phone: updatedInstructor.phone
          }
        })
        
        return NextResponse.json({ 
          success: true, 
          instructor: transformedInstructor 
        })
        
      } catch (error) {
        console.error('Instructor update error:', error)
        let message = "Failed to update instructor"
        let status = 500
        
        if (error instanceof Error) {
          message = error.message
          if ((error as any).name === 'ValidationError') {
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

// DELETE endpoint to delete an instructor
export async function DELETE(request: Request) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio")
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        
        if (!id) {
          return NextResponse.json({ 
            success: false, 
            error: "Instructor ID is required" 
          }, { status: 400 })
        }
        
        // Get instructor before deletion (tenant plugin auto-filters)
        const instructor = await Instructor.findOne({ _id: id, tenantId: session.tenantId })
        if (!instructor) {
          return NextResponse.json({ 
            success: false, 
            error: "Instructor not found" 
          }, { status: 404 })
        }
        
        const fullName = [instructor.firstName, instructor.middleName, instructor.lastName]
          .filter(part => part).join(' ')
        
        // Delete instructor (tenant plugin ensures tenant isolation)
        await Instructor.findOneAndDelete({ _id: id, tenantId: session.tenantId })
        
        // Audit log the instructor deletion
        await logEntityDelete({
          module: AuditModule.STAFF,
          action: 'delete_instructor',
          entityType: 'instructor',
          entityId: instructor._id.toString(),
          entityName: fullName,
          userId: session.userId,
          userEmail: session.email,
          userRole: 'super_admin',
          tenantId: session.tenantId,
          ipAddress: getClientIp(request.headers),
          userAgent: getUserAgent(request.headers),
          details: {
            instructorId: instructor._id.toString(),
            externalId: instructor.instructorId,
            name: fullName,
            email: instructor.email,
            phone: instructor.phone
          }
        })
        
        return NextResponse.json({ 
          success: true, 
          message: "Instructor deleted successfully" 
        })
        
      } catch (error) {
        console.error('Instructor deletion error:', error)
        let message = "Failed to delete instructor"
        if (error instanceof Error) message = error.message
        
        return NextResponse.json({ 
          success: false, 
          error: message 
        }, { status: 500 })
      }
    }
  );
}