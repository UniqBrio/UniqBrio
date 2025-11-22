"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/dashboard/ui/card"
import { Button } from "@/components/dashboard/ui/button"
import { Badge } from "@/components/dashboard/ui/badge"
import { Progress } from "@/components/dashboard/ui/progress"
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  Users,
  Repeat,
  Video,
  AlertCircle,
  XCircle,
  RefreshCw,
  DollarSign,
  MessageSquare,
  Download,
  UserCheck
} from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
  eachDayOfInterval as eachDayOfIntervalWeek
} from "date-fns"

import type { ScheduleEvent } from "@/types/dashboard/schedule"
import QRCodeGenerator from "@/components/dashboard/qr-code-generator"

// Helper function to format event display name
const getEventDisplayName = (event: ScheduleEvent): string => {
  const courseName = event.courseName || event.title || "Unknown Course"
  const cohortName = event.cohortName || ""
  
  let baseName = cohortName && cohortName.trim() !== "" 
    ? `${courseName} - ${cohortName}` 
    : courseName
  
  // Add reassignment suffix if applicable
  if (event.reassignmentInfo) {
    if (event.reassignmentInfo.type === 'reassigned_from') {
      baseName += " (Reassigned From)"
    } else if (event.reassignmentInfo.type === 'reassigned_to') {
      baseName += " (Reassigned To)"
    }
  }
  
  return baseName
}

// Helper function to get short event name for compact displays
const getEventShortName = (event: ScheduleEvent): string => {
  const courseName = event.courseName || event.title || "Unknown Course"
  const cohortName = event.cohortName || ""
  
  let baseName = ""
  // For very short displays, show abbreviated format
  if (cohortName && cohortName.trim() !== "") {
    // Try to abbreviate course name if it's too long
    const shortCourseName = courseName.length > 15 ? courseName.substring(0, 12) + "..." : courseName
    const shortCohortName = cohortName.length > 10 ? cohortName.substring(0, 8) + "..." : cohortName
    baseName = `${shortCourseName} - ${shortCohortName}`
  } else {
    baseName = courseName.length > 20 ? courseName.substring(0, 17) + "..." : courseName
  }
  
  // Add reassignment indicator
  if (event.reassignmentInfo) {
    if (event.reassignmentInfo.type === 'reassigned_from') {
      baseName += " (From)"
    } else if (event.reassignmentInfo.type === 'reassigned_to') {
      baseName += " (To)"
    }
  }
  
  return baseName
}

interface ScheduleCalendarViewProps {
  schedules: ScheduleEvent[]
  onScheduleClick: (schedule: ScheduleEvent) => void
  onDateClick: (date: Date) => void
  onAddEvent?: () => void
  onEditEvent?: (schedule: ScheduleEvent) => void
  onCancelEvent?: (schedule: ScheduleEvent) => void
  onRescheduleEvent?: (schedule: ScheduleEvent) => void
  onProcessRefund?: (schedule: ScheduleEvent) => void
  selectedView?: "day" | "week" | "month"
  onViewChange?: (view: "day" | "week" | "month") => void
  currentDate?: Date
  onDateChange?: (date: Date) => void
}

