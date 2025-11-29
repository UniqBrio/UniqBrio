"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/dashboard/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import { ChevronDown, Filter as FilterIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { useLeave } from "@/contexts/dashboard/leave-context"
import type { Instructor, LeaveRequest } from "@/types/dashboard/staff/leave"
import { FormattedDateInput } from "@/components/dashboard/ui/formatted-date-input"
import { format } from "date-fns"
import { useCustomColors } from "@/lib/use-custom-colors"

type FiltersValue = {
  jobLevels: string[]
  leaveTypes: string[]
  dateRange?: DateRange
  staffTypes: string[]
}

type Props = {
  value: FiltersValue
  onChange: (next: FiltersValue) => void
}

export default function AdvancedFilters({ value, onChange }: Props) {
  const { state } = useLeave()
  const { primaryColor, secondaryColor } = useCustomColors()

  // Local UI states (not exposed to parent)
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const [permanentFilterIcon, setPermanentFilterIcon] = useState<"apply" | "clear" | null>(null)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const tooltipTimerRef = useRef<number | null>(null)

  // Pending filters to allow cancel/apply pattern
  const [pendingJobLevels, setPendingJobLevels] = useState<string[]>(value.jobLevels)
  const [pendingLeaveTypes, setPendingLeaveTypes] = useState<string[]>(value.leaveTypes)
  const [pendingDateRange, setPendingDateRange] = useState<DateRange | undefined>(value.dateRange)
  const [pendingStaffTypes, setPendingStaffTypes] = useState<string[]>(value.staffTypes)

  // Per-dropdown search inputs
  const [searchContractQuery, setSearchContractQuery] = useState("")
  const [searchLeaveQuery, setSearchLeaveQuery] = useState("")
  const [searchLevelQuery, setSearchLevelQuery] = useState("")

  // Helper to look up instructor details
  const getInstructorInfo = (instructorId: string) => state.instructors.find((i: Instructor) => i.id === instructorId)

  // Derive dynamic filter options from the same data that powers the table
  const availableFilters = useMemo(() => {
    type ContractKey = 'full-time' | 'part-time' | 'guest-faculty' | 'temporary'
    const leaveTypes = new Set<string>()
    const jobLevels = new Set<string>()
    const contractCats = new Set<ContractKey>()

    const addContract = (raw?: string) => {
      if (!raw) return
      const v = raw.toLowerCase()
      if (v.includes('full') || v.includes('permanent')) contractCats.add('full-time')
      else if (v.includes('part')) contractCats.add('part-time')
      else if (v.includes('guest')) contractCats.add('guest-faculty')
      else if (v.includes('temp')) contractCats.add('temporary')
    }

    state.leaveRequests.forEach((r: LeaveRequest) => {
      if (r.leaveType) leaveTypes.add(r.leaveType)
      const inst = getInstructorInfo(r.instructorId)
      const level = (r.jobLevel || inst?.jobLevel || '').trim()
      if (level) jobLevels.add(level)
      const contractRaw = (r.contractType || r.employmentType || inst?.contractType || inst?.employmentType)
      addContract(contractRaw)
    })

    const contractCategories: ContractKey[] = (contractCats.size
      ? Array.from(contractCats)
      : (['full-time','part-time','guest-faculty','temporary'] as ContractKey[]))

    return {
      leaveTypes: Array.from(leaveTypes).sort(),
      jobLevels: Array.from(jobLevels).sort(),
      contractCategories,
    }
  }, [state.leaveRequests, state.instructors])

  // Helpers for ISO <-> Date conversions
  const toIso = (d?: Date) => (d ? format(d, "yyyy-MM-dd") : "")
  const parseIso = (iso?: string) => (iso ? new Date(iso) : undefined)

  const hasDateOrderingError = !!(
    pendingDateRange?.from &&
    pendingDateRange?.to &&
    pendingDateRange.to < pendingDateRange.from
  )

  // Auto-hide tooltip 3s after apply/clear
  useEffect(() => {
    if (permanentFilterIcon) {
      setTooltipOpen(true)
      if (tooltipTimerRef.current) {
        window.clearTimeout(tooltipTimerRef.current)
        tooltipTimerRef.current = null
      }
      tooltipTimerRef.current = window.setTimeout(() => {
        setTooltipOpen(false)
        tooltipTimerRef.current = null
      }, 3000)
    }
  }, [permanentFilterIcon])

  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) {
        window.clearTimeout(tooltipTimerRef.current)
        tooltipTimerRef.current = null
      }
    }
  }, [])

  return (
    <Popover
      open={filterDropdownOpen}
      onOpenChange={(open) => {
        setFilterDropdownOpen(open)
        if (open) {
          // Sync pending with applied when opening
          setPendingJobLevels(value.jobLevels)
          setPendingLeaveTypes(value.leaveTypes)
          setPendingDateRange(value.dateRange)
          setPendingStaffTypes(value.staffTypes)
          // Reset per-dropdown search inputs
          setSearchContractQuery("")
          setSearchLeaveQuery("")
          setSearchLevelQuery("")
        }
      }}
    >
      <Tooltip open={tooltipOpen} onOpenChange={(o) => setTooltipOpen(o)}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="relative" aria-label="Filters">
              <span className="relative inline-flex items-center">
                <FilterIcon className="h-4 w-4 mr-2" />
                {permanentFilterIcon === "apply" && (
                  <span className="absolute -top-2 -right-3">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="10" fill="#22C55E"/>
                      <path d="M6 10.5l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
                {permanentFilterIcon === "clear" && (
                  <span className="absolute -top-2 -right-3">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="10" fill="#EF4444"/>
                      <path d="M7 7l6 6M13 7l-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </span>
                )}
              </span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Filters</TooltipContent>
      </Tooltip>
      <PopoverContent side="bottom" align="end" className="w-[320px] md:w-[600px] max-h-[70vh] overflow-y-auto">
        <div className="space-y-4">
          {/* Compact filter row with dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Contract Type Dropdown */}
            <div>
              <h4 className="text-sm font-medium mb-2">Contract Type</h4>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between text-sm hover:bg-transparent hover:text-current active:bg-transparent focus-visible:ring-0 focus-visible:outline-none data-[state=open]:bg-transparent">
                    {pendingStaffTypes.length === 0 ? (
                      "All Types"
                    ) : pendingStaffTypes.length === 1 ? (
                      pendingStaffTypes[0] === 'full-time' ? 'Full-Time' :
                      pendingStaffTypes[0] === 'part-time' ? 'Part-Time' :
                      pendingStaffTypes[0] === 'guest-faculty' ? 'Guest Faculty' :
                      pendingStaffTypes[0] === 'temporary' ? 'Temporary' : pendingStaffTypes[0]
                    ) : (
                      `${pendingStaffTypes.length} selected`
                    )}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <div className="p-2">
                    <Input
                      placeholder="Search types..."
                      value={searchContractQuery}
                      onChange={(e) => setSearchContractQuery(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  {availableFilters.contractCategories
                    .filter((value) => {
                      const labelMap: Record<'full-time' | 'part-time' | 'guest-faculty' | 'temporary', string> = {
                        'full-time': 'Full-Time',
                        'part-time': 'Part-Time',
                        'guest-faculty': 'Guest Faculty',
                        'temporary': 'Temporary',
                      }
                      return labelMap[value].toLowerCase().includes(searchContractQuery.trim().toLowerCase())
                    })
                    .map((value) => {
                    const labelMap: Record<'full-time' | 'part-time' | 'guest-faculty' | 'temporary', string> = {
                      'full-time': 'Full-Time',
                      'part-time': 'Part-Time',
                      'guest-faculty': 'Guest Faculty',
                      'temporary': 'Temporary',
                    }
                    const contractType = { value, label: labelMap[value] }
                    const toggleStaffType = (value: string) => {
                      setPendingStaffTypes((prev) =>
                        prev.includes(value) 
                          ? prev.filter((x) => x !== value)
                          : [...prev, value]
                      )
                    }
                    
                    return (
                      <DropdownMenuItem
                        key={contractType.value}
                        className="flex items-center gap-2 cursor-pointer hover:bg-transparent focus:bg-transparent"
                        onSelect={(e) => e.preventDefault()}
                        onClick={() => toggleStaffType(contractType.value)}
                      >
                        <Checkbox
                          checked={pendingStaffTypes.includes(contractType.value)}
                          onCheckedChange={(v) =>
                            setPendingStaffTypes((prev) =>
                              v ? [...prev, contractType.value] : prev.filter((x) => x !== contractType.value),
                            )
                          }
                          onClick={(e) => e.stopPropagation()}
                          style={{ backgroundColor: pendingStaffTypes.includes(contractType.value) ? primaryColor : 'transparent', borderColor: primaryColor }}
                        />
                        <span className="text-sm">{contractType.label}</span>
                      </DropdownMenuItem>
                    )
                  })}
                  {availableFilters.contractCategories.length > 0 &&
                    availableFilters.contractCategories.filter((value) => {
                      const labelMap: Record<'full-time' | 'part-time' | 'guest-faculty' | 'temporary', string> = {
                        'full-time': 'Full-Time',
                        'part-time': 'Part-Time',
                        'guest-faculty': 'Guest Faculty',
                        'temporary': 'Temporary',
                      }
                      return labelMap[value].toLowerCase().includes(searchContractQuery.trim().toLowerCase())
                    }).length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">No results</div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Leave Type Dropdown */}
            <div>
              <h4 className="text-sm font-medium mb-2">Leave Type</h4>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between text-sm hover:bg-transparent hover:text-current active:bg-transparent focus-visible:ring-0 focus-visible:outline-none data-[state=open]:bg-transparent">
                    {pendingLeaveTypes.length === 0 ? (
                      "All Types"
                    ) : pendingLeaveTypes.length === 1 ? (
                      pendingLeaveTypes[0]
                    ) : (
                      `${pendingLeaveTypes.length} selected`
                    )}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <div className="p-2">
                    <Input
                      placeholder="Search leave types..."
                      value={searchLeaveQuery}
                      onChange={(e) => setSearchLeaveQuery(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  {availableFilters.leaveTypes
                    .filter((lt) => lt.toLowerCase().includes(searchLeaveQuery.trim().toLowerCase()))
                    .map((leaveType) => {
                    const toggleLeaveType = (type: string) => {
                      setPendingLeaveTypes((prev) =>
                        prev.includes(type) 
                          ? prev.filter((x) => x !== type)
                          : [...prev, type]
                      )
                    }
                    
                    return (
                      <DropdownMenuItem
                        key={leaveType}
                        className="flex items-center gap-2 cursor-pointer hover:bg-transparent focus:bg-transparent"
                        onSelect={(e) => e.preventDefault()}
                        onClick={() => toggleLeaveType(leaveType)}
                      >
                        <Checkbox
                          checked={pendingLeaveTypes.includes(leaveType)}
                          onCheckedChange={(v) =>
                            setPendingLeaveTypes((prev) =>
                              v ? [...prev, leaveType] : prev.filter((x) => x !== leaveType),
                            )
                          }
                          onClick={(e) => e.stopPropagation()}
                          style={{ backgroundColor: pendingLeaveTypes.includes(leaveType) ? primaryColor : 'transparent', borderColor: primaryColor }}
                        />
                        <span className="text-sm">{leaveType}</span>
                      </DropdownMenuItem>
                    )
                  })}
                  {availableFilters.leaveTypes.length > 0 &&
                    availableFilters.leaveTypes.filter((lt) => lt.toLowerCase().includes(searchLeaveQuery.trim().toLowerCase())).length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">No results</div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Job Level Dropdown */}
            <div>
              <h4 className="text-sm font-medium mb-2">Job Level</h4>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between text-sm hover:bg-transparent hover:text-current active:bg-transparent focus-visible:ring-0 focus-visible:outline-none data-[state=open]:bg-transparent">
                    {pendingJobLevels.length === 0 ? (
                      "All Levels"
                    ) : pendingJobLevels.length === 1 ? (
                      pendingJobLevels[0]
                    ) : (
                      `${pendingJobLevels.length} selected`
                    )}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <div className="p-2">
                    <Input
                      placeholder="Search job levels..."
                      value={searchLevelQuery}
                      onChange={(e) => setSearchLevelQuery(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  {availableFilters.jobLevels
                    .filter((lvl) => lvl.toLowerCase().includes(searchLevelQuery.trim().toLowerCase()))
                    .map((level) => {
                    const toggleJobLevel = (jobLevel: string) => {
                      setPendingJobLevels((prev) =>
                        prev.includes(jobLevel) 
                          ? prev.filter((x) => x !== jobLevel)
                          : [...prev, jobLevel]
                      )
                    }
                    
                    return (
                      <DropdownMenuItem
                        key={level}
                        className="flex items-center gap-2 cursor-pointer hover:bg-transparent focus:bg-transparent"
                        onSelect={(e) => e.preventDefault()}
                        onClick={() => toggleJobLevel(level)}
                      >
                        <Checkbox
                          checked={pendingJobLevels.includes(level)}
                          onCheckedChange={(v) =>
                            setPendingJobLevels((prev) =>
                              v ? [...prev, level] : prev.filter((x) => x !== level),
                            )
                          }
                          onClick={(e) => e.stopPropagation()}
                          style={{ backgroundColor: pendingJobLevels.includes(level) ? primaryColor : 'transparent', borderColor: primaryColor }}
                        />
                        <span className="text-sm">{level}</span>
                      </DropdownMenuItem>
                    )
                  })}
                  {availableFilters.jobLevels.length > 0 &&
                    availableFilters.jobLevels.filter((lvl) => lvl.toLowerCase().includes(searchLevelQuery.trim().toLowerCase())).length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">No results</div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Date Range row - use same date input logic/format as Leave Request popup */}
          <div>
            <h4 className="text-sm font-medium">Date Range</h4>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FormattedDateInput
                id="filter-start-date"
                label={"Start Date"}
                value={toIso(pendingDateRange?.from)}
                onChange={(iso) => {
                  const newStart = parseIso(iso)
                  // Mirror end to start whenever start changes (same as popup logic)
                  setPendingDateRange({ from: newStart, to: newStart })
                }}
                displayFormat="dd-MMM-yyyy"
                placeholder="dd-mmm-yyyy"
              />
              <div>
                <FormattedDateInput
                  id="filter-end-date"
                  label={"End Date"}
                  value={toIso(pendingDateRange?.to)}
                  onChange={(iso) => {
                    const newEnd = parseIso(iso)
                    setPendingDateRange((prev) => {
                      const from = prev?.from
                      return { from, to: newEnd }
                    })
                  }}
                  min={toIso(pendingDateRange?.from)}
                  error={hasDateOrderingError}
                  displayFormat="dd-MMM-yyyy"
                  placeholder="dd-mmm-yyyy"
                />
                {hasDateOrderingError && (
                  <p className="text-xs text-red-600 mt-1">End date cannot be before the start date.</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-between gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Clear both pending and applied filters
                setPendingStaffTypes([])
                setPendingLeaveTypes([])
                setPendingJobLevels([])
                setPendingDateRange(undefined)

                onChange({ jobLevels: [], leaveTypes: [], dateRange: undefined, staffTypes: [] })
                setFilterDropdownOpen(false)
                setPermanentFilterIcon("clear")
              }}
            >
              Clear All
            </Button>
            <Button
              size="sm"
              className="text-white"
              style={{ backgroundColor: primaryColor }}
              onClick={() => {
                onChange({
                  jobLevels: pendingJobLevels,
                  leaveTypes: pendingLeaveTypes,
                  dateRange: pendingDateRange,
                  staffTypes: pendingStaffTypes,
                })
                setFilterDropdownOpen(false)
                setPermanentFilterIcon("apply")
              }}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
