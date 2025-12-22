import React, { useState, useEffect } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Plus, FileText, RotateCw, LayoutDashboard, List, Settings, X } from "lucide-react"
import { Dialog, DialogTrigger } from "@/components/dashboard/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import { Task, SortBy } from "./types"
import { useTaskFiltering } from "./use-task-filtering"
import { calculateTaskStats } from "./task-stats"
import { TaskSummaryCards } from "./TaskSummaryCards"
import { TaskAnalytics } from "./TaskAnalytics"
import { TaskFiltersAndSort } from "./TaskFiltersAndSort"
import { TaskFormDialog } from "./TaskFormDialog"
import { TaskViewDialog } from "./TaskViewDialog"
import TaskDeleteConfirmationDialog from "./TaskDeleteConfirmationDialog"
import TaskCompleteConfirmationDialog from "./TaskCompleteConfirmationDialog"
import { TaskList } from "./TaskList"
import { TaskGridView } from "./TaskGridView"
import TaskCalendarView from "./TaskCalendarView"
import TaskColumnSelector, { TaskColId, TASK_TABLE_COLUMNS } from "./TaskColumnSelector"
import { useTaskDraftsApi, TaskDraft } from "@/hooks/dashboard/use-task-drafts-api"
import { DraftsDialog } from "./DraftsDialog"
import { useTasksApi } from "@/hooks/dashboard/use-tasks-api"
import TaskSettings from "./TaskSettings"
import { Card, CardContent } from "@/components/dashboard/ui/card"
import { useCustomColors } from "@/lib/use-custom-colors"
import { Alert, AlertDescription, AlertTitle } from "@/components/dashboard/ui/alert"

