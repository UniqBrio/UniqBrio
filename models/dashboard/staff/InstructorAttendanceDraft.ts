import mongoose, { Schema, Document, Model } from "mongoose"

export interface IInstructorAttendanceDraft extends Document {
  instructorId?: string
  instructorName?: string
  date?: string
  startTime?: string
  endTime?: string
  status?: 'present' | 'absent' | string
  courseId?: string
  courseName?: string
  cohortId?: string
  cohortName?: string
  cohortTiming?: string
  notes?: string
  savedAt?: string
}

const InstructorAttendanceDraftSchema = new Schema<IInstructorAttendanceDraft>({
  instructorId: String,
  instructorName: String,
  date: String,
  startTime: String,
  endTime: String,
  status: { type: String, default: 'present' },
  courseId: String,
  courseName: String,
  cohortId: String,
  cohortName: String,
  cohortTiming: String,
  notes: String,
  savedAt: String,
}, { timestamps: true, collection: 'instructor attendance draft' })

export default (mongoose.models.InstructorAttendanceDraft as Model<IInstructorAttendanceDraft>)
  || mongoose.model<IInstructorAttendanceDraft>('InstructorAttendanceDraft', InstructorAttendanceDraftSchema)
