import { Payment, PaymentRecord, EmiScheduleItem, SubscriptionDetails } from '@/types/dashboard/payment';
import { calculateNextDueDate } from './payment-date-helpers';

interface PaymentProcessingResult {
  success: boolean;
  payment?: any;
  transaction?: any;
  invoice?: any;
  message: string;
  error?: string;
}

interface ManualPaymentData {
  paymentId: string;
  studentId: string;
  amount: number;
  paymentMode: 'UPI' | 'Card' | 'Cash' | 'Bank Transfer' | 'Cheque';
  paymentDate: Date;
  paymentTime?: string;
  notes?: string;
  attachments?: string[];
  payerType?: 'student' | 'parent' | 'guardian';
  payerName?: string;
  planType: 'ONE_TIME' | 'MONTHLY_SUBSCRIPTION' | 'EMI' | 'CUSTOM';
  emiIndex?: number;
  discount?: number;
  specialCharges?: number;
  receivedBy: string;
  reminderEnabled?: boolean;
  nextReminderDate?: Date;
  preReminderEnabled?: boolean;
  reminderFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'NONE';
  stopReminders?: boolean;
}

/**
 * Calculate next payment date based on plan type
 */
export function calculateNextPaymentDate(
  currentDate: Date,
  planType: 'ONE_TIME' | 'MONTHLY_SUBSCRIPTION' | 'EMI' | 'CUSTOM',
  emiSchedule?: EmiScheduleItem[],
  currentEmiIndex?: number
): Date | null {
  switch (planType) {
    case 'ONE_TIME':
      // One-time payments don't have a next payment date
      return null;

    case 'MONTHLY_SUBSCRIPTION':
      // Add 1 month to current date
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth;

    case 'EMI':
      // Get next EMI date from schedule
      if (emiSchedule && currentEmiIndex !== undefined) {
        const nextIndex = currentEmiIndex + 1;
        if (nextIndex < emiSchedule.length) {
          return new Date(emiSchedule[nextIndex].dueDate);
        }
      }
      return null;

    case 'CUSTOM':
      // Custom payments don't auto-calculate next date
      return null;

    default:
      return null;
  }
}

/**
 * Update EMI status after payment
 */
export function updateEmiStatus(
  emiSchedule: EmiScheduleItem[],
  currentEmiIndex: number,
  paidAmount: number,
  paidDate: Date,
  transactionId: string
): {
  updatedSchedule: EmiScheduleItem[];
  newEmiIndex: number;
  isLastEmi: boolean;
} {
  const updatedSchedule = [...emiSchedule];
  
  // Mark current EMI as paid
  if (currentEmiIndex < updatedSchedule.length) {
    updatedSchedule[currentEmiIndex] = {
      ...updatedSchedule[currentEmiIndex],
      status: 'PAID',
      paidDate: paidDate.toISOString(),
      paidAmount,
      transactionId,
    };
  }

  const newEmiIndex = currentEmiIndex + 1;
  const isLastEmi = newEmiIndex >= updatedSchedule.length;

  return {
    updatedSchedule,
    newEmiIndex,
    isLastEmi,
  };
}

/**
 * Generate sequential invoice number in format INV-yyyymm-0001
 * Invoice numbers are unique per tenant per month
 * Includes a random suffix to handle legacy data conflicts during transition
 */
export async function generateInvoiceNumber(tenantId?: string): Promise<string> {
  const { default: CounterModel } = await import('@/models/dashboard/payments/Counter');
  const { getTenantContext } = await import('@/lib/tenant/tenant-context');
  
  // Get tenantId from parameter or context
  const effectiveTenantId = tenantId || getTenantContext()?.tenantId || 'default';
  
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const yearMonth = `${year}${month}`;
  
  // Get next sequence number for this tenant and year-month
  // This ensures each tenant has their own invoice sequence
  const counterName = `invoice_${effectiveTenantId}_${yearMonth}`;
  const sequenceNumber = await CounterModel.getNextSequence(counterName);
  
  // Format: INV-yyyymm-0001 (sequential, no random suffix, no student ID)
  return `INV-${yearMonth}-${String(sequenceNumber).padStart(4, '0')}`;
}

/**
 * Calculate total paid and total due
 */
