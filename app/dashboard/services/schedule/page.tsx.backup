"use client"

import { useState, useEffect } from "react"
import MainLayout from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  MapPin,
  Plus,
  Search,
  User,
  Users,
  AlertCircle,
  Download,
  Bell,
  WifiOff,
  Star,
  MessageSquare,
  Video,
  Upload,
  CalendarIcon,
  CalendarIcon as CalendarIntegration,
  Repeat,
  Zap,
  TrendingUp,
  RefreshCw,
  DollarSign,
  XCircle,
  Sparkles,
  Settings,
} from "lucide-react"
import { useApp } from "@/contexts/app-context"
import QRCodeGenerator from "@/components/qr-code-generator"
import NotificationSystem from "@/components/notification-system"
import AnalyticsDashboard from "@/components/analytics-dashboard"
import type { ScheduleEvent, RecurringPattern, Instructor, Room } from "@/types/schedule"

// Enhanced sample data with new features
const sampleEvents: ScheduleEvent[] = [
  {
    id: "SCH001",
    title: "Advanced Yoga",
    instructor: "Sarah Johnson",
    instructorId: "inst-1",
    students: 15,
    registeredStudents: ["John Doe", "Jane Smith", "Robert Brown"],
    date: new Date(2023, 5, 15),
    startTime: "09:00",
    endTime: "10:30",
    location: "Studio A",
    category: "Fitness",
    status: "Upcoming",
    mode: "live",
    type: "offline",
    maxCapacity: 20,
    waitlist: ["Alice Johnson", "Bob Wilson"],
    tags: ["Popular", "Beginner Friendly"],
    qrCode: "qr-sch001",
    sessionNotes: "Focus on breathing techniques",
    materials: ["Yoga mat", "Water bottle"],
    dressCode: "Comfortable workout clothes",
    instructions: "Please arrive 10 minutes early",
    feedback: [],
    badges: [],
    equipment: ["Yoga mats", "Blocks", "Straps"],
    isRecurring: true,
    recurringPattern: {
      frequency: "weekly",
      interval: 1,
      daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
      endDate: new Date(2023, 8, 15),
      exceptions: [new Date(2023, 6, 4)], // Skip July 4th
    },
  },
  {
    id: "SCH002",
    title: "Beginner Swimming",
    instructor: "Michael Brown",
    instructorId: "inst-2",
    students: 10,
    registeredStudents: ["Alice Johnson", "Bob Williams", "Carol Davis"],
    date: new Date(2023, 5, 15),
    startTime: "11:00",
    endTime: "12:30",
    location: "Pool Area",
    category: "Sports",
    status: "Upcoming",
    mode: "live",
    type: "offline",
    maxCapacity: 15,
    waitlist: [],
    tags: ["New", "Water Safety"],
    equipment: ["Pool noodles", "Kickboards"],
    refundStatus: "none",
  },
  {
    id: "SCH003",
    title: "Online Piano Lessons",
    instructor: "David Wilson",
    instructorId: "inst-3",
    students: 5,
    registeredStudents: ["Emma Wilson", "Frank Thomas"],
    date: new Date(2023, 5, 16),
    startTime: "14:00",
    endTime: "15:00",
    location: "Virtual",
    category: "Arts",
    status: "Upcoming",
    mode: "live",
    type: "online",
    joinLink: "https://zoom.us/j/123456789",
    recordingLink: "https://recordings.zoom.us/rec123",
    maxCapacity: 8,
    waitlist: ["Grace Miller"],
    tags: ["Online", "Individual"],
    sessionNotes: "Practice scales before class",
  },
  {
    id: "SCH004",
    title: "Mathematics Tutoring",
    instructor: "Prof. Richard Lee",
    instructorId: "inst-4",
    students: 8,
    registeredStudents: ["Grace Miller", "Henry Davis", "Isabella Garcia"],
    date: new Date(2023, 5, 16),
    startTime: "16:00",
    endTime: "17:30",
    location: "Classroom 101",
    category: "Teaching",
    status: "Upcoming",
    mode: "live",
    type: "offline",
    maxCapacity: 12,
    waitlist: [],
    tags: ["Academic", "Small Group"],
    materials: ["Calculator", "Notebook", "Textbook"],
  },
  {
    id: "SCH005",
    title: "Cancelled Dance Class",
    instructor: "Emma Davis",
    instructorId: "inst-5",
    students: 0,
    registeredStudents: ["Nancy Lee", "Oliver White"],
    date: new Date(2023, 5, 18),
    startTime: "15:00",
    endTime: "16:30",
    location: "Dance Studio",
    category: "Arts",
    status: "Cancelled",
    mode: "live",
    type: "offline",
    isCancelled: true,
    cancellationReason: "Instructor illness",
    maxCapacity: 25,
    waitlist: [],
    tags: [],
    refundStatus: "pending",
    refundAmount: 150,
  },
]

