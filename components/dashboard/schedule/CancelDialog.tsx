"use client"

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog"
import { Button } from "@/components/dashboard/ui/button"
import { Textarea } from "@/components/dashboard/ui/textarea"
import { Label } from "@/components/dashboard/ui/label"
import { Card } from "@/components/dashboard/ui/card"

interface CancelDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  reason: string
  onReasonChange: (value: string) => void
  onConfirm: () => void
}

export default function CancelDialog({
  isOpen,
  onOpenChange,
  title,
  reason,
  onReasonChange,
  onConfirm,
}: CancelDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">�</span>
            </span>
            Cancel Session
          </DialogTitle>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Are you sure you want to cancel the "{title}" session?</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-red-800">Session-Specific Cancellation</div>
                  <div className="text-red-700 mt-1">
                    This will only cancel this specific session. Students can still attend other sessions in the same course.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cancellationReason">Reason for Session Cancellation</Label>
            <Textarea
              id="cancellationReason"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Enter reason for cohort session cancellation (e.g., instructor illness, facility unavailable, weather conditions)"
              className="min-h-[100px]"
            />
          </div>

          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Session Rescheduling</h4>
                <p className="text-sm text-blue-700">
                  Students will be automatically notified about the cancellation and can attend the next scheduled cohort session or a makeup session if arranged.
                </p>
              </div>
            </div>
          </Card>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            Cancel Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}