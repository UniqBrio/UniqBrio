# Subscription Plan Expiry Reminder System - Implementation Summary

## Overview
Implemented an automated email reminder system for Grow and Scale subscription plans that sends reminders before the plan expiry date.

## Reminder Schedule

### Pre-Expiry Reminders
- **10 days before** end date - First reminder
- **7 days before** end date - Second reminder
- **6-1 days before** end date - Daily reminders (6, 5, 4, 3, 2, 1)

### Exclusions
- **Free plans** are excluded from reminders
- **Cancelled subscriptions** do not receive reminders
- Plans with **expired status** are not included

## Implementation Details

### 1. Database Schema Updates
**File:** `models/AdminPaymentRecord.ts`

Added new fields to track reminder status:
```typescript
expiryRemindersSent?: string[]; // Array like ["10days", "7days", "6days"]
lastExpiryReminderSentAt?: Date; // Timestamp of last reminder sent
```

This prevents duplicate reminders from being sent.

### 2. Email Service
**File:** `lib/dashboard/email-service.ts`

Created new email template function:
```typescript
sendPlanExpiryReminderEmail(
  recipientEmail: string,
  businessName: string,
  ownerName: string,
  planDetails: {
    planName: string;
    endDate: Date;
    daysRemaining: number;
    studentSize: number;
  }
)
```

**Email Features:**
- Professional HTML template with gradient header
- Alert box showing days remaining prominently
- Subscription details (plan, academy, expiry date, student capacity)
- Urgent action notice
- Benefits list to motivate renewal
- CTA button linking to billing page
- Plain text alternative for email clients

**Email Subject:**
`⏰ Subscription Reminder: Your [Plan] Plan Expires in [X] Days`

### 3. Cron Job Endpoint
**File:** `app/api/cron/subscription-expiry-reminders/route.ts`

**Endpoint:** `GET /api/cron/subscription-expiry-reminders`

**Authentication:** 
- Uses `CRON_SECRET` bearer token
- Only required in production
- Header: `Authorization: Bearer <CRON_SECRET>`

