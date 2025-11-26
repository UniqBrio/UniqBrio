import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { NonInstructor, NonInstructorLeaveRequest } from "@/lib/dashboard/staff/models"
import { getUserSession } from "@/lib/tenant/api-helpers"
import { runWithTenantContext } from "@/lib/tenant/tenant-context"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const session = await getUserSession()
    if (!session?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect("uniqbrio")
    
    return runWithTenantContext({ tenantId: session.tenantId }, async () => {
      // Get today's date in YYYY-MM-DD format to match string dates in DB
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0] // e.g., "2025-11-11"
      
      console.log('Fetching non-instructor stats for date:', todayStr)
      
      // Get total non-instructors
      const totalNonInstructors = await NonInstructor.countDocuments({ tenantId: session.tenantId })
      
      // Get non-instructors on leave today
      // Dates are stored as strings in YYYY-MM-DD format
      // Status is uppercase: 'APPROVED'
      const leavesToday = await NonInstructorLeaveRequest.find({
        tenantId: session.tenantId,
        status: 'APPROVED',
        startDate: { $lte: todayStr },
        endDate: { $gte: todayStr }
      }).lean()
    
      const onLeaveToday = leavesToday.length
      console.log('Non-instructors on leave today:', onLeaveToday)
      
      // Calculate active non-instructors
      const activeNonInstructors = totalNonInstructors - onLeaveToday
      
      // Calculate attendance rate
      const attendanceRate = totalNonInstructors > 0 
        ? Math.round((activeNonInstructors / totalNonInstructors) * 100)
        : 0
      
      return NextResponse.json({
        total: totalNonInstructors,
        active: activeNonInstructors,
        onLeave: onLeaveToday,
        attendanceRate
      })
    })
    
  } catch (error: any) {
    console.error('Error fetching non-instructor stats:', error)
    return NextResponse.json(
      { 
        message: "Failed to fetch non-instructor stats", 
        error: error.message,
        total: 0,
        active: 0,
        onLeave: 0,
        attendanceRate: 0
      },
      { status: 500 }
    )
  }
}
