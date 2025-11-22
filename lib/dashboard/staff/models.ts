import mongoose, { Schema, Document, Model } from "mongoose"

// Re-export existing models from the models directory
export { default as Instructor } from "@/models/dashboard/staff/Instructor"
export { default as NonInstructor } from "@/models/dashboard/staff/NonInstructor"
export { default as Course } from "@/models/dashboard/staff/Course"
export { default as Student } from "@/models/dashboard/staff/Student"
export { default as Schedule } from "@/models/dashboard/staff/Schedule"
export { default as Draft } from "@/models/dashboard/staff/Draft"
export { default as InstructorDraft } from "@/models/dashboard/staff/InstructorDraft"

// Leave-specific models

export interface ILeaveRequest extends Document {
  id: string
  instructorId: string
  instructorName: string
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'
  leaveType?: string
  startDate: string
  endDate: string
  reason?: string
  jobLevel?: string
  // Denormalized instructor metadata for reporting
  courseName?: string
  cohortName?: string
  // IDs denormalized from Cohort records for the instructor
  courseId?: string
  cohortId?: string
  comments?: string
  substituteId?: string
  substituteConfirmed?: boolean
  documents?: string[]
  carriedOver?: boolean
  title?: string
  submittedAt?: string
  approvedAt?: string
  registeredDate?: string
  days?: number
  balance?: number
  limitReached?: boolean
  allocationTotal?: number
  allocationUsed?: number
  // Timestamps added by Mongoose
  createdAt?: string
  updatedAt?: string
}

const LeaveRequestSchema = new Schema<ILeaveRequest>({
  id: { type: String, required: true, unique: true },
  instructorId: { type: String, required: true, index: true },
  instructorName: { type: String, required: true },
  status: { type: String, enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'], required: true },
  leaveType: String,
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  reason: String,
  jobLevel: String,
  courseName: String,
  cohortName: String,
  courseId: String,
  cohortId: String,
  comments: String,
  substituteId: String,
  substituteConfirmed: { type: Boolean, default: false },
  documents: [String],
  carriedOver: { type: Boolean, default: false },
  title: String,
  submittedAt: String,
  approvedAt: String,
  registeredDate: String,
  days: Number,
  balance: Number,
  limitReached: { type: Boolean, default: false },
  allocationTotal: Number,
  allocationUsed: Number,
}, { timestamps: true })

// In Next.js dev/hot-reload, a previously-compiled model may not include newly-added
// schema paths (e.g., courseName/cohortName). When that happens, Mongoose will
// silently strip unknown fields from updates, which looks like "writes succeed but
// fields never appear". To guard against that, rebuild the model if it lacks the
// expected paths.
function ensurePaths<T>(name: string, schema: Schema<T>, collection: string, requiredPaths: string[]): Model<T> {
  const existing = mongoose.models[name] as Model<T> | undefined
  if (existing) {
    const missing = requiredPaths.some(p => !existing.schema.path(p))
    if (missing) {
      delete (mongoose.models as any)[name]
    }
  }
  return (mongoose.models[name] as Model<T>) || mongoose.model<T>(name, schema, collection)
}

export interface IInstructorLeaveDraft extends Document {
  id: string
  instructorId: string
  instructorName: string
  leaveType?: string
  startDate?: string
  endDate?: string
  reason?: string
  jobLevel?: string
  courseName?: string
  cohortName?: string
  comments?: string
  substituteId?: string
  substituteConfirmed?: boolean
  documents?: string[]
  carriedOver?: boolean
  title?: string
  updatedAt?: string
  createdAt?: string
}

const InstructorLeaveDraftSchema = new Schema<IInstructorLeaveDraft>({
  id: { type: String, required: true, unique: true },
  instructorId: { type: String, required: true, index: true },
  instructorName: { type: String, required: true },
  leaveType: String,
  startDate: String,
  endDate: String,
  reason: String,
  jobLevel: String,
  courseName: String,
  cohortName: String,
  comments: String,
  substituteId: String,
  substituteConfirmed: { type: Boolean, default: false },
  documents: [String],
  carriedOver: { type: Boolean, default: false },
  title: String,
}, { timestamps: true })

export interface ILeavePolicy extends Document {
  key: string
  quotaType: 'Monthly Quota' | 'Quarterly Quota' | 'Yearly Quota'
  autoReject: boolean
  allocations: {
    junior: number
    senior: number
    managers: number
    [key: string]: number
  }
  carryForward: boolean
  workingDays: number[]
}

const LeavePolicySchema = new Schema<ILeavePolicy>({
  key: { type: String, required: true, unique: true },
  quotaType: { 
    type: String, 
    enum: ['Monthly Quota', 'Quarterly Quota', 'Yearly Quota'],
    default: 'Monthly Quota'
  },
  autoReject: { type: Boolean, default: false },
  allocations: {
    type: Schema.Types.Mixed,
    default: { junior: 12, senior: 16, managers: 24 }
  },
  carryForward: { type: Boolean, default: true },
  workingDays: { type: [Number], default: [1, 2, 3, 4, 5, 6] },
}, { timestamps: true })

export const LeaveRequest = ensurePaths<ILeaveRequest>(
  "LeaveRequest",
  LeaveRequestSchema,
  "leave_requests",
  ["courseName", "cohortName", "courseId", "cohortId", "allocationTotal", "allocationUsed", "balance", "limitReached", "days", "registeredDate"]
)

export const InstructorLeaveDraft = ensurePaths<IInstructorLeaveDraft>(
  "InstructorLeaveDraft",
  InstructorLeaveDraftSchema,
  "instructor_leave_drafts",
  ["courseName", "cohortName"]
)

export const LeavePolicy = (mongoose.models.LeavePolicy as Model<ILeavePolicy>) || 
  mongoose.model<ILeavePolicy>("LeavePolicy", LeavePolicySchema, "leave_policies")

// Non-Instructor leave collections (separate to avoid affecting instructor data)
export const NonInstructorLeaveRequest = ensurePaths<ILeaveRequest>(
  "NonInstructorLeaveRequest",
  LeaveRequestSchema,
  "non_instructor_leave_requests",
  ["courseName", "cohortName"]
)

export const NonInstructorLeaveDraft = ensurePaths<IInstructorLeaveDraft>(
  "NonInstructorLeaveDraft",
  InstructorLeaveDraftSchema,
  "non_instructor_leave_drafts",
  ["courseName", "cohortName"]
)

export const NonInstructorLeavePolicy = (mongoose.models.NonInstructorLeavePolicy as Model<ILeavePolicy>) ||
  mongoose.model<ILeavePolicy>("NonInstructorLeavePolicy", LeavePolicySchema, "non_instructor_leave_policies")
