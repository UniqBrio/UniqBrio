/**
 * Script to reset a user's registration while keeping their login credentials
 * This allows them to login but forces re-registration
 */

import { dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';
import UserModel from '@/models/User';
import RegistrationModel from '@/models/Registration';
import KycSubmissionModel from '@/models/KycSubmission';
import KycReviewModel from '@/models/KycReview';
import AdminPaymentRecordModel from '@/models/AdminPaymentRecord';
import InvoiceModel from '@/models/Invoice';

// Dashboard models for tenant data cleanup
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
import InstructorModel from '@/models/dashboard/staff/Instructor';
import InstructorAttendanceModel from '@/models/dashboard/staff/InstructorAttendance';
import InstructorAttendanceDraftModel from '@/models/dashboard/staff/InstructorAttendanceDraft';
import InstructorDraftModel from '@/models/dashboard/staff/InstructorDraft';
import NonInstructorModel from '@/models/dashboard/staff/NonInstructor';
import NonInstructorAttendanceModel from '@/models/dashboard/staff/NonInstructorAttendance';
import NonInstructorAttendanceDraftModel from '@/models/dashboard/staff/NonInstructorAttendanceDraft';
import NonInstructorDraftModel from '@/models/dashboard/staff/NonInstructorDraft';
import StudentModel from '@/models/dashboard/student/Student';
import StudentAttendanceModel from '@/models/dashboard/student/StudentAttendance';
import StudentAttendanceDraftModel from '@/models/dashboard/student/StudentAttendanceDraft';
import StudentDraftModel from '@/models/dashboard/student/StudentDraft';
import AchievementModel from '@/models/dashboard/student/Achievement';
import PaymentModel from '@/models/dashboard/payments/Payment';
import PaymentTransactionModel from '@/models/dashboard/payments/PaymentTransaction';
import MonthlySubscriptionModel from '@/models/dashboard/payments/MonthlySubscription';
import CounterModel from '@/models/dashboard/payments/Counter';
import EventModel from '@/models/dashboard/events/Event';
import AuditLogModel from '@/models/AuditLog';
import WhatsAppLogModel from '@/models/dashboard/WhatsAppLog';

const USER_EMAIL = 'shyamsivu2003@gmail.com';

interface DeletionStats {
  collection: string;
  count: number;
  success: boolean;
  error?: string;
}

async function resetUserRegistration() {
  console.log('🔄 RESETTING USER REGISTRATION');
  console.log(`📧 Email: ${USER_EMAIL}`);
  console.log('⚠️  This will delete registration data but keep login credentials\n');

  const stats: DeletionStats[] = [];

  try {
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
    console.log(`   - Registration Complete: ${user.registrationComplete}\n`);

    const userId = user.userId;
    const academyId = user.academyId;
    const tenantId = academyId;

    // Step 1: Delete registration data
    console.log('📌 Step 1: Deleting registration data...');
    
    if (academyId || userId) {
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

      try {
        const kycResult = await KycSubmissionModel.deleteMany({ 
          $or: [{ academyId }, { userId }] 
        });
        stats.push({ collection: 'KYC Submission', count: kycResult.deletedCount, success: true });
        console.log(`   ✓ KYC Submissions: ${kycResult.deletedCount} records deleted`);
      } catch (error: any) {
        stats.push({ collection: 'KYC Submission', count: 0, success: false, error: error.message });
        console.log(`   ✗ KYC Submissions: Error - ${error.message}`);
      }

      try {
        const kycReviewResult = await KycReviewModel.deleteMany({ 
          $or: [{ academyId }, { userId }] 
        });
        stats.push({ collection: 'KYC Review', count: kycReviewResult.deletedCount, success: true });
        console.log(`   ✓ KYC Reviews: ${kycReviewResult.deletedCount} records deleted`);
      } catch (error: any) {
        stats.push({ collection: 'KYC Review', count: 0, success: false, error: error.message });
        console.log(`   ✗ KYC Reviews: Error - ${error.message}`);
      }

      try {
        const adminPaymentResult = await AdminPaymentRecordModel.deleteMany({ academyId });
        stats.push({ collection: 'Admin Payment Record', count: adminPaymentResult.deletedCount, success: true });
        console.log(`   ✓ Admin Payment Records: ${adminPaymentResult.deletedCount} records deleted`);
      } catch (error: any) {
        stats.push({ collection: 'Admin Payment Record', count: 0, success: false, error: error.message });
        console.log(`   ✗ Admin Payment Records: Error - ${error.message}`);
      }

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
    }

    // Step 2: Delete tenant-specific dashboard data
    if (tenantId) {
      console.log('\n📌 Step 2: Deleting tenant-specific data...');
      console.log(`   Using tenantId: ${tenantId}`);

      const dashboardModels = [
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
    }

    // Step 3: Reset user fields
    console.log('\n📌 Step 3: Resetting user account fields...');
    
    try {
      const updateResult = await UserModel.updateOne(
        { email: USER_EMAIL },
        {
          $set: {
            registrationComplete: false,
            kycStatus: 'pending'
          },
          $unset: {
            userId: '',
            academyId: '',
            tenantId: ''
          }
        }
      );
      
      if (updateResult.modifiedCount > 0) {
        console.log(`   ✓ User fields reset successfully`);
        console.log(`   - registrationComplete: false`);
        console.log(`   - kycStatus: pending`);
        console.log(`   - userId, academyId, tenantId: removed`);
        stats.push({ collection: 'User Fields Reset', count: 1, success: true });
      } else {
        console.log(`   ⚠️  User fields already reset or no changes needed`);
        stats.push({ collection: 'User Fields Reset', count: 0, success: true });
      }
    } catch (error: any) {
      stats.push({ collection: 'User Fields Reset', count: 0, success: false, error: error.message });
      console.log(`   ✗ User Fields Reset: Error - ${error.message}`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESET SUMMARY');
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
    console.log(`📝 Total records deleted/updated: ${totalDeleted}`);

    console.log('\n📋 Detailed breakdown:');
    console.log('-'.repeat(60));
    stats.forEach(stat => {
      const status = stat.success ? '✓' : '✗';
      const info = stat.success ? `${stat.count} deleted/updated` : `Failed: ${stat.error}`;
      console.log(`   ${status} ${stat.collection.padEnd(35)} ${info}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('🎉 REGISTRATION RESET COMPLETED');
    console.log('='.repeat(60));
    console.log('\n✅ User can now login but must complete registration again');

  } catch (error: any) {
    console.error('\n💥 FATAL ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

resetUserRegistration()
  .then(() => {
    console.log('\n✅ Script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script execution failed:', error);
    process.exit(1);
  });
