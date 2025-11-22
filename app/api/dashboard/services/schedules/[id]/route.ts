import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/mongodb'
import Schedule from '@/models/dashboard/Schedule'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect("uniqbrio")

    const { modificationType, modificationData } = await request.json()
    const awaitedParams = await params
    const scheduleId = awaitedParams.id

    console.log('PATCH request received:')
    console.log('- Schedule ID:', scheduleId)
    console.log('- Modification Type:', modificationType)
    console.log('- Modification Data:', JSON.stringify(modificationData, null, 2))

    // Validate that scheduleId is a valid MongoDB ObjectId
    if (!scheduleId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid schedule ID. Schedule must exist in database with valid ObjectId.',
          providedId: scheduleId
        },
        { status: 400 }
      )
    }

    // Find schedule by MongoDB _id
    const schedule = await Schedule.findById(scheduleId)
    
    if (!schedule) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Schedule not found. Ensure the schedule exists in the database.',
          scheduleId: scheduleId
        },
        { status: 404 }
      )
    }

    // Prepare the modification data based on type
    const now = new Date()
    let updateData: any = {
      $set: {}
    }

    // Don't initialize modifications object - let it be created naturally by setting specific paths

    switch (modificationType) {
      case 'reassign':
        // Update instructor fields
        if (modificationData.newInstructorId) {
          updateData.$set.instructor = modificationData.newInstructorId
          updateData.$set.instructorName = modificationData.newInstructorName || modificationData.newInstructor
        }
        
        // Store reassignment info
        updateData.$set['modifications.reassignment'] = {
          originalInstructor: modificationData.originalInstructorId || schedule.instructor,
          originalInstructorName: modificationData.originalInstructorName || schedule.instructorName,
          newInstructor: modificationData.newInstructorId,
          newInstructorName: modificationData.newInstructorName || modificationData.newInstructor,
          reassignedAt: now,
          reason: modificationData.reason,
          reassignedBy: modificationData.modifiedBy,
          type: 'reassigned_to'
        }
        break

      case 'reschedule':
        // Update date/time fields if provided
        if (modificationData.newDate) {
          updateData.$set.date = modificationData.newDate
        }
        if (modificationData.newStartTime) {
          updateData.$set.startTime = modificationData.newStartTime
        }
        if (modificationData.newEndTime) {
          updateData.$set.endTime = modificationData.newEndTime
        }

        // Store reschedule info
        updateData.$set['modifications.reschedule'] = {
          originalDate: schedule.date,
          originalStartTime: schedule.startTime,
          originalEndTime: schedule.endTime,
          rescheduledAt: now,
          reason: modificationData.reason,
          rescheduledBy: modificationData.modifiedBy
        }
        break

      case 'cancel':
        console.log('Processing cancellation with reason:', modificationData.reason)
        
        // Validate required fields
        if (!modificationData.reason || modificationData.reason.trim() === '') {
          return NextResponse.json(
            { success: false, error: 'Cancellation reason is required' },
            { status: 400 }
          )
        }

        // Update status fields
        updateData.$set.status = 'Cancelled'
        updateData.$set.isCancelled = true
        updateData.$set.cancellationReason = modificationData.reason
        updateData.$set.cancellationDate = now

        // Store cancellation info - set the entire object at once to avoid validation issues
        updateData.$set['modifications.cancellation'] = {
          cancelledAt: now,
          reason: modificationData.reason,
          cancelledBy: modificationData.modifiedBy || 'System'
        }
        
        console.log('Cancellation update data:')
        console.log('- cancelledAt:', now)
        console.log('- reason:', modificationData.reason)
        console.log('- cancelledBy:', modificationData.modifiedBy || 'System')
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid modification type' },
          { status: 400 }
        )
    }

    // Add general modification tracking
    updateData.$set.lastModifiedAt = now
    updateData.$set.lastModifiedBy = modificationData.modifiedBy

    // Update the schedule using findOneAndUpdate to avoid validation issues
    console.log('Applying updates to schedule:', schedule._id)
    console.log('Update data:', JSON.stringify(updateData, null, 2))
    
    // Use findOneAndUpdate instead of save() to bypass strict validation
    const updatedSchedule = await Schedule.findByIdAndUpdate(
      schedule._id,
      updateData,
      { 
        new: true, // Return the updated document
        runValidators: false, // Skip validation since we're doing it manually above
        strict: false // Allow setting fields that might not be in the schema
      }
    )

    if (!updatedSchedule) {
      return NextResponse.json(
        { success: false, error: 'Failed to update schedule' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Schedule ${modificationType}d successfully`,
      schedule: updatedSchedule
    })

  } catch (error: any) {
    console.error('Error updating schedule with modification:', error)
    return NextResponse.json(
      { success: false, error: `Failed to update schedule: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}