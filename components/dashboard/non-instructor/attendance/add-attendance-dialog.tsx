"use client"

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog";
import { Button } from "@/components/dashboard/ui/button";
import { Input } from "@/components/dashboard/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip";
import { Save, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select";
import { useToast } from "@/hooks/dashboard/use-toast";
import UnsavedChangesDialog from "@/components/dashboard/common/unsaved-changes-dialog";
import { FormattedDateInput } from "@/components/dashboard/common/formatted-date-input";

// Helper function to validate time range
function isTimeAfter(time1: string, time2: string): boolean {
  if (!time1 || !time2) return false;
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  return (h1 * 60 + m1) > (h2 * 60 + m2);
}

// Unified attendance record type (mirrors search filters + table expectations)
export interface NonInstructorAttendanceRecord {
  id: number;
  instructorId: string;
  instructorName: string;
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
  editingRecord?: NonInstructorAttendanceRecord | null;
  editingDraftId?: number | null;
  editingDraft?: Partial<NonInstructorAttendanceRecord> | null;
  attendanceData: NonInstructorAttendanceRecord[];
  onSaveAttendance: (record: Partial<NonInstructorAttendanceRecord>) => void;
  onSaveDraft: (record: Partial<NonInstructorAttendanceRecord>) => void;
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
  const [newInstructorId, setnewInstructorId] = useState("");
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
  const [instructorSearchOpen, setinstructorSearchOpen] = useState(false);
  const [instructorQuery, setinstructorQuery] = useState("");
  const [instructorsList, setinstructorsList] = useState<{ id: string; name: string; cohortName?: string; instructor?: string; timing?: string }[]>([]);
  const [instructorsLoading, setinstructorsLoading] = useState(false);
  const [cohortResolvedFor, setCohortResolvedFor] = useState<string>("");
  const [cohortResolving, setCohortResolving] = useState(false);

  // Track initial snapshot to detect dirty state
  const initialSnapshotRef = useRef({
    instructorId: "",
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
      (newInstructorId || "") !== (s.instructorId || "") ||
      (newDate || "") !== (s.date || "") ||
      (newStart || "") !== (s.start || "") ||
      (newEnd || "") !== (s.end || "") ||
      (newStatus || "") !== (s.status || "") ||
      (newNotes || "") !== (s.notes || "") ||
      (newCohortName || "") !== (s.cohortName || "") ||
      (newCohortInstructor || "") !== (s.cohortInstructor || "") ||
      (newCohortTiming || "") !== (s.cohortTiming || "")
    );
  }, [newInstructorId, newDate, newStart, newEnd, newStatus, newNotes, newCohortName, newCohortInstructor, newCohortTiming]);

  // Detect potential duplicate records (only for new records, not when editing)
  const potentialDuplicate = useMemo(() => {
    if (editingRecord || !newInstructorId || !newDate) return null;
    
    return attendanceData.find(
      record => record.instructorId === newInstructorId && record.date === newDate
    );
  }, [attendanceData, newInstructorId, newDate, editingRecord]);

  function resetFormToInitial() {
    setnewInstructorId("");
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
      setinstructorsLoading(true);

      try {
        // Fetch both non-instructors and leave requests to ensure complete staff list
        const [staffRes, leaveRes] = await Promise.all([
          fetch('/api/dashboard/staff/non-instructor/non-instructors', { credentials: 'include' }),
          fetch('/api/dashboard/staff/non-instructor/leave-requests', { credentials: 'include' }).catch(() => null)
        ]);
        
        // Process staff from non-instructors API
        const staffMap = new Map<string, { id: string; name: string; cohortName?: string; instructor?: string; timing?: string }>();
        
        if (staffRes.ok) {
          const json = await staffRes.json();
          const arr = Array.isArray(json)
            ? json
            : Array.isArray((json || {}).data)
              ? (json as any).data
              : Array.isArray((json || {}).items)
                ? (json as any).items
                : Array.isArray((json || {}).result)
                  ? (json as any).result
                  : [];

          if (Array.isArray(arr) && arr.length > 0) {
            arr
              .filter((s: any) => {
                // Only exclude explicitly inactive or deleted staff
                // Include staff with undefined/null status, or any other status (including those on leave)
                const status = (s.status || '').toString().toLowerCase();
                return status !== 'inactive' && status !== 'deleted';
              })
              .forEach((s: any) => {
                const id = s.externalId || s.id || s._id || s.instructorId || s.code;
                const name = s.name || [s.firstName, s.middleName, s.lastName].filter(Boolean).join(" ") || s.fullName || id;
                if (id) {
                  staffMap.set(id, {
                    id,
                    name,
                    cohortName: s.cohortId || s.cohort || '',
                    instructor: s.instructor || undefined,
                    timing: s.timing || undefined,
                  });
                }
              });
          }
        }
        
        // Add staff from leave requests who might not be in non-instructors collection
        if (leaveRes && leaveRes.ok) {
          try {
            const leaveJson = await leaveRes.json();
            const leaveRequests = Array.isArray(leaveJson) ? leaveJson : (leaveJson?.data || []);
            leaveRequests.forEach((req: any) => {
              const id = req.instructorId;
              const name = req.instructorName;
              if (id && name && !staffMap.has(id)) {
                staffMap.set(id, {
                  id,
                  name,
                  cohortName: req.cohortId || undefined,
                  instructor: undefined,
                  timing: undefined,
                });
              }
            });
          } catch {
            // Ignore errors from leave requests
          }
        }
        
        // Add staff from existing attendance records
        attendanceData.forEach(r => {
          if (r.instructorId && r.instructorName && !staffMap.has(r.instructorId)) {
            staffMap.set(r.instructorId, {
              id: r.instructorId,
              name: r.instructorName,
              cohortName: r.cohortName || '',
              instructor: r.cohortInstructor || undefined,
              timing: r.cohortTiming || undefined,
            });
          }
        });

        if (!cancelled) {
          const finalList = Array.from(staffMap.values());
          console.log(`[Attendance] Loaded ${finalList.length} non-instructors for attendance entry`);
          setinstructorsList(finalList);
        }
      } catch (err) {
        console.error('Error loading non-instructors:', err);
        if (!cancelled) {
          // Final fallback to attendance data
          const unique: Record<string, string> = {};
          attendanceData.forEach(r => { if (!unique[r.instructorId]) unique[r.instructorId] = r.instructorName; });
          setinstructorsList(Object.entries(unique).map(([id, name]) => ({ id, name })));
        }
      } finally {
        if (!cancelled) setinstructorsLoading(false);
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
        const res = await fetch('/api/dashboard/staff/instructor/cohorts', {
          credentials: 'include'
        });
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
    const q = instructorQuery.trim().toLowerCase();
    if (!q) return instructorsList;
    return instructorsList.filter(s =>
      s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    );
  }, [instructorsList, instructorQuery]);

  // Initialize form when editing record or draft
  useEffect(() => {
    if (isOpen) {
      const dataToLoad = editingRecord || editingDraft;
      if (dataToLoad) {
        setnewInstructorId(dataToLoad.instructorId || '');
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
          instructorId: dataToLoad.instructorId || "",
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
          instructorId: "",
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
    if (!newInstructorId) {
      onOpenChange(false);
      return;
    }

    // Check for duplicate records (only for new records, not when editing)
    if (!editingRecord) {
      const existingRecord = attendanceData.find(
        record => record.instructorId === newInstructorId && record.date === newDate
      );
      
      if (existingRecord) {
        toast({
          title: 'Duplicate Record',
          description: `Attendance record already exists for ${newInstructorId} on ${newDate}. Please edit the existing record or choose a different date.`,
          variant: 'destructive'
        });
        return;
      }
    }

    const recordData = {
      instructorId: newInstructorId,
      instructorName: instructorsList.find(s => s.id === newInstructorId)?.name || 
                   attendanceData.find(r => r.instructorId === newInstructorId)?.instructorName || 
                   newInstructorId,
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
      instructorId: "",
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
      description: `Attendance ${actionType} for ${newInstructorId}.`,
    });
  };

  const handleSaveDraft = () => {
    // Validate that an instructor is selected
    if (!newInstructorId?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please select an instructor before saving the draft.',
        variant: 'destructive',
      });
      return;
    }

    const recordData = {
      id: editingDraftId ?? Date.now(),
      instructorId: newInstructorId,
      instructorName: instructorsList.find(s => s.id === newInstructorId)?.name || newInstructorId,
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
    const labelName = recordData.instructorName || recordData.instructorId || 'Untitled Attendance';
    toast({
      title: editingDraftId != null ? 'Draft Updated' : 'Draft Saved',
      description: editingDraftId != null
        ? `Attendance draft "${labelName}" has been updated.`
        : `Attendance draft "${labelName}" has been saved successfully.`,
    });
    
    // reset state after saving draft
    resetFormToInitial();
    initialSnapshotRef.current = {
      instructorId: "",
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
        <DialogContent
          className="max-w-2xl"
          ref={dialogContentRef}
          onEscapeKeyDown={(e) => { e.preventDefault() }}
          onPointerDownOutside={(e) => { e.preventDefault() }}
        >
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
                  <Popover open={instructorSearchOpen} onOpenChange={(o) => { setinstructorSearchOpen(o); if (o) setinstructorQuery(""); }}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full p-2 border rounded-md flex items-center justify-between text-left hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                        aria-haspopup="listbox"
                        aria-expanded={instructorSearchOpen}
                      >
                        <span className="truncate">
                          {newInstructorId ? `${newInstructorId} - ${(instructorsList.find(s => s.id === newInstructorId)?.name) || ''}` : 'Select Non-Instructor'}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-60" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[340px] p-2" align="start" sideOffset={4} container={dialogContentRef.current}>
                      <div className="flex flex-col gap-2">
                        <input
                          autoFocus
                          value={instructorQuery}
                          onChange={(e) => setinstructorQuery(e.target.value)}
                          placeholder={instructorsLoading ? 'Loading non-instructors...' : 'Search non-instructors...'}
                          disabled={instructorsLoading}
                          className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus:border-purple-500 transition"
                        />
                        <div className="max-h-[200px] overflow-y-auto text-sm pr-1 touch-pan-y" data-remove-scroll-allow>
                          {instructorsLoading && <div className="text-xs text-gray-500 dark:text-white py-2 px-2">Loading...</div>}
                          {!instructorsLoading && filteredStudents.map(s => {
                            const active = s.id === newInstructorId;
                            return (
                              <div
                                key={s.id}
                                onClick={async () => {
                                  setnewInstructorId(s.id);
                                  // Attempt to derive cohort data from existing records first
                                  const existing = attendanceData.find(r => r.instructorId === s.id);
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
                                      const res = await fetch('/api/dashboard/staff/instructor/cohorts', {
                                        credentials: 'include',
                                      });
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
                                  
                                  setinstructorSearchOpen(false);
                                }}
                                className={`cursor-pointer px-3 py-2 rounded-md hover:bg-gray-100 flex flex-col ${active ? 'bg-purple-50 border border-purple-300' : ''}`}
                              >
                                <span className="font-medium text-[13px] leading-snug">{s.id} - {s.name}</span>
                                {s.cohortName && <span className="text-xs text-gray-500 dark:text-white">{s.cohortName}</span>}
                              </div>
                            );
                          })}
                          { !instructorsLoading && filteredStudents.length === 0 && (
                            <div className="text-center text-xs text-gray-500 dark:text-white py-3">No non-instructors found</div>
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
                      <span className="font-medium">Duplicate Detected:</span> Attendance record already exists for {newInstructorId} on {newDate}. 
                      Please choose a different date or edit the existing record.
                    </div>
                  </div>
                </div>
              )}

              {/* Auto-Populated Cohort Information */}
              {newInstructorId && (newCohortName || newCohortInstructor || newCohortTiming) && (
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
                  <Input
                    type="time"
                    value={newStart || ''}
                    onChange={(e) => {
                      const rawTime = e.target.value;
                      if (newEnd && rawTime >= newEnd) {
                        alert('Start time must be before end time');
                        return;
                      }
                      setNewStart(rawTime);
                      setStartAutoFilled(false);
                    }}
                    className={`${newStart && newEnd && isTimeAfter(newStart, newEnd) ? 'border-red-300 bg-red-50' : ''}`}
                  />
                  {startAutoFilled && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-white">Auto-filled from schedule</p>
                  )}
                  {newStart && newEnd && isTimeAfter(newStart, newEnd) && (
                    <p className="mt-1 text-xs text-red-500">Start time must be before end time</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Time</label>
                  <Input
                    type="time"
                    value={newEnd || ''}
                    onChange={(e) => {
                      const rawTime = e.target.value;
                      if (newStart && rawTime <= newStart) {
                        alert('End time must be after start time');
                        return;
                      }
                      setNewEnd(rawTime);
                      setEndAutoFilled(false);
                    }}
                    className={`${newStart && newEnd && isTimeAfter(newStart, newEnd) ? 'border-red-300 bg-red-50' : ''}`}
                  />
                  {endAutoFilled && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-white">Auto-filled from schedule</p>
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
                  const requiredMissing = !newInstructorId || !newDate || !newStatus || (newStatus === 'absent' && !newNotes.trim());
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
