import React, { useState, useEffect } from "react"
import { useCustomColors } from "@/lib/use-custom-colors"
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/dashboard/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/dashboard/ui/alert-dialog"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Label } from "@/components/dashboard/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/dashboard/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { Calendar } from "@/components/dashboard/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Textarea } from "@/components/dashboard/ui/textarea"
import { CalendarIcon, Save, Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/dashboard/utils"
import { format } from "date-fns"
import { Task, TaskFormData } from "./types"
import { resetFormData } from "./utils"
import { Alert, AlertDescription } from "@/components/dashboard/ui/alert"

interface TaskFormDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSave: (task: Task) => void // save actual task to table
  onSaveDraft?: (data: TaskFormData, draftId?: string) => void // persist draft only
  editTask?: Task
  initialData?: Partial<TaskFormData>
  loadedDraftId?: string // if editing a draft
}

export function TaskFormDialog({ isOpen, onOpenChange, onSave, onSaveDraft, editTask, initialData, loadedDraftId }: TaskFormDialogProps) {
  const { primaryColor } = useCustomColors()
  const [formData, setFormData] = useState<TaskFormData>(resetFormData())
  const [initialFormData, setInitialFormData] = useState<TaskFormData>(resetFormData())
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingClose, setPendingClose] = useState(false)
  const [createdOnFocused, setCreatedOnFocused] = useState(false)
  const [targetDateFocused, setTargetDateFocused] = useState(false)
  const isEditingDraft = !!loadedDraftId
  const [assignedToOpen, setAssignedToOpen] = useState(false)
  const [assignedToSearch, setAssignedToSearch] = useState('')
  const [assigneeList, setAssigneeList] = useState<string[]>(() => {
    // Load saved assignees from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('taskAssignees')
      return saved ? JSON.parse(saved) : ['Self']
    }
    return ['Self']
  })
  const [formError, setFormError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const resetForm = () => {
    let formState: TaskFormData
    if (editTask) {
      // Populate form with existing task data for editing
      formState = {
        taskName: editTask.name,
        taskDescription: editTask.description || "",
        assignedTo: editTask.assignedTo || "Self",
        targetDate: editTask.targetDate ? new Date(editTask.targetDate) : undefined,
        createdOn: editTask.createdOn ? new Date(editTask.createdOn) : new Date(),
        taskPriority: editTask.priority,
        taskStatus: editTask.status,
        taskRemarks: editTask.remarks || "",
      }
    } else if (initialData) {
      // Populate from provided initial data (e.g., draft)
      const base = resetFormData()
      formState = {
        ...base,
        ...initialData,
        // Ensure date objects restored if strings provided
        targetDate: initialData.targetDate ? new Date(initialData.targetDate as any) : undefined,
        createdOn: initialData.createdOn ? new Date(initialData.createdOn as any) : base.createdOn,
        assignedTo: (initialData as any).assignedTo ?? base.assignedTo,
      }
      // For create mode using initial data: if targetDate isn't provided, default to createdOn
      if (!editTask && !formState.targetDate) {
        formState = { ...formState, targetDate: formState.createdOn }
      }
    } else {
      // Create mode defaults
      const base = resetFormData()
      formState = { ...base, targetDate: base.createdOn }
    }
    setFormData(formState)
    setInitialFormData(formState)
    setHasUnsavedChanges(false)
    setFormError("")
    setFieldErrors({})
  }

  // Reset form when dialog opens OR switching between draft/edit/new
  useEffect(() => {
    if (isOpen) {
      resetForm()
    }
  }, [isOpen, editTask, loadedDraftId])

  // NOTE: We intentionally removed the auto-sync effect that updated targetDate when
  // createdOn changed on mount. That effect caused a first-open race where formData
  // changed after the initial baseline was captured, making hasUnsavedChanges true
  // on the very first open after a page load. We now handle this sync inline where
  // the user actually changes createdOn (see Calendar onSelect below).

  // Check for unsaved changes whenever form data changes
  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData)
    setHasUnsavedChanges(hasChanges)
  }, [formData, initialFormData])

  // Validate that target date is not before created on date
  const validateTargetDate = (targetDate: Date | undefined): boolean => {
    if (!targetDate) {
      setFieldErrors(prev => ({ ...prev, targetDate: "Target date is required." }))
      setFormError("Please resolve the highlighted fields and try again.")
      return false
    }
    if (!formData.createdOn) {
      return true
    }

    const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
    const createdOnDateOnly = new Date(formData.createdOn.getFullYear(), formData.createdOn.getMonth(), formData.createdOn.getDate())

    if (targetDateOnly < createdOnDateOnly) {
      setFieldErrors(prev => ({ ...prev, targetDate: "Target date cannot be before the created date." }))
      setFormError("Please resolve the highlighted fields and try again.")
      return false
    }

    setFieldErrors(prev => {
      const next = { ...prev }
      delete next.targetDate
      return next
    })
    return true
  }

  const handleSaveTask = () => {
    setFormError("")

    const missingFields: Array<keyof typeof fieldErrors> = []

    if (!formData.taskName.trim()) {
      missingFields.push("taskName")
    }

    if (!validateTargetDate(formData.targetDate)) {
      missingFields.push("targetDate")
    }

    if (!formData.taskPriority) {
      missingFields.push("taskPriority")
    }

    if (isEditMode && !formData.taskStatus) {
      missingFields.push("taskStatus")
    }

    if (isEditMode && isRemarksRequired && !formData.taskRemarks.trim()) {
      missingFields.push("taskRemarks")
    }

    if (missingFields.length > 0) {
      setFieldErrors(prev => ({
        ...prev,
        ...(missingFields.includes("taskName") ? { taskName: "Task name is required." } : {}),
        ...(missingFields.includes("taskPriority") ? { taskPriority: "Priority is required." } : {}),
        ...(missingFields.includes("taskStatus") ? { taskStatus: "Status is required in edit mode." } : {}),
        ...(missingFields.includes("taskRemarks") ? { taskRemarks: "Remarks are required when completing a task." } : {}),
      }))
      setFormError("Please resolve the highlighted fields and try again.")
      return
    }

    setFieldErrors(prev => {
      const next = { ...prev }
      delete next.taskName
      delete next.taskPriority
      delete next.taskStatus
      delete next.taskRemarks
      return next
    })

    const targetDate = formData.targetDate || new Date()
    const finalStatus = isEditMode ? formData.taskStatus : "open"
    const taskData: Task = {
      id: editTask?.id ?? Date.now().toString(),
      name: formData.taskName,
      description: formData.taskDescription,
      assignedTo: formData.assignedTo || "Self",
      targetDate: format(targetDate, "yyyy-MM-dd"),
      createdOn: format(formData.createdOn ?? new Date(), "yyyy-MM-dd"),
      priority: formData.taskPriority,
      status: finalStatus,
      remarks: formData.taskRemarks,
      isCompleted: finalStatus === "completed",
      completedAt: finalStatus === "completed" ? (editTask?.completedAt || new Date().toISOString()) : undefined,
    }
    onSave(taskData) // parent will show toast
    setFormError("")
    setFieldErrors({})
    setHasUnsavedChanges(false)
    onOpenChange(false)
  }

  const handleSaveDraft = () => {
    if (!onSaveDraft) {
      // Backward compatibility: if no draft handler, fall back to task save logic
      handleSaveTask()
      return
    }
    if (!formData.taskName.trim()) {
      setFieldErrors(prev => ({ ...prev, taskName: "Task name is required to save a draft." }))
      setFormError("Please resolve the highlighted fields and try again.")
      return
    }
    onSaveDraft(formData, loadedDraftId) // parent (if needed) may show toast
    setFormError("")
    setFieldErrors({})
    setHasUnsavedChanges(false)
    onOpenChange(false)
  }

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true)
      setPendingClose(true)
    } else {
      onOpenChange(false)
    }
  }

  const handleDialogOpenChange = (open: boolean) => {
    if (!open && hasUnsavedChanges) {
      setShowUnsavedDialog(true)
      setPendingClose(true)
    } else if (!open) {
      onOpenChange(false)
    }
  }

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false)
    setPendingClose(false)
  }

  const handleSaveDraftFromUnsaved = () => {
    setShowUnsavedDialog(false)
    setPendingClose(false)
    handleSaveDraft()
  }

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false)
    setPendingClose(false)
    setHasUnsavedChanges(false)
    onOpenChange(false)
  }

  // Required fields validation (for enabling Add Task button when creating)
  const requiredFieldsFilled = !!(
    formData.taskName.trim() &&
    formData.targetDate &&
    formData.taskPriority
  )

  // Required fields validation for editing (includes status and conditional remarks)
  const isEditMode = !!editTask
  // Remarks are required if: editing a task that was completed OR selecting Completed now
  const isRemarksRequired = isEditMode && ((editTask?.status === "completed") || (formData.taskStatus === "completed"))
  const editRequiredFieldsFilled = !!(
    formData.taskName.trim() &&
    formData.targetDate &&
    formData.taskPriority &&
    formData.taskStatus &&
    (!isRemarksRequired || formData.taskRemarks.trim())
  )

  // Check if user can update (has changes AND all required fields filled)
  const canUpdateTask = isEditMode ? (hasUnsavedChanges && editRequiredFieldsFilled) : requiredFieldsFilled

  // Get missing required fields for tooltip message
  const getMissingFields = () => {
    const missing = []
    if (!formData.taskName.trim()) missing.push("Task Name")
    if (!formData.targetDate) missing.push("Target Date")  
    if (!formData.taskPriority) missing.push("Priority")
    if (isEditMode && !formData.taskStatus) missing.push("Status")
    if (isEditMode && isRemarksRequired && !formData.taskRemarks.trim()) missing.push("Remarks")
    return missing
  }

  // Get tooltip message with proper grammar
  const getTooltipMessage = () => {
    if (isEditMode) {
      // For edit mode, FIRST check for missing required fields
      const missingFields = getMissingFields()
      if (missingFields.length > 0) {
        const fieldWord = missingFields.length === 1 ? "field" : "fields"
        return (
          <>
            <div>Please fill all</div>
            <div>mandatory {fieldWord}</div>
          </>
        )
      }
      // THEN check if no changes made (only if all required fields are filled)
      if (!hasUnsavedChanges) {
        return "Make any changes to update this task"
      }
    } else {
      // For add mode, only check missing fields
      const missingFields = getMissingFields()
      if (missingFields.length > 0) {
        const fieldWord = missingFields.length === 1 ? "field" : "fields"
        return (
          <>
            <div>Please fill all</div>
            <div>mandatory {fieldWord}</div>
          </>
        )
      }
    }
    return ""
  }

  // Helper to format overlay date display like 09-Oct-25
  const formatDateForDisplay = (date?: Date) => {
    if (!date) return ""
    try {
      return format(date, "dd-MMM-yyyy")
    } catch {
      return ""
    }
  }

  return (
    <>
      <DialogContent 
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          if (hasUnsavedChanges) {
            e.preventDefault()
            setShowUnsavedDialog(true)
            setPendingClose(true)
          }
        }}
        onEscapeKeyDown={(e) => {
          if (hasUnsavedChanges) {
            e.preventDefault()
            setShowUnsavedDialog(true)
            setPendingClose(true)
          }
        }}
        onCloseClick={(e) => {
          if (hasUnsavedChanges) {
            e.preventDefault()
            setShowUnsavedDialog(true)
            setPendingClose(true)
          } else {
            onOpenChange(false)
          }
        }}
      >
          <DialogHeader>
            <DialogTitle>{editTask ? "Edit Task" : "Create Task"}</DialogTitle>
          </DialogHeader>

          {formError && (
            <Alert variant="destructive" className="mb-2">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 py-4">
            {/* Task Created On */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Task Created On</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={formData.createdOn ? format(formData.createdOn, "yyyy-MM-dd") : ""}
                  onChange={(e) => {
                    const value = e.target.value
                    const parsed = value ? new Date(`${value}T00:00:00`) : undefined
                    setFormData(prev => {
                      const next = { ...prev, createdOn: parsed }
                      // When user updates createdOn, keep targetDate in-range:
                      // if targetDate is missing or before the new createdOn, align it.
                      if (parsed && (!prev.targetDate || prev.targetDate < parsed)) {
                        next.targetDate = parsed
                      }
                      return next
                    })
                  }}
                  onFocus={() => setCreatedOnFocused(true)}
                  onBlur={() => setCreatedOnFocused(false)}
                  className={`border rounded-md px-3 py-2 text-sm focus:outline-none ${
                    !formData.createdOn ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } ${createdOnFocused || !formData.createdOn ? '' : 'text-transparent'}`}
                  style={createdOnFocused ? {
                    boxShadow: `0 0 0 2px ${primaryColor}66`,
                    borderColor: 'transparent'
                  } : {}}
                />
                {!createdOnFocused && formData.createdOn && (
                  <div className="absolute inset-0 flex items-center px-3 text-sm pointer-events-none text-gray-900 dark:text-white">
                    {formatDateForDisplay(formData.createdOn)}
                  </div>
                )}
              </div>
            </div>

            {/* Task Name */}
            <div className="space-y-2">
              <Label htmlFor="taskName" className="text-sm font-medium">
                Task Name<span className="text-red-500 ml-0.5">*</span>
              </Label>
              <Input
                id="taskName"
                value={formData.taskName}
                onChange={(e) => {
                  const value = e.target.value
                  setFormData({ ...formData, taskName: value })
                  setFieldErrors(prev => {
                    if (!prev.taskName) return prev
                    const next = { ...prev }
                    if (value.trim()) {
                      delete next.taskName
                    }
                    return next
                  })
                }}
                className={cn("w-full", fieldErrors.taskName ? "border-red-500 focus-visible:ring-red-400" : "")}
                placeholder="Enter task name"
              />
              {fieldErrors.taskName && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.taskName}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.taskDescription}
                onChange={(e) => setFormData({ ...formData, taskDescription: e.target.value })}
                className="w-full min-h-[80px]"
                placeholder="Enter task description"
              />
            </div>

            {/* Assigned To */}
            <div className="space-y-2">
              <Label htmlFor="assignedTo" className="text-sm font-medium">
                Assigned To
              </Label>
              <Popover open={assignedToOpen} onOpenChange={setAssignedToOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={assignedToOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">{formData.assignedTo || "Select or type assignee"}</span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <div className="p-2">
                    <Input
                      placeholder="Search or type name..."
                      value={assignedToSearch}
                      onChange={(e) => {
                        const value = e.target.value
                        // Only allow letters, spaces, and hyphens for names
                        const filteredValue = value.replace(/[^a-zA-Z\s-]/g, '')
                        setAssignedToSearch(filteredValue)
                      }}
                      className="mb-2"
                      autoFocus
                    />
                    <div className="max-h-[200px] overflow-y-auto">
                      {/* Show option to add new value if it doesn't exist */}
                      {assignedToSearch && !assigneeList.some(opt => opt.toLowerCase() === assignedToSearch.toLowerCase()) && (
                        <div
                          className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                          onClick={() => {
                            const newAssignee = assignedToSearch.trim()
                            // Add to list and save to localStorage
                            const updatedList = [...assigneeList, newAssignee]
                            setAssigneeList(updatedList)
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('taskAssignees', JSON.stringify(updatedList))
                            }
                            setFormData({ ...formData, assignedTo: newAssignee })
                            setAssignedToOpen(false)
                            setAssignedToSearch('')
                          }}
                        >
                          <Check className="h-4 w-4 opacity-0" />
                          <span>Add "{assignedToSearch.trim()}"</span>
                        </div>
                      )}
                      {/* Existing assignees filtered by search */}
                      {assigneeList
                        .filter(opt => !assignedToSearch || opt.toLowerCase().includes(assignedToSearch.toLowerCase()))
                        .map((option) => {
                          const isSelected = formData.assignedTo === option
                          return (
                            <div
                              key={option}
                              className={cn(
                                "flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer rounded-sm",
                                isSelected ? "text-white" : "hover:bg-accent"
                              )}
                              style={isSelected ? { backgroundColor: primaryColor } : {}}
                              onClick={() => {
                                setFormData({ ...formData, assignedTo: option })
                                setAssignedToOpen(false)
                                setAssignedToSearch('')
                              }}
                            >
                              <Check className={cn("h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                              <span>{option}</span>
                            </div>
                          )
                        })}
                      {/* Show "No results" message if nothing matches */}
                      {assignedToSearch && 
                       assigneeList.filter(opt => opt.toLowerCase().includes(assignedToSearch.toLowerCase())).length === 0 && 
                       assigneeList.some(opt => opt.toLowerCase() === assignedToSearch.toLowerCase()) && (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No results found
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Target Date + Priority side-by-side */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Target Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Target Date<span className="text-red-500 ml-0.5">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={formData.targetDate ? format(formData.targetDate, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      const value = e.target.value
                      // Parse as local date to avoid timezone shift
                      const parsed = value ? new Date(`${value}T00:00:00`) : undefined
                      // Allow the user to type freely; validate later on blur or on save
                      setFormData({ ...formData, targetDate: parsed })
                      setFieldErrors(prev => {
                        if (!prev.targetDate) return prev
                        if (!parsed) return prev
                        const next = { ...prev }
                        delete next.targetDate
                        return next
                      })
                    }}
                    onFocus={() => setTargetDateFocused(true)}
                    onBlur={(e) => {
                      setTargetDateFocused(false)
                      const value = e.currentTarget.value
                      const parsed = value ? new Date(`${value}T00:00:00`) : undefined
                      // Validate only after the user finishes typing
                      if (!validateTargetDate(parsed)) {
                        // Snap back to the createdOn date to keep a valid state
                        setFormData(prev => ({ ...prev, targetDate: prev.createdOn }))
                      }
                    }}
                    min={formData.createdOn ? format(formData.createdOn, "yyyy-MM-dd") : undefined}
                    className={`border rounded-md px-3 py-2 text-sm focus:outline-none ${
                      (!formData.targetDate || fieldErrors.targetDate) ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    } ${targetDateFocused || !formData.targetDate ? '' : 'text-transparent'}`}
                    style={targetDateFocused ? {
                      boxShadow: `0 0 0 2px ${primaryColor}66`,
                      borderColor: 'transparent'
                    } : {}}
                    required
                  />
                  {!targetDateFocused && formData.targetDate && (
                    <div className="absolute inset-0 flex items-center px-3 text-sm pointer-events-none text-gray-900 dark:text-white">
                      {formatDateForDisplay(formData.targetDate)}
                    </div>
                  )}
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Priority<span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Select 
                  value={formData.taskPriority}
                  onValueChange={(value) => {
                    setFormData({ ...formData, taskPriority: value as "low" | "medium" | "high" })
                    setFieldErrors(prev => {
                      if (!prev.taskPriority) return prev
                      const next = { ...prev }
                      delete next.taskPriority
                      return next
                    })
                  }}
                >
                  <SelectTrigger className={cn("w-full", fieldErrors.taskPriority ? "border-red-500 focus:ring-red-400" : "")}>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.taskPriority && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.taskPriority}</p>
                )}
              </div>
            </div>

            {/* Status - Only show when editing */}
            {editTask && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Status<span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Select 
                  value={formData.taskStatus}
                  onValueChange={(value) => {
                    setFormData({ ...formData, taskStatus: value as "open" | "inprogress" | "onhold" | "completed" })
                    setFieldErrors(prev => {
                      if (!prev.taskStatus) return prev
                      const next = { ...prev }
                      delete next.taskStatus
                      return next
                    })
                  }}
                >
                  <SelectTrigger className={cn("w-full", fieldErrors.taskStatus ? "border-red-500 focus:ring-red-400" : "")}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="inprogress">In Progress</SelectItem>
                    <SelectItem value="onhold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Use the Complete button in the task list to mark tasks as completed</p>
                {fieldErrors.taskStatus && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.taskStatus}</p>
                )}
              </div>
            )}

            {/* Remarks */}
            <div className="space-y-2">
              <Label htmlFor="taskRemarks" className="text-sm font-medium">
                Remarks{isRemarksRequired && <span className="text-red-500 ml-0.5">*</span>}
              </Label>
              <Textarea
                id="taskRemarks"
                value={formData.taskRemarks}
                onChange={(e) => {
                  const value = e.target.value
                  setFormData({ ...formData, taskRemarks: value })
                  setFieldErrors(prev => {
                    if (!prev.taskRemarks) return prev
                    const next = { ...prev }
                    if (value.trim()) {
                      delete next.taskRemarks
                    }
                    return next
                  })
                }}
                className={cn("w-full min-h-[80px]", fieldErrors.taskRemarks ? "border-red-500 focus-visible:ring-red-400" : "")}
                placeholder="Add any additional remarks or notes..."
              />
              {fieldErrors.taskRemarks && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.taskRemarks}</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="border-gray-300"
            >
              Cancel
            </Button>
            {onSaveDraft && (
              <Button 
                variant="outline" 
                onClick={handleSaveDraft}
                className="border-gray-300"
                style={{
                  borderColor: primaryColor,
                  color: primaryColor
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}15`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Save className="mr-2 h-4 w-4" />
                {isEditingDraft ? 'Update Draft' : 'Save Draft'}
              </Button>
            )}
            <div className="relative inline-block group">
              <Button 
                onClick={handleSaveTask}
                disabled={!canUpdateTask}
              >
                {editTask ? 'Update Task' : 'Create Task'}
              </Button>
              {!canUpdateTask && (
                <div 
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none text-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  {getTooltipMessage()}
                  <div 
                    className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent"
                    style={{ borderTopColor: primaryColor }}
                  ></div>
                </div>
              )}
            </div>
          </DialogFooter>
        </DialogContent>

      {/* Unsaved Changes Alert Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <Button 
              variant="outline" 
              onClick={handleContinueEditing}
              className="border-gray-300"
            >
              Continue Editing
            </Button>
            {onSaveDraft && (
              <Button 
                variant="outline" 
                onClick={handleSaveDraftFromUnsaved}
                className="border-gray-300"
                style={{
                  borderColor: primaryColor,
                  color: primaryColor
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}15`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {isEditingDraft ? 'Update Draft' : 'Save as Draft'}
              </Button>
            )}
            <Button 
              variant="destructive" 
              onClick={handleDiscardChanges}
            >
              Discard Changes
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}