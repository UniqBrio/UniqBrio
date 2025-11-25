"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs";
import { Card, CardContent } from "@/components/dashboard/ui/card";
import { useCurrency } from "@/contexts/currency-context";
import { RevenueBySourceChart } from "@/components/dashboard/payments/revenue-by-source-chart";
import { PaymentCompletionChart } from "@/components/dashboard/payments/payment-completion-chart";
import { PaymentMethodChart } from "@/components/dashboard/payments/payment-method-chart";
import { MonthlyTrendChart } from "@/components/dashboard/payments/monthly-trend-chart";
import { CoursePaymentSummaryTable } from "@/components/dashboard/payments/course-payment-summary-table";
import { StudentPaymentTable } from "@/components/dashboard/payments/student-payment-table";
import { PaymentSettings } from "@/components/dashboard/payments";
import PaymentSearchFilters from "@/components/dashboard/payments/payment-search-filters";
import CourseCohortFilters from "@/components/dashboard/payments/course-cohort-filters";
import { Loader2, LayoutDashboard, CreditCard, BookOpen, Settings, RefreshCw } from "lucide-react";
import { type Payment, type PaymentAnalytics, type CoursePaymentSummary } from "@/types/dashboard/payment";
import { format as formatDateFns } from 'date-fns';
import { useToast } from "@/hooks/dashboard/use-toast";
import { Button } from "@/components/dashboard/ui/button";

