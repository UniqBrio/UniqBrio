import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyTokenEdge, getSessionCookieEdge } from '@/lib/auth-edge' // NEW IMPORT - Edge safe
import { COOKIE_NAMES, COOKIE_EXPIRY } from '@/lib/cookies'; // Assuming COOKIE_EXPIRY is defined here
import { tenantMiddleware } from '@/lib/tenant/tenant-middleware'; // Tenant support

// Helper function to get the default dashboard path based on role
function getDefaultDashboard(role: string): string {
  switch (role) {
    case "super_admin":
      // Route super_admin to the main dashboard to avoid confusion
      return "/dashboard"
    case "admin":
      return "/admin/dashboard"
    case "instructor":
      return "/instructor/dashboard"
    case "student":
      return "/student/dashboard"
    default:
      return "/login" // Fallback
  }
}

// Define public paths that don't require authentication
const publicPaths = [
  "/login",
  "/signup", 
  "/forgot-password",
  "/reset-password",
  "/verify-email", // Page to handle link click
  "/support",
  "/troubleshoot",
  "/reset-success",
  "/verification-pending",
  "/kyc-blocked", // KYC blocked access page
  "/UBAdmin", // UniqBrio Admin panel
  "/legal/", // Legal pages (terms, privacy, cookies)
  // API Routes - Allow specific prefixes
  "/api/auth/",
  "/api/payload/",
  "/api/admin-auth", // Admin authentication
  "/api/admin-data", // Admin data endpoints
  // Next.js internals and static assets
  "/_next/",
  // Files with extensions (e.g., .png, .ico)
  /\.[^/]+$/, // Matches paths ending with a dot and some characters
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const loginUrl = new URL("/login", request.url);
  const sessionExpiredUrl = new URL("/login?sessionExpired=true", request.url);
  const activityExpiredUrl = new URL("/login?session=expired", request.url);

  console.log(`[Middleware] Path requested: ${path}`);

  // Allow root path only
  if (path === "/") {
    console.log(`[Middleware] Root path ${path}. Allowing.`);
    return NextResponse.next();
  }

  // Check if it's a public path first
  const isPublicPath = publicPaths.some((p) => {
    if (p instanceof RegExp) {
      const regexMatch = p.test(path);
      if (regexMatch) {
        console.log(`[Middleware] Path ${path} matched regex: ${p}`);
      }
      return regexMatch;
    }
    
    // Now all paths are strings and we check exact match or prefix match for paths ending with "/"
    const exactMatch = path === p || (p.endsWith("/") && path.startsWith(p));
    if (exactMatch) {
      console.log(`[Middleware] Path ${path} matched string: ${p}`);
    }
    return exactMatch;
  });

  if (isPublicPath) {
    console.log(`[Middleware] Public path ${path}. Allowing.`);
    return NextResponse.next();
  }
  console.log(`[Middleware] Protected path ${path}. Checking session...`);

  // --- Session Check ---
  const sessionCookieValue = request.cookies.get(COOKIE_NAMES.SESSION)?.value;
  if (!sessionCookieValue) {
    console.log(`[Middleware] No session cookie found for ${path}. Redirecting to login.`);
    return NextResponse.redirect(loginUrl);
  }

  // --- Token Verification ---
  const tokenPayload = await verifyTokenEdge(sessionCookieValue);
  
  interface TokenPayload {
    id: string;
    email: string;
    role: string;
  }

  const payload = tokenPayload && 
    typeof tokenPayload === 'object' && 
    'id' in tokenPayload && 
    'email' in tokenPayload && 
    'role' in tokenPayload ? 
    tokenPayload as unknown as TokenPayload : null;

  if (!payload?.role) {
    console.log(`[Middleware] Invalid or missing token payload for ${path}. Redirecting to login and clearing cookies.`);
    const response = NextResponse.redirect(sessionExpiredUrl);
    response.cookies.delete(COOKIE_NAMES.SESSION);
    response.cookies.delete(COOKIE_NAMES.LAST_ACTIVITY);
    return response;
  }
  console.log(`[Middleware] Valid session found for role: ${payload.role}, email: ${payload.email}`);

  // --- Registration Completion Check ---
  // Check if user has completed registration before accessing protected areas
  if (payload?.email) {
    try {
      // Use API route instead of direct Prisma in middleware (edge environment)
      // Add timeout to prevent middleware hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const userInfoResponse = await fetch(`${request.nextUrl.origin}/api/user-registration-status`, {
        headers: {
          'Authorization': `Bearer ${sessionCookieValue}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (userInfoResponse.ok) {
        const userData = await userInfoResponse.json();
        
        // If user is not verified, redirect to verification
        if (!userData?.verified) {
          console.log(`[Middleware] User ${payload.email} not verified, redirecting to verification-pending`);
          return NextResponse.redirect(new URL('/verification-pending', request.url));
        }

        // If accessing dashboard but registration not complete, redirect to register
        if (path.startsWith('/dashboard') && !userData?.registrationComplete) {
          console.log(`[Middleware] Registration incomplete for ${payload.email}, redirecting to /register`);
          return NextResponse.redirect(new URL('/register', request.url));
        }

        // If accessing register but already complete, redirect to dashboard
        if (path.startsWith('/register') && userData?.registrationComplete) {
          console.log(`[Middleware] Registration already complete for ${payload.email}, redirecting to /dashboard`);
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        // --- KYC Blocking Check ---
        // Check if user has expired KYC (15+ days without submission) and block access
        if (userData?.registrationComplete && !path.startsWith('/kyc-blocked') && 
            path !== '/login' && path !== '/logout') {
          
          // Check if KYC is expired or if it should be expired
          let shouldBlock = userData.kycStatus === 'expired';
          
          // If not already expired, check if it should be
          if (!shouldBlock && userData.createdAt) {
            const registeredAt = new Date(userData.createdAt);
            const now = new Date();
            const diffDays = Math.floor((now.getTime() - registeredAt.getTime()) / (1000 * 60 * 60 * 24));
            
            // Block access if 15+ days (grace period of 1 day after 14-day limit)
            if (diffDays >= 15 && userData.kycStatus !== 'verified' && userData.kycStatus !== 'approved') {
              shouldBlock = true;
              console.log(`[Middleware] Should block user ${payload.email} - ${diffDays} days since registration, KYC status: ${userData.kycStatus}`);
            }
          }
          
          if (shouldBlock) {
            console.log(`[Middleware] User ${payload.email} has expired KYC, redirecting to /kyc-blocked`);
            return NextResponse.redirect(new URL('/kyc-blocked', request.url));
          }
        }

        console.log(`[Middleware] Registration status check passed for ${payload.email} - verified: ${userData?.verified}, complete: ${userData?.registrationComplete}`);
      } else {
        console.log(`[Middleware] Failed to fetch user registration status: ${userInfoResponse.status} - continuing with normal flow`);
        // Continue with normal flow if API fails - allow user to access pages
      }
    } catch (error) {
      console.error(`[Middleware] Error checking registration status for ${payload.email}:`, error);
      // Continue with normal flow if API check fails - this prevents blocking all pages
      console.log(`[Middleware] Allowing access despite registration check failure`);
    }
  }

  // --- Session Activity Check ---
  const lastActivityValue = request.cookies.get(COOKIE_NAMES.LAST_ACTIVITY)?.value;
  const now = Date.now();
  let needsActivityUpdate = true; // Assume we need to update unless proven otherwise

  if (lastActivityValue) {
    const lastActivity = Number.parseInt(lastActivityValue, 10);
    const inactiveTime = now - lastActivity;
    // Using a hardcoded 1 hour (in milliseconds).
    const maxInactiveTime = 60 * 60 * 1000; // 1 hour in milliseconds

    if (inactiveTime > maxInactiveTime) {
      console.log(`[Middleware] Session inactive for ${payload.email} (${inactiveTime / 1000}s > ${maxInactiveTime / 1000}s). Redirecting to login and clearing cookies.`);
      const response = NextResponse.redirect(activityExpiredUrl);
      response.cookies.delete(COOKIE_NAMES.SESSION);
      response.cookies.delete(COOKIE_NAMES.LAST_ACTIVITY);
      return response;
    }
    // Activity is valid, but we still update the cookie later
  } else {
    console.log(`[Middleware] No activity cookie found for active session (${payload.email}). Will set one.`);
    // No immediate return, cookie will be set later if access is granted
  }

  // --- Role-Based Access Control (RBAC) ---
  const userRole = payload.role; // Role is guaranteed to exist at this point
  const onboardingPath = "/profile/create"; // Specific path for super_admin onboarding

  // Define role-specific path prefixes
  const superAdminPaths = ["/admin", "/instructor", "/student", "/dashboard"]; // Super admin can access all role dashboards + main dashboard
  const adminPaths = ["/admin", "/instructor", "/student", "/dashboard"]; // Admin can access admin, instructor, student, and dashboard
  const instructorPaths = ["/instructor", "/student", "/dashboard"]; // Instructor can access instructor, student, and dashboard
  const studentPaths = ["/student", "/dashboard"]; // Student can access student and dashboard

  // Define paths accessible by *any* authenticated user
  const sharedAuthenticatedPaths = ["/account", "/verification", "/verify-otp", "/register"];

  let isAllowed = false;

  // 1. Handle the specific onboarding path FIRST
  if (path.startsWith(onboardingPath)) {
    if (userRole === "super_admin") {
      console.log(`[Middleware] Allowing super_admin access to onboarding path ${path}.`);
      isAllowed = true;
    } else {
      // If any other role tries to access onboarding, deny and redirect
      console.log(`[Middleware] Denying non-super_admin (${userRole}) access to ${onboardingPath}. Redirecting to their dashboard.`);
      const userDashboard = getDefaultDashboard(userRole);
      return NextResponse.redirect(new URL(userDashboard, request.url));
    }
  }
  // 2. Handle audit logs - super admin only
  else if (path.startsWith('/dashboard/audit-logs')) {
    if (userRole === "super_admin") {
      console.log(`[Middleware] Allowing super_admin access to audit logs ${path}.`);
      isAllowed = true;
    } else {
      console.log(`[Middleware] Denying non-super_admin (${userRole}) access to audit logs. Redirecting to their dashboard.`);
      const userDashboard = getDefaultDashboard(userRole);
      return NextResponse.redirect(new URL(userDashboard, request.url));
    }
  }
  // 3. Handle shared authenticated paths
  else if (sharedAuthenticatedPaths.some((p) => path.startsWith(p))) {
    console.log(`[Middleware] Allowing any authenticated user (${userRole}) access to shared path ${path}.`);
    isAllowed = true;
  }
  // 4. Handle standard role-protected paths
  else {
    const allowedPaths = (() => {
      switch (userRole) {
        case "super_admin": return superAdminPaths;
        case "admin": return adminPaths;
        case "instructor": return instructorPaths;
        case "student": return studentPaths;
        default: return [];
      }
    })();

    if (allowedPaths.some((p) => path.startsWith(p))) {
      console.log(`[Middleware] Role (${userRole}) allowed access to role-specific path ${path}.`);
      isAllowed = true;
    }
  }

  // 5. If not allowed by any rule, redirect
  if (!isAllowed) {
    console.log(`[Middleware] Role (${userRole}) access DENIED for path ${path}. Redirecting to default dashboard.`);
    const userDashboard = getDefaultDashboard(userRole);
    
    // Prevent redirect loops if default dashboard itself is somehow restricted
    if (path === userDashboard) {
      console.error(`[Middleware] Potential redirect loop detected for ${userRole} to ${userDashboard}. Allowing request to prevent loop.`);
      isAllowed = true; // Allow access to prevent loop
    } else {
      return NextResponse.redirect(new URL(userDashboard, request.url));
    }
  }

  // --- Update Last Activity Cookie ---
  // If we reach here, access is granted. Update the activity cookie.
  const response = NextResponse.next();
  if (needsActivityUpdate) {
    console.log(`[Middleware] Updating activity cookie for ${payload.email}.`);
    // Use the expiry defined for the LAST_ACTIVITY cookie itself for its maxAge
    const lastActivityMaxAgeDays = COOKIE_EXPIRY.LAST_ACTIVITY || 1; // Default to 1 day if not defined
    response.cookies.set(COOKIE_NAMES.LAST_ACTIVITY, now.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: lastActivityMaxAgeDays * 24 * 60 * 60, // Convert days to seconds
      path: "/",
    });
  }

  // --- Tenant Context Injection ---
  // Add tenant context to request headers for API routes and pages
  try {
    const tenantResponse = await tenantMiddleware(request);
    // Merge tenant headers with existing response headers
    tenantResponse.headers.forEach((value, key) => {
      response.headers.set(key, value);
    });
  } catch (error) {
    console.error('[Middleware] Error injecting tenant context:', error);
  }

  return response;
}

export const config = {
  // Matcher adjusted to be more specific and avoid common static assets
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - api/ (API routes - handled explicitly in publicPaths check)
     * - favicon.ico (favicon file)
     * - Specific file extensions
     */
    // This matcher is broad; the logic inside the middleware refines it.
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    // Explicitly include root if not covered above and intended to be protected/checked
     "/", // Include root only if it should pass through middleware checks
  ],
}
