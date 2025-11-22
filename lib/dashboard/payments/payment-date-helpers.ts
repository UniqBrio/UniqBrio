/**
 * Payment Date Helper Functions
 * Utilities for calculating reminder dates, handling month-end dates, and payment logic
 */

/**
 * Calculate the number of months between two dates (inclusive)
 * Example: Nov 1, 2025 to Mar 30, 2026 = 5 months (Nov, Dec, Jan, Feb, Mar)
 */
export function calculateMonthsBetween(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const yearDiff = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  
  // Total months = (year difference * 12) + month difference + 1 (to include both start and end months)
  return (yearDiff * 12) + monthDiff + 1;
}

/**
 * Get the last day of a given month
 * Handles leap years automatically
 */
export function getLastDayOfMonth(year: number, month: number): number {
  // Month is 0-indexed, so we pass the next month and day 0 to get last day of current month
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Adjust day of month for months with fewer days
 * Example: If monthlyDueDate is 31 but it's February, return 28/29
 */
export function adjustDayForMonth(year: number, month: number, day: number): number {
  const lastDay = getLastDayOfMonth(year, month);
  return Math.min(day, lastDay);
}

/**
 * Calculate next reminder date (2 days before the due date)
 * Handles month boundaries correctly
 */
export function calculateReminderDate(dueDate: Date): Date {
  const reminder = new Date(dueDate);
  reminder.setDate(reminder.getDate() - 2);
  return reminder;
}

/**
 * Get tomorrow's date
 */
export function getTomorrowDate(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  // Reset time to start of day
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * Calculate the next due date for monthly payments
 * @param monthlyDueDate - Day of month (1-31)
 * @param currentDate - Current date
 * @param monthsAhead - How many months ahead (1 = next month, 2 = month after next)
 */
export function calculateNextDueDate(
  monthlyDueDate: number, 
  currentDate: Date, 
  monthsAhead: number = 1
): Date {
  const nextDue = new Date(currentDate);
  nextDue.setMonth(nextDue.getMonth() + monthsAhead);
  
  // Adjust day for months with fewer days
  const adjustedDay = adjustDayForMonth(
    nextDue.getFullYear(), 
    nextDue.getMonth(), 
    monthlyDueDate
  );
  
  nextDue.setDate(adjustedDay);
  nextDue.setHours(0, 0, 0, 0);
  
  return nextDue;
}

/**
 * Calculate next reminder date for monthly payments
 * Returns 2 days before the next month's due date
 */
export function calculateNextMonthlyReminder(
  monthlyDueDate: number,
  currentDate: Date,
  monthsAhead: number = 1
): Date {
  const nextDue = calculateNextDueDate(monthlyDueDate, currentDate, monthsAhead);
  return calculateReminderDate(nextDue);
}

/**
 * Calculate how many complete months are paid with the given amount
 * @param amount - Payment amount
 * @param monthlyInstallment - Monthly installment amount
 * @returns { monthsPaid, remainingAmount }
 */
export function calculateMonthsPaid(amount: number, monthlyInstallment: number): {
  monthsPaid: number;
  remainingAmount: number;
} {
  if (monthlyInstallment <= 0) {
    return { monthsPaid: 0, remainingAmount: amount };
  }
  
  const monthsPaid = Math.floor(amount / monthlyInstallment);
  const remainingAmount = amount % monthlyInstallment;
  
  return { monthsPaid, remainingAmount };
}

/**
 * Auto-update reminder date if it's in the past
 * @param reminderDate - Current reminder date
 * @returns Updated reminder date (tomorrow if past, original if future)
 */
export function autoUpdateReminderDate(reminderDate: Date | null): Date {
  if (!reminderDate) {
    return getTomorrowDate();
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const reminder = new Date(reminderDate);
  reminder.setHours(0, 0, 0, 0);
  
  // If reminder is in the past or today, set to tomorrow
  if (reminder <= today) {
    return getTomorrowDate();
  }
  
  return reminder;
}

/**
 * Format date to YYYY-MM-DD for input fields
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if date is in the past (before today)
 */
export function isDateInPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  return checkDate < today;
}
