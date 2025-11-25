"use client"

import React, { useMemo } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/dashboard/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useLeave } from "@/contexts/dashboard/leave-context"
import type { LeaveRequest } from "@/types/dashboard/staff/staff/leave"
import type { LeavePolicy } from "./leave-policy-dialog"
import { Badge } from "@/components/dashboard/ui/badge"
import { Calendar, Clock, Hash, Layers, Briefcase, FileText, CheckCircle2 } from "lucide-react"

interface LeaveRequestDetailsDialogProps {
  request: LeaveRequest | null
  open: boolean
  onOpenChange: (open: boolean) => void
  policy?: LeavePolicy
}

// Helpers reused from leave table/grid for consistent formatting
function parseLocalDate(s?: string) {
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
    const monthName = m[2].slice(0, 3).toLowerCase()
    const year = Number(m[3])
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
    const mi = months.indexOf(monthName)
    if (mi >= 0) return new Date(year, mi, day)
  }
  // Ordinal like 16th Oct 2025
  m = s.match(/^(\d{1,2})(st|nd|rd|th)\s+([A-Za-z]{3,})\s+(\d{4})$/i)
  if (m) {
    const day = Number(m[1])
    const monthName = m[3].slice(0, 3).toLowerCase()
    const year = Number(m[4])
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
    const mi = months.indexOf(monthName)
    if (mi >= 0) return new Date(year, mi, day)
  }
  return new Date(s)
}

function formatDisplayDate(s?: string) {
  if (!s) return "?"
  try {
    const d = parseLocalDate(s)
    if (isNaN(d.getTime())) return s
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-")
  } catch {
    return s
  }
}

function safe(v: any, fallback = "N/A") {
  if (v === null || v === undefined || v === "") return fallback
  return String(v)
}

function formatInstructorId(raw?: string) {
  if (!raw) return "N/A"
  const m = raw.match(/(\d+)/)
  if (m) {
    const num = parseInt(m[1], 10)
  if (!isNaN(num)) return `NON INS${num.toString().padStart(4, '0')}`
  }
  const instr = raw.match(/^instr(\d+)$/i)
  if (instr) return `NON INS${parseInt(instr[1], 10).toString().padStart(4, '0')}`
  // Also normalize if already in INSTR#### form to NON INS####
  const already = raw.match(/^INSTR(\d+)$/)
  if (already) return `NON INS${parseInt(already[1], 10).toString().padStart(4, '0')}`
  return raw.toUpperCase()
}

function normalizeContractType(raw?: string) {
  if (!raw) return "N/A"
  const v = raw.toLowerCase()
  if (v.includes("full")) return "Full-time"
  if (v.includes("part")) return "Part-time"
  if (v.includes("guest")) return "Guest Faculty"
  if (v.includes("temp")) return "Temporary"
  if (v.includes("contract")) return "Contract"
  if (v.includes("permanent")) return "Full-time"
  return raw
}

