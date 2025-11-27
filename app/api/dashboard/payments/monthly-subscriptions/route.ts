import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import MonthlySubscription from '@/models/dashboard/payments/MonthlySubscription';
import PaymentTransaction from '@/models/dashboard/payments/PaymentTransaction';
import { validateSubscriptionForm, validateRecurringPayment } from '@/lib/dashboard/payments/subscription-validation';
import { generateInvoiceNumber } from '@/lib/dashboard/payments/payment-processing-service';
import { dbConnect } from '@/lib/mongodb';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';
import { logEntityCreate, getClientIp, getUserAgent } from '@/lib/audit-logger';
import { AuditModule } from '@/models/AuditLog';

/**
 * POST /api/payments/monthly-subscriptions
 * Create a new monthly subscription and process first payment
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
  try {
    await dbConnect();
    
    const body = await request.json();
    const validation = validateSubscriptionForm(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.error.issues 
        }, 
        { status: 400 }
      );
    }

    const data = validation.data;
    
    // Calculate discounted amount if applicable
    let discountedMonthlyAmount: number | undefined;
    if (data.subscriptionType === 'monthly-subscription-discounted' && 
        data.discountType && data.discountValue) {
      if (data.discountType === 'percentage') {
        discountedMonthlyAmount = data.originalMonthlyAmount * (1 - data.discountValue / 100);
      } else {
        discountedMonthlyAmount = data.originalMonthlyAmount - data.discountValue;
      }
    }
    
    // Calculate first payment total
    const firstPaymentAmount = data.courseFee + data.registrationFee + 
      (discountedMonthlyAmount || data.originalMonthlyAmount);
    
    // Start transaction
    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();
    
    try {
      // Create monthly subscription
      const [savedSubscription] = await MonthlySubscription.create([{
        tenantId: session.tenantId,
        studentId: data.studentId,
        studentName: 'Student Name', // This should be fetched from student data
        courseId: data.courseId,
        courseName: 'Course Name', // This should be fetched from course data
        cohortId: data.cohortId,
        subscriptionType: data.subscriptionType,
        courseFee: data.courseFee,
        registrationFee: data.registrationFee,
        originalMonthlyAmount: data.originalMonthlyAmount,
        discountedMonthlyAmount,
        discountType: data.discountType,
        discountValue: data.discountValue,
        commitmentPeriod: data.commitmentPeriod,
        isFirstPaymentCompleted: true,
        startMonth: 1,
        currentMonth: 1,
        nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        reminderDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
        totalPaidAmount: firstPaymentAmount,
        createdBy: data.receivedBy,
      }], { session: mongoSession });
      
      // Generate invoice number
      const invoiceNumber = await generateInvoiceNumber();
      
      // Create payment record
      const [savedPaymentRecord] = await PaymentTransaction.create([{
        tenantId: session.tenantId,
        paymentId: new mongoose.Types.ObjectId(), // This should reference a Payment document if you have one
        monthlySubscriptionId: savedSubscription._id,
        studentId: data.studentId,
        studentName: 'Student Name', // Fetch from student data
        courseId: data.courseId,
        courseName: 'Course Name', // Fetch from course data
        cohortId: data.cohortId,
        paidAmount: firstPaymentAmount,
        paidDate: data.paymentDate,
        paymentMode: data.paymentMethod === 'cash' ? 'Cash' : 
                     data.paymentMethod === 'bank-transfer' ? 'Bank Transfer' :
                     data.paymentMethod === 'card' ? 'Card' : 'Others',
        paymentOption: data.subscriptionType === 'monthly-subscription' ? 
                       'Monthly Subscription' : 'Monthly Subscription With Discounts',
        paymentSubType: 'Monthly Subscription - First Payment',
        subscriptionMonth: 1,
        isRecurringPayment: false,
        isDiscountedPayment: data.subscriptionType === 'monthly-subscription-discounted',
        isFirstSubscriptionPayment: true,
        transactionId: data.transactionId,
        receivedBy: data.receivedBy,
        remarks: data.notes,
        invoiceNumber,
        invoiceGenerated: false, // Will be generated separately
        status: 'CONFIRMED',
      }], { session: mongoSession });
      
      // Update subscription with payment record reference
      await MonthlySubscription.findByIdAndUpdate(
        savedSubscription._id,
        { 
          $push: { paymentRecords: savedPaymentRecord._id },
          $set: { lastPaymentDate: data.paymentDate }
        },
        { session: mongoSession }
      );
      
      // Add audit log
      await savedSubscription.addAuditLog(
        'CREATED',
        data.receivedBy,
        {
          subscriptionType: data.subscriptionType,
          firstPaymentAmount,
          discountedMonthlyAmount,
          commitmentPeriod: data.commitmentPeriod
        },
        'Monthly subscription created with first payment'
      );
      
      await mongoSession.commitTransaction();
      
      // Log subscription creation to audit logger
      const headers = new Headers(request.headers);
      await logEntityCreate(
        AuditModule.PAYMENTS,
        savedSubscription._id.toString(),
        `${savedSubscription.studentName} - ${savedSubscription.courseName}`,
        session.userId,
        session.email,
        'super_admin',
        session.tenantId,
        getClientIp(headers),
        getUserAgent(headers),
        {
          subscriptionId: savedSubscription._id.toString(),
          studentId: data.studentId,
          courseId: data.courseId,
          cohortId: data.cohortId,
          subscriptionType: data.subscriptionType,
          amount: firstPaymentAmount,
          courseFee: data.courseFee,
          registrationFee: data.registrationFee,
          originalMonthlyAmount: data.originalMonthlyAmount,
          discountedMonthlyAmount,
          commitmentPeriod: data.commitmentPeriod,
          paymentMethod: data.paymentMethod,
          status: 'ACTIVE'
        }
      );
      
      // Log payment transaction creation to audit logger
      await logEntityCreate(
        AuditModule.PAYMENTS,
        savedPaymentRecord._id.toString(),
        `Payment for ${savedSubscription.studentName} - Month 1`,
        session.userId,
        session.email,
        'super_admin',
        session.tenantId,
        getClientIp(headers),
        getUserAgent(headers),
        {
          paymentId: savedPaymentRecord._id.toString(),
          subscriptionId: savedSubscription._id.toString(),
          studentId: data.studentId,
          amount: firstPaymentAmount,
          paymentMode: savedPaymentRecord.paymentMode,
          paymentOption: savedPaymentRecord.paymentOption,
          paymentSubType: savedPaymentRecord.paymentSubType,
          subscriptionMonth: 1,
          transactionId: data.transactionId,
          invoiceNumber,
          status: 'CONFIRMED',
          isFirstPayment: true
        }
      );
      
      return NextResponse.json({
        success: true,
        subscription: savedSubscription,
        paymentRecord: savedPaymentRecord,
        message: 'Monthly subscription created successfully'
      });
      
    } catch (error) {
      await mongoSession.abortTransaction();
      throw error;
    } finally {
      mongoSession.endSession();
    }
    
  } catch (error) {
    console.error('Monthly subscription creation error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create subscription' 
      }, 
      { status: 500 }
    );
  }
  });
}

/**
 * GET /api/payments/monthly-subscriptions?studentId=xxx
 * Get monthly subscription for a student
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
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    
    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }
    
    const subscription = await MonthlySubscription.findOne({ 
      studentId,
      status: { $in: ['ACTIVE', 'PAUSED'] }
    }).populate('paymentRecords');
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      subscription
    });
    
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to get subscription' 
      }, 
      { status: 500 }
    );
  }
  });
}