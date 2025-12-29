"use client"
import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog"
import { Button } from "@/components/dashboard/ui/button"

interface UnsavedChangesDialogProps {
  open: boolean
  onContinueEditing: () => void
  onSaveAsDraft: () => void
  onDiscardChanges: () => void
  mode?: "add" | "edit"
}

export default function UnsavedChangesDialog({
  open,
  onContinueEditing,
  onSaveAsDraft,
  onDiscardChanges,
  mode = "add"
}: UnsavedChangesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg p-6 rounded-xl [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            Unsaved Changes
          </DialogTitle>
        </DialogHeader>
        
        <p className="text-gray-600 dark:text-white mb-6">
          You have unsaved changes in your course. What would you like to do?
        </p>
        
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={onContinueEditing}
            className="border-gray-300 hover:bg-gray-50 px-6"
          >
            Continue Editing
          </Button>
          
          {mode !== "edit" && (
            <Button
              variant="outline"
              onClick={onSaveAsDraft}
              className="border-purple-300 text-purple-600 hover:bg-purple-50 px-6"
            >
              Save as Draft
            </Button>
          )}
          
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
