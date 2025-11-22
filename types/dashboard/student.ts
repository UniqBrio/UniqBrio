import { type Achievement } from './achievement';

export type Parent = {
  fullName: string;
  relationship: string;
  contact: string; 
  linkedStudentId: string;

};
export type Student = {
  id: string;
  studentId: string;
  name: string;
  // Name breakdown
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender: string;
  dob: string;
  mobile: string;
  countryCode?: string;
  email: string;
  address: string;
  country?: string; // Country ISO2 code or full name
  stateProvince?: string; // State / Province name
  // Course fields
  courseOfInterestId: string; // Course of Interest ID (replaces activity)
  enrolledCourse?: string; // Enrolled Course ID
  enrolledCourseName?: string; // Enrolled Course Name (replaces program/enrolledCourse)
  category: string;
  courseType?: string;
  courseLevel?: string;
  registrationDate: string; // Registration Date (replaces memberSince)
  courseStartDate: string;
  // Updated to allow multiple selections; maintain backward compatibility (string | string[])
  referredBy: string;
  referringStudentName?: string;
  referringStudentId?: string;
  // Guardian fields
  guardian?: Parent;
  guardianFirstName?: string;
  guardianMiddleName?: string;
  guardianLastName?: string;
  guardianCountryCode?: string;
  communicationPreferences?: {
    enabled: boolean;
    channels: string[];
  };
  cohortId?: string; // Cohort ID (replaces batch/cohort)
  
  // Soft delete fields
  isDeleted?: boolean;
  deletedAt?: string | Date;
  
};
