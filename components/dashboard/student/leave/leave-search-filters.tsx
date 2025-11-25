"use client"

import React, { useState, useMemo, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/dashboard/ui/dropdown-menu"
import { useToast } from "@/hooks/dashboard/use-toast"

import { 
  Search, 
  Plus,
  Filter, 
  Download, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  X,
} from "lucide-react"
import { format as formatDateFns } from 'date-fns'
import MultiSelectDropdown from "@/components/dashboard/student/students/MultiSelectDropDown"
import { ColumnSelectorModal } from "@/contexts/dashboard/ColumnSelectorModal"
import { FormattedDateInput } from "@/components/dashboard/student/common/formatted-date-input"
import { formatDateForDisplay } from '@/lib/dashboard/student/utils'
import type { LeaveRecord } from "./types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Label } from "@/components/dashboard/ui/label"
import { Dialog, DialogContent } from "@/components/dashboard/ui/dialog"
import { Textarea } from "@/components/dashboard/ui/textarea"

// Grid icon component for column selector
function GridIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="5" height="5" rx="1.5" fill="#7C3AED" />
      <rect x="10" y="3" width="5" height="5" rx="1.5" fill="#7C3AED" />
      <rect x="17" y="3" width="5" height="5" rx="1.5" fill="#7C3AED" />
      <rect x="3" y="10" width="5" height="5" rx="1.5" fill="#7C3AED" />
      <rect x="10" y="10" width="5" height="5" rx="1.5" fill="#7C3AED" />
      <rect x="17" y="10" width="5" height="5" rx="1.5" fill="#7C3AED" />
      <rect x="3" y="17" width="5" height="5" rx="1.5" fill="#7C3AED" />
      <rect x="10" y="17" width="5" height="5" rx="1.5" fill="#7C3AED" />
      <rect x="17" y="17" width="5" height="5" rx="1.5" fill="#7C3AED" />
    </svg>
  );
}

type ViewMode = "grid" | "list";

export interface LeaveSearchFiltersProps {
  leaveRecords: LeaveRecord[];
  setFilteredLeaves?: React.Dispatch<React.SetStateAction<LeaveRecord[]>>;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (v: "asc" | "desc") => void;
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  selectedIds?: string[];
  displayedColumns?: string[];
  setDisplayedColumns?: (cols: string[]) => void;
  // Optional quick date window dropdown (to render between search and filters)
  dateWindow?: 'today' | '7d' | '15d';
  setDateWindow?: (v: 'today' | '7d' | '15d') => void;
}

type Filters = {
  cohorts: string[];
  courses: string[];
  dateRange: { start: string; end: string };
};

