import mongoose, { Schema, Document, Model } from "mongoose"
import { tenantPlugin } from "@/lib/tenant/tenant-plugin"

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

// Apply tenant plugin for multi-tenancy support
CohortSchema.plugin(tenantPlugin)

// Indexes for performance
CohortSchema.index({ tenantId: 1, cohortId: 1 }, { unique: true, sparse: true }); // Find by cohort ID
CohortSchema.index({ tenantId: 1, courseId: 1 }); // Find cohorts by course
CohortSchema.index({ tenantId: 1, instructor: 1 }); // Find instructor's cohorts

export default (mongoose.models.Cohort as Model<ICohort>) || mongoose.model<ICohort>("Cohort", CohortSchema)
