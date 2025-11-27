"use client"

import React, { useState, useMemo, useRef } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Label } from "@/components/dashboard/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
// Removed Select-based sort UI in favor of student-style dropdown
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/dashboard/ui/dropdown-menu"

import { useToast } from "@/hooks/dashboard/use-toast"
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Plus, 
  Grid3X3, 
  List, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  
  Users,
  BookOpen,
  Check,
  X
} from "lucide-react"
import { useCustomColors } from "@/lib/use-custom-colors"
import { sortButtonClass, getSortButtonStyle } from "@/lib/dashboard/sort-button-style"
import MultiSelectDropdown from "@/components/dashboard/student/students/MultiSelectDropDown"
import { format as formatDateFns } from 'date-fns'
import { ColumnSelectorModal } from "@/contexts/dashboard/ColumnSelectorModal"
import { FormattedDateInput } from "@/components/dashboard/student/common/formatted-date-input"
import { formatDateForDisplay } from '@/lib/dashboard/student/utils'

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

interface StudentAttendanceRecord {
  id: string | number;
  studentId: string;
  studentName: string;
  cohortId?: string;
  cohortName?: string;
  cohortInstructor?: string;
  cohortTiming?: string;
  courseId?: string;
  courseName?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  status: 'present' | 'absent' | string;
  notes?: string;
}

export interface AttendanceSearchFiltersProps {
  attendanceRecords: StudentAttendanceRecord[];
  setFilteredAttendance?: React.Dispatch<React.SetStateAction<StudentAttendanceRecord[]>>;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (v: "asc" | "desc") => void;
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  onAddAttendance?: () => void;
  onImport?: (items: StudentAttendanceRecord[]) => void;
  selectedIds?: string[];
  // Column management props
  displayedColumns?: string[];
  setDisplayedColumns?: (cols: string[]) => void;
  // Drafts functionality
  onOpenDrafts?: () => void;
  draftCount?: number;
  // Optional quick date window dropdown (renders between search and filters when provided)
  dateWindow?: 'today' | '7d' | '15d';
  setDateWindow?: (v: 'today' | '7d' | '15d') => void;
}

type Filters = {
  statuses: string[];
  cohorts: string[];
  dateRange: { start: string; end: string };
};

