import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Payment from '@/models/dashboard/payments/Payment';
import { sendPaymentReminderEmail } from '@/lib/dashboard/email-service';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

/**
 * POST /api/payments/reminders/manual
 * Send a manual reminder for a payment
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
    await dbConnect("uniqbrio");

    const body = await request.json();
    const { paymentId, studentId } = body;

    if (!paymentId && !studentId) {
      return NextResponse.json(
        { error: 'Either paymentId or studentId is required' },
        { status: 400 }
      );
    }

    // Find payment record with tenant isolation
    let payment;
    if (paymentId) {
      payment = await Payment.findOne({ _id: paymentId, tenantId: session.tenantId });
    } else {
      payment = await Payment.findOne({ studentId, tenantId: session.tenantId });
    }

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    // Check if payment is fully paid
    if (payment.collectionRate >= 100 || payment.status === 'Completed') {
      return NextResponse.json(
        { error: 'Cannot send reminder for fully paid payment' },
        { status: 400 }
      );
    }

    // Check if reminders are enabled
    if (!payment.reminderEnabled) {
      return NextResponse.json(
        { error: 'Reminders are disabled for this payment' },
        { status: 400 }
      );
    }

    // Send reminder email
    try {
      await sendPaymentReminderEmail(
        payment.studentEmail || '',
        payment.studentName,
        {
          courseName: payment.enrolledCourseName || 'Course',
          dueDate: payment.nextPaymentDate || new Date(),
          amount: payment.dueAmount || payment.outstandingAmount || 0,
          outstandingBalance: payment.outstandingAmount || 0,
        }
      );

      // Increment reminder count and update last sent date
      payment.remindersCount = (payment.remindersCount || 0) + 1;
      payment.lastReminderSentAt = new Date();
      await payment.save();

      return NextResponse.json({
        success: true,
        message: 'Reminder sent successfully',
        reminderCount: payment.remindersCount,
        lastSentAt: payment.lastReminderSentAt,
      });
    } catch (emailError: any) {
      console.error('Error sending reminder email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send reminder email', details: emailError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error sending manual reminder:', error);
    return NextResponse.json(
      { error: 'Failed to send reminder', details: error.message },
      { status: 500 }
    );
  }
  }
  );
}
