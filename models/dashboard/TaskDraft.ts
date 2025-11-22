import mongoose, { Schema, Model } from "mongoose"

export type TaskDraftDoc<TData = any> = {
  title: string
  data: TData
  type: string // e.g., 'task'
  createdAt: Date
  updatedAt: Date
}

const TaskDraftSchema = new Schema<TaskDraftDoc>(
  {
    title: { type: String, required: true, trim: true },
    data: { type: Schema.Types.Mixed, required: true },
    type: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
    collection: "Task_Drafts", // exact collection name as requested
  }
)

TaskDraftSchema.index({ updatedAt: -1 })

const TaskDraft: Model<TaskDraftDoc> = mongoose.models.TaskDraft || mongoose.model<TaskDraftDoc>("TaskDraft", TaskDraftSchema)
export default TaskDraft