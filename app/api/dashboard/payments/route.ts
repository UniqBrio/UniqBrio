import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Payment from '@/models/dashboard/payments/Payment';
import Student from '@/models/dashboard/student/Student';
import mongoose from 'mongoose';
import { fetchMultipleCoursePaymentDetails } from '@/lib/dashboard/payments/course-payment-server';

export async function GET(request: NextRequest) {
  try {
    await dbConnect("uniqbrio");

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    const courseId = searchParams.get('courseId');
    const cohortId = searchParams.get('cohortId');
    const status = searchParams.get('status');

    // Build query
    const query: any = {};
    if (studentId) query.studentId = studentId;
    if (courseId) query.enrolledCourse = courseId;
    if (cohortId) query.cohortId = cohortId;
    if (status) query.status = status;

    const payments = await Payment.find(query).sort({ createdAt: -1 }).lean();

    // Extract unique course IDs from payments to fetch course details
    const uniqueCourseIds = [...new Set(
      payments
        .map((payment: any) => payment.enrolledCourse)
        .filter((courseId: string) => courseId && courseId.trim() !== '')
    )];

    // Fetch course payment details for all courses
    let courseDetailsMap = new Map();
    if (uniqueCourseIds.length > 0) {
      try {
        const { courses } = await fetchMultipleCoursePaymentDetails(uniqueCourseIds as string[]);
        courseDetailsMap = new Map(courses.map(course => [course.courseId, course]));
        console.log(`Fetched course details for ${courses.length} courses`);
      } catch (error) {
        console.error('Error fetching course payment details:', error);
      }
    }

    // Ensure default values are included and add course category from courses collection
    const paymentsWithDefaults = payments.map((payment: any) => {
      const courseDetails = courseDetailsMap.get(payment.enrolledCourse);
      
      return {
        ...payment,
        courseRegistrationFee: payment.courseRegistrationFee ?? 0,
        studentRegistrationFee: payment.studentRegistrationFee ?? 0,
        courseFee: payment.courseFee ?? 0,
        receivedAmount: payment.receivedAmount ?? 0,
        outstandingAmount: payment.outstandingAmount ?? 0,
        collectionRate: payment.collectionRate ?? 0,
        // Add payment category and course type from courses collection
        studentCategory: courseDetails?.paymentCategory || payment.studentCategory || 'Not Set',
        courseType: courseDetails?.courseType || payment.courseType || 'Not Set',
        // Include reminder and due dates with proper formatting
        nextReminderDate: payment.nextReminderDate ? payment.nextReminderDate.toISOString() : null,
        nextDueDate: payment.nextDueDate ? payment.nextDueDate.toISOString() : payment.nextPaymentDate ? payment.nextPaymentDate.toISOString() : null,
        lastPaymentDate: payment.lastPaymentDate ? payment.lastPaymentDate.toISOString() : null,
        startDate: payment.startDate ? payment.startDate.toISOString() : null,
        endDate: payment.endDate ? payment.endDate.toISOString() : null,
      };
    });

    return NextResponse.json(paymentsWithDefaults, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect("uniqbrio");

    const body = await request.json();
    const {
      studentId,
      courseRegistrationFee,
      receivedAmount = 0,
    } = body;

    // Fetch student details
    const student = await Student.findOne({ studentId }).lean();
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if payment record already exists
    const existingPayment = await Payment.findOne({ studentId });
    if (existingPayment) {
      return NextResponse.json(
        { error: 'Payment record already exists for this student' },
        { status: 400 }
      );
    }

    // Get course info from cohort
    let courseId = (student as any).enrolledCourse || (student as any).courseOfInterestId;
    let courseFee = 0;
    let courseName = (student as any).enrolledCourseName;
    
    if ((student as any).cohortId) {
      const Cohort = mongoose.connection.collection('cohorts');
      const cohort = await Cohort.findOne({ cohortId: (student as any).cohortId });
      if (cohort?.courseId) {
        courseId = cohort.courseId;
        const Course = mongoose.connection.collection('courses');
        const course = await Course.findOne({ courseId: cohort.courseId });
        if (course) {
          courseFee = course.priceINR || 0;
          courseName = course.name || courseName;
        }
      }
    }

    // Create new payment record
    const payment = await Payment.create({
      studentId: (student as any).studentId,
      studentName: (student as any).name,
      studentCategory: (student as any).category,
      enrolledCourse: courseId,
      enrolledCourseName: courseName,
      cohortId: (student as any).cohortId,
      cohortName: (student as any).cohortId,
      courseType: (student as any).courseType,
      courseFee,
      courseRegistrationFee: courseRegistrationFee || 1000,
      studentRegistrationFee: 500,
      receivedAmount,
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await dbConnect("uniqbrio");

    const body = await request.json();
    const { id, receivedAmount } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    const payment = await Payment.findByIdAndUpdate(
      id,
      { 
        receivedAmount,
        lastPaymentDate: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(payment, { status: 200 });
  } catch (error: any) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Failed to update payment', details: error.message },
      { status: 500 }
    );
  }
}

