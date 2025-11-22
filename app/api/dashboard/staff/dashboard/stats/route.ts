import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import CourseModel from "@/models/dashboard/staff/Course"
import StudentModel from "@/models/dashboard/staff/Student"

// Route segment config - cache for 30 seconds for dashboard stats
export const dynamic = 'force-dynamic'
export const revalidate = 30 // Revalidate every 30 seconds

export async function GET() {
  try {
    await dbConnect("uniqbrio")
    
    // Count active courses and total students in parallel
    const [activeCourses, totalStudents] = await Promise.all([
      CourseModel.countDocuments({ status: "Active" }),
      // Count only students that are not deleted
      StudentModel.countDocuments({ isDeleted: { $ne: true } })
    ])
    
    return NextResponse.json({
      activeCourses,
      totalStudents
    })
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to fetch dashboard stats", error: error.message },
      { status: 500 }
    )
  }
}
