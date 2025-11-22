import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Payment from '@/models/dashboard/payments/Payment';
import PaymentTransaction from '@/models/dashboard/payments/PaymentTransaction';
import Student from '@/models/dashboard/student/Student';
import type { MonthlySubscriptionRecord } from '@/lib/dashboard/payments/monthly-subscription-helper';

// Define the Cohort schema to access course IDs
const cohortSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  cohortId: String,
  cohortName: String,
  courseId: String,
}, {
  collection: 'cohorts',
  strict: false
});

const Cohort = mongoose.models.CohortForManualPayment || 
  mongoose.model('CohortForManualPayment', cohortSchema);

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

const Course = mongoose.models.CourseForManualPayment || 
  mongoose.model('CourseForManualPayment', courseSchema);
import {
  recordManualPayment,
  generateInvoiceNumber,
  updateReminderSchedule,
} from '@/lib/dashboard/payments/payment-processing-service';

// Helper function for Monthly Subscription
function getNextMonth(currentMonth: string): string {
  const date = new Date(currentMonth + '-01');
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 7);
}
import {
  generateInvoiceData,
  generateInvoicePDF,
  saveInvoice,
  sendPaymentConfirmation,
} from '@/lib/dashboard/payments/invoice-service';

/**
 * POST /api/payments/manual
 * Record a manual payment for any plan type
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect("uniqbrio");

    const body = await request.json();
    const {
      paymentId,
      studentId,
      amount,
      paymentMode,
      paymentDate,
      paymentTime,
      notes,
      attachments,
      payerType = 'student',
      payerName,
      planType,
      paymentOption,
      paymentSubType,
      emiIndex,
      installmentNumber,
      installmentsConfig,
      discount = 0,
      specialCharges = 0,
      receivedBy,
      reminderEnabled,
      nextReminderDate,
      preReminderEnabled = false,
      reminderFrequency = 'DAILY',
      stopReminders = false,
      // Monthly Subscription data (new system)
      monthlySubscription,
      // Legacy Ongoing Training - Monthly Subscription fields
      courseCategory,
      courseDurationInMonths,
      baseMonthlyAmount,
      isDiscountedPlan,
      discountType,
      discountValue,
      lockInMonths,
      discountedMonthlyAmount,
      totalPayable,
      totalSavings,
    } = body;

    // Validate required fields
    if (!paymentId || !studentId || !amount || !paymentMode || !paymentDate || !planType || !receivedBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate plan type
    const validPlanTypes = ['ONE_TIME', 'MONTHLY_SUBSCRIPTION', 'EMI', 'CUSTOM'];
    if (!validPlanTypes.includes(planType)) {
      return NextResponse.json(
        { error: `Invalid plan type. Must be one of: ${validPlanTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate EMI index for EMI plan
    if (planType === 'EMI' && (emiIndex === undefined || emiIndex === null)) {
      return NextResponse.json(
        { error: 'EMI index is required for EMI plan type' },
        { status: 400 }
      );
    }

    // Fetch student first (needed for both payment creation and email)
    const student = await Student.findOne({ studentId });
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Fetch payment record - handle both MongoDB ObjectId and studentId
    let payment;
    if (mongoose.Types.ObjectId.isValid(paymentId) && paymentId.length === 24) {
      // paymentId is a valid MongoDB ObjectId
      payment = await Payment.findById(paymentId);
    } else {
      // paymentId is actually a studentId - find by studentId
      payment = await Payment.findOne({ studentId: paymentId });
    }
    
    // If payment record doesn't exist, create it from student data
    if (!payment) {
      console.log('Payment record not found for student', studentId, '- creating new record');
      
      // Define standard registration fees
      const courseRegistrationFee = 1000;
      const studentRegistrationFee = 500;
      
      // Fetch course fee from courses collection
      let courseFee = 0;
      let courseType = 'Individual';
      let courseId = student.enrolledCourse;
      
      // If student doesn't have enrolledCourse, get it from cohort
      if (!courseId && student.cohortId) {
        console.log(`Student has no enrolledCourse, fetching from cohort: ${student.cohortId}`);
        try {
          const cohort = await Cohort.findOne({ cohortId: student.cohortId }).lean();
          if (cohort && (cohort as any).courseId) {
            courseId = (cohort as any).courseId;
            console.log(`Found courseId from cohort: ${courseId}`);
          } else {
            console.warn(`Cohort ${student.cohortId} not found or has no courseId`);
          }
        } catch (error) {
          console.error('Error fetching cohort:', error);
        }
      }
      
      if (courseId) {
        try {
          const course = await Course.findOne({ courseId }).lean();
          if (course && (course as any).priceINR) {
            courseFee = (course as any).priceINR;
            console.log(`Fetched course fee for ${courseId}: ₹${courseFee}`);
          } else {
            console.warn(`Course ${courseId} not found or has no priceINR`);
          }
          if (course && (course as any).type) {
            courseType = (course as any).type;
          }
        } catch (error) {
          console.error('Error fetching course fee:', error);
          // Continue with courseFee = 0 if fetch fails
        }
      } else {
        console.warn('Student has no enrolledCourse or cohortId set');
      }
      
      payment = await Payment.create({
        studentId: student.studentId,
        studentName: student.name,
        studentCategory: student.category || 'N/A',
        enrolledCourse: courseId || '',
        enrolledCourseId: courseId || '',
        enrolledCourseName: student.enrolledCourseName || '',
        cohortId: student.cohortId || '',
        cohortName: student.cohortName || '',
        courseType: courseType,
        courseRegistrationFee,
        studentRegistrationFee,
        courseFee,
        receivedAmount: 0,
        outstandingAmount: courseRegistrationFee + studentRegistrationFee + courseFee,
        collectionRate: 0,
        status: 'Pending',
        planType: planType || 'MONTHLY_SUBSCRIPTION',
        paymentStatus: 'PENDING',
      });
      
      console.log('Created new payment record:', payment._id);
      console.log(`Total fees: ₹${payment.outstandingAmount} (Course: ₹${courseFee}, CourseReg: ₹${courseRegistrationFee}, StudentReg: ₹${studentRegistrationFee})`);
    }

    // Check if existing payment record has zero or missing fees and update them
    const currentTotalFees = (payment.courseFee || 0) + 
                             (payment.courseRegistrationFee || 0) + 
                             (payment.studentRegistrationFee || 0);
    
    if (currentTotalFees === 0 || !payment.courseFee) {
      console.log('Payment record has missing or zero fees, fetching from cohort/course...');
      
      const courseRegistrationFee = 1000;
      const studentRegistrationFee = 500;
      let courseFee = 0;
      let courseType = 'Individual';
      let courseId = payment.enrolledCourse || payment.enrolledCourseId;
      
      // If payment doesn't have courseId, get it from student's cohort
      if (!courseId && student.cohortId) {
        console.log(`Payment has no courseId, fetching from cohort: ${student.cohortId}`);
        try {
          const cohort = await Cohort.findOne({ cohortId: student.cohortId }).lean();
          if (cohort && (cohort as any).courseId) {
            courseId = (cohort as any).courseId;
            console.log(`Found courseId from cohort: ${courseId}`);
          }
        } catch (error) {
          console.error('Error fetching cohort:', error);
        }
      }
      
      if (courseId) {
        try {
          const course = await Course.findOne({ courseId }).lean();
          if (course && (course as any).priceINR) {
            courseFee = (course as any).priceINR;
            console.log(`Fetched course fee for ${courseId}: ₹${courseFee}`);
          }
          if (course && (course as any).type) {
            courseType = (course as any).type;
          }
        } catch (error) {
          console.error('Error fetching course fee:', error);
        }
      }
      
      // Update payment record with correct fees
      const receivedAmount = payment.receivedAmount || 0;
      const newTotalFees = courseFee + courseRegistrationFee + studentRegistrationFee;
      
      payment.courseFee = courseFee;
      payment.courseRegistrationFee = courseRegistrationFee;
      payment.studentRegistrationFee = studentRegistrationFee;
      payment.outstandingAmount = newTotalFees - receivedAmount;
      payment.enrolledCourse = courseId || payment.enrolledCourse;
      payment.enrolledCourseId = courseId || payment.enrolledCourseId;
      payment.courseType = courseType;
      
      await payment.save();
      
      console.log('Updated payment record with correct fees:', {
        courseFee,
        courseRegistrationFee,
        studentRegistrationFee,
        totalFees: newTotalFees,
        receivedAmount,
        outstandingAmount: payment.outstandingAmount
      });
    }

    // Validate that fees are set in the payment record
    const calculatedTotalFees = (payment.courseFee || 0) + 
                      (payment.courseRegistrationFee || 0) + 
                      (payment.studentRegistrationFee || 0);
    
    if (calculatedTotalFees === 0) {
      console.error('Payment record has zero fees!', {
        studentId: payment.studentId,
        courseFee: payment.courseFee,
        courseRegistrationFee: payment.courseRegistrationFee,
        studentRegistrationFee: payment.studentRegistrationFee,
      });
      return NextResponse.json(
        { 
          error: 'Cannot record payment: Total fees are not set for this student. Please update the course fees first or contact support.',
          details: 'The payment record has courseFee=0, courseRegistrationFee=0, and studentRegistrationFee=0'
        },
        { status: 400 }
      );
    }

    // Validate payment amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Payment amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Only validate against outstanding amount if the payment record has fees set
    // Skip validation for newly created records (receivedAmount = 0, outstandingAmount = 0)
    const isNewPaymentRecord = payment.receivedAmount === 0 && payment.outstandingAmount === 0;
    const isFirstPayment = payment.receivedAmount === 0;
    
    if (!isNewPaymentRecord) {
      let maxAllowedAmount = payment.outstandingAmount;
      
      // For first payment, allow registration fees to be included
      if (isFirstPayment) {
        if (!payment.studentRegistrationFeePaid && payment.studentRegistrationFee) {
          maxAllowedAmount += payment.studentRegistrationFee;
        }
        if (!payment.courseRegistrationFeePaid && payment.courseRegistrationFee) {
          maxAllowedAmount += payment.courseRegistrationFee;
        }
      }
      
      if (amount > maxAllowedAmount) {
        return NextResponse.json(
          {
            error: isFirstPayment 
              ? `Payment amount (₹${amount}) cannot exceed ₹${maxAllowedAmount} (course fee + registration fees)`
              : `Payment amount (₹${amount}) cannot exceed outstanding amount (₹${payment.outstandingAmount})`,
          },
          { status: 400 }
        );
      }
    }

    // Parse payment date
    const parsedPaymentDate = new Date(paymentDate);
    if (isNaN(parsedPaymentDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid payment date' },
        { status: 400 }
      );
    }

    // Calculate what will be the state after this payment
    const totalAfterPayment = (payment.receivedAmount || 0) + amount;
    const willBeFullyPaid = totalAfterPayment >= calculatedTotalFees;
    
    // Determine correct payment subtype for One-Time payments
    let finalPaymentSubType = paymentSubType;
    if (planType === 'ONE_TIME' && !paymentSubType) {
      finalPaymentSubType = willBeFullyPaid ? 'Full Payment' : 'Partial Payment';
    }

    // Determine selected types (what this payment is covering)
    const finalSelectedTypes = {
      coursePayment: true, // One-Time payments always include course fee
      studentRegistrationFee: payment.studentRegistrationFee > 0,
      courseRegistrationFee: payment.courseRegistrationFee > 0,
    };

    // Generate unique sequential invoice number BEFORE creating PaymentTransaction
    // Each payment gets a unique invoice number in format INV-yyyymm-0001
    const invoiceNumber = await generateInvoiceNumber();

    // Fetch previous payment records for history (for EMI and installments)
    const previousRecords = await PaymentTransaction.find({
      paymentId: payment._id
    })
    .sort({ paidDate: 1 }) // Oldest first
    .lean();
    
    console.log(`Found ${previousRecords.length} previous payment records for payment ID: ${payment._id}`);

    // Create PaymentTransaction for comprehensive history tracking with invoice number
    const paymentRecord = await PaymentTransaction.create({
      paymentId: payment._id.toString(),
      studentId,
      studentName: payment.studentName,
      enrollmentId: payment.enrollmentId,
      courseId: payment.enrolledCourseId || payment.enrolledCourse,
      courseName: payment.enrolledCourseName,
      cohortId: payment.cohortId,
      paidAmount: amount,
      paidDate: parsedPaymentDate,
      paymentMode,
      transactionId: '', // Will be set after creation
      notes,
      payerType,
      payerName: payerName || payment.studentName,
      paymentOption: paymentOption || (planType === 'ONE_TIME' ? 'One Time' : 'Monthly'),
      paymentSubType: finalPaymentSubType,
      installmentNumber: paymentOption === 'One Time With Installments' ? installmentNumber : undefined,
      emiNumber: planType === 'EMI' ? (emiIndex + 1) : undefined,
      discount: discount || 0,
      specialCharges: specialCharges || 0,
      receivedBy,
      paymentTime,
      attachments: attachments || [],
      invoiceNumber: invoiceNumber, // Set with generated invoice number immediately
      status: 'CONFIRMED',
    });

    console.log('PaymentTransaction created:', paymentRecord._id);
    
    // Update the transactionId to reference itself
    paymentRecord.transactionId = paymentRecord._id.toString();
    await paymentRecord.save();
    const paymentSequence = previousRecords.length + 1;
    
    console.log(`Generated sequential invoice ${invoiceNumber} for payment ${paymentSequence} (${previousRecords.length} previous payments found)`);
    
    const invoiceData = generateInvoiceData(
      payment,
      {
        _id: paymentRecord._id.toString(),
        paymentId,
        studentId,
        studentName: payment.studentName,
        paidAmount: amount,
        paymentMode,
        paidDate: parsedPaymentDate,
        paymentTime,
        notes,
        attachments,
        payerType,
        payerName,
        planType,
        paymentOption,
        paymentSubType: finalPaymentSubType,
        emiIndex,
        discount,
        specialCharges,
        receivedBy,
        invoiceNumber,
        amount,
        paymentDate: parsedPaymentDate,
        sequenceNumber: paymentSequence,
        totalPayments: paymentSequence,
      } as any,
      invoiceNumber,
      previousRecords
    );

    // Generate and save invoice PDF
    const invoicePdfUrl = await generateInvoicePDF(invoiceData);
    await saveInvoice(invoiceData, invoicePdfUrl);

    // Update PaymentTransaction with invoice URL and generation status
    paymentRecord.invoiceUrl = invoicePdfUrl;
    paymentRecord.invoiceGenerated = true;
    paymentRecord.invoiceGeneratedAt = new Date();
    
    await paymentRecord.save();
    console.log(`PaymentRecord updated with invoice URL: ${invoiceNumber} (Payment ${paymentSequence} for student ${studentId})`);

    // Determine if reminders should be auto-enabled for partial One-Time payments
    const isOneTimePayment = planType === 'ONE_TIME' || paymentOption === 'One Time';
    const totalFeesForReminder = (payment.courseFee || 0) + 
                      (payment.studentRegistrationFee || 0) + 
                      (payment.courseRegistrationFee || 0);
    const currentPaid = (payment.receivedAmount || 0) + amount;
    const isPartialPayment = isOneTimePayment && currentPaid > 0 && currentPaid < totalFeesForReminder;

    // Auto-enable reminders for partial One-Time payments (unless explicitly stopped)
    const shouldAutoEnableReminders = isPartialPayment && !stopReminders;
    const finalReminderEnabled = shouldAutoEnableReminders ? true : (stopReminders ? false : reminderEnabled);

    console.log('Reminder auto-enable decision:', {
      isOneTimePayment,
      totalFees: totalFeesForReminder,
      currentPaid,
      isPartialPayment,
      shouldAutoEnableReminders,
      finalReminderEnabled,
      stopReminders,
      reminderEnabledFromRequest: reminderEnabled
    });

    // Process payment based on plan type
    const paymentData = {
      paymentId,
      studentId,
      amount,
      paymentMode,
      paymentDate: parsedPaymentDate,
      paymentTime,
      notes,
      attachments,
      payerType,
      payerName,
      planType,
      emiIndex,
      discount,
      specialCharges,
      receivedBy,
      reminderEnabled: finalReminderEnabled,
      nextReminderDate: nextReminderDate ? new Date(nextReminderDate) : undefined,
      preReminderEnabled,
      reminderFrequency: stopReminders ? 'NONE' : (isPartialPayment ? 'DAILY' : reminderFrequency),
      stopReminders,
    };

    const updates = await recordManualPayment(
      payment,
      paymentData,
      paymentRecord._id.toString()
    );

    // Add invoice URL to updates
    updates.invoiceUrl = invoicePdfUrl;
    
    // Save payment option and plan type to payment record
    updates.paymentOption = paymentOption;
    updates.planType = planType;
    
    // Process Monthly Subscription logic
    if (monthlySubscription) {
      console.log('Processing Monthly Subscription:', monthlySubscription);
      
      // Update payment record with monthly subscription data
      updates.monthlySubscription = {
        type: monthlySubscription.monthlySubscriptionType,
        currentMonth: monthlySubscription.currentMonth,
        monthlyFee: monthlySubscription.monthlyFee,
        originalMonthlyFee: monthlySubscription.originalMonthlyFee,
        discountedMonthlyFee: monthlySubscription.discountedMonthlyFee || 0,
        commitmentPeriod: monthlySubscription.commitmentPeriod,
        isFirstPayment: monthlySubscription.isFirstPayment,
        monthlyRecords: monthlySubscription.monthlyRecords,
        lastUpdated: new Date()
      };
      
      // For Monthly Subscriptions, don't track traditional outstanding amount
      // Instead, track based on monthly records
      const paidMonths = monthlySubscription.monthlyRecords.filter((r: MonthlySubscriptionRecord) => r.status === 'PAID').length;
      
      // Update status based on monthly subscription logic
      if (monthlySubscription.isFirstPayment) {
        updates.status = 'Paid'; // First month is now paid
      } else {
        updates.status = 'Paid'; // Current month is paid
      }
      
      // For monthly subscriptions, there's no outstanding amount concept
      // Each month is a separate recurring payment, not part of a total outstanding balance
      updates.outstandingAmount = 0;
      
      // Calculate next month details for reminder system
      const nextMonth = getNextMonth(monthlySubscription.currentMonth);
      const isStillInCommitment = monthlySubscription.commitmentPeriod ? 
        paidMonths < monthlySubscription.commitmentPeriod : false;
      const nextMonthFee = (monthlySubscription.monthlySubscriptionType === 'WITH_DISCOUNTS' && isStillInCommitment) ?
        monthlySubscription.discountedMonthlyFee : monthlySubscription.originalMonthlyFee;
      
      // Auto-generate next month's reminder
      const nextMonthDate = new Date(nextMonth + '-01');
      nextMonthDate.setDate(1); // First day of next month
      nextMonthDate.setHours(9, 0, 0, 0); // 9 AM
      
      updates.nextReminderDate = nextMonthDate;
      updates.reminderEnabled = true;
      updates.reminderFrequency = 'MONTHLY';
      
      console.log('Monthly Subscription processed:', {
        currentMonth: monthlySubscription.currentMonth,
        nextMonth,
        nextMonthFee,
        paidMonths,
        nextReminderDate: updates.nextReminderDate
      });
    }
    
    // Save Ongoing Training subscription data if provided
    if (courseCategory === "Ongoing Training") {
      updates.courseCategory = courseCategory;
      updates.courseDurationInMonths = courseDurationInMonths;
      updates.baseMonthlyAmount = baseMonthlyAmount;
      updates.isDiscountedPlan = isDiscountedPlan;
      
      if (isDiscountedPlan) {
        updates.discountType = discountType;
        updates.discountValue = discountValue;
        updates.lockInMonths = lockInMonths;
        updates.discountedMonthlyAmount = discountedMonthlyAmount;
        updates.totalPayable = totalPayable;
        updates.totalSavings = totalSavings;
      }
      
      console.log('Saving Ongoing Training subscription data:', {
        courseCategory,
        baseMonthlyAmount,
        isDiscountedPlan,
        ...(isDiscountedPlan && {
          discountType,
          discountValue,
          lockInMonths,
          discountedMonthlyAmount,
          totalPayable,
          totalSavings
        })
      });
    }
    
    console.log('Saving payment updates:', {
      paymentOption,
      planType,
      hasInstallmentsConfig: !!installmentsConfig,
      installmentNumber
    });
    
    // Save installments configuration if provided and mark current installment as paid
    if (installmentsConfig && installmentNumber) {
      // Update the specific installment as PAID
      const updatedInstallments = installmentsConfig.installments.map((inst: any) => {
        if (inst.installmentNumber === installmentNumber) {
          return {
            ...inst,
            status: 'PAID',
            paidDate: parsedPaymentDate,
            paidAmount: amount,
            transactionId: paymentRecord._id.toString()
          };
        }
        return inst;
      });
      
      // Find next unpaid installment to set nextDueDate and nextReminderDate
      const nextUnpaidInstallment = updatedInstallments.find((inst: any) => inst.status === 'UNPAID');
      if (nextUnpaidInstallment && reminderEnabled) {
        updates.nextDueDate = new Date(nextUnpaidInstallment.dueDate);
        updates.nextReminderDate = new Date(nextUnpaidInstallment.reminderDate);
        updates.reminderEnabled = true;
      } else if (!nextUnpaidInstallment) {
        // All installments paid - clear reminder dates
        updates.nextDueDate = null;
        updates.nextReminderDate = null;
        updates.reminderEnabled = false;
      }
      
      // Extract courseDuration as number (durationInDays) if it's an object
      let courseDurationValue = installmentsConfig.courseDuration;
      if (typeof courseDurationValue === 'object' && courseDurationValue !== null) {
        courseDurationValue = courseDurationValue.durationInDays;
      }
      
      updates.installmentsConfig = {
        totalAmount: installmentsConfig.totalAmount,
        installmentCount: installmentsConfig.installmentCount || 3,
        courseDuration: courseDurationValue,
        installments: updatedInstallments
      };
      
      console.log('Installments config saved:', {
        totalInstallments: updatedInstallments.length,
        paidInstallments: updatedInstallments.filter((i: any) => i.status === 'PAID').length,
        nextDueDate: updates.nextDueDate,
        nextReminderDate: updates.nextReminderDate,
        courseDuration: courseDurationValue
      });
    } else {
      console.log('No installments config to save');
    }

    // Check if this is a One-Time payment that's now fully paid
    const isOneTimeFullyPaid = 
      planType === 'ONE_TIME' && 
      (updates.paymentStatus === 'FULLY_PAID' || updates.collectionRate >= 100);

    // Update reminder schedule if needed (but not for fully paid One-Time payments)
    // IMPORTANT: Don't override nextDueDate/nextReminderDate if already set by processOneTimePayment
    const hasExistingReminderSchedule = updates.nextDueDate && updates.nextReminderDate;
    
    if (!isOneTimeFullyPaid && !hasExistingReminderSchedule && updates.nextPaymentDate) {
      // Only calculate reminder schedule if not already set (for EMI, Monthly, etc.)
      const reminderUpdate = updateReminderSchedule(
        planType,
        updates.nextPaymentDate,
        reminderEnabled || false
      );
      updates.reminderEnabled = reminderUpdate.reminderEnabled;
      updates.nextReminderDate = reminderUpdate.nextReminderDate;
      // Set nextDueDate from nextPaymentDate if not already set
      if (!updates.nextDueDate && updates.nextPaymentDate) {
        updates.nextDueDate = updates.nextPaymentDate;
      }
    } else if (isOneTimeFullyPaid) {
      // For One-Time fully paid: disable reminders, clear next payment date
      updates.reminderEnabled = false;
      updates.nextReminderDate = null;
      updates.nextDueDate = null;
      updates.nextPaymentDate = null;
      updates.status = 'Completed';
    }

    console.log('Final updates before database save:', {
      reminderEnabled: updates.reminderEnabled,
      nextReminderDate: updates.nextReminderDate,
      nextDueDate: updates.nextDueDate,
      nextPaymentDate: updates.nextPaymentDate,
      paymentStatus: updates.paymentStatus,
      status: updates.status,
      outstandingAmount: updates.outstandingAmount,
      collectionRate: updates.collectionRate
    });

    // Update payment record using the actual MongoDB _id
    const updatedPayment = await Payment.findByIdAndUpdate(
      payment._id,
      { $set: updates },
      { new: true }
    );

    console.log('Payment updated in database. Verifying saved data:', {
      _id: updatedPayment._id,
      nextReminderDate: updatedPayment.nextReminderDate,
      nextDueDate: updatedPayment.nextDueDate,
      reminderEnabled: updatedPayment.reminderEnabled
    });

    // Determine if this is the last payment (fully paid)
    // Use the UPDATED outstanding amount, not the old one
    const isLastPayment =
      updates.paymentStatus === 'FULLY_PAID' ||
      updates.paymentStatus === 'PAID' ||
      updates.collectionRate >= 100 ||
      updates.outstandingAmount === 0;

    console.log('Payment completion check:', {
      paymentStatus: updates.paymentStatus,
      collectionRate: updates.collectionRate,
      outstandingAmount: updates.outstandingAmount,
      isLastPayment,
    });

    // Add student email to payment object for email sending
    const paymentWithEmail = {
      ...updatedPayment.toObject(),
      studentEmail: student.email,
    };

    // Send payment confirmation email
    try {
      await sendPaymentConfirmation(
        paymentWithEmail,
        {
          _id: paymentRecord._id.toString(),
          paymentId,
          studentId,
          studentName: payment.studentName,
          paidAmount: amount,
          paymentMode,
          paidDate: parsedPaymentDate,
          paymentTime,
          notes,
          attachments,
          payerType,
          payerName,
          planType,
          emiIndex,
          discount,
          specialCharges,
          receivedBy,
          invoiceUrl: invoicePdfUrl,
          invoiceNumber,
          amount,
          paymentDate: parsedPaymentDate,
        } as any,
        invoicePdfUrl,
        isLastPayment
      );
    } catch (emailError) {
      console.error('Error sending payment confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: isLastPayment 
          ? 'Payment recorded successfully. Student is now fully paid!' 
          : 'Payment recorded successfully',
        payment: {
          ...updatedPayment.toObject(),
          isFullyPaid: isLastPayment,
          paymentCategory: paymentOption,
          paymentType: paymentSubType,
        },
        transaction: {
          ...paymentRecord.toObject(),
          invoiceNumber,
        },
        invoice: {
          invoiceNumber,
          invoiceUrl: invoicePdfUrl,
          generatedAt: new Date().toISOString(),
        },
        status: {
          isFullyPaid: isLastPayment,
          outstandingAmount: updatedPayment.outstandingAmount || 0,
          collectionRate: updatedPayment.collectionRate || 0,
          reminderEnabled: updatedPayment.reminderEnabled || false,
          nextPaymentDate: updatedPayment.nextPaymentDate || null,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error recording manual payment:', error);
    return NextResponse.json(
      {
        error: 'Failed to record manual payment',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/manual?paymentId=xxx
 * Get payment history for a specific payment record
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect("uniqbrio");

    const searchParams = request.nextUrl.searchParams;
    const paymentId = searchParams.get('paymentId');
    const studentId = searchParams.get('studentId');

    if (!paymentId && !studentId) {
      return NextResponse.json(
        { error: 'Payment ID or Student ID is required' },
        { status: 400 }
      );
    }

    const query: any = {};
    if (paymentId) query.paymentId = paymentId;
    if (studentId) query.studentId = studentId;

    const paymentRecords = await PaymentTransaction.find(query)
      .sort({ paidDate: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        transactions: paymentRecords, // Keep same response format for compatibility
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching payment transactions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch payment transactions',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
