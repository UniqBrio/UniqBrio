"use client"

import { useMemo, useState } from "react"
import { useCustomColors } from "@/lib/use-custom-colors"
import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Badge } from "@/components/dashboard/ui/badge"
import { Button } from "@/components/dashboard/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog"
import { cn } from "@/lib/dashboard/utils"
import { Task } from "./types"
import { InlineRemarksEditor } from "./InlineRemarksEditor"

type CalendarViewMode = "day" | "week" | "month"

interface TaskCalendarViewProps {
  tasks: Task[]
  onViewTask: (task: Task) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
  onToggleComplete: (taskId: string, checked: boolean) => Promise<void>
  onUpdateTask: (updatedTask: Task) => Promise<void>
  onUpdateTaskRemarks?: (task: Task) => Promise<void>
}

export default function TaskCalendarView({ 
  tasks, 
  onViewTask, 
  onEditTask, 
  onDeleteTask, 
  onToggleComplete,
  onUpdateTask,
  onUpdateTaskRemarks
}: TaskCalendarViewProps) {
  const { primaryColor, secondaryColor } = useCustomColors()
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month")

  // Dialog state for viewing task
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ]

  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    const endDate = new Date(lastDay)

    // Start from Sunday of the first visible week
    startDate.setDate(startDate.getDate() - startDate.getDay())
    // End on Saturday of the last visible week
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

    const days: { date: Date; isCurrentMonth: boolean }[] = []
    const cursor = new Date(startDate)
    while (cursor <= endDate) {
      days.push({ date: new Date(cursor), isCurrentMonth: cursor.getMonth() === month })
      cursor.setDate(cursor.getDate() + 1)
    }
    return days
  }

  const getTasksForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return tasks.filter((task) => {
      if (!task.targetDate) return false
      
      // Check if the date matches the task's target date
      const taskDate = new Date(task.targetDate + 'T00:00:00')
      const checkDate = new Date(date)
      checkDate.setHours(0, 0, 0, 0)
      taskDate.setHours(0, 0, 0, 0)
      
      return checkDate.getTime() === taskDate.getTime()
    })
  }

  const generateWeekDays = (date: Date) => {
    const weekStart = startOfWeek(date, { weekStartsOn: 0 }) // Sunday
    const weekEnd = endOfWeek(date, { weekStartsOn: 0 }) // Saturday
    const days: Date[] = []
    
    let cursor = weekStart
    while (cursor <= weekEnd) {
      days.push(new Date(cursor))
      cursor = addDays(cursor, 1)
    }
    
    return days
  }

  const getCurrentWeekRange = (date: Date) => {
    const weekStart = startOfWeek(date, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(date, { weekStartsOn: 0 })
    return { start: weekStart, end: weekEnd }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "inprogress":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "onhold":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      case "new":
        return "bg-gray-100 text-gray-800 dark:text-white hover:bg-gray-200"
      case "open":
        return ""
      default:
        return "bg-gray-100 text-gray-800 dark:text-white hover:bg-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getOpenStatusStyle = (status: string) => {
    if (status === "open") {
      return {
        backgroundColor: `${primaryColor}20`,
        color: primaryColor,
      }
    }
    return {}
  }

  const formatDisplayDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd-MMM-yy")
    } catch {
      return dateStr
    }
  }

  const days = useMemo(() => generateCalendarDays(currentDate), [currentDate])

  const openView = (task: Task) => {
    setSelectedTask(task)
    setIsViewOpen(true)
  }

  return (
    <div className="space-y-3">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-center mb-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={viewMode === "day" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "px-4 py-2 rounded-md transition-colors",
              viewMode === "day" 
                ? "text-white" 
                : ""
            )}
            style={viewMode === "day" ? {
              backgroundColor: primaryColor
            } : {
              color: secondaryColor
            }}
            onMouseEnter={(e) => {
              if (viewMode !== "day") {
                e.currentTarget.style.backgroundColor = `${secondaryColor}15`
              } else {
                e.currentTarget.style.backgroundColor = `${primaryColor}dd`
              }
            }}
            onMouseLeave={(e) => {
              if (viewMode !== "day") {
                e.currentTarget.style.backgroundColor = 'transparent'
              } else {
                e.currentTarget.style.backgroundColor = primaryColor
              }
            }}
            onClick={() => {
              setViewMode("day")
              setSelectedDate(null)
            }}
          >
            Day
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "px-4 py-2 rounded-md transition-colors",
              viewMode === "week" 
                ? "text-white" 
                : ""
            )}
            style={viewMode === "week" ? {
              backgroundColor: primaryColor
            } : {
              color: secondaryColor
            }}
            onMouseEnter={(e) => {
              if (viewMode !== "week") {
                e.currentTarget.style.backgroundColor = `${secondaryColor}15`
              } else {
                e.currentTarget.style.backgroundColor = `${primaryColor}dd`
              }
            }}
            onMouseLeave={(e) => {
              if (viewMode !== "week") {
                e.currentTarget.style.backgroundColor = 'transparent'
              } else {
                e.currentTarget.style.backgroundColor = primaryColor
              }
            }}
            onClick={() => {
              setViewMode("week")
              setSelectedDate(null)
            }}
          >
            Week
          </Button>
          <Button
            variant={viewMode === "month" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "px-4 py-2 rounded-md transition-colors",
              viewMode === "month" 
                ? "text-white" 
                : ""
            )}
            style={viewMode === "month" ? {
              backgroundColor: primaryColor
            } : {
              color: secondaryColor
            }}
            onMouseEnter={(e) => {
              if (viewMode !== "month") {
                e.currentTarget.style.backgroundColor = `${secondaryColor}15`
              } else {
                e.currentTarget.style.backgroundColor = `${primaryColor}dd`
              }
            }}
            onMouseLeave={(e) => {
              if (viewMode !== "month") {
                e.currentTarget.style.backgroundColor = 'transparent'
              } else {
                e.currentTarget.style.backgroundColor = primaryColor
              }
            }}
            onClick={() => {
              setViewMode("month")
              setSelectedDate(null)
            }}
          >
            Month
          </Button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const d = new Date(currentDate)
              if (viewMode === "day") {
                d.setDate(d.getDate() - 1)
              } else if (viewMode === "week") {
                d.setDate(d.getDate() - 7)
              } else {
                d.setMonth(d.getMonth() - 1)
              }
              setCurrentDate(d)
            }}
          >
            Previous
          </Button>

          {/* Month & Year Selectors - Only in Month View */}
          {viewMode === "month" && (
            <div className="flex items-center gap-2">
              {/* Month */}
              <Select
                value={currentDate.getMonth().toString()}
                onValueChange={(value) => {
                  const d = new Date(currentDate)
                  d.setMonth(parseInt(value))
                  setCurrentDate(d)
                }}
              >
                <SelectTrigger className="w-32 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                {/* Disable Radix hover auto-scroll arrows and enable native scrollbar */}
                <SelectContent className="max-h-56">
                  {months.map((m, idx) => (
                    <SelectItem key={m} value={idx.toString()}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Year: previous, current, next relative to current view year */}
              <Select
                value={currentDate.getFullYear().toString()}
                onValueChange={(value) => {
                  const d = new Date(currentDate)
                  d.setFullYear(parseInt(value))
                  setCurrentDate(d)
                }}
              >
                <SelectTrigger className="w-24 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                {/* Also disable auto-scroll for year selection for consistency */}
                <SelectContent className="max-h-48">
                  {[
                    currentDate.getFullYear() - 1,
                    currentDate.getFullYear(),
                    currentDate.getFullYear() + 1,
                  ].map((yr) => (
                    <SelectItem key={yr} value={yr.toString()}>
                      {yr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const d = new Date(currentDate)
              if (viewMode === "day") {
                d.setDate(d.getDate() + 1)
              } else if (viewMode === "week") {
                d.setDate(d.getDate() + 7)
              } else {
                d.setMonth(d.getMonth() + 1)
              }
              setCurrentDate(d)
            }}
          >
            Next
          </Button>

          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>
        
        <div className="text-sm font-medium text-gray-700 dark:text-white">
          {viewMode === "day" && format(currentDate, "EEEE, MMMM dd, yyyy")}
          {viewMode === "week" && `${format(getCurrentWeekRange(currentDate).start, "MMM dd")} - ${format(getCurrentWeekRange(currentDate).end, "MMM dd, yyyy")}`}
          {viewMode === "month" && format(currentDate, "MMMM yyyy")}
        </div>
      </div>

      {/* Calendar Views */}
      {viewMode === "month" && (
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-lg">{format(currentDate, "MMMM yyyy")} - Task Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 bg-gray-50 border-b">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="p-1 text-center text-xs font-medium text-gray-700 dark:text-white border-r last:border-r-0">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map(({ date, isCurrentMonth }, idx) => {
                const dayTasks = getTasksForDate(date)
                const today = date.toDateString() === new Date().toDateString()
                const isSelected = selectedDate?.toDateString() === date.toDateString()
                
                return (
                  <div
                    key={idx}
                    className={cn(
                      "min-h-[72px] p-0.5 border-r border-b last:border-r-0 cursor-pointer transition-colors",
                      "hover:bg-gray-50",
                      !isCurrentMonth && "bg-gray-50/50 text-gray-400 dark:text-white",
                      today && "bg-blue-100 border-2 border-blue-400 shadow-md relative",
                      isSelected && "",
                    )}
                    style={isSelected ? {
                      backgroundColor: `${primaryColor}15`,
                      borderColor: `${primaryColor}80`
                    } : {}}
                    onClick={() => {
                      setSelectedDate(date)
                      setCurrentDate(date)
                      setViewMode("day")
                    }}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={cn(
                        "text-xs font-medium", 
                        today && "text-blue-700 font-bold bg-blue-200 px-1.5 py-0.5 rounded-full", 
                        !isCurrentMonth && "text-gray-400 dark:text-white"
                      )}>
                        {date.getDate()}
                      </span>
                      {dayTasks.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          {dayTasks.length}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {dayTasks.slice(0, 2).map((task) => (
                        <div
                          key={task.id}
                          className={cn(
                            "text-[11px] px-1 py-0.5 rounded truncate cursor-pointer transition-colors relative",
                            getStatusColor(task.status),
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            openView(task)
                          }}
                          title={`${task.name} - ${task.status} - ${task.priority} priority`}
                        >
                          <div className="flex items-center gap-1">
                            <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", getPriorityColor(task.priority))}></div>
                            <span className="truncate">{task.name}</span>
                          </div>
                        </div>
                      ))}
                      {dayTasks.length > 2 && (
                        <div className="text-[11px] text-gray-500 dark:text-white px-1">+{dayTasks.length - 2} more</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week View */}
      {viewMode === "week" && (
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-lg">
              {format(getCurrentWeekRange(currentDate).start, "MMM dd")} - {format(getCurrentWeekRange(currentDate).end, "MMM dd, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 bg-gray-50 border-b">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="p-1 text-center text-xs font-medium text-gray-700 dark:text-white border-r last:border-r-0">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {generateWeekDays(currentDate).map((date, idx) => {
                const dayTasks = getTasksForDate(date)
                const today = date.toDateString() === new Date().toDateString()
                const isSelected = selectedDate?.toDateString() === date.toDateString()
                
                return (
                  <div
                    key={idx}
                    className={cn(
                      "min-h-[120px] p-1 border-r border-b last:border-r-0 cursor-pointer transition-colors",
                      "hover:bg-gray-50",
                      today && "bg-blue-100 border-2 border-blue-400 shadow-md relative",
                      isSelected && "",
                    )}
                    style={isSelected ? {
                      backgroundColor: `${primaryColor}15`,
                      borderColor: `${primaryColor}80`
                    } : {}}
                    onClick={() => {
                      setSelectedDate(date)
                      setCurrentDate(date)
                      setViewMode("day")
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-sm font-medium", 
                        today && "text-blue-700 font-bold bg-blue-200 px-2 py-1 rounded-full"
                      )}>
                        {date.getDate()}
                      </span>
                      {dayTasks.length > 0 && (
                        <Badge variant="secondary" className="text-xs px-2 py-0">
                          {dayTasks.length}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayTasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className={cn(
                            "text-xs px-2 py-1 rounded truncate cursor-pointer transition-colors relative",
                            getStatusColor(task.status),
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            openView(task)
                          }}
                          title={`${task.name} - ${task.status} - ${task.priority} priority`}
                        >
                          <div className="flex items-center gap-1">
                            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", getPriorityColor(task.priority))}></div>
                            <span className="truncate">{task.name}</span>
                          </div>
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-white px-2">+{dayTasks.length - 3} more</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day View */}
      {viewMode === "day" && (
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-lg">
              {format(currentDate, "EEEE, MMMM dd, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getTasksForDate(currentDate).length > 0 ? (
                getTasksForDate(currentDate).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => openView(task)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", getPriorityColor(task.priority))}></div>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status === "inprogress" ? "In Progress" : task.status === "onhold" ? "On hold" : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                          </Badge>
                        </div>
                        <div>
                          <p className="font-medium text-lg">{task.name}</p>
                          <p className="text-sm text-gray-600 dark:text-white" title={task.description || "No description"}>
                            {task.description || "No description"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-white">
                        {formatDisplayDate(task.targetDate)}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-white capitalize">{task.priority} priority</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-white">
                  <p className="text-lg mb-2">No tasks for {format(currentDate, "EEEE, MMMM dd, yyyy")}</p>
                  <p className="text-sm">Try a different date or add a new task</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Details Panel */}
      {selectedDate && (viewMode === "month" || viewMode === "week") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Tasks for {selectedDate.toLocaleDateString("en-US", { 
                weekday: "long", 
                year: "numeric", 
                month: "long", 
                day: "numeric" 
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getTasksForDate(selectedDate).length > 0 ? (
              <div className="space-y-3">
                {getTasksForDate(selectedDate).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => openView(task)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", getPriorityColor(task.priority))}></div>
                          <Badge 
                            className={getStatusColor(task.status)}
                            style={getOpenStatusStyle(task.status)}
                          >
                            {task.status === "inprogress" ? "In Progress" : task.status === "onhold" ? "On hold" : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                          </Badge>
                        </div>
                        <div>
                          <p className="font-medium">{task.name}</p>
                          <p className="text-sm text-gray-600 dark:text-white truncate" title={task.description || "No description"}>{task.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-white">
                        {formatDisplayDate(task.targetDate)}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-white capitalize">{task.priority} priority</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-white py-8">No tasks for this date</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-center space-x-6 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span className="text-sm">Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
              <span className="text-sm">In Progress</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
              <span className="text-sm">On hold</span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded" 
                style={{ 
                  backgroundColor: `${primaryColor}20`, 
                  borderWidth: '1px', 
                  borderStyle: 'solid', 
                  borderColor: `${primaryColor}40` 
                }}
              ></div>
              <span className="text-sm">Open</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded"></div>
              <span className="text-sm">New</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm">High</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Medium</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Low</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-100 border-2 border-blue-400 rounded shadow-sm"></div>
              <span className="text-sm">Today</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Task Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
            <DialogDescription>View complete information about this task.</DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="grid gap-3 py-2 text-sm">
              <div className="text-base font-semibold">{selectedTask.name}</div>

              <div className="flex gap-2">
                <span className="text-gray-600 dark:text-white min-w-[120px]">Description:</span>
                <span className="font-medium">{selectedTask.description || "�"}</span>
              </div>

              <div className="flex gap-2">
                <span className="text-gray-600 dark:text-white min-w-[120px]">Status:</span>
                <Badge 
                  className={getStatusColor(selectedTask.status)}
                  style={getOpenStatusStyle(selectedTask.status)}
                >
                  {selectedTask.status === "inprogress" ? "In Progress" : selectedTask.status === "onhold" ? "On hold" : selectedTask.status.charAt(0).toUpperCase() + selectedTask.status.slice(1)}
                </Badge>
              </div>

              <div className="flex gap-2">
                <span className="text-gray-600 dark:text-white min-w-[120px]">Priority:</span>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", getPriorityColor(selectedTask.priority))}></div>
                  <span className="font-medium capitalize">{selectedTask.priority}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <span className="text-gray-600 dark:text-white min-w-[120px]">Target Date:</span>
                <span className="font-medium">{formatDisplayDate(selectedTask.targetDate)}</span>
              </div>

              <div className="flex gap-2">
                <span className="text-gray-600 dark:text-white min-w-[120px]">Created On:</span>
                <span className="font-medium">{formatDisplayDate(selectedTask.createdOn)}</span>
              </div>

              <div className="flex gap-2 items-start">
                <span className="text-gray-600 dark:text-white min-w-[120px]">Remarks:</span>
                <div className="flex-1">
                  <InlineRemarksEditor
                    initialValue={selectedTask.remarks || ""}
                    onSave={(value) => {
                      const updatedTask = { ...selectedTask, remarks: value }
                      if (onUpdateTaskRemarks) {
                        onUpdateTaskRemarks(updatedTask)
                      } else {
                        onUpdateTask(updatedTask)
                      }
                    }}
                    taskName={selectedTask.name}
                  />
                </div>
              </div>

              {selectedTask.completedAt && (
                <div className="flex gap-2">
                  <span className="text-gray-600 dark:text-white min-w-[120px]">Completed At:</span>
                  <span className="font-medium">{format(new Date(selectedTask.completedAt), "dd-MMM-yy HH:mm")}</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
            {selectedTask && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    onEditTask(selectedTask)
                    setIsViewOpen(false)
                  }}
                >
                  Edit
                </Button>
                {!selectedTask.isCompleted && (
                  <Button 
                    onClick={() => {
                      onToggleComplete(selectedTask.id, true)
                      setIsViewOpen(false)
                    }}
                  >
                    Mark Complete
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}