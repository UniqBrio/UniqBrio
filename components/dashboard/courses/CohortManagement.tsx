"use client"

import React, { useState, useEffect } from "react"
import { format } from "date-fns"
import { Button } from "@/components/dashboard/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/dashboard/ui/dialog"
import { Input } from "@/components/dashboard/ui/input"
import { Label } from "@/components/dashboard/ui/label"
import { Textarea } from "@/components/dashboard/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/dashboard/ui/table"
import { Card, CardContent } from "@/components/dashboard/ui/card"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/dashboard/ui/dropdown-menu"
import { Plus, Users, Trash2, Pencil, Download, Upload, X, ChevronDown, ChevronRight, ChevronLeft, ChevronUp, ChevronDown as ChevronDownIcon, RotateCcw, Eye, RefreshCcw } from "lucide-react"
import { useToast } from "@/hooks/dashboard/use-toast"
import type { Course } from "@/types/dashboard/course"
import CohortSearchAndFilters from "./CohortSearchAndFilters"
import { ColumnSelectorModal } from "@/components/dashboard/ui/ColumnSelectorModal"
import { useColumnManagement } from "@/hooks/dashboard/useColumnManagement"

interface Cohort {
  id: string;
  name: string;
  courseId: string;
  notes: string;
  status: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  capacity: number;
  members: { id: string; name: string }[];
  instructorName?: string;
  location?: string;
  daysOfWeek?: number[];
}

interface CohortIdentitySettings {
  prefixSource: 'course-name' | 'course-id' | 'custom'
  customPrefix: string
  idNumberPadding: number
  allowManualIds: boolean
  enforceUppercase: boolean
}

interface CohortInheritanceSettings {
  inheritScheduleFromCourse: boolean
  inheritInstructorFromCourse: boolean
  inheritLocationFromCourse: boolean
  syncCapacityWithCourse: boolean
  defaultCapacityFallback: number
}

interface CohortManagementProps {
  courses: Course[];
  cohorts: Cohort[];
  setCohorts: (cohorts: Cohort[] | ((prev: Cohort[]) => Cohort[])) => void;
  showDeleteConfirmation: (title: string, message: string, onConfirm: () => void, itemName?: string) => void;
  settings?: {
    identity?: CohortIdentitySettings
    inheritance?: CohortInheritanceSettings
  };
  // allStudents: { id: string; name: string }[]; // No longer needed
}

