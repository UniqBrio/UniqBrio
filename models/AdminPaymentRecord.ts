import mongoose, { Schema, Document } from "mongoose";

export interface IAdminPaymentRecord extends Document {
  businessName: string;
  ownerAdminName: string;
  email: string;
  phone: string;
  plan: string;
  academyId: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  status: "pending" | "paid" | "overdue" | "cancelled";
  amount: number;
  dueMonth: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminPaymentRecordSchema = new Schema<IAdminPaymentRecord>(
  {
    businessName: { type: String, required: true },
    ownerAdminName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    plan: { type: String, required: true },
    academyId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ["pending", "paid", "overdue", "cancelled"], 
      default: "pending" 
    },
    amount: { type: Number, required: true },
    dueMonth: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Add index for faster queries
AdminPaymentRecordSchema.index({ academyId: 1, createdAt: -1 });
AdminPaymentRecordSchema.index({ status: 1 });
AdminPaymentRecordSchema.index({ dueMonth: 1 });

const AdminPaymentRecordModel = 
  mongoose.models.AdminPaymentRecord || 
  mongoose.model<IAdminPaymentRecord>("AdminPaymentRecord", AdminPaymentRecordSchema, "Admin_Payment_record");

export default AdminPaymentRecordModel;
