import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyTokenEdge, getSessionCookieEdge, verifyTokenSignatureOnly } from '@/lib/auth-edge' // NEW IMPORT - Edge safe
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
  "/register", // Business registration - OAuth users complete this after sign-in
  "/forgot-password",
  "/reset-password/", // Reset password with token parameter
  "/verify-email", // Page to handle link click
  "/support",
  "/troubleshoot",
  "/reset-success",
  "/verification-pending",
  "/kyc-blocked", // KYC blocked access page
  "/UBAdmin", // UniqBrio Admin panel
  "/landing", // Public landing page
  "/roi-calculator", // Public ROI calculator page
  "/legal/", // Legal pages (terms, privacy, cookies)
  // API Routes - Allow specific prefixes
  "/api/auth/",
  "/api/session/", // Session management API routes (handle their own auth)
  "/api/admin-auth", // Admin authentication
  "/api/admin-data", // Admin data endpoints
  "/api/register", // Business registration API - allows first-time users who verified email but haven't logged in
  "/api/business-upload", // Business image upload - used during registration before session is established
  "/api/countries", // Country list API - used during registration
  "/api/verify-reset-token", // Verify reset token API
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

  // --- JWT Verification (Edge Runtime Compatible) ---
  let tokenPayload: any = null;
  
  // Verify JWT signature in Edge Runtime
  try {
    tokenPayload = await verifyTokenSignatureOnly(sessionCookieValue);
    if (tokenPayload) {
      console.log(`[Middleware] JWT verification successful for: ${tokenPayload.email}`);
    } else {
      console.log(`[Middleware] JWT verification failed, trying edge verification`);
      tokenPayload = await verifyTokenEdge(sessionCookieValue);
    }
  } catch (error) {
    console.error(`[Middleware] JWT verification error:`, error);
    tokenPayload = await verifyTokenEdge(sessionCookieValue);
  }
  
  interface TokenPayload {
    id: string;
    email: string;
    role: string;
    registrationComplete: boolean; // Added for performance optimization
    verified: boolean; // Added for performance optimization
    tenantId?: string;
    userId?: string;
    academyId?: string;
  }

  const payload = tokenPayload && 
    typeof tokenPayload === 'object' && 
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
  
  // Log session information for debugging
  console.log(`[Middleware] Session verified - Role: ${payload.role}, Email: ${payload.email}`);

  // --- Registration Completion Check ---
  // Check if user has completed registration before accessing protected areas
  if (payload?.email) {
    // If user is not verified, redirect to verification
    if ('verified' in payload && !payload.verified) {
      console.log(`[Middleware] User ${payload.email} not verified, redirecting to verification-pending`);
      return NextResponse.redirect(new URL('/verification-pending', request.url));
    }

    // If accessing dashboard but registration not complete, redirect to register
    if (path.startsWith('/dashboard') && !payload.registrationComplete) {
      console.log(`[Middleware] Registration incomplete for ${payload.email}, redirecting to /register`);
      return NextResponse.redirect(new URL('/register', request.url));
    }

    // If accessing register but already complete, redirect to dashboard
    if (path.startsWith('/register') && payload.registrationComplete) {
      console.log(`[Middleware] Registration already complete for ${payload.email}, redirecting to /dashboard`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

  }

  // --- Session Activity Check (DISABLED for persistent login like Gmail) ---
  // Users will remain logged in until they explicitly logout or session expires (30 days)
  const now = Date.now();
  let needsActivityUpdate = true;
  
  // We still track last activity for analytics, but DON'T log users out based on inactivity
  console.log(`[Middleware] Session active for ${payload.email} - persistent login enabled`);

  // --- Role-Based Access Control (RBAC) - Optimized with lookup table ---
  const userRole = payload.role; // Role is guaranteed to exist at this point
  const onboardingPath = "/profile/create"; // Specific path for super_admin onboarding

  // Lookup table for role-based path access (performance optimization)
  const ROLE_PATHS_MAP: Record<string, string[]> = {
    super_admin: ["/admin", "/instructor", "/student", "/dashboard", onboardingPath, "/dashboard/audit-logs"],
    admin: ["/admin", "/instructor", "/student", "/dashboard"],
    instructor: ["/instructor", "/student", "/dashboard"],
    student: ["/student", "/dashboard"],
  };

  // Paths accessible by any authenticated user
  const SHARED_AUTH_PATHS = ["/account", "/verification", "/verify-otp", "/register"];

  // Fast lookup: check if role + path combination is allowed
  const allowedPaths = ROLE_PATHS_MAP[userRole] || [];
  const isAllowed =
    SHARED_AUTH_PATHS.some(p => path.startsWith(p)) ||
    allowedPaths.some(p => path.startsWith(p));

  if (!isAllowed) {
    console.log(`[Middleware] Role (${userRole}) access DENIED for path ${path}. Redirecting to default dashboard.`);
    const userDashboard = getDefaultDashboard(userRole);
    
    // Prevent redirect loops
    if (path !== userDashboard) {
      return NextResponse.redirect(new URL(userDashboard, request.url));
    }
  }

  console.log(`[Middleware] Role (${userRole}) access ALLOWED for path ${path}.`);

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

  // --- Session Context Injection ---
  // Add session context to request headers for API routes and server components
  // Extract session info from JWT payload (Edge Runtime compatible)
  response.headers.set('x-session-user-id', String(payload.userId || payload.id || ''));
  response.headers.set('x-session-tenant-id', String(payload.tenantId || payload.academyId || ''));
  response.headers.set('x-session-role', String(payload.role || ''));
  response.headers.set('x-session-email', String(payload.email || ''));
  console.log(`[Middleware] Session headers added for: ${payload.email}`);

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
  // Optimized matcher - only run middleware on specific routes that need authentication/RBAC
  matcher: [
    "/",
    "/dashboard/:path*",
    "/admin/:path*",
    "/instructor/:path*",
    "/student/:path*",
    "/settings/:path*",
    "/notifications/:path*",
    "/tour/:path*",
    "/select-role",
    "/kyc-test/:path*",
    "/kyc-resubmit/:path*",
    "/pwa-test/:path*",
    "/offline",
  ],
}
