"use client"
import { useEffect, useRef, useState, useMemo } from "react"
import { format } from "date-fns"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/dashboard/ui/hover-card"
import { Card, CardContent } from "@/components/dashboard/ui/card"
import { Button } from "@/components/dashboard/ui/button"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/dashboard/ui/table"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/dashboard/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { FormattedDateInput } from "@/components/dashboard/ui/formatted-date-input"
import { Textarea } from "@/components/dashboard/ui/textarea"
import { cn } from "@/lib/dashboard/staff/utils"
import DeleteConfirmationDialog from "./delete-confirmation-dialog"
import { useLeave } from "@/contexts/dashboard/leave-context"
import { Label } from "@/components/dashboard/ui/label"
import { crudSuccess } from "@/lib/dashboard/staff/crud-toast"
import LeaveTypeCombobox from "./leave-type-combobox"
import type { LeavePolicy } from './leave-policy-dialog'
import { User, MessageSquare, UserPlus, Pencil, CalendarDays, Info } from "lucide-react"
import { Progress } from "@/components/dashboard/ui/progress"
import { Badge } from "@/components/dashboard/ui/badge"
import LeaveRequestDetailsDialog from "./leave-request-details-dialog"

import type { DateRange } from "react-day-picker"
import type { LeaveRequest } from "@/types/dashboard/staff/leave"

interface Filters {
  leaveTypes?: string[]
  branch?: string
  jobLevels?: string[]
  dateRange?: DateRange
  staffTypes?: string[]
}

type SortBy = "instructorName" | "instructorId" | "leaveType" | "startDate" | "endDate" | "status" | "days"

type LeaveColId =
  | "registeredDate"
  | "instructorId"
  | "instructor"
  | "jobLevel"
  | "contractType"
  | "courseId"
  | "leaveType"
  | "startDate"
  | "endDate"
  | "status"
  | "days"
  | "balance"
  | "edit"
  | "delete"
  | "courseName"
  | "cohortName"
  | "cohortId"

interface LeaveTableProps {
  searchQuery: string
  filters?: Filters
  sortBy?: SortBy
  sortOrder?: "asc" | "desc"
  policy?: LeavePolicy
  selectedIds?: string[]
  onChangeSelected?: (ids: string[]) => void
  displayedColumns?: LeaveColId[]
  // Optional: highlight specific rows transiently (e.g., when navigating from dashboard cards)
  highlightIds?: string[]
  highlightKey?: number
}

