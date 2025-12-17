# Device Tracking Integration Guide

Quick start guide for integrating device tracking UI components into your application.

## ✅ What's Already Done

1. ✅ Device parsing utility (`lib/device-parser.ts`)
2. ✅ Session model extended with device fields
3. ✅ Session creation captures device metadata automatically
4. ✅ Three APIs ready:
   - `/api/sessions/active` - User's sessions
   - `/api/sessions/admin` - Admin view
   - `/api/sessions/revoke` - Revoke sessions
5. ✅ Two UI components ready:
   - `components/settings/active-devices-card.tsx` - User UI
   - `components/admin/security/admin-active-sessions-panel.tsx` - Admin UI
6. ✅ Dependencies installed (`ua-parser-js`)

## 📋 Integration Steps

### Step 1: Add User Security UI

Find or create your **User Settings/Security page** and add the Active Devices card.

**Example: `app/settings/security/page.tsx`**
```tsx
import { ActiveDevicesCard } from '@/components/settings/active-devices-card';

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Security Settings</h2>
        <p className="text-muted-foreground">
          Manage your account security and active sessions
        </p>
      </div>
      
      {/* Add the Active Devices card */}
      <ActiveDevicesCard />
      
      {/* Other security settings can go here */}
      {/* e.g., Password change, 2FA settings, etc. */}
    </div>
  );
}
```

### Step 2: Add Admin Security UI

Find or create your **Admin Security/Sessions page** and add the Active Sessions panel.

**Example: `app/UBAdmin/security/sessions/page.tsx`**
```tsx
import { AdminActiveSessionsPanel } from '@/components/admin/security/admin-active-sessions-panel';

export default function AdminSessionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Active Sessions</h2>
        <p className="text-muted-foreground">
          Monitor and manage all active sessions in your tenant
        </p>
      </div>
      
      {/* Add the Active Sessions panel */}
      <AdminActiveSessionsPanel />
    </div>
  );
}
```

### Step 3: Update Login/Registration to Capture Device Data

**✅ Already implemented in:** `lib/auth.ts` - `createToken()` automatically captures device data when `headers` are provided.

**Ensure your login/register actions pass headers:**

**Example: `app/actions/auth-actions.ts`**
```typescript
import { headers } from 'next/headers';
import { createToken } from '@/lib/auth';

export async function loginAction(credentials: LoginCredentials) {
  // Authenticate user...
  const user = await authenticateUser(credentials);
  
  // Get headers for device tracking
  const headersList = await headers();
  
  // Create token with device metadata
  const token = await createToken(
    {
      userId: user.userId,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    },
    '30d',
    {
      userAgent: headersList.get('user-agent') || undefined,
      ipAddress: extractIpAddress(headersList),
      headers: headersList, // For country extraction
    }
  );
  
  // Set cookie and return
  await setSessionCookie(token);
  return { success: true };
}
```

### Step 4: Optional - Add Environment Variable for IP Hashing

Create or update `.env.local`:
```bash
# IP Hash Salt (use a long random string, min 32 characters)
IP_HASH_SALT="your-secure-random-salt-here-change-this-to-something-unique"
```

**Generate a secure salt:**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### Step 5: Update Privacy Policy (Important!)

Add to your privacy policy page:

**Example: `app/legal/privacy/page.tsx`**
```tsx
<section>
  <h2>Session and Device Information</h2>
  <p>
    To protect your account and provide security features, we collect and store:
  </p>
  <ul>
    <li><strong>Device Information:</strong> Browser name and version, operating system, device type (desktop/mobile/tablet)</li>
    <li><strong>Location:</strong> Country only (coarse geolocation, no city or precise location)</li>
    <li><strong>Session Data:</strong> Login timestamps and last activity time</li>
    <li><strong>Security:</strong> One-way hashed IP addresses (cannot be reversed)</li>
  </ul>
  <p>
    This data is used solely for:
  </p>
  <ul>
    <li>Detecting suspicious login attempts</li>
    <li>Allowing you to view and manage your active sessions</li>
    <li>Security monitoring and fraud prevention</li>
  </ul>
  <p>
    You can view and revoke any active session at any time from your Security Settings.
  </p>
</section>
```

## 🔍 Testing Checklist

### User Testing
- [ ] Navigate to Security Settings
- [ ] See Active Devices card
- [ ] Current device is marked
- [ ] Can revoke individual devices
- [ ] Can revoke all other devices
- [ ] Confirmation dialog appears before revoke
- [ ] Device info displays correctly (icon, browser, OS)
- [ ] Country badge shows when available
- [ ] Privacy notice is visible

