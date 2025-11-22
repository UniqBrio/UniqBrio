import {
  OneTimeInstallment,
  OneTimeInstallmentsConfig,
  InstallmentRules,
  InstallmentStage,
} from '@/types/dashboard/payment';

// Re-export types for convenience
export type { OneTimeInstallment, OneTimeInstallmentsConfig };

/**
 * Configuration rules for One Time with Installments payment plan
 * Fixed rules that govern each installment stage behavior
 */
export const INSTALLMENT_RULES: InstallmentRules = {
  first: {
    reminderDaysBefore: 2,
    invoiceOnPayment: false, // Invoice only when fully paid
    finalInvoice: false,
    stopReminderToggle: false, // No toggles for first EMI
    stopAccessToggle: false,
    messageTemplate: 'default',
  },
  middle: {
    reminderDaysBefore: 2,
    invoiceOnPayment: true, // Invoice required after payment
    finalInvoice: false,
    stopReminderToggle: true, // Toggles enabled
    stopAccessToggle: true,
    messageTemplate: 'default',
  },
  last: {
    reminderDaysBefore: 2,
    invoiceOnPayment: true,
    finalInvoice: true, // Final invoice on completion
    stopReminderToggle: true,
    stopAccessToggle: true,
    messageTemplate: 'default',
  },
};

/**
 * Calculate the number of days between two dates
 */
