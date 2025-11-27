"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Search, Filter, ArrowUp, ArrowDown, ArrowUpDown, Upload, Download, Save, RotateCcw, X, Check } from "lucide-react"
import GridIcon from "@/components/dashboard/icons/grid"
import { INSTRUCTOR_TABLE_COLUMNS, type InstructorColumnId } from "./instructor-columns"
import { FilterDropdown } from "@/components/dashboard/ui/staff/filter-dropdown"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/dashboard/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { GridListToggle } from "@/components/dashboard/GridListToggle"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import { ColumnSelectorModal } from "@/components/dashboard/ui/ColumnSelectorModal"


interface FilterState {
  role: string[]
  gender: string[]
  experience: [number, number]
  courseAssigned: string[]
}

interface SearchAndFilterBarProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  sortBy: string
  setSortBy: (sort: string) => void
  sortOrder: "asc" | "desc"
  setSortOrder: (order: "asc" | "desc") => void
  viewMode: "grid" | "list"
  setViewMode: (mode: "grid" | "list") => void
  selectedFilters: FilterState
  setSelectedFilters: (filters: FilterState) => void
  instructors: any[]
  filteredInstructors: any[]
  onExport: () => void
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void
  selectedCount?: number
  // New optional actions to appear near Export
  onOpenDrafts?: () => void
  draftsCount?: number
  onOpenAddDialog?: () => void
}

