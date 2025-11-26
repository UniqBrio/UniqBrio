import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { Schedule } from "@/models/dashboard"
import { getUserSession } from "@/lib/tenant/api-helpers"
import { runWithTenantContext } from "@/lib/tenant/tenant-context"

/**
 * GET /api/schedules/modified
 * Fetches only schedules that have been modified (reassigned, cancelled, or rescheduled)
 * This is more efficient than fetching all schedules when we only need modifications
 */
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
        
        // Find all schedules that have the modifications field populated
        // Using $exists and $ne to check if modifications object exists and is not empty
        const modifiedSchedules = await Schedule.find({
          tenantId: session.tenantId,
          $or: [
            { 'modifications.reassignment': { $exists: true, $ne: null } },
            { 'modifications.cancellation': { $exists: true, $ne: null } },
            { 'modifications.reschedule': { $exists: true, $ne: null } }
          ]
        })
          .select('sessionId courseId cohortId date startTime endTime instructor instructorName status modifications')
          .lean()
        
        console.log(`📝 Found ${modifiedSchedules.length} modified schedules`)
        
        return NextResponse.json({
          success: true,
          schedules: modifiedSchedules,
          count: modifiedSchedules.length
        })
        
      } catch (error) {
        console.error('Error fetching modified schedules:', error)
        return NextResponse.json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to fetch modified schedules',
          schedules: []
        }, { status: 500 })
      }
    }
  );
}
