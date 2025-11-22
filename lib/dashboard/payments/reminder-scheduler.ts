/**
 * REMINDER SCHEDULER - Comprehensive Due Date & Reminder Logic
 * 
 * Handles all 4 payment categories:
 * 1. One-Time Payment
 * 2. One-Time Payment with Installments
 * 3. Monthly Subscription
 * 4. Monthly Subscription with Discounts (Committed Duration)
 * 
 * Features:
 * - Auto-calculated nextDueDate for all categories
 * - Pre-due reminders (X days before)
 * - Grace period reminders (G days after)
 * - Overdue reminders (every Y days, max Z attempts)
 * - Contract end reminders for committed subscriptions
 * - Timezone-aware date handling
 * - Reminder history tracking
 */

import { addDays, addMonths, startOfDay, setDate, getDate, getDaysInMonth } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/**
 * Payment Category Types
 */
export type PaymentCategory = 
  | 'ONE_TIME' 
  | 'ONE_TIME_WITH_INSTALLMENTS' 
  | 'MONTHLY_SUBSCRIPTION' 
  | 'MONTHLY_SUBSCRIPTION_WITH_DISCOUNTS';

/**
 * Reminder Type Classifications
 */
export type ReminderType = 
  | 'PRE_DUE'           // X days before due date
  | 'DUE_DATE'          // On the due date
  | 'GRACE_PERIOD'      // Within G days after due date
  | 'OVERDUE'           // After grace period (every Y days)
  | 'CONTRACT_END';     // For committed duration subscriptions

/**
 * Reminder Status
 */
export type ReminderStatus = 
  | 'SCHEDULED'   // Reminder is scheduled but not sent
  | 'SENT'        // Reminder has been sent
  | 'FAILED'      // Reminder failed to send
  | 'SKIPPED'     // Reminder was skipped (payment received)
  | 'CANCELLED';  // Reminder was cancelled

/**
 * Admin-configurable Reminder Settings
 */
export interface ReminderSettings {
  /** Days before due date to send pre-reminder (X) */
  reminderDaysBeforeDue: number;
  
  /** Grace period days after due date before marking overdue (G) */
  graceDays: number;
  
  /** Frequency of overdue reminders in days (Y) */
  overdueReminderFrequencyDays: number;
  
  /** Maximum reminder attempts for overdue payments (Z) */
  maxReminderAttempts: number;
  
  /** Timezone for date calculations (default: UTC) */
  timezone: string;
  
  /** Enable/disable pre-due reminders */
  enablePreDueReminders: boolean;
  
  /** Enable/disable grace period reminders */
  enableGraceReminders: boolean;
  
  /** Enable/disable overdue reminders */
  enableOverdueReminders: boolean;
}

/**
 * Default Reminder Settings
 */
export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  reminderDaysBeforeDue: 3,              // 3 days before due date
  graceDays: 2,                          // 2 days grace period
  overdueReminderFrequencyDays: 7,       // Every 7 days when overdue
  maxReminderAttempts: 5,                // Maximum 5 overdue reminders
  timezone: 'UTC',                        // Default to UTC
  enablePreDueReminders: true,
  enableGraceReminders: true,
  enableOverdueReminders: true,
};

/**
 * Individual Reminder Entry
 */
export interface ReminderEntry {
  /** Unique reminder ID */
  id: string;
  
  /** Type of reminder */
  type: ReminderType;
  
  /** Scheduled trigger date (ISO format) */
  scheduledDate: Date;
  
  /** Current status */
  status: ReminderStatus;
  
  /** Date reminder was sent (if applicable) */
  sentDate?: Date;
  
  /** Attempt number (for overdue reminders) */
  attemptNumber: number;
  
  /** Associated due date */
  associatedDueDate: Date;
  
  /** Error message if failed */
  errorMessage?: string;
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Payment Schedule Data
 */
export interface PaymentScheduleData {
  /** Payment category */
  category: PaymentCategory;
  
