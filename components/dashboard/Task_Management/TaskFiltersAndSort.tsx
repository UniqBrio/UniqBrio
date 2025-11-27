import React, { useState } from "react"
import { useCustomColors } from "@/lib/use-custom-colors"
import { sortButtonClass, getSortButtonStyle } from "@/lib/dashboard/sort-button-style"
import { Input } from "@/components/dashboard/ui/input"
import { Button } from "@/components/dashboard/ui/button"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/dashboard/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, Upload, Download, Check } from "lucide-react"
import { format } from "date-fns"
import { SortBy, Task } from "./types"
import { importTasksFromCSV, exportTasksToCSV, downloadCSV } from "./csv-utils"
import { ViewModeToggle } from "./ViewModeToggle"
import TaskColumnSelector from "./TaskColumnSelector"

interface DateRange {
  from?: Date
  to?: Date
}

interface TaskFiltersAndSortProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedStatuses: string[]
  setSelectedStatuses: React.Dispatch<React.SetStateAction<string[]>>
  selectedPriorities: string[]
  setSelectedPriorities: React.Dispatch<React.SetStateAction<string[]>>
  sortBy: SortBy
  setSortBy: (sort: SortBy) => void
  dateRange?: DateRange
  setDateRange: React.Dispatch<React.SetStateAction<DateRange | undefined>>
  tasks: Task[]
  visibleTasks: Task[]
  overdueFilter?: "all" | "yes" | "no"
  setOverdueFilter?: (v: "all" | "yes" | "no") => void
  hideOverdueFilter?: boolean
  onImportTasks: (tasks: Task[]) => void
  viewMode: "grid" | "list"
  setViewMode: React.Dispatch<React.SetStateAction<"grid" | "list">>
  isCalendarView: boolean
  onToggleCalendar: () => void
  setIsCalendarView: (isCalendarView: boolean) => void
  displayedColumns: import('./TaskColumnSelector').TaskColId[]
  onDisplayedColumnsChange: (columns: import('./TaskColumnSelector').TaskColId[]) => void
  exportPrefix?: string
  hideStatusFilter?: boolean
  hideCalendarToggle?: boolean
  hideImportButton?: boolean
  selectedTaskIds?: Set<string>
  additionalButtons?: React.ReactNode
}

