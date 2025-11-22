export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  studentCategory: string;
  enrolledCourse: string;
  enrolledCourseId?: string;
  enrolledCourseName: string;
  cohortId: string;
  cohortName: string;
  courseType: string;
  courseRegistrationFee: number;
  studentRegistrationFee: number;
  courseFee: number;
  receivedAmount: number;
  outstandingAmount: number;
  collectionRate: number;
  status: 'Pending' | 'Partial' | 'Paid' | 'N/A';
  lastPaymentDate?: string;
  nextReminderDate?: string;
  nextDueDate?: string;
  reminderEnabled?: boolean;
  invoiceUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  startDate?: string;
  endDate?: string;
  paymentOption?: 'One Time' | 'One Time With Installments' | 'Monthly' | 'Monthly With Discounts' | 'EMI';
  monthlyDueDate?: number;
  monthlyInstallment?: number;
  studentRegistrationFeePaid?: boolean;
  courseRegistrationFeePaid?: boolean;
  // New fields for enhanced payment plans
  planType?: 'ONE_TIME' | 'MONTHLY_SUBSCRIPTION' | 'EMI' | 'CUSTOM' | 'ONE_TIME_WITH_INSTALLMENTS';
  paymentStatus?: 'PENDING' | 'PARTIAL' | 'PAID' | 'FULLY_PAID' | 'OVERDUE';
  subscriptionStatus?: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'COMPLETED';
  emiSchedule?: EmiScheduleItem[];
  installments?: OneTimeInstallment[];
  installmentsConfig?: OneTimeInstallmentsConfig;
  currentEmiIndex?: number;
  currentInstallmentIndex?: number;
  nextPaymentDate?: string;
  totalPaid?: number;
  totalDue?: number;
  // Reminder tracking fields
  remindersCount?: number;
  lastReminderSentAt?: string;
  reminderFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'NONE';
  preReminderEnabled?: boolean;
  dueAmount?: number;
  // One Time with Installments specific
  autoStopOnFullPayment?: boolean;
  partialPaymentAllowed?: boolean;
  // Ongoing Training - Monthly Subscription fields
  courseCategory?: string;
  courseDurationInMonths?: number;
  baseMonthlyAmount?: number;
  isDiscountedPlan?: boolean;
  discountType?: 'percentage' | 'amount';
  discountValue?: number;
  lockInMonths?: number;
  discountedMonthlyAmount?: number;
  totalPayable?: number;
  totalSavings?: number;
}

export interface EmiScheduleItem {
  emiNumber: number;
  dueDate: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidDate?: string;
  paidAmount?: number;
  transactionId?: string;
}

export type InstallmentStage = 'first' | 'middle' | 'last';
export type InstallmentStatus = 'UNPAID' | 'PAID';
export type MessageTemplate = 'default' | 'custom';

export interface OneTimeInstallment {
  installmentNumber: number;
  stage: InstallmentStage;
  dueDate: Date;
  reminderDate: Date;
  reminderDaysBefore: number;
  amount: number;
  invoiceOnPayment: boolean;
  finalInvoice: boolean;
  stopReminderToggle: boolean;
  stopAccessToggle: boolean;
  status: InstallmentStatus;
  messageTemplate: MessageTemplate;
  customMessage?: string;
  paidDate?: Date;
  paidAmount?: number;
  transactionId?: string;
}

export interface OneTimeInstallmentsConfig {
  paymentType: 'ONE_TIME_WITH_INSTALLMENTS';
  installments: OneTimeInstallment[];
  autoStopOnFullPayment: boolean;
  partialPaymentAllowed: boolean;
  totalAmount: number;
  courseDuration: {
    startDate: Date;
    endDate: Date;
    durationInDays: number;
  };
}

export interface InstallmentRules {
  first: {
    reminderDaysBefore: number;
    invoiceOnPayment: boolean;
    finalInvoice: boolean;
    stopReminderToggle: boolean;
    stopAccessToggle: boolean;
    messageTemplate: MessageTemplate;
  };
  middle: {
    reminderDaysBefore: number;
    invoiceOnPayment: boolean;
    finalInvoice: boolean;
    stopReminderToggle: boolean;
    stopAccessToggle: boolean;
    messageTemplate: MessageTemplate;
  };
  last: {
    reminderDaysBefore: number;
    invoiceOnPayment: boolean;
    finalInvoice: boolean;
    stopReminderToggle: boolean;
    stopAccessToggle: boolean;
    messageTemplate: MessageTemplate;
  };
}

/**
 * Enhanced PaymentRecord interface for one-time payment tracking
 * Supports partial payments, EMI installments, and comprehensive payment history
 */
export interface PaymentRecord {
  _id?: string;
  
  // References
  paymentId: string;
  studentId: string;
  studentName: string;
  enrollmentId?: string;
  courseId?: string;
  courseName?: string;
  cohortId?: string;
  
  // Payment details
  paidAmount: number;
  paidDate: Date;
  paymentMode: 'Cash' | 'Card' | 'Online' | 'UPI' | 'Cheque' | 'Bank Transfer' | 'Others';
  
  // Transaction tracking
  transactionId?: string;
  referenceId?: string;
  
  // Additional information
  remarks?: string;
  notes?: string;
  
  // Payer information
  payerType?: 'student' | 'parent' | 'guardian' | 'sponsor' | 'other';
  payerName?: string;
  
  // Payment context
  paymentOption?: 'One Time' | 'One Time With Installments' | 'Monthly' | 'Monthly With Discounts' | 'EMI';
  paymentSubType?: 'Full Payment' | 'Partial Payment' | 'Summer Camp' | 'Workshops' | 
                    'Short Term Programs' | 'Registration Fee' | 'Course Fee' | 
                    'Installment' | 'EMI' | 'Other';
  
