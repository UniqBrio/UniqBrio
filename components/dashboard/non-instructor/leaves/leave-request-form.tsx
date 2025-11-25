"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/dashboard/ui/alert-dialog"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Label } from "@/components/dashboard/ui/label"
import { Textarea } from "@/components/dashboard/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { ChevronsUpDown, Check, ChevronDown, Save } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/dashboard/ui/hover-card"
import { Badge } from "@/components/dashboard/ui/badge"
import { Progress } from "@/components/dashboard/ui/progress"
import { CalendarDays, Info } from "lucide-react"
import { FormattedDateInput } from "@/components/dashboard/ui/formatted-date-input"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/dashboard/ui/command"
import { ScrollArea } from "@/components/dashboard/ui/scroll-area"
import { format, addDays } from "date-fns"
import { cn } from "@/lib/dashboard/staff/utils"
import { useLeave } from "@/contexts/dashboard/leave-context"
import type { LeaveRequest } from "@/types/dashboard/staff/leave"
import { crudSuccess } from "@/lib/dashboard/staff/crud-toast"
import { convertDraftToLeaveRequest, fetchDrafts, fetchLeaveRequests, fetchLeavePolicy, updateDraft } from "@/lib/dashboard/staff/api"
import { useCustomLeaveTypes } from "@/hooks/dashboard/staff/use-custom-leave-types"

// Normalize backend job level variations into standardized option labels
function normalizeLevelToOption(level?: string): string {
  if (!level) return ""
  const v = level.toLowerCase()
  if (v.includes("junior")) return "Junior Staff"
  if (v.includes("senior")) return "Senior Staff"
  if (v.includes("manager")) return "Manager"
  return ""
}

// Derive contract / employment type from possible backend field names
function deriveContractType(inst: any): string {
  if (!inst) return ""
  const primary = inst.employmentType || inst.contractType
  if (primary) return String(primary)
  const alt = inst.employment_type || inst.contract_type || inst.empType || inst.employmentCategory || inst.contract || inst.type
  return alt ? String(alt) : ""
}

interface LeaveRequestFormProps {
  onClose: () => void
  draft?: LeaveRequest // will be a DRAFT status object when provided
}

