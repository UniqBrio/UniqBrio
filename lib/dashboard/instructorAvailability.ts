// Utility functions for checking instructor availability

/**
 * Map instructor names to their proper IDs used in leave requests
 * This should ideally be fetched from the database, but for now we'll use a static mapping
 * based on the current data structure
 */
const INSTRUCTOR_NAME_TO_ID_MAP: { [key: string]: string } = {
  'Michael James': 'INSTR0004',
  'John Doe': 'INSTR0003',
  'Ryan Fernandes': 'INSTR0005',
  'Emily Carter': 'INSTR0001',
  'Emily  Carter': 'INSTR0001', // Handle spacing variations
  'Sarah Johnson': 'INSTR0002',
  'Sarah  Johnson': 'INSTR0002',  // Handle spacing variations
  // Normalize common variations
  'john doe': 'INSTR0003',
  'JOHN DOE': 'INSTR0003',
  'michael james': 'INSTR0004',
  'MICHAEL JAMES': 'INSTR0004',
}

/**
 * Get the proper instructor ID from instructor name
 * Handles case-insensitive matching and whitespace normalization
 */
export function getInstructorIdFromName(instructorName: string): string {
  if (!instructorName) return instructorName
  
  // Try exact match first
  if (INSTRUCTOR_NAME_TO_ID_MAP[instructorName]) {
    return INSTRUCTOR_NAME_TO_ID_MAP[instructorName]
  }
  
  // Try case-insensitive match
  const normalized = instructorName.trim()
  const lowerName = normalized.toLowerCase()
  
  for (const [key, value] of Object.entries(INSTRUCTOR_NAME_TO_ID_MAP)) {
    if (key.toLowerCase() === lowerName) {
      return value
    }
  }
  
  // If no match found, return original
  console.warn(`[Instructor ID Mapping] No mapping found for instructor: "${instructorName}"`)
  return instructorName
}

export interface LeaveRequest {
  _id: string
  instructorId: string
  instructorName: string
  startDate: string
  endDate: string
  status: string
  leaveType: string
  reason?: string
}

export interface InstructorAvailability {
  instructorId: string
  instructorName: string
  isAvailable: boolean
  leaveDetails?: {
    startDate: string
    endDate: string
    leaveType: string
    reason?: string
  }
}

/**
 * Check if an instructor is on leave for a specific date
 */
export function isInstructorOnLeave(
  instructorId: string,
  checkDate: Date,
  leaveRequests: LeaveRequest[]
): boolean {
  const checkDateStr = checkDate.toISOString().split('T')[0] // Get YYYY-MM-DD format
  
  return leaveRequests.some(leave => {
    if (leave.instructorId !== instructorId || leave.status !== 'APPROVED') {
      return false
    }
    
    const startDate = new Date(leave.startDate).toISOString().split('T')[0]
    const endDate = new Date(leave.endDate).toISOString().split('T')[0]
    
    return checkDateStr >= startDate && checkDateStr <= endDate
  })
}

/**
 * Get instructor availability status
 */
export function getInstructorAvailability(
  instructorId: string,
  instructorName: string,
  checkDate: Date,
  leaveRequests: LeaveRequest[]
): InstructorAvailability {
  // Map instructor name to proper ID if needed
  const properInstructorId = getInstructorIdFromName(instructorName)
  
  console.log(`[Availability Check] Instructor: "${instructorName}", ID: "${instructorId}", Mapped ID: "${properInstructorId}", Date: ${checkDate.toISOString().split('T')[0]}`)
  console.log(`[Availability Check] Total leave requests in system: ${leaveRequests.length}`)
  
  // Log all leave requests for debugging
  if (leaveRequests.length > 0) {
    leaveRequests.forEach(leave => {
      console.log(`  - Leave: InstructorID="${leave.instructorId}", Name="${leave.instructorName}", Status="${leave.status}", ${leave.startDate} to ${leave.endDate}`)
    })
  }
  
  const checkDateStr = checkDate.toISOString().split('T')[0]
  
  const onLeave = leaveRequests.find(leave => {
    // Check if status is approved
    if (leave.status !== 'APPROVED') {
      return false
    }
    
    // Check instructor match - try multiple approaches:
    // 1. Direct ID match
    // 2. Mapped ID match
    // 3. Name match (case-insensitive)
    const idMatchesDirect = leave.instructorId === instructorId
    const idMatchesMapped = leave.instructorId === properInstructorId
    const nameMatches = leave.instructorName && instructorName && 
                       leave.instructorName.toLowerCase().trim() === instructorName.toLowerCase().trim()
    
    const instructorMatches = idMatchesDirect || idMatchesMapped || nameMatches
    
    console.log(`  Checking leave for ${leave.instructorName}:`)
    console.log(`    - ID Direct Match: ${idMatchesDirect} (${leave.instructorId} === ${instructorId})`)
    console.log(`    - ID Mapped Match: ${idMatchesMapped} (${leave.instructorId} === ${properInstructorId})`)
    console.log(`    - Name Match: ${nameMatches} ("${leave.instructorName}" === "${instructorName}")`)
    console.log(`    - Instructor Matches: ${instructorMatches}`)
    
    if (!instructorMatches) {
      return false
    }
    
    // Check date range
    const startDate = new Date(leave.startDate).toISOString().split('T')[0]
    const endDate = new Date(leave.endDate).toISOString().split('T')[0]
    
    const dateInRange = checkDateStr >= startDate && checkDateStr <= endDate
    console.log(`    - Date range check: ${checkDateStr} between ${startDate} and ${endDate}? ${dateInRange}`)
    
    return dateInRange
  })
  
  console.log(`[Availability Result] ${instructorName} is ${onLeave ? 'ON LEAVE' : 'AVAILABLE'} on ${checkDate.toISOString().split('T')[0]}`)
  if (onLeave) {
    console.log(`  Leave details:`, onLeave)
  }
  
  return {
    instructorId,
    instructorName,
    isAvailable: !onLeave,
    leaveDetails: onLeave ? {
      startDate: onLeave.startDate,
      endDate: onLeave.endDate,
      leaveType: onLeave.leaveType,
      reason: onLeave.reason
    } : undefined
  }
}

/**
 * Fetch leave requests from API
 */
export async function fetchLeaveRequests(startDate?: Date, endDate?: Date): Promise<LeaveRequest[]> {
  try {
    const params = new URLSearchParams()
    
    if (startDate) {
      params.append('startDate', startDate.toISOString().split('T')[0])
    }
    
    if (endDate) {
      params.append('endDate', endDate.toISOString().split('T')[0])
    }
    
    const url = `/api/dashboard/services/session-management/leave-requests${params.toString() ? `?${params.toString()}` : ''}`
    console.log(`[Leave API] Fetching: ${url}`)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error(`[Leave API] Failed: ${response.status}`)
      throw new Error(`Failed to fetch leave requests: ${response.status}`)
    }
    
    const data = await response.json()
    console.log(`[Leave API] Got ${data.leaveRequests?.length || 0} approved leave requests`)
    
    // Log each leave request for debugging
    if (data.leaveRequests && data.leaveRequests.length > 0) {
      data.leaveRequests.forEach((leave: LeaveRequest) => {
        const start = new Date(leave.startDate).toISOString().split('T')[0]
        const end = new Date(leave.endDate).toISOString().split('T')[0]
        console.log(`  - ${leave.instructorName} (${leave.instructorId}): ${start} to ${end} [${leave.leaveType}]`)
      })
    }
    
    return data.leaveRequests || []
  } catch (error) {
    console.error('[Leave API] Error:', error)
    return []
  }
}
