import mongoose, { Schema, Document, Model } from "mongoose"

export interface ICohort extends Document {
  name?: string
  instructor?: string
  cohortId?: string
  courseId?: string
  [key: string]: any
}

// Define a very permissive schema ? we only care about `name` and `instructor` for now.
const CohortSchema = new Schema<ICohort>({
  name: { type: String },
  instructor: { type: String },
  cohortId: { type: String },
  courseId: { type: String },
}, {
  timestamps: true,
  strict: false, // allow extra fields present in the collection
  collection: 'cohorts', // ensure we read the existing `cohorts` collection
})

export default (mongoose.models.Cohort as Model<ICohort>) || mongoose.model<ICohort>("Cohort", CohortSchema)
