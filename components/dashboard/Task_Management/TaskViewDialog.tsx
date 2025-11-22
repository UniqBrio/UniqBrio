import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/dashboard/ui/dialog"
import { Button } from "@/components/dashboard/ui/button"
import { Task } from "./types"
import { format } from "date-fns"
import { safeParse } from "./utils"

interface TaskViewDialogProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
}

export function TaskViewDialog({ task, isOpen, onClose }: TaskViewDialogProps) {
  if (!task) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>View Task Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p>
            <b>Task Name:</b> {task.name}
          </p>
          {task.description && (
            <p>
              <b>Description:</b> {task.description}
            </p>
          )}
          <p>
            <b>Assigned To:</b> {task.assignedTo || 'Self'}
          </p>
          <p>
            <b>Target Date:</b> {format(safeParse(task.targetDate), "dd-MMM-yyyy")}
          </p>
          <p>
            <b>Task Created On:</b> {format(safeParse(task.createdOn), "dd-MMM-yyyy")}
          </p>
          <p>
            <b>Priority:</b> {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </p>
          <p>
            <b>Status:</b> {task.status === "inprogress" ? "In Progress" : task.status === "onhold" ? "On hold" : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
          </p>
          {task.remarks && (
            <p>
              <b>Remarks:</b> {task.remarks}
            </p>
          )}
          {task.isCompleted && task.completedAt && (
            <p>
              <b>Completed At:</b> {format(new Date(task.completedAt), "dd-MMM-yyyy HH:mm")}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}