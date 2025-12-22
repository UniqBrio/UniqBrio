import mongoose, { Schema, Document, Model } from 'mongoose';
import { tenantPlugin } from '@/lib/tenant/tenant-plugin';

export interface IWhatsAppLog extends Document {
  tenantId: string;
  studentId: string;
  sessionId?: string;
  phone: string;
  status: 'SENT' | 'FAILED';
  providerMessageId?: string;
  errorMessage?: string;
  templateName: string;
  messageType: 'ATTENDANCE_PRESENT' | 'ATTENDANCE_ABSENT' | 'OTHER';
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppLogSchema = new Schema<IWhatsAppLog>(
  {
    studentId: {
      type: String,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    phone: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['SENT', 'FAILED'],
    },
    providerMessageId: {
      type: String,
    },
    errorMessage: {
      type: String,
    },
    templateName: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      required: true,
      enum: ['ATTENDANCE_PRESENT', 'ATTENDANCE_ABSENT', 'OTHER'],
      default: 'OTHER',
    },
  },
  {
    timestamps: true,
    collection: 'whatsapp_logs',
  }
);

// Apply tenant plugin for multi-tenancy support
WhatsAppLogSchema.plugin(tenantPlugin);

// Compound indexes for common queries (tenant-scoped)
WhatsAppLogSchema.index({ tenantId: 1, studentId: 1, createdAt: -1 });
WhatsAppLogSchema.index({ tenantId: 1, sessionId: 1 });
WhatsAppLogSchema.index({ tenantId: 1, status: 1 });
WhatsAppLogSchema.index({ tenantId: 1, createdAt: -1 });

export default (mongoose.models.WhatsAppLog as Model<IWhatsAppLog>) ||
  mongoose.model<IWhatsAppLog>('WhatsAppLog', WhatsAppLogSchema);
