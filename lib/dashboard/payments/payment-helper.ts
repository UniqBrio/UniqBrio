import Payment from '@/models/dashboard/payments/Payment';
import mongoose from 'mongoose';

// Define the Course schema to access course fees
const courseSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  courseId: String,
  price: Number,
  registrationFee: Number,
  type: String,
}, {
  collection: 'courses',
  strict: false
});

const Course = mongoose.models.CourseForPaymentHelper || 
  mongoose.model('CourseForPaymentHelper', courseSchema);

/**
 * Helper function to create a payment record for a newly added student
 * This should be called after a student is successfully created
 */
export async function createPaymentForStudent(studentData: any): Promise<boolean> {
  try {
    // Check if payment record already exists
    const existingPayment = await Payment.findOne({ studentId: studentData.studentId });
    if (existingPayment) {
      console.log('Payment record already exists for student:', studentData.studentId);
      return true;
    }

    // Define fee structure
    const courseRegistrationFee = 1000;
    const studentRegistrationFee = 500;
    
    // Fetch course fee from database if student has enrolled course
    let courseFee = 0;
    let courseType = 'Individual';
    if (studentData.enrolledCourse) {
      try {
        const course = await Course.findOne({ courseId: studentData.enrolledCourse }).lean();
        if (course && (course as any).price) {
          courseFee = (course as any).price;
          console.log(`Using course fee ${courseFee} for course ${studentData.enrolledCourse}`);
        }
        if (course && (course as any).type) {
          courseType = (course as any).type;
          console.log(`Using course type ${courseType} for course ${studentData.enrolledCourse}`);
        }
      } catch (error) {
        console.error('Error fetching course fee:', error);
        // Continue with courseFee = 0 if fetch fails
      }
    }

    // Create payment record
    const paymentData = {
      studentId: studentData.studentId,
      studentName: studentData.name,
      studentCategory: studentData.category,
      enrolledCourse: studentData.enrolledCourse,
      enrolledCourseId: studentData.enrolledCourse,
      enrolledCourseName: studentData.enrolledCourseName,
      cohortId: studentData.cohortId,
      cohortName: studentData.cohortName || studentData.cohortId,
      courseType: courseType,
      courseRegistrationFee,
      studentRegistrationFee,
      courseFee,
      receivedAmount: 0,
      reminderEnabled: false,
    };

    await Payment.create(paymentData);
    console.log('Payment record created successfully for student:', studentData.studentId, 'with course fee:', courseFee);
    return true;
  } catch (error) {
    console.error('Error creating payment record for student:', studentData.studentId, error);
    return false;
  }
}
