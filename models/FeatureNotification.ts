import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFeatureNotification extends Document {
  feature: string;
  count: number;
  subscribers: {
    sessionId: string;
    subscribedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const FeatureNotificationSchema = new Schema<IFeatureNotification>(
  {
    feature: {
      type: String,
      required: true,
      unique: true,
      enum: ["crm", "sell-products", "promotions", "parent-management", "alumni-management"],
    },
    count: {
      type: Number,
      default: 0,
    },
    subscribers: [
      {
        sessionId: { type: String, required: true },
        subscribedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Ensure indexes
FeatureNotificationSchema.index({ feature: 1 });

const FeatureNotificationModel: Model<IFeatureNotification> =
  mongoose.models.FeatureNotification ||
  mongoose.model<IFeatureNotification>("FeatureNotification", FeatureNotificationSchema);

export default FeatureNotificationModel;
