"use client";

import { useState, useMemo, useEffect } from "react";
import { useCurrency } from "@/contexts/currency-context";
import { Card, CardContent } from "@/components/dashboard/ui/card";
import { Badge } from "@/components/dashboard/ui/badge";
import { Button } from "@/components/dashboard/ui/button";
import { Checkbox } from "@/components/dashboard/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/dashboard/ui/table";
import { CreditCard, FileText, Send } from "lucide-react";
import { type Payment } from "@/types/dashboard/payment";
import { ManualPaymentDialog } from "./manual-payment-dialog";
import { StudentDetailDialog } from "./student-detail-dialog";
import { ReminderDialog } from "./reminder-dialog";
import { InvoiceDialog } from "./invoice-dialog";
import { useToast } from "@/hooks/dashboard/use-toast";
import { fetchCohortsByIds, getCohortDisplayName, getCohortFullInfo, type CohortInfo } from "@/lib/dashboard/cohort-api";

interface StudentPaymentTableProps {
  payments: Payment[];
  displayedColumns?: string[];
  viewMode?: 'list' | 'grid';
  selectedIds?: string[];
  toggleSelect?: (id: string, checked: boolean) => void;
  toggleSelectAll?: (checked: boolean) => void;
  onRefresh?: () => void;
}

export function StudentPaymentTable({ 
  payments, 
  displayedColumns, 
  viewMode = 'list',
  selectedIds = [],
  toggleSelect,
  toggleSelectAll,
  onRefresh,
}: StudentPaymentTableProps) {
  const { currency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Payment>("studentId");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const { toast } = useToast();

  // Cohort data state
  const [cohortMap, setCohortMap] = useState<Map<string, CohortInfo>>(new Map());
  const [cohortsLoading, setCohortsLoading] = useState(false);

  // Fetch cohort data when payments change (with debouncing)
  useEffect(() => {
    const fetchCohortData = async () => {
      // Extract unique cohort IDs from payments
      const cohortIds = Array.from(new Set(
        payments
          .map(payment => payment.cohortId)
          .filter(Boolean)
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
        console.error('Failed to fetch cohort data:', error);
        setCohortMap(new Map()); // Set empty map on error
        toast({
          title: "Cohort Load Error",
          description: "Could not load cohort names. Showing IDs only.",
          variant: "destructive",
        });
      } finally {
        setCohortsLoading(false);
      }
    };

    // Debounce the fetch to avoid excessive API calls
    const timeoutId = setTimeout(fetchCohortData, 300);
    return () => clearTimeout(timeoutId);
  }, [payments, toast]);

  // Use default columns if not provided
  const defaultColumns = ['Student ID', 'Student Name', 'Enrolled Course', 'Cohort', 'Payment Category', `Course Fee (${currency})`, `Course Reg Fee (${currency})`, `Student Reg Fee (${currency})`, `Total To Be Paid (${currency})`, `Total Paid (${currency})`, `Balance (${currency})`, 'Status', 'Start Date', 'End Date', 'Next Due Date', 'Invoice', 'Send Reminder', 'Actions'];
  const columns = displayedColumns || defaultColumns;

  // Helper to check if column should be displayed
  const shouldShowColumn = (columnName: string) => columns.includes(columnName);

  // Filter and sort payments
  const filteredPayments = useMemo(() => {
    let filtered = payments.filter((payment) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        payment.studentId.toLowerCase().includes(searchLower) ||
        payment.studentName.toLowerCase().includes(searchLower) ||
        payment.enrolledCourseName?.toLowerCase().includes(searchLower) ||
        ""
      );
    });

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal || "");
      const bStr = String(bVal || "");
      return sortDirection === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });

    return filtered;
  }, [payments, searchTerm, sortField, sortDirection]);

  const handleSort = (field: keyof Payment) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getStatusBadge = (status: string, payment?: Payment) => {
    // For monthly subscriptions, show as "Recurring" instead of "Paid"
    let displayStatus = status;
    if (payment && (payment.paymentOption === 'Monthly' || payment.planType === 'MONTHLY_SUBSCRIPTION') && status === 'Paid') {
      displayStatus = 'Recurring';
    }
    
    const colors: Record<string, string> = {
      Pending: "bg-red-500 text-white hover:bg-red-500",
      Paid: "bg-green-500 text-white hover:bg-green-500",
      Complete: "bg-green-500 text-white hover:bg-green-500",
      Completed: "bg-green-500 text-white hover:bg-green-500",
      Recurring: "bg-blue-500 text-white hover:bg-blue-500",
      Partial: "bg-orange-500 text-white hover:bg-orange-500",
    };

    return <Badge className={`${colors[displayStatus] || "bg-gray-500 text-white hover:bg-gray-500"} rounded-full px-3 py-1`}>{displayStatus}</Badge>;
  };

  const getReminderBadge = (isOn: boolean) => {
    return (
      <Badge className={`${isOn ? "bg-purple-600 text-white hover:bg-purple-600" : "bg-gray-200 text-gray-600 hover:bg-gray-200"} rounded-full px-3 py-1`}>
        {isOn ? "On" : "Off"}
      </Badge>
    );
  };

  const handleOpenPaymentDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setPaymentDialogOpen(true);
  };

  const handleOpenDetailDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setDetailDialogOpen(true);
  };

  const handleOpenReminderDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setReminderDialogOpen(true);
  };

  const handleOpenInvoiceDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setInvoiceDialogOpen(true);
  };

  const handleSavePayment = async (paymentData: any) => {
    try {
      // Payment is already recorded by /api/payments/manual endpoint
      // This callback just handles the UI update
      console.log('Payment successfully recorded:', paymentData);
      
      toast({
        title: "Payment Saved",
        description: paymentData.message || `Payment recorded successfully.`,
      });

      // Call onRefresh to update data without reloading the entire page
      if (onRefresh) {
        onRefresh();
      } else {
        // Fallback to reload if onRefresh is not provided
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error handling payment save:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process payment result. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {viewMode === 'grid' ? (
        // Grid View
        <div className="overflow-x-auto">
          <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
          {filteredPayments.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              No payments found
            </div>
          ) : (
            filteredPayments.map((payment, index) => (
              <Card 
                key={payment.id || payment.studentId || index}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-white border-2 border-purple-400 hover:border-purple-500 relative rounded-xl overflow-hidden flex-shrink-0"
                style={{ width: '280px', minWidth: '280px' }}
                onClick={() => handleOpenDetailDialog(payment)}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                          {payment.studentName}
                        </h3>
                        <p className="text-sm text-purple-600 font-medium">
                          {payment.studentId}
                        </p>
                      </div>
                      {payment.status === "N/A" ? (
                        <span className="text-gray-400 text-sm">{payment.status}</span>
                      ) : (
                        getStatusBadge(payment.status, payment)
                      )}
                    </div>

                    {/* Course Info */}
                    <div className="space-y-2 border-t pt-3">
                      <div>
                        <p className="text-xs text-gray-500">Enrolled Course</p>
                        <p className="text-sm font-medium text-gray-900">
                          {payment.enrolledCourseName || "-"}
                        </p>
                        <p className="text-xs text-purple-600">
                          {payment.enrolledCourse || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Cohort</p>
                        {payment.cohortId ? (
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium text-purple-700">
                              {payment.cohortId}
                            </p>
                            <p className="text-xs text-gray-600">
                              {cohortsLoading ? 'Loading...' : getCohortDisplayName(payment.cohortId, cohortMap)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm font-medium text-gray-500">
                            Unassigned
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Payment Category</p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs
                            ${payment.studentCategory === 'Premium' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                            ${payment.studentCategory === 'Regular' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                            ${payment.studentCategory === 'Basic' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                            ${payment.studentCategory === 'Not Set' || !payment.studentCategory ? 'bg-gray-50 text-gray-700 border-gray-200' : ''}
                          `}
                        >
                          {payment.studentCategory || 'Not Set'}
                        </Badge>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="space-y-2 border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Course Fee:</span>
                        <span className="font-semibold text-gray-900">
                          {currency} {(payment.courseFee || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Paid:</span>
                        <span className="font-semibold text-green-600">
                          {currency} {(payment.receivedAmount || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Balance:</span>
                        <span className="font-semibold text-red-600">
                          {currency} {(payment.outstandingAmount || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="space-y-1 border-t pt-2">
                      {payment.lastPaymentDate && (
                        <div className="text-xs text-gray-500">
                          Last Payment: {new Date(payment.lastPaymentDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      )}
                      {payment.startDate && (
                        <div className="text-xs text-gray-500">
                          Start Date: {new Date(payment.startDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      )}
                      {payment.endDate && (
                        <div className="text-xs text-gray-500">
                          End Date: {new Date(payment.endDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      )}
                      {payment.nextReminderDate && (
                        <div className="text-xs text-gray-500">
                          Next Reminder: {new Date(payment.nextReminderDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      )}
                      {payment.nextDueDate && (
                        <div className="text-xs text-gray-500">
                          Next Due: {new Date(payment.nextDueDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {payment.status !== "N/A" && (
                      <div className="space-y-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPaymentDialog(payment);
                            }}
                            disabled={payment.collectionRate >= 100 && !(payment.paymentOption === 'Monthly' || payment.planType === 'MONTHLY_SUBSCRIPTION')}
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Payment
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          {payment.receivedAmount && payment.receivedAmount > 0 ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-purple-600 border-purple-600 hover:bg-purple-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenInvoiceDialog(payment);
                              }}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Invoice
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-gray-400 border-gray-300 cursor-not-allowed"
                              disabled
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Invoice
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className={payment.collectionRate >= 100 
                              ? "flex-1 text-gray-400 border-gray-300 cursor-not-allowed" 
                              : "flex-1 text-blue-600 border-blue-600 hover:bg-blue-50"}
                            disabled={payment.collectionRate >= 100}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (payment.collectionRate < 100) {
                                handleOpenReminderDialog(payment);
                              }
                            }}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Reminder
                          </Button>
                        </div>
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
        // List View (Table)
      <Card>
        <CardContent className="p-0">
          <div className="table-container-with-sticky-header" style={{ width: '100%' }}>
            <table className="w-full caption-bottom text-sm min-w-max" style={{ width: 'max-content', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <TableHead className="w-12 sticky-table-header">
                    <Checkbox 
                      checked={selectedIds.length > 0 && selectedIds.length === filteredPayments.length}
                      onCheckedChange={(checked) => toggleSelectAll?.(!!checked)}
                    />
                  </TableHead>
                  {shouldShowColumn('Student ID') && <TableHead className="font-semibold text-gray-600 sticky-table-header">Student ID</TableHead>}
                  {shouldShowColumn('Student Name') && <TableHead className="font-semibold text-gray-600 sticky-table-header">Student Name</TableHead>}
                  {shouldShowColumn('Enrolled Course') && <TableHead className="font-semibold text-gray-600 sticky-table-header">Enrolled Course</TableHead>}
                  {shouldShowColumn('Payment Category') && <TableHead className="font-semibold text-gray-600 sticky-table-header">Payment Category</TableHead>}
                  {shouldShowColumn('Cohort') && <TableHead className="font-semibold text-gray-600 sticky-table-header">Cohort</TableHead>}
                  {shouldShowColumn('Course Type') && <TableHead className="font-semibold text-gray-600 sticky-table-header">Course Type</TableHead>}
                  {shouldShowColumn(`Course Fee (${currency})`) && <TableHead className="font-semibold text-gray-600 sticky-table-header">Course Fee ({currency})</TableHead>}
                  {shouldShowColumn(`Course Reg Fee (${currency})`) && <TableHead className="font-semibold text-gray-600 sticky-table-header">Course Reg Fee ({currency})</TableHead>}
                  {shouldShowColumn(`Student Reg Fee (${currency})`) && <TableHead className="font-semibold text-gray-600 sticky-table-header">Student Reg Fee ({currency})</TableHead>}
                  {shouldShowColumn(`Total To Be Paid (${currency})`) && <TableHead className="font-semibold text-gray-600 sticky-table-header">Total To Be Paid ({currency})</TableHead>}
                  {shouldShowColumn(`Total Paid (${currency})`) && <TableHead className="font-semibold text-gray-600 sticky-table-header">Total Paid ({currency})</TableHead>}
                  {shouldShowColumn(`Balance (${currency})`) && <TableHead className="font-semibold text-gray-600 sticky-table-header">Balance ({currency})</TableHead>}
                  {shouldShowColumn('Status') && <TableHead className="font-semibold text-gray-600 sticky-table-header">Status</TableHead>}
                  {shouldShowColumn('Paid Date') && <TableHead className="font-semibold text-gray-600 sticky-table-header">Paid Date</TableHead>}
                  {shouldShowColumn('Start Date') && <TableHead className="font-semibold text-gray-600 sticky-table-header">Start Date</TableHead>}
                  {shouldShowColumn('End Date') && <TableHead className="font-semibold text-gray-600 sticky-table-header">End Date</TableHead>}
                  {shouldShowColumn('Next Reminder Date') && <TableHead className="font-semibold text-gray-600 sticky-table-header">Next Reminder Date</TableHead>}
                  {shouldShowColumn('Next Due Date') && <TableHead className="font-semibold text-gray-600 sticky-table-header">Next Due Date</TableHead>}
                  {shouldShowColumn('Invoice') && <TableHead className="font-semibold text-gray-600 sticky-table-header">Invoice</TableHead>}
                  {shouldShowColumn('Send Reminder') && <TableHead className="font-semibold text-gray-600 sticky-table-header">Send Reminder</TableHead>}
                  {shouldShowColumn('Actions') && <TableHead className="font-semibold text-gray-600 sticky-table-header">Actions</TableHead>}
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={18} className="text-center py-8 text-gray-500">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment, index) => (
                    <TableRow 
                      key={payment.id || payment.studentId || index} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleOpenDetailDialog(payment)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox 
                          checked={selectedIds.includes(payment.id)}
                          onCheckedChange={(checked) => toggleSelect?.(payment.id, !!checked)}
                        />
                      </TableCell>
                      {shouldShowColumn('Student ID') && (
                        <TableCell className="font-semibold">
                          {payment.studentId}
                        </TableCell>
                      )}
                      {shouldShowColumn('Student Name') && (
                        <TableCell className="font-medium">{payment.studentName}</TableCell>
                      )}
                      {shouldShowColumn('Enrolled Course') && (
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-purple-600 text-sm font-medium">
                              {payment.enrolledCourse || "N/A"}
                            </div>
                            <div className="text-gray-700 font-medium">
                              {payment.enrolledCourseName || "-"}
                            </div>
                          </div>
                        </TableCell>
                      )}
                      {shouldShowColumn('Payment Category') && (
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`
                              ${payment.studentCategory === 'Premium' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                              ${payment.studentCategory === 'Regular' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                              ${payment.studentCategory === 'Basic' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                              ${payment.studentCategory === 'Not Set' || !payment.studentCategory ? 'bg-gray-50 text-gray-700 border-gray-200' : ''}
                            `}
                          >
                            {payment.studentCategory || 'Not Set'}
                          </Badge>
                        </TableCell>
                      )}
                      {shouldShowColumn('Cohort') && (
                        <TableCell>
                          {payment.cohortId ? (
                            <div className="space-y-1">
                              <div className="text-purple-700 text-sm font-bold">
                                {payment.cohortId}
                              </div>
                              <div className="text-gray-600 text-xs">
                                {cohortsLoading ? (
                                  <span className="text-gray-400 animate-pulse">Loading name...</span>
                                ) : (
                                  <span title={`Cohort: ${getCohortDisplayName(payment.cohortId, cohortMap)}`}>
                                    {getCohortDisplayName(payment.cohortId, cohortMap)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-400 text-sm">
                              Unassigned
                            </div>
                          )}
                        </TableCell>
                      )}
                      {shouldShowColumn('Course Type') && (
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={`
                              ${payment.courseType === 'Online' ? 'bg-green-100 text-green-700 border-0' : ''}
                              ${payment.courseType === 'Offline' ? 'bg-blue-100 text-blue-700 border-0' : ''}
                              ${payment.courseType === 'Hybrid' ? 'bg-orange-100 text-orange-700 border-0' : ''}
                              ${payment.courseType === 'Individual' || payment.courseType === 'Not Set' || !payment.courseType ? 'bg-gray-100 text-gray-700 border-0' : ''}
                            `}
                          >
                            {payment.courseType || "Not Set"}
                          </Badge>
                        </TableCell>
                      )}
                      {shouldShowColumn(`Course Fee (${currency})`) && (
                        <TableCell className="text-right">
                          {currency} {(payment.courseFee || 0).toLocaleString()}
                        </TableCell>
                      )}
                      {shouldShowColumn(`Course Reg Fee (${currency})`) && (
                        <TableCell className="text-right">
                          {(payment.courseRegistrationFee || 0).toLocaleString()}
                        </TableCell>
                      )}
                      {shouldShowColumn(`Student Reg Fee (${currency})`) && (
                        <TableCell className="text-right">
                          {(payment.studentRegistrationFee || 0).toLocaleString()}
                        </TableCell>
                      )}
                      {shouldShowColumn(`Total To Be Paid (${currency})`) && (
                        <TableCell className="text-right font-bold text-purple-700 bg-purple-50 min-w-[150px]">
                          {((payment.courseFee || 0) + (payment.courseRegistrationFee || 0) + (payment.studentRegistrationFee || 0)).toLocaleString()}
                        </TableCell>
                      )}
                      {shouldShowColumn(`Total Paid (${currency})`) && (
                        <TableCell className="text-right text-green-600 font-semibold">
                          {(payment.receivedAmount || 0).toLocaleString()}
                        </TableCell>
                      )}
                      {shouldShowColumn(`Balance (${currency})`) && (
                        <TableCell className="text-right text-red-600 font-semibold">
                          {(payment.outstandingAmount || 0).toLocaleString()}
                        </TableCell>
                      )}
                      {shouldShowColumn('Status') && (
                        <TableCell>
                          {payment.status === "N/A" ? (
                            <span className="text-gray-400">{payment.status}</span>
                          ) : (
                            getStatusBadge(payment.status, payment)
                          )}
                        </TableCell>
                      )}
                      {shouldShowColumn('Paid Date') && (
                        <TableCell className="text-center">
                          {payment.lastPaymentDate 
                            ? new Date(payment.lastPaymentDate).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })
                            : "-"}
                        </TableCell>
                      )}
                      {shouldShowColumn('Start Date') && (
                        <TableCell className="text-center">
                          {payment.startDate
                            ? new Date(payment.startDate).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })
                            : "-"}
                        </TableCell>
                      )}
                      {shouldShowColumn('End Date') && (
                        <TableCell className="text-center">
                          {payment.endDate
                            ? new Date(payment.endDate).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })
                            : "-"}
                        </TableCell>
                      )}
                      {shouldShowColumn('Next Reminder Date') && (
                        <TableCell className="text-center">
                          {payment.nextReminderDate ? (
                            (() => {
                              try {
                                return new Date(payment.nextReminderDate).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                });
                              } catch (error) {
                                console.error('Error formatting nextReminderDate:', payment.nextReminderDate, error);
                                return "-";
                              }
                            })()
                          ) : "-"}
                        </TableCell>
                      )}
                      {shouldShowColumn('Next Due Date') && (
                        <TableCell className="text-center">
                          {payment.nextDueDate ? (
                            (() => {
                              try {
                                return new Date(payment.nextDueDate).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                });
                              } catch (error) {
                                console.error('Error formatting nextDueDate:', payment.nextDueDate, error);
                                return "-";
                              }
                            })()
                          ) : "-"}
                        </TableCell>
                      )}
                      {shouldShowColumn('Invoice') && (
                        <TableCell className="text-center">
                          {payment.status === "N/A" || !payment.receivedAmount || payment.receivedAmount === 0 ? (
                            <span className="text-gray-400">N/A</span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-purple-600 border-purple-600 hover:bg-purple-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenInvoiceDialog(payment);
                              }}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                      {shouldShowColumn('Send Reminder') && (
                        <TableCell className="text-center">
                          {payment.status === "N/A" ? (
                            <span className="text-gray-400">N/A</span>
                          ) : payment.collectionRate >= 100 ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-gray-400 border-gray-300 cursor-not-allowed"
                              disabled
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 border-blue-600 hover:bg-blue-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenReminderDialog(payment);
                              }}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                      {shouldShowColumn('Actions') && (
                        <TableCell>
                          {payment.status === "N/A" ? (
                            <span className="text-gray-400">N/A</span>
                          ) : (
                            <Button 
                              size="sm" 
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPaymentDialog(payment);
                              }}
                              disabled={payment.collectionRate >= 100 && !(payment.paymentOption === 'Monthly' || payment.planType === 'MONTHLY_SUBSCRIPTION')}
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Payment
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Manual Payment Dialog */}
      <ManualPaymentDialog
        payment={selectedPayment}
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        onSave={handleSavePayment}
      />

      {/* Student Detail Dialog */}
      <StudentDetailDialog
        payment={selectedPayment}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      {/* Reminder Dialog */}
      <ReminderDialog
        payment={selectedPayment}
        open={reminderDialogOpen}
        onOpenChange={setReminderDialogOpen}
      />

      {/* Invoice Dialog */}
      <InvoiceDialog
        payment={selectedPayment}
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
      />
    </div>
  );
}