  /** Last payment date (if any) */
  lastPaymentDate?: Date;
  
  /** Next calculated due date */
  nextDueDate: Date;
  
  /** Next reminder trigger date */
  nextReminderTriggerDate?: Date;
  
  /** Reminder history */
  reminderHistory: ReminderEntry[];
  
  /** Reminder settings (category-specific or global) */
  reminderSettings: ReminderSettings;
  
  /** === ONE-TIME PAYMENT SPECIFIC === */
  /** Defined due date for one-time payment */
  definedDueDate?: Date;
  
  /** === INSTALLMENT SPECIFIC === */
  /** Days between installments */
  installmentPeriodDays?: number;
  
  /** Current installment number */
  currentInstallmentNumber?: number;
  
  /** Total number of installments */
  totalInstallments?: number;
  
  /** === MONTHLY SUBSCRIPTION SPECIFIC === */
  /** Fixed billing day of month (1-31) */
  fixedBillingDayOfMonth?: number;
  
  /** Use fixed day vs. 30-day cycle */
  useFixedBillingDay?: boolean;
  
  /** === COMMITTED SUBSCRIPTION SPECIFIC === */
  /** Contract start date */
  contractStartDate?: Date;
  
  /** Commitment duration in months */
  commitmentMonths?: number;
  
  /** Contract end date (calculated) */
  contractEndDate?: Date;
  
  /** Contract end reminder date */
  contractEndReminderDate?: Date;
  
  /** Timezone for calculations */
  timezone: string;
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Generated Reminder Schedule
 */
export interface GeneratedReminderSchedule {
  /** Next due date */
  nextDueDate: Date;
  
  /** All scheduled reminders */
  reminders: ReminderEntry[];
  
  /** Next reminder to trigger */
  nextReminderTriggerDate?: Date;
  
