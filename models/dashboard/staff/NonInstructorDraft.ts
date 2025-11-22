import mongoose, { Schema, Document, Model } from "mongoose"

export interface INonInstructorDraft extends Document {
  externalId?: string // stable id used by UI
  name: string
  instructorName: string
  role: string
  level: string
  lastUpdated: string
  formData: any
}

const NonInstructorDraftSchema = new Schema<INonInstructorDraft>({
  externalId: { type: String, index: true, unique: true, sparse: true },
  name: { type: String, required: true },
  instructorName: { type: String, required: true },
  role: { type: String, required: true },
  level: { type: String, required: true },
  lastUpdated: { type: String, required: true },
  formData: Schema.Types.Mixed,
}, { timestamps: true, collection: 'non_instructor_drafts' })

export default (mongoose.models.NonInstructorDraft as Model<INonInstructorDraft>) || mongoose.model<INonInstructorDraft>('NonInstructorDraft', NonInstructorDraftSchema)