export function TaskFiltersAndSort({
  searchTerm,
  setSearchTerm,
  selectedStatuses,
  setSelectedStatuses,
  selectedPriorities,
  setSelectedPriorities,
  sortBy,
  setSortBy,
  dateRange,
  setDateRange,
  tasks,
  visibleTasks,
  overdueFilter = "all",
  setOverdueFilter,
  hideOverdueFilter = false,
  onImportTasks,
  viewMode,
  setViewMode,
  isCalendarView,
  onToggleCalendar,
  setIsCalendarView,
  displayedColumns,
  onDisplayedColumnsChange,
  exportPrefix = "tasks",
  hideStatusFilter = false,
  hideCalendarToggle = false,
  hideImportButton = false,
  selectedTaskIds,
  additionalButtons,
}: TaskFiltersAndSortProps) {
  const { primaryColor } = useCustomColors();
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const [permanentFilterIcon, setPermanentFilterIcon] = useState<"apply" | "clear" | null>(null)
  
  // Pending filter states
  const [pendingStatuses, setPendingStatuses] = useState<string[]>([])
  const [pendingPriorities, setPendingPriorities] = useState<string[]>([])
  const [pendingDateRange, setPendingDateRange] = useState<DateRange | undefined>(undefined)
  const [pendingOverdue, setPendingOverdue] = useState<"all" | "yes" | "no">(overdueFilter)

  // Sort states
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Display helper for overlay inside date inputs
  // - When empty: show dd-mm-yyyy as a typing hint
  // - When set: show dd-MMM-yy (e.g., 24-Oct-25) to match the Target Date dialog
  const formatDateOverlay = (date?: Date) => {
    return date ? format(date, "dd-MMM-yy") : "dd-mm-yyyy"
  }

  const setFromDate = (date?: Date) => {
    // Always mirror the end date to match the new start date for clarity.
    // Users can still change the end date afterward.
    setPendingDateRange(() => ({
      from: date,
      to: date ?? undefined,
    }))
  }

  const setToDate = (date?: Date) => {
    setPendingDateRange(prev => ({
      from: prev?.from,
      to: date
    }))
  }

  const hasActiveFilters = () => {
    return (
      (!hideStatusFilter && selectedStatuses.length > 0 && !selectedStatuses.includes("all")) ||
      selectedPriorities.length > 0 && !selectedPriorities.includes("all") ||
      dateRange?.from || dateRange?.to ||
      (!hideOverdueFilter && overdueFilter !== "all")
    )
  }

  // Toggle helpers so clicking on the text also toggles the checkbox without closing menu
  const togglePendingStatus = (value: string) => {
    setPendingStatuses(prev => {
      if (prev.includes(value)) return prev.filter(x => x !== value)
      const filtered = prev.filter(x => x !== "all")
      return [...filtered, value]
    })
  }

  const togglePendingPriority = (value: string) => {
    setPendingPriorities(prev => {
      if (prev.includes(value)) return prev.filter(x => x !== value)
      const filtered = prev.filter(x => x !== "all")
      return [...filtered, value]
    })
  }

  const [fromFocused, setFromFocused] = useState(false)
  const [toFocused, setToFocused] = useState(false)
  const selectedVisibleTasks = selectedTaskIds ? visibleTasks.filter(t => selectedTaskIds.has(t.id)) : []

  return (
    <div className="mb-6">
      <TooltipProvider delayDuration={200}>
        {/* Search and Controls Row */}
        <div className="flex flex-wrap items-center gap-3 mb-3 w-full">
          {/* Search */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          
          {/* Filters Popover */}
          <Popover 
            open={filterDropdownOpen} 
            onOpenChange={(open) => {
              setFilterDropdownOpen(open)
              if (open) {
                // Sync pending with applied when opening (exclude "all")
                if (!hideStatusFilter) {
                  setPendingStatuses(selectedStatuses.includes("all") ? [] : selectedStatuses)
                }
                setPendingPriorities(selectedPriorities.includes("all") ? [] : selectedPriorities)
                setPendingDateRange(dateRange)
                if (!hideOverdueFilter) setPendingOverdue(overdueFilter)
              }
            }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="relative" aria-label="Filters">
                    <span className="relative inline-flex items-center">
                      <Filter className="h-4 w-4 mr-2" />
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
                {/* Filter dropdowns */}
                <div className={`grid grid-cols-1 ${hideStatusFilter ? '' : hideOverdueFilter ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4`}>
                  {/* Status Dropdown - Hidden for completed tasks */}
                  {!hideStatusFilter && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Status</h4>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between text-sm">
                            {pendingStatuses.length === 0 ? (
                              "All Statuses"
                            ) : pendingStatuses.length === 1 ? (
                              pendingStatuses[0] === "inprogress" ? "In Progress" : 
                              pendingStatuses[0] === "onhold" ? "On hold" : 
                              pendingStatuses[0].charAt(0).toUpperCase() + pendingStatuses[0].slice(1)
                            ) : (
                              `${pendingStatuses.length} selected`
                            )}
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                          {[ 
                            { value: 'open', label: 'Open' },
                            { value: 'inprogress', label: 'In Progress' },
                            { value: 'onhold', label: 'On hold' }
                          ].map((status) => (
                            <DropdownMenuItem
                              key={status.value}
                              className="flex items-center gap-2 cursor-pointer"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Checkbox
                                checked={pendingStatuses.includes(status.value)}
                                onCheckedChange={(v) =>
                                  setPendingStatuses((prev) => {
                                    if (v) {
                                      // Remove "all" when selecting specific status
                                      const filtered = prev.filter(x => x !== "all")
                                      return [...filtered, status.value]
                                    } else {
                                      return prev.filter((x) => x !== status.value)
                                    }
                                  })
                                }
                                style={{ accentColor: primaryColor }}
                              />
                              <span
                                className="text-sm select-none"
                                role="button"
                                tabIndex={0}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePendingStatus(status.value) }}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); togglePendingStatus(status.value) } }}
                              >
                                {status.label}
                              </span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}

                  {/* Priority Dropdown */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Priority</h4>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between text-sm">
                          {pendingPriorities.length === 0 ? (
                            "All Priorities"
                          ) : pendingPriorities.length === 1 ? (
                            pendingPriorities[0].charAt(0).toUpperCase() + pendingPriorities[0].slice(1)
                          ) : (
                            `${pendingPriorities.length} selected`
                          )}
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        {[ 
                          { value: 'low', label: 'Low' },
                          { value: 'medium', label: 'Medium' },
                          { value: 'high', label: 'High' }
                        ].map((priority) => (
                          <DropdownMenuItem
                            key={priority.value}
                            className="flex items-center gap-2 cursor-pointer"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Checkbox
                              checked={pendingPriorities.includes(priority.value)}
                              onCheckedChange={(v) =>
                                setPendingPriorities((prev) => {
                                  if (v) {
                                    // Remove "all" when selecting specific priority
                                    const filtered = prev.filter(x => x !== "all")
                                    return [...filtered, priority.value]
                                  } else {
                                    return prev.filter((x) => x !== priority.value)
                                  }
                                })
                              }
                              style={{ accentColor: primaryColor }}
                            />
                            <span
                              className="text-sm select-none"
                              role="button"
                              tabIndex={0}
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePendingPriority(priority.value) }}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); togglePendingPriority(priority.value) } }}
                            >
                              {priority.label}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Overdue Dropdown */}
                  {!hideOverdueFilter && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Overdue</h4>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between text-sm">
                          {pendingOverdue === "all" ? "All" : pendingOverdue === "yes" ? "Yes" : "No"}
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        {([
                          {value:"all",label:"All"},
                          {value:"yes",label:"Yes"},
                          {value:"no",label:"No"}
                        ] as const).map(opt => (
                          <DropdownMenuItem key={opt.value} onClick={() => setPendingOverdue(opt.value)}>
                            {opt.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  )}
                </div>

                {/* Date Range */}
                <div>
                  <h4 className="text-sm font-medium">Date Range</h4>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* From date (manual input + native picker, overlay display) */}
                    <div className="relative">
                      <Input
                        type="date"
                        value={pendingDateRange?.from ? format(pendingDateRange.from, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          const value = e.target.value
                          const parsed = value ? new Date(`${value}T00:00:00`) : undefined
                          setFromDate(parsed)
                        }}
                        onFocus={() => setFromFocused(true)}
                        onBlur={() => setFromFocused(false)}
                        className={`w-full pl-3 ${fromFocused ? '' : 'text-transparent'}`}
                      />
                      {!fromFocused && (
                        <div className="absolute inset-0 flex items-center pl-3 pr-3 text-sm pointer-events-none text-gray-900 dark:text-white">
                          {formatDateOverlay(pendingDateRange?.from)}
                        </div>
                      )}
                    </div>

                    {/* To date (manual input + native picker, overlay display) */}
                    <div className="relative">
                      <Input
                        type="date"
                        value={pendingDateRange?.to ? format(pendingDateRange.to, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          const value = e.target.value
                          const parsed = value ? new Date(`${value}T00:00:00`) : undefined
                          setToDate(parsed)
                        }}
                        onFocus={() => setToFocused(true)}
                        onBlur={() => {
                          setToFocused(false)
                          // Clamp end date to be >= start date after typing
                          setPendingDateRange(prev => {
                            if (!prev) return prev
                            if (!prev.from || !prev.to) return prev
                            return prev.to < prev.from ? { ...prev, to: prev.from } : prev
                          })
                        }}
                        className={`w-full pl-3 ${toFocused ? '' : 'text-transparent'}`}
                      />
                      {!toFocused && (
                        <div className="absolute inset-0 flex items-center pl-3 pr-3 text-sm pointer-events-none text-gray-900 dark:text-white">
                          {formatDateOverlay(pendingDateRange?.to)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-between gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Clear both pending and applied filters
                      if (!hideStatusFilter) {
                        setPendingStatuses([])
                        setSelectedStatuses(["all"])
                      }
                      setPendingPriorities([])
                      setPendingDateRange(undefined)
                      if (!hideOverdueFilter) setPendingOverdue("all")

                      setSelectedPriorities(["all"])
                      setDateRange(undefined)
                      if (setOverdueFilter && !hideOverdueFilter) setOverdueFilter("all")
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
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}dd`}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
                    onClick={() => {
                      // If nothing is selected, default to "all"
                      const prioritiesToApply = pendingPriorities.length > 0 ? pendingPriorities : ["all"]
                      
                      if (!hideStatusFilter) {
                        const statusesToApply = pendingStatuses.length > 0 ? pendingStatuses : ["all"]
                        setSelectedStatuses(statusesToApply)
                      }
                      setSelectedPriorities(prioritiesToApply)
                      setDateRange(pendingDateRange)
                      if (setOverdueFilter && !hideOverdueFilter) setOverdueFilter(pendingOverdue)
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

          {/* Sort dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={sortButtonClass}
                    style={getSortButtonStyle(primaryColor)}
                    aria-label="Sort"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    <span className="text-xs">
                      {sortBy === "target-date-asc" && "Target Date"}
                      {sortBy === "target-date-desc" && "Target Date"}
                      {sortBy === "created-on-asc" && "Created On"}
                      {sortBy === "created-on-desc" && "Created On"}
                      {sortBy === "task-name-asc" && "Task Name"}
                      {sortBy === "task-name-desc" && "Task Name"}
                      {sortBy === "priority-asc" && "Priority"}
                      {sortBy === "priority-desc" && "Priority"}
                    </span>
                    {sortBy.includes("asc") ? (
                      <ArrowUp className="ml-1 h-3 w-3" />
                    ) : (
                      <ArrowDown className="ml-1 h-3 w-3" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Sort</TooltipContent>
            </Tooltip>
            <DropdownMenuContent>
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              {[
                { value: "target-date-asc", label: "Target Date" },
                { value: "created-on-asc", label: "Created On" },
                { value: "task-name-asc", label: "Task Name" },
                { value: "priority-asc", label: "Priority" },
              ].map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setSortBy(option.value as SortBy)}
                  style={sortBy.startsWith(option.value.split("-")[0] + "-" + option.value.split("-")[1]) ? {
                    backgroundColor: `${primaryColor}15`
                  } : {}}
                >
                  <span>{option.label}</span>
                  {sortBy.startsWith(option.value.split("-")[0]) && (
                    <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Order</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => {
                const baseSortBy = sortBy.split("-").slice(0, -1).join("-")
                setSortBy(`${baseSortBy}-asc` as SortBy)
              }}>
                <span className="flex items-center gap-2">
                  Ascending
                  <ArrowUp className="h-4 w-4" />
                </span>
                {sortBy.endsWith("asc") && (
                  <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const baseSortBy = sortBy.split("-").slice(0, -1).join("-")
                setSortBy(`${baseSortBy}-desc` as SortBy)
              }}>
                <span className="flex items-center gap-2">
                  Descending
                  <ArrowDown className="h-4 w-4" />
                </span>
                {sortBy.endsWith("desc") && (
                  <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Unified List/Grid/Calendar toggle */}
          <ViewModeToggle
            viewMode={viewMode}
            setViewMode={setViewMode}
            isCalendarView={isCalendarView}
            setIsCalendarView={setIsCalendarView}
            showCalendarOption={!hideCalendarToggle}
          />

          {/* Import button */}
          {!hideImportButton && (
            <>
              <input
                id="import-task-csv-input"
                type="file"
                accept="text/csv,.csv"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  
                  try {
                    const csvText = await file.text()
                    const result = importTasksFromCSV(csvText)
                    
                    // Handle any errors
                    if (result.errors.length > 0) {
                      console.warn("CSV Import Warnings:", result.errors)
                      const errorMessage = result.errors.slice(0, 3).join('\n') + 
                        (result.errors.length > 3 ? `\n... and ${result.errors.length - 3} more errors` : '')
                      alert(`Import completed with warnings:\n${errorMessage}`)
                    }
                    
                    if (result.tasks.length > 0) {
                      onImportTasks(result.tasks)
                      alert(`Successfully imported ${result.tasks.length} tasks from CSV.`)
                    } else {
                      alert("No valid tasks found in CSV.")
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
                    disabled
                    onClick={() => document.getElementById("import-task-csv-input")?.click()}
                    aria-label="Import CSV"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Import disabled</TooltipContent>
              </Tooltip>
            </>
          )}

          {/* Export button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                aria-label="Export CSV"
                onClick={() => {
                  const toExport = selectedVisibleTasks.length > 0 ? selectedVisibleTasks : visibleTasks
                  const csv = exportTasksToCSV(toExport)
                  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm')
                  const filename = `${exportPrefix}-export-${timestamp}.csv`
                  downloadCSV(filename, csv)
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                {selectedVisibleTasks.length > 0 ? `Export (${selectedVisibleTasks.length})` : 'Export'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export Tasks to CSV</TooltipContent>
          </Tooltip>

          {/* Additional buttons (Draft, Create Task, etc.) */}
          {additionalButtons}
        
      </div>
      </TooltipProvider>

      {/* Task Count and Column Selector Row - Hidden in Calendar View */}
      {!isCalendarView && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            ? Showing {visibleTasks.length} Task{visibleTasks.length !== 1 ? 's' : ''}
          </span>
          <TaskColumnSelector 
            value={displayedColumns}
            onChange={onDisplayedColumnsChange}
          />
        </div>
      )}
    </div>
  )
}