  /** Contract-related reminders (if applicable) */
  contractReminders?: ReminderEntry[];
}

// ============================================================
// HELPER UTILITIES
// ============================================================

/**
 * Generate unique reminder ID
 */
function generateReminderId(): string {
  return `REM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convert date to specified timezone and start of day
 */
function toTimezoneStartOfDay(date: Date, timezone: string): Date {
  const zonedDate = toZonedTime(date, timezone);
  return startOfDay(zonedDate);
}

/**
 * Validate date is not in the past or negative
 */
function validateDate(date: Date, context: string): void {
  if (!date || isNaN(date.getTime())) {
    throw new Error(`Invalid date in ${context}`);
  }
  
  // Allow dates in the past for lastPaymentDate, but not for nextDueDate
  if (context.includes('nextDueDate') && date < new Date()) {
    console.warn(`Warning: ${context} is in the past: ${date.toISOString()}`);
  }
}

/**
 * Adjust day for months with fewer days
 * Example: Billing day 31 → February becomes day 28/29
 */
function adjustDayForMonth(date: Date, targetDay: number): Date {
  const daysInMonth = getDaysInMonth(date);
  const adjustedDay = Math.min(targetDay, daysInMonth);
  return setDate(date, adjustedDay);
}

/**
 * Prevent infinite loops - max iterations safeguard
 */
const MAX_ITERATIONS = 100;

// ============================================================
// CORE CALCULATION FUNCTIONS
// ============================================================

/**
 * Calculate Next Due Date for ALL Categories
 * 
 * @param scheduleData - Payment schedule information
 * @returns Next due date
 */
export function calculateNextDueDate(
  scheduleData: Partial<PaymentScheduleData>
): Date {
  const { category, timezone = 'UTC' } = scheduleData;
  
  if (!category) {
    throw new Error('Payment category is required');
  }
  
  let nextDueDate: Date;
  
  switch (category) {
    case 'ONE_TIME':
      nextDueDate = calculateOneTimeDueDate(scheduleData, timezone);
      break;
      
    case 'ONE_TIME_WITH_INSTALLMENTS':
      nextDueDate = calculateInstallmentDueDate(scheduleData, timezone);
      break;
      
    case 'MONTHLY_SUBSCRIPTION':
      nextDueDate = calculateMonthlySubscriptionDueDate(scheduleData, timezone);
      break;
      
    case 'MONTHLY_SUBSCRIPTION_WITH_DISCOUNTS':
      nextDueDate = calculateCommittedSubscriptionDueDate(scheduleData, timezone);
      break;
      
    default:
      throw new Error(`Unsupported payment category: ${category}`);
  }
  
  validateDate(nextDueDate, 'nextDueDate');
  return toTimezoneStartOfDay(nextDueDate, timezone);
}

/**
 * 1️⃣ ONE-TIME PAYMENT
 * nextDueDate = definedDueDate
 */
function calculateOneTimeDueDate(
  scheduleData: Partial<PaymentScheduleData>,
  timezone: string
): Date {
  const { definedDueDate } = scheduleData;
  
  if (!definedDueDate) {
    throw new Error('definedDueDate is required for ONE_TIME payment');
  }
  
  return toTimezoneStartOfDay(definedDueDate, timezone);
}

/**
 * 2️⃣ ONE-TIME PAYMENT WITH INSTALLMENTS
 * nextDueDate = lastPaymentDate + installmentPeriodDays
 */
function calculateInstallmentDueDate(
  scheduleData: Partial<PaymentScheduleData>,
  timezone: string
): Date {
  const { 
    lastPaymentDate, 
    installmentPeriodDays,
    currentInstallmentNumber = 1,
    totalInstallments = 3
  } = scheduleData;
  
  if (!lastPaymentDate) {
    throw new Error('lastPaymentDate is required for installment calculation');
  }
  
  if (!installmentPeriodDays || installmentPeriodDays <= 0) {
    throw new Error('installmentPeriodDays must be a positive number');
  }
  
  if (currentInstallmentNumber >= totalInstallments) {
    throw new Error('All installments have been completed');
  }
  
  const nextDueDate = addDays(lastPaymentDate, installmentPeriodDays);
  return toTimezoneStartOfDay(nextDueDate, timezone);
}

/**
 * 3️⃣ MONTHLY SUBSCRIPTION
 * nextDueDate = lastPaymentDate + 30 days OR fixedBillingDayOfMonth
 */
function calculateMonthlySubscriptionDueDate(
  scheduleData: Partial<PaymentScheduleData>,
  timezone: string
): Date {
  const { 
    lastPaymentDate,
    fixedBillingDayOfMonth,
    useFixedBillingDay = false
  } = scheduleData;
  
  if (!lastPaymentDate) {
    throw new Error('lastPaymentDate is required for monthly subscription');
  }
  
  let nextDueDate: Date;
  
  if (useFixedBillingDay && fixedBillingDayOfMonth) {
    // Use fixed billing day of month
    if (fixedBillingDayOfMonth < 1 || fixedBillingDayOfMonth > 31) {
      throw new Error('fixedBillingDayOfMonth must be between 1 and 31');
    }
    
    // Add one month to last payment date
    const nextMonth = addMonths(lastPaymentDate, 1);
    
    // Set to fixed billing day (adjust for short months)
    nextDueDate = adjustDayForMonth(nextMonth, fixedBillingDayOfMonth);
  } else {
    // Use 30-day cycle
    nextDueDate = addDays(lastPaymentDate, 30);
  }
  
  return toTimezoneStartOfDay(nextDueDate, timezone);
}

/**
 * 4️⃣ MONTHLY SUBSCRIPTION WITH DISCOUNTS (COMMITTED DURATION)
 * nextDueDate = lastPaymentDate + 30 days
 * Also calculates contract end date and reminder
 */
function calculateCommittedSubscriptionDueDate(
  scheduleData: Partial<PaymentScheduleData>,
  timezone: string
): Date {
  const { 
    lastPaymentDate,
    contractStartDate,
    commitmentMonths = 12
  } = scheduleData;
  
  if (!lastPaymentDate) {
    throw new Error('lastPaymentDate is required for committed subscription');
  }
  
  // Next due date is simply 30 days from last payment
  const nextDueDate = addDays(lastPaymentDate, 30);
  
  return toTimezoneStartOfDay(nextDueDate, timezone);
}

/**
 * Calculate Contract End Date for Committed Subscriptions
 */
export function calculateContractEndDate(
  contractStartDate: Date,
  commitmentMonths: number,
  timezone: string = 'UTC'
): Date {
  if (!contractStartDate) {
    throw new Error('contractStartDate is required');
  }
  
  if (commitmentMonths <= 0) {
    throw new Error('commitmentMonths must be positive');
  }
  
  const contractEndDate = addMonths(contractStartDate, commitmentMonths);
  return toTimezoneStartOfDay(contractEndDate, timezone);
}

/**
 * Calculate Contract End Reminder Date
 * contractEndReminderDate = contractEndDate - X days
 */
export function calculateContractReminderDate(
  contractEndDate: Date,
  reminderDaysBeforeDue: number,
  timezone: string = 'UTC'
): Date {
  if (!contractEndDate) {
    throw new Error('contractEndDate is required');
  }
  
  if (reminderDaysBeforeDue < 0) {
    throw new Error('reminderDaysBeforeDue cannot be negative');
  }
  
  const reminderDate = addDays(contractEndDate, -reminderDaysBeforeDue);
  return toTimezoneStartOfDay(reminderDate, timezone);
}

// ============================================================
// REMINDER GENERATION FUNCTIONS
// ============================================================

/**
 * Generate Complete Reminder Schedule
 * 
 * Creates all reminder entries: pre-due, due date, grace, and overdue
 * 
 * @param scheduleData - Payment schedule information
 * @returns Complete reminder schedule with all entries
 */
export function generateReminderDates(
  scheduleData: PaymentScheduleData
): GeneratedReminderSchedule {
  const { 
    nextDueDate, 
    reminderSettings, 
    timezone,
    category,
    contractStartDate,
    commitmentMonths
  } = scheduleData;
  
  validateDate(nextDueDate, 'nextDueDate for reminder generation');
  
  const reminders: ReminderEntry[] = [];
  const now = new Date();
  
  // 1️⃣ PRE-DUE REMINDER (X days before due date)
  if (reminderSettings.enablePreDueReminders && reminderSettings.reminderDaysBeforeDue > 0) {
    const preDueDate = addDays(nextDueDate, -reminderSettings.reminderDaysBeforeDue);
    
    // Only schedule if in the future
    if (preDueDate > now) {
      reminders.push(createReminderEntry({
        type: 'PRE_DUE',
        scheduledDate: preDueDate,
        associatedDueDate: nextDueDate,
        attemptNumber: 1,
        timezone
      }));
    }
  }
  
  // 2️⃣ DUE DATE REMINDER (on the due date)
  if (nextDueDate >= now) {
    reminders.push(createReminderEntry({
      type: 'DUE_DATE',
      scheduledDate: nextDueDate,
      associatedDueDate: nextDueDate,
      attemptNumber: 1,
      timezone
    }));
  }
  
  // 3️⃣ GRACE PERIOD REMINDER (G days after due date)
  if (reminderSettings.enableGraceReminders && reminderSettings.graceDays > 0) {
    const graceDate = addDays(nextDueDate, reminderSettings.graceDays);
    
    reminders.push(createReminderEntry({
      type: 'GRACE_PERIOD',
      scheduledDate: graceDate,
      associatedDueDate: nextDueDate,
      attemptNumber: 1,
      timezone
    }));
  }
  
  // 4️⃣ OVERDUE REMINDERS (every Y days, max Z attempts)
  if (reminderSettings.enableOverdueReminders) {
    const graceEndDate = addDays(
      nextDueDate, 
      reminderSettings.graceDays
    );
    
    let iteration = 0;
    for (let attempt = 1; attempt <= reminderSettings.maxReminderAttempts; attempt++) {
      if (iteration++ > MAX_ITERATIONS) {
        console.error('Max iterations reached in overdue reminder generation');
        break;
      }
      
      const overdueDate = addDays(
        graceEndDate,
        reminderSettings.overdueReminderFrequencyDays * attempt
      );
      
      reminders.push(createReminderEntry({
        type: 'OVERDUE',
        scheduledDate: overdueDate,
        associatedDueDate: nextDueDate,
        attemptNumber: attempt,
        timezone
      }));
    }
  }
  
  // 5️⃣ CONTRACT END REMINDER (for committed subscriptions)
  const contractReminders: ReminderEntry[] = [];
  
  if (
    category === 'MONTHLY_SUBSCRIPTION_WITH_DISCOUNTS' &&
    contractStartDate &&
    commitmentMonths
  ) {
    const contractEndDate = calculateContractEndDate(
      contractStartDate,
      commitmentMonths,
      timezone
    );
    
    const contractReminderDate = calculateContractReminderDate(
      contractEndDate,
      reminderSettings.reminderDaysBeforeDue,
      timezone
    );
    
    if (contractReminderDate > now) {
      contractReminders.push(createReminderEntry({
        type: 'CONTRACT_END',
        scheduledDate: contractReminderDate,
        associatedDueDate: contractEndDate,
        attemptNumber: 1,
        timezone
      }));
    }
  }
  
  // Sort reminders by scheduled date
  reminders.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  
  // Find next reminder to trigger
  const nextReminderTriggerDate = reminders.find(r => 
    r.status === 'SCHEDULED' && r.scheduledDate > now
  )?.scheduledDate;
  
  return {
    nextDueDate,
    reminders,
    nextReminderTriggerDate,
    contractReminders: contractReminders.length > 0 ? contractReminders : undefined
  };
}

/**
 * Create a Reminder Entry
 */
function createReminderEntry(params: {
  type: ReminderType;
  scheduledDate: Date;
  associatedDueDate: Date;
  attemptNumber: number;
  timezone: string;
}): ReminderEntry {
  const now = new Date();
  
  return {
    id: generateReminderId(),
    type: params.type,
    scheduledDate: toTimezoneStartOfDay(params.scheduledDate, params.timezone),
    status: 'SCHEDULED',
    attemptNumber: params.attemptNumber,
    associatedDueDate: toTimezoneStartOfDay(params.associatedDueDate, params.timezone),
    createdAt: now,
    updatedAt: now,
  };
}

// ============================================================
// REMINDER MANAGEMENT FUNCTIONS
// ============================================================

/**
 * Update Reminder Status
 */
export function updateReminderStatus(
  reminder: ReminderEntry,
  status: ReminderStatus,
  errorMessage?: string
): ReminderEntry {
  return {
    ...reminder,
    status,
    sentDate: status === 'SENT' ? new Date() : reminder.sentDate,
    errorMessage,
    updatedAt: new Date(),
  };
}

/**
 * Cancel Future Reminders (e.g., when payment is received)
 */
export function cancelFutureReminders(
  reminders: ReminderEntry[]
): ReminderEntry[] {
  const now = new Date();
  
  return reminders.map(reminder => {
    if (reminder.status === 'SCHEDULED' && reminder.scheduledDate > now) {
      return updateReminderStatus(reminder, 'CANCELLED');
    }
    return reminder;
  });
}

/**
 * Get Next Reminder to Send
 */
export function getNextReminderToSend(
  reminders: ReminderEntry[]
): ReminderEntry | null {
  const now = new Date();
  
  // Find first scheduled reminder that is due
  const nextReminder = reminders.find(r => 
    r.status === 'SCHEDULED' && 
    r.scheduledDate <= now
  );
  
  return nextReminder || null;
}

/**
 * Check if Payment is Overdue
 */
export function isPaymentOverdue(
  nextDueDate: Date,
  graceDays: number = 0
): boolean {
  const now = new Date();
  const graceEndDate = addDays(nextDueDate, graceDays);
  
  return now > graceEndDate;
}

/**
 * Calculate Days Until Due
 */
export function calculateDaysUntilDue(nextDueDate: Date): number {
  const now = startOfDay(new Date());
  const dueDay = startOfDay(nextDueDate);
  
  const diffInMs = dueDay.getTime() - now.getTime();
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
  
  return diffInDays;
}

/**
 * Calculate Days Overdue
 */
export function calculateDaysOverdue(
  nextDueDate: Date,
  graceDays: number = 0
): number {
  const now = startOfDay(new Date());
  const graceEndDate = startOfDay(addDays(nextDueDate, graceDays));
  
  if (now <= graceEndDate) {
    return 0;
  }
  
  const diffInMs = now.getTime() - graceEndDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  return diffInDays;
}

// ============================================================
// COMPLETE SCHEDULE GENERATION
// ============================================================

/**
 * Generate Complete Payment Schedule
 * 
 * Main entry point that calculates nextDueDate and generates all reminders
 */
export function generateCompletePaymentSchedule(
  scheduleData: Partial<PaymentScheduleData>
): PaymentScheduleData {
  const timezone = scheduleData.timezone || 'UTC';
  const reminderSettings = {
    ...DEFAULT_REMINDER_SETTINGS,
    ...scheduleData.reminderSettings,
    timezone,
  };
  
  // Calculate next due date
  const nextDueDate = calculateNextDueDate(scheduleData);
  
  // Create complete schedule data
  const completeScheduleData: PaymentScheduleData = {
    category: scheduleData.category!,
    lastPaymentDate: scheduleData.lastPaymentDate,
    nextDueDate,
    reminderHistory: scheduleData.reminderHistory || [],
    reminderSettings,
    definedDueDate: scheduleData.definedDueDate,
    installmentPeriodDays: scheduleData.installmentPeriodDays,
    currentInstallmentNumber: scheduleData.currentInstallmentNumber,
    totalInstallments: scheduleData.totalInstallments,
    fixedBillingDayOfMonth: scheduleData.fixedBillingDayOfMonth,
    useFixedBillingDay: scheduleData.useFixedBillingDay,
    contractStartDate: scheduleData.contractStartDate,
    commitmentMonths: scheduleData.commitmentMonths,
    timezone,
    createdAt: scheduleData.createdAt || new Date(),
    updatedAt: new Date(),
  };
  
  // Generate reminders
  const reminderSchedule = generateReminderDates(completeScheduleData);
  
  // Update schedule with generated reminders
  completeScheduleData.reminderHistory = reminderSchedule.reminders;
  completeScheduleData.nextReminderTriggerDate = reminderSchedule.nextReminderTriggerDate;
  
  // Add contract end date and reminder for committed subscriptions
  if (
    scheduleData.category === 'MONTHLY_SUBSCRIPTION_WITH_DISCOUNTS' &&
    scheduleData.contractStartDate &&
    scheduleData.commitmentMonths
  ) {
    completeScheduleData.contractEndDate = calculateContractEndDate(
      scheduleData.contractStartDate,
      scheduleData.commitmentMonths,
      timezone
    );
    
    completeScheduleData.contractEndReminderDate = calculateContractReminderDate(
      completeScheduleData.contractEndDate,
      reminderSettings.reminderDaysBeforeDue,
      timezone
    );
  }
  
  return completeScheduleData;
}

// ============================================================
// EXPORT ALL PUBLIC APIs
// ============================================================

export {
  // Types
  type PaymentScheduleData as IPaymentScheduleData,
  type ReminderEntry as IReminderEntry,
  type ReminderSettings as IReminderSettings,
  type GeneratedReminderSchedule as IGeneratedReminderSchedule,
  
  // Constants
  DEFAULT_REMINDER_SETTINGS as DEFAULT_SETTINGS,
};
