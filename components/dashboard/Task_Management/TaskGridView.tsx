import React from "react"
import { Card, CardContent } from "@/components/dashboard/ui/card"
import { Badge } from "@/components/dashboard/ui/badge"
import { Button } from "@/components/dashboard/ui/button"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Pencil, Trash2, User } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import { format } from "date-fns"
import { cn } from "@/lib/dashboard/utils"
import { Task } from "./types"
import { safeParse, priorityVariant, statusVariant } from "./utils"
import { InlineRemarksEditor } from "./InlineRemarksEditor"
import { toast } from "@/components/dashboard/ui/use-toast"

interface TaskGridViewProps {
  tasks: Task[]
  onToggleComplete: (id: string, checked: boolean) => void
  onViewTask: (task: Task) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (id: string) => void
  onUpdateTask: (task: Task) => void
  onUpdateTaskRemarks?: (task: Task) => void
  selectedTaskIds: Set<string>
  onTaskSelection: (taskId: string, selected: boolean) => void
}

export function TaskGridView({
  tasks,
  onToggleComplete,
  onViewTask,
  onEditTask,
  onDeleteTask,
  onUpdateTask,
  onUpdateTaskRemarks,
  selectedTaskIds,
  onTaskSelection,
}: TaskGridViewProps) {
  const isTaskOverdue = (task: Task) => {
    if (task.isCompleted) return false
    const td = safeParse(task.targetDate)
    const today = new Date()
    const dateOnly = new Date(td.getFullYear(), td.getMonth(), td.getDate())
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return dateOnly < todayOnly
  }
  if (tasks.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No tasks found.
      </div>
    )
  }

  return (
    <div 
      className="task-grid-scroll overflow-x-auto pb-4 px-1"
    >
      <div className="flex gap-4 min-w-max">
        {tasks.map((task) => (
          <Card
            key={task.id}
            className={cn(
              "relative border-2 rounded-xl transition-all duration-200 hover:shadow-md hover:cursor-pointer flex-shrink-0 w-80",
              task.isCompleted ? "bg-green-50 border-green-200" : isTaskOverdue(task) ? "bg-orange-50 border-orange-300" : "border-orange-300",
              selectedTaskIds.has(task.id) ? "ring-2 ring-purple-300" : ""
            )}
            onClick={() => onViewTask(task)}
          >
          {/* Status Badge and Edit Icon */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            <Badge className={`border pointer-events-none text-xs ${statusVariant(task.status)}`}>
              {task.status === "inprogress" ? "In Progress" : task.status === "onhold" ? "On hold" : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditTask(task)
                    }}
                    className="h-6 w-6 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    aria-label="Edit task"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <CardContent className="p-4 pt-2">
            {/* Task Header */}
            <div className="mb-4">
              <h3 className="font-semibold text-lg text-gray-900 truncate">
                {task.name}
              </h3>
              {task.isCompleted && (
                <span className="text-green-600 text-xs font-semibold">Completed</span>
              )}
            </div>

            {/* Task Details */}
            <div className="space-y-2 mb-4">
              <div className="flex text-xs">
                <span className="text-gray-500">Task Name:</span>
                <span className="font-medium ml-2">
                  {task.name}
                </span>
              </div>
              <div className="flex text-xs">
                <span className="text-gray-500">Assigned To:</span>
                <span className="font-medium ml-2">
                  {task.assignedTo || 'Self'}
                </span>
              </div>
              
              <div className="flex text-xs">
                <span className="text-gray-500">Description:</span>
                <span className="font-medium ml-2 truncate max-w-48" title={task.description || "-"}>
                  {task.description || "-"}
                </span>
              </div>

              <div className="flex text-xs">
                <span className="text-gray-500">Target Date:</span>
                <span className="font-medium ml-2">
                  {format(safeParse(task.targetDate), "dd-MMM-yyyy")}
                </span>
              </div>

              <div className="flex text-xs">
                <span className="text-gray-500">Priority:</span>
                <span className="font-medium capitalize ml-2">
                  {task.priority}
                </span>
              </div>

              <div className="flex text-xs">
                <span className="text-gray-500">Created On:</span>
                <span className="font-medium ml-2">
                  {format(safeParse(task.createdOn), "dd-MMM-yyyy")}
                </span>
              </div>

              <div className="flex text-xs items-center">
                <span className="text-gray-500">Remarks:</span>
                <div className="ml-2 flex-1">
                  <InlineRemarksEditor
                    initialValue={task.remarks || ""}
                    onSave={(value) => {
                      const updatedTask = { ...task, remarks: value }
                      if (onUpdateTaskRemarks) {
                        onUpdateTaskRemarks(updatedTask)
                      } else {
                        onUpdateTask(updatedTask)
                      }
                    }}
                    taskName={task.name}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2">
              {!task.isCompleted && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleComplete(task.id, true)
                  }}
                  className="h-7 px-3 text-xs bg-purple-500 text-white hover:bg-purple-600"
                >
                  Mark Complete
                </Button>
              )}
              <div className="flex items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteTask(task.id)
                        }}
                        className="h-7 w-7 text-red-500 hover:text-red-600"
                        aria-label="Delete task"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}