import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAnnouncement extends Document {
  type: "update" | "achievement" | "alert" | "info";
  title: string;
  message: string;
  link?: string;
  priority: "low" | "medium" | "high";
  isActive: boolean;
  publishedAt: Date;
  expiresAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    type: {
      type: String,
      required: true,
      enum: ["update", "achievement", "alert", "info"],
      default: "info",
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    link: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      required: true,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
    },
    createdBy: {
      type: String,
      required: true,
      default: "admin",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
AnnouncementSchema.index({ isActive: 1, publishedAt: -1 });
AnnouncementSchema.index({ expiresAt: 1 });

const AnnouncementModel: Model<IAnnouncement> =
  mongoose.models.Announcement ||
  mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema);

export default AnnouncementModel;
