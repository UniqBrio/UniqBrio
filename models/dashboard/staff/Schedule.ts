import mongoose, { Schema, Document, Model } from "mongoose"

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

export default (mongoose.models.Schedule as Model<ISchedule>) || mongoose.model<ISchedule>("Schedule", ScheduleSchema)
