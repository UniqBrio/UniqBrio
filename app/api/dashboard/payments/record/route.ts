import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Payment from '@/models/dashboard/payments/Payment';
import PaymentTransaction from '@/models/dashboard/payments/PaymentTransaction';
import Student from '@/models/dashboard/student/Student';
import mongoose from 'mongoose';
import {
  getTomorrowDate,
  calculateMonthsPaid,
  calculateNextMonthlyReminder,
  formatDateForInput,
  calculateNextDueDate,
} from '@/lib/dashboard/payments/payment-date-helpers';
import { validateCollections, createPaymentTransaction } from '@/lib/dashboard/payments/payment-storage-helper';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

/**
 * Record a manual payment
 * POST /api/payments/record
 */
export async function POST(request: NextRequest) {
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
  console.log('=== PAYMENT RECORD API CALLED ===');
  
  try {
    console.log('Step 1: Connecting to database...');
    await dbConnect("uniqbrio");
    console.log('Step 1: Database connected ✓');
    
    // Validate collections are properly configured
    console.log('Step 1.5: Validating collections...');
    validateCollections();
    console.log('Step 1.5: Collections validated ✓');

    console.log('Step 2: Parsing request body...');
    const body = await request.json();
    console.log('Step 2: Request body parsed ✓');
    console.log('Received payment data:', JSON.stringify(body, null, 2));
    
    const {
      paymentId,
      studentId,
      amount,
      paymentOption,
      selectedTypes,
      date,
      time,
      mode,
      receivedBy,
      reminderEnabled,
      nextReminderDate,
      cohortDates,
      numberOfMonths,
      monthlyInstallment,
      courseRegistrationFee,
      studentRegistrationFee,
      courseFee,
    } = body;

    console.log('Step 3: Validating required fields...');
    console.log('  - paymentId:', paymentId);
    console.log('  - studentId:', studentId);
    console.log('  - amount:', amount);
    console.log('  - date:', date);
    console.log('  - time:', time);
    console.log('  - receivedBy:', receivedBy);

    // Validate required fields
    if (!paymentId || !studentId || !amount || !date || !time || !receivedBy) {
      console.error('Step 3: Validation FAILED ✗');
      console.error('Validation failed:', { paymentId, studentId, amount, date, time, receivedBy });
      return NextResponse.json(
        { error: 'Missing required fields', details: 'Please fill in all required fields' },
        { status: 400 }
      );
    }
    console.log('Step 3: Validation passed ✓');

    // Find or create the payment record
    console.log('Step 4: Finding payment record...');
    console.log('  - Looking for student ID:', studentId);
    let payment = await Payment.findOne({ studentId: studentId, tenantId: session.tenantId });
    
    if (!payment) {
      console.log('Step 4: Payment not found, creating new record...');
      
      // Fetch student data to create payment record
      const student = await Student.findOne({ studentId: studentId, tenantId: session.tenantId });
      if (!student) {
        console.error('Step 4: Student not found ✗');
        return NextResponse.json(
          { error: 'Student not found', details: `No student found with ID: ${studentId}` },
          { status: 404 }
        );
      }
      
      // Get course info from cohort
      let courseId = student.enrolledCourse || student.courseOfInterestId;
      let fetchedCourseFee = courseFee || 0;
      let fetchedCourseRegFee = courseRegistrationFee || 1000;
      let courseName = student.enrolledCourseName;
      
      if (student.cohortId) {
        const Cohort = mongoose.connection.collection('cohorts');
        const cohort = await Cohort.findOne({ cohortId: student.cohortId, tenantId: session.tenantId });
        if (cohort?.courseId) {
          courseId = cohort.courseId;
          const Course = mongoose.connection.collection('courses');
          const course = await Course.findOne({ courseId: cohort.courseId, tenantId: session.tenantId });
          if (course) {
            fetchedCourseFee = course.price || courseFee || 0;
            fetchedCourseRegFee = course.registrationFee || courseRegistrationFee || 1000;
            courseName = course.name || courseName;
          }
        }
      }
      
      // Create new payment record
      payment = await Payment.create({
        tenantId: session.tenantId, // Explicit tenant isolation
        studentId: student.studentId,
        studentName: student.name,
        studentCategory: student.category,
        enrolledCourse: courseId,
        enrolledCourseId: courseId,
        enrolledCourseName: courseName,
        cohortId: student.cohortId,
        cohortName: student.cohortId,
        courseType: student.courseType,
        courseRegistrationFee: fetchedCourseRegFee,
        studentRegistrationFee: studentRegistrationFee || 500,
        courseFee: fetchedCourseFee,
        receivedAmount: 0,
        outstandingAmount: 0,
        collectionRate: 0,
        status: 'Pending',
        paymentOption: paymentOption || 'Monthly',
        startDate: cohortDates?.startDate ? new Date(cohortDates.startDate) : undefined,
        endDate: cohortDates?.endDate ? new Date(cohortDates.endDate) : undefined,
        monthlyInstallment: monthlyInstallment || 0,
      });
      
      console.log('Step 4: Payment record created ✓');
      console.log('  - Course Registration Fee:', fetchedCourseRegFee);
      console.log('  - Student Registration Fee:', studentRegistrationFee || 500);
      console.log('  - Course Fee:', fetchedCourseFee);
    } else {
      console.log('Step 4: Payment found ✓');
    }
    console.log('  - Payment student:', payment.studentName);

    // Calculate total fees (registration fees are FIXED and should NEVER be modified)
    console.log('Step 5: Calculating total fees...');
    const totalFees = (payment.courseRegistrationFee || 0) + 
                     (payment.studentRegistrationFee || 0) + 
                     (payment.courseFee || 0);
    console.log('  - Course Registration Fee:', payment.courseRegistrationFee);
    console.log('  - Student Registration Fee:', payment.studentRegistrationFee);
    console.log('  - Course Fee:', payment.courseFee);
    console.log('  - Total fees:', totalFees);
    console.log('Step 5: Fees calculated ✓');

    // Update payment with new received amount
    console.log('Step 6: Updating payment amounts...');
    const newReceivedAmount = payment.receivedAmount + amount;
    payment.receivedAmount = newReceivedAmount;
    payment.lastPaymentDate = new Date(`${date}T${time}`);
    payment.paymentOption = paymentOption;
    console.log('  - New received amount:', newReceivedAmount);
    console.log('Step 6: Payment amounts updated ✓');

    // Store cohort dates if available
    console.log('Step 7: Storing cohort dates...');
    if (cohortDates?.startDate) {
      payment.startDate = new Date(cohortDates.startDate);
      console.log('  - Start date set:', cohortDates.startDate);
    }
    if (cohortDates?.endDate) {
      payment.endDate = new Date(cohortDates.endDate);
      console.log('  - End date set:', cohortDates.endDate);
    }
    console.log('Step 7: Cohort dates stored ✓');

    // Calculate remaining balance
    console.log('Step 8: Calculating remaining balance...');
    const remainingBalance = totalFees - newReceivedAmount;
    console.log('  - Remaining balance:', remainingBalance);
    console.log('Step 8: Balance calculated ✓');

    // ONE-TIME PAYMENT LOGIC
    console.log('Step 9: Applying payment logic...');
    console.log('  - Payment option:', paymentOption);
    if (paymentOption === 'One Time') {
      console.log('  - Processing One-Time payment logic');
      if (remainingBalance <= 0) {
        // Full payment - turn off reminder
        console.log('  - Full payment detected');
        payment.reminderEnabled = false;
        payment.nextReminderDate = null;
      } else {
        // Partial payment - enable reminder for tomorrow
        console.log('  - Partial payment detected');
        payment.reminderEnabled = true;
        payment.nextReminderDate = getTomorrowDate();
      }
    }

    // MONTHLY PAYMENT LOGIC
    else if (paymentOption === 'Monthly') {
      console.log('  - Processing Monthly payment logic');
      const paymentDate = new Date(`${date}T${time}`);
      const installment = monthlyInstallment || 0;
      console.log('  - Monthly installment:', installment);
      
      // First payment - establish monthly due date from course start date
      if (!payment.monthlyDueDate) {
        console.log('  - First monthly payment - establishing due date');
        
        // Use course start date to determine monthly due date
        if (payment.startDate) {
          const startDate = new Date(payment.startDate);
          payment.monthlyDueDate = startDate.getDate();
          console.log('  - Monthly due date set from start date:', payment.monthlyDueDate, '(Start date:', startDate, ')');
        } else {
          // Fallback to payment date if start date not available
          const paymentDate = new Date(`${date}T${time}`);
          payment.monthlyDueDate = paymentDate.getDate();
          console.log('  - Monthly due date set from payment date (fallback):', payment.monthlyDueDate);
        }
        
        payment.monthlyInstallment = installment;
        console.log('  - Monthly installment set to:', installment);
      }

      if (remainingBalance <= 0) {
        // Total balance fully paid - turn off reminder
        console.log('  - Total balance paid - disabling reminder');
        payment.reminderEnabled = false;
        payment.nextReminderDate = null;
        payment.nextDueDate = null;
      } else if (installment > 0) {
        // Calculate how many months are covered by this payment
        console.log('  - Calculating months paid...');
        const { monthsPaid, remainingAmount } = calculateMonthsPaid(amount, installment);
        console.log('  - Months paid:', monthsPaid, 'Remaining:', remainingAmount);
        
        if (monthsPaid > 0) {
          // Paid at least 1 full month - set reminder 2 days before next month's due date
          console.log('  - Full month(s) paid - setting reminder for next month');
          payment.reminderEnabled = true;
          const paymentDate = new Date(`${date}T${time}`);
          const nextReminder = calculateNextMonthlyReminder(
            payment.monthlyDueDate,
            paymentDate,
            monthsPaid // Skip ahead by number of months paid
          );
          const nextDue = calculateNextDueDate(
            payment.monthlyDueDate,
            paymentDate,
            monthsPaid
          );
          payment.nextReminderDate = nextReminder;
          payment.nextDueDate = nextDue;
          console.log('  - Next reminder date:', nextReminder);
          console.log('  - Next due date:', nextDue);
        } else if (remainingAmount > 0) {
          // Partial monthly payment (less than 1 month) - reminder for tomorrow
          console.log('  - Partial month payment - setting reminder for tomorrow');
          payment.reminderEnabled = true;
          payment.nextReminderDate = getTomorrowDate();
          // For partial payments, keep the next due date as next month
          const paymentDate = new Date(`${date}T${time}`);
          payment.nextDueDate = calculateNextDueDate(payment.monthlyDueDate, paymentDate, 1);
        } else {
          // Edge case: amount is exactly 0 or negative
          console.log('  - Edge case: zero payment amount');
          payment.reminderEnabled = true;
          payment.nextReminderDate = getTomorrowDate();
          const paymentDate = new Date(`${date}T${time}`);
          payment.nextDueDate = calculateNextDueDate(payment.monthlyDueDate, paymentDate, 1);
        }
      } else {
        // No monthly installment set, default to tomorrow
        console.log('  - No installment set - defaulting to tomorrow');
        payment.reminderEnabled = true;
        payment.nextReminderDate = getTomorrowDate();
        payment.nextDueDate = null;
      }
    }
    console.log('Step 9: Payment logic applied ✓');

    // Mark registration fees as paid if they were selected in this payment
    console.log('Step 10: Marking registration fees as paid...');
    if (selectedTypes) {
      if (selectedTypes.studentRegistrationFee && !payment.studentRegistrationFeePaid) {
        payment.studentRegistrationFeePaid = true;
        console.log('  - Student registration fee marked as PAID');
      }
      if (selectedTypes.courseRegistrationFee && !payment.courseRegistrationFeePaid) {
        payment.courseRegistrationFeePaid = true;
        console.log('  - Course registration fee marked as PAID');
      }
    }
    console.log('Step 10: Registration fees status updated ✓');

    // Override with user's reminder settings if they disabled it
    console.log('Step 11: Checking user reminder override...');
    if (reminderEnabled === false) {
      console.log('  - User disabled reminder');
      payment.reminderEnabled = false;
      payment.nextReminderDate = null;
    }
    console.log('Step 11: Reminder settings finalized ✓');

    // Save the updated payment (pre-save hook will recalculate outstanding and status)
    console.log('Step 12: Saving payment to database...');
    console.log('Saving payment with data:', {
      receivedAmount: payment.receivedAmount,
      paymentOption: payment.paymentOption,
      reminderEnabled: payment.reminderEnabled,
      nextReminderDate: payment.nextReminderDate,
      monthlyDueDate: payment.monthlyDueDate,
      monthlyInstallment: payment.monthlyInstallment,
    });
    
    let savedPayment;
    try {
      savedPayment = await payment.save();
      console.log('Step 12: Payment saved successfully ✓');
      console.log('  - Payment ID:', savedPayment._id);
      console.log('  - Collection: payments');
    } catch (saveError: any) {
      console.error('Step 12: FAILED to save payment ✗');
      console.error('Error saving payment to database:', saveError);
      console.error('Save error details:', saveError.message);
      console.error('Save error stack:', saveError.stack);
      throw new Error(`Failed to save payment: ${saveError.message}`);
    }

    // Create a payment transaction record for history tracking
    console.log('Step 13: Creating transaction record...');
    let transaction;
    try {
      transaction = await createPaymentTransaction(savedPayment, {
        tenantId: session.tenantId, // Explicit tenant isolation
        studentId: savedPayment.studentId,
        studentName: savedPayment.studentName,
        amount,
        paymentOption,
        selectedTypes,
        paymentDate: new Date(`${date}T${time}`),
        mode,
        receivedBy,
      });
      console.log('Step 13: Transaction created successfully ✓');
      console.log('  - Transaction ID:', transaction._id);
      console.log('  - Collection: paymenttransactions');
      console.log('  - Linked to Payment ID:', transaction.paymentId);
    } catch (transactionError: any) {
      console.error('Step 13: FAILED to create transaction ✗');
      console.error('Error creating transaction:', transactionError);
      console.error('Transaction error details:', transactionError.message);
      console.error('Transaction error stack:', transactionError.stack);
      
      // Payment is already saved, so we should still return success
      // but log the transaction creation failure
      console.warn('WARNING: Payment saved but transaction record failed to create');
      console.warn('This transaction needs to be created manually or investigated');
      
      // Return partial success response
      return NextResponse.json(
        {
          message: 'Payment recorded but transaction logging failed',
          warning: 'Transaction record was not created - please contact support',
          payment: {
            id: savedPayment._id,
            studentId: savedPayment.studentId,
            studentName: savedPayment.studentName,
            receivedAmount: savedPayment.receivedAmount,
            outstandingAmount: savedPayment.outstandingAmount,
            collectionRate: savedPayment.collectionRate,
            status: savedPayment.status,
            lastPaymentDate: savedPayment.lastPaymentDate,
            reminderEnabled: savedPayment.reminderEnabled,
            nextReminderDate: savedPayment.nextReminderDate,
            paymentOption: savedPayment.paymentOption,
            monthlyDueDate: savedPayment.monthlyDueDate,
            monthlyInstallment: savedPayment.monthlyInstallment,
          },
          transactionError: transactionError.message,
        },
        { status: 207 } // 207 Multi-Status: partial success
      );
    }

    console.log('=== PAYMENT RECORD SUCCESS ===');
    console.log('✓ Payment saved to "payments" collection');
    console.log('✓ Transaction saved to "paymenttransactions" collection');
    console.log('Both records created successfully!');
    
    return NextResponse.json(
      {
        message: 'Payment recorded successfully',
        success: true,
        payment: {
          id: savedPayment._id,
          studentId: savedPayment.studentId,
          studentName: savedPayment.studentName,
          receivedAmount: savedPayment.receivedAmount,
          outstandingAmount: savedPayment.outstandingAmount,
          collectionRate: savedPayment.collectionRate,
          status: savedPayment.status,
          lastPaymentDate: savedPayment.lastPaymentDate,
          reminderEnabled: savedPayment.reminderEnabled,
          nextReminderDate: savedPayment.nextReminderDate,
          paymentOption: savedPayment.paymentOption,
          monthlyDueDate: savedPayment.monthlyDueDate,
          monthlyInstallment: savedPayment.monthlyInstallment,
        },
        transaction: {
          id: transaction._id,
          amount: transaction.amount,
          paymentOption: transaction.paymentOption,
          selectedTypes: transaction.selectedTypes,
          paymentDate: transaction.paymentDate,
          mode: transaction.mode,
          receivedBy: transaction.receivedBy,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('=== PAYMENT RECORD ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    return NextResponse.json(
      { 
        error: 'Failed to record payment', 
        details: error.message || 'Unknown error occurred',
        errorType: error.constructor.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
  });
}
