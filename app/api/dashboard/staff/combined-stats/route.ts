import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { Instructor, LeaveRequest, NonInstructor, NonInstructorLeaveRequest } from "@/lib/dashboard/staff/models"
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
        
        console.log('Fetching combined staff stats for date:', todayStr)
        
        // Execute all database queries in parallel for maximum performance
        const [
          totalInstructors,
          totalNonInstructors,
          instructorLeavesToday,
          nonInstructorLeavesToday
        ] = await Promise.all([
          // Count instructors
          Instructor.countDocuments({ 
            tenantId: session.tenantId,
            isDeleted: { $ne: true }
          }),
          
          // Count non-instructors
          NonInstructor.countDocuments({ 
            tenantId: session.tenantId,
            isDeleted: { $ne: true }
          }),
          
          // Get instructor leaves
          LeaveRequest.find({
            tenantId: session.tenantId,
            status: 'APPROVED',
            startDate: { $lte: todayStr },
            endDate: { $gte: todayStr }
          }).lean(),
          
          // Get non-instructor leaves
          NonInstructorLeaveRequest.find({
            tenantId: session.tenantId,
            status: 'APPROVED',
            startDate: { $lte: todayStr },
            endDate: { $gte: todayStr }
          }).lean()
        ])
        
        // Calculate instructor stats
        const instructorOnLeave = instructorLeavesToday.length
        const activeInstructors = totalInstructors - instructorOnLeave
        const instructorAttendanceRate = totalInstructors > 0 
          ? Math.round((activeInstructors / totalInstructors) * 100)
          : 0
        
        // Calculate non-instructor stats
        const nonInstructorOnLeave = nonInstructorLeavesToday.length
        const activeNonInstructors = totalNonInstructors - nonInstructorOnLeave
        const nonInstructorAttendanceRate = totalNonInstructors > 0 
          ? Math.round((activeNonInstructors / totalNonInstructors) * 100)
          : 0
        
        console.log('Combined stats:', {
          instructors: { total: totalInstructors, onLeave: instructorOnLeave },
          nonInstructors: { total: totalNonInstructors, onLeave: nonInstructorOnLeave }
        })
        
        return NextResponse.json({
          instructorStats: {
            total: totalInstructors,
            active: activeInstructors,
            onLeave: instructorOnLeave,
            attendanceRate: instructorAttendanceRate
          },
          nonInstructorStats: {
            total: totalNonInstructors,
            active: activeNonInstructors,
            onLeave: nonInstructorOnLeave,
            attendanceRate: nonInstructorAttendanceRate
          }
        })
        
      } catch (error: any) {
        console.error('Error fetching combined staff stats:', error)
        return NextResponse.json(
          { 
            message: "Failed to fetch staff stats", 
            error: error.message,
            instructorStats: {
              total: 0,
              active: 0,
              onLeave: 0,
              attendanceRate: 0
            },
            nonInstructorStats: {
              total: 0,
              active: 0,
              onLeave: 0,
              attendanceRate: 0
            }
          },
          { status: 500 }
        )
      }
    }
  );
}
