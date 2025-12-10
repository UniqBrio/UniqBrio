import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';
import mongoose from 'mongoose';

/**
 * GET /api/dashboard/recent-activities
 * Fetch recent activities from multiple collections for notifications
 */
export async function GET(request: NextRequest) {
  const session = await getUserSession();
  
  // Check if user is authenticated at all
  if (!session) {
    console.error('🚨 SECURITY: Unauthenticated access attempt to notifications');
    return NextResponse.json(
      { error: 'Unauthorized: Not authenticated' },
      { status: 401 }
    );
  }
  
  // If user doesn't have tenantId yet (e.g., Google OAuth user before registration completion)
  // Return empty activities instead of blocking access
  if (!session.tenantId || session.tenantId === 'default' || session.tenantId === 'undefined') {
    console.log('⚠️ User has no tenantId yet (registration incomplete):', session.email);
    return NextResponse.json({
      activities: [],
      message: 'Complete registration to see activities'
    });
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio");

        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '20');
        const tenantId = session.tenantId;

        console.log('==================================================');
        console.log('Fetching notifications for tenant:', tenantId);
        console.log('User email:', session.email);
        console.log('User ID:', session.userId);
        console.log('==================================================');

        // Define schemas with flexible structure
        const Students = mongoose.models.Student || 
          mongoose.model('Student', new mongoose.Schema({}, { strict: false, collection: 'students' }));

        const Courses = mongoose.models.Course || 
          mongoose.model('Course', new mongoose.Schema({}, { strict: false, collection: 'courses' }));

        const Instructors = mongoose.models.Instructor || 
          mongoose.model('Instructor', new mongoose.Schema({}, { strict: false, collection: 'instructors' }));

        const NonInstructors = mongoose.models.NonInstructor || 
          mongoose.model('NonInstructor', new mongoose.Schema({}, { strict: false, collection: 'non_instructors' }));

        const Payments = mongoose.models.Payment || 
          mongoose.model('Payment', new mongoose.Schema({}, { strict: false, collection: 'payments' }));

        const Incomes = mongoose.models.Income || 
          mongoose.model('Income', new mongoose.Schema({}, { strict: false, collection: 'incomes' }));

        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        console.log('Query filters:', {
          tenantId,
          tenantIdType: typeof tenantId,
          twentyFourHoursAgo,
          sevenDaysAgo
        });

        // Ensure tenantId is a string for strict comparison
        const strictTenantId = String(tenantId);

        // Fetch recent students - with strict tenantId matching
        const recentStudents = await Students.find({
          tenantId: strictTenantId,
          createdAt: { $gte: twentyFourHoursAgo }
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        console.log(`Found ${recentStudents.length} recent students for tenant ${tenantId}`);
        recentStudents.forEach((s: any, i: number) => {
          console.log(`  Student ${i + 1}: tenantId=${s.tenantId}, name=${s.name || s.firstName}, createdAt=${s.createdAt}`);
        });

        // Fetch recent courses - with strict tenantId matching
        const recentCourses = await Courses.find({
          tenantId: strictTenantId,
          createdAt: { $gte: sevenDaysAgo }
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        console.log(`Found ${recentCourses.length} recent courses for tenant ${tenantId}`);
        recentCourses.forEach((c: any, i: number) => {
          console.log(`  Course ${i + 1}: tenantId=${c.tenantId}, name=${c.name || c.title}, createdAt=${c.createdAt}`);
        });

        // Fetch recent instructors - with strict tenantId matching
        const recentInstructors = await Instructors.find({
          tenantId: strictTenantId,
          createdAt: { $gte: twentyFourHoursAgo }
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        console.log(`Found ${recentInstructors.length} recent instructors for tenant ${tenantId}`);
        recentInstructors.forEach((i: any, idx: number) => {
          console.log(`  Instructor ${idx + 1}: tenantId=${i.tenantId}, name=${i.name || i.firstName}, createdAt=${i.createdAt}`);
        });

        // Fetch recent non-instructors (staff) - with strict tenantId matching
        const recentNonInstructors = await NonInstructors.find({
          tenantId: strictTenantId,
          createdAt: { $gte: twentyFourHoursAgo }
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        console.log(`Found ${recentNonInstructors.length} recent non-instructors for tenant ${tenantId}`);
        recentNonInstructors.forEach((ni: any, i: number) => {
          console.log(`  Non-Instructor ${i + 1}: tenantId=${ni.tenantId}, name=${ni.name || ni.firstName}, createdAt=${ni.createdAt}`);
        });

        // Fetch recent payments - with strict tenantId matching
        const recentPayments = await Payments.find({
          tenantId: strictTenantId,
          createdAt: { $gte: twentyFourHoursAgo }
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        console.log(`Found ${recentPayments.length} recent payments for tenant ${tenantId}`);
        recentPayments.forEach((p: any, i: number) => {
          console.log(`  Payment ${i + 1}: tenantId=${p.tenantId}, amount=${p.amount}, student=${p.studentName}, createdAt=${p.createdAt}`);
        });

        // Fetch recent incomes - with strict tenantId matching
        const recentIncomes = await Incomes.find({
          tenantId: strictTenantId,
          createdAt: { $gte: twentyFourHoursAgo }
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        console.log(`Found ${recentIncomes.length} recent incomes for tenant ${tenantId}`);
        recentIncomes.forEach((inc: any, i: number) => {
          console.log(`  Income ${i + 1}: tenantId=${inc.tenantId}, amount=${inc.amount}, source=${inc.source}, createdAt=${inc.createdAt}`);
        });

        // Transform data into notifications format
        const notifications: any[] = [];

        // Add student notifications - verify tenantId with strict equality
        recentStudents.forEach((student: any) => {
          if (String(student.tenantId) === strictTenantId) {
            notifications.push({
              id: student._id.toString(),
              type: 'student_added',
              title: 'New Student Enrolled',
              message: `${student.name || student.firstName || 'A new student'} has been enrolled`,
              timestamp: student.createdAt,
              read: false,
              data: student
            });
          } else {
            console.warn(`⚠️ Student tenantId mismatch! Expected: ${tenantId}, Got: ${student.tenantId}, Name: ${student.name}`);
          }
        });

        // Add course notifications - verify tenantId with strict equality
        recentCourses.forEach((course: any) => {
          if (String(course.tenantId) === strictTenantId) {
            notifications.push({
              id: course._id.toString(),
              type: 'course_added',
              title: 'New Course Added',
              message: `${course.name || course.title || course.courseName || 'A new course'} has been created`,
              timestamp: course.createdAt,
              read: false,
              data: course
            });
          } else {
            console.warn(`⚠️ Course tenantId mismatch! Expected: ${tenantId}, Got: ${course.tenantId}, Name: ${course.name}`);
          }
        });

        // Add instructor notifications - verify tenantId with strict equality
        recentInstructors.forEach((instructor: any) => {
          if (String(instructor.tenantId) === strictTenantId) {
            notifications.push({
              id: instructor._id.toString(),
              type: 'instructor_added',
              title: 'New Instructor Added',
              message: `${instructor.name || instructor.firstName || 'A new instructor'} has joined the team`,
              timestamp: instructor.createdAt,
              read: false,
              data: instructor
            });
          } else {
            console.warn(`⚠️ Instructor tenantId mismatch! Expected: ${tenantId}, Got: ${instructor.tenantId}, Name: ${instructor.name}`);
          }
        });

        // Add non-instructor staff notifications - verify tenantId with strict equality
        recentNonInstructors.forEach((staff: any) => {
          if (String(staff.tenantId) === strictTenantId) {
            notifications.push({
              id: staff._id.toString(),
              type: 'staff_added',
              title: 'New Staff Member Added',
              message: `${staff.name || staff.firstName || 'A new staff member'} has joined the team`,
              timestamp: staff.createdAt,
              read: false,
              data: staff
            });
          } else {
            console.warn(`⚠️ Staff tenantId mismatch! Expected: ${tenantId}, Got: ${staff.tenantId}, Name: ${staff.name}`);
          }
        });

        // Add payment notifications - verify tenantId with strict equality
        recentPayments.forEach((payment: any) => {
          if (String(payment.tenantId) === strictTenantId) {
            notifications.push({
              id: payment._id.toString(),
              type: 'payment_received',
              title: 'Payment Received',
              message: `Payment of ${payment.currencySymbol || '₹'}${payment.amount || payment.totalAmount || 0} received from ${payment.studentName || payment.name || 'a student'}`,
              timestamp: payment.createdAt,
              read: false,
              data: payment
            });
          } else {
            console.warn(`⚠️ Payment tenantId mismatch! Expected: ${tenantId}, Got: ${payment.tenantId}, Student: ${payment.studentName}`);
          }
        });

        // Add income notifications - verify tenantId with strict equality
        recentIncomes.forEach((income: any) => {
          if (String(income.tenantId) === strictTenantId) {
            notifications.push({
              id: income._id.toString(),
              type: 'income_added',
              title: 'New Income Recorded',
              message: `Income of ${income.currencySymbol || '₹'}${income.amount || 0} from ${income.source || income.category || 'miscellaneous'}`,
              timestamp: income.createdAt,
              read: false,
              data: income
            });
          } else {
            console.warn(`⚠️ Income tenantId mismatch! Expected: ${tenantId}, Got: ${income.tenantId}, Source: ${income.source}`);
          }
        });

        // Sort all notifications by timestamp (most recent first)
        notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // FINAL SAFETY CHECK: Filter out any notifications that might have wrong tenantId
        // This is a triple-layer protection to ensure absolute tenant isolation
        const safeNotifications = notifications.filter((n: any) => {
          // Check if the notification's data has the correct tenantId
          if (n.data && n.data.tenantId && String(n.data.tenantId) !== strictTenantId) {
            console.error(`🚨 BLOCKED: Notification with wrong tenantId! Expected: ${strictTenantId}, Got: ${n.data.tenantId}, Type: ${n.type}, ID: ${n.id}`);
            return false;
          }
          return true;
        });

        // Remove sensitive data field before sending to client
        const sanitizedNotifications = safeNotifications.map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          timestamp: n.timestamp,
          read: n.read
        }));

        // Limit to requested number
        const limitedNotifications = sanitizedNotifications.slice(0, limit);

        console.log(`Found ${notifications.length} total notifications, filtered to ${safeNotifications.length} safe notifications, returning ${limitedNotifications.length}`);

        // Log if any were blocked
        if (notifications.length !== safeNotifications.length) {
          console.error(`🚨 SECURITY: Blocked ${notifications.length - safeNotifications.length} cross-tenant notifications!`);
        }

        return NextResponse.json({
          success: true,
          notifications: limitedNotifications,
          total: safeNotifications.length
        });
      } catch (error: any) {
        console.error('Error fetching recent activities:', error);
        return NextResponse.json(
          { error: 'Failed to fetch recent activities', details: error.message },
          { status: 500 }
        );
      }
    }
  );
}
