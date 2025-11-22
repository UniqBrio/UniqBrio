"use client"

import { useMemo, useState } from "react"
import { format, startOfWeek, endOfWeek, addDays } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Badge } from "@/components/dashboard/ui/badge"
import { Button } from "@/components/dashboard/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog"
import { Label } from "@/components/dashboard/ui/label"
import { useLeave } from "@/contexts/dashboard/leave-context"
import { cn } from "@/lib/dashboard/staff/utils"
import type { LeaveRequest } from "@/types/dashboard/staff/staff/leave"
import type { LeavePolicy } from "./leave-policy-dialog"
import LeaveRequestDetailsDialog from "./leave-request-details-dialog"

type CalendarViewMode = "day" | "week" | "month"

export default function LeaveCalendarView({ policy }: { policy?: LeavePolicy }) {
  const { state } = useLeave()

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month")

  // Dialog state for viewing request
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    const endDate = new Date(lastDay)

    // Start from Sunday of the first visible week
    startDate.setDate(startDate.getDate() - startDate.getDay())
    // End on Saturday of the last visible week
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

    const days: { date: Date; isCurrentMonth: boolean }[] = []
    const cursor = new Date(startDate)
    while (cursor <= endDate) {
      days.push({ date: new Date(cursor), isCurrentMonth: cursor.getMonth() === month })
      cursor.setDate(cursor.getDate() + 1)
    }
    return days
  }

  const generateWeekDays = (date: Date) => {
    const weekStart = startOfWeek(date, { weekStartsOn: 0 }) // Sunday
    const weekEnd = endOfWeek(date, { weekStartsOn: 0 }) // Saturday
    const days: Date[] = []
    
    let cursor = weekStart
    while (cursor <= weekEnd) {
      days.push(new Date(cursor))
      cursor = addDays(cursor, 1)
    }
    
    return days
  }

  const getCurrentWeekRange = (date: Date) => {
    const weekStart = startOfWeek(date, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(date, { weekStartsOn: 0 })
    return { start: weekStart, end: weekEnd }
  }

  const getEventsForDate = (date: Date) => {
    return state.leaveRequests.filter((req) => {
      if (!req.startDate || !req.endDate) return false
      const start = new Date(req.startDate)
      const end = new Date(req.endDate)
      const check = new Date(date)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      check.setHours(12, 0, 0, 0)
      return check >= start && check <= end
    })
  }

  const getStatusColor = (_status: string) => {
    // Single-flow: always show Approved
    return "bg-green-100 text-green-800 hover:bg-green-200"
  }

  // ===== Balance/Quota helpers (aligned with table/grid) =====
  const parseLocalDate = (s: string) => {
    // Robust parser: supports YYYY-MM-DD, DD-MM-YYYY, DD-MMM-YYYY, and ordinals like 16th Oct 2025
    if (!s) return new Date(NaN)
    // 1) ISO-like YYYY-MM-DD or YYYY/MM/DD
    let m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/)
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    // 2) DD-MM-YYYY or DD/MM/YYYY
    m = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/)
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
    // Fallback
    return new Date(s)
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
  const usage: Record<string, Record<string, number>> = {}
  state.leaveRequests.forEach(r => {
    if (r.status !== 'APPROVED') return
  if (!r.startDate || !r.endDate) return
  const period = getPeriodKey(r.startDate)
    if (!usage[r.instructorId]) usage[r.instructorId] = {}
  usage[r.instructorId][period] = (usage[r.instructorId][period] || 0) + computeWorkingDays(r.startDate, r.endDate)
  })
  const usageForInstructor = (instructorId: string, anyDate: string) => {
    const period = getPeriodKey(anyDate)
    return usage[instructorId]?.[period] || 0
  }
  const limitForInstructor = (instructorId: string) => {
    if (!policy) return undefined
    const inst = state.instructors.find(i => i.id === instructorId)
    const label = String(inst?.jobLevel || '').trim()
    const allocs: Record<string, number> = (policy as any).allocations || {}
    const found = Object.keys(allocs).find(k => k.trim().toLowerCase() === label.toLowerCase())
    if (found) return allocs[found]
    const key = mapLevelKey(label)
    if (key && typeof (allocs as any)[key] === 'number') return (allocs as any)[key]
    return undefined
  }

  const days = useMemo(() => generateCalendarDays(currentDate), [currentDate])

  const openView = (req: LeaveRequest) => {
    setSelectedRequest(req)
    setIsViewOpen(true)
  }

  return (
  <div className="space-y-3">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-center mb-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={viewMode === "day" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "px-4 py-2 rounded-md transition-colors",
              viewMode === "day" 
                ? "bg-purple-500 text-white hover:bg-purple-600" 
                : "text-orange-600 hover:bg-orange-50 hover:text-orange-700"
            )}
            onClick={() => {
              setViewMode("day")
              setSelectedDate(null)
            }}
          >
            Day
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "px-4 py-2 rounded-md transition-colors",
              viewMode === "week" 
                ? "bg-purple-500 text-white hover:bg-purple-600" 
                : "text-orange-600 hover:bg-orange-50 hover:text-orange-700"
            )}
            onClick={() => {
              setViewMode("week")
              setSelectedDate(null)
            }}
          >
            Week
          </Button>
          <Button
            variant={viewMode === "month" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "px-4 py-2 rounded-md transition-colors",
              viewMode === "month" 
                ? "bg-purple-500 text-white hover:bg-purple-600" 
                : "text-orange-600 hover:bg-orange-50 hover:text-orange-700"
            )}
            onClick={() => {
              setViewMode("month")
              setSelectedDate(null)
            }}
          >
            Month
          </Button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const d = new Date(currentDate)
              if (viewMode === "day") {
                d.setDate(d.getDate() - 1)
              } else if (viewMode === "week") {
                d.setDate(d.getDate() - 7)
              } else {
                d.setMonth(d.getMonth() - 1)
              }
              setCurrentDate(d)
            }}
          >
            Previous
          </Button>

          {/* Month Selector - Only in Month View */}
          {viewMode === "month" && (
            <Select
              value={currentDate.getMonth().toString()}
              onValueChange={(value) => {
                const d = new Date(currentDate)
                d.setMonth(parseInt(value))
                setCurrentDate(d)
              }}
            >
              <SelectTrigger className="w-32 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m, idx) => (
                  <SelectItem key={m} value={idx.toString()}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Year Selector: previous, current, next year */}
          <Select
            value={currentDate.getFullYear().toString()}
            onValueChange={(value) => {
              const d = new Date(currentDate)
              d.setFullYear(parseInt(value))
              setCurrentDate(d)
            }}
          >
            <SelectTrigger className="w-28 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(() => {
                const y = new Date().getFullYear()
                const years = [y - 1, y, y + 1]
                return years.map((yr) => (
                  <SelectItem key={yr} value={yr.toString()}>
                    {yr}
                  </SelectItem>
                ))
              })()}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const d = new Date(currentDate)
              if (viewMode === "day") {
                d.setDate(d.getDate() + 1)
              } else if (viewMode === "week") {
                d.setDate(d.getDate() + 7)
              } else {
                d.setMonth(d.getMonth() + 1)
              }
              setCurrentDate(d)
            }}
          >
            Next
          </Button>

          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>
        
        <div className="text-sm font-medium text-gray-700">
          {viewMode === "day" && format(currentDate, "EEEE, MMMM dd, yyyy")}
          {viewMode === "week" && `${format(getCurrentWeekRange(currentDate).start, "MMM dd")} - ${format(getCurrentWeekRange(currentDate).end, "MMM dd, yyyy")}`}
          {viewMode === "month" && format(currentDate, "MMMM yyyy")}
        </div>
      </div>

      {/* Calendar Views */}
      {viewMode === "month" && (
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-lg">{format(currentDate, "MMMM yyyy")} - Leave Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 bg-gray-50 border-b">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="p-1 text-center text-xs font-medium text-gray-700 border-r last:border-r-0">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map(({ date, isCurrentMonth }, idx) => {
                const events = getEventsForDate(date)
                const today = date.toDateString() === new Date().toDateString()
                const isSelected = selectedDate?.toDateString() === date.toDateString()
                return (
                  <div
                    key={idx}
                    className={cn(
                      "min-h-[72px] p-0.5 border-r border-b last:border-r-0 cursor-pointer transition-colors",
                      "hover:bg-gray-50",
                      !isCurrentMonth && "bg-gray-50/50 text-gray-400",
                      today && "bg-blue-100 border-2 border-blue-400 shadow-md relative",
                      isSelected && "bg-purple-50 border-purple-200",
                    )}
                    onClick={() => {
                      setSelectedDate(date)
                      setCurrentDate(date)
                      setViewMode("day")
                    }}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={cn(
                        "text-xs font-medium", 
                        today && "text-blue-700 font-bold bg-blue-200 px-1.5 py-0.5 rounded-full", 
                        !isCurrentMonth && "text-gray-400"
                      )}>
                        {date.getDate()}
                      </span>
                      {events.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          {events.length}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {events.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className={cn(
                            "text-[11px] px-1 py-0.5 rounded truncate cursor-pointer transition-colors",
                            getStatusColor(ev.status),
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            openView(ev)
                          }}
                          title={`${ev.instructorName} - ${ev.leaveType}`}
                        >
                          {ev.instructorName}
                        </div>
                      ))}
                      {events.length > 2 && <div className="text-[11px] text-gray-500 px-1">+{events.length - 2} more</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week View */}
      {viewMode === "week" && (
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-lg">
              {format(getCurrentWeekRange(currentDate).start, "MMM dd")} - {format(getCurrentWeekRange(currentDate).end, "MMM dd, yyyy")} - Leave Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 bg-gray-50 border-b">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="p-1 text-center text-xs font-medium text-gray-700 border-r last:border-r-0">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {generateWeekDays(currentDate).map((date, idx) => {
                const events = getEventsForDate(date)
                const today = date.toDateString() === new Date().toDateString()
                const isSelected = selectedDate?.toDateString() === date.toDateString()
                
                return (
                  <div
                    key={idx}
                    className={cn(
                      "min-h-[120px] p-1 border-r border-b last:border-r-0 cursor-pointer transition-colors",
                      "hover:bg-gray-50",
                      today && "bg-blue-100 border-2 border-blue-400 shadow-md relative",
                      isSelected && "bg-purple-50 border-purple-200",
                    )}
                    onClick={() => {
                      setSelectedDate(date)
                      setCurrentDate(date)
                      setViewMode("day")
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-sm font-medium", 
                        today && "text-blue-700 font-bold bg-blue-200 px-2 py-1 rounded-full"
                      )}>
                        {date.getDate()}
                      </span>
                      {events.length > 0 && (
                        <Badge variant="secondary" className="text-xs px-2 py-0">
                          {events.length}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      {events.slice(0, 4).map((ev) => (
                        <div
                          key={ev.id}
                          className={cn(
                            "text-xs px-2 py-1 rounded truncate cursor-pointer transition-colors",
                            getStatusColor(ev.status),
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            openView(ev)
                          }}
                          title={`${ev.instructorName} - ${ev.leaveType}`}
                        >
                          {ev.instructorName}
                        </div>
                      ))}
                      {events.length > 4 && (
                        <div className="text-xs text-gray-500 px-2">+{events.length - 4} more</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day View */}
      {viewMode === "day" && (
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-lg">{format(currentDate, "EEEE, MMMM dd, yyyy")} - Leave Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            {getEventsForDate(currentDate).length > 0 ? (
              <div className="space-y-3">
                {getEventsForDate(currentDate).map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => openView(ev)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(ev.status)}>Approved</Badge>
                        <div>
                          <p className="font-medium">{ev.instructorName}</p>
                          <p className="text-sm text-gray-600">{ev.leaveType}</p>
                          <p className="text-xs text-gray-500 mt-1">{ev.reason || 'No reason provided'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {ev.startDate && ev.endDate 
                          ? (ev.startDate === ev.endDate 
                            ? format(new Date(ev.startDate), 'MMM dd, yyyy') 
                            : `${format(new Date(ev.startDate), 'MMM dd')} - ${format(new Date(ev.endDate), 'MMM dd, yyyy')}`)
                          : 'Date not available'
                        }
                      </p>
                      <p className="text-xs text-gray-500">
                        {ev.startDate && ev.endDate ? `${computeWorkingDays(ev.startDate, ev.endDate)} day${computeWorkingDays(ev.startDate, ev.endDate) !== 1 ? 's' : ''}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No leave requests for this date</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Event Details Panel - Only show in month view when date is selected */}
      {selectedDate && viewMode === "month" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Events for {selectedDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getEventsForDate(selectedDate).length > 0 ? (
              <div className="space-y-3">
                {getEventsForDate(selectedDate).map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => openView(ev)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(ev.status)}>Approved</Badge>
                        <div>
                          <p className="font-medium">{ev.instructorName}</p>
                          <p className="text-sm text-gray-600">{ev.leaveType}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{ev.startDate === ev.endDate ? ev.startDate : `${ev.startDate} - ${ev.endDate}`}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No leave requests for this date</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legend (single state + Today) */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span className="text-sm">Approved</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
              <span className="text-sm">Today</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Request Dialog */}
      <LeaveRequestDetailsDialog request={selectedRequest} open={isViewOpen} onOpenChange={setIsViewOpen} policy={policy} />
    </div>
  )
}