export default function AttendanceSearchFilters({
  attendanceRecords,
  setFilteredAttendance,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  viewMode,
  setViewMode,
  onAddAttendance,
  onImport,
  selectedIds = [],
  displayedColumns,
  setDisplayedColumns,
  onOpenDrafts,
  draftCount: draftCountProp,
  dateWindow,
  setDateWindow,
}: AttendanceSearchFiltersProps) {
  const { toast } = useToast();
  const { primaryColor } = useCustomColors();
  // Today's date in ISO (yyyy-MM-dd) to cap date pickers
  const todayIso = React.useMemo(() => new Date().toISOString().split('T')[0], []);

  // Column management
  const attendanceColumns = ['Student ID', 'Student Name', 'Date', 'Status', 'Course Details', 'Cohort Details', 'Start Time', 'End Time', 'Remarks'];
  const defaultDisplayedColumns = ['Student ID', 'Student Name', 'Date', 'Status', 'Course Details', 'Cohort Details', 'Remarks'];
  const currentDisplayedColumns = displayedColumns || defaultDisplayedColumns;
  // Fixed columns that cannot be deselected by users
  const fixedColumns = ['Student ID', 'Student Name', 'Date', 'Status'];
  const [showAttendanceColumnSelector, setShowAttendanceColumnSelector] = useState(false);
  
  // Close column selector automatically if user switches to grid view
  React.useEffect(() => { 
    if(viewMode === 'grid' && showAttendanceColumnSelector) 
      setShowAttendanceColumnSelector(false); 
  }, [viewMode, showAttendanceColumnSelector]);

  // Draft count state (for attendance drafts)
  const [draftCount, setDraftCount] = useState(0);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('attendanceDraftsCount');
      if (raw) setDraftCount(Number(raw) || 0);
    } catch {}
  }, []);
  const effectiveDraftCount = typeof draftCountProp === 'number' ? draftCountProp : draftCount;

  // Ensure default sort is by Date when component mounts
  React.useEffect(() => {
    if (!sortBy) setSortBy('date');
  }, [sortBy, setSortBy]);

  // Hydrate persisted view mode
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('attendanceViewMode');
      if (stored === 'grid' || stored === 'list') {
        setViewMode(stored as ViewMode);
      }
    } catch {}
  // run only once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist view mode changes
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem('attendanceViewMode', viewMode); } catch {}
  }, [viewMode]);

  // Hydrate persisted column selections
  React.useEffect(() => {
    if (typeof window === 'undefined' || !setDisplayedColumns) return;
    try {
      const rawAttendance = localStorage.getItem('attendanceDisplayedColumns');
      if (rawAttendance) {
        const arr = JSON.parse(rawAttendance);
        if (Array.isArray(arr)) {
          // Migrate legacy label 'Notes' to 'Remarks'
          const migrated = arr.map((c: string) => (c === 'Notes' ? 'Remarks' : c));
          const valid = migrated.filter((c: string) => attendanceColumns.includes(c));
          if (valid.length > 0) {
            setDisplayedColumns(valid);
          }
        }
      }
    } catch {}
  }, []);

  // Compute filter options from current dataset
  const statuses = useMemo(() => {
    const statusSet = new Set<string>();
    attendanceRecords.forEach(r => {
      if (r.status) statusSet.add(r.status);
    });
    return Array.from(statusSet);
  }, [attendanceRecords]);
  
  const cohorts = useMemo(() => {
    const cohortSet = new Set<string>();
    attendanceRecords.forEach(r => {
      if (r.cohortName) cohortSet.add(r.cohortName);
    });
    return Array.from(cohortSet);
  }, [attendanceRecords]);
  
  // Instructor filter removed per latest requirement.

  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [filterAction, setFilterAction] = useState<"applied" | "cleared" | null>(null);
  const [pendingFilters, setPendingFilters] = useState<Filters>({
    statuses: [],
    cohorts: [],
    dateRange: { start: "", end: "" },
  });
  const [selectedFilters, setSelectedFilters] = useState<Filters>({
    statuses: [],
    cohorts: [],
    dateRange: { start: "", end: "" },
  });
  const firstCheckboxRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Import progress state
  const [importing, setImporting] = useState(false);
  const [importStats, setImportStats] = useState({ processed: 0, total: 0, inserted: 0, duplicates: 0, invalid: 0, errors: 0 });

  // Filtering + sorting logic
  const filtered = useMemo(() => {
    let data = attendanceRecords || [];
    
    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      data = data.filter(r => {
        const studentMatch = r.studentName?.toLowerCase().includes(q) || r.studentId?.toLowerCase().includes(q);
        const cohortMatch = r.cohortName?.toLowerCase().includes(q) || r.cohortInstructor?.toLowerCase().includes(q);
        const notesMatch = r.notes?.toLowerCase().includes(q);
        return studentMatch || cohortMatch || notesMatch;
      });
    }
    
    // Status
    if (selectedFilters.statuses.length) {
      data = data.filter(r => selectedFilters.statuses.includes(r.status));
    }
    
    // Cohorts
    if (selectedFilters.cohorts.length) {
      data = data.filter(r => selectedFilters.cohorts.includes(r.cohortName || ''));
    }
    
    // Instructors
    // Instructor filtering removed.

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
        case 'status':
          vA = a.status || '';
          vB = b.status || '';
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
  }, [attendanceRecords, searchTerm, selectedFilters, sortBy, sortOrder]);

  // Push filtered results up only if they actually changed (avoid infinite re-render loop)
  React.useEffect(() => {
    if (!setFilteredAttendance) return;
    setFilteredAttendance(prev => {
      // If lengths differ -> definitely changed
      if (prev.length !== filtered.length) return filtered;
      // Shallow identity check by id & shallow field references
      for (let i = 0; i < prev.length; i++) {
        if (prev[i].id !== filtered[i].id) return filtered;
        // Optionally compare a few frequently changing fields to catch resort
        if (
          prev[i].status !== filtered[i].status ||
          prev[i].date !== filtered[i].date ||
          prev[i].studentName !== filtered[i].studentName
        ) {
          return filtered;
        }
      }
      // No meaningful change -> keep previous reference to prevent re-render
      return prev;
    });
  }, [filtered, setFilteredAttendance]);

  // ---------- Import / Export helpers ----------
  function toCSV(rows: StudentAttendanceRecord[]) {
    const columns: { header: string; getter: (r: StudentAttendanceRecord) => any }[] = [
      { header: 'Student ID', getter: r => r.studentId || '' },
      { header: 'Student Name', getter: r => r.studentName || '' },
      { header: 'Course ID', getter: r => r.courseId || '' },
      { header: 'Course Name', getter: r => r.courseName || '' },
      { header: 'Cohort Name', getter: r => r.cohortName || '' },
      { header: 'Cohort Instructor', getter: r => r.cohortInstructor || '' },
      { header: 'Cohort Timing', getter: r => r.cohortTiming || '' },
  { header: 'Date', getter: r => formatDateForDisplay(r.date || '') },
      { header: 'Start Time', getter: r => r.startTime || '' },
      { header: 'End Time', getter: r => r.endTime || '' },
      { header: 'Status', getter: r => r.status || '' },
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
  download(`attendance-all-${formatDateFns(new Date(), 'dd-MMM-yyyy')}.csv`, csv);
    toast({
      title: "Export completed",
      description: `Exported ${filtered.length} attendance records successfully.`,
    });
  }
  
  function handleExportSelected() {
    if (!selectedIds?.length) {
      handleExportAll();
      return;
    }
    const byId = new Map(filtered.map(r => [r.id.toString(), r] as const));
    const rows = selectedIds.map(id => byId.get(id)).filter(Boolean) as StudentAttendanceRecord[];
    const csv = toCSV(rows);
  download(`attendance-selected-${formatDateFns(new Date(), 'dd-MMM-yyyy')}.csv`, csv);
    toast({
      title: "Export completed",
      description: `Exported ${rows.length} selected attendance records successfully.`,
    });
  }

  function parseCSV(text: string): any[] {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];
    const split = (line: string) => {
      const out: string[] = [];
      let cur = '';
      let inQ = false;
      for (let i=0;i<line.length;i++) {
        const ch = line[i];
        if (ch === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
        else if (ch === ',' && !inQ) { out.push(cur); cur = ''; }
        else cur += ch;
      }
      out.push(cur);
      return out;
    };
    const headers = split(lines[0]).map(h => h.trim());
    return lines.slice(1).map(l => {
      const cols = split(l);
      const o: any = {};
      headers.forEach((h, idx) => { o[h] = cols[idx] || ''; });
      return o;
    });
  }

  function normalizeAttendanceRecord(o: any): StudentAttendanceRecord {
    return {
      id: 0, // Will be auto-generated
      studentId: String(o.studentId || o.StudentId || o["Student ID"] || "").trim(),
      studentName: String(o.studentName || o.StudentName || o["Student Name"] || "").trim(),
      cohortId: String(o.cohortId || o.CohortId || "").trim(),
      cohortName: String(o.cohortName || o.CohortName || o["Cohort Name"] || "").trim(),
      cohortInstructor: String(o.cohortInstructor || o.CohortInstructor || o["Cohort Instructor"] || "").trim(),
      cohortTiming: String(o.cohortTiming || o.CohortTiming || o["Cohort Timing"] || "").trim(),
      date: String(o.date || o.Date || "").trim(),
      startTime: String(o.startTime || o.StartTime || o["Start Time"] || "").trim(),
      endTime: String(o.endTime || o.EndTime || o["End Time"] || "").trim(),
      status: String(o.status || o.Status || "present").trim() as any,
      notes: String(o.notes || o.Notes || "").trim(),
    };
  }

  async function importAttendanceBatch(items: StudentAttendanceRecord[]) {
    const successes: StudentAttendanceRecord[] = [];
    let inserted = 0, duplicates = 0, errors = 0;
    
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      
      try {
        // Here you would typically make an API call to save the attendance record
        // For now, we'll just simulate success
        successes.push(it);
        inserted++;
      } catch (err) {
        errors++;
      }
      
      // Update progress
      setImportStats(prev => ({ 
        ...prev, 
        processed: i + 1,
        inserted,
        duplicates, 
        errors 
      }));
    }
    
    console.log('Import batch complete. Successes:', successes.length);
    return { successes, stats: { inserted, duplicates, errors, processed: items.length } };
  }

  function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate that only CSV files are allowed
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({ 
        title: 'Invalid file type', 
        description: 'Please select a CSV file (.csv) only', 
        variant: 'destructive' 
      });
      e.target.value = ''; // Clear the input
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setImporting(true);
        setImportStats({ processed: 0, total: 0, inserted: 0, duplicates: 0, invalid: 0, errors: 0 });
        
        const csvData = parseCSV(reader.result as string);
        const normalized = csvData.map(normalizeAttendanceRecord);
        setImportStats(prev => ({ ...prev, total: normalized.length }));
        
        const result = await importAttendanceBatch(normalized);
        
        if (onImport) onImport(result.successes);
        
        toast({
          title: "Import completed",
          description: `Processed ${result.stats.processed} records. Inserted: ${result.stats.inserted}, Errors: ${result.stats.errors}`,
        });
      } catch (err) {
        console.error('Import error:', err);
        toast({ 
          title: 'Import failed', 
          description: 'An error occurred while importing the file', 
          variant: 'destructive' 
        });
      } finally {
        setImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-2 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-white" />
          <Input
            placeholder="Search students, cohorts..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
            {/* Optional Date Window dropdown (renders between search and filters) */}
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
          {/* Filter Button & Panel (mirrors student implementation) */}
          <Popover open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 flex items-center gap-1 relative group"
                aria-label="Filter options"
                title="Filter"
                tabIndex={0}
              >
                  <span className="relative inline-flex text-purple-500 transition-colors duration-200 group-hover:text-white">
                    <Filter className="h-3.5 w-3.5" />
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
                  label="Status"
                  options={statuses}
                  selected={pendingFilters.statuses}
                  onChange={(next) => setPendingFilters(prev => ({ ...prev, statuses: next }))}
                  displayTransform={(s)=> s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s}
                  className="mb-3"
                />
                <MultiSelectDropdown
                  label="Cohort"
                  options={cohorts}
                  selected={pendingFilters.cohorts}
                  onChange={(next) => setPendingFilters(prev => ({ ...prev, cohorts: next }))}
                  className="mb-3"
                />
                <div className="mb-2 font-semibold text-sm">Date Range</div>
                <div className="flex items-center gap-2">
                  <div className="w-32">
                    <FormattedDateInput
                      id="dateRangeStart"
                      value={pendingFilters.dateRange.start}
                      onChange={(iso) => setPendingFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: iso } }))}
                      // Do not allow selecting a start date beyond today or beyond the selected end date
                      max={(pendingFilters.dateRange.end && pendingFilters.dateRange.end < todayIso)
                        ? pendingFilters.dateRange.end
                        : todayIso}
                      displayFormat="dd-MMM-yyyy"
                      placeholder="dd-mmm-yyyy"
                      className="text-xs py-1 text-black placeholder:text-black"
                    />
                  </div>
                  <span className="text-xs text-black">to</span>
                  <div className="w-32">
                    <FormattedDateInput
                      id="dateRangeEnd"
                      value={pendingFilters.dateRange.end}
                      onChange={(iso) => setPendingFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: iso } }))}
                      // End date cannot be before start date and cannot be in the future
                      min={pendingFilters.dateRange.start || undefined}
                      max={todayIso}
                      displayFormat="dd-MMM-yyyy"
                      placeholder="dd-mmm-yyyy"
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
                      const cleared = { statuses: [], cohorts: [], dateRange: { start: '', end: '' } };
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

        {/* Sort (student-style dropdown) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              title="Sort"
              size="sm"
              className={sortButtonClass}
              style={getSortButtonStyle(primaryColor)}
            >
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <span className="ml-1 text-xs">
                {(() => {
                  const label = [
                    { value: 'date', label: 'Date' },
                    { value: 'studentName', label: 'Student Name' },
                    { value: 'studentId', label: 'Student ID' },
                    { value: 'cohortName', label: 'Cohort' },
                    { value: 'status', label: 'Status' },
                  ].find(o => o.value === sortBy)?.label;
                  return label || 'Sort';
                })()}
              </span>
              {sortOrder === 'asc' ? (
                <ArrowUp className="ml-2 h-3 w-3" />
              ) : (
                <ArrowDown className="ml-2 h-3 w-3" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            {[
              { value: 'date', label: 'Date' },
              { value: 'studentName', label: 'Student Name' },
              { value: 'studentId', label: 'Student ID' },
              { value: 'cohortName', label: 'Cohort' },
              { value: 'status', label: 'Status' },
            ].map(option => (
              <DropdownMenuItem key={option.value} onClick={() => setSortBy(option.value)}>
                <span>{option.label}</span>
                {sortBy === option.value && (
                  <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Order</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setSortOrder('asc')}>
              <span className="flex items-center gap-2">
                Ascending
                <ArrowUp className="h-4 w-4" />
              </span>
              {sortOrder === 'asc' && (
                <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOrder('desc')}>
              <span className="flex items-center gap-2">
                Descending
                <ArrowDown className="h-4 w-4" />
              </span>
              {sortOrder === 'desc' && (
                <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View toggle (moved next to Sort) */}
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

        {/* Import */}
        
        <Button variant="outline" size="sm" title="Upload Files" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-2" />
          Import
              </Button>
           
        <input
          ref={fileInputRef}
          type="file"
          accept="text/csv,.csv"
          onChange={handleImportFileChange}
          className="hidden"
        />

  {/* Export */}
        <Button 
          variant="outline" 
          size="sm" 
          title={selectedIds.length > 0 ? `Export ${selectedIds.length} selected` : 'Export all attendance records'}
          onClick={() => { selectedIds.length > 0 ? handleExportSelected() : handleExportAll(); }}
        >
          <Download className="h-4 w-4 mr-2" />
          {selectedIds.length > 0 ? `Export (${selectedIds.length})` : 'Export'}
        </Button>

  {/* Drafts */}
        {onOpenDrafts && (
          <Button
            onClick={onOpenDrafts}
            size="sm"
            className="h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
            title={`Drafts (${effectiveDraftCount})`}
          >
            <FileText className="h-4 w-4 mr-2" />
            Drafts ({effectiveDraftCount})
          </Button>
        )}

        {/* Add Attendance */}
        {onAddAttendance && (
          <Button onClick={onAddAttendance} size="sm" className="h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-lg">
            <Plus className="h-4 w-4 mr-2" />
            Add Attendance
          </Button>
        )}
        </div>
      </div>

      {importing && (
        <div className="w-full flex items-center gap-4 mt-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${(importStats.processed / importStats.total) * 100}%` }}></div>
          </div>
          <span className="text-sm text-gray-600 dark:text-white">{importStats.processed}/{importStats.total}</span>
        </div>
      )}

      {/* Attendance count and Column Selector (match students UI) */}
      <div className="flex items-center justify-between mb-4 bg-purple-50 rounded-lg px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-purple-500 rounded-full" />
          <span className="text-purple-600 font-medium text-sm">{filtered.length}</span>
          <span className="text-purple-600 text-sm">attendance record{filtered.length !== 1 ? 's' : ''} found</span>
        </div>
        {viewMode === 'list' && setDisplayedColumns && (
          <button
            className="w-10 h-10 rounded-xl border border-purple-200 bg-[#fef2ff] hover:bg-purple-100 flex items-center justify-center shadow-sm hover:shadow transition-colors"
            onClick={() => setShowAttendanceColumnSelector(true)}
            title="Displayed Columns"
            aria-label="Edit displayed attendance columns"
          >
            <GridIcon className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Column Selector Modal */}
      <ColumnSelectorModal
        open={showAttendanceColumnSelector}
        columns={attendanceColumns}
        displayedColumns={currentDisplayedColumns}
        setDisplayedColumns={(cols) => {
          if (setDisplayedColumns) {
            setDisplayedColumns(cols);
            localStorage.setItem('attendanceDisplayedColumns', JSON.stringify(cols));
          }
        }}
        onClose={() => setShowAttendanceColumnSelector(false)}
        onSave={() => setShowAttendanceColumnSelector(false)}
        onReset={() => {
          if (setDisplayedColumns) {
            setDisplayedColumns(defaultDisplayedColumns);
            localStorage.setItem('attendanceDisplayedColumns', JSON.stringify(defaultDisplayedColumns));
          }
        }}
        storageKeyPrefix="attendance"
        fixedColumns={fixedColumns}
      />
    </div>
  );
}