export function calculateDaysBetween(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Subtract days from a date
 */
export function subtractDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

/**
 * Determine the stage of an installment based on its number
 */
export function getInstallmentStage(
  installmentNumber: number,
  totalInstallments: number
): InstallmentStage {
  if (installmentNumber === 1) return 'first';
  if (installmentNumber === totalInstallments) return 'last';
  return 'middle';
}

/**
 * Split course duration into 3 equal installment periods
 * Returns an array of due dates
 */
export function splitDurationIntoInstallments(
  startDate: Date,
  endDate: Date,
  installmentCount: number = 3
): Date[] {
  const totalDays = calculateDaysBetween(startDate, endDate);
  const daysPerInstallment = Math.floor(totalDays / installmentCount);
  
  const dueDates: Date[] = [];
  
  for (let i = 0; i < installmentCount; i++) {
    const daysToAdd = (i + 1) * daysPerInstallment;
    const dueDate = addDays(startDate, daysToAdd);
    
    // Ensure the last installment doesn't exceed the end date
    if (i === installmentCount - 1 && dueDate > endDate) {
      dueDates.push(new Date(endDate));
    } else {
      dueDates.push(dueDate);
    }
  }
  
  return dueDates;
}

/**
 * Calculate equal installment amounts
 * Handles remainders by adding to the last installment
 */
export function calculateInstallmentAmounts(
  totalAmount: number,
  installmentCount: number = 3
): number[] {
  const baseAmount = Math.floor(totalAmount / installmentCount);
  const remainder = totalAmount - baseAmount * installmentCount;
  
  const amounts: number[] = [];
  for (let i = 0; i < installmentCount; i++) {
    if (i === installmentCount - 1) {
      // Add remainder to last installment
      amounts.push(baseAmount + remainder);
    } else {
      amounts.push(baseAmount);
    }
  }
  
  return amounts;
}

/**
 * Generate a single installment with all required fields
 */
export function generateInstallment(
  installmentNumber: number,
  dueDate: Date,
  amount: number,
  totalInstallments: number
): OneTimeInstallment {
  const stage = getInstallmentStage(installmentNumber, totalInstallments);
  const rules = INSTALLMENT_RULES[stage];
  
  const reminderDate = subtractDays(dueDate, rules.reminderDaysBefore);
  
  return {
    installmentNumber,
    stage,
    dueDate,
    reminderDate,
    reminderDaysBefore: rules.reminderDaysBefore,
    amount,
    invoiceOnPayment: rules.invoiceOnPayment,
    finalInvoice: rules.finalInvoice,
    stopReminderToggle: rules.stopReminderToggle,
    stopAccessToggle: rules.stopAccessToggle,
    status: 'UNPAID',
    messageTemplate: rules.messageTemplate,
  };
}

/**
 * Main function: Generate complete One Time with Installments configuration
 */
export function generateOneTimeInstallments(
  startDate: Date,
  endDate: Date,
  totalAmount: number,
  installmentCount: number = 3
): OneTimeInstallmentsConfig {
  // Validate inputs
  if (installmentCount !== 3) {
    throw new Error('Installment count must be exactly 3');
  }
  
  if (startDate >= endDate) {
    throw new Error('Start date must be before end date');
  }
  
  if (totalAmount <= 0) {
    throw new Error('Total amount must be greater than 0');
  }
  
  // Calculate course duration
  const durationInDays = calculateDaysBetween(startDate, endDate);
  
  // Split duration into equal periods
  const dueDates = splitDurationIntoInstallments(startDate, endDate, installmentCount);
  
  // Calculate equal amounts
  const amounts = calculateInstallmentAmounts(totalAmount, installmentCount);
  
  // Generate installments
  const installments: OneTimeInstallment[] = [];
  for (let i = 0; i < installmentCount; i++) {
    const installment = generateInstallment(
      i + 1,
      dueDates[i],
      amounts[i],
      installmentCount
    );
    installments.push(installment);
  }
  
  return {
    paymentType: 'ONE_TIME_WITH_INSTALLMENTS',
    installments,
    autoStopOnFullPayment: true,
    partialPaymentAllowed: false,
    totalAmount,
    courseDuration: {
      startDate,
      endDate,
      durationInDays,
    },
  };
}

/**
 * Update installment status when payment is made
 */
export function markInstallmentAsPaid(
  config: OneTimeInstallmentsConfig,
  installmentNumber: number,
  paidAmount: number,
  transactionId?: string
): OneTimeInstallmentsConfig {
  const updatedInstallments = config.installments.map((inst) => {
    if (inst.installmentNumber === installmentNumber) {
      return {
        ...inst,
        status: 'PAID' as const,
        paidDate: new Date(),
        paidAmount,
        transactionId,
      };
    }
    return inst;
  });
  
  return {
    ...config,
    installments: updatedInstallments,
  };
}

/**
 * Check if all installments are paid
 */
export function areAllInstallmentsPaid(config: OneTimeInstallmentsConfig): boolean {
  return config.installments.every((inst) => inst.status === 'PAID');
}

/**
 * Get next unpaid installment
 */
export function getNextUnpaidInstallment(
  config: OneTimeInstallmentsConfig
): OneTimeInstallment | null {
  return config.installments.find((inst) => inst.status === 'UNPAID') || null;
}

/**
 * Calculate total paid amount
 */
export function calculateTotalPaid(config: OneTimeInstallmentsConfig): number {
  return config.installments
    .filter((inst) => inst.status === 'PAID')
    .reduce((sum, inst) => sum + (inst.paidAmount || inst.amount), 0);
}

/**
 * Calculate remaining balance
 */
export function calculateRemainingBalance(config: OneTimeInstallmentsConfig): number {
  const totalPaid = calculateTotalPaid(config);
  return config.totalAmount - totalPaid;
}

/**
 * Get installments that need reminders (due date approaching and unpaid)
 */
export function getInstallmentsNeedingReminders(
  config: OneTimeInstallmentsConfig,
  currentDate: Date = new Date()
): OneTimeInstallment[] {
  return config.installments.filter((inst) => {
    if (inst.status === 'PAID') return false;
    return inst.reminderDate <= currentDate && inst.dueDate >= currentDate;
  });
}

/**
 * Format installment for display
 */
export function formatInstallmentSummary(installment: OneTimeInstallment): string {
  const stageLabel = {
    first: '1st Installment',
    middle: '2nd Installment',
    last: 'Final Installment',
  }[installment.stage];
  
  const statusLabel = installment.status === 'PAID' ? '✓ Paid' : 'Unpaid';
  const dueDate = installment.dueDate.toLocaleDateString('en-IN');
  
  return `${stageLabel} - ₹${installment.amount.toLocaleString()} - Due: ${dueDate} - ${statusLabel}`;
}

/**
 * Validate installment configuration
 */
export function validateInstallmentConfig(
  config: OneTimeInstallmentsConfig
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check count
  if (config.installments.length !== 3) {
    errors.push('Must have exactly 3 installments');
  }
  
  // Check total amount
  const sumOfInstallments = config.installments.reduce(
    (sum, inst) => sum + inst.amount,
    0
  );
  if (sumOfInstallments !== config.totalAmount) {
    errors.push('Sum of installment amounts must equal total amount');
  }
  
  // Check due dates are in order
  for (let i = 1; i < config.installments.length; i++) {
    if (config.installments[i].dueDate <= config.installments[i - 1].dueDate) {
      errors.push('Installment due dates must be in ascending order');
    }
  }
  
  // Check reminder dates
  config.installments.forEach((inst, index) => {
    if (inst.reminderDate >= inst.dueDate) {
      errors.push(`Installment ${index + 1}: Reminder date must be before due date`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
