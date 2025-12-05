"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog"
import { Button } from "@/components/dashboard/ui/button"
import { XCircle, RefreshCw, Bell, Download } from "lucide-react"

interface BulkActionsDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedCount: number
  onAction: (action: "cancel" | "reschedule" | "export") => void
}

export default function BulkActionsDialog({ isOpen, onOpenChange, selectedCount, onAction }: BulkActionsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Bulk Actions</DialogTitle>
          <DialogDescription>Perform actions on {selectedCount} selected events</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-2">
            <Button onClick={() => onAction("cancel")} variant="outline">
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Selected Events
            </Button>
            <Button onClick={() => onAction("reschedule")} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Bulk Reschedule
            </Button>
            {/* Send Notifications removed per requirements */}
            <Button onClick={() => onAction("export")} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Selected
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}