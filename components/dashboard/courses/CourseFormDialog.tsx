"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Label } from "@/components/dashboard/ui/label"
import { Textarea } from "@/components/dashboard/ui/textarea"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Switch } from "@/components/dashboard/ui/switch"
import { Separator } from "@/components/dashboard/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/dashboard/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import { ToastAction } from "@/components/dashboard/ui/toast"
import { toast } from "@/hooks/dashboard/use-toast"
import {
  Plus, FileText, Pencil, Save, X, GraduationCap, Video, Headphones, Eye, Zap,
  Smartphone, MessageCircle, Mail, ChevronLeft, ChevronRight
} from "lucide-react"
import type { Course } from "@/types/dashboard/course"
import {
  BasicInfoTab,
  ChaptersTab,
  ContentTab,
  PricingTab,
  ScheduleTab,
  SettingsTab,
  MarketingTab
} from "./course-form-tabs"
import { useCustomColors } from "@/lib/use-custom-colors"

// Dummy instructor data for testing
const DUMMY_INSTRUCTORS = [
  {
    id: "667456789012345678901001",
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@uniqbrio.com",
    expertise: ["Web Development", "JavaScript", "React"]
  },
  {
    id: "667456789012345678901002", 
    name: "Prof. Michael Chen",
    email: "michael.chen@uniqbrio.com",
    expertise: ["Data Science", "Python", "Machine Learning"]
  },
  {
    id: "667456789012345678901003",
    name: "Emma Davis",
    email: "emma.davis@uniqbrio.com", 
    expertise: ["Yoga", "Meditation", "Wellness"]
  }
]

interface CourseFormDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isEditMode: boolean
  editCourseId: string | null
  courses: Course[]
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>
  newCourseForm: any
  setNewCourseForm: React.Dispatch<React.SetStateAction<any>>
  showDeleteConfirmation: (title: string, message: string, onConfirm: () => void, itemName?: string, confirmButtonText?: string) => void
  manualCourseIdEnabled?: boolean
  onGenerateCourseId?: () => void
  courseIdFormatHint?: string
}

