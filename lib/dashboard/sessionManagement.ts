/**
 * Session Management Utilities
 * Handles reschedules, cancellations, and reassignments while preserving original session data
 */

import { format } from "date-fns"
import { ScheduleEvent, SessionModification, OriginalSessionData } from '@/types/dashboard/schedule'

interface SessionModificationData {
  sessionId: string
  modificationType: 'rescheduled' | 'cancelled' | 'instructor_changed'
  modifiedBy: string
  reason: string
  originalSession: ScheduleEvent
  newValues?: Partial<ScheduleEvent>
}

/**
 * Creates a modification history entry
 */
export function createModificationHistory(
  modificationData: SessionModificationData
): SessionModification {
  const { sessionId, modificationType, modifiedBy, reason, originalSession, newValues } = modificationData
  
  const modification: SessionModification = {
    id: `mod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: modificationType,
    timestamp: new Date(),
    modifiedBy,
    reason,
    previousValues: {
      date: originalSession.date,
      startTime: originalSession.startTime,
      endTime: originalSession.endTime,
      instructor: originalSession.instructor,
      instructorId: originalSession.instructorId,
      location: originalSession.location,
      status: originalSession.status
    },
    newValues: newValues ? {
      date: newValues.date,
      startTime: newValues.startTime,
      endTime: newValues.endTime,
      instructor: newValues.instructor,
      instructorId: newValues.instructorId,
      location: newValues.location,
      status: newValues.status
    } : {},
    affectedStudents: originalSession.registeredStudents?.length || originalSession.students || 0,
    notificationsSent: true
  }
  
  return modification
}

/**
 * Preserves original session data before modification
 */
export function preserveOriginalSessionData(session: ScheduleEvent): OriginalSessionData {
  return {
    date: session.date,
    startTime: session.startTime,
    endTime: session.endTime,
    instructor: session.instructor,
    instructorId: session.instructorId,
    location: session.location,
    status: session.status
  }
}

/**
 * Creates a rescheduled session while maintaining link to original
 */
export function createRescheduledSession(
  originalSession: ScheduleEvent,
  newDate: Date,
  newStartTime: string,
  newEndTime: string,
  modifiedBy: string,
  reason: string
): {
  modifiedOriginal: ScheduleEvent
  newSession: ScheduleEvent
  modification: SessionModification
} {
  const originalData = originalSession.originalSessionData || preserveOriginalSessionData(originalSession)
  
  const modification = createModificationHistory({
    sessionId: originalSession.id,
    modificationType: 'rescheduled',
    modifiedBy,
    reason,
    originalSession,
    newValues: {
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime
    }
  })

  const rescheduledSessionId = `${originalSession.id}-rescheduled-${Date.now()}`
  
  // Mark original session as cancelled due to reschedule
  const modifiedOriginal: ScheduleEvent = {
    ...originalSession,
    status: "Cancelled" as const,
    isCancelled: true,
    cancellationReason: `Rescheduled to ${format(newDate, 'dd-MMM-yy')} at ${newStartTime}-${newEndTime}`,
    isModified: true,
    modificationType: "cancelled" as const,
    originalSessionData: originalData,
    sessionHistory: [...(originalSession.sessionHistory || []), modification]
  }

  // Create new rescheduled session
  const newSession: ScheduleEvent = {
    ...originalSession,
    id: rescheduledSessionId,
    date: newDate,
    startTime: newStartTime,
    endTime: newEndTime,
    status: "Upcoming" as const,
    isCancelled: false,
    qrCode: `qr-${rescheduledSessionId}`,
    isModified: true,
    modificationType: "rescheduled",
    originalSessionData: originalData,
    sessionHistory: [...(originalSession.sessionHistory || []), modification],
    parentSessionId: originalSession.parentSessionId || originalSession.id
  }

  return { modifiedOriginal, newSession, modification }
}

/**
 * Creates a cancelled session entry
 */
export function createCancelledSession(
  originalSession: ScheduleEvent,
  cancellationReason: string,
  cancelledBy: string
): {
  cancelledSession: ScheduleEvent
  modification: SessionModification
} {
  const originalData = originalSession.originalSessionData || preserveOriginalSessionData(originalSession)
  
  const modification = createModificationHistory({
    sessionId: originalSession.id,
    modificationType: 'cancelled',
    modifiedBy: cancelledBy,
    reason: cancellationReason,
    originalSession,
    newValues: {
      status: "Cancelled" as const
    }
  })

  const cancelledSession: ScheduleEvent = {
    ...originalSession,
    status: "Cancelled" as const,
    isCancelled: true,
    cancellationReason,
    isModified: true,
    modificationType: "cancelled" as const,
    originalSessionData: originalData,
    sessionHistory: [...(originalSession.sessionHistory || []), modification]
  }

  return { cancelledSession, modification }
}

/**
 * Creates a reassigned session while maintaining link to original
 */
export function createReassignedSession(
  originalSession: ScheduleEvent,
  newInstructor: string,
  newInstructorId: string,
  modifiedBy: string,
  reason: string
): {
  modifiedOriginal: ScheduleEvent
  newSession: ScheduleEvent
  modification: SessionModification
} {
  const originalData = originalSession.originalSessionData || preserveOriginalSessionData(originalSession)
  
  const modification = createModificationHistory({
    sessionId: originalSession.id,
    modificationType: 'instructor_changed',
    modifiedBy,
    reason,
    originalSession,
    newValues: {
      instructor: newInstructor,
      instructorId: newInstructorId
    }
  })

  const reassignedSessionId = `${originalSession.id}-reassigned-${Date.now()}`
  
  // Mark original session as cancelled due to reassignment
  const modifiedOriginal: ScheduleEvent = {
    ...originalSession,
    status: "Cancelled" as const,
    isCancelled: true,
    cancellationReason: `Instructor reassigned from ${originalSession.instructor} to ${newInstructor}`,
    isModified: true,
    modificationType: "cancelled" as const,
    originalSessionData: originalData,
    sessionHistory: [...(originalSession.sessionHistory || []), modification]
  }

  // Create new reassigned session
  const newSession: ScheduleEvent = {
    ...originalSession,
    id: reassignedSessionId,
    instructor: newInstructor,
    instructorId: newInstructorId,
    status: "Upcoming" as const,
    isCancelled: false,
    qrCode: `qr-${reassignedSessionId}`,
    isModified: true,
    modificationType: "instructor_changed",
    originalSessionData: originalData,
    sessionHistory: [...(originalSession.sessionHistory || []), modification],
    parentSessionId: originalSession.parentSessionId || originalSession.id
  }

  return { modifiedOriginal, newSession, modification }
}

/**
 * API call utilities for session modifications
 */

export interface RescheduleApiData {
  sessionId: string
  instructor: string
  instructorId: string
  originalDate: string
  originalStartTime: string
  originalEndTime: string
  newDate: string
  newStartTime: string
  newEndTime: string
  reason: string
  rescheduledBy: string
  location: string
}

export interface CancellationApiData {
  sessionId: string
  originalInstructor: string
  originalInstructorId: string
  originalDate: string
  originalStartTime: string
  originalEndTime: string
  reason: string
  cancelledBy: string
}

export interface ReassignmentApiData {
  sessionId: string
  cohortId: string
  courseId: string
  originalInstructor: string
  originalInstructorId: string
  newInstructor: string
  newInstructorId: string
  sessionDate: string
  startTime: string
  endTime: string
  location: string
  reason: string
  modifiedBy: string
}

/**
 * Makes API call to save session reschedule
 */
export async function saveSessionReschedule(data: RescheduleApiData): Promise<any> {
  const response = await fetch('/api/dashboard/services/session-management/session-reschedules', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to save reschedule')
  }

  return await response.json()
}

/**
 * Makes API call to save session cancellation
 */
export async function saveSessionCancellation(data: CancellationApiData): Promise<any> {
  const response = await fetch('/api/dashboard/services/session-management/session-cancellations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to save cancellation')
  }

  return await response.json()
}

/**
 * Makes API call to save instructor reassignment
 */
export async function saveInstructorReassignment(data: ReassignmentApiData): Promise<any> {
  const response = await fetch('/api/dashboard/services/session-management/instructor-reassignments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to save reassignment')
  }

  return await response.json()
}

/**
 * Validates session modification data
 */
export function validateSessionModification(
  originalSession: ScheduleEvent,
  modificationType: 'rescheduled' | 'cancelled' | 'instructor_changed',
  newValues?: Partial<ScheduleEvent>
): { valid: boolean; error?: string } {
  if (!originalSession) {
    return { valid: false, error: 'Original session is required' }
  }

  if (!originalSession.id) {
    return { valid: false, error: 'Session ID is required' }
  }

  if (originalSession.isCancelled && modificationType !== 'cancelled') {
    return { valid: false, error: 'Cannot modify a cancelled session' }
  }

  if (modificationType === 'rescheduled') {
    if (!newValues?.date || !newValues?.startTime || !newValues?.endTime) {
      return { valid: false, error: 'New date and time are required for reschedule' }
    }
  }

  if (modificationType === 'instructor_changed') {
    if (!newValues?.instructor || !newValues?.instructorId) {
      return { valid: false, error: 'New instructor information is required for reassignment' }
    }
  }

  return { valid: true }
}

/**
 * Checks for instructor conflicts
 */
export function checkInstructorConflicts(
  sessions: ScheduleEvent[],
  instructorId: string,
  date: Date,
  startTime: string,
  endTime: string,
  excludeSessionId?: string
): ScheduleEvent[] {
  return sessions.filter(session => {
    if (excludeSessionId && session.id === excludeSessionId) {
      return false
    }
    
    // Exclude cancelled sessions - check multiple properties to ensure all cancelled sessions are excluded
    if (session.isCancelled || session.status === 'Cancelled' || session.modificationType === 'cancelled') {
      return false
    }
    
    if (session.instructorId !== instructorId) {
      return false
    }
    
    // Check if dates match
    const sessionDate = new Date(session.date)
    const checkDate = new Date(date)
    
    if (sessionDate.toDateString() !== checkDate.toDateString()) {
      return false
    }
    
    // Check time overlap
    const sessionStart = session.startTime
    const sessionEnd = session.endTime
    
    // Convert times to minutes for easier comparison
    const toMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    }
    
    const sessionStartMin = toMinutes(sessionStart)
    const sessionEndMin = toMinutes(sessionEnd)
    const checkStartMin = toMinutes(startTime)
    const checkEndMin = toMinutes(endTime)
    
    // Check for overlap
    return (sessionStartMin < checkEndMin && sessionEndMin > checkStartMin)
  })
}
