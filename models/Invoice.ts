import mongoose, { Schema, Document } from "mongoose";

export interface IInvoice extends Document {
  academyId: string;
  academyName: string;
  userId: string;
  ownerAdminName: string;
  email: string;
  phone: string;
  planType: "Monthly" | "Yearly";
  invoiceNumber: string;
  dateIssued: Date;
  amount: number;
  status: "Paid" | "Failed" | "Pending" | "Overdue";
  paymentMethod: "Card" | "UPI" | "Net Banking" | "Bank Transfer";
  description: string;
  paymentRecordId: string; // Reference to the AdminPaymentRecord
  startDate: Date;
  endDate: Date;
  studentSize: number;
  dueMonth: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    academyId: { type: String, required: true, index: true },
    academyName: { type: String, required: true },
    userId: { type: String, required: true },
    ownerAdminName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    planType: { 
      type: String, 
      enum: ["Monthly", "Yearly"], 
      required: true 
    },
    invoiceNumber: { type: String, required: true, unique: true },
    dateIssued: { type: Date, required: true },
    amount: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ["Paid", "Failed", "Pending", "Overdue"], 
      default: "Paid" 
    },
    paymentMethod: { 
      type: String, 
      enum: ["Card", "UPI", "Net Banking", "Bank Transfer"],
      default: "Bank Transfer"
    },
    description: { type: String, required: true },
    paymentRecordId: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    studentSize: { type: Number, required: true },
    dueMonth: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Add indexes for faster queries
InvoiceSchema.index({ academyId: 1, dateIssued: -1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ dateIssued: 1 });

const InvoiceModel = 
  mongoose.models.Invoice || 
  mongoose.model<IInvoice>("Invoice", InvoiceSchema, "invoices");

export default InvoiceModel;
