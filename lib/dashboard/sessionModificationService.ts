/**
 * Unified Session Modification Service
 * Handles persistent storage of session modifications directly in the schedules collection
 * This eliminates the need for separate modification collections
 */

import { ScheduleEvent } from '@/types/dashboard/schedule'

interface ModifyScheduleParams {
  scheduleId: string
  modificationType: 'reschedule' | 'cancel' | 'reassign'
  modificationData: {
    newDate?: Date
    newStartTime?: string
    newEndTime?: string
    newInstructor?: string
    newInstructorId?: string
    newInstructorName?: string
    originalInstructor?: string
    originalInstructorId?: string
    originalInstructorName?: string
    reason: string
    modifiedBy: string
  }
}

/**
 * Updates an existing schedule with modification data directly in the schedules collection
 * First looks up the schedule by sessionId (custom ID) to get the MongoDB _id
 */
export async function updateScheduleWithModification(params: ModifyScheduleParams): Promise<any> {
  const { scheduleId, modificationType, modificationData } = params

  try {
    // First, find the schedule by sessionId to get the MongoDB _id
    console.log('Looking up schedule by sessionId:', scheduleId)
    const lookupResponse = await fetch(`/api/dashboard/services/schedules?sessionId=${encodeURIComponent(scheduleId)}`)
    
    if (!lookupResponse.ok) {
      throw new Error('Failed to lookup schedule by sessionId')
    }
    
    const lookupData = await lookupResponse.json()
    
    if (!lookupData.success || !lookupData.schedules || lookupData.schedules.length === 0) {
      throw new Error(`Schedule with sessionId "${scheduleId}" not found in database`)
    }
    
    const schedule = lookupData.schedules[0]
    const mongoId = schedule._id
    
    console.log('Found schedule with MongoDB _id:', mongoId)

    // Now update using the MongoDB _id
    const response = await fetch(`/api/dashboard/services/schedules/${mongoId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        modificationType,
        modificationData: {
          ...modificationData,
          modifiedAt: new Date()
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to update schedule with modification')
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating schedule with modification:', error)
    throw error
  }
}

/**
 * Persist reassignment data directly to the schedule document
 */
export async function persistReassignment(reassignmentData: {
  sessionId: string
  originalInstructor: { id: string; name: string }
  newInstructor: { id: string; name: string }
  reason: string
  reassignedBy: string
}): Promise<any> {
  return updateScheduleWithModification({
    scheduleId: reassignmentData.sessionId,
    modificationType: 'reassign',
    modificationData: {
      newInstructor: reassignmentData.newInstructor.name,
      newInstructorId: reassignmentData.newInstructor.id,
      newInstructorName: reassignmentData.newInstructor.name,
      originalInstructor: reassignmentData.originalInstructor.name,
      originalInstructorId: reassignmentData.originalInstructor.id,
      originalInstructorName: reassignmentData.originalInstructor.name,
      reason: reassignmentData.reason,
      modifiedBy: reassignmentData.reassignedBy
    }
  })
}

/**
 * Persist reschedule data directly to the schedule document
 */
export async function persistReschedule(rescheduleData: {
  sessionId: string
  originalDate: Date
  newDate: Date
  newStartTime?: string
  newEndTime?: string
  reason: string
  rescheduledBy: string
}): Promise<any> {
  return updateScheduleWithModification({
    scheduleId: rescheduleData.sessionId,
    modificationType: 'reschedule',
    modificationData: {
      newDate: rescheduleData.newDate,
      newStartTime: rescheduleData.newStartTime,
      newEndTime: rescheduleData.newEndTime,
      reason: rescheduleData.reason,
      modifiedBy: rescheduleData.rescheduledBy
    }
  })
}

/**
 * Persist cancellation data directly to the schedule document
 */
export async function persistCancellation(cancellationData: {
  sessionId: string
  reason: string
  cancelledBy: string
}): Promise<any> {
  return updateScheduleWithModification({
    scheduleId: cancellationData.sessionId,
    modificationType: 'cancel',
    modificationData: {
      reason: cancellationData.reason,
      modifiedBy: cancellationData.cancelledBy
    }
  })
}

/**
 * Get modification history for a specific schedule
 */
export async function getScheduleModifications(scheduleId: string): Promise<any> {
  try {
    const response = await fetch(`/api/dashboard/services/schedules/${scheduleId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch schedule')
    }
    
    const schedule = await response.json()
    return schedule.modifications || null
  } catch (error) {
    console.error('Error fetching schedule modifications:', error)
    return null
  }
}

/**
 * Check if a schedule has been modified
 */
export function hasModifications(schedule: any): boolean {
  return schedule && schedule.modifications && 
    (schedule.modifications.reassignment || 
     schedule.modifications.cancellation || 
     schedule.modifications.reschedule)
}

/**
 * Get the latest modification type for a schedule
 */
export function getLatestModificationType(schedule: any): string | null {
  if (!hasModifications(schedule)) return null
  
  const mods = schedule.modifications
  const timestamps: Array<{type: string, date: Date}> = []
  
  if (mods.reassignment) {
    timestamps.push({ type: 'reassignment', date: new Date(mods.reassignment.reassignedAt) })
  }
  if (mods.cancellation) {
    timestamps.push({ type: 'cancellation', date: new Date(mods.cancellation.cancelledAt) })
  }
  if (mods.reschedule) {
    timestamps.push({ type: 'reschedule', date: new Date(mods.reschedule.rescheduledAt) })
  }
  
  timestamps.sort((a, b) => b.date.getTime() - a.date.getTime())
  return timestamps[0]?.type || null
}

/**
 * Fetches all schedules (modifications are included by default in the unified approach)
 */
export async function fetchAllSchedulesWithModifications(): Promise<ScheduleEvent[]> {
  try {
    const response = await fetch('/api/dashboard/services/schedules')
    
    if (!response.ok) {
      throw new Error('Failed to fetch schedules')
    }

    const data = await response.json()
    return data.schedules || []
  } catch (error) {
    console.error('Error fetching schedules with modifications:', error)
    return []
  }
}