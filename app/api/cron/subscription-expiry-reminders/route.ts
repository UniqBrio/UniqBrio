import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import AdminPaymentRecordModel from '@/models/AdminPaymentRecord';
import { sendPlanExpiryReminderEmail, sendPlanExpiredReminderEmail } from '@/lib/dashboard/email-service';

// Cron secret for authentication (set in Vercel environment variables)
const CRON_SECRET = process.env.CRON_SECRET;

// Days before expiry to send reminders: 10, 7, 6, 5, 4, 3, 2, 1
const PRE_EXPIRY_REMINDER_DAYS = [10, 7, 6, 5, 4, 3, 2, 1];

// Days after expiry to send reminders: 1, 2, 3, 7, 15, 30
const POST_EXPIRY_REMINDER_DAYS = [1, 2, 3, 7, 15, 30];

interface ReminderResult {
  academyId: string;
  businessName: string;
  email: string;
  daysRemaining: number;
  status: 'sent' | 'skipped' | 'error';
  reason?: string;
  type?: 'pre-expiry' | 'post-expiry';
}

/**
 * GET /api/cron/subscription-expiry-reminders
 * 
 * Automated subscription plan expiry reminder cron job
 * Sends reminder emails BEFORE and AFTER subscription end dates
 * 
 * PRE-EXPIRY Reminder Schedule:
 * - 10 days before expiry - First reminder
 * - 7 days before expiry - Second reminder  
 * - 6-1 days before expiry - Daily reminders
 * 
 * POST-EXPIRY Reminder Schedule:
 * - 1 day after expiry - First post-expiry reminder
 * - 2 days after expiry - Second reminder
 * - 3 days after expiry - Third reminder
 * - 7 days after expiry - One week reminder
 * - 15 days after expiry - Two weeks reminder
 * - 30 days after expiry - Final reminder
 * 
 * Should be triggered by Vercel Cron or external cron service
 * Schedule: Daily at 3:00 AM UTC (8:30 AM IST)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify the request is from a legitimate cron job
    const authHeader = request.headers.get('authorization');
    
    // In production, require CRON_SECRET
    if (process.env.NODE_ENV === 'production' && CRON_SECRET) {
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        console.log('[Cron Subscription Expiry Reminders] Unauthorized request');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    console.log('[Cron Subscription Expiry Reminders] Starting automated reminder processing...');

    await dbConnect('uniqbrio');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const now = new Date();

    const results: ReminderResult[] = [];
    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // ==================== PRE-EXPIRY REMINDERS ====================
    // Process each reminder day threshold BEFORE expiry
    for (const daysBeforeExpiry of PRE_EXPIRY_REMINDER_DAYS) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + daysBeforeExpiry);
      
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const reminderIdentifier = `${daysBeforeExpiry}days`;

      console.log(`[Cron Subscription Expiry Reminders] Checking for plans expiring in ${daysBeforeExpiry} days...`);

      // Find all active paid plans (Grow/Scale) that:
      // 1. Are currently active
      // 2. End date matches the target date
      // 3. Haven't received this specific reminder yet
      // 4. Exclude Free plans
      // 5. Not cancelled
      const plansNeedingReminders = await AdminPaymentRecordModel.find({
        status: 'paid',
        planStatus: 'active',
        plan: { $nin: ['free', 'Free'] }, // Exclude Free plans
        endDate: {
          $gte: targetDate,
          $lt: nextDay
        },
        $or: [
          { isCancelled: false },
          { isCancelled: { $exists: false } }
        ],
        expiryRemindersSent: { $ne: reminderIdentifier }, // Haven't sent this specific reminder
      }).limit(100); // Process in batches

      console.log(`[Cron Subscription Expiry Reminders] Found ${plansNeedingReminders.length} plans needing ${daysBeforeExpiry}-day reminder`);

      // Send reminders for each plan
      for (const paymentRecord of plansNeedingReminders) {
        try {
          // Validate email
          if (!paymentRecord.email) {
            results.push({
              academyId: paymentRecord.academyId,
              businessName: paymentRecord.businessName,
              email: 'N/A',
              daysRemaining: daysBeforeExpiry,
              status: 'skipped',
              reason: 'No email address found',
            });
            skippedCount++;
            continue;
          }

          // Send expiry reminder email
          const emailSent = await sendPlanExpiryReminderEmail(
            paymentRecord.email,
            paymentRecord.businessName,
            paymentRecord.ownerAdminName,
            {
              planName: paymentRecord.plan,
              endDate: paymentRecord.endDate,
              daysRemaining: daysBeforeExpiry,
              studentSize: paymentRecord.studentSize,
            }
          );

          if (emailSent) {
            // Update payment record to mark this reminder as sent
            await AdminPaymentRecordModel.findByIdAndUpdate(paymentRecord._id, {
              $addToSet: { expiryRemindersSent: reminderIdentifier },
              $set: { lastExpiryReminderSentAt: now }
            });

            results.push({
              academyId: paymentRecord.academyId,
              businessName: paymentRecord.businessName,
              email: paymentRecord.email,
              daysRemaining: daysBeforeExpiry,
              status: 'sent',
              reason: `${daysBeforeExpiry}-day expiry reminder sent successfully`,
              type: 'pre-expiry',
            });
            sentCount++;

            console.log(`[Cron Subscription Expiry Reminders] ✅ Sent ${daysBeforeExpiry}-day reminder to ${paymentRecord.email} (${paymentRecord.businessName})`);
          } else {
            results.push({
              academyId: paymentRecord.academyId,
              businessName: paymentRecord.businessName,
              email: paymentRecord.email,
              daysRemaining: daysBeforeExpiry,
              status: 'error',
              reason: 'Email service returned false',
            });
            errorCount++;

            console.error(`[Cron Subscription Expiry Reminders] ❌ Failed to send email to ${paymentRecord.email}`);
          }

        } catch (error: any) {
          console.error(`[Cron Subscription Expiry Reminders] Error processing payment record ${paymentRecord._id}:`, error);
          results.push({
            academyId: paymentRecord.academyId,
            businessName: paymentRecord.businessName,
            email: paymentRecord.email || 'N/A',
            daysRemaining: daysBeforeExpiry,
            status: 'error',
            reason: error.message || 'Unknown error',
          });
          errorCount++;
        }
      }
    }

    // ==================== POST-EXPIRY REMINDERS ====================
    // Process reminders for expired plans (1, 2, 3, 7, 15, 30 days after expiry)
    console.log('[Cron Subscription Expiry Reminders] Starting POST-EXPIRY reminder processing...');

    for (const daysAfterExpiry of POST_EXPIRY_REMINDER_DAYS) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() - daysAfterExpiry);
      
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const reminderIdentifier = `${daysAfterExpiry}days_after`;

      console.log(`[Cron Subscription Expiry Reminders] Checking for plans expired ${daysAfterExpiry} days ago...`);

      // Find all expired paid plans (Grow/Scale) that:
      // 1. Are expired
      // 2. End date was exactly X days ago
      // 3. Haven't received this specific post-expiry reminder yet
      // 4. Exclude Free plans
      // 5. Not cancelled
      // 6. No active or upcoming plan exists for this academy
      const expiredPlansNeedingReminders = await AdminPaymentRecordModel.find({
        status: 'paid',
        planStatus: 'expired',
        plan: { $nin: ['free', 'Free'] },
        endDate: {
          $gte: targetDate,
          $lt: nextDay
        },
        $or: [
          { isCancelled: false },
          { isCancelled: { $exists: false } }
        ],
        expiryRemindersSent: { $ne: reminderIdentifier },
      }).limit(100);

      console.log(`[Cron Subscription Expiry Reminders] Found ${expiredPlansNeedingReminders.length} plans needing ${daysAfterExpiry}-day post-expiry reminder`);

      // Send reminders for each expired plan
      for (const paymentRecord of expiredPlansNeedingReminders) {
        try {
          // Check if academy has any active or upcoming plan
          const hasActiveOrUpcomingPlan = await AdminPaymentRecordModel.findOne({
            academyId: paymentRecord.academyId,
            _id: { $ne: paymentRecord._id }, // Exclude current record
            status: 'paid',
            planStatus: { $in: ['active', 'upcoming'] },
          });

          // Skip if academy already has an active or upcoming plan
          if (hasActiveOrUpcomingPlan) {
            results.push({
              academyId: paymentRecord.academyId,
              businessName: paymentRecord.businessName,
              email: paymentRecord.email,
              daysRemaining: -daysAfterExpiry, // Negative to indicate post-expiry
              status: 'skipped',
              reason: 'Academy has active/upcoming plan',
              type: 'post-expiry',
            });
            skippedCount++;
            continue;
          }

          // Validate email
          if (!paymentRecord.email) {
            results.push({
              academyId: paymentRecord.academyId,
              businessName: paymentRecord.businessName,
              email: 'N/A',
              daysRemaining: -daysAfterExpiry,
              status: 'skipped',
              reason: 'No email address found',
              type: 'post-expiry',
            });
            skippedCount++;
            continue;
          }

          // Send expired plan reminder email
          const emailSent = await sendPlanExpiredReminderEmail(
            paymentRecord.email,
            paymentRecord.businessName,
            paymentRecord.ownerAdminName,
            {
              planName: paymentRecord.plan,
              endDate: paymentRecord.endDate,
              daysAfterExpiry: daysAfterExpiry,
              studentSize: paymentRecord.studentSize,
            }
          );

          if (emailSent) {
            // Update payment record to mark this reminder as sent
            await AdminPaymentRecordModel.findByIdAndUpdate(paymentRecord._id, {
              $addToSet: { expiryRemindersSent: reminderIdentifier },
              $set: { lastExpiryReminderSentAt: now }
            });

            results.push({
              academyId: paymentRecord.academyId,
              businessName: paymentRecord.businessName,
              email: paymentRecord.email,
              daysRemaining: -daysAfterExpiry, // Negative to indicate post-expiry
              status: 'sent',
              reason: `${daysAfterExpiry}-day post-expiry reminder sent successfully`,
              type: 'post-expiry',
            });
            sentCount++;

            console.log(`[Cron Subscription Expiry Reminders] ✅ Sent ${daysAfterExpiry}-day post-expiry reminder to ${paymentRecord.email} (${paymentRecord.businessName})`);
          } else {
            results.push({
              academyId: paymentRecord.academyId,
              businessName: paymentRecord.businessName,
              email: paymentRecord.email,
              daysRemaining: -daysAfterExpiry,
              status: 'error',
              reason: 'Email service returned false',
              type: 'post-expiry',
            });
            errorCount++;

            console.error(`[Cron Subscription Expiry Reminders] ❌ Failed to send post-expiry email to ${paymentRecord.email}`);
          }

        } catch (error: any) {
          console.error(`[Cron Subscription Expiry Reminders] Error processing expired payment record ${paymentRecord._id}:`, error);
          results.push({
            academyId: paymentRecord.academyId,
            businessName: paymentRecord.businessName,
            email: paymentRecord.email || 'N/A',
            daysRemaining: -daysAfterExpiry,
            status: 'error',
            reason: error.message || 'Unknown error',
            type: 'post-expiry',
          });
          errorCount++;
        }
      }
    }

    const executionTime = Date.now() - startTime;

    console.log('[Cron Subscription Expiry Reminders] Processing completed:', {
      totalProcessed: results.length,
      sent: sentCount,
      skipped: skippedCount,
      errors: errorCount,
      executionTimeMs: executionTime,
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription expiry reminder processing completed',
      summary: {
        totalProcessed: results.length,
        sent: sentCount,
        skipped: skippedCount,
        errors: errorCount,
        executionTimeMs: executionTime,
      },
      results: results,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Cron Subscription Expiry Reminders] Critical error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
