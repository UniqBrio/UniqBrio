export type InstructorColumnId =
  | "id"
  | "name"
  | "role"
  | "gender"
  | "experience"
  | "contractType"
  | "jobLevel";

export interface InstructorColumnDef {
  id: InstructorColumnId;
  label: string;
}

export const INSTRUCTOR_TABLE_COLUMNS: InstructorColumnDef[] = [
  { id: "id", label: "Non-Instructor ID" },
  { id: "name", label: "Non-Instructor Name" },
  { id: "role", label: "Role" },
  { id: "contractType", label: "Contract Type" },
  { id: "jobLevel", label: "Job Level" },
  { id: "gender", label: "Gender" },
  { id: "experience", label: "Total Exp (Years)" },
];

export const getInstructorColumnLabel = (id: InstructorColumnId): string => {
  return INSTRUCTOR_TABLE_COLUMNS.find(c => c.id === id)?.label ?? id;
};
