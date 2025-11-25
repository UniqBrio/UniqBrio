"use client"

import { useState, useEffect } from "react"
import { useCurrency } from "@/contexts/currency-context"
import "./ScheduleFilters.css"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Label } from "@/components/dashboard/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/dashboard/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Badge } from "@/components/dashboard/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { FilterDropdownWithCheckboxes } from "@/components/dashboard/ui/filter-dropdown-with-checkboxes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/dashboard/ui/dropdown-menu"
import { Calendar } from "@/components/dashboard/ui/calendar"
import { format, addDays, addWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dashboard/ui/dialog"
import Image from "next/image"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Textarea } from "@/components/dashboard/ui/textarea"
import { Switch } from "@/components/dashboard/ui/switch"
import { toast } from "@/components/dashboard/ui/use-toast"
import { ToastAction } from "@/components/dashboard/ui/toast"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  MapPin,
  Plus,
  Search,
  User,
  UserCheck,
  UserX,
  Users,
  AlertCircle,
  Download,
  Bell,
  WifiOff,
  Star,
  MessageSquare,
  Video,
  CalendarIcon,
  CalendarIcon as CalendarIntegration,
  Repeat,
  Zap,
  TrendingUp,
  LayoutDashboard,
  Calendar as CalendarLucide,
  List,
  Grid3x3,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  DollarSign,
  XCircle,
  X,
  Check,
  Sparkles,
  Settings,
  BookOpen,
} from "lucide-react"
import { useApp } from "@/contexts/dashboard/app-context"
import QRCodeGenerator from "@/components/dashboard/qr-code-generator"
// NotificationSystem removed per requirements
import AnalyticsDashboard from "@/components/dashboard/analytics-dashboard"
import ScheduleCalendarView from "@/components/dashboard/schedule/ScheduleCalendarView"
import ScheduleGridView from "@/components/dashboard/schedule/ScheduleGridView"
import ScheduleListView from "@/components/dashboard/schedule/ScheduleListView"
import { ColumnSelectorModal } from "@/components/dashboard/ui/ColumnSelectorModal"
import { useColumnManagement } from "@/hooks/dashboard/useColumnManagement"
import AIAssistantDialog from "@/components/dashboard/schedule/AIAssistantDialog"
import RescheduleDialog from "@/components/dashboard/schedule/RescheduleDialog"
import CancelDialog from "@/components/dashboard/schedule/CancelDialog"
import ReassignInstructorDialog from "@/components/dashboard/schedule/ReassignInstructorDialog"
import BulkActionsDialog from "@/components/dashboard/schedule/BulkActionsDialog"
import CalendarSyncDialog from "@/components/dashboard/schedule/CalendarSyncDialog"
import SessionModificationBadge from "@/components/dashboard/schedule/SessionModificationBadge"
import ScheduleSettings from "@/components/dashboard/schedule/ScheduleSettings"
import type { ScheduleEvent, RecurringPattern, Instructor, Room, ReassignmentInfo } from "@/types/dashboard/schedule"
import { 
  validateCourseStatus, 
  validateCohortStatus, 
  createCourseStatusMap, 
  filterActiveCohorts, 
  determineSessionStatus,
  validateScheduleConsistency 
} from "@/lib/dashboard/statusValidation"
import { 
  fetchLeaveRequests, 
  getInstructorAvailability, 
  getInstructorIdFromName,
  type LeaveRequest, 
  type InstructorAvailability 
} from "@/lib/dashboard/instructorAvailability"

// Helper function to format event display name (consistent with calendar view)
const getEventDisplayName = (event: ScheduleEvent): string => {
  const courseName = event.courseName || event.title || "Unknown Course"
  const cohortName = event.cohortName || ""
  
  if (cohortName && cohortName.trim() !== "") {
    return `${courseName} - ${cohortName}`
  }
  
  return courseName
}

// Instructor Availability Cell Component
interface InstructorAvailabilityCellProps {
  event: ScheduleEvent
  leaveRequests: LeaveRequest[]
  loading: boolean
}

