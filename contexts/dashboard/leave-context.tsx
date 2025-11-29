"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import { addDays, endOfWeek, format, startOfWeek } from "date-fns"
import type { Instructor, LeaveRequest, LeaveBalance, LeaveStats } from "@/types/dashboard/staff/leave"
import { fetchInstructors, fetchLeaveRequests, createLeaveRequest, updateLeaveRequest, deleteLeaveRequest, fetchLeavePolicy, fetchDrafts, createDraft, updateDraft, deleteDraft, convertDraftToLeaveRequest } from "@/lib/dashboard/staff/api"

// API Response Type (matching the one in lib/api.ts)
interface ApiResponse<T = any> {
  ok: boolean
  data?: T
  error?: string
}

interface LeaveState {
  instructors: Instructor[]
  leaveRequests: LeaveRequest[]
  drafts: any[] // Draft leave requests stored separately
  leaveBalances: Record<string, LeaveBalance>
  // periodBalances removed (carry-forward feature deferred)
  currentUser: Instructor | null
  stats: LeaveStats
  workingDays: number[] // 0=Sun .. 6=Sat
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
  | { type: "CONVERT_DRAFT_TO_LEAVE_REQUEST"; payload: { draftId: string; status?: string } }
  | { type: "RESET_DATA" }

const mockInstructors: Instructor[] = [
  {
    id: "INSTR0001",
    name: "John Doe",
    role: "INSTRUCTOR",
    department: "Arts",
    jobLevel: "Senior Staff",
    employmentType: "Permanent",
    roleType: "Instructor",
  },
  {
    id: "INSTR0002",
    name: "Emily Smith",
    role: "INSTRUCTOR",
    department: "Science",
    jobLevel: "Junior Staff",
    employmentType: "Temporary",
    roleType: "Non-Instructor",
  },
  {
    id: "INSTR0003",
    name: "David Wilson",
    role: "DEPT_HEAD",
    department: "Arts",
  jobLevel: "Manager",
    employmentType: "Permanent",
    roleType: "Instructor",
  },
  {
    id: "INSTR0004",
    name: "Sophia Martinez",
    role: "INSTRUCTOR",
    department: "Math",
    jobLevel: "Junior Staff",
    employmentType: "Temporary",
    roleType: "Instructor",
  },
  {
    id: "INSTR0005",
    name: "James Johnson",
    role: "HR",
    department: "Admin",
    jobLevel: "Manager",
    employmentType: "Permanent",
    roleType: "Non-Instructor",
  },
]

// Helpers to avoid timezone drift and compute days using working days
const parseLocalDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

const formatYmd = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

const computeWorkingDays = (start: string, end: string, workingDays: number[]) => {
  try {
    const s = parseLocalDate(start)
    const e = parseLocalDate(end)
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0
    let count = 0
    const cur = new Date(s)
    while (cur <= e) {
      if (workingDays.includes(cur.getDay())) count++
      cur.setDate(cur.getDate() + 1)
    }
    return count
  } catch {
    return 0
  }
}

function generateStaticMockLeaveRequests(workingDays: number[]): LeaveRequest[] {
  // Static, non-moving dataset. These dates will NOT change with the current time.
  const mk = (
    id: string,
    instructorId: string,
    instructorName: string,
    leaveType: LeaveRequest["leaveType"],
    startDate: string,
    endDate: string,
    extra?: Partial<LeaveRequest>,
  ): LeaveRequest => {
    return {
      id,
      instructorId,
      instructorName,
      leaveType,
      startDate,
      endDate,
      days: computeWorkingDays(startDate, endDate, workingDays),
      reason: extra?.reason || "",
      status: "APPROVED",
      submittedAt: extra?.submittedAt || "2025-05-01",
      approvedAt: extra?.approvedAt || "2025-05-02",
      comments: extra?.comments,
      carriedOver: extra?.carriedOver ?? 0,
      balance: extra?.balance ?? computeWorkingDays(startDate, endDate, workingDays),
      prorated: extra?.prorated ?? "Full",
      limitReached: extra?.limitReached,
    }
  }

  return [
    // Matches your screenshot examples (Mon-Sat working days)
    mk("l1", "INSTR0004", "Sophia Martinez", "Emergency Leave", "2025-06-17", "2025-06-17", { reason: "Urgent personal work" }),
    mk("l2", "INSTR0002", "Emily Smith", "Sick Leave", "2025-07-17", "2025-07-18", { reason: "High fever and rest advised" }),
    mk("l3", "INSTR0001", "John Doe", "Planned Leave", "2025-08-16", "2025-08-18", { reason: "Family trip" }),

    // A few more static rows for consistency
    mk("l4", "INSTR0003", "David Wilson", "Planned Leave", "2025-05-15", "2025-05-17", { reason: "Personal errands" }),
    mk("l5", "INSTR0004", "Sophia Martinez", "Sick Leave", "2025-05-18", "2025-05-19", { reason: "Doctor appointment" }),
    mk("l6", "INSTR0002", "Emily Smith", "Emergency Leave", "2025-05-20", "2025-05-20", { reason: "Home emergency" }),
  ]
}

const mockLeaveBalances: Record<string, LeaveBalance> = {
  INSTR0001: { casual: 10, sick: 5, emergency: 2, planned: 15, total: 32 },
  INSTR0002: { casual: 8, sick: 3, emergency: 1, planned: 12, total: 24 },
  INSTR0003: { casual: 12, sick: 6, emergency: 3, planned: 18, total: 39 },
  INSTR0004: { casual: 6, sick: 4, emergency: 1, planned: 10, total: 21 },
  INSTR0005: { casual: 15, sick: 8, emergency: 4, planned: 20, total: 47 },
}

// Build initial state with dynamic stats derived from generated requests
const buildInitialState = (): LeaveState => {
  const workingDays = [1, 2, 3, 4, 5, 6] // default Mon-Sat
  const now = new Date()
  const requests = generateStaticMockLeaveRequests(workingDays)

  // Leaves today: approved requests overlapping today and on a working day
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const isWorkingToday = workingDays.includes(today.getDay())
    const leavesToday = isWorkingToday
    ? requests.filter((r) => {
        if (r.status !== "APPROVED") return false
        if (!r.startDate || !r.endDate) return false
        const s = parseLocalDate(r.startDate)
        const e = parseLocalDate(r.endDate)
        return s <= today && e >= today
      }).length
    : 0

  // Weekly trend: percentage change of approved leave days current week vs previous week
  const curStart = startOfWeek(today, { weekStartsOn: 1 })
  const curEnd = endOfWeek(today, { weekStartsOn: 1 })
  const prevStart = addDays(curStart, -7)
  const prevEnd = addDays(curEnd, -7)
  const countDaysInRange = (s: Date, e: Date) => {
    let total = 0
    requests.forEach((r) => {
      if (r.status !== "APPROVED") return
      // iterate through each day of the request and count overlap with [s,e] on working days
  if (!r.startDate || !r.endDate) return
  const rs = parseLocalDate(r.startDate)
  const re = parseLocalDate(r.endDate)
      const start = rs < s ? s : rs
      const end = re > e ? e : re
      if (end < start) return
      const d = new Date(start)
      while (d <= end) {
        if (workingDays.includes(d.getDay())) total++
        d.setDate(d.getDate() + 1)
      }
    })
    return total
  }
  const curDays = countDaysInRange(curStart, curEnd)
  const prevDays = countDaysInRange(prevStart, prevEnd)
  const weeklyTrend = prevDays === 0 ? (curDays > 0 ? 100 : 0) : Math.round(((curDays - prevDays) / prevDays) * 100)


  return {
    instructors: mockInstructors,
    leaveRequests: requests,
    drafts: [], // Separate drafts array
    leaveBalances: mockLeaveBalances,
    currentUser: mockInstructors[2], // David Wilson as dept head
    stats: {
      leavesToday,
      weeklyTrend,
      totalCredits: 21,
    },
    workingDays,
  }
}

const initialState: LeaveState = {
  instructors: [],
  leaveRequests: [],
  drafts: [],
  leaveBalances: {},
  currentUser: null,
  stats: { leavesToday: 0, weeklyTrend: 0, totalCredits: 0 },
  workingDays: [1, 2, 3, 4, 5, 6],
}

function leaveReducer(state: LeaveState, action: LeaveAction): LeaveState {
  switch (action.type) {
    case "SET_CURRENT_USER":
      return { ...state, currentUser: action.payload }
    case "ADD_LEAVE_REQUEST":
      // API call is now handled in the component before dispatch
      return {
        ...state,
        leaveRequests: [...state.leaveRequests, action.payload],
      }
    case "UPDATE_LEAVE_REQUEST":
      // API call should be handled in the component before dispatch
      try { updateLeaveRequest(action.payload.id, action.payload.updates).catch(() => {}) } catch {}
      return {
        ...state,
        leaveRequests: state.leaveRequests.map((req) =>
          req.id === action.payload.id ? { ...req, ...action.payload.updates } : req,
        ),
      }
    case "SET_DRAFTS":
      return { ...state, drafts: action.payload }
    case "ADD_DRAFT": {
      const payload = action.payload
      try { createDraft(payload).catch(() => {}) } catch {}
      return { ...state, drafts: [...state.drafts, payload] }
    }
    case "UPDATE_DRAFT": {
      try { updateDraft({ id: action.payload.id, ...action.payload.updates, updatedAt: new Date().toISOString() }).catch(() => {}) } catch {}
      return {
        ...state,
        drafts: state.drafts.map(r => r.id === action.payload.id ? { ...r, ...action.payload.updates, updatedAt: new Date().toISOString() } : r)
      }
    }
    case "DELETE_DRAFT": {
      try { deleteDraft(action.payload.id).catch(() => {}) } catch {}
      return { ...state, drafts: state.drafts.filter(r => r.id !== action.payload.id) }
    }
    case "CONVERT_DRAFT_TO_LEAVE_REQUEST": {
      // The actual conversion will be handled in components using the API directly
      // This action is here for completeness but components should handle the async logic
      return state
    }
    case "DELETE_LEAVE_REQUEST":
      try { deleteLeaveRequest(action.payload.id).catch(() => {}) } catch {}
      return {
        ...state,
        leaveRequests: state.leaveRequests.filter(r => r.id !== action.payload.id),
      }
    case "UPDATE_BALANCE":
      return {
        ...state,
        leaveBalances: {
          ...state.leaveBalances,
          [action.payload.instructorId]: action.payload.balance,
        },
      }
    case "ADD_INSTRUCTOR":
      // Check if instructor already exists to avoid duplicates
      const existingInstructor = state.instructors.find(inst => 
        inst.id === action.payload.id || 
        inst.externalId === action.payload.id ||
        inst.name === action.payload.name
      )
      if (existingInstructor) {
        return state // Don't add if already exists
      }
      return {
        ...state,
        instructors: [...state.instructors, action.payload]
      }
    case "UPDATE_INSTRUCTOR":
      return {
        ...state,
        instructors: state.instructors.map(inst => inst.id === action.payload.id ? { ...inst, ...action.payload.updates } : inst)
      }
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

const LeaveContext = createContext<{
  state: LeaveState
  dispatch: React.Dispatch<LeaveAction>
  // refreshPeriodBalances removed
} | null>(null)

export function LeaveProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(leaveReducer, initialState)
  // No persistence: every session starts from the generated initialState, but hydrate from backend
  useEffect(() => {
    // If other parts of the app previously saved any keys, clear them to avoid confusion
    try {
      localStorage.removeItem("leaveManagementData")
      localStorage.removeItem("leaveManagementDataV2")
    } catch {}

    // Hydrate from comprehensive leave endpoint that fetches all related data
    ;(async () => {
      try {
        // Use the comprehensive instructors(leave) endpoint that fetches everything
        const leaveDataRes = await fetchInstructors() // This now calls /api/instructors(leave)
        
        // Type the API response properly
        const leaveDataResponse = leaveDataRes as ApiResponse<{
          instructors: Instructor[]
          leaveRequests: LeaveRequest[]
          leaveDrafts: any[]
          leavePolicy: { workingDays?: number[] }
          stats: any
        }>
        
        if (leaveDataResponse.ok && leaveDataResponse.data) {
          const { instructors, leaveRequests, leaveDrafts, leavePolicy } = leaveDataResponse.data
          
          const workingDays = Array.isArray(leavePolicy?.workingDays) && leavePolicy.workingDays.length 
            ? leavePolicy.workingDays 
            : [1,2,3,4,5,6]
          
          const now = new Date()
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const isWorkingToday = workingDays.includes(today.getDay())
          
          // Calculate leaves for today
          const leavesToday = isWorkingToday
            ? leaveRequests.filter((r: any) => {
                if (r.status !== "APPROVED") return false
                if (!r.startDate || !r.endDate) return false
                const s = parseLocalDate(r.startDate)
                const e = parseLocalDate(r.endDate)
                return s <= today && e >= today
              }).length
            : 0

          // Calculate weekly trend
          const curStart = startOfWeek(today, { weekStartsOn: 1 })
          const curEnd = endOfWeek(today, { weekStartsOn: 1 })
          const prevStart = addDays(curStart, -7)
          const prevEnd = addDays(curEnd, -7)
          const countDaysInRange = (s: Date, e: Date) => {
            let total = 0
            leaveRequests.forEach((r: any) => {
              if (r.status !== "APPROVED") return
              if (!r.startDate || !r.endDate) return
              const rs = parseLocalDate(r.startDate)
              const re = parseLocalDate(r.endDate)
              const start = rs < s ? s : rs
              const end = re > e ? e : re
              if (end < start) return
              const d = new Date(start)
              while (d <= end) { if (workingDays.includes(d.getDay())) total++; d.setDate(d.getDate()+1) }
            })
            return total
          }
          const curDays = countDaysInRange(curStart, curEnd)
          const prevDays = countDaysInRange(prevStart, prevEnd)
          const weeklyTrend = prevDays === 0 ? (curDays > 0 ? 100 : 0) : Math.round(((curDays - prevDays) / prevDays) * 100)

          console.log('Leave data loaded:', {
            instructorsCount: instructors.length,
            leaveRequestsCount: leaveRequests.length,
            draftsCount: leaveDrafts.length,
            leavesToday,
            weeklyTrend
          })

          dispatch({
            type: "LOAD_DATA",
            payload: {
              instructors: instructors || [],
              leaveRequests: leaveRequests || [],
              drafts: leaveDrafts || [],
              leaveBalances: {},
              currentUser: instructors.find((i: any) => i.role === "DEPT_HEAD") || instructors[0] || null,
              stats: { leavesToday, weeklyTrend, totalCredits: 21 },
              workingDays,
            }
          })

          // carry-forward period balances fetch removed
        } else {
          console.error('Failed to load leave data:', leaveDataResponse.error)
        }
      } catch (e) {
        console.error("Failed to hydrate from backend", e)
      }
    })()
  }, [])

  return <LeaveContext.Provider value={{ state, dispatch }}>{children}</LeaveContext.Provider>
}

export function useLeave() {
  const context = useContext(LeaveContext)
  if (!context) {
    throw new Error("useLeave must be used within a LeaveProvider")
  }
  return context
}
