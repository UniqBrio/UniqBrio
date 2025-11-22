import mongoose, { Schema, Document, Model } from "mongoose"

export interface INonInstructorAttendanceDraft extends Document {
  instructorId?: string
  instructorName?: string
  date?: string
  startTime?: string | null
  endTime?: string | null
  status?: 'present' | 'absent'
  cohortTiming?: string | null
  notes?: string | null
  savedAt?: string
}

const NonInstructorAttendanceDraftSchema = new Schema<INonInstructorAttendanceDraft>({
  instructorId: String,
  instructorName: String,
  date: String,
  startTime: { type: String, default: null },
  endTime: { type: String, default: null },
  status: { type: String, enum: ['present', 'absent'], default: 'present' },
  cohortTiming: { type: String, default: null },
  notes: { type: String, default: null },
  savedAt: String,
}, { timestamps: true, collection: 'non_instructor attendance draft' })

export default (mongoose.models.NonInstructorAttendanceDraft as Model<INonInstructorAttendanceDraft>)
  || mongoose.model<INonInstructorAttendanceDraft>('NonInstructorAttendanceDraft', NonInstructorAttendanceDraftSchema)
