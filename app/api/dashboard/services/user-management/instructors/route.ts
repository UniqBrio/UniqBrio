import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import mongoose from "mongoose"
import { getInstructorIdFromName } from "@/lib/dashboard/instructorAvailability"
import { getUserSession } from "@/lib/tenant/api-helpers"
import { runWithTenantContext } from "@/lib/tenant/tenant-context"
import Instructor from "@/models/dashboard/staff/Instructor"

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
        
        // Create instructor document matching the existing schema using Mongoose model
        const instructor = new Instructor({
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
        
        await instructor.save()
        
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