export default function LeaveSearchFilters({
  leaveRecords,
  setFilteredLeaves,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  viewMode,
  setViewMode,
  selectedIds = [],
  displayedColumns,
  setDisplayedColumns,
  dateWindow,
  setDateWindow,
}: LeaveSearchFiltersProps) {
  const { toast } = useToast();
  // Today's date ISO (yyyy-MM-dd) to cap date pickers
  const todayIso = React.useMemo(() => new Date().toISOString().split('T')[0], []);

  // Column management
  const leaveColumns = ['Student ID', 'Student Name', 'Leave Count', 'Date', 'Status', 'Course Details', 'Cohort Details', 'Remarks'];
  const defaultDisplayedColumns = ['Student ID', 'Student Name', 'Leave Count', 'Date', 'Status', 'Cohort Details', 'Remarks'];
  const currentDisplayedColumns = displayedColumns || defaultDisplayedColumns;
  const fixedColumns = ['Student ID', 'Student Name', 'Date', 'Status'];
  const [showLeaveColumnSelector, setShowLeaveColumnSelector] = useState(false);
  
  // Close column selector automatically if user switches to grid view
  React.useEffect(() => { 
    if(viewMode === 'grid' && showLeaveColumnSelector) 
      setShowLeaveColumnSelector(false); 
  }, [viewMode, showLeaveColumnSelector]);

  // Ensure default sort is by Date when component mounts
  React.useEffect(() => {
    if (!sortBy) setSortBy('date');
  }, [sortBy, setSortBy]);

  // Hydrate persisted view mode
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('leaveViewMode');
      if (stored === 'grid' || stored === 'list') {
        setViewMode(stored as ViewMode);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist view mode changes
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem('leaveViewMode', viewMode); } catch {}
  }, [viewMode]);

  // Hydrate persisted column selections
  React.useEffect(() => {
    if (typeof window === 'undefined' || !setDisplayedColumns) return;
    try {
      const rawLeave = localStorage.getItem('leaveDisplayedColumns');
      if (rawLeave) {
        const arr = JSON.parse(rawLeave);
        if (Array.isArray(arr)) {
          // Migrate legacy label 'Notes' -> 'Remarks' and filter against current columns
          const migrated = arr.map((c: string) => (c === 'Notes' ? 'Remarks' : c));
          const valid = migrated.filter((c: string) => leaveColumns.includes(c));
          if (valid.length > 0) {
            setDisplayedColumns(valid);
          }
        }
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute filter options from current dataset
  const cohorts = useMemo(() => {
    const cohortSet = new Set<string>();
    leaveRecords.forEach(r => {
      if (r.cohortName) cohortSet.add(r.cohortName);
    });
    return Array.from(cohortSet);
  }, [leaveRecords]);
  
  const courses = useMemo(() => {
    const courseSet = new Set<string>();
    leaveRecords.forEach(r => {
      if (r.courseName) courseSet.add(r.courseName);
    });
    return Array.from(courseSet);
  }, [leaveRecords]);

  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [filterAction, setFilterAction] = useState<"applied" | "cleared" | null>(null);
  const [pendingFilters, setPendingFilters] = useState<Filters>({
    cohorts: [],
    courses: [],
    dateRange: { start: "", end: "" },
  });
  const [selectedFilters, setSelectedFilters] = useState<Filters>({
    cohorts: [],
    courses: [],
    dateRange: { start: "", end: "" },
  });

  // Leave Request (Coming Soon) modal state
  const [requestOpen, setRequestOpen] = useState(false)
  const [request, setRequest] = useState({
    cohort: "",
    course: "",
    leaveType: "",
    start: "",
    end: "",
    reason: "",
  })
  const modalDisabled = true

  // Filtering + sorting logic
  const filtered = useMemo(() => {
    let data = leaveRecords || [];
    
    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      data = data.filter(r => {
        const studentMatch = r.studentName?.toLowerCase().includes(q) || r.studentId?.toLowerCase().includes(q);
        const cohortMatch = r.cohortName?.toLowerCase().includes(q) || r.cohortInstructor?.toLowerCase().includes(q);
        const courseMatch = r.courseName?.toLowerCase().includes(q);
        const notesMatch = r.notes?.toLowerCase().includes(q);
        return studentMatch || cohortMatch || courseMatch || notesMatch;
      });
    }
    
    // Cohorts
    if (selectedFilters.cohorts.length) {
      data = data.filter(r => selectedFilters.cohorts.includes(r.cohortName || ''));
    }
    
    // Courses
    if (selectedFilters.courses.length) {
      data = data.filter(r => selectedFilters.courses.includes(r.courseName || ''));
    }

    // Date range
    if (selectedFilters.dateRange.start || selectedFilters.dateRange.end) {
      const start = selectedFilters.dateRange.start ? new Date(selectedFilters.dateRange.start) : null;
      const end = selectedFilters.dateRange.end ? new Date(selectedFilters.dateRange.end) : null;
      data = data.filter(r => {
        const date = new Date(r.date);
        if (start && date < start) return false;
        if (end && date > end) return false;
        return true;
      });
    }
    
    // Sort
    const sorted = [...data].sort((a, b) => {
      let vA: any;
      let vB: any;
      switch (sortBy) {
        case 'studentName':
          vA = a.studentName || '';
          vB = b.studentName || '';
          break;
        case 'studentId':
          vA = a.studentId || '';
          vB = b.studentId || '';
          break;
        case 'cohortName':
          vA = a.cohortName || '';
          vB = b.cohortName || '';
          break;
        case 'courseName':
          vA = a.courseName || '';
          vB = b.courseName || '';
          break;
        case 'date':
        default:
          vA = a.date || '';
          vB = b.date || '';
      }
      if (typeof vA === "string") vA = vA.toLowerCase();
      if (typeof vB === "string") vB = vB.toLowerCase();
      if (vA < vB) return sortOrder === "asc" ? -1 : 1;
      if (vA > vB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [leaveRecords, searchTerm, selectedFilters, sortBy, sortOrder]);

  // Push filtered results up
  React.useEffect(() => {
    if (!setFilteredLeaves) return;
    setFilteredLeaves(prev => {
      if (prev.length !== filtered.length) return filtered;
      for (let i = 0; i < prev.length; i++) {
        if (prev[i].id !== filtered[i].id) return filtered;
        if (
          prev[i].date !== filtered[i].date ||
          prev[i].studentName !== filtered[i].studentName
        ) {
          return filtered;
        }
      }
      return prev;
    });
  }, [filtered, setFilteredLeaves]);

  // Export helper
  function toCSV(rows: LeaveRecord[]) {
  const columns: { header: string; getter: (r: LeaveRecord) => any }[] = [
      { header: 'Student ID', getter: r => r.studentId || '' },
      { header: 'Student Name', getter: r => r.studentName || '' },
      { header: 'Course ID', getter: r => r.courseId || '' },
      { header: 'Course Name', getter: r => r.courseName || '' },
  { header: 'Cohort Name', getter: r => r.cohortName || '' },
  { header: 'Cohort Instructor', getter: r => r.cohortInstructor || '' },
  { header: 'Date', getter: r => formatDateForDisplay(r.date || '') },
      { header: 'Status', getter: r => 'Absent' },
      { header: 'Remarks', getter: r => r.notes || '' },
    ];

    const esc = (v: any) => {
      const s = v == null ? '' : String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const headerLine = columns.map(c => esc(c.header)).join(',');
    const lines = [headerLine];
    rows.forEach(r => {
      lines.push(columns.map(c => esc(c.getter(r))).join(','));
    });
    return lines.join('\n');
  }

  function download(filename: string, content: string, type = 'text/csv;charset=utf-8;') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleExportAll() {
    const csv = toCSV(filtered);
  download(`student-leaves-all-${formatDateFns(new Date(), 'dd-MMM-yyyy')}.csv`, csv);
    toast({
      title: "Export completed",
      description: `Exported ${filtered.length} leave records successfully.`,
    });
  }
  
  function handleExportSelected() {
    if (!selectedIds?.length) {
      handleExportAll();
      return;
    }
    const byId = new Map(filtered.map(r => [r.id.toString(), r] as const));
    const rows = selectedIds.map(id => byId.get(id)).filter(Boolean) as LeaveRecord[];
    const csv = toCSV(rows);
  download(`student-leaves-selected-${formatDateFns(new Date(), 'dd-MMM-yyyy')}.csv`, csv);
    toast({
      title: "Export completed",
      description: `Exported ${rows.length} selected leave records successfully.`,
    });
  }

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-2 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-white" />
          <Input
            placeholder="Search students, courses, cohorts..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
          {/* Optional Date Window dropdown between Search and Filter */}
          {dateWindow && setDateWindow && (
            <div className="flex items-center gap-2">
              
              <Select value={dateWindow} onValueChange={(v)=>setDateWindow(v as any)}>
                <SelectTrigger className="h-9 w-40">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7d">Past 7 days</SelectItem>
                  <SelectItem value="15d">Past 15 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Filter Button & Panel */}
          <Popover open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 flex items-center gap-1 relative"
                aria-label="Filter options"
                title="Filter"
                tabIndex={0}
              >
                <span className="relative inline-block">
                  <Filter className="h-3.5 w-3.5 text-purple-500" />
                  {filterAction === 'applied' && (
                    <span className="absolute -top-1 -right-1">
                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-green-500">
                        <Check className="w-2 h-2 text-white" />
                      </span>
                    </span>
                  )}
                  {filterAction === 'cleared' && (
                    <span className="absolute -top-1 -right-1">
                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-red-500">
                        <X className="w-2 h-2 text-white" />
                      </span>
                    </span>
                  )}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-72 p-0"
              onCloseAutoFocus={e => e.preventDefault()}
              onEscapeKeyDown={() => setFilterDropdownOpen(false)}
              onInteractOutside={() => setFilterDropdownOpen(false)}
            >
              <div className="max-h-96 overflow-y-auto p-4 text-black">
                <MultiSelectDropdown
                  label="Cohort"
                  options={cohorts}
                  selected={pendingFilters.cohorts}
                  onChange={(next) => setPendingFilters(prev => ({ ...prev, cohorts: next }))}
                  className="mb-3"
                />
                <MultiSelectDropdown
                  label="Enrolled Course"
                  options={courses}
                  selected={pendingFilters.courses}
                  onChange={(next) => setPendingFilters(prev => ({ ...prev, courses: next }))}
                  className="mb-3"
                />
                <div className="mb-2 font-semibold text-sm">Date Range</div>
                <div className="flex items-center gap-2">
                  <div className="w-32">
                    <FormattedDateInput
                      id="dateRangeStart"
                      value={pendingFilters.dateRange.start}
                      onChange={(iso) => setPendingFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: iso } }))}
                      // Start date cannot be after end or after today
                      max={(pendingFilters.dateRange.end && pendingFilters.dateRange.end < todayIso)
                        ? pendingFilters.dateRange.end
                        : todayIso}
                      displayFormat="dd-MMM-yyyy"
                      placeholder="From date"
                      className="text-xs py-1 text-black placeholder:text-black"
                    />
                  </div>
                  <span className="text-xs text-black">to</span>
                  <div className="w-32">
                    <FormattedDateInput
                      id="dateRangeEnd"
                      value={pendingFilters.dateRange.end}
                      onChange={(iso) => setPendingFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: iso } }))}
                      min={pendingFilters.dateRange.start || undefined}
                      max={todayIso}
                      displayFormat="dd-MMM-yyyy"
                      placeholder="To date"
                      className="text-xs py-1 text-black placeholder:text-black"
                    />
                  </div>
                </div>
                <div className="flex justify-between gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1"
                    onClick={() => {
                      setSelectedFilters({ ...pendingFilters });
                      setFilterDropdownOpen(false);
                      setFilterAction('applied');
                    }}
                  >
                    Apply Filters
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      const cleared = { cohorts: [], courses: [], dateRange: { start: '', end: '' } };
                      setPendingFilters(cleared);
                      setSelectedFilters(cleared);
                      setFilterDropdownOpen(false);
                      setFilterAction('cleared');
                    }}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" title="Sort" size="sm" className="h-9 flex items-center gap-1">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <span className="ml-1 text-xs text-gray-600 dark:text-white">
                  {(() => {
                    const label = [
                      { value: 'date', label: 'Date' },
                      { value: 'studentName', label: 'Student Name' },
                      { value: 'studentId', label: 'Student ID' },
                      { value: 'cohortName', label: 'Cohort' },
                      { value: 'courseName', label: 'Course' },
                    ].find(o => o.value === sortBy)?.label;
                    return label || 'Sort';
                  })()}
                </span>
                {sortOrder === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              {[
                { value: 'date', label: 'Date' },
                { value: 'studentName', label: 'Student Name' },
                { value: 'studentId', label: 'Student ID' },
                { value: 'cohortName', label: 'Cohort' },
                { value: 'courseName', label: 'Course' },
              ].map(option => (
                <DropdownMenuItem key={option.value} onClick={() => setSortBy(option.value)}>
                  {option.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Order</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSortOrder('asc')}>
                Ascending
                <ArrowUp className="h-4 w-4 mr-2" />
                
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder('desc')}>
                Descending
                <ArrowDown className="h-4 w-4 mr-2" />
                
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-r-none"
              title="List View"
              aria-label="List View"
            >
              <div className="flex flex-col gap-0.5 w-4 h-4">
                <div className="bg-current h-0.5 rounded-sm" />
                <div className="bg-current h-0.5 rounded-sm" />
                <div className="bg-current h-0.5 rounded-sm" />
              </div>
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-l-none border-l"
              title="Grid View"
              aria-label="Grid View"
            >
              <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                <div className="bg-current rounded-sm" />
                <div className="bg-current rounded-sm" />
                <div className="bg-current rounded-sm" />
                <div className="bg-current rounded-sm" />
              </div>
            </Button>
          </div>

          {/* Export */}
          
          <Button 
            variant="outline" 
            size="sm" 
            title={selectedIds.length > 0 ? `Export ${selectedIds.length} selected` : 'Export all leave records'}
            onClick={() => { selectedIds.length > 0 ? handleExportSelected() : handleExportAll(); }}
          >
            <Download className="h-4 w-4 mr-2" />
            {selectedIds.length > 0 ? `Export (${selectedIds.length})` : 'Export'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            title="Request Leave (Coming soon)"
            className="h-9 bg-gray-50 hover:bg-gray-100"
            onClick={() => setRequestOpen(true)}
            
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Leave Request <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block ml-1" />
          </Button>
        </div>
      </div>

      {/* Leave count and Column Selector */}
      <div className="flex items-center justify-between mb-4 bg-purple-50 rounded-lg px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-purple-500 rounded-full" />
          <span className="text-purple-600 font-medium text-sm">{filtered.length}</span>
          <span className="text-purple-600 text-sm">
            leave record{filtered.length !== 1 ? 's' : ''} found
          </span>
        </div>
        {viewMode === 'list' && setDisplayedColumns && (
          <button
            className="w-10 h-10 rounded-xl border border-purple-200 bg-[#fef2ff] hover:bg-purple-100 flex items-center justify-center shadow-sm hover:shadow transition-colors"
            onClick={() => setShowLeaveColumnSelector(true)}
            title="Displayed Columns"
            aria-label="Edit displayed leave columns"
          >
            <GridIcon className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Column Selector Modal */}
      <ColumnSelectorModal
        open={showLeaveColumnSelector}
        columns={leaveColumns}
        displayedColumns={currentDisplayedColumns}
        setDisplayedColumns={(cols) => {
          if (setDisplayedColumns) {
            setDisplayedColumns(cols);
            localStorage.setItem('leaveDisplayedColumns', JSON.stringify(cols));
          }
        }}
        onClose={() => setShowLeaveColumnSelector(false)}
        onSave={() => setShowLeaveColumnSelector(false)}
        onReset={() => {
          if (setDisplayedColumns) {
            setDisplayedColumns(defaultDisplayedColumns);
            localStorage.setItem('leaveDisplayedColumns', JSON.stringify(defaultDisplayedColumns));
          }
        }}
        storageKeyPrefix="leave"
        fixedColumns={fixedColumns}
      />

      {/* Leave Request Modal (Coming Soon) */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">New Leave Request</h2>
              <p className="text-xs text-muted-foreground">Submit a leave request for a student</p>
            </div>
            <span className="ml-3 inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700 border border-purple-200 gap-1"><Image src="/Coming soon.svg" alt="Coming Soon" width={12} height={12} className="inline-block" /> Coming soon</span>
          </div>

          <div className="rounded-md border bg-purple-50 text-purple-700 text-xs px-3 py-2">
            This is a preview of the upcoming student leave request. Actions are disabled.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pointer-events-none select-none opacity-90">
            <div>
              <Label className="text-sm">Cohort</Label>
              <Select value={request.cohort} onValueChange={(v)=>setRequest(p=>({...p, cohort:v}))}>
                <SelectTrigger className="mt-1" disabled={modalDisabled}><SelectValue placeholder="Select cohort" /></SelectTrigger>
                <SelectContent>
                  {cohorts.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Course</Label>
              <Select value={request.course} onValueChange={(v)=>setRequest(p=>({...p, course:v}))}>
                <SelectTrigger className="mt-1" disabled={modalDisabled}><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Leave Type</Label>
              <Select value={request.leaveType} onValueChange={(v)=>setRequest(p=>({...p, leaveType:v}))}>
                <SelectTrigger className="mt-1" disabled={modalDisabled}><SelectValue placeholder="Select leave type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div></div>
            <div>
              <Label className="text-sm">Start Date</Label>
              <FormattedDateInput
                id="lr-start-date"
                value={request.start}
                onChange={(iso)=>setRequest(p=>({...p,start:iso}))}
                max={todayIso}
                displayFormat="dd-MMM-yyyy"
                placeholder="dd-mmm-yyyy"
                className="py-2 mt-1"
                disabled={modalDisabled}
              />
            </div>
            <div>
              <Label className="text-sm">End Date</Label>
              <FormattedDateInput
                id="lr-end-date"
                value={request.end}
                onChange={(iso)=>setRequest(p=>({...p,end:iso}))}
                min={request.start || undefined}
                max={todayIso}
                displayFormat="dd-MMM-yyyy"
                placeholder="dd-mmm-yyyy"
                className="py-2 mt-1"
                disabled={modalDisabled}
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm">Reason</Label>
              <Textarea className="mt-1" rows={3} placeholder="Please provide a reason for your leave request" value={request.reason} onChange={e=>setRequest(p=>({...p, reason:e.target.value}))} disabled={modalDisabled} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={()=>setRequestOpen(false)}>Close</Button>
            <Button variant="outline" disabled title="Coming soon">Save Draft</Button>
            <Button className="bg-purple-600 text-white" disabled title="Coming soon">Create Request</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
