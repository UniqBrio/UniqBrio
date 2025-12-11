import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Payment from '@/models/dashboard/payments/Payment';
import Student from '@/models/dashboard/student/Student';
import RegistrationModel from '@/models/Registration';
import { sendPaymentReminderEmail } from '@/lib/dashboard/email-service';

// Cron secret for authentication (set in Vercel environment variables)
const CRON_SECRET = process.env.CRON_SECRET;

// Default reminder settings
const DEFAULT_SETTINGS = {
  reminderDaysBeforeDue: 3,        // Days before due date to send pre-due reminder
  gracePeriodDays: 7,              // Grace period after due date
  overdueReminderFrequencyDays: 7, // Days between overdue reminders
  maxReminderAttempts: 5,          // Maximum reminder attempts for overdue payments
};

interface ReminderResult {
  studentId: string;
  studentName: string;
  email: string;
  status: 'sent' | 'skipped' | 'error';
  reason?: string;
  category?: string;
}

/**
 * GET /api/cron/payment-reminders
 * 
 * Automated payment reminder cron job
 * Processes all pending/partial payments and sends reminder emails
 * 
 * Should be triggered by Vercel Cron or external cron service
 * Schedule: Daily at 9:00 AM UTC (configurable in vercel.json)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify the request is from a legitimate cron job
    const authHeader = request.headers.get('authorization');
    
    // In production, require CRON_SECRET
    if (process.env.NODE_ENV === 'production' && CRON_SECRET) {
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        console.log('[Cron Payment Reminders] Unauthorized request');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    console.log('[Cron Payment Reminders] Starting automated reminder processing...');

    await dbConnect('uniqbrio');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const now = new Date();

    // Calculate date thresholds
    const preDueThreshold = new Date(today);
    preDueThreshold.setDate(preDueThreshold.getDate() + DEFAULT_SETTINGS.reminderDaysBeforeDue);

    const overdueReminderThreshold = new Date(today);
    overdueReminderThreshold.setDate(overdueReminderThreshold.getDate() - DEFAULT_SETTINGS.overdueReminderFrequencyDays);

    // Find all payments that need reminders
    const paymentsNeedingReminders = await Payment.find({
      // Only active payments with outstanding amounts
      status: { $in: ['Pending', 'Partial'] },
      outstandingAmount: { $gt: 0 },
      reminderEnabled: true,
      
      // Complex OR condition for different reminder scenarios
      $or: [
        // Scenario 1: Pre-due reminders (X days before due date)
        {
          nextDueDate: {
            $gte: today,
            $lte: preDueThreshold
          },
          preReminderEnabled: true,
          $or: [
            { lastReminderSentAt: { $exists: false } },
            { lastReminderSentAt: null },
            // Only send if last reminder was more than 24 hours ago
            { lastReminderSentAt: { $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }
          ]
        },
        
        // Scenario 2: Due date reminders (on the due date)
        {
          nextDueDate: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          },
          $or: [
            { lastReminderSentAt: { $exists: false } },
            { lastReminderSentAt: null },
            { lastReminderSentAt: { $lt: today } }
          ]
        },
        
        // Scenario 3: Overdue reminders
        {
          nextDueDate: { $lt: today },
          remindersCount: { $lt: DEFAULT_SETTINGS.maxReminderAttempts },
          $or: [
            { lastReminderSentAt: { $exists: false } },
            { lastReminderSentAt: null },
            { lastReminderSentAt: { $lt: overdueReminderThreshold } }
          ]
        }
      ]
    }).limit(200); // Process in batches to avoid timeouts

    console.log(`[Cron Payment Reminders] Found ${paymentsNeedingReminders.length} payments needing reminders`);

    const results: ReminderResult[] = [];
    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Group payments by tenantId for batch processing
    const paymentsByTenant = new Map<string, typeof paymentsNeedingReminders>();
    
    for (const payment of paymentsNeedingReminders) {
      const tenantId = payment.tenantId;
      if (!paymentsByTenant.has(tenantId)) {
        paymentsByTenant.set(tenantId, []);
      }
      paymentsByTenant.get(tenantId)!.push(payment);
    }

    // Process each tenant's payments
    for (const [tenantId, payments] of paymentsByTenant) {
      // Fetch academy info once per tenant
      let academyName = 'Academy';
      try {
        const registration = await RegistrationModel.findOne({
          $or: [
            { academyId: tenantId },
            { tenantId: tenantId }
          ]
        }).lean();

        if (registration?.businessInfo) {
          const businessInfo = registration.businessInfo as any;
          academyName = businessInfo.businessName || businessInfo.academyName || 'Academy';
        }
      } catch (error) {
        console.error(`[Cron Payment Reminders] Error fetching academy info for tenant ${tenantId}:`, error);
      }

      // Process each payment for this tenant
      for (const payment of payments) {
        try {
          // Get student email
          let studentEmail = payment.studentEmail;
          
          if (!studentEmail) {
            // Try to fetch from Student collection
            const student = await Student.findOne({ 
              studentId: payment.studentId,
              tenantId: tenantId
            });
            studentEmail = student?.email;
          }

          if (!studentEmail) {
            results.push({
              studentId: payment.studentId,
              studentName: payment.studentName,
              email: 'N/A',
              status: 'skipped',
              reason: 'No email address found',
              category: payment.paymentOption || payment.planType
            });
            skippedCount++;
            continue;
          }

          // Determine reminder type for logging
          const isPreDue = payment.nextDueDate && payment.nextDueDate >= today;
          const isDueToday = payment.nextDueDate && 
            payment.nextDueDate >= today && 
            payment.nextDueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
          const isOverdue = payment.nextDueDate && payment.nextDueDate < today;

          let reminderType = 'standard';
          if (isDueToday) reminderType = 'due-today';
          else if (isPreDue) reminderType = 'pre-due';
          else if (isOverdue) reminderType = 'overdue';

          // Send reminder email
          const emailSent = await sendPaymentReminderEmail(
            studentEmail,
            payment.studentName,
            {
              courseName: payment.enrolledCourseName || payment.enrolledCourse || 'Course',
              dueDate: payment.nextDueDate || payment.nextPaymentDate || new Date(),
              amount: payment.dueAmount || payment.outstandingAmount || 0,
              outstandingBalance: payment.outstandingAmount || 0,
              academyName: academyName,
            }
          );

          if (emailSent) {
            // Update payment record
            await Payment.findByIdAndUpdate(payment._id, {
              $set: { lastReminderSentAt: new Date() },
              $inc: { remindersCount: 1 }
            });

            results.push({
              studentId: payment.studentId,
              studentName: payment.studentName,
              email: studentEmail,
              status: 'sent',
              reason: `${reminderType} reminder sent`,
              category: payment.paymentOption || payment.planType
            });
            sentCount++;
          } else {
            results.push({
              studentId: payment.studentId,
              studentName: payment.studentName,
              email: studentEmail,
              status: 'error',
              reason: 'Email service returned false',
              category: payment.paymentOption || payment.planType
            });
            errorCount++;
          }

        } catch (error: any) {
          console.error(`[Cron Payment Reminders] Error processing payment ${payment._id}:`, error);
          results.push({
            studentId: payment.studentId,
            studentName: payment.studentName,
            email: payment.studentEmail || 'N/A',
            status: 'error',
            reason: error.message || 'Unknown error',
            category: payment.paymentOption || payment.planType
          });
          errorCount++;
        }
      }
    }

    const executionTime = Date.now() - startTime;

    console.log(`[Cron Payment Reminders] Completed in ${executionTime}ms`);
    console.log(`[Cron Payment Reminders] Sent: ${sentCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);

    return NextResponse.json({
      success: true,
      message: `Processed ${paymentsNeedingReminders.length} payments`,
      summary: {
        total: paymentsNeedingReminders.length,
        sent: sentCount,
        skipped: skippedCount,
        errors: errorCount,
      },
      executionTimeMs: executionTime,
      timestamp: new Date().toISOString(),
      // Only include detailed results in development
      ...(process.env.NODE_ENV !== 'production' && { results }),
    });

  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error('[Cron Payment Reminders] Fatal error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process payment reminders', 
        details: error.message,
        executionTimeMs: executionTime,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for manual trigger (admin use)
 * Can be used to manually trigger reminders for testing
 */
export async function POST(request: NextRequest) {
  // Reuse GET logic
  return GET(request);
}
