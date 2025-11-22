/**
 * Monthly Subscription Helper Functions
 * 
 * This module provides functions to handle Monthly Subscription logic including
 * regular monthly payments and discounted subscription plans with commitment periods.
 */

export interface MonthlySubscriptionRecord {
  month: string;              // "2025-11"
  amount: number;             // discounted or original monthly fee
  status: "PAID" | "PENDING";
  paidOn?: Date;
  isDiscountApplied: boolean;
  invoiceId?: string;
}

export interface MonthlySubscriptionState {
  isFirstPayment: boolean;
  monthlyRecords: MonthlySubscriptionRecord[];
  commitmentPeriod?: number;  // months for discounted plans
  originalMonthlyFee: number;
  discountedMonthlyFee: number;
  currentMonth: string;       // current month being processed
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Get next month in YYYY-MM format
 */
export function getNextMonth(currentMonth: string): string {
  const date = new Date(currentMonth + '-01');
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 7);
}

/**
 * Calculate how many months have been paid so far
 */
export function getPaidMonthsCount(monthlyRecords: MonthlySubscriptionRecord[]): number {
  return monthlyRecords.filter(record => record.status === 'PAID').length;
}

/**
 * Check if this is the first payment (no paid months yet)
 */
export function isFirstPayment(monthlyRecords: MonthlySubscriptionRecord[]): boolean {
  return getPaidMonthsCount(monthlyRecords) === 0;
}

/**
 * Calculate current month's fee based on subscription type and commitment period
 */
export function calculateCurrentMonthFee(
  subscriptionState: MonthlySubscriptionState,
  isDiscountedPlan: boolean
): {
  monthlyFee: number;
  isDiscountApplied: boolean;
  registrationFees: {
    courseRegistrationFee: number;
    studentRegistrationFee: number;
  };
} {
  const paidMonths = getPaidMonthsCount(subscriptionState.monthlyRecords);
  const isFirst = paidMonths === 0;
  
  let monthlyFee = subscriptionState.originalMonthlyFee;
  let isDiscountApplied = false;
  
  // Apply discount logic for discounted plans
  if (isDiscountedPlan && subscriptionState.commitmentPeriod) {
    if (paidMonths < subscriptionState.commitmentPeriod) {
      monthlyFee = subscriptionState.discountedMonthlyFee;
      isDiscountApplied = true;
    }
  }
  
  // Registration fees only for first payment
  const registrationFees = isFirst ? {
    courseRegistrationFee: 1000,  // Default values - should be fetched from course data
    studentRegistrationFee: 500
  } : {
    courseRegistrationFee: 0,
    studentRegistrationFee: 0
  };
  
  return {
    monthlyFee,
    isDiscountApplied,
    registrationFees
  };
}

/**
 * Create a new monthly record for the current month
 */
export function createMonthlyRecord(
  month: string,
  amount: number,
  isDiscountApplied: boolean,
  status: "PAID" | "PENDING" = "PENDING"
): MonthlySubscriptionRecord {
  return {
    month,
    amount,
    status,
    isDiscountApplied,
    ...(status === "PAID" ? { paidOn: new Date() } : {})
  };
}

/**
 * Mark a monthly record as paid
 */
export function markMonthAsPaid(
  monthlyRecords: MonthlySubscriptionRecord[],
  month: string,
  invoiceId?: string
): MonthlySubscriptionRecord[] {
  return monthlyRecords.map(record => 
    record.month === month 
      ? { ...record, status: "PAID" as const, paidOn: new Date(), invoiceId }
      : record
  );
}

/**
 * Auto-generate next month's pending record
 */
export function generateNextMonthRecord(
  subscriptionState: MonthlySubscriptionState,
  isDiscountedPlan: boolean
): MonthlySubscriptionRecord {
  const nextMonth = getNextMonth(subscriptionState.currentMonth);
  const { monthlyFee, isDiscountApplied } = calculateCurrentMonthFee(
    { ...subscriptionState, currentMonth: nextMonth },
    isDiscountedPlan
  );
  
  return createMonthlyRecord(nextMonth, monthlyFee, isDiscountApplied, "PENDING");
}

/**
 * Initialize Monthly Subscription state for a new subscription
 * For Monthly Subscription, courseFee IS the monthly fee (not divided)
 */
