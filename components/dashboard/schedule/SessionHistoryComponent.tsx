import React from 'react'
import { Badge } from "@/components/dashboard/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Separator } from "@/components/dashboard/ui/separator"
import { Clock, RefreshCw, XCircle, User, Calendar, MapPin, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { format } from "date-fns"
import { SessionModification, OriginalSessionData } from "@/types/dashboard/schedule"
import { useCustomColors } from '@/lib/use-custom-colors'

interface SessionHistoryComponentProps {
  originalData?: OriginalSessionData
  sessionHistory?: SessionModification[]
  currentSessionData: {
    date: Date
    startTime: string
    endTime: string
    instructor: string
    location: string
    status: string
  }
  rescheduleInfo?: {
    rescheduledAt: Date
    originalDate: Date
    newDate: Date
    reason: string
    rescheduledBy: string
    backendId?: string
  }
  cancellationInfo?: {
    cancelledAt: Date
    reason: string
    cancelledBy: string
    backendId?: string
  }
  reassignmentInfo?: {
    type: 'reassigned_from' | 'reassigned_to'
    originalInstructor: string
    newInstructor: string
    reassignedAt: Date
    reason: string
    backendId?: string
  }
  className?: string
}

const SessionHistoryComponent: React.FC<SessionHistoryComponentProps> = ({
  originalData,
  sessionHistory = [],
  currentSessionData,
  rescheduleInfo,
  cancellationInfo,
  reassignmentInfo,
  className = ""
}) => {
  const { primaryColor } = useCustomColors();
  
  const getModificationIcon = (type: string) => {
    switch (type) {
      case 'rescheduled':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'instructor_changed':
        return <RefreshCw className="h-4 w-4" style={{ color: primaryColor }} />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500 dark:text-white" />
    }
  }

  const getModificationColor = (type: string) => {
    switch (type) {
      case 'rescheduled':
        return 'border-blue-200 bg-blue-50'
      case 'instructor_changed':
        return `border-[${primaryColor}40] bg-[${primaryColor}10]`
      case 'cancelled':
        return 'border-red-200 bg-red-50'
      case 'active':
        return 'border-green-200 bg-green-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const renderChangeDetails = (modification: SessionModification) => {
    const changes = []

    if (modification.previousValues.date !== modification.newValues.date) {
      changes.push({
        field: 'Date',
        icon: <Calendar className="h-3 w-3" />,
        from: modification.previousValues.date ? format(modification.previousValues.date, 'dd-MMM-yy') : undefined,
        to: modification.newValues.date ? format(modification.newValues.date, 'dd-MMM-yy') : undefined
      })
    }

    if (modification.previousValues.startTime !== modification.newValues.startTime || 
        modification.previousValues.endTime !== modification.newValues.endTime) {
      changes.push({
        field: 'Time',
        icon: <Clock className="h-3 w-3" />,
        from: `${modification.previousValues.startTime || ''}-${modification.previousValues.endTime || ''}`,
        to: `${modification.newValues.startTime || ''}-${modification.newValues.endTime || ''}`
      })
    }

    if (modification.previousValues.instructor !== modification.newValues.instructor) {
      changes.push({
        field: 'Instructor',
        icon: <User className="h-3 w-3" />,
        from: modification.previousValues.instructor,
        to: modification.newValues.instructor
      })
    }

    if (modification.previousValues.location !== modification.newValues.location) {
      changes.push({
        field: 'Location',
        icon: <MapPin className="h-3 w-3" />,
        from: modification.previousValues.location,
        to: modification.newValues.location
      })
    }

    if (modification.previousValues.status !== modification.newValues.status) {
      changes.push({
        field: 'Status',
        icon: <AlertTriangle className="h-3 w-3" />,
        from: modification.previousValues.status,
        to: modification.newValues.status
      })
    }

    return changes
  }

  if (!originalData && sessionHistory.length === 0) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-4 text-center text-gray-500 dark:text-white">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-white" />
          <p className="text-sm">No modification history available</p>
          <p className="text-xs text-gray-400 dark:text-white mt-1">This session has not been modified</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500" />
          Session Modification History
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-white">
          Track all changes made to this specific session
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Original Session Data */}
        {originalData && (
          <div className="border-l-4 border-green-400 bg-green-50 p-4 rounded-r-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h4 className="font-semibold text-green-800">Original Session</h4>
              <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                Baseline
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-green-600" />
                <span className="text-gray-700 dark:text-white">Date:</span>
                <span className="font-medium">{format(originalData.date, 'dd-MMM-yy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-green-600" />
                <span className="text-gray-700 dark:text-white">Time:</span>
                <span className="font-medium">{originalData.startTime} - {originalData.endTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-green-600" />
                <span className="text-gray-700 dark:text-white">Instructor:</span>
                <span className="font-medium">{originalData.instructor}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-green-600" />
                <span className="text-gray-700 dark:text-white">Location:</span>
                <span className="font-medium">{originalData.location}</span>
              </div>
            </div>
          </div>
        )}

        {/* Modification History */}
        {sessionHistory.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Change Timeline
            </h4>
            <div className="space-y-3">
              {sessionHistory.map((modification, index) => (
                <div
                  key={modification.id}
                  className={`border rounded-lg p-4 ${getModificationColor(modification.type)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getModificationIcon(modification.type)}
                      <span className="font-semibold capitalize text-gray-800 dark:text-white">
                        {modification.type.replace('_', ' ')}
                      </span>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                      >
                        #{sessionHistory.length - index}
                      </Badge>
                    </div>
                    <div className="text-right text-xs text-gray-500 dark:text-white">
                      <div>{formatDateTime(modification.timestamp)}</div>
                      <div>by {modification.modifiedBy}</div>
                    </div>
                  </div>

                  {modification.reason && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-700 dark:text-white italic">"{modification.reason}"</p>
                    </div>
                  )}

                  {/* Change Details */}
                  <div className="space-y-2">
                    {renderChangeDetails(modification).map((change, changeIndex) => (
                      <div key={changeIndex} className="flex items-center gap-2 text-sm">
                        {change.icon}
                        <span className="text-gray-600 dark:text-white">{change.field}:</span>
                        <span className="line-through text-red-600">{change.from}</span>
                        <span className="text-gray-400 dark:text-white">?</span>
                        <span className="font-medium text-green-600">{change.to}</span>
                      </div>
                    ))}
                  </div>

                  {/* Impact Information */}
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-white">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>{modification.affectedStudents || 0} students affected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {modification.notificationsSent ? (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Notifications sent</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span>Notifications pending</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Backend Tracking Information */}
        {(rescheduleInfo || cancellationInfo || reassignmentInfo) && (
          <div className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-gray-600 dark:text-white" />
              <h4 className="font-semibold text-gray-800 dark:text-white">Backend Tracking</h4>
            </div>
            <div className="space-y-2 text-sm">
              {rescheduleInfo && (
                <div className="flex items-start gap-2 p-2 bg-blue-100 rounded">
                  <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-800">Reschedule Information</div>
                    <div className="text-blue-700">
                      From: {format(rescheduleInfo.originalDate, 'dd-MMM-yy')} ? 
                      To: {format(rescheduleInfo.newDate, 'dd-MMM-yy')}
                    </div>
                    <div className="text-xs text-blue-600">
                      Modified at: {formatDateTime(rescheduleInfo.rescheduledAt)} by {rescheduleInfo.rescheduledBy}
                    </div>
                    {rescheduleInfo.backendId && (
                      <div className="text-xs text-blue-500">Backend ID: {rescheduleInfo.backendId}</div>
                    )}
                  </div>
                </div>
              )}
              
              {cancellationInfo && (
                <div className="flex items-start gap-2 p-2 bg-red-100 rounded">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-red-800">Cancellation Information</div>
                    <div className="text-red-700">Reason: {cancellationInfo.reason}</div>
                    <div className="text-xs text-red-600">
                      Cancelled at: {formatDateTime(cancellationInfo.cancelledAt)} by {cancellationInfo.cancelledBy}
                    </div>
                    {cancellationInfo.backendId && (
                      <div className="text-xs text-red-500">Backend ID: {cancellationInfo.backendId}</div>
                    )}
                  </div>
                </div>
              )}
              
              {reassignmentInfo && (
                <div className="flex items-start gap-2 p-2 rounded" style={{ backgroundColor: `${primaryColor}20` }}>
                  <RefreshCw className="h-4 w-4 mt-0.5" style={{ color: primaryColor }} />
                  <div>
                    <div className="font-medium" style={{ color: primaryColor }}>
                      Instructor Reassignment ({reassignmentInfo.type.replace('_', ' ')})
                    </div>
                    <div style={{ color: `${primaryColor}E6` }}>
                      {reassignmentInfo.originalInstructor} → {reassignmentInfo.newInstructor}
                    </div>
                    {reassignmentInfo.reason && (
                      <div style={{ color: `${primaryColor}E6` }}>Reason: {reassignmentInfo.reason}</div>
                    )}
                    <div className="text-xs" style={{ color: `${primaryColor}CC` }}>
                      Reassigned at: {formatDateTime(reassignmentInfo.reassignedAt)}
                    </div>
                    {reassignmentInfo.backendId && (
                      <div className="text-xs" style={{ color: `${primaryColor}99` }}>Backend ID: {reassignmentInfo.backendId}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current Session Status */}
        <div className="border-l-4 border-blue-400 bg-blue-50 p-4 rounded-r-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <h4 className="font-semibold text-blue-800">Current Session</h4>
            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
              {currentSessionData.status}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-blue-600" />
              <span className="text-gray-700 dark:text-white">Date:</span>
              <span className="font-medium">{format(currentSessionData.date, 'dd-MMM-yy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-blue-600" />
              <span className="text-gray-700 dark:text-white">Time:</span>
              <span className="font-medium">{currentSessionData.startTime} - {currentSessionData.endTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-blue-600" />
              <span className="text-gray-700 dark:text-white">Instructor:</span>
              <span className="font-medium">{currentSessionData.instructor}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-blue-600" />
              <span className="text-gray-700 dark:text-white">Location:</span>
              <span className="font-medium">{currentSessionData.location}</span>
            </div>
          </div>
        </div>

        {/* Session Scope Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">Session-Specific Changes</p>
              <p className="text-amber-700 mt-1">
                All modifications shown above affect only this specific session. 
                Other sessions in the same course or cohort remain unchanged.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SessionHistoryComponent