export function calculatePaymentSummary(payment: any, newAmount: number): {
  totalPaid: number;
  totalDue: number;
  outstandingAmount: number;
  collectionRate: number;
} {
  const totalFees =
    (payment.courseRegistrationFee || 0) +
    (payment.studentRegistrationFee || 0) +
    (payment.courseFee || 0);

  const totalPaid = (payment.receivedAmount || 0) + newAmount;
  const outstandingAmount = Math.max(0, totalFees - totalPaid);
  
  // Special case: If no fees are set but payment received, consider it 100% collected
  // This handles cases where payment records are auto-created without fee information
  const collectionRate = totalFees > 0 
    ? (totalPaid / totalFees) * 100 
    : (totalPaid > 0 ? 100 : 0);

  return {
    totalPaid,
    totalDue: totalFees,
    outstandingAmount,
    collectionRate,
  };
}

/**
 * Determine payment status based on collection rate
 */
export function determinePaymentStatus(
  collectionRate: number,
  planType: 'ONE_TIME' | 'MONTHLY_SUBSCRIPTION' | 'EMI' | 'CUSTOM',
  isLastEmi?: boolean
): string {
  if (collectionRate >= 100) {
    return planType === 'EMI' && isLastEmi ? 'FULLY_PAID' : 'PAID';
  } else if (collectionRate > 0) {
    return 'PARTIAL';
  } else {
    return 'PENDING';
  }
}

/**
 * Process ONE-TIME payment
 */
export async function processOneTimePayment(
  payment: any,
  paymentData: ManualPaymentData
): Promise<any> {
  const summary = calculatePaymentSummary(payment, paymentData.amount);
  
  const updates: any = {
    receivedAmount: summary.totalPaid,
    outstandingAmount: summary.outstandingAmount,
    collectionRate: summary.collectionRate,
    paymentStatus: determinePaymentStatus(summary.collectionRate, 'ONE_TIME'),
    lastPaymentDate: paymentData.paymentDate,
    totalPaid: summary.totalPaid,
    totalDue: summary.totalDue,
    dueAmount: summary.outstandingAmount, // Track due amount for partial payments
  };

  // Check if this is the FIRST payment (before any payment was made)
  const isFirstPayment = !payment.receivedAmount || payment.receivedAmount === 0;

  // If fully paid, disable reminders
  if (summary.collectionRate >= 100) {
    updates.reminderEnabled = false;
    updates.nextReminderDate = null;
    updates.nextPaymentDate = null;
    updates.paymentStatus = 'PAID';
    updates.dueAmount = 0;
    updates.status = 'Completed';
    updates.preReminderEnabled = false; // Disable pre-reminders when fully paid
  } else if (summary.collectionRate > 0) {
    // PARTIAL PAYMENT - Auto-enable daily reminders until fully paid
    // Due date is TOMORROW (next day) for immediate follow-up on partial payments
    const dueDate = new Date(paymentData.paymentDate);
    dueDate.setDate(dueDate.getDate() + 1);
    dueDate.setHours(10, 0, 0, 0);
    
    // Reminder date is also tomorrow (same as due date for daily reminders)
    const reminderDate = new Date(paymentData.paymentDate);
    reminderDate.setDate(reminderDate.getDate() + 1);
    reminderDate.setHours(9, 0, 0, 0); // 1 hour before due time
    
    updates.nextPaymentDate = dueDate;
    updates.nextDueDate = dueDate; // Due date is tomorrow
    // Auto-enable reminders for partial payments (unless explicitly stopped)
    updates.reminderEnabled = paymentData.stopReminders ? false : true;
    updates.nextReminderDate = paymentData.stopReminders ? null : reminderDate; // Reminder tomorrow at 9 AM
    updates.reminderFrequency = 'DAILY'; // Always daily for partial One-Time payments
    updates.preReminderEnabled = false; // No pre-reminders for partial payments
    updates.remindersCount = payment.remindersCount || 0; // Don't increment here, increment on send
    updates.status = 'Partial';
    updates.paymentStatus = 'PARTIAL';
    
    console.log('ONE_TIME Partial Payment - Setting reminder dates:', {
      paymentDate: paymentData.paymentDate,
      nextDueDate: dueDate,
      nextReminderDate: reminderDate,
      reminderEnabled: updates.reminderEnabled,
      stopReminders: paymentData.stopReminders,
      totalPaid: summary.totalPaid,
      outstanding: summary.outstandingAmount,
      collectionRate: summary.collectionRate
    });
  } else {
    // No payment yet (should not happen in this flow since we're recording a payment)
    updates.nextPaymentDate = null;
    updates.nextReminderDate = null;
    updates.reminderEnabled = false;
    updates.reminderFrequency = 'NONE';
    updates.preReminderEnabled = false;
    updates.remindersCount = 0;
    updates.status = 'Pending';
    updates.paymentStatus = 'PENDING';
  }

  return updates;
}

