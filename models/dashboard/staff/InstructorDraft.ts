import mongoose, { Schema, Document, Model } from "mongoose"

export interface IInstructorDraft extends Document {
  externalId?: string // stable id used by UI
  name: string
  instructorName: string
  role: string
  level: string
  lastUpdated: string
  formData: any
}

const InstructorDraftSchema = new Schema<IInstructorDraft>({
  externalId: { type: String, index: true, unique: true, sparse: true },
  name: { type: String, required: true },
  instructorName: { type: String, required: true },
  role: { type: String, required: true },
  level: { type: String, required: true },
  lastUpdated: { type: String, required: true },
  formData: Schema.Types.Mixed,
}, { timestamps: true, collection: 'instructor_drafts' })

export default (mongoose.models.InstructorDraft as Model<IInstructorDraft>) || mongoose.model<IInstructorDraft>('InstructorDraft', InstructorDraftSchema)
