"use client"

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
import { Badge } from "@/components/dashboard/ui/badge"

interface Service {
  id: string
  name: string
  category: string
  status: "Active" | "Inactive"
  enrolled: number
  capacity: number
}

interface ServiceDeleteDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  service: Service | null
  onConfirm: () => void
  isDeleting?: boolean
}

export default function ServiceDeleteDialog({
  isOpen,
  onOpenChange,
  service,
  onConfirm,
  isDeleting = false,
}: ServiceDeleteDialogProps) {
  if (!service) return null

  const hasEnrollments = service.enrolled > 0

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            Delete Service
            {hasEnrollments && (
              <Badge variant="destructive" className="text-xs">
                Has Enrollments
              </Badge>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to delete the service{" "}
              <span className="font-semibold text-foreground">"{service.name}"</span>?
            </p>
            
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Service Details:</p>
              <ul className="text-sm space-y-1">
                <li>ID: {service.id}</li>
                <li>Category: {service.category}</li>
                <li>Status: {service.status}</li>
                <li>
                  Enrollment: {service.enrolled} / {service.capacity} students
                </li>
              </ul>
            </div>

            {hasEnrollments && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800 mb-1">?? Warning</p>
                <p className="text-sm text-red-700">
                  This service has {service.enrolled} enrolled student(s). Deleting this service will:
                </p>
                <ul className="text-sm text-red-700 mt-1 ml-4 list-disc">
                  <li>Remove all student enrollments</li>
                  <li>Cancel all scheduled sessions</li>
                  <li>Permanently delete all related data</li>
                </ul>
              </div>
            )}

            <p className="text-sm font-medium">
              This action cannot be undone. All data associated with this service will be permanently removed.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? "Deleting..." : "Delete Service"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