/**
 * Process MONTHLY SUBSCRIPTION payment
 */
export async function processMonthlySubscriptionPayment(
  payment: any,
  paymentData: ManualPaymentData
): Promise<any> {
  const summary = calculatePaymentSummary(payment, paymentData.amount);
  const nextPaymentDate = calculateNextPaymentDate(
    paymentData.paymentDate,
    'MONTHLY_SUBSCRIPTION'
  );

  const updates: any = {
    receivedAmount: summary.totalPaid,
    outstandingAmount: summary.outstandingAmount,
    collectionRate: summary.collectionRate,
    paymentStatus: determinePaymentStatus(summary.collectionRate, 'MONTHLY_SUBSCRIPTION'),
    lastPaymentDate: paymentData.paymentDate,
    nextPaymentDate,
    subscriptionStatus: 'ACTIVE',
    totalPaid: summary.totalPaid,
    totalDue: summary.totalDue,
  };

  // Calculate next due date for monthly subscription
  if (nextPaymentDate && payment.monthlyDueDate) {
    const nextDue = calculateNextDueDate(
      payment.monthlyDueDate,
      paymentData.paymentDate,
      1 // Next month
    );
    updates.nextDueDate = nextDue;
    
    // Calculate reminder date (3 days before next due date)
    const reminderDate = new Date(nextDue);
    reminderDate.setDate(reminderDate.getDate() - 3);
    reminderDate.setHours(10, 0, 0, 0);
    
    // If reminder date is in the past, set it to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    if (reminderDate < tomorrow) {
      updates.nextReminderDate = tomorrow;
    } else {
      updates.nextReminderDate = reminderDate;
    }
    
    updates.reminderEnabled = paymentData.reminderEnabled !== false; // Default to true
    
    console.log('MONTHLY Payment - Setting reminder dates:', {
      monthlyDueDate: payment.monthlyDueDate,
      paymentDate: paymentData.paymentDate,
      nextDueDate: nextDue,
      nextReminderDate: updates.nextReminderDate,
      reminderEnabled: updates.reminderEnabled
    });
  } else if (paymentData.reminderEnabled && paymentData.nextReminderDate) {
    // Fallback to provided reminder date
    updates.reminderEnabled = true;
    updates.nextReminderDate = paymentData.nextReminderDate;
  }

  return updates;
}

/**
 * Process EMI payment
 */
