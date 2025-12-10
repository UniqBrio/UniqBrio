/**
 * Simple script to clear all session-related cookies
 * Run this and then refresh the browser to force a new login
 */

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    CLEAR SESSION COOKIES                       ║
╚════════════════════════════════════════════════════════════════╝

To clear your old session and get a new one with updated fields:

1. Open your browser DevTools (F12)
2. Go to the "Application" or "Storage" tab
3. Find "Cookies" in the sidebar
4. Look for these cookies and DELETE them:
   - session
   - lastActivity
   
5. Refresh the page (F5)
6. Log in again

After logging back in, your session will have:
✅ userId: "AD000003" (proper format, not MongoDB _id)
✅ academyId: "AC000003" 
✅ tenantId: "AC000003"

This will fix the 401 errors on your dashboard API calls.

Alternative: Just click "Logout" in your app, then log back in.

╔════════════════════════════════════════════════════════════════╗
║                  Press Ctrl+C to exit                          ║
╚════════════════════════════════════════════════════════════════╝
`);

// Keep the script running so the message stays visible
process.stdin.resume();
