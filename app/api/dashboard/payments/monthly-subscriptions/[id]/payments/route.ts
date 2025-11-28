import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import MonthlySubscription from '@/models/dashboard/payments/MonthlySubscription';
import PaymentTransaction from '@/models/dashboard/payments/PaymentTransaction';
import { validateRecurringPayment } from '@/lib/dashboard/payments/subscription-validation';
import { generateInvoiceNumber } from '@/lib/dashboard/payments/payment-processing-service';
import { dbConnect } from '@/lib/mongodb';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

/**
 * POST /api/payments/monthly-subscriptions/[id]/payments
 * Process recurring payment for monthly subscription
 */
export async function POST(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
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
    
    const { subscriptionId } = params;
    const body = await request.json();
    
    const validation = validateRecurringPayment({
      ...body,
      monthlySubscriptionId: subscriptionId
    });
    
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
    
    // Get subscription with tenant isolation
    const subscription = await MonthlySubscription.findOne({ _id: subscriptionId, tenantId: session.tenantId });
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }
    
    if (subscription.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Subscription is not active' },
        { status: 400 }
      );
    }
    
    // Calculate next month number
    const nextMonth = subscription.currentMonth + 1;
    
    // Determine if payment should be discounted
    const isDiscounted = subscription.subscriptionType === 'monthly-subscription-discounted' &&
                        subscription.commitmentPeriod &&
                        nextMonth <= subscription.commitmentPeriod;
    
    const expectedAmount = isDiscounted ? 
      (subscription.discountedMonthlyAmount || subscription.originalMonthlyAmount) :
      subscription.originalMonthlyAmount;
    
    // Validate payment amount
    const tolerance = 0.01;
    if (Math.abs(data.paymentAmount - expectedAmount) > tolerance) {
      return NextResponse.json(
        { 
          error: `Payment amount (${data.paymentAmount}) does not match expected amount (${expectedAmount.toFixed(2)})` 
        },
        { status: 400 }
      );
    }
    
    // Start transaction
    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();
    
    try {
      // Generate invoice number (tenant-specific)
      const invoiceNumber = await generateInvoiceNumber(session.tenantId);
      
      // Create payment record
      const [savedPaymentRecord] = await PaymentTransaction.create([{
        tenantId: session.tenantId,
        paymentId: new mongoose.Types.ObjectId(), // This should reference a Payment document if you have one
        monthlySubscriptionId: subscription._id,
        studentId: subscription.studentId,
        studentName: subscription.studentName,
        courseId: subscription.courseId,
        courseName: subscription.courseName,
        cohortId: subscription.cohortId,
        paidAmount: data.paymentAmount,
        paidDate: data.paymentDate,
        paymentMode: data.paymentMethod === 'cash' ? 'Cash' : 
                     data.paymentMethod === 'bank-transfer' ? 'Bank Transfer' :
                     data.paymentMethod === 'card' ? 'Card' : 'Others',
        paymentOption: subscription.subscriptionType === 'monthly-subscription' ? 
                       'Monthly Subscription' : 'Monthly Subscription With Discounts',
        paymentSubType: isDiscounted ? 
                        'Monthly Subscription - Discounted Payment' :
                        'Monthly Subscription - Recurring Payment',
        subscriptionMonth: nextMonth,
        isRecurringPayment: true,
        isDiscountedPayment: isDiscounted,
        isFirstSubscriptionPayment: false,
        transactionId: data.transactionId,
        receivedBy: data.receivedBy,
        remarks: data.notes,
        invoiceNumber,
        invoiceGenerated: false, // Will be generated separately
        status: 'CONFIRMED',
      }], { session: mongoSession });
      
      // Calculate next due date (30 days from payment date)
      const nextDueDate = new Date(data.paymentDate);
      nextDueDate.setDate(nextDueDate.getDate() + 30);
      
      // Calculate reminder date (5 days before due date)
      const reminderDate = new Date(nextDueDate);
      reminderDate.setDate(nextDueDate.getDate() - 5);
      
      // Update subscription
      const updatedSubscription = await MonthlySubscription.findByIdAndUpdate(
        subscription._id,
        { 
          $push: { paymentRecords: savedPaymentRecord._id },
          $inc: { 
            currentMonth: 1,
            totalPaidAmount: data.paymentAmount
          },
          $set: { 
            lastPaymentDate: data.paymentDate,
            nextDueDate,
            reminderDate,
            lastUpdatedBy: data.receivedBy
          }
        },
        { session: mongoSession, new: true }
      );
      
      // Add audit log
      await subscription.addAuditLog(
        'PAYMENT_PROCESSED',
        data.receivedBy,
        {
          monthNumber: nextMonth,
          paymentAmount: data.paymentAmount,
          isDiscounted,
          expectedAmount,
          paymentRecordId: savedPaymentRecord._id
        },
        `Month ${nextMonth} payment processed`
      );
      
      await mongoSession.commitTransaction();
      
      return NextResponse.json({
        success: true,
        subscription: updatedSubscription,
        paymentRecord: savedPaymentRecord,
        message: `Month ${nextMonth} payment processed successfully`
      });
      
    } catch (error) {
      await mongoSession.abortTransaction();
      throw error;
    } finally {
      mongoSession.endSession();
    }
    
  } catch (error) {
    console.error('Recurring payment error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process payment' 
      }, 
      { status: 500 }
    );
  }
    }
  );
}