import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import mongoose from "mongoose"
import { getInstructorIdFromName } from "@/lib/dashboard/instructorAvailability"

export async function GET(request: Request) {
  try {
    await dbConnect("uniqbrio")
    const { searchParams } = new URL(request.url)
    
    // Get database reference to access instructors collection directly
    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not established')
    }
    const instructorsCollection = db.collection('instructors')
    
    // Build query for active instructors
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
    
    // Execute query
    const instructors = await instructorsCollection
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray()
    
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
    const total = await instructorsCollection.countDocuments(query)
    
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

// POST endpoint to create a new instructor
export async function POST(request: Request) {
  try {
    await dbConnect("uniqbrio")
    const body = await request.json()
    
    // Get database reference
    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not established')
    }
    const instructorsCollection = db.collection('instructors')
    
    // Parse the name into firstName, middleName, lastName
    const nameParts = (body.name || '').trim().split(/\s+/)
    const firstName = nameParts[0] || ''
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''
    const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : ''
    
    // Check if email already exists
    const existingInstructor = await instructorsCollection.findOne({ email: body.email })
    if (existingInstructor) {
      return NextResponse.json({ 
        success: false, 
        error: "Instructor with this email already exists" 
      }, { status: 409 })
    }
    
    // Create instructor document matching the existing schema
    const instructorDoc = {
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
      availableDays: [],
      awards: [''],
      bloodGroup: '',
      branches: [''],
      careerGoals: '',
      certifications: [''],
      communicationPreferences: '',
      country: '',
      address: '',
      emergencyContact: {
        name: '',
        relation: '',
        phone: ''
      },
      employmentHistory: [{
        position: '',
        institution: '',
        startDate: '',
        endDate: '',
        responsibilities: ''
      }],
      genderOther: '',
      languages: '',
      locationPreferences: [],
      maritalStatus: '',
      maxStudents: '',
      nationality: '',
      paymentInfo: {
        classCount: '',
        frequency: '',
        hourlyRate: '',
        bankName: '',
        accountHolder: '',
        accountNumber: '',
        ifsc: '',
        branchAddress: '',
        paymentType: '',
        rate: '',
        overtimeRate: '',
        deductions: '',
        taxId: '',
        paymentMethod: '',
        payrollEmail: '',
        payrollPhone: '',
        rateType: 'hourly'
      },
      permissionsLevel: '',
      reportingManager: '',
      roleInCourse: '',
      shifts: {
        primary: [{ start: '', end: '' }],
        secondary: [{ start: '', end: '' }]
      },
      skillset: [''],
      socialLinks: {
        linkedin: '',
        instagram: '',
        facebook: '',
        twitter: '',
        other: ''
      },
      state: '',
      temporaryPassword: '',
      timeSlots: [{ start: '', end: '' }],
      upcomingClasses: [{ title: '', date: '', time: '', location: '' }],
      createdAt: new Date(),
      updatedAt: new Date(),
      jobLevel: 'Instructor',
      jobLevelOther: ''
    }
    
    // Insert the new instructor
    const result = await instructorsCollection.insertOne(instructorDoc)
    
    // Transform response
    const transformedInstructor = {
      id: result.insertedId.toString(),
      name: [firstName, middleName, lastName].filter(part => part).join(' '),
      email: instructorDoc.email,
      phone: instructorDoc.phone,
      bio: instructorDoc.bio,
      expertise: instructorDoc.specializations,
      experience: parseInt(instructorDoc.yearsOfExperience),
      role: instructorDoc.role,
      status: instructorDoc.status,
      firstName: instructorDoc.firstName,
      lastName: instructorDoc.lastName,
      middleName: instructorDoc.middleName
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
      if (error.name === 'MongoServerError' && error.message.includes('duplicate key')) {
        message = "Instructor with this email already exists"
        status = 409
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status })
  }
}