// Monthly Subscription Types for UniqBrio Payment System

export interface MonthlySubscription {
  id: string;
  studentId: string;
  courseId: string;
  cohortId: string;
  
  // Subscription Details
  subscriptionType: 'monthly-subscription' | 'monthly-subscription-discounted';
  isFirstPaymentCompleted: boolean;
  startMonth: number;
  currentMonth: number;
  
  // Financial Details
  courseFee: number;
  registrationFee: number;
  originalMonthlyAmount: number;
  discountedMonthlyAmount?: number;
  
  // Discount Commitment (for discounted subscriptions)
  commitmentPeriod?: number; // 3, 6, 9, 12, 24 months
  discountType?: 'percentage' | 'amount';
  discountValue?: number;
  
  // Payment Tracking
  nextDueDate: Date;
  reminderDate: Date;
  lastPaymentDate?: Date;
  
  // Status
  isActive: boolean;
  isPaused: boolean;
  terminationDate?: Date;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlyPayment {
  id: string;
  subscriptionId: string;
  monthNumber: number;
  
  // Payment Details
  amountPaid: number;
  paymentDate: Date;
  dueDate: Date;
  
  // Payment Classification
  isRecurring: true;
  isDiscounted: boolean;
  isFirstPayment: boolean;
  
  // Invoice Details
  invoiceNumber: string;
  invoiceGenerated: boolean;
  
  // Payment Reason/Notes
  paymentReason: string;
  notes?: string;
  
  // Status
  status: 'Pending' | 'Paid' | 'Overdue' | 'Skipped';
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionInvoice {
  id: string;
  subscriptionId: string;
  paymentId: string;
  monthNumber: number;
  
  // Invoice Details
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  
  // Amount Breakdown
  courseFee?: number; // Only for month 1
  registrationFee?: number; // Only for month 1
  monthlyAmount: number;
  discountAmount?: number;
  totalAmount: number;
  
  // Classification
  isFirstMonth: boolean;
  isDiscounted: boolean;
  
  // Status
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionFormData {
  // Student and Course Selection
  studentId?: string;
  courseId: string;
  cohortId: string;
  
  // Subscription Type
  subscriptionType: 'monthly-subscription' | 'monthly-subscription-discounted';
  
  // Financial Fields (Month 1 only)
  courseFee: number;
  registrationFee: number;
  originalMonthlyAmount: number;
  
  // Discount Fields (discounted subscription only)
  commitmentPeriod?: 3 | 6 | 9 | 12 | 24;
  discountType?: 'percentage' | 'amount';
  discountValue?: number;
  discountedMonthlyAmount?: number;
  
  // Payment Details
  paymentMethod: string;
  paymentDate: Date;
  
  // Additional Info
  notes?: string;
}

export interface SubscriptionState {
  // Current Subscription
  currentSubscription: MonthlySubscription | null;
  
  // Payment History
  payments: MonthlyPayment[];
  invoices: SubscriptionInvoice[];
  
  // Form State
  formData: SubscriptionFormData;
  isLoading: boolean;
  error: string | null;
  
  // UI State
  showPaymentDialog: boolean;
  editMode: 'first-payment' | 'recurring-payment';
  
  // Actions
  setCurrentSubscription: (subscription: MonthlySubscription | null) => void;
  updateFormData: (data: Partial<SubscriptionFormData>) => void;
  processFirstPayment: (data: SubscriptionFormData) => Promise<void>;
  processRecurringPayment: (monthlyAmount: number, paymentDate: Date) => Promise<void>;
  calculateDiscountedAmount: (originalAmount: number, discountType: string, discountValue: number) => number;
  calculateTotalForMonth: (monthNumber: number) => number;
  generateMonthlyInvoice: (payment: MonthlyPayment) => Promise<SubscriptionInvoice>;
  getPaymentReason: (monthNumber: number, isDiscounted: boolean, commitmentPeriod?: number) => string;
  calculateNextDueDate: (paymentDate: Date) => Date;
  calculateReminderDate: (dueDate: Date) => Date;
  resetForm: () => void;
}