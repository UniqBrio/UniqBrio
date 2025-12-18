/**
 * Practical Examples: Using Course Payment Helper in Payment Workflows
 * 
 * This file demonstrates how to integrate course payment category and type
 * fetching into your existing payment processing workflows.
 */

import { 
  fetchCoursePaymentDetails, 
  fetchMultipleCoursePaymentDetails,
  getCoursePaymentCategory, 
  getCourseType,
  getCourseFees,
  type CoursePaymentDetails
} from '@/lib/dashboard/payments/course-payment-server';

// Example 1: Enhanced Payment Record Creation with Course Data
export async function createPaymentRecordWithCourseData(paymentData: {
  studentId: string;
  courseId: string;
  amount: number;
  paymentMode: string;
  // ... other payment fields
}) {
  try {
    // Fetch course payment details
    const courseDetails = await fetchCoursePaymentDetails(paymentData.courseId);
    
    if (!courseDetails) {
      throw new Error(`Course not found: ${paymentData.courseId}`);
    }

    // Create enhanced payment record with course category and type
    const paymentRecord = {
      ...paymentData,
      courseCategory: courseDetails.courseCategory,
      courseType: courseDetails.courseType,
      courseName: courseDetails.name,
      courseFee: courseDetails.price,
      registrationFee: courseDetails.registrationFee,
      // Add other course-related fields as needed
    };

    console.log('Enhanced payment record with course data:', paymentRecord);
    return paymentRecord;

  } catch (error) {
    console.error('Error creating payment record with course data:', error);
    throw error;
  }
}

// Example 2: Payment Category-Based Processing Logic
export async function processPaymentByCategory(courseId: string, amount: number) {
  try {
    // Get payment category for business logic
    const paymentCategory = await getCoursePaymentCategory(courseId);
    const courseType = await getCourseType(courseId);
    
    console.log(`Processing payment for course ${courseId}:`);
    console.log(`- Payment Category: ${paymentCategory}`);
    console.log(`- Course Type: ${courseType}`);

    // Apply different processing logic based on category
    switch (paymentCategory?.toLowerCase()) {
      case 'premium':
        return {
          allowPartialPayments: true,
          allowInstallments: true,
          allowMonthlySubscription: true,
          discountEligible: true,
          processingFee: amount * 0.02, // 2% for premium
        };

      case 'regular':
        return {
          allowPartialPayments: true,
          allowInstallments: true,
          allowMonthlySubscription: false,
          discountEligible: false,
          processingFee: amount * 0.03, // 3% for regular
        };

      case 'basic':
        return {
          allowPartialPayments: false,
          allowInstallments: false,
          allowMonthlySubscription: false,
          discountEligible: false,
          processingFee: amount * 0.01, // 1% for basic
        };

      default:
        return {
          allowPartialPayments: false,
          allowInstallments: false,
          allowMonthlySubscription: false,
          discountEligible: false,
          processingFee: amount * 0.025, // 2.5% default
        };
    }

  } catch (error) {
    console.error('Error processing payment by category:', error);
    // Return default processing options on error
    return {
      allowPartialPayments: false,
      allowInstallments: false,
      allowMonthlySubscription: false,
      discountEligible: false,
      processingFee: amount * 0.025,
    };
  }
}

// Example 3: Course Type-Based Payment Options
export async function getPaymentOptionsByCourseType(courseId: string) {
  try {
    const courseType = await getCourseType(courseId);
    
    // Configure payment options based on course type
    switch (courseType?.toLowerCase()) {
      case 'online':
        return {
          paymentModes: ['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet'],
          instantActivation: true,
          prorationSupported: true,
          refundPolicy: 'flexible',
        };

      case 'offline':
        return {
          paymentModes: ['cash', 'check', 'bank_transfer', 'credit_card'],
          instantActivation: false,
          prorationSupported: false,
          refundPolicy: 'standard',
        };

      case 'hybrid':
        return {
          paymentModes: ['credit_card', 'debit_card', 'upi', 'net_banking', 'cash', 'check'],
          instantActivation: true,
          prorationSupported: true,
          refundPolicy: 'standard',
        };

      default:
        return {
          paymentModes: ['credit_card', 'debit_card', 'upi'],
          instantActivation: false,
          prorationSupported: false,
          refundPolicy: 'strict',
        };
    }

  } catch (error) {
    console.error('Error getting payment options by course type:', error);
    return {
      paymentModes: ['credit_card'],
      instantActivation: false,
      prorationSupported: false,
      refundPolicy: 'strict',
    };
  }
}