### Admin Testing
- [ ] Navigate to Admin → Security → Sessions
- [ ] See all tenant sessions in table
- [ ] Search by user name works
- [ ] Filter by device type works
- [ ] Pagination works
- [ ] Can revoke individual sessions
- [ ] Confirmation dialog appears
- [ ] Export CSV works
- [ ] Cannot see sessions from other tenants
- [ ] Partial IP hash displays correctly

### Security Testing
- [ ] Login from different browsers - different sessions created
- [ ] Login from mobile - device type is "mobile"
- [ ] Login from desktop - device type is "desktop"
- [ ] Revoke session - immediately invalidated
- [ ] Logout - session revoked with reason "logout"
- [ ] IP address NEVER exposed in UI or API responses
- [ ] Admins cannot revoke sessions from other tenants

## 🎨 UI Customization

### Customize Device Icons
Edit `lib/device-parser.ts` - `getDeviceIcon()` function:
```typescript
export function getDeviceIcon(deviceType?: string): string {
  switch (deviceType) {
    case 'mobile':
      return 'Smartphone'; // Change to any Lucide icon name
    case 'tablet':
      return 'Tablet';
    case 'desktop':
      return 'Monitor';
    default:
      return 'HelpCircle';
  }
}
```

### Customize Card Styling
Both components use Tailwind CSS classes. Modify directly in:
- `components/settings/active-devices-card.tsx`
- `components/admin/security/admin-active-sessions-panel.tsx`

### Customize Text/Labels
Search for strings in the component files and replace:
```typescript
// Example: Change "Active Devices" to "My Devices"
<CardTitle className="flex items-center gap-2">
  <Shield className="h-5 w-5" />
  My Devices {/* Changed from "Active Devices" */}
</CardTitle>
```

## 🔧 Troubleshooting

### Issue: "Sessions not showing device info"
**Cause:** Headers not being passed to `createToken()`
**Fix:** Ensure login/register actions pass `headers` parameter:
```typescript
const headersList = await headers();
const token = await createToken(payload, '30d', {
  headers: headersList, // Add this
});
```

### Issue: "Country not detected"
**Cause:** CloudFlare header not available or custom geolocation service needed
**Fix:** Either:
1. Use CloudFlare proxy (automatically adds `cf-ipcountry` header)
2. Implement custom geolocation in `getCountryFromIp()` function
3. Leave country as optional (works fine without it)

### Issue: "Admin can't see sessions"
**Cause:** Role not authorized or tenant isolation issue
**Fix:** Check that user has role `super_admin` or `admin`:
```typescript
const session = await getServerSession();
console.log('Role:', session?.user?.role); // Should be admin or super_admin
```

### Issue: "Cannot revoke current session"
**Expected behavior** - Users cannot revoke their current session (use logout instead)
**Fix:** This is intentional. Use the logout functionality to end current session.

### Issue: "ua-parser-js not found"
**Cause:** Dependency not installed
**Fix:** Run:
```bash
npm install ua-parser-js @types/ua-parser-js
```

## 📊 Monitoring

### Recommended Dashboards

**User Metrics:**
- Total active sessions per user
- Most common devices (desktop vs mobile)
- Geographic distribution (countries)
- Session duration averages

**Admin Metrics:**
- Total active sessions in tenant
- Suspicious activity alerts (5+ devices per user)
- Session revocation rate
- Failed login attempts

### Alert Triggers

Set up alerts for:
- User logs in from > 5 devices simultaneously
- Admin mass-revokes sessions (potential security incident)
- Unusual login countries (different from user's typical location)
- Rapid session creation (potential bot activity)

## 🚀 Next Steps

After integration:
1. ✅ Test thoroughly with real users
2. ✅ Update privacy policy with device tracking info
3. ✅ Train admins on session monitoring
4. ✅ Set up monitoring dashboards
5. ✅ Consider implementing:
   - Email notifications on new device login
   - Suspicious login detection
   - Automatic revocation on password change
   - Session limits per user

## 📚 Related Documentation

- [DEVICE_TRACKING_IMPLEMENTATION.md](./DEVICE_TRACKING_IMPLEMENTATION.md) - Full technical docs
- [SESSION_STORE_DOCUMENTATION.md](./SESSION_STORE_DOCUMENTATION.md) - Session store guide
- [SECURITY_IMPLEMENTATION.md](./SECURITY_IMPLEMENTATION.md) - Overall security guide

## ✅ Implementation Complete!

Your device tracking system is now ready to use. Users can manage their sessions, and admins can monitor tenant-wide activity - all with full privacy compliance! 🎉🛡️
