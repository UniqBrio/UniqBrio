"use client"

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog";
import { Button } from "@/components/dashboard/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip";
import { Save, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select";
import { useToast } from "@/hooks/dashboard/use-toast";
import UnsavedChangesDialog from "@/components/dashboard/common/unsaved-changes-dialog";
import { FormattedDateInput } from "@/components/dashboard/common/formatted-date-input";

// Helper function to compare times in HH:mm format
function isTimeAfter(time1: string, time2: string): boolean {
  if (!time1 || !time2) return false;
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  return (h1 * 60 + m1) > (h2 * 60 + m2);
}

// Helper function to convert 24-hour to 12-hour format
function to12HourFormat(time24: string): { time: string; period: string } {
  if (!time24) return { time: '', period: 'AM' };
  const [hours, minutes = '00'] = time24.split(':');
  if (!hours || !minutes) return { time: '', period: 'AM' };
  
  let h = parseInt(hours);
  const period = h >= 12 ? 'PM' : 'AM';
  h = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { time: `${h}:${minutes.padStart(2, '0')}`, period };
}

// Helper function to convert 12-hour to 24-hour format
function to24HourFormat(time12: string, period: string): string {
  if (!time12) return '';
  const [hours, minutes = '00'] = time12.split(':');
  if (!hours || !minutes) return '';
  
  let h = parseInt(hours);
  if (isNaN(h)) return '';
  
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

// Streamlined time input component matching the design
interface TimeInput12HourProps {
  value?: string; // 24-hour format (HH:mm)
  onChange: (value: string) => void; // Returns 24-hour format
  placeholder?: string;
  isInvalid?: boolean;
}

function TimeInput12Hour({ value = '', onChange, placeholder = "Select time", isInvalid = false }: TimeInput12HourProps) {
  const { time: time12, period: currentPeriod } = to12HourFormat(value);
  const [timeInput, setTimeInput] = useState(time12 || '');
  const [period, setPeriod] = useState<'AM' | 'PM'>(currentPeriod as 'AM' | 'PM');
  const [localInvalidMessage, setLocalInvalidMessage] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const timePickerRef = useRef<HTMLDivElement>(null);

  // Update local state when value prop changes
  useEffect(() => {
    const { time: newTime12, period: newPeriod } = to12HourFormat(value);
    setTimeInput(newTime12 || '');
    setPeriod(newPeriod as 'AM' | 'PM');
  }, [value]);

  // Handle click outside to close time picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timePickerRef.current && !timePickerRef.current.contains(event.target as Node)) {
        setShowTimePicker(false);
      }
    };

    if (showTimePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTimePicker]);

  const handleTimeInputChange = (inputValue: string) => {
    // Masked input: extract up to 4 digits and render as HH:MM with '-' placeholders
    const digitsOnly = inputValue.replace(/\D/g, '').slice(0, 4);

    const padDigits = (d: string) => d.padEnd(4, '-');
    const padded = padDigits(digitsOnly);
    const hoursPart = padded.substring(0, 2);
    const minutesPart = padded.substring(2, 4);
    const formatted = `${hoursPart}:${minutesPart}`;

    setTimeInput(formatted);

    // If we have 4 digits, validate and notify parent with 24-hour format
    if (digitsOnly.length === 4) {
      const hours = parseInt(digitsOnly.substring(0, 2), 10);
      const minutes = parseInt(digitsOnly.substring(2, 4), 10);
      if (!isNaN(hours) && !isNaN(minutes) && hours >= 1 && hours <= 12 && minutes >= 0 && minutes <= 59) {
        onChange(to24HourFormat(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`, period));
      }
    }
  };

  // Handle keydown for Backspace/Delete to remove last entered digit
  const handleTimeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      // derive current digits
      const currentDigits = (timeInput || '').replace(/\D/g, '');
      const newDigits = currentDigits.slice(0, -1);
      const padDigits = (d: string) => d.padEnd(4, '-');
      const padded = padDigits(newDigits).slice(0, 4);
      const hoursPart = padded.substring(0, 2);
      const minutesPart = padded.substring(2, 4);
      setTimeInput(`${hoursPart}:${minutesPart}`);
      return;
    }

    // Allow digits, colon, Enter and navigation keys
    if (/^[0-9:]$/.test(e.key) || e.key.startsWith('Arrow') || e.key === 'Tab' || e.key === 'Enter' || e.key === 'Home' || e.key === 'End') {
      return;
    }

    // Prevent other characters
    e.preventDefault();
  };

  const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
    setPeriod(newPeriod);
    if (timeInput && timeInput !== '--:--') {
      const time24 = to24HourFormat(timeInput, newPeriod);
      onChange(time24);
    }
  };

  const handleTimePickerSelect = (selectedTime: string) => {
    onChange(selectedTime);
    setShowTimePicker(false);
  };

  return (
    <div className="flex gap-2">
      {/* Time Input Field */}
      <div className="flex-1 relative">
        <input
          type="text"
          value={timeInput}
          onChange={(e) => handleTimeInputChange(e.target.value)}
          onKeyDown={handleTimeInputKeyDown}
          placeholder="--:--"
          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
            isInvalid ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          maxLength={5}
        />
        
        {/* Clock Icon */}
        <button
          type="button"
          onClick={() => setShowTimePicker(!showTimePicker)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
        </button>

        {localInvalidMessage && (
          <p className="mt-1 text-xs text-red-500">{localInvalidMessage}</p>
        )}

        {/* Time Picker Dropdown */}
        {showTimePicker && (
          <div ref={timePickerRef} className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-50 p-2 w-48">
            
            
            {/* Time Selector Grid */}
            <div className="grid grid-cols-2 gap-1">
              {/* Hours */}
              <div>
                <div className="max-h-32 overflow-y-auto border rounded-md">
                  {Array.from({ length: 12 }, (_, i) => {
                    const hour = i + 1;
                    const currentHour = timeInput ? parseInt(timeInput.split(':')[0]) : 0;
                    const isSelected = currentHour === hour || (currentHour === 0 && hour === 12);
                    
                    return (
                      <button
                        key={hour}
                        type="button"
                        className={`w-full px-1 py-2 text-sm hover:bg-blue-50 transition-colors ${
                          isSelected ? 'bg-blue-500 text-white' : 'text-gray-700'
                        }`}
                        onClick={() => {
                          const currentMinute = timeInput ? timeInput.split(':')[1] : '00';
                          const newTime = `${hour}:${currentMinute}`;
                          setTimeInput(newTime);
                          const time24 = to24HourFormat(newTime, period);
                          onChange(time24);
                        }}
                      >
                        {hour.toString().padStart(2, '0')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Minutes */}
              <div>
                <div className="max-h-32 overflow-y-auto border rounded-md">
                  {Array.from({ length: 60 }, (_, i) => {
                    const minute = i;
                    const currentMinute = timeInput ? parseInt(timeInput.split(':')[1] || '0') : 0;
                    const isSelected = currentMinute === minute;
                    
                    return (
                      <button
                        key={minute}
                        type="button"
                        className={`w-full px-1 py-2 text-sm hover:bg-blue-50 transition-colors ${
                          isSelected ? 'bg-blue-500 text-white' : 'text-gray-700'
                        }`}
                        onClick={() => {
                          const currentHour = timeInput ? timeInput.split(':')[0] : '1';
                          const newTime = `${currentHour}:${minute.toString().padStart(2, '0')}`;
                          setTimeInput(newTime);
                          const time24 = to24HourFormat(newTime, period);
                          onChange(time24);
                        }}
                      >
                        {minute.toString().padStart(2, '0')}
                      </button>
                    );
                  })}
                </div>
              </div>

             
            </div>

           
            
          </div>
        )}
      </div>

      {/* AM/PM Dropdown */}
      <select
        value={period}
        onChange={(e) => handlePeriodChange(e.target.value as 'AM' | 'PM')}
        className={`px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white transition ${
          isInvalid ? 'border-red-300 bg-red-50' : 'border-gray-300'
        }`}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

// Unified attendance record type (mirrors search filters + table expectations)
export interface StudentAttendanceRecord {
  id: number;
  studentId: string;
  studentName: string;
  cohortId?: string;
  cohortName?: string;
  cohortInstructor?: string;
  cohortTiming?: string;
  courseId?: string;
  courseName?: string;
  date: string; // ISO yyyy-mm-dd
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  status: 'present' | 'absent' | string;
  notes?: string;
  savedAt?: string; // timestamp for drafts
}

interface AddAttendanceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingRecord?: StudentAttendanceRecord | null;
  editingDraftId?: number | null;
  editingDraft?: Partial<StudentAttendanceRecord> | null;
  attendanceData: StudentAttendanceRecord[];
  onSaveAttendance: (record: Partial<StudentAttendanceRecord>) => void;
  onSaveDraft: (record: Partial<StudentAttendanceRecord>) => void;
}

export function AddAttendanceDialog({
  isOpen,
  onOpenChange,
  editingRecord = null,
  editingDraftId = null,
  editingDraft = null,
  attendanceData,
  onSaveAttendance,
  onSaveDraft
}: AddAttendanceDialogProps) {
  const { toast } = useToast();
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const pendingCloseRef = useRef<null | (() => void)>(null);
  // Keep popovers inside dialog to preserve wheel/touch scroll
  const dialogContentRef = useRef<HTMLDivElement | null>(null);

  // Form state
  const [newStudentId, setNewStudentId] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0,10));
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newStatus, setNewStatus] = useState("present");
  const [newNotes, setNewNotes] = useState("");
  const [startAutoFilled, setStartAutoFilled] = useState(false);
  const [endAutoFilled, setEndAutoFilled] = useState(false);
  
  // Date constraints: allow only today and up to 14 days in the past; no future dates
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const minDateIso = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().slice(0, 10);
  }, []);
  const [dateError, setDateError] = useState("");
  
  // Cohort/instructor auto-populated fields
  const [newCohortName, setNewCohortName] = useState("");
  const [newCohortInstructor, setNewCohortInstructor] = useState("");
  const [newCohortTiming, setNewCohortTiming] = useState("");
  
  // Student search state
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
  const [studentQuery, setStudentQuery] = useState("");
  const [studentsList, setStudentsList] = useState<{ id: string; name: string; cohortName?: string; instructor?: string; timing?: string }[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [cohortResolvedFor, setCohortResolvedFor] = useState<string>("");
  const [cohortResolving, setCohortResolving] = useState(false);

  // Track initial snapshot to detect dirty state
  const initialSnapshotRef = useRef({
    studentId: "",
    date: new Date().toISOString().slice(0,10),
    start: "",
    end: "",
    status: "present",
    notes: "",
    cohortName: "",
    cohortInstructor: "",
    cohortTiming: "",
  });

  const isDirty = useMemo(() => {
    const s = initialSnapshotRef.current;
    return (
      (newStudentId || "") !== (s.studentId || "") ||
      (newDate || "") !== (s.date || "") ||
      (newStart || "") !== (s.start || "") ||
      (newEnd || "") !== (s.end || "") ||
      (newStatus || "") !== (s.status || "") ||
      (newNotes || "") !== (s.notes || "") ||
      (newCohortName || "") !== (s.cohortName || "") ||
      (newCohortInstructor || "") !== (s.cohortInstructor || "") ||
      (newCohortTiming || "") !== (s.cohortTiming || "")
    );
  }, [newStudentId, newDate, newStart, newEnd, newStatus, newNotes, newCohortName, newCohortInstructor, newCohortTiming]);

  // Detect potential duplicate records (only for new records, not when editing)
  const potentialDuplicate = useMemo(() => {
    if (editingRecord || !newStudentId || !newDate) return null;
    
    return attendanceData.find(
      record => record.studentId === newStudentId && record.date === newDate
    );
  }, [attendanceData, newStudentId, newDate, editingRecord]);

  function resetFormToInitial() {
    setNewStudentId("");
    setNewStart("");
    setNewEnd("");
    setNewStatus("present");
    setNewNotes("");
    setNewCohortName("");
    setNewCohortInstructor("");
    setNewCohortTiming("");
    setStartAutoFilled(false);
    setEndAutoFilled(false);
  }

  // Load non-instructors when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      setStudentsLoading(true);

      try {
        const res = await fetch('/api/dashboard/staff/non-instructor/non-instructors');
        if (res.ok) {
          const json = await res.json();
          // Support multiple API shapes: [], { data: [] }, { items: [] }, { result: [] }
          const arr = Array.isArray(json)
            ? json
            : Array.isArray((json || {}).data)
              ? (json as any).data
              : Array.isArray((json || {}).items)
                ? (json as any).items
                : Array.isArray((json || {}).result)
                  ? (json as any).result
                  : [];

          if (!cancelled) {
            if (Array.isArray(arr) && arr.length > 0) {
              const mapped = arr.map((s: any) => {
              const id = s.externalId || s.id || s._id || s.instructorId || s.studentId || s.code;
              const name = s.name || [s.firstName, s.middleName, s.lastName].filter(Boolean).join(" ") || s.fullName || id;
              return {
                id,
                name,
                cohortName: s.cohortId || s.cohort || '',
                instructor: s.instructor || undefined,
                timing: s.timing || undefined,
              };
              });
              setStudentsList(mapped.filter(s => s.id));
            } else {
              // Fallback to current attendance dataset unique non-instructors
              const unique: Record<string, string> = {};
              attendanceData.forEach(r => { if (!unique[r.studentId]) unique[r.studentId] = r.studentName; });
              setStudentsList(Object.entries(unique).map(([id, name]) => ({ id, name })));
            }
          }
        } else if (!cancelled) {
          // fallback to current attendance dataset unique non-instructors
          const unique: Record<string, string> = {};
          attendanceData.forEach(r => { if (!unique[r.studentId]) unique[r.studentId] = r.studentName; });
          setStudentsList(Object.entries(unique).map(([id, name]) => ({ id, name })));
        }
      } catch {
        if (!cancelled) {
          const unique: Record<string, string> = {};
          attendanceData.forEach(r => { if (!unique[r.studentId]) unique[r.studentId] = r.studentName; });
          setStudentsList(Object.entries(unique).map(([id, name]) => ({ id, name })));
        }
      } finally {
        if (!cancelled) setStudentsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, attendanceData]);

  // Timing parser: supports formats like "5:00 PM - 7:00 PM" or "17:00 - 19:00" or "9:00-11:00 AM"
  function normalizeToHHmm(input?: string, fallbackMeridiem?: string): string | undefined {
    if (!input) return undefined;
    const s = input.trim();
    const m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (!m) return undefined;
    let h = parseInt(m[1] || '0', 10);
    const mm = parseInt(m[2] || '0', 10);
    const mer = (m[3] || fallbackMeridiem || '').toUpperCase();
    if (mer === 'PM' && h !== 12) h += 12;
    if (mer === 'AM' && h === 12) h = 0;
    // If no meridiem provided at all, assume 24h input as-is
    return `${String(h).padStart(2,'0')}:${String(isNaN(mm)?0:mm).padStart(2,'0')}`;
  }

  function parseTimingToStartEnd(timing?: string): { start?: string; end?: string } {
    if (!timing) return {};
    const parts = timing.split('-');
    if (parts.length < 2) return {};
    const left = parts[0].trim();
    const right = parts.slice(1).join('-').trim();
    // Extract possible meridiem from right side if only present there
    const rightMerMatch = right.match(/(AM|PM)\s*$/i);
    const rightMer = rightMerMatch ? rightMerMatch[1].toUpperCase() : undefined;
    // Clean meridiem text from right before parsing
    const rightClean = right.replace(/(AM|PM)\s*$/i, '').trim();
    const start = normalizeToHHmm(left, rightMer);
    const end = normalizeToHHmm(rightClean, rightMer);
    return { start, end };
  }

  // When cohort timing is known locally, auto-fill start/end (without overriding user input)
  useEffect(() => {
    if (!newCohortTiming) return;
    const { start, end } = parseTimingToStartEnd(newCohortTiming);
    if (start && !newStart) { setNewStart(start); setStartAutoFilled(true); }
    if (end && !newEnd) { setNewEnd(end); setEndAutoFilled(true); }
  }, [newCohortTiming, newStart, newEnd]);

  // If timing not known from existing records, fetch /api/cohorts and resolve by cohort id (newCohortName)
  useEffect(() => {
    const cohortId = newCohortName?.trim();
    if (!cohortId) return;
    // Avoid re-fetching the same cohort repeatedly within an open modal session
    if (cohortResolvedFor === cohortId) return;
    if (newCohortTiming && newCohortTiming.trim()) return; // already have timing locally
    let cancelled = false;
    (async () => {
      try {
        setCohortResolving(true);
        const res = await fetch('/api/dashboard/staff/instructor/cohorts');
        if (!res.ok) return;
        const cohorts = await res.json();
        if (cancelled || !Array.isArray(cohorts)) return;
        const match = cohorts.find((c: any) => (c.id || c.cohortId) === cohortId);
        if (match) {
          const timing: string = match.timing || '';
          const instructor: string = match.instructor || '';
          if (!newCohortInstructor && instructor) setNewCohortInstructor(instructor);
          if (timing) {
            setNewCohortTiming(timing);
            const { start, end } = parseTimingToStartEnd(timing);
            if (start && !newStart) { setNewStart(start); setStartAutoFilled(true); }
            if (end && !newEnd) { setNewEnd(end); setEndAutoFilled(true); }
          }
          setCohortResolvedFor(cohortId);
        }
      } catch {
        // silent fail
      } finally {
        if (!cancelled) setCohortResolving(false);
      }
    })();
    return () => { cancelled = true; };
  }, [newCohortName, newCohortTiming, newCohortInstructor, newStart, newEnd, cohortResolvedFor]);

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return studentsList;
    return studentsList.filter(s =>
      s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    );
  }, [studentsList, studentQuery]);

  // Initialize form when editing record or draft
  useEffect(() => {
    if (isOpen) {
      const dataToLoad = editingRecord || editingDraft;
      if (dataToLoad) {
        setNewStudentId(dataToLoad.studentId || '');
        setNewDate(dataToLoad.date || new Date().toISOString().slice(0,10));
        setNewStart(dataToLoad.startTime || '');
        setNewEnd(dataToLoad.endTime || '');
        setNewStatus(dataToLoad.status || 'present');
        setNewNotes(dataToLoad.notes || '');
        setNewCohortName(dataToLoad.cohortName || '');
        setNewCohortInstructor(dataToLoad.cohortInstructor || '');
        setNewCohortTiming(dataToLoad.cohortTiming || '');
        
        // set initial snapshot for edit mode
        initialSnapshotRef.current = {
          studentId: dataToLoad.studentId || "",
          date: dataToLoad.date || new Date().toISOString().slice(0,10),
          start: dataToLoad.startTime || "",
          end: dataToLoad.endTime || "",
          status: dataToLoad.status || "present",
          notes: dataToLoad.notes || "",
          cohortName: dataToLoad.cohortName || "",
          cohortInstructor: dataToLoad.cohortInstructor || "",
          cohortTiming: dataToLoad.cohortTiming || "",
        };

        if (!dataToLoad.startTime || !dataToLoad.endTime) {
          const { start, end } = parseTimingToStartEnd(dataToLoad.cohortTiming || '');
          if (!dataToLoad.startTime && start) { setNewStart(start); setStartAutoFilled(true); }
          if (!dataToLoad.endTime && end) { setNewEnd(end); setEndAutoFilled(true); }
        } else {
          setStartAutoFilled(false);
          setEndAutoFilled(false);
        }
      } else {
        // Reset for new record
        resetFormToInitial();
        setNewDate(new Date().toISOString().slice(0,10));
        initialSnapshotRef.current = {
          studentId: "",
          date: new Date().toISOString().slice(0,10),
          start: "",
          end: "",
          status: "present",
          notes: "",
          cohortName: "",
          cohortInstructor: "",
          cohortTiming: "",
        };
      }
      
      // Reset cohort resolution tracking for fresh data
      setCohortResolvedFor('');
    }
  }, [editingRecord, editingDraft, isOpen]);

  const handleSaveAttendance = () => {
    if (!newStudentId) {
      onOpenChange(false);
      return;
    }

    // Check for duplicate records (only for new records, not when editing)
    if (!editingRecord) {
      const existingRecord = attendanceData.find(
        record => record.studentId === newStudentId && record.date === newDate
      );
      
      if (existingRecord) {
        toast({
          title: 'Duplicate Record',
          description: `Attendance record already exists for ${newStudentId} on ${newDate}. Please edit the existing record or choose a different date.`,
          variant: 'destructive'
        });
        return;
      }
    }

    const recordData = {
      studentId: newStudentId,
      studentName: studentsList.find(s => s.id === newStudentId)?.name || 
                   attendanceData.find(r => r.studentId === newStudentId)?.studentName || 
                   newStudentId,
      cohortName: newCohortName,
      cohortInstructor: newCohortInstructor,
      cohortTiming: newCohortTiming,
      date: newDate,
      startTime: newStart || undefined,
      endTime: newEnd || undefined,
      status: newStatus,
      notes: newNotes || undefined,
    };

    onSaveAttendance(recordData);
    
    // Reset & close
    resetFormToInitial();
    onOpenChange(false);
    
    // Reset initial snapshot
    initialSnapshotRef.current = {
      studentId: "",
      date: new Date().toISOString().slice(0,10),
      start: "",
      end: "",
      status: "present",
      notes: "",
      cohortName: "",
      cohortInstructor: "",
      cohortTiming: "",
    };

    const actionType = editingRecord ? 'updated' : 'added';
    toast({
      title: editingRecord ? 'Changes Saved' : 'Attendance Added',
      description: `Attendance ${actionType} for ${newStudentId}.`,
    });
  };

  const handleSaveDraft = () => {
    const recordData = {
      id: editingDraftId ?? Date.now(),
      studentId: newStudentId || '-',
      studentName: studentsList.find(s => s.id === newStudentId)?.name || 
                   attendanceData.find(r => r.studentId === newStudentId)?.studentName || 
                   (newStudentId || '-'),
      cohortName: newCohortName || undefined,
      cohortInstructor: newCohortInstructor || undefined,
      cohortTiming: newCohortTiming || undefined,
      date: newDate,
      startTime: newStart || undefined,
      endTime: newEnd || undefined,
      status: newStatus,
      notes: newNotes || undefined,
      savedAt: new Date().toISOString(),
    };

    onSaveDraft(recordData);
    
    // Close modal
    onOpenChange(false);
    
    // Toast success
    const labelName = recordData.studentName || recordData.studentId || 'Untitled Attendance';
    toast({
      title: editingDraftId != null ? 'Draft Updated' : 'Draft Saved',
      description: editingDraftId != null
        ? `Attendance draft "${labelName}" has been updated.`
        : `Attendance draft "${labelName}" has been saved successfully.`,
    });
    
    // reset state after saving draft
    resetFormToInitial();
    initialSnapshotRef.current = {
      studentId: "",
      date: new Date().toISOString().slice(0,10),
      start: "",
      end: "",
      status: "present",
      notes: "",
      cohortName: "",
      cohortInstructor: "",
      cohortTiming: "",
    };
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (isDirty) {
        // prevent immediate close; show unsaved dialog
        setUnsavedOpen(true);
        pendingCloseRef.current = () => {
          onOpenChange(false);
        };
        return; // do not close yet
      }
    }
    onOpenChange(open);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl" ref={dialogContentRef}>
          <DialogHeader>
            <div className="flex items-start justify-between w-full">
              <DialogTitle>{editingRecord ? 'Edit Attendance' : 'Add Non-Instructor Attendance'}</DialogTitle>
              <div className="flex items-start gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1 mr-10 border border-purple-300/70 bg-white text-purple-600 hover:bg-purple-50 hover:text-purple-700 shadow-sm font-medium pl-2 pr-3"
                  onClick={handleSaveDraft}
                  title={editingDraftId != null ? "Update Draft" : "Save Draft"}
                >
                  <Save className="w-4 h-4" />
                  <span className="text-sm">{editingDraftId != null ? 'Update Draft' : 'Save Draft'}</span>
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Non-Instructor <span className="text-red-500">*</span></label>
                  <Popover open={studentSearchOpen} onOpenChange={(o) => { setStudentSearchOpen(o); if (o) setStudentQuery(""); }}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full p-2 border rounded-md flex items-center justify-between text-left hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                        aria-haspopup="listbox"
                        aria-expanded={studentSearchOpen}
                      >
                        <span className="truncate">
                          {newStudentId ? `${newStudentId} - ${(studentsList.find(s => s.id === newStudentId)?.name) || ''}` : 'Select Non-Instructor'}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-60" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[340px] p-2" align="start" sideOffset={4} container={dialogContentRef.current}>
                      <div className="flex flex-col gap-2">
                        <input
                          autoFocus
                          value={studentQuery}
                          onChange={(e) => setStudentQuery(e.target.value)}
                          placeholder={studentsLoading ? 'Loading non-instructors...' : 'Search non-instructors...'}
                          disabled={studentsLoading}
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus:border-purple-500 transition"
                        />
                        <div className="max-h-[200px] overflow-y-auto text-sm pr-1 touch-pan-y" data-remove-scroll-allow>
                          {studentsLoading && <div className="text-xs text-gray-500 py-2 px-2">Loading...</div>}
                          {!studentsLoading && filteredStudents.map(s => {
                            const active = s.id === newStudentId;
                            return (
                              <div
                                key={s.id}
                                onClick={async () => {
                                  setNewStudentId(s.id);
                                  // Attempt to derive cohort data from existing records first
                                  const existing = attendanceData.find(r => r.studentId === s.id);
                                  const cohortName = existing?.cohortName || s.cohortName || "";
                                  
                                  setNewCohortName(cohortName);
                                  setNewCohortInstructor(existing?.cohortInstructor || "");
                                  setNewCohortTiming(existing?.cohortTiming || "");
                                  
                                  // If existing timing is present, parse immediately for start/end
                                  if (existing?.cohortTiming) {
                                    const { start, end } = parseTimingToStartEnd(existing.cohortTiming);
                                    if (start && !newStart) { setNewStart(start); setStartAutoFilled(true); }
                                    if (end && !newEnd) { setNewEnd(end); setEndAutoFilled(true); }
                                  } else if (cohortName) {
                                    // If no existing timing but we have a cohort, fetch cohort details immediately
                                    try {
                                      const res = await fetch('/api/dashboard/staff/instructor/cohorts');
                                      if (res.ok) {
                                        const cohorts = await res.json();
                                        if (Array.isArray(cohorts)) {
                                          const match = cohorts.find((c: any) => (c.id || c.cohortId) === cohortName);
                                          if (match) {
                                            const timing: string = match.timing || '';
                                            const instructor: string = match.instructor || '';
                                            
                                            if (instructor && !existing?.cohortInstructor) {
                                              setNewCohortInstructor(instructor);
                                            }
                                            
                                            if (timing) {
                                              setNewCohortTiming(timing);
                                              const { start, end } = parseTimingToStartEnd(timing);
                                              if (start && !newStart) { setNewStart(start); setStartAutoFilled(true); }
                                              if (end && !newEnd) { setNewEnd(end); setEndAutoFilled(true); }
                                            }
                                          }
                                        }
                                      }
                                    } catch (error) {
                                      console.log('Could not fetch cohort details:', error);
                                    }

                                  }
                                  
                                  setStudentSearchOpen(false);
                                }}
                                className={`cursor-pointer px-3 py-2 rounded-md hover:bg-gray-100 flex flex-col ${active ? 'bg-purple-50 border border-purple-300' : ''}`}
                              >
                                <span className="font-medium text-[13px] leading-snug">{s.id} - {s.name}</span>
                                {s.cohortName && <span className="text-xs text-gray-500">{s.cohortName}</span>}
                              </div>
                            );
                          })}
                          { !studentsLoading && filteredStudents.length === 0 && (
                            <div className="text-center text-xs text-gray-500 py-3">No non-instructors found</div>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date <span className="text-red-500">*</span></label>
                  <FormattedDateInput
                    id="attendanceDate"
                    value={newDate}
                    onChange={(iso) => {
                      // Let the user type freely. We'll validate on blur.
                      setNewDate(iso);
                    }}
                    onBlur={(iso) => {
                      if (!iso) { setDateError(""); return; }
                      const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
                      const isParsable = !isNaN(new Date(iso).getTime());
                      if (!isoPattern.test(iso) || !isParsable) {
                        setDateError("Please enter a valid date (yyyy-mm-dd)");
                        return;
                      }
                      if (iso > todayIso) {
                        setDateError("Future dates are not allowed");
                        return;
                      }
                      if (iso < minDateIso) {
                        setDateError("Only dates up to 14 days in the past are allowed");
                        return;
                      }
                      setDateError("");
                    }}
                    error={!!dateError}
                    min={minDateIso}
                    max={todayIso}
                    displayFormat="dd-MMM-yyyy"
                    placeholder="dd-mmm-yyyy"
                  />
                  {dateError && (
                    <p className="mt-1 text-xs text-red-500">{dateError}</p>
                  )}
                </div>
              </div>

              {/* Duplicate Warning */}
              {potentialDuplicate && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div className="text-sm text-amber-800">
                      <span className="font-medium">Duplicate Detected:</span> Attendance record already exists for {newStudentId} on {newDate}. 
                      Please choose a different date or edit the existing record.
                    </div>
                  </div>
                </div>
              )}

              {/* Auto-Populated Cohort Information */}
              {newStudentId && (newCohortName || newCohortInstructor || newCohortTiming) && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Cohort</label>
                    <input disabled value={newCohortName} className="w-full p-2 border rounded-md bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Instructor</label>
                    <input disabled value={newCohortInstructor} className="w-full p-2 border rounded-md bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Scheduled Timing</label>
                    <input disabled value={newCohortTiming} className="w-full p-2 border rounded-md bg-gray-50" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Time</label>
                  <TimeInput12Hour
                    value={newStart}
                    onChange={(value) => {
                      setNewStart(value);
                      setStartAutoFilled(false);
                    }}
                    placeholder="Select time"
                    isInvalid={!!(newStart && newEnd && isTimeAfter(newStart, newEnd))}
                  />
                  {startAutoFilled && (
                    <p className="mt-1 text-xs text-gray-500">Auto-filled from schedule</p>
                  )}
                  {newStart && newEnd && isTimeAfter(newStart, newEnd) && (
                    <p className="mt-1 text-xs text-red-500">Start time must be before end time</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Time</label>
                  <TimeInput12Hour
                    value={newEnd}
                    onChange={(value) => {
                      setNewEnd(value);
                      setEndAutoFilled(false);
                    }}
                    placeholder="Select time"
                    isInvalid={!!(newStart && newEnd && isTimeAfter(newStart, newEnd))}
                  />
                  {endAutoFilled && (
                    <p className="mt-1 text-xs text-gray-500">Auto-filled from schedule</p>
                  )}
                  {newStart && newEnd && isTimeAfter(newStart, newEnd) && (
                    <p className="mt-1 text-xs text-red-500">End time must be after start time</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status <span className="text-red-500">*</span></label>
                  <Select value={newStatus} onValueChange={(v) => setNewStatus(v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Unplanned Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Remarks {newStatus === 'absent' ? <span className="text-red-500">*</span> : null}
                </label>
                <textarea
                  className={`w-full p-2 border rounded-md h-20 ${newStatus === 'absent' && !newNotes.trim() ? 'border-red-300' : ''}`}
                  placeholder="Add any remarks about the attendance..."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  required={newStatus === 'absent'}
                  aria-required={newStatus === 'absent'}
                  aria-invalid={newStatus === 'absent' && !newNotes.trim() ? true : undefined}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1 border border-purple-300/70 bg-white text-purple-600 hover:bg-purple-50 hover:text-purple-700 shadow-sm font-medium pl-2 pr-3"
                  onClick={handleSaveDraft}
                  title={editingDraftId != null ? "Update Draft" : "Save Draft"}
                >
                  <Save className="w-4 h-4" />
                  <span className="text-sm">{editingDraftId != null ? 'Update Draft' : 'Save Draft'}</span>
                </Button>
                {(() => {
                  const noChanges = !!editingRecord && !isDirty;
                  const invalidRange = !!(newStart && newEnd && isTimeAfter(newStart, newEnd));
                  const duplicateAdd = !editingRecord && !!potentialDuplicate;
                  const requiredMissing = !newStudentId || !newDate || !newStatus || (newStatus === 'absent' && !newNotes.trim());
                  const invalidDate = !!dateError;
                  const disabled = noChanges || invalidRange || duplicateAdd || requiredMissing || invalidDate;
                  const tip = requiredMissing
                    ? 'Please fill all the mandatory fields.'
                    : noChanges
                      ? 'Please make any changes to update this attendance.'
                      : duplicateAdd
                        ? 'Cannot add duplicate record'
                        : invalidRange
                          ? 'Invalid time range'
                          : invalidDate
                            ? dateError
                            : undefined;

                  const button = (
                    <Button
                      size="sm"
                      className="h-9"
                      onClick={handleSaveAttendance}
                      disabled={disabled}
                    >
                      {editingRecord ? 'Save Changes' : 'Add Attendance'}
                    </Button>
                  );

                  if (!tip) return button;
                  // Wrap in tooltip to show reason while disabled
                  return (
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex">{button}</span>
                        </TooltipTrigger>
                        <TooltipContent side="top">{tip}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })()}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Guard */}
      <UnsavedChangesDialog
        open={unsavedOpen}
        onOpenChange={setUnsavedOpen}
        onContinueEditing={() => setUnsavedOpen(false)}
        onSaveAsDraft={() => {
          setUnsavedOpen(false);
          handleSaveDraft();
          pendingCloseRef.current?.();
          pendingCloseRef.current = null;
        }}
        onDiscardChanges={() => {
          setUnsavedOpen(false);
          resetFormToInitial();
          pendingCloseRef.current?.();
          pendingCloseRef.current = null;
        }}
      />
    </>
  );
}
