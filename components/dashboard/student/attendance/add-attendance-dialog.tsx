"use client"

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/dashboard/ui/dialog";
import { Button } from "@/components/dashboard/ui/button";
import { Input } from "@/components/dashboard/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover";
import { Save, ChevronDown, X } from "lucide-react";
import { useToast } from "@/hooks/dashboard/use-toast";
import UnsavedChangesDialog from "@/components/dashboard/student/common/unsaved-changes-dialog";
import { FormattedDateInput } from "@/components/dashboard/student/common/formatted-date-input";
import { cn } from "@/lib/dashboard/student/utils";
// Local helper to get today's local date in ISO yyyy-MM-dd (local timezone)
const todayLocal = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

// Helper to get ISO date for N days before today (local timezone)
const daysAgoLocal = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

// Helper function to validate time range
function isTimeAfter(time1: string, time2: string): boolean {
  if (!time1 || !time2) return false;
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  return (h1 * 60 + m1) > (h2 * 60 + m2);
}

// Unified attendance record type (mirrors search filters + table expectations)
export interface StudentAttendanceRecord {
  id: string | number; // MongoDB _id (string) or local id (number)
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
  editingDraftId?: string | number | null;
  editingDraft?: Partial<StudentAttendanceRecord> | null;
  attendanceData: StudentAttendanceRecord[];
  onSaveAttendance: (record: Partial<StudentAttendanceRecord>) => Promise<boolean>;
  onSaveDraft: (record: Partial<StudentAttendanceRecord>) => Promise<void>;
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