export default function LeaveTable({ searchQuery, filters, sortBy = "startDate", sortOrder = "asc", policy, selectedIds = [], onChangeSelected, displayedColumns, highlightIds, highlightKey }: LeaveTableProps) {
  const { state, dispatch } = useLeave()

  // Helper: format raw instructor id (assumed numeric or string containing trailing number)
  // into the display pattern INSTR0001
  const formatInstructorId = (raw: string) => {
    // Support patterns: i1, i23, instr7, INSTR0008, etc.
    const m = raw.match(/(\d+)/)
    if (m) {
      const num = parseInt(m[1], 10)
      if (!isNaN(num)) return `INSTR${num.toString().padStart(4, '0')}`
    }
    // If already INSTR#### keep as is but normalize padding to 4 if possible
    const instr = raw.match(/^instr(\d+)$/i)
    if (instr) {
      return `INSTR${parseInt(instr[1], 10).toString().padStart(4, '0')}`
    }
    return raw.toUpperCase()
  }

  const inSearch = (request: typeof state.leaveRequests[number]) => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    
    // Search by instructor name
    if (request.instructorName.toLowerCase().includes(q)) return true
    
    // Search by job level (from instructor info or leave request)
    const instructor = getInstructorInfo(request.instructorId)
    const jobLevel = request.jobLevel || instructor?.jobLevel || ''
    if (jobLevel.toLowerCase().includes(q)) return true
    
    return false
  }

  const inLeaveType = (request: typeof state.leaveRequests[number]) => {
    if (!filters?.leaveTypes || filters.leaveTypes.length === 0) return true
    return filters.leaveTypes.includes(request.leaveType || '')
  }

  const getInstructorInfo = (instructorId: string) => {
    return state.instructors.find((i: any) => i.id === instructorId)
  }

  const inBranch = (request: typeof state.leaveRequests[number]) => {
    if (!filters?.branch || filters.branch === 'all') return true
    const instructor = getInstructorInfo(request.instructorId)
    return instructor?.department === filters.branch
  }

  const inStaffType = (request: typeof state.leaveRequests[number]) => {
    if (!filters?.staffTypes || filters.staffTypes.length === 0) return true
    const instructor = getInstructorInfo(request.instructorId)
    const contractType = (instructor?.contractType || instructor?.employmentType || '').toLowerCase()
    
    return filters.staffTypes.some(v => {
      if (v === 'full-time') return contractType.includes('full') || contractType.includes('permanent')
      if (v === 'part-time') return contractType.includes('part')
      if (v === 'guest-faculty') return contractType.includes('guest')
      if (v === 'temporary') return contractType.includes('temporary')
      return false
    })
  }

  const inJobLevels = (request: typeof state.leaveRequests[number]) => {
    const selected = filters?.jobLevels || []
    if (!selected.length) return true
    const instructor = getInstructorInfo(request.instructorId)
    const level = (instructor?.jobLevel || '').toLowerCase()
    return selected.some(sel => sel.toLowerCase() === level)
  }

  const parseISO = (s: string) => new Date(s)
  const parseLocalDate = (s: string) => {
    // Prefer YYYY-MM-DD; fall back to flexible parsing (handles 16th Oct 2025, 16-Oct-2025, 16/10/2025)
    if (!s) return new Date(NaN)
    // 1) ISO-like YYYY-MM-DD
    let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    // 2) DD-MM-YYYY
    m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
    if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
    // 3) DD-MMM-YYYY or DD MMM YYYY (case-insensitive)
    m = s.match(/^(\d{1,2})[\s-]([A-Za-z]{3,})[\s-](\d{4})$/)
    if (m) {
      const day = Number(m[1])
      const monthName = m[2].slice(0,3).toLowerCase()
      const year = Number(m[3])
      const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
      const mi = months.indexOf(monthName)
      if (mi >= 0) return new Date(year, mi, day)
    }
    // 4) Ordinal like 16th Oct 2025
    m = s.match(/^(\d{1,2})(st|nd|rd|th)\s+([A-Za-z]{3,})\s+(\d{4})$/i)
    if (m) {
      const day = Number(m[1])
      const monthName = m[3].slice(0,3).toLowerCase()
      const year = Number(m[4])
      const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
      const mi = months.indexOf(monthName)
      if (mi >= 0) return new Date(year, mi, day)
    }
    // Last resort: native Date
    const d = new Date(s)
    return d
  }
  const computeWorkingDays = (start: string, end: string) => {
    try {
      const s = parseLocalDate(start)
      const e = parseLocalDate(end)
      if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0
      let count = 0
      const cur = new Date(s)
      const working = state.workingDays
      while (cur <= e) {
        if (working.includes(cur.getDay())) count++
        cur.setDate(cur.getDate() + 1)
      }
      return count
    } catch { return 0 }
  }

  // Display date helper (avoid TZ drift, show as dd-MMM-yyyy)
  const formatDisplayDate = (s: string) => {
    try {
      const d = parseLocalDate(s)
      if (isNaN(d.getTime())) return s
      return format(d, "dd-MMM-yyyy")
    } catch {
      return s
    }
  }
  // Truncate comma-separated lists to 2 items with an ellipsis, keep full list in title
  const formatListWithEllipsis = (value?: string | null) => {
    const raw = (value || '').trim()
    if (!raw) return { display: '�', title: '' }
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean)
    if (parts.length <= 2) {
      const joined = parts.join(', ')
      return { display: joined || '�', title: joined }
    }
    const shown = parts.slice(0, 2).join(', ')
    return { display: `${shown}, ...`, title: parts.join(', ') }
  }
  const inDateRange = (request: typeof state.leaveRequests[number]) => {
    const from = filters?.dateRange?.from
    const to = filters?.dateRange?.to
    if (!from && !to) return true
    if (!request.startDate || !request.endDate) return false
    const start = parseLocalDate(request.startDate)
    const end = parseLocalDate(request.endDate)
    if (from && to) {
      // overlap between [start,end] and [from,to]
      return start <= to && end >= from
    }
    if (from) return end >= from
    if (to) return start <= to
    return true
  }

  const filteredRequests = state.leaveRequests.filter(
    (req: any) => req.status !== 'DRAFT' && inSearch(req) && inLeaveType(req) && inBranch(req) && inJobLevels(req) && inDateRange(req) && inStaffType(req),
  )

  // (Contract type now taken directly from backend without normalization)

  // Sorting
  const statusRank: Record<string, number> = { APPROVED: 1 }
  const cmp = (a: any, b: any) => (a < b ? -1 : a > b ? 1 : 0)
  const getKey = (req: typeof state.leaveRequests[number]) => {
    switch (sortBy) {
      case "instructorName":
        return req.instructorName?.toLowerCase() ?? ""
      case "instructorId":
        return formatInstructorId(req.instructorId)
      case "leaveType":
        return req.leaveType?.toLowerCase() ?? ""
      case "startDate":
        return req.startDate ? new Date(req.startDate).getTime() : 0
      case "endDate":
        return req.endDate ? new Date(req.endDate).getTime() : 0
      case "status":
        return statusRank[req.status] ?? 99
      case "days":
        return (req.startDate && req.endDate) ? computeWorkingDays(req.startDate, req.endDate) : 0
      default:
        return 0
    }
  }
  const sortedRequests = filteredRequests.slice().sort((a, b) => {
    const va = getKey(a)
    const vb = getKey(b)
    const res = cmp(va, vb)
    return sortOrder === "asc" ? res : -res
  })

  // -------- Quota Logic ---------
  // Map job level label to allocation key used in policy.allocations
  const mapLevelKey = (jobLevel?: string): keyof LeavePolicy['allocations'] | undefined => {
    if (!jobLevel) return undefined
    const v = jobLevel.toLowerCase()
    if (v.includes('junior')) return 'junior'
    if (v.includes('senior')) return 'senior'
    if (v.includes('manager')) return 'managers'
    return undefined
  }

  // Determine period boundaries based on quota type
  const getPeriodKey = (dateStr: string) => {
    const d = parseLocalDate(dateStr)
    const y = d.getFullYear()
    const m = d.getMonth() // 0-11
    const quotaType = policy?.quotaType || 'Monthly Quota'
    if (quotaType === 'Yearly Quota') return `${y}`
    if (quotaType === 'Quarterly Quota') {
      const q = Math.floor(m / 3) + 1
      return `${y}-Q${q}`
    }
    // Monthly
    return `${y}-${String(m + 1).padStart(2,'0')}`
  }

  // Aggregate approved days per instructor within each period
  const usage = useMemo(() => {
    const result: Record<string, Record<string, number>> = {}
    state.leaveRequests.forEach((r: any) => {
      if (r.status !== 'APPROVED' || !r.startDate || !r.endDate) return
      if (!r.startDate || !r.endDate) return
      const period = getPeriodKey(r.startDate)
      if (!result[r.instructorId]) result[r.instructorId] = {}
      result[r.instructorId][period] = (result[r.instructorId][period] || 0) + computeWorkingDays(r.startDate, r.endDate)
    })
    return result
  }, [state.leaveRequests, policy?.quotaType])

  const currentPeriodKey = (dateStr: string) => getPeriodKey(dateStr)

  const limitForInstructor = useMemo(() => (instructorId: string) => {
    if (!policy) return undefined
    const inst = getInstructorInfo(instructorId)
    const label = String(inst?.jobLevel || '').trim()
    const allocs: Record<string, number> = (policy as any).allocations || {}
    // Prefer exact label (case-insensitive)
    const found = Object.keys(allocs).find(k => k.trim().toLowerCase() === label.toLowerCase())
    if (found) return allocs[found]
    // Fallback mapping for older policy docs
    const key = mapLevelKey(label)
    if (key && typeof (allocs as any)[key] === 'number') return (allocs as any)[key]
    return undefined
  }, [policy, state.instructors])

  const usageForInstructor = useMemo(() => (instructorId: string, anyDate?: string) => {
    if (!anyDate) return 0
    const period = currentPeriodKey(anyDate)
    return usage[instructorId]?.[period] || 0
  }, [usage])

  // View dialog state
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)

  // Substitute dialog state
  const [isSubstituteOpen, setIsSubstituteOpen] = useState(false)
  const [selectedForSubstitute, setSelectedForSubstitute] = useState<LeaveRequest | null>(null)
  const [suggestedSubs, setSuggestedSubs] = useState<Array<{
    id: number
    name: string
    availability: string
    skillMatch: number
    workload: string
  }>>([])

  // Delete confirmation dialog state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedForDelete, setSelectedForDelete] = useState<LeaveRequest | null>(null)

  // Edit dialog state
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedForEdit, setSelectedForEdit] = useState<LeaveRequest | null>(null)
  const [editData, setEditData] = useState<{ 
    instructorId: string; 
    instructorName: string;
    leaveType: string; 
    jobLevel: string;
    contractType: string;
    startDate?: Date; 
    endDate?: Date; 
    reason: string 
  }>({ 
    instructorId: "", 
    instructorName: "",
    leaveType: "", 
    jobLevel: "",
    contractType: "",
    startDate: undefined, 
    endDate: undefined, 
    reason: "" 
  })
  // Track initial snapshot for dirty check in edit dialog
  const [initialEditComparable, setInitialEditComparable] = useState<string>("")

  const toComparable = (d: { instructorId: string; instructorName: string; leaveType: string; jobLevel: string; contractType: string; startDate?: Date; endDate?: Date; reason: string }) => ({
    instructorId: d.instructorId,
    instructorName: d.instructorName,
    leaveType: d.leaveType,
    jobLevel: d.jobLevel,
    contractType: d.contractType,
    startDateMs: d.startDate ? d.startDate.getTime() : null,
    endDateMs: d.endDate ? d.endDate.getTime() : null,
    reason: (d.reason || "").trim(),
  })

  const isEditDirty = useMemo(() => {
    if (!initialEditComparable) return false
    try {
      return JSON.stringify(toComparable(editData)) !== initialEditComparable
    } catch {
      return true
    }
  }, [editData, initialEditComparable])

  // Unsaved changes dialog for edit
  const [unsavedEditOpen, setUnsavedEditOpen] = useState(false)
  const attemptCloseEdit = () => {
    if (isEditDirty) {
      setUnsavedEditOpen(true)
      return
    }
    setIsEditOpen(false)
    setSelectedForEdit(null)
  }

  const openDelete = (req: LeaveRequest) => {
    setSelectedForDelete(req)
    setIsDeleteOpen(true)
  }

  const confirmDelete = () => {
    if (selectedForDelete) {
      dispatch({ type: 'DELETE_LEAVE_REQUEST', payload: { id: selectedForDelete.id } })
      crudSuccess('leave request', 'deleted')
    }
    setIsDeleteOpen(false)
    setSelectedForDelete(null)
  }

  const cancelDelete = () => {
    setIsDeleteOpen(false)
    setSelectedForDelete(null)
  }

  const openEdit = (req: LeaveRequest) => {
    setSelectedForEdit(req)
    const instructor = state.instructors.find((i: any) => i.id === req.instructorId)
    const deriveContractType = (req: LeaveRequest, inst: any): string => {
      // Prioritize request data first, then instructor data
      const fromRequest = (req as any)?.contractType?.trim() || (req as any)?.employmentType?.trim()
      if (fromRequest && fromRequest !== '') return String(fromRequest)
      
      if (!inst) return ""
      const primary = inst.employmentType?.trim() || inst.contractType?.trim()
      if (primary && primary !== '') return String(primary)
      const alt = inst.employment_type?.trim() || inst.contract_type?.trim() || inst.empType?.trim() || inst.employmentCategory?.trim() || inst.contract?.trim() || inst.type?.trim()
      return (alt && alt !== '') ? String(alt) : ""
    }
    
    const initialData = {
      instructorId: req.instructorId,
      instructorName: req.instructorName || instructor?.name || '',
      leaveType: req.leaveType || '',
      jobLevel: req.jobLevel || instructor?.jobLevel || '',
      contractType: deriveContractType(req, instructor) || '',
      startDate: req.startDate ? new Date(req.startDate) : new Date(),
      endDate: req.endDate ? new Date(req.endDate) : new Date(),
      reason: req.reason || '',
    }
    setEditData(initialData)
    // capture comparable snapshot
    setInitialEditComparable(JSON.stringify(toComparable(initialData)))
    setIsEditOpen(true)
  }

  const confirmEdit = () => {
    if (!selectedForEdit) return
    if (!editData.startDate || !editData.endDate) {
      alert("Please select both start and end dates.")
      return
    }
    if (editData.endDate < editData.startDate) {
      alert("End date cannot be before the start date.")
      return
    }
    const toYmd = (d: Date) => format(d, "yyyy-MM-dd")
    const updates: Partial<LeaveRequest> = {
      instructorId: editData.instructorId,
      instructorName: editData.instructorName,
      leaveType: editData.leaveType as LeaveRequest["leaveType"],
      jobLevel: editData.jobLevel,
      startDate: toYmd(editData.startDate),
      endDate: toYmd(editData.endDate),
      reason: editData.reason,
    }
    // recompute days with working days helper
    if (updates.startDate && updates.endDate && selectedForEdit.startDate && selectedForEdit.endDate) {
      updates.days = computeWorkingDays(updates.startDate || selectedForEdit.startDate, updates.endDate || selectedForEdit.endDate)
    }
    dispatch({ type: 'UPDATE_LEAVE_REQUEST', payload: { id: selectedForEdit.id, updates } })
    
    // Update instructor info if job level changed
    const instructor = state.instructors.find((i: any) => i.id === editData.instructorId)
    if (instructor && editData.jobLevel && instructor.jobLevel !== editData.jobLevel) {
      dispatch({ type: 'UPDATE_INSTRUCTOR', payload: { id: instructor.id, updates: { jobLevel: editData.jobLevel } } })
    }
    
    crudSuccess('leave request', 'updated')
    setIsEditOpen(false)
    setSelectedForEdit(null)
  }

  // Approvals are single-state; no actions are needed in the table.
  

  // Reject flow removed: single approval model

  const getStatusBadge = (_status: string) => (
    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
  )

  const getStatusBadgeColor = (status: string) => {
    if (status === 'APPROVED') return "bg-green-100 text-green-800 hover:bg-green-100"
    if (status === 'PENDING') return "bg-amber-100 text-amber-800 hover:bg-amber-100"
    return "bg-red-100 text-red-800 hover:bg-red-100"
  }

  const openView = (req: LeaveRequest) => {
    setSelectedRequest(req)
    setIsViewOpen(true)
  }

  const openSubstitute = (req: LeaveRequest) => {
    setSelectedForSubstitute(req)
    // Mock AI-powered suggestions (same as Backup.tsx)
    setSuggestedSubs([
      { id: 1, name: "Sarah Wilson", availability: "Available", skillMatch: 95, workload: "Light" },
      { id: 2, name: "Mike Johnson", availability: "Partial", skillMatch: 87, workload: "Medium" },
      { id: 3, name: "Lisa Chen", availability: "Available", skillMatch: 92, workload: "Light" },
    ])
    setIsSubstituteOpen(true)
  }

  
  // Limit visible rows to 3 and make the rest scrollable
  const headerRef = useRef<HTMLTableSectionElement | null>(null)
  const firstRowRef = useRef<HTMLTableRowElement | null>(null)
  const [maxTableHeight, setMaxTableHeight] = useState<number | undefined>(undefined)
  useEffect(() => {
    const measure = () => {
      const headerH = headerRef.current?.getBoundingClientRect().height || 0
      const rowH = firstRowRef.current?.getBoundingClientRect().height || 0
      const rows = Math.min(3, sortedRequests.length)
      const allowance = 8 // borders/padding
      if (rowH > 0) {
        setMaxTableHeight(headerH + rowH * rows + allowance)
      }
    }
    const id = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('resize', measure)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedRequests.length])

  // ---- Selection logic ----
  const selectedSet = new Set(selectedIds)
  const visibleIds = sortedRequests.map((r: any) => r.id)
  const allSelectedInView = visibleIds.length > 0 && visibleIds.every((id: any) => selectedSet.has(id))
  const someSelectedInView = visibleIds.some((id: any) => selectedSet.has(id)) && !allSelectedInView

  const setSelected = (ids: string[]) => {
    onChangeSelected?.(Array.from(new Set(ids)))
  }
  const toggleOne = (id: string, checked: boolean) => {
    if (!onChangeSelected) return
    if (checked) setSelected([...selectedIds, id])
    else setSelected(selectedIds.filter(x => x !== id))
  }
  const toggleAllInView = (checked: boolean) => {
    if (!onChangeSelected) return
    if (checked) setSelected(Array.from(new Set([...selectedIds, ...visibleIds])))
    else setSelected(selectedIds.filter(id => !visibleIds.includes(id)))
  }

  // Column configuration and selection
  const ALL_COLS: { id: LeaveColId; label: string; width: string }[] = [
    { id: "instructorId", label: "Instructor ID", width: "w-[120px]" },
    { id: "instructor", label: "Instructor Name", width: "w-[200px]" },
    { id: "jobLevel", label: "Job Level", width: "w-[140px]" },
    { id: "contractType", label: "Contract Type", width: "w-[140px]" },
  { id: "courseId", label: "Course ID", width: "w-[170px]" },
  { id: "courseName", label: "Course", width: "w-[170px]" },
  { id: "cohortName", label: "Cohort", width: "w-[170px]" },
  { id: "cohortId", label: "Cohort ID", width: "w-[170px]" },
    { id: "leaveType", label: "Leave Type", width: "w-[160px]" },
    { id: "startDate", label: "Start Date", width: "w-[130px]" },
    { id: "endDate", label: "End Date", width: "w-[130px]" },
    { id: "registeredDate", label: "Approved Date", width: "w-[150px]" },
    { id: "status", label: "Status", width: "w-[140px]" },
    { id: "days", label: "No. of days", width: "w-[120px]" },
    { id: "balance", label: "Assigned leaves", width: "w-[150px]" },
    { id: "edit", label: "Edit", width: "w-[100px]" },
    { id: "delete", label: "Delete", width: "w-[110px]" },
  ]
  const colMap = Object.fromEntries(ALL_COLS.map(c => [c.id, c])) as Record<LeaveColId, { id: LeaveColId; label: string; width: string }>
  // If displayedColumns is undefined, show all. If it's provided (even empty), respect it.
  // Filter out any columns that don't exist in colMap for safety
  const rawActiveCols: LeaveColId[] = (Array.isArray(displayedColumns) ? displayedColumns : ALL_COLS.map(c => c.id)) as LeaveColId[]
  const activeCols = rawActiveCols.filter(id => colMap[id]) as LeaveColId[]

  // ---- Transient row highlight handling (3 seconds) ----
  const [highlightActive, setHighlightActive] = useState(false)
  const firstHighlightRef = useRef<HTMLTableRowElement | null>(null)
  useEffect(() => {
    if (!highlightKey || !highlightIds || highlightIds.length === 0) return
    setHighlightActive(true)
    // Scroll first highlighted row into view within the scroll container
    const t = setTimeout(() => setHighlightActive(false), 3000)
    return () => clearTimeout(t)
  }, [highlightKey])

  return (
    <Card>
      <CardContent className="p-0">
        {/*
          Outer horizontal scroller: allows horizontal scroll of the entire table (header + body move together horizontally).
          Inner vertical scroller: enables vertical scroll with sticky header.
        */}
        <div className="overflow-x-auto scroll-smooth">
          <div className="relative overflow-y-auto" style={{ maxHeight: maxTableHeight }}>
            {/* Note: sticky header works because the vertical scroller is this parent div */}
            <table className="min-w-[1200px] w-full caption-bottom text-sm">
              {/* Fixed, readable widths per column */}
              <colgroup>
                <col className="w-[44px]" />
                {activeCols.map((id) => (
                  <col key={id} className={colMap[id].width} />
                ))}
              </colgroup>
              <TableHeader ref={headerRef as any} className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead className="w-[44px]">
                    <Checkbox
                      aria-label="Select all"
                      checked={allSelectedInView ? true : someSelectedInView ? "indeterminate" : false}
                      onCheckedChange={(v) => toggleAllInView(Boolean(v))}
                    />
                  </TableHead>
                  {activeCols.map((id) => (
                    <TableHead key={id} className="whitespace-nowrap">
                      {id === "edit" || id === "delete" ? "" : colMap[id].label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
            {sortedRequests.map((request: any, idx: any) => {
              const instructor = getInstructorInfo(request.instructorId)
              const computedLimit = limitForInstructor(request.instructorId)
              const computedUsed = usageForInstructor(request.instructorId, request.startDate)
              const limit = request.allocationTotal ?? computedLimit
              const used = request.allocationUsed ?? computedUsed
              const reached = limit !== undefined && used !== undefined && used >= limit
              const remaining = limit !== undefined && used !== undefined
                ? Math.max(0, limit - used)
                : (request.balance !== undefined ? request.balance : (computedLimit !== undefined ? Math.max(0, computedLimit - computedUsed) : undefined))
              // carriedOver column removed
              const isHighlighted = highlightActive && (highlightIds?.includes(request.id))
              return (
                <TableRow 
                  key={request.id} 
                  ref={idx === 0 ? (firstRowRef as any) : undefined} 
                  className={cn(
                    "cursor-pointer hover:bg-gray-50/80 transition-colors",
                    reached ? 'bg-red-50/70 hover:bg-red-50' : undefined,
                    isHighlighted ? 'bg-yellow-100/80 ring-2 ring-yellow-400' : undefined
                  )}
                  onClick={() => openView(request)}
                  data-row-id={request.id}
                >
                  <TableCell className="w-[44px]" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      aria-label={`Select ${request.instructorName}`}
                      checked={selectedSet.has(request.id)}
                      onCheckedChange={(v) => toggleOne(request.id, Boolean(v))}
                    />
                  </TableCell>
                  {activeCols.map((id) => {
                    if (id === "registeredDate") return (
                      <TableCell key={id} className="whitespace-nowrap">{request.registeredDate ? formatDisplayDate(request.registeredDate) : '�'}</TableCell>
                    )
                    if (id === "instructorId") return (
                      <TableCell key={id} className="text-xs tracking-wide font-semibold font-sans whitespace-nowrap">{formatInstructorId(request.instructorId)}</TableCell>
                    )
                    if (id === "instructor") return (
                      <TableCell key={id} className="font-medium whitespace-nowrap">{request.instructorName}</TableCell>
                    )
                    if (id === "jobLevel") return <TableCell key={id}>{request.jobLevel || instructor?.jobLevel || "N/A"}</TableCell>
                    if (id === "contractType") {
                      // Try to get contract type from multiple sources - prioritize request data over instructor data
                      const requestContract = (request as any)?.contractType || (request as any)?.employmentType
                      const instructorContract = instructor?.contractType || instructor?.employmentType
                      const contractType = requestContract || instructorContract || 'N/A'
                      
                      // Debug: Log contract type resolution for imported requests
                      if (request.id.includes('imported_')) {
                        console.log(`Contract Type Debug for ${request.instructorName}:`, {
                          requestContractType: (request as any)?.contractType,
                          requestEmploymentType: (request as any)?.employmentType,
                          instructorContractType: instructor?.contractType,
                          instructorEmploymentType: instructor?.employmentType,
                          requestContract,
                          instructorContract,
                          final: contractType
                        })
                      }
                      
                      return <TableCell key={id}>{contractType}</TableCell>
                    }
                    if (id === "courseName") {
                      const src = request.courseName || (instructor as any)?.courseAssigned || ''
                      const f = formatListWithEllipsis(src)
                      return <TableCell key={id} className="whitespace-nowrap" title={f.title}>{f.display}</TableCell>
                    }
                    if (id === "courseId") {
                      const src = (request as any)?.courseId || (instructor as any)?.courseIds || ''
                      const f = formatListWithEllipsis(src)
                      return <TableCell key={id} className="whitespace-nowrap">{f.display}</TableCell>
                    }
                    if (id === "cohortName") {
                      const src = request.cohortName || (instructor as any)?.cohortName || ''
                      const f = formatListWithEllipsis(src)
                      return <TableCell key={id} className="whitespace-nowrap" title={f.title}>{f.display}</TableCell>
                    }
                    if (id === "cohortId") {
                      const src = (request as any)?.cohortId || (instructor as any)?.cohortIds || ''
                      const f = formatListWithEllipsis(src)
                      return <TableCell key={id} className="whitespace-nowrap">{f.display}</TableCell>
                    }
                    if (id === "leaveType") return <TableCell key={id}>{request.leaveType || '�'}</TableCell>
                    if (id === "startDate") return <TableCell key={id} className="whitespace-nowrap">{request.startDate ? formatDisplayDate(request.startDate) : '�'}</TableCell>
                    if (id === "endDate") return <TableCell key={id} className="whitespace-nowrap">{request.endDate ? formatDisplayDate(request.endDate) : '�'}</TableCell>
                    if (id === "status") return (
                      <TableCell key={id} className="space-y-1">
                        {getStatusBadge(request.status)}
                        {reached && (
                          <div className="text-[10px] font-semibold text-red-600">Limit Reached</div>
                        )}
                      </TableCell>
                    )
                    if (id === "days") return <TableCell key={id} className="whitespace-nowrap">{request.startDate && request.endDate ? `${computeWorkingDays(request.startDate, request.endDate)} days` : '�'}</TableCell>
                    if (id === "balance") return (
                      <TableCell key={id} className="whitespace-nowrap">
                        {limit !== undefined && used !== undefined ? (
                          <div className="leading-tight text-sm font-medium">{used}/{limit}</div>
                        ) : (
                          <span className="text-muted-foreground">�</span>
                        )}
                      </TableCell>
                    )

                    if (id === "delete") return (
                      <TableCell key={id} className="w-[70px]" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:border-red-500"
                          title="Delete Request"
                          onClick={() => openDelete(request)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </Button>
                      </TableCell>
                    )
                    if (id === "edit") return (
                      <TableCell key={id} className="w-[70px]" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline" title="Edit" onClick={() => openEdit(request)}>
                          <Pencil className="h-4 w-4 text-purple-600" />
                        </Button>
                      </TableCell>
                    )
                    return null
                  })}
                </TableRow>
              )
            })}
              </TableBody>
            </table>
          </div>
        </div>

        {/* View Request Dialog (modern UI) */}
        <LeaveRequestDetailsDialog request={selectedRequest} open={isViewOpen} onOpenChange={setIsViewOpen} policy={policy} />

        {/* Edit Request Dialog - consistent with New Leave Request UI */}
  <Dialog open={isEditOpen} onOpenChange={(open) => { if (!open) { attemptCloseEdit() } else { setIsEditOpen(true) } }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Leave Request</DialogTitle>
              <DialogDescription>Update fields and save changes.</DialogDescription>
            </DialogHeader>
            {selectedForEdit && (
              <div className="space-y-4">
                {/* Instructor + Leave Type Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instructor">Instructor <span className="text-red-500">*</span></Label>
                    <Select 
                      value={editData.instructorId} 
                      onValueChange={(id) => {
                        const inst = state.instructors.find((i: any) => i.id === id)
                        const deriveContractType = (inst: any): string => {
                          if (!inst) return ""
                          const primary = inst.employmentType || inst.contractType
                          if (primary) return String(primary)
                          const alt = inst.employment_type || inst.contract_type || inst.empType || inst.employmentCategory || inst.contract || inst.type
                          return alt ? String(alt) : ""
                        }
                        setEditData((prev) => ({
                          ...prev,
                          instructorId: id,
                          instructorName: inst?.name || inst?.displayName || inst?.fullName || '',
                          jobLevel: inst?.jobLevel || '',
                          contractType: deriveContractType(inst) || '',
                        }))
                      }}
                    >
                      <SelectTrigger className="min-w-0">
                        <SelectValue placeholder="Select instructor" className="truncate" />
                      </SelectTrigger>
                      <SelectContent>
                        {state.instructors.slice(0, 100).map((inst: any) => (
                          <SelectItem key={inst.id} value={inst.id}>
                            {inst.displayName || inst.fullName || inst.name || inst.id}
                            {inst.displayCode && <span className="text-xs text-muted-foreground ml-1">({inst.displayCode})</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leaveType">Leave Type <span className="text-red-500">*</span></Label>
                    <LeaveTypeCombobox
                      value={editData.leaveType}
                      onChange={(value) => setEditData((prev) => ({
                        ...prev,
                        leaveType: value,
                        reason: prev.reason.trim() === '' || prev.reason === prev.leaveType ? value : prev.reason,
                      }))}
                    />
                  </div>
                </div>

                {/* Job Level + Contract Type (non-editable) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Job Level <span className="text-red-500">*</span></Label>
                    <div className="px-3 py-2 border rounded-md bg-muted/40 text-sm">
                      {editData.jobLevel || 'N/A'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Contract Type <span className="text-red-500">*</span></Label>
                    <div className="px-3 py-2 border rounded-md bg-muted/40 text-sm">
                      {editData.contractType || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Working days config + live day count */}
                {editData.startDate && editData.endDate && (
                  <div className="flex items-center justify-between rounded-md border p-3 text-sm bg-muted/30">
                    <span>
                      Working days in range: <strong>{computeWorkingDays(format(editData.startDate, 'yyyy-MM-dd'), format(editData.endDate, 'yyyy-MM-dd'))}</strong> 
                      (excludes {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].filter((_,i)=>!state.workingDays.includes(i)).join(', ')||'none'})
                    </span>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <span className="text-xs text-muted-foreground cursor-help">(Configured in Policies)</span>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-[28rem] p-0 overflow-hidden">
                        {(() => {
                          const names = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
                          const included = state.workingDays.map(d => names[d])
                          const excluded = names.filter((_,i)=>!state.workingDays.includes(i))
                          const includedCount = included.length
                          const pct = Math.round((includedCount / 7) * 100)
                          return (
                            <div className="flex flex-col">
                              <div className="relative p-4 bg-gradient-to-r from-purple-600 to-orange-500 text-white">
                                <div className="flex items-center gap-2">
                                  <div className="rounded-md bg-white/15 p-1.5">
                                    <CalendarDays className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold leading-tight">Working Days Policy</p>
                                    <p className="text-[11px] opacity-80">Controls how leave days are counted</p>
                                  </div>
                                </div>
                              </div>
                              <div className="p-4 space-y-4">
                                <div className="grid grid-cols-12 gap-3 items-center">
                                  <div className="col-span-12 sm:col-span-8">
                                    <div className="flex items-center justify-between text-xs font-medium mb-1">
                                      <span>{includedCount} of 7 days are working</span>
                                      <span className="text-muted-foreground">{pct}%</span>
                                    </div>
                                    <Progress value={pct} className="h-2" />
                                  </div>
                                  <div className="col-span-12 sm:col-span-4 flex items-center justify-start sm:justify-end gap-2 text-[11px] text-muted-foreground">
                                    <Info className="h-3.5 w-3.5" />
                                    <span>Configured in Policies</span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-xs font-medium mb-1">Included working days</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {included.length ? included.map(d => (
                                        <span key={d} className="px-2 py-0.5 rounded-full text-[11px] font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-sm">{d}</span>
                                      )) : <span className="text-xs text-muted-foreground">None</span>}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium mb-1">Excluded days</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {excluded.length ? excluded.map(d => (
                                        <Badge key={d} variant="outline" className="px-2 py-0.5 text-[11px]">{d}</Badge>
                                      )) : <span className="text-xs text-muted-foreground">None</span>}
                                    </div>
                                  </div>
                                </div>
                                <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                                  <li>Counting is inclusive of the Start and End date.</li>
                                  <li>Non-working days are skipped based on this policy.</li>
                                  <li>Update rules in <span className="font-medium">Policies ? Working Days</span>.</li>
                                </ul>
                              </div>
                            </div>
                          )
                        })()}
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <FormattedDateInput
                      id="edit-start-date"
                      label="Start Date"
                      value={editData.startDate ? format(editData.startDate, "yyyy-MM-dd") : ""}
                      onChange={(iso) =>
                        setEditData((prev) => {
                          const newStart = iso ? new Date(iso) : undefined
                          // Always mirror end date to start date whenever start changes
                          const newEnd = newStart
                          return { ...prev, startDate: newStart, endDate: newEnd }
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <FormattedDateInput
                      id="edit-end-date"
                      label="End Date"
                      value={editData.endDate ? format(editData.endDate, "yyyy-MM-dd") : ""}
                      onChange={(iso) => setEditData((prev) => ({ ...prev, endDate: iso ? new Date(iso) : undefined }))}
                      required
                      min={editData.startDate ? format(editData.startDate, "yyyy-MM-dd") : undefined}
                      error={!!(editData.startDate && editData.endDate && editData.endDate < editData.startDate)}
                    />
                    {editData.startDate && editData.endDate && editData.endDate < editData.startDate && (
                      <p className="text-xs text-red-600">End date cannot be before the start date.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="reason"
                    value={editData.reason}
                    onChange={(e) => setEditData((prev) => ({ ...prev, reason: e.target.value }))}
                    placeholder="Please provide a reason for your leave request"
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={attemptCloseEdit}>Cancel</Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={confirmEdit}
                        disabled={!isEditDirty}
                      >
                        Save Changes
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!isEditDirty && (
                    <TooltipContent side="top" className="bg-purple-600 text-white border-purple-600">
                      Please make any changes to update this request.
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Unsaved changes confirmation for Edit */}
        <AlertDialog open={unsavedEditOpen} onOpenChange={setUnsavedEditOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes in your leave request. What would you like to do?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUnsavedEditOpen(false)}>Continue Editing</AlertDialogCancel>
              <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => { setUnsavedEditOpen(false); setIsEditOpen(false); setSelectedForEdit(null) }}>
                Discard Changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Substitute Management Dialog */}
        <Dialog open={isSubstituteOpen} onOpenChange={setIsSubstituteOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Request Substitute ??</DialogTitle>
              <DialogDescription>
                AI-powered substitute recommendations based on availability and skills
              </DialogDescription>
            </DialogHeader>
            {/* Locked preview like Smart Notifications */}
            <div className="opacity-50 pointer-events-none select-none" aria-disabled="true">
              <div className="space-y-4 py-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Suggested Substitutes</h4>
                  {suggestedSubs.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-medium">{sub.name}</p>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-white">
                              <span>Availability: {sub.availability}</span>
                              <span>Skill Match: {sub.skillMatch}%</span>
                              <span>Workload: {sub.workload}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" disabled>
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Contact
                        </Button>
                        <Button size="sm" disabled>
                          <UserPlus className="h-4 w-4 mr-1" />
                          Assign
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSubstituteOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        instructor={selectedForDelete ? { instructorId: selectedForDelete.instructorId, name: selectedForDelete.instructorName } as any : null}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        title="Delete Leave Request"
        description="Are you sure you want to delete this leave request? This action cannot be undone."
        confirmLabel="Delete Request"
      />
    </Card>
  )
}

