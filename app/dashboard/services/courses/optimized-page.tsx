import React, { useEffect, useMemo, useCallback } from "react"
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Button } from "@/components/dashboard/ui/button"
import { Badge } from "@/components/dashboard/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import { Plus, TrendingUp, Users, BookOpen, DollarSign, Star, BarChart3, Grid, List, ArrowUp, ArrowDown } from "lucide-react"
import { useCourseStore, useFilteredCourses, useCourseStats, useLoading } from "@/store/dashboard/courseStore"
import ErrorBoundary from "@/components/dashboard/error-boundary"
import type { Course } from "@/types/dashboard/course"

// Create a simple error fallback component
const ErrorFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground">Please refresh the page to try again.</p>
    </div>
  </div>
);

// Lazy load heavy components
const VirtualizedCourseList = dynamic(() => import('@/components/dashboard/courses/VirtualizedCourseList'), {
  loading: () => <div className="flex items-center justify-center h-64">Loading courses...</div>
});

// Memoized stats card component
const StatsCard = React.memo<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  format?: 'number' | 'currency' | 'percentage';
}>(({ title, value, icon, trend, format = 'number' }) => {
  const formattedValue = useMemo(() => {
    if (typeof value === 'number') {
      switch (format) {
        case 'currency':
          return value.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          });
        case 'percentage':
          return `${value.toFixed(1)}%`;
        case 'number':
        default:
          return value.toLocaleString();
      }
    }
    return value;
  }, [value, format]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        {trend && (
          <p className="text-xs text-muted-foreground">
            <span className={trend > 0 ? "text-green-600" : "text-red-600"}>
              {trend > 0 ? "+" : ""}{trend.toFixed(1)}%
            </span>{" "}
            from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
});

StatsCard.displayName = 'StatsCard';

export default function OptimizedCourseManagementPage() {
  // Use Zustand store instead of multiple useState hooks
  const {
    currency,
    viewMode,
    activeTab,
    selectedCourse,
    selectedCourseIds,
    isEditMode,
    editCourseId,
    isDraftsDialogOpen,
    showDeleteConfirmation,
    searchTerm,
    selectedFilters,
    pendingFilters,
    sortBy,
    sortOrder,
    drafts,
    cohorts,
    // Actions
    setCurrency,
    setViewMode,
    setActiveTab,
    setSelectedCourse,
    setSelectedCourseIds,
    toggleCourseSelection,
    setIsEditMode,
    setEditCourseId,
    setIsDraftsDialogOpen,
    setShowDeleteConfirmation,
    setSearchTerm,
    setSelectedFilters,
    setPendingFilters,
    setSortBy,
    setSortOrder,
    initializeData,
  } = useCourseStore();

  // Use optimized selectors
  const filteredCourses = useFilteredCourses();
  const stats = useCourseStats();
  const loading = useLoading();

  // Initialize data on mount
  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleCourseClick = useCallback((course: any) => {
    setSelectedCourse(course);
  }, [setSelectedCourse]);

  const handleEditCourse = useCallback((course: any) => {
    setEditCourseId(course.id);
    setIsEditMode(true);
  }, [setEditCourseId, setIsEditMode]);

  const handleDeleteCourse = useCallback((courseId: string) => {
    console.log('Delete course:', courseId);
    setShowDeleteConfirmation(true);
  }, [setShowDeleteConfirmation]);

  const handleBulkAction = useCallback((action: string, courseIds: string[]) => {
    console.log('Bulk action:', action, courseIds);
    // Implement bulk actions
  }, []);

  const handleCreateNew = useCallback(() => {
    setIsEditMode(false);
    setEditCourseId(null);
    setSelectedCourse(null);
  }, [setIsEditMode, setEditCourseId, setSelectedCourse]);

  // Memoized stats cards
  const statsCards = useMemo(() => [
    {
      title: "Total Courses",
      value: stats.totalCourses,
      icon: <BookOpen className="h-4 w-4 text-muted-foreground" />,
      format: 'number' as const
    },
    {
      title: "Active Courses",
      value: stats.activeCourses,
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
      format: 'number' as const
    },
    {
      title: "Total Students",
      value: stats.totalStudents,
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      format: 'number' as const
    },
    {
      title: "Total Revenue",
      value: stats.totalRevenue,
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      format: 'currency' as const
    },
    {
      title: "Average Rating",
      value: stats.averageRating,
      icon: <Star className="h-4 w-4 text-muted-foreground" />,
      format: 'number' as const
    },
    {
      title: "Completion Rate",
      value: stats.completionRate,
      icon: <BarChart3 className="h-4 w-4 text-muted-foreground" />,
      format: 'percentage' as const
    }
  ], [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Course Management</h1>
            <p className="text-muted-foreground">
              Manage your courses, track performance, and engage with students
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsDraftsDialogOpen(true)}>
              View Drafts ({drafts.length})
            </Button>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Create Course
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statsCards.map((stat, index) => (
            <StatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              format={stat.format}
            />
          ))}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList>
              <TabsTrigger value="all">All Courses</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TabsContent value={activeTab} className="space-y-4">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="rating">Sort by Rating</option>
                      <option value="price">Sort by Price</option>
                      <option value="enrolledStudents">Sort by Students</option>
                    </select>
                    <Button
                      variant="outline"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Actions */}
            {selectedCourseIds.length > 0 && (
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {selectedCourseIds.length} course(s) selected
                    </span>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleBulkAction('publish', selectedCourseIds)}
                      >
                        Bulk Publish
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleBulkAction('archive', selectedCourseIds)}
                      >
                        Bulk Archive
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedCourseIds([])}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course List */}
            <Card>
              <CardContent className="p-0">
                <VirtualizedCourseList
                  courses={filteredCourses}
                  viewMode={viewMode}
                  currency={currency}
                  onCourseClick={handleCourseClick}
                  onEditCourse={handleEditCourse}
                  onDeleteCourse={handleDeleteCourse}
                  selectedCourseIds={selectedCourseIds}
                  onToggleSelection={toggleCourseSelection}
                  height={600}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Simplified placeholder for cohort management */}
        <Card>
          <CardHeader>
            <CardTitle>Cohort Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Cohort management features will be available here. 
              Current cohorts: {cohorts?.length || 0}
            </p>
          </CardContent>
        </Card>

        {/* Simplified dialogs */}
        {isDraftsDialogOpen && (
          <Card>
            <CardHeader>
              <CardTitle>Drafts ({drafts?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Your saved drafts will appear here.</p>
              <Button onClick={() => setIsDraftsDialogOpen(false)}>
                Close
              </Button>
            </CardContent>
          </Card>
        )}

        {(isEditMode || !!editCourseId) && (
          <Card>
            <CardHeader>
              <CardTitle>Course Form</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Course creation/editing form will be displayed here.
                {selectedCourse && ` Editing: ${selectedCourse.name}`}
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    console.log('Save course data');
                    setIsEditMode(false);
                    setEditCourseId(null);
                  }}
                >
                  Save Course
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsEditMode(false);
                    setEditCourseId(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ErrorBoundary>
  );
}
