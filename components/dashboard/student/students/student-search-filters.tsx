"use client"

import React, { useMemo, useRef, useState } from "react";
import { Button } from "@/components/dashboard/ui/button";
import { Input } from "@/components/dashboard/ui/input";
import { Progress } from "@/components/dashboard/ui/progress";
import { useToast } from "@/hooks/dashboard/use-toast";
import { useCustomColors } from "@/lib/use-custom-colors";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/dashboard/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover";
import { ArrowUpDown, ArrowUp, ArrowDown, Check, Download, Filter, Plus, Search, Upload, X } from "lucide-react";
import { format as formatDateFns } from 'date-fns'
import MultiSelectDropdown from "./MultiSelectDropDown";
import type { Student } from "@/types/dashboard/student";
import { ColumnSelectorModal } from "@/contexts/dashboard/ColumnSelectorModal";
import type { Cohort } from "@/data/dashboard/cohorts";
import { FormattedDateInput } from "@/components/dashboard/student/common/formatted-date-input";
import { formatDateForDisplay } from '@/lib/dashboard/student/utils'

// Grid icon component for column selector
function GridIcon({ className = "w-6 h-6", color = "#7C3AED" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="5" height="5" rx="1.5" fill={color} />
      <rect x="10" y="3" width="5" height="5" rx="1.5" fill={color} />
      <rect x="17" y="3" width="5" height="5" rx="1.5" fill={color} />
      <rect x="3" y="10" width="5" height="5" rx="1.5" fill={color} />
      <rect x="10" y="10" width="5" height="5" rx="1.5" fill={color} />
      <rect x="17" y="10" width="5" height="5" rx="1.5" fill={color} />
      <rect x="3" y="17" width="5" height="5" rx="1.5" fill={color} />
      <rect x="10" y="17" width="5" height="5" rx="1.5" fill={color} />
      <rect x="17" y="17" width="5" height="5" rx="1.5" fill={color} />
    </svg>
  );
}

type ViewMode = "grid" | "list";

export interface StudentSearchFiltersProps {
  students: Student[];
  setFilteredStudents?: React.Dispatch<React.SetStateAction<Student[]>>;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (v: "asc" | "desc") => void;
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  onAddStudent?: () => void;
  onImport?: (items: Student[]) => void;
  selectedIds?: string[];
  // Column management props
  displayedColumns?: string[];
  setDisplayedColumns?: (cols: string[]) => void;
  // Drafts functionality
  onOpenDrafts?: () => void;
  // Cohorts for instructor search
  cohorts?: Cohort[];
  // Courses for filter display
  courses?: Course[];
}

interface Course {
  id: string;
  name: string;
  courseId?: string;
}

type Filters = {
  activities: string[];
  statuses: string[];
  dateRange: { start: string; end: string };
};

