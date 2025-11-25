import mongoose, { Schema, Document, Model } from "mongoose"
import { tenantPlugin } from "@/lib/tenant/tenant-plugin"

export interface INonInstructor extends Document {
  externalId?: string // Stable ID used by UI (e.g., NON INS0001)
  firstName: string
  middleName?: string
  lastName: string
  role: string
  email: string
  phone: string
  phoneCountryCode?: string
  phoneLocal?: string
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

const NonInstructorSchema = new Schema<INonInstructor>({
  externalId: { type: String, index: true, unique: true, sparse: true },
  firstName: { type: String, required: true },
  middleName: String,
  lastName: { type: String, required: true },
  role: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  phoneCountryCode: String,
  phoneLocal: String,
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
}, { timestamps: true, collection: 'non_instructors' })

// Apply tenant plugin for multi-tenancy support
NonInstructorSchema.plugin(tenantPlugin);

// Unique email when non-empty (same behavior as Instructor)
NonInstructorSchema.index({ email: 1 }, {
  unique: true,
  partialFilterExpression: { email: { $exists: true, $type: "string", $ne: "" } },
})
NonInstructorSchema.index({ tenantId: 1, externalId: 1 }, { unique: true, sparse: true });
NonInstructorSchema.index({ tenantId: 1, email: 1 }, { sparse: true });

let NonInstructorModel: Model<INonInstructor>
try {
  if ((mongoose as any).deleteModel) {
    try { (mongoose as any).deleteModel("NonInstructor") } catch {}
  } else if (mongoose.models && (mongoose.models as any).NonInstructor) {
    try { delete (mongoose.models as any).NonInstructor } catch {}
  }
  NonInstructorModel = mongoose.model<INonInstructor>("NonInstructor", NonInstructorSchema)
} catch {
  NonInstructorModel = (mongoose.models.NonInstructor as Model<INonInstructor>) || mongoose.model<INonInstructor>("NonInstructor", NonInstructorSchema)
}

export default NonInstructorModel
