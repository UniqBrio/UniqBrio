// Small client-side helpers for calling our API endpoints safely
export async function apiGet<T>(url: string): Promise<T> {
  try {
    const res = await fetch(url, { cache: "no-store", credentials: 'include' })
    const data = await res.json()
    if (!res.ok) {
      return { ok: false, error: data.error || data.message || 'Request failed' } as T
    }
    return data
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' } as T
  }
}

export async function apiPost<T>(url: string, body: any): Promise<T> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: 'include', body: JSON.stringify(body) })
    const data = await res.json()
    if (!res.ok) {
      return { ok: false, error: data.error || data.message || 'Request failed' } as T
    }
    return data
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' } as T
  }
}

export async function apiPut<T>(url: string, body: any): Promise<T> {
  try {
    const res = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: 'include', body: JSON.stringify(body) })
    const data = await res.json()
    if (!res.ok) {
      return { ok: false, error: data.error || data.message || 'Request failed' } as T
    }
    return data
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' } as T
  }
}

export async function apiDelete<T>(url: string): Promise<T> {
  try {
    const res = await fetch(url, { method: "DELETE", credentials: 'include' })
    const data = await res.json()
    if (!res.ok) {
      return { ok: false, error: data.error || data.message || 'Request failed' } as T
    }
    return data
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' } as T
  }
}

// API Response Type
interface ApiResponse<T = any> {
  ok: boolean
  data?: T
  error?: string
}

// Runtime scope switcher: if window.__LEAVE_SCOPE === 'non-instructor', route to NI endpoints
const isNonInstructorScope = () => {
  try { return typeof window !== 'undefined' && (window as any).__LEAVE_SCOPE === 'non-instructor' } catch { return false }
}

// Leave Management API functions (auto-routed by scope)
export const fetchLeavePolicy = (): Promise<ApiResponse> => apiGet(isNonInstructorScope() ? '/api/dashboard/staff/non-instructor/leave-policies' : '/api/dashboard/staff/instructor/leave-policies')
export const updateLeavePolicy = (data: any): Promise<ApiResponse> => apiPut(isNonInstructorScope() ? '/api/dashboard/staff/non-instructor/leave-policies' : '/api/dashboard/staff/instructor/leave-policies', data)
export const fetchLeaveRequests = (): Promise<ApiResponse> => apiGet(isNonInstructorScope() ? '/api/dashboard/staff/non-instructor/leave-requests' : '/api/dashboard/staff/instructor/leave-requests')
export const createLeaveRequest = (data: any): Promise<ApiResponse> => apiPost(isNonInstructorScope() ? '/api/dashboard/staff/non-instructor/leave-requests' : '/api/dashboard/staff/instructor/leave-requests', data)
// The PUT /api/leave-requests endpoint expects a JSON body: { id, updates }
export const updateLeaveRequest = (id: string, updates: any): Promise<ApiResponse> => apiPut(isNonInstructorScope() ? `/api/dashboard/staff/non-instructor/leave-requests` : `/api/dashboard/staff/instructor/leave-requests`, { id, updates })
export const deleteLeaveRequest = (id: string): Promise<ApiResponse> => apiDelete(isNonInstructorScope() ? `/api/dashboard/staff/non-instructor/leave-requests?id=${id}` : `/api/dashboard/staff/instructor/leave-requests?id=${id}`)

// Draft Management API functions (auto-routed by scope)
export const fetchDrafts = (): Promise<ApiResponse> => apiGet(isNonInstructorScope() ? '/api/dashboard/staff/non-instructor/leave-drafts' : '/api/dashboard/staff/instructor/leave-drafts')
export const createDraft = (data: any): Promise<ApiResponse> => apiPost(isNonInstructorScope() ? '/api/dashboard/staff/non-instructor/leave-drafts' : '/api/dashboard/staff/instructor/leave-drafts', data)
export const updateDraft = (data: any): Promise<ApiResponse> => apiPut(isNonInstructorScope() ? '/api/dashboard/staff/non-instructor/leave-drafts' : '/api/dashboard/staff/instructor/leave-drafts', data)
export const deleteDraft = (id: string): Promise<ApiResponse> => apiDelete(isNonInstructorScope() ? `/api/dashboard/staff/non-instructor/leave-drafts?id=${id}` : `/api/dashboard/staff/instructor/leave-drafts?id=${id}`)
export const convertDraftToLeaveRequest = (draftId: string, status = 'PENDING'): Promise<ApiResponse> => 
  apiPost(isNonInstructorScope() ? '/api/dashboard/staff/non-instructor/leave-drafts/convert' : '/api/dashboard/staff/instructor/leave-drafts/convert', { draftId, status })

// Instructors aggregated leave data endpoint (auto-routed by scope)
export const fetchInstructors = (): Promise<ApiResponse> => apiGet(isNonInstructorScope() ? '/api/dashboard/staff/non-instructor/non-instructors(leave)' : '/api/dashboard/staff/instructor/instructors(leave)')
