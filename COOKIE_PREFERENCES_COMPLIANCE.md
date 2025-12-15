# Cookie Preferences System - GDPR/DPDP Compliance Documentation

## Overview

This document describes the tenant-isolated cookie preference system implemented for UniqBrio, ensuring full compliance with GDPR (EU) and DPDP (India) regulations.

## Architecture

### 1. Data Storage

#### MongoDB Schema (`models/CookiePreference.ts`)
```typescript
{
  _id: ObjectId,
  tenantId: string,        // REQUIRED - tenant isolation
  userId: string,          // User identifier
  essential: boolean,      // Always true
  analytics: boolean,      // User's choice
  marketing: boolean,      // User's choice
  policyVersion: string,   // Version tracking
  acceptedAt: Date,        // Initial consent timestamp
  updatedAt: Date,         // Last modification
  ipHash: string,          // Pseudonymized IP (privacy-safe)
  userAgent: string        // Browser/device info
}
```

#### Indexes
- `{ tenantId: 1, userId: 1 }` - Unique compound index
- `{ tenantId: 1, updatedAt: -1 }` - Query optimization
- `{ tenantId: 1, analytics: 1 }` - Consent filtering
- `{ tenantId: 1, marketing: 1 }` - Consent filtering

### 2. Security Rules

#### Tenant Isolation
- ✅ `tenantId` is **ALWAYS** required in MongoDB schema
- ✅ `tenantId` is **NEVER** accepted from client input
- ✅ `tenantId` is **ALWAYS** derived from verified JWT
- ✅ All queries **MUST** include `{ tenantId }` filter
- ✅ Tenant plugin ensures automatic isolation

#### Authentication
- All API endpoints require valid JWT authentication
- JWT payload provides `tenantId` (never trust client)
- HttpOnly cookies prevent XSS attacks
- Secure flag ensures HTTPS-only transmission

### 3. Storage Strategy

#### Anonymous Users
- Preferences stored in **localStorage** as JSON
- Key: `ub_cookie_preferences`
- No server communication until login
- Client-side enforcement only

#### Authenticated Users
- Preferences stored in **MongoDB**
- Tenant-isolated collection: `cookie_preferences`
- Server-side enforcement enabled
- Sync from localStorage on first login

#### Sync Logic (Post-Login)
1. User logs in successfully
2. System checks for localStorage preferences
3. If found AND user has no MongoDB preferences:
   - Sync localStorage → MongoDB
   - Clear localStorage
4. Fetch user's MongoDB preferences
5. Emit `cookiePreferencesLoaded` event

## GDPR Compliance

### Article 4(11) - Consent Definition
✅ **Freely given**: Users can choose individual categories (analytics, marketing)  
✅ **Specific**: Separate toggles for each cookie category  
✅ **Informed**: Clear descriptions of each category's purpose  
✅ **Unambiguous**: Explicit checkbox actions (no pre-checked boxes for non-essential)

### Article 7 - Conditions for Consent
✅ **Burden of proof**: All consents timestamped with `acceptedAt` and `updatedAt`  
✅ **Withdrawal**: Users can revoke consent anytime via Settings → Privacy  
✅ **Easy withdrawal**: Same UI for granting and withdrawing consent  
✅ **No detriment**: Essential functionality works regardless of analytics/marketing choices

### Article 13/14 - Information Requirements
✅ **Identity**: UniqBrio clearly identified in UI  
✅ **Purpose**: Each cookie category has clear purpose description  
✅ **Legal basis**: Consent for analytics/marketing, legitimate interest for essential  
✅ **Recipients**: No third-party sharing without explicit marketing consent  
✅ **Retention**: Documented retention policy (see below)

### Article 15 - Right of Access
✅ Users can view their preferences: Settings → Privacy → Cookie Preferences  
✅ Shows current state (analytics: on/off, marketing: on/off)  
✅ Shows policy version and last update timestamp

### Article 17 - Right to Erasure
✅ Users can withdraw all consent (disable analytics/marketing)  
✅ Account deletion removes all cookie preference data  
✅ Data deleted within 30 days of account deletion

