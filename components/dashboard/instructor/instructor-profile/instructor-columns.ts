export type InstructorColumnId =
  | "id"
  | "name"
  | "role"
  | "courseAssigned"
  | "cohortName"
  | "courseIds"
  | "cohortIds"
  | "gender"
  | "experience";

export interface InstructorColumnDef {
  id: InstructorColumnId;
  label: string;
}

export const INSTRUCTOR_TABLE_COLUMNS: InstructorColumnDef[] = [
  { id: "id", label: "Instructor ID" },
  { id: "name", label: "Instructor Name" },
  { id: "role", label: "Role" },
  { id: "courseAssigned", label: "Course Assigned" },
  { id: "cohortName", label: "Cohort name" },
  { id: "courseIds", label: "Course IDs" },
  { id: "cohortIds", label: "Cohort IDs" },
  { id: "gender", label: "Gender" },
  { id: "experience", label: "Total Exp (Years)" },
];

export const getInstructorColumnLabel = (id: InstructorColumnId): string => {
  return INSTRUCTOR_TABLE_COLUMNS.find(c => c.id === id)?.label ?? id;
};
