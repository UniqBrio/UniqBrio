# Google OAuth Configuration Guide

## Issue Description
You're experiencing an "OAuthCallback" error during Google authentication. This happens when:
1. The OAuth callback URL is not properly configured in Google Cloud Console
2. The NextAuth URL environment variables don't match the actual domain
3. The redirect flow has issues
4. **The middleware blocks the `/select-role` page before the session is established (THIS WAS THE MAIN ISSUE)**

## Root Cause Found

After analyzing the logs, the issue was that your middleware was blocking access to `/select-role` immediately after OAuth callback, before NextAuth could establish the session cookie. The flow was:

1. ✅ Google OAuth succeeds
2. ✅ User created/updated in database
3. ✅ NextAuth tries to redirect to `/select-role`
4. ❌ Middleware intercepts and redirects back to `/login` (no session cookie yet)
5. ♻️ Loop continues

## Required Fixes

### 1. ✅ FIXED - Added `/select-role` to Middleware Public Paths

The `/select-role` page now bypasses middleware authentication checks, allowing NextAuth to complete the OAuth flow and establish the session. The page itself handles authentication checks using `useSession()`.

### 2. Google Cloud Console Setup

You need to add the correct authorized redirect URIs to your Google OAuth credentials:

#### For Local Development:
- `http://localhost:3000/api/auth/callback/google`

#### For Production (Vercel):
- `https://uniqbrio.vercel.app/api/auth/callback/google`

#### Steps to Configure:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to: **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID: `92450814481-fbiq1jegggpdke3rvkkja8rod8bmdp41.apps.googleusercontent.com`
5. Click Edit (pencil icon)
6. Under "Authorized redirect URIs", add both URLs above
7. Click "Save"

**Important**: It may take 5-10 minutes for Google to propagate these changes.

### 2. Environment Variables

#### Local Development (`.env.local`)
```env
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Production (Vercel Environment Variables)
```env
NEXTAUTH_URL=https://uniqbrio.vercel.app
NEXT_PUBLIC_APP_URL=https://uniqbrio.vercel.app
```

**Note**: The `.env.local` file has been created for local development. Make sure to use it.

### 3. Code Changes Made

#### a. Fixed `/select-role` page
- Added session validation
- Added error parameter detection and redirect to login
- Added loading state while checking authentication
- Prevents unauthenticated access

#### b. Updated NextAuth Configuration
- Added proper `redirect` callback to handle OAuth errors
- Improved error logging
- Ensures errors are properly redirected to login page with error parameter

#### c. Login Page Already Handles Errors
- The login page already has comprehensive error handling for OAuth errors
- It will display appropriate toast messages for different error types

## Testing the Fix

### Local Testing:
1. Make sure `.env.local` exists with localhost URLs
2. Restart your dev server: `npm run dev`
3. Try Google OAuth login
4. Check browser console for detailed logs

### Production Testing:
1. Ensure Vercel environment variables are set correctly
2. Deploy the changes
3. Wait 5-10 minutes after updating Google OAuth settings
4. Try Google OAuth login

## Common Error Types

| Error | Cause | Solution |
|-------|-------|----------|
| `OAuthCallback` | Callback URL not authorized | Add redirect URI to Google Console |
| `OAuthSignin` | Cannot start OAuth flow | Check Google Client ID/Secret |
| `OAuthAccountNotLinked` | Email already exists with different method | User must use original sign-in method |
| `OAuthCreateAccount` | Cannot create account | Database connection or validation issue |

## Debugging

### Check Logs:
1. **Browser Console**: Open DevTools and check for `[NextAuth]` logs
2. **Server Logs**: Check terminal for NextAuth server-side logs
3. **Vercel Logs**: Check function logs in Vercel dashboard

### Key Things to Verify:
```bash
# Check your current NEXTAUTH_URL
echo $NEXTAUTH_URL

# For local dev, should output: http://localhost:3000
# For production, should output: https://uniqbrio.vercel.app
```

### Test OAuth Flow:
1. Clear browser cookies/cache
2. Try signing in with Google
3. Watch the URL during redirect - it should go to:
   - `https://accounts.google.com/...` (Google consent)
   - `http://localhost:3000/api/auth/callback/google?...` (callback)
   - `/select-role` (if successful) or `/login?error=...` (if failed)

## Next Steps After Fix

1. ✅ Update Google Cloud Console with redirect URIs
2. ✅ Verify `.env.local` file exists for local development
3. ✅ Restart your development server
4. ✅ Clear browser cache and cookies
5. ✅ Test the Google OAuth flow
6. ✅ If it works locally, deploy to production
7. ✅ Test production after Google settings propagate (5-10 min)

## Support

If you continue to experience issues:
1. Share the exact error message from browser console
2. Share any server logs with `[NextAuth]` prefix
3. Verify the Google OAuth redirect URIs are correctly saved
4. Ensure you're waiting at least 5-10 minutes after updating Google settings

## Security Note

The following credentials are exposed in your `.env` file:
- `GOOGLE_CLIENT_SECRET`
- Database passwords
- API keys

**Recommendation**: After fixing the issue, consider rotating these secrets and using environment variables in Vercel for production.
