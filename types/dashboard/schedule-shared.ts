// Shared Schedule interfaces for the decomposed schedule components

export interface Schedule {
  id: string
  courseName: string
  instructor: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  location: string
  capacity: number
  enrolled: number
  status: ScheduleStatus
  type: 'Regular' | 'Workshop' | 'Seminar' | 'Online'
  duration: string
  frequency: string
  description?: string
  prerequisites?: string
  materials?: string
  notes?: string
  tags?: string[]
}

export type ScheduleStatus = 'Active' | 'Inactive' | 'Draft' | 'Completed' | 'Cancelled'

export interface ScheduleFilters {
  search: string
  instructor: string
  location: string
  status: string
  type: string
  startDate: Date | undefined
  endDate: Date | undefined
  capacity: string
  enrollment: string
}

export interface DeleteOptions {
  notifyStudents: boolean
  transferStudents: boolean
  refundStudents: boolean
  reason: string
}

export interface ImportOptions {
  skipDuplicates: boolean
  updateExisting: boolean
  validateData: boolean
  notifyInstructors: boolean
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf'
  dateRange: 'all' | 'current' | 'upcoming' | 'custom'
  startDate?: string
  endDate?: string
  includeEnrollment: boolean
  includeInstructors: boolean
  includeNotes: boolean
  status: string[]
}

export interface BulkScheduleData {
  courseName: string
  instructor: string
  startDate: Date
  endDate: Date
  startTime: string
  endTime: string
  location: string
  capacity: number
  type: 'Regular' | 'Workshop' | 'Seminar' | 'Online'
  frequency: string
  description?: string
  tags?: string[]
}
