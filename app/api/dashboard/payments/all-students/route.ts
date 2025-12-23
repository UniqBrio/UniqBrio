import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Payment from '@/models/dashboard/payments/Payment';
import Student from '@/models/dashboard/student/Student';
import mongoose from 'mongoose';
import { fetchMultipleCoursePaymentDetails } from '@/lib/dashboard/payments/course-payment-server';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

// Cache for 30 seconds
export const dynamic = 'force-dynamic';
export const revalidate = 30;

// Define the Course schema to access course fees
const courseSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  courseId: String,
  price: Number,
  registrationFee: Number,
}, {
  collection: 'courses',
  strict: false
});

const Course = mongoose.models.CourseForAllStudents || 
  mongoose.model('CourseForAllStudents', courseSchema);

/**
 * Get all students with their payment information
 * If a student doesn't have a payment record, show them with default values
 * GET /api/payments/all-students
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

        // Get all active students with explicit tenantId filter
        const students = await Student.find({ isDeleted: { $ne: true }, tenantId: session.tenantId }).lean().exec();
        
        // Get all existing payment records with explicit tenantId filter
        const payments = await Payment.find({ tenantId: session.tenantId }).lean().exec();
        
        console.log(`[all-students] Fetched ${payments.length} payments from DB`);
        
        // Debug: Check what _id looks like for STU0018
        const testPayment = payments.find((p: any) => p.studentId === 'STU0018');
        if (testPayment) {
          console.log('[all-students] Raw payment from DB (STU0018):', {
            _id: testPayment._id,
            _idType: typeof testPayment._id,
            _idConstructor: testPayment._id?.constructor?.name,
            _idString: String(testPayment._id),
            _idToString: testPayment._id?.toString?.(),
            studentId: testPayment.studentId,
            hasId: 'id' in testPayment,
            id: (testPayment as any).id,
            allKeys: Object.keys(testPayment)
          });
        }
    
    // Get all cohorts to fetch course IDs and cohort names
    const allCohortIds = Array.from(new Set([
      ...students.map((s: any) => s.cohortId).filter(Boolean),
      ...payments.map((p: any) => p.cohortId).filter(Boolean)
    ]));
    const Cohort = mongoose.connection.collection('cohorts');
    
    // Try different ways to match cohorts since data structure might vary
    const cohorts = await Cohort.find({ 
      $or: [
        { cohortId: { $in: allCohortIds } },
        { id: { $in: allCohortIds } },
        { _id: { $in: allCohortIds } }
      ],
      tenantId: session.tenantId
    }).toArray();
    
    const cohortToCourseMap = new Map();
    const cohortToNameMap = new Map();
    
    // Process found cohorts
    cohorts.forEach((cohort: any) => {
      const cohortId = cohort.cohortId || cohort.id || cohort._id;
      if (cohortId) {
        cohortToCourseMap.set(cohortId, cohort.courseId);
        
        // Try multiple fields for cohort name and create a descriptive name
        const cohortName = cohort.name || cohort.cohortName || cohort.title || cohort.activity;
        if (cohortName && cohortName !== cohortId) {
          cohortToNameMap.set(cohortId, cohortName);
        } else {
          // If no descriptive name found, create one from the cohort ID
          const friendlyName = cohortId.replace(/([A-Z]+)(\d+)/, '$1 $2').replace(/([a-z])([A-Z])/g, '$1 $2');
          cohortToNameMap.set(cohortId, friendlyName);
        }
      }
    });
    
    // For cohorts not found in database, create friendly names from ID
    allCohortIds.forEach(cohortId => {
      if (!cohortToNameMap.has(cohortId)) {
        let friendlyName = cohortId
          .replace(/([A-Z]+)(\d+)/, '$1 $2')
          .replace(/([a-z])([A-Z])/g, '$1 $2');
        friendlyName = friendlyName.replace(/\b\w/g, (match: string) => match.toUpperCase());
        cohortToNameMap.set(cohortId, friendlyName);
      }
    });
    
    // Get all courses to fetch fees
    const courseIds = Array.from(new Set([
      ...students.map((s: any) => s.enrolledCourse || s.courseOfInterestId).filter(Boolean),
      ...Array.from(cohortToCourseMap.values())
    ]));
    const courses = await Course.find({ courseId: { $in: courseIds }, tenantId: session.tenantId }).lean();
    const courseFeeMap = new Map(
      courses.map((c: any) => [c.courseId, { 
        fee: c.price || 0,
        registrationFee: c.registrationFee || 1000,
        name: c.name
      }])
    );
    
    // Update overdue reminder dates for partial One-Time payments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const partialPaymentsNeedingUpdate = payments.filter((payment: any) => {
      const isPartialOneTime = payment.paymentOption === 'One Time' && 
                              payment.paymentStatus === 'PARTIAL' && 
                              payment.outstandingAmount > 0;
      
      if (!isPartialOneTime) return false;
      
      // Case 1: No reminder date set (legacy partial payments)
      if (!payment.nextReminderDate) {
        return true;
      }
      
      // Case 2: Overdue reminder date that needs updating
      const reminderDate = new Date(payment.nextReminderDate);
      reminderDate.setHours(0, 0, 0, 0);
      
      return reminderDate <= today && payment.reminderEnabled;
    });
    
    // Update reminder dates to tomorrow for partial payments
    const bulkUpdates = [];
    for (const payment of partialPaymentsNeedingUpdate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // 9 AM tomorrow
      
      const tomorrowDue = new Date();
      tomorrowDue.setDate(tomorrowDue.getDate() + 1);
      tomorrowDue.setHours(10, 0, 0, 0); // 10 AM tomorrow
      
      bulkUpdates.push({
        updateOne: {
          filter: { _id: payment._id },
          update: {
            $set: {
              nextReminderDate: tomorrow,
              nextDueDate: tomorrowDue,
              reminderEnabled: true,
              reminderFrequency: 'DAILY'
            }
          }
        }
      });
    }
    
    if (bulkUpdates.length > 0) {
      await Payment.bulkWrite(bulkUpdates);
      console.log(`Updated ${bulkUpdates.length} partial payment reminder dates (${partialPaymentsNeedingUpdate.map(p => p.studentId).join(', ')})`);
      
      // Refresh payments data to reflect the updates with tenant isolation
      const updatedPayments = await Payment.find({ tenantId: session.tenantId }).lean().exec();
      payments.length = 0;
      payments.push(...updatedPayments);
    }
    
    // Fetch course category and type details directly from courses collection
    // Include course IDs from both payments and students/cohorts
    const paymentCourseIds = payments
      .map((payment: any) => payment.enrolledCourse || payment.enrolledCourseId)
      .filter((courseId: string) => courseId && courseId.trim() !== '');
    
    const studentCourseIds = students
      .map((student: any) => 
        cohortToCourseMap.get(student.cohortId) || 
        student.enrolledCourse || 
        student.courseOfInterestId
      )
      .filter((courseId: string) => courseId && courseId.trim() !== '');
    
    const uniquePaymentCourseIds = Array.from(new Set([...paymentCourseIds, ...studentCourseIds]));
    
    let courseDetailsMap = new Map();
    if (uniquePaymentCourseIds.length > 0) {
      try {
        // Direct course fetch from database
        const directCourses = await Course.find({ 
          courseId: { $in: uniquePaymentCourseIds },
          tenantId: session.tenantId
        })
        .select('courseId name paymentCategory type')
        .lean()
        .exec();
        
        directCourses.forEach((course: any) => {
          courseDetailsMap.set(course.courseId, {
            courseId: course.courseId,
            name: course.name,
            paymentCategory: course.paymentCategory || 'Not Set',
            courseType: course.type || 'Not Set'
          });
        });
        
        console.log(`[all-students] Fetched ${directCourses.length} course details directly from database`);
      } catch (error) {
        console.error('[all-students] Error fetching course details:', error);
      }
    }
    

    
    // Create a map of studentId to payment
    const paymentMap = new Map();
    payments.forEach((payment: any) => {
      paymentMap.set(payment.studentId, payment);
    });

    // Merge students with their payments
    const allStudentsWithPayments = students.map((student: any) => {
      const payment = paymentMap.get(student.studentId);
      
      if (payment) {
        // Student has a payment record - check if fees need to be fetched from course
        const paymentCourseFee = payment.courseFee ?? 0;
        const paymentCourseRegFee = payment.courseRegistrationFee ?? 0;
        const paymentStudentRegFee = payment.studentRegistrationFee ?? 0;
        
        // If payment has zero fees, fetch from course
        let finalCourseFee = paymentCourseFee;
        let finalCourseRegFee = paymentCourseRegFee;
        let finalStudentRegFee = paymentStudentRegFee;
        let finalEnrolledCourse = payment.enrolledCourse || payment.enrolledCourseId;
        
        if (paymentCourseFee === 0) {
          // Get courseId from cohort first, then fall back to payment record
          let courseId = cohortToCourseMap.get(payment.cohortId || student.cohortId) || finalEnrolledCourse || student.enrolledCourse || student.courseOfInterestId;
          const courseInfo = courseFeeMap.get(courseId);
          
          if (courseInfo) {
            finalCourseFee = Number(courseInfo.fee || 0);
            finalCourseRegFee = Number(courseInfo.registrationFee || 1000);
            finalStudentRegFee = Number(500);
            finalEnrolledCourse = courseId;
          }
        }
        
        const totalFees = Number(finalCourseFee || 0) + Number(finalCourseRegFee || 0) + Number(finalStudentRegFee || 0);
        const receivedAmount = payment.receivedAmount || 0;
        
        // Fix paymentOption if installmentsConfig exists but paymentOption is wrong
        let finalPaymentOption = payment.paymentOption;
        if (payment.installmentsConfig && payment.installmentsConfig.installments && payment.installmentsConfig.installments.length > 0) {
          finalPaymentOption = 'One Time With Installments';
        }
        
        // Get course details for category and type from courses collection
        const courseDetails = courseDetailsMap.get(finalEnrolledCourse);
        
        // Calculate outstanding amount based on payment category
        // For Monthly Subscriptions, outstanding amount should be 0 (no balance concept)
        let outstandingAmount = totalFees - receivedAmount;
        const isMonthlySubscription = courseDetails?.paymentCategory === 'Monthly subscription';
        
        if (isMonthlySubscription || finalPaymentOption === 'Monthly' || finalPaymentOption === 'Monthly With Discounts') {
          // Monthly Subscriptions use recurring payments, not outstanding balances
          outstandingAmount = 0;
        } else {
          // For other payment types, ensure outstanding amount is not negative
          outstandingAmount = Math.max(0, outstandingAmount);
        }
        
        // Calculate status dynamically based on actual payment amounts
        let calculatedStatus = 'Pending';
        if (receivedAmount >= totalFees && totalFees > 0) {
          calculatedStatus = 'Completed';
        } else if (receivedAmount > 0) {
          calculatedStatus = 'Partial';
        }
        
        const paymentData = {
          id: String(payment._id),
          studentId: payment.studentId,
          studentName: payment.studentName,
          studentCategory: courseDetails?.paymentCategory || payment.studentCategory || 'Not Set',
          enrolledCourse: finalEnrolledCourse,
          enrolledCourseId: finalEnrolledCourse,
          enrolledCourseName: payment.enrolledCourseName,
          cohortId: payment.cohortId,
          cohortName: cohortToNameMap.get(payment.cohortId) || payment.cohortName,
          courseType: courseDetails?.courseType || payment.courseType || 'Not Set',
          courseRegistrationFee: Number(finalCourseRegFee || 0),
          studentRegistrationFee: Number(finalStudentRegFee || 0),
          courseFee: Number(finalCourseFee || 0),
          receivedAmount: receivedAmount,
          outstandingAmount: outstandingAmount,
          collectionRate: totalFees > 0 ? Math.round((receivedAmount / totalFees) * 100) : 0,
          status: calculatedStatus,
          paymentOption: finalPaymentOption || null,
          planType: payment.planType || null,
          installmentsConfig: payment.installmentsConfig || null,
          lastPaymentDate: payment.lastPaymentDate,
          nextReminderDate: payment.nextReminderDate,
          nextDueDate: payment.nextDueDate,
          reminderEnabled: payment.reminderEnabled || false,
          invoiceUrl: payment.invoiceUrl,
          startDate: payment.startDate,
          endDate: payment.endDate,
          monthlyDueDate: payment.monthlyDueDate,
          monthlyInstallment: payment.monthlyInstallment,
          emiSchedule: payment.emiSchedule,
        };
        
        // Log first payment for debugging
        if (payment.studentId === 'STU0018') {
          console.log('[all-students] Sample payment STU0018:', {
            id: paymentData.id,
            studentId: paymentData.studentId,
            _id: payment._id,
            idLength: paymentData.id.length
          });
        }
        
        return paymentData;
      } else {
        // Student doesn't have a payment record yet - show with defaults and dynamic course fee
        // Get courseId from cohort first, then fall back to enrolledCourse/courseOfInterestId
        let courseId = cohortToCourseMap.get(student.cohortId) || student.enrolledCourse || student.courseOfInterestId;
        const courseInfo = courseFeeMap.get(courseId);
        
        // Get course details for category and type from courses collection
        const courseDetails = courseDetailsMap.get(courseId);
        
        const courseRegFee = courseInfo?.registrationFee || 1000;
        const studentRegFee = 500;
        const courseFeeAmount = courseInfo?.fee || 0;
        const totalFees = Number(courseRegFee || 0) + Number(studentRegFee || 0) + Number(courseFeeAmount || 0);
        
        // For Monthly Subscription payment categories, outstanding amount should be 0
        const isMonthlySubscription = courseDetails?.paymentCategory === 'Monthly subscription';
        const outstandingAmount = isMonthlySubscription ? 0 : totalFees;
        
        return {
          id: student.studentId,
          studentId: student.studentId,
          studentName: student.name,
          studentCategory: courseDetails?.paymentCategory || student.category || 'Not Set',
          enrolledCourse: courseId,
          enrolledCourseId: courseId,
          enrolledCourseName: courseInfo?.name || student.enrolledCourseName,
          cohortId: student.cohortId,
          cohortName: cohortToNameMap.get(student.cohortId) || student.cohortName || student.cohortId,
          courseType: courseDetails?.courseType || student.courseType || 'Not Set',
          courseRegistrationFee: Number(courseRegFee) || 0,
          studentRegistrationFee: Number(studentRegFee) || 0,
          courseFee: Number(courseFeeAmount) || 0,
          receivedAmount: 0,
          outstandingAmount: outstandingAmount,
          collectionRate: 0,
          status: totalFees === 0 ? 'N/A' : 'Pending',
          paymentOption: null,
          planType: null,
          installmentsConfig: null,
          lastPaymentDate: null,
          nextReminderDate: null,
          nextDueDate: null,
          reminderEnabled: false,
          invoiceUrl: null,
          startDate: null,
          endDate: null,
          monthlyDueDate: null,
          monthlyInstallment: null,
          emiSchedule: null,
        };
      }
    });

    const response = NextResponse.json(allStudentsWithPayments, { status: 200 });
    // Cache for 15 seconds to improve performance
    response.headers.set('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=30');
    return response;
  } catch (error: any) {
    console.error('Error fetching all students with payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students with payments', details: error.message },
      { status: 500 }
    );
  }
    }
  );
}