export default function TaskManagement() {
  const { primaryColor, secondaryColor } = useCustomColors()
  const { tasks, setTasks, create, update, remove } = useTasksApi()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewTask, setViewTask] = useState<Task | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteTask, setDeleteTask] = useState<Task | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [completeTask, setCompleteTask] = useState<Task | null>(null)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [isCalendarView, setIsCalendarView] = useState(false)
  const [activeTab, setActiveTab] = useState<"analytics" | "tasks" | "settings">("tasks")
  const { drafts, save: saveDraft, remove: deleteDraft, load: loadDrafts } = useTaskDraftsApi("task", { suppressToasts: true })
  const [actionFeedback, setActionFeedback] = useState<{ variant: "success" | "error"; title: string; description?: string } | null>(null)

  const showFeedback = (variant: "success" | "error", title: string, description?: string) => {
    setActionFeedback({ variant, title, description })
  }
  
  const handleDeleteDraft = async (draftId: string) => {
    const draftToDelete = drafts.find(d => d.id === draftId)
    const draftName = draftToDelete?.title || 'Draft'
    try {
      await deleteDraft(draftId)
      showFeedback("success", "Draft Deleted", `"${draftName}" has been deleted successfully.`)
    } catch (e: any) {
      showFeedback("error", "Draft Deletion Failed", e?.message || "Failed to delete draft")
    }
  }
  const [currentDraft, setCurrentDraft] = useState<TaskDraft<any> | null>(null)
  const [draftsDialogOpen, setDraftsDialogOpen] = useState(false)

  const createTaskSettingsDefaults = () => ({
    taskDisplay: {
      showTaskIds: true,
      highlightOverdue: true,
      showProgress: true,
    },
    taskNotifications: {
      dueDateReminder: true,
      reminderTime: 24,
      overdueAlert: true,
    },
    taskAutomation: {
      autoDraftSave: true,
      autoDraftInterval: 5,
      confirmBeforeDelete: true,
      confirmBeforeComplete: true,
    },
    taskExport: {
      includeRemarks: true,
      includeSubtasks: false,
    },
  })

  type TaskSettingsState = ReturnType<typeof createTaskSettingsDefaults>

  const [taskSettings, setTaskSettings] = useState<TaskSettingsState>(createTaskSettingsDefaults)
  const isSettingsTabDisabled = true

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('taskSettings')
    }
  }, [])

  useEffect(() => {
    if (!actionFeedback) return
    const timer = window.setTimeout(() => setActionFeedback(null), 6000)
    return () => window.clearTimeout(timer)
  }, [actionFeedback])

  const updateSetting = (category: string, key: string, value: any) => {
    setTaskSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }))
  }

  const resetSettings = () => {
    const defaultSettings = createTaskSettingsDefaults()
    setTaskSettings(defaultSettings)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('taskSettings')
    }
    showFeedback("success", "Settings Reset", "Task-specific settings have been reset to their default values.")
  }

  // Filter and sort states for ACTIVE tasks
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["all"])
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(["all"])
  const [sortBy, setSortBy] = useState<SortBy>("target-date-asc")
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>(undefined)
  const [overdueFilter, setOverdueFilter] = useState<"all"|"yes"|"no">("all")
  
  // Filter and sort states for COMPLETED tasks (separate)
  const [completedSelectedStatuses, setCompletedSelectedStatuses] = useState<string[]>(["all"])
  const [completedSelectedPriorities, setCompletedSelectedPriorities] = useState<string[]>(["all"])
  const [completedSortBy, setCompletedSortBy] = useState<SortBy>("target-date-asc")
  const [completedSearchTerm, setCompletedSearchTerm] = useState("")
  const [completedDateRange, setCompletedDateRange] = useState<{ from?: Date; to?: Date } | undefined>(undefined)
  
  // Column selector state (using MongoDB/server storage instead of localStorage)
  const [displayedColumns, setDisplayedColumns] = useState<TaskColId[]>(
    TASK_TABLE_COLUMNS.map(c => c.id)
  )

  // Get filtered ACTIVE tasks (exclude completed from the source)
  const activeTasks = useTaskFiltering({
    tasks: tasks.filter(task => task.status !== "completed"),
    selectedStatuses,
    selectedPriorities,
    sortBy,
    searchTerm,
    dateRange,
    overdueFilter,
  })

  // Get filtered COMPLETED tasks (only completed tasks with separate filtering)
  const completedTasks = useTaskFiltering({
    tasks: tasks.filter(task => task.status === "completed"),
    selectedStatuses: completedSelectedStatuses,
    selectedPriorities: completedSelectedPriorities,
    sortBy: completedSortBy,
    searchTerm: completedSearchTerm,
    dateRange: completedDateRange,
  })
  
  // Keep visibleTasks for backward compatibility (active tasks only)
  const visibleTasks = activeTasks

  // Get task statistics
  const stats = calculateTaskStats(tasks)

  // Task actions
  const handleSaveTaskFromDialog = async (newTask: Task) => {
    try {
      const isEdit = tasks.some(t => t.id === newTask.id)
      if (isEdit) {
        await update(newTask)
        showFeedback("success", "Task Updated", `"${newTask.name}" has been updated successfully.`)
      } else {
        await create(newTask)
        showFeedback("success", "Task Created", `"${newTask.name}" has been created successfully.`)
      }
      if (currentDraft?.id) {
        await deleteDraft(currentDraft.id)
        setCurrentDraft(null)
        // Decide dialog behavior based on remaining drafts
        const remaining = drafts.filter(d => d.id !== currentDraft.id && d.type === 'task').length
        if (remaining === 0) {
          setDraftsDialogOpen(false)
        } else {
          setDraftsDialogOpen(true)
        }
      }
    } catch (e: any) {
      showFeedback("error", "Task Save Failed", e?.message || 'Failed to save task')
    }
  }

  const handleImportTasks = (importedTasks: Task[]) => {
    // Optional: could batch call API; for now append locally for quick UX
    setTasks([...tasks, ...importedTasks])
    if (importedTasks.length) {
      const count = importedTasks.length
      const description = `${count} task${count > 1 ? 's' : ''} imported successfully.`
      showFeedback("success", "Tasks Imported", description)
    }
  }

  const handleDeleteTask = (id: string) => {
    const taskToDelete = tasks.find(task => task.id === id)
    if (taskToDelete) {
      setDeleteTask(taskToDelete)
      setDeleteDialogOpen(true)
    }
  }

  const confirmDeleteTask = async () => {
    if (!deleteTask) return
    try {
      await remove(deleteTask.id)
      showFeedback("success", "Task Deleted", `"${deleteTask.name}" has been deleted successfully.`)
      closeDeleteDialog()
    } catch (e: any) {
      showFeedback("error", "Task Deletion Failed", e?.message || 'Failed to delete task')
    }
  }

  const closeDeleteDialog = () => {
    setDeleteTask(null)
    setDeleteDialogOpen(false)
  }

  const handleCompleteTask = async (id: string, checked: boolean) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    // If marking as complete (and not already completed), show confirmation
    if (checked && !task.isCompleted) {
      setCompleteTask(task)
      setCompleteDialogOpen(true)
      return
    }

    // If unchecking (reopening), proceed directly
    await toggleCompleteDirectly(id, checked)
  }

  const toggleCompleteDirectly = async (id: string, checked: boolean) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    try {
      await update({ 
        ...task, 
        isCompleted: checked, 
        status: checked ? "completed" : (task.status === "completed" ? "open" : task.status),
        completedAt: checked ? new Date().toISOString() : undefined 
      })
      if (checked) {
        showFeedback("success", "Task Completed", `"${task.name}" has been marked as completed.`)
      } else {
        showFeedback("success", "Task Reopened", `"${task.name}" has been reopened.`)
      }
    } catch (e: any) {
      showFeedback("error", "Task Update Failed", e?.message || 'Failed to update task')
    }
  }

  const confirmCompleteTask = async () => {
    if (!completeTask) return
    await toggleCompleteDirectly(completeTask.id, true)
    closeCompleteDialog()
  }

  const closeCompleteDialog = () => {
    setCompleteTask(null)
    setCompleteDialogOpen(false)
  }

  // Task selection functions
  const handleTaskSelection = (taskId: string, selected: boolean) => {
    const newSelected = new Set(selectedTaskIds)
    if (selected) {
      newSelected.add(taskId)
    } else {
      newSelected.delete(taskId)
    }
    setSelectedTaskIds(newSelected)
  }

  // Selection calculations scoped per dataset (active vs completed)
  const allActiveSelected = activeTasks.length > 0 && activeTasks.every(t => selectedTaskIds.has(t.id))
  const someActiveSelected = activeTasks.some(t => selectedTaskIds.has(t.id))
  const allCompletedSelected = completedTasks.length > 0 && completedTasks.every(t => selectedTaskIds.has(t.id))
  const someCompletedSelected = completedTasks.some(t => selectedTaskIds.has(t.id))

  const handleSelectAllActive = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedTaskIds(new Set(activeTasks.map(t => t.id)))
    } else {
      setSelectedTaskIds(new Set())
    }
  }

  const handleSelectAllCompleted = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedTaskIds(new Set(completedTasks.map(t => t.id)))
    } else {
      setSelectedTaskIds(new Set())
    }
  }

  const openViewDialog = (task: Task) => {
    setViewTask(task)
    setViewDialogOpen(true)
  }

  const closeViewDialog = () => {
    setViewTask(null)
    setViewDialogOpen(false)
  }

  const openEditDialog = (task: Task) => {
    setEditTask(task)
    setEditDialogOpen(true)
  }

  const closeEditDialog = () => {
    setEditTask(null)
    setEditDialogOpen(false)
  }

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      await update(updatedTask)
      showFeedback("success", "Task Updated", `"${updatedTask.name}" has been updated successfully.`)
    } catch (e: any) {
      showFeedback("error", "Task Update Failed", e?.message || 'Failed to update task')
    }
  }

  const handleUpdateTaskRemarks = async (updatedTask: Task) => {
    try {
      await update(updatedTask)
      showFeedback("success", "Remarks Updated", `Remarks for "${updatedTask.name}" have been updated successfully.`)
    } catch (e: any) {
      showFeedback("error", "Remarks Update Failed", e?.message || 'Failed to update task remarks')
    }
  }

  // Adapt TaskDraft (API: dates as ISO strings) -> DraftItem (expects Date objects)
  const adaptedDrafts = drafts.map(d => ({
    id: d.id,
    title: d.title,
    data: d.data,
    createdAt: new Date(d.createdAt),
    updatedAt: new Date(d.updatedAt),
    type: d.type,
  }))

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>Task Management</h1>
      </div>

      {actionFeedback && (
        <Alert
          variant={actionFeedback.variant === 'error' ? 'destructive' : 'default'}
          className={`mb-6 ${actionFeedback.variant === 'success' ? 'border-green-200 bg-green-50 text-green-900' : ''}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <AlertTitle>{actionFeedback.title}</AlertTitle>
              {actionFeedback.description && (
                <AlertDescription>{actionFeedback.description}</AlertDescription>
              )}
            </div>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="text-sm text-muted-foreground hover:text-foreground mt-1"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "analytics" | "tasks" | "settings")} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-transparent gap-2 p-0 h-auto mb-6">
          <TabsTrigger 
            value="analytics" 
            className="flex items-center justify-center gap-2 px-4 py-2 border-2 bg-transparent font-medium data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent"
            style={{
              borderColor: activeTab === 'analytics' ? 'transparent' : secondaryColor,
              color: activeTab === 'analytics' ? 'white' : secondaryColor,
              backgroundColor: activeTab === 'analytics' ? primaryColor : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'analytics') {
                e.currentTarget.style.backgroundColor = `${secondaryColor}15`
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'analytics') {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          >
            <LayoutDashboard className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger 
            value="tasks" 
            className="flex items-center justify-center gap-2 px-4 py-2 border-2 bg-transparent font-medium data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent"
            style={{
              borderColor: activeTab === 'tasks' ? 'transparent' : secondaryColor,
              color: activeTab === 'tasks' ? 'white' : secondaryColor,
              backgroundColor: activeTab === 'tasks' ? primaryColor : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'tasks') {
                e.currentTarget.style.backgroundColor = `${secondaryColor}15`
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'tasks') {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          >
            <List className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger 
            value="settings"
            aria-disabled={isSettingsTabDisabled}
            className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-black/60 bg-gray-100 text-gray-700 font-medium transition-colors data-[state=active]:border-black data-[state=active]:bg-gray-300 data-[state=active]:text-gray-900 hover:border-black hover:bg-gray-200 hover:text-gray-900"
          >
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <TaskAnalytics tasks={tasks} stats={stats} />
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          {/* Task List Title */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold" style={{ color: primaryColor }}>Active Tasks</h2>
          </div>

          {/* Filters and Sort */}
          <TaskFiltersAndSort
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedStatuses={selectedStatuses}
            setSelectedStatuses={setSelectedStatuses}
            selectedPriorities={selectedPriorities}
            setSelectedPriorities={setSelectedPriorities}
            sortBy={sortBy}
            setSortBy={setSortBy}
            dateRange={dateRange}
            setDateRange={setDateRange}
            tasks={tasks}
            visibleTasks={visibleTasks}
            overdueFilter={overdueFilter}
            setOverdueFilter={setOverdueFilter}
            onImportTasks={handleImportTasks}
            viewMode={viewMode}
            setViewMode={setViewMode}
            isCalendarView={isCalendarView}
            onToggleCalendar={() => setIsCalendarView(!isCalendarView)}
            setIsCalendarView={setIsCalendarView}
            displayedColumns={displayedColumns}
            onDisplayedColumnsChange={setDisplayedColumns}
            exportPrefix="active-tasks"
            selectedTaskIds={selectedTaskIds}
            additionalButtons={
              <>
                <DraftsDialog 
                  drafts={adaptedDrafts}
                  onLoadDraft={(draft) => {
                    setCurrentDraft(draft)
                    setDialogOpen(true)
                  }}
                  onDeleteDraft={handleDeleteDraft}
                  filterType="task"
                  open={draftsDialogOpen}
                  onOpenChange={setDraftsDialogOpen}
                  refreshAction={
                    <Button variant="ghost" size="icon" onClick={() => loadDrafts()} aria-label="Refresh drafts">
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  }
                >
                  <Button 
                    size="sm"
                    className="text-white"
                    title="Drafts"
                    style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                    onClick={() => setDraftsDialogOpen(true)}
                  >
                    <FileText className="h-4 w-4 mr-2" /> Drafts ({drafts.filter(d=>d.type==='task').length})
                  </Button>
                </DraftsDialog>
                
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm"
                      className="text-white"
                      title="Create Task"
                      style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                      onClick={() => {
                        // Force fresh form when explicitly adding a new task
                        if (currentDraft) setCurrentDraft(null)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Create Task
                    </Button>
                  </DialogTrigger>
                  <TaskFormDialog
                    isOpen={dialogOpen}
                    onOpenChange={(open) => { if (!open) setCurrentDraft(null); setDialogOpen(open) }}
                    onSave={handleSaveTaskFromDialog}
                    onSaveDraft={async (data, draftId) => {
                      try {
                        await saveDraft(data.taskName || 'Untitled Task', data, draftId)
                        showFeedback(
                          "success",
                          draftId ? "Draft Updated" : "Draft Saved",
                          `"${data.taskName || 'Untitled Task'}" has been ${draftId ? 'updated' : 'saved'} successfully.`
                        )
                      } catch (error: any) {
                        showFeedback("error", "Draft Save Failed", error?.message || "Failed to save draft")
                      }
                    }}
                    initialData={currentDraft ? {
                      ...currentDraft.data,
                      targetDate: currentDraft.data?.targetDate ? new Date(currentDraft.data.targetDate) : undefined,
                      createdOn: currentDraft.data?.createdOn ? new Date(currentDraft.data.createdOn) : undefined,
                    } : undefined}
                    loadedDraftId={currentDraft?.id}
                  />
                </Dialog>
              </>
            }
          />

          {/* Active Tasks Display - List, Grid, or Calendar */}
          {isCalendarView ? (
            <TaskCalendarView
              tasks={[...activeTasks, ...completedTasks]}
              onViewTask={openViewDialog}
              onEditTask={openEditDialog}
              onDeleteTask={handleDeleteTask}
              onToggleComplete={handleCompleteTask}
              onUpdateTask={handleUpdateTask}
              onUpdateTaskRemarks={handleUpdateTaskRemarks}
            />
          ) : (
            <>
              {/* Active Tasks Section */}
              <div className="mb-8">
                {activeTasks.length > 0 ? (
                  viewMode === "list" ? (
                    <TaskList
                      tasks={activeTasks}
                      onToggleComplete={handleCompleteTask}
                      onViewTask={openViewDialog}
                      onEditTask={openEditDialog}
                      onDeleteTask={handleDeleteTask}
                      onUpdateTask={handleUpdateTask}
                      selectedTaskIds={selectedTaskIds}
                      onTaskSelection={handleTaskSelection}
                      onSelectAll={handleSelectAllActive}
                      allTasksSelected={allActiveSelected}
                      someTasksSelected={someActiveSelected}
                      displayedColumns={displayedColumns}
                      tableType="active"
                    />
                  ) : (
                    <TaskGridView
                      tasks={activeTasks}
                      onToggleComplete={handleCompleteTask}
                      onViewTask={openViewDialog}
                      onEditTask={openEditDialog}
                      onDeleteTask={handleDeleteTask}
                      onUpdateTask={handleUpdateTask}
                      onUpdateTaskRemarks={handleUpdateTaskRemarks}
                      selectedTaskIds={selectedTaskIds}
                      onTaskSelection={handleTaskSelection}
                    />
                  )
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-white">
                    <p className="text-lg mb-2">No active tasks found</p>
                    <p className="text-sm">Create a new task or adjust your filters</p>
                  </div>
                )}
              </div>

              {/* Completed Tasks Section */}
              <div className="border-t pt-8">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-green-700">Completed Tasks</h3>
                </div>

                {/* Separate Filters and Sort for Completed Tasks */}
                <div className="mb-6">
                  <TaskFiltersAndSort
                    searchTerm={completedSearchTerm}
                    setSearchTerm={setCompletedSearchTerm}
                    selectedStatuses={completedSelectedStatuses}
                    setSelectedStatuses={setCompletedSelectedStatuses}
                    selectedPriorities={completedSelectedPriorities}
                    setSelectedPriorities={setCompletedSelectedPriorities}
                    sortBy={completedSortBy}
                    setSortBy={setCompletedSortBy}
                    dateRange={completedDateRange}
                    setDateRange={setCompletedDateRange}
                    tasks={tasks.filter(task => task.status === "completed")}
                    visibleTasks={completedTasks}
                    hideOverdueFilter
                    onImportTasks={handleImportTasks}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    isCalendarView={isCalendarView}
                    onToggleCalendar={() => setIsCalendarView(!isCalendarView)}
                    setIsCalendarView={setIsCalendarView}
                    displayedColumns={displayedColumns}
                    onDisplayedColumnsChange={setDisplayedColumns}
                    exportPrefix="completed-tasks"
                    hideStatusFilter={true}
                    hideCalendarToggle={false}
                    hideImportButton={true}
                    selectedTaskIds={selectedTaskIds}
                  />
                </div>

                {completedTasks.length > 0 ? (
                  viewMode === "list" ? (
                    <TaskList
                      tasks={completedTasks}
                      onToggleComplete={handleCompleteTask}
                      onViewTask={openViewDialog}
                      onEditTask={openEditDialog}
                      onDeleteTask={handleDeleteTask}
                      onUpdateTask={handleUpdateTask}
                      onUpdateTaskRemarks={handleUpdateTaskRemarks}
                      selectedTaskIds={selectedTaskIds}
                      onTaskSelection={handleTaskSelection}
                      onSelectAll={handleSelectAllCompleted}
                      allTasksSelected={allCompletedSelected}
                      someTasksSelected={someCompletedSelected}
                      displayedColumns={displayedColumns}
                      tableType="completed"
                    />
                  ) : (
                    <TaskGridView
                      tasks={completedTasks}
                      onToggleComplete={handleCompleteTask}
                      onViewTask={openViewDialog}
                      onEditTask={openEditDialog}
                      onDeleteTask={handleDeleteTask}
                      onUpdateTask={handleUpdateTask}
                      onUpdateTaskRemarks={handleUpdateTaskRemarks}
                      selectedTaskIds={selectedTaskIds}
                      onTaskSelection={handleTaskSelection}
                    />
                  )
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-white">
                    <p className="text-lg mb-2">No completed tasks found</p>
                    <p className="text-sm">Try adjusting your filters to see completed tasks</p>
                  </div>
                )}
              </div>
            </>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="relative mt-6">
          {isSettingsTabDisabled && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 px-4 text-center">
              <div className="rounded-md border border-dashed border-muted-foreground/40 bg-background/80 px-4 py-3 shadow-sm">
                <p className="text-sm font-medium text-muted-foreground">Task settings are locked to organizational defaults.</p>
                <p className="text-xs text-muted-foreground/80">Please contact your administrator to request changes.</p>
              </div>
            </div>
          )}
          <Card className={`${isSettingsTabDisabled ? 'pointer-events-none opacity-60' : ''} border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900`}>
            <CardContent className="p-6">
              <TaskSettings
                settings={taskSettings}
                onUpdateSetting={updateSetting}
                onResetSettings={resetSettings}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Task Dialog */}
      <TaskViewDialog
        task={viewTask}
        isOpen={viewDialogOpen}
        onClose={closeViewDialog}
      />

      {/* Edit Task Dialog */}
      {editTask && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <TaskFormDialog
            isOpen={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSave={handleUpdateTask}
            editTask={editTask || undefined}
            onSaveDraft={async (data, draftId) => {
              try {
                await saveDraft(data.taskName || 'Untitled Task', data, draftId)
                showFeedback(
                  "success",
                  draftId ? "Draft Updated" : "Draft Saved",
                  `"${data.taskName || 'Untitled Task'}" has been ${draftId ? 'updated' : 'saved'} successfully.`
                )
              } catch (error: any) {
                showFeedback("error", "Draft Save Failed", error?.message || "Failed to save draft")
              }
            }}
          />
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <TaskDeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        task={deleteTask}
        onConfirm={confirmDeleteTask}
        onCancel={closeDeleteDialog}
      />

      {/* Complete Confirmation Dialog */}
      <TaskCompleteConfirmationDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        task={completeTask}
        onConfirm={confirmCompleteTask}
        onCancel={closeCompleteDialog}
      />
    </div>
  )
}


