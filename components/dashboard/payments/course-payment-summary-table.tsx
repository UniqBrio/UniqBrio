"use client";

import React, { useState, useEffect } from "react";
import { useCurrency } from "@/contexts/currency-context";
import { Badge } from "@/components/dashboard/ui/badge";
import { Card, CardContent } from "@/components/dashboard/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/dashboard/ui/table";
import { ChevronDown, ChevronRight, BookOpen, Users } from "lucide-react";
import { type CoursePaymentSummary } from "@/types/dashboard/payment";
import { CohortDetailDialog } from "@/components/dashboard/payments/cohort-detail-dialog";
import { type Cohort } from "@/data/dashboard/cohorts";
import { fetchCohortsByIds, getCohortDisplayName, type CohortInfo } from "@/lib/dashboard/cohort-api";

interface CoursePaymentSummaryTableProps {
  courseSummaries: CoursePaymentSummary[];
  displayedColumns?: string[];
  viewMode?: 'list' | 'grid';
}

export function CoursePaymentSummaryTable({ courseSummaries, displayedColumns, viewMode = 'list' }: CoursePaymentSummaryTableProps) {
  const { currency } = useCurrency();
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Cohort data state for fetching names
  const [cohortMap, setCohortMap] = useState<Map<string, CohortInfo>>(new Map());
  const [cohortsLoading, setCohortsLoading] = useState(false);

  // Use default columns if not provided
  const defaultColumns = ['CourseID', 'Course Name', 'Students', `Course Reg Fee (${currency})`, `Student Reg Fee (${currency})`, `Total To Be Paid (${currency})`, `Total Amount (${currency})`, `Received (${currency})`, `Outstanding (${currency})`, 'Collection Rate', 'Status'];
  const columns = displayedColumns || defaultColumns;

  // Helper to check if column should be displayed
  const shouldShowColumn = (columnName: string) => columns.includes(columnName);
  
  // Fetch cohort data when course summaries change
  useEffect(() => {
    const fetchCohortData = async () => {
      // Extract unique cohort IDs from all course summaries
      const cohortIds = Array.from(new Set(
        courseSummaries.flatMap(course => 
          course.cohorts?.map(cohort => cohort.cohortId) || []
        ).filter(Boolean)
      ));

      if (cohortIds.length === 0) {
        setCohortMap(new Map());
        return;
      }

      setCohortsLoading(true);
      try {
        const cohortData = await fetchCohortsByIds(cohortIds);
        setCohortMap(cohortData);
      } catch (error) {
        console.error('Failed to fetch cohort data for course summary:', error);
        setCohortMap(new Map());
      } finally {
        setCohortsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchCohortData, 300);
    return () => clearTimeout(timeoutId);
  }, [courseSummaries]);

  const toggleCourse = (courseId: string) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId);
    } else {
      newExpanded.add(courseId);
    }
    setExpandedCourses(newExpanded);
  };

  const handleCohortClick = async (cohortId: string, cohortName: string, courseId: string) => {
    // Fetch full cohort details
    try {
      const response = await fetch(`/api/dashboard/cohorts?courseId=${courseId}`);
      if (response.ok) {
        const cohorts = await response.json();
        const cohort = cohorts.find((c: Cohort) => c.id === cohortId);
        if (cohort) {
          setSelectedCohort(cohort);
          setDialogOpen(true);
        }
      }
    } catch (error) {
      console.error("Failed to fetch cohort:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Pending: "bg-red-500 text-white hover:bg-red-500",
      Partial: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
      Paid: "bg-green-100 text-green-700 hover:bg-green-100",
    };

    return (
      <Badge className={`${colors[status] || ""} rounded-full px-3 py-1 flex items-center gap-1`}>
        {status === "Pending" }
        {status === "Partial" }
        {status}
      </Badge>
    );
  };

  if (courseSummaries.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
        <p>No payment data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {viewMode === 'grid' ? (
        // Grid View
        <div className="overflow-x-auto">
          <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
          {courseSummaries.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              No course data available
            </div>
          ) : (
            courseSummaries.map((course) => (
              <Card
                key={course.courseId}
                className="hover:shadow-lg transition-all duration-200 bg-white border-2 border-orange-400 hover:border-orange-500 relative rounded-xl overflow-hidden flex-shrink-0"
                style={{ width: '280px', minWidth: '280px' }}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-5 w-5 text-orange-600" />
                          <h3 className="font-bold text-lg text-gray-900">
                            {course.courseName}
                          </h3>
                        </div>
                        <p className="text-sm text-orange-600 font-medium">
                          {course.courseId}
                        </p>
                      </div>
                      {getStatusBadge(course.status)}
                    </div>

                    {/* Students */}
                    <div className="flex items-center gap-2 text-orange-600 border-t pt-3">
                      <Users className="h-5 w-5" />
                      <span className="font-semibold">{course.totalStudents}</span>
                      <span className="text-sm text-gray-600">students</span>
                    </div>

                    {/* Payment Info */}
                    <div className="space-y-2 border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Course Reg Fee:</span>
                        <span className="font-semibold text-blue-600">
                          {currency}{(course.totalCourseRegistrationFees || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Student Reg Fee:</span>
                        <span className="font-semibold text-purple-600">
                          {currency}{(course.totalStudentRegistrationFees || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total To Be Paid:</span>
                        <span className="font-bold text-indigo-600">
                          {currency} {(course.totalToBePaid || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Amount:</span>
                        <span className="font-semibold text-gray-900">
                          {currency} {(course.totalAmount || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Received:</span>
                        <span className="font-bold text-green-600">
                          {currency} {(course.receivedAmount || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Outstanding:</span>
                        <span className="font-bold text-red-600">
                          {currency} {(course.outstandingAmount || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Collection Rate / Payment Status */}
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        {/* Show Active only for truly ongoing monthly subscriptions */}
                        {(course.outstandingAmount === 0 && (course.receivedAmount || 0) > 0 && 
                          (course.totalCourseFees || 0) > 0) && (() => {
                            // Calculate course fees only (excluding registration fees)
                            const totalRegistrationFees = (course.totalCourseRegistrationFees || 0) + (course.totalStudentRegistrationFees || 0);
                            const totalAllFees = course.totalToBePaid || 0;
                            const registrationFeeRatio = totalAllFees > 0 ? totalRegistrationFees / totalAllFees : 0;
                            const estimatedRegistrationFeesReceived = (course.receivedAmount || 0) * registrationFeeRatio;
                            const estimatedCourseFeesOnlyReceived = (course.receivedAmount || 0) - estimatedRegistrationFeesReceived;
                            return estimatedCourseFeesOnlyReceived > (course.totalCourseFees || 0);
                          })() ? (
                          <>
                            <span className="text-sm text-gray-600">Payment Status:</span>
                            <span className="font-bold text-green-600 text-lg">
                              Active
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-sm text-gray-600">Collection Rate:</span>
                            <span className="font-bold text-purple-600 text-lg">
                              {(course.collectionRate || 0).toFixed(1)}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Cohorts indicator */}
                    {course.cohorts && course.cohorts.length > 0 && (
                      <div className="border-t pt-3 flex items-center justify-between text-sm text-purple-600">
                        <span>{course.cohorts.length} cohort{course.cohorts.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          </div>
        </div>
      ) : (
        // List View
        <div className="space-y-4">
          {/* Course Summary Section */}
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b bg-white">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="h-5 w-5 text-purple-700" />
                  <h3 className="font-bold text-lg text-purple-800">Course-wise Payment Summary</h3>
                </div>
                <p className="text-sm text-purple-600">
                  Payment collection status by course
                </p>
              </div>
              <div className="table-container-with-sticky-header overflow-x-auto max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader className="bg-white">
              <TableRow>
                {shouldShowColumn('CourseID') && <TableHead className="font-semibold text-gray-600 sticky-table-header">CourseID</TableHead>}
                {shouldShowColumn('Course Name') && <TableHead className="font-semibold text-gray-600 sticky-table-header">Course Name</TableHead>}
                {shouldShowColumn('Students') && <TableHead className="font-semibold text-gray-600 sticky-table-header">Students</TableHead>}
                {shouldShowColumn(`Course Reg Fee (${currency})`) && <TableHead className="font-semibold text-gray-600 sticky-table-header">Course Reg Fee ({currency})</TableHead>}
                {shouldShowColumn(`Student Reg Fee (${currency})`) && <TableHead className="font-semibold text-gray-600 sticky-table-header">Student Reg Fee ({currency})</TableHead>}
                {shouldShowColumn(`Total To Be Paid (${currency})`) && <TableHead className="font-semibold sticky-table-header bg-purple-50 text-purple-700">Total To Be Paid ({currency})</TableHead>}
                {shouldShowColumn(`Total Amount (${currency})`) && <TableHead className="font-semibold text-gray-600 sticky-table-header">Total Amount ({currency})</TableHead>}
                {shouldShowColumn(`Received (${currency})`) && <TableHead className="font-semibold text-gray-600 sticky-table-header">Received ({currency})</TableHead>}
                {shouldShowColumn(`Outstanding (${currency})`) && <TableHead className="font-semibold text-gray-600 sticky-table-header">Outstanding ({currency})</TableHead>}
                {shouldShowColumn('Collection Rate') && <TableHead className="font-semibold text-gray-600 sticky-table-header">Collection Rate / Status</TableHead>}
                {shouldShowColumn('Status') && <TableHead className="font-semibold text-gray-600 sticky-table-header">Status</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseSummaries.map((course) => (
                <React.Fragment key={course.courseId}>
                  <TableRow
                    className={`cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${
                      expandedCourses.has(course.courseId) ? "border-gray-500 bg-gray-50" : "border-transparent"
                    }`}
                    onClick={() => toggleCourse(course.courseId)}
                  >
                    {shouldShowColumn('CourseID') && (
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {course.cohorts && course.cohorts.length > 0 && (
                            expandedCourses.has(course.courseId) ? (
                              <ChevronDown className="h-4 w-4 text-gray-600" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-600" />
                            )
                          )}
                          <BookOpen className="h-4 w-4 text-gray-600" />
                          <span className="font-bold">{course.courseId}</span>
                        </div>
                      </TableCell>
                    )}
                    {shouldShowColumn('Course Name') && (
                      <TableCell className="font-semibold">{course.courseName}</TableCell>
                    )}
                    {shouldShowColumn('Students') && (
                      <TableCell>
                        <span className="flex items-center gap-1 text-gray-700">
                          <Users className="h-4 w-4" />
                          {course.totalStudents}
                        </span>
                      </TableCell>
                    )}
                    {shouldShowColumn(`Course Reg Fee (${currency})`) && (
                      <TableCell className="font-semibold text-blue-600">
                        {(course.totalCourseRegistrationFees || 0).toLocaleString()}
                      </TableCell>
                    )}
                    {shouldShowColumn(`Student Reg Fee (${currency})`) && (
                      <TableCell className="font-semibold text-purple-600">
                        {(course.totalStudentRegistrationFees || 0).toLocaleString()}
                      </TableCell>
                    )}
                    {shouldShowColumn(`Total To Be Paid (${currency})`) && (
                      <TableCell className="font-bold text-indigo-600">
                        {(course.totalToBePaid || 0).toLocaleString()}
                      </TableCell>
                    )}
                    {shouldShowColumn(`Total Amount (${currency})`) && (
                      <TableCell className="font-semibold">
                        {(course.totalAmount || 0).toLocaleString()}
                      </TableCell>
                    )}
                    {shouldShowColumn(`Received (${currency})`) && (
                      <TableCell className="text-green-600 font-bold">
                        {(course.receivedAmount || 0).toLocaleString()}
                      </TableCell>
                    )}
                    {shouldShowColumn(`Outstanding (${currency})`) && (
                      <TableCell className="text-red-600 font-bold">
                        {/* Show N/A only for truly ongoing monthly subscriptions */}
                        {(course.outstandingAmount === 0 && (course.receivedAmount || 0) > 0 && 
                          (course.totalCourseFees || 0) > 0) && (() => {
                            const totalRegistrationFees = (course.totalCourseRegistrationFees || 0) + (course.totalStudentRegistrationFees || 0);
                            const totalAllFees = course.totalToBePaid || 0;
                            const registrationFeeRatio = totalAllFees > 0 ? totalRegistrationFees / totalAllFees : 0;
                            const estimatedRegistrationFeesReceived = (course.receivedAmount || 0) * registrationFeeRatio;
                            const estimatedCourseFeesOnlyReceived = (course.receivedAmount || 0) - estimatedRegistrationFeesReceived;
                            return estimatedCourseFeesOnlyReceived > (course.totalCourseFees || 0);
                          })() ? (
                          <span className="text-gray-400 text-sm">N/A</span>
                        ) : (
                          (course.outstandingAmount || 0).toLocaleString()
                        )}
                      </TableCell>
                    )}
                    {shouldShowColumn('Collection Rate') && (
                      <TableCell className="font-semibold">
                        {/* Show Active only for truly ongoing monthly subscriptions */}
                        {(course.outstandingAmount === 0 && (course.receivedAmount || 0) > 0 && 
                          (course.totalCourseFees || 0) > 0) && (() => {
                            const totalRegistrationFees = (course.totalCourseRegistrationFees || 0) + (course.totalStudentRegistrationFees || 0);
                            const totalAllFees = course.totalToBePaid || 0;
                            const registrationFeeRatio = totalAllFees > 0 ? totalRegistrationFees / totalAllFees : 0;
                            const estimatedRegistrationFeesReceived = (course.receivedAmount || 0) * registrationFeeRatio;
                            const estimatedCourseFeesOnlyReceived = (course.receivedAmount || 0) - estimatedRegistrationFeesReceived;
                            return estimatedCourseFeesOnlyReceived > (course.totalCourseFees || 0);
                          })() ? (
                          <span className="text-green-600 font-bold">Active</span>
                        ) : (
                          <span>{(course.collectionRate || 0).toFixed(1)}%</span>
                        )}
                      </TableCell>
                    )}
                    {shouldShowColumn('Status') && (
                      <TableCell>{getStatusBadge(course.status)}</TableCell>
                    )}
                  </TableRow>

                  {/* Cohort Breakdown */}
                  {expandedCourses.has(course.courseId) && course.cohorts && course.cohorts.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="bg-purple-50 p-0 border-0">
                        <div className="p-6 m-4 bg-white rounded-lg border-2 border-purple-200">
                          <div className="flex items-center gap-2 mb-4">
                            <Users className="h-5 w-5 text-purple-600" />
                            <h4 className="font-bold text-purple-700 text-base">
                              Cohort-wise Breakdown for {course.courseName}
                            </h4>
                          </div>
                          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                            <Table>
                              <TableHeader className="bg-purple-100 sticky top-0 z-10">
                                <TableRow>
                                  <TableHead className="font-semibold text-purple-700 bg-purple-100">Cohort ID</TableHead>
                                  <TableHead className="font-semibold text-purple-700 bg-purple-100">Cohort</TableHead>
                                  <TableHead className="font-semibold text-purple-700 bg-purple-100">Students</TableHead>
                                  <TableHead className="font-semibold text-purple-700 bg-purple-100">Course Reg Fee (${currency})</TableHead>
                                  <TableHead className="font-semibold text-purple-700 bg-purple-100">Student Reg Fee (${currency})</TableHead>
                                  <TableHead className="font-semibold text-purple-700 bg-purple-100">Total To Be Paid (${currency})</TableHead>
                                  <TableHead className="font-semibold text-purple-700 bg-purple-100">Total Amount (${currency})</TableHead>
                                  <TableHead className="font-semibold text-purple-700 bg-purple-100">Received (${currency})</TableHead>
                                  <TableHead className="font-semibold text-purple-700 bg-purple-100">Outstanding (${currency})</TableHead>
                                  <TableHead className="font-semibold text-purple-700 bg-purple-100">Collection Rate</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {course.cohorts.map((cohort) => (
                                  <TableRow 
                                    key={cohort.cohortId} 
                                    className="border-l-4 border-purple-400 cursor-pointer hover:bg-purple-50 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const cohortName = getCohortDisplayName(cohort.cohortId, cohortMap);
                                      handleCohortClick(cohort.cohortId, cohortName, course.courseId);
                                    }}
                                  >
                                    <TableCell className="text-purple-600 font-semibold">
                                      {cohort.cohortId}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {cohortsLoading ? 'Loading...' : getCohortDisplayName(cohort.cohortId, cohortMap)}
                                    </TableCell>
                                    <TableCell>
                                      <span className="flex items-center gap-1 text-purple-600">
                                        <Users className="h-4 w-4" />
                                        {cohort.totalStudents || 0}
                                      </span>
                                    </TableCell>
                                    <TableCell className="font-semibold text-blue-600">
                                      {(cohort.totalCourseRegistrationFees || 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="font-semibold text-purple-600">
                                      {(cohort.totalStudentRegistrationFees || 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="font-bold text-indigo-600">
                                      {(cohort.totalToBePaid || 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                      {(cohort.totalAmount || 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-green-600 font-bold">
                                      {(cohort.receivedAmount || 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-red-600 font-bold">
                                      {(cohort.outstandingAmount || 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                      {(cohort.collectionRate || 0).toFixed(1)}%
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <CohortDetailDialog
        cohort={selectedCohort}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
