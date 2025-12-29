"use client"

import React, { useState, useMemo, useRef } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
// Removed Select in favor of checkbox-based multi-select for Status
// Removed Select-based sort UI in favor of student-style dropdown
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/dashboard/ui/dropdown-menu"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"

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
  Calendar,
  Users,
  BookOpen,
  Check,
  X,
  ChevronDown,
  Camera
} from "lucide-react"
// Removed MultiSelectDropdown and ColumnSelectorModal per requirements
import { FormattedDateInput } from "@/components/dashboard/common/formatted-date-input"
import AttendanceColumnSelector from "./attendance-column-selector"
import { useCustomColors } from "@/lib/use-custom-colors"

// Column selector UI removed

type ViewMode = "grid" | "list";

interface InstructorAttendanceRecord {
  id: number;
  instructorId: string;
  instructorName: string;
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
  attendanceRecords: InstructorAttendanceRecord[];
  setFilteredAttendance?: React.Dispatch<React.SetStateAction<InstructorAttendanceRecord[]>>;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (v: "asc" | "desc") => void;
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  onAddAttendance?: () => void;
  onSelfieAttendance?: () => void;
  onImport?: (items: InstructorAttendanceRecord[]) => void;
  selectedIds?: string[];
  // Column management UI removed (props kept for compatibility)
  displayedColumns?: string[];
  setDisplayedColumns?: (cols: string[]) => void;
  // Drafts functionality
  onOpenDrafts?: () => void;
  draftCount?: number;
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
  onSelfieAttendance,
  onImport,
  selectedIds = [],
  displayedColumns,
  setDisplayedColumns,
  onOpenDrafts,
  draftCount: draftCountProp,
}: AttendanceSearchFiltersProps) {
  const { toast } = useToast();
  const { primaryColor, secondaryColor } = useCustomColors();

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

  // Hydrate persisted displayed columns for Attendance table
  React.useEffect(() => {
    if (!setDisplayedColumns) return;
    if (typeof window === 'undefined') return;
    try {
      const NEW_KEY = 'instructorAttendanceDisplayedColumns';
      const OLD_KEY = 'attendanceDisplayedColumns';
      let parsed: any = null;
      const rawNew = localStorage.getItem(NEW_KEY);
      if (rawNew) {
        parsed = JSON.parse(rawNew);
      } else {
        const rawOld = localStorage.getItem(OLD_KEY);
        if (rawOld) parsed = JSON.parse(rawOld);
      }
      if (Array.isArray(parsed) && parsed.length) {
        // Migrate legacy values and ensure mandatory columns are present
        let migrated = (parsed as string[]).map((c: string) =>
          c === 'Notes' ? 'Remarks'
          : c === 'Non-Instructor ID' ? 'Instructor ID'
          : c === 'Non-Instructor Name' ? 'Instructor Name'
          : c
        );
        // Ensure mandatory columns are always included
        const must = ['Instructor ID', 'Instructor Name'];
        must.forEach(m => { if (!migrated.includes(m)) migrated.unshift(m); });
        setDisplayedColumns(migrated);
        try { localStorage.setItem(NEW_KEY, JSON.stringify(migrated)); } catch {}
      }
    } catch {}
  // run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Compute filter options from current dataset
  const statuses = useMemo(() => {
    const statusSet = new Set<string>();
    attendanceRecords.forEach(r => {
      if (r.status) statusSet.add(r.status);
    });
    return Array.from(statusSet);
  }, [attendanceRecords]);
  const statusLabel = (s: string) => {
    if (!s) return s as any;
    const v = s.toLowerCase();
    if (v === 'planned') return 'Planned leave';
    if (v === 'absent') return 'Unplanned Leave';
    return v.charAt(0).toUpperCase() + v.slice(1);
  };
  
  // Cohort name list removed as cohort name/ID are no longer used/displayed
  
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [statusSearch, setStatusSearch] = useState("");

  // Import progress state
  const [importing, setImporting] = useState(false);
  const [importStats, setImportStats] = useState({ processed: 0, total: 0, inserted: 0, duplicates: 0, invalid: 0, errors: 0 });

  // Reset pending filters whenever the popover is opened (discard unsaved edits)
  React.useEffect(() => {
    if (filterDropdownOpen) {
      // Sync pending fields to the last applied selection
      setPendingFilters({ ...selectedFilters });
    } else {
      // Ensure any unsaved changes are discarded on close
      setPendingFilters({ ...selectedFilters });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDropdownOpen]);

  // Filtering + sorting logic
  const filtered = useMemo(() => {
    let data = attendanceRecords || [];
    
    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      data = data.filter(r => {
        const instructorMatch = r.instructorName?.toLowerCase().includes(q) || r.instructorId?.toLowerCase().includes(q);
        const instrMatch = r.cohortInstructor?.toLowerCase().includes(q);
        const notesMatch = r.notes?.toLowerCase().includes(q);
        return instructorMatch || instrMatch || notesMatch;
      });
    }
    
    // Status
    if (selectedFilters.statuses.length) {
      data = data.filter(r => selectedFilters.statuses.includes(r.status));
    }
    
    // Cohort name filter removed
    
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
        case 'instructorName':
          vA = a.instructorName || '';
          vB = b.instructorName || '';
          break;
        case 'instructorId':
          vA = a.instructorId || '';
          vB = b.instructorId || '';
          break;
        // Cohort name sort removed
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
          prev[i].instructorName !== filtered[i].instructorName ||
          prev[i].notes !== filtered[i].notes ||
          prev[i].startTime !== filtered[i].startTime ||
          prev[i].endTime !== filtered[i].endTime
        ) {
          return filtered;
        }
      }
      // No meaningful change -> keep previous reference to prevent re-render
      return prev;
    });
  }, [filtered, setFilteredAttendance]);

  // ---------- Import / Export helpers ----------
  function toCSV(rows: InstructorAttendanceRecord[]) {
    const formatDisplayDate = (s?: string) => {
      if (!s) return '';
      try {
        const d = new Date(s);
        if (isNaN(d.getTime())) return s;
        return d
          .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          .replace(/ /g, '-');
      } catch {
        return s || '';
      }
    };

    const columns: { header: string; getter: (r: InstructorAttendanceRecord) => any }[] = [
      { header: 'Instructor ID', getter: r => r.instructorId || '' },
      { header: 'Instructor Name', getter: r => r.instructorName || '' },
      { header: 'Date', getter: r => formatDisplayDate(r.date) },
      { header: 'Start Time', getter: r => r.startTime || '' },
      { header: 'End Time', getter: r => r.endTime || '' },
      { header: 'Status', getter: r => statusLabel(r.status as any) || '' },
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
    download(`attendance-all-${new Date().toISOString().slice(0,10)}.csv`, csv);
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
    const rows = selectedIds.map(id => byId.get(id)).filter(Boolean) as InstructorAttendanceRecord[];
    const csv = toCSV(rows);
    download(`attendance-selected-${new Date().toISOString().slice(0,10)}.csv`, csv);
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

  function normalizeAttendanceRecord(o: any): InstructorAttendanceRecord {
    return {
      id: 0, // Will be auto-generated
      // Accept both historic Student* and new Instructor* headers/keys
      instructorId: String(
        o.studentId || o.StudentId || o["Student ID"] ||
        o.instructorId || o.InstructorId || o["Instructor ID"] ||
        ""
      ).trim(),
      instructorName: String(
        o.studentName || o.StudentName || o["Student Name"] ||
        o.instructorName || o.InstructorName || o["Instructor Name"] ||
        ""
      ).trim(),
      // Removed cohortId and cohortName ingestion per requirement
      cohortInstructor: String(o.cohortInstructor || o.CohortInstructor || o["Cohort Instructor"] || "").trim(),
      cohortTiming: String(o.cohortTiming || o.CohortTiming || o["Cohort Timing"] || "").trim(),
      date: String(o.date || o.Date || "").trim(),
      startTime: String(o.startTime || o.StartTime || o["Start Time"] || "").trim(),
      endTime: String(o.endTime || o.EndTime || o["End Time"] || "").trim(),
      status: (() => {
        const raw = String(o.status || o.Status || "present").trim().toLowerCase();
        if (raw === 'planned leave') return 'planned' as any;
        if (raw === 'unplanned leave') return 'absent' as any;
        return raw as any;
      })(),
      notes: String(o.notes || o.Notes || o.remarks || o.Remarks || "").trim(),
    };
  }

  async function importAttendanceBatch(items: InstructorAttendanceRecord[]) {
    const successes: InstructorAttendanceRecord[] = [];
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
            placeholder="Search instructors or remarks..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-1 sm:gap-2 items-center">
          {/* Filter Button & Panel (mirrors student implementation) */}
          <Popover open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 sm:h-9 flex items-center gap-1 relative group px-2 sm:px-3"
                aria-label="Filter options"
                title="Filter"
                tabIndex={0}
              >
                <span
                  className="relative inline-flex text-[color:var(--filter-color)] transition-colors duration-200 group-hover:text-white"
                  style={{ "--filter-color": primaryColor } as React.CSSProperties}
                >
                  <Filter className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
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
              className="w-[28rem] p-0"
              onCloseAutoFocus={e => e.preventDefault()}
              onEscapeKeyDown={() => setFilterDropdownOpen(false)}
              onInteractOutside={() => setFilterDropdownOpen(false)}
            >
              <div className="max-h-96 overflow-y-auto p-4">
                {/* Stack Status on top, Date Range below for better visual grouping */}
                <div className="mb-2 font-semibold text-sm">Status</div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-sm hover:bg-transparent hover:text-current active:bg-transparent focus-visible:ring-0 focus-visible:outline-none data-[state=open]:bg-transparent"
                      aria-label="Select attendance status filter"
                    >
                      {pendingFilters.statuses.length === 0
                        ? 'All Statuses'
                        : pendingFilters.statuses.length === 1
                        ? statusLabel(pendingFilters.statuses[0])
                        : `${pendingFilters.statuses.length} selected`}
                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <div className="p-2">
                      <Input
                        placeholder="Search statuses..."
                        value={statusSearch}
                        onChange={(e) => setStatusSearch(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    {statuses
                      .filter((s) => statusLabel(s).toLowerCase().includes(statusSearch.trim().toLowerCase()))
                      .map((s) => {
                        const checked = pendingFilters.statuses.includes(s);
                        const toggle = () =>
                          setPendingFilters((prev) => {
                            const set = new Set(prev.statuses);
                            if (checked) set.delete(s); else set.add(s);
                            return { ...prev, statuses: Array.from(set) };
                          });
                        return (
                          <DropdownMenuItem
                            key={s}
                            className="flex items-center gap-2 cursor-pointer"
                            onSelect={(e) => e.preventDefault()}
                            onClick={toggle}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggle()}
                              onClick={(e) => e.stopPropagation()}
                              className="border"
                              style={{ borderColor: primaryColor, backgroundColor: checked ? primaryColor : undefined }}
                            />
                            <span className="text-sm">{statusLabel(s)}</span>
                          </DropdownMenuItem>
                        );
                      })}
                    {statuses.length > 0 &&
                      statuses.filter((s) => statusLabel(s).toLowerCase().includes(statusSearch.trim().toLowerCase())).length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No results</div>
                      )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="mt-4 mb-2 font-semibold text-sm">Date Range</div>
                <div className="flex items-center gap-2">
                  <div className="w-36">
                    <FormattedDateInput
                      id="dateRangeStart"
                      value={pendingFilters.dateRange.start}
                      onChange={(iso) => setPendingFilters(prev => ({ ...prev, dateRange: { start: iso, end: iso } }))}
                      // Avoid browser clamping while typing by not binding max here
                      displayFormat="dd-MMM-yyyy"
                      placeholder="dd-mmm-yyyy"
                      className="text-xs py-1"
                    />
                  </div>
                  <span className="text-xs">to</span>
                  <div className="w-36">
                    <FormattedDateInput
                      id="dateRangeEnd"
                      value={pendingFilters.dateRange.end}
                      onChange={(iso) => setPendingFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: iso } }))}
                      // Avoid browser clamping while typing by not binding min here
                      displayFormat="dd-MMM-yyyy"
                      placeholder="dd-mmm-yyyy"
                      className="text-xs py-1"
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
            <Button variant="outline" title="Sort" size="sm" className="h-8 sm:h-9 flex items-center gap-1 group px-2 sm:px-3">
              <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2 group-hover:text-white transition-colors" />
              <span className="hidden sm:inline ml-1 text-xs text-gray-600 dark:text-white group-hover:text-white transition-colors">
                {(() => {
                  const label = [
                    { value: 'date', label: 'Date' },
                    { value: 'instructorName', label: 'Instructor Name' },
                    { value: 'instructorId', label: 'Instructor ID' },
                    { value: 'status', label: 'Status' },
                  ].find(o => o.value === sortBy)?.label;
                  return label || 'Sort';
                })()}
              </span>
              {sortOrder === 'asc' ? (
                <ArrowUp className="ml-1 h-3 w-3 text-gray-500 dark:text-white group-hover:text-white transition-colors" />
              ) : (
                <ArrowDown className="ml-1 h-3 w-3 text-gray-500 dark:text-white group-hover:text-white transition-colors" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            {[
              { value: 'date', label: 'Date' },
              { value: 'instructorName', label: 'Instructor Name' },
              { value: 'instructorId', label: 'Instructor ID' },
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
        <div className="flex border rounded-md overflow-hidden">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className="flex items-center justify-center w-9 h-9 transition-colors rounded-l-md focus:outline-none"
            style={{
              backgroundColor: viewMode === 'list' ? '#8B5CF6' : 'white',
              color: viewMode === 'list' ? 'white' : 'black'
            }}
            title="List View"
            aria-label="List View"
            aria-pressed={viewMode === 'list'}
          >
            <div className="flex flex-col gap-0.5 w-4 h-4 justify-center">
              <div className="bg-current h-0.5 w-full rounded-sm" />
              <div className="bg-current h-0.5 w-full rounded-sm" />
              <div className="bg-current h-0.5 w-full rounded-sm" />
            </div>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className="flex items-center justify-center w-9 h-9 transition-colors rounded-r-md border-l focus:outline-none"
            style={{
              backgroundColor: viewMode === 'grid' ? '#8B5CF6' : 'white',
              color: viewMode === 'grid' ? 'white' : 'black'
            }}
            title="Grid View"
            aria-label="Grid View"
            aria-pressed={viewMode === 'grid'}
          >
            <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
              <div className="bg-current rounded-sm" />
              <div className="bg-current rounded-sm" />
              <div className="bg-current rounded-sm" />
              <div className="bg-current rounded-sm" />
            </div>
          </button>
        </div>

        {/* Import */}
        
              <Button variant="outline" size="sm" title="Import" onClick={() => fileInputRef.current?.click()} disabled className="h-8 sm:h-9 px-2 sm:px-3">
                <Upload className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Import</span>
              </Button>
           
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleImportFileChange}
          className="hidden"
        />

  {/* Export */}
        <Button 
          variant="outline" 
          size="sm" 
          title={selectedIds.length > 0 ? `Export ${selectedIds.length} selected` : 'Export all attendance records'}
          onClick={() => { selectedIds.length > 0 ? handleExportSelected() : handleExportAll(); }}
          className="h-8 sm:h-9 px-2 sm:px-3"
        >
          <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          <span className="hidden sm:inline">{selectedIds.length > 0 ? `Export (${selectedIds.length})` : 'Export'}</span>
          <span className="sm:hidden text-xs">{selectedIds.length > 0 ? `(${selectedIds.length})` : ''}</span>
        </Button>

  {/* Drafts */}
        {onOpenDrafts && (
          <Button
            onClick={onOpenDrafts}
            size="sm"
            className="h-8 sm:h-9 px-2 sm:px-3 text-white rounded-lg hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
            title={`Drafts (${effectiveDraftCount})`}
          >
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Drafts ({effectiveDraftCount})</span>
            <span className="sm:hidden text-xs">({effectiveDraftCount})</span>
          </Button>
        )}

        {/* Add Attendance */}
        {onAddAttendance && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={onAddAttendance} size="sm" className="h-8 sm:h-9 px-2 sm:px-3 text-white rounded-lg hover:opacity-90" style={{ backgroundColor: primaryColor }}>
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add Attendance</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Record new attendance entry</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        </div>
      </div>

      {importing && (
        <div className="w-full flex items-center gap-4 mt-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div className="h-2 rounded-full" style={{ width: `${(importStats.processed / importStats.total) * 100}%`, backgroundColor: primaryColor }}></div>
          </div>
          <span className="text-sm text-gray-600 dark:text-white">{importStats.processed}/{importStats.total}</span>
        </div>
      )}

      {/* Attendance count */}
      <div className="flex items-center justify-between mb-4 rounded-lg px-4 py-2" style={{ background: `color-mix(in oklab, ${primaryColor} 10%, white)` }}>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
          <span className="font-medium text-sm" style={{ color: primaryColor }}>{filtered.length}</span>
          <span className="text-sm" style={{ color: primaryColor }}>attendance record{filtered.length !== 1 ? 's' : ''} found</span>
        </div>
        {/* Column selector button */}
        {typeof displayedColumns !== 'undefined' && typeof setDisplayedColumns !== 'undefined' && (
          <AttendanceColumnSelector
            value={displayedColumns || []}
            onChange={(cols) => setDisplayedColumns(cols)}
            storageKey="instructorAttendanceDisplayedColumns"
            buttonTitle="Select displayed columns"
          />
        )}
      </div>
      {/* Column selector modal lives within AttendanceColumnSelector */}
    </div>
  );
}