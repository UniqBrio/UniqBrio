"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/dashboard/ui/dropdown-menu"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Button } from "@/components/dashboard/ui/button"
import { ChevronDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { useLeave } from "@/contexts/dashboard/leave-context"
import { ChartContainer } from "@/components/dashboard/ui/chart"
import { endOfMonth, format, max as maxDate, min as minDate, startOfMonth, subMonths, getYear, getMonth } from "date-fns"
import { Bar, BarChart, CartesianGrid, Pie, PieChart, Tooltip, XAxis, YAxis, Cell, Label, LabelList } from "recharts"

export default function DashboardCharts() {
  // Render charts only after mount to avoid any hydration/runtime issues from browser-only APIs
  const [mounted, setMounted] = useState(false)
  
  // Filter state for month and year selection (multi-month)
  const currentDate = new Date()
  const [selectedYear, setSelectedYear] = useState(getYear(currentDate))
  const [selectedMonths, setSelectedMonths] = useState<number[]>([getMonth(currentDate) + 1]) // 1-12
  
  // Always call useLeave hook - hooks must be called consistently
  const { state } = useLeave()
  
  // Helper function to parse dates correctly - handles multiple formats
  const parseLocalDate = (s: string) => {
    if (!s) return new Date(NaN)
    
    // Handle YYYY-MM-DD format (standard)
    if (s.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
      const [y, m, d] = s.split("-").map(Number)
      return new Date(y, (m || 1) - 1, d || 1)
    }
    
  // Handle DD-MMM-YYYY format (like "01-Jan-2026")
    if (s.match(/^\d{1,2}-[A-Za-z]{3}-\d{2}$/)) {
      const [day, monthStr, yearStr] = s.split("-")
      const monthMap: Record<string, number> = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      }
      const month = monthMap[monthStr]
      // Convert 2-digit year to 4-digit (assume 20xx for years 00-99)
      const year = parseInt(yearStr) + (parseInt(yearStr) < 50 ? 2000 : 1900)
      return new Date(year, month, parseInt(day))
    }
    
    // Handle DD-MMM-YYYY format (like "01-Jan-2026")
    if (s.match(/^\d{1,2}-[A-Za-z]{3}-\d{4}$/)) {
      const [day, monthStr, yearStr] = s.split("-")
      const monthMap: Record<string, number> = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      }
      const month = monthMap[monthStr]
      const year = parseInt(yearStr)
      return new Date(year, month, parseInt(day))
    }
    
    // Fallback: try native Date parsing
    const fallbackDate = new Date(s)
    return isNaN(fallbackDate.getTime()) ? new Date(NaN) : fallbackDate
  }

  // Get available years from leave data
  const getUniqueYearsFromLeaveData = () => {
    const years = new Set<number>()
    
    // Only process if we have leave requests
    if (state?.leaveRequests) {
      // Extract years from all leave requests that have start dates or end dates
      state.leaveRequests.forEach((request: any) => {
        // Check end date (primary for filtering)
        if (request.endDate) {
          try {
            const endDate = parseLocalDate(request.endDate)
            if (!isNaN(endDate.getTime())) {
              years.add(getYear(endDate))
            }
          } catch (error) {
            console.warn('Failed to parse end date:', request.endDate, error)
          }
        }
        
        // Also check start date to ensure we don't miss any years
        if (request.startDate) {
          try {
            const startDate = parseLocalDate(request.startDate)
            if (!isNaN(startDate.getTime())) {
              years.add(getYear(startDate))
            }
          } catch (error) {
            console.warn('Failed to parse start date:', request.startDate, error)
          }
        }
      })
    }
    
    // If no data found, include current year as fallback
    if (years.size === 0) {
      years.add(getYear(new Date()))
    }
    
    // Sort years in descending order (newest first)
    return Array.from(years).sort((a, b) => b - a)
  }
  
  const yearOptions = getUniqueYearsFromLeaveData()
  
  // All hooks must be called before any conditional returns
  useEffect(() => setMounted(true), [])
  
  // Ensure selected year is valid - if not, select the most recent year with data
  useEffect(() => {
    if (yearOptions.length > 0 && !yearOptions.includes(selectedYear)) {
      setSelectedYear(yearOptions[0]) // Select the most recent year with data
    }
  }, [yearOptions, selectedYear])
  
  // Early return after all hooks are called
  if (!mounted || typeof window === "undefined") {
    return null
  }

  // 1) Monthly approved leave days - show only user-selected months for the chosen year
  const monthsSorted = [...selectedMonths].sort((a, b) => a - b)
  const dateRange: Date[] = monthsSorted.map((m) => startOfMonth(new Date(selectedYear, m - 1, 1)))
  const dateKeys: string[] = dateRange.map((d) => format(d, "yyyy-MM"))
  const monthlyMap = new Map<string, number>(dateKeys.map((k) => [k, 0]))

  const working = Array.isArray(state.workingDays) && state.workingDays.length ? state.workingDays : [1,2,3,4,5,6]

  // Count fully approved days; app uses single-step approval
  state.leaveRequests.filter((r: any) => r.status === 'APPROVED' && r.startDate && r.endDate).forEach((r: any) => {
    const rs = parseLocalDate(r.startDate!); const re = parseLocalDate(r.endDate!)
    dateRange.forEach((monthStart) => {
      const monthEnd = endOfMonth(monthStart)
      const start = maxDate([rs, monthStart])
      const end = minDate([re, monthEnd])
      if (end < start) return
      let days = 0
      const d = new Date(start)
      while (d <= end) { if (working.includes(d.getDay())) days++; d.setDate(d.getDate()+1) }
      if (days > 0) {
        const key = format(monthStart, 'yyyy-MM')
        monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + days)
      }
    })
  })

  const monthlyData = dateRange.map((monthStart) => ({ month: format(monthStart, 'MMM yyyy'), days: monthlyMap.get(format(monthStart, 'yyyy-MM')) || 0 }))

  // Use only real data - no fallback dummy values
  const monthlyToRender = monthlyData

  // 2) Leave type distribution - filter by selected months in the chosen year
  const typeCounts = new Map<string, number>()
  
  // Filter leave requests by overlap with any selected month in the selected year
  const monthPeriods = dateRange.map((ms) => ({ start: ms, end: endOfMonth(ms) }))
  const filteredRequests = state.leaveRequests.filter((r: any) => {
    if (!r.leaveType || !r.startDate || !r.endDate) return false
    const rs = parseLocalDate(r.startDate)
    const re = parseLocalDate(r.endDate)
    // Overlaps if any selected month window intersects [rs, re]
    return monthPeriods.some(({ start, end }) => !(end < rs || re < start))
  })
  
  filteredRequests.forEach((r: any) => {
    if (r.leaveType) {
      typeCounts.set(r.leaveType, (typeCounts.get(r.leaveType) ?? 0) + 1)
    }
  })
  
  // Use only real data - no fallback dummy values
  let pieData = Array.from(typeCounts.entries()).map(([name, value]) => ({ name, value }))
  const pieColors: Record<string, string> = {
    "Casual Leave": "#8b5cf6",
    "Sick Leave": "#f59e0b",
    "Planned Leave": "#22c55e",
    "Emergency Leave": "#ef4444",
    "Maternity Leave": "#06b6d4",
    "Paternity Leave": "#a855f7",
    "Study Leave": "#10b981",
    "Unapproved Leave": "#64748b",
  }

  // Custom label for donut: always visible "name: value" outside slices
  const RADIAN = Math.PI / 180
  const renderPieLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, name, value } = props
    const x1 = cx + outerRadius * Math.cos(-midAngle * RADIAN)
    const y1 = cy + outerRadius * Math.sin(-midAngle * RADIAN)
    const x2 = cx + (outerRadius + 12) * Math.cos(-midAngle * RADIAN)
    const y2 = cy + (outerRadius + 12) * Math.sin(-midAngle * RADIAN)
    const tx = cx + (outerRadius + 18) * Math.cos(-midAngle * RADIAN)
    const ty = cy + (outerRadius + 18) * Math.sin(-midAngle * RADIAN)
    return (
      <g>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth={1.5} markerEnd="url(#pie-arrow)" />
        <text x={tx} y={ty} fill="#334155" textAnchor={tx > cx ? "start" : "end"} dominantBaseline="central">
          {`${name}: ${value}`}
        </text>
      </g>
    )
  }


  
  // Generate month options
  const monthOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ]

  // Helper: month button text
  const monthButtonText = (() => {
    if (selectedMonths.length === 0) return "Select month(s)"
    const labels = selectedMonths
      .slice()
      .sort((a, b) => a - b)
      .map((m) => format(new Date(2000, m - 1, 1), 'MMMM'))
    if (labels.length === 1) return labels[0]
    if (labels.length <= 2) return labels.join(', ')
    return `${labels[0]}, ${labels[1]} +${labels.length - 2} more`
  })()

  const toggleMonth = (value: number, isChecked?: boolean) => {
    setSelectedMonths((prev) => {
      let next: number[]
      if (typeof isChecked === 'boolean') {
        next = isChecked ? Array.from(new Set([...prev, value])) : prev.filter((v) => v !== value)
      } else {
        next = prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      }
      // Enforce at least one month selected
      return next.length === 0 ? prev : next
    })
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Month(s):</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="min-w-[200px] justify-between">
                    {monthButtonText}
                    <ChevronDown className="h-4 w-4 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <div className="max-h-48 overflow-y-auto">
                    {monthOptions.map((m) => {
                      const checked = selectedMonths.includes(m.value)
                      return (
                        <DropdownMenuItem
                          key={m.value}
                          className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                          onSelect={(e) => { e.preventDefault(); toggleMonth(m.value) }}
                        >
                          <Checkbox
                            checked={checked}
                            // Let the parent menu item handle toggling to avoid event conflicts
                            onCheckedChange={() => { /* controlled via parent onSelect */ }}
                            className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                          />
                          <span className="text-sm flex-1">{m.label}</span>
                        </DropdownMenuItem>
                      )
                    })}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="year-select" className="text-sm font-medium">
                Year:
              </label>
              <Select value={selectedYear.toString()} onValueChange={(value: string) => setSelectedYear(parseInt(value))}>
                <SelectTrigger id="year-select" className="w-[100px]">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                aria-label="Show current month"
                onClick={() => {
                  const now = new Date()
                  setSelectedYear(getYear(now))
                  setSelectedMonths([getMonth(now) + 1])
                }}
              >
                Current Month
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monthly Leave Days */}
        <Card>
        <CardHeader>
          <CardTitle>
            {`Monthly Leave Days (${monthsSorted.map(m => format(new Date(selectedYear, m-1, 1), 'MMM')).join(', ')} ${selectedYear})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyToRender.every(d => d.days === 0) ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <p className="text-lg font-medium">No Leave Data</p>
                <p className="text-sm">No approved leave requests found for the selected period</p>
              </div>
            </div>
          ) : (
            <ChartContainer
              config={{ days: { label: "Days", color: "#8b5cf6" } }}
              className="w-full"
            >
              <BarChart data={monthlyToRender} margin={{ top: 16, right: 16, left: 16, bottom: 36 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickMargin={8}>
                <Label value="Months" position="bottom" offset={8} />
              </XAxis>
              <YAxis allowDecimals={false} domain={[0, 'dataMax + 1']}>
                <Label value="No. of days" angle={-90} position="insideLeft" offset={8} />
              </YAxis>
              {/* Use Recharts' built-in Tooltip to avoid context portal issues in production */}
              <Tooltip />
              <Bar dataKey="days" fill="var(--color-days)" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="days" position="top" offset={6} fill="#5b21b6" />
              </Bar>
            </BarChart>
          </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Leave Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>
            {`Leave Type Distribution (${monthsSorted.map(m => format(new Date(selectedYear, m-1, 1), 'MMM')).join(', ')} ${selectedYear})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <p className="text-lg font-medium">No Leave Type Data</p>
                <p className="text-sm">No leave requests found for the selected period</p>
              </div>
            </div>
          ) : (
            <ChartContainer
              config={{ value: { label: "Requests", color: "#22c55e" } }}
              className="w-full"
            >
              <PieChart>
              <defs>
                <marker id="pie-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" />
                </marker>
              </defs>
              {/* Use default Tooltip to avoid relying on ChartContext across potential portals */}
              <Tooltip />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                labelLine={false}
                label={renderPieLabel}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={pieColors[entry.name] || "#8884d8"} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
