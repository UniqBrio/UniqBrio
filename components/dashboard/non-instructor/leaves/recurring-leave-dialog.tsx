"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/dashboard/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Input } from "@/components/dashboard/ui/input"
import { FormattedDateInput } from "@/components/dashboard/ui/formatted-date-input"
import { Textarea } from "@/components/dashboard/ui/textarea"
import { Button } from "@/components/dashboard/ui/button"

type RecurrencePattern = "daily" | "weekly" | "monthly"

export interface RecurringLeaveData {
  pattern: RecurrencePattern
  startDate: string
  endDate: string
  reason: string
}

interface RecurringLeaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate?: (data: RecurringLeaveData) => void
}

export default function RecurringLeaveDialog({ open, onOpenChange, onCreate }: RecurringLeaveDialogProps) {
  const [pattern, setPattern] = useState<RecurrencePattern>("weekly")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  function resetForm() {
    setPattern("weekly")
    setStartDate("")
    setEndDate("")
    setReason("")
  }

  async function handleCreate() {
    // Basic validation to match expected required fields
    if (!startDate || !endDate) return
    setSubmitting(true)
    const payload: RecurringLeaveData = { pattern, startDate, endDate, reason }
    try {
      onCreate?.(payload)
      onOpenChange(false)
      resetForm()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Recurring Leave</DialogTitle>
          <DialogDescription>
            Set up recurring leave patterns for regular appointments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Recurrence Pattern</label>
            <Select value={pattern} onValueChange={(v: RecurrencePattern) => setPattern(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <FormattedDateInput
                id="rec-start-date"
                label="Start Date"
                value={startDate}
                onChange={(iso) => {
                  setStartDate(iso)
                  if (iso && (!endDate || endDate < iso)) setEndDate(iso)
                }}
                placeholder="dd-mm-yyyy"
                required
              />
            </div>
            <div className="space-y-2">
              <FormattedDateInput
                id="rec-end-date"
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                placeholder="dd-mm-yyyy"
                min={startDate || undefined}
                required
                error={!!(startDate && endDate && endDate < startDate)}
              />
              {startDate && endDate && endDate < startDate && (
                <p className="text-xs text-red-600">End date cannot be before the start date.</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason</label>
            <Textarea
              placeholder="e.g., Weekly medical appointment"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleCreate} disabled={submitting || !startDate || !endDate}>
            Create Recurring Leave
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
