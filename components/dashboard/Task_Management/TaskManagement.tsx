import React, { useState, useEffect } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Plus, FileText, RotateCw, LayoutDashboard, List, Settings } from "lucide-react"
import { Dialog, DialogTrigger } from "@/components/dashboard/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import { toast } from "@/hooks/dashboard/use-toast"
import { crudSuccess } from "@/lib/dashboard/crud-toast"
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
  const { drafts, save: saveDraft, remove: deleteDraft, load: loadDrafts } = useTaskDraftsApi("task")
  
  const handleDeleteDraft = async (draftId: string) => {
    const draftToDelete = drafts.find(d => d.id === draftId)
    const draftName = draftToDelete?.title || 'Draft'
    try {
      await deleteDraft(draftId)
      toast({
        title: "Draft Deleted",
        description: `"${draftName}" has been deleted successfully.`,
      })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to delete draft', variant: 'destructive' })
    }
  }
  const [currentDraft, setCurrentDraft] = useState<any | null>(null)
  const [draftsDialogOpen, setDraftsDialogOpen] = useState(false)

  // Settings state - Task-specific only
  const [taskSettings, setTaskSettings] = useState({
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

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('taskSettings')
    if (savedSettings) {
      try {
        setTaskSettings(JSON.parse(savedSettings))
      } catch (e) {
        console.error('Failed to parse task settings:', e)
      }
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('taskSettings', JSON.stringify(taskSettings))
  }, [taskSettings])

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
    const defaultSettings = {
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
    }
    setTaskSettings(defaultSettings)
    toast({
      title: "Settings Reset",
      description: "Task-specific settings have been reset to their default values.",
    })
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
        toast({
          title: "Task Updated",
          description: `"${newTask.name}" has been updated successfully.`,
        })
      } else {
        await create(newTask)
        toast({
          title: "Task Created", 
          description: `"${newTask.name}" has been created successfully.`,
        })
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
      toast({ title: 'Error', description: e.message || 'Failed to save task', variant: 'destructive' })
    }
  }

  const handleImportTasks = (importedTasks: Task[]) => {
    // Optional: could batch call API; for now append locally for quick UX
    setTasks([...tasks, ...importedTasks])
    if (importedTasks.length) {
      crudSuccess('tasks', 'import', { description: `${importedTasks.length} task${importedTasks.length>1?'s':''} imported successfully.` })
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
      toast({
        title: "Task Deleted",
        description: `"${deleteTask.name}" has been deleted successfully.`,
      })
      closeDeleteDialog()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to delete task', variant: 'destructive' })
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
        toast({
          title: "Task Completed",
          description: `"${task.name}" has been marked as completed.`,
        })
      } else {
        toast({
          title: "Task Reopened", 
          description: `"${task.name}" has been reopened.`,
        })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to update task', variant: 'destructive' })
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
      toast({
        title: "Task Updated",
        description: `"${updatedTask.name}" has been updated successfully.`,
      })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to update task', variant: 'destructive' })
    }
  }

  const handleUpdateTaskRemarks = async (updatedTask: Task) => {
    try {
      await update(updatedTask)
      toast({
        title: "Remarks Updated",
        description: `Remarks for "${updatedTask.name}" have been updated successfully.`,
      })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to update task remarks', variant: 'destructive' })
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
            className="flex items-center justify-center gap-2 px-4 py-2 border-2 bg-transparent font-medium data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent"
            style={{
              borderColor: activeTab === 'settings' ? 'transparent' : secondaryColor,
              color: activeTab === 'settings' ? 'white' : secondaryColor,
              backgroundColor: activeTab === 'settings' ? primaryColor : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'settings') {
                e.currentTarget.style.backgroundColor = `${secondaryColor}15`
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'settings') {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
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
                    onSaveDraft={(data, draftId) => {
                      saveDraft(data.taskName || 'Untitled Task', data, draftId)
                      toast({
                        title: draftId ? "Draft Updated" : "Draft Saved",
                        description: `"${data.taskName || 'Untitled Task'}" has been ${draftId ? 'updated' : 'saved'} successfully.`,
                      })
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
        <TabsContent value="settings">
          <Card>
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
            onSaveDraft={(data, draftId) => {
              saveDraft(data.taskName || 'Untitled Task', data, draftId)
              toast({
                title: draftId ? "Draft Updated" : "Draft Saved", 
                description: `"${data.taskName || 'Untitled Task'}" has been ${draftId ? 'updated' : 'saved'} successfully.`,
              })
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


