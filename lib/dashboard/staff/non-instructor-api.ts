// Client-side helpers reusing base api helpers
import { apiGet, apiPost, apiPut, apiDelete } from './api'

// API Response Type
interface ApiResponse<T = any> {
  ok: boolean
  data?: T
  error?: string
}

// Non-Instructor Leave Management API functions
export const fetchNonInstructorLeavePolicy = (): Promise<ApiResponse> => apiGet('/api/dashboard/staff/non-instructor/leave-policies')
export const updateNonInstructorLeavePolicy = (data: any): Promise<ApiResponse> => apiPut('/api/dashboard/staff/non-instructor/leave-policies', data)
export const fetchNonInstructorLeaveRequests = (): Promise<ApiResponse> => apiGet('/api/dashboard/staff/non-instructor/leave-requests')
export const createNonInstructorLeaveRequest = (data: any): Promise<ApiResponse> => apiPost('/api/dashboard/staff/non-instructor/leave-requests', data)
export const updateNonInstructorLeaveRequest = (id: string, updates: any): Promise<ApiResponse> => apiPut('/api/dashboard/staff/non-instructor/leave-requests', { id, updates })
export const deleteNonInstructorLeaveRequest = (id: string): Promise<ApiResponse> => apiDelete(`/api/dashboard/staff/non-instructor/leave-requests?id=${id}`)

// Non-Instructor Draft Management
export const fetchNonInstructorDrafts = (): Promise<ApiResponse> => apiGet('/api/dashboard/staff/non-instructor/leave-drafts')
export const createNonInstructorDraft = (data: any): Promise<ApiResponse> => apiPost('/api/dashboard/staff/non-instructor/leave-drafts', data)
export const updateNonInstructorDraft = (data: any): Promise<ApiResponse> => apiPut('/api/dashboard/staff/non-instructor/leave-drafts', data)
export const deleteNonInstructorDraft = (id: string): Promise<ApiResponse> => apiDelete(`/api/dashboard/staff/non-instructor/leave-drafts?id=${id}`)

// Aggregated data (instructors + leave data)
export const fetchNonInstructorsLeaveData = (): Promise<ApiResponse> => apiGet('/api/dashboard/staff/non-instructor/non-instructors(leave)')