export default function LeaveRequestForm({ onClose, draft }: LeaveRequestFormProps) {
  const { state, dispatch } = useLeave()
  // No default instructor selection; user should choose explicitly
  const [formData, setFormData] = useState({
    instructorId: (draft?.instructorId || "") as string,
    instructorName: (draft?.instructorName || "") as string,
    leaveType: draft?.leaveType || "",
    // Default Start Date to today for new requests (reduces user effort)
    startDate: (draft?.startDate ? new Date(draft.startDate) : new Date()) as Date | undefined,
    // Default End Date to today for new requests as well
    endDate: (draft?.endDate ? new Date(draft.endDate) : new Date()) as Date | undefined,
    reason: draft?.reason || "",
    halfDay: (draft?.halfDay ?? null) as "AM" | "PM" | null,
  })
  // Static dropdowns (user must choose explicitly)
  // Auto-derived (non-editable) fields from selected instructor
  const initialInstructor = state.instructors.find((i) => i.id === (draft?.instructorId || ""))
  const [selectedJobLevel, setSelectedJobLevel] = useState<string>(draft?.jobLevel || (initialInstructor?.jobLevel || ""))
  const [contractType, setContractType] = useState<string>(deriveContractType(initialInstructor) || "")
  const [unsavedOpen, setUnsavedOpen] = useState(false)
  const [policy, setPolicy] = useState<any>(null)
  // Non-instructor: no post-create scheduling prompt (instructor-only feature)
  // Track whether we should reopen the drafts dialog after converting a draft (computed per-submit)
  // Note: we avoid relying on React state here to prevent races on immediate close

  // capture initial snapshot to detect dirty state
  const [initialSnapshot] = useState(() => ({
    instructorId: (draft?.instructorId || "") as string,
    instructorName: (draft?.instructorName || "") as string,
    leaveType: draft?.leaveType || "",
    // Keep snapshot in sync with default so the dialog isn't immediately "dirty"
    startDate: (draft?.startDate ? new Date(draft.startDate) : new Date()) as Date | undefined,
    endDate: (draft?.endDate ? new Date(draft.endDate) : new Date()) as Date | undefined,
    reason: draft?.reason || "",
    halfDay: (draft?.halfDay ?? null) as "AM" | "PM" | null,
    jobLevel: draft?.jobLevel ?? (() => {
      const inst = state.instructors.find((i) => i.id === (draft?.instructorId || ""))
      return inst?.jobLevel || ""
    })(),
  }))

  const isDirty =
    formData.instructorId !== initialSnapshot.instructorId ||
    formData.instructorName !== initialSnapshot.instructorName ||
    formData.leaveType !== initialSnapshot.leaveType ||
    formData.reason !== initialSnapshot.reason ||
    formData.halfDay !== initialSnapshot.halfDay ||
    selectedJobLevel !== initialSnapshot.jobLevel ||
    (formData.startDate?.getTime() || 0) !== (initialSnapshot.startDate?.getTime() || 0) ||
    (formData.endDate?.getTime() || 0) !== (initialSnapshot.endDate?.getTime() || 0)

  const attemptClose = () => {
    if (isDirty) {
      setUnsavedOpen(true)
      return
    }
    onClose()
  }

  const saveDraft = () => {
    const toYmd = (d?: Date) => (d ? format(d, "yyyy-MM-dd") : undefined)
    const draftData = {
      id: draft?.id || `draft_${Date.now()}`,
      instructorId: formData.instructorId,
      instructorName: formData.instructorName,
      leaveType: formData.leaveType || undefined,
      startDate: toYmd(formData.startDate),
      endDate: toYmd(formData.endDate),
      halfDay: formData.halfDay,
      reason: formData.reason || undefined,
      jobLevel: selectedJobLevel || undefined,
      title: `${formData.instructorName} - ${formData.leaveType || 'Draft'}`,
      createdAt: draft?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    if (draft?.id) {
      dispatch({ type: 'UPDATE_DRAFT', payload: { id: draft.id, updates: draftData } })
      crudSuccess('draft leave request', 'updated')
    } else {
      dispatch({ type: 'ADD_DRAFT', payload: draftData })
      crudSuccess('draft leave request', 'created')
    }
    setUnsavedOpen(false)
    onClose()
  }

  // (normalizeLevelToOption defined at top)

  // Prefill job level when the dialog opens (or when instructor preselected) using EXACT value from instructors
  useEffect(() => {
    const inst = state.instructors.find((i) => i.id === formData.instructorId)
    if (inst) {
      const current = inst.jobLevel || ""
      if (current !== selectedJobLevel) setSelectedJobLevel(current)
      // Keep the instructor name in sync when ID changes
      if (inst.name && inst.name !== formData.instructorName) {
        setFormData(prev => ({ ...prev, instructorName: inst.name }))
      }
  const derived = deriveContractType(inst)
  if (derived !== contractType) setContractType(derived)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.instructorId, state.instructors])

  // Fetch policy for estimator (contains dynamic roleAllocations)
  useEffect(() => {
    let mounted = true
    fetchLeavePolicy().then((res) => { if (mounted && res.ok) setPolicy((res as any).data) }).catch(()=>{})
    return () => { mounted = false }
  }, [])

  // Working days now managed globally in context (policy dialog)
  const workingDays = state.workingDays

  // Helper to count working days between two dates inclusive.
  function countWorkingDays(start: Date, end: Date): number {
    if (!start || !end) return 0
    if (end < start) return 0
    let count = 0
    const current = new Date(start)
    while (current <= end) {
      if (workingDays.includes(current.getDay())) count++
      current.setDate(current.getDate() + 1)
    }
    return count
  }

  // Helper to know if both dates are selected and are the same day
  const isSameDay = !!(formData.startDate && formData.endDate &&
    format(formData.startDate, "yyyy-MM-dd") === format(formData.endDate, "yyyy-MM-dd"))

  // Derived inline error for time ordering on same day
  // Time selection feature removed
  const timeError = ""

  // Registered date should match table format (dd-MMM-yyyy)
  const formatNiceDate = (d: Date) => format(d, 'dd-MMM-yyyy')

  // Compute Create button enabled/disabled state and tooltip text
  const workingDaysInRange = formData.startDate && formData.endDate
    ? countWorkingDays(formData.startDate, formData.endDate)
    : 0
  const hasOrderingError = !!(formData.startDate && formData.endDate && formData.endDate < formData.startDate)
  const hasMandatory = !!(
    formData.instructorId &&
    formData.instructorName &&
    formData.leaveType &&
    formData.startDate &&
    formData.endDate &&
    formData.reason.trim() &&
    selectedJobLevel
  )
  const submitDisabledReason = !hasMandatory
    ? "Please fill all mandatory fields."
    : hasOrderingError
      ? "End date cannot be before the start date."
      : workingDaysInRange <= 0
        ? "Selected range contains no working days based on current configuration."
        : ""
  const canSubmit = submitDisabledReason === ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Tracks whether we should auto-reopen the drafts dialog after closing this form
    let reopenAfterClose = false

    if (!formData.instructorId || !formData.instructorName || !formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason || !selectedJobLevel) {
      alert("Please fill in all required fields, including Job Level.")
      return
    }

    // Date range validation: end date must not be before start date
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      alert("End date cannot be before the start date.")
      return
    }

    // If either time is provided, both must be, and end must be after start for the same day
    // Preferred time inputs removed

    const days = countWorkingDays(formData.startDate, formData.endDate)
    if (days <= 0) {
      alert('Selected range contains no working days based on current configuration.')
      return
    }

    // --- Remaining balance calculation (client-side estimate; server recomputes) ---
    const instForAllocation = state.instructors.find(i => i.id === (formData.instructorId || state.currentUser?.id))
    const effectiveLevel = instForAllocation?.jobLevel || selectedJobLevel
    const label = String(effectiveLevel || '').trim()
    let allocation: number | undefined
    const allocs = policy?.allocations || { junior: 12, senior: 16, managers: 24 }
    const found = Object.keys(allocs).find(k => k.trim().toLowerCase() === label.toLowerCase())
    if (found) allocation = Number(allocs[found as any])
    if (allocation === undefined) {
      const v = label.toLowerCase()
      if (typeof allocs.junior === 'number' && v.includes('junior')) allocation = allocs.junior
      else if (typeof allocs.senior === 'number' && v.includes('senior')) allocation = allocs.senior
      else if (typeof allocs.managers === 'number' && v.includes('manager')) allocation = allocs.managers
    }

    // Period key (monthly) for usage aggregation (can adjust if you add other quota modes later)
    const periodKey = (() => {
      const d = formData.startDate!
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    })()
    const priorUsed = state.leaveRequests.filter(r => r.instructorId === formData.instructorId && r.status === 'APPROVED')
      .filter(r => r.startDate && r.startDate.startsWith(periodKey))
      .reduce((sum, r) => {
        if (!r.startDate || !r.endDate) return sum
        const s = new Date(r.startDate as string)
        const e = new Date(r.endDate as string)
        return sum + countWorkingDays(s, e)
      }, 0)
  const remainingAfter = allocation !== undefined ? Math.max(0, allocation - priorUsed - days) : 0
  const limitReached = allocation !== undefined ? (remainingAfter === 0) : false

    // Two paths: new submission or promotion of an existing draft.
    let requestInstructorId = formData.instructorId || state.currentUser?.id || 'unknown'
    if (draft?.id) {
      // Update the draft on the server FIRST with the latest form values (avoid stale conversion)
      const updatedDraftData = {
        id: draft.id,
        instructorId: formData.instructorId,
        instructorName: formData.instructorName,
        leaveType: formData.leaveType,
        jobLevel: selectedJobLevel,
        startDate: format(formData.startDate, 'yyyy-MM-dd'),
        endDate: format(formData.endDate, 'yyyy-MM-dd'),
        halfDay: formData.halfDay,
        reason: formData.reason,
        title: `${formData.instructorName} - ${formData.leaveType || 'Draft'}`,
        updatedAt: new Date().toISOString(),
      }
      try {
        // Persist update and wait for completion to ensure convert uses latest
        await updateDraft(updatedDraftData)
      } catch (err) {
        console.error('Failed to update draft before conversion', err)
        alert('Failed to update draft before conversion')
        return
      }

      // Optimistically update local state as well
      dispatch({ type: 'UPDATE_DRAFT', payload: { id: draft.id, updates: updatedDraftData } })

      // Then convert the draft to an approved leave request
      try {
        const result = await convertDraftToLeaveRequest(draft.id, 'APPROVED')
        if (result.ok) {
          crudSuccess('leave request', 'created from draft')
          // Refresh both drafts and leave requests to reflect server truth
          const [draftsRes, requestsRes] = await Promise.all([fetchDrafts(), fetchLeaveRequests()])
          if (draftsRes.ok) {
            dispatch({ type: 'SET_DRAFTS', payload: draftsRes.data })
            try { reopenAfterClose = Array.isArray((draftsRes as any).data) && (draftsRes as any).data.length > 0 } catch { reopenAfterClose = false }
          }
          if (requestsRes.ok) dispatch({ type: 'SET_LEAVE_REQUESTS', payload: requestsRes.data })
        } else {
          alert('Failed to submit draft: ' + (result.error || 'Unknown error'))
          return
        }
      } catch (err) {
        console.error('Error converting draft:', err)
        alert('Failed to submit draft')
        return
      }
      requestInstructorId = formData.instructorId
    } else {
      const newRequest: LeaveRequest = {
        id: `l${Date.now()}`,
        instructorId: formData.instructorId || state.currentUser?.id || 'unknown',
        instructorName: formData.instructorName || state.currentUser?.name || 'Unknown',
        leaveType: formData.leaveType as any,
        jobLevel: selectedJobLevel,
        startDate: format(formData.startDate, 'yyyy-MM-dd'),
        endDate: format(formData.endDate, 'yyyy-MM-dd'),
        days,
        halfDay: formData.halfDay,
        reason: formData.reason,
        status: 'APPROVED',
        submittedAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
  registeredDate: formatNiceDate(new Date()),
        carriedOver: 0,
        balance: remainingAfter,
        prorated: 'Full',
        limitReached,
      }
      dispatch({ type: 'ADD_LEAVE_REQUEST', payload: newRequest })
      crudSuccess('leave request', 'created')
      requestInstructorId = newRequest.instructorId
    }
    const inst2 = state.instructors.find(i => i.id === requestInstructorId)
    if (inst2 && selectedJobLevel && inst2.jobLevel !== selectedJobLevel) {
      dispatch({ type: 'UPDATE_INSTRUCTOR', payload: { id: inst2.id, updates: { jobLevel: selectedJobLevel } } })
    }
    // After creating the leave request, auto-create planned attendance entries for today/future dates in range
    try {
      const startYmd = format(formData.startDate as Date, 'yyyy-MM-dd')
      const endYmd = format(formData.endDate as Date, 'yyyy-MM-dd')
      const todayYmd = format(new Date(), 'yyyy-MM-dd')
      let cur = new Date(startYmd)
      const end = new Date(endYmd)
      const tasks: Promise<any>[] = []
      while (cur <= end) {
        const ymd = format(cur, 'yyyy-MM-dd')
        if (ymd >= todayYmd) {
          const bestName = (inst2?.displayName || inst2?.fullName || inst2?.name || inst2?.externalId || inst2?.instructorId || formData.instructorName || requestInstructorId).toString()
          tasks.push(
            fetch('/api/dashboard/staff/non-instructor/attendance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                instructorId: requestInstructorId,
                instructorName: bestName,
                date: ymd,
                status: 'planned',
                notes: 'Planned leave',
              }),
            }).then(async (res) => {
              if (!res.ok && res.status !== 409) {
                const msg = await res.text().catch(() => '')
                console.warn('Planned attendance create failed', ymd, res.status, msg)
              }
            }).catch(err => console.warn('Planned attendance create error', ymd, err))
          )
        }
        cur = addDays(cur, 1)
      }
      if (tasks.length) await Promise.allSettled(tasks)
    } catch (e) {
      console.warn('Auto-create planned attendance failed', e)
    }

    // Notify other screens (like Attendance Management) to refresh
    try {
      if (typeof window !== 'undefined') {
        const ts = Date.now().toString()
        localStorage.setItem('ni_attendance_updated', ts)
        window.dispatchEvent(new CustomEvent('ni_attendance_updated', { detail: { ts } }))
      }
    } catch {}

  // Close the form
  onClose()
  // If more drafts remain, reopen the drafts dialog automatically
  try { if (reopenAfterClose && typeof window !== 'undefined') window.dispatchEvent(new Event('non-instructor-leave-drafts:open')) } catch {}
  }

  return (
    <>
    <Dialog open={true} onOpenChange={(open) => { if (!open) attemptClose() }}>
  <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Leave Request</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Instructor + Leave Type Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instructor">Non-Instructor <span className="text-red-500">*</span></Label>
              <InstructorCombobox
                value={formData.instructorId}
                onChange={(id) => {
                  const inst = state.instructors.find((i) => i.id === id)
                  setFormData((prev) => ({
                    ...prev,
                    instructorId: id,
                    instructorName: (inst?.displayName || inst?.fullName || inst?.name || inst?.externalId || inst?.instructorId || id || "").trim(),
                  }))
                  const normalized = normalizeLevelToOption(inst?.jobLevel)
                  setSelectedJobLevel(normalized)
                  setContractType(deriveContractType(inst) || "")
                }}
                instructors={state.instructors.slice(0, 500).map((inst) => ({
                  id: inst.id,
                  name: inst.displayName || inst.fullName || inst.name || inst.externalId || inst.instructorId || inst.id,
                  code: inst.displayCode || inst.externalId || inst.instructorId || inst.id,
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type <span className="text-red-500">*</span></Label>
              <LeaveTypeCombobox
                value={formData.leaveType}
                onChange={(value) => setFormData((prev) => {
                  const shouldOverwrite = prev.reason.trim() === '' || prev.reason === prev.leaveType
                  return { ...prev, leaveType: value, reason: shouldOverwrite ? value : prev.reason }
                })}
              />
            </div>
          </div>

          {/* Job Level + Contract Type (non-editable) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Job Level <span className="text-red-500">*</span></Label>
              <Input value={selectedJobLevel || ''} readOnly disabled className="bg-muted/40" />
            </div>
            <div className="space-y-2">
              <Label>Employee Type <span className="text-red-500">*</span></Label>
              <Input value={contractType || 'N/A'} readOnly disabled className="bg-muted/40" />
            </div>
          </div>

          {/* Working days config + live day count */}
          {formData.startDate && formData.endDate && (
            <div className="flex items-center justify-between rounded-md border p-3 text-sm bg-muted/30">
              <span>
                Working days in range: <strong>{countWorkingDays(formData.startDate, formData.endDate)}</strong> (excludes {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].filter((_,i)=>!workingDays.includes(i)).join(', ')||'none'})
              </span>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <span className="text-xs text-muted-foreground cursor-help">(Configured in Policies)</span>
                </HoverCardTrigger>
                <HoverCardContent className="w-[28rem] p-0 overflow-hidden">
                  {(() => {
                    const names = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
                    const included = workingDays.map(d => names[d])
                    const excluded = names.filter((_,i)=>!workingDays.includes(i))
                    const includedCount = included.length
                    const pct = Math.round((includedCount / 7) * 100)
                    return (
                      <div className="flex flex-col">
                        {/* Header */}
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
                        {/* Body */}
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
                                  <span key={d} className="px-2 py-0.5 rounded-full text-[11px] font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-sm">
                                    {d}
                                  </span>
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

                          {/* Footer text removed per request */}
                        </div>
                      </div>
                    )
                  })()}
                </HoverCardContent>
              </HoverCard>
            </div>
          )}

          {/* Leave Type moved beside instructor */}
          {/* Removed documents upload and preferred time inputs */}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <FormattedDateInput
                id="startDate"
                label={"Start Date"}
                value={formData.startDate ? format(formData.startDate, "yyyy-MM-dd") : ""}
                onChange={(iso) =>
                  setFormData((prev) => {
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
                id="endDate"
                label={"End Date"}
                value={formData.endDate ? format(formData.endDate, "yyyy-MM-dd") : ""}
                onChange={(iso) =>
                  setFormData((prev) => ({ ...prev, endDate: iso ? new Date(iso) : undefined }))
                }
                required
                min={formData.startDate ? format(formData.startDate, "yyyy-MM-dd") : undefined}
                error={!!(formData.startDate && formData.endDate && formData.endDate < formData.startDate)}
              />
              {formData.startDate && formData.endDate && formData.endDate < formData.startDate && (
                <p className="text-xs text-red-600">End date cannot be before the start date.</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Reason <span className="text-red-500">*</span></Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="Please provide a reason for your leave request"
              rows={3}
            />
          </div>

          {/* Suggested substitute removed */}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={attemptClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-purple-600 text-purple-600 hover:bg-purple-50"
              onClick={saveDraft}
              disabled={!formData.instructorId}
              title={!formData.instructorId ? "Select a non-instructor to enable Save Draft" : undefined}
            >
              <Save className="mr-2 h-4 w-4" />
              {draft ? 'Update Draft' : 'Save Draft'}
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={!canSubmit}>
                      Create Request
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canSubmit && (
                  <TooltipContent side="top" className="bg-purple-600 text-white border-purple-600">
                    {submitDisabledReason}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </form>
      </DialogContent>
  </Dialog>
    {/* Unsaved changes confirmation */}
    <AlertDialog open={unsavedOpen} onOpenChange={setUnsavedOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes in your leave request. What would you like to do?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setUnsavedOpen(false)}>Continue Editing</AlertDialogCancel>
          <AlertDialogAction className="border border-purple-600 text-purple-600 bg-transparent hover:bg-purple-50" onClick={saveDraft} disabled={!formData.instructorId}>
            {draft ? 'Update Draft' : 'Save as Draft'}
          </AlertDialogAction>
          <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => { setUnsavedOpen(false); onClose() }}>
            Discard Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    {/* Non-instructor: scheduling prompt removed (instructor-only feature) */}
    {/* Working days configuration dialog removed (now in policy dialog) */}
    </>
  )
}

// Local component: searchable instructor combobox (name + code) supporting search by either
interface InstructorOption {
  id: string
  name: string
  code: string
}

function InstructorCombobox({
  value,
  onChange,
  instructors,
}: {
  value: string
  onChange: (id: string) => void
  instructors: InstructorOption[]
}) {
  const [open, setOpen] = useState(false)
  const selected = instructors.find((i) => i.id === value)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between min-w-0"
        >
          <span className="flex-1 truncate text-left">
            {selected ? `${selected.name}${selected.code ? ` (${selected.code})` : ''}` : "Select any non-instructor"}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command
          filter={(value, search) => {
            const option = instructors.find((i) => i.id === value)
            if (!option) return 0
            const hay = `${option.name || ''} ${option.code || ''}`.toLowerCase()
            return hay.includes((search || '').toLowerCase()) ? 1 : 0
          }}
        >
          <CommandInput placeholder="Search name or ID..." />
          {/* Limit visible options to ~5 rows and enable native scrolling on wheel and two-finger trackpad */}
          <CommandList
            className="max-h-[220px] overflow-y-auto scroll-smooth touch-pan-y"
            style={{ scrollBehavior: 'smooth', overflowY: 'auto' }}
            onWheel={(e) => {
              // Prevent the popover/dialog from hijacking the wheel event so two-finger scroll works
              e.stopPropagation()
            }}
          >
              <CommandEmpty>No non-instructor found.</CommandEmpty>
              <CommandGroup>
                {instructors.map((inst) => (
                  <CommandItem
                    key={inst.id}
                    value={inst.id}
                    onSelect={() => {
                      onChange(inst.id)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        inst.id === value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="flex-1 text-left">
                      {inst.name}
                      {inst.code ? (
                        <span className="text-xs text-muted-foreground"> ({inst.code})</span>
                      ) : null}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Leave Type combobox with search, scroll, and "add custom" behavior
function LeaveTypeCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { getAllLeaveTypes, addCustomLeaveType, loading } = useCustomLeaveTypes()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const options = getAllLeaveTypes()
  const selected = options.find(o => o.value === value)

  const filtered = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
  const exists = options.some(o => o.label.toLowerCase() === query.trim().toLowerCase())

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery("") }}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          <span className="truncate">
            {selected ? selected.label : "Select leave type"}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search or add leave types..." value={query} onValueChange={setQuery}
            onKeyDown={async (e: React.KeyboardEvent<HTMLInputElement>) => {
              const q = query.trim()
              if (e.key === 'Enter' && q && !exists) {
                const created = await addCustomLeaveType(q)
                if (created) { onChange(created); setOpen(false); setQuery("") }
              }
            }}
            className="h-9"
          />
          {/* Use ScrollArea to show a visible scrollbar and allow wheel/two-finger scrolling */}
          <ScrollArea type="always" className="max-h-[260px]">
            <CommandList className="max-h-[260px]" style={{ scrollBehavior: 'smooth' }}>
              {loading ? (
                <div className="px-2 py-1 text-sm text-gray-500 dark:text-white">Loading leave types...</div>
              ) : (
                <>
                  <CommandEmpty>No leave type found.</CommandEmpty>
                  {/* Inline add new */}
                  {(() => {
                    const q = query.trim()
                    if (!q || exists) return null
                    return (
                      <CommandItem
                        onSelect={async () => {
                          const created = await addCustomLeaveType(q)
                          if (created) { onChange(created); setOpen(false); setQuery("") }
                        }}
                        className="text-blue-600 font-medium"
                      >
                        <div className="mr-2 h-4 w-4 rounded border-2 border-blue-600 flex items-center justify-center text-xs">+</div>
                        Add "{q}" as new leave type
                      </CommandItem>
                    )
                  })()}
                  <CommandGroup>
                    {filtered.map(opt => (
                      <CommandItem key={opt.value} value={opt.value} onSelect={() => { onChange(opt.value); setOpen(false) }}>
                        <Check className={cn("mr-2 h-4 w-4", value === opt.value ? "opacity-100" : "opacity-0")} />
                        <span className="flex-1">{opt.label}</span>
                        {/* Deletion removed per request */}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
