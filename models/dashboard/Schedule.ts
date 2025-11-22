import mongoose, { Schema, Document, Model } from 'mongoose';

// Recurring Pattern Interface
export interface IRecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  endDate?: Date;
  daysOfWeek?: number[];
  exceptions?: Date[];
}

// Schedule Interface
export interface ISchedule extends Document {
  _id: string;
  title: string;
  description?: string;
  courseId?: string;
  cohortId?: string;
  sessionId?: string; // Custom session identifier for generated sessions
  instructor: string; // User ID
  instructorName: string;
  students: number;
  registeredStudents: string[]; // Array of User IDs
  maxCapacity: number;
  waitlist: string[]; // Array of User IDs
  
  // Date and Time
  date: Date;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  timeZone: string;
  
  // Location and Mode
  location?: string;
  virtualClassroomUrl?: string;
  mode: 'live' | 'recorded' | 'hybrid';
  type: 'online' | 'offline' | 'hybrid';
  
  // Categorization
  category: 'Fitness' | 'Sports' | 'Arts' | 'Teaching' | 'Other';
  subcategory?: string;
  tags: string[];
  
  // Status and Lifecycle
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled' | 'Pending';
  isCancelled: boolean;
  cancellationReason?: string;
  cancellationDate?: Date;
  
  // Session Modifications (stored as Mixed type for flexibility)
  // Structure:
  // {
  //   reassignment?: {
  //     originalInstructor: string,
  //     originalInstructorName: string,
  //     newInstructor: string,
  //     newInstructorName: string,
  //     reassignedAt: Date,
  //     reason?: string,
  //     reassignedBy: string,
  //     type: 'reassigned_to' | 'reassigned_from'
  //   },
  //   cancellation?: {
  //     cancelledAt: Date,
  //     reason: string,
  //     cancelledBy: string,
  //     backendId?: string
  //   },
  //   reschedule?: {
  //     originalDate: Date,
  //     originalStartTime: string,
  //     originalEndTime: string,
  //     rescheduledAt: Date,
  //     reason?: string,
  //     rescheduledBy: string,
  //     backendId?: string
  //   }
  // }
  modifications?: {
    reassignment?: {
      originalInstructor: string;
      originalInstructorName: string;
      newInstructor: string;
      newInstructorName: string;
      reassignedAt: Date;
      reason?: string;
      reassignedBy: string;
      type: 'reassigned_to' | 'reassigned_from';
    };
    cancellation?: {
      cancelledAt: Date;
      reason: string;
      cancelledBy: string;
      backendId?: string;
    };
    reschedule?: {
      originalDate: Date;
      originalStartTime: string;
      originalEndTime: string;
      rescheduledAt: Date;
      reason?: string;
      rescheduledBy: string;
      backendId?: string;
    };
  };
  
  // Recurring Events
  isRecurring: boolean;
  recurringPattern?: IRecurringPattern;
  parentEventId?: string; // For recurring event instances
  
  // Class Management
  joinLink?: string;
  recordingLink?: string;
  qrCode?: string;
  attendanceRequired: boolean;
  materialsList?: string[];
  
  // Communication
  reminderSent: boolean;
  lastReminderDate?: Date;
  notificationSettings: {
    reminderTime: number; // minutes before event
    sendSMS: boolean;
    sendEmail: boolean;
    sendPush: boolean;
  };
  
  // Analytics and Feedback
  actualAttendance?: number;
  rating?: number;
  feedback?: {
    userId: string;
    rating: number;
    comment: string;
    createdAt: Date;
  }[];
  
  // Booking and Payment
  price?: number;
  currency: string;
  paymentRequired: boolean;
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded';
  
  // Metadata
  createdBy: string; // User ID
  lastModifiedBy: string; // User ID
  version: number;
  
  createdAt: Date;
  updatedAt: Date;
}

