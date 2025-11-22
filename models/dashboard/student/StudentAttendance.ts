import mongoose from 'mongoose';

const StudentAttendanceSchema = new mongoose.Schema(
  {
    studentId: { 
      type: String, 
      required: true,
      index: true 
    },
    studentName: { 
      type: String, 
      required: true 
    },
    cohortId: { 
      type: String,
      index: true 
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
      index: true 
    },
    startTime: { 
      type: String // HH:mm format
    },
    endTime: { 
      type: String // HH:mm format
    },
    status: { 
      type: String, 
      required: true,
      enum: ['present', 'absent'],
      default: 'present'
    },
    notes: { 
      type: String 
    }
  },
  { 
    timestamps: true,
    collection: 'studentattendance' // Explicit collection name
  }
);

// Compound indexes for common queries
StudentAttendanceSchema.index({ studentId: 1, date: -1 });
StudentAttendanceSchema.index({ cohortId: 1, date: -1 });
StudentAttendanceSchema.index({ date: -1 });
StudentAttendanceSchema.index({ status: 1 });

export default mongoose.models.StudentAttendance || mongoose.model('StudentAttendance', StudentAttendanceSchema);