export default function LeaveRequestDetailsDialog({ request, open, onOpenChange, policy }: LeaveRequestDetailsDialogProps) {
  const { state } = useLeave()
  const instructors = state.instructors

  const workingDays = Array.isArray(state.workingDays) && state.workingDays.length ? state.workingDays : [1,2,3,4,5,6]

  const computeWorkingDays = (start?: string, end?: string) => {
    if (!start || !end) return 0
    try {
      const s = parseLocalDate(start)
      const e = parseLocalDate(end)
      if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0
      let count = 0
      const cur = new Date(s)
      while (cur <= e) { if (workingDays.includes(cur.getDay())) count++; cur.setDate(cur.getDate() + 1) }
      return count
    } catch { return 0 }
  }

  // Quota helpers for Assigned leaves
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
  const usageByPeriod = useMemo(() => {
    const result: Record<string, Record<string, number>> = {}
    state.leaveRequests.forEach(r => {
      if (r.status !== 'APPROVED' || !r.startDate || !r.endDate) return
      const period = getPeriodKey(r.startDate)
      if (!result[r.instructorId]) result[r.instructorId] = {}
      result[r.instructorId][period] = (result[r.instructorId][period] || 0) + computeWorkingDays(r.startDate, r.endDate)
    })
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.leaveRequests, policy?.quotaType])

  const usageFor = (instructorId: string, anyDate?: string) => (anyDate ? usageByPeriod[instructorId]?.[getPeriodKey(anyDate)] : 0) || 0
  const limitFor = (instructorId: string, fallbackLabel?: string) => {
    if (!policy) return undefined
    const inst = instructors.find(i => i.id === instructorId)
    const label = String(inst?.jobLevel || fallbackLabel || '').trim()
    const allocs: Record<string, number> = (policy as any).allocations || {}
    const found = Object.keys(allocs).find(k => k.trim().toLowerCase() === label.toLowerCase())
    if (found) return allocs[found]
    const key = mapLevelKey(label)
    if (key && typeof (allocs as any)[key] === 'number') return (allocs as any)[key]
    return undefined
  }

  if (!request) return null

  const instructor = instructors.find(i => i.id === request.instructorId)
  const fullName = request.instructorName || instructor?.displayName || instructor?.fullName || instructor?.name || formatInstructorId(request.instructorId)
  const jobLevel = request.jobLevel || instructor?.jobLevel
  const contractType = request.contractType || request.employmentType || instructor?.contractType || instructor?.employmentType

  const limit = (request as any).allocationTotal ?? limitFor(request.instructorId, jobLevel)
  const used = (request as any).allocationUsed ?? (request.startDate ? usageFor(request.instructorId, request.startDate) : 0)

  // Reusable aligned detail row for clean spacing
  const DetailRow = ({
    icon: Icon,
    iconClass,
    label,
    value,
  }: {
    icon: React.ComponentType<{ className?: string }>
    iconClass: string
    label: string
    value: React.ReactNode
  }) => (
    <div className="grid grid-cols-[20px_160px_1fr] items-start gap-3 py-2 leading-6">
      <Icon className={`h-4 w-4 ${iconClass}`} />
      <div className="text-gray-500 dark:text-white">{label}</div>
      <div className="font-medium text-gray-900 dark:text-white whitespace-pre-wrap break-words">{value}</div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl shadow-2xl">
        <VisuallyHidden>
          <DialogTitle>Leave Request Details</DialogTitle>
        </VisuallyHidden>

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#9b5cf6] to-[#DE7D14] p-8 text-white">
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-3">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-sm">{fullName}</h2>
            <div className="flex flex-wrap items-center gap-2 text-white/90">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur-sm">
                <Hash className="h-4 w-4" /> ID: {formatInstructorId(request.instructorId)}
              </span>
              {request.status && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur-sm">
                  <CheckCircle2 className="h-4 w-4" /> {request.status}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 bg-gradient-to-b from-white to-white/80">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Applicant */}
            <section className="rounded-xl border border-indigo-100/60 bg-white/70 backdrop-blur-md shadow-sm hover:shadow-md transition-shadow">
              <div className="px-5 py-3 border-b text-sm font-semibold text-indigo-700/90">Applicant</div>
              <div className="px-5 pb-5 pt-2 text-[15px]">
                <DetailRow icon={Hash} iconClass="text-indigo-500" label="Non-Instructor ID" value={formatInstructorId(request.instructorId)} />
                <DetailRow icon={Layers} iconClass="text-indigo-500" label="Job Level" value={safe(jobLevel)} />
                <DetailRow icon={Briefcase} iconClass="text-indigo-500" label="Contract Type" value={normalizeContractType(contractType)} />
              </div>
            </section>

            {/* Leave Details */}
            <section className="rounded-xl border border-purple-100/60 bg-white/70 backdrop-blur-md shadow-sm hover:shadow-md transition-shadow">
              <div className="px-5 py-3 border-b text-sm font-semibold text-purple-700/90">Leave</div>
              <div className="px-5 pb-5 pt-2 text-[15px]">
                <DetailRow icon={FileText} iconClass="text-purple-500" label="Leave Type" value={safe(request.leaveType, '?')} />
                <DetailRow
                  icon={Calendar}
                  iconClass="text-purple-500"
                  label="Leave Date"
                  value={<span>{formatDisplayDate(request.startDate)}{request.endDate && request.endDate !== request.startDate ? ` - ${formatDisplayDate(request.endDate)}` : ""}</span>}
                />
                {request.registeredDate && (
                  <DetailRow icon={Calendar} iconClass="text-purple-500" label="Approved Date" value={formatDisplayDate(request.registeredDate)} />
                )}
                <DetailRow icon={FileText} iconClass="text-purple-500" label="Reason" value={safe(request.reason, '?')} />
                <DetailRow
                  icon={CheckCircle2}
                  iconClass="text-purple-500"
                  label="Status"
                  value={<Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">{request.status}</Badge>}
                />
              </div>
            </section>

            {/* Summary */}
            <section className="rounded-xl border border-orange-100/60 bg-white/70 backdrop-blur-md shadow-sm hover:shadow-md transition-shadow">
              <div className="px-5 py-3 border-b text-sm font-semibold text-orange-700/90">Summary</div>
              <div className="px-5 pb-5 pt-2 text-[15px]">
                <DetailRow icon={Clock} iconClass="text-orange-500" label="No. of days" value={`${computeWorkingDays(request.startDate, request.endDate)} days`} />
                <DetailRow icon={Layers} iconClass="text-orange-500" label="Assigned leaves" value={typeof limit === 'number' ? `${Math.max(0, Number(used) || 0)}/${limit}` : '?'} />
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
