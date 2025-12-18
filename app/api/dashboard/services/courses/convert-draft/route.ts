import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { Course } from "@/models/dashboard"
import { CourseIdManager } from "@/lib/dashboard/courseIdManager"

export async function POST(request: Request) {
  try {
    console.log('🔄 POST /api/courses/convert-draft - Converting draft to course')
    await dbConnect("uniqbrio")
    
    const body = await request.json()
    const { draftId } = body
    
    if (!draftId) {
      return NextResponse.json({ 
        success: false, 
        error: "Draft ID is required" 
      }, { status: 400 })
    }
    
    // Convert the draft to a course with sequential ID
    const newCourseId = await CourseIdManager.convertDraftToCourse(draftId)
    
    // Fetch the updated course to return
    const updatedCourse = await Course.findById(draftId)
    
    if (!updatedCourse) {
      return NextResponse.json({ 
        success: false, 
        error: "Failed to retrieve converted course" 
      }, { status: 500 })
    }
    
    // Transform the response to match frontend expectations
    const transformedCourse = {
      ...updatedCourse.toObject(),
      id: updatedCourse.courseId || updatedCourse._id?.toString?.() || String(updatedCourse._id),
      name: updatedCourse.name,
      instructor: updatedCourse.instructor || 'Unknown Instructor',
      price: updatedCourse.price,
      type: updatedCourse.type,
      status: updatedCourse.status
    }
    
    console.log(`✅ Successfully converted draft to course with ID: ${newCourseId}`)
    
    return NextResponse.json({ 
      success: true, 
      message: `Draft converted to course with ID: ${newCourseId}`,
      course: transformedCourse,
      newCourseId
    })
    
  } catch (error) {
    console.error('❌ Draft conversion error:', error)
    let message = "Failed to convert draft to course"
    
    if (error instanceof Error) {
      message = error.message
    }
    
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 500 })
  }
}