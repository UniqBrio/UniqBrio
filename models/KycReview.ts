import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export interface IKycReview extends Document {
  kycId: Types.ObjectId;
  userId: string; // Added for composite index
  academyId: string; // Added for composite index
  reviewerId: string;
  status: 'approved' | 'rejected';
  comments?: string;
  rejectionReasons: string[];
  customMessage?: string;
  reviewedAt: Date;
}

const kycReviewSchema = new Schema<IKycReview>(
  {
    kycId: { type: Schema.Types.ObjectId, required: true, ref: 'KycSubmission' },
    userId: { type: String, required: true, index: true }, // Added
    academyId: { type: String, required: true, index: true }, // Added
    reviewerId: { type: String, required: true },
    status: { type: String, enum: ['approved', 'rejected'], required: true },
    comments: { type: String },
    rejectionReasons: { type: [String], default: [] },
    customMessage: { type: String },
    reviewedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'KycReview',
  }
);

kycReviewSchema.index({ kycId: 1 });
// Composite index for rejection/approval lookups
kycReviewSchema.index({ userId: 1, academyId: 1, status: 1 });
kycReviewSchema.index({ reviewedAt: -1 }); // For sorting by review date

const KycReviewModel: Model<IKycReview> = 
  mongoose.models.KycReview || mongoose.model<IKycReview>('KycReview', kycReviewSchema, 'KycReview');

export default KycReviewModel;
