"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/dashboard/ui/card"
import { Button } from "@/components/dashboard/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import { Trash2, Pencil, Calendar as CalendarIcon } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/dashboard/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { Calendar } from "@/components/dashboard/ui/calendar"
import { Textarea } from "@/components/dashboard/ui/textarea"
import { Label } from "@/components/dashboard/ui/label"
import { cn } from "@/lib/dashboard/staff/utils"
import LeaveTypeCombobox from "./leave-type-combobox"
import { useLeave } from "@/contexts/dashboard/leave-context"
import { crudSuccess } from "@/lib/dashboard/staff/crud-toast"
import DeleteConfirmationDialog from "./delete-confirmation-dialog"
import type { DateRange } from "react-day-picker"
import type { LeaveRequest } from "@/types/dashboard/staff/staff/leave"
import type { LeavePolicy } from "./leave-policy-dialog"
import LeaveRequestDetailsDialog from "./leave-request-details-dialog"

type SortBy = "instructorName" | "instructorId" | "leaveType" | "startDate" | "endDate" | "status" | "days"

interface Filters {
  leaveTypes?: string[]
  branch?: string
  jobLevels?: string[]
  dateRange?: DateRange
  staffTypes?: string[]
}

interface LeaveGridProps {
  searchQuery: string
  filters?: Filters
  sortBy?: SortBy
  sortOrder?: "asc" | "desc"
  policy?: LeavePolicy
}

