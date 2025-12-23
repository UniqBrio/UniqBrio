import mongoose, { Schema, Document, Model } from "mongoose"
import { tenantPlugin } from "@/lib/tenant/tenant-plugin"

export interface IDraft extends Document {
  externalId?: string // local draft id used by UI
  name: string
  instructorName: string
  role: string
  level: string
  lastUpdated: string
  formData: any
}

const DraftSchema = new Schema<IDraft>({
  externalId: { type: String, index: true, unique: true, sparse: true },
  name: { type: String, required: true },
  instructorName: { type: String, required: true },
  role: { type: String, required: true },
  level: { type: String, required: true },
  lastUpdated: { type: String, required: true },
  formData: Schema.Types.Mixed,
}, { timestamps: true })

// Apply tenant plugin for multi-tenancy support
DraftSchema.plugin(tenantPlugin)

// Indexes for performance
DraftSchema.index({ tenantId: 1, externalId: 1 }, { unique: true, sparse: true }); // Find by external ID
DraftSchema.index({ tenantId: 1, lastUpdated: -1 }); // Recent drafts

export default (mongoose.models.Draft as Model<IDraft>) || mongoose.model<IDraft>("Draft", DraftSchema)
