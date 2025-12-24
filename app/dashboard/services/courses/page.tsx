/**
 * Course Management Page - Enhanced with Comprehensive Responsive Design
 * 
 * Responsive Breakpoints Applied:
 * - Mobile: < 640px (default styles)
 * - sm: 640px - 768px (small tablets)
 * - md: 768px - 1024px (tablets)
 * - lg: 1024px+ (desktop)
 * 
 * Key Responsive Features:
 * - Adaptive padding and spacing across all screen sizes
 * - Responsive typography (text sizes scale from xs to base/xl)
 * - Flexible grid layouts (1 col mobile → 2 cols tablet → 4 cols desktop)
 * - Responsive navigation tabs with icon sizing
 * - Adaptive dialog/modal widths for all devices
 * - Touch-friendly button and interaction sizes on mobile
 * - Responsive cards, badges, and feature sections
 * - Optimized statistics dashboard for all viewports
 * 
 * All functionality preserved - only visual responsiveness enhanced.
 */

"use client"

import { useState, useEffect, useMemo } from "react"
import { useCurrency } from "@/contexts/currency-context"
import { useCustomColors } from "@/lib/use-custom-colors"
import { useGlobalData } from "@/contexts/dashboard/global-data-context"
import { v4 as uuidv4 } from "uuid"
import Image from "next/image"

import { Button } from "@/components/dashboard/ui/button"
import { Card, CardContent } from "@/components/dashboard/ui/card"
import { toast } from "@/hooks/dashboard/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import { ColumnSelectorModal } from "@/components/dashboard/ui/ColumnSelectorModal"
import { useColumnManagement } from "@/hooks/dashboard/useColumnManagement"
import {
  Search, Plus, BookOpen, Download, Upload, Filter, ArrowUpDown,
  Trash2, Pencil, Save, X, Check, GraduationCap, Megaphone,
  BarChart3, DollarSign, CreditCard, Zap, Shield, Briefcase, ClipboardCheck, Timer, Bot,
  ChevronRight, ChevronLeft, ChevronUp, ChevronDown, RotateCcw,
  LayoutDashboard, Users, Settings
} from "lucide-react"
import { Target } from "lucide-react"
import { Switch } from "@/components/dashboard/ui/switch"
import { Label } from "@/components/dashboard/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Input } from "@/components/dashboard/ui/input"
import { Separator } from "@/components/dashboard/ui/separator"
import HeroSection from "@/components/dashboard/courses/HeroSection"
import StatisticsCards from "@/components/dashboard/courses/StatisticsCards"
import SearchAndFilters from "@/components/dashboard/courses/SearchAndFilters"
import CourseList from "@/components/dashboard/courses/CourseList"
import CohortManagement from "@/components/dashboard/courses/CohortManagement"
import DraftsDialog from "@/components/dashboard/courses/DraftsDialog"
import ConfirmationDialog from "@/components/dashboard/courses/ConfirmationDialog"
import AddCourseDialog from "@/components/dashboard/courses/CourseFormDialog"
import CourseDashboardCharts from "@/components/dashboard/courses/CourseDashboardCharts"
import CourseSettings from "@/components/dashboard/courses/CourseSettings"
import CohortSettings from "@/components/dashboard/courses/CohortSettings"
import { UpgradePlanModal } from '@/components/upgrade-plan-modal'

// Import the correct Course type
import { Course } from "@/types/dashboard/course"

type DraftType = {
  id: string
  name: string
  instructor: string
  description: string
  updatedAt: number
  level?: string
  type?: string
  price?: number
  schedule?: string
  maxStudents?: number
  location?: string
  tags?: string[]
  status?: string
  courseCategory?: string
  [key: string]: any
}

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
  members: { id: string; name: string; }[];
  location?: string;
  instructorName?: string;
}

type CourseNumberingStrategy = 'sequential' | 'uuid'




