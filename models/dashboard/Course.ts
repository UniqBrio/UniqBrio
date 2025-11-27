import mongoose, { Document, Model, Schema } from 'mongoose';
import { tenantPlugin } from '@/lib/tenant/tenant-plugin';

// Course Interface
export interface ICourse extends Document {
  courseId?: string;
  // Basic Info Tab
  name: string;
  status: string;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  instructor: string;
  location?: string;
  maxStudents: number;
  description: string;
  level: string;
  type: string;
  courseCategory: string;
  tags: string[];
  studentGuidelines?: string;
  freeGifts?: string[];
  faqs?: { question: string; answer: string }[];
  customId?: string;

  // Dropdown Options Storage
  availableLevels?: string[];
  availableTypes?: string[];
  availableCategories?: string[];
  availableTags?: string[];
  availableFreeGifts?: string[];
  availableLocations?: string[];

  // Chapters Tab
  chapters?: { 
    name: string; 
    description: string; 
    referencePdf?: string; 
    assignmentPdf?: string;
  }[];

  // Pricing Tab
  priceINR: number;
  paymentCategory: string;
  affiliateEnabled?: boolean;
  referralCode?: string;
  commissionRate?: string;
  referralStart?: string;
  referralEnd?: string;
  
  // Ongoing Training Pricing
  paymentFrequency?: string;  // Required for Ongoing Training: biweekly, monthly, quarterly, yearly
  trainingDuration?: number;  // Optional: Total duration for Ongoing Training
  pricingPeriods?: {
    id: string;
    startMonth: number;
    endMonth: number;
    price: string;
    description?: string;
  }[];

  // Schedule Tab - All fields optional to avoid validation errors
  // Note: For Ongoing Training courses, only startDate is required (endDate is optional as training is continuous)
  schedulePeriod?: {
    startDate?: Date;       // Optional start date for the course (required for Ongoing Training, optional for others)
    endDate?: Date;         // Optional end date for the course (not required for Ongoing Training)
    totalWeeks?: number;    // Optional: Total duration in weeks (auto-calculated in UI)
    totalSessions?: number; // Optional: Total number of sessions
  };
  sessionDetails?: {
    sessionDuration?: number;  // Optional: Duration per session in minutes (e.g., 90)
    sessionType?: string;      // Optional: "lecture" | "workshop" | "lab" | "exam"
    breakDuration?: number;    // Optional: Break time in minutes between sessions
  };
  frequencies?: {
    days?: string[];
    start?: string;
    end?: string;
    sessions?: string;
  }[];
  reminderSettings?: {
    customSchedule?: {
      type?: string;
      customType?: string;
      daysBefore?: string;
      hoursBefore?: string;
      timeOfDay?: string;
      enabled?: boolean;
    }[];
    pushEnabled?: boolean;
    smsEnabled?: boolean;
    whatsappEnabled?: boolean;
    emailEnabled?: boolean;
  };
}