export default function CohortManagement({ 
  courses, 
  cohorts, 
  setCohorts, 
  showDeleteConfirmation, 
  settings,
}: Omit<CohortManagementProps, 'allStudents'>) {
  const { toast } = useToast();

  const identityDefaults: CohortIdentitySettings = {
    prefixSource: 'course-name',
    customPrefix: 'COHR',
    idNumberPadding: 4,
    allowManualIds: false,
    enforceUppercase: true,
  }

  const identitySettings: CohortIdentitySettings = {
    ...identityDefaults,
    ...(settings?.identity || {}),
  }

  const inheritanceDefaults: CohortInheritanceSettings = {
    inheritScheduleFromCourse: true,
    inheritInstructorFromCourse: true,
    inheritLocationFromCourse: true,
    syncCapacityWithCourse: true,
    defaultCapacityFallback: 12,
  }

  const inheritanceSettings: CohortInheritanceSettings = {
    ...inheritanceDefaults,
    ...(settings?.inheritance || {}),
  }

  const sanitizeCohortPrefix = (value?: string) => {
    const fallback = identitySettings.customPrefix || 'COHR'
    const cleaned = (value || fallback).replace(/[^A-Za-z0-9_-]/g, '') || fallback
    const normalized = cleaned.padEnd(3, 'X').slice(0, 6)
    return identitySettings.enforceUppercase ? normalized.toUpperCase() : normalized
  }

  const deriveCohortPrefix = (course?: Course) => {
    if (identitySettings.prefixSource === 'custom') {
      return sanitizeCohortPrefix(identitySettings.customPrefix)
    }
    if (!course) {
      return sanitizeCohortPrefix(identitySettings.customPrefix)
    }
    if (identitySettings.prefixSource === 'course-id') {
      return sanitizeCohortPrefix(course.courseId || course.id || identitySettings.customPrefix)
    }
    const base = (course.name || '').replace(/\s+/g, '') || course.courseId || identitySettings.customPrefix
    return sanitizeCohortPrefix(base)
  }

  const escapeIdRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const getNextCohortSequence = (prefix: string, course?: Course) => {
    const regex = new RegExp(`^${escapeIdRegex(prefix)}(\\d+)$`, 'i')
    let maxSeq = 0
    cohorts.forEach((cohort) => {
      const sameCourse = course
        ? (cohort.courseId === (course.courseId || course.id) || cohort.courseId === course.id)
        : true
      if (!sameCourse) return
      const match = cohort.id?.match(regex)
      if (match) {
        const numeric = parseInt(match[1], 10)
        if (!Number.isNaN(numeric)) {
          maxSeq = Math.max(maxSeq, numeric)
        }
      }
    })
    return maxSeq + 1
  }

  const buildNextCohortId = (course?: Course) => {
    const prefix = deriveCohortPrefix(course)
    const digits = Math.max(2, Math.min(identitySettings.idNumberPadding || 4, 6))
    const sequence = getNextCohortSequence(prefix, course)
    const nextId = `${prefix}${String(sequence).padStart(digits, '0')}`
    return identitySettings.enforceUppercase ? nextId.toUpperCase() : nextId
  }
 
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

  // Validation functions
  const validateCohortName = (name: string) => {
    // Must start with a letter and contain at least 4 alphabets (can have spaces, numbers, hyphens, underscores)
    const alphabetCount = (name.match(/[a-zA-Z]/g) || []).length;
    const nameRegex = /^[a-zA-Z0-9\s\-_]*$/;
    const startsWithLetter = /^[a-zA-Z]/.test(name);
    
    // Allow if empty (for clearing), starts with letter and has valid chars, or has 4+ letters and starts with letter
    return nameRegex.test(name) && (name === '' || (startsWithLetter && (/^[a-zA-Z\s\-_]+$/.test(name) || alphabetCount >= 4)));
  };

  const validateInstructorName = (name: string) => {
    // Allow only letters and spaces for instructor names
    const nameRegex = /^[a-zA-Z\s]*$/;
    return nameRegex.test(name);
  };

  const validateNotes = (notes: string) => {
    // Allow letters, numbers, spaces, and common punctuation
    const notesRegex = /^[a-zA-Z0-9\s.,!?;:()\-_'"]*$/;
    return notesRegex.test(notes);
  };

  // Simple formatter to show AM/PM while keeping native time input for editing
  const formatTime12 = (time?: string): string => {
    if (!time) return '-';
    const date = new Date(`2000-01-01T${time}`);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Note: Using native HTML time inputs which handle AM/PM internally

  // Helpers for meridiem conversion (keep 24h internal storage)
  const getMeridiem = (time?: string): 'AM' | 'PM' => {
    if (!time) return 'AM';
    const h = parseInt(time.split(':')[0], 10);
    return h >= 12 ? 'PM' : 'AM';
  };
  const getHour12 = (time?: string): string => {
    if (!time) return '';
    let h = parseInt(time.split(':')[0], 10);
    h = h % 12;
    if (h === 0) h = 12;
    return String(h).padStart(2, '0');
  };
  const applyMeridiem = (time: string, meridiem: 'AM' | 'PM'): string => {
    if (!/^\d{2}:\d{2}$/.test(time)) return time;
    let [hStr, m] = time.split(':');
    let h = parseInt(hStr, 10);
    if (meridiem === 'AM') {
      if (h === 12) h = 0; // 12AM -> 00
    } else {
      if (h < 12) h += 12; // 1-11PM -> 13-23
    }
    return `${String(h).padStart(2, '0')}:${m}`;
  };
  
  // Convert 24-hour time back to 12-hour format for input display
  const get12HourTime = (time24?: string): string => {
    if (!time24) return '';
    const [hStr, m] = time24.split(':');
    let h = parseInt(hStr, 10);
    h = h % 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:${m}`;
  };

  // Map course status to appropriate cohort status
  const getInheritedCohortStatus = (courseStatus?: string): string => {
    const statusMapping: { [key: string]: string } = {
      'Active': 'Active',
      'Inactive': 'On Hold',
      'Draft': 'Upcoming', 
      'Completed': 'Completed',
      'Upcoming': 'Upcoming',
      'Published': 'Active'
    };
    return statusMapping[courseStatus || 'Active'] || 'Active';
  };

  // Update all cohorts associated with a course when course status changes
  const updateCohortsForCourseStatus = async (courseId: string, courseStatus: string) => {
    try {
      const newCohortStatus = getInheritedCohortStatus(courseStatus);
      const affectedCohorts = cohorts.filter(cohort => cohort.courseId === courseId);
      
      if (affectedCohorts.length === 0) return;

      // Update cohorts in backend
      const updatePromises = affectedCohorts.map(async (cohort) => {
        const cohortData = {
          ...cohort,
          status: newCohortStatus,
          cohortId: cohort.id
        };

        const response = await fetch('/api/dashboard/services/cohorts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cohortData)
        });

        if (!response.ok) {
          console.error(`Failed to update cohort ${cohort.id}:`, response.status);
          return null;
        }
        return cohort.id;
      });

      const results = await Promise.all(updatePromises);
      const successfulUpdates = results.filter(id => id !== null);

      // Update frontend state
      setCohorts(prev => 
        prev.map(cohort => 
          cohort.courseId === courseId 
            ? { ...cohort, status: newCohortStatus }
            : cohort
        )
      );

      if (successfulUpdates.length > 0) {
        toast({
          title: "Cohorts Updated",
          description: `${successfulUpdates.length} cohort(s) updated to "${newCohortStatus}" status to match course status.`,
        });
      }

    } catch (error) {
      console.error('Error updating cohorts for course status change:', error);
      toast({
        title: "Error",
        description: "Failed to update some cohorts. Please refresh and try again.",
        variant: "destructive"
      });
    }
  };
  
  // Test toast on component mount
  React.useEffect(() => {
    console.log('CohortManagement mounted, toast function:', typeof toast);
  }, []);

  const [isAddCohortOpen, setIsAddCohortOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [viewAllCohorts, setViewAllCohorts] = useState(false);
  
  // Debug logging and explicit viewMode initialization
  React.useEffect(() => {
    console.log('CohortManagement viewMode initialized to:', viewMode)
    // Explicitly ensure list view is set
    if (viewMode !== 'list') {
      console.log('Forcing CohortManagement viewMode to list')
      setViewMode('list')
    }
  }, [])
  const [selectedCohortIds, setSelectedCohortIds] = useState<string[]>([]);
  const [newCohort, setNewCohort] = useState<{
    name: string;
    id: string;
    courseId: string;
    notes: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    capacity?: string;
    location?: string;
    instructorName?: string;
  }>({
    name: '',
    id: '',
    courseId: '',
    notes: '',
    status: 'Active',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    capacity: '',
    location: '',
    instructorName: ''
  });
  const [cohortIdManuallyEdited, setCohortIdManuallyEdited] = useState(false);
  const [useCustomSchedule, setUseCustomSchedule] = useState(false);
  const [newCohortEditId, setNewCohortEditId] = useState<string | null>(null);
  const [addMembersCohortId, setAddMembersCohortId] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  
  // Instructors state for dropdown
  const [instructors, setInstructors] = useState<{ id: string; name: string; instructorId?: string }[]>([]);
  const [instructorsLoading, setInstructorsLoading] = useState(true);
  
  // Days of the week selection for cohort scheduling
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Default to Mon-Fri
  
  // Track missing fields for validation highlighting
  const [missingFields, setMissingFields] = useState<Set<string>>(new Set());
  
  // Date input focus states for custom formatting display
  const [startDateFocused, setStartDateFocused] = useState(false);
  const [endDateFocused, setEndDateFocused] = useState(false);
  const daysOfWeek = [
    { label: 'Sun', value: 0 },
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 }
  ];

  // Location selection with search functionality (same as course form)
  const [locationSearchTerm, setLocationSearchTerm] = useState('');
  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);

  // Helper function to format dates for display
  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'dd-MMM-yy');
    } catch {
      return dateStr;
    }
  };

  // Column management
  const columnManagement = useColumnManagement('cohorts');

  // View dialog state
  const [isViewCohortDialogOpen, setIsViewCohortDialogOpen] = useState(false);
  const [selectedCohortForView, setSelectedCohortForView] = useState<Cohort | null>(null);

  useEffect(() => {
    setCohortIdManuallyEdited(false)
  }, [newCohort.courseId])

  useEffect(() => {
    if (newCohortEditId) return
    if (!newCohort.courseId) return
    if (identitySettings.allowManualIds && cohortIdManuallyEdited) return
    const selectedCourse = courses.find(c => c.courseId === newCohort.courseId || c.id === newCohort.courseId)
    if (!selectedCourse) return
    const generatedId = buildNextCohortId(selectedCourse)
    setNewCohort(prev => prev.id === generatedId ? prev : { ...prev, id: generatedId })
  }, [newCohort.courseId, cohorts, courses, newCohortEditId, identitySettings, cohortIdManuallyEdited])

  // Define all available columns for the cohort table (matching useColumnManagement hook)
  const allCohortColumns = [
    { id: 'cohortId', label: 'Cohort ID' },
    { id: 'name', label: 'Cohort Name' },
    { id: 'courseName', label: 'Course Name' },
    { id: 'status', label: 'Status' },
    { id: 'capacity', label: 'Capacity' },
    { id: 'members', label: 'Members' },
    { id: 'instructorName', label: 'Instructor' },
    { id: 'location', label: 'Location' },
    { id: 'startDate', label: 'Start Date' },
    { id: 'endDate', label: 'End Date' },
    { id: 'startTime', label: 'Start Time' },
    { id: 'endTime', label: 'End Time' },
    { id: 'notes', label: 'Notes' }
  ];

  // Import cohorts from CSV only - Simple and reliable approach
  const handleImportCohorts = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Only CSV files are allowed.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      await processCohortImportData(e.target?.result as string, 'csv');
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Process cohort import data (CSV only)
  const processCohortImportData = async (csvContent: string, fileType: 'csv') => {
    try {
      console.log('=== COHORT IMPORT DEBUG ===');
      console.log('Processing CSV data:', csvContent);
      
      // Split into lines and clean up
      const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
      console.log('Total lines:', lines.length);
      
      if (lines.length < 2) {
        alert(`CSV must have at least 2 lines (header + data)`);
        return;
      }

      // Get headers - simple comma split, then clean
      const rawHeaders = lines[0].split(',');
      const headers = rawHeaders.map(h => h.replace(/"/g, '').trim());
      console.log(`Raw headers from ${fileType}:`, rawHeaders);
      console.log('Cleaned headers:', headers);
      console.log('Headers lowercased for matching:', headers.map(h => h.toLowerCase()));
      
      // Show user what headers we found
      alert(`Found these headers in your CSV:\n${headers.map((h, i) => `${i}: "${h}"`).join('\n')}\n\nCheck console for detailed import process...`);
      
      // Find column indexes for each field we need - more flexible matching
      const getColumnIndex = (possibleNames: string[]) => {
        console.log(`\nLooking for column matching: ${possibleNames.join(', ')}`);
        const headersLower = headers.map(h => h.toLowerCase());
        
        for (const name of possibleNames) {
          // Try exact match first
          let index = headersLower.findIndex(h => h === name.toLowerCase());
          if (index >= 0) {
            console.log(`  ? Found exact match: "${headers[index]}" at index ${index}`);
            return index;
          }
          // Try partial match
          index = headersLower.findIndex(h => h.includes(name.toLowerCase()));
          if (index >= 0) {
            console.log(`  ? Found partial match: "${headers[index]}" at index ${index}`);
            return index;
          }
        }
        console.log(`  ? No match found for: ${possibleNames.join(', ')}`);
        return -1;
      };
      
      const columnMap = {
        name: getColumnIndex(['cohort name', 'name', 'cohortname', 'cohort_name', 'title']),
        id: getColumnIndex(['cohort id', 'id', 'cohortid', 'cohort_id']),
        courseId: getColumnIndex(['course id', 'courseid', 'course', 'course_id', 'courseId']),
        status: getColumnIndex(['status', 'state']),
        location: getColumnIndex(['location', 'venue', 'place']),
        instructor: getColumnIndex(['instructor', 'instructor name', 'instructorname', 'instructor_name', 'teacher']),
        startDate: getColumnIndex(['start date', 'startdate', 'start_date', 'begin date', 'from']),
        endDate: getColumnIndex(['end date', 'enddate', 'end_date', 'finish date', 'to']),
        startTime: getColumnIndex(['start time', 'starttime', 'start_time', 'begin time', 'time']),
        endTime: getColumnIndex(['end time', 'endtime', 'end_time', 'finish time']),
        capacity: getColumnIndex(['capacity', 'max', 'maximum', 'limit', 'size']),
        notes: getColumnIndex(['notes', 'note', 'description', 'comments', 'remarks'])
      };
      
      console.log('Column mapping results:', columnMap);
      
      // If we couldn't find name or courseId columns, let user manually map
      if (columnMap.name === -1 || columnMap.courseId === -1) {
        console.log('?? Could not auto-detect required columns!');
        console.log('Available headers:', headers.map((h, i) => `${i}: "${h}"`).join(', '));
        
        const nameColumn = columnMap.name === -1 ? 
          parseInt(prompt(`Could not find cohort name column.\nYour headers: ${headers.map((h, i) => `${i}:"${h}"`).join(', ')}\n\nWhich column number contains the cohort names? (0-${headers.length-1})`) || '-1') :
          columnMap.name;
          
        const courseIdColumn = columnMap.courseId === -1 ? 
          parseInt(prompt(`Could not find course ID column.\nYour headers: ${headers.map((h, i) => `${i}:"${h}"`).join(', ')}\n\nWhich column number contains the course IDs? (0-${headers.length-1})`) || '-1') :
          columnMap.courseId;
        
        if (nameColumn === -1 || courseIdColumn === -1 || isNaN(nameColumn) || isNaN(courseIdColumn)) {
          alert('Import cancelled - need both cohort name and course ID columns');
          return;
        }
        
        // Update column mapping with manual selection
        columnMap.name = nameColumn;
        columnMap.courseId = courseIdColumn;
        console.log('Updated column mapping with manual selection:', columnMap);
      }
      
      const newCohorts: Cohort[] = [];
      
      // Process each data row
      for (let i = 1; i < lines.length; i++) {
        console.log(`\n--- Processing Row ${i} ---`);
        console.log('Raw line:', lines[i]);
        
        // Simple comma split for values, but handle quoted values better
        const rawValues = lines[i].split(',');
        const values = rawValues.map(v => {
          // Remove surrounding quotes and trim
          let cleaned = v.trim();
          if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.slice(1, -1);
          }
          return cleaned;
        });
        console.log('Split values:', values);
        console.log('Values with indexes:');
        values.forEach((val, idx) => {
          console.log(`  [${idx}]: "${val}"`);
        });
        
        // Extract values using column mapping with detailed logging
        const cohortData = {
          id: columnMap.id >= 0 ? values[columnMap.id] || '' : '',
          name: columnMap.name >= 0 ? values[columnMap.name] || '' : '',
          courseId: columnMap.courseId >= 0 ? values[columnMap.courseId] || '' : '',
          status: columnMap.status >= 0 ? values[columnMap.status] || 'Active' : 'Active',
          location: columnMap.location >= 0 ? values[columnMap.location] || 'TBD' : 'TBD',
          instructorName: columnMap.instructor >= 0 ? values[columnMap.instructor] || '' : '',
          startDate: columnMap.startDate >= 0 ? values[columnMap.startDate] || '' : '',
          endDate: columnMap.endDate >= 0 ? values[columnMap.endDate] || '' : '',
          startTime: columnMap.startTime >= 0 ? values[columnMap.startTime] || '09:00' : '09:00',
          endTime: columnMap.endTime >= 0 ? values[columnMap.endTime] || '10:00' : '10:00',
          capacity: columnMap.capacity >= 0 ? parseInt(values[columnMap.capacity]) || 10 : 10,
          notes: columnMap.notes >= 0 ? values[columnMap.notes] || '' : '',
          members: [] as { id: string; name: string }[]
        };
        
        // Show detailed extraction results
        console.log('Field extraction results:');
        console.log(`  name: column ${columnMap.name} -> "${cohortData.name}"`);
        console.log(`  courseId: column ${columnMap.courseId} -> "${cohortData.courseId}"`);
        console.log(`  location: column ${columnMap.location} -> "${cohortData.location}"`);
        console.log(`  capacity: column ${columnMap.capacity} -> "${cohortData.capacity}"`);
        console.log('Final extracted data:', cohortData);
        
        // Validate required fields
        if (!cohortData.name) {
          console.log(`Row ${i}: Missing cohort name`);
          continue;
        }
        
        if (!cohortData.courseId) {
          console.log(`Row ${i}: Missing course ID`);
          continue;
        }
        
        // Generate ID in sequential format based on associated course (same as Add Cohort flow)
        if (!cohortData.id) {
          // Try to resolve the course from provided courseId which may be an ID or a name
          const selectedCourse = courses.find(c =>
            c.id === cohortData.courseId ||
            c.courseId === cohortData.courseId ||
            (typeof cohortData.courseId === 'string' && c.name?.toLowerCase() === cohortData.courseId.toLowerCase())
          );
          if (!selectedCourse) {
            console.warn(`Row ${i}: Could not resolve course for courseId/value "${cohortData.courseId}". Skipping row to avoid orphan cohort.`);
            continue;
          }
          // Normalize courseId to stored value
          cohortData.courseId = selectedCourse.courseId || selectedCourse.id || cohortData.courseId;

          // Derive 4-letter prefix from course name (pad with X) e.g., "MUSI"
          let prefix = (selectedCourse.name || '').replace(/\s/g, '').toUpperCase().slice(0, 4);
          if (prefix.length < 4) prefix = prefix.padEnd(4, 'X');

          // Consider existing cohorts + ones being imported in this batch for uniqueness
          const existingForCourse = [...cohorts, ...newCohorts].filter(c =>
            (c.courseId === (selectedCourse.courseId || selectedCourse.id)) && typeof c.id === 'string' && c.id.startsWith(prefix)
          );

          let maxSeq = 0;
          existingForCourse.forEach(c => {
            const m = c.id.match(new RegExp(`^${prefix}(\\d{4})$`));
            if (m) {
              const n = parseInt(m[1], 10);
              if (!isNaN(n) && n > maxSeq) maxSeq = n;
            }
          });

          const nextSeq = (maxSeq + 1).toString().padStart(4, '0');
          cohortData.id = `${prefix}${nextSeq}`;
        }
        
        console.log('Final cohort data:', cohortData);
        newCohorts.push(cohortData as Cohort);
      }
      
      console.log(`\n=== IMPORT SUMMARY ===`);
      console.log('Total cohorts to import:', newCohorts.length);
      console.log('Cohorts:', newCohorts);
      
      if (newCohorts.length === 0) {
        alert('No valid cohorts found in CSV. Check console for details.');
        return;
      }
      
      // Update UI immediately
      setCohorts(prevCohorts => {
        const updated = [...prevCohorts, ...newCohorts];
        console.log('Updated cohorts state:', updated);
        return updated;
      });
      
      // Try to save to database
      let savedCount = 0;
      for (const cohort of newCohorts) {
        try {
          const response = await fetch('/api/dashboard/services/cohorts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cohort),
          });
          
          if (response.ok) {
            savedCount++;
            console.log(`Saved cohort to DB: ${cohort.id}`);
          } else {
            console.error(`Failed to save cohort ${cohort.id}:`, response.status);
          }
        } catch (error) {
          console.error(`Error saving cohort ${cohort.id}:`, error);
        }
      }
      
      alert(`Import complete!\n${newCohorts.length} cohorts added to UI\n${savedCount} cohorts saved to database`);
      
    } catch (error) {
      console.error('CSV Import Error:', error);
      alert('Error importing CSV. Check console for details.');
    }
  };

  // Export cohorts as CSV including course name and member details
  const exportCohorts = (items: Cohort[], filename: string) => {
    const header = [
      'Cohort Name', 'Cohort ID', 'Course Name', 'Course ID', 'Status', 'Location', 'Instructor', 'Start Date', 'End Date', 'Start Time', 'End Time', 'Capacity', 'Current Members', 'Member Names', 'Member Details', 'Notes'
    ];
    const rows = items.map(cohort => {
      // Find course by matching courseId with either course.id or course.courseId
      const course = courses.find(c => c.id === cohort.courseId || c.courseId === cohort.courseId);
      const courseName = course ? course.name : 'Unknown Course';
      
      // Format member details
      const memberCount = cohort.members.length;
      const memberNames = cohort.members.map(m => m.name || m.id).join(', ');
      const memberDetails = cohort.members.map(m => `${m.name || 'No Name'} (ID: ${m.id})`).join('; ');
      
      return [
        cohort.name || '',
        cohort.id || '',
        courseName,
        cohort.courseId || '',
        cohort.status || 'Active',
        cohort.location || '',
        cohort.instructorName || '',
        cohort.startDate || '',
        cohort.endDate || '',
        cohort.startTime || '',
        cohort.endTime || '',
        cohort.capacity || '',
        `${memberCount}/${cohort.capacity}`,
        memberNames,
        memberDetails,
        cohort.notes || ''
      ];
    });
    const csvContent = [header, ...rows].map(r => r.map(x => `"${x ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCohorts = () => {
    exportCohorts(cohorts, 'cohorts_export.csv');
  };

  const handleExportSelectedCohorts = (items: Cohort[]) => {
    exportCohorts(items, 'cohorts_selected_export.csv');
  };
  const [selectedCohortForMembers, setSelectedCohortForMembers] = useState<Cohort | null>(null);
  const [viewAllCohortsForCourse, setViewAllCohortsForCourse] = useState<Course | null>(null);

  // Search and Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedFilters, setSelectedFilters] = useState<{
    course: string[];
    location: string[];
    capacity: string[];
    status: string[];
  }>({
    course: [],
    location: [],
    capacity: [],
    status: []
  });
  const [pendingFilters, setPendingFilters] = useState<{
    course: string[];
    location: string[];
    capacity: string[];
    status: string[];
  }>({
    course: [],
    location: [],
    capacity: [],
    status: []
  });

  // Unsaved changes tracking for cohort dialog (simplified)
  const [showCohortUnsavedDialog, setShowCohortUnsavedDialog] = useState(false);

  // Function to refresh students data
  const refreshStudents = async () => {
    setStudentsLoading(true);
    try {
      const res = await fetch('/api/dashboard/services/user-management/students');
      const data = await res.json();
      console.log('Refreshed students data:', data);
      setStudents(Array.isArray(data.students) ? data.students : []);
    } catch (e) {
      console.error('Error refreshing students:', e);
      setStudents([]);
    }
    setStudentsLoading(false);
  };

  useEffect(() => {
    async function fetchStudents() {
      setStudentsLoading(true);
      try {
        console.log('?? [CohortManagement] Fetching students from API...');
        const res = await fetch('/api/dashboard/services/user-management/students');
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('?? [CohortManagement] Students API response:', data);
        console.log('?? [CohortManagement] Students array:', data.students);
        console.log('?? [CohortManagement] Students count from API:', data.count);
        
        if (data.success === false) {
          console.error('? [CohortManagement] API returned error:', data.error);
          setStudents([]);
        } else {
          const studentsArray = Array.isArray(data.students) ? data.students : [];
          console.log('? [CohortManagement] Setting students:', studentsArray.length, 'records');
          setStudents(studentsArray);
        }
      } catch (e) {
        console.error('? [CohortManagement] Error fetching students:', e);
        setStudents([]);
      }
      setStudentsLoading(false);
    }
    fetchStudents();
  }, []);

  // Refresh students when members dialog is opened - disabled to preserve existing names
  // useEffect(() => {
  //   if (selectedCohortForMembers && selectedCohortForMembers.members.length > 0) {
  //     console.log('Members dialog opened, refreshing students...');
  //     refreshStudents();
  //   }
  // }, [selectedCohortForMembers?.id]);

  // Fetch instructors for dropdown
  useEffect(() => {
    async function fetchInstructors() {
      setInstructorsLoading(true);
      try {
        const res = await fetch('/api/dashboard/services/user-management/instructors?fields=minimal');
        const data = await res.json();
        if (data.success && Array.isArray(data.instructors)) {
          setInstructors(data.instructors);
        } else {
          setInstructors([]);
        }
      } catch (e) {
        console.error('Failed to fetch instructors:', e);
        setInstructors([]);
      }
      setInstructorsLoading(false);
    }
    fetchInstructors();
  }, []);

  // Monitor course status changes and update associated cohorts
  useEffect(() => {
    // This effect runs when courses prop changes
    // It checks if any course status has changed and updates cohorts accordingly
    const checkAndUpdateCohortStatuses = async () => {
      for (const course of courses) {
        const associatedCohorts = cohorts.filter(cohort => cohort.courseId === course.courseId || cohort.courseId === course.id);
        
        if (associatedCohorts.length > 0) {
          const expectedCohortStatus = getInheritedCohortStatus(course.status);
          const outdatedCohorts = associatedCohorts.filter(cohort => 
            cohort.status !== expectedCohortStatus && 
            // Only update if course status requires it (Inactive/Completed should force update)
            (course.status === 'Inactive' || course.status === 'Completed')
          );
          
          if (outdatedCohorts.length > 0) {
            console.log(`Found ${outdatedCohorts.length} cohorts to update for course ${course.courseId} (${course.status})`);
            // Silently update these cohorts
            setCohorts(prev => 
              prev.map(cohort => 
                cohort.courseId === course.courseId || cohort.courseId === course.id
                  ? { ...cohort, status: expectedCohortStatus }
                  : cohort
              )
            );
          }
        }
      }
    };

    if (courses.length > 0 && cohorts.length > 0) {
      checkAndUpdateCohortStatuses();
    }
  }, [courses, cohorts]); // Watch for changes in courses

  // Populate form data when editing a cohort
  useEffect(() => {
    if (newCohortEditId) {
      const cohortToEdit = cohorts.find(c => c.id === newCohortEditId);
      if (cohortToEdit) {
        setNewCohort({
          name: cohortToEdit.name,
          id: cohortToEdit.id,
          courseId: cohortToEdit.courseId,
          notes: cohortToEdit.notes || '',
          status: cohortToEdit.status || 'Active',
          startDate: cohortToEdit.startDate || '',
          endDate: cohortToEdit.endDate || '',
          startTime: cohortToEdit.startTime || '',
          endTime: cohortToEdit.endTime || '',
          capacity: cohortToEdit.capacity?.toString() || '',
          location: cohortToEdit.location || '',
          instructorName: cohortToEdit.instructorName || ''
        });
        
        // Set selected days from cohort data if available
        setSelectedDays(cohortToEdit.daysOfWeek || [1, 2, 3, 4, 5]); // Use actual days or default to Mon-Fri
      }
    } else {
      // Reset form for new cohort
      setNewCohort({
        name: '',
        id: '',
        courseId: '',
        notes: '',
        status: 'Active',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        capacity: '',
        location: '',
        instructorName: ''
      });
      setSelectedDays([1, 2, 3, 4, 5]); // Default to Mon-Fri for new cohorts
    }
  }, [newCohortEditId, cohorts]);

  // Fetch locations from API
  const fetchLocations = async () => {
    try {
      console.log('?? [Cohort] Fetching locations from API...')
      const response = await fetch('/api/dashboard/services/courses?locations=true')
      const data = await response.json()
      console.log('?? [Cohort] Locations API response:', data)
      if (data.success) {
        setLocationOptions(data.locations)
        console.log('? [Cohort] Loaded', data.locations.length, 'locations:', data.locations)
      }
    } catch (error) {
      console.error('? [Cohort] Error fetching locations:', error)
      // Fallback to default locations if API fails
      setLocationOptions([
        'Studio A',
        'Pool Area',
        'Music Room',
        'Classroom 101',
        'Basketball Court',
        'Dance Studio',
        'Virtual - Zoom',
        'Virtual - Microsoft Teams',
        'Virtual - Google Meet',
        'Virtual - WebEx',
        'Virtual - Other'
      ])
    } finally {
      setLocationsLoading(false)
    }
  }

  // Add new location to database and refresh list
  const addNewLocation = async (locationName: string) => {
    try {
      console.log('? [Cohort] Adding new location:', locationName)
      const response = await fetch('/api/dashboard/services/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'add-location', name: locationName }),
      })
      const data = await response.json()
      console.log('?? [Cohort] Add location API response:', data)
      if (data.success) {
        // Refresh the location list
        console.log('?? [Cohort] Refreshing location list...')
        await fetchLocations()
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('locationAdded', {
          detail: { locationName }
        }))
        toast({
          title: "Location Added",
          description: `"${locationName}" has been added to the location list.`,
        })
      }
    } catch (error) {
      console.error('? [Cohort] Error adding location:', error)
      toast({
        title: "Error",
        description: "Failed to add location. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Fetch locations on component mount
  useEffect(() => {
    fetchLocations()

    // Listen for location updates from other components
    const handleLocationAdded = (event: CustomEvent) => {
      console.log('?? Location added event received in cohort form:', event.detail)
      fetchLocations()
    }

    window.addEventListener('locationAdded', handleLocationAdded as EventListener)
    
    return () => {
      window.removeEventListener('locationAdded', handleLocationAdded as EventListener)
    }
  }, [])

  // Add a manual refresh function for locations
  const refreshLocations = () => {
    setLocationsLoading(true)
    fetchLocations()
  }

  // Handle view cohort
  const handleViewCohort = (cohort: Cohort) => {
    setSelectedCohortForView(cohort)
    setIsViewCohortDialogOpen(true)
  }

  // Handle cohort dialog close with unsaved changes check (only for explicit Cancel button clicks)
  const handleCohortDialogClose = () => {
    // For new cohorts: check if any fields have been filled
    const hasAnyData = newCohort.name || newCohort.courseId || newCohort.notes || 
                       newCohort.instructorName || newCohort.location || newCohort.capacity ||
                       newCohort.startDate || newCohort.endDate || newCohort.startTime || newCohort.endTime;
    
    // Always show confirmation for edit mode or when there's any form data
    if (newCohortEditId || hasAnyData) {
      setShowCohortUnsavedDialog(true);
    } else {
      setIsAddCohortOpen(false);
      resetCohortForm();
    }
  };

  // Handle dialog open change - prevent closing when clicking outside (similar to Course form)
  const handleCohortDialogOpenChange = (open: boolean) => {
    // Only allow closing through explicit user actions (Cancel button), not by clicking outside
    if (!open) {
      // Ignore close requests from clicking outside - do nothing
      return;
    }
    // Allow opening
    setIsAddCohortOpen(open);
  };

  // Handle unsaved cohort changes dialog actions
  const handleDiscardCohortChanges = () => {
    setShowCohortUnsavedDialog(false);
    setIsAddCohortOpen(false);
    resetCohortForm();
  };

  const resetCohortForm = () => {
    setNewCohort({
      name: '',
      id: '',
      courseId: '',
      notes: '',
      status: 'Active',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      capacity: '',
      location: '',
      instructorName: ''
    });
    setNewCohortEditId(null);
    setUseCustomSchedule(false);
    setSelectedDays([1, 2, 3, 4, 5]); // Reset selected days to default
  };

  // Function to render table cell content based on column id
  const renderCohortCellContent = (cohort: Cohort, columnId: string) => {
    const course = courses.find(c => c.courseId === cohort.courseId);
    
    switch (columnId) {
      case 'cohortId':
        return <span className="font-medium">{cohort.id}</span>;
      case 'name':
        return (
          <div className="font-medium">
            <div>{cohort.name}</div>
          </div>
        );
      case 'courseId':
        return <span className="font-mono text-sm text-gray-600">{cohort.courseId}</span>;
      case 'courseName':
        return course?.name || cohort.courseId;
      case 'status': {
        const statusCourse = courses.find(c => c.courseId === cohort.courseId || c.id === cohort.courseId);
        const isStatusControlled = statusCourse?.status === 'Inactive' || statusCourse?.status === 'Completed';
        return (
          <div className="flex items-center gap-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              cohort.status === 'Active' ? 'bg-green-100 text-green-800' :
              cohort.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
              cohort.status === 'Upcoming' ? 'bg-yellow-100 text-yellow-800' :
              cohort.status === 'On Hold' ? 'bg-orange-100 text-orange-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {cohort.status || 'Active'}
            </span>
            {isStatusControlled && (
              <span title={`Status controlled by course (${statusCourse?.status})`} className="text-blue-500 text-xs">
                ??
              </span>
            )}
          </div>
        );
      }
      case 'startDate':
        return cohort.startDate ? format(new Date(cohort.startDate), 'dd-MMM-yy') : '-';
      case 'endDate':
        return cohort.endDate ? format(new Date(cohort.endDate), 'dd-MMM-yy') : '-';
      case 'startTime':
        return formatTime12(cohort.startTime);
      case 'endTime':
        return formatTime12(cohort.endTime);
      case 'location':
        return cohort.location || '-';
      case 'instructorName':
        return cohort.instructorName || '-';
      case 'capacity':
        return <span className="text-center">{cohort.capacity}</span>;
      case 'members':
        return (
          <Button
            variant="ghost"
            className="text-center w-full"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCohortForMembers(cohort);
            }}
          >
            {cohort.members.length}
            {cohort.members.length === cohort.capacity && 
              <span className="text-xs text-red-500 ml-1">(Full)</span>
            }
          </Button>
        );
      case 'notes':
        return cohort.notes ? (
          <div className="text-sm text-gray-600">
            {cohort.notes.length > 30 ? `${cohort.notes.substring(0, 30)}...` : cohort.notes}
          </div>
        ) : '-';
      default:
        return '-';
    }
  };

  // Filter and sort cohorts based on search term, filters, and sort options
  const filteredAndSortedCohorts = React.useMemo(() => {
    let filtered = cohorts;

    // Debug logging
    console.log('=== FILTERING DEBUG ===');
    console.log('Applied filters:', selectedFilters);
    console.log('Total cohorts:', cohorts.length);
    console.log('Available courses:', courses.map(c => ({ id: c.id, courseId: c.courseId, name: c.name })));
    console.log('Cohorts data:', cohorts.map(c => ({ id: c.id, name: c.name, courseId: c.courseId })));

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(cohort => {
        const course = courses.find(c => c.courseId === cohort.courseId || c.id === cohort.courseId);
        return (
          cohort.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cohort.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (cohort.instructorName && cohort.instructorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (cohort.location && cohort.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (course && course.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      });
      console.log('After search filter:', filtered.length);
    }

    // Apply course filter
    if (selectedFilters.course.length > 0) {
      console.log('Applying course filter with selected courses:', selectedFilters.course);
      filtered = filtered.filter(cohort => {
        console.log('Checking cohort:', cohort.name, 'courseId:', cohort.courseId);
        
        // Find the course for this cohort
        const course = courses.find(c => c.courseId === cohort.courseId || c.id === cohort.courseId);
        console.log('Found course:', course ? course.name : 'not found', course ? `courseId: ${course.courseId}, id: ${course.id}` : '');
        
        if (!course) return false;
        
        // Check if the course matches any of the selected filters
        // We'll check both course ID/courseId and course name
        const courseIdentifier = course.courseId || course.id;
        const courseName = course.name;
        
        const matchById = selectedFilters.course.includes(courseIdentifier);
        const matchByName = selectedFilters.course.includes(courseName);
        
        console.log('Course identifier:', courseIdentifier, 'name:', courseName);
        console.log('Match by ID:', matchById, 'Match by name:', matchByName);
        
        const isIncluded = matchById || matchByName;
        console.log('Final result for cohort:', cohort.name, 'included:', isIncluded);
        
        return isIncluded;
      });
      console.log('After course filter:', filtered.length);
    }

    // Apply location filter
    if (selectedFilters.location.length > 0) {
      filtered = filtered.filter(cohort => 
        cohort.location && selectedFilters.location.includes(cohort.location)
      );
      console.log('After location filter:', filtered.length);
    }

    // Apply capacity filter
    if (selectedFilters.capacity.length > 0 && selectedFilters.capacity[0] && selectedFilters.capacity[1]) {
      const minCapacity = parseInt(selectedFilters.capacity[0]) || 0;
      const maxCapacity = parseInt(selectedFilters.capacity[1]) || 999;
      filtered = filtered.filter(cohort => {
        const capacity = Number(cohort.capacity) || 0;
        return capacity >= minCapacity && capacity <= maxCapacity;
      });
      console.log('After capacity filter (range):', filtered.length, 'min:', minCapacity, 'max:', maxCapacity);
    }

    // Apply status filter
    if (selectedFilters.status.length > 0) {
      filtered = filtered.filter(cohort => 
        cohort.status && selectedFilters.status.includes(cohort.status)
      );
      console.log('After status filter:', filtered.length);
    }

    // Sort cohorts
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Cohort];
      let bValue: any = b[sortBy as keyof Cohort];

      if (sortBy === 'members') {
        aValue = a.members.length;
        bValue = b.members.length;
      } else if (sortBy === 'courseId') {
        const courseA = courses.find(c => c.courseId === a.courseId || c.id === a.courseId);
        const courseB = courses.find(c => c.courseId === b.courseId || c.id === b.courseId);
        aValue = courseA?.name || a.courseId;
        bValue = courseB?.name || b.courseId;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    console.log('Final filtered cohorts:', filtered.length);
    return filtered;
  }, [cohorts, searchTerm, selectedFilters, sortBy, sortOrder, courses]);

  return (
    <div className="space-y-4">
      {/* Header Section - Same as Course Page */}
      <div className="pt-1 pb-4 sm:pb-6">
        <div className="flex items-center mb-2 flex-wrap gap-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-700">Cohort Management</h1>
        </div>
        <p className="text-sm sm:text-base md:text-lg text-gray-600">
          Organize students into cohorts for better learning experiences and streamlined management.
        </p>
      </div>

      {/* Unified Card Container - Same as Course Page */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          {/* Search and Filters Component */}
          <CohortSearchAndFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            viewMode={viewMode}
            setViewMode={setViewMode}
            selectedFilters={selectedFilters}
            setSelectedFilters={setSelectedFilters}
            pendingFilters={pendingFilters}
            setPendingFilters={setPendingFilters}
            cohorts={cohorts}
            setCohorts={setCohorts}
            courses={courses}
            selectedCount={selectedCohortIds.length}
            onExport={() => {
              const selected = filteredAndSortedCohorts.filter(c => selectedCohortIds.includes(c.id))
              if (selected.length > 0) {
                exportCohorts(selected, 'cohorts_selected_export.csv')
              } else {
                exportCohorts(filteredAndSortedCohorts, 'cohorts_all_filtered.csv')
              }
            }}
            onAddCohort={() => {
              if (courses.length === 0) {
                alert('Please create a course first before adding cohorts.');
                return;
              }
              setNewCohort({ 
                name: '', 
                id: '', 
                courseId: '', 
                notes: '', 
                status: 'Active',
                startDate: '', 
                endDate: '', 
                startTime: '', 
                endTime: '', 
                capacity: '', 
                location: '', 
                instructorName: '' 
              });
              setUseCustomSchedule(false); // Reset to inherit from course by default
              setIsAddCohortOpen(true);
            }}
          />
          
          {/* Results Counter */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 mb-4 p-2 sm:p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-xs sm:text-sm font-medium text-purple-700">
                {filteredAndSortedCohorts.length} cohort{filteredAndSortedCohorts.length !== 1 ? 's' : ''} found
              </span>
              {selectedCohortIds.length > 0 && (
                <span className="text-xs text-blue-700">{selectedCohortIds.length} selected</span>
              )}
            </div>
            
            {/* Column Selection Button - only show in list view */}
            {viewMode === 'list' && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={columnManagement.openColumnSelector}
                  className="h-7 w-7 sm:h-8 sm:w-8 border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100"
                  title="Column Selection"
                >
                  <GridIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Cohort Display */}
          <div className="overflow-x-auto -mx-4 sm:mx-0">
      {viewMode === 'list' ? (
        <div className="table-container-with-sticky-header min-w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8 sticky-table-header">
                  <Checkbox
                    checked={filteredAndSortedCohorts.length > 0 && filteredAndSortedCohorts.every(c => selectedCohortIds.includes(c.id))}
                    onCheckedChange={(checked) => {
                      const ids = filteredAndSortedCohorts.map(c => c.id)
                      setSelectedCohortIds(prev => checked ? Array.from(new Set([...prev, ...ids])) : prev.filter(id => !ids.includes(id)))
                    }}
                  />
                </TableHead>
                {columnManagement.displayedColumns.map((columnId) => {
                  const column = allCohortColumns.find(col => col.id === columnId);
                  if (!column) return null;
                  
                  let className = "sticky-table-header";
                  if (columnId === 'cohortId') className += " w-32";
                  else if (columnId === 'courseId') className += " w-32";
                  else if (columnId === 'name') className += " w-48";
                  else if (columnId === 'courseName') className += " w-48";
                  else if (columnId === 'capacity' || columnId === 'members') className += " text-center";
                  
                  return (
                    <TableHead key={columnId} className={className}>
                      {column.label}
                    </TableHead>
                  );
                })}
                <TableHead className="text-right sticky-table-header"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-200">
              {filteredAndSortedCohorts.map((cohort) => (
                <TableRow 
                  key={cohort.id} 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleViewCohort(cohort)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedCohortIds.includes(cohort.id)}
                      onCheckedChange={(checked) => {
                        setSelectedCohortIds(prev => checked ? Array.from(new Set([...prev, cohort.id])) : prev.filter(id => id !== cohort.id))
                      }}
                    />
                  </TableCell>
                  {columnManagement.displayedColumns.map((columnId) => (
                    <TableCell key={columnId} className={
                      columnId === 'capacity' || columnId === 'members' ? 'text-center' : ''
                    }>
                      {renderCohortCellContent(cohort, columnId)}
                    </TableCell>
                  ))}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setAddMembersCohortId(cohort.id ?? ''); setSelectedMembers([]); }}
                        title="Add Members"
                      >
                        <span className="text-lg">👤+</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-purple-500 hover:text-purple-600"
                        onClick={() => {
                          setNewCohort({
                            name: cohort.name || '',
                            id: cohort.id || '',
                            courseId: cohort.courseId || '',
                            notes: cohort.notes || '',
                            status: cohort.status || 'Active',
                            startDate: cohort.startDate || '',
                            endDate: cohort.endDate || '',
                            startTime: cohort.startTime || '',
                            endTime: cohort.endTime || '',
                            capacity: cohort.capacity ? String(cohort.capacity) : '',
                            location: cohort.location || '',
                            instructorName: cohort.instructorName || ''
                          });
                          // Check if cohort has custom dates different from course
                          const selectedCourse = courses.find(c => c.courseId === cohort.courseId || c.id === cohort.courseId);
                          const hasCustomDates = selectedCourse?.schedulePeriod && (
                            cohort.startDate !== new Date(selectedCourse.schedulePeriod.startDate).toISOString().split('T')[0] ||
                            cohort.endDate !== new Date(selectedCourse.schedulePeriod.endDate).toISOString().split('T')[0]
                          );
                          setUseCustomSchedule(!!hasCustomDates);
                          setNewCohortEditId(cohort.id);
                          setIsAddCohortOpen(true);
                        }}
                        title="Edit Cohort"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-900"
                        onClick={() => {
                          showDeleteConfirmation(
                            "Delete Cohort",
                            "Are you sure you want to delete this cohort? This will remove all members from the cohort and cannot be undone.",
                            async () => {
                              try {
                                const response = await fetch('/api/dashboard/services/cohorts', {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: cohort.id }),
                                });

                                const data = await response.json();
                                
                                if (data.success) {
                                  setCohorts(prev => prev.filter(c => c.id !== cohort.id));
                                  toast({
                                    title: "Cohort Deleted",
                                    description: `${cohort.name} has been deleted successfully.`,
                                  });
                                } else {
                                  throw new Error(data.error || 'Failed to delete cohort');
                                }
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: error instanceof Error ? error.message : "Failed to delete cohort",
                                  variant: "destructive",
                                });
                              }
                            },
                            cohort.name
                          );
                        }}
                          title="Delete Cohort"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white border border-purple-200 rounded-lg shadow-sm">
          <div className="p-4 sm:p-6">
            {filteredAndSortedCohorts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAndSortedCohorts.map((cohort: Cohort) => {
                    // Find the course for this cohort
                    const cohortCourse = courses.find((course: Course) => 
                      course.courseId === cohort.courseId || course.id === cohort.courseId
                    );
                    
                    return (
                      <div 
                        key={cohort.id} 
                        className="border-2 border-orange-400 hover:border-orange-500 rounded-lg p-3 sm:p-4 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => handleViewCohort(cohort)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-purple-700 text-base">{cohort.name}</h4>
                            <p className="text-xs text-gray-500 mt-1">ID: {cohort.id}</p>
                            {cohortCourse && (
                              <p className="text-xs text-blue-600 mt-1 font-medium">
                                Course: {cohortCourse.name}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                cohort.status === 'Active' ? 'bg-green-100 text-green-800' :
                                cohort.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                                cohort.status === 'Upcoming' ? 'bg-yellow-100 text-yellow-800' :
                                cohort.status === 'On Hold' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {cohort.status || 'Active'}
                              </span>
                              {(() => {
                                const course = courses.find(c => c.courseId === cohort.courseId || c.id === cohort.courseId);
                                const isStatusControlled = course?.status === 'Inactive' || course?.status === 'Completed';
                                return isStatusControlled ? (
                                  <span title={`Status controlled by course (${course?.status})`} className="text-blue-500 text-xs">
                                    ??
                                  </span>
                                ) : null;
                              })()}
                            </div>
                            {(cohort.startDate || cohort.endDate) && (
                              <div className="mt-2 text-xs text-gray-600">
                                {cohort.startDate && (
                                  <span>Start: {format(new Date(cohort.startDate), 'dd-MMM-yy')}</span>
                                )}
                                {cohort.startDate && cohort.endDate && <span> � </span>}
                                {cohort.endDate && (
                                  <span>End: {format(new Date(cohort.endDate), 'dd-MMM-yy')}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => { setAddMembersCohortId(cohort.id ?? ''); setSelectedMembers([]); }}
                              title="Add Members"
                            >
                              <span className="text-sm">??+</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-purple-500 hover:text-purple-600"
                              onClick={() => {
                                setNewCohort({
                                  name: cohort.name || '',
                                  id: cohort.id || '',
                                  courseId: cohort.courseId || '',
                                  notes: cohort.notes || '',
                                  status: cohort.status || 'Active',
                                  startDate: cohort.startDate || '',
                                  endDate: cohort.endDate || '',
                                  startTime: cohort.startTime || '',
                                  endTime: cohort.endTime || '',
                                  capacity: cohort.capacity ? String(cohort.capacity) : '',
                                  location: cohort.location || '',
                                  instructorName: cohort.instructorName || ''
                                });
                                // Check if cohort has custom dates different from course
                                const selectedCourse = courses.find(c => c.courseId === cohort.courseId || c.id === cohort.courseId);
                                const hasCustomDates = selectedCourse?.schedulePeriod && (
                                  cohort.startDate !== new Date(selectedCourse.schedulePeriod.startDate).toISOString().split('T')[0] ||
                                  cohort.endDate !== new Date(selectedCourse.schedulePeriod.endDate).toISOString().split('T')[0]
                                );
                                setUseCustomSchedule(!!hasCustomDates);
                                setNewCohortEditId(cohort.id);
                                setIsAddCohortOpen(true);
                              }}
                              title="Edit Cohort"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-900"
                              onClick={() => {
                                showDeleteConfirmation(
                                  "Delete Cohort",
                                  "Are you sure you want to delete this cohort? This will remove all members from the cohort and cannot be undone.",
                                  async () => {
                                    try {
                                      const response = await fetch('/api/dashboard/services/cohorts', {
                                        method: 'DELETE',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ id: cohort.id }),
                                      });

                                      const data = await response.json();
                                      
                                      if (data.success) {
                                        setCohorts(prev => prev.filter(c => c.id !== cohort.id));
                                        toast({
                                          title: "Cohort Deleted",
                                          description: `${cohort.name} has been deleted successfully.`,
                                        });
                                      } else {
                                        throw new Error(data.error || 'Failed to delete cohort');
                                      }
                                    } catch (error) {
                                      toast({
                                        title: "Error",
                                        description: error instanceof Error ? error.message : "Failed to delete cohort",
                                        variant: "destructive",
                                      });
                                    }
                                  },
                                  cohort.name
                                );
                              }}
                              title="Delete Cohort"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {cohort.location && (
                            <div className="flex items-center text-sm">
                              <span className="text-gray-600 w-16 text-xs">Location:</span>
                              <span className="text-purple-600 font-medium">{cohort.location}</span>
                            </div>
                          )}
                          {cohort.instructorName && (
                            <div className="flex items-center text-sm">
                              <span className="text-gray-600 w-16 text-xs">Instructor:</span>
                              <span className="text-purple-700">{cohort.instructorName}</span>
                            </div>
                          )}
                          <div className="flex items-center text-sm">
                            <span className="text-gray-600 w-16 text-xs">Capacity:</span>
                            <span className="text-purple-600 font-medium">
                              {cohort.members.length} / {cohort.capacity}
                              {cohort.members.length === cohort.capacity && 
                                <span className="text-red-500 ml-1 text-xs">(Full)</span>
                              }
                            </span>
                          </div>
                          {cohort.startTime && cohort.endTime && (
                            <div className="flex items-center text-sm">
                              <span className="text-gray-600 w-16 text-xs">Schedule:</span>
                              <span className="text-gray-800">
                                {new Date(`2000-01-01T${cohort.startTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                                {new Date(`2000-01-01T${cohort.endTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {cohort.notes && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600 border-l-2 border-gray-300">
                            <span className="font-medium">Notes: </span>{cohort.notes}
                          </div>
                        )}
                        
                        {cohort.members.length > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-700">Members</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-6 px-2"
                                onClick={() => setSelectedCohortForMembers(cohort)}
                              >
                                View All ({cohort.members.length})
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {cohort.members.slice(0, 3).map((member) => {
                                // Preserve existing valid names
                                const hasValidName = member.name && 
                                  member.name !== member.id && 
                                  !member.name.startsWith('STU') &&
                                  member.name.length > 3 &&
                                  member.name.length < 50 &&
                                  !/^[a-z0-9]{20,}$/.test(member.name);
                                  
                                let displayName = member.name;
                                if (!hasValidName) {
                                  const student = students.find(s => 
                                    s.id === member.id || 
                                    (s as any).studentId === member.id ||
                                    s.id === member.id.replace(/^STU0*/, '')
                                  );
                                  displayName = student?.name || member.name || `Student ${member.id}`;
                                }
                                
                                return (
                                  <span key={member.id} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                                    {displayName}
                                  </span>
                                );
                              })}
                              {cohort.members.length > 3 && (
                                <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded text-xs">
                                  +{cohort.members.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-gray-500">
                No cohorts found matching your criteria
              </div>
            )}
            {filteredAndSortedCohorts.length > 3 && (
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewAllCohorts(true)}
                  className="text-xs sm:text-sm text-purple-600 border-purple-300 hover:bg-purple-50"
                >
                  View All {filteredAndSortedCohorts.length} Cohorts
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
        </CardContent>
      </Card>

      {/* Add Cohort Modal */}
      <Dialog open={isAddCohortOpen} onOpenChange={handleCohortDialogOpenChange}>
        <DialogContent 
          className="max-w-md max-h-[90vh] overflow-hidden flex flex-col w-[95vw] sm:w-full" 
          style={{ padding: '18px 16px' }}
          onInteractOutside={(e) => {
            // Show confirmation dialog when clicking outside
            e.preventDefault();
            handleCohortDialogClose();
          }}
          onEscapeKeyDown={(e) => {
            // Show confirmation dialog when pressing Escape
            e.preventDefault();
            handleCohortDialogClose();
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <DialogTitle className="font-bold text-sm sm:text-base">{newCohortEditId ? 'Edit Cohort' : 'Add New Cohort'}</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 flex-shrink-0"
              onClick={handleCohortDialogClose}
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-2">
            <div className="space-y-0.5">
              <Label className="text-xs">Cohort Name <span style={{ color: 'red' }}>*</span></Label>
              <Input 
                value={newCohort.name} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const newValue = e.target.value;
                  if (newValue === '' || validateCohortName(newValue)) {
                    setNewCohort(c => ({ ...c, name: newValue }));
                    // Clear error when user starts typing
                    if (missingFields.has('name')) {
                      setMissingFields(prev => {
                        const newSet = new Set(prev);
                        newSet.delete('name');
                        return newSet;
                      });
                    }
                  } else {
                    toast({
                      title: "Invalid Cohort Name",
                      description: "Cohort name must start with a letter and can only contain letters, numbers, spaces, hyphens, and underscores.",
                      variant: "destructive",
                    });
                  }
                }} 
                className={`text-xs p-1 h-7 border rounded-sm focus:border-transparent focus:ring-1 focus:outline-none focus:ring-offset-0 ${
                  missingFields.has('name') 
                    ? 'border-red-500 ring-2 ring-red-200 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Enter cohort name (letters, numbers, spaces, -, _ only)"
              />
            <Label className="text-xs">Associated Course <span style={{ color: 'red' }}>*</span></Label>
            <div className="relative">
              <select 
                className={`w-full p-1 border rounded-sm text-xs h-7 pr-8 appearance-none focus:outline-none hover:border-gray-400 hover:bg-gray-50 transition-colors ${
                  missingFields.has('courseId')
                    ? 'border-red-500 ring-2 ring-red-200 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500'
                }`}
                value={newCohort.courseId} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const selectedCourseId = e.target.value;
                  const selectedCourse = courses.find(c => c.courseId === selectedCourseId || c.id === selectedCourseId);
                  
                  // Clear error when user selects
                  if (missingFields.has('courseId')) {
                    setMissingFields(prev => {
                      const newSet = new Set(prev);
                      newSet.delete('courseId');
                      return newSet;
                    });
                  }
                  // Update cohort with course ID and automatically populate dates, instructor, and status
                  setNewCohort(c => {
                    const next = { ...c, courseId: selectedCourseId }
                    if (selectedCourse) {
                      if (!newCohortEditId) {
                        if (inheritanceSettings.inheritScheduleFromCourse && !useCustomSchedule) {
                          next.startDate = selectedCourse.schedulePeriod?.startDate
                            ? new Date(selectedCourse.schedulePeriod.startDate).toISOString().split('T')[0]
                            : next.startDate
                          next.endDate = selectedCourse.schedulePeriod?.endDate
                            ? new Date(selectedCourse.schedulePeriod.endDate).toISOString().split('T')[0]
                            : next.endDate
                        }
                        if (inheritanceSettings.inheritInstructorFromCourse && selectedCourse.instructor) {
                          next.instructorName = selectedCourse.instructor
                        }
                        if (inheritanceSettings.inheritLocationFromCourse && selectedCourse.location) {
                          next.location = selectedCourse.location
                        }
                        if (inheritanceSettings.syncCapacityWithCourse) {
                          const derivedCapacity = Number(selectedCourse.maxStudents) || inheritanceSettings.defaultCapacityFallback
                          if (derivedCapacity) {
                            next.capacity = String(derivedCapacity)
                          }
                        }
                      }
                      next.status = getInheritedCohortStatus(selectedCourse.status) || next.status
                    }
                    return next
                  });


                }}
              >
                <option value="" disabled hidden>Select course</option>
                {courses.map((course: Course) => (
                  <option key={course.id} value={course.courseId || course.id}>
                    {course.name} - {(course.courseId || course.id)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            <Label className="text-xs">Cohort ID <span className="text-gray-500 text-[10px] ml-1">(auto-generated)</span></Label>
            <div className="flex items-center gap-2">
              <Input 
                value={newCohort.id} 
                disabled={!identitySettings.allowManualIds}
                onChange={(event) => {
                  if (!identitySettings.allowManualIds) return
                  const updated = identitySettings.enforceUppercase ? event.target.value.toUpperCase() : event.target.value
                  setCohortIdManuallyEdited(true)
                  setNewCohort(c => ({ ...c, id: updated }))
                }}
                className={`text-xs p-1 h-7 border rounded-sm ${identitySettings.allowManualIds ? 'border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500' : 'border-gray-300 bg-gray-50 cursor-not-allowed'}`}
                title="Cohort ID is automatically generated based on your identity settings"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[11px]"
                onClick={() => {
                  const selectedCourse = courses.find(c => c.courseId === newCohort.courseId || c.id === newCohort.courseId)
                  if (!selectedCourse) return
                  const regenerated = buildNextCohortId(selectedCourse)
                  setCohortIdManuallyEdited(false)
                  setNewCohort(c => ({ ...c, id: regenerated }))
                }}
                disabled={!newCohort.courseId}
              >
                <RefreshCcw className="h-3 w-3 mr-1" />
                Sync
              </Button>
            </div>
            {identitySettings.allowManualIds ? (
              <p className="text-[11px] text-gray-500 mt-1">Override the auto-generated ID to match classroom signage or CRM IDs.</p>
            ) : (
              <p className="text-[11px] text-gray-500 mt-1">ID follows the prefix rule set in Cohort Settings.</p>
            )}

            <Label className="text-xs">
              Instructor Name
              {newCohort.courseId && (() => {
                const selectedCourse = courses.find(c => c.courseId === newCohort.courseId || c.id === newCohort.courseId);
                return selectedCourse?.instructor ? (
                  <span className="text-green-600 ml-1" title={`Default instructor from course: ${selectedCourse.instructor}`}>?????</span>
                ) : null;
              })()}
            </Label>
            <div className="relative">
              <select
                className="w-full p-1 border border-gray-300 rounded-sm text-xs h-7 pr-8 appearance-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none hover:border-gray-400 hover:bg-gray-50 transition-colors"
                value={newCohort.instructorName || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewCohort(c => ({ ...c, instructorName: e.target.value }))}
                disabled={instructorsLoading}
              >
                <option value="" disabled hidden>
                  {instructorsLoading ? 'Loading instructors...' : 
                   (() => {
                     const selectedCourse = courses.find(c => c.courseId === newCohort.courseId || c.id === newCohort.courseId);
                     return selectedCourse?.instructor ? `Use course default: ${selectedCourse.instructor}` : 'Select instructor';
                   })()
                  }
                </option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.name}>
                    {instructor.name} {instructor.instructorId ? `(${instructor.instructorId})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            <Label className="text-xs">
              Status <span style={{ color: 'red' }}>*</span>
              {newCohort.courseId && (() => {
                const selectedCourse = courses.find(c => c.courseId === newCohort.courseId || c.id === newCohort.courseId);
                return selectedCourse?.status ? (
                  <span className="text-blue-600 ml-1" title={`Inherited from course status: ${selectedCourse.status}`}>??</span>
                ) : null;
              })()}
            </Label>
            <div className="relative">
              <select
                className={`w-full p-1 border rounded-sm text-xs h-7 pr-8 appearance-none focus:outline-none hover:border-gray-400 hover:bg-gray-50 transition-colors ${
                  missingFields.has('status')
                    ? 'border-red-500 ring-2 ring-red-200 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500'
                } ${
                  newCohort.courseId && courses.find(c => c.courseId === newCohort.courseId || c.id === newCohort.courseId)?.status === 'Inactive'
                    ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                value={newCohort.status || 'Active'}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const selectedCourse = courses.find(c => c.courseId === newCohort.courseId || c.id === newCohort.courseId);
                  
                  // Clear error when user selects
                  if (missingFields.has('status')) {
                    setMissingFields(prev => {
                      const newSet = new Set(prev);
                      newSet.delete('status');
                      return newSet;
                    });
                  }
                  
                  // Prevent status change if course is inactive
                  if (selectedCourse?.status === 'Inactive' && e.target.value !== 'On Hold') {
                    alert('Cannot set cohort to active status when the associated course is inactive.');
                    return;
                  }
                  setNewCohort(c => ({ ...c, status: e.target.value }));
                }}
                disabled={(() => {
                  const selectedCourse = courses.find(c => c.courseId === newCohort.courseId || c.id === newCohort.courseId);
                  return selectedCourse?.status === 'Inactive' || selectedCourse?.status === 'Completed';
                })()}
              >
                <option value="Active">Active</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="On Hold">On Hold</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              {newCohort.courseId && (() => {
                const selectedCourse = courses.find(c => c.courseId === newCohort.courseId || c.id === newCohort.courseId);
                if (selectedCourse?.status === 'Inactive') {
                  return <div className="text-xs text-orange-600 mt-1">?? Course is inactive - cohort status restricted</div>;
                }
                return null;
              })()}
            </div>

            {/* Custom Schedule Toggle */}
            {newCohort.courseId && (() => {
              const selectedCourse = courses.find(c => c.courseId === newCohort.courseId || c.id === newCohort.courseId);
              return selectedCourse?.schedulePeriod?.startDate ? (
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox 
                      checked={useCustomSchedule}
                      className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                      onCheckedChange={(checked) => {
                        setUseCustomSchedule(!!checked);
                        // If switching to inherit from course, populate the dates
                        if (!checked && selectedCourse?.schedulePeriod) {
                          setNewCohort(c => ({
                            ...c,
                            startDate: selectedCourse.schedulePeriod?.startDate 
                              ? new Date(selectedCourse.schedulePeriod.startDate).toISOString().split('T')[0]
                              : c.startDate,
                            endDate: selectedCourse.schedulePeriod?.endDate 
                              ? new Date(selectedCourse.schedulePeriod.endDate).toISOString().split('T')[0]
                              : c.endDate
                          }));
                        }
                      }}
                    />
                    <Label className="text-xs text-gray-700">Use custom schedule (different from course)</Label>
                  </div>
                </div>
              ) : null;
            })()}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">
                  Start Date
                  {newCohort.courseId && (() => {
                    const selectedCourse = courses.find(c => c.courseId === newCohort.courseId || c.id === newCohort.courseId);
                    return selectedCourse?.schedulePeriod?.startDate && !useCustomSchedule ? (
                      <span className="text-green-600 ml-1" title="Inherited from course schedule">???</span>
                    ) : useCustomSchedule ? (
                      <span className="text-orange-600 ml-1" title="Custom schedule">??</span>
                    ) : null;
                  })()}
                </Label>
                <div className="relative">
                  <Input 
                    type="date" 
                    value={newCohort.startDate || ''} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const startDate = e.target.value;
                      if (newCohort.endDate && startDate && new Date(startDate) >= new Date(newCohort.endDate)) {
                        alert('Start date must be before end date');
                        return;
                      }
                      setNewCohort(c => ({ ...c, startDate }));
                    }} 
                    onFocus={() => setStartDateFocused(true)}
                    onBlur={() => setStartDateFocused(false)}
                    disabled={
                      !useCustomSchedule &&
                      !!newCohort.courseId &&
                      (() => {
                        const selectedCourse = courses.find(c => c.courseId === newCohort.courseId || c.id === newCohort.courseId);
                        return !!selectedCourse?.schedulePeriod?.startDate;
                      })()
                    }
                    className={`text-xs p-1 h-7 border border-gray-300 rounded-sm focus:border-transparent focus:ring-1 focus:ring-blue-500 focus:outline-none focus:ring-offset-0 ${
                      !useCustomSchedule && newCohort.courseId ? 'bg-gray-100 cursor-not-allowed' : ''
                    } ${startDateFocused || !newCohort.startDate ? '' : 'text-transparent'}`}
                    placeholder={
                      newCohort.courseId 
                        ? useCustomSchedule 
                          ? "Select custom start date" 
                          : "Inherited from course"
                        : "Select start date"
                    }
                  />
                  {!startDateFocused && newCohort.startDate && (
                    <div className="absolute inset-0 flex items-center px-1 text-xs pointer-events-none text-gray-900">
                      {formatDateForDisplay(newCohort.startDate)}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-xs">
                  End Date
                  {newCohort.courseId && (() => {
                    const selectedCourse = courses.find(c => c.courseId === newCohort.courseId || c.id === newCohort.courseId);
                    return selectedCourse?.schedulePeriod?.endDate && !useCustomSchedule ? (
                      <span className="text-green-600 ml-1" title="Inherited from course schedule">???</span>
                    ) : useCustomSchedule ? (
                      <span className="text-orange-600 ml-1" title="Custom schedule">??</span>
                    ) : null;
                  })()}
                </Label>
                <div className="relative">
                  <Input 
                    type="date" 
                    value={newCohort.endDate || ''} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const endDate = e.target.value;
                      if (newCohort.startDate && endDate && new Date(endDate) <= new Date(newCohort.startDate)) {
                        alert('End date must be after start date');
                        return;
                      }
                      setNewCohort(c => ({ ...c, endDate }));
                    }} 
                    onFocus={() => setEndDateFocused(true)}
                    onBlur={() => setEndDateFocused(false)}
                    disabled={
                      !useCustomSchedule &&
                      !!newCohort.courseId &&
                      (() => {
                        const selectedCourse = courses.find(c => c.courseId === newCohort.courseId || c.id === newCohort.courseId);
                        return !!selectedCourse?.schedulePeriod?.endDate;
                      })()
                    }
                    className={`text-xs p-1 h-7 border border-gray-300 rounded-sm focus:border-transparent focus:ring-1 focus:ring-blue-500 focus:outline-none focus:ring-offset-0 ${
                      !useCustomSchedule && newCohort.courseId ? 'bg-gray-100 cursor-not-allowed' : ''
                    } ${endDateFocused || !newCohort.endDate ? '' : 'text-transparent'}`}
                    placeholder={
                      newCohort.courseId 
                        ? useCustomSchedule 
                          ? "Select custom end date" 
                          : "Inherited from course"
                        : "Select end date"
                    }
                  />
                  {!endDateFocused && newCohort.endDate && (
                    <div className="absolute inset-0 flex items-center px-1 text-xs pointer-events-none text-gray-900">
                      {formatDateForDisplay(newCohort.endDate)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs">Location <span style={{ color: 'red' }}>*</span></Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshLocations}
                disabled={locationsLoading}
                className="h-5 w-5 p-0 text-gray-500 hover:text-gray-700"
                title="Refresh location list"
              >
                <RotateCcw className={`h-3 w-3 ${locationsLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="mt-1">
                  <Button
                    variant="outline"
                    className={`w-full text-left justify-between text-xs h-7 px-2 hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:outline-none data-[state=open]:ring-2 ${
                      missingFields.has('location')
                        ? 'border-red-500 ring-2 ring-red-200 focus:ring-red-500 focus:border-red-500 data-[state=open]:border-red-500 data-[state=open]:ring-red-500'
                        : 'focus:ring-purple-500 focus:border-purple-500 data-[state=open]:border-purple-500 data-[state=open]:ring-purple-500'
                    }`}
                  >
                    <span className="truncate">{newCohort.location || 'Select location'}</span>
                    <ChevronDown className="ml-2 h-3 w-3 flex-shrink-0" />
                  </Button>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-2 text-xs">
                <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                  <Input
                    placeholder="Search or type new location..."
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={locationSearchTerm}
                    onChange={e => {
                      const value = e.target.value;
                      // Must contain at least 4 alphabets (can have spaces and numbers)
                      const alphabetCount = (value.match(/[a-zA-Z]/g) || []).length;
                      const isValid = /^[a-zA-Z0-9\s]*$/.test(value) && 
                                     (alphabetCount >= 4 || value === '' || /^[a-zA-Z\s]*$/.test(value));
                      
                      if (isValid) {
                        setLocationSearchTerm(value);
                      }
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  {locationsLoading ? (
                    <div className="px-2 py-1 text-gray-500 text-xs">Loading locations...</div>
                  ) : (
                    locationOptions
                      .filter(location => location.toLowerCase().includes(locationSearchTerm.toLowerCase()))
                      .map(location => (
                        <DropdownMenuItem
                          key={location}
                          className={`px-2 py-1 cursor-pointer hover:bg-gray-100 text-xs ${
                            newCohort.location === location ? 'bg-purple-100' : ''
                          }`}
                          onSelect={() => {
                            setNewCohort(c => ({ ...c, location }));
                            setLocationSearchTerm('');
                            // Clear error when user selects
                            if (missingFields.has('location')) {
                              setMissingFields(prev => {
                                const newSet = new Set(prev);
                                newSet.delete('location');
                                return newSet;
                              });
                            }
                          }}
                        >
                          {location}
                        </DropdownMenuItem>
                      ))
                  )}
                  {locationSearchTerm && 
                    !locationOptions.find(
                      location => location.toLowerCase() === locationSearchTerm.toLowerCase()
                    ) && (
                      <DropdownMenuItem
                        className="px-2 py-1 cursor-pointer hover:bg-gray-100 text-purple-600 text-xs font-medium"
                        onSelect={async () => {
                          const newLocation = locationSearchTerm;
                          setNewCohort(c => ({ ...c, location: newLocation }));
                          setLocationSearchTerm('');
                          // Add to database and refresh list
                          await addNewLocation(newLocation);
                        }}
                      >
                        Add "{locationSearchTerm}" as new location
                      </DropdownMenuItem>
                    )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Start Time <span style={{ color: 'red' }}>*</span></Label>
                <Input
                  type="time"
                  value={newCohort.startTime || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const rawTime = e.target.value; // This is in 24-hour format from HTML input
                    
                    // Clear error when user types
                    if (missingFields.has('startTime')) {
                      setMissingFields(prev => {
                        const newSet = new Set(prev);
                        newSet.delete('startTime');
                        return newSet;
                      });
                    }
                    
                    if (!rawTime) {
                      setNewCohort(c => ({ ...c, startTime: '' }));
                      return;
                    }
                    
                    // Validate time format and range
                    if (newCohort.endTime && rawTime >= newCohort.endTime) {
                      alert('Start time must be before end time');
                      return;
                    }
                    
                    // Update state with the 24-hour format time
                    setNewCohort(c => ({ ...c, startTime: rawTime }));
                  }}
                  className={`text-xs p-1 h-7 border rounded-sm focus:border-transparent focus:ring-1 focus:outline-none focus:ring-offset-0 w-full ${
                    missingFields.has('startTime')
                      ? 'border-red-500 ring-2 ring-red-200 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
              </div>
              <div>
                <Label className="text-xs">End Time <span style={{ color: 'red' }}>*</span></Label>
                <Input
                  type="time"
                  value={newCohort.endTime || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const rawTime = e.target.value; // This is in 24-hour format from HTML input
                    
                    // Clear error when user types
                    if (missingFields.has('endTime')) {
                      setMissingFields(prev => {
                        const newSet = new Set(prev);
                        newSet.delete('endTime');
                        return newSet;
                      });
                    }
                    
                    if (!rawTime) {
                      setNewCohort(c => ({ ...c, endTime: '' }));
                      return;
                    }
                    
                    // Validate time format and range
                    if (newCohort.startTime && rawTime <= newCohort.startTime) {
                      alert('End time must be after start time');
                      return;
                    }
                    
                    // Update state with the 24-hour format time
                    setNewCohort(c => ({ ...c, endTime: rawTime }));
                  }}
                  className={`text-xs p-1 h-7 border rounded-sm focus:border-transparent focus:ring-1 focus:outline-none focus:ring-offset-0 w-full ${
                    missingFields.has('endTime')
                      ? 'border-red-500 ring-2 ring-red-200 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
              </div>
              <div>
                <Label className="text-xs">Capacity <span style={{ color: 'red' }}>*</span></Label>
                <Input 
                  type="number" 
                  value={newCohort.capacity || ''} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const newCapacity = Number(e.target.value);
                    
                    // Clear error when user types
                    if (missingFields.has('capacity')) {
                      setMissingFields(prev => {
                        const newSet = new Set(prev);
                        newSet.delete('capacity');
                        return newSet;
                      });
                    }
                    
                    if (newCohortEditId) {
                      const currentCohort = cohorts.find(c => c.id === newCohortEditId);
                      if (currentCohort && currentCohort.members.length > newCapacity) {
                        alert(`Cannot reduce capacity below current member count (${currentCohort.members.length}). Please remove some members first.`);
                        return;
                      }
                    }
                    setNewCohort(c => ({ ...c, capacity: e.target.value }));
                  }} 
                  className={`text-xs p-1 h-7 border rounded-sm focus:border-transparent focus:ring-1 focus:outline-none focus:ring-offset-0 ${
                    missingFields.has('capacity')
                      ? 'border-red-500 ring-2 ring-red-200 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  min="1"
                />
              </div>
            </div>
            
            {/* Days of the Week Selection */}
            <div className="space-y-2">
              <Label className="text-xs">Schedule Days <span style={{ color: 'red' }}>*</span></Label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <label key={day.value} className="flex items-center gap-1 text-xs cursor-pointer">
                    <Checkbox
                      checked={selectedDays.includes(day.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDays(prev => [...prev, day.value].sort())
                        } else {
                          setSelectedDays(prev => prev.filter(d => d !== day.value))
                        }
                      }}
                      className="h-3 w-3 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                    />
                    <span className={`px-2 py-1 rounded text-xs ${
                      selectedDays.includes(day.value) 
                        ? 'bg-purple-100 text-purple-700 font-medium' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {day.label}
                    </span>
                  </label>
                ))}
              </div>
              <div className="text-xs text-gray-500">
                Select the days when this cohort will have sessions
              </div>
            </div>
            
            <Label className="text-xs">Notes</Label>
            <Textarea 
              value={newCohort.notes} 
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                const newValue = e.target.value;
                if (newValue === '' || validateNotes(newValue)) {
                  setNewCohort(c => ({ ...c, notes: newValue }));
                } else {
                  toast({
                    title: "Invalid Notes",
                    description: "Notes can only contain letters, numbers, spaces, and common punctuation marks.",
                    variant: "destructive",
                  });
                }
              }} 
              className="text-xs p-1 min-h-16 max-h-32 border border-gray-300 rounded-sm resize-y focus:border-transparent focus:ring-1 focus:ring-blue-500 focus:outline-none focus:ring-offset-0" 
              placeholder="Add any additional notes about this cohort (letters, numbers, basic punctuation only)..."
            />
            </div>
          </div>
          <div className="flex justify-end mt-4 gap-1 sm:gap-2">
            <Button variant="outline" onClick={handleCohortDialogClose} className="text-xs sm:text-sm">Cancel</Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm"
              disabled={(() => {
                // Check if all mandatory fields are filled
                const isCohortNameValid = newCohort.name && newCohort.name.trim() !== '';
                const isCourseIdValid = newCohort.courseId && newCohort.courseId.trim() !== '';
                const isStatusValid = newCohort.status && newCohort.status.trim() !== '';
                const isLocationValid = newCohort.location && newCohort.location.trim() !== '';
                const isStartTimeValid = newCohort.startTime && newCohort.startTime.trim() !== '';
                const isEndTimeValid = newCohort.endTime && newCohort.endTime.trim() !== '';
                const isCapacityValid = newCohort.capacity && newCohort.capacity.trim() !== '' && Number(newCohort.capacity) > 0;
                
                // Button is disabled if ANY required field is missing
                return !(isCohortNameValid && isCourseIdValid && isStatusValid && isLocationValid && isStartTimeValid && isEndTimeValid && isCapacityValid);
              })()}
              onClick={async () => {
                // Clear previous validation errors
                setMissingFields(new Set());
                
                // Validate mandatory fields
                type RequiredField = {
                  field: keyof typeof newCohort;
                  label: string;
                };

                // For import, Cohort ID is not mandatory
                const required: RequiredField[] = [
                  { field: 'name', label: 'Cohort Name' },
                  { field: 'courseId', label: 'Associated Course' },
                  { field: 'status', label: 'Status' },
                  { field: 'location', label: 'Location' },
                  { field: 'startTime', label: 'Start Time' },
                  { field: 'endTime', label: 'End Time' },
                  { field: 'capacity', label: 'Capacity' }
                ];
                
                const missingFieldsList = required
                  .filter(({ field }) => !newCohort[field] || String(newCohort[field]).trim() === '')
                  .map(({ field, label }) => ({ field, label }));

                if (missingFieldsList.length > 0) {
                  // Set missing fields for highlighting
                  setMissingFields(new Set(missingFieldsList.map(f => f.field)));
                  
                  toast({
                    title: "Missing Required Fields",
                    description: `Please fill in the following mandatory fields: ${missingFieldsList.map(f => f.label).join(', ')}`,
                    variant: "destructive"
                  });
                  return;
                }
                
                // Validate cohort name has at least 4 letters
                const alphabetCount = (newCohort.name?.match(/[a-zA-Z]/g) || []).length;
                if (alphabetCount < 4) {
                  toast({
                    title: "Invalid Cohort Name",
                    description: "Cohort name must start with a letter and contain at least 4 letters",
                    variant: "destructive"
                  });
                  return;
                }
                
                // Validate cohort name starts with a letter
                if (newCohort.name && !/^[a-zA-Z]/.test(newCohort.name)) {
                  toast({
                    title: "Invalid Cohort Name",
                    description: "Cohort name must start with a letter",
                    variant: "destructive"
                  });
                  return;
                }
                
                // Validate location has at least 4 letters
                const locationAlphabetCount = (newCohort.location?.match(/[a-zA-Z]/g) || []).length;
                if (locationAlphabetCount < 4) {
                  toast({
                    title: "Invalid Location",
                    description: "Location must contain at least 4 letters",
                    variant: "destructive"
                  });
                  return;
                }

                // Validate capacity is a positive number
                const newCapacity = Number(newCohort.capacity);
                if (isNaN(newCapacity) || newCapacity <= 0) {
                  toast({
                    title: "Invalid Capacity",
                    description: "Capacity must be a positive number",
                    variant: "destructive"
                  });
                  return;
                }

                // When editing, validate capacity is not less than current member count
                if (newCohortEditId) {
                  const currentCohort = cohorts.find(c => c.id === newCohortEditId);
                  if (currentCohort && currentCohort.members.length > newCapacity) {
                    toast({
                      title: "Invalid Capacity",
                      description: `Cannot reduce capacity below current member count (${currentCohort.members.length}). Please remove some members first.`,
                      variant: "destructive"
                    });
                    return;
                  }
                }

                // Validate at least one day is selected
                if (selectedDays.length === 0) {
                  toast({
                    title: "No Days Selected",
                    description: "Please select at least one day for the cohort schedule",
                    variant: "destructive"
                  });
                  return;
                }
                
                console.log('Selected Days before submission:', selectedDays);

                // Validate end time is after start time
                if (newCohort.startTime && newCohort.endTime) {
                  const start = new Date(`2000-01-01T${newCohort.startTime}`);
                  const end = new Date(`2000-01-01T${newCohort.endTime}`);
                  if (end <= start) {
                    toast({
                      title: "Invalid Time Range",
                      description: "End time must be after start time",
                      variant: "destructive"
                    });
                    return;
                  }
                }

                // Validate end date is after start date
                if (newCohort.startDate && newCohort.endDate) {
                  const startDate = new Date(newCohort.startDate);
                  const endDate = new Date(newCohort.endDate);
                  if (endDate <= startDate) {
                    toast({
                      title: "Invalid Date Range",
                      description: "End date must be after start date",
                      variant: "destructive"
                    });
                    return;
                  }
                }

                // Get the instructor - either manually selected or default from course
                const selectedCourse = courses.find(c => c.courseId === newCohort.courseId || c.id === newCohort.courseId);
                const finalInstructor = newCohort.instructorName || selectedCourse?.instructor || '';
                
                // Validate instructor is available
                if (!finalInstructor) {
                  toast({
                    title: "Instructor Required",
                    description: "Please select an instructor or choose a course that has a default instructor assigned.",
                    variant: "destructive"
                  });
                  return;
                }

                const cohortData = {
                  name: newCohort.name,
                  cohortId: newCohort.id, // Map id to cohortId for backend
                  courseId: newCohort.courseId,
                  startTime: newCohort.startTime || '09:00',
                  endTime: newCohort.endTime || '10:00',
                  daysOfWeek: selectedDays.length > 0 ? selectedDays : [1, 2, 3, 4, 5], // Use selected days or default to Mon-Fri
                  instructor: finalInstructor,
                  location: newCohort.location,
                  maxStudents: Number(newCohort.capacity) || 20,
                  currentStudents: newCohortEditId 
                    ? cohorts.find(c => c.id === newCohortEditId)?.members?.map(m => m.id) || []
                    : [],
                  waitlist: [],
                  status: newCohort.status || 'Active',
                  registrationOpen: true,
                  notes: newCohort.notes || ''
                };
                
                console.log('Cohort data being sent to API:', cohortData);
                
                try {
                  let response;
                  if (newCohortEditId) {
                    // Edit existing cohort
                    response = await fetch('/api/dashboard/services/cohorts', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(cohortData),
                    });
                  } else {
                    // Add new cohort
                    response = await fetch('/api/dashboard/services/cohorts', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(cohortData),
                    });
                  }

                  const result = await response.json();
                  console.log('Cohort API response:', result);

                  if (!response.ok || !result.success) {
                    throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
                  }

                  // Only update frontend state if backend call was successful
                  if (newCohortEditId) {
                    const updatedCohort: Cohort = {
                      id: result.cohort.id || cohortData.cohortId,
                      name: cohortData.name,
                      courseId: cohortData.courseId,
                      notes: cohortData.notes,
                      status: cohortData.status,
                      startDate: newCohort.startDate,
                      endDate: newCohort.endDate,
                      startTime: cohortData.startTime,
                      endTime: cohortData.endTime,
                      capacity: cohortData.maxStudents,
                      members: cohorts.find(c => c.id === newCohortEditId)?.members || [],
                      instructorName: finalInstructor,
                      location: cohortData.location,
                      daysOfWeek: result.cohort.daysOfWeek || cohortData.daysOfWeek
                    };
                    setCohorts(prev => prev.map(c => c.id === newCohortEditId ? updatedCohort : c));
                    toast({
                      title: "Success",
                      description: "Cohort updated successfully!",
                    });
                  } else {
                    const newCohortForState: Cohort = {
                      id: result.cohort.id || cohortData.cohortId,
                      name: cohortData.name,
                      courseId: cohortData.courseId,
                      notes: cohortData.notes,
                      status: cohortData.status,
                      startDate: newCohort.startDate,
                      endDate: newCohort.endDate,
                      startTime: cohortData.startTime,
                      endTime: cohortData.endTime,
                      capacity: cohortData.maxStudents,
                      members: [],
                      instructorName: finalInstructor,
                      location: cohortData.location,
                      daysOfWeek: result.cohort.daysOfWeek || cohortData.daysOfWeek
                    };
                    setCohorts(prev => [...prev, newCohortForState]);
                    toast({
                      title: "Success", 
                      description: "Cohort added successfully!",
                    });
                  }
                } catch (error) {
                  console.error('Error saving cohort:', error);
                  toast({
                    title: "Error",
                    description: error instanceof Error ? error.message : "Failed to save cohort. Please try again.",
                    variant: "destructive",
                  });
                  return; // Don't close dialog on error
                }
                setIsAddCohortOpen(false);
                resetCohortForm();
              }}
            >
              {newCohortEditId ? 'Update' : 'Add'} Cohort
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Members Modal */}
      <Dialog open={!!addMembersCohortId} onOpenChange={() => {}}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full">
          <div className="flex items-center justify-between mb-2">
            <DialogTitle className="font-bold text-sm sm:text-base">Add Members</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setAddMembersCohortId(null)}
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {addMembersCohortId && (() => {
            const cohort = cohorts.find(c => c.id === addMembersCohortId);
      if (!cohort) return null;
        // Map cohort.members to student names for display
        const memberNames = cohort.members.map(member => {
          // Preserve existing valid names, only lookup if name is missing or looks like an ID
          const hasValidName = member.name && 
            member.name !== member.id && 
            !member.name.startsWith('STU') &&
            member.name.length > 3 &&
            member.name.length < 50 &&
            !/^[a-z0-9]{20,}$/.test(member.name);
            
          if (hasValidName) {
            return member.name;
          }
          
          const student = students.find(s => 
            s.id === member.id || 
            (s as any).studentId === member.id ||
            (s as any).mongoId === member.id ||
            s.id === member.id.replace(/^STU0*/, '') ||
            (s as any).studentId === member.id.replace(/^STU0*/, '')
          );
          return student?.name || member.name || `Student ${member.id}`;
        });
                return (
                  <div className="space-y-4">
                    <div>
                      <Label>Search Students</Label>
                      <Input
                        placeholder="Search students..."
                        value={studentSearch}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStudentSearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {studentsLoading ? (
                        <div className="text-gray-500 text-sm">Loading students...</div>
                      ) : (
                        <>
                          <div className="text-sm text-blue-600 mb-2">
                            Available slots: {cohort.capacity - cohort.members.length}
                          </div>
                          {students
                            .filter(student => {
                              // More flexible ID matching for existing members
                              const isAlreadyMember = cohort.members.some(m => 
                                m.id === student.id || 
                                m.id === (student as any).studentId ||
                                m.id === (student as any).mongoId ||
                                (student as any).studentId === m.id ||
                                (student as any).mongoId === m.id
                              );
                              const matchesSearch = studentSearch === '' || 
                                student.name.toLowerCase().includes(studentSearch.toLowerCase());
                              return !isAlreadyMember && matchesSearch;
                            })
                            .map((student, idx) => {
                              const safeId = student.id && student.id !== '' ? student.id : `student-${idx}`;
                              const isDisabled = cohort.members.length + selectedMembers.length >= cohort.capacity && !selectedMembers.includes(safeId);
                              return (
                                <label key={safeId} className={`flex items-center gap-2 ${isDisabled ? 'opacity-50' : ''}`}>
                                  <input
                                    type="checkbox"
                                    checked={selectedMembers.includes(safeId)}
                                    disabled={isDisabled}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      if (e.target.checked) {
                                        if (cohort.members.length + selectedMembers.length < cohort.capacity) {
                                          setSelectedMembers(prev => [...prev, safeId]);
                                        }
                                      } else {
                                        setSelectedMembers(prev => prev.filter(id => id !== safeId));
                                      }
                                    }}
                                  />
                                  <span className="text-sm">{student.name}</span>
                                </label>
                              );
                            })
                          }
                        </>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setAddMembersCohortId(null)}>Cancel</Button>
                      <Button onClick={async () => {
                        const capacity = Number(cohort.capacity) || 0;
                        const currentCount = cohort.members.length;
                        const selectedCount = selectedMembers.length;
                        
                        if (currentCount + selectedCount > capacity) {
                          alert(`Cannot add ${selectedCount} members. This would exceed the cohort capacity of ${capacity}.`);
                          return;
                        }

                        // Add selected members as objects {id, name} to cohort.members
                        const newMembers = [
                          ...cohort.members,
                          ...selectedMembers
                            .filter(id => !cohort.members.some(m => m.id === id))
                            .map(id => {
                              const student = students.find(s => 
                                s.id === id || 
                                (s as any).studentId === id ||
                                (s as any).mongoId === id ||
                                s.id === id.replace(/^STU0*/, '') ||
                                (s as any).studentId === id.replace(/^STU0*/, '')
                              );
                              if (student) {
                                // Use the most appropriate ID for storage (prefer studentId if available)
                                const preferredId = (student as any).studentId || student.id;
                                return { id: preferredId, name: student.name };
                              }
                              return { id, name: `Student ${id}` };
                            })
                        ];
                        const updatedCohort = {
                          ...cohort,
                          id: cohort.id,
                          members: newMembers
                        };
                        await fetch('/api/dashboard/services/cohorts', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(updatedCohort),
                        });
                        setCohorts(prev => prev.map(c => c.id === addMembersCohortId ? updatedCohort : c));
                        setAddMembersCohortId(null);
                        setSelectedMembers([]);
                        setStudentSearch('');
                      }}>
                        Add {selectedMembers.length} Members
                      </Button>
                    </div>
                    {/* Display current members with names */}
                    {memberNames.length > 0 && (
                      <div className="mt-2 text-xs text-gray-700">Current Members: {memberNames.join(', ')}</div>
                    )}
                    {/* Display capacity information */}
                    <div className="mt-2 text-xs text-blue-600">
                      Capacity: {cohort.members.length} / {cohort.capacity} members
                      {cohort.members.length >= cohort.capacity && (
                        <span className="text-red-500 ml-2">(Cohort is full)</span>
                      )}
                    </div>
                  </div>
                );
              })()}
        </DialogContent>
      </Dialog>

      {/* View Members Dialog */}
      <Dialog open={!!selectedCohortForMembers} onOpenChange={() => {}}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full">
          <div className="flex items-center justify-between mb-2">
            <DialogTitle className="font-bold text-sm sm:text-base">
              Members - {selectedCohortForMembers?.name}
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({selectedCohortForMembers?.members.length} / {selectedCohortForMembers?.capacity})
              </span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={refreshStudents}
                title="Refresh Students Data (only use if names are missing)"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setSelectedCohortForMembers(null)}
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            {selectedCohortForMembers?.members.length === 0 ? (
              <div className="text-gray-500 text-sm">No members in this cohort.</div>
            ) : (
              <div className="table-container-with-sticky-header" style={{ maxHeight: '60vh' }}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky-table-header">Name</TableHead>
                      <TableHead className="sticky-table-header">ID</TableHead>
                      <TableHead className="text-right sticky-table-header"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-200">
                    {selectedCohortForMembers?.members.map((member) => {
                      // Preserve existing member name if it looks valid (not just an ID)
                      const hasValidName = member.name && 
                        member.name !== member.id && 
                        !member.name.startsWith('STU') &&
                        member.name.length > 3 &&
                        member.name.length < 50 && // Avoid corrupted long strings
                        !/^[a-z0-9]{20,}$/.test(member.name); // Avoid random hash-like strings
                      
                      let displayName = member.name;
                      
                      // Only look up from students API if we don't have a valid name
                      if (!hasValidName) {
                        const student = students.find(s => 
                          s.id === member.id || 
                          (s as any).studentId === member.id ||
                          s.id === member.id.replace(/^STU0*/, '')
                        );
                        displayName = student?.name || member.name || `Student ${member.id}`;
                      }
                      
                      // Debug logging
                      console.log('Member display debug:', {
                        memberId: member.id,
                        memberName: member.name,
                        hasValidName: hasValidName,
                        displayName: displayName,
                        totalStudents: students.length
                      });
                      
                      return (
                        <TableRow key={member.id}>
                          <TableCell>{displayName}</TableCell>
                          <TableCell className="text-gray-500">{member.id}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-900"
                              onClick={() => {
                                if (!selectedCohortForMembers) return;
                                showDeleteConfirmation(
                                  "Remove Member",
                                  `Are you sure you want to remove ${displayName} from this cohort?`,
                                  async () => {
                                    const updatedCohort = {
                                      ...selectedCohortForMembers,
                                      members: selectedCohortForMembers.members.filter((m) => m.id !== member.id)
                                    };
                                    await fetch('/api/dashboard/services/cohorts', {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify(updatedCohort),
                                    });
                                    setCohorts((prev: Cohort[]) => 
                                      prev.map((c: Cohort) => 
                                        c.id === selectedCohortForMembers.id ? updatedCohort : c
                                      )
                                    );
                                    setSelectedCohortForMembers(updatedCohort);
                                  },
                                  displayName
                                );
                              }}
                              title="Remove Member"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedCohortForMembers(null)}>Close</Button>
              <Button
                onClick={() => {
                  if (selectedCohortForMembers) {
                    setAddMembersCohortId(selectedCohortForMembers.id);
                    setSelectedMembers([]);
                    setSelectedCohortForMembers(null);
                  }
                }}
              >
                Add Members
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View All Cohorts Dialog */}
      <Dialog open={!!viewAllCohortsForCourse} onOpenChange={() => {}}>
        <DialogContent className="max-w-7xl w-[95vw] sm:w-full max-h-[85vh] overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="font-bold">
              All Cohorts - {viewAllCohortsForCourse?.name}
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({cohorts.filter(c => c.courseId === viewAllCohortsForCourse?.courseId).length} cohorts)
              </span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              onClick={() => setViewAllCohortsForCourse(null)}
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {viewAllCohortsForCourse && cohorts
                .filter(c => c.courseId === viewAllCohortsForCourse.courseId)
                .map((cohort: Cohort) => (
                  <div key={cohort.id} className="border-2 border-orange-400 hover:border-orange-500 rounded-lg p-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-purple-700 text-base">{cohort.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">ID: {cohort.id}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            cohort.status === 'Active' ? 'bg-green-100 text-green-800' :
                            cohort.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                            cohort.status === 'Upcoming' ? 'bg-yellow-100 text-yellow-800' :
                            cohort.status === 'On Hold' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {cohort.status || 'Active'}
                          </span>
                          {(() => {
                            const course = courses.find(c => c.courseId === cohort.courseId || c.id === cohort.courseId);
                            const isStatusControlled = course?.status === 'Inactive' || course?.status === 'Completed';
                            return isStatusControlled ? (
                              <span title={`Status controlled by course (${course?.status})`} className="text-blue-500 text-xs">
                                ??
                              </span>
                            ) : null;
                          })()}
                        </div>
                        {(cohort.startDate || cohort.endDate) && (
                          <div className="mt-2 text-xs text-gray-600">
                            {cohort.startDate && (
                              <span>Start: {format(new Date(cohort.startDate), 'dd-MMM-yy')}</span>
                            )}
                            {cohort.startDate && cohort.endDate && <span> � </span>}
                            {cohort.endDate && (
                              <span>End: {format(new Date(cohort.endDate), 'dd-MMM-yy')}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => { 
                            setAddMembersCohortId(cohort.id ?? ''); 
                            setSelectedMembers([]); 
                            setViewAllCohortsForCourse(null);
                          }}
                          title="Add Members"
                        >
                          <span className="text-sm">??+</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-purple-500 hover:text-purple-600"
                          onClick={() => {
                            setNewCohort({
                              name: cohort.name || '',
                              id: cohort.id || '',
                              courseId: cohort.courseId || '',
                              notes: cohort.notes || '',
                              status: cohort.status || 'Active',
                              startDate: cohort.startDate || '',
                              endDate: cohort.endDate || '',
                              startTime: cohort.startTime || '',
                              endTime: cohort.endTime || '',
                              capacity: cohort.capacity ? String(cohort.capacity) : '',
                              location: cohort.location || '',
                              instructorName: cohort.instructorName || ''
                            });
                            // Check if cohort has custom dates different from course
                            const selectedCourse = courses.find(c => c.courseId === cohort.courseId || c.id === cohort.courseId);
                            const hasCustomDates = selectedCourse?.schedulePeriod && (
                              cohort.startDate !== new Date(selectedCourse.schedulePeriod.startDate).toISOString().split('T')[0] ||
                              cohort.endDate !== new Date(selectedCourse.schedulePeriod.endDate).toISOString().split('T')[0]
                            );
                            setUseCustomSchedule(!!hasCustomDates);
                            setNewCohortEditId(cohort.id);
                            setIsAddCohortOpen(true);
                            setViewAllCohortsForCourse(null);
                          }}
                          title="Edit Cohort"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-900"
                          onClick={() => {
                            showDeleteConfirmation(
                              "Delete Cohort",
                              "Are you sure you want to delete this cohort? This will remove all members from the cohort and cannot be undone.",
                              async () => {
                                try {
                                  const response = await fetch('/api/dashboard/services/cohorts', {
                                    method: 'DELETE',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id: cohort.id }),
                                  });

                                  const data = await response.json();
                                  
                                  if (data.success) {
                                    setCohorts(prev => prev.filter(c => c.id !== cohort.id));
                                    setViewAllCohortsForCourse(null);
                                    toast({
                                      title: "Cohort Deleted",
                                      description: `${cohort.name} has been deleted successfully.`,
                                    });
                                  } else {
                                    throw new Error(data.error || 'Failed to delete cohort');
                                  }
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: error instanceof Error ? error.message : "Failed to delete cohort",
                                    variant: "destructive",
                                  });
                                }
                              },
                              cohort.name
                            );
                          }}
                          title="Delete Cohort"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {cohort.location && (
                        <div className="flex items-center text-sm">
                          <span className="text-gray-600 w-16 text-xs">Location:</span>
                          <span className="text-purple-600 font-medium">{cohort.location}</span>
                        </div>
                      )}
                      {cohort.instructorName && (
                        <div className="flex items-center text-sm">
                          <span className="text-gray-600 w-16 text-xs">Instructor:</span>
                          <span className="text-purple-700">{cohort.instructorName}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm">
                        <span className="text-gray-600 w-16 text-xs">Capacity:</span>
                        <span className="text-purple-600 font-medium">
                          {cohort.members.length} / {cohort.capacity}
                          {cohort.members.length === cohort.capacity && 
                            <span className="text-red-500 ml-1 text-xs">(Full)</span>
                          }
                        </span>
                      </div>
                      {cohort.startTime && cohort.endTime && (
                        <div className="flex items-center text-sm">
                          <span className="text-gray-600 w-16 text-xs">Schedule:</span>
                          <span className="text-gray-800">
                            {new Date(`2000-01-01T${cohort.startTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(`2000-01-01T${cohort.endTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {cohort.notes && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600 border-l-2 border-gray-300">
                        <span className="font-medium">Notes: </span>{cohort.notes}
                      </div>
                    )}
                    
                    {cohort.members.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700">Members</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-6 px-2"
                            onClick={() => {
                              setSelectedCohortForMembers(cohort);
                              setViewAllCohortsForCourse(null);
                            }}
                          >
                            View All ({cohort.members.length})
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {cohort.members.slice(0, 3).map((member) => {
                            // Preserve existing valid names
                            const hasValidName = member.name && 
                              member.name !== member.id && 
                              !member.name.startsWith('STU') &&
                              member.name.length > 3 &&
                              member.name.length < 50 &&
                              !/^[a-z0-9]{20,}$/.test(member.name);
                              
                            let displayName = member.name;
                            if (!hasValidName) {
                              const student = students.find(s => 
                                s.id === member.id || 
                                (s as any).studentId === member.id ||
                                s.id === member.id.replace(/^STU0*/, '')
                              );
                              displayName = student?.name || member.name || `Student ${member.id}`;
                            }
                            
                            return (
                              <span key={member.id} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                                {displayName}
                              </span>
                            );
                          })}
                          {cohort.members.length > 3 && (
                            <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded text-xs">
                              +{cohort.members.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setViewAllCohortsForCourse(null)}>Close</Button>
            <Button
              onClick={() => {
                if (viewAllCohortsForCourse) {
                  setNewCohort({ 
                    name: '', 
                    id: '', 
                    courseId: viewAllCohortsForCourse.courseId || viewAllCohortsForCourse.id, 
                    notes: '', 
                    status: 'Active',
                    startDate: '', 
                    endDate: '', 
                    startTime: '', 
                    endTime: '', 
                    capacity: '', 
                    location: '', 
                    instructorName: '' 
                  });
                  setUseCustomSchedule(false); // Reset to inherit from course by default
                  setIsAddCohortOpen(true);
                  setViewAllCohortsForCourse(null);
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Cohort
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View All Cohorts Dialog */}
      <Dialog open={viewAllCohorts} onOpenChange={() => {}}>
        <DialogContent className="max-w-7xl max-h-[85vh] overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="font-bold">
              All Cohorts
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({filteredAndSortedCohorts.length} cohorts)
              </span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              onClick={() => setViewAllCohorts(false)}
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedCohorts.map((cohort: Cohort) => {
                // Find the course for this cohort
                const cohortCourse = courses.find((course: Course) => 
                  course.courseId === cohort.courseId || course.id === cohort.courseId
                );
                
                return (
                  <div key={cohort.id} className="border-2 border-orange-400 hover:border-orange-500 rounded-lg p-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-purple-700 text-base">{cohort.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">ID: {cohort.id}</p>
                        {cohortCourse && (
                          <p className="text-xs text-blue-600 mt-1 font-medium">
                            Course: {cohortCourse.name}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            cohort.status === 'Active' ? 'bg-green-100 text-green-800' :
                            cohort.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                            cohort.status === 'Upcoming' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {cohort.status || 'Active'}
                          </span>
                        </div>
                        {(cohort.startDate || cohort.endDate) && (
                          <div className="mt-2 text-xs text-gray-600">
                            {cohort.startDate && (
                              <span>Start: {format(new Date(cohort.startDate), 'dd-MMM-yy')}</span>
                            )}
                            {cohort.startDate && cohort.endDate && <span> � </span>}
                            {cohort.endDate && (
                              <span>End: {format(new Date(cohort.endDate), 'dd-MMM-yy')}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => { 
                            setAddMembersCohortId(cohort.id ?? ''); 
                            setSelectedMembers([]); 
                            setViewAllCohorts(false);
                          }}
                          title="Add Members"
                        >
                          <span className="text-sm">??+</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-purple-500 hover:text-purple-600"
                          onClick={() => {
                            setNewCohort({
                              name: cohort.name || '',
                              id: cohort.id || '',
                              courseId: cohort.courseId || '',
                              notes: cohort.notes || '',
                              status: cohort.status || 'Active',
                              startDate: cohort.startDate || '',
                              endDate: cohort.endDate || '',
                              startTime: cohort.startTime || '',
                              endTime: cohort.endTime || '',
                              capacity: cohort.capacity ? String(cohort.capacity) : '',
                              location: cohort.location || '',
                              instructorName: cohort.instructorName || ''
                            });
                            // Check if cohort has custom dates different from course
                            const selectedCourse = courses.find(c => c.courseId === cohort.courseId || c.id === cohort.courseId);
                            const hasCustomDates = selectedCourse?.schedulePeriod && (
                              cohort.startDate !== new Date(selectedCourse.schedulePeriod.startDate).toISOString().split('T')[0] ||
                              cohort.endDate !== new Date(selectedCourse.schedulePeriod.endDate).toISOString().split('T')[0]
                            );
                            setUseCustomSchedule(!!hasCustomDates);
                            setNewCohortEditId(cohort.id);
                            setIsAddCohortOpen(true);
                            setViewAllCohorts(false);
                          }}
                          title="Edit Cohort"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-900"
                          onClick={() => {
                            showDeleteConfirmation(
                              "Delete Cohort",
                              "Are you sure you want to delete this cohort? This will remove all members from the cohort and cannot be undone.",
                              async () => {
                                try {
                                  const response = await fetch('/api/dashboard/services/cohorts', {
                                    method: 'DELETE',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id: cohort.id }),
                                  });

                                  const data = await response.json();
                                  
                                  if (data.success) {
                                    setCohorts(prev => prev.filter(c => c.id !== cohort.id));
                                    toast({
                                      title: "Cohort Deleted",
                                      description: `${cohort.name} has been deleted successfully.`,
                                    });
                                  } else {
                                    throw new Error(data.error || 'Failed to delete cohort');
                                  }
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: error instanceof Error ? error.message : "Failed to delete cohort",
                                    variant: "destructive",
                                  });
                                }
                              },
                              cohort.name
                            );
                            setViewAllCohorts(false);
                          }}
                          title="Delete Cohort"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {cohort.location && (
                        <div className="flex items-center text-sm">
                          <span className="text-gray-600 w-16 text-xs">Location:</span>
                          <span className="text-purple-600 font-medium">{cohort.location}</span>
                        </div>
                      )}
                      {cohort.instructorName && (
                        <div className="flex items-center text-sm">
                          <span className="text-gray-600 w-16 text-xs">Instructor:</span>
                          <span className="text-purple-700">{cohort.instructorName}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm">
                        <span className="text-gray-600 w-16 text-xs">Capacity:</span>
                        <span className="text-purple-600 font-medium">
                          {cohort.members.length} / {cohort.capacity}
                          {cohort.members.length === cohort.capacity && 
                            <span className="text-red-500 ml-1 text-xs">(Full)</span>
                          }
                        </span>
                      </div>
                      {cohort.startTime && cohort.endTime && (
                        <div className="flex items-center text-sm">
                          <span className="text-gray-600 w-16 text-xs">Schedule:</span>
                          <span className="text-gray-800">
                            {new Date(`2000-01-01T${cohort.startTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(`2000-01-01T${cohort.endTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {cohort.notes && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600 border-l-2 border-gray-300">
                        <span className="font-medium">Notes: </span>{cohort.notes}
                      </div>
                    )}
                    
                    {cohort.members.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700">Members</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-6 px-2"
                            onClick={() => {
                              setSelectedCohortForMembers(cohort);
                              setViewAllCohorts(false);
                            }}
                          >
                            View All ({cohort.members.length})
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {cohort.members.slice(0, 3).map((member) => {
                            const student = students.find(s => s.id === member.id);
                            const displayName = member.name || student?.name || `Student ${member.id}`;
                            return (
                              <span key={member.id} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                                {displayName}
                              </span>
                            );
                          })}
                          {cohort.members.length > 3 && (
                            <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded text-xs">
                              +{cohort.members.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setViewAllCohorts(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unsaved Cohort Changes Confirmation Dialog */}
      <Dialog open={showCohortUnsavedDialog} onOpenChange={setShowCohortUnsavedDialog}>
        <DialogContent className="max-w-lg w-full p-6 bg-white rounded-lg shadow-xl border">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {newCohortEditId ? 'Close Cohort Editor' : 'Unsaved Changes'}
            </DialogTitle>
            <DialogDescription>
              {newCohortEditId 
                ? 'Are you sure you want to close the cohort editor? Any unsaved changes will be lost.'
                : 'You have unsaved changes in your cohort. What would you like to do?'
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowCohortUnsavedDialog(false)}
              className="px-4 py-2"
            >
              Continue Editing
            </Button>
            <Button
              variant="destructive"
              onClick={handleDiscardCohortChanges}
              className="px-4 py-2"
            >
              {newCohortEditId ? 'Close Without Saving' : 'Discard Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Column Selection Modal */}
      <ColumnSelectorModal
        open={columnManagement.isColumnSelectionOpen}
        columns={columnManagement.allColumnIds}
        displayedColumns={columnManagement.displayedColumns}
        setDisplayedColumns={columnManagement.setDisplayedColumns}
        onClose={columnManagement.closeColumnSelector}
        onSave={columnManagement.onSaveColumns}
        onReset={columnManagement.onResetColumns}
        storageKeyPrefix={columnManagement.storageKeyPrefix}
        getColumnLabel={columnManagement.getColumnLabel}
        includeActionsColumn={false}
        requiredColumns={['cohortId', 'name']}
      />

      {/* View Cohort Dialog */}
      <Dialog open={isViewCohortDialogOpen} onOpenChange={setIsViewCohortDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Cohort Details</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              onClick={() => setIsViewCohortDialogOpen(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogHeader>
          {selectedCohortForView && (
            <div className="space-y-4">
              <div className="border-b pb-3">
                <h3 className="font-semibold text-lg">{selectedCohortForView.name}</h3>
                <p className="text-gray-600">ID: {selectedCohortForView.id}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Course: {courses.find(c => c.courseId === selectedCohortForView.courseId || c.id === selectedCohortForView.courseId)?.name || 'Unknown Course'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                <div>
                  <h4 className="font-semibold mb-2">Basic Information</h4>
                  <dl className="grid grid-cols-[100px_1fr] gap-y-1 text-sm">
                    <dt className="text-gray-500">Status:</dt>
                    <dd>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedCohortForView.status === 'Active' ? 'bg-green-100 text-green-800' :
                        selectedCohortForView.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                        selectedCohortForView.status === 'Upcoming' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedCohortForView.status || 'Active'}
                      </span>
                    </dd>
                    <dt className="text-gray-500">Instructor:</dt>
                    <dd>{selectedCohortForView.instructorName || 'Not assigned'}</dd>
                    <dt className="text-gray-500">Location:</dt>
                    <dd>{selectedCohortForView.location || 'Not specified'}</dd>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Capacity & Enrollment</h4>
                  <dl className="grid grid-cols-[120px_1fr] gap-y-1 text-sm">
                    <dt className="text-gray-500">Capacity:</dt>
                    <dd>{selectedCohortForView.capacity || 'Not set'}</dd>
                    <dt className="text-gray-500">Enrolled:</dt>
                    <dd className="text-green-600 font-semibold">{selectedCohortForView.members.length} students</dd>
                    <dt className="text-gray-500">Available:</dt>
                    <dd>{selectedCohortForView.capacity ? selectedCohortForView.capacity - selectedCohortForView.members.length : 'N/A'} spots</dd>
                  </dl>
                </div>
              </div>

              <div className="border-t pt-3">
                <h4 className="font-semibold mb-2">Schedule</h4>
                <div className="grid grid-cols-2 gap-x-6 text-sm">
                  <div>
                    <span className="text-gray-500">Period:</span>
                    <div className="mt-1">
                      {selectedCohortForView.startDate && selectedCohortForView.endDate ? (
                        <div className="space-y-0.5">
                          <div>Start: {format(new Date(selectedCohortForView.startDate), 'dd-MMM-yy')}</div>
                          <div>End: {format(new Date(selectedCohortForView.endDate), 'dd-MMM-yy')}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Time:</span>
                    <div className="mt-1">
                      {selectedCohortForView.startTime && selectedCohortForView.endTime ? (
                        <div>{selectedCohortForView.startTime} - {selectedCohortForView.endTime}</div>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {selectedCohortForView.notes && (
                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-sm text-gray-600">{selectedCohortForView.notes}</p>
                </div>
              )}

              <div className="border-t pt-3">
                <h4 className="font-semibold mb-2">Students ({selectedCohortForView.members.length})</h4>
                <div className="mt-2 max-h-32 overflow-y-auto">
                  {selectedCohortForView.members.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedCohortForView.members.map((member) => (
                        <span key={member.id} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                          {member.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No students enrolled</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