  // For installment/EMI tracking
  installmentNumber?: number;
  emiNumber?: number;
  
  // Financial breakdown
  discount?: number;
  specialCharges?: number;
  taxAmount?: number;
  netAmount?: number;
  
  // Payment processing
  receivedBy: string;
  processedBy?: string;
  paymentTime?: string;
  
  // Documentation
  attachments?: Array<{
    url: string;
    filename: string;
    type: string;
    uploadedAt: Date;
  }>;
  
  // Invoice & Receipt
  invoiceNumber?: string;
  invoiceUrl?: string;
  invoiceGenerated?: boolean;
  invoiceGeneratedAt?: Date;
  receiptNumber?: string;
  receiptUrl?: string;
  
  // Status tracking
  status?: 'PENDING' | 'VERIFIED' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
  verifiedBy?: string;
  verifiedAt?: Date;
  
  // Reconciliation
  reconciledWith?: string;
  reconciliationDate?: Date;
  isReconciled?: boolean;
  
  // Notification tracking
  notificationSent?: boolean;
  notificationSentAt?: Date;
  emailSent?: boolean;
  emailSentAt?: Date;
  
  // Metadata
  metadata?: Record<string, any>;
  
  // Soft delete
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Payment balance calculation result
 */
export interface PaymentBalance {
  totalFee: number;
  totalPaid: number;
  remainingAmount: number;
  paymentCount: number;
  collectionRate: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERPAID';
  lastPaymentDate?: Date;
}

/**
 * Invoice breakdown with payment history
 */
export interface InvoiceBreakdown {
  studentId: string;
  studentName: string;
  courseId?: string;
  courseName?: string;
  cohortId?: string;
  cohortName?: string;
  
  // Fee structure
  baseFee: number;
  discount: number;
  specialCharges: number;
  taxAmount: number;
  totalFee: number;
  
  // Payment history
  payments: Array<{
    date: Date;
    amount: number;
    mode: string;
    transactionId?: string;
    receiptNumber?: string;
    invoiceNumber?: string;
    remarks?: string;
  }>;
  
  // Summary
  totalPaid: number;
  outstandingBalance: number;
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERPAID';
  
  // Metadata
  generatedAt: Date;
  invoiceNumber?: string;
}

/**
 * Payment validation result
 */
export interface PaymentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Data for adding a new payment record
 */
export interface AddPaymentRecordData {
  paymentId: string;
  studentId: string;
  studentName: string;
  enrollmentId?: string;
  courseId?: string;
  courseName?: string;
  cohortId?: string;
  paidAmount: number;
  paidDate: Date;
  paymentMode: 'Cash' | 'Card' | 'Online' | 'UPI' | 'Cheque' | 'Bank Transfer' | 'Others';
  transactionId?: string;
  referenceId?: string;
  remarks?: string;
  notes?: string;
  payerType?: 'student' | 'parent' | 'guardian' | 'sponsor' | 'other';
  payerName?: string;
  paymentOption?: string;
  paymentSubType?: string;
  installmentNumber?: number;
  emiNumber?: number;
  discount?: number;
  specialCharges?: number;
  taxAmount?: number;
  receivedBy: string;
  processedBy?: string;
  paymentTime?: string;
  attachments?: Array<{
    url: string;
    filename: string;
    type: string;
  }>;
  metadata?: Record<string, any>;
}

export interface SubscriptionDetails {
  planType: 'MONTHLY_SUBSCRIPTION';
  startDate: Date;
  endDate?: Date;
  monthlyAmount: number;
  nextPaymentDate: Date;
  totalMonths?: number;
  paidMonths: number;
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'COMPLETED';
}

export interface ReminderSettings {
  enabled: boolean;
  nextReminderDate?: Date;
  remindersSent?: number;
  lastReminderDate?: Date;
  reminderFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export interface CoursePaymentSummary {
  courseId: string;
  courseName: string;
  totalStudents: number;
  totalAmount: number;
  receivedAmount: number;
  outstandingAmount: number;
  collectionRate: number;
  status: 'Pending' | 'Partial' | 'Paid';
  cohorts: CohortPaymentBreakdown[];
  totalCourseFees?: number;
  totalCourseRegistrationFees?: number;
  totalStudentRegistrationFees?: number;
  totalToBePaid?: number;
}

export interface CohortPaymentBreakdown {
  cohortId: string;
  cohortName: string;
  totalStudents: number;
  totalAmount: number;
  receivedAmount: number;
  outstandingAmount: number;
  collectionRate: number;
  totalCourseFees?: number;
  totalCourseRegistrationFees?: number;
  totalStudentRegistrationFees?: number;
  totalToBePaid?: number;
}

export interface PaymentAnalytics {
  totalCourses: number;
  totalStudents: number;
  totalReceived: number;
  totalOutstanding: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  revenueBySource: RevenueBySource[];
  paymentCompletionDistribution: PaymentCompletionDistribution;
  paymentMethodDistribution: { [key: string]: number };
  monthlyTrend: MonthlyTrend[];
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
}

export interface RevenueBySource {
  courseId: string;
  courseName: string;
  amount: number;
}

export interface PaymentCategoryDetails {
  count: number;
  totalToBePaid: number;
  courseFees: number;
  courseRegFees: number;
  studentRegFees: number;
  totalPaid: number;
}

export interface PaymentCompletionDistribution {
  oneTime: PaymentCategoryDetails;
  oneTimeWithInstallments: PaymentCategoryDetails;
  monthly: PaymentCategoryDetails;
  monthlyWithDiscounts: PaymentCategoryDetails;
  emi: PaymentCategoryDetails;
  other: PaymentCategoryDetails;
}