export default function LeaveGrid({ searchQuery, filters, sortBy = "startDate", sortOrder = "asc", policy }: LeaveGridProps) {
  const { state, dispatch } = useLeave()

  const getInstructorInfo = (instructorId: string) => state.instructors.find((i) => i.id === instructorId)

  const parseISO = (s: string) => new Date(s)
  const parseLocalDate = (s: string) => {
    const [y, m, d] = s.split("-").map(Number)
    return new Date(y, (m || 1) - 1, d || 1)
  }
  const formatDisplayDate = (s: string) => {
    try {
      const d = parseLocalDate(s)
      if (isNaN(d.getTime())) return s
      return format(d, "dd-MMM-yyyy")
    } catch {
      return s
    }
  }
  const computeWorkingDays = (start?: string, end?: string) => {
    if (!start || !end) return 0
    try {
      const s = parseLocalDate(start)
      const e = parseLocalDate(end)
      if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0
      let count = 0
      const cur = new Date(s)
  const working = Array.isArray(state.workingDays) && state.workingDays.length ? state.workingDays : [1,2,3,4,5,6]
      while (cur <= e) {
        if (working.includes(cur.getDay())) count++
        cur.setDate(cur.getDate() + 1)
      }
      return count
    } catch { return 0 }
  }



  const statusRank: Record<string, number> = { APPROVED: 1 }
  const cmp = (a: any, b: any) => (a < b ? -1 : a > b ? 1 : 0)
  const getKey = (req: LeaveRequest) => {
    switch (sortBy) {
      case "instructorName":
        return req.instructorName?.toLowerCase() ?? ""
      case "instructorId":
        // Format instructor ID for sorting (e.g., INSTR0001)
        const formatInstructorId = (raw: string) => {
          const m = raw.match(/(\d+)/)
          if (m) {
            const num = parseInt(m[1], 10)
            if (!isNaN(num)) return `INSTR${num.toString().padStart(4, '0')}`
          }
          const instr = raw.match(/^instr(\d+)$/i)
          if (instr) {
            return `INSTR${parseInt(instr[1], 10).toString().padStart(4, '0')}`
          }
          return raw.toUpperCase()
        }
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
        return computeWorkingDays(req.startDate, req.endDate)
      default:
        return 0
    }
  }

  const filteredSorted = useMemo(() => {
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
      if (!filters?.leaveTypes || filters.leaveTypes.length === 0) return true
      return filters.leaveTypes.includes(r.leaveType || '')
    }

    const inBranch = (r: LeaveRequest) => {
      if (!filters?.branch || filters.branch === "all") return true
      const instructor = getInstructorInfo(r.instructorId)
      return instructor?.department === filters.branch
    }

    const inStaffType = (r: LeaveRequest) => {
      if (!filters?.staffTypes || filters.staffTypes.length === 0) return true
      const instructor = getInstructorInfo(r.instructorId)
      const contractType = (instructor?.contractType || instructor?.employmentType || "").toLowerCase()
      
      return filters.staffTypes.some(v => {
        if (v === "full-time") return contractType.includes("full") || contractType.includes("permanent")
        if (v === "part-time") return contractType.includes("part")
        if (v === "guest-faculty") return contractType.includes("guest")
        if (v === "temporary") return contractType.includes("temporary")
        return false
      })
    }

    const inJobLevels = (r: LeaveRequest) => {
      const selected = filters?.jobLevels || []
      if (!selected.length) return true
      const instructor = getInstructorInfo(r.instructorId)
      const level = (instructor?.jobLevel || '').toLowerCase()
      return selected.some(sel => sel.toLowerCase() === level)
    }

    const inDateRange = (r: LeaveRequest) => {
      const from = filters?.dateRange?.from
      const to = filters?.dateRange?.to
      if (!from && !to) return true
      if (!r.startDate || !r.endDate) return false
      const start = parseLocalDate(r.startDate)
      const end = parseLocalDate(r.endDate)
      if (from && to) return start <= to && end >= from
      if (from) return end >= from
      if (to) return start <= to
      return true
    }

  const arr = state.leaveRequests.filter((r) => inSearch(r) && inLeaveType(r) && inBranch(r) && inJobLevels(r) && inDateRange(r) && inStaffType(r))
    const sorted = arr.slice().sort((a, b) => {
      const va = getKey(a)
      const vb = getKey(b)
      const res = cmp(va, vb)
      return sortOrder === "asc" ? res : -res
    })
    return sorted
  }, [state.leaveRequests, searchQuery, JSON.stringify(filters), sortBy, sortOrder])

  // -------- Quota logic (same as table) ---------
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
    const y = d.getFullYear()
    const m = d.getMonth()
    const quotaType = policy?.quotaType || 'Monthly Quota'
    if (quotaType === 'Yearly Quota') return `${y}`
    if (quotaType === 'Quarterly Quota') {
      const q = Math.floor(m / 3) + 1
      return `${y}-Q${q}`
    }
    return `${y}-${String(m + 1).padStart(2,'0')}`
  }

  const usage = useMemo(() => {
    const result: Record<string, Record<string, number>> = {}
    state.leaveRequests.forEach(r => {
      if (r.status !== 'APPROVED') return
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
     const found = Object.keys(allocs).find(k => k.trim().toLowerCase() === label.toLowerCase())
     if (found) return allocs[found]
     const key = mapLevelKey(label)
     if (key && typeof (allocs as any)[key] === 'number') return (allocs as any)[key]
     return undefined
 }, [policy, state.instructors])
  
  const usageForInstructor = useMemo(() => (instructorId: string, anyDate: string) => {
    const period = currentPeriodKey(anyDate)
    return usage[instructorId]?.[period] || 0
  }, [usage])

  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
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
  // snapshot for dirty check
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
    try { return JSON.stringify(toComparable(editData)) !== initialEditComparable } catch { return true }
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
    const instructor = state.instructors.find(i => i.id === req.instructorId)
    const deriveContractType = (inst: any): string => {
      if (!inst) return ""
      const primary = inst.employmentType || inst.contractType
      if (primary) return String(primary)
      const alt = inst.employment_type || inst.contract_type || inst.empType || inst.employmentCategory || inst.contract || inst.type
      return alt ? String(alt) : ""
    }
    
    const initialData = {
      instructorId: req.instructorId,
      instructorName: req.instructorName || instructor?.name || '',
      leaveType: req.leaveType || '',
      jobLevel: req.jobLevel || instructor?.jobLevel || '',
      contractType: deriveContractType(instructor) || '',
      startDate: req.startDate ? new Date(req.startDate) : new Date(),
      endDate: req.endDate ? new Date(req.endDate) : new Date(),
      reason: req.reason || '',
    }
    setEditData(initialData)
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
    const instructor = state.instructors.find(i => i.id === editData.instructorId)
    if (instructor && editData.jobLevel && instructor.jobLevel !== editData.jobLevel) {
      dispatch({ type: 'UPDATE_INSTRUCTOR', payload: { id: instructor.id, updates: { jobLevel: editData.jobLevel } } })
    }
    
    crudSuccess('leave request', 'updated')
    setIsEditOpen(false)
    setSelectedForEdit(null)
  }

  const statusPill = (_status: string) => (
    <span className="text-xs px-3 py-1 rounded-full border bg-green-100 text-green-700 border-green-200">
      Approved
    </span>
  )

  return (
    <>
      {/* Horizontal scroll container */}
      <div className="overflow-x-auto pb-2">
  <div className="flex gap-5 pr-2 snap-x">
        {filteredSorted.map((req) => {
          const instructor = getInstructorInfo(req.instructorId)
          return (
            <Card
              key={req.id}
              className="overflow-hidden border-2 border-orange-400 rounded-2xl shadow-sm shrink-0 w-[360px] snap-start cursor-pointer hover:shadow-md transition-all duration-200 hover:border-orange-500"
              onClick={() => { setSelectedRequest(req); setIsViewOpen(true) }}
            >
              <CardContent className="p-5 min-h-[260px]">
                {/* Header: Name + status + edit icon */}
                <div className="flex items-start justify-between">
                  <div className="font-semibold text-lg leading-snug">{req.instructorName}</div>
                  <div className="flex items-center gap-2">
                    {statusPill(req.status)}
                    <button
                      type="button"
                      className="p-1.5 rounded hover:bg-gray-50"
                      title="Edit"
                      aria-label="Edit"
                      onClick={(e) => { e.stopPropagation(); openEdit(req) }}
                    >
                      <Pencil className="w-4 h-4 text-purple-600" />
                    </button>
                  </div>
                </div>

                {/* Badges row: Contract Type only */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {instructor?.employmentType && (
                    <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">{instructor?.contractType || instructor?.employmentType || 'N/A'}</span>
                  )}
                </div>

                {/* Details: compact one-line rows */}
                <div className="mt-4 space-y-1.5 text-sm">
                  <div className="flex items-baseline gap-1">
                    <span className="text-gray-500 dark:text-white">Job Level:</span>
                    <span className="font-medium">{req.jobLevel || instructor?.jobLevel || "N/A"}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-gray-500 dark:text-white">Contract Type:</span>
                    <span className="font-medium">{req.contractType || req.employmentType || instructor?.contractType || instructor?.employmentType || 'N/A'}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-gray-500 dark:text-white">Leave Type:</span>
                    <span className="font-medium">{req.leaveType}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-gray-500 dark:text-white">Dates:</span>
                    <span className="font-medium">{req.startDate === req.endDate ? (req.startDate ? formatDisplayDate(req.startDate) : '?') : `${req.startDate ? formatDisplayDate(req.startDate) : '?'} - ${req.endDate ? formatDisplayDate(req.endDate) : '?'}`}</span>
                  </div>
                  {req.registeredDate && (
                  <div className="flex items-baseline gap-1">
                    <span className="text-gray-500 dark:text-white">Approved Date:</span>
                    <span className="font-medium">{formatDisplayDate(req.registeredDate)}</span>
                  </div>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className="text-gray-500 dark:text-white">No. of days:</span>
                    <span className="font-medium">{computeWorkingDays(req.startDate, req.endDate)} days</span>
                  </div>
                  {(() => {
                    const computedLimit = limitForInstructor(req.instructorId)
                    const computedUsed = req.startDate ? usageForInstructor(req.instructorId, req.startDate) : 0
                    const limit = req.allocationTotal ?? computedLimit
                    const used = req.allocationUsed ?? computedUsed
                    const reached = limit !== undefined && used !== undefined && used >= limit
                    const remaining = limit !== undefined && used !== undefined
                      ? Math.max(0, limit - used)
                      : (req.balance !== undefined ? req.balance : (computedLimit !== undefined ? Math.max(0, computedLimit - computedUsed) : undefined))
                    return (
                      <div className="flex items-baseline gap-2">
                        <span className="text-gray-500 dark:text-white">Assigned leaves:</span>
                        {limit !== undefined && used !== undefined ? (
                          <div className="leading-tight text-sm font-medium">{used}/{limit}</div>
                        ) : (
                          <span className="font-medium text-muted-foreground">?</span>
                        )}
                        {reached && <span className="ml-2 text-[10px] font-semibold text-red-600">Limit Reached</span>}
                      </div>
                    )
                  })()}

                </div>

                {/* Footer actions */}
                <div className="mt-4 flex items-center justify-end">
                  <button
                    type="button"
                    className="p-1.5 rounded hover:bg-red-50"
                    title="Delete"
                    aria-label="Delete"
                    onClick={(e) => { e.stopPropagation(); openDelete(req) }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </CardContent>
            </Card>
          )
        })}
        </div>
      </div>

      <LeaveRequestDetailsDialog request={selectedRequest} open={isViewOpen} onOpenChange={setIsViewOpen} policy={policy} />
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
                      const inst = state.instructors.find((i) => i.id === id)
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
                      {state.instructors.slice(0, 100).map((inst) => (
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
                  <span className="text-xs text-muted-foreground">(Configured in Policies)</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date <span className="text-red-500">*</span></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editData.startDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editData.startDate ? format(editData.startDate, "dd-MMM-yyyy") : "dd-mmm-yyyy"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editData.startDate}
                        onSelect={(date) => setEditData((prev) => ({
                          ...prev,
                          startDate: date,
                          endDate: date || prev.endDate
                        }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End Date <span className="text-red-500">*</span></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editData.endDate && "text-muted-foreground",
                          editData.startDate && editData.endDate && editData.endDate < editData.startDate && "border-red-500 focus-visible:ring-red-500",
                        )}
                        aria-invalid={!!(editData.startDate && editData.endDate && editData.endDate < editData.startDate)}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editData.endDate ? format(editData.endDate, "dd-MMM-yyyy") : "dd-mmm-yyyy"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editData.endDate}
                        onSelect={(date) => setEditData((prev) => ({ ...prev, endDate: date }))}
                        disabled={editData.startDate ? { before: editData.startDate } : undefined}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
    </>
  )
}

// Moved from components/Grid reference.tsx
interface GridListToggleProps {
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
}

export const GridListToggle: React.FC<GridListToggleProps> = ({
  viewMode,
  setViewMode,
}) => (
  <TooltipProvider>
    <div className="flex border rounded-md overflow-hidden">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`flex items-center justify-center w-9 h-9 transition-colors ${
              viewMode === "list"
                ? "bg-purple-500 text-white"
                : "bg-white text-black hover:bg-gray-100"
            } rounded-l-md focus:outline-none`}
            aria-pressed={viewMode === "list"}
            onClick={() => setViewMode("list")}
          >
            <div className="flex flex-col gap-0.5 w-4 h-4 justify-center">
              <div className="bg-current h-0.5 w-full rounded-sm" />
              <div className="bg-current h-0.5 w-full rounded-sm" />
              <div className="bg-current h-0.5 w-full rounded-sm" />
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">List view</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`flex items-center justify-center w-9 h-9 transition-colors border-l ${
              viewMode === "grid"
                ? "bg-purple-500 text-white"
                : "bg-white text-black hover:bg-gray-100"
            } rounded-r-md focus:outline-none`}
            aria-pressed={viewMode === "grid"}
            onClick={() => setViewMode("grid")}
          >
            <div className="grid grid-cols-2 gap-1 w-4 h-4">
              <div className="bg-current rounded-sm w-1.5 h-1.5" />
              <div className="bg-current rounded-sm w-1.5 h-1.5" />
              <div className="bg-current rounded-sm w-1.5 h-1.5" />
              <div className="bg-current rounded-sm w-1.5 h-1.5" />
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Grid view</TooltipContent>
      </Tooltip>
    </div>
  </TooltipProvider>
)
