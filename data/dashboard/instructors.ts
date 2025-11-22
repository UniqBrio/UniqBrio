import type { Instructor } from "@/types/dashboard/instructor";

/**
 * Deprecated: Hard-coded instructor samples removed in favor of real server data.
 * Keeping the export (now empty) to avoid breaking existing imports while migrating UI.
 * If you still rely on seeded dev data, consider creating a dedicated seeding script
 * or environment-based mock provider instead of static arrays in the bundle.
 */
export const sampleInstructors: Instructor[] = [];

// Extract unique values for filter options
export const getRoleOptions = (instructors: Instructor[]): string[] => {
  const roles = instructors.map(instructor => instructor.role);
  return Array.from(new Set(roles)).sort();
};



export const getDepartmentOptions = (instructors: Instructor[]): string[] => {
  const departments = instructors.map(instructor => instructor.department).filter(Boolean) as string[];
  return Array.from(new Set(departments)).sort();
};