export default function SearchAndFilterBar({
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  viewMode,
  setViewMode,
  selectedFilters,
  setSelectedFilters,
  instructors,
  filteredInstructors,
  onExport,
  onImport,
  selectedCount = 0,
  onOpenDrafts,
  draftsCount,
  onOpenAddDialog,
}: SearchAndFilterBarProps) {
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const [permanentFilterIcon, setPermanentFilterIcon] = useState<"apply" | "clear" | null>(null)
  const [pendingFilters, setPendingFilters] = useState<FilterState>(selectedFilters)

  // Sync pending filters with selected filters when they change
  useEffect(() => {
    setPendingFilters(selectedFilters)
  }, [selectedFilters])

  // Columns modal state
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const allowedColumns = INSTRUCTOR_TABLE_COLUMNS.map(c => c.id) as readonly InstructorColumnId[]
  // Both name and id are mandatory and non-removable in the column selector
  const MANDATORY_COLUMNS: readonly InstructorColumnId[] = ['name', 'id'] as const
  const anchorMandatory = (arr: InstructorColumnId[]) => {
    const rest = arr.filter(c => !MANDATORY_COLUMNS.includes(c))
    return [...MANDATORY_COLUMNS, ...rest]
  }
  const [displayedColumns, setDisplayedColumns] = useState<InstructorColumnId[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('instructorDisplayedColumns')
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as string[]
          const filtered = parsed.filter((c): c is InstructorColumnId => (allowedColumns as readonly string[]).includes(c))
          if (filtered.length) {
            // Ensure all mandatory columns are included and anchored to the start
            const missing = MANDATORY_COLUMNS.filter(m => !filtered.includes(m))
            if (missing.length) {
              return anchorMandatory(filtered as InstructorColumnId[])
            }
            return anchorMandatory(filtered as InstructorColumnId[])
          }
        } catch {}
      }
    }
    // default to all, ensuring mandatory is present
    const all = [...allowedColumns]
    return anchorMandatory(all as InstructorColumnId[])
  })
  const [draftDisplayed, setDraftDisplayed] = useState<InstructorColumnId[]>(anchorMandatory(displayedColumns))
  const [selectedAvailable, setSelectedAvailable] = useState<InstructorColumnId[]>([])
  const [selectedDisplayed, setSelectedDisplayed] = useState<InstructorColumnId[]>([])
  const [focusedList, setFocusedList] = useState<'available' | 'displayed' | null>(null)
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const availableListRef = useRef<HTMLDivElement | null>(null)
  const displayedListRef = useRef<HTMLDivElement | null>(null)
  const availableOptions = allowedColumns.filter(col => !MANDATORY_COLUMNS.includes(col) && !draftDisplayed.includes(col))

  // Close the column selector when switching to grid view (it's list-only)
  useEffect(() => {
    if (viewMode === 'grid' && showColumnSelector) {
      setShowColumnSelector(false)
    }
  }, [viewMode, showColumnSelector])

  // Helper functions for filters
  const getUniqueRoles = () => {
    const roles = instructors.map(inst => inst.role).filter(role => role != null && role !== "")
    return Array.from(new Set(roles)).sort()
  }

  const getUniqueCourses = () => {
    const courses = instructors.map(inst => inst.courseAssigned).filter(course => course != null && course !== "")
    return Array.from(new Set(courses)).sort()
  }

  const hasActiveFilters = () => {
    return (
      selectedFilters.role.length > 0 ||
      selectedFilters.gender.length > 0 ||
      selectedFilters.courseAssigned.length > 0 ||
      selectedFilters.experience[0] > 0 ||
      selectedFilters.experience[1] < 50
    )
  }

  const applyFilters = () => {
    setSelectedFilters(pendingFilters)
    setFilterDropdownOpen(false)
    setPermanentFilterIcon("apply")
  }

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      role: [],
      gender: [],
      experience: [0, 50],
      courseAssigned: [],
    }
    setPendingFilters(clearedFilters)
    setSelectedFilters(clearedFilters)
    setFilterDropdownOpen(false)
    setPermanentFilterIcon("clear")
  }

  // Helper functions for column management
  const handleAdd = () => {
    if (!selectedAvailable.length) return
    setDraftDisplayed(prev => anchorMandatory([...prev, ...selectedAvailable.filter(col => !prev.includes(col))]))
    setSelectedAvailable([])
  }

  const handleRemove = () => {
    if (!selectedDisplayed.length) return
    setDraftDisplayed(prev => anchorMandatory(prev.filter(col => MANDATORY_COLUMNS.includes(col) || !selectedDisplayed.includes(col))))
    setSelectedDisplayed([])
  }

  // Initialize focus when modal opens
  useEffect(() => {
    if (showColumnSelector) {
      setFocusedList(null)
      setFocusedIndex(-1)
      setTimeout(() => {
        if (availableListRef.current) {
          availableListRef.current.focus()
        }
      }, 100)
    }
  }, [showColumnSelector])

  // Comprehensive keyboard shortcuts system
  useEffect(() => {
    if (!showColumnSelector) return
    
    const handler = (e: KeyboardEvent) => {
      const currentList = focusedList === 'available' ? availableOptions : draftDisplayed
      const currentSelected = focusedList === 'available' ? selectedAvailable : selectedDisplayed
      const setCurrentSelected = focusedList === 'available' ? setSelectedAvailable : setSelectedDisplayed

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          if (e.shiftKey) {
            const nextIdx = Math.min(focusedIndex + 1, currentList.length - 1)
            setFocusedIndex(nextIdx)
            const item = currentList[nextIdx]
            if (item && !currentSelected.includes(item)) setCurrentSelected(prev => [...prev, item])
          } else {
            setFocusedIndex(Math.min(focusedIndex + 1, currentList.length - 1))
          }
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          if (e.shiftKey) {
            const prevIdx = Math.max(focusedIndex - 1, 0)
            setFocusedIndex(prevIdx)
            const item = currentList[prevIdx]
            if (item && !currentSelected.includes(item)) setCurrentSelected(prev => [...prev, item])
          } else {
            setFocusedIndex(Math.max(focusedIndex - 1, 0))
          }
          break
        }
        case ' ':
        case 'Enter': {
          e.preventDefault()
          if (focusedIndex < currentList.length) {
            const item = currentList[focusedIndex]
            setCurrentSelected(prev => prev.includes(item) ? prev.filter(v => v !== item) : [...prev, item])
          }
          break
        }
        case 'Tab': {
          e.preventDefault()
          if (focusedList === 'available') {
            setFocusedList('displayed')
            setFocusedIndex(0)
            displayedListRef.current?.focus()
          } else {
            setFocusedList('available')
            setFocusedIndex(0)
            availableListRef.current?.focus()
          }
          break
        }
        case 'a': case 'A': {
          if (e.ctrlKey) { 
            e.preventDefault()
            focusedList === 'available' ? setSelectedAvailable([...availableOptions]) : setSelectedDisplayed([...draftDisplayed])
          }
          break
        }
        case 'd': case 'D': {
          if (e.ctrlKey) { 
            e.preventDefault()
            focusedList === 'available' ? setSelectedAvailable([]) : setSelectedDisplayed([])
          }
          break
        }
        case 'ArrowRight': {
          if (focusedList === 'available' && selectedAvailable.length) { 
            e.preventDefault()
            handleAdd()
          }
          break
        }
        case 'ArrowLeft': {
          if (focusedList === 'displayed' && selectedDisplayed.length) { 
            e.preventDefault()
            handleRemove()
          }
          break
        }
        case 's': case 'S': {
          if (e.ctrlKey) {
            e.preventDefault()
            setDisplayedColumns(draftDisplayed)
            localStorage.setItem('instructorDisplayedColumns', JSON.stringify(draftDisplayed))
            window.dispatchEvent(new CustomEvent('instructor-displayed-columns-changed', { detail: draftDisplayed }))
            setShowColumnSelector(false)
          }
          break
        }
        case 'r': case 'R': {
          if (e.ctrlKey) { 
            e.preventDefault()
            setDraftDisplayed(displayedColumns)
            setSelectedAvailable([])
            setSelectedDisplayed([])
          }
          break
        }
        case 'Home': { 
          e.preventDefault()
          setFocusedIndex(0)
          break
        }
        case 'End': { 
          e.preventDefault()
          setFocusedIndex(currentList.length - 1)
          break
        }
        case 'Escape': { 
          e.preventDefault()
          setShowColumnSelector(false)
          break
        }
      }
    }
    
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [showColumnSelector, focusedList, focusedIndex, availableOptions, draftDisplayed, selectedAvailable, selectedDisplayed, displayedColumns, handleAdd, handleRemove])

  return (
    <div className="px-6 pb-4">
      <div className="flex flex-col lg:flex-row gap-2 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-white" />
          <Input
            placeholder="Search instructors, roles, courses..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {/* Filter Button */}
          <Popover open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 flex items-center gap-1 relative"
                    >
                      <span className="relative inline-block">
                        <Filter className="h-3.5 w-3.5 text-purple-500" />
                        {permanentFilterIcon === "apply" && (
                          <div className="absolute -top-2 -right-2 z-20">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <circle cx="10" cy="10" r="10" fill="#22C55E"/>
                              <path d="M6 10.5l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        )}
                        {permanentFilterIcon === "clear" && (
                          <div className="absolute -top-2 -right-2 z-20">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <circle cx="10" cy="10" r="10" fill="#EF4444"/>
                              <path d="M7 7l6 6M13 7l-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </div>
                        )}
                      </span>
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">Filter</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-80 p-4 filter-panel">
              {/* Role Filter */}
              <div className="mb-4">
                <div className="mb-2 font-semibold text-sm">Filter by Role</div>
                <FilterDropdown
                  options={getUniqueRoles().map(role => ({ value: role, label: role }))}
                  value={pendingFilters.role}
                  onChange={(values) => setPendingFilters({ ...pendingFilters, role: values })}
                  placeholder="Select roles..."
                  title="Roles"
                  showTitle={false}
                  className="w-full"
                />
              </div>

              {/* Gender Filter */}
              <div className="mb-4">
                <div className="mb-2 font-semibold text-sm">Filter by Gender</div>
                <FilterDropdown
                  options={[
                    { value: "Male", label: "Male" },
                    { value: "Female", label: "Female" },
                    { value: "Other", label: "Other" }
                  ]}
                  value={pendingFilters.gender}
                  onChange={(values) => setPendingFilters({ ...pendingFilters, gender: values })}
                  placeholder="Select genders..."
                  title="Genders"
                  showSearch={false}
                  className="w-full"
                />
              </div>

              {/* Experience Range */}
              <div className="mb-4">
                <div className="mb-2 font-semibold text-sm">Experience Range (Years)</div>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="number"
                    className="w-20 px-2 py-1 text-xs border rounded"
                    placeholder="Min"
                    value={pendingFilters.experience[0]}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      setPendingFilters({
                        ...pendingFilters,
                        experience: [value, pendingFilters.experience[1]]
                      })
                    }}
                  />
                  <span className="text-xs text-gray-500 dark:text-white self-center">to</span>
                  <input
                    type="number"
                    className="w-20 px-2 py-1 text-xs border rounded"
                    placeholder="Max"
                    value={pendingFilters.experience[1]}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 50
                      setPendingFilters({
                        ...pendingFilters,
                        experience: [pendingFilters.experience[0], value]
                      })
                    }}
                  />
                </div>
              </div>

              {/* Course Filter */}
              <div className="mb-4">
                <div className="mb-2 font-semibold text-sm">Filter by Course</div>
                <FilterDropdown
                  options={getUniqueCourses().map(course => ({ value: course, label: course }))}
                  value={pendingFilters.courseAssigned}
                  onChange={(values) => setPendingFilters({ ...pendingFilters, courseAssigned: values })}
                  placeholder="Select courses..."
                  title="Courses"
                  showTitle={false}
                  className="w-full"
                />
              </div>

              <div className="flex justify-between gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={clearFilters} className="text-xs">
                  Clear All
                </Button>
                <Button size="sm" onClick={applyFilters} className="bg-purple-600 hover:bg-purple-700 text-white text-xs">
                  Apply Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 flex items-center gap-1">
                      <span className="text-xs flex items-center gap-1">
                        <ArrowUpDown className="h-3 w-3" />
                        {sortBy === "name" && "Name"}
                        {sortBy === "role" && "Role"}
                        {sortBy === "experience" && "Experience"}
                        {sortBy === "gender" && "Gender"}
                        {sortBy === "courseAssigned" && "Course"}
                        {sortOrder === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">Sort</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {/* Make only the options area scrollable with up to 5 visible items; keep headers static */}
            <DropdownMenuContent className="overflow-x-hidden">
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <div className="max-h-40 overflow-y-auto pr-1">
                {[
                  { value: "name", label: "Name" },
                  { value: "role", label: "Role" },
                  { value: "experience", label: "Experience" },
                  { value: "gender", label: "Gender" },
                  { value: "courseAssigned", label: "Course Assigned" },
                ].map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={sortBy === option.value ? "bg-purple-50" : ""}
                  >
                    <span>{option.label}</span>
                    {sortBy === option.value && (
                      <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Order</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSortOrder("asc")}>
                <span className="flex items-center gap-2">
                  Ascending
                  <ArrowUp className="h-4 w-4" />
                </span>
                {sortOrder === "asc" && (
                  <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder("desc")}>
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

          {/* Grid/List View Toggle */}
          <GridListToggle viewMode={viewMode} setViewMode={setViewMode} />

          {/* Import/Export Buttons */}
          <input
            type="file"
            accept=".csv"
            className="hidden"
            id="import-csv-input"
            onChange={onImport}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('import-csv-input')?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Upload files</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="mr-2 h-4 w-4" />
                  {selectedCount > 0 ? `Export (${selectedCount})` : "Export"}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Export</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Optional: Drafts and Add buttons placed directly after Export */}
          {onOpenDrafts && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={onOpenDrafts}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Drafts{typeof draftsCount === 'number' ? ` (${draftsCount})` : ''}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">View drafts</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {onOpenAddDialog && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                    onClick={onOpenAddDialog}
                  >
                    {/* plus icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                    Add Instructor
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Add new instructor</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm mb-2 flex items-center justify-between w-full">
        <div className="flex items-center gap-2 text-[#7C3AED]">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#7C3AED] opacity-80" aria-hidden="true" />
          <span>
            Showing <span className="font-semibold">{filteredInstructors.length}</span> instructors
          </span>
        </div>
        {viewMode === 'list' && (
          <span
            className="ml-2 px-2 py-1 bg-purple-100 rounded border border-purple-300 flex items-center justify-center cursor-pointer"
            onClick={() => { setDraftDisplayed(displayedColumns); setSelectedAvailable([]); setSelectedDisplayed([]); setShowColumnSelector(true) }}
            title="Select displayed columns"
          >
            <GridIcon className="w-7 h-7" />
          </span>
        )}
      </div>

      {showColumnSelector && (
        <ColumnSelectorModal
          open={showColumnSelector}
          columns={allowedColumns as string[]}
          displayedColumns={displayedColumns as string[]}
          setDisplayedColumns={(cols: string[]) => {
            const finalList = anchorMandatory(cols as InstructorColumnId[])
            setDisplayedColumns(finalList)
            localStorage.setItem('instructorDisplayedColumns', JSON.stringify(finalList))
            window.dispatchEvent(new CustomEvent('instructor-displayed-columns-changed', { detail: finalList }))
          }}
          onClose={() => setShowColumnSelector(false)}
          onSave={() => setShowColumnSelector(false)}
          onReset={() => {
            const all = anchorMandatory(allowedColumns as InstructorColumnId[])
            setDisplayedColumns(all)
            localStorage.setItem('instructorDisplayedColumns', JSON.stringify(all))
            window.dispatchEvent(new CustomEvent('instructor-displayed-columns-changed', { detail: all }))
          }}
          storageKeyPrefix="instructor"
          getColumnLabel={(id: string) => INSTRUCTOR_TABLE_COLUMNS.find(c => c.id === id as InstructorColumnId)?.label ?? id}
          includeActionsColumn={false}
          requiredColumns={[...MANDATORY_COLUMNS] as string[]}
        />
      )}
    </div>
  )
}
