"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import { addDays, endOfWeek, startOfWeek } from "date-fns"
import type { Instructor, LeaveRequest, LeaveBalance, LeaveStats } from "@/types/dashboard/staff/leave"
import { 
  fetchNonInstructorsLeaveData,
  createNonInstructorLeaveRequest,
  updateNonInstructorLeaveRequest,
  deleteNonInstructorLeaveRequest,
  fetchNonInstructorDrafts,
  createNonInstructorDraft,
  updateNonInstructorDraft,
  deleteNonInstructorDraft,
} from "@/lib/dashboard/staff/non-instructor-api"

// API Response Type
interface ApiResponse<T = any> {
  ok: boolean
  data?: T
  error?: string
}

interface LeaveState {
  instructors: Instructor[]
  leaveRequests: LeaveRequest[]
  drafts: any[]
  leaveBalances: Record<string, LeaveBalance>
  currentUser: Instructor | null
  stats: LeaveStats
  workingDays: number[]
}

type LeaveAction =
  | { type: "SET_CURRENT_USER"; payload: Instructor }
  | { type: "ADD_LEAVE_REQUEST"; payload: LeaveRequest }
  | { type: "UPDATE_LEAVE_REQUEST"; payload: { id: string; updates: Partial<LeaveRequest> } }
  | { type: "UPDATE_BALANCE"; payload: { instructorId: string; balance: LeaveBalance } }
  | { type: "ADD_INSTRUCTOR"; payload: Instructor }
  | { type: "UPDATE_INSTRUCTOR"; payload: { id: string; updates: Partial<Instructor> } }
  | { type: "LOAD_DATA"; payload: LeaveState }
  | { type: "SET_WORKING_DAYS"; payload: number[] }
  | { type: "SET_LEAVE_REQUESTS"; payload: LeaveRequest[] }
  | { type: "SET_DRAFTS"; payload: any[] }
  | { type: "DELETE_LEAVE_REQUEST"; payload: { id: string } }
  | { type: "ADD_DRAFT"; payload: any }
  | { type: "UPDATE_DRAFT"; payload: { id: string; updates: Partial<any> } }
  | { type: "DELETE_DRAFT"; payload: { id: string } }
  | { type: "RESET_DATA" }

const initialState: LeaveState = {
  instructors: [],
  leaveRequests: [],
  drafts: [],
  leaveBalances: {},
  currentUser: null,
  stats: { leavesToday: 0, weeklyTrend: 0, totalCredits: 0 },
  workingDays: [1,2,3,4,5,6],
}

function leaveReducer(state: LeaveState, action: LeaveAction): LeaveState {
  switch (action.type) {
    case "SET_CURRENT_USER":
      return { ...state, currentUser: action.payload }
    case "ADD_LEAVE_REQUEST":
      try { createNonInstructorLeaveRequest(action.payload).catch(() => {}) } catch {}
      return { ...state, leaveRequests: [...state.leaveRequests, action.payload] }
    case "UPDATE_LEAVE_REQUEST":
      try { updateNonInstructorLeaveRequest(action.payload.id, action.payload.updates).catch(() => {}) } catch {}
      return { ...state, leaveRequests: state.leaveRequests.map(r => r.id === action.payload.id ? { ...r, ...action.payload.updates } : r) }
    case "DELETE_LEAVE_REQUEST":
      try { deleteNonInstructorLeaveRequest(action.payload.id).catch(() => {}) } catch {}
      return { ...state, leaveRequests: state.leaveRequests.filter(r => r.id !== action.payload.id) }
    case "SET_DRAFTS":
      return { ...state, drafts: action.payload }
    case "ADD_DRAFT":
      try { createNonInstructorDraft(action.payload).catch(() => {}) } catch {}
      return { ...state, drafts: [...state.drafts, action.payload] }
    case "UPDATE_DRAFT":
      try { updateNonInstructorDraft({ id: action.payload.id, ...action.payload.updates, updatedAt: new Date().toISOString() }).catch(() => {}) } catch {}
      return { ...state, drafts: state.drafts.map(d => d.id === action.payload.id ? { ...d, ...action.payload.updates, updatedAt: new Date().toISOString() } : d) }
    case "DELETE_DRAFT":
      try { deleteNonInstructorDraft(action.payload.id).catch(() => {}) } catch {}
      return { ...state, drafts: state.drafts.filter(d => d.id !== action.payload.id) }
    case "UPDATE_BALANCE":
      return { ...state, leaveBalances: { ...state.leaveBalances, [action.payload.instructorId]: action.payload.balance } }
    case "ADD_INSTRUCTOR":
      if (state.instructors.some(i => i.id === action.payload.id || (i as any).externalId === action.payload.id || i.name === action.payload.name)) return state
      return { ...state, instructors: [...state.instructors, action.payload] }
    case "UPDATE_INSTRUCTOR":
      return { ...state, instructors: state.instructors.map(i => i.id === action.payload.id ? { ...i, ...action.payload.updates } : i) }
    case "LOAD_DATA":
      return action.payload
    case "SET_WORKING_DAYS":
      return { ...state, workingDays: action.payload }
    case "SET_LEAVE_REQUESTS":
      return { ...state, leaveRequests: action.payload }
    case "RESET_DATA":
      return initialState
    default:
      return state
  }
}

