"use client";

import { useMemo, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/dashboard/ui/dialog";
import { Badge } from "@/components/dashboard/ui/badge";
import { Student } from "@/types/dashboard/student";
import { type Course } from "@/data/dashboard/courses";
import { cn, formatDateForDisplay } from "@/lib/dashboard/student/utils";
import { X } from "lucide-react";
// View dialog intentionally minimal: only core fields (no communication / guardian extras)

// Helper to format ISO / YYYY-MM-DD dates consistently
function formatDate(date?: string | null) {
  if (!date) return "�";
  try {
    // Accept already formatted date (YYYY-MM-DD) or ISO
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    // Use standardized display format dd-MMM-yyyy
    return formatDateForDisplay(d.toISOString().slice(0,10));
  } catch { return date; }
}

// Field component matching course details style
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium text-gray-600">{label}:</div>
      <div className="text-sm font-semibold text-gray-900">{value || '�'}</div>
    </div>
  );
}

interface StudentDetailsDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses?: Course[]; // All available courses to resolve course id + name
}

export function StudentDetailsDialog({ student, open, onOpenChange, courses = [] }: StudentDetailsDialogProps) {
  // Helper function to resolve the course for a student
  const resolveCourse = (student: Student): Course | undefined => {
    if (!courses || courses.length === 0) return undefined;
    return courses.find(c => 
      c.id === student.courseOfInterestId || 
      c.id === student.enrolledCourse ||
      c.courseId === student.courseOfInterestId ||
      c.courseId === student.enrolledCourse
    );
  };

  // Cohort info hooks MUST be declared before any early return to keep hook order stable
  const [cohortInfo, setCohortInfo] = useState<{ id: string; name: string; instructor?: string; timing?: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!student?.cohortId) { setCohortInfo(null); return; }
      try {
        const url = student.enrolledCourse ? `/api/dashboard/cohorts?courseId=${encodeURIComponent(student.enrolledCourse)}` : '/api/dashboard/student/cohorts';
        const res = await fetch(url);
        if (!res.ok) return;
        const data: any[] = await res.json();
        const match = data.find(c => c.id === student.cohortId);
        if (!cancelled && match) {
          setCohortInfo({ id: match.id, name: match.name || '', instructor: match.instructor, timing: match.timing });
        }
      } catch {
        if (!cancelled) setCohortInfo(null);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [student?.cohortId, student?.enrolledCourse]);

  if (!student) return null;

  const course = resolveCourse(student);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0 bg-white overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative flex-shrink-0">
          <DialogHeader className="px-6 py-4 bg-white border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  {student.name}
                </DialogTitle>
                <p className="text-sm text-gray-500 mt-1">
                  ID: {student.studentId}
                </p>
                {/* Tags in header */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {student.category && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                      {student.category}
                    </span>
                  )}
                  {student.gender && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                      {student.gender}
                    </span>
                  )}
                  {student.courseType && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                      {student.courseType}
                    </span>
                  )}
                  {student.courseLevel && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                      {student.courseLevel}
                    </span>
                  )}
                </div>
              </div>
              <DialogClose asChild>
                <button
                  type="button"
                  className="ml-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </DialogClose>
            </div>
          </DialogHeader>
        </div>

        {/* Content - Scrollable */}
        <div className="px-6 py-4 space-y-6 overflow-y-auto flex-1">
          {/* Student Information Section */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Student Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Field label="Full Name" value={student.name} />
                <Field label="Student ID" value={student.studentId} />
                <Field label="Gender" value={student.gender} />
                <Field label="Date of Birth" value={formatDate(student.dob)} />
              </div>
              <div className="space-y-3">
                <Field label="Email" value={student.email} />
                <Field label="Mobile" value={student.mobile} />
                <Field label="Address" value={student.address} />
                <Field label="Category" value={student.category} />
              </div>
            </div>
          </div>

          {/* Course & Enrollment Section */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Course & Enrollment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Field 
                  label="Course" 
                  value={course ? `${course.courseId || course.id} - ${course.name}` : student.enrolledCourseName || '�'} 
                />
                <Field label="Registration Date" value={formatDate(student.registrationDate)} />
                <Field label="Course Start Date" value={formatDate(student.courseStartDate)} />
              </div>
              <div className="space-y-3">
                {student.courseType && <Field label="Type" value={student.courseType} />}
                {student.courseLevel && <Field label="Level" value={student.courseLevel} />}
                <Field 
                  label="Cohort" 
                  value={cohortInfo ? (
                    <div className="space-y-1">
                      <div className="font-medium">{cohortInfo.id} � {cohortInfo.name || 'Unnamed'}</div>
                      {(cohortInfo.instructor || cohortInfo.timing) && (
                        <div className="text-xs text-gray-500 space-y-0.5">
                          {cohortInfo.instructor && <div>Instructor: {cohortInfo.instructor}</div>}
                          {cohortInfo.timing && <div>Timing: {cohortInfo.timing}</div>}
                        </div>
                      )}
                    </div>
                  ) : (student.cohortId || '�')} 
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
