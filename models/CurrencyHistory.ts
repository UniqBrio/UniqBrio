import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ICurrencyHistory extends Document {
  tenantId: string;
  conversionId: mongoose.Types.ObjectId; // Reference to CurrencyConversionLog
  entityType: 'Course' | 'Payment' | 'Product' | 'MonthlySubscription' | 'Schedule' | 'Notification' | 'Income' | 'Expense';
  entityId: mongoose.Types.ObjectId;
  originalValues: Record<string, number>; // e.g., { price: 1000, courseFee: 5000 }
  convertedValues: Record<string, number>; // e.g., { price: 12, courseFee: 60 }
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const currencyHistorySchema = new Schema<ICurrencyHistory>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    conversionId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'CurrencyConversionLog',
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: ['Course', 'Payment', 'Product', 'MonthlySubscription', 'Schedule', 'Notification', 'Income', 'Expense'],
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    originalValues: {
      type: Schema.Types.Mixed,
      required: true,
    },
    convertedValues: {
      type: Schema.Types.Mixed,
      required: true,
    },
    fromCurrency: {
      type: String,
      required: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    toCurrency: {
      type: String,
      required: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    exchangeRate: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'currencyhistories',
  }
);

// Composite indexes for efficient querying
currencyHistorySchema.index({ tenantId: 1, conversionId: 1 });
currencyHistorySchema.index({ tenantId: 1, entityType: 1, entityId: 1 });
currencyHistorySchema.index({ timestamp: -1 });

const CurrencyHistoryModel: Model<ICurrencyHistory> =
  mongoose.models.CurrencyHistory ||
  mongoose.model<ICurrencyHistory>(
    'CurrencyHistory',
    currencyHistorySchema,
    'currencyhistories'
  );

export default CurrencyHistoryModel;
