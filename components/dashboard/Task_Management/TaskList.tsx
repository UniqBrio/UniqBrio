import React from "react"
import { Card, CardContent } from "@/components/dashboard/ui/card"
import { Badge } from "@/components/dashboard/ui/badge"
import { Button } from "@/components/dashboard/ui/button"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/dashboard/ui/table"
import { Pencil, Trash2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import { format } from "date-fns"
import { cn } from "@/lib/dashboard/utils"
import { Task } from "./types"
import { safeParse, priorityVariant, statusVariant, isTaskOverdue } from "./utils"
import { TaskColId } from "./TaskColumnSelector"
import { InlineRemarksEditor } from "./InlineRemarksEditor"
import { toast } from "@/components/dashboard/ui/use-toast"

interface TaskListProps {
  tasks: Task[]
  onToggleComplete: (id: string, checked: boolean) => void
  onViewTask: (task: Task) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (id: string) => void
  onUpdateTask: (task: Task) => void
  onUpdateTaskRemarks?: (task: Task) => void
  selectedTaskIds: Set<string>
  onTaskSelection: (taskId: string, selected: boolean) => void
  onSelectAll: (selectAll: boolean) => void
  allTasksSelected: boolean
  someTasksSelected: boolean
  displayedColumns: TaskColId[]
  tableType?: "active" | "completed"
}

export function TaskList({ tasks, onToggleComplete, onViewTask, onEditTask, onDeleteTask, onUpdateTask, onUpdateTaskRemarks, selectedTaskIds, onTaskSelection, onSelectAll, allTasksSelected, someTasksSelected, displayedColumns, tableType = "active" }: TaskListProps) {
  const renderedColumns = tableType === "completed" ? displayedColumns.filter(c => c !== 'overdue') : displayedColumns

  const getColumnHeader = (colId: TaskColId) => {
    switch (colId) {
      case "taskName": return "Task Name"
      case "description": return "Description" 
      case "targetDate": return "Target Date"
      case "assignedTo": return "Assigned To"
      case "overdue": return "Overdue"
      case "priority": return "Priority"
      case "status": return "Status"
      case "createdOn": return "Created On"
      case "remarks": return "Remarks"
      case "markComplete": return "Complete"
      case "edit": return ""
      case "delete": return ""
      default: return colId
    }
  }

  const renderCell = (task: Task, colId: TaskColId) => {
    switch (colId) {
      case "taskName":
        return (
          <div className="text-sm font-medium truncate w-full" title={task.name}>{task.name}</div>
        )
      case "description":
        return (
          <div className="truncate text-sm text-muted-foreground w-full" title={task.description || "-"}>
            {task.description || "-"}
          </div>
        )
      case "targetDate":
        return (
          <span className="text-sm whitespace-nowrap">
            {format(safeParse(task.targetDate), "dd-MMM-yyyy")}
          </span>
        )
      case "priority":
        return (
          <Badge variant={priorityVariant(task.priority)} className="capitalize text-xs">
            {task.priority}
          </Badge>
        )
      case "assignedTo":
        return (
          <span className="text-sm truncate block" title={task.assignedTo || "Self"}>
            {task.assignedTo || "Self"}
          </span>
        )
      case "overdue":
        return (
          <span className="text-sm">
            {isTaskOverdue(task) ? "Yes" : "No"}
          </span>
        )
      case "status":
        return (
          <Badge className={`border pointer-events-none text-xs ${statusVariant(task.status)}`}>
            {task.status === "inprogress" ? "In Progress" : task.status === "onhold" ? "On hold" : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
          </Badge>
        )
      case "createdOn":
        return (
          <span className="text-sm whitespace-nowrap">
            {format(safeParse(task.createdOn), "dd-MMM-yyyy")}
          </span>
        )
      case "remarks":
        return (
          <InlineRemarksEditor
            initialValue={task.remarks || ""}
            onSave={(value) => {
              const updatedTask = { ...task, remarks: value }
              // Use specific remarks update function if available, otherwise use general update
              const updateFunction = onUpdateTaskRemarks || onUpdateTask
              updateFunction(updatedTask)
            }}
            taskName={task.name}
          />
        )
      case "markComplete":
        return (
          <div className="flex justify-center">
            <Button 
              variant={task.isCompleted ? "secondary" : "default"}
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onToggleComplete(task.id, !task.isCompleted)
              }} 
              className={cn(
                "h-7 px-2 text-xs",
                task.isCompleted 
                  ? "bg-green-100 text-green-700 hover:bg-green-200 cursor-default" 
                  : "bg-purple-500 text-white hover:bg-purple-600"
              )}
              disabled={task.isCompleted}
            >
              {task.isCompleted ? "Completed" : "Mark Complete"}
            </Button>
          </div>
        )
      case "edit":
        return (
          <div className="flex justify-center">
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
                    className="h-7 w-7 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    aria-label="Edit task"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )
      case "delete":
        return (
          <div className="flex justify-center">
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
                    className="h-7 w-7"
                    aria-label="Delete task"
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {tasks.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No tasks found.</p>
        ) : (
          <div className="rounded-md border overflow-hidden">
            {/* Single Table with Horizontal and Vertical Scrolling */}
            <div 
              className="overflow-auto task-grid-scroll"
              style={{ 
                maxHeight: tableType === "active" 
                  ? (tasks.length > 3 ? '14rem' : 'auto')  // Shows 3.5 rows for active tasks + header
                  : (tasks.length > 3 ? '14rem' : 'auto')     // Shows exactly 3 rows for completed tasks + header
              }}
            >
              <table className="w-full caption-bottom text-sm min-w-max">
                {/* Sticky Frozen Header */}
                <thead className="sticky top-0 z-20 bg-white border-b shadow-md backdrop-blur-sm">
                  <tr className="border-b">
                    <th className="h-12 px-3 text-left align-middle font-medium text-muted-foreground w-16 min-w-[64px] bg-white">
                      <Checkbox
                        checked={allTasksSelected}
                        onCheckedChange={(checked: boolean) => onSelectAll(checked)}
                      />
                    </th>
                    {renderedColumns.map((colId) => (
                      <th 
                        key={colId} 
                        className={`h-12 px-3 text-left align-middle font-medium text-muted-foreground bg-white ${
                          colId === 'edit' || colId === 'delete' ? 'w-12 min-w-[48px] text-center' : 
                          colId === 'markComplete' ? 'w-32 min-w-[128px] text-center' :
                          colId === 'taskName' || colId === 'description' || colId === 'remarks' ? 'w-48 min-w-[192px]' : 
                          colId === 'targetDate' || colId === 'createdOn' ? 'w-32 min-w-[128px] whitespace-nowrap' :
                          'w-32 min-w-[128px]'
                        }`}
                      >
                        {getColumnHeader(colId)}
                      </th>
                    ))}
                  </tr>
                </thead>
                
                {/* Table Body */}
                <tbody>
                  {tasks.map((task) => (
                    <tr
                      key={task.id}
                      className={cn(
                        "border-b transition-colors hover:bg-muted/50 cursor-pointer h-12",
                        task.isCompleted ? "bg-green-50 hover:bg-green-100" : isTaskOverdue(task) ? "bg-orange-50 hover:bg-orange-100" : ""
                      )}
                      onClick={() => onViewTask(task)}
                    >
                      <td className="p-3 align-middle w-16 min-w-[64px]">
                        <Checkbox
                          checked={selectedTaskIds.has(task.id)}
                          onCheckedChange={(checked: boolean) => onTaskSelection(task.id, checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      {renderedColumns.map((colId) => (
                        <td 
                          key={`${task.id}-${colId}`}
                          className={`p-3 align-middle ${
                            colId === 'edit' || colId === 'delete' ? 'w-12 min-w-[48px] text-center' : 
                            colId === 'markComplete' ? 'w-32 min-w-[128px] text-center' :
                            colId === 'taskName' || colId === 'description' || colId === 'remarks' ? 'w-48 min-w-[192px]' : 
                            colId === 'targetDate' || colId === 'createdOn' ? 'w-32 min-w-[128px] whitespace-nowrap' :
                            'w-32 min-w-[128px]'
                          }`}
                        >
                          {renderCell(task, colId)}
                          {colId === 'taskName' && task.isCompleted && (
                            <span className="text-green-600 text-xs font-semibold block">Completed</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}