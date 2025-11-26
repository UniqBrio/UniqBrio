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
  
  if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    );
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio");

        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '20');
        const tenantId = session.tenantId;

        console.log('Fetching notifications for tenant:', tenantId);

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

        // Fetch recent students
        const recentStudents = await Students.find({
          tenantId,
          createdAt: { $gte: twentyFourHoursAgo }
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        // Fetch recent courses
        const recentCourses = await Courses.find({
          tenantId,
          createdAt: { $gte: sevenDaysAgo }
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        // Fetch recent instructors
        const recentInstructors = await Instructors.find({
          tenantId,
          createdAt: { $gte: twentyFourHoursAgo }
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        // Fetch recent non-instructors (staff)
        const recentNonInstructors = await NonInstructors.find({
          tenantId,
          createdAt: { $gte: twentyFourHoursAgo }
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        // Fetch recent payments
        const recentPayments = await Payments.find({
          tenantId,
          createdAt: { $gte: twentyFourHoursAgo }
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        // Fetch recent incomes
        const recentIncomes = await Incomes.find({
          tenantId,
          createdAt: { $gte: twentyFourHoursAgo }
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        // Transform data into notifications format
        const notifications: any[] = [];

        // Add student notifications
        recentStudents.forEach((student: any) => {
          notifications.push({
            id: student._id.toString(),
            type: 'student_added',
            title: 'New Student Enrolled',
            message: `${student.name || student.firstName || 'A new student'} has been enrolled`,
            timestamp: student.createdAt,
            read: false,
            data: student
          });
        });

        // Add course notifications
        recentCourses.forEach((course: any) => {
          notifications.push({
            id: course._id.toString(),
            type: 'course_added',
            title: 'New Course Added',
            message: `${course.name || course.title || course.courseName || 'A new course'} has been created`,
            timestamp: course.createdAt,
            read: false,
            data: course
          });
        });

        // Add instructor notifications
        recentInstructors.forEach((instructor: any) => {
          notifications.push({
            id: instructor._id.toString(),
            type: 'instructor_added',
            title: 'New Instructor Added',
            message: `${instructor.name || instructor.firstName || 'A new instructor'} has joined the team`,
            timestamp: instructor.createdAt,
            read: false,
            data: instructor
          });
        });

        // Add non-instructor staff notifications
        recentNonInstructors.forEach((staff: any) => {
          notifications.push({
            id: staff._id.toString(),
            type: 'staff_added',
            title: 'New Staff Member Added',
            message: `${staff.name || staff.firstName || 'A new staff member'} has joined the team`,
            timestamp: staff.createdAt,
            read: false,
            data: staff
          });
        });

        // Add payment notifications
        recentPayments.forEach((payment: any) => {
          notifications.push({
            id: payment._id.toString(),
            type: 'payment_received',
            title: 'Payment Received',
            message: `Payment of ${payment.currencySymbol || '₹'}${payment.amount || payment.totalAmount || 0} received from ${payment.studentName || payment.name || 'a student'}`,
            timestamp: payment.createdAt,
            read: false,
            data: payment
          });
        });

        // Add income notifications
        recentIncomes.forEach((income: any) => {
          notifications.push({
            id: income._id.toString(),
            type: 'income_added',
            title: 'New Income Recorded',
            message: `Income of ${income.currencySymbol || '₹'}${income.amount || 0} from ${income.source || income.category || 'miscellaneous'}`,
            timestamp: income.createdAt,
            read: false,
            data: income
          });
        });

        // Sort all notifications by timestamp (most recent first)
        notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Limit to requested number
        const limitedNotifications = notifications.slice(0, limit);

        console.log(`Found ${notifications.length} total notifications, returning ${limitedNotifications.length}`);

        return NextResponse.json({
          success: true,
          notifications: limitedNotifications,
          total: notifications.length
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
