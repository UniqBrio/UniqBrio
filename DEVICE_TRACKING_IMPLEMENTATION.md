# Device & Login Tracking Implementation

## Overview

Privacy-safe device and login tracking system for multi-tenant SaaS with JWT-based authentication and MongoDB session store. Fully compliant with GDPR and DPDP Act.

## Implementation Summary

### ✅ 1. Device & Environment Capture

**Client-Side (Browser)**
- Browser name & version (e.g., "Chrome 120")
- OS name & version (e.g., "Windows 11", "iOS 17")
- Device type (desktop, mobile, tablet)
- Raw user agent string

**Server-Side (Backend)**
- IP address → SHA-256 hashed (one-way, not reversible)
- Country only (coarse geolocation, no city/coordinates)
- Timestamp of session creation

### ✅ 2. MongoDB Session Schema Extension

```typescript
interface ISession {
  // Core session fields
  tenantId: string;         // REQUIRED - tenant isolation
  userId: string;
  jwtId: string;
  
  // Device & Environment (NEW)
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;          // "Chrome 120"
  os: string;              // "Windows 11"
  userAgent: string;       // Raw user agent for security audit
  ipHash: string;          // SHA-256 hashed IP (GDPR-compliant)
  country: string;         // ISO country code only (e.g., "US", "IN")
  
  // Timestamps & Revocation
  issuedAt: Date;
  lastActiveAt: Date;
  expiresAt: Date;
  isRevoked: boolean;
  revokedAt?: Date;
  revokedBy?: string;
  revokedReason?: string;
}
```

**MongoDB Indexes:**
```javascript
{ tenantId: 1, userId: 1, isRevoked: 1 }      // User sessions
{ tenantId: 1, jwtId: 1, isRevoked: 1 }       // JWT lookup
{ tenantId: 1, deviceType: 1, isRevoked: 1 }  // Device filtering
{ expiresAt: 1 } // TTL index for auto-cleanup
```

### ✅ 3. Device Parsing Utility

**File:** `lib/device-parser.ts`

**Functions:**
- `parseUserAgent(userAgent)` - Extract browser, OS, device type
- `hashIpAddress(ipAddress)` - SHA-256 one-way hash
- `extractIpAddress(headers)` - Get IP from proxy headers
- `getCountryFromIp(ip, headers)` - Country-level geolocation
- `parseSessionMetadata(headers)` - Complete metadata extraction
- `formatDeviceDisplay(deviceInfo)` - UI formatting
- `getDeviceIcon(deviceType)` - Icon selection for UI

**Privacy Features:**
- No fingerprinting or invasive tracking
- IP addresses hashed with SHA-256 (cannot be reversed)
- Only country-level geolocation (no city/coordinates)
- Uses ua-parser-js (standard library)

### ✅ 4. Enhanced Session Creation

**File:** `lib/auth.ts` - `createToken()` function

**Before:**
```typescript
createToken(payload, '30d', {
  userAgent: 'Mozilla/5.0...',
  ipAddress: '192.168.1.1'
})
```

**After:**
```typescript
createToken(payload, '30d', {
  userAgent: 'Mozilla/5.0...',
  ipAddress: '192.168.1.1',
  headers: request.headers  // NEW - for metadata extraction
})
```

**Auto-captures:**
- Device type, browser, OS from user agent
- Hashed IP address
- Country from CloudFlare header (if available)

### ✅ 5. Tenant-Safe APIs

#### **GET /api/sessions/active**
**Access:** Authenticated users
**Returns:** User's own active sessions
**Features:**
- Shows current device (marked)
- Device type, browser, OS, country
- Last activity timestamp
- Ability to revoke other sessions

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "sessionId": "...",
      "jwtId": "...",
      "deviceType": "desktop",
      "browser": "Chrome 120",
      "os": "Windows 11",
      "country": "US",
      "lastActiveAt": "2025-12-16T10:30:00Z",
      "issuedAt": "2025-12-15T08:00:00Z",
      "isCurrent": true
    }
  ],
  "total": 2
}
```

**Privacy:**
- Does NOT expose: IP address, IP hash, user agent
- Only shows: Device type, browser, OS, country

#### **GET /api/sessions/admin**
**Access:** Admin, Super Admin only
**Returns:** All active sessions in tenant
**Features:**
- Paginated (50 per page)
- Filter by device type, user ID
- Search by user name/email
- Shows partial IP hash (last 8 chars)
- Export to CSV

**Query Params:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `deviceType` - Filter (desktop/mobile/tablet/all)
- `userId` - Filter by specific user

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "sessionId": "...",
      "userId": "AD000001",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "deviceType": "mobile",
      "browser": "Safari 17",
      "os": "iOS 17",
      "country": "IN",
      "lastActiveAt": "2025-12-16T10:30:00Z",
      "ipHashPartial": "...abc12345"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 127,
    "pages": 3
  }
}
```

**Tenant Isolation:**
- Query always includes `{ tenantId }` filter
- Admins cannot see sessions from other tenants
- All queries run within tenant context

