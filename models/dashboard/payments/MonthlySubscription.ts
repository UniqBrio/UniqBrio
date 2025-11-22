import mongoose from 'mongoose';

/**
 * MonthlySubscription Schema - Manages recurring monthly subscription payments
 * Tracks subscription lifecycle, discount periods, and recurring payment scheduling
 */
const MonthlySubscriptionSchema = new mongoose.Schema(
  {
    // Student and enrollment references
    studentId: {
      type: String,
      required: true,
      ref: 'Student',
      index: true,
    },
    
    studentName: {
      type: String,
      required: true,
    },
    
    enrollmentId: {
      type: String,
      index: true,
    },
    
    courseId: {
      type: String,
      required: true,
      index: true,
    },
    
    courseName: {
      type: String,
      required: true,
    },
    
    cohortId: {
      type: String,
      required: true,
      index: true,
    },
    
    cohortName: {
      type: String,
    },
    
    // Subscription details
    subscriptionType: {
      type: String,
      enum: ['monthly-subscription', 'monthly-subscription-discounted'],
      required: true,
    },
    
    // Financial configuration
    courseFee: {
      type: Number,
      required: true,
      min: 0,
    },
    
    registrationFee: {
      type: Number,
      required: true,
      min: 0,
    },
    
    originalMonthlyAmount: {
      type: Number,
      required: true,
      min: [0.01, 'Monthly amount must be greater than zero'],
    },
    
    discountedMonthlyAmount: {
      type: Number,
      min: 0,
    },
    
    // Discount configuration (for discounted subscriptions only)
    discountType: {
      type: String,
      enum: ['percentage', 'amount'],
    },
    
    discountValue: {
      type: Number,
      min: 0,
    },
    
    commitmentPeriod: {
      type: Number,
      enum: [3, 6, 9, 12, 24],
      validate: {
        validator: function(this: any, value: number) {
          // Commitment period required for discounted subscriptions
          if (this.subscriptionType === 'monthly-subscription-discounted') {
            return value != null && [3, 6, 9, 12, 24].includes(value);
          }
          return true;
        },
        message: 'Commitment period is required for discounted subscriptions'
      }
    },
    
    // Subscription lifecycle tracking
    isFirstPaymentCompleted: {
      type: Boolean,
      default: false,
    },
    
    startMonth: {
      type: Number,
      required: true,
      min: 1,
    },
    
    currentMonth: {
      type: Number,
      required: true,
      min: 1,
    },
    
    totalExpectedMonths: {
      type: Number,
      min: 1,
    },
    
    // Payment scheduling
    nextDueDate: {
      type: Date,
      required: true,
      index: true,
    },
    
    reminderDate: {
      type: Date,
      required: true,
      index: true,
    },
    
    lastPaymentDate: {
      type: Date,
    },
    
    // Status tracking
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED'],
      default: 'ACTIVE',
      index: true,
    },
    
    // Payment history references
    paymentRecords: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentRecord',
    }],
    
    // Financial summary
    totalPaidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    totalExpectedAmount: {
      type: Number,
      min: 0,
    },
    
    remainingAmount: {
      type: Number,
      min: 0,
    },
    
    // Metadata
    createdBy: {
      type: String,
      required: true,
    },
    
    lastUpdatedBy: {
      type: String,
    },
    
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    
    // Audit trail
    auditLog: [{
      action: {
        type: String,
        enum: ['CREATED', 'PAYMENT_PROCESSED', 'STATUS_CHANGED', 'DISCOUNT_APPLIED', 'PAUSED', 'RESUMED', 'CANCELLED'],
        required: true,
      },
      performedBy: {
        type: String,
        required: true,
      },
      performedAt: {
        type: Date,
        default: Date.now,
      },
      details: {
        type: mongoose.Schema.Types.Mixed,
      },
      notes: String,
    }],
  },
  {
    timestamps: true,
    collection: 'monthlysubscriptions',
  }
);

// Indexes for efficient querying
MonthlySubscriptionSchema.index({ studentId: 1, status: 1 });
MonthlySubscriptionSchema.index({ nextDueDate: 1, status: 1 });
MonthlySubscriptionSchema.index({ reminderDate: 1, status: 1 });
MonthlySubscriptionSchema.index({ courseId: 1, cohortId: 1 });
MonthlySubscriptionSchema.index({ subscriptionType: 1, status: 1 });

// Virtual for calculating current discount eligibility
MonthlySubscriptionSchema.virtual('isCurrentlyDiscounted').get(function(this: any) {
  if (this.subscriptionType !== 'monthly-subscription-discounted') {
    return false;
  }
  
  if (!this.commitmentPeriod) {
    return false;
  }
  
  return this.currentMonth <= this.commitmentPeriod;
});

