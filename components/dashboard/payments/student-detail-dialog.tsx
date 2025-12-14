"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useCurrency } from "@/contexts/currency-context";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/dashboard/ui/dialog";
import { Badge } from "@/components/dashboard/ui/badge";
import { Avatar, AvatarFallback } from "@/components/dashboard/ui/avatar";
import { type Payment } from "@/types/dashboard/payment";
import {
  Hash,
  User,
  Tag,
  BookOpen,
  Users,
  Calendar,
  DollarSign,
  CreditCard,
  Bell,
  Receipt,
  Clock,
  Target,
  TrendingUp,
  FileText,
  Calculator,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { fetchCohortsByIds, getCohortDisplayName, type CohortInfo } from "@/lib/dashboard/cohort-api";

interface StudentDetailDialogProps {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentDetailDialog({
  payment,
  open,
  onOpenChange,
}: StudentDetailDialogProps) {
  const { currency } = useCurrency();
  const [cohortMap, setCohortMap] = useState<Map<string, CohortInfo>>(new Map());
  const [cohortsLoading, setCohortsLoading] = useState(false);

  // Fetch cohort data when dialog opens
  useEffect(() => {
    const fetchCohortData = async () => {
      if (!payment?.cohortId || !open) {
        setCohortMap(new Map());
        return;
      }

      setCohortsLoading(true);
      try {
        const cohortData = await fetchCohortsByIds([payment.cohortId]);
        setCohortMap(cohortData);
      } catch (error) {
        console.error('Failed to fetch cohort data for dialog:', error);
        setCohortMap(new Map());
      } finally {
        setCohortsLoading(false);
      }
    };

    fetchCohortData();
  }, [payment?.cohortId, open]);

  if (!payment) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount: number) => {
    if (!currency) {
      return amount.toLocaleString();
    }
    return `${currency} ${amount.toLocaleString()}`;
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string, payment?: Payment) => {
    // For monthly subscriptions, show as "Recurring" instead of "Paid"
    let displayStatus = status;
    if (payment && (payment.paymentOption === 'Monthly' || payment.planType === 'MONTHLY_SUBSCRIPTION') && status === 'Paid') {
      displayStatus = 'Recurring';
    }
    
    const colors: Record<string, string> = {
      Pending: "bg-orange-100 text-orange-700",
      Paid: "bg-green-100 text-green-700",
      Complete: "bg-green-100 text-green-700",
      Completed: "bg-green-100 text-green-700",
      Recurring: "bg-blue-100 text-blue-700",
      Partial: "bg-orange-100 text-orange-700",
    };
    return colors[displayStatus] || "bg-slate-100 text-slate-700";
  };

  type InfoField = {
    icon: LucideIcon;
    label: string;
    value: ReactNode;
  };

  const renderFields = (fields: InfoField[], options?: { columns?: 1 | 2 }) => {
    const columns = options?.columns ?? 1;
    const containerClass =
      columns === 2
        ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
        : "space-y-2.5";

    return (
      <div className={containerClass}>
        {fields.map(({ icon: Icon, label, value }) => (
          <div className="flex items-start gap-3" key={label}>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-50 text-purple-500">
              <Icon className="h-3 w-3" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-medium text-slate-500">
                {label}
              </p>
              <div className="mt-1 text-[13px] font-semibold text-slate-900 leading-tight">
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const studentFields: InfoField[] = [
    { icon: Hash, label: "Student ID", value: payment.studentId },
    { icon: User, label: "Student Name", value: payment.studentName },
  ];

  if (payment.studentCategory) {
    studentFields.push({ icon: Tag, label: "Category", value: payment.studentCategory });
  }

  const courseFields: InfoField[] = [
    {
      icon: BookOpen,
      label: "Enrolled Course",
      value: payment.enrolledCourseName || "-",
    },
    {
      icon: Hash,
      label: "Enrolled Course ID",
      value: payment.enrolledCourse || payment.enrolledCourseId || "-",
    },
    {
      icon: Users,
      label: "Cohort",
      value: payment.cohortId ? (
        <div className="space-y-1">
          <div className="font-bold text-purple-700">{payment.cohortId}</div>
          <div className="text-xs text-gray-600 dark:text-white">
            {cohortsLoading ? (
              <span className="animate-pulse text-gray-400 dark:text-white">Loading name...</span>
            ) : (
              getCohortDisplayName(payment.cohortId, cohortMap)
            )}
          </div>
        </div>
      ) : "-",
    },
    {
      icon: Receipt,
      label: "Course Type",
      value: payment.courseType || "-",
    },
    {
      icon: Calendar,
      label: "Start Date",
      value: formatDate(payment.startDate),
    },
    {
      icon: Calendar,
      label: "End Date",
      value: formatDate(payment.endDate),
    },
  ];

  // Calculate totals
  const totalToBePaid = Number(payment.courseFee || 0) + Number(payment.courseRegistrationFee || 0) + Number(payment.studentRegistrationFee || 0);
  const collectionRate = totalToBePaid > 0 ? ((payment.receivedAmount || 0) / totalToBePaid) * 100 : 0;

  const paymentSummaryFields: InfoField[] = [
    {
      icon: DollarSign,
      label: "Course Fee",
      value: (
        <span className="text-base font-semibold text-slate-900">
          {formatCurrency(payment.courseFee || 0)}
        </span>
      ),
    },
    {
      icon: CreditCard,
      label: "Student Registration",
      value: formatCurrency(payment.studentRegistrationFee || 0),
    },
    {
      icon: CreditCard,
      label: "Course Registration",
      value: formatCurrency(payment.courseRegistrationFee || 0),
    },
    {
      icon: Calculator,
      label: "Total To Be Paid",
      value: (
        <span className="font-bold text-purple-700 text-base">
          {formatCurrency(totalToBePaid)}
        </span>
      ),
    },
    {
      icon: DollarSign,
      label: "Total Paid",
      value: (
        <span className="font-semibold text-emerald-600">
          {formatCurrency(payment.receivedAmount || 0)}
        </span>
      ),
    },
    {
      icon: DollarSign,
      label: "Balance",
      value: (
        <span className="font-semibold text-red-600">
          {formatCurrency(payment.outstandingAmount || 0)}
        </span>
      ),
    },
    {
      icon: TrendingUp,
      label: "Collection Rate",
      value: (
        <span className={`font-semibold ${
          collectionRate >= 100 ? 'text-emerald-600' : 
          collectionRate >= 50 ? 'text-orange-500' : 'text-red-600'
        }`}>
          {collectionRate.toFixed(1)}%
        </span>
      ),
    },
    {
      icon: Receipt,
      label: "Payment Status",
      value: (
        <Badge className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(payment.status, payment)}`}>
          {(payment.paymentOption === 'Monthly' || payment.planType === 'MONTHLY_SUBSCRIPTION') && payment.status === 'Paid' ? 'Recurring' : payment.status}
        </Badge>
      ),
    },
  ];

  const paymentDetailsFields: InfoField[] = [
    {
      icon: Bell,
      label: "Reminder",
      value: (
        <Badge className={`px-2 py-1 text-xs ${
          payment.reminderEnabled 
            ? 'bg-emerald-100 text-emerald-700' 
            : 'bg-gray-100 text-gray-700 dark:text-white'
        }`}>
          {payment.reminderEnabled ? "On" : "Off"}
        </Badge>
      ),
    },
    {
      icon: Calendar,
      label: "Last Payment Date",
      value: formatDate(payment.lastPaymentDate),
    },
    {
      icon: Calendar,
      label: "Next Due Date",
      value: formatDate(payment.nextDueDate),
    },
    {
      icon: Clock,
      label: "Next Reminder Date",
      value: formatDate(payment.nextReminderDate),
    },
    {
      icon: FileText,
      label: "Invoice",
      value: payment.invoiceUrl ? (
        <Badge className="bg-blue-100 text-blue-700 px-2 py-1 text-xs">
          Available
        </Badge>
      ) : (
        <Badge className="bg-gray-100 text-gray-700 dark:text-white px-2 py-1 text-xs">
          Not Generated
        </Badge>
      ),
    },
  ];

  const headerStatusBadgeClass =
    {
      Pending: "bg-orange-400",
      Paid: "bg-emerald-500",
      Complete: "bg-emerald-500",
      Completed: "bg-emerald-500",
      Recurring: "bg-blue-500",
      Partial: "bg-orange-400",
      "N/A": "bg-slate-500",
    }[payment.status] || "bg-slate-500";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[980px] border-none bg-transparent p-0 shadow-none"
      >
        <div className="flex max-h-[86vh] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_24px_60px_-30px_rgba(124,58,237,0.45)]">
          <div className="bg-gradient-to-r from-[#6D28D9] via-[#8B5CF6] to-[#F97316] px-5 py-5 text-white sticky top-0 z-10">
            <DialogTitle className="sr-only">Student payment details</DialogTitle>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-white/30 bg-white/20 text-base font-semibold text-white shadow-inner">
                  <AvatarFallback className="bg-white/20 text-white text-base">
                    {getInitials(payment.studentName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-2xl font-semibold leading-tight">
                    {payment.studentName}
                  </p>
                  <p className="text-[11px] font-semibold text-white/80">
                    {payment.studentId}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {payment.studentCategory && (
                  <Badge className="rounded-full border-none bg-white/25 px-3 py-[3px] text-[11px] font-semibold text-white backdrop-blur">
                    {payment.studentCategory}
                  </Badge>
                )}
                <Badge
                  className={`rounded-full border-none px-3 py-[3px] text-[11px] font-semibold text-white ${headerStatusBadgeClass}`}
                >
                  {payment.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="px-5 pb-5 pt-4">
            <div className="grid gap-4 lg:grid-cols-6">
              {/* Student Info */}
              <section className="rounded-[18px] border border-slate-100 bg-white/95 p-4 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-[#7C3AED]">
                  <User className="h-5 w-5" />
                  Student
                </h3>
                {renderFields(studentFields)}
              </section>

              {/* Course & Cohort Info */}
              <section className="rounded-[18px] border border-slate-100 bg-white/95 p-4 shadow-sm lg:col-span-2">
                <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-[#7C3AED]">
                  <BookOpen className="h-5 w-5" />
                  Course
                </h3>
                {renderFields(courseFields)}
              </section>

              {/* Payment Summary */}
              <section className="rounded-[18px] border border-slate-100 bg-white/95 p-4 shadow-sm lg:col-span-2">
                <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-[#7C3AED]">
                  <DollarSign className="h-5 w-5" />
                  Payment Summary
                </h3>
                {renderFields(paymentSummaryFields, { columns: 2 })}
              </section>

              {/* Payment Details */}
              <section className="rounded-[18px] border border-slate-100 bg-white/95 p-4 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-[#7C3AED]">
                  <Receipt className="h-5 w-5" />
                  Payment Details
                </h3>
                {renderFields(paymentDetailsFields)}
              </section>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