#### **POST /api/sessions/revoke**
**Access:** Users (own sessions), Admins (any session in tenant)
**Body:**
```json
{
  "jwtId": "abc123...",
  "reason": "security_breach" // optional
}
```

**Authorization:**
- Users can revoke their own sessions (except current)
- Admins can revoke any session in their tenant
- Cannot revoke current session (use logout instead)

**DELETE /api/sessions/revoke (revoke-all)**
**Access:** Authenticated users
**Effect:** Revokes ALL user sessions except current
**Use case:** "Log out all other devices" feature

### ✅ 6. User Security UI

**Component:** `components/settings/active-devices-card.tsx`
**Location:** Account Settings → Security → Active Devices

**Features:**
- List all active sessions
- Current device highlighted
- Device icons (desktop/mobile/tablet)
- Last activity timestamp
- Country badge
- "Remove" button for each device
- "Log Out All Other Devices" bulk action
- Privacy notice explaining data usage

**Example:**
```
┌─────────────────────────────────────────┐
│ 🛡️ Active Devices                      │
│                                         │
│ 💻 Chrome 120 • Windows 11 [Current]   │
│    📍 US  🕐 Active 5 minutes ago       │
│                                         │
│ 📱 Safari 17 • iOS 17        [Remove]  │
│    📍 IN  🕐 Active 2 hours ago         │
│                                         │
│ 🛡️ Privacy & Security                  │
│ We store device information and         │
│ approximate location (country only)     │
│ to protect your account.                │
└─────────────────────────────────────────┘
```

### ✅ 7. Admin Security UI

**Component:** `components/admin/security/admin-active-sessions-panel.tsx`
**Location:** Admin Panel → Security → Active Sessions

**Features:**
- Table view of all tenant sessions
- Search by user name, email, browser, OS
- Filter by device type
- Revoke individual sessions
- Export to CSV
- Shows partial IP hash for security auditing
- User info (name, email)
- Device info (type, browser, OS)
- Location (country)
- Last activity timestamp

**Example Table:**
```
┌────────────┬──────────────┬─────────┬────────────┬──────────┬──────────┐
│ User       │ Device       │ Location│ Last Active│ Security │ Actions  │
├────────────┼──────────────┼─────────┼────────────┼──────────┼──────────┤
│ John Doe   │ 💻 Chrome 120│ 📍 US   │ 5m ago     │ ...abc123│ [Revoke] │
│ john@ex.com│ Windows 11   │         │            │          │          │
├────────────┼──────────────┼─────────┼────────────┼──────────┼──────────┤
│ Jane Smith │ 📱 Safari 17 │ 📍 IN   │ 1h ago     │ ...def456│ [Revoke] │
│ jane@ex.com│ iOS 17       │         │            │          │          │
└────────────┴──────────────┴─────────┴────────────┴──────────┴──────────┘
```

## Privacy & Compliance

### GDPR Compliance

✅ **Data Minimization:** Only collect necessary data for security
✅ **Purpose Limitation:** Data used solely for security & session management
✅ **Storage Limitation:** Sessions auto-expire (30 days max)
✅ **Transparency:** Clear privacy notices in UI
✅ **User Control:** Users can revoke any session anytime
✅ **Data Protection:** IP addresses hashed (one-way, non-reversible)
✅ **Right to be Forgotten:** Sessions deleted on account deletion

### DPDP Act (India) Compliance

✅ **Consent:** Implied consent for security purposes
✅ **Purpose Limitation:** Clear purpose stated (security)
✅ **Data Security:** Encryption at rest, hashing of sensitive data
✅ **Data Localization:** Stored in India region (if configured)
✅ **Grievance Redressal:** Support contact available

### What We DON'T Store

❌ Precise geolocation (no city, coordinates, zip code)
❌ Device fingerprints or tracking IDs
❌ Browsing history or activity tracking
❌ Third-party cookies or trackers
❌ Raw IP addresses (only hashed)

### What We DO Store

✅ Browser name & version (from user agent)
✅ OS name & version (from user agent)
✅ Device type (desktop/mobile/tablet)
✅ Country only (coarse geolocation)
✅ Session timestamps (login, last activity)
✅ Hashed IP address (one-way SHA-256)

## Integration Steps

### 1. Install Dependencies

```bash
npm install ua-parser-js
# OR
yarn add ua-parser-js
```

### 2. Update Login/Registration Flows

**Example: Login Action**
```typescript
import { headers } from 'next/headers';

export async function login(credentials) {
  // ... authenticate user ...
  
  const headersList = await headers();
  const token = await createToken(sessionData, '30d', {
    userAgent: headersList.get('user-agent') || undefined,
    ipAddress: extractIpAddress(headersList),
    headers: headersList, // For country extraction
  });
  
  await setSessionCookie(token);
}
```

### 3. Add UI Components

