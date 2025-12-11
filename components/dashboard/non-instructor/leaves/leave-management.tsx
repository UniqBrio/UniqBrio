"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { format as formatDateFns } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Button } from "@/components/dashboard/ui/button"
import { crudSuccess } from "@/lib/dashboard/staff/crud-toast"
import { importLeaveRequestsFromCSV } from "@/lib/dashboard/staff/csv-import"
import { Input } from "@/components/dashboard/ui/input"
import CSVColumnMappingDialog from "./csv-column-mapping-dialog"
// Tabs removed for policies/analytics
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Switch } from "@/components/dashboard/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/dashboard/ui/toggle-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { ScrollArea } from "@/components/dashboard/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/dashboard/ui/dropdown-menu"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Calendar } from "@/components/dashboard/ui/calendar"
import type { DateRange } from "react-day-picker"
import { Clock, AlertTriangle, Plus, Search, Download, Table, CalendarDays, ArrowUpDown, ArrowUp, ArrowDown, Upload, Grid2X2, Save, Pencil, Trash2, RefreshCw, ChevronDown, Check, X } from "lucide-react"
import { useLeave } from "@/contexts/dashboard/leave-context"
import type { LeaveRequest, Instructor } from "@/types/dashboard/staff/leave"
import dynamic from "next/dynamic"
import LeaveRequestForm from "./leave-request-form"
import LeaveTable from "./leave-table"
import LeaveGrid from "./leave-grid"
import { GridListToggle } from "../../GridListToggle"
// LeavePolicyDialog removed by request
import RecurringLeaveDialog from "./recurring-leave-dialog"
import SmartNotifications from "./smart-notifications"
import LeaveHubHeader from "./leave-hub-header"
// Calendar uses many DOM APIs; ensure client-only render
const LeaveCalendarView = dynamic(() => import("./leave-calendar-view"), { ssr: false })
// Recharts is browser-only; load dashboard charts client-side only
const DashboardCharts = dynamic(() => import("./dashboard-charts"), { ssr: false })
import { downloadCSV, toCSV } from "@/lib/dashboard/staff/csv"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog"
import LeavePolicyDialog, { type LeavePolicy } from "./leave-policy-dialog"
import { fetchLeavePolicy, updateLeavePolicy, fetchLeaveRequests } from "@/lib/dashboard/staff/api"
import ErrorBoundary from "./error-boundary"
import LeaveColumnSelector, { LEAVE_TABLE_COLUMNS, type LeaveColId } from "./leave-column-selector"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/dashboard/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import AdvancedFilters from "./advanced-filters"