// Main Course Schema
const courseSchema = new Schema<ICourse>({
  courseId: {
    type: String,
    trim: true
    // Removed unique: true here since we add it as an index below
  },
  // Basic Info Tab Fields
  name: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  customId: {
    type: String,
    trim: true,
    unique: false // Not required to be unique, but can be set true if needed
  },
  status: {
    type: String,
    required: true,
    enum: ["Active", "Draft", "Inactive", "Completed", "Cancelled", "Upcoming", "In Progress"]
  },
  isDeleted: {
    type: Boolean,
    default: false
    // Removed index: true here since we add it as an index below
  },
  deletedAt: {
    type: Date,
    default: null
  },
  instructor: {
    type: String
  },
  location: {
    type: String,
    trim: true,
    maxlength: 100
    // Removed enum restriction to allow custom locations
  },
  maxStudents: {
    type: Number,
    required: true,
    min: 1,
    max: 1000
  },
  description: {
    type: String,
    minlength: 10,
    maxlength: 2000
  },
  level: {
    type: String
  },
  type: {
    type: String,
    required: true
  },
  courseCategory: {
    type: String,
    required: true
  },
  tags: [{
    type: String
  }],
  studentGuidelines: {
    type: String,
    maxlength: 1000
  },
  freeGifts: [{
    type: String
  }],
  faqs: [{
    question: { type: String, required: true, maxlength: 500 },
    answer: { type: String, required: true, maxlength: 1000 }
  }],

  // Dropdown Options Storage
  availableLevels: [{
    type: String,
    trim: true
  }],
  availableTypes: [{
    type: String,
    trim: true
  }],
  availableCategories: [{
    type: String,
    trim: true
  }],
  availableTags: [{
    type: String,
    trim: true
  }],
  availableFreeGifts: [{
    type: String,
    trim: true
  }],
  availableLocations: [{
    type: String,
    trim: true
  }],

  // Chapters Tab Fields
  chapters: [{
    name: { type: String, minlength: 3, maxlength: 100 },
    description: { type: String, minlength: 10, maxlength: 1000 },
    referencePdf: { type: String },
    assignmentPdf: { type: String }
  }],

  // Pricing Tab Fields
  priceINR: {
    type: Number,
    required: true,
    min: 1,
    max: 1000000
  },
  paymentCategory: {
    type: String,
    enum: ['One-time', 'One-time with installments', 'Monthly subscription', 'Monthly subscription with discounts'],
    required: true
  },
  affiliateEnabled: {
    type: Boolean,
    default: false
  },
  referralCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  commissionRate: {
    type: String,
    validate: {
      validator: function(v: string) {
        const rate = parseFloat(v);
        return !isNaN(rate) && rate >= 0 && rate <= 100;
      },
      message: 'Commission rate must be between 0 and 100'
    }
  },
  referralStart: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !isNaN(Date.parse(v));
      },
      message: 'Invalid date format for referral start'
    }
  },
  referralEnd: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !isNaN(Date.parse(v));
      },
      message: 'Invalid date format for referral end'
    }
  },

  // Ongoing Training Pricing Fields
  paymentFrequency: {
    type: String,
    enum: ['biweekly', 'monthly', 'quarterly', 'yearly']
  },
  trainingDuration: {
    type: Number,
    min: 1,
    max: 60
  },
  pricingPeriods: [{
    id: { type: String, required: true },
    startMonth: { type: Number, required: true, min: 1 },
    endMonth: { type: Number, required: true, min: 1 },
    price: { type: String, required: true },
    description: { type: String }
  }],

  // Schedule Tab Fields - Flexible mixed type to avoid validation issues
  schedulePeriod: {
    type: Schema.Types.Mixed,  // Allow any structure, no validation
    required: false
  },
  sessionDetails: {
    type: Schema.Types.Mixed,  // Allow any structure, no validation
    required: false
  },
  frequencies: [{
    days: [{ 
      type: String, 
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    }],
    start: { type: String, required: false },
    end: { type: String, required: false },
    sessions: { type: String }
  }],
  reminderSettings: {
    customSchedule: [{
      type: { type: String, enum: ["class", "exam", "assignment", "workshop"] },
      customType: { type: String },
      daysBefore: { type: String, min: "0", max: "30" },
      hoursBefore: { type: String, min: "0", max: "24" },
      timeOfDay: { type: String },
      enabled: { type: Boolean, default: true }
    }],
    pushEnabled: { type: Boolean, default: false },
    smsEnabled: { type: Boolean, default: false },
    whatsappEnabled: { type: Boolean, default: false },
    emailEnabled: { type: Boolean, default: true }
  }
}, {
  timestamps: true,
  id: false,        // Disable virtual id field
  versionKey: false // Disable __v field
});

// Apply tenant plugin for multi-tenancy support
courseSchema.plugin(tenantPlugin);

// Indexes for efficient querying
courseSchema.index({ tenantId: 1, courseId: 1 }, { unique: true, sparse: true });
courseSchema.index({ tenantId: 1, name: 1 });
courseSchema.index({ tenantId: 1, status: 1 });
courseSchema.index({ name: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ courseCategory: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ priceINR: 1 });
courseSchema.index({ "schedulePeriod.startDate": 1 });
courseSchema.index({ "schedulePeriod.endDate": 1 });
courseSchema.index({ createdAt: -1 });
// Index for soft delete queries
courseSchema.index({ isDeleted: 1 });
// Compound index for efficient active course queries
courseSchema.index({ isDeleted: 1, status: 1 });

// Create and export the model
const Course: Model<ICourse> = mongoose.models.Course || mongoose.model<ICourse>('Course', courseSchema);

export default Course;
