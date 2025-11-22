/**
 * Payment Record Helper Functions
 * Utility functions for one-time payment processing including
 * partial payments, balance calculations, and payment validations
 */

import { PaymentRecord, PaymentBalance, AddPaymentRecordData } from '@/types/dashboard/payment';

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'long') {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(dateObj);
  }
  
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj);
}

/**
 * Calculate net amount after discount and charges
 */
export function calculateNetAmount(
  baseAmount: number,
  discount: number = 0,
  specialCharges: number = 0,
  taxAmount: number = 0
): number {
  return baseAmount + specialCharges + taxAmount - discount;
}

/**
 * Calculate collection rate percentage
 */
export function calculateCollectionRate(totalPaid: number, totalFee: number): number {
  if (totalFee === 0) {
    return totalPaid > 0 ? 100 : 0;
  }
  return Math.min((totalPaid / totalFee) * 100, 100);
}

/**
 * Determine payment status based on paid amount and total fee
 */
export function determinePaymentStatus(
  totalPaid: number,
  totalFee: number
): 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERPAID' {
  if (totalPaid === 0) {
    return 'PENDING';
  }
  
  if (totalPaid >= totalFee) {
    return totalPaid > totalFee ? 'OVERPAID' : 'PAID';
  }
  
  return 'PARTIAL';
}

/**
 * Calculate payment statistics from payment records
 */
export function calculatePaymentStatistics(records: PaymentRecord[]): {
  totalPaid: number;
  averagePayment: number;
  paymentCount: number;
  firstPaymentDate?: Date;
  lastPaymentDate?: Date;
  paymentModes: Record<string, number>;
} {
  if (records.length === 0) {
    return {
      totalPaid: 0,
      averagePayment: 0,
      paymentCount: 0,
      paymentModes: {},
    };
  }

  const totalPaid = records.reduce((sum, record) => sum + record.paidAmount, 0);
  const averagePayment = totalPaid / records.length;

  // Sort by date
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.paidDate).getTime() - new Date(b.paidDate).getTime()
  );

  const firstPaymentDate = sortedRecords[0]?.paidDate;
  const lastPaymentDate = sortedRecords[sortedRecords.length - 1]?.paidDate;

  // Count payment modes
  const paymentModes: Record<string, number> = {};
  records.forEach((record) => {
    const mode = record.paymentMode;
    paymentModes[mode] = (paymentModes[mode] || 0) + 1;
  });

  return {
    totalPaid,
    averagePayment,
    paymentCount: records.length,
    firstPaymentDate,
    lastPaymentDate,
    paymentModes,
  };
}

/**
 * Validate if a payment amount is acceptable
 */
export function isValidPaymentAmount(
  amount: number,
  remainingBalance: number,
  allowOverpayment: boolean = false
): { valid: boolean; message?: string } {
  if (amount <= 0) {
    return {
      valid: false,
      message: 'Payment amount must be greater than zero',
    };
  }

  if (!allowOverpayment && amount > remainingBalance) {
    return {
      valid: false,
      message: `Payment amount exceeds remaining balance of ${formatCurrency(remainingBalance)}`,
    };
  }

  return { valid: true };
}

/**
 * Generate suggested payment amounts based on remaining balance
 */
export function generatePaymentSuggestions(
  remainingBalance: number,
  installmentCount?: number
): number[] {
  if (remainingBalance <= 0) {
    return [];
  }

  const suggestions: number[] = [];

  // Full payment
  suggestions.push(remainingBalance);

  // Half payment
  if (remainingBalance >= 2) {
    suggestions.push(Math.ceil(remainingBalance / 2));
  }

  // Quarter payment
  if (remainingBalance >= 4) {
    suggestions.push(Math.ceil(remainingBalance / 4));
  }

  // Equal installments
  if (installmentCount && installmentCount > 1) {
    const installmentAmount = Math.ceil(remainingBalance / installmentCount);
    if (!suggestions.includes(installmentAmount)) {
      suggestions.push(installmentAmount);
    }
  }

  // Round numbers
  const roundSuggestions = [1000, 5000, 10000, 25000, 50000].filter(
    (amount) => amount <= remainingBalance && !suggestions.includes(amount)
  );

  return [...new Set([...suggestions, ...roundSuggestions])].sort((a, b) => b - a);
}

/**
 * Calculate projected completion date based on payment history
 */
export function calculateProjectedCompletionDate(
  records: PaymentRecord[],
  remainingBalance: number
): Date | null {
  if (records.length < 2 || remainingBalance <= 0) {
    return null;
  }

  // Calculate average payment amount and frequency
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.paidDate).getTime() - new Date(b.paidDate).getTime()
  );

  const totalPaid = records.reduce((sum, record) => sum + record.paidAmount, 0);
  const averagePayment = totalPaid / records.length;

  // Calculate average days between payments
  let totalDays = 0;
  for (let i = 1; i < sortedRecords.length; i++) {
    const days =
      (new Date(sortedRecords[i].paidDate).getTime() -
        new Date(sortedRecords[i - 1].paidDate).getTime()) /
      (1000 * 60 * 60 * 24);
    totalDays += days;
  }
  const averageDaysBetweenPayments = totalDays / (sortedRecords.length - 1);

  // Calculate remaining payments needed
  const remainingPayments = Math.ceil(remainingBalance / averagePayment);

  // Project completion date
  const lastPaymentDate = new Date(sortedRecords[sortedRecords.length - 1].paidDate);
  const projectedDays = remainingPayments * averageDaysBetweenPayments;
  const projectedDate = new Date(lastPaymentDate.getTime() + projectedDays * 24 * 60 * 60 * 1000);

  return projectedDate;
}

