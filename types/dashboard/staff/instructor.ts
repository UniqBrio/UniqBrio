export interface Instructor {
  id: string;
  name: string;
  role: string;
  gender: 'Male' | 'Female' | 'Other';
  experience: number; // years of experience
  email?: string;
  phone?: string;
  department?: string;
  joiningDate?: string;
  contractType?: string; // added - persisted backend field
  jobLevel?: string; // added - persisted backend field
  // denormalized, stored on instructor documents for quick reads/exports
  courseAssigned?: string;
  cohortName?: string;
  // denormalized IDs aggregated from cohorts collection (comma-separated)
  courseIds?: string;
  cohortIds?: string;
  status?: 'Active' | 'Inactive' | 'On Leave';
  qualifications?: string[];
  specializations?: string[];
  // Persisted personal/location fields used by edit dialog prefill
  dateOfBirth?: string; // maps to `dob` in DB
  country?: string; // ISO 3166-1 alpha-2 code from CountryStateDropdown
  state?: string; // state/province name
}

export interface InstructorFilters {
  role: string[];
  gender: string[];
  experience: [number, number]; // [min, max] years
  status: string[];
  department: string[];
}
