"use client"

import { Card, CardContent } from "@/components/dashboard/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/dashboard/ui/table"
import { Button } from "@/components/dashboard/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/dashboard/ui/dialog"
import type { Course } from "@/types/dashboard/course"
import { useState } from "react"
import ConfirmationDialog from "./ConfirmationDialog"
import { Pencil, Trash2, Plus, X, MapPin } from "lucide-react";
import { Checkbox } from "@/components/dashboard/ui/checkbox"

interface CourseListProps {
  courses: Course[];
  viewMode: "grid" | "list";
  onCourseClick: (course: Course) => void;
  onEditCourse: (course: Course) => void;
  onDeleteCourse?: (course: Course) => void;
  onAddCourse?: () => void;
  cohorts?: Array<{ id: string; courseId: string; name: string }>; // Add cohorts prop
  displayedColumns?: string[]; // Add displayed columns prop
  selectedCourseIds?: string[];
  onToggleCourseSelect?: (courseId: string, selected: boolean) => void;
  onToggleAllVisible?: (courseIds: string[], selected: boolean) => void;
  showIdBadges?: boolean;
  enrollmentSettings?: {
    showCapacityAlerts: boolean;
    lowCapacityThreshold: number;
    showCohortCounts: boolean;
  };
}

export default function CourseList({ courses, viewMode, onCourseClick, onEditCourse, onDeleteCourse, onAddCourse, cohorts = [], displayedColumns = ['courseId', 'name', 'instructor', 'location', 'type', 'level', 'priceINR', 'status'], selectedCourseIds = [], onToggleCourseSelect, onToggleAllVisible, showIdBadges = false, enrollmentSettings }: CourseListProps) {
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [viewAllCourses, setViewAllCourses] = useState(false);

  // Debug: Log the displayed columns
  console.log('[CourseList] Displayed columns:', displayedColumns);

  const getId = (course: Course, fallback: string) =>
    (course as any).id || (course as any)._id || (course as any).courseId || (course as any).customId || fallback

  const cohortCountForCourse = (course: Course) => {
    if (!enrollmentSettings?.showCohortCounts) return null
    const currentId = course.courseId || course.id
    return cohorts.filter(cohort => cohort.courseId === currentId || cohort.courseId === course.id).length
  }

  const getCapacitySnapshot = (course: Course) => {
    if (!enrollmentSettings?.showCapacityAlerts && !(course.maxStudents && (course as any).enrolledStudents)) {
      return null
    }
    const maxSeats = Number(course.maxStudents) || 0
    if (!maxSeats) return null
    const enrolled = Number((course as any).enrolledStudents ?? (course as any).enrollmentCount ?? 0)
    const remaining = Math.max(maxSeats - enrolled, 0)
    const threshold = Math.max(0, enrollmentSettings?.lowCapacityThreshold ?? 0)
    const isFull = remaining === 0
    const showWarning = Boolean(enrollmentSettings?.showCapacityAlerts && !isFull && remaining <= threshold)
    return {
      maxSeats,
      enrolled,
      remaining,
      isFull,
      showWarning,
    }
  }

  const renderCapacityIndicator = (course: Course, inline = false) => {
    const snapshot = getCapacitySnapshot(course)
    if (!snapshot) return null
    if (snapshot.isFull) {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${inline ? 'ml-2' : ''} bg-red-100 text-red-700`}>
          Fully booked
        </span>
      )
    }
    if (snapshot.showWarning) {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${inline ? 'ml-2' : ''} bg-amber-100 text-amber-700`}>
          {snapshot.remaining} seat{snapshot.remaining === 1 ? '' : 's'} left
        </span>
      )
    }
    return null
  }

  // Column configuration mapping
  const columnConfig = {
    courseId: { 
      label: 'Course ID', 
      render: (course: Course) => {
        const idValue = course.courseId || course.customId || course.id || '-'
        return showIdBadges ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-medium">
            {idValue}
          </span>
        ) : idValue
      }
    },
    name: { 
      label: 'Course Name', 
      render: (course: Course) => course.name
    },
    instructor: { label: 'Instructor', render: (course: Course) => course.instructor },
    location: { label: 'Location', render: (course: Course) => course.location || '-' },
    type: { label: 'Type', render: (course: Course) => course.type },
    level: { label: 'Level', render: (course: Course) => course.level },
    priceINR: { label: 'Price (INR)', render: (course: Course) => `INR ${course.priceINR?.toLocaleString()}` },
    status: { 
      label: 'Status', 
      render: (course: Course) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          course.status === 'Active' ? 'bg-green-100 text-green-800' :
          course.status === 'Completed' ? 'bg-gray-100 text-gray-800' :
          course.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
          course.status === 'Inactive' ? 'bg-yellow-100 text-yellow-800' :
          course.status === 'Draft' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {course.status}
        </span>
      )
    },
    courseCategory: { label: 'Category', render: (course: Course) => course.courseCategory || '-' },
    maxStudents: { 
      label: 'Max Students', 
      render: (course: Course) => {
        const snapshot = getCapacitySnapshot(course)
        return (
          <div className="space-y-1">
            <span>{course.maxStudents || '-'}</span>
            {snapshot && (
              <div className="text-[11px] text-gray-500">
                {snapshot.enrolled} enrolled
                {renderCapacityIndicator(course)}
              </div>
            )}
          </div>
        )
      }
    },
    duration: { label: 'Duration', render: (course: Course) => course.duration || '-' },
    description: { label: 'Description', render: (course: Course) => course.description ? `${course.description.substring(0, 50)}...` : '-' },
    tags: { label: 'Tags', render: (course: Course) => course.tags ? course.tags.join(', ') : '-' },
    skills: { label: 'Skills', render: (course: Course) => (course as any).skills ? (course as any).skills.join(', ') : '-' },
    prerequisites: { label: 'Prerequisites', render: (course: Course) => (course as any).prerequisites ? (course as any).prerequisites.join(', ') : '-' }
  };

  const handleDelete = (e: React.MouseEvent, course: Course) => {
    e.stopPropagation(); // Prevent triggering the course click
    setCourseToDelete(course);
  };

  const handleConfirmDelete = () => {
    if (courseToDelete && onDeleteCourse) {
      onDeleteCourse(courseToDelete);
    }
    setCourseToDelete(null);
  };

  // Calculate associated cohorts for the course to be deleted
  const getAssociatedCohortsCount = (course: Course) => {
    return cohorts.filter(cohort => 
      cohort.courseId === course.id || cohort.courseId === course.courseId
    ).length;
  };

  const associatedCohortsCount = courseToDelete ? getAssociatedCohortsCount(courseToDelete) : 0;
  
  const deleteMessage = associatedCohortsCount > 0 
    ? `This course has ${associatedCohortsCount} associated cohort${associatedCohortsCount > 1 ? 's' : ''}. Deleting this course will permanently delete all associated cohorts and their members. Do you want to proceed?`
    : "Are you sure you want to delete this course? This action cannot be undone.";

  // Add confirmation dialog
  const deleteDialog = (
    <ConfirmationDialog
      isOpen={courseToDelete !== null}
      title={associatedCohortsCount > 0 ? "Delete Course & Associated Cohorts" : "Delete Course"}
      message={deleteMessage}
      itemName={courseToDelete?.name}
      onConfirm={handleConfirmDelete}
      onCancel={() => setCourseToDelete(null)}
      confirmButtonText={associatedCohortsCount > 0 ? "Delete Course & Cohorts" : "Delete Course"}
    />
  );

  if (viewMode === 'list') {
    return (
      <>
        {deleteDialog}
        {courses.length > 2 ? (
          <Card>
          <CardContent className="p-0">
          <div className="table-container-with-sticky-header" style={{ width: '100%' }}>
            <table className="w-full caption-bottom text-sm min-w-max" style={{ width: 'max-content', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <TableHead className="w-12 sticky-table-header">
                    <Checkbox
                      checked={courses.length > 0 && courses.every((c, i) => selectedCourseIds.includes(getId(c, `course-${i}`)))}
                      onCheckedChange={(checked) => {
                        const ids = courses.map((c, i) => getId(c, `course-${i}`))
                        onToggleAllVisible?.(ids, Boolean(checked))
                      }}
                    />
                  </TableHead>
                  {displayedColumns.map(columnId => (
                    <TableHead key={columnId} className="sticky-table-header">
                      {columnConfig[columnId as keyof typeof columnConfig]?.label || columnId}
                    </TableHead>
                  ))}
                  <TableHead className="sticky-table-header w-40"></TableHead>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {courses.length === 0 ? (
                  <TableRow>
                  <TableCell colSpan={displayedColumns.length + 2} className="text-center text-gray-500">
                      No courses found.
                    </TableCell>
                  </TableRow>
                ) : (
                  courses.map((course, index) => (
                    <TableRow 
                      key={getId(course, `course-${index}`)} 
                      className="group cursor-pointer hover:bg-gray-50"
                      onClick={() => onCourseClick(course)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedCourseIds.includes(getId(course, `course-${index}`))}
                          onCheckedChange={(checked) => onToggleCourseSelect?.(getId(course, `course-${index}`), Boolean(checked))}
                        />
                      </TableCell>
                      {displayedColumns.map(columnId => {
                        const config = columnConfig[columnId as keyof typeof columnConfig];
                        const value = config?.render ? config.render(course) : course[columnId as keyof Course] || '-';
                        return (
                          <TableCell 
                            key={columnId} 
                            className={columnId === 'courseId' || columnId === 'name' ? 'font-medium' : ''}
                          >
                            {value}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center align-middle">
                        <div className="flex justify-center items-center h-full min-h-[40px]">
                          <button
                            className="text-purple-500 hover:text-purple-600 p-1 rounded-full focus:outline-none"
                            title="Edit"
                            onClick={e => { e.stopPropagation(); onEditCourse(course); }}
                          >
                            <Pencil className="h-4 w-4 " />
                          </button>
                          
                        
                           <button
                          className="p-2 hover:bg-red-100 rounded text-red-500 hover:text-red-700"
                          onClick={e => handleDelete(e, course)}
                          title="Delete"
                        >

                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                  )}
              </tbody>
            </table>
          </div>
          </CardContent>
          </Card>
        ) : (
          <Card>
          <CardContent className="p-0">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <TableHead className="w-12 sticky-table-header">
                    <Checkbox
                      checked={courses.length > 0 && courses.every((c, i) => selectedCourseIds.includes(getId(c, `course-${i}`)))}
                      onCheckedChange={(checked) => {
                        const ids = courses.map((c, i) => getId(c, `course-${i}`))
                        onToggleAllVisible?.(ids, Boolean(checked))
                      }}
                    />
                  </TableHead>
                  {displayedColumns.map(columnId => (
                    <TableHead key={columnId} className="sticky-table-header">
                      {columnConfig[columnId as keyof typeof columnConfig]?.label || columnId}
                    </TableHead>
                  ))}
                  <TableHead className="sticky-table-header w-40"></TableHead>
                </tr>
              </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={displayedColumns.length + 2} className="text-center text-gray-500">
                    No courses found.
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((course, index) => (
                  <TableRow 
                    key={getId(course, `course-${index}`)} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => onCourseClick(course)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedCourseIds.includes(getId(course, `course-${index}`))}
                        onCheckedChange={(checked) => onToggleCourseSelect?.(getId(course, `course-${index}`), Boolean(checked))}
                      />
                    </TableCell>
                    {displayedColumns.map(columnId => {
                      const config = columnConfig[columnId as keyof typeof columnConfig];
                      const value = config?.render ? config.render(course) : course[columnId as keyof Course] || '-';
                      return (
                        <TableCell 
                          key={columnId} 
                          className={columnId === 'courseId' || columnId === 'name' ? 'font-medium' : ''}
                        >
                          {value}
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      
                      <div className="flex justify-end items-center gap-2">
                        <button
                          className="text-gray-500 text-center hover:text-blue-600 p-1 rounded-full focus:outline-none"
                          title="Edit"
                          onClick={e => { e.stopPropagation(); onEditCourse(course); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 hover:bg-red-100 rounded text-red-500 hover:text-red-700"
                          onClick={e => handleDelete(e, course)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </CardContent>
          </Card>
        )}
      </>
    );
  }

  
  return (
    <>
      {deleteDialog}
      <div>
        {courses.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No courses found.</div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 w-max">
              {courses.map((course, index) => (
                <Card 
                  key={course.id || (course as any)._id || `course-${index}`} 
                  className="hover:shadow-lg transition-shadow cursor-pointer group relative border-2 border-orange-400 hover:border-orange-500 bg-white rounded-xl p-0 w-80 flex-shrink-0"
                  onClick={() => onCourseClick(course)}
                >
                  <CardContent className="p-5 pb-2 relative">
                    <button
                      className="absolute top-1 right-1 text-purple-500 hover:text-purple-600 p-1 rounded-full focus:outline-none z-10 opacity-80 group-hover:opacity-100"
                      title="Edit"
                      onClick={e => { e.stopPropagation(); onEditCourse(course); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col">
                        <h3 className="font-bold text-lg text-gray-900 leading-tight line-clamp-2">{course.name}</h3>
                        {course.sessionDetails?.sessionDuration && (
                          <span className="text-sm text-orange-600 mt-1">Session Duration: {course.sessionDetails.sessionDuration} hrs</span>
                        )}
                        {showIdBadges && (
                          <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-semibold">
                            {course.courseId || course.customId || course.id || '�'}
                          </span>
                        )}
                        {enrollmentSettings?.showCohortCounts && (
                          <span className="text-xs text-gray-500 mt-1">
                            {(() => {
                              const count = cohortCountForCourse(course)
                              if (count === null) return null
                              return count === 0 ? 'No cohorts yet' : `${count} cohort${count === 1 ? '' : 's'}`
                            })()}
                          </span>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm select-none ${
                        course.status === 'Active' ? 'bg-purple-100 text-purple-700' :
                        course.status === 'Completed' ? 'bg-orange-100 text-orange-700' :
                        course.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        course.status === 'Inactive' ? 'bg-gray-200 text-gray-700' :
                        course.status === 'Draft' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {course.status}
                      </span>
                    </div>
                    <div className="mb-2 flex flex-wrap gap-2 items-center">
                      <span className="inline-block bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-medium border border-purple-100">{course.type}</span>
                      <span className="inline-block bg-orange-50 text-orange-700 px-2 py-0.5 rounded text-xs font-medium border border-orange-100">{course.level}</span>
                      {course.tags && course.tags.length > 0 && course.tags.slice(0,2).map((tag, i) => (
                        <span key={i} className="inline-block bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium border border-gray-200">{tag}</span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-700 mb-1"> <span className="font-medium text-gray-900">{course.instructor}</span></p>
                    {course.location && <p className="text-xs text-gray-600 mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> {course.location}</p>}
                    {course.description && <p className="text-xs text-gray-500 line-clamp-2 mb-2">{course.description}</p>}
                    <div className="flex justify-between items-end mt-2">
                      <div>
                        <span className="text-xl font-bold text-purple-700">INR {course.priceINR?.toLocaleString()}</span>
                        {renderCapacityIndicator(course, true)}
                      </div>
                    </div>
                  </CardContent>
                  {/* Delete icon bottom right */}
                  <button
                    className="absolute -bottom-0 right-0 text-red-500 hover:text-red-700 focus:outline-none z-10 p-1 opacity-80 group-hover:opacity-100"
                    title="Delete"
                    onClick={e => handleDelete(e, course)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}
        {courses.length > 3 && (
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewAllCourses(true)}
              className="text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              View All {courses.length} Courses
            </Button>
          </div>
        )}
      </div>

      {/* View All Courses Dialog */}
      <Dialog open={viewAllCourses} onOpenChange={() => {}}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="font-bold">
              All Courses
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({courses.length} courses)
              </span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setViewAllCourses(false)}
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course, index) => (
                <Card 
                  key={course.id || (course as any)._id || `course-${index}`} 
                  className="hover:shadow-lg transition-shadow cursor-pointer group relative border-2 border-orange-400 hover:border-orange-500 bg-white rounded-xl p-0"
                  onClick={() => {
                    onCourseClick(course);
                    setViewAllCourses(false);
                  }}
                >
                  <CardContent className="p-5 pb-2 relative">
                    <button
                      className="absolute top-1 right-1 text-purple-500 hover:text-orange-500 p-1 rounded-full focus:outline-none z-10 opacity-80 group-hover:opacity-100"
                      title="Edit"
                      onClick={e => { e.stopPropagation(); onEditCourse(course); setViewAllCourses(false); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col">
                        <h3 className="font-bold text-lg text-gray-900 leading-tight line-clamp-2">{course.name}</h3>
                        {course.sessionDetails?.sessionDuration && (
                          <span className="text-sm text-orange-600 mt-1">Session Duration: {course.sessionDetails.sessionDuration} hrs</span>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm select-none ${
                        course.status === 'Active' ? 'bg-purple-100 text-purple-700' :
                        course.status === 'Completed' ? 'bg-orange-100 text-orange-700' :
                        course.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        course.status === 'Inactive' ? 'bg-gray-200 text-gray-700' :
                        course.status === 'Draft' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {course.status}
                      </span>
                    </div>
                    <div className="mb-2 flex flex-wrap gap-2 items-center">
                      <span className="inline-block bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-medium border border-purple-100">{course.type}</span>
                      <span className="inline-block bg-orange-50 text-orange-700 px-2 py-0.5 rounded text-xs font-medium border border-orange-100">{course.level}</span>
                      {course.tags && course.tags.length > 0 && course.tags.slice(0,2).map((tag, i) => (
                        <span key={i} className="inline-block bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium border border-gray-200">{tag}</span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-700 mb-1"> <span className="font-medium text-gray-900">{course.instructor}</span></p>
                    {course.location && <p className="text-xs text-gray-600 mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> {course.location}</p>}
                    {course.description && <p className="text-xs text-gray-500 line-clamp-2 mb-2">{course.description}</p>}
                    <div className="flex justify-between items-end mt-2">
                      <div>
                        <span className="text-xl font-bold text-purple-700">INR {course.priceINR?.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                  <button
                    className="absolute -bottom-0 right-0 text-purple-500 hover:text-red-500 focus:outline-none z-10 p-1 opacity-80 group-hover:opacity-100"
                    title="Delete"
                    onClick={e => { handleDelete(e, course); setViewAllCourses(false); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Card>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setViewAllCourses(false)}>Close</Button>
            {onAddCourse && (
              <Button onClick={() => { onAddCourse(); setViewAllCourses(false); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Course
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
