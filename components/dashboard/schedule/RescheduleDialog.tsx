"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Label } from "@/components/dashboard/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { Calendar } from "@/components/dashboard/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

interface RescheduleDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  date: Date
  onDateChange: (date: Date) => void
  startTime: string
  onStartTimeChange: (time: string) => void
  endTime: string
  onEndTimeChange: (time: string) => void
  onConfirm: () => void
}

export default function RescheduleDialog({
  isOpen,
  onOpenChange,
  title,
  date,
  onDateChange,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  onConfirm,
}: RescheduleDialogProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [originalDate, setOriginalDate] = useState<Date>(date)
  const [originalStartTime, setOriginalStartTime] = useState<string>(startTime)
  const [originalEndTime, setOriginalEndTime] = useState<string>(endTime)

  // Track original values when dialog opens (only when isOpen changes to true)
  useEffect(() => {
    if (isOpen) {
      setOriginalDate(date)
      setOriginalStartTime(startTime)
      setOriginalEndTime(endTime)
    }
  }, [isOpen])

  // Check if any changes were made
  const hasChanges = () => {
    const dateChanged = format(date, 'yyyy-MM-dd') !== format(originalDate, 'yyyy-MM-dd')
    const startTimeChanged = startTime !== originalStartTime
    const endTimeChanged = endTime !== originalEndTime
    return dateChanged || startTimeChanged || endTimeChanged
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-500" />
            Reschedule Session
          </DialogTitle>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Reschedule "{title}" session to a new date and time.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-blue-800">Session-Specific Change</div>
                  <div className="text-blue-700 mt-1">
                    This will only reschedule this specific session. Other sessions in the same course remain unchanged.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>New Date</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd-MMM-yy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={(d) => { if (d) { onDateChange(d); setIsCalendarOpen(false); } }} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rescheduleStartTime">Start Time</Label>
              <Input id="rescheduleStartTime" type="time" value={startTime} onChange={(e) => onStartTimeChange(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rescheduleEndTime">End Time</Label>
              <Input id="rescheduleEndTime" type="time" value={endTime} onChange={(e) => onEndTimeChange(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!hasChanges()}>Reschedule Session</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}