// Sample instructors with enhanced data
const sampleInstructors: Instructor[] = [
  {
    id: "inst-1",
    name: "Sarah Johnson",
    email: "sarah@uniqbrio.com",
    qualifications: ["Certified Yoga Instructor", "200hr YTT"],
    availability: [
      { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", isAvailable: true },
      { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", isAvailable: true },
      { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", isAvailable: true },
    ],
    workloadScore: 75,
    specializations: ["Hatha Yoga", "Vinyasa", "Meditation"],
    rating: 4.8,
    totalClasses: 156,
  },
  {
    id: "inst-2",
    name: "Michael Brown",
    email: "michael@uniqbrio.com",
    qualifications: ["Certified Swimming Instructor", "Water Safety Instructor"],
    availability: [
      { dayOfWeek: 2, startTime: "10:00", endTime: "18:00", isAvailable: true },
      { dayOfWeek: 4, startTime: "10:00", endTime: "18:00", isAvailable: true },
    ],
    workloadScore: 60,
    specializations: ["Beginner Swimming", "Water Safety", "Competitive Swimming"],
    rating: 4.6,
    totalClasses: 89,
  },
]

// Sample rooms
const sampleRooms: Room[] = [
  {
    id: "room-1",
    name: "Studio A",
    capacity: 20,
    equipment: ["Yoga mats", "Blocks", "Straps", "Sound system"],
    availability: [
      { dayOfWeek: 1, startTime: "08:00", endTime: "20:00", isAvailable: true },
      { dayOfWeek: 3, startTime: "08:00", endTime: "20:00", isAvailable: true },
    ],
    location: "Ground Floor",
  },
  {
    id: "room-2",
    name: "Pool Area",
    capacity: 15,
    equipment: ["Pool noodles", "Kickboards", "Lane ropes"],
    availability: [
      { dayOfWeek: 2, startTime: "06:00", endTime: "22:00", isAvailable: true },
      { dayOfWeek: 4, startTime: "06:00", endTime: "22:00", isAvailable: true },
    ],
    location: "Basement",
  },
]

const instructors = [
  "All",
  "Sarah Johnson",
  "Michael Brown",
  "David Wilson",
  "Prof. Richard Lee",
  "James Wilson",
  "Robert Johnson",
  "Emma Davis",
]
const courseTypes = ["All", "Regular", "Workshop", "Private", "Group"]
const statuses = ["All", "Upcoming", "Ongoing", "Completed", "Cancelled", "Pending"]
const categories = ["All", "Fitness", "Sports", "Arts", "Teaching"]
const locations = [
  "All",
  "Studio A",
  "Pool Area",
  "Music Room",
  "Classroom 101",
  "Basketball Court",
  "Dance Studio",
  "Virtual",
]

export default function EnhancedSchedulePage() {
  const { user, theme, toggleTheme, language, setLanguage, isOffline } = useApp()
  const [events, setEvents] = useState<ScheduleEvent[]>(sampleEvents)
  const [instructorData] = useState<Instructor[]>(sampleInstructors)
  const [roomData] = useState<Room[]>(sampleRooms)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedView, setSelectedView] = useState<"day" | "week" | "month" | "list" | "analytics">("day")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [eventFilter, setEventFilter] = useState({
    instructor: "All",
    courseType: "All",
    status: "All",
    category: "All",
    location: "All",
  })

  // Dialog states
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false)
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isRecurringDialogOpen, setIsRecurringDialogOpen] = useState(false)
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false)
  const [isCalendarSyncDialogOpen, setIsCalendarSyncDialogOpen] = useState(false)
  const [isBulkActionsDialogOpen, setIsBulkActionsDialogOpen] = useState(false)
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false)

  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null)
  const [newEvent, setNewEvent] = useState<Partial<ScheduleEvent>>({
    title: "",
    instructor: "",
    instructorId: "",
    students: 0,
    registeredStudents: [],
    date: new Date(),
    startTime: "09:00",
    endTime: "10:00",
    location: "",
    category: "Arts",
    status: "Upcoming",
    mode: "live",
    type: "offline",
    maxCapacity: 20,
    waitlist: [],
    tags: [],
    equipment: [],
    subcategory: "",
  })

  // Recurring pattern state
  const [recurringPattern, setRecurringPattern] = useState<RecurringPattern>({
    frequency: "weekly",
    interval: 1,
    daysOfWeek: [1], // Monday
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
  })

  const [cancellationReason, setCancellationReason] = useState("")
  const [rescheduleDate, setRescheduleDate] = useState<Date>(new Date())
  const [rescheduleStartTime, setRescheduleStartTime] = useState("09:00")
  const [rescheduleEndTime, setRescheduleEndTime] = useState("10:00")
  const [refundAmount, setRefundAmount] = useState(0)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])

  // Check for conflicts
  const checkForConflicts = (eventData: Partial<ScheduleEvent>) => {
    const conflicts = events.filter(
      (event) =>
        event.id !== eventData.id &&
        isSameDay(event.date, eventData.date || new Date()) &&
        event.instructor === eventData.instructor &&
        ((eventData.startTime! >= event.startTime && eventData.startTime! < event.endTime) ||
          (eventData.endTime! > event.startTime && eventData.endTime! <= event.endTime)),
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

  // Filter events based on search term and filters
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesInstructor = eventFilter.instructor === "All" || event.instructor === eventFilter.instructor
    const matchesCategory = eventFilter.category === "All" || event.category === eventFilter.category
    const matchesStatus = eventFilter.status === "All" || event.status === eventFilter.status
    const matchesLocation = eventFilter.location === "All" || event.location === eventFilter.location

    return matchesSearch && matchesInstructor && matchesCategory && matchesStatus && matchesLocation
  })

  // Get events for the selected date/view
  const getEventsForView = () => {
    switch (selectedView) {
      case "day":
        return filteredEvents.filter((event) => isSameDay(event.date, selectedDate))
      case "week": {
        const start = startOfWeek(selectedDate)
        const end = endOfWeek(selectedDate)
        return filteredEvents.filter((event) => event.date >= start && event.date <= end)
      }
      case "month":
        return filteredEvents
      case "list":
        return [...filteredEvents].sort((a, b) => a.date.getTime() - b.date.getTime())
      case "analytics":
        return filteredEvents
      default:
        return filteredEvents
    }
  }

  // Handle adding a new event with conflict detection
  const handleAddEvent = () => {
    const conflicts = checkForConflicts(newEvent)

    if (conflicts.length > 0) {
      toast({
        title: "Scheduling Conflict Detected",
        description: `${newEvent.instructor} has ${conflicts.length} conflicting class(es). Would you like to continue?`,
        action: (
          <ToastAction altText="Continue anyway" onClick={proceedWithAddEvent}>
            Continue
          </ToastAction>
        ),
      })
      return
    }

    proceedWithAddEvent()
  }

  const proceedWithAddEvent = () => {
    const id = `SCH${String(events.length + 1).padStart(3, "0")}`
    const newEventWithId: ScheduleEvent = {
      ...(newEvent as ScheduleEvent),
      id,
      qrCode: `qr-${id}`,
    }

    // Handle recurring events
    if (newEvent.isRecurring && recurringPattern) {
      const recurringEvents = generateRecurringEvents(newEventWithId, recurringPattern)
      setEvents([...events, ...recurringEvents])
    } else {
      setEvents([...events, newEventWithId])
    }

    setIsAddEventDialogOpen(false)
    resetNewEvent()

    toast({
      title: "Event Added",
      description: `${newEventWithId.title} has been scheduled successfully.`,
      action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
    })
  }

  // Generate recurring events
  const generateRecurringEvents = (baseEvent: ScheduleEvent, pattern: RecurringPattern): ScheduleEvent[] => {
    const events: ScheduleEvent[] = [baseEvent]
    let currentDate = new Date(baseEvent.date)
    let eventCounter = 1

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
        const recurringEvent: ScheduleEvent = {
          ...baseEvent,
          id: `${baseEvent.id}-${eventCounter}`,
          date: new Date(currentDate),
          qrCode: `qr-${baseEvent.id}-${eventCounter}`,
        }
        events.push(recurringEvent)
        eventCounter++
      }
    }

    return events
  }

  const resetNewEvent = () => {
    setNewEvent({
      title: "",
      instructor: "",
      instructorId: "",
      students: 0,
      registeredStudents: [],
      date: new Date(),
      startTime: "09:00",
      endTime: "10:00",
      location: "",
      category: "Arts",
      status: "Upcoming",
      mode: "live",
      type: "offline",
      maxCapacity: 20,
      waitlist: [],
      tags: [],
      equipment: [],
      subcategory: "",
    })
    setRecurringPattern({
      frequency: "weekly",
      interval: 1,
      daysOfWeek: [1],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
    })
  }

  // Handle rescheduling an event
  const handleRescheduleEvent = () => {
    if (!selectedEvent) return

    const conflicts = checkForConflicts({
      ...selectedEvent,
      date: rescheduleDate,
      startTime: rescheduleStartTime,
      endTime: rescheduleEndTime,
    })

    if (conflicts.length > 0) {
      toast({
        title: "Rescheduling Conflict",
        description: `This time slot conflicts with ${conflicts.length} other class(es).`,
        action: <ToastAction altText="View conflicts">View Conflicts</ToastAction>,
      })
      return
    }

    const updatedEvents = events.map((event) => {
      if (event.id === selectedEvent.id) {
        return {
          ...event,
          date: rescheduleDate,
          startTime: rescheduleStartTime,
          endTime: rescheduleEndTime,
          isCancelled: false,
          status: "Upcoming" as const,
          qrCode: `qr-${event.id}-rescheduled`,
        }
      }
      return event
    })

    setEvents(updatedEvents)
    setIsRescheduleDialogOpen(false)
    setSelectedEvent(null)

    toast({
      title: "Event Rescheduled",
      description: `${selectedEvent.title} has been rescheduled successfully.`,
      action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
    })
  }

  // Handle cancelling an event with refund processing
  const handleCancelEvent = () => {
    if (!selectedEvent) return

    const updatedEvents = events.map((event) => {
      if (event.id === selectedEvent.id) {
        return {
          ...event,
          status: "Cancelled" as const,
          isCancelled: true,
          cancellationReason,
          refundStatus: refundAmount > 0 ? ("pending" as const) : ("none" as const),
          refundAmount: refundAmount > 0 ? refundAmount : undefined,
        }
      }
      return event
    })

    setEvents(updatedEvents)
    setIsCancelDialogOpen(false)
    setSelectedEvent(null)
    setCancellationReason("")

    toast({
      title: "Event Cancelled",
      description: `${selectedEvent.title} has been cancelled. ${refundAmount > 0 ? `Refund of $${refundAmount} is pending approval.` : ""}`,
      action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
    })
  }

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    const selectedEventObjects = events.filter((e) => selectedEvents.includes(e.id))

    switch (action) {
      case "cancel":
        const updatedEvents = events.map((event) =>
          selectedEvents.includes(event.id) ? { ...event, status: "Cancelled" as const, isCancelled: true } : event,
        )
        setEvents(updatedEvents)
        toast({
          title: "Bulk Cancellation",
          description: `${selectedEvents.length} events have been cancelled.`,
        })
        break
      case "reschedule":
        toast({
          title: "Bulk Reschedule",
          description: "Bulk rescheduling dialog would open here.",
        })
        break
      case "notify":
        toast({
          title: "Bulk Notification",
          description: `Notifications sent for ${selectedEvents.length} events.`,
        })
        break
    }

    setSelectedEvents([])
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

  // Handle navigation
  const handlePrevious = () => {
    switch (selectedView) {
      case "day":
        setSelectedDate((prev) => addDays(prev, -1))
        break
      case "week":
        setSelectedDate((prev) => addDays(prev, -7))
        break
      case "month":
        setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
        break
    }
  }

  const handleNext = () => {
    switch (selectedView) {
      case "day":
        setSelectedDate((prev) => addDays(prev, 1))
        break
      case "week":
        setSelectedDate((prev) => addDays(prev, 7))
        break
      case "month":
        setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
        break
    }
  }

  const handleToday = () => {
    setSelectedDate(new Date())
  }

  // Get the title for the current view
  const getViewTitle = () => {
    switch (selectedView) {
      case "day":
        return format(selectedDate, "MMMM d, yyyy")
      case "week": {
        const start = startOfWeek(selectedDate)
        const end = endOfWeek(selectedDate)
        return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`
      }
      case "month":
        return format(selectedDate, "MMMM yyyy")
      case "list":
        return "All Scheduled Events"
      case "analytics":
        return "Analytics Dashboard"
    }
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
        message: "🎊 Happy New Year! Start your fitness journey with us.",
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
        action: <ToastAction altText="Celebrate">🎊 Celebrate</ToastAction>,
      })
    }
  }

  useEffect(() => {
    checkMilestones()
    generateAISuggestions()
  }, [events.length])

  // Render event card with enhanced features
  const renderEventCard = (event: ScheduleEvent) => {
    const getStatusColor = () => {
      switch (event.status) {
        case "Upcoming":
          return "bg-blue-500"
        case "Ongoing":
          return "bg-green-500"
        case "Completed":
          return "bg-gray-500"
        case "Cancelled":
          return "bg-red-500"
        case "Pending":
          return "bg-orange-500"
      }
    }

    const isSelected = selectedEvents.includes(event.id)

    return (
      <Card
        key={event.id}
        className={`${event.isCancelled ? "border-red-200" : ""} ${isSelected ? "ring-2 ring-purple-500" : ""} transition-all hover:shadow-md`}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedEvents([...selectedEvents, event.id])
                  } else {
                    setSelectedEvents(selectedEvents.filter((id) => id !== event.id))
                  }
                }}
              />
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {event.title}
                  {event.isRecurring && <Repeat className="h-4 w-4 text-purple-500" />}
                  {event.type === "online" && <Video className="h-4 w-4 text-blue-500" />}
                  {event.waitlist.length > 0 && <Users className="h-4 w-4 text-orange-500" />}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  {format(event.date, "EEEE, MMMM d, yyyy")}
                  {event.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor()}>{event.status}</Badge>
              {event.refundStatus === "pending" && (
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  Refund Pending
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-500" />
              {event.startTime} - {event.endTime}
            </div>
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-500" />
              {event.instructor}
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
              {event.location}
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-gray-500" />
              {event.students}/{event.maxCapacity} students
              {event.waitlist.length > 0 && (
                <span className="ml-1 text-orange-600">(+{event.waitlist.length} waitlist)</span>
              )}
            </div>
          </div>

          {/* Progress bar for capacity */}
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span>Capacity</span>
              <span>{Math.round((event.students / event.maxCapacity) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div
                className={`h-full rounded-full ${
                  (event.students / event.maxCapacity) > 0.8 ? "bg-orange-500" : "bg-green-500"
                }`}
                style={{ width: `${(event.students / event.maxCapacity) * 100}%` }}
              />
            </div>
          </div>

          {/* Additional info */}
          {event.joinLink && (
            <div className="mt-2">
              <a
                href={event.joinLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-purple-600 hover:underline flex items-center gap-1"
              >
                <Video className="h-4 w-4" />
                Join Virtual Class
              </a>
            </div>
          )}

          {event.sessionNotes && (
            <div className="mt-2 p-2 bg-blue-50 rounded-md text-sm">
              <strong>Notes:</strong> {event.sessionNotes}
            </div>
          )}

          {event.instructions && (
            <div className="mt-2 p-2 bg-yellow-50 rounded-md text-sm">
              <strong>Instructions:</strong> {event.instructions}
            </div>
          )}

          {event.materials && event.materials.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium">Required Materials:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {event.materials.map((material) => (
                  <Badge key={material} variant="outline" className="text-xs">
                    {material}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {event.isCancelled && event.cancellationReason && (
            <div className="mt-2 p-2 bg-red-50 rounded-md text-sm text-red-600 flex items-start">
              <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
              <div>
                <span className="font-medium">Cancelled:</span> {event.cancellationReason}
                {event.refundAmount && (
                  <div className="mt-1">
                    <span className="font-medium">Refund:</span> ${event.refundAmount}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="flex justify-between items-center w-full">
            <div className="flex gap-2">
              {event.isCancelled ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedEvent(event)
                    setIsRescheduleDialogOpen(true)
                    setRescheduleDate(event.date)
                    setRescheduleStartTime(event.startTime)
                    setRescheduleEndTime(event.endTime)
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reschedule
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50 bg-transparent"
                  onClick={() => {
                    setSelectedEvent(event)
                    setIsCancelDialogOpen(true)
                    setRefundAmount(0)
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}

              {event.refundStatus === "pending" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedEvent(event)
                    setIsRefundDialogOpen(true)
                  }}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Process Refund
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <QRCodeGenerator
                eventId={event.id}
                eventTitle={event.title}
                eventDate={format(event.date, "yyyy-MM-dd")}
                eventTime={`${event.startTime} - ${event.endTime}`}
                location={event.location}
              />

              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Feedback
              </Button>

              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    )
  }

  // Render different views
  const renderDayView = () => {
    const eventsForDay = getEventsForView()
    const hourlyEvents: Record<string, ScheduleEvent[]> = {}

    for (let hour = 0; hour < 24; hour++) {
      const hourString = hour.toString().padStart(2, "0")
      hourlyEvents[hourString] = eventsForDay.filter((event) => {
        const eventHour = event.startTime.split(":")[0]
        return eventHour === hourString
      })
    }

    return (
      <div className="space-y-4">
        {Object.entries(hourlyEvents).map(([hour, hourEvents]) => (
          <div key={hour} className="border-t pt-2">
            <div className="text-sm font-medium text-gray-500 mb-2">{hour}:00</div>
            {hourEvents.length > 0 ? (
              <div className="space-y-2">{hourEvents.map((event) => renderEventCard(event))}</div>
            ) : (
              <div className="h-12 border border-dashed border-gray-200 rounded-md flex items-center justify-center">
                <p className="text-sm text-gray-400">No events scheduled</p>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderWeekView = () => {
    const start = startOfWeek(selectedDate)
    const days = eachDayOfInterval({ start, end: endOfWeek(selectedDate) })

    return (
      <div className="grid grid-cols-7 gap-4">
        {days.map((day) => {
          const dayEvents = filteredEvents.filter((event) => isSameDay(event.date, day))

          return (
            <div key={day.toString()} className="border rounded-md p-2">
              <div className="text-center mb-2">
                <div className="text-sm font-medium">{format(day, "EEE")}</div>
                <div className="text-lg">{format(day, "d")}</div>
              </div>
              <div className="space-y-2">
                {dayEvents.length > 0 ? (
                  dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-2 rounded-md text-xs cursor-pointer transition-colors ${
                        event.isCancelled
                          ? "bg-red-50 border border-red-200 hover:bg-red-100"
                          : "bg-purple-50 border border-purple-200 hover:bg-purple-100"
                      }`}
                      onClick={() => {
                        setSelectedEvent(event)
                        if (event.isCancelled) {
                          setIsRescheduleDialogOpen(true)
                          setRescheduleDate(event.date)
                          setRescheduleStartTime(event.startTime)
                          setRescheduleEndTime(event.endTime)
                        } else {
                          setIsCancelDialogOpen(true)
                        }
                      }}
                    >
                      <div className="font-medium truncate flex items-center gap-1">
                        {event.title}
                        {event.isRecurring && <Repeat className="h-3 w-3" />}
                      </div>
                      <div className="flex items-center text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {event.startTime} - {event.endTime}
                      </div>
                      <div className="flex items-center text-gray-500">
                        <Users className="h-3 w-3 mr-1" />
                        {event.students}/{event.maxCapacity}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-12 border border-dashed border-gray-200 rounded-md flex items-center justify-center">
                    <p className="text-xs text-gray-400">No events</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderMonthView = () => {
    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
    const startDate = new Date(monthStart)
    startDate.setDate(startDate.getDate() - monthStart.getDay())
    const endDate = new Date(monthEnd)
    endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()))

    const days = []
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayEvents = filteredEvents.filter((event) => isSameDay(event.date, day))
            const isCurrentMonth = day.getMonth() === selectedDate.getMonth()
            const isToday = isSameDay(day, new Date())

            return (
              <div
                key={day.toString()}
                className={`min-h-[100px] p-2 border rounded-md ${
                  isCurrentMonth ? "bg-white" : "bg-gray-50"
                } ${isToday ? "ring-2 ring-purple-500" : ""}`}
              >
                <div
                  className={`text-sm font-medium mb-1 ${
                    isCurrentMonth ? "text-gray-900" : "text-gray-400"
                  } ${isToday ? "text-purple-600" : ""}`}
                >
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded truncate cursor-pointer ${
                        event.isCancelled
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : "bg-purple-100 text-purple-700 border border-purple-200"
                      }`}
                      onClick={() => {
                        setSelectedEvent(event)
                        if (event.isCancelled) {
                          setIsRescheduleDialogOpen(true)
                          setRescheduleDate(event.date)
                          setRescheduleStartTime(event.startTime)
                          setRescheduleEndTime(event.endTime)
                        } else {
                          setIsCancelDialogOpen(true)
                        }
                      }}
                      title={`${event.title} - ${event.startTime}`}
                    >
                      <div className="flex items-center gap-1">
                        {event.isRecurring && <Repeat className="h-2 w-2" />}
                        {event.title}
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderListView = () => {
    const eventsForList = getEventsForView()
    const eventsByDate: Record<string, ScheduleEvent[]> = {}

    eventsForList.forEach((event) => {
      const dateString = format(event.date, "yyyy-MM-dd")
      if (!eventsByDate[dateString]) {
        eventsByDate[dateString] = []
      }
      eventsByDate[dateString].push(event)
    })

    return (
      <div className="space-y-6">
        {Object.entries(eventsByDate).length > 0 ? (
          Object.entries(eventsByDate).map(([dateString, dateEvents]) => (
            <div key={dateString}>
              <h3 className="text-lg font-medium mb-2">{format(new Date(dateString), "EEEE, MMMM d, yyyy")}</h3>
              <div className="space-y-2">{dateEvents.map((event) => renderEventCard(event))}</div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No events match your filters.</p>
            <Button
              variant="outline"
              className="mt-2 bg-transparent"
              onClick={() =>
                setEventFilter({
                  instructor: "All",
                  courseType: "All",
                  status: "All",
                  category: "All",
                  location: "All",
                })
              }
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-6">
          {/* Festive Banner */}
          {festiveBanner && (
            <div className={`p-4 rounded-lg border ${festiveBanner.color} animate-pulse`}>
              <p className="text-center font-medium">{festiveBanner.message}</p>
            </div>
          )}

          {/* Offline Indicator */}
          {isOffline && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
              <WifiOff className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-800">You're offline. Some features may be limited.</span>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-purple-700 flex items-center gap-2">
                Schedule Management
                {isOffline ? <WifiOff className="h-6 w-6 text-yellow-600" /> : null}
              </h1>
              <p className="text-gray-500">Advanced scheduling with AI-powered insights</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setIsAddEventDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> New Event
              </Button>

              <NotificationSystem events={events} selectedEvents={selectedEvents} />
              <Button variant="outline" onClick={() => setIsCalendarSyncDialogOpen(true)}>
                <CalendarIntegration className="mr-2 h-4 w-4" /> Sync
              </Button>

              <Button variant="outline" onClick={() => setIsAIAssistantOpen(true)}>
                <Zap className="mr-2 h-4 w-4" /> AI Assistant
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedEvents.length > 0 && (
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-purple-700">{selectedEvents.length} event(s) selected</span>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setIsBulkActionsDialogOpen(true)}>
                      Bulk Actions
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedEvents([])}>
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Calendar Controls */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={handlePrevious}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleNext}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={handleToday}>
                    Today
                  </Button>
                  <h2 className="text-xl font-bold">{getViewTitle()}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search events..."
                      className="pl-8 w-full md:w-[200px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" /> Filters
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 max-h-96 overflow-y-auto">
                      <div className="space-y-4">
                        <h4 className="font-medium">Filter Options</h4>
                        <div className="space-y-2">
                          <Label htmlFor="filter-instructor">Instructor</Label>
                          <Select
                            value={eventFilter.instructor}
                            onValueChange={(value) => setEventFilter({ ...eventFilter, instructor: value })}
                          >
                            <SelectTrigger id="filter-instructor">
                              <SelectValue placeholder="Select instructor" />
                            </SelectTrigger>
                            <SelectContent>
                              {instructors.map((instructor) => (
                                <SelectItem key={instructor} value={instructor}>
                                  {instructor}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="filter-category">Category</Label>
                          <Select
                            value={eventFilter.category}
                            onValueChange={(value) => setEventFilter({ ...eventFilter, category: value })}
                          >
                            <SelectTrigger id="filter-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="filter-status">Status</Label>
                          <Select
                            value={eventFilter.status}
                            onValueChange={(value) => setEventFilter({ ...eventFilter, status: value })}
                          >
                            <SelectTrigger id="filter-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {statuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="filter-location">Location</Label>
                          <Select
                            value={eventFilter.location}
                            onValueChange={(value) => setEventFilter({ ...eventFilter, location: value })}
                          >
                            <SelectTrigger id="filter-location">
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                              {locations.map((location) => (
                                <SelectItem key={location} value={location}>
                                  {location}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-between">
                          <Button
                            variant="outline"
                            onClick={() =>
                              setEventFilter({
                                instructor: "All",
                                courseType: "All",
                                status: "All",
                                category: "All",
                                location: "All",
                              })
                            }
                          >
                            Reset
                          </Button>
                          <Button>Apply Filters</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as any)}>
                    <TabsList>
                      <TabsTrigger value="day">Day</TabsTrigger>
                      <TabsTrigger value="week">Week</TabsTrigger>
                      <TabsTrigger value="month">Month</TabsTrigger>
                      <TabsTrigger value="list">List</TabsTrigger>
                      <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedView === "day" && renderDayView()}
              {selectedView === "week" && renderWeekView()}
              {selectedView === "month" && renderMonthView()}
              {selectedView === "list" && renderListView()}
              {selectedView === "analytics" && <AnalyticsDashboard events={events} />}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Add Event Dialog */}
      <Dialog open={isAddEventDialogOpen} onOpenChange={setIsAddEventDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Event
            </DialogTitle>
            <DialogDescription>Create a new class or event with advanced scheduling options.</DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <button
              onClick={() => (window.location.href = "/settings")}
              className="flex items-center gap-2 hover:bg-gray-100 p-1 rounded transition-colors"
            >
              <Settings className="h-4 w-4 text-gray-500 hover:text-gray-700" />
              <p className="text-sm text-gray-600 hover:text-gray-800">
                To modify any of the options list go to settings
              </p>
            </button>
          </div>

          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Enter event title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={newEvent.category}
                    onValueChange={(value: "Arts" | "Sports") => setNewEvent({ ...newEvent, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arts">Arts</SelectItem>
                      <SelectItem value="Sports">Sports</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory *</Label>
                  <Input
                    id="subcategory"
                    value={newEvent.subcategory || ""}
                    onChange={(e) => setNewEvent({ ...newEvent, subcategory: e.target.value })}
                    placeholder={
                      newEvent.category === "Arts"
                        ? "e.g., Painting, Music, Dance, Theater"
                        : newEvent.category === "Sports"
                          ? "e.g., Swimming, Basketball, Tennis, Football"
                          : "Specify the type"
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructor">Instructor *</Label>
                  <Select
                    value={newEvent.instructor}
                    onValueChange={(value) => {
                      const instructor = instructorData.find((i) => i.name === value)
                      setNewEvent({
                        ...newEvent,
                        instructor: value,
                        instructorId: instructor?.id || "",
                      })
                    }}
                  >
                    <SelectTrigger id="instructor">
                      <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {instructorData.map((instructor) => (
                        <SelectItem key={instructor.id} value={instructor.name}>
                          <div className="flex items-center justify-between w-full">
                            <span>{instructor.name}</span>
                            <div className="flex items-center gap-2 ml-2">
                              <Badge variant="outline" className="text-xs">
                                {instructor.workloadScore}% load
                              </Badge>
                              <div className="flex items-center">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs ml-1">{instructor.rating}</span>
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxCapacity">Max Capacity *</Label>
                  <Input
                    id="maxCapacity"
                    type="number"
                    min="1"
                    value={newEvent.maxCapacity}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value) || 0
                      if (value > 0) {
                        setNewEvent({ ...newEvent, maxCapacity: value })
                      }
                    }}
                    placeholder="Maximum number of students (minimum 1)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newEvent.sessionNotes || ""}
                  onChange={(e) => setNewEvent({ ...newEvent, sessionNotes: e.target.value })}
                  placeholder="Enter event description and notes"
                  className="min-h-[100px]"
                />
              </div>
            </TabsContent>

            <TabsContent value="scheduling" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newEvent.date ? format(newEvent.date, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newEvent.date}
                        onSelect={(date) => date && setNewEvent({ ...newEvent, date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Duration</Label>
                  <div className="p-2 bg-gray-50 rounded-md text-sm font-medium">
                    {newEvent.startTime && newEvent.endTime
                      ? (() => {
                          const start = new Date(`2000-01-01T${newEvent.startTime}:00`)
                          const end = new Date(`2000-01-01T${newEvent.endTime}:00`)
                          const diffMs = end.getTime() - start.getTime()
                          const hours = Math.floor(diffMs / (1000 * 60 * 60))
                          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
                          return `${hours}h ${minutes}m`
                        })()
                      : "Select start and end time"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Select
                    value={newEvent.location}
                    onValueChange={(value) => {
                      setNewEvent({ ...newEvent, location: value })
                      // Update type based on location selection
                      if (value.startsWith("Virtual")) {
                        setNewEvent((prev) => ({ ...prev, location: value, type: "online" }))
                      } else if (value !== "Virtual") {
                        setNewEvent((prev) => ({ ...prev, location: value, type: "offline" }))
                      }
                    }}
                  >
                    <SelectTrigger id="location">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Studio A">Studio A</SelectItem>
                      <SelectItem value="Pool Area">Pool Area</SelectItem>
                      <SelectItem value="Music Room">Music Room</SelectItem>
                      <SelectItem value="Classroom 101">Classroom 101</SelectItem>
                      <SelectItem value="Basketball Court">Basketball Court</SelectItem>
                      <SelectItem value="Dance Studio">Dance Studio</SelectItem>
                      <SelectItem value="Virtual - Zoom">Virtual - Zoom</SelectItem>
                      <SelectItem value="Virtual - Microsoft Teams">Virtual - Microsoft Teams</SelectItem>
                      <SelectItem value="Virtual - Google Meet">Virtual - Google Meet</SelectItem>
                      <SelectItem value="Virtual - WebEx">Virtual - WebEx</SelectItem>
                      <SelectItem value="Virtual - Other">Virtual - Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Show meeting link field if virtual platform is selected */}
                {newEvent.location?.startsWith("Virtual") && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="schedulingJoinLink">
                      {newEvent.location?.includes("Zoom")
                        ? "Zoom Meeting Link"
                        : newEvent.location?.includes("Teams")
                          ? "Microsoft Teams Link"
                          : newEvent.location?.includes("Meet")
                            ? "Google Meet Link"
                            : newEvent.location?.includes("WebEx")
                              ? "WebEx Meeting Link"
                              : "Virtual Meeting Link"}
                    </Label>
                    <Input
                      id="schedulingJoinLink"
                      value={newEvent.joinLink || ""}
                      onChange={(e) => setNewEvent({ ...newEvent, joinLink: e.target.value })}
                      placeholder={
                        newEvent.location?.includes("Zoom")
                          ? "https://zoom.us/j/123456789?pwd=example"
                          : newEvent.location?.includes("Teams")
                            ? "https://teams.microsoft.com/l/meetup-join/..."
                            : newEvent.location?.includes("Meet")
                              ? "https://meet.google.com/abc-defg-hij"
                              : newEvent.location?.includes("WebEx")
                                ? "https://company.webex.com/meet/..."
                                : "Enter meeting link"
                      }
                    />
                    <div className="text-xs text-gray-500">
                      {newEvent.location?.includes("Zoom") && "Include password in the URL if required"}
                      {newEvent.location?.includes("Teams") && "Copy the full meeting invitation link"}
                      {newEvent.location?.includes("Meet") && "Share the Google Meet room link"}
                      {newEvent.location?.includes("WebEx") && "Use the WebEx meeting room URL"}
                      {newEvent.location?.includes("Other") && "Enter the platform meeting link"}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="recurring"
                    checked={newEvent.isRecurring}
                    onCheckedChange={(checked) => setNewEvent({ ...newEvent, isRecurring: checked })}
                  />
                  <Label htmlFor="recurring">Make this a recurring event</Label>
                </div>

                {newEvent.isRecurring && (
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">Recurring Pattern</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Frequency</Label>
                        <Select
                          value={recurringPattern.frequency}
                          onValueChange={(value: "daily" | "weekly" | "monthly") =>
                            setRecurringPattern({ ...recurringPattern, frequency: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {recurringPattern.frequency === "weekly" && (
                      <div className="mt-4">
                        <Label>Days of Week</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                            <div key={day} className="flex items-center space-x-2">
                              <Checkbox
                                id={`day-${index}`}
                                checked={recurringPattern.daysOfWeek?.includes(index)}
                                onCheckedChange={(checked) => {
                                  const currentDays = recurringPattern.daysOfWeek || []
                                  if (checked) {
                                    setRecurringPattern({
                                      ...recurringPattern,
                                      daysOfWeek: [...currentDays, index],
                                    })
                                  } else {
                                    setRecurringPattern({
                                      ...recurringPattern,
                                      daysOfWeek: currentDays.filter((d) => d !== index),
                                    })
                                  }
                                }}
                              />
                              <Label htmlFor={`day-${index}`} className="text-sm">
                                {day}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 space-y-2">
                      <Label>End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-transparent"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {recurringPattern.endDate ? format(recurringPattern.endDate, "PPP") : "Select end date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={recurringPattern.endDate}
                            onSelect={(date) => date && setRecurringPattern({ ...recurringPattern, endDate: date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="resources" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mode">Class Mode</Label>
                  <Select
                    value={newEvent.mode}
                    onValueChange={(value: "live" | "recorded" | "hybrid") => setNewEvent({ ...newEvent, mode: value })}
                  >
                    <SelectTrigger id="mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="recorded">Recorded</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Delivery Type</Label>
                  <Select
                    value={newEvent.type}
                    onValueChange={(value: "online" | "offline" | "hybrid") =>
                      setNewEvent({ ...newEvent, type: value })
                    }
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(newEvent.type === "online" ||
                newEvent.type === "hybrid" ||
                newEvent.location?.startsWith("Virtual")) && (
                <div className="space-y-2">
                  <Label htmlFor="joinLink">
                    {newEvent.location?.includes("Zoom")
                      ? "Zoom Meeting Link"
                      : newEvent.location?.includes("Teams")
                        ? "Microsoft Teams Link"
                        : newEvent.location?.includes("Meet")
                          ? "Google Meet Link"
                          : newEvent.location?.includes("WebEx")
                            ? "WebEx Meeting Link"
                            : "Virtual Meeting Link"}
                  </Label>
                  <Input
                    id="joinLink"
                    value={newEvent.joinLink || ""}
                    onChange={(e) => setNewEvent({ ...newEvent, joinLink: e.target.value })}
                    placeholder={
                      newEvent.location?.includes("Zoom")
                        ? "https://zoom.us/j/123456789"
                        : newEvent.location?.includes("Teams")
                          ? "https://teams.microsoft.com/l/meetup-join/..."
                          : newEvent.location?.includes("Meet")
                            ? "https://meet.google.com/abc-defg-hij"
                            : newEvent.location?.includes("WebEx")
                              ? "https://company.webex.com/meet/..."
                              : "Enter meeting link"
                    }
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="materials">Required Materials</Label>
                <Textarea
                  id="materials"
                  value={newEvent.materials?.join(", ") || ""}
                  onChange={(e) =>
                    setNewEvent({
                      ...newEvent,
                      materials: e.target.value
                        .split(",")
                        .map((m) => m.trim())
                        .filter((m) => m),
                    })
                  }
                  placeholder="Enter materials separated by commas (e.g., Yoga mat, Water bottle, Towel)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment">Equipment Needed</Label>
                <Textarea
                  id="equipment"
                  value={newEvent.equipment?.join(", ") || ""}
                  onChange={(e) =>
                    setNewEvent({
                      ...newEvent,
                      equipment: e.target.value
                        .split(",")
                        .map((e) => e.trim())
                        .filter((e) => e),
                    })
                  }
                  placeholder="Enter equipment separated by commas"
                />
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instructions">Special Instructions</Label>
                <Textarea
                  id="instructions"
                  value={newEvent.instructions || ""}
                  onChange={(e) => setNewEvent({ ...newEvent, instructions: e.target.value })}
                  placeholder="Any special instructions for students (e.g., arrive 10 minutes early, bring ID)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dressCode">Dress Code</Label>
                <Input
                  id="dressCode"
                  value={newEvent.dressCode || ""}
                  onChange={(e) => setNewEvent({ ...newEvent, dressCode: e.target.value })}
                  placeholder="e.g., Comfortable workout clothes, No jewelry"
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {["Popular", "New", "Beginner Friendly", "Advanced", "Limited Seats", "Online", "Trending"].map(
                    (tag) => (
                      <Badge
                        key={tag}
                        variant={newEvent.tags?.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const currentTags = newEvent.tags || []
                          if (currentTags.includes(tag)) {
                            setNewEvent({
                              ...newEvent,
                              tags: currentTags.filter((t) => t !== tag),
                            })
                          } else {
                            setNewEvent({
                              ...newEvent,
                              tags: [...currentTags, tag],
                            })
                          }
                        }}
                      >
                        {tag}
                      </Badge>
                    ),
                  )}
                </div>
              </div>

              {/* Conflict Detection */}
              {newEvent.instructor && newEvent.date && newEvent.startTime && (
                <Card className="p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Conflict Detection
                  </h4>
                  {(() => {
                    const conflicts = checkForConflicts(newEvent)
                    return conflicts.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm text-red-600">⚠️ {conflicts.length} scheduling conflict(s) detected:</p>
                        {conflicts.map((conflict) => (
                          <div key={conflict.id} className="text-sm bg-red-50 p-2 rounded">
                            {conflict.title} - {conflict.startTime} to {conflict.endTime}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-green-600">✅ No conflicts detected</p>
                    )
                  })()}
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEventDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEvent} disabled={!newEvent.title || !newEvent.instructor}>
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Assistant Dialog */}
      <Dialog open={isAIAssistantOpen} onOpenChange={setIsAIAssistantOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              AI Scheduling Assistant
            </DialogTitle>
            <DialogDescription>Get intelligent suggestions to optimize your schedule</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Smart Suggestions
              </h4>
              <div className="space-y-3">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <Sparkles className="h-4 w-4 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm">{suggestion}</p>
                      <Button size="sm" variant="outline" className="mt-2 bg-transparent">
                        Apply Suggestion
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-medium mb-3">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Optimize Capacity
                </Button>
                <Button variant="outline" size="sm">
                  <Clock className="h-4 w-4 mr-2" />
                  Find Best Times
                </Button>
                <Button variant="outline" size="sm">
                  <MapPin className="h-4 w-4 mr-2" />
                  Room Utilization
                </Button>
                <Button variant="outline" size="sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Demand Forecast
                </Button>
              </div>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAIAssistantOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      {selectedEvent && (
        <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reschedule Event</DialogTitle>
              <DialogDescription>Reschedule "{selectedEvent.title}" to a new date and time.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>New Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {rescheduleDate ? format(rescheduleDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={rescheduleDate}
                      onSelect={(date) => date && setRescheduleDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rescheduleStartTime">Start Time</Label>
                  <Input
                    id="rescheduleStartTime"
                    type="time"
                    value={rescheduleStartTime}
                    onChange={(e) => setRescheduleStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rescheduleEndTime">End Time</Label>
                  <Input
                    id="rescheduleEndTime"
                    type="time"
                    value={rescheduleEndTime}
                    onChange={(e) => setRescheduleEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="notify-students" defaultChecked />
                <Label htmlFor="notify-students">Notify students about the change</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="auto-refund" />
                <Label htmlFor="auto-refund">Offer automatic refund option</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRescheduleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRescheduleEvent}>Reschedule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Cancel Dialog with Refund Options */}
      {selectedEvent && (
        <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cancel Event</DialogTitle>
              <DialogDescription>Are you sure you want to cancel "{selectedEvent.title}"?</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cancellationReason">Reason for Cancellation</Label>
                <Textarea
                  id="cancellationReason"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Enter reason for cancellation"
                  className="min-h-[100px]"
                />
              </div>

              <Card className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Refund Options
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="full-refund"
                      checked={refundAmount === 100}
                      onCheckedChange={(checked) => setRefundAmount(checked ? 100 : 0)}
                    />
                    <Label htmlFor="full-refund">Full refund ($100)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="partial-refund"
                      checked={refundAmount === 50}
                      onCheckedChange={(checked) => setRefundAmount(checked ? 50 : 0)}
                    />
                    <Label htmlFor="partial-refund">Partial refund ($50)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="credit-only"
                      checked={refundAmount === 0}
                      onCheckedChange={(checked) => setRefundAmount(checked ? 0 : 100)}
                    />
                    <Label htmlFor="credit-only">Credit only (no refund)</Label>
                  </div>
                </div>
              </Card>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCancelEvent} className="bg-red-600 hover:bg-red-700">
                Confirm Cancellation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk Actions Dialog */}
      <Dialog open={isBulkActionsDialogOpen} onOpenChange={setIsBulkActionsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Actions</DialogTitle>
            <DialogDescription>Perform actions on {selectedEvents.length} selected events</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <Button onClick={() => handleBulkAction("cancel")} variant="outline">
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Selected Events
              </Button>
              <Button onClick={() => handleBulkAction("reschedule")} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Bulk Reschedule
              </Button>
              <Button onClick={() => handleBulkAction("notify")} variant="outline">
                <Bell className="h-4 w-4 mr-2" />
                Send Notifications
              </Button>
              <Button onClick={() => handleBulkAction("export")} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Selected
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkActionsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calendar Sync Dialog */}
      <Dialog open={isCalendarSyncDialogOpen} onOpenChange={setIsCalendarSyncDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIntegration className="h-5 w-5" />
              Calendar Integration
            </DialogTitle>
            <DialogDescription>Sync your schedule with external calendar services</DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <p className="text-sm text-blue-700">We'd love to see you enjoying this feature soon</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-3">
              <Button
                onClick={() => handleCalendarSync("Google Calendar")}
                variant="outline"
                className="w-full justify-start"
              >
                <CalendarIntegration className="h-4 w-4 mr-2" />
                Sync with Google Calendar
              </Button>
              <Button onClick={() => handleCalendarSync("Outlook")} variant="outline" className="w-full justify-start">
                <CalendarIntegration className="h-4 w-4 mr-2" />
                Sync with Outlook
              </Button>
              <Button
                onClick={() => handleCalendarSync("Apple Calendar")}
                variant="outline"
                className="w-full justify-start"
              >
                <CalendarIntegration className="h-4 w-4 mr-2" />
                Sync with Apple Calendar
              </Button>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Import/Export</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  <Upload className="h-4 w-4 mr-2" />
                  Import ICS File
                </Button>
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Export as ICS
                </Button>
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Export as CSV
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCalendarSyncDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
