import mongoose, { Schema, Model, Document } from 'mongoose';

export enum AuditAction {
  LOGIN = 'Login',
  LOGOUT = 'Logout',
  ADD = 'Add',
  UPDATE = 'Update',
  DELETE = 'Delete',
  VIEW = 'View',
  EXPORT = 'Export',
  IMPORT = 'Import',
}

export enum AuditModule {
  AUTHENTICATION = 'Authentication',
  STUDENTS = 'Students',
  COURSES = 'Courses',
  STAFF = 'Staff',
  PAYMENTS = 'Payments',
  SETTINGS = 'Settings',
  EVENTS = 'Events',
  COMMUNITY = 'Community',
  FINANCIALS = 'Financials',
  KYC = 'KYC',
  USERS = 'Users',
}

export interface IFieldChange {
  field: string;
  oldValue: string;
  newValue: string;
}

export interface IAuditLog extends Document {
  tenantId: string;
  module: AuditModule | string;
  action: AuditAction | string;
  timestamp: Date;
  previousValue?: string | null;
  currentValue?: string | null;
  changedBy: string; // User name or identifier
  changedById: string; // User ID
  role: string;
  ipAddress?: string;
  userAgent?: string;
  details: {
    fieldChanges?: IFieldChange[];
    metadata?: {
      sessionId?: string;
      requestId?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    tenantId: { 
      type: String, 
      required: true,
      index: true,
      default: 'default'
    },
    module: { 
      type: String, 
      required: true,
      index: true
    },
    action: { 
      type: String, 
      required: true,
      index: true
    },
    timestamp: { 
      type: Date, 
      default: Date.now,
      index: true
    },
    previousValue: { type: String },
    currentValue: { type: String },
    changedBy: { 
      type: String, 
      required: true,
      index: true
    },
    changedById: { 
      type: String, 
      required: true,
      index: true
    },
    role: { 
      type: String, 
      required: true,
      index: true
    },
    ipAddress: { type: String },
    userAgent: { type: String },
    details: {
      type: Schema.Types.Mixed,
      default: {}
    },
  },
  {
    timestamps: true,
    collection: 'AuditLogs',
  }
);

// Compound indexes for efficient queries
auditLogSchema.index({ tenantId: 1, timestamp: -1 });
auditLogSchema.index({ tenantId: 1, module: 1, action: 1 });
auditLogSchema.index({ tenantId: 1, changedById: 1, timestamp: -1 });
auditLogSchema.index({ tenantId: 1, role: 1, timestamp: -1 });

// Prevent model recompilation in development
const AuditLogModel: Model<IAuditLog> = 
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

export default AuditLogModel;