  // Helper functions for time conversion
  const applyMeridiem = (time12: string, meridiem: 'AM' | 'PM'): string => {
    if (!time12) return '';
    const [hours, minutes] = time12.split(':');
    let h = parseInt(hours);
    if (meridiem === 'PM' && h !== 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${minutes}`;
  };

  const getMeridiem = (time24: string): 'AM' | 'PM' => {
    if (!time24) return 'AM';
    const [hours] = time24.split(':');
    return parseInt(hours) >= 12 ? 'PM' : 'AM';
  };

  const get12HourTime = (time24: string): string => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    let h = parseInt(hours);
    h = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h.toString().padStart(2, '0')}:${minutes}`;
  };

  // Form state
  const [newStudentId, setNewStudentId] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0,10));
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newStatus, setNewStatus] = useState("present");
  const [newNotes, setNewNotes] = useState("");
  const [startAutoFilled, setStartAutoFilled] = useState(false);
  const [endAutoFilled, setEndAutoFilled] = useState(false);
  
  // Time meridiem state
  const [startTimeMeridiem, setStartTimeMeridiem] = useState<'AM' | 'PM'>('AM');
  const [endTimeMeridiem, setEndTimeMeridiem] = useState<'AM' | 'PM'>('AM');
  
  // Cohort/instructor auto-populated fields
  const [newCohortId, setNewCohortId] = useState(""); // Cohort ID (e.g., "COH001")
  const [newCohortName, setNewCohortName] = useState(""); // Cohort Name (e.g., "Cohort A")
  const [newCohortInstructor, setNewCohortInstructor] = useState("");
  const [newCohortTiming, setNewCohortTiming] = useState("");
  
  // Student search state
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
  const [studentQuery, setStudentQuery] = useState("");
  const [studentsList, setStudentsList] = useState<{ id: string; name: string; cohortId?: string; instructor?: string; timing?: string }[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [cohortResolvedFor, setCohortResolvedFor] = useState<string>("");
  const [cohortResolving, setCohortResolving] = useState(false);
  
  const firstOptionRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Track initial snapshot to detect dirty state
  const initialSnapshotRef = useRef({
    studentId: "",
    date: new Date().toISOString().slice(0,10),
    start: "",
    end: "",
    status: "present",
    notes: "",
    cohortId: "",
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
      (newCohortId || "") !== (s.cohortId || "") ||
      (newCohortName || "") !== (s.cohortName || "") ||
      (newCohortInstructor || "") !== (s.cohortInstructor || "") ||
      (newCohortTiming || "") !== (s.cohortTiming || "")
    );
  }, [newStudentId, newDate, newStart, newEnd, newStatus, newNotes, newCohortId, newCohortName, newCohortInstructor, newCohortTiming]);

  // Detect potential duplicate records (only for new records, not when editing)
  const potentialDuplicate = useMemo(() => {
    if (editingRecord || !newStudentId || !newDate) return undefined;
    
    return attendanceData.find(
      record => record.studentId === newStudentId && record.date === newDate
    );
  }, [attendanceData, newStudentId, newDate, editingRecord]);

  const invalidTimeRange = useMemo(
    () => Boolean(newStart && newEnd && isTimeAfter(newStart, newEnd)),
    [newStart, newEnd]
  );

  function resetFormToInitial() {
    setNewStudentId("");
    setNewStart("");
    setNewEnd("");
    setNewStatus("present");
    setNewNotes("");
    setNewCohortId("");
    setNewCohortName("");
    setNewCohortInstructor("");
    setNewCohortTiming("");
    setStartAutoFilled(false);
    setEndAutoFilled(false);
    setStartTimeMeridiem('AM');
    setEndTimeMeridiem('AM');
  }

  // Load students when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    
    // If editing, immediately add the current student to the list to avoid delay
    if (editingRecord && editingRecord.studentId) {
      setStudentsList([{
        id: editingRecord.studentId,
        name: editingRecord.studentName || editingRecord.studentId,
        cohortId: editingRecord.cohortId || '',
      }]);
      // Don't set loading to true initially when editing, to show the student immediately
    } else {
      setStudentsLoading(true);
    }

    (async () => {
      if (!editingRecord) {
        setStudentsLoading(true);
      }

      try {
        const res = await fetch('/api/dashboard/student/students', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && Array.isArray(data)) {
            const mapped = data.map((s: any) => ({
              id: s.studentId || s.id,
              name: s.name || s.fullName || s.studentId,
              cohortId: s.cohortId || '',
            }));
            const filtered = mapped.filter(s => s.id);
            
            // If editing, ensure the editing student is in the list (merge with existing)
            if (editingRecord && editingRecord.studentId) {
              const hasEditingStudent = filtered.some(s => s.id === editingRecord.studentId);
              if (!hasEditingStudent) {
                filtered.unshift({
                  id: editingRecord.studentId,
                  name: editingRecord.studentName || editingRecord.studentId,
                  cohortId: editingRecord.cohortId || '',
                });
              }
            }
            
            setStudentsList(filtered);
          }
        } else if (!cancelled) {
          // fallback to current attendance dataset unique students
          const unique: Record<string, string> = {};
          attendanceData.forEach(r => { if (!unique[r.studentId]) unique[r.studentId] = r.studentName; });
          const fallbackList = Object.entries(unique).map(([id, name]) => ({ id, name }));
          
          // Ensure editing student is included
          if (editingRecord && editingRecord.studentId && !unique[editingRecord.studentId]) {
            fallbackList.unshift({
              id: editingRecord.studentId,
              name: editingRecord.studentName || editingRecord.studentId,
            });
          }
          
          setStudentsList(fallbackList);
        }
      } catch {
        if (!cancelled) {
          const unique: Record<string, string> = {};
          attendanceData.forEach(r => { if (!unique[r.studentId]) unique[r.studentId] = r.studentName; });
          const fallbackList = Object.entries(unique).map(([id, name]) => ({ id, name }));
          
          // Ensure editing student is included
          if (editingRecord && editingRecord.studentId && !unique[editingRecord.studentId]) {
            fallbackList.unshift({
              id: editingRecord.studentId,
              name: editingRecord.studentName || editingRecord.studentId,
            });
          }
          
          setStudentsList(fallbackList);
        }
      } finally {
        if (!cancelled) setStudentsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, attendanceData, editingRecord]);

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
    // Extract time tokens from any free-text like "Mon�Fri � 09:00 - 10:00" or "9:00-11:00 AM"
    // Matches: HH, HH:mm, with optional AM/PM (case-insensitive). Avoids picking up words.
    const re = /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/gi;
    const times: Array<{ h: number; m: number; mer?: 'AM' | 'PM' }> = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(timing)) !== null) {
      const h = parseInt(m[1] || '0', 10);
      const mm = parseInt(m[2] || '0', 10);
      if (Number.isNaN(h) || h < 0 || h > 24) continue; // sanity guard
      const merRaw = (m[3] || '').toUpperCase();
      const mer = merRaw === 'AM' || merRaw === 'PM' ? (merRaw as 'AM' | 'PM') : undefined;
      times.push({ h, m: Number.isNaN(mm) ? 0 : mm, mer });
    }

    if (times.length === 0) return {};

    const toHHmm = (t: { h: number; m: number; mer?: 'AM' | 'PM' }, fallbackMer?: 'AM' | 'PM') => {
      let h = t.h;
      const min = t.m ?? 0;
      const mer = t.mer || fallbackMer;
      if (mer === 'PM' && h !== 12) h += 12;
      if (mer === 'AM' && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    };

    // Use first two detected times as start/end. If only one time found, return it as start.
    const first = times[0];
    const second = times[1];
    // If only the last token has AM/PM (e.g., "9:00-11:00 AM"), propagate to the first
    const fallbackMer = (second && second.mer) || first.mer;
    const start = first ? toHHmm(first, fallbackMer) : undefined;
    const end = second ? toHHmm(second, second.mer || fallbackMer) : undefined;
    return { start, end };
  }

  // When cohort timing is known locally, auto-fill start/end (without overriding user input)
  useEffect(() => {
    if (!newCohortTiming) return;
    const { start, end } = parseTimingToStartEnd(newCohortTiming);
    if (start && !newStart) { 
      setNewStart(start); 
      setStartAutoFilled(true);
      setStartTimeMeridiem(getMeridiem(start));
    }
    if (end && !newEnd) { 
      setNewEnd(end); 
      setEndAutoFilled(true);
      setEndTimeMeridiem(getMeridiem(end));
    }
  }, [newCohortTiming, newStart, newEnd]);

  // If timing not known from existing records, fetch /api/cohorts and resolve by cohort id
  useEffect(() => {
    const cohortId = newCohortId?.trim();
    if (!cohortId) return;
    // Avoid re-fetching the same cohort repeatedly within an open modal session
    if (cohortResolvedFor === cohortId) return;
    if (newCohortTiming && newCohortTiming.trim()) return; // already have timing locally
    let cancelled = false;
    (async () => {
      try {
        setCohortResolving(true);
        const res = await fetch('/api/dashboard/student/cohorts', {
          credentials: 'include',
        });
        if (!res.ok) return;
        const cohorts = await res.json();
        if (cancelled || !Array.isArray(cohorts)) return;
        const match = cohorts.find((c: any) => (c.id || c.cohortId) === cohortId);
        if (match) {
          const cohortName: string = match.name || '';
          const timing: string = match.timing || '';
          const instructor: string = match.instructor || '';
          
          if (!newCohortName && cohortName) setNewCohortName(cohortName);
          if (!newCohortInstructor && instructor) setNewCohortInstructor(instructor);
          if (timing) {
            setNewCohortTiming(timing);
            const { start, end } = parseTimingToStartEnd(timing);
            if (start && !newStart) { 
              setNewStart(start); 
              setStartAutoFilled(true);
              setStartTimeMeridiem(getMeridiem(start));
            }
            if (end && !newEnd) { 
              setNewEnd(end); 
              setEndAutoFilled(true);
              setEndTimeMeridiem(getMeridiem(end));
            }
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
  }, [newCohortId, newCohortName, newCohortTiming, newCohortInstructor, newStart, newEnd, cohortResolvedFor]);

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return studentsList;
    return studentsList.filter(s =>
      s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    );
  }, [studentsList, studentQuery]);

  // When status is absent, clear and lock time fields
  useEffect(() => {
    if (newStatus === 'absent') {
      if (newStart) setNewStart('');
      if (newEnd) setNewEnd('');
      setStartAutoFilled(false);
      setEndAutoFilled(false);
    }
  }, [newStatus]);

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
        setNewCohortId(dataToLoad.cohortId || '');
        setNewCohortName(dataToLoad.cohortName || '');
        setNewCohortInstructor(dataToLoad.cohortInstructor || '');
        setNewCohortTiming(dataToLoad.cohortTiming || '');
        
        // Set meridiem states based on loaded times
        if (dataToLoad.startTime) {
          setStartTimeMeridiem(getMeridiem(dataToLoad.startTime));
        }
        if (dataToLoad.endTime) {
          setEndTimeMeridiem(getMeridiem(dataToLoad.endTime));
        }
        
        // set initial snapshot for edit mode
        initialSnapshotRef.current = {
          studentId: dataToLoad.studentId || "",
          date: dataToLoad.date || new Date().toISOString().slice(0,10),
          start: dataToLoad.startTime || "",
          end: dataToLoad.endTime || "",
          status: dataToLoad.status || "present",
          notes: dataToLoad.notes || "",
          cohortId: dataToLoad.cohortId || "",
          cohortName: dataToLoad.cohortName || "",
          cohortInstructor: dataToLoad.cohortInstructor || "",
          cohortTiming: dataToLoad.cohortTiming || "",
        };

        if (!dataToLoad.startTime || !dataToLoad.endTime) {
          const { start, end } = parseTimingToStartEnd(dataToLoad.cohortTiming || '');
          if (!dataToLoad.startTime && start) { 
            setNewStart(start); 
            setStartAutoFilled(true);
            setStartTimeMeridiem(getMeridiem(start));
          }
          if (!dataToLoad.endTime && end) { 
            setNewEnd(end); 
            setEndAutoFilled(true);
            setEndTimeMeridiem(getMeridiem(end));
          }
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
          cohortId: "",
          cohortName: "",
          cohortInstructor: "",
          cohortTiming: "",
        };
      }
      
      // Reset cohort resolution tracking for fresh data
      setCohortResolvedFor('');
    }
  }, [editingRecord, editingDraft, isOpen]);

  const handleSaveAttendance = async () => {
    if (!newStudentId) {
      toast({
        title: 'Student Required',
        description: 'Please select a student before saving attendance.',
        variant: 'destructive',
      });
      return;
    }

    if (!newDate) {
      toast({
        title: 'Date Required',
        description: 'Please choose an attendance date.',
        variant: 'destructive',
      });
      return;
    }

    // Attendance date must not be in the future
    try {
      const selected = new Date(newDate);
      const today = new Date();
      const selOnly = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (selOnly.getTime() > todayOnly.getTime()) {
        toast({
          title: 'Invalid Date',
          description: 'Attendance date cannot be in the future.',
          variant: 'destructive',
        });
        return;
      }
      // Also ensure date is not older than 14 days
      const twoWeeksAgoIso = daysAgoLocal(14);
      const twoWeeksDate = new Date(twoWeeksAgoIso);
      const twoWeeksOnly = new Date(twoWeeksDate.getFullYear(), twoWeeksDate.getMonth(), twoWeeksDate.getDate());
      if (selOnly.getTime() < twoWeeksOnly.getTime()) {
        toast({
          title: 'Date Too Old',
          description: 'Attendance date cannot be older than 14 days.',
          variant: 'destructive',
        });
        return;
      }
    } catch (e) {
      // ignore parse errors; existing validation will surface issues
    }

    if (!newStatus) {
      toast({
        title: 'Status Required',
        description: 'Please select an attendance status.',
        variant: 'destructive',
      });
      return;
    }

    // If absent, remarks are mandatory
    if (newStatus === 'absent' && !newNotes.trim()) {
      toast({
        title: 'Remarks Required',
        description: 'Please provide a reason in Remarks when marking a student as Absent.',
        variant: 'destructive',
      });
      return;
    }

    if (newStart && newEnd && isTimeAfter(newStart, newEnd)) {
      toast({
        title: 'Invalid Time Range',
        description: 'End time must be after start time.',
        variant: 'destructive',
      });
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
      cohortId: newCohortId,
      cohortName: newCohortName,
      cohortInstructor: newCohortInstructor,
      cohortTiming: newCohortTiming,
      date: newDate,
      startTime: newStatus === 'absent' ? undefined : (newStart || undefined),
      endTime: newStatus === 'absent' ? undefined : (newEnd || undefined),
      status: newStatus,
      notes: newNotes || undefined,
    };

    // Wait for the save operation to complete
    const success = await onSaveAttendance(recordData);
    
    // Only close and reset if save was successful
    if (success) {
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
        cohortId: "",
        cohortName: "",
        cohortInstructor: "",
        cohortTiming: "",
      };
    }
  };

  const handleSaveDraft = async () => {
    // Validate that a student is selected
    if (!newStudentId?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please select a student before saving the draft.',
        variant: 'destructive',
      });
      return;
    }

    // If absent, remarks are required even for drafts
    if (newStatus === 'absent' && !newNotes.trim()) {
      toast({
        title: 'Remarks Required',
        description: 'Please provide a reason in Remarks when saving an Absent draft.',
        variant: 'destructive',
      });
      return;
    }
    const recordData = {
      id: editingDraftId ?? Date.now(),
      studentId: newStudentId,
      studentName: studentsList.find(s => s.id === newStudentId)?.name || newStudentId,
      cohortId: newCohortId || undefined,
      cohortName: newCohortName || undefined,
      cohortInstructor: newCohortInstructor || undefined,
      cohortTiming: newCohortTiming || undefined,
      date: newDate,
      startTime: newStatus === 'absent' ? undefined : (newStart || undefined),
      endTime: newStatus === 'absent' ? undefined : (newEnd || undefined),
      status: newStatus,
      notes: newNotes || undefined,
      savedAt: new Date().toISOString(),
    };

    try {
      // Wait for the API call to complete
      await onSaveDraft(recordData);
      
      // Close modal only after successful save
      onOpenChange(false);
      
      // reset state after saving draft
      resetFormToInitial();
      initialSnapshotRef.current = {
        studentId: "",
        date: new Date().toISOString().slice(0,10),
        start: "",
        end: "",
        status: "present",
        notes: "",
        cohortId: "",
        cohortName: "",
        cohortInstructor: "",
        cohortTiming: "",
      };
    } catch (error) {
      // Error toast is already shown by the parent handler
      console.error('Failed to save draft:', error);
    }
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between w-full">
              <DialogTitle>{editingRecord ? 'Edit Attendance' : 'Add Student Attendance'}</DialogTitle>
              <div className="flex items-start gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1 mr-10 border border-purple-300/70 bg-white text-purple-600 hover:bg-purple-50 hover:text-purple-700 shadow-sm font-medium pl-2 pr-3"
                  onClick={handleSaveDraft}
                  title={
                    editingDraftId != null
                      ? (newStatus === 'absent' && !newNotes.trim() ? 'Remarks are required when status is Absent' : 'Update Draft')
                      : (newStatus === 'absent' && !newNotes.trim() ? 'Remarks are required when status is Absent' : 'Save Draft')
                  }
                  disabled={newStatus === 'absent' && !newNotes.trim()}
                >
                  <Save className="w-4 h-4" />
                  <span className="text-sm">{editingDraftId != null ? 'Update Draft' : 'Save Draft'}</span>
                </Button>
                {/* Removed duplicate close button; `DialogContent` renders its own close icon */}
              </div>
            </div>
          </DialogHeader>
          <div className="p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Student <span className="text-red-500">*</span>
                  </label>
                  <Popover modal={false} open={studentSearchOpen} onOpenChange={(o) => { 
                    setStudentSearchOpen(o); 
                    if (o) {
                      setStudentQuery(""); 
                    }
                  }}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full p-2 border rounded-md flex items-center justify-between text-left hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                        aria-haspopup="listbox"
                        aria-expanded={studentSearchOpen}
                      >
                        <span className="truncate">
                          {newStudentId ? `${newStudentId} - ${(studentsList.find(s => s.id === newStudentId)?.name) || ''}` : 'Select Student'}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-60" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[340px] p-2" align="start" sideOffset={4}>
                      <div className="flex flex-col gap-2">
                        <input
                          ref={searchInputRef}
                          autoFocus
                          value={studentQuery}
                          onChange={(e) => setStudentQuery(e.target.value)}
                          placeholder={studentsLoading ? 'Loading students...' : 'Search students...'}
                          disabled={studentsLoading}
                          className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus:border-purple-500 transition"
                        />
                        <div className="max-h-[200px] overflow-y-auto text-sm pr-1" onWheelCapture={(e)=>{ e.stopPropagation(); }}>
                          {studentsLoading && <div className="text-xs text-gray-500 dark:text-white py-2 px-2">Loading...</div>}
                          {!studentsLoading && filteredStudents.map((s, index) => {
                            const active = s.id === newStudentId;
                            const handleStudentSelect = async () => {
                              setNewStudentId(s.id);
                              // Attempt to derive cohort data from existing records first
                              const existing = attendanceData.find(r => r.studentId === s.id);
                              const cohortIdFromData = existing?.cohortId || s.cohortId || "";
                              
                              setNewCohortId(cohortIdFromData);
                              setNewCohortName(existing?.cohortName || "");
                              setNewCohortInstructor(existing?.cohortInstructor || "");
                              setNewCohortTiming(existing?.cohortTiming || "");
                              
                              // If existing timing is present, parse immediately for start/end
                              if (existing?.cohortTiming) {
                                const { start, end } = parseTimingToStartEnd(existing.cohortTiming);
                                if (start && !newStart) { setNewStart(start); setStartAutoFilled(true); }
                                if (end && !newEnd) { setNewEnd(end); setEndAutoFilled(true); }
                              } else if (cohortIdFromData) {
                                // If no existing timing but we have a cohort ID, fetch cohort details immediately
                                try {
                                  const res = await fetch('/api/dashboard/student/cohorts', {
                                    credentials: 'include',
                                  });
                                  if (res.ok) {
                                    const cohorts = await res.json();
                                    if (Array.isArray(cohorts)) {
                                      const match = cohorts.find((c: any) => (c.id || c.cohortId) === cohortIdFromData);
                                      if (match) {
                                        const cohortName: string = match.name || '';
                                        const timing: string = match.timing || '';
                                        const instructor: string = match.instructor || '';
                                        
                                        // Set cohort name from API
                                        if (cohortName && !existing?.cohortName) {
                                          setNewCohortName(cohortName);
                                        }
                                        
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
                            };
                            
                            return (
                              <div
                                key={s.id}
                                ref={index === 0 ? firstOptionRef : undefined}
                                tabIndex={-1}
                                onClick={handleStudentSelect}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleStudentSelect();
                                  } else if (e.key === 'ArrowDown') {
                                    e.preventDefault();
                                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (nextElement?.focus) nextElement.focus();
                                  } else if (e.key === 'ArrowUp') {
                                    e.preventDefault();
                                    const prevElement = e.currentTarget.previousElementSibling as HTMLElement;
                                    if (prevElement?.focus) {
                                      prevElement.focus();
                                    } else if (searchInputRef.current) {
                                      searchInputRef.current.focus();
                                    }
                                  } else if (e.key === 'Escape') {
                                    setStudentSearchOpen(false);
                                  }
                                }}
                                className={cn(
                                  'cursor-pointer px-3 py-2 rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex flex-col',
                                  active ? 'bg-purple-50 border border-purple-300' : ''
                                )}
                              >
                                <span className="font-medium text-[13px] leading-snug">{s.id} - {s.name}</span>
                                {s.cohortId && <span className="text-xs text-gray-500 dark:text-white">{s.cohortId}</span>}
                              </div>
                            );
                          })}
                          {!studentsLoading && filteredStudents.length === 0 && (
                            <div className="text-center text-xs text-gray-500 dark:text-white py-3">No students found</div>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <FormattedDateInput
                    id="attendanceDate"
                    value={newDate}
                    onChange={(iso) => setNewDate(iso)}
                    displayFormat="dd-MMM-yyyy"
                    placeholder="dd-mmm-yyyy"
                    min={daysAgoLocal(14)}
                    max={todayLocal()}
                    className="p-2"
                  />
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
                  <div className="flex gap-1 items-center">
                    <input
                      type="time"
                      value={newStart ? get12HourTime(newStart) : ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const rawTime = e.target.value;
                        
                        if (!rawTime) {
                          setNewStart('');
                          setStartAutoFilled(false);
                          return;
                        }
                        
                        // Convert to 24-hour format using current meridiem setting
                        const convertedStartTime = applyMeridiem(rawTime, startTimeMeridiem);
                        
                        // Validate against end time
                        if (newEnd && convertedStartTime >= newEnd) {
                          toast({
                            title: 'Invalid Time',
                            description: 'Start time must be before end time',
                            variant: 'destructive'
                          });
                          return;
                        }
                        
                        setNewStart(convertedStartTime);
                        setStartAutoFilled(false);
                        
                        // Update meridiem display based on the converted time
                        const autoMeridiem = getMeridiem(convertedStartTime);
                        setStartTimeMeridiem(autoMeridiem);
                      }}
                      disabled={newStatus === 'absent'}
                      className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 border-gray-300"
                    />
                    <select
                      className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white border-gray-300"
                      value={startTimeMeridiem}
                      onChange={(e) => {
                        const newMeridiem = e.target.value as 'AM' | 'PM';
                        setStartTimeMeridiem(newMeridiem);
                        
                        if (!newStart) return;
                        
                        // Convert current 24-hour time back to 12-hour, then apply new meridiem
                        const time12Hour = get12HourTime(newStart);
                        const convertedTime = applyMeridiem(time12Hour, newMeridiem);
                        
                        // Validate the new time
                        if (newEnd && convertedTime >= newEnd) {
                          toast({
                            title: 'Invalid Time',
                            description: 'Start time must be before end time',
                            variant: 'destructive'
                          });
                          return;
                        }
                        
                        setNewStart(convertedTime);
                      }}
                      disabled={newStatus === 'absent'}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                  {startAutoFilled && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-white">Auto-filled from schedule</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Time</label>
                  <div className="flex gap-1 items-center">
                    <input
                      type="time"
                      value={newEnd ? get12HourTime(newEnd) : ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const rawTime = e.target.value;
                        
                        if (!rawTime) {
                          setNewEnd('');
                          setEndAutoFilled(false);
                          return;
                        }
                        
                        // Convert to 24-hour format using current meridiem setting
                        const convertedEndTime = applyMeridiem(rawTime, endTimeMeridiem);
                        
                        // Validate against start time
                        if (newStart && convertedEndTime <= newStart) {
                          toast({
                            title: 'Invalid Time',
                            description: 'End time must be after start time',
                            variant: 'destructive'
                          });
                          return;
                        }
                        
                        setNewEnd(convertedEndTime);
                        setEndAutoFilled(false);
                        
                        // Update meridiem display based on the converted time
                        const autoMeridiem = getMeridiem(convertedEndTime);
                        setEndTimeMeridiem(autoMeridiem);
                      }}
                      disabled={newStatus === 'absent'}
                      className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 border-gray-300"
                    />
                    <select
                      className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white border-gray-300"
                      value={endTimeMeridiem}
                      onChange={(e) => {
                        const newMeridiem = e.target.value as 'AM' | 'PM';
                        setEndTimeMeridiem(newMeridiem);
                        
                        if (!newEnd) return;
                        
                        // Convert current 24-hour time back to 12-hour, then apply new meridiem
                        const time12Hour = get12HourTime(newEnd);
                        const convertedTime = applyMeridiem(time12Hour, newMeridiem);
                        
                        // Validate the new time
                        if (newStart && convertedTime <= newStart) {
                          toast({
                            title: 'Invalid Time',
                            description: 'End time must be after start time',
                            variant: 'destructive'
                          });
                          return;
                        }
                        
                        setNewEnd(convertedTime);
                      }}
                      disabled={newStatus === 'absent'}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                  {endAutoFilled && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-white">Auto-filled from schedule</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select 
                    className="w-full p-2 border rounded-md" 
                    value={newStatus} 
                    onChange={e => setNewStatus(e.target.value)}
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Remarks {newStatus === 'absent' && (<span className="text-red-500">*</span>)}</label>
                <textarea
                  className="w-full p-2 border rounded-md h-20"
                  placeholder="Add any remarks about the attendance..."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  required={newStatus === 'absent'}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1 border border-purple-300/70 bg-white text-purple-600 hover:bg-purple-50 hover:text-purple-700 shadow-sm font-medium pl-2 pr-3"
                  onClick={handleSaveDraft}
                  title={
                    editingDraftId != null ? (newStatus === 'absent' && !newNotes.trim() ? 'Remarks are required when status is Absent' : 'Update Draft')
                    : (newStatus === 'absent' && !newNotes.trim() ? 'Remarks are required when status is Absent' : 'Save Draft')
                  }
                  disabled={newStatus === 'absent' && !newNotes.trim()}
                >
                  <Save className="w-4 h-4" />
                  <span className="text-sm">{editingDraftId != null ? 'Update Draft' : 'Save Draft'}</span>
                </Button>
                <Button
                  size="sm"
                  className="h-9 bg-purple-600 text-white"
                  onClick={handleSaveAttendance}
                  disabled={
                    !newStudentId ||
                    !newDate ||
                    !newStatus ||
                    (newStatus === 'absent' && !newNotes.trim()) ||
                    (!editingRecord && Boolean(potentialDuplicate)) ||
                    invalidTimeRange ||
                    Boolean(editingRecord && !isDirty)
                  }
                  title={
                    !newStudentId
                      ? 'Please select a student'
                      : !newDate
                        ? 'Please choose an attendance date'
                        : !newStatus
                          ? 'Please select an attendance status'
                          : (newStatus === 'absent' && !newNotes.trim())
                            ? 'Remarks are required when status is Absent'
                          : potentialDuplicate
                            ? 'A record already exists for this student on the selected date.'
                            : invalidTimeRange
                              ? 'End time must be after start time.'
                              : (editingRecord && !isDirty)
                                ? 'No changes to save'
                                : undefined
                  }
                >
                  {editingRecord ? 'Save Changes' : 'Add Attendance'}
                </Button>
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
        onSaveAsDraft={async () => {
          setUnsavedOpen(false);
          await handleSaveDraft();
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