export function initializeMonthlySubscription(
  originalMonthlyFee: number,
  discountedMonthlyFee: number = 0,
  commitmentPeriod?: number
): MonthlySubscriptionState {
  const currentMonth = getCurrentMonth();
  
  return {
    isFirstPayment: true,
    monthlyRecords: [],
    originalMonthlyFee, // This should be the full course fee, not divided
    discountedMonthlyFee,
    currentMonth,
    commitmentPeriod
  };
}

/**
 * Get the current month's record or create if doesn't exist
 */
export function getCurrentMonthRecord(
  subscriptionState: MonthlySubscriptionState,
  isDiscountedPlan: boolean
): MonthlySubscriptionRecord {
  const currentMonth = subscriptionState.currentMonth;
  const existingRecord = subscriptionState.monthlyRecords.find(
    record => record.month === currentMonth
  );
  
  if (existingRecord) {
    return existingRecord;
  }
  
  // Create new record for current month
  const { monthlyFee, isDiscountApplied } = calculateCurrentMonthFee(
    subscriptionState,
    isDiscountedPlan
  );
  
  return createMonthlyRecord(currentMonth, monthlyFee, isDiscountApplied, "PENDING");
}

/**
 * Calculate total payment amount for current month including registration fees
 */
export function calculateTotalPaymentAmount(
  subscriptionState: MonthlySubscriptionState,
  isDiscountedPlan: boolean,
  courseRegistrationFee: number = 1000,
  studentRegistrationFee: number = 500
): {
  monthlyFee: number;
  courseRegistrationFee: number;
  studentRegistrationFee: number;
  totalAmount: number;
  isDiscountApplied: boolean;
} {
  const { monthlyFee, isDiscountApplied, registrationFees } = calculateCurrentMonthFee(
    subscriptionState,
    isDiscountedPlan
  );
  
  // Use provided registration fees or defaults, but only for first payment
  const finalCourseRegFee = subscriptionState.isFirstPayment ? 
    (courseRegistrationFee || registrationFees.courseRegistrationFee) : 0;
  const finalStudentRegFee = subscriptionState.isFirstPayment ? 
    (studentRegistrationFee || registrationFees.studentRegistrationFee) : 0;
  
  const totalAmount = monthlyFee + finalCourseRegFee + finalStudentRegFee;
  
  return {
    monthlyFee,
    courseRegistrationFee: finalCourseRegFee,
    studentRegistrationFee: finalStudentRegFee,
    totalAmount,
    isDiscountApplied
  };
}

/**
 * Format monthly subscription summary for display
 */
export function formatMonthlySubscriptionSummary(
  subscriptionState: MonthlySubscriptionState,
  isDiscountedPlan: boolean
): string {
  const paidMonths = getPaidMonthsCount(subscriptionState.monthlyRecords);
  const currentRecord = getCurrentMonthRecord(subscriptionState, isDiscountedPlan);
  
  let summary = `Monthly Subscription - Current: ${currentRecord.month}\n`;
  summary += `Paid Months: ${paidMonths}\n`;
  summary += `Current Month Fee: ₹${currentRecord.amount.toLocaleString()}`;
  
  if (currentRecord.isDiscountApplied && subscriptionState.commitmentPeriod) {
    const remainingDiscountMonths = subscriptionState.commitmentPeriod - paidMonths;
    summary += ` (Discounted - ${remainingDiscountMonths} months remaining)`;
  }
  
  if (subscriptionState.isFirstPayment) {
    summary += `\n⚠️ First payment includes registration fees`;
  }
  
  return summary;
}

/**
 * Validate Monthly Subscription configuration
 */
export function validateMonthlySubscription(subscriptionState: MonthlySubscriptionState): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (subscriptionState.originalMonthlyFee <= 0) {
    errors.push('Original monthly fee must be greater than 0');
  }
  
  if (subscriptionState.commitmentPeriod && subscriptionState.commitmentPeriod < 1) {
    errors.push('Commitment period must be at least 1 month');
  }
  
  if (subscriptionState.discountedMonthlyFee < 0) {
    errors.push('Discounted monthly fee cannot be negative');
  }
  
  if (subscriptionState.discountedMonthlyFee >= subscriptionState.originalMonthlyFee) {
    errors.push('Discounted fee must be less than original fee');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}