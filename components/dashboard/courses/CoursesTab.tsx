"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/dashboard/ui/card"
import { Button } from "@/components/dashboard/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import {
  Search, Plus, BookOpen, Download, Upload, Filter, ArrowUpDown,
  Trash2, Pencil, Save, X, Check, GraduationCap, Megaphone,
  BarChart3, DollarSign, CreditCard, Zap, Shield, Briefcase, ClipboardCheck, Timer, Bot,
  Grid3X3, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, RotateCcw
} from "lucide-react"
import SearchAndFilters from "./SearchAndFilters"
import CourseList from "./CourseList"
import { Course } from "@/types/dashboard/course"

interface CoursesTabProps {
  courses?: Course[]
  setCourses: (courses: Course[] | ((prev: Course[]) => Course[])) => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  selectedFilters: any
  setSelectedFilters: (filters: any) => void
  pendingFilters: any
  setPendingFilters: (filters: any) => void
  sortBy: string
  setSortBy: (sort: string) => void
  sortOrder: "asc" | "desc"
  setSortOrder: (order: "asc" | "desc") => void
  currency: string
  viewMode: "grid" | "list"
  setViewMode: (mode: "grid" | "list") => void
  filteredAndSortedCourses: Course[]
  onCourseClick: (course: Course) => void
  onEditCourse: (course: Course) => void
  onDeleteCourse: (course: Course) => void
  onBulkAction: (action: string, selectedIds: string[]) => void
}

export default function CoursesTab({
  courses,
  setCourses,
  searchTerm,
  setSearchTerm,
  activeTab,
  setActiveTab,
  selectedFilters,
  setSelectedFilters,
  pendingFilters,
  setPendingFilters,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  currency,
  viewMode,
  setViewMode,
  filteredAndSortedCourses,
  onCourseClick,
  onEditCourse,
  onDeleteCourse,
  onBulkAction
}: CoursesTabProps) {
  // Compute course type options
  const courseTypeOptions = useMemo(() => {
    const defaultTypes = ["Online", "Offline", "Hybrid"];
    const courseTypes = courses?.map(course => {
      if (!course.type) return null;
      // Normalize type to match default types (fix case sensitivity)
      const normalized = course.type.trim();
      const match = defaultTypes.find(def => def.toLowerCase() === normalized.toLowerCase());
      return match || normalized;
    }).filter(Boolean) || [];
    const allTypes = new Set([...defaultTypes, ...courseTypes]);
    return Array.from(allTypes).sort();
  }, [courses])

  return (
    <div className="space-y-6">
      {/* Course Management Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Course Management</h2>
          <p className="text-muted-foreground">
            Manage and organize your course catalog
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
        </div>
      </div>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Courses ({courses?.length || 0})</TabsTrigger>
          <TabsTrigger value="active">
            Active ({courses?.filter(c => c.status === "Active").length || 0})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Draft ({courses?.filter(c => c.status === "Draft").length || 0})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactive ({courses?.filter(c => c.status === "Inactive").length || 0})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search and Filters */}
      <SearchAndFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedFilters={selectedFilters}
        setSelectedFilters={setSelectedFilters}
        pendingFilters={pendingFilters}
        setPendingFilters={setPendingFilters}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        viewMode={viewMode}
        setViewMode={setViewMode}
        courses={courses}
        setCourses={setCourses}
        filteredCourses={filteredAndSortedCourses}
        courseTypeOptions={courseTypeOptions}
      />

      {/* Course List */}
      <CourseList
        courses={filteredAndSortedCourses}
        viewMode={viewMode}
        onCourseClick={onCourseClick}
        onEditCourse={onEditCourse}
        onDeleteCourse={onDeleteCourse}
      />
    </div>
  )
}