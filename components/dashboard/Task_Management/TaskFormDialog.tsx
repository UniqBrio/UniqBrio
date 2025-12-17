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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import { CalendarIcon, Save, Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/dashboard/utils"
import { format } from "date-fns"
import { Task, TaskFormData } from "./types"
import { resetFormData } from "./utils"
import { toast } from "@/components/dashboard/ui/use-toast"
// crudSuccess intentionally not used here for add/update to centralize toasts in parent component
import { ToastAction } from "@/components/dashboard/ui/toast"

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
    if (!targetDate || !formData.createdOn) return true
    
    // Compare dates without time (only compare the date part)
    const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
    const createdOnDateOnly = new Date(formData.createdOn.getFullYear(), formData.createdOn.getMonth(), formData.createdOn.getDate())
    
    if (targetDateOnly < createdOnDateOnly) {
      toast({
        title: "Invalid Target Date",
        description: "Target date cannot be before the task created date.",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const handleSaveTask = () => {
    if (!formData.taskName.trim()) {
      toast({
        title: "Task name required",
        description: "Please provide a task name before saving.",
        variant: "destructive",
      })
      return
    }
    
    // Validate target date
    if (!validateTargetDate(formData.targetDate)) {
      return
    }
    
    // Use targetDate as both start and target date since start date is not needed
    const targetDate = formData.targetDate || new Date()
    if (!formData.taskPriority) {
      toast({
        title: "Priority required",
        description: "Select a priority before saving.",
        variant: "destructive",
      })
      return
    }
    if (isEditMode && !formData.taskStatus) {
      toast({
        title: "Status required",
        description: "Select a status while editing.",
        variant: "destructive",
      })
      return
    }
    // Make remarks mandatory for completed tasks (current selection)
    if (isEditMode && isRemarksRequired && !formData.taskRemarks.trim()) {
      toast({
        title: "Remarks required",
        description: "Remarks are required when setting task status to completed.",
        variant: "destructive",
      })
      return
    }
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
      toast({
        title: "Task name required",
        description: "Please provide at least a task name to save as draft",
        variant: "destructive",
      })
      return
    }
    onSaveDraft(formData, loadedDraftId) // parent (if needed) may show toast
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
                onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
                className="w-full"
                placeholder="Enter task name"
              />
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
                      onChange={(e) => setAssignedToSearch(e.target.value)}
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
                      !formData.targetDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
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
                  onValueChange={(value) => setFormData({ ...formData, taskPriority: value as "low" | "medium" | "high" })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
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
                  onValueChange={(value) => setFormData({ ...formData, taskStatus: value as "open" | "inprogress" | "onhold" | "completed" })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="inprogress">In Progress</SelectItem>
                    <SelectItem value="onhold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Use the Complete button in the task list to mark tasks as completed</p>
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
                onChange={(e) => setFormData({ ...formData, taskRemarks: e.target.value })}
                className="w-full min-h-[80px]"
                placeholder="Add any additional remarks or notes..."
              />
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