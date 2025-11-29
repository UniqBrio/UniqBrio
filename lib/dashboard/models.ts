import mongoose, { Schema, model, models } from "mongoose";
import { tenantPlugin } from "@/lib/tenant/tenant-plugin";

// Shared/minimal user reference
const ObjectId = Schema.Types.ObjectId;

// Income - Simplified to match frontend form fields only
const IncomeSchema = new Schema(
  {
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    incomeCategory: { type: String, required: true },
    sourceType: { type: String },
    paymentMode: { type: String },
    addToAccount: { type: String },
    receivedBy: { type: String },
    receivedFrom: { type: String },
    receiptNumber: { type: String },
    // Note: attachments are handled separately via file uploads, not stored in MongoDB
    __hash: { type: String, index: true, sparse: true },
  },
  { timestamps: true }
);

// Apply tenant plugin for multi-tenancy
IncomeSchema.plugin(tenantPlugin);

// Expense - Simplified to match frontend form fields only
const ExpenseSchema = new Schema(
  {
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    expenseCategory: { type: String, required: true },
    vendorName: { type: String },
    vendorType: { type: String },
    paymentMode: { type: String },
    addFromAccount: { type: String },
    receivedBy: { type: String },
    receivedFrom: { type: String },
    receiptNumber: { type: String },
    // Note: attachments are handled separately via file uploads, not stored in MongoDB
    __hash: { type: String, index: true, sparse: true },
  },
  { timestamps: true }
);

// Apply tenant plugin for multi-tenancy
ExpenseSchema.plugin(tenantPlugin);

// Bank Account
const BankAccountSchema = new Schema(
  {
    holderName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    accountType: { type: String, required: true },
    bankName: { type: String, required: true },
    ifsc: { type: String, required: true },
    branch: { type: String, required: true },
    micr: { type: String },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Apply tenant plugin for multi-tenancy
BankAccountSchema.plugin(tenantPlugin);

export const IncomeModel = models.incomes || model("incomes", IncomeSchema);
export const ExpenseModel = models.expenses || model("expenses", ExpenseSchema);
export const BankAccountModel = models.bankaccounts || model("bankaccounts", BankAccountSchema);

// Draft schemas
const IncomeDraftSchema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, default: 'Uncategorized' },
    amount: { type: String, default: '0' },
    data: { type: Schema.Types.Mixed, required: true },
    lastUpdated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Apply tenant plugin for multi-tenancy
IncomeDraftSchema.plugin(tenantPlugin);

const ExpenseDraftSchema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, default: 'Uncategorized' },
    amount: { type: String, default: '0' },
    data: { type: Schema.Types.Mixed, required: true },
    lastUpdated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Apply tenant plugin for multi-tenancy
ExpenseDraftSchema.plugin(tenantPlugin);

export const IncomeDraftModel = models.incomedrafts || model("incomedrafts", IncomeDraftSchema);
export const ExpenseDraftModel = models.expensedrafts || model("expensedrafts", ExpenseDraftSchema);

// Payment Transaction Schema
const PaymentTransactionSchema = new Schema(
  {
    paymentId: { type: ObjectId },
    studentId: { type: String },
    studentName: { type: String },
    amount: { type: Number, required: true },
    paymentOption: { type: String },
    paymentSubType: { type: String },
    selectedTypes: {
      coursePayment: { type: Boolean },
      studentRegistrationFee: { type: Boolean },
      courseRegistrationFee: { type: Boolean }
    },
    paymentDate: { type: Date, required: true },
    mode: { type: String },
    receivedBy: { type: String },
    notes: { type: String },
    attachments: [{ type: String }],
    payerType: { type: String },
    payerName: { type: String },
    planType: { type: String },
    discount: { type: Number, default: 0 },
    specialCharges: { type: Number, default: 0 },
    courseId: { type: String },
    courseName: { type: String }
  },
  { timestamps: true }
);

// Apply tenant plugin for multi-tenancy
PaymentTransactionSchema.plugin(tenantPlugin);

export const PaymentTransactionModel = models.paymenttransactions || model("paymenttransactions", PaymentTransactionSchema);