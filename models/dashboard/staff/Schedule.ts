import mongoose, { Schema, Document, Model } from "mongoose"
import { tenantPlugin } from "@/lib/tenant/tenant-plugin"

export interface ISchedule extends Document {
  instructorId?: string
  date: string
  title: string
  type: "teaching" | "sports" | "arts" | "meeting"
  time: string
  duration: string
  students?: number
  room?: string
  subject?: string
  conflicts?: string[]
}

const ScheduleSchema = new Schema<ISchedule>({
  instructorId: String,
  date: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ["teaching", "sports", "arts", "meeting"], required: true },
  time: { type: String, required: true },
  duration: { type: String, required: true },
  students: Number,
  room: String,
  subject: String,
  conflicts: [String],
}, { timestamps: true })

// Apply tenant plugin for multi-tenancy support
ScheduleSchema.plugin(tenantPlugin)

// Indexes for performance
ScheduleSchema.index({ tenantId: 1, instructorId: 1, date: 1 }); // Find instructor's schedule by date
ScheduleSchema.index({ tenantId: 1, date: 1 }); // Find all schedules by date
ScheduleSchema.index({ tenantId: 1, type: 1 }); // Filter by schedule type

export default (mongoose.models.Schedule as Model<ISchedule>) || mongoose.model<ISchedule>("Schedule", ScheduleSchema)
