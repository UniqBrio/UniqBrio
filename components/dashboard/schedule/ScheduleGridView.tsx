"use client"

import { useCustomColors } from "@/lib/use-custom-colors"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/dashboard/ui/card"
import { Badge } from "@/components/dashboard/ui/badge"
import { Button } from "@/components/dashboard/ui/button"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Progress } from "@/components/dashboard/ui/progress"
import {
  Calendar,
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
  Download,
  User
} from "lucide-react"
import { format } from "date-fns"
import QRCodeGenerator from "@/components/dashboard/qr-code-generator"

import type { ScheduleEvent } from "@/types/dashboard/schedule"

interface ScheduleGridViewProps {
  schedules: ScheduleEvent[]
  selectedEvents?: string[]
  onEventSelect?: (eventId: string, selected: boolean) => void
  onView: (schedule: ScheduleEvent) => void
  onEdit: (schedule: ScheduleEvent) => void
  onDelete: (schedule: ScheduleEvent) => void
  onDuplicate: (schedule: ScheduleEvent) => void
  onToggleStatus: (schedule: ScheduleEvent) => void
  onExportToCalendar: (schedule: ScheduleEvent) => void
  onViewHistory: (schedule: ScheduleEvent) => void
  onReschedule?: (schedule: ScheduleEvent) => void
  onCancel?: (schedule: ScheduleEvent) => void
  onProcessRefund?: (schedule: ScheduleEvent) => void
}

export default function ScheduleGridView({
  schedules,
  selectedEvents = [],
  onEventSelect,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
  onExportToCalendar,
  onViewHistory,
  onReschedule,
  onCancel,
  onProcessRefund,
}: ScheduleGridViewProps) {
  const { primaryColor, secondaryColor } = useCustomColors()
  const renderEventCard = (event: ScheduleEvent) => {
    const renderStatusBadge = () => {
      // Time-based or explicit status styling using theme colors
      if (event.status === "Cancelled") {
        return <Badge variant="destructive">Cancelled</Badge>
      }
      if (event.status === "Pending") {
        return (
          <Badge variant="outline" style={{ borderColor: secondaryColor, color: secondaryColor }}>
            Pending
          </Badge>
        )
      }
      if (event.status === "Completed") {
        return (
          <Badge style={{ backgroundColor: `${primaryColor}1a`, color: primaryColor }}>
            Completed
          </Badge>
        )
      }
      if (event.status === "Ongoing") {
        return (
          <Badge
            className="hover:opacity-90"
            style={{ backgroundImage: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`, color: "white" }}
          >
            Ongoing
          </Badge>
        )
      }
      // Default to Upcoming/Rescheduled etc. using primary
      return (
        <Badge className="hover:opacity-90" style={{ backgroundColor: primaryColor, color: "white" }}>
          {event.status}
        </Badge>
      )
    }

    const isSelected = selectedEvents.includes(event.id)

    return (
      <Card
        key={event.id}
        className={`${event.isCancelled ? "border-red-200" : ""} ${isSelected ? "ring-2" : ""} transition-all hover:shadow-md`}
        style={isSelected ? { boxShadow: `0 0 0 2px ${primaryColor}` } : {}}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              {onEventSelect && (
                <Checkbox
                  checked={isSelected}
                  style={{ accentColor: primaryColor }}
                  onCheckedChange={(checked) => {
                    onEventSelect(event.id, checked as boolean)
                  }}
                />
              )}
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {event.title}
                  {event.isRecurring && <Repeat className="h-4 w-4" style={{ color: primaryColor }} />}
                  {event.type === "online" && <Video className="h-4 w-4" style={{ color: primaryColor }} />}
                  {event.waitlist && event.waitlist.length > 0 && <Users className="h-4 w-4" style={{ color: secondaryColor }} />}
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
              {renderStatusBadge()}
              {event.refundStatus === "pending" && (
                <Badge variant="outline" className="text-gray-600 border-gray-300" style={{ color: secondaryColor, borderColor: secondaryColor }}>
                  Refund Pending
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-500 dark:text-white" />
              {event.startTime} - {event.endTime}
              {event.rescheduleInfo && event.originalSessionData && (
                <span className="ml-2 text-xs line-through" style={{ color: primaryColor }}>
                  (was {event.originalSessionData.startTime} - {event.originalSessionData.endTime})
                </span>
              )}
            </div>
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-500 dark:text-white" />
              {event.instructor}
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-500 dark:text-white" />
              {event.location}
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-gray-500 dark:text-white" />
              {event.students}/{event.maxCapacity} students
              {event.waitlist && event.waitlist.length > 0 && (
                <span className="ml-1" style={{ color: secondaryColor }}>(+{event.waitlist.length} waitlist)</span>
              )}
            </div>
          </div>

          {/* Reschedule Information */}
          {event.rescheduleInfo && event.originalSessionData && (
            <div className="mt-2 p-2 rounded-md text-sm" style={{ backgroundColor: `${primaryColor}15` }}>
              <div className="flex items-start">
                <RefreshCw className="h-4 w-4 mr-2 mt-0.5" style={{ color: primaryColor }} />
                <div style={{ color: `${primaryColor}cc` }}>
                  <span className="font-medium">Original:</span> {format(event.originalSessionData.date, "dd-MMM-yy")} at {event.originalSessionData.startTime}-{event.originalSessionData.endTime}
                </div>
              </div>
            </div>
          )}

          {/* Progress bar for capacity */}
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span>Capacity</span>
              <span>{Math.round((event.students / event.maxCapacity) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div
                className="h-full rounded-full"
                style={{ 
                  width: `${(event.students / event.maxCapacity) * 100}%`,
                  backgroundColor: (event.students / event.maxCapacity) > 0.8 ? secondaryColor : "#22c55e"
                }}
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
                className="text-sm hover:underline flex items-center gap-1"
                style={{ color: primaryColor }}
              >
                <Video className="h-4 w-4" />
                Join Virtual Class
              </a>
            </div>
          )}

          {event.sessionNotes && (
            <div className="mt-2 p-2 rounded-md text-sm" style={{ backgroundColor: `${primaryColor}15` }}>
              <strong>Notes:</strong> {event.sessionNotes}
            </div>
          )}

          {event.instructions && (
            <div className="mt-2 p-2 rounded-md text-sm" style={{ backgroundColor: `${secondaryColor}15` }}>
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

              <Button variant="outline" size="sm" onClick={() => onExportToCalendar(event)}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    )
  }

  if (schedules.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-500 dark:text-white">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No schedules found</h3>
            <p>Try adjusting your filters or create a new schedule.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {schedules.map((schedule) => renderEventCard(schedule))}
    </div>
  )
}