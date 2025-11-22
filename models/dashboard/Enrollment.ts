import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * @deprecated This Enrollment model is being phased out in favor of bidirectional
 * student-cohort relationships. Use the functions in lib/studentCohortSync.ts instead.
 * 
 * Migration Status: 
 * - ✅ Student-cohort bidirectional sync implemented
 * - ✅ Enrollment calculations moved to studentCohortSync.ts  
 * - ✅ API endpoints updated to use cohort-based data
 * - 🔄 This model will be removed in future version
 * 
 * Use Instead:
 * - getCourseEnrollments() for course enrollment data
 * - getStudentEnrollments() for student enrollment data  
 * - addStudentToCohort() / removeStudentFromCohort() for enrollment changes
 */

// Progress Tracking Interface
export interface ILessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: Date;
  timeSpent: number; // in minutes
  lastAccessedAt: Date;
  progress: number; // percentage 0-100
}

export interface IModuleProgress {
  moduleId: string;
  completed: boolean;
  completedAt?: Date;
  lessons: ILessonProgress[];
  progress: number; // percentage 0-100
}

// Assignment Interface
export interface IAssignment {
  assignmentId: string;
  title: string;
  description: string;
  dueDate: Date;
  submitted: boolean;
  submittedAt?: Date;
  grade?: number;
  feedback?: string;
  attachments?: string[];
}

// Enrollment Interface
export interface IEnrollment extends Document {
  _id: string;
  studentId: string; // User ID
  studentName: string;
  courseId: string; // Course ID
  courseName: string;
  instructorId: string; // User ID
  instructorName: string;
  
  // Enrollment Details
  enrollmentDate: Date;
  startDate: Date;
  expectedCompletionDate: Date;
  actualCompletionDate?: Date;
  
  // Status and Progress
  status: 'Active' | 'Completed' | 'Dropped' | 'Suspended' | 'Pending';
  progress: number; // Overall progress percentage 0-100
  completionRate: number; // Percentage of course completed
  
  // Progress Tracking
  modules: IModuleProgress[];
  totalTimeSpent: number; // in minutes
  lastAccessedAt: Date;
  
  // Assignments and Assessments
  assignments: IAssignment[];
  averageGrade?: number;
  
  // Attendance
  scheduledSessions: number;
  attendedSessions: number;
  attendanceRate: number; // percentage
  missedSessions: {
    scheduleId: string;
    date: Date;
    reason?: string;
  }[];
  
  // Payment and Billing
  paymentStatus: 'Pending' | 'Paid' | 'Partial' | 'Overdue' | 'Refunded';
  totalAmount: number;
  paidAmount: number;
  currency: string;
  paymentDate?: Date;
  paymentMethod?: string;
  transactionId?: string;
  
  // Certificates and Achievements
  certificateIssued: boolean;
  certificateUrl?: string;
  certificateIssuedAt?: Date;
  achievements: string[];
  badges: string[];
  
  // Feedback and Rating
  studentRating?: number; // Student's rating of the course
  studentFeedback?: string;
  instructorRating?: number; // Instructor's rating of the student
  instructorFeedback?: string;
  
  // Communication
  notifications: {
    type: string;
    message: string;
    read: boolean;
    createdAt: Date;
  }[];
  
  // Preferences
  reminderSettings: {
    classReminders: boolean;
    assignmentReminders: boolean;
    progressUpdates: boolean;
    reminderTime: number; // minutes before
  };
  
