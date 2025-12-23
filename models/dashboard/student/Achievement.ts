import mongoose from 'mongoose';
import { tenantPlugin } from '@/lib/tenant/tenant-plugin';

const AchievementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['individual', 'group'], default: 'individual' },
    photoUrl: { type: String },
    date: { type: Date },
    // Either reference a student document or store studentId for external linkage
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    studentId: { type: String, index: true },
    likes: { type: Number, default: 0 },
    congratulations: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Apply tenant plugin for multi-tenant isolation
AchievementSchema.plugin(tenantPlugin);

// Performance indexes for common queries
AchievementSchema.index({ tenantId: 1, studentId: 1 }); // Student's achievements
AchievementSchema.index({ tenantId: 1, date: -1 }); // Recent achievements
AchievementSchema.index({ tenantId: 1, type: 1 }); // Filter by type

export default mongoose.models.Achievement || mongoose.model('Achievement', AchievementSchema);
