import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import { tenantPlugin } from '@/lib/tenant/tenant-plugin';
import { createHash } from 'crypto';

/**
 * Cookie Preference Model with Tenant Isolation
 * GDPR / DPDP Compliant Cookie Consent Management
 * 
 * Security Rules:
 * - tenantId is ALWAYS required and derived from JWT
 * - Never trust tenantId from client input
 * - All queries MUST include { tenantId }
 */

export interface ICookiePreference extends Document {
  _id: Types.ObjectId;
  tenantId: string;              // REQUIRED - tenant isolation
  userId: string;                // User identifier
  essential: boolean;            // Always true - cannot be disabled
  analytics: boolean;            // Analytics cookies (Google Analytics, etc.)
  marketing: boolean;            // Marketing/advertising cookies
  policyVersion: string;         // Cookie policy version accepted
  acceptedAt: Date;              // When preferences were first set
  updatedAt: Date;               // Last update timestamp
  ipHash?: string;               // Hashed IP for audit trail (privacy-safe)
  userAgent?: string;            // Browser/device information
  
  // Instance methods
  hasConsent(category: 'essential' | 'analytics' | 'marketing'): boolean;
  updatePreferences(preferences: Partial<ICookiePreference>): Promise<this>;
}

const cookiePreferenceSchema = new Schema<ICookiePreference>(
  {
    tenantId: {
      type: String,
      required: true,
      // SECURITY: Always set from JWT, never from client
    },
    userId: {
      type: String,
      required: true,
    },
    essential: {
      type: Boolean,
      default: true,
      required: true,
      // Essential cookies cannot be disabled
      validate: {
        validator: (v: boolean) => v === true,
        message: 'Essential cookies must always be enabled'
      }
    },
    analytics: {
      type: Boolean,
      default: false,
      required: true,
    },
    marketing: {
      type: Boolean,
      default: false,
      required: true,
    },
    policyVersion: {
      type: String,
      required: true,
      default: '1.0',
      // Version of cookie policy user accepted
    },
    acceptedAt: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true,
      // First acceptance time - never changes
    },
    ipHash: {
      type: String,
      // Hashed IP for compliance audit trail
      // Never store raw IP - privacy by design
    },
    userAgent: {
      type: String,
      // Store for compliance records
    },
  },
  {
    timestamps: true,
    collection: 'cookie_preferences',
  }
);

// Apply tenant plugin for automatic tenant isolation
// Note: tenantPlugin already adds { tenantId: 1, updatedAt: -1 } and { tenantId: 1, createdAt: -1 }
cookiePreferenceSchema.plugin(tenantPlugin);

// Compound indexes for efficient queries
cookiePreferenceSchema.index({ tenantId: 1, userId: 1 }, { unique: true });
// Removed duplicate: cookiePreferenceSchema.index({ tenantId: 1, updatedAt: -1 }); - already in tenantPlugin
cookiePreferenceSchema.index({ tenantId: 1, analytics: 1 });
cookiePreferenceSchema.index({ tenantId: 1, marketing: 1 });

// Instance Methods

/**
 * Check if user has consented to a specific cookie category
 */
cookiePreferenceSchema.methods.hasConsent = function(
  category: 'essential' | 'analytics' | 'marketing'
): boolean {
  if (category === 'essential') {
    return true; // Essential cookies always allowed
  }
  return this[category] === true;
};

/**
 * Update user's cookie preferences
 */
cookiePreferenceSchema.methods.updatePreferences = function(
  preferences: Partial<ICookiePreference>
) {
  // Essential cannot be disabled
  if ('essential' in preferences && preferences.essential === false) {
    throw new Error('Essential cookies cannot be disabled');
  }

  if ('analytics' in preferences) {
    this.analytics = preferences.analytics!;
  }

  if ('marketing' in preferences) {
    this.marketing = preferences.marketing!;
  }

  if ('policyVersion' in preferences) {
    this.policyVersion = preferences.policyVersion!;
  }

  return this.save();
};

