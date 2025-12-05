"use client"

import { useCustomColors } from "@/lib/use-custom-colors"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog"
import { Button } from "@/components/dashboard/ui/button"
import { Label } from "@/components/dashboard/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Badge } from "@/components/dashboard/ui/badge"
import { Card } from "@/components/dashboard/ui/card"
import { UserCheck, Clock, Users, AlertTriangle, UserX, Calendar, MapPin } from "lucide-react"
import { format } from "date-fns"
import type { Instructor, ScheduleEvent } from "@/types/dashboard/schedule"
import type { LeaveRequest } from "@/lib/dashboard/instructorAvailability"
import { getAvailableInstructors, type InstructorAvailabilityStatus } from "@/lib/dashboard/instructorScheduleAvailability"

interface ReassignInstructorDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  currentInstructor: string
  cohortTitle: string
  sessionDate: Date
  sessionTime: string
  enrolledStudents: number
  instructors: Instructor[]
  newInstructorId: string
  onInstructorChange: (instructorId: string) => void
  onConfirm: () => void
  allEvents?: ScheduleEvent[]
  leaveRequests?: LeaveRequest[]
  selectedCohort?: ScheduleEvent
}

export default function ReassignInstructorDialog({
  isOpen,
  onOpenChange,
  currentInstructor,
  cohortTitle,
  sessionDate,
  sessionTime,
  enrolledStudents,
  instructors,
  newInstructorId,
  onInstructorChange,
  onConfirm,
  allEvents = [],
  leaveRequests = [],
  selectedCohort,
}: ReassignInstructorDialogProps) {
  const { primaryColor } = useCustomColors()
  const selectedInstructor = instructors.find(inst => inst.id === newInstructorId)
  
  // Parse session time
  const [startTime, endTime] = sessionTime.split(' - ')
  
  // Get instructor availability status
  const instructorAvailabilityList = getAvailableInstructors(
    instructors,
    sessionDate,
    startTime || '09:00',
    endTime || '10:00',
    allEvents,
    leaveRequests,
    selectedCohort?.id,
    currentInstructor
  )
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" style={{ color: primaryColor }} />
            Reassign Session Instructor
          </DialogTitle>
          <DialogDescription>
            Assign a new instructor to the "{cohortTitle}" session.
          </DialogDescription>
        </DialogHeader>
        
        {/* Session-Specific Change Notice - Compact */}
        <div className="rounded p-2 text-xs mb-3" style={{ backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}80`, borderWidth: '1px' }}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: primaryColor }}></div>
            <div>
              <span className="font-medium" style={{ color: `${primaryColor}dd` }}>Session-Specific Change:</span>
              <span className="ml-1" style={{ color: `${primaryColor}cc` }}>Only affects this session, others unchanged.</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Current Session Info */}
          <Card className="p-3 bg-gray-50 border-gray-200">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Session:</span>
                <span>{format(sessionDate, 'dd-MMM-yy')} at {sessionTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" style={{ color: primaryColor }} />
                <span className="font-medium">Students:</span>
                <span>{enrolledStudents} enrolled</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-500" />
                <span className="font-medium">Current:</span>
                <span>{currentInstructor}</span>
              </div>
            </div>
          </Card>

          {/* New Instructor Selection */}
          <div className="space-y-2">
            <Label htmlFor="newInstructor">Select New Instructor *</Label>
            <Select
              value={newInstructorId}
              onValueChange={onInstructorChange}
            >
              <SelectTrigger id="newInstructor">
                <SelectValue placeholder="Choose an instructor" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {instructorAvailabilityList.length === 0 ? (
                  <div className="px-2 py-4 text-sm text-center text-gray-500">
                    No instructors available
                  </div>
                ) : (
                  <>
                {/* Available Instructors Section */}
                {instructorAvailabilityList.filter(status => status.isAvailable).length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border-b">
                      Available ({instructorAvailabilityList.filter(status => status.isAvailable).length})
                    </div>
                    {instructorAvailabilityList
                      .filter(status => status.isAvailable)
                      .map((instructorStatus) => (
                      <SelectItem 
                        key={instructorStatus.instructorId} 
                        value={instructorStatus.instructorId}
                      >
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-3 w-3 text-green-500" />
                          <span>{instructorStatus.instructorName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
                
                {/* Unavailable Instructors Section */}
                {instructorAvailabilityList.filter(status => !status.isAvailable).length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 border-b border-t">
                      Unavailable ({instructorAvailabilityList.filter(status => !status.isAvailable).length})
                    </div>
                    {instructorAvailabilityList
                      .filter(status => !status.isAvailable)
                      .map((instructorStatus) => (
                      <SelectItem 
                        key={instructorStatus.instructorId} 
                        value={instructorStatus.instructorId}
                        disabled={true}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <UserX className="h-3 w-3 text-red-500" />
                            <span className="text-gray-400 dark:text-white">{instructorStatus.instructorName}</span>
                          </div>
                          <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                            {instructorStatus.conflictReason}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
                  </>
                )}
              </SelectContent>
            </Select>
            
            {/* Compact status summary */}
            <div className="text-xs text-gray-500 dark:text-white text-center">
              {instructorAvailabilityList.filter(i => i.isAvailable).length} of {instructorAvailabilityList.length} available · {format(sessionDate, 'dd-MMM-yy')} {startTime}-{endTime}
            </div>
          </div>
          


          {/* Selected Instructor Info - Compact */}
          {selectedInstructor && (
            (() => {
              const selectedStatus = instructorAvailabilityList.find(s => s.instructorId === selectedInstructor.id)
              return (
                <Card className={`p-2 ${selectedStatus?.isAvailable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectedStatus?.isAvailable ? (
                        <UserCheck className="h-3 w-3 text-green-600" />
                      ) : (
                        <UserX className="h-3 w-3 text-red-600" />
                      )}
                      <div>
                        <div className="font-medium text-sm">{selectedInstructor.name}</div>
                        <div className="text-xs text-gray-600 dark:text-white">
                          {selectedInstructor.specializations?.[0] || 'General'} · ⭐ {selectedInstructor.rating?.toFixed(1) || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${selectedStatus?.isAvailable ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}
                    >
                      {selectedStatus?.isAvailable ? 'Available' : selectedStatus?.conflictReason}
                    </Badge>
                  </div>
                  {!selectedStatus?.isAvailable && selectedStatus?.conflictDetails && (
                    <div className="mt-2 p-1 bg-red-100 border border-red-200 rounded text-xs text-red-700">
                      {selectedStatus.conflictDetails.details}
                    </div>
                  )}
                </Card>
              )
            })()
          )}

          {/* Notification Info - Compact */}
          <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
            <span className="text-amber-800">
              {enrolledStudents} students will be notified about the change
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={!newInstructorId || !selectedInstructor || !instructorAvailabilityList.find(s => s.instructorId === newInstructorId)?.isAvailable}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {!instructorAvailabilityList.find(s => s.instructorId === newInstructorId)?.isAvailable && newInstructorId 
              ? 'Instructor Unavailable' 
              : 'Reassign Instructor'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}