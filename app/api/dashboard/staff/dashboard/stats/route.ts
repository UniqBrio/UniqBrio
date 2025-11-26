import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import CourseModel from "@/models/dashboard/staff/Course"
import StudentModel from "@/models/dashboard/staff/Student"
import { getUserSession } from "@/lib/tenant/api-helpers"
import { runWithTenantContext } from "@/lib/tenant/tenant-context"

// Route segment config - cache for 30 seconds for dashboard stats
export const dynamic = 'force-dynamic'
export const revalidate = 30 // Revalidate every 30 seconds

export async function GET() {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    );
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
  try {
    await dbConnect("uniqbrio")
    
    // Count active courses and total students in parallel
    const [activeCourses, totalStudents] = await Promise.all([
      CourseModel.countDocuments({ tenantId: session.tenantId, status: "Active" }),
      // Count only students that are not deleted
      StudentModel.countDocuments({ tenantId: session.tenantId, isDeleted: { $ne: true } })
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
  });
}
