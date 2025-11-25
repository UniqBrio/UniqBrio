import mongoose from 'mongoose';
import { tenantPlugin } from '@/lib/tenant/tenant-plugin';

const PaymentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, ref: 'Student' },
    studentName: { type: String, required: true },
    studentCategory: { type: String },
    enrolledCourse: { type: String },
    enrolledCourseId: { type: String },
    enrolledCourseName: { type: String },
    cohortId: { type: String },
    cohortName: { type: String },
    courseType: { type: String },
    courseRegistrationFee: { type: Number, required: true, default: 0 },
    studentRegistrationFee: { type: Number, required: true, default: 0 },
    courseFee: { type: Number, required: true, default: 0 },
    receivedAmount: { type: Number, default: 0 },
    outstandingAmount: { type: Number, default: 0 },
    collectionRate: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: ['Pending', 'Partial', 'Completed', 'N/A'],
      default: 'Pending'
    },
    lastPaymentDate: { type: Date },
    nextReminderDate: { type: Date },
    nextDueDate: { type: Date },
    reminderEnabled: { type: Boolean, default: false },
    invoiceUrl: { type: String },
    // New fields for payment tracking
    paymentOption: { type: String, enum: ['One Time', 'One Time With Installments', 'Monthly', 'Monthly With Discounts', 'EMI'], default: 'Monthly' },
    monthlyDueDate: { type: Number, min: 1, max: 31 }, // Day of month (1-31)
    monthlyInstallment: { type: Number, default: 0 },
    startDate: { type: Date }, // Course start date from cohort
    endDate: { type: Date }, // Course end date from cohort
    // Track which registration fees have been paid
    studentRegistrationFeePaid: { type: Boolean, default: false },
    courseRegistrationFeePaid: { type: Boolean, default: false },
    // Enhanced payment plan fields
    planType: { 
      type: String, 
      enum: ['ONE_TIME', 'MONTHLY_SUBSCRIPTION', 'EMI', 'CUSTOM'],
      default: 'MONTHLY_SUBSCRIPTION'
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PARTIAL', 'PAID', 'FULLY_PAID', 'OVERDUE'],
      default: 'PENDING'
    },
    subscriptionStatus: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'CANCELLED', 'COMPLETED'],
    },
    emiSchedule: [{
      emiNumber: { type: Number, required: true },
      dueDate: { type: Date, required: true },
      amount: { type: Number, required: true },
      status: { 
        type: String, 
        enum: ['PENDING', 'PAID', 'OVERDUE'],
        default: 'PENDING'
      },
      paidDate: { type: Date },
      paidAmount: { type: Number },
      transactionId: { type: String },
    }],
    currentEmiIndex: { type: Number, default: 0 },
    // One Time with Installments configuration
    installmentsConfig: {
      totalAmount: { type: Number },
      installmentCount: { type: Number },
      courseDuration: { type: Number },
      installments: [{
        installmentNumber: { type: Number },
        stage: { type: String, enum: ['first', 'middle', 'last'] },
        dueDate: { type: Date },
        reminderDate: { type: Date },
        amount: { type: Number },
        invoiceOnPayment: { type: Boolean },
        stopReminderToggle: { type: Boolean },
        stopAccessToggle: { type: Boolean },
        status: { type: String, enum: ['UNPAID', 'PAID'] },
        paidDate: { type: Date },
        paidAmount: { type: Number },
        transactionId: { type: String },
      }]
    },
    nextPaymentDate: { type: Date },
    totalPaid: { type: Number, default: 0 },
    totalDue: { type: Number, default: 0 },
    // Partial payment reminder fields
    dueAmount: { type: Number, default: 0 },
    remindersCount: { type: Number, default: 0 },
    reminderFrequency: { 
      type: String, 
      enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'NONE'],
      default: 'NONE'
    },
    preReminderEnabled: { type: Boolean, default: false },
    lastReminderSentAt: { type: Date },
    // Ongoing Training - Monthly Subscription fields
    courseCategory: { type: String },
    courseDurationInMonths: { type: Number },
    baseMonthlyAmount: { type: Number },
    isDiscountedPlan: { type: Boolean, default: false },
    discountType: { type: String, enum: ['percentage', 'amount'] },
    discountValue: { type: Number },
    lockInMonths: { type: Number },
    discountedMonthlyAmount: { type: Number },
    totalPayable: { type: Number },
    totalSavings: { type: Number },
  },
  { 
    timestamps: true,
    minimize: false,  // Don't remove empty objects/fields
  }
);

// Indexes for performance
PaymentSchema.index({ studentId: 1 });
PaymentSchema.index({ enrolledCourse: 1 });
PaymentSchema.index({ cohortId: 1 });
PaymentSchema.index({ status: 1 });

// Method to calculate outstanding and collection rate
PaymentSchema.pre('save', function(next) {
  if (this.isModified('receivedAmount') || this.isModified('courseRegistrationFee') || this.isModified('studentRegistrationFee') || this.isModified('courseFee')) {
    // Use courseFee as the total amount (registration fees are separate/optional)
    const totalFees = this.courseFee || 0;
    
    this.outstandingAmount = Math.max(0, totalFees - this.receivedAmount);
    
    // Special case: If no fees are set but payment received, consider it 100% collected
    this.collectionRate = totalFees > 0 
      ? (this.receivedAmount / totalFees) * 100 
      : (this.receivedAmount > 0 ? 100 : 0);
    
    // Update status based on collection rate
    if (totalFees === 0 && this.receivedAmount === 0) {
      this.status = 'N/A';
    } else if (this.collectionRate >= 100) {
      this.status = 'Completed';
    } else if (this.collectionRate > 0) {
      this.status = 'Partial';
    } else {
      this.status = 'Pending';
    }
  }
  next();
});

// Apply tenant plugin for multi-tenant isolation
PaymentSchema.plugin(tenantPlugin);

// Use the existing model if it exists (Next.js hot reload), otherwise create new
// Explicitly specify collection name as 'payments'
const PaymentModel = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema, 'payments');

// Log collection name for debugging
console.log('Payment Model - Collection Name:', PaymentModel.collection.name);

export default PaymentModel;
