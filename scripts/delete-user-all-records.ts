/**
 * Script to delete all records associated with a specific user/academy
 * WARNING: This is a destructive operation and cannot be undone!
 */

import { dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Auth database models
import UserModel from '@/models/User';
import RegistrationModel from '@/models/Registration';
import KycSubmissionModel from '@/models/KycSubmission';

// Dashboard database models
import DashboardUserModel from '@/models/dashboard/User';
import CourseModel from '@/models/dashboard/Course';
import CohortModel from '@/models/dashboard/Cohort';
import EnrollmentModel from '@/models/dashboard/Enrollment';
import ScheduleModel from '@/models/dashboard/Schedule';
import DraftModel from '@/models/dashboard/Draft';
import TaskModel from '@/models/dashboard/Task';
import TaskDraftModel from '@/models/dashboard/TaskDraft';
import NotificationModel from '@/models/dashboard/Notification';
import HelpChatModel from '@/models/dashboard/HelpChat';
import HelpTicketModel from '@/models/dashboard/HelpTicket';

// Staff models
import InstructorModel from '@/models/dashboard/staff/Instructor';
import InstructorAttendanceModel from '@/models/dashboard/staff/InstructorAttendance';
import InstructorAttendanceDraftModel from '@/models/dashboard/staff/InstructorAttendanceDraft';
import InstructorDraftModel from '@/models/dashboard/staff/InstructorDraft';
import NonInstructorModel from '@/models/dashboard/staff/NonInstructor';
import NonInstructorAttendanceModel from '@/models/dashboard/staff/NonInstructorAttendance';
import NonInstructorAttendanceDraftModel from '@/models/dashboard/staff/NonInstructorAttendanceDraft';
import NonInstructorDraftModel from '@/models/dashboard/staff/NonInstructorDraft';

// Student models
import StudentModel from '@/models/dashboard/student/Student';
import StudentAttendanceModel from '@/models/dashboard/student/StudentAttendance';
import StudentAttendanceDraftModel from '@/models/dashboard/student/StudentAttendanceDraft';
import StudentDraftModel from '@/models/dashboard/student/StudentDraft';
import AchievementModel from '@/models/dashboard/student/Achievement';

// Payment models
import PaymentModel from '@/models/dashboard/payments/Payment';
import PaymentTransactionModel from '@/models/dashboard/payments/PaymentTransaction';
import MonthlySubscriptionModel from '@/models/dashboard/payments/MonthlySubscription';
import CounterModel from '@/models/dashboard/payments/Counter';

// Event models
import EventModel from '@/models/dashboard/events/Event';

// Other models
import AuditLogModel from '@/models/AuditLog';
import WhatsAppLogModel from '@/models/dashboard/WhatsAppLog';
import CookiePreferenceModel from '@/models/CookiePreference';
import InvoiceModel from '@/models/Invoice';
import CurrencyHistoryModel from '@/models/CurrencyHistory';
import CurrencyConversionLogModel from '@/models/CurrencyConversionLog';
import AdminPaymentRecordModel from '@/models/AdminPaymentRecord';
import AnnouncementModel from '@/models/Announcement';
import DemoBookingModel from '@/models/DemoBooking';
import SupportTicketModel from '@/models/SupportTicket';
import FeatureNotificationModel from '@/models/FeatureNotification';
import KycReviewModel from '@/models/KycReview';
import SessionModel from '@/models/Session';
import CourseSimpleModel from '@/models/Course'; // Simple course model in root

const USER_EMAIL = 'shyamsivu2003@gmail.com';

interface DeletionStats {
  collection: string;
  count: number;
  success: boolean;
  error?: string;
}

async function deleteAllUserRecords() {
  console.log('🚨 STARTING USER DELETION PROCESS');
  console.log(`📧 Email: ${USER_EMAIL}`);
  console.log('⚠️  WARNING: This will permanently delete all data for this user!\n');

  const stats: DeletionStats[] = [];

  try {
    // Step 1: Connect to dashboard database and find user
    console.log('📌 Step 1: Connecting to dashboard database...');
    await dbConnect('uniqbrio');
    
    const user = await UserModel.findOne({ email: USER_EMAIL }).lean();
    
    if (!user) {
      console.log('❌ User not found with email:', USER_EMAIL);
      return;
    }

    console.log('✅ User found:');
    console.log(`   - Name: ${user.name}`);
    console.log(`   - User ID: ${user.userId}`);
    console.log(`   - Academy ID: ${user.academyId}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Verified: ${user.verified}`);
    console.log(`   - Registration Complete: ${user.registrationComplete}\n`);

    const userId = user.userId;
    const academyId = user.academyId;
    const tenantId = academyId; // tenantId is same as academyId in multi-tenant system

    if (!academyId || !userId) {
      console.log('⚠️  Warning: User does not have academyId or userId. May be incomplete registration.');
      console.log('   Will only delete user account and related email-based records.\n');
    }

    // Step 2: Delete user from dashboard database
    console.log('📌 Step 2: Deleting user from dashboard database (uniqbrio)...');
    
    // Delete user
    try {
      const userResult = await UserModel.deleteMany({ email: USER_EMAIL });
      stats.push({ collection: 'User (Dashboard)', count: userResult.deletedCount, success: true });
      console.log(`   ✓ User: ${userResult.deletedCount} records deleted`);
    } catch (error: any) {
      stats.push({ collection: 'User (Dashboard)', count: 0, success: false, error: error.message });
      console.log(`   ✗ User: Error - ${error.message}`);
    }

    // Delete registration
    if (academyId) {
      try {
        const regResult = await RegistrationModel.deleteMany({ 
          $or: [{ academyId }, { userId }] 
        });
        stats.push({ collection: 'Registration', count: regResult.deletedCount, success: true });
        console.log(`   ✓ Registration: ${regResult.deletedCount} records deleted`);
      } catch (error: any) {
        stats.push({ collection: 'Registration', count: 0, success: false, error: error.message });
        console.log(`   ✗ Registration: Error - ${error.message}`);
      }
    }

    // Delete KYC submissions
    if (academyId || userId) {
      try {
        const kycResult = await KycSubmissionModel.deleteMany({ 
          $or: [{ academyId }, { userId }] 
        });
        stats.push({ collection: 'KycSubmission', count: kycResult.deletedCount, success: true });
        console.log(`   ✓ KYC Submissions: ${kycResult.deletedCount} records deleted`);
      } catch (error: any) {
        stats.push({ collection: 'KycSubmission', count: 0, success: false, error: error.message });
        console.log(`   ✗ KYC Submissions: Error - ${error.message}`);
      }
    }

    // Delete KYC reviews
    if (academyId || userId) {
      try {
        const kycReviewResult = await KycReviewModel.deleteMany({ 
          $or: [{ academyId }, { userId }] 
        });
        stats.push({ collection: 'KycReview', count: kycReviewResult.deletedCount, success: true });
        console.log(`   ✓ KYC Reviews: ${kycReviewResult.deletedCount} records deleted`);
      } catch (error: any) {
        stats.push({ collection: 'KycReview', count: 0, success: false, error: error.message });
        console.log(`   ✗ KYC Reviews: Error - ${error.message}`);
      }
    }

    // Delete sessions
    try {
      const sessionResult = await SessionModel.deleteMany({ 
        $or: [{ academyId }, { userId }] 
      });
      stats.push({ collection: 'Session', count: sessionResult.deletedCount, success: true });
      console.log(`   ✓ Sessions: ${sessionResult.deletedCount} records deleted`);
    } catch (error: any) {
      stats.push({ collection: 'Session', count: 0, success: false, error: error.message });
      console.log(`   ✗ Sessions: Error - ${error.message}`);
    }

    // Delete admin payment records
    if (academyId) {
      try {
        const adminPaymentResult = await AdminPaymentRecordModel.deleteMany({ academyId });
        stats.push({ collection: 'Admin Payment Record', count: adminPaymentResult.deletedCount, success: true });
        console.log(`   ✓ Admin Payment Records: ${adminPaymentResult.deletedCount} records deleted`);
      } catch (error: any) {
        stats.push({ collection: 'Admin Payment Record', count: 0, success: false, error: error.message });
        console.log(`   ✗ Admin Payment Records: Error - ${error.message}`);
      }
    }

    // Delete demo bookings
    try {
      const demoResult = await DemoBookingModel.deleteMany({ email: USER_EMAIL });
      stats.push({ collection: 'Demo Booking', count: demoResult.deletedCount, success: true });
      console.log(`   ✓ Demo Bookings: ${demoResult.deletedCount} records deleted`);
    } catch (error: any) {
      stats.push({ collection: 'Demo Booking', count: 0, success: false, error: error.message });
      console.log(`   ✗ Demo Bookings: Error - ${error.message}`);
    }

    // Delete support tickets
    try {
      const supportResult = await SupportTicketModel.deleteMany({ email: USER_EMAIL });
      stats.push({ collection: 'Support Ticket', count: supportResult.deletedCount, success: true });
      console.log(`   ✓ Support Tickets: ${supportResult.deletedCount} records deleted`);
    } catch (error: any) {
      stats.push({ collection: 'Support Ticket', count: 0, success: false, error: error.message });
      console.log(`   ✗ Support Tickets: Error - ${error.message}`);
    }

    // Delete simple course records
    if (academyId) {
      try {
        const courseSimpleResult = await CourseSimpleModel.deleteMany({ academyId });
        stats.push({ collection: 'Course (Simple)', count: courseSimpleResult.deletedCount, success: true });
        console.log(`   ✓ Courses (Simple): ${courseSimpleResult.deletedCount} records deleted`);
      } catch (error: any) {
        stats.push({ collection: 'Course (Simple)', count: 0, success: false, error: error.message });
        console.log(`   ✗ Courses (Simple): Error - ${error.message}`);
      }
    }

    // If no tenantId, skip dashboard deletion
    if (!tenantId) {
      console.log('\n⚠️  No tenantId found - skipping tenant-specific data deletion');
      console.log('   Only user account and email-based records were processed.');
      
      // Jump to summary
      console.log('\n' + '='.repeat(60));
      console.log('📊 DELETION SUMMARY');
      console.log('='.repeat(60));

      let totalDeleted = 0;
      let successCount = 0;
      let failureCount = 0;

      stats.forEach(stat => {
        if (stat.success) {
          totalDeleted += stat.count;
          successCount++;
        } else {
          failureCount++;
        }
      });

      console.log(`\n✅ Successful operations: ${successCount}`);
      console.log(`❌ Failed operations: ${failureCount}`);
      console.log(`📝 Total records deleted: ${totalDeleted}`);

      console.log('\n📋 Detailed breakdown:');
      console.log('-'.repeat(60));
      stats.forEach(stat => {
        const status = stat.success ? '✓' : '✗';
        const info = stat.success ? `${stat.count} deleted` : `Failed: ${stat.error}`;
        console.log(`   ${status} ${stat.collection.padEnd(35)} ${info}`);
      });

      console.log('\n' + '='.repeat(60));
      console.log('🎉 DELETION PROCESS COMPLETED');
      console.log('='.repeat(60));
      return;
    }

    // Step 3: Switch to dashboard database
    console.log('\n📌 Step 3: Connecting to dashboard database (uniqbrio)...');
    await mongoose.disconnect();
    await dbConnect('uniqbrio');

    if (!tenantId) {
      console.log('⚠️  No tenantId found, skipping dashboard data deletion');
      return;
    }

    console.log(`   Using tenantId: ${tenantId}`);

    // Step 4: Delete all dashboard data by tenantId
    console.log('\n📌 Step 4: Deleting dashboard data...');

    const dashboardModels = [
      { name: 'Dashboard User', model: DashboardUserModel },
      { name: 'Course', model: CourseModel },
      { name: 'Cohort', model: CohortModel },
      { name: 'Enrollment', model: EnrollmentModel },
      { name: 'Schedule', model: ScheduleModel },
      { name: 'Draft', model: DraftModel },
      { name: 'Task', model: TaskModel },
      { name: 'Task Draft', model: TaskDraftModel },
      { name: 'Notification', model: NotificationModel },
      { name: 'Help Chat', model: HelpChatModel },
      { name: 'Help Ticket', model: HelpTicketModel },
      { name: 'Instructor', model: InstructorModel },
      { name: 'Instructor Attendance', model: InstructorAttendanceModel },
      { name: 'Instructor Attendance Draft', model: InstructorAttendanceDraftModel },
      { name: 'Instructor Draft', model: InstructorDraftModel },
      { name: 'Non-Instructor', model: NonInstructorModel },
      { name: 'Non-Instructor Attendance', model: NonInstructorAttendanceModel },
      { name: 'Non-Instructor Attendance Draft', model: NonInstructorAttendanceDraftModel },
      { name: 'Non-Instructor Draft', model: NonInstructorDraftModel },
      { name: 'Student', model: StudentModel },
      { name: 'Student Attendance', model: StudentAttendanceModel },
      { name: 'Student Attendance Draft', model: StudentAttendanceDraftModel },
      { name: 'Student Draft', model: StudentDraftModel },
      { name: 'Achievement', model: AchievementModel },
      { name: 'Payment', model: PaymentModel },
      { name: 'Payment Transaction', model: PaymentTransactionModel },
      { name: 'Monthly Subscription', model: MonthlySubscriptionModel },
      { name: 'Counter', model: CounterModel },
      { name: 'Event', model: EventModel },
      { name: 'Audit Log', model: AuditLogModel },
      { name: 'WhatsApp Log', model: WhatsAppLogModel },
    ];

    for (const { name, model } of dashboardModels) {
      try {
        const result = await (model as any).deleteMany({ tenantId });
        stats.push({ collection: name, count: result.deletedCount, success: true });
        console.log(`   ✓ ${name}: ${result.deletedCount} records deleted`);
      } catch (error: any) {
        stats.push({ collection: name, count: 0, success: false, error: error.message });
        console.log(`   ✗ ${name}: Error - ${error.message}`);
      }
    }

    // Step 5: Delete other models that might not use tenantId
    console.log('\n📌 Step 5: Deleting additional records by academyId/userId...');

    // Cookie preferences
    try {
      const cookieResult = await CookiePreferenceModel.deleteMany({ userId });
      stats.push({ collection: 'Cookie Preference', count: cookieResult.deletedCount, success: true });
      console.log(`   ✓ Cookie Preferences: ${cookieResult.deletedCount} records deleted`);
    } catch (error: any) {
      stats.push({ collection: 'Cookie Preference', count: 0, success: false, error: error.message });
      console.log(`   ✗ Cookie Preferences: Error - ${error.message}`);
    }

    // Invoices
    try {
      const invoiceResult = await InvoiceModel.deleteMany({ 
        $or: [{ academyId }, { userId }] 
      });
      stats.push({ collection: 'Invoice', count: invoiceResult.deletedCount, success: true });
      console.log(`   ✓ Invoices: ${invoiceResult.deletedCount} records deleted`);
    } catch (error: any) {
      stats.push({ collection: 'Invoice', count: 0, success: false, error: error.message });
      console.log(`   ✗ Invoices: Error - ${error.message}`);
    }

    // Currency related
    try {
      const currencyResult = await CurrencyHistoryModel.deleteMany({ academyId });
      stats.push({ collection: 'Currency History', count: currencyResult.deletedCount, success: true });
      console.log(`   ✓ Currency History: ${currencyResult.deletedCount} records deleted`);
    } catch (error: any) {
      stats.push({ collection: 'Currency History', count: 0, success: false, error: error.message });
      console.log(`   ✗ Currency History: Error - ${error.message}`);
    }

    try {
      const conversionResult = await CurrencyConversionLogModel.deleteMany({ academyId });
      stats.push({ collection: 'Currency Conversion Log', count: conversionResult.deletedCount, success: true });
      console.log(`   ✓ Currency Conversion Log: ${conversionResult.deletedCount} records deleted`);
    } catch (error: any) {
      stats.push({ collection: 'Currency Conversion Log', count: 0, success: false, error: error.message });
      console.log(`   ✗ Currency Conversion Log: Error - ${error.message}`);
    }

    // Step 6: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DELETION SUMMARY');
    console.log('='.repeat(60));

    let totalDeleted = 0;
    let successCount = 0;
    let failureCount = 0;

    stats.forEach(stat => {
      if (stat.success) {
        totalDeleted += stat.count;
        successCount++;
      } else {
        failureCount++;
      }
    });

    console.log(`\n✅ Successful operations: ${successCount}`);
    console.log(`❌ Failed operations: ${failureCount}`);
    console.log(`📝 Total records deleted: ${totalDeleted}`);

    console.log('\n📋 Detailed breakdown:');
    console.log('-'.repeat(60));
    stats.forEach(stat => {
      const status = stat.success ? '✓' : '✗';
      const info = stat.success ? `${stat.count} deleted` : `Failed: ${stat.error}`;
      console.log(`   ${status} ${stat.collection.padEnd(35)} ${info}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('🎉 DELETION PROCESS COMPLETED');
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('\n💥 FATAL ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Execute the script
deleteAllUserRecords()
  .then(() => {
    console.log('\n✅ Script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script execution failed:', error);
    process.exit(1);
  });
