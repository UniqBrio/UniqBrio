import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Payment from '@/models/dashboard/payments/Payment';
import { sendPaymentReminderNotification } from '@/lib/dashboard/notification-service';

/**
 * GET /api/payments/reminders/cron
 * Automated cron job to send daily payment reminders
 * Should be called daily at 10:00 AM
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect("uniqbrio");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('[Payment Reminders Cron] Running at:', new Date().toISOString());

    // Find all payments that need reminders today
    const paymentsNeedingReminders = await Payment.find({
      reminderEnabled: true,
      collectionRate: { $lt: 100 },
      status: { $ne: 'Completed' },
      outstandingAmount: { $gt: 0 },
      $or: [
        { nextReminderDate: { $lte: today } },
        { nextPaymentDate: { $lte: today } }
      ],
      // Only send for One-Time partial or Monthly subscriptions
      planType: { $in: ['ONE_TIME', 'MONTHLY_SUBSCRIPTION'] }
    }).lean();

    console.log(`[Payment Reminders Cron] Found ${paymentsNeedingReminders.length} payments needing reminders`);

    const results = {
      total: paymentsNeedingReminders.length,
      sent: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const payment of paymentsNeedingReminders) {
      try {
        // Skip if no email address
        if (!payment.studentEmail) {
          console.log(`[Payment Reminders Cron] Skipping ${payment.studentId} - no email`);
          results.failed++;
          results.errors.push({
            studentId: payment.studentId,
            error: 'No email address',
          });
          continue;
        }

        // Send reminder notifications (email + in-app)
        const notificationResults = await sendPaymentReminderNotification(
          payment.studentId,
          payment.studentEmail,
          payment.studentName,
          {
            courseName: payment.enrolledCourseName || 'Course',
            dueDate: payment.nextPaymentDate || new Date(),
            amount: payment.dueAmount || payment.outstandingAmount || 0,
            outstandingBalance: payment.outstandingAmount || 0,
            reminderCount: (payment.remindersCount || 0) + 1,
          }
        );

        // Update payment record
        const nextReminderDate = new Date();
        if (payment.reminderFrequency === 'DAILY') {
          nextReminderDate.setDate(nextReminderDate.getDate() + 1);
        } else if (payment.reminderFrequency === 'WEEKLY') {
          nextReminderDate.setDate(nextReminderDate.getDate() + 7);
        }
        nextReminderDate.setHours(10, 0, 0, 0);

        await Payment.findByIdAndUpdate(payment._id, {
          $inc: { remindersCount: 1 },
          $set: {
            lastReminderSentAt: new Date(),
            nextReminderDate: payment.reminderFrequency !== 'NONE' ? nextReminderDate : null,
          },
        });

        console.log(`[Payment Reminders Cron] Sent notifications to ${payment.studentId}:`, notificationResults);
        results.sent++;
      } catch (error: any) {
        console.error(`[Payment Reminders Cron] Error sending to ${payment.studentId}:`, error);
        results.failed++;
        results.errors.push({
          studentId: payment.studentId,
          error: error.message,
        });
      }
    }

    console.log('[Payment Reminders Cron] Completed:', results);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error: any) {
    console.error('[Payment Reminders Cron] Fatal error:', error);
    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
