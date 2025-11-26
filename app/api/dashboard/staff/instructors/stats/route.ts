import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { Instructor, LeaveRequest } from "@/lib/dashboard/staff/models"
import { getUserSession } from '@/lib/tenant/api-helpers'
import { runWithTenantContext } from '@/lib/tenant/tenant-context'

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

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
    
    // Get today's date in YYYY-MM-DD format to match string dates in DB
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0] // e.g., "2025-11-11"
    
    console.log('Fetching instructor stats for date:', todayStr)
    
    // Get total instructors
    const totalInstructors = await Instructor.countDocuments({ tenantId: session.tenantId })
    
    // Get instructors on leave today
    // Dates are stored as strings in YYYY-MM-DD format
    // Status is uppercase: 'APPROVED'
    const leavesToday = await LeaveRequest.find({
      tenantId: session.tenantId,
      status: 'APPROVED',
      startDate: { $lte: todayStr },
      endDate: { $gte: todayStr }
    }).lean()
    
    const onLeaveToday = leavesToday.length
    console.log('Instructors on leave today:', onLeaveToday)
    
    // Calculate active instructors
    const activeInstructors = totalInstructors - onLeaveToday
    
    // Calculate attendance rate
    const attendanceRate = totalInstructors > 0 
      ? Math.round((activeInstructors / totalInstructors) * 100)
      : 0
    
        return NextResponse.json({
          total: totalInstructors,
          active: activeInstructors,
          onLeave: onLeaveToday,
          attendanceRate
        })
        
      } catch (error: any) {
        console.error('Error fetching instructor stats:', error)
        return NextResponse.json(
          { 
            message: "Failed to fetch instructor stats", 
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
  );
}
