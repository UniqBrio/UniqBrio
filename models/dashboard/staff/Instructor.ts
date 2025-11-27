import mongoose, { Schema, Document, Model } from "mongoose"
import { tenantPlugin } from "@/lib/tenant/tenant-plugin"

export interface IInstructor extends Document {
  instructorId?: string
  externalId?: string // Stable ID used by UI (e.g., INSTR0001)
  firstName: string
  middleName?: string
  lastName: string
  role: string
  email: string
  phone: string
  phoneCountryCode?: string // new: separate dialing code (e.g. +1)
  phoneLocal?: string // new: local/national number portion without country code
  // Persisted denormalized fields for faster reads and exports
  courseAssigned?: string // comma-separated course names assigned to this instructor
  cohortName?: string // comma-separated cohort names mapped to this instructor
  // Denormalized IDs from Cohort records for this instructor (comma-separated)
  courseIds?: string
  cohortIds?: string
  maritalStatus?: string
  dob?: string
  joiningDate: string
  contractType: string
  jobLevel?: string
  jobLevelOther?: string
  gender: string
  genderOther?: string
  address?: string
  country?: string
  state?: string
  yearsOfExperience?: string
  paymentInfo?: {
    classCount?: string
    frequency?: string
    hourlyRate?: string
    bankName?: string
    accountHolder?: string
    accountNumber?: string
    ifsc?: string
    branchAddress?: string
    paymentType?: string
    rate?: string
    overtimeRate?: string
    deductions?: string
    taxId?: string
    paymentMethod?: string
    payrollEmail?: string
    payrollPhone?: string
    rateType?: string
    upiProvider?: string
    upiId?: string
  }
  status?: string
}

const InstructorSchema = new Schema<IInstructor>({
  // Persist both fields; instructorId mirrors externalId on create/update via schema middleware
  externalId: { type: String, index: true, sparse: true },
  instructorId: { type: String, index: true, sparse: true },
  firstName: { type: String, required: true },
  middleName: String,
  lastName: { type: String, required: true },
  role: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  phoneCountryCode: String,
  phoneLocal: String,
  courseAssigned: { type: String },
  cohortName: { type: String },
  courseIds: { type: String },
  cohortIds: { type: String },
  maritalStatus: String,
  dob: String,
  joiningDate: { type: String, required: true },
  contractType: { type: String, required: true },
  jobLevel: { type: String },
  jobLevelOther: { type: String },
  gender: { type: String, required: true },
  genderOther: String,
  address: String,
  country: String,
  state: String,
  yearsOfExperience: String,
  paymentInfo: {
    classCount: String,
    frequency: String,
    hourlyRate: String,
    bankName: String,
    accountHolder: String,
    accountNumber: String,
    ifsc: String,
    branchAddress: String,
    paymentType: String,
    rate: String,
    overtimeRate: String,
    deductions: String,
    taxId: String,
    paymentMethod: String,
    payrollEmail: String,
    payrollPhone: String,
    rateType: String,
    upiProvider: String,
    upiId: String,
  },
  status: { type: String, default: "Active" },
}, { timestamps: true })

// Apply tenant plugin for multi-tenancy support
InstructorSchema.plugin(tenantPlugin);

// Tenant-scoped unique indexes
InstructorSchema.index({ tenantId: 1, externalId: 1 }, { unique: true, sparse: true });
InstructorSchema.index({ tenantId: 1, instructorId: 1 }, { unique: true, sparse: true });
InstructorSchema.index({ tenantId: 1, email: 1 }, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { email: { $exists: true, $type: "string", $ne: "" } } 
});

// Keep instructorId in sync with externalId on inserts/updates without touching callers
InstructorSchema.pre('save', function(next) {
  try {
    const ext = (this as any).externalId
    if (ext && !(this as any).instructorId) {
      (this as any).instructorId = ext
    }
  } catch {}
  next()
})

function ensureInstructorIdOnUpdate(this: any, next: (err?: any) => void) {
  try {
    const update = this.getUpdate() || {}
    const set = update.$set || update
    if (set && set.externalId && !set.instructorId) {
      set.instructorId = set.externalId
      if (update.$set) update.$set = set; else this.setUpdate(set)
    }
  } catch {}
  next()
}

InstructorSchema.pre('findOneAndUpdate', ensureInstructorIdOnUpdate)
InstructorSchema.pre('updateOne', ensureInstructorIdOnUpdate)
InstructorSchema.pre('updateMany', ensureInstructorIdOnUpdate)

// In Next.js dev, Mongoose caches models across HMR. When the schema changes (like new fields),
// the cached model won't pick them up unless we recompile. Safely delete and recompile the model if it exists.
let InstructorModel: Model<IInstructor>
try {
  // If deleteModel is available (Mongoose v6.7+), use it to drop the cached model
  // so the latest schema is applied.
  if ((mongoose as any).deleteModel) {
    try { (mongoose as any).deleteModel("Instructor") } catch {}
  } else if (mongoose.models && (mongoose.models as any).Instructor) {
    try { delete (mongoose.models as any).Instructor } catch {}
  }
  InstructorModel = mongoose.model<IInstructor>("Instructor", InstructorSchema)
} catch {
  // Fallback to existing model if creation fails (e.g., in prod where duplication rules differ)
  InstructorModel = (mongoose.models.Instructor as Model<IInstructor>) || mongoose.model<IInstructor>("Instructor", InstructorSchema)
}

export default InstructorModel
