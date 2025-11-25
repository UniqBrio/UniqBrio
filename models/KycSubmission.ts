import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IKycSubmission extends Document {
  userId: string;
  academyId: string;
  ownerImageUrl: string;
  bannerImageUrl: string;
  ownerWithBannerImageUrl: string;
  location: string;
  latitude: number;
  longitude: number;
  address?: string;
  dateTime: string;
  createdAt: Date;
  updatedAt: Date;
}

const kycSubmissionSchema = new Schema<IKycSubmission>(
  {
    userId: { type: String, required: true, index: true },
    academyId: { type: String, required: true, index: true },
    ownerImageUrl: { type: String, required: true },
    bannerImageUrl: { type: String, required: true },
    ownerWithBannerImageUrl: { type: String, required: true },
    location: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String },
    dateTime: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: 'KycSubmission',
  }
);

const KycSubmissionModel: Model<IKycSubmission> = 
  mongoose.models.KycSubmission || mongoose.model<IKycSubmission>('KycSubmission', kycSubmissionSchema, 'KycSubmission');

export default KycSubmissionModel;