export default function EnhancedCourseManagementPage() {
  const { currency } = useCurrency();
  const { primaryColor, secondaryColor } = useCustomColors();
  const globalData = useGlobalData();
  
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
  // State management
  const [courses, setCourses] = useState<Course[]>([])
  const [studentCount, setStudentCount] = useState<number | null>(null);
  // Fetch student count from API (dashboard logic)
  useEffect(() => {
    fetch("/api/dashboard/services/user-management/students")
      .then((res) => res.json())
      .then((data) => {
        if (data.count !== undefined) {
          setStudentCount(data.count);
        } else if (data.numStudents !== undefined) {
          setStudentCount(data.numStudents);
        } else {
          setStudentCount(null);
        }
      })
      .catch(() => setStudentCount(null));
  }, []);
  const [drafts, setDrafts] = useState<DraftType[]>([])
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [isEditMode, setIsEditMode] = useState(false)
  const [editCourseId, setEditCourseId] = useState<string | null>(null)
  // Currency now comes from global context - no local state needed
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const [filterAction, setFilterAction] = useState<string | null>(null)
  const [showCohortInfo, setShowCohortInfo] = useState(false)
  
  // Filter states
  const [selectedFilters, setSelectedFilters] = useState({
    level: [] as string[],
    type: [] as string[],
    status: [] as string[],
    priceRange: [0, 100000] as [number, number],
    category: [] as string[],
  })

  const [pendingFilters, setPendingFilters] = useState({ ...selectedFilters })
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  
  // Dialog states
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false)
  const [isViewCourseDialogOpen, setIsViewCourseDialogOpen] = useState(false)
  const [isDraftsDialogOpen, setIsDraftsDialogOpen] = useState(false)
  const [isMarketingDialogOpen, setIsMarketingDialogOpen] = useState(false)
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false)
  const [isFinancialDialogOpen, setIsFinancialDialogOpen] = useState(false)
  
  // Restriction state for upgrade modal
  const [isRestricted, setIsRestricted] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  
  // Navigation tab state
  const [currentTab, setCurrentTab] = useState("dashboard")
  const isSettingsTabDisabled = true
  
  const createCourseSettingsDefaults = () => ({
    display: {
      defaultView: 'grid',
      cardsPerPage: 12,
      showThumbnails: true,
      compactMode: false,
      showStats: true,
    },
    identity: {
      customIdPrefix: 'COURSE',
      numberingStrategy: 'sequential' as CourseNumberingStrategy,
      idNumberPadding: 4,
      sequenceStart: 1,
      allowManualIds: false,
      enforceUppercase: true,
      showIdBadges: true,
    },
    filters: {
      rememberLastFilters: true,
      autoApplyFilters: false,
      showAdvancedFilters: false,
    },
    notifications: {
      courseCreated: true,
      courseUpdated: true,
      courseDeleted: true,
      cohortChanges: true,
      soundEnabled: false,
    },
    export: {
      defaultFormat: 'csv',
      includeMetadata: true,
      autoDownload: true,
    },
    automation: {
      autoDraftSave: true,
      autoDraftInterval: 5,
      confirmBeforeDelete: true,
      showDeletedCount: true,
    },
    advanced: {
      enableDebugMode: false,
      cacheEnabled: true,
      maxCacheSize: 100,
    },
    enrollment: {
      showCapacityAlerts: true,
      lowCapacityThreshold: 3,
      showCohortCounts: true,
    },
  })

  type CourseSettings = ReturnType<typeof createCourseSettingsDefaults>

  // Settings state now always uses defaults
  const [courseSettings, setCourseSettings] = useState<CourseSettings>(createCourseSettingsDefaults);

  // Function to update specific setting
  const updateSetting = (category: string, key: string, value: any) => {
    setCourseSettings(prev => {
      const typedCategory = category as keyof CourseSettings
      return {
        ...prev,
        [typedCategory]: {
          ...prev[typedCategory],
          [key]: value,
        },
      }
    });
  };

  // Function to save settings after batch update
  const saveSettings = () => {
    toast({
      title: "Settings Updated",
      description: "Your preferences have been saved.",
    });
  };

  // Function to reset all settings
  const resetSettings = () => {
    const defaultSettings = createCourseSettingsDefaults();
    setCourseSettings(defaultSettings);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('courseSettings');
    }
    toast({
      title: "Settings Reset",
      description: "All settings have been restored to defaults.",
    });
  };

  const createCohortSettingsDefaults = () => ({
    display: {
      defaultView: 'list',
      showInstructor: true,
      showMemberCount: true,
      showDateRange: true,
      colorByStatus: true,
      highlightFull: true,
    },
    sorting: {
      defaultSort: 'name',
      sortOrder: 'asc',
      groupByCourse: false,
      groupByStatus: false,
    },
    capacity: {
      showCapacityBar: true,
      warnAtPercent: 80,
      enableWarnings: true,
      blockWhenFull: true,
    },
    members: {
      allowDuplicates: false,
      autoAssignIds: true,
      showMemberDetails: true,
      requireApproval: false,
    },
    sync: {
      autoSync: true,
      syncInterval: 5,
      conflictResolution: 'prompt',
      enableRealtime: false,
    },
    notifications: {
      cohortCreated: true,
      cohortUpdated: true,
      cohortDeleted: true,
      memberAdded: true,
      memberRemoved: true,
      capacityWarnings: true,
      soundEnabled: false,
    },
    advanced: {
      enableDebugMode: false,
      cacheEnabled: true,
      showArchivedCohorts: false,
    },
    identity: {
      prefixSource: 'course-name' as const,
      customPrefix: 'COHR',
      idNumberPadding: 4,
      allowManualIds: false,
      enforceUppercase: true,
    },
    inheritance: {
      inheritScheduleFromCourse: true,
      inheritInstructorFromCourse: true,
      inheritLocationFromCourse: true,
      syncCapacityWithCourse: true,
      defaultCapacityFallback: 12,
    },
  })

  type CohortSettings = ReturnType<typeof createCohortSettingsDefaults>

  // Cohort settings state now always uses defaults
  const [cohortSettings, setCohortSettings] = useState<CohortSettings>(createCohortSettingsDefaults);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('courseSettings');
      localStorage.removeItem('cohortSettings');
    }
  }, []);

  // Function to update specific cohort setting
  const updateCohortSetting = (category: string, key: string, value: any) => {
    setCohortSettings(prev => {
      const typedCategory = category as keyof CohortSettings
      return {
        ...prev,
        [typedCategory]: {
          ...prev[typedCategory],
          [key]: value,
        },
      }
    });
  };

  // Function to save cohort settings after batch update
  const saveCohortSettings = () => {
    toast({
      title: "Cohort Settings Updated",
      description: "Your preferences have been saved.",
    });
  };

  // Function to reset cohort settings
  const resetCohortSettings = () => {
    const defaultSettings = createCohortSettingsDefaults();
    setCohortSettings(defaultSettings);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cohortSettings');
    }
    toast({
      title: "Cohort Settings Reset",
      description: "All cohort settings have been restored to defaults.",
    });
  };

  // State for showing/hiding cohort settings panel
  const [showCohortSettings, setShowCohortSettings] = useState(false);
  
  // Column management using the hook
  const columnManagement = useColumnManagement('courses')

  // Selection state for export
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])

  const toggleCourseSelect = (courseId: string, selected: boolean) => {
    setSelectedCourseIds((prev) => selected ? Array.from(new Set([...prev, courseId])) : prev.filter(id => id !== courseId))
  }

  const toggleAllVisible = (courseIds: string[], selected: boolean) => {
    setSelectedCourseIds((prev) => selected ? Array.from(new Set([...prev, ...courseIds])) : prev.filter(id => !courseIds.includes(id)))
  }

  const getCourseId = (c: Course, i: number) => (c as any).id || (c as any)._id || (c as any).courseId || (c as any).customId || `course-${i}`

  const getSelectedCourses = () => {
    const idSet = new Set(selectedCourseIds)
    return filteredAndSortedCourses.filter((c, i) => idSet.has(getCourseId(c, i)))
  }

  const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const sanitizeCourseIdPrefix = (rawPrefix: string) => {
    const fallback = 'COURSE'
    const cleaned = (rawPrefix || fallback).replace(/[^A-Za-z0-9_-]/g, '') || fallback
    return courseSettings.identity.enforceUppercase ? cleaned.toUpperCase() : cleaned
  }

  const computeNextCourseSequence = (prefix: string) => {
    if (!Array.isArray(courses)) {
      return courseSettings.identity.sequenceStart || 1
    }
    const regex = new RegExp(`^${escapeRegex(prefix)}(\\d+)$`, 'i')
    let maxSeq = Math.max(1, courseSettings.identity.sequenceStart || 1) - 1
    courses.forEach((course, index) => {
      const identifier = (course.courseId || course.customId || course.id || `course-${index}`).toString()
      const match = identifier.replace(/\s+/g, '').match(regex)
      if (match) {
        const value = parseInt(match[1], 10)
        if (!Number.isNaN(value)) {
          maxSeq = Math.max(maxSeq, value)
        }
      }
    })
    return maxSeq + 1
  }

  const generateCourseIdentifier = () => {
    const identity = courseSettings.identity as typeof courseSettings.identity & {
      numberingStrategy: CourseNumberingStrategy
    }
    if (identity.numberingStrategy === 'uuid') {
      const value = uuidv4()
      return identity.enforceUppercase ? value.toUpperCase() : value
    }
    const prefix = sanitizeCourseIdPrefix(identity.customIdPrefix)
    const sequence = computeNextCourseSequence(prefix)
    const padding = Math.max(2, Math.min(identity.idNumberPadding || 4, 8))
    const numericPart = String(sequence).padStart(padding, '0')
    return `${prefix}${numericPart}`
  }

  const getCourseIdHint = () => {
    const numberingStrategy = courseSettings.identity.numberingStrategy as CourseNumberingStrategy
    if (numberingStrategy === 'uuid') {
      return 'Example: UUID such as 12AB-34CD-56EF'
    }
    const prefix = sanitizeCourseIdPrefix(courseSettings.identity.customIdPrefix)
    const digitCount = Math.max(2, Math.min(courseSettings.identity.idNumberPadding || 4, 8))
    return `Example: ${prefix}${'0'.repeat(digitCount)} (auto-increments)`
  }

  const coursesToCsv = (rows: Course[]) => {
    const headers = ["id","courseId","name","instructor","location","type","level","price","status","courseCategory","maxStudents","duration"]
    const escape = (v: any) => {
      if (v === null || v === undefined) return ""
      const s = String(v)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}` + `"` : s
    }
    const body = rows.map((c:any) => headers.map(h => escape(c[h])).join(",")).join("\n")
    return headers.join(",") + "\n" + body
  }

  const downloadCsv = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportSelected = () => {
    const rows = getSelectedCourses()
    const csv = coursesToCsv(rows)
    downloadCsv(csv, `courses-selected-${Date.now()}.csv`)
  }

  const exportAll = () => {
    const csv = coursesToCsv(filteredAndSortedCourses)
    downloadCsv(csv, `courses-all-${Date.now()}.csv`)
  }

  // Column management is now handled by the useColumnManagement hook
  
  // New course form state
  const [newCourseForm, setNewCourseForm] = useState({
    id: '',
    name: '',
    instructor: '',
    description: '',
    level: 'Beginner',
    type: 'Online',
    duration: '',
    price: '',
    paymentCategory: '',
    schedule: '',
    maxStudents: '',
    location: '',
    tags: ['Beginner'],
    schedulePeriod: { startDate: '', endDate: '', totalWeeks: '18' },
    sessionDetails: { sessionDuration: '', maxClasses: '18' },
    frequencyDetails: { selectedDays: [] as string[], dayTimes: {} as Record<string, any> },
    frequencies: [] as { days: string[]; start: string; end: string; sessions: string }[],
    chapters: [{ name: '', description: '' }],
    referralCode: '',
    commissionRate: '',
    referralStart: '',
    referralEnd: '',
    referralStatus: 'Inactive',
    faqs: [{ question: '', answer: '', isEditing: false }],
    reminderSettings: {
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: true,
      customSchedule: [] as {
        type: string;
        daysBefore: string;
        hoursBefore: string;
        timeOfDay: string;
        enabled: boolean;
        customType?: string;
      }[],
      frequency: '',
      customDays: '',
      customInterval: ''
    },
    freeGifts: [] as string[],
    status: "Active",
    courseCategory: "Regular"
  })
  
  // Confirmation dialog state
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    isOpen: boolean,
    title: string,
    message: string,
    onConfirm: () => void,
    itemName?: string,
    confirmButtonText?: string
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    itemName: undefined,
    confirmButtonText: undefined
  })

  // Function to refetch drafts
  const refetchDrafts = async () => {
    try {
      console.log('🔄 Refetching drafts from API...');
      const response = await fetch("/api/dashboard/services/courses/drafts");
      const draftsData = await response.json();
      
      console.log(' Raw drafts API response:', draftsData);
      
      if (draftsData.success && draftsData.drafts) {
        console.log(' Refetched drafts (success):', draftsData.drafts.length, 'drafts');
        console.log(' Draft details:', draftsData.drafts.map((d: any) => ({ id: d.id, name: d.name, updatedAt: d.updatedAt })));
        setDrafts(draftsData.drafts);
      } else if (Array.isArray(draftsData)) {
        console.log(' Refetched drafts (array):', draftsData.length, 'drafts');
        console.log(' Draft details:', draftsData.map((d: any) => ({ id: d.id, name: d.name, updatedAt: d.updatedAt })));
        setDrafts(draftsData);
      } else {
        console.log(' No drafts found during refetch');
        setDrafts([]);
      }
    } catch (error) {
      console.error('❌ Error refetching drafts:', error);
    }
  };

  // Event listener for opening drafts dialog and draft saved events
  useEffect(() => {
    const handleOpenDrafts = async () => {
      // Refetch drafts before opening the dialog to ensure latest data
      await refetchDrafts();
      setIsDraftsDialogOpen(true);
    };

    const handleDraftSaved = async () => {
      // Refetch drafts when a draft is saved
      console.log('Draft saved event received, refetching drafts...');
      await refetchDrafts();
    };

    const handleDraftDeleted = (event: CustomEvent) => {
      // Remove draft from state when deleted
      const { draftId } = event.detail;
      console.log(' Draft deleted event received, removing draft:', draftId);
      setDrafts(prevDrafts => prevDrafts.filter(d => d.id !== draftId));
    };
    
    window.addEventListener('openDraftsDialog', handleOpenDrafts);
    window.addEventListener('draftSaved', handleDraftSaved);
    window.addEventListener('draftDeleted', handleDraftDeleted as EventListener);
    
    return () => {
      window.removeEventListener('openDraftsDialog', handleOpenDrafts);
      window.removeEventListener('draftSaved', handleDraftSaved);
      window.removeEventListener('draftDeleted', handleDraftDeleted as EventListener);
    };
  }, []);

  // Load initial data - use prefetched global data first, then fetch page-specific data
  useEffect(() => {
    // Use prefetched data immediately
    if (globalData.isInitialized && globalData.courses.length > 0) {
      setCourses(globalData.courses as Course[]);
      setCohorts(globalData.cohorts as Cohort[]);
      setStudentCount(globalData.students.length);
    }
    
    // Fetch page-specific data (drafts only)
    setLoading(true);
    fetch("/api/dashboard/services/courses/drafts")
      .then(res => res.ok ? res.json() : [])
      .catch(() => [])
      .then((draftsData) => {
        // Handle drafts data
        console.log(' Raw drafts response during initial load:', draftsData);
        if (draftsData.success && draftsData.drafts) {
          console.log(' Setting drafts from success response:', draftsData.drafts.length, 'drafts');
          setDrafts(draftsData.drafts);
        } else if (Array.isArray(draftsData)) {
          console.log(' Setting drafts from array response:', draftsData.length, 'drafts');
          setDrafts(draftsData);
        } else {
          console.log(' No drafts found during initial load, setting empty array');
          setDrafts([]);
        }
        
        setLoading(false);
      });
  }, [globalData.isInitialized, globalData.courses, globalData.cohorts, globalData.students]);

  // Calculate statistics with safety checks
  const stats = {
    totalCourses: Array.isArray(courses) ? courses.length : 0,
    activeCourses: Array.isArray(courses) ? courses.filter(c => c.status === "Active").length : 0,
    totalStudents: studentCount,
    // Note: price stores the amount in the academy's selected currency
    totalRevenue: Array.isArray(courses) ? courses.reduce((sum, c) => sum + ((c.price || (c as any).priceINR || 0) * (c.enrolledStudents || 0)), 0) : 0,
    averageRating: Array.isArray(courses) && courses.length > 0 ? courses.reduce((sum, c) => sum + (c.rating || 0), 0) / courses.length : 0,
    completionRate: Array.isArray(courses) && courses.length > 0 ? courses.reduce((sum, c) => sum + (c.completionRate || 0), 0) / courses.length : 0,
  }

  // Filter and sort courses with safety checks
  const filteredAndSortedCourses = useMemo(() => {
    if (!Array.isArray(courses)) {
      return [];
    }
    
    return courses.filter((course) => {
      const matchesSearch = course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.tags && Array.isArray(course.tags) && course.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase())))

      const matchesLevel = selectedFilters.level.length === 0 || selectedFilters.level.includes(course.level)
      const matchesType = selectedFilters.type.length === 0 || selectedFilters.type.includes(course.type)
      const matchesStatus = selectedFilters.status.length === 0 || selectedFilters.status.includes(course.status)

      // Note: price stores the amount in the academy's selected currency
      const price = course.price || (course as any).priceINR || 0
      const matchesPrice = price >= selectedFilters.priceRange[0] && price <= selectedFilters.priceRange[1]

      const matchesTab = activeTab === "all" || course.status?.toLowerCase() === activeTab.toLowerCase()

      return matchesSearch && matchesLevel && matchesType && matchesStatus && matchesPrice && matchesTab
    }).sort((a, b) => {
      const aValue = a[sortBy as keyof Course]
      const bValue = b[sortBy as keyof Course]

      if (typeof aValue === "string" && typeof bValue === "string") {
        if (sortOrder === "asc") {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        if (sortOrder === "asc") {
          return aValue - bValue
        } else {
          return bValue - aValue
        }
      }
      return 0
    })
  }, [courses, searchTerm, selectedFilters, activeTab, currency, sortBy, sortOrder])

  // Handlers
  const handleSaveDraft = async () => {
    // Save draft implementation
  }

  const handleBulkAction = (action: string, selectedCourseIds: string[]) => {
    // Bulk action implementation
  }

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course)
    setIsViewCourseDialogOpen(true)
  }

  const handleEditCourse = (course: Course) => {
    setIsEditMode(true);
    setEditCourseId(course.id);
    setNewCourseForm({
      id: course.id || '',
      name: course.name || '',
      instructor: course.instructor || '',
      description: course.description || '',
      level: course.level || 'Beginner',
      type: course.type || 'Online',
      duration: course.duration !== undefined ? String(course.duration) : '',
      price: course.price !== undefined ? String(course.price) : '',
      paymentCategory: course.paymentCategory || '',
      schedule: course.schedule || '',
      maxStudents: course.maxStudents !== undefined ? String(course.maxStudents) : '',
      location: course.location || '',
      tags: Array.isArray(course.tags) && course.tags.length > 0 ? course.tags : ['Beginner'],
      schedulePeriod: course.schedulePeriod || { startDate: '', endDate: '', totalWeeks: '18' },
      sessionDetails: course.sessionDetails || { sessionDuration: '', maxClasses: '18' },
      frequencyDetails: course.frequencyDetails || { selectedDays: [] as string[], dayTimes: {} as Record<string, any> },
      frequencies: course.frequencies || [] as { days: string[]; start: string; end: string; sessions: string }[],
      chapters: course.chapters || [{ name: '', description: '' }],
      referralCode: course.referralCode || '',
      commissionRate: course.commissionRate || '',
      referralStart: course.referralStart || '',
      referralEnd: course.referralEnd || '',
      referralStatus: course.referralStatus || 'Inactive',
      faqs: course.faqs || [{ question: '', answer: '', isEditing: false }],
      reminderSettings: course.reminderSettings
        ? {
            ...course.reminderSettings,
            frequency: course.reminderSettings.frequency ?? '',
            customDays: course.reminderSettings.customDays ?? '',
            customInterval: course.reminderSettings.customInterval ?? '',
          }
        : {
            pushEnabled: true,
            emailEnabled: true,
            smsEnabled: true,
            customSchedule: [] as {
              type: string;
              daysBefore: string;
              hoursBefore: string;
              timeOfDay: string;
              enabled: boolean;
              customType?: string;
            }[],
            frequency: '',
            customDays: '',
            customInterval: ''
          },
      freeGifts: course.freeGifts || [] as string[],
      status: course.status || 'Active',
      courseCategory: course.courseCategory || 'Regular',
    });
    setIsAddCourseDialogOpen(true);
  }

  const handleEditDraft = (draft: DraftType) => {
    setIsEditMode(true);
    setEditCourseId(draft.id);
    
    // Generate a new course ID for the draft conversion
    const newCourseId = generateCourseIdentifier();
    
    // Convert draft data to course form format - only include fields that exist in the draft
    const formData: any = {
      id: newCourseId, // Use new course ID instead of draft ID
      status: 'Active' // Set status to Active when converting draft to course
    };
    
    // Only populate fields that actually exist in the draft (no auto-population with defaults)
    if (draft.name) formData.name = draft.name;
    if (draft.title) formData.title = draft.title;
    if (draft.instructor) formData.instructor = draft.instructor;
    if (draft.instructorId) formData.instructorId = draft.instructorId;
    if (draft.description) formData.description = draft.description;
    if (draft.level) formData.level = draft.level;
    if (draft.type) formData.type = draft.type;
    if (draft.duration !== undefined && draft.duration !== null) formData.duration = String(draft.duration);
    if (draft.price !== undefined && draft.price !== null) formData.price = String(draft.price);
    if (draft.priceINR !== undefined && draft.priceINR !== null) formData.price = String(draft.priceINR);
    if (draft.paymentCategory) formData.paymentCategory = draft.paymentCategory;
    if (draft.schedule) formData.schedule = draft.schedule;
    if (draft.maxStudents !== undefined && draft.maxStudents !== null) formData.maxStudents = String(draft.maxStudents);
    if (draft.location) formData.location = draft.location;
    if (draft.category) formData.category = draft.category;
    if (draft.subcategory) formData.subcategory = draft.subcategory;
    if (draft.thumbnail) formData.thumbnail = draft.thumbnail;
    if (draft.courseCategory) formData.courseCategory = draft.courseCategory;
    if (Array.isArray(draft.tags) && draft.tags.length > 0) formData.tags = draft.tags;
    if (draft.schedulePeriod) formData.schedulePeriod = draft.schedulePeriod;
    if (draft.sessionDetails) formData.sessionDetails = draft.sessionDetails;
    if (draft.frequencyDetails) formData.frequencyDetails = draft.frequencyDetails;
    if (Array.isArray(draft.frequencies) && draft.frequencies.length > 0) formData.frequencies = draft.frequencies;
    if (Array.isArray(draft.chapters) && draft.chapters.length > 0) formData.chapters = draft.chapters;
    if (draft.referralCode) formData.referralCode = draft.referralCode;
    if (draft.commissionRate) formData.commissionRate = draft.commissionRate;
    if (draft.referralStart) formData.referralStart = draft.referralStart;
    if (draft.referralEnd) formData.referralEnd = draft.referralEnd;
    if (draft.referralStatus) formData.referralStatus = draft.referralStatus;
    if (Array.isArray(draft.faqs) && draft.faqs.length > 0) formData.faqs = draft.faqs;
    if (draft.reminderSettings) formData.reminderSettings = draft.reminderSettings;
    if (Array.isArray(draft.freeGifts) && draft.freeGifts.length > 0) formData.freeGifts = draft.freeGifts;
    
    setNewCourseForm(formData);
    
    // Close drafts dialog and open course form dialog
    setIsDraftsDialogOpen(false);
    setIsAddCourseDialogOpen(true);
  }

  const handleDeleteDraft = async (draft: DraftType) => {
    try {
      const response = await fetch(`/api/dashboard/services/courses/drafts?id=${draft.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove the draft from state
        setDrafts(prevDrafts => prevDrafts.filter(d => d.id !== draft.id));
        toast({
          title: "Draft Deleted",
          description: `${draft.name} has been deleted successfully.`,
        });
      } else {
        throw new Error(data.error || 'Failed to delete draft');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete draft",
        variant: "destructive",
      });
    }
  }

  const handleDeleteCourse = async (course: Course) => {
    // First, check if there are any cohorts associated with this course
    const associatedCohorts = cohorts.filter(cohort => 
      cohort.courseId === course.id || cohort.courseId === course.courseId
    );

    try {
      const response = await fetch('/api/dashboard/services/courses', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: course.id,
          cascadeDelete: true // Flag to indicate cascade deletion
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove the course from the state
        setCourses(prevCourses => prevCourses.filter(c => c.id !== course.id));
        
        // Remove all associated cohorts from the state
        if (associatedCohorts.length > 0) {
          setCohorts(prevCohorts => prevCohorts.filter(cohort => 
            cohort.courseId !== course.id && cohort.courseId !== course.courseId
          ));
        }
        
        const deletedCohortsCount = associatedCohorts.length;
        const message = deletedCohortsCount > 0 
          ? `${course.name} and ${deletedCohortsCount} associated cohort${deletedCohortsCount > 1 ? 's' : ''} have been deleted successfully.`
          : `${course.name} has been deleted successfully.`;
        
        toast({
          title: "Course Deleted",
          description: message,
        });
      } else {
        throw new Error(data.error || 'Failed to delete course');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete course",
        variant: "destructive",
      });
    }
  };

  const showDeleteConfirmation = (title: string, message: string, onConfirm: () => void, itemName?: string, confirmButtonText?: string) => {
    setDeleteConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      itemName,
      confirmButtonText
    })
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-4 md:py-6 space-y-2 sm:space-y-4 md:space-y-6 max-w-full overflow-x-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-white">Loading courses...</p>
            </div>
          </div>
        ) : (
          <>
            <HeroSection 
              onCreateCourse={() => {
                if (isRestricted) { setUpgradeOpen(true); return; }
                setIsEditMode(false);
                setEditCourseId(null);
                setIsAddCourseDialogOpen(true);
              }}
              onOpenDrafts={() => setIsDraftsDialogOpen(true)}
              onOpenMarketing={() => setIsMarketingDialogOpen(true)}
            />

            {/* Navigation Tabs */}
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-3 sm:mb-4 md:mb-6 bg-transparent gap-1 sm:gap-2 p-0 h-auto">
                <TabsTrigger 
                  value="dashboard" 
                  className="flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border-2 bg-transparent text-xs sm:text-sm md:text-base font-medium data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent"
                  style={{
                    borderColor: secondaryColor,
                    color: secondaryColor,
                    ...(currentTab === 'dashboard' ? { backgroundColor: primaryColor, color: 'white', borderColor: 'transparent' } : {})
                  }}
                >
                  <LayoutDashboard className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                  <span className="hidden xs:inline sm:inline">Analytics</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="courses" 
                  className="flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border-2 bg-transparent text-xs sm:text-sm md:text-base font-medium data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent"
                  style={{
                    borderColor: secondaryColor,
                    color: secondaryColor,
                    ...(currentTab === 'courses' ? { backgroundColor: primaryColor, color: 'white', borderColor: 'transparent' } : {})
                  }}
                >
                  <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                  <span className="hidden xs:inline sm:inline">Courses</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="cohorts" 
                  className="flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border-2 bg-transparent text-xs sm:text-sm md:text-base font-medium data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent"
                  style={{
                    borderColor: secondaryColor,
                    color: secondaryColor,
                    ...(currentTab === 'cohorts' ? { backgroundColor: primaryColor, color: 'white', borderColor: 'transparent' } : {})
                  }}
                >
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                  <span className="hidden xs:inline sm:inline">Cohorts</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  aria-disabled={isSettingsTabDisabled}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base font-medium border-2 border-black/60 bg-gray-100 text-gray-700 transition-colors data-[state=active]:border-black data-[state=active]:bg-gray-300 data-[state=active]:text-gray-900 hover:border-black hover:bg-gray-200 hover:text-gray-900"
                >
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                  <span className="hidden xs:inline sm:inline">Settings</span>
                </TabsTrigger>
              </TabsList>

              {/* Dashboard Tab Content */}
              <TabsContent value="dashboard" className="space-y-2 sm:space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-500">
                <CardContent className="p-2 sm:p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm md:text-base font-medium text-green-600">Active Courses</p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-900">{Array.isArray(courses) ? courses.filter(c => c.status === "Active").length : 0}</p>
                    </div>
                    <svg className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2l4-4" /></svg>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-500">
                <CardContent className="p-2 sm:p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm md:text-base font-medium text-purple-600">Total Cohorts</p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-900">{Array.isArray(cohorts) ? cohorts.length : 0}</p>
                    </div>
                    <svg className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-500">
                <CardContent className="p-2 sm:p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm md:text-base font-medium text-blue-600">Total Students</p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-900">{studentCount !== null ? studentCount : '-'}</p>
                    </div>
                    <svg className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20h6M3 20h5v-2a4 4 0 013-3.87M16 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-500">
                <CardContent className="p-2 sm:p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm md:text-base font-medium text-orange-600">Revenue ({currency})</p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-orange-900">{Array.isArray(courses) ? courses.reduce((sum, c) => sum + ((c.price || (c as any).priceINR || 0) * (c.enrolledStudents || 0)), 0) : 0}</p>
                    </div>
                    <svg className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3s3-1.343 3-3s-1.343-3-3-3zm0 0V4m0 10v4" /></svg>
                  </div>
                </CardContent>
              </Card>
            </div>

                {/* Charts Section */}
                <CourseDashboardCharts courses={courses} currency={currency} />

                {/* Enhanced Coming Soon Features */}
                <div className="mt-4 sm:mt-6 md:mt-8">
                  <div className="text-center mb-4 sm:mb-6 md:mb-8">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                      Coming Soon Features
                    </h3>
                    <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-white max-w-2xl mx-auto px-2">
                      Powerful tools to revolutionize your course management experience
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">

                    <Card className="relative overflow-hidden bg-gradient-to-br from-yellow-50 via-yellow-100 to-orange-200 dark:from-yellow-950/30 dark:via-yellow-900/30 dark:to-orange-900/30 border-0 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <CardContent className="p-5 text-center relative z-10">
                        <div className="bg-white dark:bg-gray-800 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                          <Bot className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-yellow-600 dark:text-yellow-500" />
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-gray-800 dark:text-white mb-2">
                          AI Assistant 
                          <span className="block mt-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 text-[10px] sm:text-xs rounded-full font-medium">
                            🤖 Smart
                          </span>
                        </h3>
                        <p className="text-[10px] sm:text-xs text-gray-600 dark:text-white leading-relaxed">
                          Intelligent course recommendations
                        </p>
                        <div className="mt-2 sm:mt-3 flex justify-center">
                          <div className="w-8 sm:w-10 h-0.5 bg-gradient-to-r from-yellow-400 to-orange-600 rounded-full"></div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 via-green-100 to-emerald-200 dark:from-green-950/30 dark:via-green-900/30 dark:to-emerald-900/30 border-0 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <CardContent className="p-3 sm:p-4 md:p-5 text-center relative z-10">
                        <div className="bg-white dark:bg-gray-800 rounded-full w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                          <Target className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-green-600 dark:text-green-500" />
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-gray-800 dark:text-white mb-2">
                          Gamification 
                          <span className="block mt-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 text-[10px] sm:text-xs rounded-full font-medium">
                            🎯 Rewards
                          </span>
                        </h3>
                        <p className="text-[10px] sm:text-xs text-gray-600 dark:text-white leading-relaxed">
                          Badges, points & achievements
                        </p>
                        <div className="mt-2 sm:mt-3 flex justify-center">
                          <div className="w-8 sm:w-10 h-0.5 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full"></div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-pink-100 to-rose-200 dark:from-pink-950/30 dark:via-pink-900/30 dark:to-rose-900/30 border-0 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-rose-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <CardContent className="p-3 sm:p-4 md:p-5 text-center relative z-10">
                        <div className="bg-white dark:bg-gray-800 rounded-full w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                          <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-pink-600 dark:text-pink-500" />
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-gray-800 dark:text-white mb-2">
                          Assignments 
                          <span className="block mt-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-400 text-[10px] sm:text-xs rounded-full font-medium">
                            � Auto
                          </span>
                        </h3>
                        <p className="text-[10px] sm:text-xs text-gray-600 dark:text-white leading-relaxed">
                          Automated grading system
                        </p>
                        <div className="mt-2 sm:mt-3 flex justify-center">
                          <div className="w-8 sm:w-10 h-0.5 bg-gradient-to-r from-pink-400 to-rose-600 rounded-full"></div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-200 dark:from-blue-950/30 dark:via-blue-900/30 dark:to-cyan-900/30 border-0 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <CardContent className="p-3 sm:p-4 md:p-5 text-center relative z-10">
                        <div className="bg-white dark:bg-gray-800 rounded-full w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                          <Timer className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-blue-600 dark:text-blue-500" />
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-gray-800 dark:text-white mb-2">
                          Time Tracker 
                          <span className="block mt-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-[10px] sm:text-xs rounded-full font-medium">
                            ⏱️ Track
                          </span>
                        </h3>
                        <p className="text-[10px] sm:text-xs text-gray-600 dark:text-white leading-relaxed">
                          Study duration analytics
                        </p>
                        <div className="mt-2 sm:mt-3 flex justify-center">
                          <div className="w-8 sm:w-10 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-600 rounded-full"></div>
                        </div>
                      </CardContent>
                    </Card>

                  </div>
                </div>
              </TabsContent>

              {/* Courses Tab Content */}
              <TabsContent value="courses" className="space-y-2 sm:space-y-4">
                <Card>
                  <CardContent className="p-2 sm:p-4 md:p-6">
                    <SearchAndFilters 
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
                      courses={courses}
                      setCourses={setCourses}
                      filteredCourses={filteredAndSortedCourses}
                      courseTypeOptions={['Offline', 'Online', 'Hybrid']}
                      selectedCount={selectedCourseIds.length}
                      draftsCount={drafts.length}
                      onExport={() => {
                        const selected = getSelectedCourses();
                        const rows = selected.length > 0 ? selected : filteredAndSortedCourses;
                        const csv = coursesToCsv(rows);
                        downloadCsv(csv, selected.length > 0 ? `courses-selected-${Date.now()}.csv` : `courses-all-${Date.now()}.csv`);
                      }}
                      onCreateCourse={() => {
                        if (isRestricted) { setUpgradeOpen(true); return; }
                        setIsEditMode(false);
                        setEditCourseId(null);
                        const generatedId = generateCourseIdentifier();
                        setNewCourseForm(prev => ({
                          ...prev,
                          id: generatedId,
                          courseId: generatedId,
                          level: prev.level || 'Beginner',
                          type: prev.type || 'Online',
                          tags: prev.tags?.length ? prev.tags : ['Beginner'],
                          status: prev.status || 'Active',
                          courseCategory: prev.courseCategory || 'Regular'
                        }));
                        setIsAddCourseDialogOpen(true);
                      }}
                      onOpenDrafts={() => setIsDraftsDialogOpen(true)}
                    />
                    
                    {/* Results Counter */}
                    <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3 md:mb-4 p-2 sm:p-3 rounded-lg border" style={{ background: `linear-gradient(to right, ${primaryColor}0D, ${secondaryColor}0D)`, borderColor: `${primaryColor}33` }}>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                        <span className="text-xs sm:text-sm font-medium" style={{ color: primaryColor }}>
                          {filteredAndSortedCourses.length} course{filteredAndSortedCourses.length !== 1 ? 's' : ''} found
                        </span>
                      </div>
                      {/* Column Selection Button - only show in list view */}
                      {viewMode === 'list' && (
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={columnManagement.openColumnSelector}
                            className="h-7 w-7 sm:h-8 sm:w-8 bg-opacity-10"
                            style={{ borderColor: `${primaryColor}33`, backgroundColor: `${primaryColor}0D`, color: primaryColor }}
                            title="Column Selection"
                          >
                            <GridIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="overflow-x-auto">
                      <CourseList 
                        courses={filteredAndSortedCourses}
                        viewMode={viewMode}
                        onCourseClick={handleCourseClick}
                        onEditCourse={handleEditCourse}
                        onDeleteCourse={handleDeleteCourse}
                        cohorts={cohorts}
                        displayedColumns={columnManagement.displayedColumns}
                        selectedCourseIds={selectedCourseIds}
                        onToggleCourseSelect={toggleCourseSelect}
                        onToggleAllVisible={toggleAllVisible}
                        showIdBadges={courseSettings.identity.showIdBadges}
                        enrollmentSettings={courseSettings.enrollment}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Cohorts Tab Content */}
              <TabsContent value="cohorts" className="space-y-2 sm:space-y-4">
                <CohortManagement 
                  courses={courses}
                  cohorts={cohorts}
                  setCohorts={setCohorts}
                  showDeleteConfirmation={showDeleteConfirmation}
                  settings={{ identity: cohortSettings.identity, inheritance: cohortSettings.inheritance }}
                />
              </TabsContent>

              {/* Settings Tab Content */}
              <TabsContent value="settings" className="relative space-y-2 sm:space-y-4">
                {isSettingsTabDisabled && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 px-4 text-center">
                    <div className="rounded-md border border-dashed border-muted-foreground/40 bg-background/80 px-4 py-3 shadow-sm">
                      <p className="text-sm font-medium text-muted-foreground">Settings are locked to defaults.</p>
                      <p className="text-xs text-muted-foreground/80">Contact your administrator to make changes.</p>
                    </div>
                  </div>
                )}
                <Card className={isSettingsTabDisabled ? "pointer-events-none opacity-60" : ""}>
                  <CardContent className="p-2 sm:p-4 md:p-6">
                    {/* Settings Sub-Tabs */}
                    <Tabs defaultValue="course-settings" className="w-full">
                      <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 mb-3 sm:mb-4 md:mb-6 bg-transparent gap-2 p-0 h-auto">
                        <TabsTrigger 
                          value="course-settings" 
                          className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 border-2 bg-transparent text-xs sm:text-sm md:text-base font-medium data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent"
                          style={{
                            borderColor: secondaryColor,
                            color: secondaryColor
                          }}
                        >
                          <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                          <span className="text-xs sm:text-sm md:text-base">Course Settings</span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="cohort-settings" 
                          className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 border-2 bg-transparent text-xs sm:text-sm md:text-base font-medium data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent"
                          style={{
                            borderColor: secondaryColor,
                            color: secondaryColor
                          }}
                        >
                          <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                          <span className="text-xs sm:text-sm md:text-base">Cohort Settings</span>
                        </TabsTrigger>
                      </TabsList>

                      {/* Course Settings Tab */}
                      <TabsContent value="course-settings">
                        <CourseSettings 
                          settings={courseSettings}
                          onUpdateSetting={updateSetting}
                          onResetSettings={resetSettings}
                          onSaveSettings={saveSettings}
                        />
                      </TabsContent>

                      {/* Cohort Settings Tab */}
                      <TabsContent value="cohort-settings">
                        <CohortSettings 
                          settings={cohortSettings}
                          onUpdateSetting={updateCohortSetting}
                          onResetSettings={resetCohortSettings}
                          onSaveSettings={saveCohortSettings}
                        />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>

        {/* Global dialogs (mounted outside tabs for instant open) */}
        <DraftsDialog 
          isOpen={isDraftsDialogOpen}
          onOpenChange={setIsDraftsDialogOpen}
          drafts={drafts}
          onEditDraft={handleEditDraft}
          onDeleteDraft={handleDeleteDraft}
          onRefreshDrafts={refetchDrafts}
        />

        <ConfirmationDialog 
          isOpen={deleteConfirmDialog.isOpen}
          title={deleteConfirmDialog.title}
          message={deleteConfirmDialog.message}
          itemName={deleteConfirmDialog.itemName}
          onConfirm={deleteConfirmDialog.onConfirm}
          onCancel={() => setDeleteConfirmDialog(prev => ({ ...prev, isOpen: false }))}
          confirmButtonText={deleteConfirmDialog.confirmButtonText}
        />

        <AddCourseDialog 
          isOpen={isAddCourseDialogOpen}
          onOpenChange={(open) => {
            setIsAddCourseDialogOpen(open);
            if (!open) {
              setIsEditMode(false);
              setEditCourseId(null);
            }
          }}
          isEditMode={isEditMode}
          editCourseId={editCourseId}
          courses={courses}
          setCourses={setCourses}
          newCourseForm={{
            ...newCourseForm,
            id: newCourseForm.id || uuidv4()
          }}
          setNewCourseForm={setNewCourseForm}
          showDeleteConfirmation={showDeleteConfirmation}
          manualCourseIdEnabled={courseSettings.identity.allowManualIds}
          onGenerateCourseId={() => {
            const nextId = generateCourseIdentifier()
            setNewCourseForm(prev => ({ ...prev, id: nextId, courseId: nextId }))
          }}
          courseIdFormatHint={getCourseIdHint()}
          onRestrictedAttempt={() => setUpgradeOpen(true)}
        />

        <UpgradePlanModal open={upgradeOpen} onOpenChange={setUpgradeOpen} module={'courses'} />

        {/* Additional Dialog Components */}
        <Dialog open={isViewCourseDialogOpen} onOpenChange={setIsViewCourseDialogOpen}>
          <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg md:text-xl font-bold">Course Details</DialogTitle>
            </DialogHeader>
            {selectedCourse && (
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                <div className="border-b pb-2 sm:pb-3">
                  <h3 className="font-semibold text-base sm:text-lg md:text-xl">{selectedCourse.name}</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-white">{selectedCourse.instructor}</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-white mt-1">{selectedCourse.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 md:gap-x-6 gap-y-2 sm:gap-y-1">
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">Course Settings</h4>
                    <dl className="grid grid-cols-[80px_1fr] sm:grid-cols-[100px_1fr] gap-y-0.5 sm:gap-y-1 text-xs sm:text-sm">
                      <dt className="text-gray-500 dark:text-white">Level:</dt>
                      <dd>{selectedCourse.level}</dd>
                      <dt className="text-gray-500 dark:text-white">Type:</dt>
                      <dd className="capitalize">{selectedCourse.type?.toLowerCase()}</dd>
                      <dt className="text-gray-500 dark:text-white">Duration:</dt>
                      <dd>{selectedCourse.duration}</dd>
                      <dt className="text-gray-500 dark:text-white">Location:</dt>
                      <dd>{selectedCourse.location}</dd>
                    </dl>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">Capacity & Pricing</h4>
                    <dl className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-y-0.5 sm:gap-y-1 text-xs sm:text-sm">
                      <dt className="text-gray-500 dark:text-white">Price:</dt>
                      <dd className="text-green-600 font-semibold">${currency} {selectedCourse.price?.toLocaleString()}</dd>
                      <dt className="text-gray-500 dark:text-white">Max Students:</dt>
                      <dd>{selectedCourse.maxStudents}</dd>
                    </dl>
                  </div>
                </div>

                <div className="border-t pt-2 sm:pt-3">
                  <h4 className="font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">Schedule</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 md:gap-x-6 gap-y-2 sm:gap-y-0 text-xs sm:text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-white">Period:</span>
                      <div className="mt-1">
                        {selectedCourse.schedulePeriod?.startDate && selectedCourse.schedulePeriod?.endDate ? (
                          <div className="space-y-0.5">
                            <div>Start: {selectedCourse.schedulePeriod.startDate}</div>
                            <div>End: {selectedCourse.schedulePeriod.endDate}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-white">Not set</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-white">Total Weeks:</span>
                      <div className="mt-1">
                        {selectedCourse.schedulePeriod?.totalWeeks || <span className="text-gray-400 dark:text-white">Not set</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedCourse.tags && selectedCourse.tags.length > 0 && (
                  <div className="border-t pt-2 sm:pt-3">
                    <h4 className="font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                      {selectedCourse.tags.map((tag, index) => (
                        <span key={index} className="px-1.5 sm:px-2 py-0.5 bg-gray-100 text-gray-700 dark:text-white text-[10px] sm:text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isMarketingDialogOpen} onOpenChange={setIsMarketingDialogOpen}>
          <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="inline-flex items-center gap-2">Marketing Tools <Image src="/Coming soon.svg" alt="Coming Soon" width={16} height={16} className="inline-block" /></DialogTitle>
            </DialogHeader>
            <div className="p-4 sm:p-6 md:p-8 text-center text-gray-500 dark:text-white">
              <Megaphone className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 mx-auto mb-3 sm:mb-4 text-gray-400 dark:text-white" />
              <p className="text-xs sm:text-sm md:text-base">Marketing tools and promotional features coming soon!</p>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isAnalyticsDialogOpen} onOpenChange={setIsAnalyticsDialogOpen}>
          <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Analytics Dashboard</DialogTitle>
            </DialogHeader>
            <div className="p-4 sm:p-6 md:p-8 text-center text-gray-500 dark:text-white">
              <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 mx-auto mb-3 sm:mb-4 text-gray-400 dark:text-white" />
              <p className="text-xs sm:text-sm md:text-base">Advanced analytics and reporting features would be implemented here.</p>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isFinancialDialogOpen} onOpenChange={setIsFinancialDialogOpen}>
          <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Financial Management</DialogTitle>
            </DialogHeader>
            <div className="p-4 sm:p-6 md:p-8 text-center text-gray-500 dark:text-white">
              <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 mx-auto mb-3 sm:mb-4 text-gray-400 dark:text-white" />
              <p className="text-xs sm:text-sm md:text-base">Financial tracking and revenue management features would be implemented here.</p>
            </div>
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
          requiredColumns={['courseId', 'name']}
        />

          </>
        )}
      </div>)
}
