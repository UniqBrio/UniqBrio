/**
 * Status validation utilities for courses, cohorts, and schedule sessions
 */

export interface CourseStatus {
  id: string
  status: string
  isActive: boolean
}

export interface CohortStatus {
  id: string
  courseId: string
  status: string
  isActive: boolean
}

/**
 * Valid active statuses for courses
 */
const ACTIVE_COURSE_STATUSES = ['Active', 'Published', 'Running', 'Live', 'Open']

/**
 * Valid active statuses for cohorts
 */
const ACTIVE_COHORT_STATUSES = ['Active', 'Published', 'Running', 'Open', 'Enrolled']

/**
 * Valid cancelled/inactive statuses
 */
const INACTIVE_STATUSES = ['Inactive', 'Cancelled', 'Suspended', 'Closed', 'Archived']

/**
 * Helper function to validate course status
 */
export const validateCourseStatus = (course: any): boolean => {
  if (!course || !course.status) {
    console.warn('Course missing status:', course)
    return false
  }
  
  return ACTIVE_COURSE_STATUSES.includes(course.status)
}

/**
 * Helper function to validate cohort status
 */
export const validateCohortStatus = (cohort: any): boolean => {
  if (!cohort || !cohort.status) {
    console.warn('Cohort missing status:', cohort)
    return false
  }
  
  const isValid = ACTIVE_COHORT_STATUSES.includes(cohort.status)
  console.log(`DEBUG: Cohort ${cohort.name || cohort.id} status "${cohort.status}" is ${isValid ? 'VALID' : 'INVALID'}. Valid statuses:`, ACTIVE_COHORT_STATUSES)
  
  return isValid
}

/**
 * Create course status lookup map for efficient checking
 */
export const createCourseStatusMap = (courses: any[]): Map<string, CourseStatus> => {
  const courseMap = new Map<string, CourseStatus>()
  
  courses.forEach(course => {
    if (course && course.id) {
      courseMap.set(course.id, {
        id: course.id,
        status: course.status || 'Unknown',
        isActive: validateCourseStatus(course)
      })
    }
  })
  
  return courseMap
}

/**
 * Filter active courses only
 */
export const filterActiveCourses = (courses: any[]): any[] => {
  return courses.filter(course => validateCourseStatus(course))
}

/**
 * Filter active cohorts and validate their parent courses
 */
export const filterActiveCohorts = (cohorts: any[], courseStatusMap: Map<string, CourseStatus>): any[] => {
  return cohorts.filter(cohort => {
    // Check if cohort itself is active
    const cohortIsActive = validateCohortStatus(cohort)
    if (!cohortIsActive) {
      console.warn(`Filtering out inactive cohort: ${cohort.name || cohort.id}`)
      return false
    }
    
    // Check if parent course exists and is active
    const parentCourse = courseStatusMap.get(cohort.courseId)
    if (!parentCourse) {
      console.warn(`Cohort ${cohort.name || cohort.id} references non-existent course ${cohort.courseId}`)
      return false
    }
    
    if (!parentCourse.isActive) {
      console.warn(`Filtering out cohort ${cohort.name || cohort.id} - parent course ${cohort.courseId} is ${parentCourse.status}`)
      return false
    }
    
    return true
  })
}

/**
 * Enhanced status determination for schedule events
 */
export const determineSessionStatus = (
  sessionDate: Date,
  startTime: string,
  endTime: string,
  courseStatus: string,
  cohortStatus: string,
  isCancelled = false,
  isRescheduled = false
): "Upcoming" | "Ongoing" | "Completed" | "Cancelled" | "Pending" | "Rescheduled" => {
  
  // Check if rescheduled first
  if (isRescheduled) {
    return 'Rescheduled'
  }
  
  // Check course status first
  if (!ACTIVE_COURSE_STATUSES.includes(courseStatus)) {
    return 'Cancelled'
  }
  
  // Check cohort status
  if (!ACTIVE_COHORT_STATUSES.includes(cohortStatus) || isCancelled) {
    return 'Cancelled'
  }
  
  // Time-based status determination for active sessions
  const now = new Date()
  
  try {
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    
    const sessionStart = new Date(sessionDate)
    sessionStart.setHours(startHour, startMin, 0, 0)
    
    const sessionEnd = new Date(sessionDate)
    sessionEnd.setHours(endHour, endMin, 0, 0)
    
    if (now < sessionStart) {
      return 'Upcoming'
    } else if (now >= sessionStart && now <= sessionEnd) {
      return 'Ongoing'
    } else {
      return 'Completed'
    }
  } catch (error) {
    console.warn('Error parsing session time:', { startTime, endTime, error })
    return 'Pending'
  }
}

/**
 * Get status indicator information for UI display
 */
export const getStatusIndicator = (courseStatus: string, cohortStatus: string, sessionStatus: string) => {
  if (!ACTIVE_COURSE_STATUSES.includes(courseStatus)) {
    return {
      status: 'Course Inactive',
      variant: 'destructive' as const,
      description: `Course is ${courseStatus}`,
      className: 'bg-red-100 text-red-800 border-red-200'
    }
  }
  
  if (!ACTIVE_COHORT_STATUSES.includes(cohortStatus)) {
    return {
      status: 'Cohort Inactive',
      variant: 'secondary' as const,
      description: `Cohort is ${cohortStatus}`,
      className: 'bg-orange-100 text-orange-800 border-orange-200'
    }
  }
  
  // Return normal session status
  const statusConfig = {
    'Upcoming': { variant: 'default' as const, className: 'bg-blue-100 text-blue-800 border-blue-200' },
    'Ongoing': { variant: 'default' as const, className: 'bg-green-100 text-green-800 border-green-200' },
    'Completed': { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800 border-gray-200' },
    'Cancelled': { variant: 'destructive' as const, className: 'bg-red-100 text-red-800 border-red-200' },
    'Pending': { variant: 'outline' as const, className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    'Rescheduled': { variant: 'default' as const, className: 'bg-purple-100 text-purple-800 border-purple-200' }
  }
  
  return {
    status: sessionStatus,
    variant: statusConfig[sessionStatus as keyof typeof statusConfig]?.variant || 'outline',
    description: sessionStatus,
    className: statusConfig[sessionStatus as keyof typeof statusConfig]?.className || 'bg-gray-100 text-gray-800'
  }
}

/**
 * Validate data consistency after loading
 */
export const validateScheduleConsistency = (events: any[]): {
  isValid: boolean
  inconsistentSessions: any[]
  warnings: string[]
} => {
  const inconsistentSessions: any[] = []
  const warnings: string[] = []
  
  events.forEach(event => {
    // Check for sessions from inactive courses
    if (event.courseStatus && !ACTIVE_COURSE_STATUSES.includes(event.courseStatus)) {
      inconsistentSessions.push(event)
      warnings.push(`Session ${event.id} from inactive course (${event.courseStatus}): ${event.courseName}`)
    }
    
    // Check for sessions from inactive cohorts
    if (event.cohortStatus && !ACTIVE_COHORT_STATUSES.includes(event.cohortStatus)) {
      inconsistentSessions.push(event)
      warnings.push(`Session ${event.id} from inactive cohort (${event.cohortStatus}): ${event.cohortName}`)
    }
    
    // Check for missing course/cohort references
    if (!event.courseId || !event.cohortId) {
      warnings.push(`Session ${event.id} missing course/cohort reference`)
    }
  })
  
  return {
    isValid: inconsistentSessions.length === 0,
    inconsistentSessions,
    warnings
  }
}