const NonInstructorLeaveContext = createContext<{ state: LeaveState; dispatch: React.Dispatch<LeaveAction> } | null>(null)

export function NonInstructorLeaveProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(leaveReducer, initialState)

  useEffect(() => {
    try { localStorage.removeItem("leaveManagementData"); localStorage.removeItem("leaveManagementDataV2") } catch {}
    ;(async () => {
      try {
        const res = await fetchNonInstructorsLeaveData()
        const r = res as ApiResponse<{ instructors: Instructor[]; leaveRequests: LeaveRequest[]; leaveDrafts: any[]; leavePolicy: { workingDays?: number[] } }>
        if (r.ok && r.data) {
          const { instructors, leaveRequests, leaveDrafts, leavePolicy } = r.data
          const workingDays = Array.isArray(leavePolicy?.workingDays) && leavePolicy.workingDays.length ? leavePolicy.workingDays : [1,2,3,4,5,6]
          // compute quick stats similar to original context
          const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const isWorkingToday = workingDays.includes(today.getDay())
          const parseLocalDate = (s: string) => { const [y,m,d] = s.split('-').map(Number); return new Date(y,(m||1)-1,(d||1)) }
          const leavesToday = isWorkingToday ? leaveRequests.filter((rq: any) => {
            if (rq.status !== 'APPROVED' || !rq.startDate || !rq.endDate) return false
            const s = parseLocalDate(rq.startDate); const e = parseLocalDate(rq.endDate)
            return s <= today && e >= today
          }).length : 0
          const curStart = startOfWeek(today, { weekStartsOn: 1 }); const curEnd = endOfWeek(today, { weekStartsOn: 1 })
          const prevStart = addDays(curStart, -7); const prevEnd = addDays(curEnd, -7)
          const countDaysInRange = (s: Date, e: Date) => {
            let total = 0
            leaveRequests.forEach((rq: any) => {
              if (rq.status !== 'APPROVED' || !rq.startDate || !rq.endDate) return
              const rs = parseLocalDate(rq.startDate); const re = parseLocalDate(rq.endDate)
              const start = rs < s ? s : rs; const end = re > e ? e : re
              if (end < start) return
              const d = new Date(start)
              while (d <= end) { if (workingDays.includes(d.getDay())) total++; d.setDate(d.getDate() + 1) }
            })
            return total
          }
          const curDays = countDaysInRange(curStart, curEnd)
          const prevDays = countDaysInRange(prevStart, prevEnd)
          const weeklyTrend = prevDays === 0 ? (curDays > 0 ? 100 : 0) : Math.round(((curDays - prevDays) / prevDays) * 100)

          dispatch({
            type: 'LOAD_DATA',
            payload: {
              instructors: instructors || [],
              leaveRequests: leaveRequests || [],
              drafts: leaveDrafts || [],
              leaveBalances: {},
              currentUser: instructors.find((i: any) => i.role === 'DEPT_HEAD') || instructors[0] || null,
              stats: { leavesToday, weeklyTrend, totalCredits: 21 },
              workingDays,
            }
          })
        }
      } catch (e) { console.error('Failed to hydrate NI leave data', e) }
    })()
  }, [])

  return <NonInstructorLeaveContext.Provider value={{ state, dispatch }}>{children}</NonInstructorLeaveContext.Provider>
}

export function useNonInstructorLeave() {
  const ctx = useContext(NonInstructorLeaveContext)
  if (!ctx) throw new Error("useNonInstructorLeave must be used within a NonInstructorLeaveProvider")
  return ctx
}
