export interface Student {
  id: string;
  name: string;
  avatar: string;
  course: string;
  progress: number;
  attendance: number;
  lastActive: string;
  status: "active" | "inactive" | "flagged";
  behaviorFlags?: string[];
  studentId?: string; // Auto-generated STUD0001 format
  instructor?: string;
  grade?: string;
  enrollmentDate?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    parentEmail?: string;
    parentPhone?: string;
  };
  academicInfo?: {
    gpa?: number;
    credits?: number;
    semester?: string;
    year?: string;
  };
  demographicInfo?: {
    age?: number;
    gender?: "Male" | "Female" | "Other";
    nationality?: string;
  };
  performanceMetrics?: {
    assignmentsCompleted?: number;
    totalAssignments?: number;
    averageScore?: number;
    participationScore?: number;
  };
}

export interface StudentFilters {
  status: string[];
  course: string[];
  instructor: string[];
  grade: string[];
  gender: string[];
  progressRange: [number, number]; // [min, max] percentage
  attendanceRange: [number, number]; // [min, max] percentage
  behaviorFlags: string[];
  enrollmentDateRange: [string, string]; // [start, end] dates
  academicYear: string[];
  semester: string[];
}
