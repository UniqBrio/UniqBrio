# Tenant Context Error Fix

## Problem
Users were experiencing "Unauthorized: No tenant context" errors when trying to:
- Create courses
- Save course drafts
- Create cohorts
- Update courses
- Delete courses

## Root Cause
The session tokens created by the login system were conditionally including the `tenantId` field only when `registrationComplete` was `true`. This caused issues for:
1. Users with old session cookies from before the tenant system was implemented
2. Edge cases in the session creation logic

Additionally, the `getUserSession()` helper function didn't have proper fallback logic for missing `tenantId` values.

## Solution

### 1. Fixed Session Creation
**Files Modified:**
- [app/actions/auth-actions.ts](app/actions/auth-actions.ts) (lines ~300-313)
- [app/api/auth/google-redirect/route.ts](app/api/auth/google-redirect/route.ts) (lines ~48-58)

**Changes:**
- Always include `tenantId` in session data for logged-in users
- Use fallback chain: `user.academyId` → `user.tenantId` → `'default'`
- Removed conditional logic that excluded `tenantId` for incomplete registrations

### 2. Enhanced getUserSession Helper
**File Modified:**
- [lib/tenant/api-helpers.ts](lib/tenant/api-helpers.ts) (lines ~95-118)

**Changes:**
- Added proper null checks for decoded token
- Always return `tenantId` with fallback chain: `decoded.tenantId` → `decoded.academyId` → `'default'`
- Improved error handling

### 3. Created Session Refresh Endpoint
**New Files:**
- [app/api/auth/refresh-session/route.ts](app/api/auth/refresh-session/route.ts)
- [lib/session-refresh.ts](lib/session-refresh.ts)

**Purpose:**
- Allows users to refresh their session to get updated tenant context
- Can be called programmatically when tenant errors are detected
- Provides a recovery mechanism for users with old sessions

## User Action Required

For users experiencing the error, they need to either:

### Option 1: Automatic Session Refresh (Recommended)
The system will now automatically handle tenant context in all new sessions. Users should:
1. **Log out completely** from the application
2. **Log back in** using their email and password

The new session will automatically include the proper tenant context.

### Option 2: Manual Session Refresh
For users who want to keep their current session:
1. Call the refresh endpoint: `POST /api/auth/refresh-session`
2. The page will automatically reload with the updated session

### Option 3: Clear Browser Cache
If issues persist:
1. Clear browser cookies for the application
2. Log in again

## Technical Details

### Before Fix
```typescript
// Session data conditionally included tenantId
const sessionData = {
  // ... other fields
  ...(user.registrationComplete ? {
    tenantId: user.academyId || user.tenantId,
    // ...
  } : {}),
};
```

### After Fix
```typescript
// Session data always includes tenantId
const sessionData = {
  // ... other fields
  tenantId: user.academyId || user.tenantId || 'default',
  userId: user.userId,
  academyId: user.academyId,
};
```

## Verification

All users in the database were verified to have proper tenant data:
- ✅ All verified users have `userId`, `academyId`, and `tenantId`
- ✅ All verified users have `registrationComplete: true`
- ✅ No data migration needed

The issue was purely in the session token generation logic, not in the user data itself.

## Testing Checklist

After users log out and back in, verify:
- [ ] Can create new courses
- [ ] Can save course drafts
- [ ] Can create cohorts
- [ ] Can update existing courses
- [ ] Can delete courses
- [ ] No "Unauthorized: No tenant context" errors

## Prevention

To prevent this issue in the future:
1. Always include `tenantId` in session for authenticated users
2. Use consistent fallback chains for tenant resolution
3. Test session creation paths (regular login, OAuth, token refresh)
4. Monitor for tenant context errors in production logs
