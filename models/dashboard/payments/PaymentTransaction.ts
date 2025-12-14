import mongoose from 'mongoose';
import { tenantPlugin } from '@/lib/tenant/tenant-plugin';

/**
 * PaymentTransaction Schema - Comprehensive payment tracking system
 * Stores individual payment entries for all payment types including subscriptions
 * Used for invoice generation, balance calculations, payment history tracking, and monthly subscriptions
 * 
 * This is the unified payment transaction model that replaces the legacy PaymentTransaction
 * with enhanced functionality including subscription support, audit trails, and invoice integration
 */
const PaymentRecordSchema = new mongoose.Schema(
  {
    // Reference to the main payment document
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
    },
    
    // Reference to monthly subscription (if applicable)
    monthlySubscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MonthlySubscription',
      index: true,
    },
    
    // Student information (denormalized for faster queries)
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
    
    // Enrollment/Course reference
    enrollmentId: {
      type: String,
      index: true,
    },
    
    courseId: {
      type: String,
      index: true,
    },
    
    courseName: {
      type: String,
    },
    
    cohortId: {
      type: String,
      index: true,
    },
    
    // Payment details
    paidAmount: {
      type: Number,
      required: true,
      min: [0.01, 'Payment amount must be greater than zero'],
    },
    
    paidDate: {
      type: Date,
      required: true,
      index: true,
    },
    
    paymentMode: {
      type: String,
      required: true,
      enum: ['Cash', 'Card', 'Online', 'UPI', 'Cheque', 'Bank Transfer', 'Others'],
      default: 'Cash',
    },
    
    // Transaction tracking
    transactionId: {
      type: String,
      trim: true,
      index: true,
    },
    
    referenceId: {
      type: String,
      trim: true,
    },
    
    // Additional payment information
    remarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters'],
    },
    
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    
    // Payer information
    payerType: {
      type: String,
      enum: ['student', 'parent', 'guardian', 'sponsor', 'other'],
      default: 'student',
    },
    
    payerName: {
      type: String,
      trim: true,
    },
    
    // Payment context
    paymentOption: {
      type: String,
      enum: ['One Time', 'One Time With Installments', 'Monthly', 'Monthly With Discounts', 'EMI'],
      default: 'One Time',
    },
    
    paymentSubType: {
      type: String,
      enum: [
        'Full Payment',
        'Partial Payment',
        'Summer Camp',
        'Workshops',
        'Short Term Programs',
        'Registration Fee',
        'Course Fee',
        'Installment',
        'EMI',
        'Monthly Subscription - First Payment',
        'Monthly Subscription - Recurring Payment',
        'Monthly Subscription - Discounted Payment',
        'Other',
      ],
    },
    
    // For installment/EMI tracking
    installmentNumber: {
      type: Number,
      min: 1,
    },
    
    emiNumber: {
      type: Number,
      min: 1,
    },
    
    // For monthly subscription tracking
    subscriptionMonth: {
      type: Number,
      min: 1,
    },
    
    isRecurringPayment: {
      type: Boolean,
      default: false,
    },
    
    isDiscountedPayment: {
      type: Boolean,
      default: false,
    },
    
    isFirstSubscriptionPayment: {
      type: Boolean,
      default: false,
    },
    
    // Financial breakdown
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    specialCharges: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    netAmount: {
      type: Number,
      min: 0,
    },
    
    // Payment processing
    receivedBy: {
      type: String,
      required: true,
      trim: true,
    },
    
    processedBy: {
      type: String,
      trim: true,
    },
    
    paymentTime: {
      type: String,
    },
    
    // Documentation
    attachments: [
      {
        url: String,
        filename: String,
        type: String,
        uploadedAt: Date,
      },
    ],
    
    // Invoice generation
    invoiceNumber: {
      type: String,
      sparse: true,
      validate: {
        validator: function(v: string) {
          // Don't allow empty strings - use null/undefined instead
          return v === null || v === undefined || (typeof v === 'string' && v.trim().length > 0);
        },
        message: 'Invoice number cannot be an empty string'
      }
    },
    
    invoiceUrl: {
      type: String,
    },
    
    invoiceGenerated: {
      type: Boolean,
      default: false,
    },
    
    invoiceGeneratedAt: {
      type: Date,
    },
    
    // Receipt tracking
    receiptNumber: {
      type: String,
      sparse: true,
    },
    
    receiptUrl: {
      type: String,
    },
    
    // Status tracking
    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'CONFIRMED', 'CANCELLED', 'REFUNDED'],
      default: 'CONFIRMED',
    },
    
    verifiedBy: {
      type: String,
    },
    
    verifiedAt: {
      type: Date,
    },
    
    // Reconciliation
    reconciledWith: {
      type: String,
    },
    
    reconciliationDate: {
      type: Date,
    },
    
    isReconciled: {
      type: Boolean,
      default: false,
    },
    
    // Notification tracking
    notificationSent: {
      type: Boolean,
      default: false,
    },
    
    notificationSentAt: {
      type: Date,
    },
    
    emailSent: {
      type: Boolean,
      default: false,
    },
    
    emailSentAt: {
      type: Date,
    },
    
    // Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      // Index removed - using compound index (isDeleted, createdAt) instead
    },
    
    deletedAt: {
      type: Date,
    },
    
    deletedBy: {
      type: String,
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

// Compound indexes for performance
// Apply tenant plugin
PaymentRecordSchema.plugin(tenantPlugin);

// Compound indexes for multi-tenant uniqueness
PaymentRecordSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true, sparse: true });
PaymentRecordSchema.index({ tenantId: 1, receiptNumber: 1 }, { unique: true, sparse: true });