const InstructorAvailabilityCell: React.FC<InstructorAvailabilityCellProps> = ({ event, leaveRequests, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center text-sm text-gray-500 dark:text-white">
        <User className="h-4 w-4 mr-2 animate-pulse" />
        Loading...
      </div>
    )
  }

  const availability = getInstructorAvailability(
    event.instructorId,
    event.instructor,
    event.date,
    leaveRequests
  )

  return (
    <div className="flex items-center gap-2">
      {availability.isAvailable ? (
        <div className="flex items-center text-sm text-green-600 dark:text-green-400">
          <UserCheck className="h-4 w-4 mr-2" />
          <span className="font-medium">Available</span>
        </div>
      ) : (
        <div className="flex items-center text-sm text-red-600 dark:text-red-400">
          <UserX className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span className="font-medium">On Leave</span>
            {availability.leaveDetails && (
              <div className="text-xs">
                {format(new Date(availability.leaveDetails.startDate), "dd-MMM-yy")} - {format(new Date(availability.leaveDetails.endDate), "dd-MMM-yy")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Enhanced sample data with new features - using current dates
const today = new Date()
const getCurrentWeekDates = () => {
  const monday = new Date(today)
  monday.setDate(today.getDate() - today.getDay() + 1) // Monday of current week
  return {
    monday: new Date(monday),
    tuesday: new Date(monday.getTime() + 24 * 60 * 60 * 1000),
    wednesday: new Date(monday.getTime() + 2 * 24 * 60 * 60 * 1000),
    thursday: new Date(monday.getTime() + 3 * 24 * 60 * 60 * 1000),
    friday: new Date(monday.getTime() + 4 * 24 * 60 * 60 * 1000),
  }
}

const currentWeek = getCurrentWeekDates()

// API functions to fetch data from backend
const fetchCourses = async () => {
  try {
    const response = await fetch('/api/dashboard/services/courses')
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to fetch courses - Status: ${response.status}, Error: ${errorText}`)
      throw new Error(`Failed to fetch courses: ${response.status} ${response.statusText}`)
    }
    const data = await response.json()
    console.log('Courses fetched successfully:', data.courses?.length || 0, 'courses')
    return data
  } catch (error) {
    console.error('Error fetching courses:', error)
    // Return empty structure instead of empty array to maintain API consistency
    return { success: false, courses: [], error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

const fetchCohorts = async () => {
  try {
    const response = await fetch('/api/dashboard/services/cohorts')
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to fetch cohorts - Status: ${response.status}, Error: ${errorText}`)
      throw new Error(`Failed to fetch cohorts: ${response.status} ${response.statusText}`)
    }
    const data = await response.json()
    console.log('Cohorts fetched successfully:', data.cohorts?.length || 0, 'cohorts')
    return data.cohorts || []
  } catch (error) {
    console.error('Error fetching cohorts:', error)
    return []
  }
}

const fetchReassignments = async () => {
  try {
    const response = await fetch('/api/dashboard/services/session-management/instructor-reassignments')
    if (!response.ok) {
      console.error(`Failed to fetch reassignments - Status: ${response.status}`)
      return []
    }
    const data = await response.json()
    console.log('Reassignments fetched successfully:', data.length || 0, 'reassignments')
    return data || []
  } catch (error) {
    console.error('Error fetching reassignments:', error)
    return []
  }
}

const fetchCancellations = async () => {
  try {
    const response = await fetch('/api/dashboard/services/session-management/session-cancellations')
    if (!response.ok) {
      console.error(`Failed to fetch cancellations - Status: ${response.status}`)
      return []
    }
    const data = await response.json()
    console.log('Cancellations fetched successfully:', data.length || 0, 'cancellations')
    return data || []
  } catch (error) {
    console.error('Error fetching cancellations:', error)
    return []
  }
}

const fetchReschedules = async () => {
  try {
    const response = await fetch('/api/dashboard/services/session-management/session-reschedules')
    if (!response.ok) {
      console.error(`Failed to fetch reschedules - Status: ${response.status}`)
      return []
    }
    const data = await response.json()
    console.log('Reschedules fetched successfully:', data.length || 0, 'reschedules')
    return data || []
  } catch (error) {
    console.error('Error fetching reschedules:', error)
    return []
  }
}

// Fetch ONLY modified sessions (reassigned, cancelled, rescheduled)
// This is more efficient than fetching all schedules
const fetchModifiedSessionsOnly = async () => {
  try {
    // We'll fetch schedules that have modifications
    // Since we can't directly query for "has modifications" in MongoDB,
    // we'll need to check each type separately or use an aggregation
    const response = await fetch('/api/dashboard/services/schedules/modified')
    if (!response.ok) {
      // Fallback: if the endpoint doesn't exist, return empty
      console.warn('Modified sessions endpoint not available, using fallback')
      return []
    }
    const data = await response.json()
    return data.schedules || []
  } catch (error) {
    console.error('Error fetching modified sessions:', error)
    return []
  }
}

// Apply modifications from database to generated sessions
const applyModificationsToSessions = (sessions: ScheduleEvent[], modifiedSchedules: any[]): ScheduleEvent[] => {
  console.log('📝 Applying', modifiedSchedules.length, 'modifications to', sessions.length, 'sessions')
  
  // Create a map of sessionId -> modification data
  const modificationsMap = new Map()
  modifiedSchedules.forEach(schedule => {
    if (schedule.sessionId) {
      modificationsMap.set(schedule.sessionId, schedule)
    }
  })
  
  // Apply modifications to matching sessions
  const updatedSessions = sessions.map(session => {
    const modifiedSchedule = modificationsMap.get(session.id)
    
    if (!modifiedSchedule || !modifiedSchedule.modifications) {
      return session // No modifications for this session
    }
    
    const mods = modifiedSchedule.modifications
    let updatedSession = { ...session }
    
    // Mark as modified
    updatedSession.isModified = true
    
    // Store original session data if not already stored
    if (!updatedSession.originalSessionData) {
      updatedSession.originalSessionData = {
        date: new Date(session.date),
        startTime: session.startTime,
        endTime: session.endTime,
        instructor: session.instructor,
        instructorId: session.instructorId,
        location: session.location,
        status: session.status
      }
    }
    
    // Apply reassignment
    if (mods.reassignment) {
      console.log(`✏️  Applying reassignment to session ${session.id}`)
      updatedSession.modificationType = 'instructor_changed'
      updatedSession.instructor = mods.reassignment.newInstructorName
      updatedSession.instructorId = mods.reassignment.newInstructor
      updatedSession.reassignmentInfo = {
        type: mods.reassignment.type,
        originalInstructor: mods.reassignment.originalInstructorName,
        newInstructor: mods.reassignment.newInstructorName,
        reassignedAt: new Date(mods.reassignment.reassignedAt),
        reason: mods.reassignment.reason
      }
    }
    
    // Apply cancellation
    if (mods.cancellation) {
      console.log(`❌ Applying cancellation to session ${session.id}`)
      updatedSession.modificationType = 'cancelled'
      updatedSession.status = 'Cancelled'
      updatedSession.isCancelled = true
      updatedSession.cancellationReason = mods.cancellation.reason
      updatedSession.cancellationInfo = {
        cancelledAt: new Date(mods.cancellation.cancelledAt),
        reason: mods.cancellation.reason,
        cancelledBy: mods.cancellation.cancelledBy,
        backendId: mods.cancellation.backendId
      }
    }
    
    // Apply reschedule
    if (mods.reschedule) {
      console.log(`📅 Applying reschedule to session ${session.id}`)
      updatedSession.modificationType = 'rescheduled'
      updatedSession.date = new Date(modifiedSchedule.date)
      updatedSession.startTime = modifiedSchedule.startTime
      updatedSession.endTime = modifiedSchedule.endTime
      updatedSession.originalSessionData = {
        date: new Date(mods.reschedule.originalDate),
        startTime: mods.reschedule.originalStartTime,
        endTime: mods.reschedule.originalEndTime,
        instructor: session.instructor,
        instructorId: session.instructorId,
        location: session.location,
        status: 'Upcoming'
      }
      updatedSession.rescheduleInfo = {
        rescheduledAt: new Date(mods.reschedule.rescheduledAt),
        originalDate: new Date(mods.reschedule.originalDate),
        newDate: new Date(modifiedSchedule.date),
        reason: mods.reschedule.reason,
        rescheduledBy: mods.reschedule.rescheduledBy
      }
      // Update status to reflect rescheduling
      updatedSession.status = 'Rescheduled'
    }
    
    return updatedSession
  })
  
  console.log('✅ Modifications applied successfully')
  return updatedSessions
}

// Convert schedule documents to ScheduleEvent format with modifications intact
const convertSchedulesToEvents = (schedulesData: any[]): ScheduleEvent[] => {
  return schedulesData.map(schedule => {
    const event: ScheduleEvent = {
      id: schedule.sessionId || schedule._id, // Use sessionId if available, fallback to MongoDB _id
      title: schedule.title,
      courseName: schedule.title,
      courseId: schedule.courseId || '',
      instructor: schedule.instructorName,
      instructorId: schedule.instructor,
      students: schedule.students || 0,
      registeredStudents: schedule.registeredStudents || [],
      maxCapacity: schedule.maxCapacity || 20,
      waitlist: schedule.waitlist || [],
      
      date: new Date(schedule.date),
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      
      location: schedule.location || 'TBD',
      mode: schedule.mode || 'live',
      type: schedule.type || 'online',
      
      category: schedule.category || 'Other',
      tags: schedule.tags || [],
      
      status: schedule.status || 'Upcoming',
      isCancelled: schedule.isCancelled || false,
      
      isRecurring: schedule.isRecurring || false,
      
      joinLink: schedule.joinLink,
      qrCode: schedule.qrCode
    }

    // Add modification information if present
    if (schedule.modifications) {
      if (schedule.modifications.reassignment) {
        event.reassignmentInfo = {
          type: schedule.modifications.reassignment.type,
          originalInstructor: schedule.modifications.reassignment.originalInstructorName,
          newInstructor: schedule.modifications.reassignment.newInstructorName,
          reassignedAt: new Date(schedule.modifications.reassignment.reassignedAt),
          reason: schedule.modifications.reassignment.reason
        }
        
        // Update the event's instructor to reflect the reassignment
        event.instructor = schedule.modifications.reassignment.newInstructorName
        event.instructorId = schedule.modifications.reassignment.newInstructor
      }

      if (schedule.modifications.cancellation) {
        event.cancellationInfo = {
          cancelledAt: new Date(schedule.modifications.cancellation.cancelledAt),
          reason: schedule.modifications.cancellation.reason,
          cancelledBy: schedule.modifications.cancellation.cancelledBy,
          backendId: schedule.modifications.cancellation.backendId
        }
        
        // Update status to reflect cancellation
        event.status = 'Cancelled'
        event.isCancelled = true
        event.cancellationReason = schedule.modifications.cancellation.reason
      }

      if (schedule.modifications.reschedule) {
        event.originalSessionData = {
          date: new Date(schedule.modifications.reschedule.originalDate),
          startTime: schedule.modifications.reschedule.originalStartTime,
          endTime: schedule.modifications.reschedule.originalEndTime,
          instructor: schedule.modifications.reschedule.rescheduledBy,
          instructorId: schedule.instructor,
          location: schedule.location || 'TBD',
          status: 'Upcoming'
        }
        
        event.rescheduleInfo = {
          rescheduledAt: new Date(schedule.modifications.reschedule.rescheduledAt),
          originalDate: new Date(schedule.modifications.reschedule.originalDate),
          newDate: new Date(schedule.date),
          reason: schedule.modifications.reschedule.reason,
          rescheduledBy: schedule.modifications.reschedule.rescheduledBy
        }
        
        // Update status to reflect rescheduling
        event.status = 'Rescheduled'
      }
    }

    return event
  })
}

// Convert course and cohort data to ScheduleEvent format with proper schedule inheritance
const convertToScheduleEvents = (coursesData: any, cohortsData: any, currency: string = ''): ScheduleEvent[] => {
  const events: ScheduleEvent[] = []
  
  // Extract actual arrays from API responses
  const courses = Array.isArray(coursesData) ? coursesData : (coursesData?.courses || [])
  const cohorts = Array.isArray(cohortsData) ? cohortsData : (cohortsData?.cohorts || [])
  
  // Validate that we have arrays
  if (!Array.isArray(courses) || !Array.isArray(cohorts)) {
    console.error('Invalid data format:', { courses: typeof courses, cohorts: typeof cohorts })
    return []
  }
  
  // Create course status lookup map for efficient checking
  const courseStatusMap = createCourseStatusMap(courses)
  
  console.log('DEBUG: All courses status map:', Array.from(courseStatusMap.entries()))
  console.log('DEBUG: Raw cohorts before filtering:', cohorts.map(c => ({
    id: c.id,
    name: c.name,
    status: c.status,
    courseId: c.courseId,
    daysOfWeek: c.daysOfWeek
  })))
  
  // Filter active cohorts and validate their parent courses
  const activeCohorts = filterActiveCohorts(cohorts, courseStatusMap)
  
  console.log('DEBUG: Active cohorts after filtering:', activeCohorts.map(c => ({
    id: c.id,
    name: c.name,
    status: c.status,
    courseId: c.courseId,
    daysOfWeek: c.daysOfWeek
  })))
  
  console.log(`Schedule Generation: ${cohorts.length} total cohorts -> ${activeCohorts.length} active cohorts`)
  console.log('Raw cohorts data:', cohorts.map(c => ({
    name: c.name,
    daysOfWeek: c.daysOfWeek,
    startDate: c.inheritedStartDate,
    endDate: c.inheritedEndDate,
    status: c.status
  })))
  
  activeCohorts.forEach((cohort) => {
    // Course schedule data is now inherited in the cohort object from the API
    let courseStartDate = cohort.inheritedStartDate ? new Date(cohort.inheritedStartDate) : null
    let courseEndDate = cohort.inheritedEndDate ? new Date(cohort.inheritedEndDate) : null
    
    // If no course schedule data, create a default date range
    if (!courseStartDate || !courseEndDate) {
      console.warn('Cohort missing course schedule data, using default dates:', cohort.name || cohort.cohortId)
      // Set default start date to beginning of October 2025
      courseStartDate = new Date('2025-10-01')
      // Set default end date to end of December 2025  
      courseEndDate = new Date('2025-12-31')
    } else {
      // If start date is too recent (after Oct 20), adjust it to ensure we have sessions from early October
      if (courseStartDate > new Date('2025-10-20')) {
        console.log(`Adjusting start date for ${cohort.name} from ${courseStartDate.toDateString()} to earlier`)
        courseStartDate = new Date('2025-10-01')
      }
    }
    
    console.log(`Processing ${cohort.name}: ${courseStartDate?.toDateString()} to ${courseEndDate?.toDateString()}`)
    
    // Parse days of week - handle both string and array formats
    let daysOfWeek: number[] = []
    console.log(`${cohort.name} - Raw daysOfWeek:`, cohort.daysOfWeek, typeof cohort.daysOfWeek)
    
    if (Array.isArray(cohort.daysOfWeek)) {
      daysOfWeek = cohort.daysOfWeek
    } else if (typeof cohort.daysOfWeek === 'string' && cohort.daysOfWeek.trim()) {
      daysOfWeek = cohort.daysOfWeek.split(' ').map((day: string) => parseInt(day.trim())).filter((day: number) => !isNaN(day))
    }
    
    console.log(`${cohort.name} - Parsed daysOfWeek:`, daysOfWeek)
    
    // Skip if no valid days of week
    if (daysOfWeek.length === 0) {
      console.warn('Cohort has no valid daysOfWeek:', cohort.name || cohort.cohortId)
      return
    }
    
    // Generate sessions for the entire course duration
    const sessionDuration = cohort.sessionDuration || 90 // minutes
    
    // Calculate total possible sessions based on date range and days of week
    const startDate = new Date(courseStartDate)
    const endDate = new Date(courseEndDate)
    const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const weeksInRange = Math.ceil(daysDifference / 7)
    const calculatedTotalSessions = weeksInRange * daysOfWeek.length
    
    // Use the calculated total or the specified total sessions (if reasonable)
    const specifiedTotal = cohort.totalSessions || 0
    const totalSessions = specifiedTotal > calculatedTotalSessions ? specifiedTotal : calculatedTotalSessions
    
    let sessionCount = 0
    
    console.log(`${cohort.name}: Generating sessions from ${startDate.toDateString()} to ${endDate.toDateString()}`)
    console.log(`${cohort.name}: Days per week: ${daysOfWeek.length}, Weeks in range: ${weeksInRange}, Total sessions to generate: ${totalSessions}`)
    
    // Start from course start date and generate sessions
    const currentDate = new Date(courseStartDate)
    
    while (currentDate <= courseEndDate) {
      const dayOfWeek = currentDate.getDay()
      
      // Check if this day is in the cohort's schedule
      if (daysOfWeek.includes(dayOfWeek)) {
        sessionCount++
        
        // Create schedule session for this specific session
        const event: ScheduleEvent = {
          id: `${cohort.cohortId || cohort.id}_${currentDate.toISOString().split('T')[0]}_${sessionCount}`,
          title: `${cohort.courseName || 'Course'} - Session ${sessionCount}`,
          instructor: cohort.instructor || cohort.courseInstructor || 'Unknown Instructor',
          instructorId: getInstructorIdFromName(cohort.instructor || cohort.courseInstructor || 'Unknown Instructor'),
          courseId: cohort.courseId,
          courseName: cohort.courseName,
          cohortId: cohort.cohortId || cohort.id,
          cohortName: cohort.name,
          cohorts: [{
            id: cohort.cohortId || cohort.id,
            name: cohort.name,
            startTime: cohort.timeSlot?.startTime || cohort.startTime || '09:00',
            endTime: cohort.timeSlot?.endTime || cohort.endTime || '10:00',
            daysOfWeek: cohort.daysOfWeek || [dayOfWeek],
            students: cohort.currentStudents?.length || 0,
            maxCapacity: cohort.maxStudents || 20,
            waitlist: cohort.waitlist || [],
            location: cohort.location || 'TBA',
            status: cohort.status || 'Active',
            registeredStudents: cohort.currentStudents || []
          }],
          students: cohort.currentStudents?.length || 0,
          registeredStudents: cohort.currentStudents || [],
          date: new Date(currentDate),
          startTime: cohort.timeSlot?.startTime || cohort.startTime || '09:00',
          endTime: cohort.timeSlot?.endTime || cohort.endTime || '10:00',
          location: cohort.location || 'TBA',
          category: (cohort.category as ScheduleEvent['category']) || 'Teaching',
          status: (() => {
            const parentCourse = courseStatusMap.get(cohort.courseId)
            const courseStatus = parentCourse?.status || 'Unknown'
            const cohortStatus = cohort.status || 'Unknown'
            
            const sessionStartTime = cohort.timeSlot?.startTime || cohort.startTime || '09:00'
            const sessionEndTime = cohort.timeSlot?.endTime || cohort.endTime || '10:00'
            
            return determineSessionStatus(
              new Date(currentDate),
              sessionStartTime,
              sessionEndTime,
              courseStatus,
              cohortStatus,
              false
            )
          })(),
          mode: 'live',
          type: cohort.sessionType === 'online' || cohort.sessionType === 'offline' || cohort.sessionType === 'hybrid' 
            ? cohort.sessionType 
            : 'online', // Default to 'online' if sessionType is not valid
          maxCapacity: cohort.maxStudents || 20,
          waitlist: cohort.waitlist || [],
          tags: [],
          qrCode: `qr-${cohort.cohortId}`,
          sessionNotes: cohort.notes || '',
          materials: [],
          dressCode: '',
          instructions: '',
          feedback: [],
          badges: [],
          equipment: [],
          isRecurring: true,
          recurringPattern: {
            frequency: 'weekly',
            interval: 1,
            daysOfWeek: cohort.daysOfWeek || [dayOfWeek],
            endDate: courseEndDate,
            exceptions: [],
          },
          
          // Course and Cohort status tracking
          courseStatus: courseStatusMap.get(cohort.courseId)?.status || 'Unknown',
          cohortStatus: cohort.status || 'Unknown',
          isInheritedFromInactiveCourse: !courseStatusMap.get(cohort.courseId)?.isActive,
        }
        
        events.push(event)
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    console.log(`${cohort.name}: Created ${sessionCount} sessions (from ${courseStartDate.toDateString()} to ${courseEndDate.toDateString()})`)
  })
  
  return events
}

// Sync generated sessions to MongoDB
const syncSessionsToDatabase = async (events: ScheduleEvent[], currency: string = '') => {
  try {
    if (events.length === 0) {
      console.log('No events to sync')
      return events
    }
    
    console.log('🔄 Syncing', events.length, 'sessions to database...')
    
    // Create Schedule documents for each event
    const schedulesToCreate = events.map(event => {
      // Ensure we have a valid instructor ID (use a placeholder if missing)
      const instructorId = event.instructorId || 'unknown-instructor'
      const instructorName = event.instructor || 'Unknown Instructor'
      
      // Validate type field - must be 'online', 'offline', or 'hybrid'
      const validTypes = ['online', 'offline', 'hybrid']
      const eventType = validTypes.includes(event.type) ? event.type : 'online'
      
      return {
        title: event.title,
        description: `${event.courseName || 'Course'} - ${event.cohortName || 'Cohort'}`,
        courseId: event.courseId,
        cohortId: event.cohortId,
        sessionId: event.id, // Store the custom session ID for lookup
        instructor: instructorId,
        instructorName: instructorName,
        students: event.students || 0,
        registeredStudents: event.registeredStudents || [],
        maxCapacity: event.maxCapacity || 20,
        waitlist: event.waitlist || [],
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        duration: 60, // Calculate based on start/end time
        timeZone: 'UTC',
        location: event.location || 'TBD',
        mode: event.mode || 'live',
        type: eventType,
        category: event.category || 'Teaching',
        status: event.status || 'Upcoming',
        isCancelled: event.status === 'Cancelled',
        tags: [],
        attendanceRequired: true,
        reminderSent: false,
        notificationSettings: {
          reminderTime: 15,
          sendSMS: false,
          sendEmail: false,
          sendPush: false
        },
        isRecurring: false,
        createdBy: 'System',
        lastModifiedBy: 'System',
        currency: currency || '',
        paymentRequired: false,
        version: 1
      }
    })
    
    console.log('📤 Sending', schedulesToCreate.length, 'schedules to API')
    console.log('Sample schedule:', schedulesToCreate[0])
    
    // Bulk create schedules
    const response = await fetch('/api/dashboard/services/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedulesToCreate)
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('Failed to sync sessions to database:', errorData)
      console.error('Response status:', response.status, response.statusText)
      return events // Return original events if sync fails
    }
    
    const result = await response.json()
    console.log('✅ Synced', result.insertedCount || result.schedules?.length || 0, 'sessions to database')
    
    // Map the created schedules back to events with their sessionIds preserved
    if (result.schedules && Array.isArray(result.schedules)) {
      // Create a map of sessionId -> MongoDB document
      const sessionIdMap = new Map()
      result.schedules.forEach((schedule: any) => {
        if (schedule.sessionId) {
          sessionIdMap.set(schedule.sessionId, schedule)
        }
      })
      
      // Update events with MongoDB data while preserving sessionId as the primary ID
      return events.map((event) => {
        const dbSchedule = sessionIdMap.get(event.id)
        if (dbSchedule) {
          return {
            ...event,
            id: event.id, // Keep the sessionId as the primary identifier for frontend
            // Store MongoDB _id for reference if needed
            _mongoId: dbSchedule._id
          }
        }
        return event
      })
    }
    
    return events
  } catch (error) {
    console.error('Error syncing sessions to database:', error)
    return events // Return original events if sync fails
  }
}

// Helper function to determine status based on date and time
const getSessionStatus = (sessionDate: Date, startTime: string, endTime: string, isCancelled = false): "Upcoming" | "Ongoing" | "Completed" | "Cancelled" | "Pending" => {
  if (isCancelled) return 'Cancelled'
  
  const now = new Date()
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  
  const sessionStart = new Date(sessionDate)
  sessionStart.setHours(startHour, startMin, 0, 0)
  
  const sessionEnd = new Date(sessionDate)
  sessionEnd.setHours(endHour, endMin, 0, 0)
  
  if (now < sessionStart) {
    return 'Upcoming'
  } else if (now >= sessionStart && now <= sessionEnd) {
    return 'Ongoing'
  } else {
    return 'Completed'
  }
}

// No sample data - using real API data only

// Dynamic instructors list will be populated from real session data
const courseTypes = ["All", "Regular", "Workshop", "Private", "Group"]
const statuses = ["All", "Upcoming", "Ongoing", "Completed", "Cancelled", "Pending", "Rescheduled", "Reassigned"]
const categories = ["All", "Fitness", "Sports", "Arts", "Teaching"]
const timePeriods = ["All", "Morning", "Afternoon", "Evening", "Night"]
// Dynamic locations will be populated from real session data

export default function EnhancedSchedulePage() {
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

  const { user, theme, toggleTheme, language, setLanguage, isOffline } = useApp()
  const { currency } = useCurrency()
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [instructorData] = useState<Instructor[]>([])
  const [roomData] = useState<Room[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [loadingLeaveRequests, setLoadingLeaveRequests] = useState(true)
  
  // Dynamic filter lists based on real session data
  const instructors = ["All", ...Array.from(new Set(events.map(event => event.instructor).filter(Boolean)))]
  const locations = ["All", ...Array.from(new Set(events.map(event => event.location).filter(Boolean)))]
  const courseNames = ["All", ...Array.from(new Set(events.map(event => event.courseName || event.title).filter(Boolean)))]
  const dates = ["All", ...Array.from(new Set(events.map(event => format(event.date, "yyyy-MM-dd")).filter(Boolean)))]
  // Initialize to today's date
  const getMondayOfCurrentWeek = () => {
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - today.getDay() + 1)
    return monday
  }
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date()
    // If today is within the cohort date range (Oct 2025 - Apr 2026), use today
    // Otherwise, default to the start of the cohort period
    if (today >= new Date('2025-10-01') && today <= new Date('2026-04-30')) {
      return today
    }
    return new Date('2025-10-01')
  })
  const [activeTab, setActiveTab] = useState<"analytics" | "schedule" | "settings">("schedule")

  // Schedule Settings State with localStorage persistence
  const [scheduleSettings, setScheduleSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scheduleSettings')
      if (saved) {
        return JSON.parse(saved)
      }
    }
    return {
      display: {
        defaultView: 'list',
        calendarDefaultView: 'week',
        listViewMode: 'table',
        showWeekNumbers: false,
        highlightToday: true,
        showWeekends: true,
        compactMode: false,
        colorCodeByStatus: true,
      },
      filters: {
        rememberLastFilters: true,
        autoApplyFilters: false,
        showAdvancedFilters: true,
        defaultInstructor: 'all',
        defaultStatus: 'upcoming',
      },
      modifications: {
        trackReschedules: true,
        trackCancellations: true,
        trackReassignments: true,
        highlightModified: true,
        showModificationHistory: true,
        requireReasonForReschedule: true,
        requireReasonForCancellation: true,
        requireReasonForReassignment: true,
        autoNotifyInstructorOnReassignment: true,
        minimumReasonLength: 10,
      },
    }
  })

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('scheduleSettings', JSON.stringify(scheduleSettings))
    }
  }, [scheduleSettings])

  // Update a specific setting
  const updateScheduleSetting = (category: string, key: string, value: any) => {
    setScheduleSettings((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }))
  }

  // Reset all settings to defaults
  const resetScheduleSettings = () => {
    const defaults = {
      display: {
        defaultView: 'list',
        calendarDefaultView: 'week',
        listViewMode: 'table',
        showWeekNumbers: false,
        highlightToday: true,
        showWeekends: true,
        compactMode: false,
        colorCodeByStatus: true,
      },
      filters: {
        rememberLastFilters: true,
        autoApplyFilters: false,
        showAdvancedFilters: true,
        defaultInstructor: 'all',
        defaultStatus: 'upcoming',
      },
      modifications: {
        trackReschedules: true,
        trackCancellations: true,
        trackReassignments: true,
        highlightModified: true,
        showModificationHistory: true,
        requireReasonForReschedule: true,
        requireReasonForCancellation: true,
        requireReasonForReassignment: true,
        autoNotifyInstructorOnReassignment: true,
        minimumReasonLength: 10,
      },
    }
    setScheduleSettings(defaults)
    toast({
      title: "Settings Reset",
      description: "All schedule settings have been reset to defaults.",
    })
  }
  const [selectedView, setSelectedView] = useState<"calendar" | "list">("list")
  const [calendarView, setCalendarView] = useState<"day" | "week" | "month">("day")
  const [listViewMode, setListViewMode] = useState<"grid" | "table">("table")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCohorts, setselectedCohorts] = useState<string[]>([])
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const [filterAction, setFilterAction] = useState<string | null>(null)
  const [sessionFilter, setSessionFilter] = useState({
    instructor: "All",
    courseType: "All",
    status: "All",
    category: "All",
    location: "All",
    timePeriod: "All",
    course: "All",
    date: "All",
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
  })
  const [pendingFilters, setPendingFilters] = useState({
    instructor: "All",
    courseType: "All",
    status: "All",
    category: "All",
    location: "All",
    timePeriod: "All",
    course: "All",
    date: "All",
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
  })
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Column management for schedule table
  const columnManagement = useColumnManagement('schedules')

  // Column configuration for schedule table
  const scheduleColumnConfig = {
    date: { 
      label: 'Date', 
      render: (event: ScheduleEvent) => {
        const today = new Date()
        const eventDate = new Date(event.date)
        const daysDiff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        let relativeText = ''
        if (eventDate.toDateString() === today.toDateString()) {
          relativeText = 'Today'
        } else if (daysDiff === 1) {
          relativeText = 'Tomorrow'
        } else if (daysDiff > 1 && daysDiff <= 7) {
          relativeText = `In ${daysDiff} days`
        } else if (daysDiff < 0) {
          relativeText = `${Math.abs(daysDiff)} days ago`
        } else {
          relativeText = format(eventDate, "dd-MMM-yy")
        }
        
        return (
          <div className="flex flex-col">
            <span className="font-medium text-purple-600 dark:text-purple-400">{relativeText}</span>
            <span className="text-xs text-gray-500 dark:text-white">{format(eventDate, "dd-MMM-yy")}</span>
          </div>
        )
      }
    },
    title: { 
      label: 'Course', 
      render: (event: ScheduleEvent) => {
        // Use course name and cohort name for better identification
        const courseName = event.courseName || event.title.replace(/\s*-\s*Session\s+\d+/i, '')
        const cohortName = event.cohortName
        
        return (
          <div className="flex flex-col">
            <span className="font-medium text-purple-700 dark:text-purple-300">{courseName}</span>
            {cohortName && (
              <span className="text-sm text-blue-600 dark:text-blue-400">{cohortName}</span>
            )}
            <span className="text-xs text-gray-500 dark:text-white">{event.courseId || 'N/A'}</span>
          </div>
        )
      }
    },
    instructor: { 
      label: 'Instructor', 
      render: (event: ScheduleEvent) => {
        if (event.reassignmentInfo) {
          return (
            <div className="flex flex-col">
              <span className="font-medium">{event.instructor}</span>
              <span className="text-xs text-gray-500 dark:text-white">
                {event.reassignmentInfo.type === 'reassigned_from' 
                  ? `Originally assigned, now reassigned to ${event.reassignmentInfo.newInstructor}`
                  : `Reassigned from ${event.reassignmentInfo.originalInstructor}`
                }
              </span>
            </div>
          )
        }
        return event.instructor
      }
    },
    instructorAvailability: { 
      label: 'Instructor Availability', 
      render: (event: ScheduleEvent) => {
        return <InstructorAvailabilityCell event={event} leaveRequests={leaveRequests} loading={loadingLeaveRequests} />
      }
    },
    cohortName: { 
      label: 'Cohort', 
      render: (event: ScheduleEvent) => (
        <div className="flex flex-col">
          <span className="font-medium">{event.cohortName}</span>
          <span className="text-xs text-blue-600 dark:text-blue-400">{event.students}/{event.maxCapacity} students</span>
        </div>
      )
    },
    timePeriod: { 
      label: 'Time Period', 
      render: (event: ScheduleEvent) => {
        const startTime = format(new Date(`2000-01-01T${event.startTime}`), "h:mm a")
        const endTime = format(new Date(`2000-01-01T${event.endTime}`), "h:mm a")
        
        // Get recurring schedule days from cohort or event data
        let scheduleDays = ""
        if (event.cohorts && event.cohorts.length > 0) {
          // Get days from cohort data
          const cohort = event.cohorts[0]
          if (cohort.daysOfWeek && cohort.daysOfWeek.length > 0) {
            scheduleDays = cohort.daysOfWeek.map(day => 
              ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]
            ).join(', ')
          }
        } else if (event.recurringPattern && event.recurringPattern.daysOfWeek) {
          // Get days from recurring pattern
          scheduleDays = event.recurringPattern.daysOfWeek.map(day => 
            ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]
          ).join(', ')
        }
        
        // Fallback to current session day if no recurring data
        if (!scheduleDays) {
          scheduleDays = format(event.date, "EEE")
        }
        
        return (
          <div className="flex flex-col">
            <span className="font-medium text-blue-600 dark:text-blue-400">{startTime} - {endTime}</span>
            {event.rescheduleInfo && event.originalSessionData && (
              <span className="text-xs text-purple-600 dark:text-purple-400 line-through">
                was {format(new Date(`2000-01-01T${event.originalSessionData.startTime}`), "h:mm a")} - {format(new Date(`2000-01-01T${event.originalSessionData.endTime}`), "h:mm a")}
              </span>
            )}
            <span className="text-xs text-gray-500 dark:text-white">{scheduleDays}</span>
          </div>
        )
      }
    },
    location: { label: 'Location', render: (event: ScheduleEvent) => event.location },
    maxCapacity: { label: 'Capacity', render: (event: ScheduleEvent) => event.maxCapacity },
    students: { label: 'Enrolled', render: (event: ScheduleEvent) => event.students },
    status: { 
      label: 'Status', 
      render: (event: ScheduleEvent) => {
        // Handle reassignment status display
        if (event.reassignmentInfo) {
          if (event.reassignmentInfo.type === 'reassigned_from') {
            return (
              <div className="flex flex-col gap-1">
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">
                  Reassigned From
                </Badge>
                <span className="text-xs text-gray-600 dark:text-white">
                  To: {event.reassignmentInfo.newInstructor}
                </span>
              </div>
            )
          } else if (event.reassignmentInfo.type === 'reassigned_to') {
            return (
              <div className="flex flex-col gap-1">
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                  Reassigned To
                </Badge>
                <span className="text-xs text-gray-600 dark:text-white">
                  From: {event.reassignmentInfo.originalInstructor}
                </span>
              </div>
            )
          }
        }
        
        // Standard status colors
        const statusColor = event.status === "Upcoming" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300" :
                           event.status === "Ongoing" ? "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300" :
                           event.status === "Completed" ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" :
                           event.status === "Cancelled" ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300" :
                           "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
        return (
          <Badge className={statusColor}>
            {event.status}
          </Badge>
        )
      }
    },
    sessionNotes: { label: 'Notes', render: (event: ScheduleEvent) => event.sessionNotes ? `${event.sessionNotes.substring(0, 30)}...` : '-' },
    tags: { label: 'Tags', render: (event: ScheduleEvent) => event.tags ? event.tags.join(', ') : '-' }
  }

  // Fetch courses and cohorts data on component mount
  useEffect(() => {
    const loadScheduleData = async () => {
      try {
        setIsLoading(true)
        setLoadingLeaveRequests(true)
        
        // Fetch courses, cohorts, and ONLY modified sessions
        const [coursesResponse, cohortsResponse, leaveRequestsData, modifiedSessions] = await Promise.all([
          fetchCourses(),
          fetchCohorts(),
          fetchLeaveRequests(),
          fetchModifiedSessionsOnly()
        ])
        
        console.log('API Responses:', { 
          coursesCount: coursesResponse?.courses?.length || 0, 
          cohortsCount: cohortsResponse?.length || 0,
          modifiedSessionsCount: modifiedSessions?.length || 0,
          coursesSuccess: coursesResponse?.success !== false,
          coursesError: coursesResponse?.error
        })
        
        // Handle API errors gracefully
        if (coursesResponse?.success === false) {
          console.error('Courses API error:', coursesResponse.error)
          setError(`Failed to load courses: ${coursesResponse.error}`)
          setEvents([])
          return
        }
        
        // Clear any previous errors
        setError(null)
        
        // Generate sessions from courses/cohorts (this is the primary source)
        console.log('� Generating sessions from courses and cohorts...')
        let scheduleEvents = convertToScheduleEvents(coursesResponse, cohortsResponse, currency)
        console.log('✅ Generated', scheduleEvents.length, 'sessions from cohorts')
        
        // Apply modifications from database to the generated sessions
        if (modifiedSessions && modifiedSessions.length > 0) {
          scheduleEvents = applyModificationsToSessions(scheduleEvents, modifiedSessions)
          console.log('✅ Applied', modifiedSessions.length, 'modifications to sessions')
        }
        
        // Validate data consistency
        const validation = validateScheduleConsistency(scheduleEvents)
        if (!validation.isValid) {
          console.warn('Schedule data inconsistencies found:', validation.warnings)
          toast({
            title: "Data Inconsistency Warning",
            description: `Found ${validation.inconsistentSessions.length} sessions with status issues. Some inactive courses/cohorts may be showing.`,
            variant: "destructive"
          })
        }
        
        // Update state
        const cohortCount = Array.isArray(cohortsResponse) ? cohortsResponse.length : (cohortsResponse?.cohorts?.length || 0)
        setEvents(scheduleEvents)
        setLeaveRequests(leaveRequestsData)
        
        if (scheduleEvents.length > 0) {
          const modifiedCount = modifiedSessions?.length || 0
          toast({
            title: "Schedule Loaded",
            description: `Successfully loaded ${scheduleEvents.length} sessions from ${cohortCount} cohorts${modifiedCount > 0 ? ` (${modifiedCount} modified)` : ''}`,
          })
        } else {
          toast({
            title: "No Schedule Data",
            description: "No scheduled sessions found. Create some courses and cohorts to see schedule data.",
            variant: "default"
          })
        }
      } catch (error) {
        console.error('Error loading schedule data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load schedule data')
        setEvents([])
        toast({
          title: "Error Loading Schedule",
          description: "Failed to load schedule data. Please check your connection and try again.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
        setLoadingLeaveRequests(false)
      }
    }

    loadScheduleData()
  }, [])

  // Function to manually refresh schedule data
  const refreshScheduleData = async () => {
    try {
      setIsLoading(true)
      setLoadingLeaveRequests(true)
      
      // Fetch courses, cohorts, and ONLY modified sessions
      const [coursesResponse, cohortsResponse, leaveRequestsData, modifiedSessions] = await Promise.all([
        fetchCourses(),
        fetchCohorts(),
        fetchLeaveRequests(),
        fetchModifiedSessionsOnly()
      ])
      
      // Generate sessions from courses/cohorts
      console.log('🔄 Refresh: Generating sessions from courses and cohorts...')
      let scheduleEvents = convertToScheduleEvents(coursesResponse, cohortsResponse, currency)
      console.log('✅ Refresh: Generated', scheduleEvents.length, 'sessions from cohorts')
      
      // Apply modifications from database
      if (modifiedSessions && modifiedSessions.length > 0) {
        scheduleEvents = applyModificationsToSessions(scheduleEvents, modifiedSessions)
        console.log('✅ Refresh: Applied', modifiedSessions.length, 'modifications')
      }
      
      const cohortCount = Array.isArray(cohortsResponse) ? cohortsResponse.length : (cohortsResponse?.cohorts?.length || 0)
      
      // Validate data consistency on refresh
      const validation = validateScheduleConsistency(scheduleEvents)
      if (!validation.isValid) {
        console.warn('Schedule data inconsistencies found on refresh:', validation.warnings)
      }
      
      setEvents(scheduleEvents)
      setLeaveRequests(leaveRequestsData)
      
      if (scheduleEvents.length === 0) {
        toast({
          title: "No Schedule Data", 
          description: "No scheduled sessions found. Create some courses and cohorts to see schedule data.",
          variant: "default"
        })
      } else {
        const modifiedCount = modifiedSessions?.length || 0
        toast({
          title: "Schedule Refreshed",
          description: `Loaded ${scheduleEvents.length} sessions from ${cohortCount} cohorts${modifiedCount > 0 ? ` (${modifiedCount} modified)` : ''}`,
        })
      }
    } catch (error) {
      console.error('Error refreshing schedule:', error)
      toast({
        title: "Refresh Failed",
        description: "Could not refresh schedule data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      setLoadingLeaveRequests(false)
    }
  }

  // Dialog states
  const [isRescheduleCohortDialogOpen, setIsRescheduleCohortDialogOpen] = useState(false)
  const [isCancelCohortDialogOpen, setIsCancelCohortDialogOpen] = useState(false)
  const [isReassignInstructorDialogOpen, setIsReassignInstructorDialogOpen] = useState(false)
  const [isRecurringDialogOpen, setIsRecurringDialogOpen] = useState(false)
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false)
  const [isCalendarSyncDialogOpen, setIsCalendarSyncDialogOpen] = useState(false)
  const [isBulkActionsDialogOpen, setIsBulkActionsDialogOpen] = useState(false)
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false)
  const [isComingSoonDialogOpen, setIsComingSoonDialogOpen] = useState(false)
  const [comingSoonFeature, setComingSoonFeature] = useState("")
  const [isCohortViewDialogOpen, setIsCohortViewDialogOpen] = useState(false)
  const [isAddSessionDialogOpen, setIsAddSessionDialogOpen] = useState(false)

  const [selectedCohort, setSelectedCohort] = useState<ScheduleEvent | null>(null)
  const [newInstructorId, setNewInstructorId] = useState("")

  const [cancellationReason, setCancellationReason] = useState("")
  const [rescheduleDate, setRescheduleDate] = useState<Date>(new Date())
  const [rescheduleStartTime, setRescheduleStartTime] = useState("09:00")
  const [rescheduleEndTime, setRescheduleEndTime] = useState("10:00")
  const [affectedStudents, setAffectedStudents] = useState<string[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])

  // Add Session form state
  const [newSession, setNewSession] = useState({
    title: "",
    description: "",
    courseId: "none",
    cohortId: "none",
    instructor: "",
    instructorName: "",
    date: new Date(),
    startTime: "09:00",
    endTime: "10:00",
    duration: 60,
    location: "",
    virtualClassroomUrl: "",
    mode: "live" as "live" | "recorded" | "hybrid",
    type: "online" as "online" | "offline" | "hybrid", 
    category: "Teaching" as "Fitness" | "Sports" | "Arts" | "Teaching" | "Other",
    subcategory: "",
    tags: [] as string[],
    sessionNotes: "",
    maxCapacity: 30,
    students: 0,
    waitlist: [] as string[],
    price: 0,
    currency: "",
    paymentRequired: false,
    attendanceRequired: true,
    isRecurring: false,
    recurringPattern: null as any,
    daysOfWeek: [] as number[]
  })
  
  // Available options for dropdowns
  const [availableCourses, setAvailableCourses] = useState<any[]>([])
  const [availableCohorts, setAvailableCohorts] = useState<any[]>([])
  const [availableInstructors, setAvailableInstructors] = useState<any[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  // Filtered options based on selected course
  const [filteredCohorts, setFilteredCohorts] = useState<any[]>([])
  const [filteredInstructors, setFilteredInstructors] = useState<any[]>([])
  const [loadingCourseData, setLoadingCourseData] = useState(false)

  // Check for instructor conflicts across cohorts
  const checkForInstructorConflicts = (cohortData: Partial<ScheduleEvent>) => {
    const conflicts = events.filter(
      (cohort) =>
        cohort.id !== cohortData.id &&
        isSameDay(cohort.date, cohortData.date || new Date()) &&
        cohort.instructor === cohortData.instructor &&
        ((cohortData.startTime! >= cohort.startTime && cohortData.startTime! < cohort.endTime) ||
          (cohortData.endTime! > cohort.startTime && cohortData.endTime! <= cohort.endTime)),
    )
    return conflicts
  }

  // AI-powered scheduling suggestions
  const generateAISuggestions = () => {
    const suggestions = [
      "Consider scheduling more yoga classes during peak hours (6-8 PM)",
      "Michael Brown has low utilization - add more swimming classes",
      "Studio A is underutilized on weekends",
      "High demand for online classes - consider hybrid options",
      "Waitlist for Piano Lessons suggests need for additional sessions",
    ]
    setAiSuggestions(suggestions)
  }

  // Filter sessions based on search term and filters with proper data separation
  const filteredEvents = events.filter((event) => {
    // Basic filters
    const matchesSearch = searchTerm === "" ||
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesInstructor = sessionFilter.instructor === "All" || event.instructor === sessionFilter.instructor
    const matchesCategory = sessionFilter.category === "All" || event.category === sessionFilter.category
    const matchesStatus = sessionFilter.status === "All" || event.status === sessionFilter.status
    const matchesLocation = sessionFilter.location === "All" || event.location === sessionFilter.location
    const matchesCourse = sessionFilter.course === "All" || event.courseName === sessionFilter.course || event.title === sessionFilter.course

    // Ensure proper data separation - original sessions maintain their integrity
    const basicMatches = matchesSearch && matchesInstructor && matchesCategory && matchesStatus && 
                        matchesLocation && matchesCourse
    
    // Don't filter out sessions based on modification status - show both original and modified
    // This ensures users can see the complete picture while maintaining data integrity
    return basicMatches
  })

  // Sort filtered sessions
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (sortBy) {
      case "name":
        aValue = a.title.toLowerCase()
        bValue = b.title.toLowerCase()
        break
      case "date":
        aValue = a.date.getTime()
        bValue = b.date.getTime()
        break
      case "instructor":
        aValue = a.instructor.toLowerCase()
        bValue = b.instructor.toLowerCase()
        break
      case "status":
        aValue = a.status.toLowerCase()
        bValue = b.status.toLowerCase()
        break
      default:
        aValue = a.title.toLowerCase()
        bValue = b.title.toLowerCase()
    }

    if (sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  // Get sessions for display - calendar component handles its own filtering
  const getEventsForDisplay = () => {
    if (selectedView === "calendar") {
      // Calendar component handles its own filtering, so pass all sessions
      return sortedEvents
    } else {
      // List view shows next 7 days from today (inclusive)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const next7Days = new Date(today)
      next7Days.setDate(today.getDate() + 7)
      next7Days.setHours(23, 59, 59, 999) // Include the entire 7th day
      return sortedEvents.filter((event) => {
        const eventDate = new Date(event.date)
        eventDate.setHours(0, 0, 0, 0)
        return eventDate >= today && eventDate <= next7Days
      })
    }
  }

  // Get events for counter - shows what the user actually sees
  const getEventsForCounter = () => {
    if (selectedView === "calendar") {
      // Calculate what the calendar is actually showing based on calendar view
      switch (calendarView) {
        case "day":
          return sortedEvents.filter((event) => isSameDay(event.date, selectedDate))
        case "week": {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const next7Days = new Date(today)
          next7Days.setDate(today.getDate() + 7)
          next7Days.setHours(23, 59, 59, 999) // Include the entire 7th day
          return sortedEvents.filter((event) => {
            const eventDate = new Date(event.date)
            eventDate.setHours(0, 0, 0, 0)
            return eventDate >= today && eventDate <= next7Days
          })
        }
        case "month":
          return sortedEvents
        default:
          return sortedEvents
      }
    } else {
      // List view shows next 7 days from today (inclusive)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const next7Days = new Date(today)
      next7Days.setDate(today.getDate() + 7)
      next7Days.setHours(23, 59, 59, 999) // Include the entire 7th day
      return sortedEvents.filter((event) => {
        const eventDate = new Date(event.date)
        eventDate.setHours(0, 0, 0, 0)
        return eventDate >= today && eventDate <= next7Days
      })
    }
  }

  // For backward compatibility
  const getEventsForView = () => {
    return selectedView === "calendar" ? getEventsForDisplay() : getEventsForDisplay()
  }

  // Export functionality
  const handleExport = () => {
    // Always export only next 7 days from today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const next7Days = new Date(today)
    next7Days.setDate(today.getDate() + 7)
    next7Days.setHours(23, 59, 59, 999)
    
    const eventsToExport = sortedEvents.filter((event) => {
      const eventDate = new Date(event.date)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate >= today && eventDate <= next7Days
    })
    
    if (!eventsToExport.length) {
      toast({
        title: "No events to export",
        description: "No events found in the next 7 days.",
      })
      return
    }

    const csvHeader = "ID,Title,Date,Start Time,End Time,Instructor,Location,Category,Status"
    const csvData = eventsToExport.map(event => [
      event.id,
      `"${event.title}"`,
      format(event.date, 'dd-MMM-yy'),
      event.startTime,
      event.endTime,
      `"${event.instructor}"`,
      `"${event.location}"`,
      event.category,
      event.status
    ].join(',')).join('\n')

    const csvContent = csvHeader + '\n' + csvData
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `schedule_export_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    toast({
      title: "Export successful",
      description: `Exported ${eventsToExport.length} events from the next 7 days to CSV file.`,
    })
  }

  // Generate recurring cohort sessions
  const generateRecurringCohortSessions = (baseCohort: ScheduleEvent, pattern: RecurringPattern): ScheduleEvent[] => {
    const sessions: ScheduleEvent[] = [baseCohort]
    let currentDate = new Date(baseCohort.date)
    let sessionCounter = 1

    while (currentDate < (pattern.endDate || new Date())) {
      // Calculate next occurrence based on frequency
      switch (pattern.frequency) {
        case "daily":
          currentDate = addDays(currentDate, pattern.interval)
          break
        case "weekly":
          currentDate = addDays(currentDate, pattern.interval * 7)
          break
        case "monthly":
          currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + pattern.interval))
          break
      }

      // Check if this date should be skipped (exceptions)
      if (pattern.exceptions?.some((exception) => isSameDay(exception, currentDate))) {
        continue
      }

      // Check if this day of week is included (for weekly patterns)
      if (pattern.frequency === "weekly" && pattern.daysOfWeek && !pattern.daysOfWeek.includes(currentDate.getDay())) {
        continue
      }

      if (currentDate <= (pattern.endDate || new Date())) {
        const recurringSession: ScheduleEvent = {
          ...baseCohort,
          id: `${baseCohort.id}-${sessionCounter}`,
          date: new Date(currentDate),
          qrCode: `qr-${baseCohort.id}-${sessionCounter}`,
        }
        sessions.push(recurringSession)
        sessionCounter++
      }
    }

    return sessions
  }

  // Fetch dropdown options for Add Session form
  const fetchDropdownOptions = async () => {
    setLoadingOptions(true)
    try {
      // Fetch courses
      const coursesResponse = await fetch('/api/dashboard/services/courses')
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json()
        setAvailableCourses(coursesData.courses || [])
      }

      // Fetch cohorts
      const cohortsResponse = await fetch('/api/dashboard/services/cohorts')
      if (cohortsResponse.ok) {
        const cohortsData = await cohortsResponse.json()
        setAvailableCohorts(cohortsData.cohorts || [])
      }

      // Fetch instructors
      const instructorsResponse = await fetch('/api/dashboard/services/user-management/instructors')
      if (instructorsResponse.ok) {
        const instructorsData = await instructorsResponse.json()
        setAvailableInstructors(instructorsData.instructors || [])
      }
    } catch (error) {
      console.error('Error fetching dropdown options:', error)
      toast({
        title: "Error Loading Options",
        description: "Failed to load courses, cohorts, or instructors. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingOptions(false)
    }
  }

  // Fetch cohorts and instructors for selected course
  const fetchCourseSpecificData = async (courseId: string) => {
    if (!courseId || courseId === "none") {
      setFilteredCohorts([])
      setFilteredInstructors([])
      return
    }

    setLoadingCourseData(true)
    try {
      // Fetch cohorts for the specific course
      const cohortsResponse = await fetch(`/api/dashboard/cohorts?courseId=${courseId}`)
      if (cohortsResponse.ok) {
        const cohortsData = await cohortsResponse.json()
        setFilteredCohorts(cohortsData.cohorts || [])
      }

      // Fetch instructors who can teach this course
      // For now, we'll use all instructors, but you can modify the API to filter by course
      const instructorsResponse = await fetch(`/api/instructors?courseId=${courseId}`)
      if (instructorsResponse.ok) {
        const instructorsData = await instructorsResponse.json()
        setFilteredInstructors(instructorsData.instructors || [])
      } else {
        // Fallback to all instructors if course-specific API doesn't exist yet
        setFilteredInstructors(availableInstructors)
      }
    } catch (error) {
      console.error('Error fetching course-specific data:', error)
      // Fallback to all available data
      setFilteredCohorts(availableCohorts.filter(cohort => cohort.courseId === courseId))
      setFilteredInstructors(availableInstructors)
    } finally {
      setLoadingCourseData(false)
    }
  }

  // Handle new session creation
  const handleCreateSession = async () => {
    try {
      // Basic validation
      if (!newSession.title.trim()) {
        toast({
          title: "Validation Error",
          description: "Session title is required.",
          variant: "destructive",
        })
        return
      }

      if (!newSession.instructor || !newSession.instructorName) {
        toast({
          title: "Validation Error", 
          description: "Please select an instructor.",
          variant: "destructive",
        })
        return
      }

      if (newSession.startTime >= newSession.endTime) {
        toast({
          title: "Validation Error",
          description: "End time must be after start time.",
          variant: "destructive",
        })
        return
      }

      // Calculate duration
      const start = new Date(`2000-01-01 ${newSession.startTime}:00`)
      const end = new Date(`2000-01-01 ${newSession.endTime}:00`)
      const duration = (end.getTime() - start.getTime()) / (1000 * 60)

      // Prepare session data
      const sessionData = {
        ...newSession,
        duration,
        sessionId: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        courseId: newSession.courseId === "none" ? null : newSession.courseId,
        cohortId: newSession.cohortId === "none" ? null : newSession.cohortId,
        courseName: newSession.courseId !== "none" ? availableCourses.find(c => c._id === newSession.courseId)?.title || newSession.title : newSession.title,
        cohortName: newSession.cohortId !== "none" ? availableCohorts.find(c => c._id === newSession.cohortId)?.name || "" : "",
        students: newSession.students || 0,
        registeredStudents: [],
        waitlist: newSession.waitlist || [],
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        tags: newSession.tags || [],
        sessionNotes: newSession.sessionNotes || "",
        status: "Upcoming",
        isCancelled: false,
        attendanceRequired: newSession.attendanceRequired,
        reminderSent: false,
        notificationSettings: {
          reminderTime: 30,
          sendSMS: false,
          sendEmail: true,
          sendPush: true,
        },
        // Add recurring pattern if recurring is enabled
        isRecurring: newSession.isRecurring,
        recurringPattern: newSession.isRecurring ? {
          type: 'weekly',
          interval: 1,
          daysOfWeek: newSession.daysOfWeek,
          endDate: null
        } : null,
        createdBy: user?.id || "admin",
        lastModifiedBy: user?.id || "admin",
        version: 1,
      }

      // Check for conflicts
      const response = await fetch('/api/dashboard/services/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 409) {
          toast({
            title: "Schedule Conflict",
            description: errorData.error || "The instructor has a conflicting schedule at this time.",
            variant: "destructive",
          })
          return
        }
        throw new Error(errorData.error || 'Failed to create session')
      }

      const result = await response.json()
      
      // Reset form
      setNewSession({
        title: "",
        description: "",
        courseId: "none",
        cohortId: "none",
        instructor: "",
        instructorName: "",
        date: new Date(),
        startTime: "09:00",
        endTime: "10:00",
        duration: 60,
        location: "",
        virtualClassroomUrl: "",
        mode: "live",
        type: "online",
        category: "Teaching",
        subcategory: "",
        tags: [],
        sessionNotes: "",
        maxCapacity: 30,
        students: 0,
        waitlist: [],
        price: 0,
        currency: "",
        paymentRequired: false,
        attendanceRequired: true,
        isRecurring: false,
        recurringPattern: null,
        daysOfWeek: []
      })

      setIsAddSessionDialogOpen(false)

      toast({
        title: "Session Created Successfully",
        description: `Created new session: ${sessionData.title}`,
        action: <ToastAction altText="Refresh">Refresh</ToastAction>,
      })

      // Refresh data
      refreshScheduleData()

    } catch (error) {
      console.error('Error creating session:', error)
      toast({
        title: "Error Creating Session",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  // Handle rescheduling a cohort session (only affects the specific session)
  const handleRescheduleCohortSession = async () => {
    if (!selectedCohort) return

    try {
      // Import services
      const { checkInstructorConflicts } = await import('@/lib/dashboard/sessionManagement')

      // Check for conflicts first
      const conflicts = checkInstructorConflicts(
        events,
        selectedCohort.instructorId,
        rescheduleDate,
        rescheduleStartTime,
        rescheduleEndTime,
        selectedCohort.id
      )

      if (conflicts.length > 0) {
        const conflictSession = conflicts[0]
        const conflictDetails = `${conflictSession.courseName || conflictSession.title} - ${conflictSession.cohortName || 'Cohort'} (${conflictSession.startTime}-${conflictSession.endTime})`
        
        toast({
          title: "Instructor Has Another Session",
          description: `${selectedCohort.instructor} already has a session at this time: ${conflictDetails}`,
          variant: "destructive",
        })
        return
      }

      // Optimistically update UI immediately
      const updatedEvents = events.map(event => 
        event.id === selectedCohort.id 
          ? { 
              ...event, 
              date: rescheduleDate,
              startTime: rescheduleStartTime,
              endTime: rescheduleEndTime,
              status: "Rescheduled" as const,
              isRescheduled: true
            }
          : event
      )
      setEvents(updatedEvents)

      // Close dialog immediately for instant feedback
      setIsRescheduleCohortDialogOpen(false)
      setSelectedCohort(null)

      toast({
        title: "Session Rescheduled Successfully", 
        description: `${selectedCohort.courseName} session has been rescheduled from ${format(selectedCohort.date, 'dd-MMM-yy')} to ${format(rescheduleDate, 'dd-MMM-yy')}.`,
        action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
      })

      // Persist to database in background (don't await)
      const { persistReschedule } = await import('@/lib/dashboard/sessionModificationService')
      persistReschedule({
        sessionId: selectedCohort.id,
        originalDate: selectedCohort.date,
        newDate: rescheduleDate,
        newStartTime: rescheduleStartTime,
        newEndTime: rescheduleEndTime,
        reason: `Session rescheduled from ${format(selectedCohort.date, 'dd-MMM-yy')} ${selectedCohort.startTime}-${selectedCohort.endTime}`,
        rescheduledBy: user?.name || "System"
      }).then(result => {
        console.log('Reschedule persisted successfully:', result)
      }).catch(error => {
        console.error('Background persist error:', error)
        // Optionally show a subtle notification that background save failed
      })

    } catch (error) {
      console.error('Error rescheduling session:', error)
      toast({
        title: "Reschedule Failed",
        description: error instanceof Error ? error.message : "Failed to reschedule session. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Handle cancelling a cohort session (only affects the specific session)
  const handleCancelCohortSession = async () => {
    if (!selectedCohort) return

    try {
      // Optimistically update UI immediately
      const updatedEvents = events.map(event => 
        event.id === selectedCohort.id 
          ? { ...event, status: "Cancelled" as const, isCancelled: true }
          : event
      )
      setEvents(updatedEvents)

      // Close dialog immediately for instant feedback
      setIsCancelCohortDialogOpen(false)
      setSelectedCohort(null)
      setCancellationReason("")

      toast({
        title: "Session Cancelled Successfully",
        description: `${selectedCohort.courseName} session for ${format(selectedCohort.date, 'dd-MMM-yy')} has been cancelled.`,
        action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
      })

      // Persist to database in background (don't await)
      const { persistCancellation } = await import('@/lib/dashboard/sessionModificationService')
      persistCancellation({
        sessionId: selectedCohort.id,
        reason: cancellationReason,
        cancelledBy: user?.name || "System"
      }).then(result => {
        console.log('Cancellation persisted successfully:', result)
      }).catch(error => {
        console.error('Background persist error:', error)
      })

    } catch (error) {
      console.error('Error cancelling session:', error)
      toast({
        title: "Cancellation Failed",
        description: error instanceof Error ? error.message : "Failed to cancel session. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle reassigning instructor to cohort (only affects the specific session)
  const handleReassignInstructorToCohort = async () => {
    if (!selectedCohort || !newInstructorId) return

    // For now, we'll use the instructor name directly since we don't have instructor API yet
    const newInstructorName = newInstructorId
    if (!newInstructorName) return

    try {
      // Optimistically update UI immediately
      const updatedEvents = events.map(event => 
        event.id === selectedCohort.id 
          ? { 
              ...event, 
              instructor: newInstructorName,
              instructorId: newInstructorId,
              status: "Rescheduled" as const,
              isReassigned: true
            }
          : event
      )
      setEvents(updatedEvents)

      // Close dialog immediately for instant feedback
      setIsReassignInstructorDialogOpen(false)
      setSelectedCohort(null)
      setNewInstructorId('')

      toast({
        title: "Instructor Reassigned Successfully",
        description: `${selectedCohort.courseName} session has been reassigned from ${selectedCohort.instructor} to ${newInstructorName}.`,
        action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
      })

      // Persist to database in background (don't await)
      const { persistReassignment } = await import('@/lib/dashboard/sessionModificationService')
      persistReassignment({
        sessionId: selectedCohort.id,
        originalInstructor: {
          id: selectedCohort.instructorId,
          name: selectedCohort.instructor
        },
        newInstructor: {
          id: newInstructorId,
          name: newInstructorName
        },
        reason: `Instructor reassigned from ${selectedCohort.instructor} to ${newInstructorName}`,
        reassignedBy: user?.name || "System"
      }).then(result => {
        console.log('Reassignment persisted successfully:', result)
      }).catch(error => {
        console.error('Background persist error:', error)
      })

    } catch (error) {
      console.error('Error reassigning instructor:', error)
      toast({
        title: "Reassignment Failed",
        description: error instanceof Error ? error.message : "Failed to reassign instructor. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    const selectedCohortObjects = events.filter((e) => selectedCohorts.includes(e.id))

    switch (action) {
      case "cancel":
        const updatedEvents = events.map((event) =>
          selectedCohorts.includes(event.id) ? { ...event, status: "Cancelled" as const, isCancelled: true } : event,
        )
        setEvents(updatedEvents)
        toast({
          title: "Bulk Cancellation",
          description: `${selectedCohorts.length} cohort sessions have been cancelled.`,
        })
        break
      case "reschedule":
        toast({
          title: "Bulk Reschedule",
          description: "Bulk rescheduling dialog would open here.",
        })
        break
    }

    setselectedCohorts([])
    setIsBulkActionsDialogOpen(false)
  }

  // Handle calendar sync
  const handleCalendarSync = (provider: string) => {
    toast({
      title: "Calendar Sync",
      description: `Syncing with ${provider} calendar...`,
    })

    setTimeout(() => {
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${events.length} events with ${provider}.`,
      })
    }, 2000)
  }

  // Show festive banner for holidays
  const getFestiveBanner = () => {
    const today = new Date()
    const month = today.getMonth()
    const day = today.getDate()

    // Christmas
    if (month === 11 && day >= 20 && day <= 25) {
      return {
        message: "🎄 Merry Christmas! Special holiday classes available.",
        color: "bg-red-100 border-red-300 text-red-800",
      }
    }
    // Diwali (approximate date)
    if (month === 10 && day >= 10 && day <= 15) {
      return {
        message: "🪔 Happy Diwali! Celebrate with our special festive classes.",
        color: "bg-orange-100 border-orange-300 text-orange-800",
      }
    }
    // New Year
    if (month === 0 && day <= 7) {
      return {
        message: "🎉 Happy New Year! Start your fitness journey with us.",
        color: "bg-purple-100 border-purple-300 text-purple-800",
      }
    }

    return null
  }

  const festiveBanner = getFestiveBanner()

  // Milestone celebration
  const checkMilestones = () => {
    if (events.length === 100) {
      toast({
        title: "🎉 Milestone Achieved!",
        description: "Congratulations! You've scheduled 100 classes!",
        action: <ToastAction altText="Celebrate">🎉 Celebrate</ToastAction>,
      })
    }
  }

  useEffect(() => {
    checkMilestones()
    generateAISuggestions()
  }, [events.length])











  return (
    <>
      <div className="container mx-auto py-6">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-white">Loading courses and schedules...</p>
            </div>
          </div>
        ) : (
        <div className="flex flex-col space-y-6">
          {/* Festive Banner */}
          {festiveBanner && (
            <div className={`p-4 rounded-lg border ${festiveBanner.color} animate-pulse`}>
              <p className="text-center font-medium">{festiveBanner.message}</p>
            </div>
          )}

          {/* Error Indicator */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 dark:bg-red-400 rounded-full"></div>
              <span className="text-red-800 dark:text-red-200">{error}</span>
              <button 
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                  // Retry loading
                  window.location.reload();
                }}
                className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Offline Indicator */}
          {isOffline && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-2">
              <WifiOff className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-yellow-800 dark:text-yellow-200">You're offline. Some features may be limited.</span>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-purple-700 flex items-center gap-2">
                Schedule Management
                {isOffline ? <WifiOff className="h-6 w-6 text-yellow-600" /> : null}
              </h1>
              <p className="text-gray-500 dark:text-white">Comprehensive schedule management with AI-powered insights, and advanced analytics.</p>
            </div>

          </div>

          {/* Bulk Actions */}
          {selectedCohorts.length > 0 && (
            <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-purple-700">{selectedCohorts.length} cohort session(s) selected</span>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setIsBulkActionsDialogOpen(true)}>
                      Bulk Actions
                    </Button>
                    <Button size="sm" variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50" onClick={() => setselectedCohorts([])}>
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Tab Navigation */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "analytics" | "schedule" | "settings")}>
            <TabsList className="grid w-full grid-cols-3 bg-transparent gap-2 p-0 h-auto">
              <TabsTrigger 
                value="analytics" 
                className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-orange-400 bg-transparent text-orange-600 font-medium data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-orange-400 data-[state=inactive]:text-orange-600 hover:bg-orange-50 data-[state=active]:hover:bg-purple-700"
              >
                <LayoutDashboard className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="schedule" 
                className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-orange-400 bg-transparent text-orange-600 font-medium data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-orange-400 data-[state=inactive]:text-orange-600 hover:bg-orange-50 data-[state=active]:hover:bg-purple-700"
              >
                <CalendarLucide className="h-4 w-4" />
                Schedule
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-orange-400 bg-transparent text-orange-600 font-medium data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-orange-400 data-[state=inactive]:text-orange-600 hover:bg-orange-50 data-[state=active]:hover:bg-purple-700"
              >
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Analytics Tab Content */}
            <TabsContent value="analytics" className="mt-6">
              <AnalyticsDashboard events={events} />
              
              {/* Coming Soon Features */}
              <div className="mt-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    Coming Soon Features
                  </h3>
                  <p className="text-gray-700 dark:text-white max-w-2xl mx-auto">
                    Exciting new features to enhance your scheduling experience
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  
                  {/* Calendar Sync Card */}
                  <Card 
                    className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 dark:from-gray-800 dark:to-orange-900 border-0 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
                    onClick={() => {
                      setComingSoonFeature("Calendar Sync")
                      setIsComingSoonDialogOpen(true)
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardContent className="p-6 text-center relative z-10">
                      <div className="bg-white dark:bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <CalendarIntegration className="h-8 w-8 text-orange-600" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 inline-flex items-center justify-center gap-2">
                        Sync
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white text-xs rounded-full font-medium">
                          <Image src="/Coming soon.svg" alt="Coming Soon" width={12} height={12} className="inline-block" />
                          Soon
                        </span>
                      </h3>
                      <p className="text-sm text-gray-800 dark:text-white leading-relaxed">
                        Calendar integration with Google, Outlook & more
                      </p>
                      <div className="mt-4 flex justify-center">
                        <div className="w-12 h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"></div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Assistant Card */}
                  <Card 
                    className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-purple-100 to-indigo-200 dark:from-gray-800 dark:to-purple-900 border-0 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
                    onClick={() => {
                      setComingSoonFeature("AI Assistant")
                      setIsComingSoonDialogOpen(true)
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardContent className="p-6 text-center relative z-10">
                      <div className="bg-white dark:bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <Zap className="h-8 w-8 text-purple-600" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 inline-flex items-center justify-center gap-2">
                        AI Assistant
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white text-xs rounded-full font-medium">
                          <Image src="/Coming soon.svg" alt="Coming Soon" width={12} height={12} className="inline-block" />
                          Soon
                        </span>
                      </h3>
                      <p className="text-sm text-gray-800 dark:text-white leading-relaxed">
                        Smart scheduling with intelligent recommendations
                      </p>
                      <div className="mt-4 flex justify-center">
                        <div className="w-12 h-1 bg-gradient-to-r from-purple-400 to-indigo-600 rounded-full"></div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Time Tracker Card */}
                  <Card 
                    className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-200 dark:from-gray-800 dark:to-blue-900 border-0 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
                    onClick={() => {
                      setComingSoonFeature("Time Tracker")
                      setIsComingSoonDialogOpen(true)
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardContent className="p-6 text-center relative z-10">
                      <div className="bg-white dark:bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <Clock className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 inline-flex items-center justify-center gap-2">
                        Time Tracker
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white text-xs rounded-full font-medium">
                          <Image src="/Coming soon.svg" alt="Coming Soon" width={12} height={12} className="inline-block" />
                          Soon
                        </span>
                      </h3>
                      <p className="text-sm text-gray-800 dark:text-white leading-relaxed">
                        Monitor study duration and productivity metrics
                      </p>
                      <div className="mt-4 flex justify-center">
                        <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-cyan-600 rounded-full"></div>
                      </div>
                    </CardContent>
                  </Card>

                </div>
              </div>
            </TabsContent>

            {/* Settings Tab Content */}
            <TabsContent value="settings" className="mt-6">
              <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <CardContent className="p-6">
                  <ScheduleSettings 
                    settings={scheduleSettings}
                    onUpdateSetting={updateScheduleSetting}
                    onResetSettings={resetScheduleSettings}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Schedule Tab Content */}
            <TabsContent value="schedule" className="mt-6">
              <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <CardContent className="p-6">

                  {/* Toolbar matching course management style */}
                  <div className="flex flex-col lg:flex-row gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-white" />
                      <Input
                        placeholder="Search by instructor, cohort, course..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    {/* Filter Button (moved next to search) */}
                    <div className="flex items-center">
                      <Popover open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 flex items-center gap-1 relative group"
                            title="Filter"
                            aria-label="Filter options"
                          >
                            <span className="relative inline-block">
                              <Filter className="h-3.5 w-3.5 text-purple-500 group-hover:text-white" />
                              {filterAction === "applied" && (
                                <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
                                  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-green-500">
                                    <Check className="w-2 h-2 text-white" />
                                  </span>
                                </span>
                              )}
                              {filterAction === "cleared" && (
                                <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
                                  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-red-500">
                                    <X className="w-2 h-2 text-white" />
                                  </span>
                                </span>
                              )}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent 
                          className="w-80 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg z-50"
                          onCloseAutoFocus={(event) => {
                            event.preventDefault();
                          }}
                          onEscapeKeyDown={() => setFilterDropdownOpen(false)}
                          onInteractOutside={() => setFilterDropdownOpen(false)}
                        >
                          <div className="space-y-4">
                            <div>
                              <div className="mb-2 font-semibold text-sm">Status</div>
                              <FilterDropdownWithCheckboxes
                                options={statuses.filter(s => s !== "All").map(status => ({ value: status, label: status }))}
                                value={pendingFilters.status === "All" ? [] : [pendingFilters.status]}
                                onChange={(values) => setPendingFilters(prev => ({ ...prev, status: values.length > 0 ? values[0] : "All" }))}
                                placeholder="All Statuses"
                                className="w-full"
                                showFooterActions={false}
                              />
                            </div>
                            <div>
                              <div className="mb-2 font-semibold text-sm">Course</div>
                              <FilterDropdownWithCheckboxes
                                options={courseNames.filter(c => c !== "All").map(course => ({ value: course, label: course }))}
                                value={pendingFilters.course === "All" ? [] : [pendingFilters.course]}
                                onChange={(values) => setPendingFilters(prev => ({ ...prev, course: values.length > 0 ? values[0] : "All" }))}
                                placeholder="All Courses"
                                className="w-full"
                                showFooterActions={false}
                              />
                            </div>
                            <div>
                              <div className="mb-2 font-semibold text-sm">Instructor</div>
                              <FilterDropdownWithCheckboxes
                                options={instructors.filter(i => i !== "All").map(instructor => ({ value: instructor, label: instructor }))}
                                value={pendingFilters.instructor === "All" ? [] : [pendingFilters.instructor]}
                                onChange={(values) => setPendingFilters(prev => ({ ...prev, instructor: values.length > 0 ? values[0] : "All" }))}
                                placeholder="All Instructors"
                                className="w-full"
                                showFooterActions={false}
                              />
                            </div>
                            <div>
                              <div className="mb-2 font-semibold text-sm">Location</div>
                              <FilterDropdownWithCheckboxes
                                options={locations.filter(l => l !== "All").map(location => ({ value: location, label: location }))}
                                value={pendingFilters.location === "All" ? [] : [pendingFilters.location]}
                                onChange={(values) => setPendingFilters(prev => ({ ...prev, location: values.length > 0 ? values[0] : "All" }))}
                                placeholder="All Locations"
                                className="w-full"
                                showFooterActions={false}
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 mt-6">
                            <Button
                              size="sm"
                              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                              onClick={() => {
                                setSessionFilter({ ...pendingFilters });
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
                                const clearedState = {
                                  instructor: "All",
                                  courseType: "All",
                                  status: "All",
                                  category: "All",
                                  location: "All",
                                  timePeriod: "All",
                                  course: "All",
                                  date: "All",
                                  dateFrom: null,
                                  dateTo: null,
                                };
                                setSessionFilter(clearedState);
                                setPendingFilters(clearedState);
                                setFilterDropdownOpen(false);
                                setFilterAction("cleared");
                              }}
                            >
                              Clear All
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex gap-2">
                      {/* View Toggle - Grid/List/Calendar */}
                      <div className="flex border rounded-md">
                        <Button
                          variant={selectedView === "list" && listViewMode === "grid" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => {
                            setSelectedView("list")
                            setListViewMode("grid")
                          }}
                          className={`rounded-r-none ${selectedView === "list" && listViewMode === "grid" ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}`}
                          title="Grid View"
                        >
                          <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                            <div className="bg-current rounded-sm"></div>
                            <div className="bg-current rounded-sm"></div>
                            <div className="bg-current rounded-sm"></div>
                            <div className="bg-current rounded-sm"></div>
                          </div>
                        </Button>
                        <Button
                          variant={selectedView === "list" && listViewMode === "table" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => {
                            setSelectedView("list")
                            setListViewMode("table")
                          }}
                          className={`rounded-none border-l ${selectedView === "list" && listViewMode === "table" ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}`}
                          title="List View"
                        >
                          <div className="flex flex-col gap-0.5 w-4 h-4">
                            <div className="bg-current h-0.5 rounded-sm"></div>
                            <div className="bg-current h-0.5 rounded-sm"></div>
                            <div className="bg-current h-0.5 rounded-sm"></div>
                          </div>
                        </Button>
                        <Button
                          variant={selectedView === "calendar" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setSelectedView("calendar")}
                          className={`rounded-l-none border-l ${selectedView === "calendar" ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}`}
                          title="Calendar View"
                        >
                          <CalendarLucide className="h-4 w-4 mr-2" />
                      
                        </Button>
                      </div>


                      {/* Sort Dropdown */}
                      <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-9 flex items-center gap-1 group">
                            <ArrowUpDown className="mr-2 h-4 w-4 group-hover:text-white" />
                            <span className="ml-1 text-xs text-gray-600 dark:text-white group-hover:text-white">
                              {sortBy === "date" ? "Date" : 
                               sortBy === "title" ? "Course" : 
                               sortBy === "cohortName" ? "Cohort" :
                               sortBy === "instructor" ? "Instructor" :
                               sortBy === "status" ? "Status" :
                               sortBy === "location" ? "Location" : sortBy}
                            </span>
                            {sortOrder === "asc" ? <ArrowUp className="ml-2 h-3 w-3 group-hover:text-white" /> : <ArrowDown className="ml-2 h-3 w-3 group-hover:text-white" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setSortBy("date")}>
                            Date
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSortBy("title")}>
                            Course
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSortBy("cohortName")}>
                            Cohort
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSortBy("instructor")}>
                            Instructor
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSortBy("location")}>
                            Location
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSortBy("status")}>
                            Status
                          </DropdownMenuItem>
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

                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => {
                          fetchDropdownOptions()
                          setIsAddSessionDialogOpen(true)
                        }}
                        title="Add New Session"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Session
                      </Button>
                      <Button variant="outline" size="sm" title="Download" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </div>
                  </div>

                  {/* Results Counter with Modification Summary */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm font-medium text-purple-700">
                          {getEventsForCounter().length} session{getEventsForCounter().length !== 1 ? 's' : ''} found
                          {selectedView === "list" && " (next 7 days)"}
                          {selectedView === "calendar" && calendarView === "day" && " (selected day)"}
                          {selectedView === "calendar" && calendarView === "week" && " (next 7 days)"}
                          {selectedView === "calendar" && calendarView === "month" && " (all sessions)"}
                        </span>
                      </div>
                      
                      {/* Modification Summary */}
                      {(() => {
                        const displayEvents = getEventsForCounter()
                        const modifiedCount = displayEvents.filter(e => e.isModified).length
                        const rescheduledCount = displayEvents.filter(e => e.modificationType === "rescheduled").length
                        const instructorChangedCount = displayEvents.filter(e => e.modificationType === "instructor_changed").length
                        const cancelledCount = displayEvents.filter(e => e.modificationType === "cancelled").length
                        
                        if (modifiedCount > 0) {
                          return (
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-white">
                              <div className="w-1 h-4 bg-gray-300 rounded"></div>
                              <span>{modifiedCount} modified:</span>
                              {rescheduledCount > 0 && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-blue-500" />
                                  <span className="text-blue-600">{rescheduledCount}</span>
                                </div>
                              )}
                              {instructorChangedCount > 0 && (
                                <div className="flex items-center gap-1">
                                  <RefreshCw className="h-3 w-3 text-purple-500" />
                                  <span className="text-purple-600">{instructorChangedCount}</span>
                                </div>
                              )}
                              {cancelledCount > 0 && (
                                <div className="flex items-center gap-1">
                                  <XCircle className="h-3 w-3 text-red-500" />
                                  <span className="text-red-600">{cancelledCount}</span>
                                </div>
                              )}
                            </div>
                          )
                        }
                        return null
                      })()} 
                    </div>
                    
                    {/* Column Selection Button - only show in table view */}
                    {selectedView === "list" && listViewMode === "table" && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={columnManagement.openColumnSelector}
                        className="h-8 w-8 border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-800/30"
                        title="Column Selection"
                      >
                        <GridIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {selectedView === "calendar" && (
                    <div className="space-y-4">
                      <Tabs value={calendarView} onValueChange={(value) => setCalendarView(value as "day" | "week" | "month")}>
                        <TabsList className="bg-transparent gap-2 p-0 h-auto">
                          <TabsTrigger 
                            value="day"
                            className="px-4 py-2 border-2 border-orange-400 bg-transparent text-orange-600 font-medium data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-orange-400 data-[state=inactive]:text-orange-600 hover:bg-orange-50 data-[state=active]:hover:bg-purple-600"
                          >
                            Day
                          </TabsTrigger>
                          <TabsTrigger 
                            value="week"
                            className="px-4 py-2 border-2 border-orange-400 bg-transparent text-orange-600 font-medium data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-orange-400 data-[state=inactive]:text-orange-600 hover:bg-orange-50 data-[state=active]:hover:bg-purple-600"
                          >
                            Week
                          </TabsTrigger>
                          <TabsTrigger 
                            value="month"
                            className="px-4 py-2 border-2 border-orange-400 bg-transparent text-orange-600 font-medium data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-orange-400 data-[state=inactive]:text-orange-600 hover:bg-orange-50 data-[state=active]:hover:bg-purple-600"
                          >
                            Month
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                      <ScheduleCalendarView
                        schedules={getEventsForDisplay()}
                        onScheduleClick={(event) => {
                          setSelectedCohort(event)
                          setIsCohortViewDialogOpen(true)
                        }}
                        onDateClick={setSelectedDate}
                        onCancelEvent={(cohort) => {
                          setSelectedCohort(cohort)
                          setIsCancelCohortDialogOpen(true)
                        }}
                        onRescheduleEvent={(cohort) => {
                          setSelectedCohort(cohort)
                          setRescheduleDate(cohort.date)
                          setRescheduleStartTime(cohort.startTime)
                          setRescheduleEndTime(cohort.endTime)
                          setIsRescheduleCohortDialogOpen(true)
                        }}
                        onProcessRefund={(cohort) => {
                          setSelectedCohort(cohort)
                          // Process refund logic would go here for individual events
                          setIsRefundDialogOpen(true)
                        }}
                        selectedView={calendarView}
                        onViewChange={(view) => setCalendarView(view)}
                        currentDate={selectedDate}
                        onDateChange={setSelectedDate}
                      />
                    </div>
                  )}
                  {selectedView === "list" && (
                    <>
                      {listViewMode === "grid" && (
                        <div className="overflow-x-auto pb-4">
                          <div className="flex gap-4 min-w-max">
                          {getEventsForDisplay().map((event) => (
                            <Card 
                              key={event.id} 
                              className="border-2 border-orange-400 hover:border-orange-500 transition-colors cursor-pointer flex-none w-80"
                              onClick={() => {
                                setSelectedCohort(event)
                                setIsCohortViewDialogOpen(true)
                              }}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex flex-wrap gap-1">
                                    {event.reassignmentInfo ? (
                                      <Badge 
                                        className={`text-xs ${
                                          event.reassignmentInfo.type === 'reassigned_from' 
                                            ? "bg-orange-100 text-orange-800" 
                                            : "bg-purple-100 text-purple-800"
                                        }`}
                                      >
                                        {event.reassignmentInfo.type === 'reassigned_from' ? 'Reassigned From' : 'Reassigned To'}
                                      </Badge>
                                    ) : (
                                      <Badge 
                                        variant={event.status === "Upcoming" ? "default" : 
                                                 event.status === "Cancelled" ? "destructive" : "outline"}
                                        className={`text-xs ${
                                          event.status === "Completed" ? "bg-green-500 text-white hover:bg-green-500" : ""
                                        }`}
                                      >
                                        {event.status}
                                      </Badge>
                                    )}
                                    {event.isModified && !event.reassignmentInfo && (
                                      <SessionModificationBadge
                                        modificationType={event.modificationType}
                                        size="sm"
                                        variant="default"
                                      />
                                    )}
                                  </div>
                                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      onClick={() => {
                                        setSelectedCohort(event)
                                        setRescheduleDate(event.date)
                                        setRescheduleStartTime(event.startTime)
                                        setRescheduleEndTime(event.endTime)
                                        setIsRescheduleCohortDialogOpen(true)
                                      }}
                                      title="Reschedule Cohort Session"
                                    >
                                      <Clock className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => {
                                        setSelectedCohort(event)
                                        setIsCancelCohortDialogOpen(true)
                                      }}
                                      title="Cancel Cohort Session"
                                    >
                                      <XCircle className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      onClick={() => {
                                        setSelectedCohort(event)
                                        setNewInstructorId('')
                                        setIsReassignInstructorDialogOpen(true)
                                      }}
                                      title="Reassign Instructor"
                                    >
                                      <UserCheck className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                                
                                <h3 className="font-semibold text-lg mb-2 text-purple-700">{getEventDisplayName(event)}</h3>
                                
                                {/* Course and Cohort Info */}
                                {event.cohortName && (
                                  <div className="mb-2">
                                    <span className="text-xs text-gray-500 dark:text-white">Course: </span>
                                    <span className="text-sm font-medium text-purple-600">{event.courseName}</span>
                                    <br />
                                    <span className="text-xs text-gray-500 dark:text-white">Cohort: </span>
                                    <span className="text-sm font-medium text-blue-600">{event.cohortName}</span>
                                  </div>
                                )}
                                
                                {/* Session Date */}
                                <div className="mb-2 text-sm text-gray-600 dark:text-white">
                                  <div className="flex items-center gap-1">
                                    <CalendarLucide className="h-3 w-3 text-purple-500" />
                                    <span className="font-medium">
                                      {format(event.date, 'dd-MMM-yy')}
                                    </span>
                                    <span className="text-xs text-purple-600 ml-1">
                                      {(() => {
                                        const today = new Date()
                                        const eventDate = new Date(event.date)
                                        const diffTime = eventDate.getTime() - today.getTime()
                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                                        
                                        if (diffDays === 0) return "(Today)"
                                        if (diffDays === 1) return "(Tomorrow)"
                                        if (diffDays === -1) return "(Yesterday)"
                                        if (diffDays > 1 && diffDays <= 7) return `(In ${diffDays} days)`
                                        if (diffDays < -1 && diffDays >= -7) return `(${Math.abs(diffDays)} days ago)`
                                        return ""
                                      })()}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="space-y-2 text-sm text-gray-600 dark:text-white">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-blue-500" />
                                    <span>{event.instructor}</span>
                                  </div>
                                  
                                  {/* Cohorts with Timing */}
                                  {event.cohorts && event.cohorts.length > 0 ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-indigo-500" />
                                        <span className="font-medium">Cohorts:</span>
                                      </div>
                                      {event.cohorts.map((cohort) => (
                                        <div key={cohort.id} className="ml-6 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                                          <div className="font-medium text-purple-600">{cohort.name}</div>
                                          <div className="flex items-center gap-2 mt-1">
                                            <Clock className="h-3 w-3 text-green-500" />
                                            <span>{cohort.startTime} - {cohort.endTime}</span>
                                          </div>
                                          <div className="flex items-center gap-2 mt-1">
                                            <MapPin className="h-3 w-3 text-orange-500" />
                                            <span>{cohort.location}</span>
                                          </div>
                                          <div className="flex items-center gap-2 mt-1">
                                            <Users className="h-3 w-3 text-purple-500" />
                                            <span>{cohort.students}/{cohort.maxCapacity} students</span>
                                          </div>
                                          <div className="text-gray-500 dark:text-white">
                                            Days: {cohort.daysOfWeek.map(day => 
                                              ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]
                                            ).join(', ')}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-green-500" />
                                      <span>{event.startTime} - {event.endTime}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-orange-500" />
                                    <span>{event.location}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-purple-500" />
                                    <span>{event.students}/{event.maxCapacity} students</span>
                                  </div>
                                </div>

                                {/* Enhanced Modified Session Details */}
                                {(event.isModified || event.rescheduleInfo || event.cancellationInfo || event.reassignmentInfo) && (
                                  <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 -mx-4 px-4 py-2">
                                    <div className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-2">
                                      {event.modificationType === "rescheduled" && <Clock className="h-3 w-3" />}
                                      {event.modificationType === "instructor_changed" && <RefreshCw className="h-3 w-3" />}
                                      {event.modificationType === "cancelled" && <XCircle className="h-3 w-3" />}
                                      Session Changes:
                                    </div>
                                    <div className="space-y-1 text-xs text-blue-600">
                                      {event.originalSessionData && (
                                        <>
                                          {event.modificationType === "rescheduled" && (
                                            <div className="flex items-center gap-2">
                                              <span className="text-gray-500 dark:text-white">Original:</span> 
                                              <span className="line-through text-red-600">
                                                {format(event.originalSessionData.date, 'dd-MMM-yy')} {event.originalSessionData.startTime}-{event.originalSessionData.endTime}
                                              </span>
                                              <span className="text-gray-400 dark:text-white">→</span>
                                              <span className="text-green-600 font-medium">
                                                {format(event.date, 'dd-MMM-yy')} {event.startTime}-{event.endTime}
                                              </span>
                                            </div>
                                          )}
                                          {event.modificationType === "instructor_changed" && (
                                            <div className="flex items-center gap-2">
                                              <span className="text-gray-500 dark:text-white">Instructor:</span>
                                              <span className="line-through text-red-600">
                                                {event.originalSessionData.instructor}
                                              </span>
                                              <span className="text-gray-400 dark:text-white">→</span>
                                              <span className="text-green-600 font-medium">
                                                {event.instructor}
                                              </span>
                                            </div>
                                          )}
                                          {event.modificationType === "cancelled" && (
                                            <div>
                                              <span className="text-gray-500 dark:text-white">Originally scheduled:</span> 
                                              <span className="ml-1">{format(event.originalSessionData.date, 'dd-MMM-yy')} {event.originalSessionData.startTime}-{event.originalSessionData.endTime}</span>
                                            </div>
                                          )}
                                        </>
                                      )}
                                      
                                      {/* Backend tracking info */}
                                      {event.rescheduleInfo && (
                                        <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                                          Rescheduled by {event.rescheduleInfo.rescheduledBy} at {event.rescheduleInfo.rescheduledAt.toLocaleString()}
                                        </div>
                                      )}
                                      {event.cancellationInfo && (
                                        <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                                          Cancelled by {event.cancellationInfo.cancelledBy}: {event.cancellationInfo.reason}
                                        </div>
                                      )}
                                      {event.reassignmentInfo && (
                                        <div className="text-xs text-purple-500 dark:text-purple-400 mt-1">
                                          Instructor {event.reassignmentInfo.type === 'reassigned_to' ? 'assigned' : 'removed'} at {event.reassignmentInfo.reassignedAt.toLocaleString()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                              </CardContent>
                            </Card>
                          ))}
                          </div>
                        </div>
                      )}

                      {listViewMode === "table" && (
                        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                          <div className="max-h-[600px] overflow-y-auto">
                            <table className="w-full">
                              <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10 border-b-2 border-gray-300 dark:border-gray-700 shadow-sm">
                                <tr>
                                  <th className="px-4 py-3 text-left bg-white dark:bg-gray-900">
                                    <Checkbox
                                      checked={selectedCohorts.length === getEventsForDisplay().length && getEventsForDisplay().length > 0}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setselectedCohorts(getEventsForDisplay().map(e => e.id))
                                        } else {
                                          setselectedCohorts([])
                                        }
                                      }}
                                    />
                                  </th>
                                  {columnManagement.displayedColumns.map(columnId => (
                                    <th key={columnId} className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-white tracking-wider bg-white dark:bg-gray-900">
                                      {scheduleColumnConfig[columnId as keyof typeof scheduleColumnConfig]?.label || columnId}
                                    </th>
                                  ))}
                                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-white tracking-wider bg-white dark:bg-gray-900"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {getEventsForDisplay().map((event) => (
                                  <tr 
                                    key={event.id} 
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                                    onClick={() => {
                                      setSelectedCohort(event)
                                      setIsCohortViewDialogOpen(true)
                                    }}
                                  >
                                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                      <Checkbox
                                        checked={selectedCohorts.includes(event.id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setselectedCohorts([...selectedCohorts, event.id])
                                          } else {
                                            setselectedCohorts(selectedCohorts.filter(id => id !== event.id))
                                          }
                                        }}
                                      />
                                    </td>
                                    {columnManagement.displayedColumns.map(columnId => {
                                      const config = scheduleColumnConfig[columnId as keyof typeof scheduleColumnConfig];
                                      return (
                                        <td key={columnId} className="px-4 py-4 text-sm">
                                          {config?.render ? config.render(event) : (event as any)[columnId] || '-'}
                                        </td>
                                      );
                                    })}
                                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex gap-1">
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                          onClick={() => {
                                            setSelectedCohort(event)
                                            setRescheduleDate(event.date)
                                            setRescheduleStartTime(event.startTime)
                                            setRescheduleEndTime(event.endTime)
                                            setIsRescheduleCohortDialogOpen(true)
                                          }}
                                          title="Reschedule Cohort Session"
                                          disabled={event.status === "Completed" || event.status === "Cancelled"}
                                        >
                                          <Clock className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                          onClick={() => {
                                            setSelectedCohort(event)
                                            setIsCancelCohortDialogOpen(true)
                                          }}
                                          title="Cancel Cohort Session"
                                          disabled={event.status === "Completed" || event.status === "Cancelled"}
                                        >
                                          <XCircle className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                          onClick={() => {
                                            setSelectedCohort(event)
                                            setNewInstructorId('')
                                            setIsReassignInstructorDialogOpen(true)
                                          }}
                                          title="Reassign Instructor"
                                          disabled={event.status === "Completed" || event.status === "Cancelled"}
                                        >
                                          <UserCheck className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        )}
      </div>

      <AIAssistantDialog
        isOpen={isAIAssistantOpen}
        onOpenChange={setIsAIAssistantOpen}
        suggestions={aiSuggestions}
      />

      <RescheduleDialog
        isOpen={isRescheduleCohortDialogOpen}
        onOpenChange={setIsRescheduleCohortDialogOpen}
        title={selectedCohort?.courseName || ""}
        date={rescheduleDate}
        onDateChange={setRescheduleDate}
        startTime={rescheduleStartTime}
        onStartTimeChange={setRescheduleStartTime}
        endTime={rescheduleEndTime}
        onEndTimeChange={setRescheduleEndTime}
        onConfirm={handleRescheduleCohortSession}
      />

      <CancelDialog
        isOpen={isCancelCohortDialogOpen}
        onOpenChange={setIsCancelCohortDialogOpen}
        title={selectedCohort?.courseName || ""}
        reason={cancellationReason}
        onReasonChange={setCancellationReason}
        onConfirm={handleCancelCohortSession}
      />

      <ReassignInstructorDialog
        isOpen={isReassignInstructorDialogOpen}
        onOpenChange={setIsReassignInstructorDialogOpen}
        currentInstructor={selectedCohort?.instructor || ""}
        cohortTitle={selectedCohort?.courseName || ""}
        sessionDate={selectedCohort?.date || new Date()}
        sessionTime={`${selectedCohort?.startTime || ""} - ${selectedCohort?.endTime || ""}`}
        enrolledStudents={selectedCohort?.students || 0}
        instructors={instructors.slice(1).map((name, index) => ({ 
          id: name, 
          name, 
          email: `${name.toLowerCase().replace(/\s+/g, '.')}@uniqbrio.com`,
          qualifications: ['Certified Coach', 'First Aid'],
          availability: [
            // Monday to Friday availability (1-5)
            { dayOfWeek: 1, startTime: '08:00', endTime: '17:00', isAvailable: true },
            { dayOfWeek: 2, startTime: '08:00', endTime: '17:00', isAvailable: true },
            { dayOfWeek: 3, startTime: '08:00', endTime: '17:00', isAvailable: true },
            { dayOfWeek: 4, startTime: '08:00', endTime: '17:00', isAvailable: true },
            { dayOfWeek: 5, startTime: '08:00', endTime: '17:00', isAvailable: true },
            // Weekend availability varies by instructor
            ...(index % 2 === 0 ? [
              { dayOfWeek: 6, startTime: '09:00', endTime: '15:00', isAvailable: true }
            ] : []),
          ],
          workloadScore: Math.floor(Math.random() * 100),
          specializations: name.includes('James') ? ['Basketball', 'Team Sports'] : 
                          name.includes('Doe') ? ['Chess', 'Strategic Thinking'] :
                          name.includes('Carter') ? ['Badminton', 'Racquet Sports'] :
                          name.includes('Fernandes') ? ['Cricket', 'Outdoor Sports'] : ['General'],
          rating: 4.2 + Math.random() * 0.8, // Random rating between 4.2 and 5.0
          totalClasses: Math.floor(Math.random() * 200) + 50
        }))}
        newInstructorId={newInstructorId}
        onInstructorChange={setNewInstructorId}
        onConfirm={handleReassignInstructorToCohort}
        allEvents={events}
        leaveRequests={leaveRequests}
        selectedCohort={selectedCohort || undefined}
      />

      <BulkActionsDialog
        isOpen={isBulkActionsDialogOpen}
        onOpenChange={setIsBulkActionsDialogOpen}
        selectedCount={selectedCohorts.length}
        onAction={(action: "cancel" | "reschedule" | "notify" | "export") => handleBulkAction(action)}
      />

      <CalendarSyncDialog
        isOpen={isCalendarSyncDialogOpen}
        onOpenChange={setIsCalendarSyncDialogOpen}
        onSync={handleCalendarSync}
      />

      {/* Coming Soon Dialog */}
      <Dialog open={isComingSoonDialogOpen} onOpenChange={setIsComingSoonDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              {comingSoonFeature} - Coming Soon!
            </DialogTitle>
            <DialogDescription>
              We're working hard to bring you this exciting feature. Stay tuned for updates!
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🚀</div>
              <p className="text-gray-600 dark:text-white mb-4">
                {comingSoonFeature === "Calendar Sync" 
                  ? "Sync your schedules with Google Calendar, Outlook, and more platforms seamlessly."
                  : "Get intelligent scheduling suggestions, conflict resolution, and automated optimizations powered by AI."
                }
              </p>
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-700 font-medium">
                  🔔 Want to be notified when this feature is ready?
                </p>
                <p className="text-xs text-gray-500 dark:text-white mt-1">
                  Contact your administrator or check for app updates.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setIsComingSoonDialogOpen(false)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Got it! 👍
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Session Dialog */}
      <Dialog open={isAddSessionDialogOpen} onOpenChange={setIsAddSessionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10 pb-4 border-b dark:border-gray-700">
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-500" />
              Add New Session
            </DialogTitle>
            <DialogDescription>
              Create a new session by filling out the details below. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto flex-1 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-700 dark:text-white border-b pb-2">Basic Information</h3>
                
                <div>
                  <Label htmlFor="session-title" className="text-sm font-medium">
                    Session Title *
                  </Label>
                  <Input
                    id="session-title"
                    placeholder="Enter session title"
                    value={newSession.title}
                    onChange={(e) => setNewSession(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="session-description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="session-description"
                    placeholder="Enter session description"
                    value={newSession.description}
                    onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="session-course" className="text-sm font-medium">
                    Course
                  </Label>
                  <Select
                    value={newSession.courseId}
                    onValueChange={(value) => {
                      setNewSession(prev => ({ 
                        ...prev, 
                        courseId: value,
                        cohortId: "", // Reset cohort when course changes
                        instructor: "", // Reset instructor when course changes
                        instructorName: ""
                      }))
                      fetchCourseSpecificData(value)
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingOptions ? (
                        <SelectItem key="loading" value="loading" disabled>Loading courses...</SelectItem>
                      ) : (
                        <>
                          <SelectItem key="none" value="none">No specific course</SelectItem>
                          {availableCourses.map((course) => (
                            <SelectItem key={course._id} value={course._id}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="session-cohort" className="text-sm font-medium">
                    Cohort
                  </Label>
                  <Select
                    value={newSession.cohortId}
                    onValueChange={(value) => setNewSession(prev => ({ ...prev, cohortId: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a cohort" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingCourseData ? (
                        <SelectItem key="loading" value="loading" disabled>Loading cohorts...</SelectItem>
                      ) : !newSession.courseId || newSession.courseId === "none" ? (
                        <SelectItem key="select-course" value="select-course" disabled>Please select a course first</SelectItem>
                      ) : filteredCohorts.length === 0 ? (
                        <SelectItem key="no-cohorts" value="no-cohorts" disabled>No cohorts available for this course</SelectItem>
                      ) : (
                        <>
                          <SelectItem key="none" value="none">No specific cohort</SelectItem>
                          {filteredCohorts.map((cohort) => (
                            <SelectItem key={cohort._id} value={cohort._id}>
                              {cohort.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="session-instructor" className="text-sm font-medium">
                    Instructor *
                  </Label>
                  <Select
                    value={newSession.instructor}
                    onValueChange={(value) => {
                      const instructor = filteredInstructors.find(i => i._id === value)
                      setNewSession(prev => ({ 
                        ...prev, 
                        instructor: value,
                        instructorName: instructor ? `${instructor.firstName} ${instructor.lastName}` : ""
                      }))
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select an instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingCourseData ? (
                        <SelectItem key="loading" value="loading" disabled>Loading instructors...</SelectItem>
                      ) : !newSession.courseId || newSession.courseId === "none" ? (
                        <SelectItem key="select-course" value="select-course" disabled>Please select a course first</SelectItem>
                      ) : filteredInstructors.length === 0 ? (
                        <SelectItem key="no-instructors" value="no-instructors" disabled>No instructors available for this course</SelectItem>
                      ) : (
                        filteredInstructors
                          .filter(instructor => instructor._id && instructor._id.trim() !== '')
                          .map((instructor, index) => (
                            <SelectItem key={instructor._id} value={instructor._id}>
                              {instructor.firstName} {instructor.lastName}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Session Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-700 dark:text-white border-b pb-2">Session Details</h3>
                
                <div>
                  <Label htmlFor="session-category" className="text-sm font-medium">
                    Category *
                  </Label>
                  <Select
                    value={newSession.category}
                    onValueChange={(value: "Fitness" | "Sports" | "Arts" | "Teaching" | "Other") => 
                      setNewSession(prev => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Teaching">Teaching</SelectItem>
                      <SelectItem value="Fitness">Fitness</SelectItem>
                      <SelectItem value="Sports">Sports</SelectItem>
                      <SelectItem value="Arts">Arts</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="session-subcategory" className="text-sm font-medium">
                    Subcategory
                  </Label>
                  <Input
                    id="session-subcategory"
                    placeholder="Enter subcategory (optional)"
                    value={newSession.subcategory}
                    onChange={(e) => setNewSession(prev => ({ ...prev, subcategory: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="session-capacity" className="text-sm font-medium">
                    Max Capacity *
                  </Label>
                  <Input
                    id="session-capacity"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="30"
                    value={newSession.maxCapacity}
                    onChange={(e) => setNewSession(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) || 30 }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="session-tags" className="text-sm font-medium">
                    Tags
                  </Label>
                  <Input
                    id="session-tags"
                    placeholder="Enter tags separated by commas"
                    value={newSession.tags.join(', ')}
                    onChange={(e) => {
                      const tagString = e.target.value
                      const tagsArray = tagString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
                      setNewSession(prev => ({ ...prev, tags: tagsArray }))
                    }}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 dark:text-white mt-1">Separate multiple tags with commas</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="session-students" className="text-sm font-medium">
                      Current Enrollment
                    </Label>
                    <Input
                      id="session-students"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={newSession.students}
                      onChange={(e) => setNewSession(prev => ({ ...prev, students: parseInt(e.target.value) || 0 }))}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 dark:text-white mt-1">Students currently enrolled</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Initial Status
                    </Label>
                    <div className="mt-1 p-2 bg-blue-50 border rounded-md">
                      <Badge className="bg-blue-100 text-blue-800">
                        Upcoming
                      </Badge>
                      <p className="text-xs text-gray-500 dark:text-white mt-1">New sessions start as "Upcoming"</p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="session-notes" className="text-sm font-medium">
                    Session Notes
                  </Label>
                  <Textarea
                    id="session-notes"
                    placeholder="Add any additional notes about this session..."
                    value={newSession.sessionNotes}
                    onChange={(e) => setNewSession(prev => ({ ...prev, sessionNotes: e.target.value }))}
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Date & Time */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-700 dark:text-white border-b pb-2">Date & Time</h3>
                
                <div>
                  <Label htmlFor="session-date" className="text-sm font-medium">
                    Date *
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full mt-1 justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(newSession.date, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newSession.date}
                        onSelect={(date) => date && setNewSession(prev => ({ ...prev, date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="session-start-time" className="text-sm font-medium">
                      Start Time *
                    </Label>
                    <Input
                      id="session-start-time"
                      type="time"
                      value={newSession.startTime}
                      onChange={(e) => setNewSession(prev => ({ ...prev, startTime: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="session-end-time" className="text-sm font-medium">
                      End Time *
                    </Label>
                    <Input
                      id="session-end-time"
                      type="time"
                      value={newSession.endTime}
                      onChange={(e) => setNewSession(prev => ({ ...prev, endTime: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is-recurring"
                    checked={newSession.isRecurring}
                    onCheckedChange={(checked) => setNewSession(prev => ({ ...prev, isRecurring: !!checked }))}
                  />
                  <Label htmlFor="is-recurring" className="text-sm font-medium">
                    Recurring Session
                  </Label>
                </div>

                {newSession.isRecurring && (
                  <div>
                    <Label className="text-sm font-medium">Days of Week</Label>
                    <div className="grid grid-cols-7 gap-1 mt-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                        <div key={day} className="flex flex-col items-center">
                          <Checkbox
                            id={`day-${index}`}
                            checked={newSession.daysOfWeek.includes(index)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewSession(prev => ({
                                  ...prev,
                                  daysOfWeek: [...prev.daysOfWeek, index].sort()
                                }))
                              } else {
                                setNewSession(prev => ({
                                  ...prev,
                                  daysOfWeek: prev.daysOfWeek.filter(d => d !== index)
                                }))
                              }
                            }}
                          />
                          <Label htmlFor={`day-${index}`} className="text-xs mt-1">
                            {day}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Location & Mode */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-700 dark:text-white border-b pb-2">Location & Mode</h3>
                
                <div>
                  <Label htmlFor="session-type" className="text-sm font-medium">
                    Session Type *
                  </Label>
                  <Select
                    value={newSession.type}
                    onValueChange={(value: "online" | "offline" | "hybrid") => 
                      setNewSession(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select session type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="session-mode" className="text-sm font-medium">
                    Mode *
                  </Label>
                  <Select
                    value={newSession.mode}
                    onValueChange={(value: "live" | "recorded" | "hybrid") => 
                      setNewSession(prev => ({ ...prev, mode: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="recorded">Recorded</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newSession.type !== "online" && (
                  <div>
                    <Label htmlFor="session-location" className="text-sm font-medium">
                      Location {newSession.type === "offline" ? "*" : ""}
                    </Label>
                    <Input
                      id="session-location"
                      placeholder="Enter session location"
                      value={newSession.location}
                      onChange={(e) => setNewSession(prev => ({ ...prev, location: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                )}

                {newSession.type !== "offline" && (
                  <div>
                    <Label htmlFor="session-virtual-url" className="text-sm font-medium">
                      Virtual Classroom URL {newSession.type === "online" ? "*" : ""}
                    </Label>
                    <Input
                      id="session-virtual-url"
                      placeholder="https://meet.google.com/..."
                      value={newSession.virtualClassroomUrl}
                      onChange={(e) => setNewSession(prev => ({ ...prev, virtualClassroomUrl: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>

              {/* Payment & Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-700 dark:text-white border-b pb-2">Payment & Settings</h3>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="payment-required"
                    checked={newSession.paymentRequired}
                    onCheckedChange={(checked) => setNewSession(prev => ({ ...prev, paymentRequired: !!checked }))}
                  />
                  <Label htmlFor="payment-required" className="text-sm font-medium">
                    Payment Required
                  </Label>
                </div>

                {newSession.paymentRequired && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="session-price" className="text-sm font-medium">
                        Price
                      </Label>
                      <Input
                        id="session-price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={newSession.price}
                        onChange={(e) => setNewSession(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="session-currency" className="text-sm font-medium">
                        Currency
                      </Label>
                      <Select
                        value={newSession.currency}
                        onValueChange={(value) => setNewSession(prev => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="${currency}">${currency}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="attendance-required"
                    checked={newSession.attendanceRequired}
                    onCheckedChange={(checked) => setNewSession(prev => ({ ...prev, attendanceRequired: !!checked }))}
                  />
                  <Label htmlFor="attendance-required" className="text-sm font-medium">
                    Attendance Required
                  </Label>
                </div>
              </div>
            </div>
          </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-white dark:bg-gray-900 z-10 pt-4 border-t dark:border-gray-700">
            <Button 
              variant="outline" 
              onClick={() => setIsAddSessionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateSession}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Create Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event View Dialog */}
      <Dialog open={isCohortViewDialogOpen} onOpenChange={setIsCohortViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedCohort && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-purple-500" />
                    {selectedCohort.courseName || selectedCohort.title}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCohortViewDialogOpen(false)}
                    className="h-6 w-6 p-0 hover:bg-gray-100"
                  >
                   
                  </Button>
                  {selectedCohort.isModified && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ml-2 ${
                        selectedCohort.modificationType === "rescheduled" ? "border-blue-400 text-blue-700 bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:bg-blue-900/30" :
                        selectedCohort.modificationType === "instructor_changed" ? "border-purple-400 text-purple-700 bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:bg-purple-900/30" :
                        selectedCohort.modificationType === "cancelled" ? "border-red-400 text-red-700 bg-red-50 dark:border-red-600 dark:text-red-300 dark:bg-red-900/30" :
                        "border-gray-400 text-gray-700 bg-gray-50 dark:border-gray-600 dark:text-white dark:bg-gray-800"
                      }`}
                    >
                      {selectedCohort.modificationType === "rescheduled" && <Clock className="h-3 w-3 mr-1" />}
                      {selectedCohort.modificationType === "instructor_changed" && <UserCheck className="h-3 w-3 mr-1" />}
                      {selectedCohort.modificationType === "cancelled" && <XCircle className="h-3 w-3 mr-1" />}
                      Modified Session
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {selectedCohort.isModified 
                    ? `Modified session originally scheduled for ${selectedCohort.originalSessionData?.date ? format(selectedCohort.originalSessionData.date, 'dd-MMM-yy') : format(selectedCohort.date, 'dd-MMM-yy')}`
                    : `Course with cohort sessions scheduled for ${format(selectedCohort.date, 'dd-MMM-yy')}`
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4 space-y-6">
                {/* Status and Basic Info */}
                <div className="flex items-center gap-4">
                  <Badge 
                    variant={selectedCohort.status === "Upcoming" ? "default" : 
                             selectedCohort.status === "Cancelled" ? "destructive" : "outline"}
                    className={selectedCohort.status === "Completed" ? "bg-green-500 text-white hover:bg-green-500" : ""}
                  >
                    {selectedCohort.status}
                  </Badge>
                  
                  {/* Cancelled Tag */}
                  {selectedCohort.modificationType === "cancelled" && (
                    <Badge variant="outline" className="border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30">
                      <XCircle className="h-3 w-3 mr-1" />
                      Cancelled
                    </Badge>
                  )}
                  
                  {/* Reassigned Tag */}
                  {selectedCohort.modificationType === "instructor_changed" && (
                    <Badge variant="outline" className="border-purple-400 dark:border-purple-600 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Reassigned
                    </Badge>
                  )}
                </div>

                {/* Course Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    {selectedCohort.cohortName && (
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-indigo-500" />
                        <div>
                          <p className="font-medium">Cohort</p>
                          <p className="text-sm text-gray-600 dark:text-white">{selectedCohort.cohortName}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">Instructor</p>
                        <p className="text-sm text-gray-600 dark:text-white">{selectedCohort.instructor}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="font-medium">Enrollment</p>
                        <p className="text-sm text-gray-600 dark:text-white">{selectedCohort.students}/{selectedCohort.maxCapacity} students</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Time Slot</p>
                        <p className="text-sm text-gray-600 dark:text-white">{selectedCohort.startTime} - {selectedCohort.endTime}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="font-medium">Location</p>
                        <p className="text-sm text-gray-600 dark:text-white">{selectedCohort.location}</p>
                      </div>
                    </div>
                    
                    {selectedCohort.waitlist && selectedCohort.waitlist.length > 0 && (
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="font-medium">Waitlist</p>
                          <p className="text-sm text-gray-600 dark:text-white">{selectedCohort.waitlist.length} students waiting</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                {(selectedCohort.sessionNotes || 
                  selectedCohort.materials || 
                  selectedCohort.equipment || 
                  selectedCohort.modificationType === "cancelled" || 
                  selectedCohort.modificationType === "instructor_changed" ||
                  selectedCohort.modificationType === "rescheduled") && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Additional Information</h4>
                    
                    {/* Reschedule Details */}
                    {selectedCohort.modificationType === "rescheduled" && selectedCohort.rescheduleInfo && selectedCohort.originalSessionData && (
                      <div className="border-l-4 border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-r">
                        <p className="font-medium text-sm text-blue-800 mb-1">Reschedule Information</p>
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Original Session:</span>
                        </p>
                        <p className="text-sm text-blue-700 ml-4">
                          Date: {format(selectedCohort.originalSessionData.date, 'dd-MMM-yy')}
                        </p>
                        <p className="text-sm text-blue-700 ml-4">
                          Time: {selectedCohort.originalSessionData.startTime} - {selectedCohort.originalSessionData.endTime}
                        </p>
                        <p className="text-sm text-blue-700 ml-4">
                          Instructor: {selectedCohort.originalSessionData.instructor}
                        </p>
                        <p className="text-sm text-blue-700 ml-4">
                          Location: {selectedCohort.originalSessionData.location}
                        </p>
                        <p className="text-sm text-blue-700 mt-2">
                          <span className="font-medium">Rescheduled To:</span>
                        </p>
                        <p className="text-sm text-blue-700 ml-4">
                          Date: {format(selectedCohort.date, 'dd-MMM-yy')}
                        </p>
                        <p className="text-sm text-blue-700 ml-4">
                          Time: {selectedCohort.startTime} - {selectedCohort.endTime}
                        </p>
                        {selectedCohort.rescheduleInfo.reason && (
                          <p className="text-sm text-blue-700 mt-2">
                            <span className="font-medium">Reason:</span> {selectedCohort.rescheduleInfo.reason}
                          </p>
                        )}
                        <p className="text-xs text-blue-600 mt-1">
                          Modified at: {new Intl.DateTimeFormat('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }).format(new Date(selectedCohort.rescheduleInfo.rescheduledAt))} by {selectedCohort.rescheduleInfo.rescheduledBy}
                        </p>
                      </div>
                    )}
                    
                    {/* Cancellation Details */}
                    {selectedCohort.modificationType === "cancelled" && selectedCohort.cancellationInfo && (
                      <div className="border-l-4 border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/30 p-3 rounded-r">
                        <p className="font-medium text-sm text-red-800 mb-1">Cancellation Information</p>
                        {selectedCohort.originalSessionData && (
                          <>
                            <p className="text-sm text-red-700">
                              <span className="font-medium">Original Session:</span>
                            </p>
                            <p className="text-sm text-red-700 ml-4">
                              Date: {format(selectedCohort.originalSessionData.date, 'dd-MMM-yy')}
                            </p>
                            <p className="text-sm text-red-700 ml-4">
                              Time: {selectedCohort.originalSessionData.startTime} - {selectedCohort.originalSessionData.endTime}
                            </p>
                            <p className="text-sm text-red-700 ml-4">
                              Instructor: {selectedCohort.originalSessionData.instructor}
                            </p>
                            <p className="text-sm text-red-700 ml-4">
                              Location: {selectedCohort.originalSessionData.location}
                            </p>
                          </>
                        )}
                        <p className="text-sm text-red-700 mt-2">
                          <span className="font-medium">Reason for Cancellation:</span> {selectedCohort.cancellationInfo.reason}
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          Cancelled at: {new Intl.DateTimeFormat('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }).format(new Date(selectedCohort.cancellationInfo.cancelledAt))} by {selectedCohort.cancellationInfo.cancelledBy}
                        </p>
                      </div>
                    )}
                    
                    {/* Reassignment Details */}
                    {selectedCohort.modificationType === "instructor_changed" && selectedCohort.reassignmentInfo && (
                      <div className="border-l-4 border-purple-400 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/30 p-3 rounded-r">
                        <p className="font-medium text-sm text-purple-800 mb-1">Reassignment Information</p>
                        {selectedCohort.originalSessionData && (
                          <>
                            <p className="text-sm text-purple-700">
                              <span className="font-medium">Original Session Assigned To:</span> {selectedCohort.originalSessionData.instructor}
                            </p>
                          </>
                        )}
                        <p className="text-sm text-purple-700">
                          <span className="font-medium">Reassigned From:</span> {selectedCohort.reassignmentInfo.originalInstructor}
                        </p>
                        <p className="text-sm text-purple-700">
                          <span className="font-medium">Reassigned To:</span> {selectedCohort.reassignmentInfo.newInstructor}
                        </p>
                        {selectedCohort.reassignmentInfo.reason && (
                          <p className="text-sm text-purple-700 mt-2">
                            <span className="font-medium">Reason:</span> {selectedCohort.reassignmentInfo.reason}
                          </p>
                        )}
                        <p className="text-xs text-purple-600 mt-1">
                          Reassigned at: {new Intl.DateTimeFormat('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }).format(new Date(selectedCohort.reassignmentInfo.reassignedAt))}
                        </p>
                      </div>
                    )}
                    
                    {selectedCohort.sessionNotes && (
                      <div>
                        <p className="font-medium text-sm text-gray-700 dark:text-white">Session Notes</p>
                        <p className="text-sm text-gray-600 dark:text-white mt-1">{selectedCohort.sessionNotes}</p>
                      </div>
                    )}
                    
                    {selectedCohort.materials && selectedCohort.materials.length > 0 && (
                      <div>
                        <p className="font-medium text-sm text-gray-700 dark:text-white">Required Materials</p>
                        <ul className="text-sm text-gray-600 dark:text-white mt-1 list-disc list-inside">
                          {selectedCohort.materials.map((material, index) => (
                            <li key={index}>{material}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedCohort.equipment && selectedCohort.equipment.length > 0 && (
                      <div>
                        <p className="font-medium text-sm text-gray-700 dark:text-white">Equipment Available</p>
                        <ul className="text-sm text-gray-600 dark:text-white mt-1 list-disc list-inside">
                          {selectedCohort.equipment.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Registered Students */}
                {(() => {
                  // Get real student names from cohorts
                  const allStudents: string[] = []
                  
                  if (selectedCohort.cohorts && selectedCohort.cohorts.length > 0) {
                    selectedCohort.cohorts.forEach(cohort => {
                      if (cohort.registeredStudents && cohort.registeredStudents.length > 0) {
                        // Filter out dummy/placeholder data and IDs
                        const realStudents = cohort.registeredStudents.filter(student => 
                          student && 
                          typeof student === 'string' && 
                          student.trim() !== '' &&
                          !student.startsWith('STU') && // Remove student IDs
                          !student.includes('Student ') && // Remove generic placeholders
                          student !== 'John Doe' && // Remove common dummy names
                          student !== 'Jane Smith' &&
                          student !== 'Alice Johnson' &&
                          student !== 'Bob Wilson'
                        )
                        allStudents.push(...realStudents)
                      }
                    })
                  }
                  
                  // Remove duplicates
                  const uniqueStudents = Array.from(new Set(allStudents))
                  
                  // Only show section if there are real students
                  if (uniqueStudents.length === 0) {
                    return null
                  }
                  
                  return (
                    <div>
                      <div className="sticky top-12 bg-white dark:bg-gray-900 z-10 py-2 border-b border-gray-100 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-white">Registered Students ({uniqueStudents.length})</h4>
                      </div>
                      <div className="max-h-32 overflow-y-auto mt-2">
                        <ul className="text-sm text-gray-600 dark:text-white space-y-1">
                          {uniqueStudents.map((student, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              {student}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )
                })()}

              </div>
            </>
          )}
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
        requiredColumns={['date', 'title', 'cohortName', 'timePeriod']}
      />
    </>
  )
}
