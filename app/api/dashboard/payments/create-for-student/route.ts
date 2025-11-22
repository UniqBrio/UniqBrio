import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Payment from '@/models/dashboard/payments/Payment';
import Student from '@/models/dashboard/student/Student';
import mongoose from 'mongoose';

// Define the Course schema to access course fees
const courseSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  courseId: String,
  priceINR: Number,
  registrationFee: Number,
  type: String,
}, {
  collection: 'courses',
  strict: false
});

const Course = mongoose.models.CourseForPaymentCreate || 
  mongoose.model('CourseForPaymentCreate', courseSchema);

/**
 * Create a payment record for a newly added student
 * POST /api/payments/create-for-student
 * 
 * This endpoint should be called automatically when a new student is created
 * to initialize their payment record.
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect("uniqbrio");

    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Check if payment record already exists
    const existingPayment = await Payment.findOne({ studentId });
    if (existingPayment) {
      return NextResponse.json(
        { 
          message: 'Payment record already exists for this student',
          payment: existingPayment 
        },
        { status: 200 }
      );
    }

    // Fetch student details
    const student = await Student.findOne({ studentId }).lean();
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Define fee structure
    const courseRegistrationFee = 1000;
    const studentRegistrationFee = 500;
    
    // Fetch course info from cohort first, then fall back to enrolledCourse
    let courseFee = 0;
    let courseType = 'Individual';
    let courseId = (student as any).enrolledCourse || (student as any).courseOfInterestId;
    let courseName = (student as any).enrolledCourseName;
    
    try {
      // Try to get courseId from cohort
      if ((student as any).cohortId) {
        const Cohort = mongoose.connection.collection('cohorts');
        const cohort = await Cohort.findOne({ cohortId: (student as any).cohortId });
        if (cohort?.courseId) {
          courseId = cohort.courseId;
        }
      }
      
      // Fetch course details
      if (courseId) {
        const course = await Course.findOne({ courseId }).lean();
        if (course) {
          courseFee = (course as any).priceINR || 0;
          courseType = (course as any).type || 'Individual';
          courseName = (course as any).name || courseName;
        }
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
      // Continue with default values if fetch fails
    }

    // Create payment record
    const paymentData = {
      studentId: (student as any).studentId,
      studentName: (student as any).name,
      studentCategory: (student as any).category,
      enrolledCourse: courseId,
      enrolledCourseId: courseId,
      enrolledCourseName: courseName,
      cohortId: (student as any).cohortId,
      cohortName: (student as any).cohortName || (student as any).cohortId,
      courseType: courseType,
      courseRegistrationFee,
      studentRegistrationFee,
      courseFee,
      receivedAmount: 0,
      reminderEnabled: false,
    };

    const payment = await Payment.create(paymentData);

    return NextResponse.json(
      {
        message: 'Payment record created successfully',
        payment: {
          id: payment._id,
          studentId: payment.studentId,
          studentName: payment.studentName,
          totalAmount: (payment.courseRegistrationFee || 0) + 
                       (payment.studentRegistrationFee || 0) + 
                       (payment.courseFee || 0),
          receivedAmount: payment.receivedAmount,
          outstandingAmount: payment.outstandingAmount,
          status: payment.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating payment record:', error);
    return NextResponse.json(
      { error: 'Failed to create payment record', details: error.message },
      { status: 500 }
    );
  }
}