### Article 25 - Data Protection by Design
✅ **Privacy by Default**: Analytics and marketing disabled by default  
✅ **Pseudonymization**: IP addresses hashed (SHA-256) before storage  
✅ **Minimization**: Only necessary data collected (no raw IPs)  
✅ **Integrity**: Tenant isolation prevents cross-contamination

### Article 32 - Security of Processing
✅ **Encryption**: HTTPS enforces encryption in transit  
✅ **Pseudonymization**: IP hashing with salted one-way function  
✅ **Access Control**: JWT authentication + role-based access (ubadmin only)  
✅ **Audit Trail**: All changes logged with timestamps

## DPDP (India) Compliance

### Section 6 - Notice
✅ Users informed about cookie usage before consent  
✅ Purpose of each category clearly described  
✅ Available in English (primary language)

### Section 7 - Consent
✅ **Free consent**: No service denial for analytics/marketing refusal  
✅ **Specific**: Granular control per category  
✅ **Informed**: Clear descriptions provided  
✅ **Unambiguous**: Explicit toggle actions  
✅ **Verifiable**: Stored with timestamps

### Section 8 - Withdrawal
✅ Withdrawal is as easy as giving consent  
✅ Same UI for both actions  
✅ Immediate effect (enforced on next request)

### Section 12 - Technical and Organizational Measures
✅ Tenant isolation ensures data security  
✅ Access controls limit admin access  
✅ Audit trails for compliance monitoring  
✅ Regular security reviews

## Enforcement Logic

### Client-Side (`lib/cookie-consent.ts`)
```typescript
// Check localStorage for anonymous users
hasLocalConsent('analytics') → boolean

// Block scripts conditionally
shouldLoadAnalytics() → boolean
shouldLoadMarketing() → boolean
```

### Server-Side
```typescript
// Require tenantId from JWT
hasConsent(tenantId, userId, 'analytics') → Promise<boolean>

// Example usage in middleware
if (await hasConsent(tenantId, userId, 'analytics')) {
  // Load analytics scripts
}
```

### Essential Cookies
- **Always enabled** - cannot be disabled
- Required for:
  - Authentication (JWT tokens)
  - Session management
  - Security (CSRF protection)
  - Core functionality

## User Interface

### User Dashboard
**Path**: Settings → Privacy → Cookie Preferences

**Features**:
- Toggle analytics cookies (default: OFF)
- Toggle marketing cookies (default: OFF)
- Essential cookies indicator (always ON, greyed out)
- Policy version display
- Last updated timestamp
- Save button with confirmation

### Admin Panel
**Path**: UBAdmin → Cookies Tab

**Features** (ubadmin only):
- Global statistics (total users, consent rates)
- Per-tenant compliance reports
- Analytics consent percentage
- Marketing consent percentage
- Recent preference changes
- Tenant-scoped filtering
- Export capabilities (via API)

## Data Retention Policy

### Active Accounts
- Cookie preferences retained indefinitely while account is active
- Users can modify preferences at any time
- Audit trail maintained for compliance

### Account Deletion
- Cookie preference data deleted within **30 days**
- Linked sessions immediately revoked
- Audit logs retained for **3 years** (compliance requirement)

### IP Addresses
- **Never stored in raw form**
- Always pseudonymized via SHA-256 hash with salt
- Hash is one-way (cannot be reversed)
- Used only for audit trail and compliance

### Audit Trail Retention
- Preference change events: **3 years**
- Consent timestamps: **3 years**
- Withdrawal events: **3 years**
- Required for GDPR Article 7(1) burden of proof

## User Rights

### Right to Access (GDPR Art. 15)
- View current preferences: Settings → Privacy
- Download data export: (implement via API if needed)

### Right to Rectification (GDPR Art. 16)
- Modify preferences: Settings → Privacy → Update toggles

### Right to Erasure (GDPR Art. 17)
- Withdraw all consent: Settings → Privacy → Disable all
- Delete account: Account deletion removes all data

### Right to Data Portability (GDPR Art. 20)
- Export preferences via API (JSON format)
- Structured, machine-readable format

### Right to Object (GDPR Art. 21)
- Users can object to analytics processing
- Users can object to marketing processing
- Essential cookies cannot be objected to (legitimate interest)

## API Endpoints

### User Endpoints

