import mongoose, { Document, Model, Schema } from 'mongoose';

// Cohort Interface - Inherits schedule from Course, adds specific timing
export interface ICohort extends Document {
  cohortId: string;
  name: string;
  courseId: string;  // References Course._id or Course.courseId
  
  // Course schedule is inherited, cohort adds specific timing details
  timeSlot: {
    startTime: string;  // "09:00" format
    endTime: string;    // "10:30" format
  };
  daysOfWeek: number[];  // [1, 3, 5] for Mon, Wed, Fri (0=Sunday, 1=Monday)
  
  // Cohort-specific details
  instructor?: string;     // Can override course instructor
  location?: string;       // Can override course location
  maxStudents: number;
  currentStudents: string[];  // Array of student IDs
  waitlist: string[];         // Array of student IDs on waitlist
  
  // Status and management
  status: "Active" | "Inactive" | "Cancelled" | "Completed";
  isDeleted?: boolean;
  deletedAt?: Date | null;
  registrationOpen: boolean;
  notes?: string;
  
  // Computed fields (populated from course)
  inheritedStartDate?: Date;  // Populated from course.schedulePeriod.startDate
  inheritedEndDate?: Date;    // Populated from course.schedulePeriod.endDate
  
  createdAt?: Date;
  updatedAt?: Date;
}

// Cohort Schema
const cohortSchema = new Schema<ICohort>({
  cohortId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  courseId: {
    type: String,
    required: true,
    trim: true
  },
  
  // Specific timing for this cohort
  timeSlot: {
    startTime: {
      type: String,
      required: true,
      validate: {
        validator: function(v: string) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Start time must be in HH:MM format (24-hour)'
      }
    },
    endTime: {
      type: String,
      required: true,
      validate: {
        validator: function(this: ICohort, v: string) {
          const startTime = this.timeSlot?.startTime;
          if (!startTime) return true;
          
          const start = new Date(`1970-01-01T${startTime}:00`);
          const end = new Date(`1970-01-01T${v}:00`);
          
          return end > start;
        },
        message: 'End time must be after start time'
      }
    }
  },
  
  daysOfWeek: [{
    type: Number,
    required: true,
    min: 0,  // Sunday
    max: 6   // Saturday
  }],
  
  // Cohort-specific overrides
  instructor: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  
  // Student management
  maxStudents: {
    type: Number,
    required: true,
    min: 1,
    max: 500
  },
  currentStudents: [{
    type: String,  // Student IDs
    trim: true
  }],
  waitlist: [{
    type: String,  // Student IDs
    trim: true
  }],
  
  // Status management
  status: {
    type: String,
    required: true,
    enum: ["Active", "Inactive", "Cancelled", "Completed"],
    default: "Active"
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  },
  registrationOpen: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  
  // Computed fields - these will be populated from the referenced course
  inheritedStartDate: {
    type: Date
  },
  inheritedEndDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
cohortSchema.index({ courseId: 1 });
cohortSchema.index({ status: 1 });
cohortSchema.index({ daysOfWeek: 1 });
cohortSchema.index({ 'timeSlot.startTime': 1 });
cohortSchema.index({ instructor: 1 });
cohortSchema.index({ registrationOpen: 1 });
cohortSchema.index({ createdAt: -1 });

// Virtual to check if cohort is full
cohortSchema.virtual('isFull').get(function() {
  return this.currentStudents.length >= this.maxStudents;
});

// Virtual to get available spots
cohortSchema.virtual('availableSpots').get(function() {
  return Math.max(0, this.maxStudents - this.currentStudents.length);
});

// Pre-save middleware to generate cohortId if not provided
cohortSchema.pre('save', function(next) {
  if (!this.cohortId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.cohortId = `CHT-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Static method to find cohorts by course
cohortSchema.statics.findByCourse = function(courseId: string) {
  return this.find({ courseId });
};

// Static method to find active cohorts
cohortSchema.statics.findActive = function() {
  return this.find({ status: 'Active', registrationOpen: true });
};

// Method to add student to cohort
cohortSchema.methods.addStudent = function(studentId: string) {
  if (this.isFull) {
    // Add to waitlist if cohort is full
    if (!this.waitlist.includes(studentId)) {
      this.waitlist.push(studentId);
    }
    return { success: false, message: 'Cohort is full, added to waitlist' };
  } else {
    // Add to current students
    if (!this.currentStudents.includes(studentId)) {
      this.currentStudents.push(studentId);
    }
    return { success: true, message: 'Student added successfully' };
  }
};

// Method to remove student from cohort
cohortSchema.methods.removeStudent = function(studentId: string) {
  this.currentStudents = this.currentStudents.filter((id: string) => id !== studentId);
  this.waitlist = this.waitlist.filter((id: string) => id !== studentId);
  
  // If there's space and someone on waitlist, move them to current students
  if (this.waitlist.length > 0 && !this.isFull) {
    const nextStudent = this.waitlist.shift();
    this.currentStudents.push(nextStudent);
  }
};

// Create and export the model
const Cohort: Model<ICohort> = mongoose.models.Cohort || mongoose.model<ICohort>('Cohort', cohortSchema);

export default Cohort;