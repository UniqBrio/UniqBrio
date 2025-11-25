import mongoose, { Schema, Model } from "mongoose"
import { tenantPlugin } from '@/lib/tenant/tenant-plugin';

export type TaskDoc = {
  name: string
  description?: string
  assignedTo?: string
  targetDate: Date
  createdOn: Date
  priority: "low" | "medium" | "high"
  status: "new" | "open" | "inprogress" | "onhold" | "completed"
  remarks?: string
  isCompleted: boolean
  completedAt?: Date
}

const TaskSchema = new Schema<TaskDoc>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    assignedTo: { type: String, default: "Self" },
    targetDate: { type: Date, required: true },
    createdOn: { type: Date, required: true },
    priority: { type: String, enum: ["low", "medium", "high"], required: true },
    status: { type: String, enum: ["new", "open", "inprogress", "onhold", "completed"], default: "open" },
    remarks: { type: String },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { timestamps: true }
)

// Apply tenant plugin for multi-tenant isolation
TaskSchema.plugin(tenantPlugin);

// Ensure schema changes are applied in dev by resetting the model if it exists
const Task: Model<TaskDoc> = (mongoose.models.Task as Model<TaskDoc> | undefined)
  ? (delete mongoose.models.Task, mongoose.model<TaskDoc>("Task", TaskSchema))
  : mongoose.model<TaskDoc>("Task", TaskSchema)
export default Task