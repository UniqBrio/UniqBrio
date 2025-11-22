import { ScheduleEvent } from '@/types/dashboard/schedule'

export interface InstructorConflictCheck {
  isAvailable: boolean
  conflicts: Array<{
    type: 'existing_session' | 'rescheduled_session' | 'leave_request'
    details: any
    timeSlot: string
  }>
  warnings: string[]
}

export interface RescheduleConflictCheck extends InstructorConflictCheck {
  suggestedAlternatives?: Array<{
    date: Date
    startTime: string
    endTime: string
    reason: string
  }>
}

/**
 * Check if an instructor is available for a specific time slot considering:
 * - Existing sessions from the schedule
 * - Previously rescheduled sessions
 * - Leave requests
 * - Working hours constraints
 */
export async function checkInstructorRescheduleAvailability(
  instructorId: string,
  instructorName: string,
  proposedDate: Date,
  proposedStartTime: string,
  proposedEndTime: string,
  existingEvents: ScheduleEvent[],
  excludeSessionId?: string
): Promise<RescheduleConflictCheck> {
  const conflicts: InstructorConflictCheck['conflicts'] = []
  const warnings: string[] = []

  // 1. Check against existing schedule events
  const existingConflicts = existingEvents.filter(event => {
    // Skip the session being rescheduled
    if (excludeSessionId && event.id === excludeSessionId) {
      return false
    }

    // Check if same instructor and same date
    if (event.instructorId !== instructorId) {
      return false
    }

    const eventDate = new Date(event.date)
    if (eventDate.toDateString() !== proposedDate.toDateString()) {
      return false
    }

    // Check time overlap
    return checkTimeOverlap(
      proposedStartTime, 
      proposedEndTime, 
      event.startTime, 
      event.endTime
    )
  })

  existingConflicts.forEach(conflict => {
    conflicts.push({
      type: 'existing_session',
      details: {
        sessionId: conflict.id,
        title: conflict.title,
        courseName: conflict.courseName,
        cohortName: conflict.cohortName,
        startTime: conflict.startTime,
        endTime: conflict.endTime,
        location: conflict.location
      },
      timeSlot: `${conflict.startTime} - ${conflict.endTime}`
    })
  })

  // 2. Check against rescheduled sessions via API
  try {
    const response = await fetch(`/api/dashboard/services/session-management/session-reschedules?instructorId=${instructorId}&date=${proposedDate.toISOString()}`)
    if (response.ok) {
      const reschedules = await response.json()
      
      const rescheduleConflicts = reschedules.filter((reschedule: any) => {
        // Skip the session being rescheduled
        if (excludeSessionId && reschedule.sessionId === excludeSessionId) {
          return false
        }

        return checkTimeOverlap(
          proposedStartTime,
          proposedEndTime,
          reschedule.newStartTime,
          reschedule.newEndTime
        )
      })

      rescheduleConflicts.forEach((conflict: any) => {
        conflicts.push({
          type: 'rescheduled_session',
          details: {
            sessionId: conflict.sessionId,
            originalDate: conflict.originalDate,
            newStartTime: conflict.newStartTime,
            newEndTime: conflict.newEndTime,
            reason: conflict.reason
          },
          timeSlot: `${conflict.newStartTime} - ${conflict.newEndTime}`
        })
      })
    }
  } catch (error) {
    console.warn('Could not check reschedule conflicts:', error)
    warnings.push('Unable to verify against rescheduled sessions')
  }

  // 3. Check leave requests
  try {
    const leaveResponse = await fetch(`/api/dashboard/services/session-management/leave-requests`)
    if (leaveResponse.ok) {
      const leaveRequests = await leaveResponse.json()
      
      const leaveConflicts = leaveRequests.filter((leave: any) => {
        if (leave.instructorId !== instructorId) return false
        if (leave.status !== 'approved') return false
        
        const leaveStart = new Date(leave.startDate)
        const leaveEnd = new Date(leave.endDate)
        
        return proposedDate >= leaveStart && proposedDate <= leaveEnd
      })

      leaveConflicts.forEach((leave: any) => {
        conflicts.push({
          type: 'leave_request',
          details: {
            leaveId: leave._id,
            startDate: leave.startDate,
            endDate: leave.endDate,
            reason: leave.reason,
            type: leave.leaveType
          },
          timeSlot: 'Full day'
        })
      })
    }
  } catch (error) {
    console.warn('Could not check leave requests:', error)
    warnings.push('Unable to verify against leave requests')
  }

  // 4. Generate suggested alternatives if conflicts exist
  const suggestedAlternatives: RescheduleConflictCheck['suggestedAlternatives'] = []
  
  if (conflicts.length > 0) {
    // Suggest alternative time slots on the same day
    const availableSlots = findAvailableTimeSlots(
      proposedDate,
      proposedStartTime,
      proposedEndTime,
      existingEvents.filter(e => e.instructorId === instructorId)
    )
    
    availableSlots.forEach(slot => {
      suggestedAlternatives.push({
        date: proposedDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        reason: 'Alternative time slot on same day'
      })
    })
    
    // Suggest next available day
    const nextAvailableDay = findNextAvailableDay(
      proposedDate,
      proposedStartTime,
      proposedEndTime,
      instructorId,
      existingEvents
    )
    
    if (nextAvailableDay) {
      suggestedAlternatives.push({
        date: nextAvailableDay,
        startTime: proposedStartTime,
        endTime: proposedEndTime,
        reason: 'Next available day with same time slot'
      })
    }
  }

  return {
    isAvailable: conflicts.length === 0,
    conflicts,
    warnings,
    suggestedAlternatives
  }
}