// Feedback Schema
const feedbackSchema = new Schema({
  userId: {
    type: String,
    // No ref - we use custom user IDs, not ObjectIds
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Recurring Pattern Schema
const recurringPatternSchema = new Schema<IRecurringPattern>({
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    required: true
  },
  interval: {
    type: Number,
    required: true,
    min: 1
  },
  endDate: {
    type: Date
  },
  daysOfWeek: [{
    type: Number,
    min: 0,
    max: 6
  }],
  exceptions: [{
    type: Date
  }]
});

// Notification Settings Schema
const notificationSettingsSchema = new Schema({
  reminderTime: {
    type: Number,
    default: 60, // 1 hour before
    min: 5
  },
  sendSMS: {
    type: Boolean,
    default: true
  },
  sendEmail: {
    type: Boolean,
    default: true
  },
  sendPush: {
    type: Boolean,
    default: true
  }
});

// Main Schedule Schema
const scheduleSchema = new Schema<ISchedule>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  courseId: {
    type: String
    // No ref - we use custom course IDs, not ObjectIds
  },
  cohortId: {
    type: String,
    index: true
    // No ref - we use custom cohort IDs, not ObjectIds
  },
  sessionId: {
    type: String,
    unique: true,
    sparse: true, // Allow null values but ensure uniqueness when present
    index: true
  },
  instructor: {
    type: String,
    // No ref - we use custom instructor IDs like "INSTR0003", not ObjectIds
    required: true
  },
  instructorName: {
    type: String,
    required: true
  },
  students: {
    type: Number,
    default: 0,
    min: 0
  },
  registeredStudents: [{
    type: String
    // No ref - we use custom student IDs, not ObjectIds
  }],
  maxCapacity: {
    type: Number,
    required: true,
    min: 1
  },
  waitlist: [{
    type: String
    // No ref - we use custom student IDs, not ObjectIds
  }],
  
  // Date and Time
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  duration: {
    type: Number,
    required: true,
    min: 15 // minimum 15 minutes
  },
  timeZone: {
    type: String,
    default: 'UTC'
  },
  
  // Location and Mode
  location: {
    type: String,
    trim: true
  },
  virtualClassroomUrl: {
    type: String,
    trim: true
  },
  mode: {
    type: String,
    enum: ['live', 'recorded', 'hybrid'],
    required: true
  },
  type: {
    type: String,
    enum: ['online', 'offline', 'hybrid'],
    required: true
  },
  
  // Categorization
  category: {
    type: String,
    enum: ['Fitness', 'Sports', 'Arts', 'Teaching', 'Other'],
    required: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Status and Lifecycle
  status: {
    type: String,
    enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled', 'Pending'],
    default: 'Upcoming'
  },
  isCancelled: {
    type: Boolean,
    default: false
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  cancellationDate: {
    type: Date
  },
  
  // Session Modifications - Using Mixed type to avoid validation issues
  modifications: {
    type: Schema.Types.Mixed,
    default: undefined // Don't create empty object
  },
  
  // Recurring Events
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: recurringPatternSchema,
  parentEventId: {
    type: String,
    ref: 'Schedule'
  },
  
  // Class Management
  joinLink: {
    type: String,
    trim: true
  },
  recordingLink: {
    type: String,
    trim: true
  },
  qrCode: {
    type: String,
    trim: true
  },
  attendanceRequired: {
    type: Boolean,
    default: true
  },
  materialsList: [{
    type: String,
    trim: true
  }],
  
  // Communication
  reminderSent: {
    type: Boolean,
    default: false
  },
  lastReminderDate: {
    type: Date
  },
  notificationSettings: {
    type: notificationSettingsSchema,
    default: () => ({})
  },
  
  // Analytics and Feedback
  actualAttendance: {
    type: Number,
    min: 0
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: [feedbackSchema],
  
  // Booking and Payment
  price: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  paymentRequired: {
    type: Boolean,
    default: false
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded']
  },
  
  // Metadata
  createdBy: {
    type: String,
    // No ref - we use custom user IDs or "System", not ObjectIds
    required: true
  },
  lastModifiedBy: {
    type: String,
    // No ref - we use custom user IDs or "System", not ObjectIds
    required: true
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Indexes
scheduleSchema.index({ instructor: 1 });
scheduleSchema.index({ date: 1 });
scheduleSchema.index({ startTime: 1 });
scheduleSchema.index({ endTime: 1 });
scheduleSchema.index({ status: 1 });
scheduleSchema.index({ category: 1 });
scheduleSchema.index({ courseId: 1 });
scheduleSchema.index({ registeredStudents: 1 });
scheduleSchema.index({ isRecurring: 1 });
scheduleSchema.index({ parentEventId: 1 });
scheduleSchema.index({ 'date': 1, 'startTime': 1 });
scheduleSchema.index({ 'instructor': 1, 'date': 1 });

// Virtual fields
scheduleSchema.virtual('availableSpots').get(function(this: ISchedule) {
  return this.maxCapacity - this.students;
});

scheduleSchema.virtual('isFullyBooked').get(function(this: ISchedule) {
  return this.students >= this.maxCapacity;
});

scheduleSchema.virtual('attendanceRate').get(function(this: ISchedule) {
  if (!this.actualAttendance || this.students === 0) return 0;
  return (this.actualAttendance / this.students) * 100;
});

scheduleSchema.virtual('averageRating').get(function(this: ISchedule) {
  if (!this.feedback || this.feedback.length === 0) return 0;
  const sum = this.feedback.reduce((acc, f) => acc + f.rating, 0);
  return sum / this.feedback.length;
});

// Methods
scheduleSchema.methods.toJSON = function() {
  const schedule = this.toObject({ virtuals: true });
  return schedule;
};

scheduleSchema.methods.addStudent = function(this: ISchedule, studentId: string) {
  if (this.students >= this.maxCapacity) {
    // Add to waitlist
    if (!this.waitlist.includes(studentId)) {
      this.waitlist.push(studentId);
    }
    return { success: false, waitlisted: true };
  } else {
    // Add to registered students
    if (!this.registeredStudents.includes(studentId)) {
      this.registeredStudents.push(studentId);
      this.students += 1;
    }
    return { success: true, waitlisted: false };
  }
};

scheduleSchema.methods.removeStudent = function(this: ISchedule, studentId: string) {
  const index = this.registeredStudents.indexOf(studentId);
  if (index > -1) {
    this.registeredStudents.splice(index, 1);
    this.students -= 1;
    
    // Move first waitlisted student to registered
    if (this.waitlist.length > 0) {
      const waitlistedStudent = this.waitlist.shift();
      if (waitlistedStudent) {
        this.registeredStudents.push(waitlistedStudent);
        this.students += 1;
      }
    }
    return true;
  }
  
  // Check waitlist
  const waitlistIndex = this.waitlist.indexOf(studentId);
  if (waitlistIndex > -1) {
    this.waitlist.splice(waitlistIndex, 1);
    return true;
  }
  
  return false;
};

// Static methods
scheduleSchema.statics.findUpcoming = function() {
  return this.find({
    date: { $gte: new Date() },
    status: { $in: ['Upcoming', 'Pending'] }
  }).sort({ date: 1, startTime: 1 });
};

scheduleSchema.statics.findByInstructor = function(instructorId: string) {
  return this.find({ instructor: instructorId }).sort({ date: -1 });
};

scheduleSchema.statics.findByStudent = function(studentId: string) {
  return this.find({
    $or: [
      { registeredStudents: studentId },
      { waitlist: studentId }
    ]
  }).sort({ date: 1 });
};

scheduleSchema.statics.findByDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: 1, startTime: 1 });
};

scheduleSchema.statics.findConflicts = function(instructorId: string, date: Date, startTime: string, endTime: string, excludeId?: string) {
  const query: any = {
    instructor: instructorId,
    date: date,
    status: { $nin: ['Cancelled', 'Completed'] },
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query);
};

// Pre-save middleware
scheduleSchema.pre('save', function(this: ISchedule, next) {
  // Validate time format
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(this.startTime) || !timeRegex.test(this.endTime)) {
    next(new Error('Invalid time format. Use HH:MM format.'));
  }
  
  // Ensure end time is after start time
  const start = new Date(`2000-01-01T${this.startTime}:00`);
  const end = new Date(`2000-01-01T${this.endTime}:00`);
  if (end <= start) {
    next(new Error('End time must be after start time'));
  }
  
  // Calculate duration
  const durationMs = end.getTime() - start.getTime();
  this.duration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
  
  // Set cancellation date if cancelled
  if (this.isCancelled && !this.cancellationDate) {
    this.cancellationDate = new Date();
  }
  
  // Update version
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  
  next();
});

// Post-save middleware for notifications
scheduleSchema.post('save', function(this: ISchedule) {
  // Here you could trigger notifications or other side effects
  console.log(`Schedule ${this.title} saved with status: ${this.status}`);
});

// Create and export the model
const Schedule: Model<ISchedule> = mongoose.models.Schedule || mongoose.model<ISchedule>('Schedule', scheduleSchema);

export default Schedule;
