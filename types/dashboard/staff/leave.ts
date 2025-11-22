export interface Instructor {
  id: string
  name: string
  firstName?: string
  middleName?: string
  lastName?: string
  instructorId?: string // optional alias from backend normalization
  fullName?: string // synthesized composite of name parts
  externalId?: string
  displayName?: string
  displayCode?: string
  role: "INSTRUCTOR" | "DEPT_HEAD" | "HR" | "ADMIN"
  department: string
  jobLevel: string
  employmentType: "Permanent" | "Temporary"
  roleType: "Instructor" | "Non-Instructor"
  contractType?: string
  // Optional denormalized fields from Instructor collection
  courseAssigned?: string
  cohortName?: string
  // IDs denormalized from Courses/Cohorts (used as fallback in leave table)
  courseIds?: string
  cohortIds?: string
}

export interface LeaveBalance {
  casual: number
  sick: number
  emergency: number
  planned: number
  total: number
}

export type LeaveStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"

export interface LeaveRequest {
  id: string
  instructorId: string
  instructorName: string
  // Denormalized for quick display/filtering
  courseName?: string
  cohortName?: string
  // IDs denormalized from cohorts collection
  courseId?: string
  cohortId?: string
  // Drafts may not have these yet
  leaveType?:
    | "Casual Leave"
    | "Sick Leave"
    | "Emergency Leave"
    | "Planned Leave"
    | "Maternity Leave"
    | "Paternity Leave"
    | "Study Leave"
    | "Unapproved Leave"
  jobLevel?: string // Can be imported from CSV or derived from instructor
  contractType?: string // Can be imported from CSV or derived from instructor
  employmentType?: string // Alternative field for contract type
  startDate?: string // optional while DRAFT
  endDate?: string   // optional while DRAFT
  startTime?: string
  endTime?: string
  days?: number // computed on submission
  halfDay?: "AM" | "PM" | null
  reason?: string
  status: LeaveStatus
  submittedAt?: string
  approvedAt?: string
  comments?: string
  substituteId?: string
  substituteConfirmed?: boolean
  documents?: string[]
  approvalTrail?: Array<{
    step: "DEPT_HEAD" | "HR"
    by?: string
    status: "PENDING" | "APPROVED" | "REJECTED"
    comment?: string
    at?: string
  }>
  carriedOver?: number
  balance?: number
  prorated?: "Full" | "Partial"
  limitReached?: boolean
  // For existing UI draft fields
  title?: string
  createdAt?: string
  updatedAt?: string
  allocationTotal?: number
  allocationUsed?: number
  registeredDate?: string
}

export interface LeaveStats {
  leavesToday: number
  weeklyTrend: number
  totalCredits: number
}

// Drafts saved from the New Leave Request popup
// LeaveDraft interface removed: drafts are now LeaveRequest with status === "DRAFT".
