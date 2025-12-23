import mongoose, { Schema, Document, Model } from "mongoose"
import { tenantPlugin } from "@/lib/tenant/tenant-plugin"

export interface IStudent extends Document {
  name: string
  avatar?: string
  course?: string
  progress?: number
  attendance?: number
  lastActive?: string
  status?: "active" | "inactive" | "flagged"
  behaviorFlags?: string[]
  studentId?: string
  instructor?: string
  grade?: string
  enrollmentDate?: string
  contactInfo?: {
    email?: string
    phone?: string
    parentEmail?: string
    parentPhone?: string
  }
  academicInfo?: {
    gpa?: number
    credits?: number
    semester?: string
    year?: string
  }
  demographicInfo?: {
    age?: number
    gender?: "Male" | "Female" | "Other"
    nationality?: string
  }
  performanceMetrics?: {
    assignmentsCompleted?: number
    totalAssignments?: number
    averageScore?: number
    participationScore?: number
  }
}

const StudentSchema = new Schema<IStudent>({
  name: { type: String, required: true },
  avatar: String,
  course: String,
  progress: Number,
  attendance: Number,
  lastActive: String,
  status: { type: String, enum: ["active", "inactive", "flagged"], default: "active" },
  behaviorFlags: [String],
  studentId: { type: String, index: true },
  instructor: String,
  grade: String,
  enrollmentDate: String,
  contactInfo: {
    email: String,
    phone: String,
    parentEmail: String,
    parentPhone: String,
  },
  academicInfo: {
    gpa: Number,
    credits: Number,
    semester: String,
    year: String,
  },
  demographicInfo: {
    age: Number,
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    nationality: String,
  },
  performanceMetrics: {
    assignmentsCompleted: Number,
    totalAssignments: Number,
    averageScore: Number,
    participationScore: Number,
  },
}, { timestamps: true })

// Apply tenant plugin for multi-tenancy support
StudentSchema.plugin(tenantPlugin)

// Indexes for performance
StudentSchema.index({ tenantId: 1, studentId: 1 }, { unique: true, sparse: true }); // Find by student ID
StudentSchema.index({ tenantId: 1, course: 1 }); // Find by course
StudentSchema.index({ tenantId: 1, status: 1 }); // Filter by status
StudentSchema.index({ tenantId: 1, instructor: 1 }); // Find by instructor

export default (mongoose.models.Student as Model<IStudent>) || mongoose.model<IStudent>("Student", StudentSchema)
