import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/dashboard/ui/dialog"
import { Button } from "@/components/dashboard/ui/button"
import { Textarea } from "@/components/dashboard/ui/textarea"
import { Label } from "@/components/dashboard/ui/label"

interface RemarksEditDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  initialValue: string
  onSave: (value: string) => void
  taskName?: string
}

export function RemarksEditDialog({ 
  isOpen, 
  onOpenChange, 
  initialValue, 
  onSave,
  taskName 
}: RemarksEditDialogProps) {
  const [value, setValue] = useState(initialValue || "")

  const handleSave = () => {
    onSave(value.trim())
    onOpenChange(false)
  }

  const handleCancel = () => {
    setValue(initialValue || "")
    onOpenChange(false)
  }

  // Reset value when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setValue(initialValue || "")
    }
  }, [isOpen, initialValue])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {taskName ? `Edit Remarks - ${taskName}` : "Edit Remarks"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="remarks" className="text-sm font-medium">
              Remarks
            </Label>
            <Textarea
              id="remarks"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full min-h-[120px]"
              placeholder="Add any additional remarks or notes for this task..."
              autoFocus
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="border-gray-300"
          >
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Remarks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}