  // Metadata
  enrollmentSource: 'Website' | 'Mobile App' | 'Admin' | 'Import' | 'Other';
  referralCode?: string;
  discountApplied?: {
    code: string;
    amount: number;
    type: 'Percentage' | 'Fixed';
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Lesson Progress Schema
const lessonProgressSchema = new Schema<ILessonProgress>({
  lessonId: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  timeSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
});

// Module Progress Schema
const moduleProgressSchema = new Schema<IModuleProgress>({
  moduleId: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  lessons: [lessonProgressSchema],
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
});

// Assignment Schema
const assignmentSchema = new Schema<IAssignment>({
  assignmentId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  submitted: {
    type: Boolean,
    default: false
  },
  submittedAt: {
    type: Date
  },
  grade: {
    type: Number,
    min: 0,
    max: 100
  },
  feedback: {
    type: String
  },
  attachments: [{
    type: String
  }]
});

// Missed Session Schema
const missedSessionSchema = new Schema({
  scheduleId: {
    type: String,
    ref: 'Schedule',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  reason: {
    type: String
  }
});

// Notification Schema
const notificationSchema = new Schema({
  type: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Reminder Settings Schema
const reminderSettingsSchema = new Schema({
  classReminders: {
    type: Boolean,
    default: true
  },
  assignmentReminders: {
    type: Boolean,
    default: true
  },
  progressUpdates: {
    type: Boolean,
    default: true
  },
  reminderTime: {
    type: Number,
    default: 60, // 1 hour before
    min: 5
  }
});

// Discount Schema
const discountSchema = new Schema({
  code: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ['Percentage', 'Fixed'],
    required: true
  }
});

// Main Enrollment Schema
const enrollmentSchema = new Schema<IEnrollment>({
  studentId: {
    type: String,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  courseId: {
    type: String,
    ref: 'Course',
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  instructorId: {
    type: String,
    ref: 'User',
    required: true
  },
  instructorName: {
    type: String,
    required: true
  },
  
  // Enrollment Details
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  startDate: {
    type: Date,
    required: true
  },
  expectedCompletionDate: {
    type: Date,
    required: true
  },
  actualCompletionDate: {
    type: Date
  },
  
  // Status and Progress
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Dropped', 'Suspended', 'Pending'],
    default: 'Pending'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Progress Tracking
  modules: [moduleProgressSchema],
  totalTimeSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  
  // Assignments and Assessments
  assignments: [assignmentSchema],
  averageGrade: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // Attendance
  scheduledSessions: {
    type: Number,
    default: 0,
    min: 0
  },
  attendedSessions: {
    type: Number,
    default: 0,
    min: 0
  },
  attendanceRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  missedSessions: [missedSessionSchema],
  
  // Payment and Billing
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Partial', 'Overdue', 'Refunded'],
    default: 'Pending'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  paymentDate: {
    type: Date
  },
  paymentMethod: {
    type: String
  },
  transactionId: {
    type: String
  },
  
  // Certificates and Achievements
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateUrl: {
    type: String
  },
  certificateIssuedAt: {
    type: Date
  },
  achievements: [{
    type: String
  }],
  badges: [{
    type: String
  }],
  
  // Feedback and Rating
  studentRating: {
    type: Number,
    min: 1,
    max: 5
  },
  studentFeedback: {
    type: String,
    maxlength: 1000
  },
  instructorRating: {
    type: Number,
    min: 1,
    max: 5
  },
  instructorFeedback: {
    type: String,
    maxlength: 1000
  },
  
  // Communication
  notifications: [notificationSchema],
  
  // Preferences
  reminderSettings: {
    type: reminderSettingsSchema,
    default: () => ({})
  },
  
  // Metadata
  enrollmentSource: {
    type: String,
    enum: ['Website', 'Mobile App', 'Admin', 'Import', 'Other'],
    default: 'Website'
  },
  referralCode: {
    type: String
  },
  discountApplied: discountSchema
}, {
  timestamps: true
});

// Indexes
enrollmentSchema.index({ studentId: 1 });
enrollmentSchema.index({ courseId: 1 });
enrollmentSchema.index({ instructorId: 1 });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ enrollmentDate: 1 });
enrollmentSchema.index({ paymentStatus: 1 });
enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

// Virtual fields
enrollmentSchema.virtual('isCompleted').get(function(this: IEnrollment) {
  return this.status === 'Completed' || this.completionRate >= 100;
});

enrollmentSchema.virtual('remainingAmount').get(function(this: IEnrollment) {
  return this.totalAmount - this.paidAmount;
});

enrollmentSchema.virtual('daysEnrolled').get(function(this: IEnrollment) {
  return Math.floor((Date.now() - this.enrollmentDate.getTime()) / (1000 * 60 * 60 * 24));
});

enrollmentSchema.virtual('averageSessionAttendance').get(function(this: IEnrollment) {
  if (this.scheduledSessions === 0) return 0;
  return (this.attendedSessions / this.scheduledSessions) * 100;
});

// Methods
enrollmentSchema.methods.toJSON = function() {
  const enrollment = this.toObject({ virtuals: true });
  return enrollment;
};

enrollmentSchema.methods.updateProgress = function(this: IEnrollment) {
  if (this.modules.length === 0) {
    this.progress = 0;
    return this.progress;
  }

  const totalProgress = this.modules.reduce((sum, module) => sum + module.progress, 0);
  this.progress = Math.round(totalProgress / this.modules.length);
  
  // Update completion rate
  const completedModules = this.modules.filter(module => module.completed).length;
  this.completionRate = Math.round((completedModules / this.modules.length) * 100);
  
  // Auto-complete if 100% progress
  if (this.progress >= 100 && this.status === 'Active') {
    this.status = 'Completed';
    this.actualCompletionDate = new Date();
  }
  
  return this.progress;
};

enrollmentSchema.methods.addNotification = function(this: IEnrollment, type: string, message: string) {
  this.notifications.push({
    type,
    message,
    read: false,
    createdAt: new Date()
  });
};

enrollmentSchema.methods.markAsssignmentComplete = function(this: IEnrollment, assignmentId: string, grade?: number, feedback?: string) {
  const assignment = this.assignments.find(a => a.assignmentId === assignmentId);
  if (assignment) {
    assignment.submitted = true;
    assignment.submittedAt = new Date();
    if (grade !== undefined) assignment.grade = grade;
    if (feedback) assignment.feedback = feedback;
    
    // Recalculate average grade
    const gradedAssignments = this.assignments.filter(a => a.grade !== undefined);
    if (gradedAssignments.length > 0) {
      const totalGrade = gradedAssignments.reduce((sum, a) => sum + (a.grade || 0), 0);
      this.averageGrade = Math.round(totalGrade / gradedAssignments.length);
    }
  }
};

// Static methods
enrollmentSchema.statics.findByStudent = function(studentId: string) {
  return this.find({ studentId }).sort({ enrollmentDate: -1 });
};

enrollmentSchema.statics.findByCourse = function(courseId: string) {
  return this.find({ courseId }).sort({ enrollmentDate: -1 });
};

enrollmentSchema.statics.findByInstructor = function(instructorId: string) {
  return this.find({ instructorId }).sort({ enrollmentDate: -1 });
};

enrollmentSchema.statics.findActive = function() {
  return this.find({ status: 'Active' });
};

enrollmentSchema.statics.findPendingPayments = function() {
  return this.find({ paymentStatus: { $in: ['Pending', 'Partial', 'Overdue'] } });
};

enrollmentSchema.statics.getEnrollmentStats = function(dateFrom: Date, dateTo: Date) {
  return this.aggregate([
    {
      $match: {
        enrollmentDate: {
          $gte: dateFrom,
          $lte: dateTo
        }
      }
    },
    {
      $group: {
        _id: null,
        totalEnrollments: { $sum: 1 },
        activeEnrollments: {
          $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
        },
        completedEnrollments: {
          $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
        },
        averageProgress: { $avg: '$progress' },
        totalRevenue: { $sum: '$paidAmount' }
      }
    }
  ]);
};

// Pre-save middleware
enrollmentSchema.pre('save', function(this: IEnrollment, next) {
  // Calculate attendance rate
  if (this.scheduledSessions > 0) {
    this.attendanceRate = Math.round((this.attendedSessions / this.scheduledSessions) * 100);
  }
  
  next();
});

// Create and export the model
const Enrollment: Model<IEnrollment> = mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);

export default Enrollment;
