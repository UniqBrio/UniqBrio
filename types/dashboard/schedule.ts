export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "instructor" | "student" | "parent"
  avatar?: string
  preferences: UserPreferences
  children?: string[] // For parents
}

export interface UserPreferences {
  theme: "light" | "dark"
  language: string
  notifications: NotificationPreferences
  pinnedMenuItems: string[]
}

export interface NotificationPreferences {
  push: boolean
  sms: boolean
  email: boolean
  classReminders: boolean
  cancellations: boolean
  rescheduling: boolean
  assignments: boolean
}

export interface Cohort {
  id: string
  name: string
  startTime: string
  endTime: string
  daysOfWeek: number[] // 0=Sunday, 1=Monday, etc.
  students: number
  maxCapacity: number
  waitlist: string[]
  location: string
  status: "Active" | "Inactive" | "Cancelled"
  registeredStudents: string[]
}



export interface ScheduleEvent {
  id: string
  title: string
  instructor: string
  instructorId: string
  courseId?: string
  courseName?: string
  cohortId?: string
  cohortName?: string
  cohorts?: Cohort[] // Multiple cohorts for the course
  students: number
  registeredStudents: string[]
  date: Date
  startTime: string
  endTime: string
  location: string
  category: "Fitness" | "Sports" | "Arts" | "Teaching"
  status: "Upcoming" | "Ongoing" | "Completed" | "Cancelled" | "Pending" | "Rescheduled"
  subcategory?: string; // Added subcategory property
  joinLink?: string
  recordingLink?: string
  isCancelled?: boolean
  cancellationReason?: string
  isRecurring?: boolean
  recurringPattern?: RecurringPattern
  mode: "live" | "recorded" | "hybrid"
  type: "online" | "offline" | "hybrid"
  qrCode?: string
  sessionNotes?: string
  materials?: string[]
  dressCode?: string
  instructions?: string
  feedback?: ClassFeedback[]
  badges?: Badge[]
  refundStatus?: "none" | "pending" | "approved" | "processed"
  refundAmount?: number
  equipment?: string[]
  maxCapacity: number
  waitlist: string[]
  tags: string[]
  
  // Course and Cohort status tracking
  courseStatus?: string
  cohortStatus?: string
  isInheritedFromInactiveCourse?: boolean
  
  // Session-specific tracking fields
  isModified?: boolean
  modificationType?: "rescheduled" | "instructor_changed" | "cancelled"
  originalSessionData?: OriginalSessionData
  sessionHistory?: SessionModification[]
  parentSessionId?: string // Links to original session if this is a modified version
  reassignmentInfo?: ReassignmentInfo // Tracks instructor reassignments
  cancellationInfo?: CancellationInfo // Tracks session cancellations
  rescheduleInfo?: RescheduleInfo // Tracks session reschedules
}

export interface OriginalSessionData {
  date: Date
  startTime: string
  endTime: string
  instructor: string
  instructorId: string
  location: string
  status: "Upcoming" | "Ongoing" | "Completed" | "Cancelled" | "Pending" | "Rescheduled"
}

export interface SessionModification {
  id: string
  type: "rescheduled" | "instructor_changed" | "cancelled"
  timestamp: Date
  modifiedBy: string // User who made the change
  reason?: string
  previousValues: {
    date?: Date
    startTime?: string
    endTime?: string
    instructor?: string
    instructorId?: string
    location?: string
    status?: string
  }
  newValues: {
    date?: Date
    startTime?: string
    endTime?: string
    instructor?: string
    instructorId?: string
    location?: string
    status?: string
  }
  affectedStudents?: number
  notificationsSent?: boolean
}

export interface RecurringPattern {
  frequency: "daily" | "weekly" | "monthly"
  interval: number
  daysOfWeek?: number[]
  endDate?: Date
  exceptions?: Date[]
}

export interface ClassFeedback {
  studentId: string
  rating: number
  comment: string
  timestamp: Date
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  criteria: string
}

export interface Instructor {
  id: string
  name: string
  email: string
  qualifications: string[]
  availability: AvailabilitySlot[]
  workloadScore: number
  specializations: string[]
  rating: number
  totalClasses: number
}

export interface AvailabilitySlot {
  dayOfWeek: number
  startTime: string
  endTime: string
  isAvailable: boolean
}

export interface Room {
  id: string
  name: string
  capacity: number
  equipment: string[]
  availability: AvailabilitySlot[]
  location: string
}

export interface Analytics {
  peakHours: { hour: number; count: number }[]
  instructorUtilization: { instructorId: string; utilization: number }[]
  classPopularity: { classType: string; popularity: number }[]
  cancellationTrends: { date: string; cancellations: number }[]
  waitlistConversion: { classId: string; conversionRate: number }[]
  engagementScores: { classId: string; score: number }[]
}

export interface NotificationTemplate {
  id: string
  name: string
  type: "reminder" | "cancellation" | "rescheduling" | "emergency"
  channels: ("push" | "sms" | "email")[]
  template: string
  variables: string[]
}

export interface CalendarIntegration {
  provider: "google" | "outlook" | "apple"
  isConnected: boolean
  syncEnabled: boolean
  lastSync?: Date
}

export interface RescheduleInfo {
  rescheduledAt: Date
  originalDate: Date
  newDate: Date
  reason: string
  rescheduledBy: string
  backendId?: string
}

export interface CancellationInfo {
  cancelledAt: Date
  reason: string
  cancelledBy: string
  backendId?: string
}

export interface ReassignmentInfo {
  type: 'reassigned_from' | 'reassigned_to'
  originalInstructor: string
  newInstructor: string
  reassignedAt: Date
  reason: string
  backendId?: string
}
