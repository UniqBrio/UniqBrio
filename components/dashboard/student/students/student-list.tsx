"use client"

import { type Student } from "@/types/dashboard/student";
import { type Course } from "@/data/dashboard/courses";
import { Card, CardContent } from "@/components/dashboard/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/dashboard/ui/table";
import { Users, Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/dashboard/ui/checkbox";
import { useState, useEffect } from "react";
import { fetchCohorts, type Cohort } from "@/data/dashboard/cohorts";
import { cn, formatDateForDisplay } from "@/lib/dashboard/student/utils";

interface StudentListProps {
  students: Student[];
  viewMode: 'list' | 'grid';
  onSelectStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
  selectedIds?: string[];
  onToggleSelect?: (id: string, checked: boolean) => void;
  onToggleSelectAll?: (checked: boolean) => void;
  courses?: Course[]; // All available courses to resolve course id + name
  displayedColumns?: string[]; // Columns to display in table view
  loading?: boolean; // Loading state for students
}

export function StudentList({ students, viewMode, onSelectStudent, onEditStudent, onDeleteStudent, selectedIds = [], onToggleSelect, onToggleSelectAll, courses = [], displayedColumns = ['Student ID', 'Name', 'Course', 'Actions'], loading = false }: StudentListProps) {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [cohortsLoading, setCohortsLoading] = useState(false);

  // Fetch all cohorts - extracted as a reusable function
  const loadCohorts = async () => {
    setCohortsLoading(true);
    try {
      console.log('?? Fetching cohorts from database...');
      const data = await fetchCohorts(); // Fetch all cohorts
      setCohorts(Array.isArray(data) ? data : []);
      console.log('? Cohorts loaded:', data.length);
    } catch (error) {
      console.error('? Failed to fetch cohorts:', error);
      setCohorts([]);
    } finally {
      setCohortsLoading(false);
    }
  };

  // Fetch cohorts when component mounts
  useEffect(() => {
    loadCohorts();
  }, []);

  // Refresh cohorts whenever the students list changes (students added/updated)
  useEffect(() => {
    if (students.length > 0) {
      console.log('?? Students list changed, refreshing cohorts...');
      console.log('?? Students with cohort assignments:', 
        students
          .filter(s => s.cohortId)
          .map(s => ({ name: s.name, cohortId: s.cohortId }))
      );
      loadCohorts();
    }
  }, [students.length]);

  // Helper function to get cohort details for a student
  const getCohortDetails = (student: Student): { id: string; name: string; timing: string; instructor: string; capacity: string } | null => {
    // If cohortId missing, attempt to infer by membership lookup (fallback)
    let cohortId = student.cohortId;
    if ((!cohortId || cohortId.trim() === '') && cohorts.length > 0) {
      const inferred = cohorts.find(c => Array.isArray(c.enrolledStudents) && c.enrolledStudents.includes(student.studentId));
      if (inferred) {
        cohortId = inferred.id;
        // Mutate in-place so subsequent renders use it (safe client-side)
        (student as any).cohortId = cohortId;
        console.log('?? Inferred missing cohortId for student from cohorts', { student: student.studentId, cohortId });
      }
    }
    if (!cohortId || cohorts.length === 0) {
      console.log('?? getCohortDetails - No cohortId or cohorts:', { studentName: student.name, cohortId, cohortsCount: cohorts.length });
      return null;
    }
    
    // Try multiple matching strategies to find the cohort
    // 1. Match by cohort.id === student.cohortId
    // 2. Match by cohort.name === student.cohortId
    // 3. Case-insensitive match
    const cohort = cohorts.find(c => {
      const cohortIdLower = student.cohortId?.toLowerCase() || '';
      const idLower = c.id?.toLowerCase() || '';
      const nameLower = c.name?.toLowerCase() || '';
      
      return c.id === student.cohortId || 
             c.name === student.cohortId ||
             idLower === cohortIdLower ||
             nameLower === cohortIdLower;
    });
    
    console.log('?? getCohortDetails - Looking for cohort:', { 
      studentName: student.name, 
  studentCohortId: cohortId, 
      foundCohort: cohort ? `${cohort.id} (${cohort.name})` : 'NOT FOUND',
      availableCohorts: cohorts.map(c => ({ id: c.id, name: c.name }))
    });
    
  if (!cohort) return null;
    
    return {
      id: cohort.id || cohortId,
      name: cohort.name || cohortId,
      timing: cohort.timing || '',
      instructor: cohort.instructor || '',
      capacity: cohort.capacity ? `${cohort.enrolledStudents?.length || 0}/${cohort.capacity}` : ''
    };
  };

  // Helper function to resolve the course for a student.
  // Assumption: student.courseOfInterestId stores the course ID
  const resolveCourse = (student: Student): Course | undefined => {
    if (!courses || courses.length === 0) return undefined;
    const courseId: string | undefined = student.courseOfInterestId;
    return courses.find(c => c.id === courseId || c.courseId === courseId);
  };

  // Helper function to resolve enrolled course information
  const resolveEnrolledCourse = (student: Student): { id: string; name: string } | null => {
    if (!student.enrolledCourseName) return null;
    
    // If enrolledCourseName already contains full info (e.g., "COURSE0007 - Badminton - Beginner")
    if (student.enrolledCourseName.includes(' - ')) {
      return { id: student.enrolledCourseName.split(' - ')[0], name: student.enrolledCourseName };
    }
    
    // If it's just a course ID, try to resolve it from the courses list
    if (courses && courses.length > 0) {
      const course = courses.find(c => 
        c.id === student.enrolledCourseName || 
        c.courseId === student.enrolledCourseName ||
        c.name === student.enrolledCourseName
      );
      if (course) {
        return { 
          id: course.courseId || course.id, 
          name: `${course.courseId || course.id} - ${course.name}`
        };
      }
    }
    
    // Fallback: return as-is
    return { id: student.enrolledCourseName, name: student.enrolledCourseName };
  };

  // Helper function to format dates
  const formatDate = (dateValue?: string | Date) => {
    if (!dateValue) return '-';
    try {
      if (dateValue instanceof Date) return formatDateForDisplay(dateValue.toISOString().slice(0,10));
      return formatDateForDisplay(String(dateValue));
    } catch {
      return String(dateValue);
    }
  };

  // Helper function to render cell content based on column name
  const renderCellContent = (student: Student, column: string) => {
    switch (column) {
      case 'Student ID':
        return <span className="font-medium">{student.studentId}</span>;
      case 'Name':
        return student.name;
      case 'Email':
        return student.email || '-';
      case 'Mobile':
        return student.mobile || '-';
      case 'Gender':
        return student.gender || '-';
      case 'Date of Birth':
        return formatDate(student.dob);
      case 'Course of Interest': {
        // Show the course of interest
        const course = resolveCourse(student);
        return course
          ? `${course.courseId || course.id} - ${course.name}`
          : (student.courseOfInterestId || (courses.length === 0 ? '�' : '-'));
      }
      case 'Course (Enrolled)': {
        // Show enrolled course if available, otherwise fall back to course of interest
        const enrolledCourse = resolveEnrolledCourse(student);
        if (enrolledCourse) {
          return enrolledCourse.name;
        }
        const course = resolveCourse(student);
        return course
          ? `${course.courseId || course.id} - ${course.name}`
          : (student.enrolledCourseName && student.courseOfInterestId
              ? `${student.courseOfInterestId} - ${student.enrolledCourseName}`
              : (student.enrolledCourseName || student.courseOfInterestId || (courses.length === 0 ? '�' : '-')));
      }
      case 'Registration Date':
        return formatDate(student.registrationDate);
      case 'Course Start Date':
        return formatDate(student.courseStartDate);
      case 'Address':
        return student.address ? (
          <span className="max-w-xs truncate" title={student.address}>
            {student.address}
          </span>
        ) : '-';
      case 'Referred By':
        return student.referredBy || '-';
      case 'Cohort': {
        const cohortDetails = getCohortDetails(student);
        if (student.cohortId) {
          console.log(`?? Rendering Cohort for ${student.name}:`, {
            cohortId: student.cohortId,
            hasCohortDetails: !!cohortDetails,
            cohortDetails: cohortDetails
          });
        }
        const renderHeader = (cd: any) => {
          if (!cd) return null;
          const same = cd.id === cd.name;
          return (
            <div className="font-medium">
              {same ? cd.id : (
                <>
                  <span className="text-purple-700">{cd.id}</span>
                  <span className="mx-1 text-gray-400">�</span>
                  <span>{cd.name}</span>
                </>
              )}
            </div>
          );
        };
        return cohortDetails ? (
          <div>
            {renderHeader(cohortDetails)}
            {cohortDetails.timing && (
              <div className="text-xs text-gray-500 mt-1">
                <span className="font-semibold">Time:</span> {cohortDetails.timing}
              </div>
            )}
            {cohortDetails.instructor && (
              <div className="text-xs text-gray-500">
                <span className="font-semibold">Instructor:</span> {cohortDetails.instructor}
              </div>
            )}
          </div>
        ) : student.cohortId ? (
          <div>
            <div className="font-medium text-gray-700">{student.cohortId}</div>
            <div className="text-xs text-amber-600 mt-1">?? Cohort details not found</div>
          </div>
        ) : '-';
      }
      case 'Batch': { // Legacy support - redirect to Cohort display
        const cohortDetails = getCohortDetails(student);
        if (cohortDetails) {
          const same = cohortDetails.id === cohortDetails.name;
          return (
            <div>
              <div className="font-medium">
                {same ? cohortDetails.id : (
                  <>
                    <span className="text-purple-700">{cohortDetails.id}</span>
                    <span className="mx-1 text-gray-400">�</span>
                    <span>{cohortDetails.name}</span>
                  </>
                )}
              </div>
              {cohortDetails.timing && (
                <div className="text-xs text-gray-500 mt-1">
                  <span className="font-semibold">Time:</span> {cohortDetails.timing}
                </div>
              )}
              {cohortDetails.instructor && (
                <div className="text-xs text-gray-500">
                  <span className="font-semibold">Instructor:</span> {cohortDetails.instructor}
                </div>
              )}
            </div>
          );
        }
        return (student.cohortId || '-');
      }
      case 'Actions':
        return (
          <div className="flex gap-2 justify-center items-center">
            <span 
              role="button" 
              aria-label="Edit"
              className="cursor-pointer text-sm hover:bg-gray-100 p-2 rounded transition-colors inline-block"
              onClick={(e) => { 
                e.stopPropagation(); 
                onEditStudent(student);
              }}
            >
              <Pencil className="text-purple-600 h-4 w-4" />
            </span>
            <span
              role="button"
              aria-label="Delete"
              className="cursor-pointer text-sm hover:bg-red-100 p-2 rounded transition-colors inline-block"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteStudent(student);
              }}
            >
              <Trash2 className="text-red-600 h-4 w-4" />
            </span>
          </div>
        );
      default:
        return '-';
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
        <Users className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium mb-2">No students found</h3>
        <p className="text-sm">Try adjusting your filters or search criteria</p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="overflow-x-auto">
        <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
        {students.map(student => (
          <Card 
            key={student.id} 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-white border-2 border-orange-400 hover:border-orange-500 relative rounded-xl overflow-hidden flex-shrink-0"
            style={{ width: '280px', minWidth: '280px' }}
            onClick={() => onSelectStudent(student)}
          >
            {/* Edit Button */}
            <button 
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/90 hover:bg-gray-100 transition-colors shadow-sm"
              onClick={(e) => { 
                e.stopPropagation(); 
                onEditStudent(student);
              }}
              aria-label="Edit student"
            >
              <Pencil className="h-4 w-4 text-purple-600" />
            </button>

            <CardContent className="p-6">
              <div className="flex flex-col space-y-4">
                {/* Student Name */}
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg truncate" title={student.name}>
                    {student.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{student.studentId}</p>
                </div>

                {/* Student Details */}
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 justify-start">
                    {student.gender && (
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                        {student.gender}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-left space-y-2">
                    {/* Course Information */}
                    <div className="text-sm font-medium text-gray-900">
                      {(() => {
                        // Show enrolled course if available, otherwise fall back to course of interest
                        const enrolledCourse = resolveEnrolledCourse(student);
                        if (enrolledCourse) {
                          return enrolledCourse.name;
                        }
                        const course = resolveCourse(student);
                        return course
                          ? `${course.courseId || course.id} - ${course.name}`
                          : (student.enrolledCourseName && student.courseOfInterestId
                              ? `${student.courseOfInterestId} - ${student.enrolledCourseName}`
                              : (student.enrolledCourseName || student.courseOfInterestId || (courses.length === 0 ? '�' : '-')));
                      })()}
                    </div>
                    
                    {/* Cohort Section with ID + Name */}
                    {(() => {
                      const cohortDetails = getCohortDetails(student);
                      if (!cohortDetails && !student.cohortId) return null;
                      const header = cohortDetails ? (() => {
                        const same = cohortDetails.id === cohortDetails.name;
                        return same ? cohortDetails.id : (
                          <>
                            <span className="text-purple-700">{cohortDetails.id}</span>
                            <span className="mx-1 text-gray-400">�</span>
                            <span>{cohortDetails.name}</span>
                          </>
                        );
                      })() : student.cohortId;
                      return (
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500 font-medium">Cohort</div>
                          <div className="text-sm text-gray-700 space-y-1">
                            <div className="font-medium">{header}</div>
                            {cohortDetails?.timing && (
                              <div className="text-xs text-gray-600">
                                <span className="font-semibold">?? Time:</span> {cohortDetails.timing}
                              </div>
                            )}
                            {cohortDetails?.instructor && (
                              <div className="text-xs text-gray-600">
                                <span className="font-semibold">????? Instructor:</span> {cohortDetails.instructor}
                              </div>
                            )}
                            {cohortDetails?.capacity && (
                              <div className="text-xs text-gray-600">
                                <span className="font-semibold">?? Enrolled:</span> {cohortDetails.capacity}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </CardContent>

            {/* Delete Button */}
            <div className="absolute bottom-3 right-3">
                <button
                  className="p-1.5 rounded-full bg-white/90 hover:bg-red-50 transition-colors shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Use the centralized confirmation dialog provided by the parent
                    // component (e.g. StudentsPage). This ensures a consistent modal
                    // experience across list and grid views instead of the native
                    // browser confirm dialog.
                    onDeleteStudent(student);
                  }}
                  aria-label="Delete student"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
            </div>
          </Card>
        ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl shadow border overflow-hidden">
      {/* Use Table's wrapper for scroll; ensures sticky header works */}
  {/* Limit visible rows to roughly 5 before scroll */}
  <Table containerClassName="relative h-[360px] overflow-y-auto">
          <TableHeader className="sticky top-0 bg-white z-20 shadow-sm">
            <TableRow className="border-b">
              <TableHead className="sticky top-0 bg-white z-20 border-b w-10 px-4 py-3">
                {onToggleSelectAll && (
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={students.length > 0 && students.every(s => selectedIds.includes(s.id || s.studentId))}
                      onCheckedChange={checked => onToggleSelectAll(!!checked)}
                      aria-label="Select all"
                    />
                  </div>
                )}
              </TableHead>
              {displayedColumns.map(column => (
                <TableHead 
                  key={column} 
                  className={cn("sticky top-0 bg-white z-20 border-b px-6 py-3 text-sm font-semibold text-gray-600 text-left", column === 'Actions' && 'text-center')}
                >
                  {column === 'Actions' ? '' : column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map(student => (
              <TableRow 
                key={student.id} 
                className="cursor-pointer hover:bg-gray-50 border-b"
                onClick={() => onSelectStudent(student)}
              >
                <TableCell onClick={(e) => e.stopPropagation()} className="w-10">
                  {onToggleSelect && (
                    <Checkbox
                      checked={selectedIds.includes(student.id || student.studentId)}
                      onCheckedChange={checked => onToggleSelect(student.id || student.studentId, !!checked)}
                      aria-label={`Select ${student.name}`}
                    />
                  )}
                </TableCell>
                {displayedColumns.map(column => (
                  <TableCell 
                    key={column} 
                    className={`px-6 py-4 ${column === 'Actions' ? 'text-center' : ''}`}
                    onClick={column === 'Actions' ? (e) => e.stopPropagation() : undefined}
                  >
                    {renderCellContent(student, column)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
      </Table>
    </div>
  );
}
