// Export all models from a single entry point
export { default as User } from './User';
export { default as Course } from './Course';
export { default as Cohort } from './Cohort';
export { default as Schedule } from './Schedule';
export { default as Enrollment } from './Enrollment';
export { default as HelpTicket } from './HelpTicket';
export { default as HelpChat } from './HelpChat';

// Export interfaces for type checking
export type { IUser, IUserPreferences } from './User';
export type { ICourse } from './Course';
export type { ICohort } from './Cohort';
export type { ISchedule, IRecurringPattern } from './Schedule';
export type { IEnrollment, ILessonProgress, IModuleProgress, IAssignment } from './Enrollment';
export type { IHelpTicket } from './HelpTicket';
export type { IHelpChat, IChatMessage } from './HelpChat';

// Database connection
export { default as connectDB } from '../../lib/mongodb';