/**
 * Check if two time ranges overlap
 */
function checkTimeOverlap(
  start1: string, 
  end1: string, 
  start2: string, 
  end2: string
): boolean {
  const start1Minutes = timeToMinutes(start1)
  const end1Minutes = timeToMinutes(end1)
  const start2Minutes = timeToMinutes(start2)
  const end2Minutes = timeToMinutes(end2)

  return (
    (start1Minutes < end2Minutes) && (end1Minutes > start2Minutes)
  )
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Find available time slots on a given day
 */
function findAvailableTimeSlots(
  date: Date,
  preferredStartTime: string,
  preferredEndTime: string,
  instructorEvents: ScheduleEvent[]
): Array<{ startTime: string; endTime: string }> {
  const dayEvents = instructorEvents.filter(event => {
    const eventDate = new Date(event.date)
    return eventDate.toDateString() === date.toDateString()
  }).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))

  const sessionDuration = timeToMinutes(preferredEndTime) - timeToMinutes(preferredStartTime)
  const workingHours = { start: '08:00', end: '22:00' }
  const availableSlots: Array<{ startTime: string; endTime: string }> = []

  let currentTime = timeToMinutes(workingHours.start)
  const endOfDay = timeToMinutes(workingHours.end)

  for (const event of dayEvents) {
    const eventStart = timeToMinutes(event.startTime)
    const eventEnd = timeToMinutes(event.endTime)

    // Check if there's a gap before this event
    if (eventStart - currentTime >= sessionDuration) {
      const slotEnd = Math.min(eventStart, currentTime + sessionDuration)
      availableSlots.push({
        startTime: minutesToTime(currentTime),
        endTime: minutesToTime(slotEnd)
      })
    }

    currentTime = Math.max(currentTime, eventEnd)
  }

  // Check if there's time after the last event
  if (endOfDay - currentTime >= sessionDuration) {
    availableSlots.push({
      startTime: minutesToTime(currentTime),
      endTime: minutesToTime(currentTime + sessionDuration)
    })
  }

  return availableSlots.slice(0, 3) // Return up to 3 alternatives
}

/**
 * Find the next available day for the instructor
 */
function findNextAvailableDay(
  startDate: Date,
  preferredStartTime: string,
  preferredEndTime: string,
  instructorId: string,
  allEvents: ScheduleEvent[]
): Date | null {
  const instructorEvents = allEvents.filter(e => e.instructorId === instructorId)
  
  for (let i = 1; i <= 7; i++) { // Check next 7 days
    const checkDate = new Date(startDate)
    checkDate.setDate(checkDate.getDate() + i)
    
    const dayEvents = instructorEvents.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate.toDateString() === checkDate.toDateString()
    })
    
    const hasConflict = dayEvents.some(event => 
      checkTimeOverlap(
        preferredStartTime,
        preferredEndTime,
        event.startTime,
        event.endTime
      )
    )
    
    if (!hasConflict) {
      return checkDate
    }
  }
  
  return null // No available day found in the next week
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}