export default function StudentSearchFilters({
  students,
  setFilteredStudents,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  viewMode,
  setViewMode,
  onAddStudent,
  onImport,
  selectedIds = [],
  displayedColumns,
  setDisplayedColumns,
  onOpenDrafts,
  cohorts = [],
  courses = [],
}: StudentSearchFiltersProps) {
  const { toast } = useToast();
  const { primaryColor, secondaryColor } = useCustomColors();
  // Today's date ISO (yyyy-MM-dd) to cap date pickers in filters
  const todayIso = React.useMemo(() => new Date().toISOString().split('T')[0], []);

  // Column management
  const studentColumns = ['Student ID', 'Name', 'Email', 'Mobile', 'Gender', 'Date of Birth', 'Course of Interest', 'Course (Enrolled)', 'Registration Date', 'Course Start Date', 'Address', 'Referred By', 'Cohort', 'Actions'];
  const defaultDisplayedColumns = ['Student ID', 'Name', 'Course (Enrolled)', 'Actions'];
  const currentDisplayedColumns = displayedColumns || defaultDisplayedColumns;
  const [showStudentColumnSelector, setShowStudentColumnSelector] = useState(false);
  // Close column selector automatically if user switches to grid view
  React.useEffect(()=>{ if(viewMode==='grid' && showStudentColumnSelector) setShowStudentColumnSelector(false); },[viewMode, showStudentColumnSelector]);

  // Draft count state
  const [draftCount, setDraftCount] = useState(0);

  // Load draft count on component mount
  React.useEffect(() => {
    const updateDraftCount = async () => {
      try {
        const { StudentDraftsAPI } = await import('@/lib/dashboard/student/student-drafts-api');
        const drafts = await StudentDraftsAPI.getAllDrafts();
        setDraftCount(Array.isArray(drafts) ? drafts.length : 0);
      } catch {
        // Fallback to localStorage if API fails
        try {
          const savedDrafts = localStorage.getItem('student-drafts');
          const legacyDraft = localStorage.getItem('draft-new-student');
          
          if (savedDrafts) {
            const drafts = JSON.parse(savedDrafts);
            setDraftCount(Array.isArray(drafts) ? drafts.length : 0);
          } else if (legacyDraft) {
            setDraftCount(1);
          } else {
            setDraftCount(0);
          }
        } catch {
          setDraftCount(0);
        }
      }
    };

    updateDraftCount();
    
    // Listen for custom events to update count
    const handleDraftsUpdated = (event: CustomEvent) => {
      if (event.detail?.drafts && Array.isArray(event.detail.drafts)) {
        setDraftCount(event.detail.drafts.length);
      } else {
        updateDraftCount(); // Refetch from API
      }
    };
    
    window.addEventListener('student-drafts-updated', handleDraftsUpdated as EventListener);
    
    return () => window.removeEventListener('student-drafts-updated', handleDraftsUpdated as EventListener);
  }, []);

  // Ensure default sort is by Student ID when component mounts / when no sortBy provided
  React.useEffect(() => {
    if (!sortBy) setSortBy('studentId');
  }, [sortBy, setSortBy]);

  // Hydrate persisted column selections
  React.useEffect(() => {
    if (typeof window === 'undefined' || !setDisplayedColumns) return;
    try {
      const rawStudent = localStorage.getItem('studentDisplayedColumns');
      if (rawStudent) {
        const arr = JSON.parse(rawStudent);
        if (Array.isArray(arr)) {
          // Migrate legacy columns
          const migrated = arr.map((c: string) => {
            if (c === 'Batch') return 'Cohort';
            if (c === 'Course') return 'Course (Enrolled)';
            return c;
          });
          // Remove "Preferred Timing" if it exists
          const filtered = migrated.filter((c: string) => c !== 'Preferred Timing');
          // Remove duplicates
          const deduplicated = Array.from(new Set(filtered));
          const sanitized = deduplicated.filter((c: string) => studentColumns.includes(c));
          
          // Always ensure fixed columns are included
          const startFixed = ['Student ID', 'Name'];
          const endFixed = ['Actions'];
          
          // Add missing fixed columns
          [...startFixed, ...endFixed].forEach(col => {
            if (!sanitized.includes(col) && studentColumns.includes(col)) {
              sanitized.push(col);
            }
          });
          
          // Reorder: start fixed + user columns + end fixed (Actions at the end)
          const userColumns = sanitized.filter(col => !startFixed.includes(col) && !endFixed.includes(col));
          const reordered = [
            ...startFixed.filter(col => sanitized.includes(col)),
            ...userColumns,
            ...endFixed.filter(col => sanitized.includes(col))
          ];
          
          setDisplayedColumns(reordered);
          
          // Update localStorage with cleaned columns if migration or deduplication occurred
          if (arr.includes('Batch') || arr.includes('Course') || arr.includes('Preferred Timing') || arr.length !== reordered.length || !arr.includes('Student ID') || !arr.includes('Name')) {
            localStorage.setItem('studentDisplayedColumns', JSON.stringify(reordered));
          }
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute filter options from current dataset - use Enrolled Course where available
  const activities = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      // Prefer enrolled course name + id when present
      if ((s as any).enrolledCourseName && (s as any).enrolledCourse) {
        set.add(`${(s as any).enrolledCourseName} (${(s as any).enrolledCourse})`);
        return;
      }
      if ((s as any).enrolledCourseName) {
        set.add((s as any).enrolledCourseName);
        return;
      }
      if ((s as any).enrolledCourse) {
        // Try to resolve id to course name from courses list
        const course = courses.find(c => c.id === (s as any).enrolledCourse || c.courseId === (s as any).enrolledCourse);
        if (course) set.add(`${course.name} (${(s as any).enrolledCourse})`);
        else set.add((s as any).enrolledCourse);
        return;
      }

      // Fallback to course of interest (legacy) and map to name if possible
      if (s.courseOfInterestId) {
        const course = courses.find(c => c.id === s.courseOfInterestId || c.courseId === s.courseOfInterestId);
        if (course) set.add(`${course.name} (${s.courseOfInterestId})`);
        else set.add(s.courseOfInterestId);
      }
    });
    return Array.from(set);
  }, [students, courses]);
  
  const statuses = useMemo(() => [] as string[], [students]);

  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [filterAction, setFilterAction] = useState<"applied" | "cleared" | null>(null);
  const [pendingFilters, setPendingFilters] = useState<Filters>({
    activities: [],
    statuses: [],
    dateRange: { start: "", end: "" },
  });
  const [selectedFilters, setSelectedFilters] = useState<Filters>({
    activities: [],
    statuses: [],
    dateRange: { start: "", end: "" },
  });
  const firstCheckboxRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Import progress state
  const [importing, setImporting] = useState(false);
  const [importStats, setImportStats] = useState({ processed: 0, total: 0, inserted: 0, duplicates: 0, invalid: 0, errors: 0 });

  // Filtering + sorting logic
  const filtered = useMemo(() => {
    let data = students || [];
    
    // Filter out soft-deleted students
    data = data.filter(s => !s.isDeleted);
    
    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      data = data.filter(s => {
        const nameMatch = s.name?.toLowerCase().includes(q);
        const courseMatch = (s.courseOfInterestId?.toLowerCase().includes(q) ?? false) || (s.enrolledCourseName?.toLowerCase().includes(q) ?? false);
        const cohortValue = (s.cohortId || '').toLowerCase();
        const cohortIdMatch = cohortValue.includes(q);
        
        // Search by cohort name and instructor name from cohort data
        let cohortNameMatch = false;
        let instructorMatch = false;
        if (cohorts && cohorts.length > 0 && s.cohortId) {
          const studentCohort = cohorts.find(c => 
            c.id === s.cohortId || c.name === s.cohortId || 
            (Array.isArray(c.enrolledStudents) && c.enrolledStudents.includes(s.studentId))
          );
          if (studentCohort) {
            // Check cohort name
            if (studentCohort.name) {
              cohortNameMatch = studentCohort.name.toLowerCase().includes(q);
            }
            // Check instructor name
            if (studentCohort.instructor) {
              instructorMatch = studentCohort.instructor.toLowerCase().includes(q);
            }
          }
        }
        
        // Keep previous additional fields (email/mobile/id) so existing behavior not lost
        const auxMatch = (s.email?.toLowerCase().includes(q) ?? false) || (s.mobile?.toLowerCase().includes(q) ?? false) || (s.studentId?.toLowerCase().includes(q) ?? false);
        return nameMatch || courseMatch || cohortIdMatch || cohortNameMatch || instructorMatch || auxMatch;
      });
    }
    // Enrolled Course filter (legacy: falls back to course of interest)
    if (selectedFilters.activities.length) {
      data = data.filter(s => {
        return selectedFilters.activities.some(formattedActivity => {
          const match = formattedActivity.match(/\(([^)]+)\)$/);
          const value = match ? match[1] : formattedActivity;

          // Match against enrolledCourse id, enrolledCourseName, or fallback to courseOfInterestId
          if ((s as any).enrolledCourse && ((s as any).enrolledCourse === value)) return true;
          if ((s as any).enrolledCourseName && ((s as any).enrolledCourseName === formattedActivity || (s as any).enrolledCourseName === value)) return true;
          if (s.courseOfInterestId && s.courseOfInterestId === value) return true;

          // Also allow matching by resolving course names from the courses list
          const resolved = courses.find(c => c.id === value || c.courseId === value || c.name === formattedActivity || c.name === value);
          if (resolved) {
            if ((s as any).enrolledCourse && ((s as any).enrolledCourse === (resolved.id || resolved.courseId))) return true;
            if ((s as any).enrolledCourseName && (s as any).enrolledCourseName === resolved.name) return true;
            if (s.courseOfInterestId && s.courseOfInterestId === (resolved.id || resolved.courseId)) return true;
          }

          return false;
        });
      });
    }

    // Date range on registrationDate
    if (selectedFilters.dateRange.start || selectedFilters.dateRange.end) {
      const start = selectedFilters.dateRange.start ? new Date(selectedFilters.dateRange.start) : null;
      const end = selectedFilters.dateRange.end ? new Date(selectedFilters.dateRange.end) : null;
      data = data.filter(s => {
        if (!s.registrationDate) return false;
        const d = new Date(s.registrationDate);
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      });
    }
    // Sort
    const sorted = [...data].sort((a, b) => {
      let vA: any;
      let vB: any;
      switch (sortBy) {
        case "studentId":
          vA = a.studentId; vB = b.studentId; break;
        case "name":
          vA = a.name; vB = b.name; break;
        case "activity":
          vA = a.courseOfInterestId; vB = b.courseOfInterestId; break;
        case "memberSince":
          vA = a.registrationDate; vB = b.registrationDate; break;

        default:
          vA = (a as any)[sortBy as keyof Student];
          vB = (b as any)[sortBy as keyof Student];
      }
      if (typeof vA === "string") vA = vA.toLowerCase();
      if (typeof vB === "string") vB = vB.toLowerCase();
      if (vA < vB) return sortOrder === "asc" ? -1 : 1;
      if (vA > vB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [students, searchTerm, selectedFilters, sortBy, sortOrder, cohorts]);

  React.useEffect(() => {
    if (setFilteredStudents) setFilteredStudents(filtered);
  }, [filtered, setFilteredStudents]);

  // ---------- Import / Export helpers ----------
  function toCSV(rows: Student[]) {
    // Export all fields available in the Add Student dialog frontend form
    // Includes all personal info, course details, communication preferences, referral info, and guardian details
    const columns: { header: string; getter: (s: Student) => any }[] = [
      { header: 'Student ID', getter: s => s.studentId || s.id || '' },
      { header: 'Full Name', getter: s => s.name || '' },
      { header: 'First Name', getter: s => (s as any).firstName || '' },
      { header: 'Middle Name', getter: s => (s as any).middleName || '' },
      { header: 'Last Name', getter: s => (s as any).lastName || '' },
      { header: 'Gender', getter: s => s.gender || '' },
    { header: 'Date of Birth', getter: s => formatDateForDisplay(s.dob || '') },
      { header: 'Mobile Number', getter: s => s.mobile || '' },
      { header: 'Country Code', getter: s => (s as any).countryCode || '' },
      { header: 'Country', getter: s => (s as any).country || '' },
      { header: 'State/Province', getter: s => (s as any).stateProvince || '' },
      { header: 'Email Address', getter: s => s.email || '' },
      { header: 'Address', getter: s => s.address || '' },
      
      // Course Information
      { header: 'Course of Interest', getter: s => s.courseOfInterestId || '' },
      { header: 'Enrolled Course ID', getter: s => (s as any).enrolledCourse || '' },
      { header: 'Enrolled Course Name', getter: s => (s as any).enrolledCourseName || '' },
      { header: 'Course Category', getter: s => s.category || '' },
      { header: 'Course Type', getter: s => (s as any).courseType || '' },
      { header: 'Course Level', getter: s => (s as any).courseLevel || '' },
  { header: 'Registration Date', getter: s => formatDateForDisplay(s.registrationDate || '') },
  { header: 'Course Start Date', getter: s => formatDateForDisplay(s.courseStartDate || '') },
      { header: 'Cohort', getter: s => s.cohortId || '' },
      
      // Communication & Referral Information
      { header: 'Communication Preferences Enabled', getter: s => s.communicationPreferences?.enabled ? 'Yes' : 'No' },
      { header: 'Communication Channels', getter: s => s.communicationPreferences?.channels?.join(', ') || '' },
      { header: 'Referred By', getter: s => s.referredBy || '' },
      { header: 'Referring Student Name', getter: s => s.referringStudentName || '' },
      { header: 'Referring Student ID', getter: s => s.referringStudentId || '' },
      
      // Guardian Information (for students under 18)
      { header: 'Guardian First Name', getter: s => (s as any).guardianFirstName || '' },
      { header: 'Guardian Middle Name', getter: s => (s as any).guardianMiddleName || '' },
      { header: 'Guardian Last Name', getter: s => (s as any).guardianLastName || '' },
      { header: 'Guardian Full Name', getter: s => s.guardian?.fullName || '' },
      { header: 'Guardian Relationship', getter: s => s.guardian?.relationship || '' },
      { header: 'Guardian Country Code', getter: s => (s as any).guardianCountryCode || '' },
      { header: 'Guardian Contact', getter: s => s.guardian?.contact || '' },

    ];

    const esc = (v: any) => {
      const s = v == null ? '' : String(v);
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    const headerLine = columns.map(c => esc(c.header)).join(',');
    const lines = [headerLine];
    rows.forEach(s => {
      lines.push(columns.map(c => esc(c.getter(s))).join(','));
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
    const csv = toCSV(students);
  download(`students-all-${formatDateFns(new Date(), 'dd-MMM-yyyy')}.csv`, csv);
  }
  function handleExportSelected() {
    if (!selectedIds?.length) {
      handleExportAll();
      return;
    }
    const byId = new Map(students.map(s => [s.id || s.studentId, s] as const));
    const rows = selectedIds.map(id => byId.get(id)).filter(Boolean) as Student[];
    const csv = toCSV(rows);
  download(`students-selected-${formatDateFns(new Date(), 'dd-MMM-yyyy')}.csv`, csv);
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
        if (inQ) {
          if (ch === '"' && line[i+1] === '"') { cur += '"'; i++; }
          else if (ch === '"') inQ = false;
          else cur += ch;
        } else {
          if (ch === ',') { out.push(cur); cur = ''; }
          else if (ch === '"') inQ = true;
          else cur += ch;
        }
      }
      out.push(cur);
      return out;
    };
    const headers = split(lines[0]).map(h => h.trim());
    return lines.slice(1).map(l => {
      const cols = split(l);
      const o: any = {};
      headers.forEach((h, idx) => { o[h] = cols[idx]; });
      return o;
    });
  }

  // Helper function to convert DD-MM-YYYY to YYYY-MM-DD
  function convertDateFormat(dateStr: string): string {
    if (!dateStr) return "";
    
    // Handle DD-MM-YYYY format (e.g., "15-03-2000")
    const ddmmyyyy = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(dateStr.trim());
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Handle YYYY-MM-DD format (already correct)
    const yyyymmdd = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(dateStr.trim());
    if (yyyymmdd) {
      return dateStr.trim();
    }
    
    // Try to parse other formats and convert
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10);
      }
    } catch (e) {
      console.warn('Could not parse date:', dateStr);
    }
    
    return dateStr; // Return as-is if can't parse
  }

  function normalizeStudent(o: any): Student {
    // Parse communication preferences from exported format
    const communicationEnabled = String(o["Communication Preferences Enabled"] || "").toLowerCase() === 'yes';
    const communicationChannels = String(o["Communication Channels"] || "").split(',').map(s => s.trim()).filter(Boolean);
    
    // Build guardian object from individual fields
    const guardianFullName = String(o["Guardian Full Name"] || o.guardianFullName || "").trim();
    const guardianRelationship = String(o["Guardian Relationship"] || o.guardianRelationship || "").trim();
    const guardianContact = String(o["Guardian Contact"] || o.guardianContact || "").trim();
    
    return {
      id: "", // Don't fetch from file - let system auto-generate
      studentId: "", // Don't fetch from file - let system auto-generate
      name: String(o.name || o.Name || o["Full Name"] || "").trim(),
      firstName: String(o.firstName || o["First Name"] || "").trim(),
      middleName: String(o.middleName || o["Middle Name"] || "").trim(),
      lastName: String(o.lastName || o["Last Name"] || "").trim(),
      gender: String(o.gender || o.Gender || "").trim() as any,
      dob: convertDateFormat(String(o.dob || o.DOB || o["Date of Birth"] || "")),
      mobile: String(o.mobile || o.Mobile || o["Mobile Number"] || "").trim(),
      countryCode: String(o.countryCode || o["Country Code"] || "").trim(),
      country: String(o.country || o.Country || "").trim(),
      stateProvince: String(o.stateProvince || o["State/Province"] || o.state || o.State || "").trim(),
      email: String(o.email || o.Email || o["Email Address"] || "").trim(),
      address: String(o.address || o.Address || "").trim(),
      
      // Course Information
      courseOfInterestId: String(o.courseOfInterestId || o.activity || o.Activity || o["Course of Interest"] || "").trim(),
      enrolledCourse: String(o.enrolledCourse || o["Enrolled Course ID"] || "").trim(),
      enrolledCourseName: String(o.enrolledCourseName || o["Enrolled Course Name"] || o["Enrolled Course"] || o.program || "").trim(),
      category: String(o.category || o.Category || o["Course Category"] || "").trim(),
      courseType: String(o.courseType || o["Course Type"] || "").trim(),
      courseLevel: String(o.courseLevel || o["Course Level"] || "").trim(),
      registrationDate: convertDateFormat(String(o.registrationDate || o.memberSince || o.MemberSince || o.member_since || o["Registration Date"] || "")),
      courseStartDate: convertDateFormat(String(o.courseStartDate || o.CourseStartDate || o["Course Start Date"] || "")),
      cohortId: String(o.cohortId || o.batch || o.Batch || o.cohort || o.Cohorts || o.Cohort || "").trim(),
      
      // Communication & Referral Information
      communicationPreferences: (communicationEnabled || communicationChannels.length > 0) ? {
        enabled: communicationEnabled,
        channels: communicationChannels
      } : undefined,
      referredBy: String(o.referredBy || o["Referred By"] || "").trim(),
      referringStudentName: String(o.referringStudentName || o["Referring Student Name"] || "").trim(),
      referringStudentId: String(o.referringStudentId || o["Referring Student ID"] || "").trim(),
      
      // Guardian Information
      guardianFirstName: String(o.guardianFirstName || o["Guardian First Name"] || "").trim(),
      guardianMiddleName: String(o.guardianMiddleName || o["Guardian Middle Name"] || "").trim(),
      guardianLastName: String(o.guardianLastName || o["Guardian Last Name"] || "").trim(),
      guardianCountryCode: String(o.guardianCountryCode || o["Guardian Country Code"] || "").trim(),
      guardian: (guardianFullName || guardianRelationship || guardianContact) ? {
        fullName: guardianFullName,
        relationship: guardianRelationship,
        contact: guardianContact,
        linkedStudentId: "" // Will be set by the backend
      } : undefined,
    };
  }

  async function importStudentsBatch(items: Student[]) {
    const successes: Student[] = [];
    let inserted = 0, duplicates = 0, errors = 0;
    
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      
      try {
        const res = await fetch('/api/student]\/students', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(it) 
        });
        
        if (res.ok) {
          const created = await res.json();
          successes.push(created as Student);
          inserted++;
        } else if (res.status === 409) {
          duplicates++;
        } else {
          errors++;
        }
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
        const text = String(reader.result || '');
        const rows = parseCSV(text);
        const normalized = rows.map(normalizeStudent);
        
        // Filter for valid students (must have firstName, lastName, email, country, and stateProvince at minimum)
        const valid = normalized.filter(s => {
          const hasBasicInfo = s.firstName && s.lastName && s.email;
          const hasLocation = (s as any).country && (s as any).stateProvince;
          return hasBasicInfo && hasLocation;
        });
        
        if (!valid.length) {
          toast({ 
            title: 'Import finished', 
            description: 'No valid rows found in file. Students must have at least First Name, Last Name, Email, Country, and State/Province.', 
            variant: 'destructive' 
          });
          return;
        }
        
        // Show import start notification
        toast({ 
          title: '?? Import Started', 
          description: `Processing ${valid.length} student records...`,
          duration: 3000
        });
        
        setImporting(true);
        setImportStats({ processed: 0, total: valid.length, inserted: 0, duplicates: 0, invalid: 0, errors: 0 });
        const result = await importStudentsBatch(valid);
        
        // Update the main students list with imported data
        if (result.successes.length) {
          onImport?.(result.successes);
        }
        
        // Show completion toast based on results
        if (result.stats.inserted > 0) {
          toast({ 
            title: `?? Successfully Imported!`, 
            description: `Added ${result.stats.inserted} new student${result.stats.inserted !== 1 ? 's' : ''} to your database.${result.stats.duplicates > 0 ? ` (${result.stats.duplicates} duplicates skipped)` : ''}`,
            duration: 5000,
          });
        } else if (result.stats.duplicates > 0 && result.stats.errors === 0) {
          toast({ 
            title: '?? All Students Already Exist', 
            description: `Found ${result.stats.duplicates} duplicate records. No new students were added.`,
            duration: 4000,
          });
        } else {
          toast({ 
            title: '? Import Failed', 
            description: `Could not import students. ${result.stats.duplicates} duplicates, ${result.stats.errors} errors.`,
            variant: 'destructive',
            duration: 6000,
          });
        }
      } catch (err) {
        console.error('Import error:', err);
        toast({ 
          title: '? Import Error', 
          description: 'Could not parse or import file. Please check the file format and try again.', 
          variant: 'destructive',
          duration: 5000
        });
      } finally {
        setImporting(false);
        e.target.value = '';
        console.log('Import process finished');
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
            placeholder="Search students, courses, cohorts..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
        {/* Filter Button and Panel */}
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
              <span className="relative inline-block">
                {/* Normal icon (primary color) */}
                <Filter className="h-3.5 w-3.5 transition-opacity group-hover:opacity-0" style={{ color: primaryColor }} />
                {/* Hover icon (white for visibility) */}
                <Filter className="h-3.5 w-3.5 absolute top-0 left-0 text-white opacity-0 group-hover:opacity-100" />
                {filterAction === "applied" && (
                  <span className="absolute -top-1 -right-1">
                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-green-500">
                      <Check className="w-2 h-2 text-white" />
                    </span>
                  </span>
                )}
                {filterAction === "cleared" && (
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
            className="w-96 p-0"
            onCloseAutoFocus={e => e.preventDefault()}
            onEscapeKeyDown={() => setFilterDropdownOpen(false)}
            onInteractOutside={() => setFilterDropdownOpen(false)}
            onOpenAutoFocus={e => { e.preventDefault(); firstCheckboxRef.current?.focus(); }}
          >
            <div className="max-h-96 overflow-y-auto p-4">
              <MultiSelectDropdown
                label="Enrolled Course"
                options={activities}
                selected={pendingFilters.activities}
                onChange={(next) => setPendingFilters(prev => ({ ...prev, activities: next }))}
                className="mb-3"
              />

              {!!statuses.length && (
                <>
                  <div className="mb-2 font-semibold text-sm">Filter by Status</div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {statuses.map(status => (
                      <label key={status} className="flex items-center gap-1 text-xs p-1 hover:bg-gray-100 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pendingFilters.statuses.includes(String(status))}
                          onChange={() => {
                            setPendingFilters(prev => ({
                              ...prev,
                              statuses: prev.statuses.includes(String(status))
                                ? prev.statuses.filter(s => s !== String(status))
                                : [...prev.statuses, String(status)],
                            }));
                          }}
                        />
                        {status}
                      </label>
                    ))}
                  </div>
                </>
              )}

              <div className="mb-2 font-semibold text-sm">Registration Date</div>
              <div className="flex items-center gap-2">
                <div className="w-32">
                  <FormattedDateInput
                    id="dateRangeStart"
                    value={pendingFilters.dateRange.start}
                    onChange={(isoDate) => setPendingFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: isoDate } }))}
                    // Do not allow selecting a start date beyond today or beyond the selected end date
                    max={(pendingFilters.dateRange.end && pendingFilters.dateRange.end < todayIso)
                      ? pendingFilters.dateRange.end
                      : todayIso}
                    displayFormat="dd-MMM-yyyy"
                    placeholder="From date"
                    className="text-xs py-1"
                  />
                </div>
                <span className="text-xs">to</span>
                <div className="w-32">
                  <FormattedDateInput
                    id="dateRangeEnd"
                    value={pendingFilters.dateRange.end}
                    onChange={(isoDate) => setPendingFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: isoDate } }))}
                    min={pendingFilters.dateRange.start || undefined}
                    max={todayIso}
                    displayFormat="dd-MMM-yyyy"
                    placeholder="To date"
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
                    setFilterAction("applied");
                  }}
                >
                  Apply Filters
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setPendingFilters({ activities: [], statuses: [], dateRange: { start: "", end: "" } });
                    setSelectedFilters({ activities: [], statuses: [], dateRange: { start: "", end: "" } });
                    setFilterDropdownOpen(false);
                    setFilterAction("cleared");
                  }}
                >
                  Clear All
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort Field Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" title="Sort" size="sm" className="h-9 flex items-center gap-1 group">
              <ArrowUpDown className="mr-2 h-4 w-4 group-hover:text-white" />
              <span className="ml-1 text-xs text-gray-600 dark:text-white group-hover:text-white">{(() => {
                const label = [
                  { value: "studentId", label: "Student ID" },
                  { value: "name", label: "Student Name" },
                  { value: "activity", label: "Course" },
                  { value: "memberSince", label: "Registration Date" },
                ].find(o => o.value === sortBy)?.label;
                return label || "Sort";
              })()}</span>
              {sortOrder === "asc" ? <ArrowUp className="ml-2 h-3 w-3 group-hover:text-white" /> : <ArrowDown className="ml-2 h-3 w-3 group-hover:text-white" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            {[
              { value: "studentId", label: "Student ID" },
              { value: "name", label: "Student Name" },
              { value: "activity", label: "Course" },
              { value: "memberSince", label: "Registration Date" },
            ].map(option => (
              <DropdownMenuItem key={option.value} onClick={() => setSortBy(option.value)}>
                {option.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Order</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setSortOrder("asc")}>
              Ascending
              <ArrowUp className="h-4 w-4 mr-2" />
              
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOrder("desc")}>
              Descending
              <ArrowDown className="h-4 w-4 mr-2" />
              
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View toggle (match Achievements segmented buttons) */}
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={`rounded-r-none ${viewMode === 'list' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
            title="List View"
            aria-label="List View"
          >
            <div className={`flex flex-col gap-0.5 w-4 h-4 ${viewMode === 'list' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
              <div className="bg-current h-0.5 rounded-sm" />
              <div className="bg-current h-0.5 rounded-sm" />
              <div className="bg-current h-0.5 rounded-sm" />
            </div>
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className={`rounded-l-none border-l ${viewMode === 'grid' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
            title="Grid View"
            aria-label="Grid View"
          >
            <div className={`grid grid-cols-2 gap-0.5 w-4 h-4 ${viewMode === 'grid' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
              <div className="bg-current rounded-sm" />
              <div className="bg-current rounded-sm" />
              <div className="bg-current rounded-sm" />
              <div className="bg-current rounded-sm" />
            </div>
          </Button>
        </div>

        {/* Import/Export */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleImportFileChange}
        />
        <Button
          variant="outline"
          size="sm"
          title="Import disabled"
          onClick={() => { /* disabled */ }}
          disabled
          aria-disabled
        >
          <Upload className="mr-2 h-4 w-4" /> Import
        </Button>

        {/* Single Export Button (auto-detects selection) */}
        <Button
          variant="outline"
          size="sm"
          title={selectedIds.length ? `Export ${selectedIds.length} selected` : 'Export all students'}
          onClick={() => { selectedIds.length ? handleExportSelected() : handleExportAll(); }}
        >
          <Download className="mr-2 h-4 w-4" /> {selectedIds.length ? `Export (${selectedIds.length})` : 'Export'}
        </Button>

        <Button 
          variant={draftCount > 0 ? "default" : "outline"} 
          size="sm" 
          title={draftCount > 0 ? `View ${draftCount} draft${draftCount !== 1 ? 's' : ''}` : "No drafts available"}
          onClick={onOpenDrafts}
          style={draftCount > 0 ? { backgroundColor: primaryColor, color: 'white' } : {}}
          onMouseEnter={(e) => draftCount > 0 ? e.currentTarget.style.backgroundColor = `${primaryColor}dd` : null}
          onMouseLeave={(e) => draftCount > 0 ? e.currentTarget.style.backgroundColor = primaryColor : null}
        >
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
          Drafts ({draftCount})
        </Button>

        <Button size="sm" title="Add Student" onClick={onAddStudent} className="bg-purple-600 hover:bg-purple-700 text-white"> <Plus className="h-4 w-4 mr-2" /> Add Student </Button>
      </div>
      {/* End of top controls (search + actions) */}
      </div>

      {importing && (
        <div className="w-full flex items-center gap-4 mt-2">
          <div className="flex-1 max-w-xs">
            <Progress value={importStats.total ? (importStats.processed / importStats.total) * 100 : 0} />
          </div>
          <div className="text-xs text-muted-foreground">
            {importStats.processed}/{importStats.total} rows
          </div>
        </div>
      )}

      {/* Student count and Column Selector */}
      <div className="flex items-center justify-between mb-4 rounded-lg px-4 py-2" style={{ backgroundColor: `${primaryColor}15` }}>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryColor }}></div>
          <span className="font-medium text-sm" style={{ color: `${primaryColor}dd` }}>
            {filtered.length}
          </span>
          <span className="text-sm" style={{ color: `${primaryColor}dd` }}>
            student{filtered.length !== 1 ? 's' : ''} found
          </span>
        </div>
        
        {/* Column Selector Button (hidden in grid view) */}
        {viewMode === 'list' && (
          <button
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm hover:shadow transition-colors"
            style={{ border: `1px solid ${primaryColor}80`, backgroundColor: `${primaryColor}15` }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}20`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}15`}
            onClick={() => setShowStudentColumnSelector(true)}
            title="Displayed Columns"
            aria-label="Edit displayed student columns"
          >
            <GridIcon className="w-6 h-6" color={primaryColor} />
          </button>
        )}
      </div>

      {/* Column Selector Modal */}
      <ColumnSelectorModal
        open={showStudentColumnSelector}
        columns={studentColumns}
        displayedColumns={currentDisplayedColumns}
        setDisplayedColumns={(cols) => {
          if (setDisplayedColumns) {
            setDisplayedColumns(cols);
          }
        }}
        onClose={() => setShowStudentColumnSelector(false)}
        onSave={() => setShowStudentColumnSelector(false)}
        onReset={() => {
          if (setDisplayedColumns) {
            setDisplayedColumns(defaultDisplayedColumns);
          }
        }}
        storageKeyPrefix="student"
        fixedColumns={["Student ID", "Name", "Actions"]}
      />
    </div>
  );
}
