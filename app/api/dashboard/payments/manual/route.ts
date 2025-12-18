import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Payment from '@/models/dashboard/payments/Payment';
import PaymentTransaction from '@/models/dashboard/payments/PaymentTransaction';
import Student from '@/models/dashboard/student/Student';
import { IncomeModel } from '@/lib/dashboard/models';
import { processDropdownValues } from '@/lib/dashboard/dropdown-utils';
import type { MonthlySubscriptionRecord } from '@/lib/dashboard/payments/monthly-subscription-helper';

// Define the Cohort schema to access course IDs
const cohortSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  tenantId: String,
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
  tenantId: String,
  name: String,
  courseId: String,
  price: Number,
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

/**
 * Helper function to create an income record from a payment transaction
 */
async function createIncomeFromPayment(paymentData: any, payment: any, tenantId: string) {
  try {
    // Ensure date is properly formatted
    if (!paymentData.paymentDate) {
      throw new Error('Payment data has no date');
    }
    
    // Ensure amount is a valid number
    const amount = Number(paymentData.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error(`Invalid amount: ${paymentData.amount}`);
    }

    // Map payment transaction fields to income fields
    const incomeData = {
      tenantId: tenantId,
      date: new Date(paymentData.paymentDate),
      amount: amount,
      description: payment.enrolledCourseName 
        ? `${payment.enrolledCourse || ''} - ${payment.enrolledCourseName}`.trim() 
        : paymentData.notes || 'Course Payment',
      incomeCategory: "Course Fees",
      sourceType: "Students",
      paymentMode: paymentData.paymentMode || "Cash",
      status: "Completed",
      addToAccount: "", // Can be set based on business logic
      receivedBy: paymentData.receivedBy || "",
      receivedFrom: payment.studentName 
        ? `${payment.studentId || ''} - ${payment.studentName}`.trim()
        : paymentData.payerName || "",
      receiptNumber: "", // Leave empty when creating from payment transactions
    };

    // Create the income record
    const createdIncome = await IncomeModel.create(incomeData);
    
    // Auto-add dropdown values to their respective collections
    await processDropdownValues(incomeData, 'income');
    
    console.log("Income record created from payment:", createdIncome._id);
    return createdIncome;
  } catch (error: any) {
    console.error("Failed to create income record from payment:", error);
    throw error;
  }
}

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
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

/**
 * POST /api/payments/manual
 * Record a manual payment for any plan type
 */