export default function ScheduleCalendarView({
  schedules,
  onScheduleClick,
  onDateClick,
  onAddEvent,
  onEditEvent,
  onCancelEvent,
  onRescheduleEvent,
  onProcessRefund,
  selectedView = "month",
  onViewChange,
  currentDate = new Date(),
  onDateChange,
}: ScheduleCalendarViewProps) {
  const [internalCurrentDate, setInternalCurrentDate] = useState(new Date())
  const [internalSelectedView, setInternalSelectedView] = useState<"day" | "week" | "month">("month")

  const actualCurrentDate = currentDate || internalCurrentDate
  const actualSelectedView = selectedView || internalSelectedView

  const handleViewChange = (view: "day" | "week" | "month") => {
    if (onViewChange) {
      onViewChange(view)
    } else {
      setInternalSelectedView(view)
    }
  }

  const handleDateChange = (date: Date) => {
    if (onDateChange) {
      onDateChange(date)
    } else {
      setInternalCurrentDate(date)
    }
  }

  // Helper function to get the current status of an event based on current time
  const getCurrentStatus = (event: ScheduleEvent): "Upcoming" | "Ongoing" | "Completed" | "Cancelled" | "Pending" => {
    // If the event has a specific status set, use that first
    if (event.status === 'Cancelled') {
      return 'Cancelled'
    }
    if (event.status === 'Pending') {
      return 'Pending'
    }
    
    const now = new Date()
    const sessionDate = new Date(event.date)
    
    // Create full datetime for session start and end
    const [startHour, startMin] = event.startTime.split(':').map(Number)
    const [endHour, endMin] = event.endTime.split(':').map(Number)
    
    const sessionStart = new Date(sessionDate)
    sessionStart.setHours(startHour, startMin, 0, 0)
    
    const sessionEnd = new Date(sessionDate)
    sessionEnd.setHours(endHour, endMin, 0, 0)
    
    // Determine status based on current time
    if (now < sessionStart) {
      return 'Upcoming'
    } else if (now >= sessionStart && now <= sessionEnd) {
      return 'Ongoing'
    } else {
      return 'Completed'
    }
  }

  const getSchedulesForDate = (date: Date) => {
    return schedules.filter(schedule => isSameDay(schedule.date, date))
  }

  const getStatusColor = (status: ScheduleEvent['status']) => {
    switch (status) {
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
      case "Rescheduled":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusBadge = (event: ScheduleEvent) => {
    // Check for reassignment status first
    if (event.reassignmentInfo) {
      if (event.reassignmentInfo.type === 'reassigned_from') {
        return <Badge className="bg-orange-500 hover:bg-orange-600">Reassigned From</Badge>
      } else if (event.reassignmentInfo.type === 'reassigned_to') {
        return <Badge className="bg-purple-500 hover:bg-purple-600">Reassigned To</Badge>
      }
    }

    // Fall back to time-based status
    const status = getCurrentStatus(event)
    switch (status) {
      case "Upcoming":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Upcoming</Badge>
      case "Ongoing":
        return <Badge className="bg-green-500 hover:bg-green-600">Ongoing</Badge>
      case "Completed":
        return <Badge variant="secondary">Completed</Badge>
      case "Cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      case "Pending":
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const renderEventCard = (event: ScheduleEvent) => {
    const isSelected = false // This could be passed as prop if needed

    return (
      <Card
        key={event.id}
        className={`${event.isCancelled ? "border-red-200" : ""} ${isSelected ? "ring-2 ring-purple-500" : ""} transition-all hover:shadow-md cursor-pointer`}
        onClick={() => onScheduleClick(event)}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {getEventDisplayName(event)}
                  {event.isRecurring && <Repeat className="h-4 w-4 text-purple-500" />}
                  {/* Video icon removed from title - shown in details instead */}
                  {event.waitlist && event.waitlist.length > 0 && <Users className="h-4 w-4 text-orange-500" />}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  {format(event.date, "EEEE, MMMM d, yyyy")}
                  {event.tags && event.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(event)}
              {event.refundStatus === "pending" && (
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  Refund Pending
                </Badge>
              )}
              {event.modificationType === "cancelled" && (
                <Badge variant="outline" className="border-red-400 text-red-700 bg-red-50">
                  <XCircle className="h-3 w-3 mr-1" />
                  Cancelled
                </Badge>
              )}
              {event.modificationType === "instructor_changed" && (
                <Badge variant="outline" className="border-purple-400 text-purple-700 bg-purple-50">
                  <UserCheck className="h-3 w-3 mr-1" />
                  Reassigned
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
              {event.rescheduleInfo && event.originalSessionData && (
                <span className="ml-2 text-xs text-purple-600 line-through">
                  (was {event.originalSessionData.startTime} - {event.originalSessionData.endTime})
                </span>
              )}
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-gray-500" />
              {event.students}/{event.maxCapacity} students
              {event.waitlist && event.waitlist.length > 0 && (
                <span className="ml-1 text-orange-600">(+{event.waitlist.length} waitlist)</span>
              )}
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
              {event.location}
            </div>
            <div className="flex items-center">
              <Video className="h-4 w-4 mr-2 text-gray-500" />
              <span className="capitalize">{event.type}</span>
            </div>
          </div>

          {/* Reschedule Information */}
          {event.rescheduleInfo && event.originalSessionData && (
            <div className="mt-2 p-2 bg-purple-50 rounded-md text-sm">
              <div className="flex items-start">
                <RefreshCw className="h-4 w-4 mr-2 mt-0.5 text-purple-600" />
                <div>
                  <span className="font-medium text-purple-800">Rescheduled from:</span>
                  <div className="text-purple-700 mt-1">
                    {format(event.originalSessionData.date, "dd-MMM-yy")} at {event.originalSessionData.startTime} - {event.originalSessionData.endTime}
                  </div>
                  {event.rescheduleInfo.reason && (
                    <div className="text-purple-600 text-xs mt-1">
                      {event.rescheduleInfo.reason}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reassignment Information */}
          {event.reassignmentInfo && (
            <div className="mt-2 p-2 bg-purple-50 rounded-md text-sm">
              <div className="flex items-start">
                <UserCheck className="h-4 w-4 mr-2 mt-0.5 text-purple-600" />
                <div>
                  <span className="font-medium text-purple-800">Instructor Reassigned:</span>
                  <div className="text-purple-700 mt-1">
                    From: {event.reassignmentInfo.originalInstructor} ? To: {event.reassignmentInfo.newInstructor}
                  </div>
                  {event.reassignmentInfo.reason && (
                    <div className="text-purple-600 text-xs mt-1">
                      Reason: {event.reassignmentInfo.reason}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cancellation Information */}
          {event.cancellationInfo && (
            <div className="mt-2 p-2 bg-red-50 rounded-md text-sm">
              <div className="flex items-start">
                <XCircle className="h-4 w-4 mr-2 mt-0.5 text-red-600" />
                <div>
                  <span className="font-medium text-red-800">Cancelled:</span>
                  <div className="text-red-700 mt-1">
                    Reason: {event.cancellationInfo.reason}
                  </div>
                  <div className="text-xs text-red-500 mt-1">
                    Cancelled at: {format(new Date(event.cancellationInfo.cancelledAt), "MMM d, yyyy 'at' h:mm a")} by {event.cancellationInfo.cancelledBy}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Course and Cohort Details */}
          {(event.courseName || event.cohortName) && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {event.courseName && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Course</span>
                    <span className="font-medium text-purple-700">{event.courseName}</span>
                  </div>
                )}
                {event.cohortName && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Cohort</span>
                    <span className="font-medium text-blue-700">{event.cohortName}</span>
                  </div>
                )}
              </div>
              {event.instructor && (
                <div className="mt-2">
                  <span className="text-gray-500 text-xs">Instructor</span>
                  <div className="font-medium text-gray-800">{event.instructor}</div>
                  {event.reassignmentInfo && (
                    <div className="text-xs text-gray-600 mt-1">
                      {event.reassignmentInfo.type === 'reassigned_from' 
                        ? `Originally assigned, now reassigned to ${event.reassignmentInfo.newInstructor}`
                        : `Reassigned from ${event.reassignmentInfo.originalInstructor}`
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Progress bar for capacity */}
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span>Capacity</span>
              <span>{Math.round((event.students / event.maxCapacity) * 100)}%</span>
            </div>
            <Progress
              value={(event.students / event.maxCapacity) * 100}
              className="h-1"
            />
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
                  onClick={(e) => {
                    e.stopPropagation()
                    onRescheduleEvent?.(event)
                  }}
                  disabled={event.status === "Completed" || event.status === "Cancelled"}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reschedule
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50 bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation()
                    onCancelEvent?.(event)
                  }}
                  disabled={event.status === "Completed" || event.status === "Cancelled"}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}

              {event.refundStatus === "pending" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onProcessRefund?.(event)
                  }}
                  disabled={event.status === "Completed"}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Process Refund
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <QRCodeGenerator
                eventId={event.id}
                eventTitle={getEventDisplayName(event)}
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

  const renderCompactEvent = (event: ScheduleEvent) => (
    <div
      key={event.id}
      className={`p-3 rounded-md cursor-pointer transition-colors border ${
        event.isCancelled
          ? "bg-red-50 border-red-200 hover:bg-red-100"
          : "bg-purple-50 border-purple-200 hover:bg-purple-100"
      }`}
      onClick={() => onScheduleClick(event)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium flex items-center gap-2">
            {getEventDisplayName(event)}
            {event.isRecurring && <Repeat className="h-4 w-4 text-purple-500" />}
            {/* Video icon removed from compact view - type shown in details */}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {event.startTime} - {event.endTime}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {event.location}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {event.students}/{event.maxCapacity}
              </span>
            </div>
          </div>
          {event.tags && event.tags.length > 0 && (
            <div className="flex gap-1 mt-2">
              {event.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="ml-2">
          {getStatusBadge(event)}
        </div>
      </div>
    </div>
  )

  const renderDayView = () => {
    const eventsForDay = schedules.filter((event) => isSameDay(event.date, actualCurrentDate))

    if (eventsForDay.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No events scheduled for this day</p>
          </div>
        </div>
      )
    }

    // Sort events by start time
    const sortedEvents = [...eventsForDay].sort((a, b) => {
      const timeA = a.startTime.split(':').map(Number)
      const timeB = b.startTime.split(':').map(Number)
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1])
    })

    return (
      <div className="space-y-4">
        {sortedEvents.map((event) => renderCompactEvent(event))}
      </div>
    )
  }

  const renderWeekView = () => {
    const start = startOfWeek(actualCurrentDate, { weekStartsOn: 1 }) // Start week on Monday
    const end = endOfWeek(actualCurrentDate, { weekStartsOn: 1 }) // End week on Sunday
    const days = eachDayOfIntervalWeek({ start, end })

    return (
      <div className="space-y-4">
        {/* Week header */}
        <div className="grid grid-cols-7 gap-4">
          {days.map((day) => {
            const isToday = isSameDay(day, new Date())
            return (
              <div key={`header-${day.toString()}`} className={`text-center p-2 rounded-md ${isToday ? "bg-purple-100 ring-2 ring-purple-500" : ""}`}>
                <div className={`text-sm font-medium ${isToday ? "text-purple-700" : "text-gray-600"}`}>{format(day, "EEE")}</div>
                <div className={`text-lg font-bold ${isToday ? "text-purple-900" : ""}`}>{format(day, "d")}</div>
              </div>
            )
          })}
        </div>

        {/* Week content */}
        <div className="grid grid-cols-7 gap-4">
          {days.map((day) => {
            const dayEvents = schedules.filter((event) => isSameDay(event.date, day))
            const isToday = isSameDay(day, new Date())

            return (
              <div key={day.toString()} className={`border rounded-md p-2 min-h-[200px] bg-white ${isToday ? "ring-2 ring-purple-500" : ""}`}>
                <div className="space-y-2">
                  {dayEvents.length > 0 ? (
                    dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={`p-2 rounded-md text-xs cursor-pointer transition-colors ${
                          event.isCancelled
                            ? "bg-red-50 border border-red-200 hover:bg-red-100"
                            : "bg-purple-50 border border-purple-200 hover:bg-purple-100"
                        }`}
                        onClick={() => onScheduleClick(event)}
                      >
                        <div className="font-medium truncate flex items-center gap-1">
                          {getEventShortName(event)}
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

  const renderMonthView = () => {
    const monthStart = startOfMonth(actualCurrentDate)
    const monthEnd = endOfMonth(actualCurrentDate)
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
            const dayEvents = schedules.filter((event) => isSameDay(event.date, day))
            const isCurrentMonth = day.getMonth() === actualCurrentDate.getMonth()
            const isToday = isSameDay(day, new Date())

            return (
              <div
                key={day.toString()}
                className={`min-h-[100px] p-2 border rounded-md cursor-pointer ${
                  isCurrentMonth ? "bg-white" : "bg-gray-50"
                } ${isToday ? "ring-2 ring-purple-500" : ""}`}
                onClick={() => onDateClick(day)}
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
                      onClick={(e) => {
                        e.stopPropagation()
                        onScheduleClick(event)
                      }}
                      title={`${getEventDisplayName(event)} - ${event.startTime}`}
                    >
                      <div className="flex items-center gap-1">
                        {event.isRecurring && <Repeat className="h-2 w-2" />}
                        {getEventShortName(event)}
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

  const previousPeriod = () => {
    let newDate: Date
    switch (actualSelectedView) {
      case "day":
        newDate = addDays(actualCurrentDate, -1)
        break
      case "week":
        newDate = addDays(actualCurrentDate, -7)
        break
      case "month":
        newDate = subMonths(actualCurrentDate, 1)
        break
      default:
        newDate = actualCurrentDate
    }
    handleDateChange(newDate)
  }

  const nextPeriod = () => {
    let newDate: Date
    switch (actualSelectedView) {
      case "day":
        newDate = addDays(actualCurrentDate, 1)
        break
      case "week":
        newDate = addDays(actualCurrentDate, 7)
        break
      case "month":
        newDate = addMonths(actualCurrentDate, 1)
        break
      default:
        newDate = actualCurrentDate
    }
    handleDateChange(newDate)
  }

  const goToToday = () => {
    handleDateChange(new Date())
  }

  const getViewTitle = () => {
    switch (actualSelectedView) {
      case "day":
        return format(actualCurrentDate, "MMMM d, yyyy")
      case "week": {
        const start = startOfWeek(actualCurrentDate, { weekStartsOn: 1 }) // Start week on Monday
        const end = endOfWeek(actualCurrentDate, { weekStartsOn: 1 }) // End week on Sunday
        return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`
      }
      case "month":
        return format(actualCurrentDate, "MMMM yyyy")
      default:
        return ""
    }
  }



 return (
   <Card>
     <CardHeader>
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={previousPeriod}>
             <ChevronLeft className="h-4 w-4" />
           </Button>
           <Button variant="outline" size="sm" onClick={nextPeriod}>
             <ChevronRight className="h-4 w-4" />
           </Button>
           <Button variant="outline" size="sm" onClick={goToToday}>
             Today
           </Button>
           <h2 className="text-xl font-bold">{getViewTitle()}</h2>
         </div>
       </div>
     </CardHeader>
     <CardContent>
       {actualSelectedView === "day" && renderDayView()}
       {actualSelectedView === "week" && renderWeekView()}
       {actualSelectedView === "month" && renderMonthView()}
     </CardContent>
    </Card>
  )
}