/**
 * Group payment records by month
 */
export function groupPaymentsByMonth(
  records: PaymentRecord[]
): Record<string, { payments: PaymentRecord[]; total: number; count: number }> {
  const grouped: Record<string, { payments: PaymentRecord[]; total: number; count: number }> = {};

  records.forEach((record) => {
    const date = new Date(record.paidDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!grouped[monthKey]) {
      grouped[monthKey] = {
        payments: [],
        total: 0,
        count: 0,
      };
    }

    grouped[monthKey].payments.push(record);
    grouped[monthKey].total += record.paidAmount;
    grouped[monthKey].count += 1;
  });

  return grouped;
}

/**
 * Generate payment schedule for remaining balance
 */
export function generatePaymentSchedule(
  remainingBalance: number,
  installmentCount: number,
  startDate: Date = new Date(),
  frequencyInDays: number = 30
): Array<{
  installmentNumber: number;
  dueDate: Date;
  amount: number;
}> {
  if (remainingBalance <= 0 || installmentCount <= 0) {
    return [];
  }

  const schedule: Array<{
    installmentNumber: number;
    dueDate: Date;
    amount: number;
  }> = [];

  const baseAmount = Math.floor(remainingBalance / installmentCount);
  const remainder = remainingBalance - baseAmount * installmentCount;

  for (let i = 0; i < installmentCount; i++) {
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + i * frequencyInDays);

    // Add remainder to last installment
    const amount = i === installmentCount - 1 ? baseAmount + remainder : baseAmount;

    schedule.push({
      installmentNumber: i + 1,
      dueDate,
      amount,
    });
  }

  return schedule;
}

/**
 * Generate sequential invoice number in format INV-yyyymm-0001
 * Note: This is a sync wrapper - for production use, prefer the async version in payment-processing-service.ts
 */
export async function generateInvoiceNumber(prefix: string = 'INV'): Promise<string> {
  const { default: CounterModel } = await import('../../models/payments/Counter');
  
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const yearMonth = `${year}${month}`;
  
  // Get next sequence number for this year-month
  const counterName = `${prefix.toLowerCase()}_${yearMonth}`;
  const sequenceNumber = await CounterModel.getNextSequence(counterName);
  
  // Format: INV-yyyymm-0001
  return `${prefix}-${yearMonth}-${String(sequenceNumber).padStart(4, '0')}`;
}

/**
 * Format payment mode for display
 */
export function formatPaymentMode(mode: string): string {
  const modeMap: Record<string, string> = {
    Cash: '💵 Cash',
    Card: '💳 Card',
    Online: '🌐 Online',
    UPI: '📱 UPI',
    Cheque: '📄 Cheque',
    'Bank Transfer': '🏦 Bank Transfer',
    Others: '📋 Others',
  };
  
  return modeMap[mode] || mode;
}

/**
 * Check if payment is overdue based on expected payment date
 */
export function isPaymentOverdue(expectedDate: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expected = new Date(expectedDate);
  expected.setHours(0, 0, 0, 0);
  
  return expected < today;
}

/**
 * Calculate days overdue
 */
export function calculateDaysOverdue(expectedDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expected = new Date(expectedDate);
  expected.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - expected.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Merge multiple payment records into a summary
 */
export function mergePaymentRecords(records: PaymentRecord[]): {
  totalAmount: number;
  totalDiscount: number;
  totalCharges: number;
  netTotal: number;
  recordCount: number;
  dateRange: { from: Date; to: Date } | null;
} {
  if (records.length === 0) {
    return {
      totalAmount: 0,
      totalDiscount: 0,
      totalCharges: 0,
      netTotal: 0,
      recordCount: 0,
      dateRange: null,
    };
  }

  const totalAmount = records.reduce((sum, r) => sum + r.paidAmount, 0);
  const totalDiscount = records.reduce((sum, r) => sum + (r.discount || 0), 0);
  const totalCharges = records.reduce((sum, r) => sum + (r.specialCharges || 0) + (r.taxAmount || 0), 0);
  const netTotal = totalAmount + totalCharges - totalDiscount;

  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.paidDate).getTime() - new Date(b.paidDate).getTime()
  );

  return {
    totalAmount,
    totalDiscount,
    totalCharges,
    netTotal,
    recordCount: records.length,
    dateRange: {
      from: sortedRecords[0].paidDate,
      to: sortedRecords[sortedRecords.length - 1].paidDate,
    },
  };
}

/**
 * Export payment records to CSV format
 */
export function exportPaymentRecordsToCSV(records: PaymentRecord[]): string {
  const headers = [
    'Date',
    'Student ID',
    'Student Name',
    'Amount',
    'Mode',
    'Transaction ID',
    'Received By',
    'Remarks',
  ];

  const rows = records.map((record) => [
    formatDate(record.paidDate),
    record.studentId,
    record.studentName,
    record.paidAmount.toString(),
    record.paymentMode,
    record.transactionId || '',
    record.receivedBy,
    record.remarks || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}