export default function PaymentsPage() {
  const { currency } = useCurrency();
  const { toast } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("analytics");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountTimeRef = useRef(Date.now());
  const hasInitializedRef = useRef(false);
  
  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  // State for different data
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [courseSummaries, setCourseSummaries] = useState<CoursePaymentSummary[]>([]);
  const [filteredCourseSummaries, setFilteredCourseSummaries] = useState<CoursePaymentSummary[]>([]);

  // Filter and sort state for Student-wise tab
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("studentId");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [displayedColumns, setDisplayedColumns] = useState<string[]>(['Student ID', 'Student Name', 'Enrolled Course', 'Payment Category', `Course Fee (${currency})`, `Course Reg Fee (${currency})`, `Student Reg Fee (${currency})`, `Total To Be Paid (${currency})`, `Total Paid (${currency})`, `Balance (${currency})`, 'Status', 'Start Date', 'End Date', 'Next Due Date', 'Invoice', 'Send Reminder', 'Actions']);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Filter and sort state for Course & Cohort tab
  const [courseSearchTerm, setCourseSearchTerm] = useState("");
  const [courseSortBy, setCourseSortBy] = useState("courseName");
  const [courseSortOrder, setCourseSortOrder] = useState<"asc" | "desc">("asc");
  const [courseDisplayedColumns, setCourseDisplayedColumns] = useState<string[]>(['CourseID', 'Course Name', 'Students', `Total Amount (${currency})`, `Received (${currency})`, `Outstanding (${currency})`, 'Collection Rate', 'Status']);
  const [courseViewMode, setCourseViewMode] = useState<'list' | 'grid'>('list');

  // Selection state for export
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);
  const allVisiblePaymentIds = useMemo(() => filteredPayments.map(p => p.id), [filteredPayments]);
  
  const toggleSelectPayment = (id: string, checked: boolean) => {
    setSelectedPaymentIds(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id));
  };
  
  const toggleSelectAllPayments = (checked: boolean) => {
    setSelectedPaymentIds(checked ? allVisiblePaymentIds : []);
  };



  const fetchData = useCallback(async () => {
    // Abort previous request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setLoading(true);
    setError(null);
    
    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Fetch analytics, all students with payments, course summaries, and cohort dates in parallel
      const [analyticsRes, paymentsRes, courseSummariesRes, cohortDatesRes] = await Promise.all([
        fetch("/api/dashboard/payments/analytics", { signal: controller.signal }),
        fetch("/api/dashboard/payments/all-students", { signal: controller.signal }),
        fetch("/api/dashboard/payments/course-summary", { signal: controller.signal }),
        fetch("/api/dashboard/payments/cohort-dates-all", { signal: controller.signal }),
      ]);

      // Check each response and provide specific error messages
      const errors: string[] = [];
      if (!analyticsRes.ok) {
        const errorText = await analyticsRes.text();
        errors.push(`Analytics API failed: ${errorText || analyticsRes.statusText}`);
      }
      if (!paymentsRes.ok) {
        const errorText = await paymentsRes.text();
        errors.push(`Payments API failed: ${errorText || paymentsRes.statusText}`);
      }
      if (!courseSummariesRes.ok) {
        const errorText = await courseSummariesRes.text();
        errors.push(`Course Summary API failed: ${errorText || courseSummariesRes.statusText}`);
      }
      
      if (errors.length > 0) {
        throw new Error(errors.join("; "));
      }

      const [analyticsData, paymentsData, courseSummariesData, cohortDatesMap] = await Promise.all([
        analyticsRes.json(),
        paymentsRes.json(),
        courseSummariesRes.json(),
        cohortDatesRes.ok ? cohortDatesRes.json() : {},
      ]);

      // Enrich payment data with cohort dates using the map
      const enrichedPayments = paymentsData.map((payment: Payment) => {
        if (payment.cohortId && (cohortDatesMap as any)[payment.cohortId]) {
          return {
            ...payment,
            startDate: (cohortDatesMap as any)[payment.cohortId].startDate,
            endDate: (cohortDatesMap as any)[payment.cohortId].endDate
          };
        }
        return payment;
      });

      setAnalytics(analyticsData);
      setPayments(enrichedPayments);
      setFilteredPayments(enrichedPayments);
      setCourseSummaries(courseSummariesData);
      setFilteredCourseSummaries(courseSummariesData);
    } catch (err: any) {
      // Ignore abort errors
      if (err.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }
      
      console.error("Error fetching payment data:", err);
      setError(err.message || "Failed to load payment data");
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, []); // Empty deps, fetchData is stable
  
  // Effect to fetch data on mount - ensures data loads on initial navigation
  useEffect(() => {
    console.log('PaymentsPage mounted, pathname:', pathname);
    mountTimeRef.current = Date.now();
    hasInitializedRef.current = true;
    fetchData();
    
    // Cleanup on unmount
    return () => {
      console.log('PaymentsPage unmounting');
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // Run only on mount

  // Helper function to format dates consistently as dd-MMM-yyyy
  const formatExportDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      return formatDateFns(new Date(dateString), 'dd-MMM-yyyy');
    } catch (e) {
      return '';
    }
  };

  const handleExport = () => {
    // Determine which payments to export
    const paymentsToExport = selectedPaymentIds.length > 0
      ? filteredPayments.filter(p => selectedPaymentIds.includes(p.id))
      : filteredPayments;

    const toCSV = (rows: Payment[]) => {
      const columns: { header: string; getter: (p: Payment) => any }[] = [
        { header: 'Student ID', getter: p => p.studentId || '' },
        { header: 'Student Name', getter: p => p.studentName || '' },
        { header: 'Enrolled Course ID', getter: p => p.enrolledCourse || '' },
        { header: 'Enrolled Course', getter: p => p.enrolledCourseName || '' },
        { header: 'Cohort ID', getter: p => p.cohortId || '' },
        { header: 'Cohort', getter: p => p.cohortName || '' },
        { header: 'Course Type', getter: p => p.courseType || '' },
        { header: 'Course Fee', getter: p => p.courseFee || 0 },
        { header: 'Course Registration Fee', getter: p => p.courseRegistrationFee || 0 },
        { header: 'Student Registration Fee', getter: p => p.studentRegistrationFee || 0 },
        { header: 'Total Paid', getter: p => p.receivedAmount || 0 },
        { header: 'Balance', getter: p => p.outstandingAmount || 0 },
        { header: 'Status', getter: p => p.status || '' },
        { header: 'Paid Date', getter: p => formatExportDate(p.lastPaymentDate) },
        { header: 'Start Date', getter: p => formatExportDate(p.startDate) },
        { header: 'End Date', getter: p => formatExportDate(p.endDate) },
        { header: 'Next Reminder', getter: p => formatExportDate(p.nextReminderDate) },
        { header: 'Next Due Date', getter: p => formatExportDate(p.nextDueDate) },
      ];

      const esc = (v: any) => {
        const s = v == null ? '' : String(v);
        if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
      };
      const headerLine = columns.map(c => esc(c.header)).join(',');
      const lines = [headerLine];
      rows.forEach(p => {
        lines.push(columns.map(c => esc(c.getter(p))).join(','));
      });
      return lines.join('\n');
    };

    const csv = toCSV(paymentsToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = selectedPaymentIds.length > 0
      ? `payments-selected-${formatDateFns(new Date(), 'dd-MMM-yyyy')}.csv`
      : `payments-all-${formatDateFns(new Date(), 'dd-MMM-yyyy')}.csv`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleCourseExport = () => {
    const toCSV = () => {
      const esc = (v: any) => {
        const s = v == null ? '' : String(v);
        if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
      };

      const lines: string[] = [];
      
      // Header for course summary
      lines.push(`Type,Course ID,Course Name,Cohort ID,Cohort Name,Students,Total Amount (${currency}),Received (${currency}),Outstanding (${currency}),Collection Rate (%),Status`);
      
      // Add course and cohort data
      filteredCourseSummaries.forEach(course => {
        // Add course row
        lines.push([
          esc('Course'),
          esc(course.courseId),
          esc(course.courseName),
          esc(''),
          esc(''),
          esc(course.totalStudents),
          esc(course.totalAmount),
          esc(course.receivedAmount),
          esc(course.outstandingAmount),
          esc(course.collectionRate?.toFixed(1)),
          esc(course.status),
        ].join(','));
        
        // Add cohort rows if available
        if (course.cohorts && course.cohorts.length > 0) {
          course.cohorts.forEach(cohort => {
            lines.push([
              esc('Cohort'),
              esc(course.courseId),
              esc(course.courseName),
              esc(cohort.cohortId),
              esc(cohort.cohortName),
              esc(cohort.totalStudents || 0),
              esc(cohort.totalAmount || 0),
              esc(cohort.receivedAmount || 0),
              esc(cohort.outstandingAmount || 0),
              esc(cohort.collectionRate?.toFixed(1) || '0.0'),
              esc(''),
            ].join(','));
          });
        }
      });
      
      return lines.join('\n');
    };

    const csv = toCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `course-cohort-summary-${formatDateFns(new Date(), 'dd-MMM-yyyy')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 font-semibold mb-2">Error Loading Payment Data</p>
              <div className="text-gray-600 dark:text-white text-sm mb-4 max-h-40 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-left bg-white dark:bg-gray-800 p-3 rounded">{error}</pre>
              </div>
              <Button
                onClick={fetchData}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="responsive-dashboard-container mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-3xl font-bold text-purple-700 flex items-center gap-2">Payment Management</h1>
          <p className="text-gray-600 dark:text-white text-sm">
            Track student payments, send reminders, and manage financial records
          </p>
        </div>
        <Button
          onClick={fetchData}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
        </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-transparent p-0 h-auto gap-1 sm:gap-2 lg:gap-3">
          <TabsTrigger
            value="analytics"
            className="bg-white dark:bg-gray-900 border-2 border-orange-400 dark:border-orange-600 text-orange-600 dark:text-orange-400 rounded-lg px-6 py-3 font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:border-purple-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all"
          >
            <LayoutDashboard className="h-5 w-5 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger
            value="student-wise"
            className="bg-white dark:bg-gray-900 border-2 border-orange-400 dark:border-orange-600 text-orange-600 dark:text-orange-400 rounded-lg px-6 py-3 font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:border-purple-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Student-wise
          </TabsTrigger>
          <TabsTrigger
            value="course-cohort"
            className="bg-white dark:bg-gray-900 border-2 border-orange-400 dark:border-orange-600 text-orange-600 dark:text-orange-400 rounded-lg px-6 py-3 font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:border-purple-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all"
          >
            <BookOpen className="h-5 w-5 mr-2" />
            Course & Cohort
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="bg-white dark:bg-gray-900 border-2 border-orange-400 dark:border-orange-600 text-orange-600 dark:text-orange-400 rounded-lg px-6 py-3 font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:border-purple-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all"
          >
            <Settings className="h-5 w-5 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <>
              {/* First Row - Revenue Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-purple-600 mb-1">
                          Total Received
                        </p>
                        <p className="text-3xl font-bold text-purple-900">
                          {currency} {(analytics.totalReceived || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-purple-600 mt-1">All time</p>
                      </div>
                      <div className="text-purple-600 dark:text-purple-400 bg-purple-200 dark:bg-purple-800/50 p-3 rounded-lg">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-600 mb-1">
                          Monthly Revenue
                        </p>
                        <p className="text-3xl font-bold text-green-900">
                          {currency} {(analytics.monthlyRevenue || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-green-600 mt-1">This month</p>
                      </div>
                      <div className="text-green-600 dark:text-green-400 bg-green-200 dark:bg-green-800/50 p-3 rounded-lg">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-600 mb-1">
                          Weekly Revenue
                        </p>
                        <p className="text-3xl font-bold text-blue-900">
                          {currency} {(analytics.weeklyRevenue || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">This week</p>
                      </div>
                      <div className="text-blue-600 dark:text-blue-400 bg-blue-200 dark:bg-blue-800/50 p-3 rounded-lg">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-600 mb-1">
                          Outstanding
                        </p>
                        <p className="text-3xl font-bold text-red-900">
                          {currency} {(analytics.totalOutstanding || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-red-600 mt-1">Pending</p>
                      </div>
                      <div className="text-red-600 dark:text-red-400 bg-red-200 dark:bg-red-800/50 p-3 rounded-lg">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Second Row - Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <RevenueBySourceChart data={analytics.revenueBySource} />
                 <MonthlyTrendChart data={analytics.monthlyTrend} />
              </div>

              {/* Third Row - Additional Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PaymentMethodChart distribution={analytics.paymentMethodDistribution} />
              
                <PaymentCompletionChart distribution={analytics.paymentCompletionDistribution} />
              </div>
            </>
          )}
        </TabsContent>

        {/* Student-wise Tab */}
        <TabsContent value="student-wise" className="space-y-4">
          <PaymentSearchFilters
            payments={payments}
            setFilteredPayments={setFilteredPayments}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            onExport={handleExport}
            displayedColumns={displayedColumns}
            setDisplayedColumns={setDisplayedColumns}
            viewMode={viewMode}
            setViewMode={setViewMode}
            selectedIds={selectedPaymentIds}
            toggleSelect={toggleSelectPayment}
            toggleSelectAll={toggleSelectAllPayments}
          />

          <StudentPaymentTable 
            payments={filteredPayments} 
            displayedColumns={displayedColumns}
            viewMode={viewMode}
            selectedIds={selectedPaymentIds}
            toggleSelect={toggleSelectPayment}
            toggleSelectAll={toggleSelectAllPayments}
            onRefresh={() => {
              setActiveTab("student-wise");
              fetchData();
            }}
          />
        </TabsContent>

        {/* Course & Cohort Tab */}
        <TabsContent value="course-cohort" className="space-y-6">
          <CourseCohortFilters
            courseSummaries={courseSummaries}
            setFilteredCourseSummaries={setFilteredCourseSummaries}
            searchTerm={courseSearchTerm}
            setSearchTerm={setCourseSearchTerm}
            sortBy={courseSortBy}
            setSortBy={setCourseSortBy}
            sortOrder={courseSortOrder}
            setSortOrder={setCourseSortOrder}
            onExport={handleCourseExport}
            displayedColumns={courseDisplayedColumns}
            setDisplayedColumns={setCourseDisplayedColumns}
            viewMode={courseViewMode}
            setViewMode={setCourseViewMode}
          />

          <CoursePaymentSummaryTable 
            courseSummaries={filteredCourseSummaries}
            displayedColumns={courseDisplayedColumns}
            viewMode={courseViewMode}
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <PaymentSettings />
        </TabsContent>
      </Tabs>
      </div>
  );
}
