import mongoose, { Schema, Document, Model } from "mongoose"
import { tenantPlugin } from "@/lib/tenant/tenant-plugin"

export interface IInstructorAttendance extends Document {
  instructorId: string
  instructorName: string

  date: string
  startTime?: string
  endTime?: string
  status: 'present' | 'absent' | 'planned' | string
  
  cohortTiming?: string
  notes?: string
}

const InstructorAttendanceSchema = new Schema<IInstructorAttendance>({
  instructorId: { type: String, required: true, index: true },
  instructorName: { type: String, required: true },

  date: { type: String, required: true, index: true },
  startTime: String,
  endTime: String,
  status: { type: String, default: 'present' },

  
  cohortTiming: String,
  notes: String,
}, { timestamps: true, collection: 'instructor attendance' })

// Apply tenant plugin for multi-tenancy support
InstructorAttendanceSchema.plugin(tenantPlugin);

// Prevent duplicates (same instructor, same date, same tenant)
InstructorAttendanceSchema.index({ tenantId: 1, instructorId: 1, date: 1 }, { unique: true, name: 'uniq_tenant_instructor_date' })

export default (mongoose.models.InstructorAttendance as Model<IInstructorAttendance>)
  || mongoose.model<IInstructorAttendance>('InstructorAttendance', InstructorAttendanceSchema)