export async function processEmiPayment(
  payment: any,
  paymentData: ManualPaymentData,
  transactionId: string
): Promise<any> {
  if (!payment.emiSchedule || paymentData.emiIndex === undefined) {
    throw new Error('EMI schedule or EMI index not found');
  }

  const currentEmiIndex = paymentData.emiIndex;
  const emiUpdate = updateEmiStatus(
    payment.emiSchedule,
    currentEmiIndex,
    paymentData.amount,
    paymentData.paymentDate,
    transactionId
  );

  const summary = calculatePaymentSummary(payment, paymentData.amount);
  const nextPaymentDate = emiUpdate.isLastEmi
    ? null
    : calculateNextPaymentDate(
        paymentData.paymentDate,
        'EMI',
        emiUpdate.updatedSchedule,
        emiUpdate.newEmiIndex
      );

  const updates: any = {
    receivedAmount: summary.totalPaid,
    outstandingAmount: summary.outstandingAmount,
    collectionRate: summary.collectionRate,
    paymentStatus: determinePaymentStatus(
      summary.collectionRate,
      'EMI',
      emiUpdate.isLastEmi
    ),
    lastPaymentDate: paymentData.paymentDate,
    emiSchedule: emiUpdate.updatedSchedule,
    currentEmiIndex: emiUpdate.newEmiIndex,
    nextPaymentDate,
    totalPaid: summary.totalPaid,
    totalDue: summary.totalDue,
  };

  // Handle first EMI
  if (currentEmiIndex === 0) {
    updates.subscriptionStatus = 'ACTIVE';
  }

  // Handle last EMI
  if (emiUpdate.isLastEmi) {
    updates.paymentStatus = 'FULLY_PAID';
    updates.reminderEnabled = false;
    updates.nextReminderDate = null;
    updates.nextDueDate = null;
    updates.subscriptionStatus = 'COMPLETED';
  } else {
    // Set next due date from EMI schedule
    if (nextPaymentDate) {
      updates.nextDueDate = nextPaymentDate;
      
      // Calculate reminder date (3 days before next payment)
      const reminderDate = new Date(nextPaymentDate);
      reminderDate.setDate(reminderDate.getDate() - 3);
      reminderDate.setHours(10, 0, 0, 0);
      
      // If reminder date is in the past, set it to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      
      if (reminderDate < tomorrow) {
        updates.nextReminderDate = tomorrow;
      } else {
        updates.nextReminderDate = reminderDate;
      }
      
      updates.reminderEnabled = paymentData.reminderEnabled !== false; // Default to true
      
      console.log('EMI Payment - Setting reminder dates:', {
        currentEmiIndex,
        nextEmiIndex: emiUpdate.newEmiIndex,
        nextPaymentDate,
        nextDueDate: updates.nextDueDate,
        nextReminderDate: updates.nextReminderDate,
        reminderEnabled: updates.reminderEnabled
      });
    } else if (paymentData.reminderEnabled && paymentData.nextReminderDate) {
      // Fallback to provided reminder date
      updates.reminderEnabled = true;
      updates.nextReminderDate = paymentData.nextReminderDate;
    }
  }

  return updates;
}

/**
 * Process CUSTOM payment
 */
export async function processCustomPayment(
  payment: any,
  paymentData: ManualPaymentData
): Promise<any> {
  const summary = calculatePaymentSummary(payment, paymentData.amount);

  const updates: any = {
    receivedAmount: summary.totalPaid,
    outstandingAmount: summary.outstandingAmount,
    collectionRate: summary.collectionRate,
    paymentStatus: determinePaymentStatus(summary.collectionRate, 'CUSTOM'),
    lastPaymentDate: paymentData.paymentDate,
    totalPaid: summary.totalPaid,
    totalDue: summary.totalDue,
  };

  // Custom payments may have optional reminders
  if (paymentData.reminderEnabled !== undefined) {
    updates.reminderEnabled = paymentData.reminderEnabled;
    updates.nextReminderDate = paymentData.nextReminderDate;
  }

  return updates;
}

/**
 * Main function to record manual payment
 */
export async function recordManualPayment(
  payment: any,
  paymentData: ManualPaymentData,
  transactionId: string
): Promise<any> {
  let updates: any;

  switch (paymentData.planType) {
    case 'ONE_TIME':
      updates = await processOneTimePayment(payment, paymentData);
      break;

    case 'MONTHLY_SUBSCRIPTION':
      updates = await processMonthlySubscriptionPayment(payment, paymentData);
      break;

    case 'EMI':
      updates = await processEmiPayment(payment, paymentData, transactionId);
      break;

    case 'CUSTOM':
      updates = await processCustomPayment(payment, paymentData);
      break;

    default:
      throw new Error(`Unsupported plan type: ${paymentData.planType}`);
  }

  // Add common fields
  updates.updatedAt = new Date();

  return updates;
}

/**
 * Update reminder schedule after payment
 */
export function updateReminderSchedule(
  planType: 'ONE_TIME' | 'MONTHLY_SUBSCRIPTION' | 'EMI' | 'CUSTOM',
  nextPaymentDate: Date | null,
  reminderEnabled: boolean
): {
  reminderEnabled: boolean;
  nextReminderDate: Date | null;
} {
  if (!reminderEnabled || !nextPaymentDate) {
    return {
      reminderEnabled: false,
      nextReminderDate: null,
    };
  }

  // Calculate reminder date (e.g., 3 days before next payment)
  const reminderDate = new Date(nextPaymentDate);
  reminderDate.setDate(reminderDate.getDate() - 3);

  // If reminder date is in the past, set it to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (reminderDate < tomorrow) {
    return {
      reminderEnabled: true,
      nextReminderDate: tomorrow,
    };
  }

  return {
    reminderEnabled: true,
    nextReminderDate: reminderDate,
  };
}
