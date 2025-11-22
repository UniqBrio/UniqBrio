import mongoose from 'mongoose';

const AchievementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['individual', 'group'], default: 'individual' },
    photoUrl: { type: String },
    date: { type: Date },
    // Either reference a student document or store studentId for external linkage
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    studentId: { type: String },
    likes: { type: Number, default: 0 },
    congratulations: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Achievement || mongoose.model('Achievement', AchievementSchema);
