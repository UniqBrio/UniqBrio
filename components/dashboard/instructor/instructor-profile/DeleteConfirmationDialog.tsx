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
}

interface DeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instructor: Instructor | null
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteConfirmationDialog({
  open,
  onOpenChange,
  instructor,
  onConfirm,
  onCancel,
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Instructor</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this instructor? This action cannot be undone.
            <br />
            <br />
            <strong>"{instructor?.name}"</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={onCancel}
            className="hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete Instructor
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
