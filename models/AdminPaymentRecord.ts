import mongoose, { Schema, Document } from "mongoose";

export interface IAdminPaymentRecord extends Document {
  businessName: string;
  ownerAdminName: string;
  email: string;
  phone: string;
  plan: string;
  studentSize: number;
  academyId: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  status: "pending" | "paid";
  amount: number;
  dueMonth: string;
  isRead: boolean;
  // Cancellation fields
  isCancelled: boolean;
  cancellationDate?: Date;
  cancellationReason?: string;
  cancellationType?: "immediate" | "end_of_cycle";
  // Auto-calculated fields
  planStatus: "upcoming" | "active" | "expired";
  daysRemaining: number;
  isOverdue: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Method to update plan status
  updatePlanStatus(): Promise<IAdminPaymentRecord>;
}

const AdminPaymentRecordSchema = new Schema<IAdminPaymentRecord>(
  {
    businessName: { type: String, required: true },
    ownerAdminName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    plan: { type: String, required: true },
    studentSize: { type: Number, required: true },
    academyId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ["pending", "paid"], 
      default: "pending" 
    },
    amount: { type: Number, required: true },
    dueMonth: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    // Cancellation fields
    isCancelled: { type: Boolean, default: false },
    cancellationDate: { type: Date },
    cancellationReason: { type: String },
    cancellationType: { 
      type: String,
      enum: ["immediate", "end_of_cycle"],
    },
    // Auto-calculated fields
    planStatus: {
      type: String,
      enum: ["upcoming", "active", "expired"],
    },
    daysRemaining: { type: Number },
    isOverdue: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Add index for faster queries
AdminPaymentRecordSchema.index({ academyId: 1, createdAt: -1 });
AdminPaymentRecordSchema.index({ status: 1 });
AdminPaymentRecordSchema.index({ dueMonth: 1 });
AdminPaymentRecordSchema.index({ academyId: 1, status: 1, isRead: 1 });
AdminPaymentRecordSchema.index({ academyId: 1, planStatus: 1 });
AdminPaymentRecordSchema.index({ isOverdue: 1 });

// Pre-save hook to auto-calculate plan status fields
AdminPaymentRecordSchema.pre("save", function (next) {
  if (this.startDate && this.endDate) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const start = new Date(this.startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(this.endDate);
    end.setHours(0, 0, 0, 0);
    
    // Calculate planStatus
    if (now < start) {
      this.planStatus = "upcoming";
    } else if (now >= start && now <= end) {
      this.planStatus = "active";
    } else {
      this.planStatus = "expired";
    }
    
    // Calculate days remaining (can be negative if expired)
    const diffTime = end.getTime() - now.getTime();
    this.daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Calculate isOverdue (expired AND status is still pending)
    this.isOverdue = this.planStatus === "expired" && this.status === "pending";
  }
  
  next();
});

// Pre-update hook to recalculate on findOneAndUpdate
AdminPaymentRecordSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() as any;
  
  // Only recalculate if dates or status are being updated
  if (update.$set && (update.$set.startDate || update.$set.endDate || update.$set.status)) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Get the document to access its current values
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (docToUpdate) {
      const start = new Date(update.$set.startDate || docToUpdate.startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(update.$set.endDate || docToUpdate.endDate);
      end.setHours(0, 0, 0, 0);
      
      const status = update.$set.status || docToUpdate.status;
      
      // Calculate planStatus
      let planStatus: "upcoming" | "active" | "expired";
      if (now < start) {
        planStatus = "upcoming";
      } else if (now >= start && now <= end) {
        planStatus = "active";
      } else {
        planStatus = "expired";
      }
      
      // Calculate days remaining
      const diffTime = end.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Calculate isOverdue
      const isOverdue = planStatus === "expired" && status === "pending";
      
      // Add calculated fields to update
      if (!update.$set) update.$set = {};
      update.$set.planStatus = planStatus;
      update.$set.daysRemaining = daysRemaining;
      update.$set.isOverdue = isOverdue;
    }
  }
  
  next();
});

// Method to recalculate status for existing records
AdminPaymentRecordSchema.methods.updatePlanStatus = function () {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const start = new Date(this.startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(this.endDate);
  end.setHours(0, 0, 0, 0);
  
  if (now < start) {
    this.planStatus = "upcoming";
  } else if (now >= start && now <= end) {
    this.planStatus = "active";
  } else {
    this.planStatus = "expired";
  }
  
  const diffTime = end.getTime() - now.getTime();
  this.daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  this.isOverdue = this.planStatus === "expired" && this.status === "pending";
  
  return this.save();
};

const AdminPaymentRecordModel = 
  mongoose.models.AdminPaymentRecord || 
  mongoose.model<IAdminPaymentRecord>("AdminPaymentRecord", AdminPaymentRecordSchema, "Admin_Payment_record");

export default AdminPaymentRecordModel;
