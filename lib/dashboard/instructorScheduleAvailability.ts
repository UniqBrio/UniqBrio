import { format, isSameDay, parse } from 'date-fns'
import type { ScheduleEvent, Instructor } from '@/types/dashboard/schedule'
import { getInstructorAvailability, getInstructorIdFromName, type LeaveRequest } from './instructorAvailability'

export interface InstructorAvailabilityStatus {
  instructorId: string
  instructorName: string
  isAvailable: boolean
  conflictReason?: string
  conflictDetails?: {
    type: 'leave' | 'schedule_conflict' | 'unavailable_hours'
    details: string
    conflictingSession?: ScheduleEvent
    leaveDetails?: {
      startDate: string
      endDate: string
      leaveType: string
    }
  }
}

/**
 * Check if an instructor is available for a specific session
 */
export function checkInstructorAvailability(
  instructor: Instructor,
  sessionDate: Date,
  sessionStartTime: string,
  sessionEndTime: string,
  allEvents: ScheduleEvent[],
  leaveRequests: LeaveRequest[],
  excludeEventId?: string
): InstructorAvailabilityStatus {
  const dayOfWeek = sessionDate.getDay()
  
  // Check if instructor is on leave
  // Map instructor name to proper ID for leave checking
  const properInstructorId = getInstructorIdFromName(instructor.name)
  const leaveStatus = getInstructorAvailability(
    properInstructorId,
    instructor.name,
    sessionDate,
    leaveRequests
  )
  
  if (!leaveStatus.isAvailable) {
    return {
      instructorId: instructor.id,
      instructorName: instructor.name,
      isAvailable: false,
      conflictReason: 'On Leave',
      conflictDetails: {
        type: 'leave',
        details: `${instructor.name} is on ${leaveStatus.leaveDetails?.leaveType || 'leave'} from ${leaveStatus.leaveDetails?.startDate} to ${leaveStatus.leaveDetails?.endDate}`,
        leaveDetails: leaveStatus.leaveDetails
      }
    }
  }
  
  // Check instructor's availability schedule
  const availabilitySlot = instructor.availability?.find(slot => 
    slot.dayOfWeek === dayOfWeek && slot.isAvailable
  )
  
  // If no availability data exists, assume instructor is generally available during business hours
  const defaultAvailabilitySlot = {
    dayOfWeek: dayOfWeek,
    startTime: '08:00',
    endTime: '18:00',
    isAvailable: true
  }
  
  const activeSlot = availabilitySlot || defaultAvailabilitySlot
  
  if (availabilitySlot === undefined && instructor.availability && instructor.availability.length > 0) {
    // Instructor has availability data but not available on this day
    return {
      instructorId: instructor.id,
      instructorName: instructor.name,
      isAvailable: false,
      conflictReason: 'Not Available on This Day',
      conflictDetails: {
        type: 'unavailable_hours',
        details: `${instructor.name} is not available on ${getDayName(dayOfWeek)}s`
      }
    }
  }
  
  // Check if session time falls within instructor's available hours
  const sessionStart = parseTime(sessionStartTime)
  const sessionEnd = parseTime(sessionEndTime)
  const availableStart = parseTime(activeSlot.startTime)
  const availableEnd = parseTime(activeSlot.endTime)
  
  if (sessionStart < availableStart || sessionEnd > availableEnd) {
    return {
      instructorId: instructor.id,
      instructorName: instructor.name,
      isAvailable: false,
      conflictReason: 'Outside Available Hours',
      conflictDetails: {
        type: 'unavailable_hours',
        details: `${instructor.name} is available ${activeSlot.startTime} - ${activeSlot.endTime}, but session is ${sessionStartTime} - ${sessionEndTime}`
      }
    }
  }
  
  // Check for schedule conflicts with other sessions on the same day
  const conflictingSession = allEvents.find(event => {
    if (event.id === excludeEventId) return false
    
    // Skip cancelled sessions - they don't create conflicts
    if (event.isCancelled || event.status === 'Cancelled' || event.modificationType === 'cancelled') {
      return false
    }
    
    // Check both instructor ID and name for matching
    const eventInstructorId = getInstructorIdFromName(event.instructor)
    if (event.instructorId !== instructor.id && 
        event.instructor !== instructor.name && 
        eventInstructorId !== properInstructorId) return false
    if (!isSameDay(event.date, sessionDate)) return false
    
    const eventStart = parseTime(event.startTime)
    const eventEnd = parseTime(event.endTime)
    
    // Check for time overlap
    return (sessionStart < eventEnd && sessionEnd > eventStart)
  })
  
  if (conflictingSession) {
    return {
      instructorId: instructor.id,
      instructorName: instructor.name,
      isAvailable: false,
      conflictReason: 'Schedule Conflict',
      conflictDetails: {
        type: 'schedule_conflict',
        details: `${instructor.name} has another session "${conflictingSession.courseName || conflictingSession.title}" at ${conflictingSession.startTime} - ${conflictingSession.endTime}`,
        conflictingSession
      }
    }
  }
  
  // If all checks pass, instructor is available
  return {
    instructorId: instructor.id,
    instructorName: instructor.name,
    isAvailable: true
  }
}

/**
 * Get available instructors for a specific session
 */
export function getAvailableInstructors(
  instructors: Instructor[],
  sessionDate: Date,
  sessionStartTime: string,
  sessionEndTime: string,
  allEvents: ScheduleEvent[],
  leaveRequests: LeaveRequest[],
  excludeEventId?: string,
  currentInstructorName?: string
): InstructorAvailabilityStatus[] {
  return instructors
    .filter(instructor => instructor.name !== currentInstructorName) // Exclude current instructor
    .map(instructor => 
      checkInstructorAvailability(
        instructor,
        sessionDate,
        sessionStartTime,
        sessionEndTime,
        allEvents,
        leaveRequests,
        excludeEventId
      )
    )
    .sort((a, b) => {
      // Sort available instructors first
      if (a.isAvailable && !b.isAvailable) return -1
      if (!a.isAvailable && b.isAvailable) return 1
      return a.instructorName.localeCompare(b.instructorName)
    })
}

/**
 * Parse time string (HH:MM) to minutes from midnight for comparison
 */
function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Get day name from day number
 */
function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayOfWeek] || 'Unknown'
}

/**
 * Convert minutes from midnight back to time string
 */
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}