PaymentRecordSchema.index({ paymentId: 1, paidDate: -1 });
PaymentRecordSchema.index({ studentId: 1, paidDate: -1 });
PaymentRecordSchema.index({ enrollmentId: 1, paidDate: -1 });
PaymentRecordSchema.index({ courseId: 1, paidDate: -1 });
PaymentRecordSchema.index({ transactionId: 1, isDeleted: 1 });
PaymentRecordSchema.index({ isDeleted: 1, createdAt: -1 });

// Pre-save middleware to calculate net amount
PaymentRecordSchema.pre('save', function (next) {
  if (this.isModified('paidAmount') || this.isModified('discount') || this.isModified('specialCharges') || this.isModified('taxAmount')) {
    this.netAmount =
      this.paidAmount +
      (this.specialCharges || 0) +
      (this.taxAmount || 0) -
      (this.discount || 0);
  }
  next();
});

// Virtual for formatted date
PaymentRecordSchema.virtual('paidDateFormatted').get(function () {
  return this.paidDate ? this.paidDate.toISOString().split('T')[0] : '';
});

// Method to generate receipt number
PaymentRecordSchema.methods.generateReceiptNumber = async function () {
  if (!this.receiptNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    this.receiptNumber = `RCP-${year}${month}${day}-${random}`;
  }
  return this.receiptNumber;
};

// Method to generate invoice number using sequential format
PaymentRecordSchema.methods.generateInvoiceNumber = async function () {
  if (!this.invoiceNumber) {
    const { default: CounterModel } = await import('./Counter');
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}${month}`;
    
    // Get next sequence number for this year-month
    const counterName = `invoice_${yearMonth}`;
    const sequenceNumber = await CounterModel.getNextSequence(counterName);
    
    // Format: INV-yyyymm-0001
    this.invoiceNumber = `INV-${yearMonth}-${String(sequenceNumber).padStart(4, '0')}`;
  }
  return this.invoiceNumber;
};

// Static method to get payment history for a payment
PaymentRecordSchema.statics.getPaymentHistory = async function (
  paymentId: string,
  options?: { sortBy?: string; sortOrder?: number; limit?: number }
) {
  const query = this.find({
    paymentId: new mongoose.Types.ObjectId(paymentId),
    isDeleted: false,
  });

  const sortBy = options?.sortBy || 'paidDate';
  const sortOrder = options?.sortOrder || -1; // DESC by default

  query.sort({ [sortBy]: sortOrder });

  if (options?.limit) {
    query.limit(options.limit);
  }

  return query.exec();
};

// Static method to calculate total paid for a payment
PaymentRecordSchema.statics.calculateTotalPaid = async function (paymentId: string) {
  const result = await this.aggregate([
    {
      $match: {
        paymentId: new mongoose.Types.ObjectId(paymentId),
        isDeleted: false,
        status: { $in: ['VERIFIED', 'CONFIRMED'] },
      },
    },
    {
      $group: {
        _id: null,
        totalPaid: { $sum: '$paidAmount' },
        count: { $sum: 1 },
      },
    },
  ]);

  return result.length > 0 ? result[0] : { totalPaid: 0, count: 0 };
};

// Static method to get payment summary by student
PaymentRecordSchema.statics.getStudentPaymentSummary = async function (studentId: string) {
  return this.aggregate([
    {
      $match: {
        studentId,
        isDeleted: false,
        status: { $in: ['VERIFIED', 'CONFIRMED'] },
      },
    },
    {
      $group: {
        _id: '$paymentId',
        totalPaid: { $sum: '$paidAmount' },
        paymentCount: { $sum: 1 },
        lastPaymentDate: { $max: '$paidDate' },
        paymentModes: { $addToSet: '$paymentMode' },
      },
    },
    {
      $sort: { lastPaymentDate: -1 },
    },
  ]);
};

// Delete cached model to ensure schema updates are picked up
if (mongoose.models.PaymentTransaction) {
  delete mongoose.models.PaymentTransaction;
}

// Use the standard 'paymenttransactions' collection name for consistency
const PaymentTransactionModel = mongoose.model('PaymentTransaction', PaymentRecordSchema, 'paymenttransactions');

export default PaymentTransactionModel;