export async function POST(request: NextRequest) {
  console.log('[Manual Payment API] Request received');
  
  try {
    const session = await getUserSession();
    console.log('[Manual Payment API] Session:', { 
      hasSession: !!session, 
      tenantId: session?.tenantId,
      userId: session?.userId 
    });
    
    if (!session?.tenantId) {
      console.log('[Manual Payment API] No tenant context, returning 401');
      return NextResponse.json(
        { error: 'Unauthorized: No tenant context' },
        { status: 401 }
      );
    }
    
    const tenantId = session.tenantId;
    
    return await runWithTenantContext(
      { tenantId: session.tenantId },
      async () => {
    try {
      console.log('[Manual Payment API] Inside runWithTenantContext');
      await dbConnect("uniqbrio");
      console.log('[Manual Payment API] Database connected');

    const body = await request.json();
    console.log('[Manual Payment API] Request body parsed:', {
      paymentId: body.paymentId,
      studentId: body.studentId,
      amount: body.amount,
      planType: body.planType,
      paymentMode: body.paymentMode,
    });
    
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
      console.log('[Manual Payment API] Missing required fields:', { paymentId, studentId, amount, paymentMode, paymentDate, planType, receivedBy });
      return NextResponse.json(
        { error: 'Missing required fields', details: { paymentId: !!paymentId, studentId: !!studentId, amount: !!amount, paymentMode: !!paymentMode, paymentDate: !!paymentDate, planType: !!planType, receivedBy: !!receivedBy } },
        { status: 400 }
      );
    }

    // Validate and normalize plan type
    // Map UI plan types to database-compatible values
    // Note: "One Time With Installments" is EMI for non-ongoing courses
    const planTypeMapping: Record<string, string> = {
      'ONE_TIME': 'ONE_TIME',
      'ONE_TIME_WITH_INSTALLMENTS': 'EMI', // This IS the EMI option for Short-term/Workshop/Event courses
      'MONTHLY_SUBSCRIPTION': 'MONTHLY_SUBSCRIPTION',
      'MONTHLY_WITH_DISCOUNTS': 'MONTHLY_SUBSCRIPTION', // Maps to MONTHLY_SUBSCRIPTION with discount
      'EMI': 'EMI',
      'CUSTOM': 'CUSTOM',
    };
    
    const validPlanTypes = Object.keys(planTypeMapping);
    if (!validPlanTypes.includes(planType)) {
      return NextResponse.json(
        { error: `Invalid plan type. Must be one of: ${validPlanTypes.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Normalize planType for database storage
    const normalizedPlanType = planTypeMapping[planType];
    const isInstallmentPlan = planType === 'ONE_TIME_WITH_INSTALLMENTS' || planType === 'EMI';
    const isDiscountedSubscription = planType === 'MONTHLY_WITH_DISCOUNTS' || isDiscountedPlan;

    // Validate EMI index/installment number for EMI/Installment plans
    if (isInstallmentPlan && (emiIndex === undefined || emiIndex === null) && (installmentNumber === undefined || installmentNumber === null)) {
      return NextResponse.json(
        { error: 'EMI index or installment number is required for EMI/Installment plan type' },
        { status: 400 }
      );
    }

    // Fetch student first (needed for both payment creation and email)
    const student = await Student.findOne({ studentId, tenantId: session.tenantId });
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Fetch payment record - handle both MongoDB ObjectId and studentId
    let payment;
    console.log('[Manual Payment API] Looking for payment with paymentId:', paymentId, 'studentId:', studentId, 'tenantId:', session.tenantId);
    
    if (mongoose.Types.ObjectId.isValid(paymentId) && paymentId.length === 24) {
      // paymentId is a valid MongoDB ObjectId - still need tenant check
      payment = await Payment.findOne({ _id: paymentId, tenantId: session.tenantId });
      console.log('[Manual Payment API] Found by _id:', !!payment);
    } else {
      // paymentId is actually a studentId - find by studentId
      payment = await Payment.findOne({ studentId: paymentId, tenantId: session.tenantId });
      console.log('[Manual Payment API] Found by paymentId as studentId:', !!payment);
    }
    
    // Also try to find payment by studentId if not found above
    if (!payment) {
      payment = await Payment.findOne({ studentId, tenantId: session.tenantId });
      console.log('[Manual Payment API] Found by studentId:', !!payment);
    }
    
    // Check for legacy payments without tenantId using native MongoDB driver (bypasses tenant plugin)
    // This is a migration helper - updates legacy records with the correct tenantId
    if (!payment) {
      try {
        const db = mongoose.connection.db;
        if (!db) {
          console.warn('[Manual Payment API] MongoDB connection db not available for legacy check');
        } else {
          const paymentsCollection = db.collection('payments');
          const legacyPayment = await paymentsCollection.findOne({
            studentId,
            $or: [
              { tenantId: { $exists: false } },
              { tenantId: null },
              { tenantId: '' }
            ]
          });
          
          if (legacyPayment) {
            console.log('[Manual Payment API] Found legacy payment without tenantId - migrating...');
            // Update the legacy payment with the correct tenantId
            await paymentsCollection.updateOne(
              { _id: legacyPayment._id },
              { $set: { tenantId: session.tenantId } }
            );
            console.log('[Manual Payment API] Legacy payment migrated with tenantId:', session.tenantId);
            
            // Now fetch through Mongoose with tenant context
            payment = await Payment.findOne({ _id: legacyPayment._id, tenantId: session.tenantId });
            console.log('[Manual Payment API] Payment retrieved after migration:', !!payment);
          }
        }
      } catch (migrationError) {
        console.error('[Manual Payment API] Error checking/migrating legacy payment:', migrationError);
        // Continue - will create new payment if needed
      }
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
          const cohort = await Cohort.findOne({ cohortId: student.cohortId, tenantId: session.tenantId }).lean();
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
          const course = await Course.findOne({ courseId, tenantId: session.tenantId }).lean();
          if (course && (course as any).price) {
            courseFee = (course as any).price;
            console.log(`Fetched course fee for ${courseId}: ${courseFee}`);
          } else {
            console.warn(`Course ${courseId} not found or has no price`);
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
        tenantId: session.tenantId,
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
        planType: normalizedPlanType || 'MONTHLY_SUBSCRIPTION',
        paymentOption: paymentOption || (planType === 'ONE_TIME' ? 'One Time' : planType === 'ONE_TIME_WITH_INSTALLMENTS' ? 'One Time With Installments' : isDiscountedSubscription ? 'Monthly With Discounts' : 'Monthly'),
        paymentStatus: 'PENDING',
      });
      
      console.log('Created new payment record:', payment._id);
      console.log(`Total fees: ${payment.outstandingAmount} (Course: ${courseFee}, CourseReg: ${courseRegistrationFee}, StudentReg: ${studentRegistrationFee})`);
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
          const cohort = await Cohort.findOne({ cohortId: student.cohortId, tenantId: session.tenantId }).lean();
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
          const course = await Course.findOne({ courseId, tenantId: session.tenantId }).lean();
          if (course && (course as any).price) {
            courseFee = (course as any).price;
            console.log(`Fetched course fee for ${courseId}: ${courseFee}`);
          }
          if (course && (course as any).type) {
            courseType = (course as any).type;
          }
        } catch (error) {
          console.error('Error fetching course fee:', error);
        }
      }
      
      // Update payment record with correct fees
      const receivedAmount = Number(payment.receivedAmount || 0);
      const newTotalFees = Number(courseFee) + Number(courseRegistrationFee) + Number(studentRegistrationFee);
      
      payment.courseFee = Number(courseFee);
      payment.courseRegistrationFee = Number(courseRegistrationFee);
      payment.studentRegistrationFee = Number(studentRegistrationFee);
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

    // Calculate maximum allowed payment based on total fees minus what's already been received
    const receivedAmount = payment.receivedAmount || 0;
    const isFirstPayment = receivedAmount === 0;
    
    // Calculate total fees that should be collected
    // Start with ALL fees (course + both registration fees)
    let totalFees = calculatedTotalFees;
    
    // Deduct registration fees that are already marked as paid
    const selectedTypes = body.selectedTypes || {};
    
    if (payment.studentRegistrationFeePaid && payment.studentRegistrationFee) {
      totalFees -= payment.studentRegistrationFee;
    }
    if (payment.courseRegistrationFeePaid && payment.courseRegistrationFee) {
      totalFees -= payment.courseRegistrationFee;
    }
    
    // Maximum allowed is total fees minus what's already been received
    const maxAllowedAmount = Math.max(0, totalFees - receivedAmount);
    
    // Only validate if we have a valid total fees amount
    if (totalFees > 0 && amount > maxAllowedAmount) {
      return NextResponse.json(
        {
          error: maxAllowedAmount === 0 
            ? `Payment already completed. No additional payment required.`
            : `Payment amount (${amount}) cannot exceed remaining balance (${maxAllowedAmount})`,
        },
        { status: 400 }
      );
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
    
    // Determine correct payment subtype based on plan type
    let finalPaymentSubType = paymentSubType;
    if (!paymentSubType) {
      if (isInstallmentPlan) {
        // EMI / One Time With Installments - use installment/EMI number
        const emiNum = installmentNumber || (emiIndex !== undefined ? emiIndex + 1 : 1);
        finalPaymentSubType = `EMI ${emiNum}`;
      } else if (planType === 'ONE_TIME') {
        // Pure one-time payment
        finalPaymentSubType = willBeFullyPaid ? 'Full Payment' : 'Partial Payment';
      }
      // Monthly subscriptions don't need a subtype
    }

    // Determine selected types (what this payment is covering)
    const finalSelectedTypes = {
      coursePayment: true, // One-Time payments always include course fee
      studentRegistrationFee: payment.studentRegistrationFee > 0,
      courseRegistrationFee: payment.courseRegistrationFee > 0,
    };

    // Generate unique sequential invoice number BEFORE creating PaymentTransaction
    // Each payment gets a unique invoice number in format INV-yyyymm-0001
    // Invoice numbers are unique per tenant per month
    const invoiceNumber = await generateInvoiceNumber(session.tenantId);

    // Fetch previous payment records for history (for EMI and installments)
    const previousRecords = await PaymentTransaction.find({
      paymentId: payment._id,
      tenantId: session.tenantId
    })
    .sort({ paidDate: 1 }) // Oldest first
    .lean();
    
    console.log(`Found ${previousRecords.length} previous payment records for payment ID: ${payment._id}`);

    // Create PaymentTransaction for comprehensive history tracking with invoice number
    const paymentRecord = await PaymentTransaction.create({
      tenantId: session.tenantId, // Explicit tenant isolation
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
      paymentOption: paymentOption || (planType === 'ONE_TIME' ? 'One Time' : planType === 'ONE_TIME_WITH_INSTALLMENTS' ? 'One Time With Installments' : isDiscountedSubscription ? 'Monthly With Discounts' : 'Monthly'),
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
    
    // Generate receipt number if not set
    if (!paymentRecord.receiptNumber) {
      await (paymentRecord as any).generateReceiptNumber();
    }
    
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

    // Create corresponding income record in financials
    let incomeRecord = null;
    try {
      incomeRecord = await createIncomeFromPayment({
        paymentDate: parsedPaymentDate,
        amount: amount,
        paymentMode: paymentMode,
        receivedBy: receivedBy,
        notes: notes,
        payerName: payerName
      }, payment, tenantId);
      console.log("✓ Income record created for financial tracking:", incomeRecord._id);
    } catch (incomeErr: any) {
      console.error("✗ Failed to create income record (payment still recorded):", incomeErr);
      // Note: Payment is still recorded even if income creation fails
      // This ensures payment workflow continues but logs the issue
    }

    // Determine if reminders should be auto-enabled for partial One-Time payments
    // Note: 'One Time With Installments' is EMI, not one-time - it has its own schedule
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
    // First try with tenant check, then fall back to without if needed (for legacy records)
    let updatedPayment = await Payment.findOneAndUpdate(
      { _id: payment._id, tenantId: session.tenantId },
      { $set: updates },
      { new: true }
    );

    // If not found with tenant filter, try updating by _id only and set tenantId
    if (!updatedPayment) {
      console.log('[Manual Payment API] Payment not found with tenant filter, trying without tenant and setting tenantId');
      updatedPayment = await Payment.findByIdAndUpdate(
        payment._id,
        { $set: { ...updates, tenantId: session.tenantId } },
        { new: true }
      );
    }

    if (!updatedPayment) {
      console.error('Failed to update payment record - payment not found:', {
        paymentId: payment._id,
        tenantId: session.tenantId
      });
      return NextResponse.json(
        { error: 'Failed to update payment record. Payment not found.' },
        { status: 404 }
      );
    }

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
    console.error('[Manual Payment API] Error recording payment:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Handle MongoDB duplicate key error
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return new NextResponse(
        JSON.stringify({
          error: 'A payment record already exists for this student',
          details: 'Please use the existing payment record or contact support if you believe this is an error.',
          errorName: 'DuplicatePaymentError',
        }),
        { 
          status: 409, // Conflict
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }
    
    return new NextResponse(
      JSON.stringify({
        error: 'Failed to record manual payment',
        details: error.message,
        errorName: error.name,
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
    });
  } catch (outerError: any) {
    console.error('[Manual Payment API] Outer error:', {
      message: outerError.message,
      stack: outerError.stack,
      name: outerError.name
    });
    return new NextResponse(
      JSON.stringify({
        error: 'Unexpected error in payment processing',
        details: outerError.message,
        errorName: outerError.name,
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

/**
 * GET /api/payments/manual?paymentId=xxx
 * Get payment history for a specific payment record
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
    const paymentId = searchParams.get('paymentId');
    const studentId = searchParams.get('studentId');

    if (!paymentId && !studentId) {
      return NextResponse.json(
        { error: 'Payment ID or Student ID is required' },
        { status: 400 }
      );
    }

    const query: any = { tenantId: session.tenantId };
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
  });
}