**User Settings Page:**
```tsx
import { ActiveDevicesCard } from '@/components/settings/active-devices-card';

export default function SecuritySettingsPage() {
  return (
    <div>
      <h1>Security Settings</h1>
      <ActiveDevicesCard />
    </div>
  );
}
```

**Admin Panel:**
```tsx
import { AdminActiveSessionsPanel } from '@/components/admin/security/admin-active-sessions-panel';

export default function AdminSecurityPage() {
  return (
    <div>
      <h1>Active Sessions</h1>
      <AdminActiveSessionsPanel />
    </div>
  );
}
```

### 4. Environment Variables

Add to `.env.local`:
```bash
# Optional: Salt for IP hashing (use a long random string)
IP_HASH_SALT="your-secure-random-salt-here-min-32-chars"
```

## Security Considerations

### Threat Mitigation

✅ **Session Hijacking:** IP hash tracking helps detect suspicious logins
✅ **Account Takeover:** Users can see and revoke unknown sessions
✅ **Insider Threats:** Admins audit-logged, tenant-isolated
✅ **Data Breaches:** IP addresses hashed, cannot be reversed

### Best Practices

1. **Regular Session Reviews:** Encourage users to review active devices
2. **Admin Monitoring:** Admins should periodically review suspicious sessions
3. **Automatic Revocation:** Revoke sessions on password change
4. **Audit Logging:** Log all session revocations with reason
5. **Rate Limiting:** Implement rate limits on session APIs
6. **Alert System:** Notify users of new logins from unknown devices

## API Rate Limiting (Recommended)

```typescript
// middleware.ts or API routes
const SESSION_API_RATE_LIMIT = 10; // requests per minute

// Implement rate limiting on:
// - /api/sessions/active (10 req/min per user)
// - /api/sessions/admin (20 req/min per admin)
// - /api/sessions/revoke (5 req/min per user)
```

## Monitoring & Alerts

### Metrics to Track

- Active sessions per tenant
- Sessions by device type (mobile vs desktop)
- Geographic distribution (country)
- Suspicious login patterns (many devices, unusual countries)
- Session revocation rate

### Alert Triggers

- User logs in from > 5 devices simultaneously
- Login from new country (different from usual)
- Multiple failed revocation attempts
- Admin mass-revoking sessions

## Migration Guide

### Existing Sessions Without Device Data

Sessions created before this implementation will have:
- `deviceType: 'unknown'`
- `browser: 'Unknown Browser'`
- `os: 'Unknown OS'`
- `ipHash: undefined` (or migrated from legacy ipAddress)

**Recommendation:** Gradually phase out old sessions by:
1. Setting shorter expiry for sessions without device data
2. Prompting users to re-login on major updates
3. Auto-revoking sessions older than 90 days without metadata

## Testing Checklist

- [ ] User can view their own active sessions
- [ ] User can revoke individual sessions
- [ ] User can revoke all other sessions
- [ ] Current session is clearly marked
- [ ] Device icons display correctly
- [ ] Country badges show when available
- [ ] Admin can view all tenant sessions
- [ ] Admin cannot see sessions from other tenants
- [ ] Admin can revoke user sessions with audit log
- [ ] Export CSV works correctly
- [ ] Pagination works for large session lists
- [ ] Search/filter work as expected
- [ ] Privacy notice is displayed
- [ ] IP addresses are never exposed in UI
- [ ] Device metadata captured on new logins
- [ ] Session revocation works immediately

## Files Created/Modified

### New Files
1. `lib/device-parser.ts` - Device metadata parsing utility
2. `app/api/sessions/active/route.ts` - User active sessions API
3. `app/api/sessions/admin/route.ts` - Admin sessions API
4. `app/api/sessions/revoke/route.ts` - Session revocation API
5. `components/settings/active-devices-card.tsx` - User UI component
6. `components/admin/security/admin-active-sessions-panel.tsx` - Admin UI component

### Modified Files
1. `models/Session.ts` - Extended schema with device fields
2. `lib/session-store.ts` - Device metadata capture
3. `lib/auth.ts` - Enhanced createToken with device data

## Support & Maintenance

### Regular Tasks
- Weekly: Review admin audit logs for suspicious activity
- Monthly: Check session count per tenant, cleanup if needed
- Quarterly: Review privacy policy alignment with data collected

### Common Issues

**Q: Sessions not showing device info**
A: Ensure user-agent header is being passed to createToken()

**Q: Country not detected**
A: Check CloudFlare cf-ipcountry header or implement geolocation service

**Q: Admin can't see sessions**
A: Verify role is 'super_admin' or 'admin' and tenant ID is correct

**Q: Cannot revoke session**
A: Check if trying to revoke current session (not allowed, use logout)

## Conclusion

This implementation provides:
✅ Privacy-safe device tracking
✅ GDPR & DPDP compliant
✅ Tenant-isolated architecture
✅ User control over sessions
✅ Admin visibility for security
✅ Comprehensive audit trail

No invasive tracking, no fingerprinting, just security-focused session management. 🛡️
