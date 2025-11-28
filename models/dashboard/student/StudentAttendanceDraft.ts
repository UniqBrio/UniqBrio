import mongoose from 'mongoose';
import { tenantPlugin } from '@/lib/tenant/tenant-plugin';

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

// Apply tenant plugin for multi-tenancy support
StudentAttendanceDraftSchema.plugin(tenantPlugin);

// Index for efficient queries (tenant-scoped)
StudentAttendanceDraftSchema.index({ tenantId: 1, savedAt: -1 });
StudentAttendanceDraftSchema.index({ tenantId: 1, studentId: 1 });
StudentAttendanceDraftSchema.index({ tenantId: 1, date: -1 });

export default mongoose.models.StudentAttendanceDraft || mongoose.model('StudentAttendanceDraft', StudentAttendanceDraftSchema);