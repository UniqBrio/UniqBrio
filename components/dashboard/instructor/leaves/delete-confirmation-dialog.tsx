"use client"

import React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/dashboard/ui/alert-dialog"
interface Instructor {
  instructorId: string
  name: string
  role?: string
  email?: string
  phone?: string
  gender?: string
  yearsOfExperience?: number
  courseAssigned?: string
}

interface DeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instructor: Instructor | null
  onConfirm: () => void
  onCancel: () => void
  title?: string
  description?: string
  confirmLabel?: string
}

export default function DeleteConfirmationDialog({
  open,
  onOpenChange,
  instructor,
  onConfirm,
  onCancel,
  title = "Delete Instructor",
  description = "Are you sure you want to delete this instructor? This action cannot be undone.",
  confirmLabel = "Delete Instructor",
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
            <br />
            <br />
            <strong>&quot;{instructor?.name || 'Unnamed'}&quot;</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