// Virtual for current month payment amount
MonthlySubscriptionSchema.virtual('currentMonthAmount').get(function(this: any) {
  if (this.subscriptionType === 'monthly-subscription-discounted' && this.isCurrentlyDiscounted) {
    return this.discountedMonthlyAmount || this.originalMonthlyAmount;
  }
  return this.originalMonthlyAmount;
});

// Method to add payment record
MonthlySubscriptionSchema.methods.addPaymentRecord = function(this: any, paymentRecordId: mongoose.Types.ObjectId, amount: number) {
  this.paymentRecords.push(paymentRecordId);
  this.totalPaidAmount += amount;
  this.lastPaymentDate = new Date();
  
  // Update current month
  this.currentMonth += 1;
  
  // Mark first payment as completed if this is month 1
  if (this.currentMonth === 2 && !this.isFirstPaymentCompleted) {
    this.isFirstPaymentCompleted = true;
  }
  
  // Calculate remaining amount
  if (this.totalExpectedAmount) {
    this.remainingAmount = Math.max(0, this.totalExpectedAmount - this.totalPaidAmount);
  }
  
  return this.save();
};

// Method to calculate next due date
MonthlySubscriptionSchema.methods.calculateNextDueDate = function(this: any) {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return nextMonth;
};

// Method to calculate reminder date (5 days before due date)
MonthlySubscriptionSchema.methods.calculateReminderDate = function(this: any) {
  const dueDate = this.calculateNextDueDate();
  const reminderDate = new Date(dueDate);
  reminderDate.setDate(dueDate.getDate() - 5);
  return reminderDate;
};

// Method to add audit log entry
MonthlySubscriptionSchema.methods.addAuditLog = function(this: any, action: string, performedBy: string, details?: any, notes?: string) {
  this.auditLog.push({
    action,
    performedBy,
    details,
    notes,
    performedAt: new Date(),
  });
  return this.save();
};

// Pre-save middleware for validation
MonthlySubscriptionSchema.pre('save', function(this: any, next) {
  // Validate discount configuration for discounted subscriptions
  if (this.subscriptionType === 'monthly-subscription-discounted') {
    if (!this.discountType || !this.discountValue || !this.commitmentPeriod) {
      return next(new Error('Discount type, value, and commitment period are required for discounted subscriptions'));
    }
    
    if (this.discountType === 'percentage' && (this.discountValue <= 0 || this.discountValue >= 100)) {
      return next(new Error('Percentage discount must be between 0 and 100'));
    }
    
    if (this.discountType === 'amount' && this.discountValue >= this.originalMonthlyAmount) {
      return next(new Error('Discount amount cannot be greater than or equal to monthly amount'));
    }
  }
  
  // Update next due and reminder dates
  if (this.isModified('currentMonth') || this.isModified('lastPaymentDate')) {
    this.nextDueDate = this.calculateNextDueDate();
    this.reminderDate = this.calculateReminderDate();
  }
  
  next();
});

// Export the model
const MonthlySubscription = mongoose.models.MonthlySubscription || 
  mongoose.model('MonthlySubscription', MonthlySubscriptionSchema);

export default MonthlySubscription;

// Type definitions for TypeScript
export interface IMonthlySubscription extends mongoose.Document {
  studentId: string;
  studentName: string;
  enrollmentId?: string;
  courseId: string;
  courseName: string;
  cohortId: string;
  cohortName?: string;
  subscriptionType: 'monthly-subscription' | 'monthly-subscription-discounted';
  courseFee: number;
  registrationFee: number;
  originalMonthlyAmount: number;
  discountedMonthlyAmount?: number;
  discountType?: 'percentage' | 'amount';
  discountValue?: number;
  commitmentPeriod?: 3 | 6 | 9 | 12 | 24;
  isFirstPaymentCompleted: boolean;
  startMonth: number;
  currentMonth: number;
  totalExpectedMonths?: number;
  nextDueDate: Date;
  reminderDate: Date;
  lastPaymentDate?: Date;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'COMPLETED';
  paymentRecords: mongoose.Types.ObjectId[];
  totalPaidAmount: number;
  totalExpectedAmount?: number;
  remainingAmount?: number;
  createdBy: string;
  lastUpdatedBy?: string;
  notes?: string;
  auditLog: Array<{
    action: string;
    performedBy: string;
    performedAt: Date;
    details?: any;
    notes?: string;
  }>;
  isCurrentlyDiscounted: boolean;
  currentMonthAmount: number;
  addPaymentRecord(paymentRecordId: mongoose.Types.ObjectId, amount: number): Promise<IMonthlySubscription>;
  calculateNextDueDate(): Date;
  calculateReminderDate(): Date;
  addAuditLog(action: string, performedBy: string, details?: any, notes?: string): Promise<IMonthlySubscription>;
}