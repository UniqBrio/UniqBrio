import Notification from '@/models/dashboard/Notification';
import { sendPaymentConfirmationEmail, sendPaymentReminderEmail } from './email-service';
import { getTenantContext } from '@/lib/tenant/tenant-context';

/**
 * Send payment confirmation notification (email + in-app)
 */
export async function sendPaymentConfirmationNotification(
  studentId: string,
  studentEmail: string,
  studentName: string,
  paymentDetails: {
    amount: number;
    paymentDate: Date;
    paymentMode: string;
    courseName: string;
    invoiceNumber: string;
    paymentOption?: string;
    paymentSubType?: string;
    invoiceUrl?: string;
    nextPaymentDate?: Date;
    monthlyInstallment?: number;
    isLastPayment?: boolean;
    dueAmount?: number;
    currency?: string; // Currency symbol
  }
): Promise<{ emailSent: boolean; inAppCreated: boolean }> {
  const results = { emailSent: false, inAppCreated: false };

  try {
    // Send email notification
    if (studentEmail) {
      await sendPaymentConfirmationEmail(studentEmail, studentName, paymentDetails);
      results.emailSent = true;
      console.log('[Notification] Email sent to:', studentEmail);
    }

    // Create in-app notification
    const isOneTimePayment = paymentDetails.paymentOption === 'One Time' || paymentDetails.paymentOption === 'ONE_TIME_PAYMENT';
    const isPartial = !paymentDetails.isLastPayment && paymentDetails.dueAmount && paymentDetails.dueAmount > 0;

    const notificationData = {
      studentId,
      studentName,
      type: paymentDetails.isLastPayment ? 'payment_completed' : 'payment_received',
      channel: 'in-app',
      title: paymentDetails.isLastPayment 
        ? '🎉 Payment Complete - Thank You!'
        : '✅ Payment Received',
      message: paymentDetails.isLastPayment
        ? `Your payment of {paymentDetails.currency}{paymentDetails.amount.toLocaleString('en-IN')} has been received and all dues are now cleared. Thank you!`
        : isPartial && isOneTimePayment
        ? `Payment of {paymentDetails.currency}{paymentDetails.amount.toLocaleString('en-IN')} received. Remaining balance: {paymentDetails.currency}{paymentDetails.dueAmount?.toLocaleString('en-IN')}. Daily reminders will be sent until fully paid.`
        : `Payment of {paymentDetails.currency}{paymentDetails.amount.toLocaleString('en-IN')} has been successfully received. Thank you for your payment!`,
      metadata: {
        amount: paymentDetails.amount,
        dueAmount: paymentDetails.dueAmount || 0,
        dueDate: paymentDetails.nextPaymentDate,
        invoiceUrl: paymentDetails.invoiceUrl,
        courseName: paymentDetails.courseName,
      },
      read: false,
      sent: true,
      sentAt: new Date(),
    };

    await Notification.create(notificationData);
    results.inAppCreated = true;
    console.log('[Notification] In-app notification created for:', studentId);

    // Also log email notification
    await Notification.create({
      ...notificationData,
      channel: 'email',
    });

  } catch (error) {
    console.error('[Notification] Error sending payment confirmation:', error);
    throw error;
  }

  return results;
}

/**
 * Send payment reminder notification (email + in-app)
 */
export async function sendPaymentReminderNotification(
  studentId: string,
  studentEmail: string,
  studentName: string,
  reminderDetails: {
    courseName: string;
    dueDate: Date;
    amount: number;
    outstandingBalance: number;
    reminderCount?: number;
    currency?: string; // Currency symbol
  }
): Promise<{ emailSent: boolean; inAppCreated: boolean }> {
  const results = { emailSent: false, inAppCreated: false };

  try {
    // Send email notification
    if (studentEmail) {
      await sendPaymentReminderEmail(studentEmail, studentName, reminderDetails);
      results.emailSent = true;
      console.log('[Notification] Reminder email sent to:', studentEmail);
    }

    // Create in-app notification
    const notificationData = {
      studentId,
      studentName,
      type: 'payment_reminder',
      channel: 'in-app',
      title: '🔔 Payment Reminder',
      message: `Reminder: You have an outstanding balance of {reminderDetails.currency}{reminderDetails.outstandingBalance.toLocaleString('en-IN')} for ${reminderDetails.courseName}. Due date: ${new Date(reminderDetails.dueDate).toLocaleDateString('en-IN')}.`,
      metadata: {
        amount: reminderDetails.amount,
        dueAmount: reminderDetails.outstandingBalance,
        dueDate: reminderDetails.dueDate,
        courseName: reminderDetails.courseName,
      },
      read: false,
      sent: true,
      sentAt: new Date(),
    };

    await Notification.create(notificationData);
    results.inAppCreated = true;
    console.log('[Notification] In-app reminder created for:', studentId);

    // Also log email notification
    await Notification.create({
      ...notificationData,
      channel: 'email',
    });

  } catch (error) {
    console.error('[Notification] Error sending payment reminder:', error);
    throw error;
  }

  return results;
}

/**
 * Get unread notifications for a student
 */
export async function getUnreadNotifications(studentId: string) {
  try {
    const tenantContext = getTenantContext();
    const query: any = {
      studentId,
      channel: 'in-app',
      read: false,
    };
    
    // Add tenantId for isolation
    if (tenantContext?.tenantId) {
      query.tenantId = tenantContext.tenantId;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return notifications;
  } catch (error) {
    console.error('[Notification] Error fetching unread notifications:', error);
    throw error;
  }
}

/**
 * Get all notifications for a student
 */
export async function getStudentNotifications(
  studentId: string,
  options: {
    limit?: number;
    skip?: number;
    read?: boolean;
    type?: string;
  } = {}
) {
  try {
    const tenantContext = getTenantContext();
    const query: any = { studentId, channel: 'in-app' };
    
    // Add tenantId for isolation
    if (tenantContext?.tenantId) {
      query.tenantId = tenantContext.tenantId;
    }
    
    if (options.read !== undefined) {
      query.read = options.read;
    }
    
    if (options.type) {
      query.type = options.type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(options.limit || 50)
      .skip(options.skip || 0)
      .lean();

    const unreadCountQuery: any = {
      studentId,
      channel: 'in-app',
      read: false,
    };
    
    // Add tenantId for isolation in count query
    if (tenantContext?.tenantId) {
      unreadCountQuery.tenantId = tenantContext.tenantId;
    }

    const unreadCount = await Notification.countDocuments(unreadCountQuery);

    return {
      notifications,
      unreadCount,
    };
  } catch (error) {
    console.error('[Notification] Error fetching student notifications:', error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const tenantContext = getTenantContext();
    const query: any = { _id: notificationId };
    
    // Add tenantId for isolation
    if (tenantContext?.tenantId) {
      query.tenantId = tenantContext.tenantId;
    }
    
    await Notification.findOneAndUpdate(query, {
      $set: {
        read: true,
        readAt: new Date(),
      },
    });
  } catch (error) {
    console.error('[Notification] Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a student
 */
export async function markAllNotificationsAsRead(studentId: string) {
  try {
    const tenantContext = getTenantContext();
    const query: any = { 
      studentId, 
      channel: 'in-app', 
      read: false 
    };
    
    // Add tenantId for isolation
    if (tenantContext?.tenantId) {
      query.tenantId = tenantContext.tenantId;
    }
    
    await Notification.updateMany(
      query,
      {
        $set: {
          read: true,
          readAt: new Date(),
        },
      }
    );
  } catch (error) {
    console.error('[Notification] Error marking all notifications as read:', error);
    throw error;
  }
}