export default function CourseFormDialog({
  isOpen,
  onOpenChange,
  isEditMode,
  editCourseId,
  courses,
  setCourses,
  newCourseForm,
  setNewCourseForm,
  showDeleteConfirmation,
  manualCourseIdEnabled = false,
  onGenerateCourseId,
  courseIdFormatHint
}: CourseFormDialogProps) {
  const { primaryColor, secondaryColor } = useCustomColors();
  // Ref to track if we've initialized defaults for this dialog session
  const hasInitializedDefaults = useRef(false)

  // State for tracking unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [initialFormData, setInitialFormData] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [basicErrorFields, setBasicErrorFields] = useState<string[]>([])
  const [pricingErrorFields, setPricingErrorFields] = useState<string[]>([])
  const [scheduleErrorFields, setScheduleErrorFields] = useState<string[]>([])
  const [validationMessage, setValidationMessage] = useState("")

  // Track form changes to detect unsaved changes
  useEffect(() => {
    if (isOpen && !hasUnsavedChanges) {
      // Store initial form data when dialog opens
      setInitialFormData({ ...newCourseForm })
    }
  }, [isOpen])

  // Monitor form changes
  useEffect(() => {
    if (isOpen && Object.keys(initialFormData).length > 0) {
      // Check if form has been modified from initial state
      const isModified = JSON.stringify(newCourseForm) !== JSON.stringify(initialFormData)
      setHasUnsavedChanges(isModified)
    }
  }, [newCourseForm, initialFormData, isOpen])

  // Handle dialog close with unsaved changes check
  const handleDialogClose = () => {
    // Always show confirmation for edit mode or when there are unsaved changes
    if (isEditMode || hasUnsavedChanges) {
      setShowUnsavedDialog(true)
    } else {
      onOpenChange(false)
      resetForm()
    }
  }

  // Handle unsaved changes dialog actions
  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false)
    setHasUnsavedChanges(false)
    onOpenChange(false)
    resetForm()
  }

  const handleSaveAsDraft = async () => {
    setShowUnsavedDialog(false)
    await handleSaveDraft()
  }

  const resetForm = () => {
    setNewCourseForm({})
    setInitialFormData({})
    setHasUnsavedChanges(false)
    setBasicErrorFields([])
    setPricingErrorFields([])
    setScheduleErrorFields([])
    setValidationMessage("")
  }

  // Reset form and set Course ID when opening in create mode (not edit)
  useEffect(() => {
    if (isOpen && !isEditMode && !newCourseForm?.id) {
      // Find the next course number as a fallback if no ID is provided
      const nextCourseNumber = (Array.isArray(courses) ? courses.length : 0) + 1;
      const nextCourseId = `COURSE${nextCourseNumber.toString().padStart(4, '0')}`;
      setNewCourseForm({
        id: nextCourseId,
        level: 'Beginner',
        type: 'Online',
        tags: ['Beginner'],
        status: 'Active',
        courseCategory: 'Regular'
      });
    }
  }, [isOpen, isEditMode, courses, setNewCourseForm, newCourseForm?.id]);

  // Tab navigation state
  const [currentTab, setCurrentTab] = useState("basic")
  const tabOrder = ["basic", "pricing", "chapters", "schedule"]
  
  // Get current tab index
  const currentTabIndex = tabOrder.indexOf(currentTab)
  const isFirstTab = currentTabIndex === 0
  const isLastTab = currentTabIndex === tabOrder.length - 1

  // Tab-specific validation functions
  const validateBasicInfo = () => {
    const errors: string[] = [];
    const errorFields: string[] = [];
    const addError = (field: string, label: string) => {
      errorFields.push(field);
      errors.push(label);
    };
    
    if (!newCourseForm?.name?.trim()) addError('name', 'Course Name');
    if (!newCourseForm?.instructor && !newCourseForm?.instructorId) addError('instructor', 'Instructor');
    if (!newCourseForm?.maxStudents || parseInt(newCourseForm.maxStudents) <= 0) addError('maxStudents', 'Max Students');
    if (!newCourseForm?.description?.trim()) addError('description', 'Description');
    if (!newCourseForm?.level) addError('level', 'Course Level');
    if (!newCourseForm?.type) addError('type', 'Course Type');
    if (!newCourseForm?.courseCategory) addError('courseCategory', 'Course Category');
    if (!newCourseForm?.tags?.length) addError('tags', 'Tags');
    if (!newCourseForm?.status) addError('status', 'Course Status');
    
    return {
      isValid: errors.length === 0,
      errors,
      errorFields
    };
  }

  const validatePricing = () => {
    const errors: string[] = [];
    const errorFields: string[] = [];
    
    if (!newCourseForm?.price || parseFloat(newCourseForm.price) <= 0) {
      errors.push('Price');
      errorFields.push('price');
    }
    
    if (!newCourseForm?.paymentCategory) {
      errors.push('Payment Category');
      errorFields.push('paymentCategory');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      errorFields
    };
  }

  const validateChapters = () => {
    // Chapters are optional, so this tab is always considered valid
    // User can skip chapters or add them as needed
    return {
      isValid: true,
      errors: [],
      errorFields: []
    };
  }

  const validateSchedule = () => {
    const errors: string[] = [];
    const errorFields: string[] = [];
    
    // Start Date is always required
    if (!newCourseForm?.schedulePeriod?.startDate) {
      errors.push('Start Date');
      errorFields.push('startDate');
    }
    
    // End Date is only required for non-Ongoing Training courses
    if (newCourseForm?.courseCategory !== 'Ongoing Training' && !newCourseForm?.schedulePeriod?.endDate) {
      errors.push('End Date');
      errorFields.push('endDate');
    }
    
    // Validate date range only if both dates are present
    if (newCourseForm?.schedulePeriod?.startDate && newCourseForm?.schedulePeriod?.endDate) {
      if (new Date(newCourseForm.schedulePeriod.startDate) > new Date(newCourseForm.schedulePeriod.endDate)) {
        errors.push('Valid Date Range (End Date must be after Start Date)');
        errorFields.push('startDate', 'endDate');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      errorFields
    };
  }

  const clearTabErrors = (tab: string) => {
    if (tab === 'basic') setBasicErrorFields([])
    if (tab === 'pricing') setPricingErrorFields([])
    if (tab === 'schedule') setScheduleErrorFields([])
  }

  const applyTabErrors = (tab: string, errorFields: string[]) => {
    if (tab === 'basic') setBasicErrorFields(errorFields)
    if (tab === 'pricing') setPricingErrorFields(errorFields)
    if (tab === 'schedule') setScheduleErrorFields(errorFields)
  }

  const getValidationForTab = (tab: string) => {
    switch (tab) {
      case 'basic':
        return validateBasicInfo();
      case 'pricing':
        return validatePricing();
      case 'chapters':
        return validateChapters();
      case 'schedule':
        return validateSchedule();
      default:
        return { isValid: true, errors: [], errorFields: [] };
    }
  }

  // Navigation functions
  const handleNextTab = () => {
    // Validate current tab before moving to next
    const validation = getValidationForTab(currentTab)
    applyTabErrors(currentTab, validation.errorFields || [])
    if (!validation.isValid) {
      setValidationMessage('Please complete the highlighted fields before continuing.')
      return;
    }
    setValidationMessage("")
    
    if (currentTabIndex < tabOrder.length - 1) {
      const nextTab = tabOrder[currentTabIndex + 1]
      setCurrentTab(nextTab)
    }
  }

  const handlePreviousTab = () => {
    if (currentTabIndex > 0) {
      const prevTab = tabOrder[currentTabIndex - 1]
      setCurrentTab(prevTab)
    }
  }

  // Reset tab to basic when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentTab("basic")
      setValidationMessage("")
      clearTabErrors('basic')
      clearTabErrors('pricing')
      clearTabErrors('schedule')
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && !isEditMode && !hasInitializedDefaults.current && !newCourseForm?.id) {
      // Only initialize if form appears to be empty/default
      if (!newCourseForm.name && !newCourseForm.instructor) {
        // Get next course ID from API to ensure accuracy
        const getNextCourseId = async () => {
          try {
            // Make API call to get the proper next course ID
            const response = await fetch('/api/dashboard/services/courses', {
              credentials: 'include'
            });
            const data = await response.json();
            
            let maxCourseNumber = 0;
            if (data.success && Array.isArray(data.courses)) {
              data.courses.forEach((course: any) => {
                const courseId = course.courseId || course.id;
                if (courseId) {
                  // Extract number from COURSE0001, COURSE0002, etc.
                  const match = courseId.match(/COURSE(\d+)/);
                  if (match) {
                    const courseNumber = parseInt(match[1], 10);
                    if (courseNumber > maxCourseNumber) {
                      maxCourseNumber = courseNumber;
                    }
                  }
                }
              });
            }
            
            const nextCourseNumber = maxCourseNumber + 1;
            const nextCourseId = `COURSE${nextCourseNumber.toString().padStart(4, '0')}`;
            
            setNewCourseForm((prev: any) => ({
              ...prev,
              id: nextCourseId,
              level: prev.level || 'Beginner',
              type: prev.type || 'Online',
              tags: prev.tags?.length > 0 ? prev.tags : ['Beginner'],
              status: prev.status || 'Active',
              courseCategory: prev.courseCategory || 'Regular'
            }))
          } catch (error) {
            console.error('Error fetching next course ID:', error);
            // Fallback to local calculation if API fails
            let maxCourseNumber = 0;
            if (Array.isArray(courses)) {
              courses.forEach((course: Course) => {
                if (course.courseId || course.id) {
                  const courseId = course.courseId || course.id;
                  const match = courseId.match(/COURSE(\d+)/);
                  if (match) {
                    const courseNumber = parseInt(match[1], 10);
                    if (courseNumber > maxCourseNumber) {
                      maxCourseNumber = courseNumber;
                    }
                  }
                }
              });
            }
            const nextCourseNumber = maxCourseNumber + 1;
            const nextCourseId = `COURSE${nextCourseNumber.toString().padStart(4, '0')}`;
            setNewCourseForm((prev: any) => ({
              ...prev,
              id: nextCourseId,
              level: prev.level || 'Beginner',
              type: prev.type || 'Online',
              tags: prev.tags?.length > 0 ? prev.tags : ['Beginner'],
              status: prev.status || 'Active',
              courseCategory: prev.courseCategory || 'Regular'
            }))
          }
        };
        
        getNextCourseId();
      }
      hasInitializedDefaults.current = true
    }
    // Reset the flag when dialog closes
    if (!isOpen) {
      hasInitializedDefaults.current = false
    }
  }, [isOpen, isEditMode, setNewCourseForm, newCourseForm?.id])

  // Validation states for different tabs
  const basicInfoValidation = validateBasicInfo();
  const pricingValidation = validatePricing();
  const chaptersValidation = validateChapters();
  const scheduleValidation = validateSchedule();
  
  const isBasicInfoValid = basicInfoValidation.isValid;
  const isPricingValid = pricingValidation.isValid;
  const isChaptersValid = chaptersValidation.isValid;
  const isScheduleValid = scheduleValidation.isValid;
  
  // Check if we're editing a draft
  const isEditingDraft = isEditMode && editCourseId && courses.every(c => c.id !== editCourseId)
  
  // Create course button should be disabled based on context:
  // - Must be on schedule tab (final tab)
  // - Must have valid pricing and schedule
  // - If creating new course and status is Draft, disable (save as draft instead)
  // - If editing draft, allow if all mandatory fields are filled
  // - If currently submitting, disable to prevent duplicates
  const isCreateCourseDisabled = currentTab !== "schedule" || !isPricingValid || !isScheduleValid || 
    (!isEditMode && newCourseForm.status === 'Draft') || 
    (isEditingDraft && (!isBasicInfoValid || !isScheduleValid)) ||
    isSubmitting

  const handleTabChange = (newTab: string) => {
    const currentTabIndex = tabOrder.indexOf(currentTab);
    const newTabIndex = tabOrder.indexOf(newTab);
    if (newTabIndex > currentTabIndex) {
      const validation = getValidationForTab(currentTab)
      applyTabErrors(currentTab, validation.errorFields || [])
      if (!validation.isValid) {
        setValidationMessage('Please complete the highlighted fields before proceeding.')
        return
      }
    }
    setValidationMessage("")
    setCurrentTab(newTab);
  }

  const handleCreateCourse = async () => {
    // Prevent multiple submissions
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Validate all mandatory fields before submission
    const allValidations = [
      { name: 'Basic Info', validation: basicInfoValidation },
      { name: 'Pricing', validation: pricingValidation },
      { name: 'Schedule', validation: scheduleValidation }
    ];
    
    const failedValidations = allValidations.filter(v => !v.validation.isValid);
    
    setBasicErrorFields(basicInfoValidation.errorFields || [])
    setPricingErrorFields(pricingValidation.errorFields || [])
    setScheduleErrorFields(scheduleValidation.errorFields || [])
    
    if (failedValidations.length > 0) {
      const tabKeyMap: Record<string, string> = {
        'Basic Info': 'basic',
        'Pricing': 'pricing',
        'Schedule': 'schedule'
      }
      const firstInvalid = tabKeyMap[failedValidations[0].name] || 'basic'
      setCurrentTab(firstInvalid)
      setValidationMessage('Please complete all required fields before creating the course.')
      setIsSubmitting(false);
      return;
    }
    setValidationMessage("")
    
    // If creating new course and status is Draft, save as draft instead
    if (!isEditMode && newCourseForm.status === 'Draft') {
      await handleSaveDraft()
      setIsSubmitting(false);
      return
    }
    try {
  // Use instructor name from form
  const selectedInstructor = newCourseForm.instructor || DUMMY_INSTRUCTORS[0].name;
      // Preserve all tags entered by user
      const filteredTags = Array.isArray(newCourseForm.tags)
        ? newCourseForm.tags
        : [];
      // Remove empty chapters and process PDF files
      const filteredChapters = Array.isArray(newCourseForm.chapters)
        ? newCourseForm.chapters
            .filter((chap: { name?: string; description?: string }) => chap.name && chap.name.length >= 3 && chap.description && chap.description.length >= 10)
            .map((chap: any) => ({
              name: chap.name,
              description: chap.description,
              // Convert File objects to strings or remove them for now
              referencePdf: chap.referencePdf instanceof File ? chap.referencePdf.name : (typeof chap.referencePdf === 'string' ? chap.referencePdf : undefined),
              assignmentPdf: chap.assignmentPdf instanceof File ? chap.assignmentPdf.name : (typeof chap.assignmentPdf === 'string' ? chap.assignmentPdf : undefined)
            }))
        : [];
      // Prepare course data with all possible fields from the form
      const courseData = {
  // Mandatory fields
  name: newCourseForm.name || '',
  type: newCourseForm.type || '',
  courseCategory: newCourseForm.courseCategory || '',
  price: parseFloat(newCourseForm.price) || 0,
  paymentCategory: newCourseForm.paymentCategory || '',
  maxStudents: newCourseForm.maxStudents || '',
  // Basic Info
  title: newCourseForm.title || newCourseForm.name,
  description: newCourseForm.description,
  shortDescription: newCourseForm.shortDescription,
  instructor: selectedInstructor,
  courseId: newCourseForm.id,
        category: newCourseForm.category || 'General',
        subcategory: newCourseForm.subcategory,
        level: newCourseForm.level,
        duration: parseInt(newCourseForm.duration) || 30,
        totalSessions: parseInt(newCourseForm.totalSessions) || 10,
        completedSessions: parseInt(newCourseForm.completedSessions) || 0,
        
        currency: newCourseForm.currency,
        discountPrice: parseFloat(newCourseForm.discountPrice) || 0,
        thumbnail: newCourseForm.thumbnail || 'https://via.placeholder.com/400x300',
        images: newCourseForm.images || [],
        tags: filteredTags,
        skills: Array.isArray(newCourseForm.skills) ? newCourseForm.skills : [],
        prerequisites: Array.isArray(newCourseForm.prerequisites) ? newCourseForm.prerequisites.join(', ') : (newCourseForm.prerequisites || ''),
        learningOutcomes: Array.isArray(newCourseForm.learningOutcomes) ? newCourseForm.learningOutcomes.join(', ') : (newCourseForm.learningOutcomes || 'Complete understanding of the subject'),
        modules: newCourseForm.modules || [],
        chapters: filteredChapters,
        faqs: Array.isArray(newCourseForm.faqs) ? newCourseForm.faqs.filter((faq: any) => faq.question && faq.answer) : [],
        // Settings
        isPublished: newCourseForm.status === 'Active',
        isDraft: newCourseForm.status === 'Draft',
        enrollmentLimit: parseInt(newCourseForm.maxStudents) || 25,
        enrollmentCount: parseInt(newCourseForm.enrollmentCount) || 0,
        waitlistCount: parseInt(newCourseForm.waitlistCount) || 0,
        // Scheduling
        startDate: newCourseForm.startDate ? new Date(newCourseForm.startDate) : new Date(),
        endDate: newCourseForm.endDate ? new Date(newCourseForm.endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        schedule: newCourseForm.scheduleData || newCourseForm.schedule || [{
          dayOfWeek: 1,
          startTime: "10:00",
          endTime: "12:00",
          timeZone: "Asia/Kolkata"
        }],
        // Advanced Features
        contentFormats: newCourseForm.contentFormats || [],
        videoSettings: newCourseForm.videoSettings || {},
        microModules: newCourseForm.microModules || [],
        adaptiveContent: !!newCourseForm.adaptiveContent,
        timezoneSupport: !!newCourseForm.timezoneSupport,
        studentAvailability: newCourseForm.studentAvailability || [],
        // Course Policies
        cancellationPolicy: newCourseForm.cancellationPolicy,
        refundPolicy: newCourseForm.refundPolicy,
        dressCode: newCourseForm.dressCode,
        studentGuidelines: newCourseForm.studentGuidelines,
        materialRequirements: newCourseForm.materialRequirements || [],
        // Gamification
        instructorBadges: newCourseForm.instructorBadges || [],
        streakRewards: newCourseForm.streakRewards || [],
        points: parseInt(newCourseForm.points) || 0,
        achievements: newCourseForm.achievements || [],
        // Analytics
        rating: parseFloat(newCourseForm.rating) || 0,
        reviewCount: parseInt(newCourseForm.reviewCount) || 0,
        completionRate: parseFloat(newCourseForm.completionRate) || 0,
        enrollmentTrend: parseInt(newCourseForm.enrollmentTrend) || 0,
        // Location and Mode
        mode: newCourseForm.type === 'Online' ? 'online' : newCourseForm.type === 'Offline' ? 'offline' : 'hybrid',
        location: newCourseForm.location,
        virtualClassroomUrl: newCourseForm.virtualClassroomUrl,
        // Status and Metadata
        status: (() => {
          // Check if we're editing a draft - if so, force Active status
          const isEditingDraft = isEditMode && editCourseId && courses.every(c => c.id !== editCourseId);
          if (isEditingDraft) {
            return 'Active';
          }
          
          const frontendStatus = newCourseForm.status || 'Active';
          const validStatuses = ['Active', 'Inactive', 'Completed', 'Cancelled', 'Draft', 'Upcoming', 'In Progress'];
          return validStatuses.includes(frontendStatus) ? frontendStatus : 'Active';
        })(),
        featured: !!newCourseForm.featured,
        trending: !!newCourseForm.trending,
        isPrivate: !!newCourseForm.isPrivate,
        // Only send start and end dates - nothing else from schedule
        ...(newCourseForm.schedulePeriod?.startDate && newCourseForm.schedulePeriod?.endDate && {
          schedulePeriod: {
            startDate: newCourseForm.schedulePeriod.startDate,
            endDate: newCourseForm.schedulePeriod.endDate,
          }
        }),
        reminderSettings: newCourseForm.reminderSettings || {},
        marketing: newCourseForm.marketing || {},
        settings: newCourseForm.settings || {},
      }
      if (isEditMode && editCourseId) {
        // Check if this is a draft being edited
        const isDraft = courses.every(c => c.id !== editCourseId)
        if (isDraft) {
          // Create new course from draft - remove courseId so API generates new one
          const { courseId, id, ...courseDataWithoutId } = courseData;
          const createResponse = await fetch('/api/dashboard/services/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(courseDataWithoutId),
            credentials: 'include'
          })
          const createResult = await createResponse.json()
          if (createResult.success) {
            // Delete the draft
            const deleteResponse = await fetch(`/api/dashboard/services/courses/drafts?id=${editCourseId}`, {
              method: 'DELETE',
              credentials: 'include'
            })
            const deleteResult = await deleteResponse.json()
            
            if (deleteResult.success) {
              console.log('✅ Draft deleted successfully:', editCourseId);
              // Dispatch event to remove draft from parent component's state
              window.dispatchEvent(new CustomEvent('draftDeleted', { 
                detail: { draftId: editCourseId } 
              }))
            } else {
              console.error('❌ Failed to delete draft:', deleteResult.error);
            }
            
            // Update courses state
            setCourses(prevCourses => [createResult.course, ...prevCourses])
            
            // Close dialog and reset form
            onOpenChange(false)
            resetForm()
            
            toast({
              title: "Draft Converted to Course",
              description: `${courseData.title} has been created as ${createResult.course.courseId || createResult.course.id}.`,
            })
            
            // Return early to skip the normal dialog close at the end
            return
          } else {
            throw new Error(createResult.error || 'Failed to convert draft to course')
          }
        } else {
          // Find the MongoDB ObjectId for the course being edited
          const courseToEdit = courses.find(c => c.id === editCourseId || c.courseId === editCourseId);
          const mongoId = courseToEdit?._id;
          if (!mongoId) {
            toast({
              title: "Error Updating Course",
              description: `Could not find MongoDB ObjectId for course with id: ${editCourseId}`,
              variant: "destructive"
            });
            throw new Error('MongoDB ObjectId not found for course update');
          }
          // Update existing course using MongoDB ObjectId
          const updateResponse = await fetch('/api/dashboard/services/courses', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ _id: mongoId, ...courseData }),
            credentials: 'include'
          });
          const updateResult = await updateResponse.json();
          if (updateResult.success) {
            setCourses(prevCourses => 
              prevCourses.map(course => 
                course._id === mongoId ? { ...course, ...updateResult.course } : course
              )
            );
            toast({
              title: "Course Updated Successfully!",
              description: `${courseData.title} has been updated.`,
            });
          } else {
            toast({
              title: "Error Updating Course",
              description: `Backend error: ${updateResult.error || 'Unknown error'}\nPayload: ${JSON.stringify({ _id: mongoId, ...courseData }, null, 2)}`,
              variant: "destructive"
            });
            throw new Error(updateResult.error || 'Failed to update course');
          }
        }
      } else {
        // Create new course
        const response = await fetch('/api/dashboard/services/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(courseData),
          credentials: 'include'
        })
        const result = await response.json()
        if (result.success) {
          setCourses(prevCourses => [result.course, ...prevCourses])
          toast({
            title: "Course Created Successfully!",
            description: `${courseData.title} has been created and is now available.`,
          })
        } else {
          throw new Error(result.error || 'Failed to create course')
        }
      }
      // Close dialog and reset form
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error('Course creation/update error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save course. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleSaveDraft = async () => {
    try {
      // Validate minimum required fields for draft
      if (!newCourseForm.title && !newCourseForm.name) {
        toast({
          title: "Missing Information",
          description: "Please provide at least a course name/title to save as draft.",
          variant: "destructive"
        })
        return
      }

      console.log('Saving draft with data:', newCourseForm)
      
      // Prepare draft data - only include fields that have actual values
      const draftData: any = {
        status: 'Draft'
      }
      
      // Only add fields that have been explicitly filled in by the user
      if (newCourseForm.title) draftData.title = newCourseForm.title
      if (newCourseForm.name) draftData.name = newCourseForm.name
      if (newCourseForm.instructor) draftData.instructor = newCourseForm.instructor
      if (newCourseForm.instructorId) draftData.instructorId = newCourseForm.instructorId
      if (newCourseForm.description) draftData.description = newCourseForm.description
      if (newCourseForm.level) draftData.level = newCourseForm.level
      if (newCourseForm.type) draftData.type = newCourseForm.type
      if (newCourseForm.duration) draftData.duration = newCourseForm.duration
      if (newCourseForm.price) draftData.price = newCourseForm.price
      if (newCourseForm.paymentCategory) draftData.paymentCategory = newCourseForm.paymentCategory
      if (newCourseForm.schedule) draftData.schedule = newCourseForm.schedule
      if (newCourseForm.maxStudents) draftData.maxStudents = newCourseForm.maxStudents
      if (newCourseForm.tags && newCourseForm.tags.length > 0) draftData.tags = newCourseForm.tags
      if (newCourseForm.category) draftData.category = newCourseForm.category
      if (newCourseForm.subcategory) draftData.subcategory = newCourseForm.subcategory
      if (newCourseForm.thumbnail) draftData.thumbnail = newCourseForm.thumbnail
      if (newCourseForm.courseCategory) draftData.courseCategory = newCourseForm.courseCategory
      
      // Ensure we have at least a name or title for the draft
      if (!draftData.title && !draftData.name) {
        draftData.name = newCourseForm.title || newCourseForm.name || 'Untitled Draft'
      }
      
      console.log('Draft data being sent:', draftData)
      
      // Check if we're updating an existing draft
      const isUpdatingDraft = isEditMode && editCourseId && courses.every(c => c.id !== editCourseId)
      
      let response, result
      
      if (isUpdatingDraft) {
        // Update existing draft
        response = await fetch('/api/dashboard/services/courses/drafts', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: editCourseId, ...draftData }),
          credentials: 'include'
        })
      } else {
        // Create new draft
        response = await fetch('/api/dashboard/services/courses/drafts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(draftData),
          credentials: 'include'
        })
      }

      result = await response.json()
      console.log('Draft save result:', result)

      if (!response.ok) {
        const errorMsg = result.details || result.error || `HTTP ${response.status}: ${response.statusText}`
        console.error('Draft save error:', errorMsg)
        throw new Error(errorMsg)
      }

      if (result.success) {
        // Show success toast
        toast({
          title: isUpdatingDraft ? "Draft Updated Successfully!" : "Draft Saved Successfully!",
          description: `${newCourseForm.title || newCourseForm.name} has been ${isUpdatingDraft ? 'updated' : 'saved'} as a draft and can be accessed later.`,
        })

        // Close dialog and reset form
        onOpenChange(false)
        resetForm()

        // Dispatch event to update drafts list in parent component
        window.dispatchEvent(new CustomEvent('draftSaved'))

        // Open drafts dialog
        window.dispatchEvent(new CustomEvent('openDraftsDialog'))
      } else {
        const errorMsg = result.details || result.error || 'Failed to save draft'
        console.error('Draft save error:', errorMsg)
        throw new Error(errorMsg)
      }
    } catch (error) {
      console.error('Draft save error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save draft. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-hidden p-2 sm:p-4 flex flex-col" 
          style={{ fontSize: '0.92rem', lineHeight: '1.3' }}
          onInteractOutside={(e) => {
            // Show confirmation dialog when clicking outside
            e.preventDefault();
            handleDialogClose();
          }}
          onEscapeKeyDown={(e) => {
            // Show confirmation dialog when pressing Escape
            e.preventDefault();
            handleDialogClose();
          }}
        >
        <DialogHeader>
          <div className="flex items-center justify-between w-full mb-1">
            <DialogTitle className="flex items-center gap-2 text-base">
              {(isEditMode && !isEditingDraft) ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {(isEditMode && !isEditingDraft) ? 'Edit Course' : 'Create New Course'}
            </DialogTitle>
            <div className="flex items-center gap-2 mr-6">
              {(!isEditMode || isEditingDraft) && (
                <Button
                  variant="outline"
                  title={isEditingDraft ? "Update Draft" : "Save Draft"}
                  className="px-2 py-1 text-xs min-h-7 h-7 flex items-center justify-center gap-1"
                  style={{
                    borderColor: `${primaryColor}50`,
                    color: primaryColor,
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}10`}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={handleSaveDraft}
                >
                  <Save className="h-3 w-3" />
                  <span className="whitespace-nowrap">{isEditingDraft ? 'Update Draft' : 'Save Draft'}</span>
                </Button>
              )}
            </div>
          </div>
          <DialogDescription className="text-xs mb-1">
            {(isEditMode && !isEditingDraft)
              ? 'Modify the existing course details'
              : 'Create a comprehensive course with all advanced features' 
            }
          </DialogDescription>
        </DialogHeader>

        {validationMessage && (
          <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {validationMessage}
          </div>
        )}

        <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 border-b border-gray-200 dark:border-gray-700 pb-2">
          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full tabs-purple">
            <TabsList className="grid w-full grid-cols-7 gap-2 bg-transparent p-0 h-auto">
              <TabsTrigger 
                value="basic" 
                className="text-xs px-3 py-2 border-2 font-medium"
                style={{
                  borderColor: currentTab === 'basic' ? 'transparent' : secondaryColor,
                  backgroundColor: currentTab === 'basic' ? primaryColor : 'transparent',
                  color: currentTab === 'basic' ? 'white' : secondaryColor
                }}
                onMouseEnter={(e) => {
                  if (currentTab !== 'basic') {
                    e.currentTarget.style.backgroundColor = `${secondaryColor}15`;
                  } else {
                    e.currentTarget.style.backgroundColor = `${primaryColor}dd`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = currentTab === 'basic' ? primaryColor : 'transparent';
                }}
              >
                Basic Info
              </TabsTrigger>
              <TabsTrigger 
                value="pricing" 
                className="text-xs px-3 py-2 border-2 font-medium"
                style={{
                  borderColor: currentTab === 'pricing' ? 'transparent' : secondaryColor,
                  backgroundColor: currentTab === 'pricing' ? primaryColor : 'transparent',
                  color: currentTab === 'pricing' ? 'white' : secondaryColor
                }}
                onMouseEnter={(e) => {
                  if (currentTab !== 'pricing') {
                    e.currentTarget.style.backgroundColor = `${secondaryColor}15`;
                  } else {
                    e.currentTarget.style.backgroundColor = `${primaryColor}dd`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = currentTab === 'pricing' ? primaryColor : 'transparent';
                }}
              >
                Pricing
              </TabsTrigger>
              <TabsTrigger 
                value="chapters" 
                className="text-xs px-3 py-2 border-2 font-medium"
                style={{
                  borderColor: currentTab === 'chapters' ? 'transparent' : secondaryColor,
                  backgroundColor: currentTab === 'chapters' ? primaryColor : 'transparent',
                  color: currentTab === 'chapters' ? 'white' : secondaryColor
                }}
                onMouseEnter={(e) => {
                  if (currentTab !== 'chapters') {
                    e.currentTarget.style.backgroundColor = `${secondaryColor}15`;
                  } else {
                    e.currentTarget.style.backgroundColor = `${primaryColor}dd`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = currentTab === 'chapters' ? primaryColor : 'transparent';
                }}
              >
                Chapters
              </TabsTrigger>
              <TabsTrigger 
                value="schedule" 
                className="text-xs px-3 py-2 border-2 font-medium"
                style={{
                  borderColor: currentTab === 'schedule' ? 'transparent' : secondaryColor,
                  backgroundColor: currentTab === 'schedule' ? primaryColor : 'transparent',
                  color: currentTab === 'schedule' ? 'white' : secondaryColor
                }}
                onMouseEnter={(e) => {
                  if (currentTab !== 'schedule') {
                    e.currentTarget.style.backgroundColor = `${secondaryColor}15`;
                  } else {
                    e.currentTarget.style.backgroundColor = `${primaryColor}dd`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = currentTab === 'schedule' ? primaryColor : 'transparent';
                }}
              >
                Schedule
              </TabsTrigger>
              <TabsTrigger 
                value="content" 
                className="text-xs px-3 py-2 border-2 border-gray-300 bg-white text-gray-700 dark:text-white font-medium data-[state=active]:bg-gray-400 data-[state=active]:text-white data-[state=active]:border-gray-600 hover:border-gray-400 hover:bg-gray-50 hover:text-purple-700 flex flex-col items-center gap-0.5"
              >
                <span>Content</span>
                <Image src="/Coming soon.svg" alt="Coming Soon" width={10} height={10} className="opacity-70" />
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="text-xs px-3 py-2 border-2 border-gray-300 bg-white text-gray-700 dark:text-white font-medium data-[state=active]:bg-gray-400 data-[state=active]:text-white data-[state=active]:border-gray-600 hover:border-gray-400 hover:bg-gray-50 hover:text-purple-700 flex flex-col items-center gap-0.5"
              >
                <span>Settings</span>
                <Image src="/Coming soon.svg" alt="Coming Soon" width={10} height={10} className="opacity-70" />
              </TabsTrigger>
              <TabsTrigger 
                value="marketing" 
                className="text-xs px-3 py-2 border-2 border-gray-300 bg-white text-gray-700 dark:text-white font-medium data-[state=active]:bg-gray-400 data-[state=active]:text-white data-[state=active]:border-gray-600 hover:border-gray-400 hover:bg-gray-50 hover:text-purple-700 flex flex-col items-center gap-0.5"
              >
                <span>Marketing</span>
                <Image src="/Coming soon.svg" alt="Coming Soon" width={10} height={10} className="opacity-70" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto">
          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full tabs-purple">

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-2 p-1">
            <BasicInfoTab
              formData={newCourseForm}
              errorFields={basicErrorFields}
              onFormChange={(field: string, value: any) => {
                if (field === 'id' && !manualCourseIdEnabled) {
                  return;
                }
                setValidationMessage("")
                setBasicErrorFields((prev) => prev.filter(f => f !== field))
                setNewCourseForm((f: any) => ({
                  ...f,
                  [field]: value,
                  ...(field === 'id' ? { courseId: value } : {})
                }));
              }}
              clearErrorField={(field) => {
                setValidationMessage("")
                setBasicErrorFields((prev) => prev.filter(f => f !== field))
              }}
              showDeleteConfirmation={showDeleteConfirmation}
              instructorOptions={DUMMY_INSTRUCTORS}
              allowManualCourseId={manualCourseIdEnabled}
              onGenerateCourseId={onGenerateCourseId}
              courseIdHint={courseIdFormatHint}
            />
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-2 p-1">
            <PricingTab
              formData={newCourseForm}
              errorFields={pricingErrorFields}
              onFormChange={(field: string, value: any) => {
                setValidationMessage("")
                setPricingErrorFields((prev) => prev.filter(f => f !== field))
                setNewCourseForm((f: any) => ({ ...f, [field]: value }))
              }}
              clearErrorField={(field) => {
                setValidationMessage("")
                setPricingErrorFields((prev) => prev.filter(f => f !== field))
              }}
              courses={courses}
            />
          </TabsContent>

          {/* Chapters Tab */}
          <TabsContent value="chapters" className="space-y-2 p-1">
            <ChaptersTab
              formData={newCourseForm}
              onFormChange={(field: string, value: any) => setNewCourseForm((f: any) => ({ ...f, [field]: value }))}
              showDeleteConfirmation={showDeleteConfirmation}
            />
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-2 p-1">
            <ScheduleTab
              formData={newCourseForm}
              errorFields={scheduleErrorFields}
              onFormChange={(field: string, value: any) => {
                setValidationMessage("")
                setScheduleErrorFields((prev) => prev.filter(f => f !== field))
                setNewCourseForm((f: any) => ({ ...f, [field]: value }))
              }}
              clearErrorField={(field) => {
                setValidationMessage("")
                setScheduleErrorFields((prev) => prev.filter(f => f !== field))
              }}
              showDeleteConfirmation={showDeleteConfirmation}
            />
          </TabsContent>

          {/* Content Tab - Now enabled but visually disabled inside */}
          <TabsContent value="content" className="space-y-2 p-1 relative">
            <div className="pointer-events-none opacity-50 select-none">
              <ContentTab
                formData={newCourseForm}
                onFormChange={(field: string, value: any) => setNewCourseForm((f: any) => ({ ...f, [field]: value }))}
              />
            </div>
            
          </TabsContent>

          {/* Settings Tab - Now enabled but visually disabled inside */}
          <TabsContent value="settings" className="space-y-2 p-1 relative">
            <div className="pointer-events-none opacity-50 select-none">
              <SettingsTab
                formData={newCourseForm}
                onFormChange={(field: string, value: any) => setNewCourseForm((f: any) => ({ ...f, [field]: value }))}
              />
            </div>
            
          </TabsContent>

          {/* Marketing Tab - Now enabled but visually disabled inside */}
          <TabsContent value="marketing" className="space-y-2 p-1 relative">
            <div className="pointer-events-none opacity-50 select-none">
              <MarketingTab
                formData={newCourseForm}
                onFormChange={(field: string, value: any) => setNewCourseForm((f: any) => ({ ...f, [field]: value }))}
              />
            </div>
           
          </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between items-center mt-1">
          <div className="flex gap-1">
            {!isEditMode && (
              <Button
                variant="outline"
                title="Save Draft"
                className="px-1.5 py-1 text-xs min-h-5 min-w-[80px]"
                style={{
                  borderColor: `${primaryColor}50`,
                  color: primaryColor,
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}10`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={handleSaveDraft}
              >
                <Save className="h-3 w-3 mr-1" />
                Save Draft
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {/* Previous Button */}
            {!isFirstTab && (
              <Button
                variant="outline"
                className="px-2 py-1 text-xs min-h-7 min-w-[70px]"
                onClick={handlePreviousTab}
              >
                <ChevronLeft className="mr-1 h-3 w-3" />
                Previous
              </Button>
            )}
            
            {/* Next Button - Show for basic, pricing, and chapters tabs */}
            {!isLastTab && currentTab !== "schedule" && (
              <Button
                disabled={(currentTab === "basic" && !isBasicInfoValid) || (currentTab === "pricing" && !isPricingValid)}
                className="px-2.5 py-1 text-xs min-h-7 min-w-[70px] text-white transition-all duration-200"
                style={{
                  backgroundColor: 
                    (currentTab === "basic" && isBasicInfoValid) || 
                    (currentTab === "pricing" && isPricingValid) || 
                    (currentTab === "chapters" && validateChapters())
                      ? primaryColor
                      : (currentTab === "basic" && !isBasicInfoValid) || (currentTab === "pricing" && !isPricingValid)
                        ? "#9ca3af"
                        : `${primaryColor}99`,
                  boxShadow: 
                    ((currentTab === "basic" && isBasicInfoValid) || 
                    (currentTab === "pricing" && isPricingValid) || 
                    (currentTab === "chapters" && validateChapters()))
                      ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if ((currentTab === "basic" && isBasicInfoValid) || 
                      (currentTab === "pricing" && isPricingValid) || 
                      (currentTab === "chapters" && validateChapters())) {
                    e.currentTarget.style.backgroundColor = `${primaryColor}dd`;
                  } else if (!((currentTab === "basic" && !isBasicInfoValid) || (currentTab === "pricing" && !isPricingValid))) {
                    e.currentTarget.style.backgroundColor = `${primaryColor}aa`;
                  }
                }}
                onMouseLeave={(e) => {
                  if ((currentTab === "basic" && isBasicInfoValid) || 
                      (currentTab === "pricing" && isPricingValid) || 
                      (currentTab === "chapters" && validateChapters())) {
                    e.currentTarget.style.backgroundColor = primaryColor;
                  } else if (!((currentTab === "basic" && !isBasicInfoValid) || (currentTab === "pricing" && !isPricingValid))) {
                    e.currentTarget.style.backgroundColor = `${primaryColor}99`;
                  }
                }}
                onClick={handleNextTab}
              >
                Next
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            )}
            
            {/* Create Course Button - Only show in schedule tab (final tab) */}
            {currentTab === "schedule" && (
              <Button
                disabled={!!isCreateCourseDisabled}
                className="px-2.5 py-1 text-xs min-h-7 min-w-[80px] text-white transition-all duration-200"
                style={{
                  backgroundColor: !isCreateCourseDisabled ? primaryColor : `${primaryColor}99`,
                  boxShadow: !isCreateCourseDisabled ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = !isCreateCourseDisabled ? `${primaryColor}dd` : `${primaryColor}aa`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = !isCreateCourseDisabled ? primaryColor : `${primaryColor}99`;
                }}
                onClick={handleCreateCourse}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Saving...
                  </>
                ) : (
                  isEditMode ? (courses.every(c => c.id !== editCourseId) ? 'Create Course' : 'Save Changes') : 'Create Course'
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Unsaved Changes Confirmation Dialog */}
    <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
      <DialogContent className="max-w-lg w-full p-6 bg-background dark:bg-gray-900 rounded-lg shadow-xl border dark:border-gray-700">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditMode ? 'Close Editor' : 'Unsaved Changes'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? isEditingDraft 
                ? 'Are you sure you want to close the draft editor? Any unsaved changes will be lost.'
                : 'Are you sure you want to close the course editor? Any unsaved changes will be lost.'
              : 'You have unsaved changes in your course. What would you like to do?'
            }
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setShowUnsavedDialog(false)}
            className="px-4 py-2"
          >
            Continue Editing
          </Button>
          {(!isEditMode || isEditingDraft) && (
            <Button
              variant="outline"
              onClick={handleSaveAsDraft}
              className="px-4 py-2 flex items-center justify-center"
              style={{
                borderColor: `${primaryColor}50`,
                color: primaryColor,
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}10`}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span className="whitespace-nowrap">{isEditingDraft ? 'Update Draft' : 'Save as Draft'}</span>
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={handleDiscardChanges}
            className="px-4 py-2"
          >
            {isEditMode ? 'Close Without Saving' : 'Discard Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}