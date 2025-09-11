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

export interface ScheduleEvent {
  id: string
  title: string
  instructor: string
  instructorId: string
  students: number
  registeredStudents: string[]
  date: Date
  startTime: string
  endTime: string
  location: string
  category: "Fitness" | "Sports" | "Arts" | "Teaching"
  status: "Upcoming" | "Ongoing" | "Completed" | "Cancelled" | "Pending"
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
