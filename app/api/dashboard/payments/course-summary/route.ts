import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Payment from '@/models/dashboard/payments/Payment';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

interface PaymentDocument {
  enrolledCourse?: string;
  enrolledCourseName?: string;
  cohortId?: string;
  cohortName?: string;
  courseRegistrationFee?: number;
  studentRegistrationFee?: number;
  courseFee?: number;
  receivedAmount?: number;
  outstandingAmount?: number;
}

interface CohortData {
  cohortId: string;
  cohortName: string;
  totalStudents: number;
  totalAmount: number;
  receivedAmount: number;
  outstandingAmount: number;
  collectionRate?: number;
  totalCourseFees?: number;
  totalCourseRegistrationFees?: number;
  totalStudentRegistrationFees?: number;
  totalToBePaid?: number;
}

interface CourseData {
  courseId: string;
  courseName: string;
  totalStudents: number;
  totalAmount: number;
  receivedAmount: number;
  outstandingAmount: number;
  cohorts: Map<string, CohortData>;
  totalCourseFees?: number;
  totalCourseRegistrationFees?: number;
  totalStudentRegistrationFees?: number;
  totalToBePaid?: number;
}

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

        // Fetch payments with only required fields for better performance
        const payments = await Payment.find({ tenantId: session.tenantId }).select('enrolledCourse enrolledCourseName cohortId cohortName courseFee courseRegistrationFee studentRegistrationFee receivedAmount outstandingAmount').lean().exec();

    // Debug: Check data types
    if (payments.length > 0) {
      const sample = payments[0] as any;
      console.log('[Course Summary] Sample payment data types:', {
        courseFee: `${typeof sample.courseFee} = ${sample.courseFee}`,
        courseRegistrationFee: `${typeof sample.courseRegistrationFee} = ${sample.courseRegistrationFee}`,
        studentRegistrationFee: `${typeof sample.studentRegistrationFee} = ${sample.studentRegistrationFee}`,
        receivedAmount: `${typeof sample.receivedAmount} = ${sample.receivedAmount}`,
        outstandingAmount: `${typeof sample.outstandingAmount} = ${sample.outstandingAmount}`,
      });
    }

    // Group by course
    const courseMap = new Map<string, CourseData>();

    (payments as any[]).forEach((p: any) => {
      if (!p.enrolledCourse) return;

      if (!courseMap.has(p.enrolledCourse)) {
        courseMap.set(p.enrolledCourse, {
          courseId: p.enrolledCourse,
          courseName: p.enrolledCourseName || p.enrolledCourse,
          totalStudents: 0,
          totalAmount: 0,
          receivedAmount: 0,
          outstandingAmount: 0,
          cohorts: new Map<string, CohortData>(),
          totalCourseFees: 0,
          totalCourseRegistrationFees: 0,
          totalStudentRegistrationFees: 0,
          totalToBePaid: 0,
        });
      }

      const course = courseMap.get(p.enrolledCourse)!;
      course.totalStudents++;
      
      // Calculate all fee components - ensure numeric values
      const courseFee = Number(p.courseFee) || 0;
      const courseRegFee = Number(p.courseRegistrationFee) || 0;
      const studentRegFee = Number(p.studentRegistrationFee) || 0;
      const receivedAmt = Number(p.receivedAmount) || 0;
      const totalToBePaid = courseFee + courseRegFee + studentRegFee;
      
      // Calculate outstanding amount based on actual fees, not stored value
      const calculatedOutstanding = Math.max(0, totalToBePaid - receivedAmt);
      
      course.totalAmount += courseFee;
      course.totalCourseFees! += courseFee;
      course.totalCourseRegistrationFees! += courseRegFee;
      course.totalStudentRegistrationFees! += studentRegFee;
      course.totalToBePaid! += totalToBePaid;
      course.receivedAmount += receivedAmt;
      course.outstandingAmount += calculatedOutstanding;

      // Group by cohort within course
      if (p.cohortId) {
        if (!course.cohorts.has(p.cohortId)) {
          course.cohorts.set(p.cohortId, {
            cohortId: p.cohortId,
            cohortName: p.cohortName || p.cohortId,
            totalStudents: 0,
            totalAmount: 0,
            receivedAmount: 0,
            outstandingAmount: 0,
            totalCourseFees: 0,
            totalCourseRegistrationFees: 0,
            totalStudentRegistrationFees: 0,
            totalToBePaid: 0,
          });
        }

        const cohort = course.cohorts.get(p.cohortId)!;
        cohort.totalStudents++;
        cohort.totalAmount += courseFee;
        cohort.totalCourseFees! += courseFee;
        cohort.totalCourseRegistrationFees! += courseRegFee;
        cohort.totalStudentRegistrationFees! += studentRegFee;
        cohort.totalToBePaid! += totalToBePaid;
        cohort.receivedAmount += receivedAmt;
        cohort.outstandingAmount += calculatedOutstanding;
      }
    });

    // Convert to array and calculate rates
    const courseSummaries = Array.from(courseMap.values()).map((course: CourseData) => {
      // For Monthly Subscription courses, collection rate and outstanding balance don't apply
      // We need to check if this is a monthly subscription course by looking at payment patterns
      const totalCourseFees = course.totalCourseFees || 0;
      const totalAllFees = course.totalToBePaid || 0;
      
      // Calculate the proportion of course fees vs total fees
      const courseFeeRatio = totalAllFees > 0 ? totalCourseFees / totalAllFees : 0;
      
      // Estimate how much of the received amount is for course fees
      const estimatedCourseFeesReceived = (course.receivedAmount || 0) * courseFeeRatio;
      
      // Calculate collection rate based on payment type
      let collectionRate = 0;
      let outstandingAmount = course.outstandingAmount || 0;
      
      // For monthly subscriptions, we need special logic:
      // 1. Registration fees are one-time (first payment only)
      // 2. Course fees are recurring monthly
      // 3. Calculate completion based on expected vs received course fees only
      
      const hasOutstandingBalance = (course.outstandingAmount || 0) > 0;
      const hasReceivedPayments = (course.receivedAmount || 0) > 0;
      
      // Calculate total registration fees (one-time)
      const totalRegistrationFees = (course.totalCourseRegistrationFees || 0) + (course.totalStudentRegistrationFees || 0);
      
      // Estimate course fees received (subtract estimated registration fee portion from total received)
      const registrationFeeRatio = totalAllFees > 0 ? totalRegistrationFees / totalAllFees : 0;
      const estimatedRegistrationFeesReceived = (course.receivedAmount || 0) * registrationFeeRatio;
      const estimatedCourseFeesOnlyReceived = (course.receivedAmount || 0) - estimatedRegistrationFeesReceived;
      
      // For monthly subscription courses, detect if this is recurring payment scenario
      // For discounted subscriptions, we need to be more lenient in detection
      // If received >= 85% of expected course fees, it's likely ongoing subscription (accounts for discounts)
      const isLikelyMonthlySubscription = (totalCourseFees > 0) && 
        (estimatedCourseFeesOnlyReceived >= totalCourseFees * 0.85) && 
        ((course.outstandingAmount || 0) === 0 || (course.outstandingAmount || 0) < totalCourseFees * 0.2);
      
      if (isLikelyMonthlySubscription && hasReceivedPayments) {
        // Monthly subscription detected - set collection rate to 100% and outstanding to 0
        collectionRate = 100;
        outstandingAmount = 0;
      } else if (!hasOutstandingBalance && hasReceivedPayments) {
        // Regular completed payments - base calculation only on course fees (excluding registration fees)
        collectionRate = totalCourseFees > 0 
          ? Math.min(100, (estimatedCourseFeesOnlyReceived / totalCourseFees) * 100)
          : 0;
      } else {
        // Courses with outstanding balance - calculate based on course fees only, capped at 100%
        collectionRate = totalCourseFees > 0 
          ? Math.min(100, (estimatedCourseFeesOnlyReceived / totalCourseFees) * 100)
          : 0;
      }

      let status: 'Pending' | 'Partial' | 'Paid' = 'Pending';
      if (collectionRate > 0) {
        if (outstandingAmount > 0) {
          status = 'Partial';
        } else {
          status = 'Paid';
        }
      }

      const cohorts = Array.from(course.cohorts.values()).map((cohort: CohortData) => {
        // Apply same logic for cohorts
        const cohortTotalCourseFees = cohort.totalCourseFees || 0;
        const cohortTotalAllFees = cohort.totalToBePaid || 0;
        const cohortCourseFeeRatio = cohortTotalAllFees > 0 ? cohortTotalCourseFees / cohortTotalAllFees : 0;
        const cohortEstimatedCourseFeesReceived = (cohort.receivedAmount || 0) * cohortCourseFeeRatio;
        
        let cohortRate = 0;
        let cohortOutstanding = cohort.outstandingAmount || 0;
        
        // Apply same logic as course level for monthly subscriptions
        const cohortHasOutstanding = (cohort.outstandingAmount || 0) > 0;
        const cohortHasPayments = (cohort.receivedAmount || 0) > 0;
        
        // Calculate cohort registration fees and course fees only
        const cohortTotalRegistrationFees = (cohort.totalCourseRegistrationFees || 0) + (cohort.totalStudentRegistrationFees || 0);
        const cohortRegistrationFeeRatio = cohortTotalAllFees > 0 ? cohortTotalRegistrationFees / cohortTotalAllFees : 0;
        const cohortEstimatedRegistrationFeesReceived = (cohort.receivedAmount || 0) * cohortRegistrationFeeRatio;
        const cohortEstimatedCourseFeesOnlyReceived = (cohort.receivedAmount || 0) - cohortEstimatedRegistrationFeesReceived;
        
        // Detect monthly subscription pattern for cohort
        // For discounted subscriptions, be more lenient in detection (85% threshold)
        const cohortIsLikelyMonthlySubscription = (cohortTotalCourseFees > 0) && 
          (cohortEstimatedCourseFeesOnlyReceived >= cohortTotalCourseFees * 0.85) && 
          ((cohort.outstandingAmount || 0) === 0 || (cohort.outstandingAmount || 0) < cohortTotalCourseFees * 0.2);
        
        if (cohortIsLikelyMonthlySubscription && cohortHasPayments) {
          // Monthly subscription detected - set rate to 100% and outstanding to 0
          cohortRate = 100;
          cohortOutstanding = 0;
        } else if (!cohortHasOutstanding && cohortHasPayments) {
          // Regular completed payments - base on course fees only, capped at 100%
          cohortRate = cohortTotalCourseFees > 0 
            ? Math.min(100, (cohortEstimatedCourseFeesOnlyReceived / cohortTotalCourseFees) * 100)
            : 0;
        } else {
          // Regular calculation - course fees only, always capped at 100%
          cohortRate = cohortTotalCourseFees > 0 
            ? Math.min(100, (cohortEstimatedCourseFeesOnlyReceived / cohortTotalCourseFees) * 100)
            : 0;
        }
        
        return {
          ...cohort,
          collectionRate: Math.min(100, cohortRate),
          outstandingAmount: cohortOutstanding,
        };
      });

      return {
        courseId: course.courseId,
        courseName: course.courseName,
        totalStudents: course.totalStudents,
        totalAmount: course.totalAmount,
        totalCourseFees: course.totalCourseFees,
        totalCourseRegistrationFees: course.totalCourseRegistrationFees,
        totalStudentRegistrationFees: course.totalStudentRegistrationFees,
        totalToBePaid: course.totalToBePaid,
        receivedAmount: course.receivedAmount,
        outstandingAmount: outstandingAmount,
        collectionRate: Math.min(100, collectionRate),
        status,
        cohorts,
      };
    });

    const response = NextResponse.json(courseSummaries, { status: 200 });
    // Cache for 20 seconds
    response.headers.set('Cache-Control', 'public, s-maxage=20, stale-while-revalidate=40');
    return response;
  } catch (error: any) {
    console.error('Error fetching course payment summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course payment summary', details: error.message },
      { status: 500 }
    );
  }
    }
  );
}
