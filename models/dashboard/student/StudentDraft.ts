import mongoose from 'mongoose';

interface IStudentDraft extends mongoose.Document {
  id: string;
  name: string;
  instructor: string;
  level: string;
  lastUpdated: Date;
  createdAt: Date;
  data: Record<string, any>;
  userId?: string; // For multi-user support in future
}

const StudentDraftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  instructor: {
    type: String,
    required: true,
    default: 'No Course Selected'
  },
  level: {
    type: String,
    required: true,
    default: 'Beginner'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  userId: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  collection: 'student_drafts'
});

// Update lastUpdated on save
StudentDraftSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

const StudentDraft = mongoose.models.StudentDraft || mongoose.model<IStudentDraft>('StudentDraft', StudentDraftSchema);

export default StudentDraft;
export type { IStudentDraft };