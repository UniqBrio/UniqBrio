"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/dashboard/ui/dialog";
import { Badge } from "@/components/dashboard/ui/badge";
import { Avatar, AvatarFallback } from "@/components/dashboard/ui/avatar";
import { type Cohort } from "@/data/dashboard/cohorts";
import { type Student } from "@/types/dashboard/student";
import { useCurrency } from "@/contexts/currency-context";
import {
  Hash,
  BookOpen,
  Users,
  Calendar,
  Clock,
  MapPin,
  User,
  GraduationCap,
  Phone,
  Mail,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, useEffect } from "react";

interface CohortDetailDialogProps {
  cohort: Cohort | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CohortDetailDialog({
  cohort,
  open,
  onOpenChange,
}: CohortDetailDialogProps) {
  const { currency } = useCurrency();
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);

  useEffect(() => {
    if (!cohort || !open) {
      setStudents([]);
      setPayments([]);
      setCurrentStudentIndex(0);
      return;
    }

    const fetchStudentsInCohort = async () => {
      setLoading(true);
      try {
        // Fetch students filtered by cohortId
        const studentsResponse = await fetch(`/api/students`);
        if (studentsResponse.ok) {
          const allStudents = await studentsResponse.json();
          
          // Filter students who belong to this cohort using cohortId
          const cohortStudents = Array.isArray(allStudents) 
            ? allStudents.filter((s: Student) => 
                s.cohortId === cohort.id || 
                s.cohortId === cohort.name ||
                (cohort.enrolledStudents && cohort.enrolledStudents.includes(s.studentId))
              )
            : [];
          
          console.log(`Found ${cohortStudents.length} students in cohort ${cohort.id}`);
          setStudents(cohortStudents);

          // Fetch payment data for these students
          if (cohortStudents.length > 0) {
            const paymentsResponse = await fetch(`/api/dashboard/payments/all-students`);
            if (paymentsResponse.ok) {
              const allPayments = await paymentsResponse.json();
              const cohortPayments = Array.isArray(allPayments)
                ? allPayments.filter((p: any) => 
                    cohortStudents.some((s: Student) => s.studentId === p.studentId)
                  )
                : [];
              setPayments(cohortPayments);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch students:", error);
        setStudents([]);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsInCohort();
  }, [cohort, open]);

  if (!cohort) return null;

  const currentStudent = students[currentStudentIndex];
  const currentPayment = currentStudent 
    ? payments.find(p => p.studentId === currentStudent.studentId)
    : null;
  const totalStudents = students.length;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return `${currency} 0`;
    return `${currency} ${amount.toLocaleString()}`;
  };

  const formatDaysOfWeek = (days?: number[]) => {
    if (!days || days.length === 0) return "-";
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days.map((d) => dayNames[d]).join(", ");
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

  const cohortFields: InfoField[] = [
    { icon: BookOpen, label: "Course", value: currentStudent?.enrolledCourseName || cohort.activity || "-" },
    { icon: Hash, label: "Course Type", value: currentPayment?.courseType || "Offline" },
  ];

  const communicationFields: InfoField[] = [
    {
      icon: User,
      label: "Reminder Sent",
      value: currentPayment?.reminderEnabled ? "Yes" : "No",
    },
    {
      icon: Phone,
      label: "Communication Mode",
      value: "-",
    },
  ];

  const importantDatesFields: InfoField[] = [
    {
      icon: Calendar,
      label: "Paid Date",
      value: formatDate(currentPayment?.lastPaymentDate),
    },
    {
      icon: Calendar,
      label: "Next Due",
      value: formatDate(currentPayment?.nextReminderDate),
    },
    {
      icon: Calendar,
      label: "Course Start",
      value: formatDate(currentStudent?.courseStartDate || cohort.startDate),
    },
  ];

  const studentInfoFields: InfoField[] = currentStudent
    ? [
        { icon: Hash, label: "Student ID", value: currentStudent.studentId },
        { icon: User, label: "Name", value: currentStudent.name },
        {
          icon: GraduationCap,
          label: "Category",
          value: currentStudent.category || "Beginner",
        },
      ]
    : [];

  const paymentSummaryFields: InfoField[] = [
    {
      icon: Hash,
      label: "Registration Fee",
      value: formatCurrency(currentPayment?.studentRegistrationFee || 0),
    },
    {
      icon: Hash,
      label: "Final Payment",
      value: formatCurrency(currentPayment?.courseFee || 0),
    },
    {
      icon: Hash,
      label: "Total Paid",
      value: <span className="font-semibold text-emerald-600">{formatCurrency(currentPayment?.receivedAmount || 0)}</span>,
    },
    {
      icon: Hash,
      label: "Balance",
      value: <span className="font-semibold text-purple-600">{formatCurrency(currentPayment?.outstandingAmount || 0)}</span>,
    },
    {
      icon: Hash,
      label: "Status",
      value: (
        <Badge className={`rounded-full px-3 py-1 text-xs font-semibold ${
          currentPayment?.status === "Paid" 
            ? "bg-emerald-100 text-emerald-700"
            : "bg-orange-100 text-orange-700"
        }`}>
          {currentPayment?.status || "Pending"}
        </Badge>
      ),
    },
  ];

  const handlePrevious = () => {
    if (currentStudentIndex > 0) {
      setCurrentStudentIndex(currentStudentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentStudentIndex < totalStudents - 1) {
      setCurrentStudentIndex(currentStudentIndex + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-no-close
        className="max-w-[980px] border-none bg-transparent p-0 shadow-none"
      >
        <div className="flex max-h-[86vh] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_24px_60px_-30px_rgba(124,58,237,0.45)]">
          <div className="relative bg-gradient-to-r from-[#6D28D9] via-[#8B5CF6] to-[#F97316] px-5 py-5 text-white">
            <DialogTitle className="sr-only">Cohort student details</DialogTitle>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {currentStudent && (
                  <Avatar className="h-12 w-12 border border-white/30 bg-white/20 text-base font-semibold text-white shadow-inner">
                    <AvatarFallback className="bg-white/20 text-white text-base">
                      {getInitials(currentStudent.name)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <p className="text-2xl font-semibold leading-tight">
                    {currentStudent ? currentStudent.name : cohort.name}
                  </p>
                  <p className="text-[11px] font-semibold text-white/80">
                    {currentStudent ? currentStudent.studentId : cohort.id}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {currentStudent && (
                  <Badge className="rounded-full border-none bg-white/25 px-3 py-[3px] text-[11px] font-semibold text-white backdrop-blur">
                    {currentStudent.category || "Beginner"}
                  </Badge>
                )}
                <Badge className={`rounded-full border-none px-3 py-[3px] text-[11px] font-semibold text-white ${
                  currentPayment?.status === "Paid"
                    ? "bg-emerald-500"
                    : "bg-orange-400"
                }`}>
                  {currentPayment?.status || "Pending"}
                </Badge>
                <DialogClose asChild>
                  <button
                    type="button"
                    className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </DialogClose>
              </div>
            </div>
          </div>

          <div className="px-5 pb-5 pt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
                  <p className="mt-3 text-sm text-slate-600">Loading students...</p>
                </div>
              </div>
            ) : totalStudents === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Users className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-3 text-sm text-slate-600">
                    No students enrolled in this cohort
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-4 lg:grid-cols-5">
                  <section className="rounded-[18px] border border-slate-100 bg-white/95 p-4 shadow-sm">
                    <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-[#7C3AED]">
                      <User className="h-5 w-5" />
                      Student Information
                    </h3>
                    {renderFields(studentInfoFields)}
                  </section>

                  <section className="rounded-[18px] border border-slate-100 bg-white/95 p-4 shadow-sm">
                    <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-[#7C3AED]">
                      <BookOpen className="h-5 w-5" />
                      Course Details
                    </h3>
                    {renderFields(cohortFields)}
                  </section>

                  <section className="rounded-[18px] border border-slate-100 bg-white/95 p-4 shadow-sm lg:col-span-2">
                    <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-[#7C3AED]">
                      <Hash className="h-5 w-5" />
                      Payment Summary
                    </h3>
                    {renderFields(paymentSummaryFields, { columns: 2 })}
                  </section>

                  <section className="rounded-[18px] border border-slate-100 bg-white/95 p-4 shadow-sm">
                    <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-[#7C3AED]">
                      <Phone className="h-5 w-5" />
                      Communication
                    </h3>
                    {renderFields(communicationFields)}
                  </section>

                  <section className="rounded-[18px] border border-slate-100 bg-white/95 p-4 shadow-sm lg:col-span-5">
                    <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-[#7C3AED]">
                      <Calendar className="h-5 w-5" />
                      Important Dates
                    </h3>
                    {renderFields(importantDatesFields, { columns: 2 })}
                  </section>
                </div>

                {/* Navigation footer */}
                <div className="mt-4 flex items-center justify-center gap-4 border-t border-slate-200 pt-4">
                  <button
                    onClick={handlePrevious}
                    disabled={currentStudentIndex === 0}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <span className="text-sm font-semibold text-orange-600">
                    Student {currentStudentIndex + 1} of {totalStudents}
                  </span>
                  <button
                    onClick={handleNext}
                    disabled={currentStudentIndex === totalStudents - 1}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
