import mongoose, { Schema, Document, Model } from 'mongoose';
import { tenantPlugin } from '@/lib/tenant/tenant-plugin';

// Draft Interface (simplified course structure for drafts)
export interface IDraft extends Document {
  courseId?: string; // Reserved courseId for when draft becomes a course
  name: string;
  instructor?: string;
  description?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  type?: 'Online' | 'Offline' | 'Hybrid';
  duration?: string;
  price?: string;
  schedule?: string;
  maxStudents?: string;
  tags?: string[];
  category?: string;
  subcategory?: string;
  thumbnail?: string;
  courseCategory?: string;
  status: 'Draft' | 'Active' | 'Inactive';
  
  // Additional optional fields
  shortDescription?: string;
  prerequisites?: string[];
  learningOutcomes?: string[];
  materialRequirements?: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

// Draft Schema
const draftSchema = new Schema<IDraft>({
  courseId: {
    type: String,
    sparse: true, // Allow multiple null values but unique non-null values
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  instructor: {
    type: String,
    required: false,
    trim: true
  },
  description: {
    type: String,
    required: false
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: false
  },
  type: {
    type: String,
    enum: ['Online', 'Offline', 'Hybrid'],
    required: false
  },
  duration: {
    type: String,
    required: false
  },
  price: {
    type: String,
    required: false
  },
  schedule: {
    type: String,
    required: false
  },
  maxStudents: {
    type: String,
    required: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    trim: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  thumbnail: {
    type: String
  },
  courseCategory: {
    type: String,
    default: 'Regular'
  },
  status: {
    type: String,
    enum: ['Draft', 'Active', 'Inactive'],
    default: 'Draft'
  },
  
  // Additional optional fields
  shortDescription: {
    type: String,
    maxlength: 200
  },
  prerequisites: [{
    type: String
  }],
  learningOutcomes: [{
    type: String
  }],
  materialRequirements: [{
    type: String
  }]
}, {
  timestamps: true
});

// Apply tenant plugin
draftSchema.plugin(tenantPlugin);

// Indexes
draftSchema.index({ tenantId: 1, courseId: 1 }, { unique: true, sparse: true });
draftSchema.index({ instructor: 1 });
draftSchema.index({ status: 1 });
draftSchema.index({ level: 1 });
draftSchema.index({ type: 1 });
draftSchema.index({ createdAt: -1 });

// Methods
draftSchema.methods.toJSON = function() {
  const draft = this.toObject();
  return draft;
};

// Static methods
draftSchema.statics.findByInstructor = function(instructor: string) {
  return this.find({ instructor }).sort({ createdAt: -1 });
};

draftSchema.statics.findDrafts = function() {
  return this.find({ status: 'Draft' }).sort({ createdAt: -1 });
};

// Create and export the model
const Draft: Model<IDraft> = mongoose.models.Draft || mongoose.model<IDraft>('Draft', draftSchema);

export default Draft;
