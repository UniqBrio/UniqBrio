import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import { tenantPlugin } from '@/lib/tenant/tenant-plugin';

/**
 * Server-side session store for JWT-based authentication
 * Works alongside JWT tokens to provide server-side session management
 * Enables logout, revocation, and tenant isolation
 */
export interface ISession extends Document {
  _id: Types.ObjectId;
  tenantId: string;          // REQUIRED - tenant isolation (comes from JWT)
  userId: string;            // User identifier from JWT
  jwtId: string;             // Unique identifier for the JWT (jti claim or hash)
  issuedAt: Date;           // When the session was created
  expiresAt: Date;          // When the session expires
  lastActiveAt: Date;       // Last time session was used
  isRevoked: boolean;       // Whether session has been revoked
  revokedAt?: Date;         // When session was revoked (if applicable)
  revokedBy?: string;       // Who revoked the session (for admin revocations)
  revokedReason?: string;   // Reason for revocation
  userAgent?: string;       // Browser/client information
  ipAddress?: string;       // IP address of the session
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  revoke(reason?: string, revokedBy?: string): Promise<this>;
  updateActivity(): Promise<this>;
  isValid(): boolean;
}

const sessionSchema = new Schema<ISession>(
  {
    tenantId: {
      type: String,
      required: true,
      // Tenant ID must always be present for security
    },
    userId: {
      type: String,
      required: true,
    },
    jwtId: {
      type: String,
      required: true,
      unique: true,
      // Unique identifier linking JWT to this session record
    },
    issuedAt: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    lastActiveAt: {
      type: Date,
      required: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    revokedAt: {
      type: Date,
    },
    revokedBy: {
      type: String,
      // User ID of who performed the revocation
    },
    revokedReason: {
      type: String,
      enum: ['logout', 'admin_revoke', 'security_breach', 'password_change', 'account_disabled'],
    },
    userAgent: {
      type: String,
      // Store for security audit purposes
    },
    ipAddress: {
      type: String,
      // Store for security audit purposes
    },
  },
  {
    timestamps: true,
    collection: "sessions",
  }
);

// Apply tenant plugin for automatic tenant isolation
sessionSchema.plugin(tenantPlugin);

// Compound indexes for efficient queries
sessionSchema.index({ tenantId: 1, userId: 1, isRevoked: 1 });
sessionSchema.index({ tenantId: 1, jwtId: 1, isRevoked: 1 });
sessionSchema.index({ tenantId: 1, userId: 1, lastActiveAt: -1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic cleanup

// Methods for session operations
sessionSchema.methods.revoke = function(reason: string = 'logout', revokedBy?: string) {
  this.isRevoked = true;
  this.revokedAt = new Date();
  this.revokedReason = reason;
  if (revokedBy) {
    this.revokedBy = revokedBy;
  }
  return this.save();
};

sessionSchema.methods.updateActivity = function() {
  this.lastActiveAt = new Date();
  return this.save();
};

sessionSchema.methods.isValid = function(): boolean {
  return !this.isRevoked && this.expiresAt > new Date();
};

// Define interface for static methods
interface ISessionModel extends Model<ISession> {
  findByJwtId(jwtId: string, tenantId: string): ReturnType<Model<ISession>['findOne']>;
  revokeAllUserSessions(userId: string, tenantId: string, reason?: string, revokedBy?: string): ReturnType<Model<ISession>['updateMany']>;
  cleanupExpiredSessions(): ReturnType<Model<ISession>['deleteMany']>;
  getActiveSessions(userId: string, tenantId: string): ReturnType<Model<ISession>['find']>;
}

// Static methods for session management
sessionSchema.statics.findByJwtId = function(jwtId: string, tenantId: string) {
  return this.findOne({ jwtId, tenantId, isRevoked: false });
};

sessionSchema.statics.revokeAllUserSessions = async function(userId: string, tenantId: string, reason: string = 'logout_all', revokedBy?: string) {
  const now = new Date();
  return this.updateMany(
    { 
      userId, 
      tenantId, 
      isRevoked: false 
    },
    {
      $set: {
        isRevoked: true,
        revokedAt: now,
        revokedReason: reason,
        ...(revokedBy && { revokedBy }),
      }
    }
  );
};

sessionSchema.statics.cleanupExpiredSessions = async function() {
  const now = new Date();
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: now } },
      { isRevoked: true, revokedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Remove revoked sessions after 24h
    ]
  });
};

sessionSchema.statics.getActiveSessions = function(userId: string, tenantId: string) {
  return this.find({
    userId,
    tenantId,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  }).sort({ lastActiveAt: -1 });
};

const Session = (mongoose.models.Session || mongoose.model<ISession, ISessionModel>("Session", sessionSchema)) as ISessionModel;

export default Session;
export type { ISessionModel };