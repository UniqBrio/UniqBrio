import { type Student } from "@/types/dashboard/student";

// DEPRECATED: Sample student data for demonstration only
// This dummy data should NOT be used in production.
// All student data should be fetched from the backend API at /api/students
export const sampleStudents: Student[] = [
 
];

// For backwards compatibility, export as 'students' but with a deprecation warning
/** @deprecated Use API endpoint /api/students instead of this dummy data */
export const students = sampleStudents;