#### `GET /api/cookie-preferences`
- **Auth**: Required (JWT)
- **Returns**: User's current preferences
- **Tenant**: Automatically from JWT

#### `POST /api/cookie-preferences`
- **Auth**: Required (JWT)
- **Body**: `{ preferences: { analytics: bool, marketing: bool } }`
- **Action**: Set/update preferences
- **Tenant**: Automatically from JWT

#### `POST /api/cookie-preferences/sync`
- **Auth**: Required (JWT)
- **Body**: `{ preferences: CookiePreferences }`
- **Action**: Sync localStorage → MongoDB after login
- **Tenant**: Automatically from JWT

### Admin Endpoints (ubadmin only)

#### `GET /api/admin-cookie-compliance?action=stats`
- **Returns**: Global statistics + per-tenant breakdown

#### `GET /api/admin-cookie-compliance?action=tenant-report&tenantId=X`
- **Returns**: Detailed compliance report for tenant

#### `GET /api/admin-cookie-compliance?action=list&tenantId=X`
- **Returns**: Paginated list of all preferences

## Compliance Checklist

### GDPR
- [x] Lawful basis for processing (consent + legitimate interest)
- [x] Transparent information provided
- [x] User consent obtained before non-essential cookies
- [x] Consent can be withdrawn easily
- [x] Right to access implemented
- [x] Right to erasure implemented
- [x] Right to data portability prepared
- [x] Data protection by design and by default
- [x] Security measures implemented
- [x] Records of processing activities maintained
- [x] Pseudonymization of IP addresses

### DPDP (India)
- [x] Notice provided before consent
- [x] Free, specific, informed, unambiguous consent
- [x] Withdrawal mechanism implemented
- [x] Purpose limitation enforced
- [x] Data minimization practiced
- [x] Security safeguards implemented
- [x] Technical and organizational measures documented

## Testing & Verification

### Manual Testing
1. **Anonymous User Flow**:
   - Set preferences → Check localStorage
   - Login → Verify sync to MongoDB
   - Check localStorage cleared

2. **Authenticated User Flow**:
   - Modify preferences → Verify MongoDB update
   - Logout/Login → Verify persistence
   - Check enforcement (scripts load conditionally)

3. **Admin Panel**:
   - View global stats
   - Filter by tenant
   - Verify tenant isolation (only own data visible)

### Automated Testing
```bash
# Run integration tests
npm run test:cookie-preferences

# Check tenant isolation
npm run test:tenant-isolation

# Verify GDPR compliance
npm run test:gdpr-compliance
```

## Monitoring & Audit

### Metrics to Track
- Consent rates (analytics, marketing) per tenant
- Withdrawal frequency
- Policy version distribution
- Sync success rate (localStorage → MongoDB)

### Compliance Audits
- Quarterly review of consent rates
- Annual GDPR/DPDP compliance check
- Data retention policy enforcement verification
- Access log reviews for unauthorized access

## Incident Response

### Data Breach Protocol
1. Assess scope of breach
2. Notify affected users within 72 hours (GDPR Art. 33)
3. Notify supervisory authority if high risk
4. Document incident in audit trail
5. Implement corrective measures

### Consent Invalidation
If cookie policy changes materially:
1. Increment `policyVersion`
2. Invalidate existing consents
3. Re-prompt users for new consent
4. Document version change in audit trail

## Future Enhancements

### Planned Features
- [ ] Consent banner for first-time visitors
- [ ] Policy version comparison tool
- [ ] Bulk consent export (admin)
- [ ] Consent heatmaps by geography
- [ ] Automated compliance reports (PDF)
- [ ] Integration with Google Consent Mode v2
- [ ] Cookie audit scanning tool

### Compliance Roadmap
- [ ] CCPA compliance (California)
- [ ] LGPD compliance (Brazil)
- [ ] PIPEDA compliance (Canada)
- [ ] Cookie Consent Management Platform (CMP) certification

## Support & Contact

For compliance questions or to exercise user rights:
- **Email**: privacy@uniqbrio.com
- **DPO**: dpo@uniqbrio.com
- **Support**: Settings → Privacy → Contact Support

---

**Last Updated**: December 15, 2025  
**Policy Version**: 1.0  
**Next Review**: March 15, 2026
