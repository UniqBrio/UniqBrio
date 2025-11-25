/**
 * Tenant Model Initializer
 * This file ensures all Mongoose models have the tenant plugin applied
 * Import this file in your application bootstrap to initialize tenant support
 */

import { tenantPlugin } from '@/lib/tenant/tenant-plugin';
import mongoose from 'mongoose';

// Dashboard models
import User from '@/models/dashboard/User';
import Course from '@/models/dashboard/Course';
import Cohort from '@/models/dashboard/Cohort';
import Enrollment from '@/models/dashboard/Enrollment';
import Schedule from '@/models/dashboard/Schedule';
import Draft from '@/models/dashboard/Draft';
import Task from '@/models/dashboard/Task';
import TaskDraft from '@/models/dashboard/TaskDraft';
import Notification from '@/models/dashboard/Notification';
import HelpChat from '@/models/dashboard/HelpChat';
import HelpTicket from '@/models/dashboard/HelpTicket';

// Staff models
import Instructor from '@/models/dashboard/staff/Instructor';
import InstructorAttendance from '@/models/dashboard/staff/InstructorAttendance';
import InstructorAttendanceDraft from '@/models/dashboard/staff/InstructorAttendanceDraft';
import InstructorDraft from '@/models/dashboard/staff/InstructorDraft';
import NonInstructor from '@/models/dashboard/staff/NonInstructor';
import NonInstructorAttendance from '@/models/dashboard/staff/NonInstructorAttendance';
import NonInstructorAttendanceDraft from '@/models/dashboard/staff/NonInstructorAttendanceDraft';
import NonInstructorDraft from '@/models/dashboard/staff/NonInstructorDraft';

// Student models
import Student from '@/models/dashboard/student/Student';
import StudentAttendance from '@/models/dashboard/student/StudentAttendance';
import StudentAttendanceDraft from '@/models/dashboard/student/StudentAttendanceDraft';
import StudentDraft from '@/models/dashboard/student/StudentDraft';
import Achievement from '@/models/dashboard/student/Achievement';

// Payment models
import Payment from '@/models/dashboard/payments/Payment';
import PaymentRecord from '@/models/dashboard/payments/PaymentRecord';
import PaymentTransaction from '@/models/dashboard/payments/PaymentTransaction';
import MonthlySubscription from '@/models/dashboard/payments/MonthlySubscription';
import Counter from '@/models/dashboard/payments/Counter';

// Event models
import Event from '@/models/dashboard/events/Event';

/**
 * Apply tenant plugin to a model's schema if not already applied
 */
function ensureTenantPlugin(model: any, modelName: string) {
  try {
    if (model && model.schema && !model.schema.path('tenantId')) {
      console.log(`[TenantInit] Applying tenant plugin to ${modelName}`);
      model.schema.plugin(tenantPlugin);
    }
  } catch (error) {
    console.error(`[TenantInit] Error applying tenant plugin to ${modelName}:`, error);
  }
}

/**
 * Initialize tenant support for all models
 * Call this function once during application startup
 */
export function initializeTenantModels() {
  console.log('[TenantInit] Initializing tenant support for all models...');

  // Dashboard models
  ensureTenantPlugin(User, 'User');
  ensureTenantPlugin(Course, 'Course');
  ensureTenantPlugin(Cohort, 'Cohort');
  ensureTenantPlugin(Enrollment, 'Enrollment');
  ensureTenantPlugin(Schedule, 'Schedule');
  ensureTenantPlugin(Draft, 'Draft');
  ensureTenantPlugin(Task, 'Task');
  ensureTenantPlugin(TaskDraft, 'TaskDraft');
  ensureTenantPlugin(Notification, 'Notification');
  ensureTenantPlugin(HelpChat, 'HelpChat');
  ensureTenantPlugin(HelpTicket, 'HelpTicket');

  // Staff models
  ensureTenantPlugin(Instructor, 'Instructor');
  ensureTenantPlugin(InstructorAttendance, 'InstructorAttendance');
  ensureTenantPlugin(InstructorAttendanceDraft, 'InstructorAttendanceDraft');
  ensureTenantPlugin(InstructorDraft, 'InstructorDraft');
  ensureTenantPlugin(NonInstructor, 'NonInstructor');
  ensureTenantPlugin(NonInstructorAttendance, 'NonInstructorAttendance');
  ensureTenantPlugin(NonInstructorAttendanceDraft, 'NonInstructorAttendanceDraft');
  ensureTenantPlugin(NonInstructorDraft, 'NonInstructorDraft');

  // Student models
  ensureTenantPlugin(Student, 'Student');
  ensureTenantPlugin(StudentAttendance, 'StudentAttendance');
  ensureTenantPlugin(StudentAttendanceDraft, 'StudentAttendanceDraft');
  ensureTenantPlugin(StudentDraft, 'StudentDraft');
  ensureTenantPlugin(Achievement, 'Achievement');

  // Payment models
  ensureTenantPlugin(Payment, 'Payment');
  ensureTenantPlugin(PaymentRecord, 'PaymentRecord');
  ensureTenantPlugin(PaymentTransaction, 'PaymentTransaction');
  ensureTenantPlugin(MonthlySubscription, 'MonthlySubscription');
  ensureTenantPlugin(Counter, 'Counter');

  // Event models
  ensureTenantPlugin(Event, 'Event');

  console.log('[TenantInit] Tenant support initialization complete');
}

/**
 * Apply tenant plugin to remaining staff models (cohort, course, schedule, student in staff folder)
 */
export function initializeStaffSubModels() {
  try {
    const StaffCohort = mongoose.models.StaffCohort;
    const StaffCourse = mongoose.models.StaffCourse;
    const StaffSchedule = mongoose.models.StaffSchedule;
    const StaffStudent = mongoose.models.StaffStudent;

    if (StaffCohort) ensureTenantPlugin(StaffCohort, 'StaffCohort');
    if (StaffCourse) ensureTenantPlugin(StaffCourse, 'StaffCourse');
    if (StaffSchedule) ensureTenantPlugin(StaffSchedule, 'StaffSchedule');
    if (StaffStudent) ensureTenantPlugin(StaffStudent, 'StaffStudent');
  } catch (error) {
    console.error('[TenantInit] Error initializing staff sub-models:', error);
  }
}

// Auto-initialize on import
if (typeof window === 'undefined') {
  // Only run on server-side
  initializeTenantModels();
  initializeStaffSubModels();
}
