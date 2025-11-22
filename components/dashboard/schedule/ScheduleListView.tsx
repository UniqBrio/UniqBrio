"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/dashboard/ui/card"
import { Badge } from "@/components/dashboard/ui/badge"
import { Button } from "@/components/dashboard/ui/button"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import {
  Clock,
  MapPin,
  Users,
  Repeat,
  Video,
  AlertCircle,
  RefreshCw,
  XCircle,
  DollarSign,
  MessageSquare,
  User,
  UserCheck,
  UserX
} from "lucide-react"
import { format } from "date-fns"

import type { ScheduleEvent } from "@/types/dashboard/schedule"
import { 
  fetchLeaveRequests, 
  getInstructorAvailability, 
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

interface ScheduleListViewProps {
  schedules: ScheduleEvent[]
  selectedEvents?: string[]
  onEventSelect?: (eventId: string, selected: boolean) => void
  onView: (schedule: ScheduleEvent) => void
  onEdit: (schedule: ScheduleEvent) => void
  onDelete: (schedule: ScheduleEvent) => void
  onDuplicate: (schedule: ScheduleEvent) => void
  onToggleStatus: (schedule: ScheduleEvent) => void
  onViewHistory: (schedule: ScheduleEvent) => void
  onReschedule?: (schedule: ScheduleEvent) => void
  onCancel?: (schedule: ScheduleEvent) => void
  onProcessRefund?: (schedule: ScheduleEvent) => void
  onClearFilters?: () => void
}

export default function ScheduleListView({
  schedules,
  selectedEvents = [],
  onEventSelect,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
  onViewHistory,
  onReschedule,
  onCancel,
  onProcessRefund,
  onClearFilters,
}: ScheduleListViewProps) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch leave requests when component mounts
  useEffect(() => {
    const loadLeaveRequests = async () => {
      try {
        setLoading(true)
        
        // Get date range from schedules to optimize API call
        const dates = schedules.map(s => s.date)
        const minDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date()
        const maxDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date()
        
        const requests = await fetchLeaveRequests(minDate, maxDate)
        setLeaveRequests(requests)
      } catch (error) {
        console.error('Error loading leave requests:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLeaveRequests()
  }, [schedules])

  // Function to get instructor availability for a specific event
  const getEventInstructorAvailability = (event: ScheduleEvent): InstructorAvailability => {
    return getInstructorAvailability(
      event.instructorId,
      event.instructor,
      event.date,
      leaveRequests
    )
  }
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
        case "Rescheduled":
          return "bg-purple-500"
        default:
          return "bg-gray-500"
      }
    }

    const isSelected = selectedEvents.includes(event.id)
    const instructorAvailability = getEventInstructorAvailability(event)

    return (
      <Card
        key={event.id}
        className={`${event.isCancelled ? "border-red-200" : ""} ${isSelected ? "ring-2 ring-purple-500" : ""} transition-all hover:shadow-md`}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              {onEventSelect && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => {
                    onEventSelect(event.id, checked as boolean)
                  }}
                />
              )}
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {getEventDisplayName(event)}
                  {event.isRecurring && <Repeat className="h-4 w-4 text-purple-500" />}
                  {event.type === "online" && <Video className="h-4 w-4 text-blue-500" />}
                  {event.waitlist && event.waitlist.length > 0 && <Users className="h-4 w-4 text-orange-500" />}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  {format(event.date, "dd-MMM-yy")}
                  {event.tags && event.tags.map((tag) => (
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
              {event.waitlist && event.waitlist.length > 0 && (
                <span className="ml-1 text-orange-600">(+{event.waitlist.length} waitlist)</span>
              )}
            </div>
          </div>

          {/* Reschedule Information */}
          {event.rescheduleInfo && event.originalSessionData && (
            <div className="mt-2 p-2 bg-purple-50 rounded-md text-sm">
              <div className="flex items-start">
                <RefreshCw className="h-4 w-4 mr-2 mt-0.5 text-purple-600" />
                <div>
                  <span className="font-medium text-purple-800">Rescheduled:</span>
                  <div className="text-purple-700 mt-1">
                    Original: {format(event.originalSessionData.date, "dd-MMM-yy")} at {event.originalSessionData.startTime} - {event.originalSessionData.endTime}
                  </div>
                  {event.rescheduleInfo.reason && (
                    <div className="text-purple-600 mt-1">
                      Reason: {event.rescheduleInfo.reason}
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
                    <div className="text-purple-600 mt-1">
                      Reason: {event.reassignmentInfo.reason}
                    </div>
                  )}
                  <div className="text-xs text-purple-500 mt-1">
                    Reassigned at: {format(new Date(event.reassignmentInfo.reassignedAt), "dd-MMM-yy 'at' h:mm a")}
                  </div>
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
                    Cancelled at: {format(new Date(event.cancellationInfo.cancelledAt), "dd-MMM-yy 'at' h:mm a")} by {event.cancellationInfo.cancelledBy}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructor Availability */}
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {loading ? (
                <div className="flex items-center text-sm text-gray-500">
                  <User className="h-4 w-4 mr-2 animate-pulse" />
                  Loading availability...
                </div>
              ) : (
                <>
                  {instructorAvailability.isAvailable ? (
                    <div className="flex items-center text-sm text-green-600">
                      <UserCheck className="h-4 w-4 mr-2" />
                      <span className="font-medium">Available</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-red-600">
                      <UserX className="h-4 w-4 mr-2" />
                      <span className="font-medium">On Leave</span>
                      {instructorAvailability.leaveDetails && (
                        <Badge variant="outline" className="ml-2 text-xs border-red-200 text-red-600">
                          {instructorAvailability.leaveDetails.leaveType}
                        </Badge>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Leave details if instructor is on leave */}
            {!loading && !instructorAvailability.isAvailable && instructorAvailability.leaveDetails && (
              <div className="mt-1 text-xs text-gray-600">
                Leave: {format(new Date(instructorAvailability.leaveDetails.startDate), "dd-MMM-yy")} - {format(new Date(instructorAvailability.leaveDetails.endDate), "dd-MMM-yy")}
                {instructorAvailability.leaveDetails.reason && (
                  <div className="mt-1 text-gray-500">
                    Reason: {instructorAvailability.leaveDetails.reason}
                  </div>
                )}
              </div>
            )}
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
                onReschedule && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReschedule(event)}
                    disabled={event.status === "Completed" || event.status === "Cancelled"}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reschedule
                  </Button>
                )
              ) : (
                onCancel && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 bg-transparent"
                    onClick={() => onCancel(event)}
                    disabled={event.status === "Completed" || event.status === "Cancelled"}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )
              )}

              {event.refundStatus === "pending" && onProcessRefund && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onProcessRefund(event)}
                  disabled={event.status === "Completed"}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Process Refund
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {onView && (
                <Button variant="outline" size="sm" onClick={() => onView(event)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Feedback
                </Button>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    )
  }

  const renderListView = () => {
    const eventsByDate: Record<string, ScheduleEvent[]> = {}

    schedules.forEach((event) => {
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
              <h3 className="text-lg font-medium mb-2">{format(new Date(dateString), "dd-MMM-yy")}</h3>
              <div className="space-y-2">{dateEvents.map((event) => renderEventCard(event))}</div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No events match your filters.</p>
            {onClearFilters && (
              <Button
                variant="outline"
                className="mt-2 bg-transparent"
                onClick={onClearFilters}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  return renderListView()
}