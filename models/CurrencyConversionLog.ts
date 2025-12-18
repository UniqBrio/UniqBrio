import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IConversionStatistics {
  coursesUpdated: number;
  paymentsUpdated: number;
  productsUpdated: number;
  subscriptionsUpdated: number;
  schedulesUpdated: number;
  notificationsUpdated: number;
  incomesUpdated: number;
  expensesUpdated: number;
  totalRecordsUpdated: number;
}

export interface ICurrencyConversionLog extends Document {
  tenantId: string;
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
  convertedBy: string; // User email or ID
  convertedById: string; // User ID
  role: string;
  timestamp: Date;
  statistics: IConversionStatistics;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const currencyConversionLogSchema = new Schema<ICurrencyConversionLog>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
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
    convertedBy: {
      type: String,
      required: true,
    },
    convertedById: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    statistics: {
      coursesUpdated: { type: Number, default: 0 },
      paymentsUpdated: { type: Number, default: 0 },
      productsUpdated: { type: Number, default: 0 },
      subscriptionsUpdated: { type: Number, default: 0 },
      schedulesUpdated: { type: Number, default: 0 },
      notificationsUpdated: { type: Number, default: 0 },
      incomesUpdated: { type: Number, default: 0 },
      expensesUpdated: { type: Number, default: 0 },
      totalRecordsUpdated: { type: Number, default: 0 },
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'PARTIAL'],
      default: 'SUCCESS',
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'currencyconversionlogs',
  }
);

// Indexes for efficient querying
currencyConversionLogSchema.index({ tenantId: 1, timestamp: -1 });
currencyConversionLogSchema.index({ convertedById: 1 });
currencyConversionLogSchema.index({ status: 1 });

const CurrencyConversionLogModel: Model<ICurrencyConversionLog> =
  mongoose.models.CurrencyConversionLog ||
  mongoose.model<ICurrencyConversionLog>(
    'CurrencyConversionLog',
    currencyConversionLogSchema,
    'currencyconversionlogs'
  );

export default CurrencyConversionLogModel;
