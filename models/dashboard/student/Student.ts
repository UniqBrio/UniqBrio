import mongoose from 'mongoose';
import { tenantPlugin } from '@/lib/tenant/tenant-plugin';

const GuardianSchema = new mongoose.Schema(
  {
    fullName: { type: String },
    relationship: { type: String },
    contact: { type: String },
    linkedStudentId: { type: String },
  },
  { _id: false }
);

const CommunicationPreferencesSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean },
    channels: [{ type: String }],
  },
  { _id: false }
);

const StudentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true },
    name: { type: String, required: true },
    firstName: { type: String },
    middleName: { type: String },
    lastName: { type: String },
    email: { type: String, required: true },
    mobile: { type: String },
    countryCode: { type: String }, // Mobile country code
  country: { type: String }, // Country (ISO2 or name)
  stateProvince: { type: String }, // State / Province
    dob: { type: Date },
    gender: { type: String },
    address: { type: String },
    courseOfInterestId: { type: String }, // Course of Interest ID
    enrolledCourse: { type: String }, // Enrolled Course ID
    enrolledCourseName: { type: String }, // Enrolled Course Name
    category: { type: String }, // Course Category
    courseType: { type: String }, // Course Type
    courseLevel: { type: String }, // Course Level
    registrationDate: { type: Date }, // Registration Date (formerly memberSince)
    courseStartDate: { type: Date },
    photoUrl: { type: String },
    cohortId: { type: String }, // Cohort ID (formerly batch/cohort)
    referredBy: { type: String },
    referringStudentName: { type: String },
    referringStudentId: { type: String },
    guardian: GuardianSchema,
    guardianFirstName: { type: String },
    guardianMiddleName: { type: String },
    guardianLastName: { type: String },
    guardianCountryCode: { type: String }, // Guardian contact country code
    communicationPreferences: CommunicationPreferencesSchema,
    
    // Soft delete fields
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// Apply tenant plugin for multi-tenancy support
StudentSchema.plugin(tenantPlugin);

// Add tenant-specific indexes
StudentSchema.index({ tenantId: 1, studentId: 1 }, { unique: true });
StudentSchema.index({ tenantId: 1, email: 1 }, { unique: true });

// Performance indexes (avoid duplicates):
// 'studentId' and 'email' already have unique constraints in field definitions.
// Creating separate identical indexes triggers Mongoose duplicate index warnings.
// Keep only additional index for cohort lookups.
StudentSchema.index({ cohortId: 1 });
StudentSchema.index({ isDeleted: 1 }); // For filtering deleted students

// Helper method for soft delete
StudentSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Helper method to restore
StudentSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  return this.save();
};

export default mongoose.models.Student || mongoose.model('Student', StudentSchema);