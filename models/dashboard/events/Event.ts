import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    sport: {
      type: String,
      required: true,
      enum: [
        'Cricket', 'Tennis', 'Badminton', 'Volleyball', 'Basketball', 'Kabaddi', 'Chess', 'Swimming', 'Athletics', 'Football', 'Hockey', 'Gymnastics',
        // Arts categories
        'Painting', 'Sculpture', 'Music', 'Dance', 'Drama', 'Photography', 'Literature', 'Crafts'
      ],
    },
    type: {
      type: String,
      required: false,
      enum: ['Tournament', 'Workshop', 'Coaching Session', 'Friendly Match', 'Training Camp', 'Championship', 'Seminar', 'Tryout', 'Other'],
      default: 'Other',
    },
    description: { type: String },
    startDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endDate: { type: Date, required: true },
    endTime: { type: String, required: true },
    registrationDeadline: { type: Date, required: true },
    venue: { type: String, required: true },
    staff: { type: String, required: true },
    participants: { type: Number, default: 0 },
    maxParticipants: { type: Number, required: true },
    skillLevel: {
      type: String,
      required: true,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
    },
    format: {
      type: String,
      required: true,
      enum: ['Individual', 'Team', 'Mixed'],
    },
    ageGroup: { type: String, required: true },
    equipment: { type: String },
    entryFee: { type: Number, default: 0 },
    prizes: { type: String },
    rules: { type: String },
    status: {
      type: String,
      enum: ['Upcoming', 'Ongoing', 'Completed'],
      default: 'Upcoming',
    },
    // Soft-delete support
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    isPublished: { type: Boolean, default: false },
    publishedDate: { type: Date },
    revenue: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for performance
EventSchema.index({ sport: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ startDate: 1 });
EventSchema.index({ isPublished: 1 });
EventSchema.index({ staff: 1 });

export default mongoose.models.Event || mongoose.model('Event', EventSchema);
