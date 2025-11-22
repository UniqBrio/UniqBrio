import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { Schedule } from "@/models/dashboard"

/**
 * GET /api/schedules/modified
 * Fetches only schedules that have been modified (reassigned, cancelled, or rescheduled)
 * This is more efficient than fetching all schedules when we only need modifications
 */
export async function GET() {
  try {
    await dbConnect("uniqbrio")
    
    // Find all schedules that have the modifications field populated
    // Using $exists and $ne to check if modifications object exists and is not empty
    const modifiedSchedules = await Schedule.find({
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
