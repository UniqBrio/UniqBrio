import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IRegistration extends Document {
  academyId: string;
  userId: string;
  tenantId?: string;
  businessInfo: Record<string, any>;
  adminInfo: Record<string, any>;
  preferences?: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
}

const registrationSchema = new Schema<IRegistration>(
  {
    academyId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String },
    businessInfo: { type: Schema.Types.Mixed, required: true },
    adminInfo: { type: Schema.Types.Mixed, required: true },
    preferences: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    collection: 'registrations',
  }
);

// Index for tenant isolation
registrationSchema.index({ tenantId: 1 });
registrationSchema.index({ 'adminInfo.email': 1 }); // Added for performance in user-academy-info

const RegistrationModel: Model<IRegistration> = 
  mongoose.models.Registration || mongoose.model<IRegistration>('Registration', registrationSchema, 'registrations');

export default RegistrationModel;