// Static Methods Interface
interface ICookiePreferenceModel extends Model<ICookiePreference> {
  findByUser(userId: string, tenantId: string): ReturnType<Model<ICookiePreference>['findOne']>;
  getUserPreferences(userId: string, tenantId: string): Promise<ICookiePreference | null>;
  setUserPreferences(
    userId: string,
    tenantId: string,
    preferences: {
      analytics: boolean;
      marketing: boolean;
      policyVersion?: string;
      ipHash?: string;
      userAgent?: string;
    }
  ): Promise<ICookiePreference>;
  hasUserConsent(
    userId: string,
    tenantId: string,
    category: 'essential' | 'analytics' | 'marketing'
  ): Promise<boolean>;
  getComplianceReport(tenantId: string): Promise<any>;
}

// Static Methods

/**
 * Find preferences by user and tenant
 * SECURITY: Always requires tenantId
 */
cookiePreferenceSchema.statics.findByUser = function(userId: string, tenantId: string) {
  return this.findOne({ userId, tenantId });
};

/**
 * Get user's cookie preferences
 * Returns null if no preferences set (user hasn't chosen yet)
 */
cookiePreferenceSchema.statics.getUserPreferences = async function(
  userId: string,
  tenantId: string
): Promise<ICookiePreference | null> {
  return this.findOne({ userId, tenantId });
};

/**
 * Set or update user's cookie preferences
 * Creates new record if doesn't exist, updates if exists
 */
cookiePreferenceSchema.statics.setUserPreferences = async function(
  userId: string,
  tenantId: string,
  preferences: {
    analytics: boolean;
    marketing: boolean;
    policyVersion?: string;
    ipHash?: string;
    userAgent?: string;
  }
): Promise<ICookiePreference> {
  const existing = await this.findOne({ userId, tenantId });

  if (existing) {
    // Update existing preferences
    existing.analytics = preferences.analytics;
    existing.marketing = preferences.marketing;
    if (preferences.policyVersion) {
      existing.policyVersion = preferences.policyVersion;
    }
    if (preferences.ipHash) {
      existing.ipHash = preferences.ipHash;
    }
    if (preferences.userAgent) {
      existing.userAgent = preferences.userAgent;
    }
    return existing.save();
  }

  // Create new preferences
  return this.create({
    tenantId,
    userId,
    essential: true,
    analytics: preferences.analytics,
    marketing: preferences.marketing,
    policyVersion: preferences.policyVersion || '1.0',
    acceptedAt: new Date(),
    ipHash: preferences.ipHash,
    userAgent: preferences.userAgent,
  });
};

/**
 * Check if user has consented to a specific category
 * SECURITY: Always requires tenantId
 */
cookiePreferenceSchema.statics.hasUserConsent = async function(
  userId: string,
  tenantId: string,
  category: 'essential' | 'analytics' | 'marketing'
): Promise<boolean> {
  if (category === 'essential') {
    return true; // Essential always allowed
  }

  const preferences = await this.findOne({ userId, tenantId });
  
  if (!preferences) {
    return false; // No consent if no preferences set
  }

  return preferences[category] === true;
};

/**
 * Get compliance report for a tenant
 * Shows consent statistics for admin panel
 */
cookiePreferenceSchema.statics.getComplianceReport = async function(
  tenantId: string
): Promise<any> {
  const [
    totalUsers,
    analyticsConsent,
    marketingConsent,
    bothConsent,
    recentChanges
  ] = await Promise.all([
    this.countDocuments({ tenantId }),
    this.countDocuments({ tenantId, analytics: true }),
    this.countDocuments({ tenantId, marketing: true }),
    this.countDocuments({ tenantId, analytics: true, marketing: true }),
    this.find({ tenantId })
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean()
  ]);

  return {
    totalUsers,
    analyticsConsent,
    marketingConsent,
    bothConsent,
    analyticsConsentRate: totalUsers > 0 ? (analyticsConsent / totalUsers) * 100 : 0,
    marketingConsentRate: totalUsers > 0 ? (marketingConsent / totalUsers) * 100 : 0,
    recentChanges
  };
};

/**
 * Hash IP address for privacy-safe audit trail
 * GDPR Article 32: Pseudonymization
 */
export function hashIP(ip: string, salt: string = process.env.IP_HASH_SALT || 'default-salt'): string {
  return createHash('sha256')
    .update(ip + salt)
    .digest('hex')
    .substring(0, 16);
}

const CookiePreference = (mongoose.models.CookiePreference || 
  mongoose.model<ICookiePreference, ICookiePreferenceModel>('CookiePreference', cookiePreferenceSchema)
) as ICookiePreferenceModel;

export default CookiePreference;
export type { ICookiePreferenceModel };
