"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog"
import { Button } from "@/components/dashboard/ui/button"
import { CalendarIcon as CalendarIntegration, Download, Upload } from "lucide-react"

interface CalendarSyncDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSync: (provider: string) => void
}

export default function CalendarSyncDialog({ isOpen, onOpenChange, onSync }: CalendarSyncDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
            <Button onClick={() => onSync("Google Calendar")} variant="outline" className="w-full justify-start">
              <CalendarIntegration className="h-4 w-4 mr-2" />
              Sync with Google Calendar
            </Button>
            <Button onClick={() => onSync("Outlook")} variant="outline" className="w-full justify-start">
              <CalendarIntegration className="h-4 w-4 mr-2" />
              Sync with Outlook
            </Button>
            <Button onClick={() => onSync("Apple Calendar")} variant="outline" className="w-full justify-start">
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}