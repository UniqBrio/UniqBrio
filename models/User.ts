import mongoose, { Schema, Model, Document } from 'mongoose';

export enum UserRole {
  super_admin = 'super_admin',
  student = 'student',
  admin = 'admin',
  instructor = 'instructor',
}

export enum KycStatus {
  pending = 'pending',
  approved = 'approved',
  rejected = 'rejected',
  expired = 'expired',
}

export interface IUser extends Document {
  userId?: string;
  academyId?: string;
  tenantId?: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role?: UserRole;
  verified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  otp?: string;
  otpExpiry?: Date;
  resetToken?: string;
  resetTokenExpiry?: Date;
  failedAttempts: number;
  lockedUntil?: Date;
  googleId?: string;
  image?: string;
  registrationComplete: boolean;
  kycStatus: KycStatus;
  kycSubmissionDate?: Date;
  lastLoginAt?: Date;
  planChoosed?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    userId: { type: String, unique: true, sparse: true },
    academyId: { type: String, index: true },
    tenantId: { type: String },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String },
    password: { type: String },
    role: { 
      type: String, 
      enum: Object.values(UserRole),
    },
    verified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpiry: { type: Date },
    otp: { type: String },
    otpExpiry: { type: Date },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    failedAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    googleId: { type: String },
    image: { type: String },
    registrationComplete: { type: Boolean, default: false },
    kycStatus: { 
      type: String, 
      enum: Object.values(KycStatus),
      default: KycStatus.pending 
    },
    kycSubmissionDate: { type: Date },
    lastLoginAt: { type: Date },
    planChoosed: { type: String, enum: ['free', 'grow', 'scale', 'beta'], default: 'free' },
  },
  {
    timestamps: true,
    collection: 'User',
  }
);

// Compound indexes for tenant isolation
userSchema.index({ tenantId: 1, email: 1 });
// Additional composite indexes for performance
userSchema.index({ email: 1, verified: 1 }); // For login and verification checks
userSchema.index({ academyId: 1, email: 1 }); // For tenant-specific user lookups

// Prevent model recompilation in development
const UserModel: Model<IUser> = 
  mongoose.models.UserAuth || mongoose.model<IUser>('UserAuth', userSchema, 'User');

export default UserModel;
