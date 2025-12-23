import mongoose, { Schema, Document, Model } from "mongoose"
import { tenantPlugin } from "@/lib/tenant/tenant-plugin"

export interface ICourse extends Document {
  tenantId: string
  name: string
  status?: string
  instructor?: string
  courseCategory?: string
  level?: string
  type?: string
  tags?: string[]
  skills?: string[]
  prerequisites?: string
  learningOutcomes?: string
  maxStudents?: number
  description?: string
  schedulePeriod?: {
    totalWeeks?: number
    startDate?: string
    endDate?: string
  }
  sessionDetails?: {
    sessionDuration?: number
    maxClasses?: number
  }
  frequencies?: string[]
  location?: string
  virtualClassroomUrl?: string
  price?: number
  discountPrice?: number
  referralCode?: string
  commissionRate?: number
  referralStart?: string
  referralEnd?: string
  reminderSettings?: {
    pushEnabled?: boolean
    emailEnabled?: boolean
    smsEnabled?: boolean
    frequency?: string
  }
}

const CourseSchema = new Schema<ICourse>({
  name: { type: String, required: true },
  status: String,
  instructor: String,
  courseCategory: String,
  level: String,
  type: String,
  tags: [String],
  skills: [String],
  prerequisites: String,
  learningOutcomes: String,
  maxStudents: Number,
  description: String,
  schedulePeriod: {
    totalWeeks: Number,
    startDate: String,
    endDate: String,
  },
  sessionDetails: {
    sessionDuration: Number,
    maxClasses: Number,
  },
  frequencies: [String],
  location: String,
  virtualClassroomUrl: String,
  price: Number,
  discountPrice: Number,
  referralCode: String,
  commissionRate: Number,
  referralStart: String,
  referralEnd: String,
  reminderSettings: {
    pushEnabled: Boolean,
    emailEnabled: Boolean,
    smsEnabled: Boolean,
    frequency: String,
  },
}, { timestamps: true })

// Apply tenant plugin for multi-tenancy support
CourseSchema.plugin(tenantPlugin)

// Indexes for performance
CourseSchema.index({ tenantId: 1, name: 1 }); // Find by course name
CourseSchema.index({ tenantId: 1, status: 1 }); // Filter by status
CourseSchema.index({ tenantId: 1, instructor: 1 }); // Find instructor's courses

export default (mongoose.models.Course as Model<ICourse>) || mongoose.model<ICourse>("Course", CourseSchema)