**Query Logic:**
For each reminder day (10, 7, 6, 5, 4, 3, 2, 1):
1. Calculate target date (today + days)
2. Find active paid plans with:
   - `status: 'paid'`
   - `planStatus: 'active'`
   - `plan` not in ['free', 'Free']
   - `endDate` equals target date
   - Not cancelled (`isCancelled: false`)
   - Reminder not already sent (`expiryRemindersSent` doesn't contain identifier)
3. Send email using academy details
4. Update record with reminder identifier
5. Log results

**Response Format:**
```json
{
  "success": true,
  "message": "Subscription expiry reminder processing completed",
  "summary": {
    "totalProcessed": 15,
    "sent": 12,
    "skipped": 2,
    "errors": 1,
    "executionTimeMs": 3456
  },
  "results": [...],
  "timestamp": "2025-12-18T09:00:00.000Z"
}
```

### 4. Vercel Cron Configuration
**File:** `vercel.json`

Added new cron job:
```json
{
  "path": "/api/cron/subscription-expiry-reminders",
  "schedule": "0 3 * * *"
}
```

**Schedule:** 
- Daily at 3:00 AM UTC (8:30 AM IST)
- Runs before business hours in India
- Allows time for users to take action during the day

## Data Sources

### Academy/User Information
All data fetched from `AdminPaymentRecord` model:
- `email` - Recipient email address
- `businessName` - Academy name
- `ownerAdminName` - Owner's name
- `academyId` - Academy identifier
- `plan` - Subscription plan (Grow/Scale)
- `studentSize` - Student capacity
- `endDate` - Plan expiry date
- `planStatus` - Current status (active/expired/upcoming)

### Email Credentials
Uses Zoho ZeptoMail SMTP (already configured):
- `ZEPTO_HOST` - smtp.zeptomail.in
- `ZEPTO_PORT` - 587
- `ZEPTO_USER` - info@uniqbotz.com
- `ZEPTO_PASS` - Password from environment
- `FROM_NAME` - UniqBrio

## Testing

### Manual Testing
You can manually trigger the cron job:

**Local Development:**
```bash
curl http://localhost:3000/api/cron/subscription-expiry-reminders
```

**Production:**
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://app.uniqbrio.in/api/cron/subscription-expiry-reminders
```

### Test Scenarios
1. Create a payment record with `endDate` = today + 10 days
2. Verify email is sent
3. Check `expiryRemindersSent` array contains "10days"
4. Run cron again - should skip (already sent)
5. Change `endDate` to today + 7 days
6. Run cron - should send "7days" reminder

### Console Logs
The cron job provides detailed logging:
```
[Cron Subscription Expiry Reminders] Starting automated reminder processing...
[Cron Subscription Expiry Reminders] Checking for plans expiring in 10 days...
[Cron Subscription Expiry Reminders] Found 3 plans needing 10-day reminder
[Cron Subscription Expiry Reminders] ✅ Sent 10-day reminder to academy@example.com (Test Academy)
[Cron Subscription Expiry Reminders] Processing completed: {
  totalProcessed: 3,
  sent: 3,
  skipped: 0,
  errors: 0,
  executionTimeMs: 2456
}
```

## Environment Variables Required

Add to `.env.local` (if not already present):
```env
# Cron Job Authentication
CRON_SECRET=your-secure-random-secret-here

# Email Configuration (Already configured)
ZEPTO_HOST=smtp.zeptomail.in
ZEPTO_PORT=587
ZEPTO_USER=info@uniqbotz.com
ZEPTO_PASS=your-zepto-password
ZEPTO_FROM_EMAIL=info@uniqbotz.com
FROM_NAME=UniqBrio
```

## Features

✅ **Smart Duplicate Prevention** - Tracks sent reminders to avoid spam
✅ **Graduated Reminder Schedule** - Less frequent early, daily as expiry approaches
✅ **Professional Email Template** - HTML + plain text with clear CTAs
✅ **Batch Processing** - Limits 100 records per run to avoid timeouts
✅ **Free Plan Exclusion** - Only targets paid Grow/Scale plans
✅ **Cancellation Aware** - Skips cancelled subscriptions
✅ **Detailed Logging** - Comprehensive logs for monitoring and debugging
✅ **Error Handling** - Continues processing even if individual emails fail
✅ **Performance Metrics** - Tracks execution time and success rates
✅ **Production Ready** - Secure authentication, tested error paths

## Email Content Highlights

- **Gradient alert box** showing days remaining prominently
- **Subscription details** in organized box
- **Urgent action notice** with warning styling
- **Benefits list** to motivate renewal
- **CTA button** linking to billing page
- **Branded footer** with UniqBrio styling
- **Responsive design** works on all devices

## Post-Expiry Reminder System (UPDATED)

### Schedule
After the end date is exceeded:
- **Day 1** after expiry - First post-expiry reminder
- **Day 2** after expiry - Second reminder
- **Day 3** after expiry - Third reminder
- **Day 7** after expiry - One week reminder
- **Day 15** after expiry - Two weeks reminder
- **Day 30** after expiry - Final reminder

### Conditions for Sending Post-Expiry Reminders
1. Plan status must be "expired"
2. Plan must be Grow or Scale (Free plans excluded)
3. Plan must not be cancelled
4. Academy must NOT have any active or upcoming plan
5. Specific reminder not already sent

### Email Template
**Function:** `sendPlanExpiredReminderEmail()`

**Subject:** `🚨 URGENT: Your [Plan] Plan Expired X Days Ago - Renew Now`

**Design:**
- Red gradient header (urgent style)
- Red alert box showing days since expiry
- Expired subscription details
- Urgent action notice (red banner)
- Impact of expired subscription (yellow warning)
- Benefits of renewing
- No CTA button (as requested)

### Logic Flow
1. Cron runs daily at 3:00 AM UTC
2. For each post-expiry day (1, 2, 3, 7, 15, 30):
   - Find plans that expired exactly X days ago
   - Check if reminder already sent
   - **Verify no active/upcoming plan exists**
   - Send email if conditions met
   - Mark reminder as sent (`Xdays_after`)

### Smart Skip Logic
The system automatically skips sending post-expiry reminders if:
- Academy has already renewed (active plan exists)
- Academy has an upcoming plan scheduled
- This prevents annoying users who have already taken action

## Next Steps

1. ✅ Pre-expiry reminders implemented (10, 7, 6, 5, 4, 3, 2, 1 days)
2. ✅ Post-expiry reminders implemented (1, 2, 3, 7, 15, 30 days)
3. ⏳ Grace period handling (if needed)
4. ⏳ Auto-downgrade to Free plan after expiry (if needed)

## Notes

- The cron job runs daily, so reminders are sent once per day per threshold
- Reminders are sent in the morning (8:30 AM IST) for optimal visibility
- The system uses existing email infrastructure (Zoho ZeptoMail)
- All emails are logged for monitoring and debugging
- The reminder identifiers (e.g., "10days") are stored permanently to prevent re-sending

## Files Modified/Created

### Modified
1. `models/AdminPaymentRecord.ts` - Added reminder tracking fields
2. `lib/dashboard/email-service.ts` - Added email template function
3. `vercel.json` - Added cron job configuration

### Created
1. `app/api/cron/subscription-expiry-reminders/route.ts` - Cron endpoint
2. `SUBSCRIPTION_EXPIRY_REMINDERS_IMPLEMENTATION.md` - This documentation

---

**Implementation Date:** December 18, 2025
**Status:** ✅ Complete - Pre-Expiry Reminders
**Next Phase:** Post-Expiry Reminders and Grace Period
