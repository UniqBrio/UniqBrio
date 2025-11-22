"use client"
import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog"
import { Button } from "@/components/dashboard/ui/button"

interface UnsavedChangesDialogProps {
  open: boolean
  onContinueEditing: () => void
  onDiscardChanges: () => void
}

export default function UnsavedChangesDialog({
  open,
  onContinueEditing,
  onDiscardChanges
}: UnsavedChangesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}} modal>
      <DialogContent className="max-w-lg p-6 rounded-xl [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-800 mb-2">
            Unsaved Changes
          </DialogTitle>
        </DialogHeader>
        
        <p className="text-gray-600 mb-6">
          You have unsaved changes in your course. What would you like to do?
        </p>
        
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onContinueEditing}
            className="border-gray-300 hover:bg-gray-50 px-6"
          >
            Continue Editing
          </Button>
          
          <Button
            variant="destructive"
            onClick={onDiscardChanges}
            className="bg-red-500 hover:bg-red-600 px-6"
          >
            Discard Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