// Example 4: Validate Payment Against Course Fees
export async function validatePaymentAmount(courseId: string, paymentAmount: number, paymentType: 'full' | 'partial' | 'installment') {
  try {
    const courseFees = await getCourseFees(courseId);
    
    if (!courseFees) {
      throw new Error(`Course fees not found for course: ${courseId}`);
    }

    const totalCourseFee = (courseFees.price || 0) + (courseFees.registrationFee || 0);

    switch (paymentType) {
      case 'full':
        return {
          isValid: paymentAmount === totalCourseFee,
          expectedAmount: totalCourseFee,
          message: paymentAmount === totalCourseFee 
            ? 'Full payment amount is correct' 
            : `Expected full payment: ${totalCourseFee}, received: ${paymentAmount}`
        };

      case 'partial':
        const minPartialAmount = totalCourseFee * 0.5; // Minimum 50%
        return {
          isValid: paymentAmount >= minPartialAmount && paymentAmount < totalCourseFee,
          expectedAmount: minPartialAmount,
          message: paymentAmount >= minPartialAmount 
            ? 'Partial payment amount is valid' 
            : `Minimum partial payment: ${minPartialAmount}, received: ${paymentAmount}`
        };

      case 'installment':
        const maxInstallmentAmount = totalCourseFee * 0.4; // Maximum 40% per installment
        return {
          isValid: paymentAmount > 0 && paymentAmount <= maxInstallmentAmount,
          expectedAmount: maxInstallmentAmount,
          message: paymentAmount <= maxInstallmentAmount 
            ? 'Installment amount is valid' 
            : `Maximum installment amount: ${maxInstallmentAmount}, received: ${paymentAmount}`
        };

      default:
        return {
          isValid: false,
          expectedAmount: totalCourseFee,
          message: 'Invalid payment type specified'
        };
    }

  } catch (error) {
    console.error('Error validating payment amount:', error);
    return {
      isValid: false,
      expectedAmount: 0,
      message: 'Error validating payment amount'
    };
  }
}

// Example 5: Bulk Processing for Multiple Courses
export async function processBulkCoursePayments(coursePayments: Array<{
  courseId: string;
  studentId: string;
  amount: number;
}>) {
  try {
    // Extract unique course IDs
    const uniqueCourseIds = [...new Set(coursePayments.map(p => p.courseId))];
    
    // Fetch course details for all courses in one go
    const { courses, missingCourseIds } = await fetchMultipleCoursePaymentDetails(uniqueCourseIds);
    
    // Create a map for quick course detail lookup
    const courseDetailsMap = new Map(courses.map((course: CoursePaymentDetails) => [course.courseId, course]));
    
    // Process each payment with course details
    const processedPayments = coursePayments.map(payment => {
      const courseDetails = courseDetailsMap.get(payment.courseId);
      
      if (!courseDetails) {
        return {
          ...payment,
          status: 'error',
          error: `Course details not found for: ${payment.courseId}`
        };
      }

      return {
        ...payment,
        courseCategory: courseDetails.courseCategory,
        courseType: courseDetails.courseType,
        courseName: courseDetails.name,
        courseFee: courseDetails.price,
        registrationFee: courseDetails.registrationFee,
        status: 'processed'
      };
    });

    return {
      processed: processedPayments,
      missingCourses: missingCourseIds,
      summary: {
        total: coursePayments.length,
        successful: processedPayments.filter(p => p.status === 'processed').length,
        failed: processedPayments.filter(p => p.status === 'error').length
      }
    };

  } catch (error) {
    console.error('Error processing bulk course payments:', error);
    throw error;
  }
}

// Example 6: Payment Reminder Customization by Course Category
export async function getCustomReminderSettings(courseId: string) {
  try {
    const courseDetails = await fetchCoursePaymentDetails(courseId);
    
    if (!courseDetails) {
      return getDefaultReminderSettings();
    }

    // Customize reminder settings based on course category
    switch (courseDetails.courseCategory?.toLowerCase()) {
      case 'premium':
        return {
          reminderFrequency: 'WEEKLY',
          preReminderDays: 7,
          maxReminders: 5,
          escalationEnabled: true,
          personalizedMessages: true,
          priorityLevel: 'high'
        };

      case 'regular':
        return {
          reminderFrequency: 'WEEKLY',
          preReminderDays: 3,
          maxReminders: 3,
          escalationEnabled: false,
          personalizedMessages: false,
          priorityLevel: 'medium'
        };

      case 'basic':
        return {
          reminderFrequency: 'MONTHLY',
          preReminderDays: 1,
          maxReminders: 2,
          escalationEnabled: false,
          personalizedMessages: false,
          priorityLevel: 'low'
        };

      default:
        return getDefaultReminderSettings();
    }

  } catch (error) {
    console.error('Error getting custom reminder settings:', error);
    return getDefaultReminderSettings();
  }
}

function getDefaultReminderSettings() {
  return {
    reminderFrequency: 'WEEKLY',
    preReminderDays: 3,
    maxReminders: 3,
    escalationEnabled: false,
    personalizedMessages: false,
    priorityLevel: 'medium'
  };
}

// Export all examples for use in your application
export default {
  createPaymentRecordWithCourseData,
  processPaymentByCategory,
  getPaymentOptionsByCourseType,
  validatePaymentAmount,
  processBulkCoursePayments,
  getCustomReminderSettings
};