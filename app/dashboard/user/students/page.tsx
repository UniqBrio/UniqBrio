"use client"

export const dynamic = 'force-dynamic'

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useCustomColors } from "@/lib/use-custom-colors";
;
import { StudentAnalytics } from "@/components/dashboard/student/students/student-analytics";
import { StudentList } from "@/components/dashboard/student/students/student-list";
import { StudentDetailsDialog } from "@/components/dashboard/student/students/student-details-dialog";
import { StudentAchievements } from "@/components/dashboard/student/students/student-achievements";
import { AddStudentDialogFixed } from "@/components/dashboard/student/students/add-student-dialog-fixed";
import { StudentDraftsDialog } from "@/components/dashboard/student/students/student-drafts-dialog";
import { StudentDraftsAPI } from "@/lib/dashboard/student/student-drafts-api";
import StudentSettings from "@/components/dashboard/student/students/student-settings-new";
import { fetchCourses, type Course } from "@/data/dashboard/courses";
import { fetchCohorts, type Cohort } from "@/data/dashboard/cohorts";
import StudentSearchFilters from "@/components/dashboard/student/students/student-search-filters";
import { type Student } from "@/types/dashboard/student";
import { type Achievement } from "@/types/dashboard/achievement";
import { fetchAchievements } from "@/lib/dashboard/student/fetch-achievements";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs";
import { Button } from "@/components/dashboard/ui/button"; // still used elsewhere
import { LayoutDashboard, Plus, Trophy, Users, Calendar, ClipboardList, Settings } from "lucide-react";
import { 
  Dialog,
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/dashboard/ui/dialog";
import { X } from "lucide-react";
import { useToast } from "@/hooks/dashboard/use-toast";
import StudentHeroSection from "@/components/dashboard/student/students/StudentHeroSection";
import StudentStatisticsCards from "@/components/dashboard/student/students/StudentStatisticsCards";

// Attendance management imports
import { AttendanceManagement } from "@/components/dashboard/student/attendance/attendance-management";

// Leave management imports
import { LeaveManagement } from "@/components/dashboard/student/leave/leave-management";

type StudentNumberingStrategy = 'sequential' | 'uuid'

export default function StudentsPage() {
  const { toast } = useToast();
  const { primaryColor, secondaryColor } = useCustomColors();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState<boolean>(false);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  // Payment prompt state after adding a student
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
  const [lastAddedStudent, setLastAddedStudent] = useState<Student | null>(null);
  
  // Preload attendance data to improve UX
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  // Student Settings State with localStorage persistence
  const [studentSettings, setStudentSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('studentSettings')
      if (saved) {
        return JSON.parse(saved)
      }
    }
    return {
      identity: {
        customIdPrefix: 'STU',
        numberingStrategy: 'sequential',
        idNumberPadding: 4,
        sequenceStart: 1,
        allowManualIds: false,
        enforceUppercase: true,
        showIdBadges: true,
      },
      enrollment: {
        requireCourseSelection: true,
        requireCohortAssignment: false,
        warnBeforeCohortChange: true,
        autoSyncCohortMembers: true,
        preventDuplicateEnrollment: true,
      },
      validation: {
        requireEmail: true,
        requireMobile: true,
        requireDOB: true,
        requireAddress: false,
        requireGuardianForMinors: true,
        minAge: 0,
        allowFutureDOB: false,
        validateEmailFormat: true,
        validateMobileDuplicates: true,
      },
      display: {
        defaultView: 'list',
        cardsPerPage: 25,
        showAvatars: true,
        showCohortInfo: true,
        showEnrollmentDate: true,
        compactMode: false,
        colorCodeByStatus: true,
        showProgressBars: true,
      },
      filters: {
        rememberLastFilters: true,
        autoApplyFilters: false,
        showAdvancedFilters: true,
        defaultCourse: 'all',
        defaultCohort: 'all',
        defaultStatus: 'active',
      },
      notifications: {
        studentAdded: true,
        studentUpdated: true,
        studentDeleted: true,
        enrollmentChanges: true,
        paymentReminders: true,
        attendanceAlerts: true,
        leaveRequests: true,
        soundEnabled: false,
      },
      export: {
        defaultFormat: 'csv',
        includeMetadata: true,
        includePaymentInfo: false,
        includeAttendance: false,
        autoDownload: true,
      },
      automation: {
        autoSaveDrafts: true,
        autoDraftInterval: 3,
        confirmBeforeDelete: true,
        showDeletedCount: true,
        autoRefresh: false,
        refreshInterval: 5,
      },
      advanced: {
        enableDebugMode: false,
        cacheEnabled: true,
        maxCacheSize: 100,
        showStudentIds: true,
        enableBulkOperations: true,
        cohortAutoSync: true,
      },
    }
  })

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('studentSettings', JSON.stringify(studentSettings))
    }
  }, [studentSettings])

  // Update a specific setting
  const updateStudentSetting = (category: string, key: string, value: any) => {
    setStudentSettings((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }))
  }

  // Save settings callback
  const saveStudentSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your student management preferences have been saved.",
    })
  }

  // Reset all settings to defaults
  const resetStudentSettings = () => {
    const defaults = {
      identity: {
        customIdPrefix: 'STU',
        numberingStrategy: 'sequential' as 'sequential' | 'uuid',
        idNumberPadding: 4,
        sequenceStart: 1,
        allowManualIds: false,
        enforceUppercase: true,
        showIdBadges: true,
      },
      enrollment: {
        requireCourseSelection: true,
        requireCohortAssignment: false,
        warnBeforeCohortChange: true,
        autoSyncCohortMembers: true,
        preventDuplicateEnrollment: true,
      },
      validation: {
        requireEmail: true,
        requireMobile: true,
        requireDOB: true,
        requireAddress: false,
        requireGuardianForMinors: true,
        minAge: 0,
        allowFutureDOB: false,
        validateEmailFormat: true,
        validateMobileDuplicates: true,
      },
      display: {
        defaultView: 'list',
        cardsPerPage: 25,
        showAvatars: true,
        showCohortInfo: true,
        showEnrollmentDate: true,
        compactMode: false,
        colorCodeByStatus: true,
        showProgressBars: true,
      },
      filters: {
        rememberLastFilters: true,
        autoApplyFilters: false,
        showAdvancedFilters: true,
        defaultCourse: 'all',
        defaultCohort: 'all',
        defaultStatus: 'active',
      },
      notifications: {
        studentAdded: true,
        studentUpdated: true,
        studentDeleted: true,
        enrollmentChanges: true,
        paymentReminders: true,
        attendanceAlerts: true,
        leaveRequests: true,
        soundEnabled: false,
      },
      export: {
        defaultFormat: 'csv',
        includeMetadata: true,
        includePaymentInfo: false,
        includeAttendance: false,
        autoDownload: true,
      },
      automation: {
        autoSaveDrafts: true,
        autoDraftInterval: 3,
        confirmBeforeDelete: true,
        showDeletedCount: true,
        autoRefresh: false,
        refreshInterval: 5,
      },
      advanced: {
        enableDebugMode: false,
        cacheEnabled: true,
        maxCacheSize: 100,
        showStudentIds: true,
        enableBulkOperations: true,
        cohortAutoSync: true,
      },
    }
    setStudentSettings(defaults)
    toast({
      title: "Settings Reset",
      description: "All student settings have been reset to defaults.",
    })
  }

  // Lock body scroll when payment prompt is open (true center experience)
  useEffect(() => {
    if (!showPaymentPrompt) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [showPaymentPrompt]);

  // Student ID Generation Functions (following Course Settings pattern)
  const sanitizeStudentIdPrefix = (raw: string) => {
    const cleaned = (raw || 'STU').replace(/[^A-Za-z0-9_-]/g, '')
    return studentSettings.identity.enforceUppercase ? cleaned.toUpperCase() : cleaned
  }

  const computeNextStudentSequence = (prefix: string) => {
    if (!studentList.length) {
      return studentSettings.identity.sequenceStart || 1
    }
    let maxSeq = Math.max(1, studentSettings.identity.sequenceStart || 1) - 1
    const prefixLower = prefix.toLowerCase()
    for (const s of studentList) {
      const sid = String(s.studentId || s.id || '')
      if (sid.toLowerCase().startsWith(prefixLower)) {
        const numPart = sid.slice(prefix.length)
        const parsed = parseInt(numPart, 10)
        if (!isNaN(parsed) && parsed > maxSeq) maxSeq = parsed
      }
    }
    return maxSeq + 1
  }

  const generateStudentIdentifier = () => {
    const identity = studentSettings.identity as typeof studentSettings.identity & {
      numberingStrategy: StudentNumberingStrategy
    }
    if (identity.numberingStrategy === 'uuid') {
      // For UUID strategy, generate a unique identifier
      const value = `STU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      return identity.enforceUppercase ? value.toUpperCase() : value
    }
    const prefix = sanitizeStudentIdPrefix(identity.customIdPrefix)
    const sequence = computeNextStudentSequence(prefix)
    const padding = Math.max(2, Math.min(identity.idNumberPadding || 4, 8))
    const numericPart = String(sequence).padStart(padding, '0')
    return `${prefix}${numericPart}`
  }

  const getStudentIdHint = () => {
    const numberingStrategy = studentSettings.identity.numberingStrategy as StudentNumberingStrategy
    if (numberingStrategy === 'uuid') {
      return 'Example: STU-1234567890-abc123'
    }
    const prefix = sanitizeStudentIdPrefix(studentSettings.identity.customIdPrefix)
    const digitCount = Math.max(2, Math.min(studentSettings.identity.idNumberPadding || 4, 8))
    return `Example: ${prefix}${'0'.repeat(digitCount)} (auto-increments)`
  }

  // Helper function to refresh students from backend
  const refreshStudents = async () => {
    setStudentsLoading(true);
    setLoading(true);
    try {
      console.log('🔄 Loading students data...');
      // Force reconciliation on backend so any cohort membership updates are applied
      const res = await fetch('/api/dashboard/student/students?reconcile');
      console.log('📡 Students API Response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('📊 Students API Response data:', data);
        
        const mappedStudents = data.map((s: any) => ({
          ...s,
          id: s.id || s.studentId,
        }));
        
        console.log('✅ Mapped students data:', mappedStudents.length, 'students');
        setStudentList(mappedStudents);
      } else {
        console.warn('❌ refreshStudents: backend returned non-ok status', res.status);
      }
    } catch (error) {
      console.error('Failed to refresh students:', error);
    } finally {
      setStudentsLoading(false);
      setLoading(false);
    }
  };

  // (Removed) Manual cohort sync logic now redundant after automatic reconciliation

  // Fetch students from backend
  useEffect(() => {
    // Prefetch courses once (used by AddStudentDialog)
    const loadCourses = async () => {
      setCoursesLoading(true);
      try {
        const data = await fetchCourses();
        setCourses(Array.isArray(data) ? data : []);
      } catch {
        setCourses([]);
      } finally {
        setCoursesLoading(false);
      }                                                                                                                       
      
    };
    loadCourses();

    // Load cohorts for instructor search
    const loadCohorts = async () => {
      try {
        const data = await fetchCohorts();
        setCohorts(Array.isArray(data) ? data : []);
      } catch {
        setCohorts([]);
      }
    };
    loadCohorts();

    // Load students from backend
    refreshStudents();
    fetchAchievements()
      .then((data) => {
        console.log('✅ Loaded achievements:', data.length, 'achievements');
        setAchievements(data);
      })
      .catch((error) => {
        console.error('❌ Failed to load achievements:', error);
        setAchievements([]);
      });
    
    // Preload attendance data in the background
    const loadAttendanceData = async () => {
      try {
        console.log('🔄 Loading attendance data...');
        setAttendanceLoading(true);
        const response = await fetch('/api/dashboard/student/attendance');
        console.log('📡 Attendance API Response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('📊 Attendance API Response data:', result);
          
          if (result.success) {
            // Map MongoDB _id to id for frontend compatibility
            const mappedData = result.data.map((record: any) => ({
              ...record,
              id: record._id
            }));
            console.log('✅ Mapped attendance data:', mappedData.length, 'records');
            setAttendanceData(mappedData);
          } else {
            console.warn('⚠️ Attendance API returned success: false');
          }
        } else {
          console.error('❌ Attendance API request failed:', response.status);
        }
      } catch (error) {
        console.error('Error preloading attendance data:', error);
      } finally {
        setAttendanceLoading(false);
      }
    };
    loadAttendanceData();
  }, []);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);

  // Column management state
  const [displayedColumns, setDisplayedColumns] = useState<string[]>(['Student ID', 'Name', 'Course', 'Actions']);

  // Clean up any legacy "Batch" columns and duplicates in current state
  useEffect(() => {
    const cleaned = displayedColumns.map(col => col === 'Batch' ? 'Cohort' : col);
    // Remove duplicates (including duplicate Cohorts)
    const unique = Array.from(new Set(cleaned));
    // Only update if there were changes
    if (unique.length !== displayedColumns.length || displayedColumns.includes('Batch')) {
      setDisplayedColumns(unique);
    }
  }, []); // Run only once on mount

  // Add Student dialog state
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);
  
  // Drafts dialog state
  const [openDraftsDialog, setOpenDraftsDialog] = useState(false);
  const [draftToEdit, setDraftToEdit] = useState<Partial<Student> | null>(null);
  const [draftIdBeingEdited, setDraftIdBeingEdited] = useState<string | null>(null);
  
  // Loading states for operations
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  // Delete confirmation state
  const [pendingDelete, setPendingDelete] = useState<Student | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Leave management state handled inside shared LeaveManagement component

  // Filtered list managed by toolbar
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  // Selected for export/delete actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const allVisibleIds = useMemo(() => filteredStudents.map(s => s.id || s.studentId), [filteredStudents]);
  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id));
  };
  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? allVisibleIds : []);
  };

  // Handler functions

  // Add Student handler
  const handleAddStudent = async (student: Student) => {
    try {
      const res = await fetch('/api/dashboard/student/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
      });
      
      if (res.ok) {
        const newStudent = await res.json();
  // Update frontend state with the new student from backend
  setStudentList(prev => [newStudent, ...prev]);
  setLastAddedStudent(newStudent);
        
        // If this student was created from a draft, delete the draft
        if (draftIdBeingEdited) {
          try {
            await StudentDraftsAPI.deleteDraft(draftIdBeingEdited);
            console.log('✅ Draft deleted after student creation:', draftIdBeingEdited);
          } catch (draftError) {
            console.error('Error deleting draft after student creation:', draftError);
            // Don't throw error - student was created successfully
          }
        }
        
        // Close the dialog and reset form
        setOpenAddDialog(false);
        setFormResetKey(prev => prev + 1); // Force form reset
        setDraftIdBeingEdited(null);
        setDraftToEdit(null);
        
        // Trigger payment prompt popup (toast removed per request)
        setShowPaymentPrompt(true);
        
        // Refresh data to ensure synchronization
        setTimeout(() => refreshStudents(), 500);
      } else {
        // Handle HTTP errors
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to add student:', errorData.error);
        
        // Provide specific messaging for common errors
        let title = "❌ Failed to Add Student";
        let description = errorData.error;
        
        if (res.status === 409 && errorData.error?.includes('email already exists')) {
          title = "📧 Duplicate Email Address";
          description = "A student with this email address already exists in the system. Please use a different email or check if the student is already registered.";
        } else if (res.status === 409 && errorData.error?.includes('student ID already exists')) {
          title = "🆔 Duplicate Student ID";
          description = "A student with this ID already exists. The system will auto-generate a new ID.";
        }
        
        toast({
          title,
          description,
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      // Handle network errors
      console.error('Network error while adding student:', error);
      toast({
        title: "🌐 Network Error",
        description: "Unable to add student. Please check your connection and try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setOpenDetailsDialog(true);
  };

  const [editStudentState, setEditStudentState] = useState<Student | null>(null);
  const [openEditDialogState, setOpenEditDialogState] = useState(false);
  const handleEditStudent = (student: Student) => {
    setEditStudentState(student);
    setOpenEditDialogState(true);
  };

  const handleSaveStudent = (updatedStudent: Student) => {
    setStudentList(students =>
      students.map(s => s.id === updatedStudent.id ? { ...updatedStudent } : s)
    );
  };



  const handleAchievementAction = (type: 'like' | 'congratulate' | 'share', achievementId: string) => {
    // Achievement functionality not implemented for simplified student type
    console.log(`Achievement action ${type} for ${achievementId}`);
  };

  // Confirm and perform deletion (called from delete dialog)
  // Draft handling functions
  const handleOpenDrafts = () => {
    setOpenDraftsDialog(true);
  };

  const handleEditDraft = (draftData: Partial<Student>, draftId: string) => {
    setDraftToEdit(draftData);
    setDraftIdBeingEdited(draftId);
    setOpenAddDialog(true);
  };

  // Leave data lifecycle managed inside LeaveManagement component

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const student = pendingDelete;
    setIsDeleting(student.id);
    try {
      const res = await fetch('/api/dashboard/student/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: student.id })
      });

      if (res.ok) {
        setStudentList(prev => prev.filter(s => s.id !== student.id));
        setSelectedIds(prev => prev.filter(id => id !== (student.id || student.studentId)));
        if (selectedStudent?.id === student.id) {
          setSelectedStudent(null);
          setOpenDetailsDialog(false);
        }
        // Show success toast notification
        toast({
          title: "🗑️ Student Deleted",
          description: `${student.name} has been successfully deleted.`,
          duration: 4000,
        });
        setTimeout(() => refreshStudents(), 800);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to delete student:', errorData.error);
        toast({
          title: "❌ Failed to Delete Student",
          description: errorData.error,
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Network error while deleting student:', error);
      toast({
        title: "🌐 Network Error",
        description: "Unable to delete student. Please check your connection and try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsDeleting(null);
      setPendingDelete(null);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="responsive-dashboard-container mx-auto p-2 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-white">Loading students...</p>
          </div>
        </div>
      ) : (
        <>
          <StudentHeroSection 
            onCreateStudent={() => setOpenAddDialog(true)}
            onOpenDrafts={() => setOpenDraftsDialog(true)}
          />
          {/* Navigation Tabs */}
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-4 sm:mb-6 bg-transparent gap-1 sm:gap-2 p-0 h-auto">
              {[
                { value: 'dashboard', icon: LayoutDashboard, label: 'Analytics', shortLabel: 'Stats' },
                { value: 'students', icon: Users, label: 'Students', shortLabel: 'Students' },
                { value: 'student-attendance', icon: ClipboardList, label: 'Attendance', shortLabel: 'Attend' },
                { value: 'student-leaves', icon: Calendar, label: 'Leaves', shortLabel: 'Leaves' },
                { value: 'settings', icon: Settings, label: 'Settings', shortLabel: 'Config' },
                { value: 'achievements', icon: Trophy, label: 'Achievements', shortLabel: 'Awards', badge: true },
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 border-2 bg-transparent font-medium text-xs sm:text-sm responsive-text-xs transition-colors"
                  style={{
                    borderColor: secondaryColor,
                    color: secondaryColor,
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.getAttribute('data-state')?.includes('active')) {
                      e.currentTarget.style.backgroundColor = `${secondaryColor}15`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.getAttribute('data-state')?.includes('active')) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                  data-active-style={{
                    backgroundColor: primaryColor,
                    color: 'white',
                    borderColor: primaryColor
                  }}
                >
                  <tab.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  {tab.label !== tab.shortLabel ? (
                    <><span className="hidden lg:inline">{tab.label}</span><span className="lg:hidden">{tab.shortLabel}</span></>
                  ) : (
                    <span>{tab.label}</span>
                  )}
                  {tab.badge && <Image src="/Coming soon.svg" alt="Coming Soon" width={12} height={12} className="inline-block ml-1" />}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Dashboard Tab Content */}
            <TabsContent value="dashboard" className="space-y-4">
              <StudentStatisticsCards />
              
              {/* Student Analytics */}
              <div className="bg-card rounded-3xl shadow-xl p-6 animate-fade-in border">
                <StudentAnalytics students={studentList} loading={studentsLoading} />
              </div>
            </TabsContent>

          <TabsContent value="students">
            <div className="bg-card rounded-3xl shadow-xl p-6 animate-fade-in border">
              <AddStudentDialogFixed 
                key={formResetKey} 
                open={openAddDialog} 
                onOpenChange={(open) => {
                  setOpenAddDialog(open);
                  if (!open) {
                    setDraftToEdit(null);
                    setDraftIdBeingEdited(null);
                  }
                }} 
                onAdd={handleAddStudent} 
                courses={courses} 
                coursesLoading={coursesLoading} 
                initialStudent={draftToEdit ? draftToEdit as Student : null}
                draftId={draftIdBeingEdited}
              />
              <AddStudentDialogFixed
                open={openEditDialogState}
                onOpenChange={(open) => {
                  setOpenEditDialogState(open);
                  if (!open) {
                    // Reset edit state when dialog closes
                    setEditStudentState(null);
                  }
                }}
                onAdd={async (student) => {
                  // Update student in backend
                  setIsEditing(true);
                  try {
                    const res = await fetch('/api/dashboard/student/students', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(student)
                    });
                    
                    if (res.ok) {
                      const updated = await res.json();
                      
                      console.log('✅ Student updated successfully:', {
                        name: updated.name,
                        enrolledCourse: updated.enrolledCourse,
                        cohortId: updated.cohortId,
                        courseStartDate: updated.courseStartDate
                      });
                      
                      // Update frontend state with the updated student from backend
                      setStudentList(prev => prev.map(s => s.id === updated.id ? updated : s));
                      setOpenEditDialogState(false);
                      
                      // Reset edit state
                      setEditStudentState(null);
                      
                      // Show success toast notification
                      toast({
                        title: "✏️ Student Updated",
                        description: `${updated.name}'s information has been successfully updated.`,
                        duration: 4000,
                      });
                      
                      // Refresh immediately to ensure consistency
                      refreshStudents();
                    } else {
                      // Handle HTTP errors
                      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                      console.error('Failed to update student:', errorData.error);
                      toast({
                        title: "❌ Failed to Update Student",
                        description: errorData.error,
                        variant: "destructive",
                        duration: 5000,
                      });
                    }
                  } catch (error) {
                    // Handle network errors
                    console.error('Network error while updating student:', error);
                    toast({
                      title: "🌐 Network Error",
                      description: "Unable to update student. Please check your connection and try again.",
                      variant: "destructive",
                      duration: 5000,
                    });
                  } finally {
                    setIsEditing(false);
                  }
                }}
                initialStudent={editStudentState}
                courses={courses}
                coursesLoading={coursesLoading}
                draftId={null}
              />
              <StudentSearchFilters
                students={studentList}
                setFilteredStudents={setFilteredStudents}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                viewMode={viewMode}
                setViewMode={setViewMode}
                onAddStudent={() => setOpenAddDialog(true)}
                onImport={(items) => {
                  // merge imported items; if ids exist, prefer latest
                  setStudentList(prev => {
                    const map = new Map(prev.map(s => [s.id || s.studentId, s] as const));
                    items.forEach(it => map.set(it.id || it.studentId, { ...map.get(it.id || it.studentId), ...it } as Student));
                    return Array.from(map.values());
                  });
                }}
                selectedIds={selectedIds}
                displayedColumns={displayedColumns}
                setDisplayedColumns={setDisplayedColumns}
                onOpenDrafts={handleOpenDrafts}
                cohorts={cohorts}
                courses={courses}
              />
              
              {/* Removed manual Sync Cohort Enrollments button (automatic reconciliation now handles this) */}
              
              <StudentList
                students={filteredStudents}
                viewMode={viewMode}
                onSelectStudent={handleSelectStudent}
                onEditStudent={handleEditStudent}
                onDeleteStudent={(student) => {
                  setPendingDelete(student);
                  setShowDeleteDialog(true);
                }}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAll}
                courses={courses}
                displayedColumns={displayedColumns}
                loading={studentsLoading}
              />
            </div>
          </TabsContent>

          {/* Student Leaves Tab */}
          <TabsContent value="student-leaves">
            <LeaveManagement />
          </TabsContent>

          {/* Student Attendance Tab */}
          <TabsContent value="student-attendance">
            <AttendanceManagement 
              preloadedData={attendanceData}
              preloadedDataLoading={attendanceLoading}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="bg-card rounded-3xl shadow-xl p-6 animate-fade-in border">
              <StudentSettings 
                settings={studentSettings}
                onUpdateSetting={updateStudentSetting}
                onResetSettings={resetStudentSettings}
                onSaveSettings={saveStudentSettings}
              />
            </div>
          </TabsContent>
 
          <TabsContent value="achievements">
            {/* Content stays disabled even if the trigger is clickable */}
            <StudentAchievements 
              achievements={achievements}
              onAchievementAction={handleAchievementAction}
              disabled={true}
            />
          </TabsContent>
        </Tabs>

        <StudentDetailsDialog
          student={selectedStudent}
          open={openDetailsDialog}
          onOpenChange={setOpenDetailsDialog}
          courses={courses}
        />

        {/* <StudentEditDialog
          student={editStudentState}
          open={openEditDialogState}
          onOpenChange={setOpenEditDialogState}
          onSave={handleSaveStudent}
        /> */}

        {/* Payment details prompt after adding a student */}
        <Dialog open={showPaymentPrompt} onOpenChange={setShowPaymentPrompt}>
          <DialogContent className="max-w-md top-24 sm:top-28 translate-y-0">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold" style={{ color: primaryColor }}>Student Added</DialogTitle>
              <DialogDescription>
                {lastAddedStudent ? (
                  <span>
                    <strong className="capitalize">{lastAddedStudent.name}</strong> has been added. Would you like to update their payment details now?
                  </span>
                ) : (
                  'Student has been added. Would you like to update payment details now?'
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowPaymentPrompt(false)}>
                No
              </Button>
              <Button
                onClick={() => {
                  setShowPaymentPrompt(false);
                  window.open("https://uniq-brio-uniq-brio-payments.vercel.app/payments", "_blank");
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Yes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">Delete Student</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this student? This action cannot be undone.
                {pendingDelete ? ` "${pendingDelete.name}"` : ''}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={!!isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

          </>
        )}

        {/* Dialogs */}
        <StudentDraftsDialog
          open={openDraftsDialog}
          onOpenChange={setOpenDraftsDialog}
          onEditDraft={handleEditDraft}
        />
    </div>);
}
