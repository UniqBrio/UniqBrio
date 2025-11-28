import mongoose from 'mongoose';
import { tenantPlugin } from '@/lib/tenant/tenant-plugin';

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

// Apply tenant plugin for multi-tenancy support
StudentAttendanceSchema.plugin(tenantPlugin);

// Compound indexes for common queries (tenant-scoped)
StudentAttendanceSchema.index({ tenantId: 1, studentId: 1, date: -1 });
StudentAttendanceSchema.index({ tenantId: 1, cohortId: 1, date: -1 });
StudentAttendanceSchema.index({ tenantId: 1, date: -1 });
StudentAttendanceSchema.index({ tenantId: 1, status: 1 });

export default mongoose.models.StudentAttendance || mongoose.model('StudentAttendance', StudentAttendanceSchema);