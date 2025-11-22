import mongoose from 'mongoose';

const StudentAttendanceDraftSchema = new mongoose.Schema(
  {
    studentId: { 
      type: String,
      default: '(unspecified)'
    },
    studentName: { 
      type: String,
      default: '(unspecified)'
    },
    cohortId: { 
      type: String 
    },
    cohortName: { 
      type: String 
    },
    cohortInstructor: { 
      type: String 
    },
    cohortTiming: { 
      type: String 
    },
    courseId: { 
      type: String 
    },
    courseName: { 
      type: String 
    },
    date: { 
      type: String, // ISO date string (YYYY-MM-DD)
      required: true,
      default: () => new Date().toISOString().slice(0, 10)
    },
    startTime: { 
      type: String // HH:mm format
    },
    endTime: { 
      type: String // HH:mm format
    },
    status: { 
      type: String,
      enum: ['present', 'absent'],
      default: 'present'
    },
    notes: { 
      type: String 
    },
    savedAt: { 
      type: Date, 
      default: Date.now 
    }
  },
  { 
    timestamps: true,
    collection: 'studentattendancedrafts' // Explicit collection name
  }
);

// Index for efficient queries
StudentAttendanceDraftSchema.index({ savedAt: -1 });
StudentAttendanceDraftSchema.index({ studentId: 1 });
StudentAttendanceDraftSchema.index({ date: -1 });

export default mongoose.models.StudentAttendanceDraft || mongoose.model('StudentAttendanceDraft', StudentAttendanceDraftSchema);