export default function LeaveManagement() {
  const { state, dispatch } = useLeave()
  const [showNewRequestForm, setShowNewRequestForm] = useState(false)
  const [editingDraft, setEditingDraft] = useState<import("../../../types/staff/leave").LeaveRequest | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"table" | "grid" | "calendar">("table")
  const [lastNonCalendarView, setLastNonCalendarView] = useState<"table" | "grid">("table")
  const [sortBy, setSortBy] = useState<"instructorName" | "instructorId" | "leaveType" | "startDate" | "endDate" | "status" | "days">("startDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  // Controlled tooltip state for Sort (auto-hide after 3s on selection)
  const [sortTooltipOpen, setSortTooltipOpen] = useState(false)
  const sortTooltipTimerRef = useRef<number | null>(null)
  const [conflictDetection, setConflictDetection] = useState(true)
  const [aiSuggestions, setAiSuggestions] = useState(true)
  // Leave policy dialog removed
  const [recurringOpen, setRecurringOpen] = useState(false)
  const [hubTab, setHubTab] = useState<"dashboard" | "leave-request" | "smart-notifications">("dashboard")
  const [draftsOpen, setDraftsOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  // Applied filters
  const [jobLevels, setJobLevels] = useState<string[]>([])
  const [leaveTypes, setLeaveTypes] = useState<string[]>([])
  const [branchFilter, setBranchFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [staffTypes, setStaffTypes] = useState<string[]>([])
  // Advanced filters moved to dedicated component
  // Leave Policy dialog state
  const [policyOpen, setPolicyOpen] = useState(false)
  const [csvMappingOpen, setCsvMappingOpen] = useState(false)

  // Reopen drafts dialog automatically after a draft is converted, if more drafts remain
  useEffect(() => {
    const handler = () => setDraftsOpen(true)
    if (typeof window !== 'undefined') {
      window.addEventListener('non-instructor-leave-drafts:open', handler)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('non-instructor-leave-drafts:open', handler)
      }
    }
  }, [])

  // Auto-close drafts dialog when no drafts remain
  useEffect(() => {
    if (draftsOpen && state.drafts.length === 0) {
      setDraftsOpen(false)
    }
  }, [draftsOpen, state.drafts.length])
  const [csvMappingData, setCsvMappingData] = useState<{ detectedHeaders: string[] }>({ detectedHeaders: [] })
  const [pendingCSVFile, setPendingCSVFile] = useState<File | null>(null)
  const [policy, setPolicy] = useState<LeavePolicy>({
    quotaType: "Monthly Quota",
    autoReject: false,
    allocations: { junior: 12, senior: 16, managers: 24 },
    carryForward: true,
  })
  // Row selection (for export)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Track which dashboard card was clicked to compute highlight set for table
  const [highlightMode, setHighlightMode] = useState<null | 'today' | 'next7' | 'mp'>(null)
  const [highlightKey, setHighlightKey] = useState(0)
  const highlightTimerRef = useRef<number | null>(null)

  const highlightIds = useMemo(() => {
    if (!highlightMode) return [] as string[]
    const ids: string[] = []
    const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const next7End = new Date(today); next7End.setDate(today.getDate() + 6)
    const parse = (s: string) => { const [y,m,d] = s.split('-').map(Number); return new Date(y,(m||1)-1,(d||1)) }
    const working = Array.isArray(state.workingDays) && state.workingDays.length ? state.workingDays : [1,2,3,4,5,6]
    state.leaveRequests.forEach((r) => {
      if (r.status !== 'APPROVED' || !r.startDate || !r.endDate) return
      const rs = parse(r.startDate); const re = parse(r.endDate)
      if (highlightMode === 'today') {
        const isMP = r.leaveType === 'Maternity Leave' || r.leaveType === 'Paternity Leave'
        if (!isMP && rs <= today && re >= today) ids.push(r.id)
      } else if (highlightMode === 'next7') {
        if (re >= today && rs <= next7End) {
          // ensure at least one working day overlap
          const start = rs > today ? rs : today
          const finish = re < next7End ? re : next7End
          const d = new Date(start)
          let hasWorking = false
          while (d <= finish) {
            if (working.includes(d.getDay())) { hasWorking = true; break }
            d.setDate(d.getDate() + 1)
          }
          if (hasWorking) ids.push(r.id)
        }
      } else if (highlightMode === 'mp') {
        const isMP = r.leaveType === 'Maternity Leave' || r.leaveType === 'Paternity Leave'
        if (isMP) ids.push(r.id)
      }
    })
    return ids
  }, [highlightMode, state.leaveRequests])

  // Clear any pending highlight when navigating away from the Leave Request tab
  useEffect(() => {
    if (hubTab !== 'leave-request') {
      if (highlightTimerRef.current) {
        window.clearTimeout(highlightTimerRef.current)
        highlightTimerRef.current = null
      }
      setHighlightMode(null)
      setHighlightKey(0)
    }
  }, [hubTab])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (sortTooltipTimerRef.current) {
        window.clearTimeout(sortTooltipTimerRef.current)
        sortTooltipTimerRef.current = null
      }
    }
  }, [])

  // Column selector state (for Leave Table)
  const DEFAULT_COLUMNS: LeaveColId[] = LEAVE_TABLE_COLUMNS.map(c => c.id)

  const [displayedColumns, setDisplayedColumns] = useState<LeaveColId[]>(() => {
    if (typeof window === "undefined") return DEFAULT_COLUMNS
    try {
      const saved = localStorage.getItem("leaveDisplayedColumns")
      if (!saved) return DEFAULT_COLUMNS
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.every((v) => typeof v === "string")) {
        const valid = (parsed as string[]).filter(id => LEAVE_TABLE_COLUMNS.some(c => c.id === id)) as LeaveColId[]
        return valid.length ? valid : DEFAULT_COLUMNS
      }
    } catch {}
    return DEFAULT_COLUMNS
  })
  // Temporary draft for dialog editing
  const [draftDisplayed, setDraftDisplayed] = useState<LeaveColId[]>(displayedColumns)
  // Modal UI is now in LeaveColumnSelector component

  // Helper to look up instructor details
  const getInstructorInfo = (instructorId: string) => state.instructors.find((i) => i.id === instructorId)

  // availableFilters logic moved into AdvancedFilters

  // Compute filtered count for the counter shown between toolbar and table/grid
  const filteredCount = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const inSearch = (r: LeaveRequest) => {
      if (!q) return true
      
      // Search by instructor name
      if (r.instructorName.toLowerCase().includes(q)) return true
      
      // Search by job level (from instructor info or leave request)
      const instructor = getInstructorInfo(r.instructorId)
      const jobLevel = r.jobLevel || instructor?.jobLevel || ''
      if (jobLevel.toLowerCase().includes(q)) return true
      
      return false
    }

    const inLeaveType = (r: LeaveRequest) => {
      if (!leaveTypes.length) return true
      return leaveTypes.includes(r.leaveType || '')
    }

    const inBranch = (r: LeaveRequest) => {
      if (!branchFilter || branchFilter === 'all') return true
      const inst = getInstructorInfo(r.instructorId)
      return inst?.department === branchFilter
    }

    const inStaffType = (r: LeaveRequest) => {
      if (!staffTypes.length) return true
      const inst = getInstructorInfo(r.instructorId)
      const contractType = (inst?.contractType || inst?.employmentType || '').toLowerCase()
      
      return staffTypes.some(v => {
        if (v === 'full-time') return contractType.includes('full') || contractType.includes('permanent')
        if (v === 'part-time') return contractType.includes('part')
        if (v === 'guest-faculty') return contractType.includes('guest')
        if (v === 'temporary') return contractType.includes('temporary')
        return false
      })
    }

    const inJobLevels = (r: LeaveRequest) => {
      if (!jobLevels.length) return true
      const inst = getInstructorInfo(r.instructorId)
      const level = (inst?.jobLevel || '').toLowerCase()
      return jobLevels.some(sel => sel.toLowerCase() === level)
    }

    const inDateRange = (r: LeaveRequest) => {
      const from = dateRange?.from
      const to = dateRange?.to
      if (!from && !to) return true
      if (!r.startDate || !r.endDate) return false
      const [y, m, d] = r.startDate.split("-").map(Number)
      const [ye, me, de] = r.endDate.split("-").map(Number)
      const start = new Date(y, (m || 1) - 1, d || 1)
      const end = new Date(ye, (me || 1) - 1, de || 1)
      if (from && to) return start <= to && end >= from
      if (from) return end >= from
      if (to) return start <= to
      return true
    }

    return state.leaveRequests.filter((r) => inSearch(r) && inLeaveType(r) && inBranch(r) && inJobLevels(r) && inDateRange(r) && inStaffType(r)).length
  }, [state.leaveRequests, state.instructors, searchQuery, leaveTypes, branchFilter, jobLevels, dateRange, staffTypes])

  // ------- Helpers to mirror table formatting/logic for export -------
  const formatInstructorId = (raw: string) => {
    // Convert various forms (i1, instr7, INSTR0008) to the NI display pattern: NON INS0001
    const m = raw.match(/(\d+)/)
    if (m) {
      const num = parseInt(m[1], 10)
      if (!isNaN(num)) return `NON INS${num.toString().padStart(4, '0')}`
    }
    // Normalize instructor-prefixed ids to non-instructor format
    const instr = raw.match(/^instr(\d+)$/i)
    if (instr) return `NON INS${parseInt(instr[1], 10).toString().padStart(4, '0')}`
    // If it's already NON INS####, just standardize casing/spacing
    const nonIns = raw.match(/^non\s?ins(\d+)$/i)
    if (nonIns) return `NON INS${parseInt(nonIns[1], 10).toString().padStart(4, '0')}`
    return raw.toUpperCase()
  }
  const parseLocalDate = (s: string) => {
    if (!s) return new Date(NaN)
    // YYYY-MM-DD
    let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    // DD-MM-YYYY
    m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
    if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
    // DD-MMM-YYYY or DD MMM YYYY
    m = s.match(/^(\d{1,2})[\s-]([A-Za-z]{3,})[\s-](\d{4})$/)
    if (m) {
      const day = Number(m[1])
      const monthName = m[2].slice(0,3).toLowerCase()
      const year = Number(m[3])
      const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
      const mi = months.indexOf(monthName)
      if (mi >= 0) return new Date(year, mi, day)
    }
    // Ordinal like 16th Oct 2025
    m = s.match(/^(\d{1,2})(st|nd|rd|th)\s+([A-Za-z]{3,})\s+(\d{4})$/i)
    if (m) {
      const day = Number(m[1])
      const monthName = m[3].slice(0,3).toLowerCase()
      const year = Number(m[4])
      const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
      const mi = months.indexOf(monthName)
      if (mi >= 0) return new Date(year, mi, day)
    }
    return new Date(s)
  }
  const formatDisplayDate = (s: string) => {
    try {
      const d = parseLocalDate(s)
      if (isNaN(d.getTime())) return s
          return formatDateFns(d, "dd-MMM-yyyy")
    } catch { return s }
  }
  const computeWorkingDays = (start: string, end: string) => {
    try {
      const s = parseLocalDate(start)
      const e = parseLocalDate(end)
      if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0
      let count = 0
      const cur = new Date(s)
      const working = Array.isArray(state.workingDays) && state.workingDays.length ? state.workingDays : [1,2,3,4,5,6]
      while (cur <= e) { if (working.includes(cur.getDay())) count++; cur.setDate(cur.getDate() + 1) }
      return count
    } catch { return 0 }
  }
  const normalizeContractType = (raw?: string) => {
    if (!raw) return "Temporary"
    const v = raw.toLowerCase()
    if (v.includes('full')) return 'Full-Time'
    if (v.includes('part')) return 'Part-Time'
    if (v.includes('guest')) return 'Guest faculty'
    if (v.includes('temp')) return 'Temporary'
    if (v.includes('permanent')) return 'Full-Time'
    return 'Temporary'
  }
  const mapLevelKey = (jobLevel?: string): keyof LeavePolicy['allocations'] | undefined => {
    if (!jobLevel) return undefined
    const v = jobLevel.toLowerCase()
    if (v.includes('junior')) return 'junior'
    if (v.includes('senior')) return 'senior'
    if (v.includes('manager')) return 'managers'
    return undefined
  }
  const getPeriodKey = (dateStr: string) => {
    const d = parseLocalDate(dateStr)
    const y = d.getFullYear(); const m = d.getMonth()
    const qt = policy?.quotaType || 'Monthly Quota'
    if (qt === 'Yearly Quota') return `${y}`
    if (qt === 'Quarterly Quota') { const q = Math.floor(m/3)+1; return `${y}-Q${q}` }
    return `${y}-${String(m+1).padStart(2,'0')}`
  }

  const handleRetryCSVImport = () => {
    // Reset the file input and trigger click to allow user to select a new file
    const input = document.getElementById("import-leave-csv-input") as HTMLInputElement
    if (input) {
      input.value = ""
      input.click()
    }
  }
  // Session-only policy (no persistence)
  // Hydrate leave policy from backend (leave_policies collection)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchLeavePolicy()
        if (res.ok && res.data) {
          const p = res.data
          const a = p.allocations || { junior: 12, senior: 16, managers: 24 }
          const next: LeavePolicy = {
            quotaType: p.quotaType || 'Monthly Quota',
            autoReject: !!p.autoReject,
            allocations: a,
            carryForward: p.carryForward !== false,
          }
          setPolicy(next)
          // workingDays persisted separately with policy
          if (Array.isArray(p.workingDays) && p.workingDays.length) {
            dispatch({ type: 'SET_WORKING_DAYS', payload: p.workingDays })
          }
        }
      } catch (e) {
        console.warn('Failed to load leave policy', e)
      }
    })()
  }, [dispatch])
  

  // Date helpers moved into AdvancedFilters

  // Dashboard metrics computed live from the table using today's date
  // Compute today's approved leaves (excluding maternity/paternity) and breakdown by type
  const excludedTypes = new Set(["Maternity Leave", "Paternity Leave"]) as Set<NonNullable<LeaveRequest["leaveType"]>>

  const { leavesTodayCount, leavesTodayTypeCounts } = useMemo(() => {
    const working = Array.isArray(state.workingDays) && state.workingDays.length ? state.workingDays : [1,2,3,4,5,6]
    const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    if (!working.includes(today.getDay())) return { leavesTodayCount: 0, leavesTodayTypeCounts: {} as Record<string, number> }
    const overlapsToday = (r: LeaveRequest) => {
      if (!r.startDate || !r.endDate) return false
      const [ys, ms, ds] = r.startDate.split("-").map(Number)
      const [ye, me, de] = r.endDate.split("-").map(Number)
      const s = new Date(ys, (ms || 1) - 1, ds || 1)
      const e = new Date(ye, (me || 1) - 1, de || 1)
      return s <= today && e >= today
    }
    const counts: Record<string, number> = {}
    let total = 0
    state.leaveRequests.forEach(r => {
      if (r.status !== 'APPROVED') return
      if (!r.leaveType || excludedTypes.has(r.leaveType)) return
      if (!overlapsToday(r)) return
      total += 1
      const key = r.leaveType
      counts[key] = (counts[key] || 0) + 1
    })
    return { leavesTodayCount: total, leavesTodayTypeCounts: counts }
  }, [state.leaveRequests, state.workingDays])

  // Build a compact breakdown string like: "1 Sick Leave, 1 Planned Leave"
  const leavesTodayBreakdown = useMemo(() => {
    const parts = Object.entries(leavesTodayTypeCounts)
      .filter(([, c]) => c > 0)
      .map(([t, c]) => `${c} ${t}`)
    return parts.join(", ")
  }, [leavesTodayTypeCounts])

  // Removed Weekly Trend card per requirements

  const leavesNext7DaysCount = useMemo(() => {
    // Count only WORKING-DAY leave days overlapping next 7 days (inclusive), using policy working days
    const working = Array.isArray(state.workingDays) && state.workingDays.length ? state.workingDays : [1,2,3,4,5,6]
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const end = new Date(today); end.setDate(today.getDate() + 6)

    const parse = (s: string) => { const [y,m,d] = s.split('-').map(Number); return new Date(y,(m||1)-1,(d||1)) }

    let totalDays = 0
    state.leaveRequests.forEach(r => {
      if (r.status !== 'APPROVED') return
      // Exclude maternity & paternity types
      if (!r.leaveType || excludedTypes.has(r.leaveType)) return
      if (!r.startDate || !r.endDate) return
      const rs = parse(r.startDate)
      const re = parse(r.endDate)
      // Overlap between [rs,re] and [today,end]
      const start = rs > today ? rs : today
      const finish = re < end ? re : end
      if (finish >= start) {
        const d = new Date(start)
        while (d <= finish) {
          if (working.includes(d.getDay())) totalDays++
          d.setDate(d.getDate() + 1)
        }
      }
    })
    return totalDays
  }, [state.leaveRequests, state.workingDays])

  // Maternity & Paternity: ongoing and upcoming (count of persons)
  const { mpOngoingCount, mpUpcomingCount } = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
    const parse = (s: string) => { const [y,m,d] = s.split('-').map(Number); return new Date(y,(m||1)-1,(d||1)) }
    const types = new Set(["Maternity Leave", "Paternity Leave"]) as Set<NonNullable<LeaveRequest["leaveType"]>>

    const ongoing = new Set<string>()
    const upcoming = new Set<string>()

    state.leaveRequests.forEach(r => {
      if (r.status !== 'APPROVED') return
      if (!r.leaveType || !types.has(r.leaveType)) return
      if (!r.startDate || !r.endDate) return
      const rs = parse(r.startDate)
      const re = parse(r.endDate)
      // Ongoing: overlaps today
      if (rs <= today && re >= today) {
        ongoing.add(r.instructorId)
      }
      // Upcoming: starts in future (tomorrow or later)
      if (rs >= tomorrow) {
        upcoming.add(r.instructorId)
      }
    })

    return { mpOngoingCount: ongoing.size, mpUpcomingCount: upcoming.size }
  }, [state.leaveRequests])

  const stats = [
    { key: 'today', title: "Leaves Today", value: leavesTodayCount, subtitle: `${leavesTodayCount} approved`, icon: Clock, color: "text-blue-600" },
  { key: 'next7', title: "Leaves (Next 7 days)", value: leavesNext7DaysCount, subtitle: "Excludes maternity & paternity", icon: CalendarDays, color: "text-amber-600" },
    { key: 'mp', title: "Maternity & Paternity (No. of instructors)", value: `Ongoing: ${mpOngoingCount}`, subtitle: `Upcoming: ${mpUpcomingCount}`, icon: CalendarDays, color: "text-cyan-600" },
  ] as const

  return (
    <div className="p-6 space-y-6">
      {/* Hub Header */}
      <LeaveHubHeader activeTab={hubTab} onTabChange={setHubTab} />

      {/* Dashboard: show only cards */}
      {hubTab === "dashboard" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat, index) => {
              // Map each of the three cards to a distinct color theme
              const themes = [
                {
                  card: "bg-violet-50 border border-violet-500",
                  title: "text-violet-700",
                  value: "text-violet-800",
                  subtitle: "text-violet-700",
                  icon: "text-violet-600",
                },
                {
                  card: "bg-amber-50 border border-amber-500",
                  title: "text-amber-700",
                  value: "text-amber-800",
                  subtitle: "text-amber-700",
                  icon: "text-amber-600",
                },
                {
                  card: "bg-cyan-50 border border-cyan-500",
                  title: "text-cyan-700",
                  value: "text-cyan-800",
                  subtitle: "text-cyan-700",
                  icon: "text-cyan-600",
                },
              ] as const

              const theme = themes[index % themes.length]

              // Click behaviors for cards
              const isLeavesToday = stat.key === 'today'
              const isNext7 = stat.key === 'next7'
              const isMP = stat.key === 'mp'

              const openTableHighlighting = (opts?: { next7?: boolean; mp?: boolean }) => {
                // Go to Leave Request tab, ensure Table view, then scroll to table section
                setHubTab("leave-request")
                setViewMode("table")
                // Mark highlight mode to compute IDs below
                if (opts?.mp) setHighlightMode('mp')
                else if (opts?.next7) setHighlightMode('next7')
                else setHighlightMode('today')
                setHighlightKey(prev => prev + 1)
                // Schedule automatic reset so returning to this tab later won't re-trigger highlight
                if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current)
                highlightTimerRef.current = window.setTimeout(() => {
                  setHighlightMode(null)
                  setHighlightKey(0)
                  highlightTimerRef.current = null
                }, 3500)
                // Do NOT filter table; we will compute ids to highlight below during render
                setTimeout(() => {
                  const el = document.getElementById("leave-request-table")
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
                }, 50)
              }

              return (
                <Card
                  key={index}
                  className={`${theme.card} ${'cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2'} ${isLeavesToday ? 'focus:ring-violet-500' : isNext7 ? 'focus:ring-amber-500' : 'focus:ring-cyan-500'}`}
                  onClick={() => openTableHighlighting({ next7: isNext7, mp: isMP })}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e: any) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTableHighlighting({ next7: isNext7, mp: isMP }) } }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${theme.title}`}>
                          {stat.title}
                          {isLeavesToday && (
                            <span className="text-[11px] ml-2 opacity-100">(Excludes maternity & paternity)</span>
                          )}
                        </p>
                        <p className={`text-2xl font-bold ${theme.value}`}>{stat.value}</p>
                        {!isLeavesToday && (
                          <p className={`text-xs mt-1 ${theme.subtitle}`}>{stat.subtitle}</p>
                        )}
                        {isLeavesToday && leavesTodayBreakdown && (
                          <p className={`text-xs mt-1 ${theme.subtitle}`}>{leavesTodayBreakdown}</p>
                        )}
                      </div>
                      <stat.icon className={`h-8 w-8 ${theme.icon}`} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <div className="mt-4">
            <ErrorBoundary fallback={<div />}> 
              <DashboardCharts />
            </ErrorBoundary>
          </div>
        </>
      )}

      {/* Leave request: CTA card + credit system, then tools */}
      {hubTab === "leave-request" && (
        <>
          {/* CTA: Add new leave request */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Add New Leave Request</CardTitle>
                  <p className="text-sm text-muted-foreground">Create and submit a new leave request in just a few steps.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setDraftsOpen(true)}>
                    <Save className="h-4 w-4 mr-2" />
                    Drafts ({state.drafts.length})
                  </Button>
                  <Button onClick={() => setShowNewRequestForm(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    New Leave Request
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Leave Credit System */}
          
        </>
      )}
      {hubTab === "leave-request" && (
      <div className="space-y-4">
        {/* Combined Search, View toggle, Filters, Export */}
  <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name or job level..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
      <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-2">
                {/* More Filters Popover with apply/clear tick behavior */}
            <AdvancedFilters
              value={{ jobLevels, leaveTypes, dateRange, staffTypes }}
              onChange={(next) => {
                setJobLevels(next.jobLevels)
                setLeaveTypes(next.leaveTypes)
                setDateRange(next.dateRange)
                setStaffTypes(next.staffTypes)
              }}
            />

                {/* Sort dropdown (single button) */}
                <DropdownMenu>
                  <Tooltip open={sortTooltipOpen} onOpenChange={(o) => setSortTooltipOpen(o)}>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 flex items-center gap-1" aria-label="Sort">
                          <ArrowUpDown className="h-4 w-4" />
                          <span className="text-xs">
                        {sortBy === "instructorName" && "Non-Instructor Name"}
                        {sortBy === "instructorId" && "Non-Instructor ID"}
                        {sortBy === "leaveType" && "Leave Type"}
                        {sortBy === "startDate" && "Start Date"}
                        {sortBy === "endDate" && "End Date"}
                        {sortBy === "status" && "Status"}
                        {sortBy === "days" && "No. of days"}
                          </span>
                          {sortOrder === "asc" ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />}
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Sort</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent className="max-h-64 overflow-y-auto w-56 p-2">
                    <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                    {[
                      { value: "instructorName", label: "Non-Instructor Name" },
                      { value: "instructorId", label: "Non-Instructor ID" },
                      { value: "leaveType", label: "Leave Type" },
                      { value: "startDate", label: "Start Date" },
                      { value: "endDate", label: "End Date" },
                      { value: "status", label: "Status" },
                      { value: "days", label: "No. of days" },
                    ].map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value as any)
                          setSortTooltipOpen(true)
                          if (sortTooltipTimerRef.current) {
                            window.clearTimeout(sortTooltipTimerRef.current)
                            sortTooltipTimerRef.current = null
                          }
                          sortTooltipTimerRef.current = window.setTimeout(() => {
                            setSortTooltipOpen(false)
                            sortTooltipTimerRef.current = null
                          }, 3000)
                        }}
                        className={sortBy === (option.value as any) ? "bg-purple-50" : ""}
                      >
                        <span>{option.label}</span>
                        {sortBy === option.value && (
                          <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
                        )}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Order</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => {
                      setSortOrder("asc")
                      setSortTooltipOpen(true)
                      if (sortTooltipTimerRef.current) {
                        window.clearTimeout(sortTooltipTimerRef.current)
                        sortTooltipTimerRef.current = null
                      }
                      sortTooltipTimerRef.current = window.setTimeout(() => {
                        setSortTooltipOpen(false)
                        sortTooltipTimerRef.current = null
                      }, 3000)
                    }}>
                      <span className="flex items-center gap-2">
                        Ascending
                        <ArrowUp className="h-4 w-4" />
                      </span>
                      {sortOrder === "asc" && (
                        <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSortOrder("desc")
                      setSortTooltipOpen(true)
                      if (sortTooltipTimerRef.current) {
                        window.clearTimeout(sortTooltipTimerRef.current)
                        sortTooltipTimerRef.current = null
                      }
                      sortTooltipTimerRef.current = window.setTimeout(() => {
                        setSortTooltipOpen(false)
                        sortTooltipTimerRef.current = null
                      }, 3000)
                    }}>
                      <span className="flex items-center gap-2">
                        Descending
                        <ArrowDown className="h-4 w-4" />
                      </span>
                      {sortOrder === "desc" && (
                        <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* List/Grid toggle (calendar hidden) */}
                <GridListToggle
                  viewMode={viewMode === "grid" ? "grid" : "list"}
                  setViewMode={(mode: "grid" | "list") => {
                    const mapped = mode === "grid" ? "grid" : "table"
                    setLastNonCalendarView(mapped)
                    setViewMode(mapped)
                  }}
                />

            {/* Import button */}
            <input
              id="import-leave-csv-input"
              type="file"
              accept="text/csv,.csv"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                
                try {
                  const csvText = await file.text()
                  const result = await importLeaveRequestsFromCSV(csvText, state.instructors)
                  
                  // Check if there are column validation issues
                  if (result.columnValidation && !result.columnValidation.isValid) {
                    setCsvMappingData({ detectedHeaders: result.columnValidation.detectedHeaders })
                    setPendingCSVFile(file)
                    setCsvMappingOpen(true)
                    return
                  }
                  
                  // Handle any errors
                  if (result.errors.length > 0) {
                    console.warn("CSV Import Warnings:", result.errors)
                    const errorMessage = result.errors.slice(0, 3).join('\n') + 
                      (result.errors.length > 3 ? `\n... and ${result.errors.length - 3} more errors` : '')
                    alert(`Import completed with warnings:\n${errorMessage}`)
                  }
                  
                  // Add new instructors to context
                  result.newInstructors.forEach((instructor) => {
                    dispatch({ type: "ADD_INSTRUCTOR", payload: instructor })
                  })
                  
                  // Add leave requests to context
                  result.leaveRequests.forEach((leaveRequest) => {
                    dispatch({ type: "ADD_LEAVE_REQUEST", payload: leaveRequest })
                  })
                  
                  if (result.leaveRequests.length > 0) {
                    crudSuccess('leave requests', 'imported', { 
                      description: `${result.leaveRequests.length} leave request(s) and ${result.newInstructors.length} instructor(s) added.` 
                    })
                    alert(`Successfully imported ${result.leaveRequests.length} leave requests from CSV.`)
                  } else {
                    alert("No valid leave requests found in CSV.")
                  }
                } catch (err) {
                  console.error("CSV Import Error:", err)
                  alert("Failed to import CSV. Please check the file format.")
                }
              }}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("import-leave-csv-input")?.click()}
                  title="Import CSV"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </TooltipTrigger>
              <TooltipContent>Upload files</TooltipContent>
            </Tooltip>

            {/* Export button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Export CSV"
                  onClick={() => {
                // Build usage per period to compute remaining balance exactly like the table
                const usage: Record<string, Record<string, number>> = {}
                state.leaveRequests.forEach(r => {
                  if (r.status !== 'APPROVED' || !r.startDate || !r.endDate) return
                  const period = getPeriodKey(r.startDate)
                  if (!usage[r.instructorId]) usage[r.instructorId] = {}
                  usage[r.instructorId][period] = (usage[r.instructorId][period] || 0) + computeWorkingDays(r.startDate, r.endDate)
                })
                const usageFor = (instructorId: string, anyDate?: string) => (anyDate ? usage[instructorId]?.[getPeriodKey(anyDate)] : 0) || 0
                const getInst = (id: string) => state.instructors.find(i => i.id === id)

                const base = selectedIds.length ? state.leaveRequests.filter(r => selectedIds.includes(r.id)) : state.leaveRequests
                const headers = [
                  'ID',
                  'Non-Instructor Name',
                  'Job Level',
                  'Contract Type',
                  'Leave Type',
                  'Reason',
                  'Start Date',
                  'End Date',
                  'Approved Date',
                  'Status',
                  'No. of days',
                  'Assigned leaves',
                ] as const

                const rows = base.map(r => {
                  const inst = getInst(r.instructorId)
                  // Determine limit: prefer exact label key in allocations, else fallback map
                  const label = String((inst?.jobLevel ?? r.jobLevel ?? '')).trim()
                  let limit: number | undefined
                  const allocs = policy.allocations || ({} as any)
                  const found = Object.keys(allocs).find(k => k.trim().toLowerCase() === label.toLowerCase())
                  if (found) limit = (allocs as any)[found]
                  if (limit === undefined) {
                    const key = mapLevelKey(label)
                    limit = key ? policy.allocations[key] : undefined
                  }
                  // Prefer any request-provided usage/limits, then computed
                  let used = typeof (r as any).allocationUsed === 'number' ? (r as any).allocationUsed : (r.startDate ? usageFor(r.instructorId, r.startDate) : 0)
                  if (typeof (r as any).allocationTotal === 'number' && limit === undefined) {
                    limit = (r as any).allocationTotal
                  }
                  const remaining = limit !== undefined ? Math.max(0, limit - used) : r.balance
                  // Use the same display format as the table (dd-MMM-yyyy)
                  const fmtDisp = (d?: string) => (d ? formatDisplayDate(d) : '')
                  
                  // Improved contract type mapping: prefer contractType, then employmentType
                  const contractType = inst?.contractType || inst?.employmentType || 'N/A'
                  
                  return {
                    ['ID']: formatInstructorId(r.instructorId),
                    ['Non-Instructor Name']: r.instructorName || 'N/A',
                    ['Job Level']: inst?.jobLevel || 'N/A',
                    ['Contract Type']: contractType,
                    ['Leave Type']: r.leaveType || 'N/A',
                    ['Reason']: r.reason || 'N/A',
                    ['Start Date']: fmtDisp(r.startDate),
                    ['End Date']: fmtDisp(r.endDate),
                    ['Approved Date']: r.registeredDate ? fmtDisp(r.registeredDate) : (r.approvedAt ? fmtDisp(r.approvedAt.substring(0,10)) : ''),
                    ['Status']: 'Approved',
                    ['No. of days']: (r.startDate && r.endDate) ? String(computeWorkingDays(r.startDate, r.endDate)) : '',
                    // Force Excel to treat as text and not as a date by exporting as a quoted formula
                    // e.g., ="2/20" will display exactly 2/20 as text
                    // Always show something: if limit unknown, show used/?
                    ['Assigned leaves']: `="${Number.isFinite(used) ? used : 0}/${typeof limit === 'number' ? limit : '?'}"`,
                  }
                })

                const csv = toCSV(rows, [...headers])
                const name = selectedIds.length ? `leave-requests-selected-${selectedIds.length}.csv` : 'leave-requests.csv'
                downloadCSV(name, csv)
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {`Export${selectedIds.length ? ` (${selectedIds.length})` : ""}`}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export CSV</TooltipContent>
            </Tooltip>
            {/* Policies button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Leave Policies"
                  onClick={() => setPolicyOpen(true)}
                >
                  Leave Policies
                </Button>
              </TooltipTrigger>
              
            </Tooltip>
          </div>
          </TooltipProvider>
        </div>
        {/* Counter: between toolbar and table/grid */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-purple-500" aria-hidden="true" />
            <span>Showing {filteredCount} Requests</span>
          </div>
          {viewMode === "table" && (
            <LeaveColumnSelector
              value={displayedColumns}
              onChange={(cols) => setDisplayedColumns(cols)}
            />
          )}
        </div>
      </div>
      )}

  {/* Toolbar removed; Export now lives in the combined row above */}

  {/* Always-visible Leave Table / Calendar (independent of the Management Tabs selection) */}
  {hubTab === "leave-request" && (
    <div className="space-y-4 mt-4" id="leave-request-table">
      {viewMode === "table" ? (
        <LeaveTable
          searchQuery={searchQuery}
          filters={{
            leaveTypes,
            branch: branchFilter,
            jobLevels,
            dateRange,
            staffTypes,
          }}
          sortBy={sortBy}
          sortOrder={sortOrder}
          policy={policy}
          selectedIds={selectedIds}
          onChangeSelected={setSelectedIds}
          displayedColumns={displayedColumns}
          highlightIds={highlightIds}
          highlightKey={highlightKey}
        />
      ) : viewMode === "grid" ? (
        <LeaveGrid
          searchQuery={searchQuery}
          filters={{
            leaveTypes,
            branch: branchFilter,
            jobLevels,
            dateRange,
            staffTypes,
          }}
          sortBy={sortBy}
          sortOrder={sortOrder}
          policy={policy}
        />
      ) : (
  <LeaveCalendarView policy={policy} />
      )}
    </div>
  )}

  {/* LeavePolicyDialog removed */}
  <RecurringLeaveDialog open={recurringOpen} onOpenChange={setRecurringOpen} />

      <LeavePolicyDialog
        open={policyOpen}
        onOpenChange={setPolicyOpen}
        policy={policy}
        onSave={async (next, workingDays) => {
          setPolicy(next)
          try {
            await updateLeavePolicy({
              quotaType: next.quotaType,
              autoReject: next.autoReject,
              allocations: next.allocations,
              carryForward: next.carryForward,
              workingDays,
            })
            // Success toast for leave policy updates
            crudSuccess('leave policy', 'updated', { description: 'Leave policy and working days were saved.' })
            // Refetch leave requests so server-side recompute (days + balances) is reflected immediately
            const refreshed = await fetchLeaveRequests()
            if (refreshed.ok) {
              dispatch({ type: 'SET_LEAVE_REQUESTS', payload: (refreshed as any).data })
            }
          } catch (e) {
            console.error('Failed to persist leave policy', e)
          }
          setPolicyOpen(false)
        }}
      />

      {/* New Leave Request Form Modal */}
      {showNewRequestForm && (
        <LeaveRequestForm
          onClose={() => {
            setShowNewRequestForm(false)
            setEditingDraft(null)
          }}
          draft={editingDraft || undefined}
        />
      )}

      {/* Drafts viewer */}
      <Dialog open={draftsOpen} onOpenChange={setDraftsOpen}>
        <DialogContent
          className="max-w-2xl"
          onEscapeKeyDown={(e) => { e.preventDefault() }}
          onPointerDownOutside={(e) => { e.preventDefault() }}
        >
          <DialogHeader>
            <div className="flex items-center justify-between w-full">
              <DialogTitle className="flex-1">Instructor Drafts</DialogTitle>
              <Button aria-label="Refresh drafts" variant="ghost" size="icon" title="Refresh" onClick={() => setDraftsOpen((v)=>v)}>
                <RefreshCw className="h-4 w-4 text-purple-600" />
              </Button>
            </div>
            <div>
              <DialogDescription>Manage your saved drafts. Click to edit instructor from draft or delete.</DialogDescription>
            </div>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {state.drafts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No drafts yet.</p>
            ) : (
              state.drafts.map((d) => (
                <div
                  key={d.id}
                  className="flex items-start justify-between rounded-md border p-4 hover:bg-accent/40 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => { setEditingDraft(d); setDraftsOpen(false); setShowNewRequestForm(true) }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditingDraft(d); setDraftsOpen(false); setShowNewRequestForm(true) } }}
                >
                  <div className="text-sm">
                    <div className="font-semibold text-lg">{d.title || 'Untitled Draft'}</div>
                    <div className="text-muted-foreground">{d.instructorName || d.instructorId}</div>
                    <div className="text-muted-foreground mt-1">
                      {(d.startDate && d.endDate) ? `${formatDateFns(new Date(d.startDate), 'dd-MMM-yy')} - ${formatDateFns(new Date(d.endDate), 'dd-MMM-yy')}` : 'Dates not set'}
                    </div>
                    {d.jobLevel && (<span className="inline-block mt-2 rounded-full bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5">{d.jobLevel}</span>)}
                    <div className="text-xs text-muted-foreground mt-2">Last updated: {d.updatedAt ? formatDateFns(new Date(d.updatedAt), 'dd-MMM-yyyy') : '?'}</div>
                  </div>
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" title="Edit Draft" onClick={() => { setEditingDraft(d); setDraftsOpen(false); setShowNewRequestForm(true) }}>
                      <Pencil className="h-5 w-5 text-purple-600" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Delete" onClick={() => setDeleteConfirmId(d.id)}>
                      <Trash2 className="h-5 w-5 text-red-500 hover:text-red-600" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete draft confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center justify-between">
              <AlertDialogTitle>Delete Leave Request</AlertDialogTitle>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <AlertDialogDescription>Are you sure you want to delete this leave request? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
                    <div className="text-sm font-medium mt-2">"{state.drafts.find(d => d.id === deleteConfirmId)?.instructorName || ''}"</div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => { if (deleteConfirmId) { dispatch({ type: 'DELETE_DRAFT', payload: { id: deleteConfirmId } }); crudSuccess('draft leave request', 'deleted'); setDeleteConfirmId(null) } }}>Delete Request</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Smart Notifications page */}
      {hubTab === "smart-notifications" && (
        <div className="mt-6">
          <SmartNotifications />
        </div>
      )}

      {/* CSV Column Mapping Dialog */}
      <CSVColumnMappingDialog
        open={csvMappingOpen}
        onOpenChange={setCsvMappingOpen}
        detectedHeaders={csvMappingData.detectedHeaders}
        onRetry={handleRetryCSVImport}
      />

      {/* Column selector handled by LeaveColumnSelector component */}
    </div>
  )
}

// Dialog to select displayed columns (shown when showColumnSelector is true)
// Placed at end to keep main component readable
function ColumnSelectorModal(props: {
  open: boolean
  onOpenChange: (v: boolean) => void
  columns: { id: string; label: string }[]
  draft: string[]
  setDraft: (next: string[]) => void
  available: string[]
  selectedAvailable: string[]
  setSelectedAvailable: (next: string[]) => void
  selectedDisplayed: string[]
  setSelectedDisplayed: (next: string[]) => void
  onSave: () => void
  onReset: () => void
}) {
  // This is a simple inline component; but in our usage we render the JSX inline below instead of this component.
  return null
}
