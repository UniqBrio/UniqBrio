import mongoose, { Schema, Document, Model } from "mongoose"
import { tenantPlugin } from "@/lib/tenant/tenant-plugin"

export interface INonInstructorAttendance extends Document {
  tenantId: string
  instructorId: string
  instructorName: string
  date: string // yyyy-MM-dd
  startTime?: string | null
  endTime?: string | null
  status: 'present' | 'absent' | 'planned'
  cohortTiming?: string | null
  notes?: string | null
}

const NonInstructorAttendanceSchema = new Schema<INonInstructorAttendance>({
  instructorId: { type: String, required: true, index: true },
  instructorName: { type: String, required: true },
  date: { type: String, required: true },
  startTime: { type: String, default: null },
  endTime: { type: String, default: null },
  status: { type: String, enum: ['present', 'absent', 'planned'], default: 'present' },
  cohortTiming: { type: String, default: null },
  notes: { type: String, default: null },
}, { timestamps: true, collection: 'non_instructor attendance' })

// Apply tenant plugin for multi-tenancy support
NonInstructorAttendanceSchema.plugin(tenantPlugin)

// Prevent duplicates (same instructor, same date, same tenant)
NonInstructorAttendanceSchema.index({ tenantId: 1, instructorId: 1, date: 1 }, { unique: true, name: 'uniq_tenant_non_instructor_date' })

export default (mongoose.models.NonInstructorAttendance as Model<INonInstructorAttendance>)
  || mongoose.model<INonInstructorAttendance>('NonInstructorAttendance', NonInstructorAttendanceSchema)
