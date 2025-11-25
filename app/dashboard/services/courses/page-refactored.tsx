"use client"

import { useState } from "react"
import MainLayout from "@/components/dashboard/main-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import { LayoutDashboard, BookOpen, Users } from "lucide-react"
import HeroSection from "@/components/dashboard/courses/HeroSection"
import DraftsDialog from "@/components/dashboard/courses/DraftsDialog"
import ConfirmationDialog from "@/components/dashboard/courses/ConfirmationDialog"
import AddCourseDialog from "@/components/dashboard/courses/AddCourseDialog"
import DashboardTab from "@/components/dashboard/courses/DashboardTab"
import CoursesTab from "@/components/dashboard/courses/CoursesTab"
import CohortsTab from "@/components/dashboard/courses/CohortsTab"

// Import the correct Course type
import { Course } from "@/types/dashboard/course"

// Custom hooks
import { useCourseManagement } from "@/hooks/dashboard/useCourseManagement"
import { useCourseFilters } from "@/hooks/dashboard/useCourseFilters"
import { useColumnManagement } from "@/hooks/dashboard/useColumnManagement"

export default function EnhancedCourseManagementPage() {
  // Custom hooks for state management
  const {
    courses,
    setCourses,
    drafts,
    setDrafts,
    cohorts,
    setCohorts,
    loading,
    studentCount,
    handleDeleteCourse,
    handleDeleteDraft,
    refetchDrafts,
  } = useCourseManagement()

  const {
    selectedFilters,
    setSelectedFilters,
    pendingFilters,
    setPendingFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    filteredAndSortedCourses,
  } = useCourseFilters(courses, currency)

  const {
    displayedColumns,
    isColumnSelectionOpen,
    setIsColumnSelectionOpen,
    selectedAvailableColumns,
    setSelectedAvailableColumns,
    selectedDisplayedColumns,
    setSelectedDisplayedColumns,
    moveColumnsToDisplayed,
    moveColumnsToAvailable,
    moveColumnUp,
    moveColumnDown,
    saveColumnConfiguration,
    resetColumnConfiguration,
  } = useColumnManagement()

  // Local state
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editCourseId, setEditCourseId] = useState<string | null>(null)
  const [currency, setCurrency] = useState<"USD" | "${currency}">("${currency}")

  // Dialog states
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false)
  const [isViewCourseDialogOpen, setIsViewCourseDialogOpen] = useState(false)
  const [isDraftsDialogOpen, setIsDraftsDialogOpen] = useState(false)

  // Navigation tab state
  const [currentTab, setCurrentTab] = useState("courses")

  // Event handlers
  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course)
    setIsViewCourseDialogOpen(true)
  }

  const handleEditCourse = (course: Course) => {
    setIsEditMode(true)
    setEditCourseId(course.id)
    setIsAddCourseDialogOpen(true)
  }

  const handleBulkAction = (action: string, selectedCourseIds: string[]) => {
    // Bulk action implementation
    console.log('Bulk action:', action, selectedCourseIds)
  }

  const showDeleteConfirmation = (title: string, message: string, onConfirm: () => void, itemName?: string, confirmButtonText?: string) => {
    // Confirmation dialog implementation
    console.log('Delete confirmation:', title, message)
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-white">Loading courses...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-2 space-y-4">
        <HeroSection
          onCreateCourse={() => setIsAddCourseDialogOpen(true)}
          onOpenDrafts={() => setIsDraftsDialogOpen(true)}
          onOpenMarketing={() => {}}
        />

        {/* Navigation Tabs */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-transparent gap-2 p-0 h-auto">
            <TabsTrigger
              value="dashboard"
              className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-transparent bg-purple-500 text-white font-medium data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:border-orange-400 data-[state=inactive]:text-orange-600 hover:bg-purple-600 data-[state=inactive]:hover:bg-orange-50"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="courses"
              className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-orange-400 bg-transparent text-orange-600 font-medium data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-orange-400 data-[state=inactive]:text-orange-600 hover:bg-orange-50 data-[state=active]:hover:bg-purple-600"
            >
              <BookOpen className="h-4 w-4" />
              Courses
            </TabsTrigger>
            <TabsTrigger
              value="cohorts"
              className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-orange-400 bg-transparent text-orange-600 font-medium data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-orange-400 data-[state=inactive]:text-orange-600 hover:bg-orange-50 data-[state=active]:hover:bg-purple-600"
            >
              <Users className="h-4 w-4" />
              Cohorts
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab Content */}
          <TabsContent value="dashboard" className="space-y-6">
            <DashboardTab
              courses={courses}
              cohorts={cohorts}
              studentCount={studentCount}
              currency={currency}
            />
          </TabsContent>

          {/* Courses Tab Content */}
          <TabsContent value="courses" className="space-y-6">
            <CoursesTab
              courses={courses}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              selectedFilters={selectedFilters}
              setSelectedFilters={setSelectedFilters}
              pendingFilters={pendingFilters}
              setPendingFilters={setPendingFilters}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              currency={currency}
              viewMode={viewMode}
              setViewMode={setViewMode}
              onCourseClick={handleCourseClick}
              onEditCourse={handleEditCourse}
              onDeleteCourse={(course) => showDeleteConfirmation(
                "Delete Course",
                `Are you sure you want to delete "${course.name}"? This action cannot be undone.`,
                () => handleDeleteCourse(course),
                course.name,
                "Delete Course"
              )}
              onBulkAction={handleBulkAction}
            />
          </TabsContent>

          {/* Cohorts Tab Content */}
          <TabsContent value="cohorts" className="space-y-6">
            <CohortsTab
              cohorts={cohorts}
              courses={courses}
              onAddCohort={() => {}}
              onEditCohort={() => {}}
              onDeleteCohort={() => {}}
            />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <DraftsDialog
          isOpen={isDraftsDialogOpen}
          onClose={() => setIsDraftsDialogOpen(false)}
          drafts={drafts}
          onEditDraft={() => {}}
          onDeleteDraft={handleDeleteDraft}
        />

        <ConfirmationDialog
          isOpen={false}
          onClose={() => {}}
          title=""
          message=""
          onConfirm={() => {}}
        />

        <AddCourseDialog
          isOpen={isAddCourseDialogOpen}
          onClose={() => {
            setIsAddCourseDialogOpen(false)
            setIsEditMode(false)
            setEditCourseId(null)
          }}
          isEditMode={isEditMode}
          editCourseId={editCourseId}
          courses={courses}
          setCourses={setCourses}
          drafts={drafts}
          setDrafts={setDrafts}
        />
      </div>
    </MainLayout>
  )
}