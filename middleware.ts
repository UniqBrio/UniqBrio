import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "./lib/auth" // Assuming verifyToken returns { id: string, email: string, role: string, ... } | null
import { COOKIE_NAMES, COOKIE_EXPIRY } from "./lib/cookies" // Assuming COOKIE_EXPIRY is defined here

// Helper function to get the default dashboard path based on role
function getDefaultDashboard(role: string): string {
  switch (role) {
    case "super_admin":
      // If middleware catches a logged-in super_admin later, send them to their dashboard.
      // The initial /profile/create redirect comes from the login action.
      return "/super-admin/dashboard"
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

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const loginUrl = new URL("/login", request.url)
  const sessionExpiredUrl = new URL("/login?sessionExpired=true", request.url)
  const activityExpiredUrl = new URL("/login?session=expired", request.url) // Corrected redirect URL

  console.log(`[Middleware] Path requested: ${path}`)

  // --- Public Paths ---
  // Simplified public path check
  const publicPaths = [
    "/", // Root page
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-email", // Page to handle link click
    // "/verify-otp", // Keep if used for 2FA, remove if only for old signup
    "/support",
    "/troubleshoot",
    "/reset-success",
    "/verification-pending",
    // API Routes - Allow specific prefixes
    "/api/auth/",
    "/api/payload/",
    // Next.js internals and static assets
    "/_next/",
    // Files with extensions (e.g., .png, .ico) - basic check
    // Note: The matcher already excludes most common image types. This adds a general check.
    /\.[^/]+$/, // Matches paths ending with a dot and some characters (basic file extension check)
  ]

  const isPublicPath = publicPaths.some((p) => {
    if (p instanceof RegExp) {
      return p.test(path)
    }
    // Exact match or startsWith for directory-like paths
    return path === p || (p.endsWith("/") && path.startsWith(p))
  })

  if (isPublicPath) {
    console.log(`[Middleware] Public path ${path}. Allowing.`)
    return NextResponse.next()
  }
  console.log(`[Middleware] Protected path ${path}. Checking session...`)

  // --- Session Check ---
  const sessionCookie = request.cookies.get(COOKIE_NAMES.SESSION)?.value
  if (!sessionCookie) {
    console.log(`[Middleware] No session cookie found for ${path}. Redirecting to login.`)
    return NextResponse.redirect(loginUrl)
  }

  // --- Token Verification ---
  const payload = verifyToken(sessionCookie) // Expecting { id, email, role, ... } | null
  if (!payload || !payload.role) {
    console.log(`[Middleware] Invalid or missing token payload for ${path}. Redirecting to login and clearing cookies.`)
    const response = NextResponse.redirect(sessionExpiredUrl)
    response.cookies.delete(COOKIE_NAMES.SESSION)
    response.cookies.delete(COOKIE_NAMES.LAST_ACTIVITY)
    return response
  }
  console.log(`[Middleware] Valid session found for role: ${payload.role}, email: ${payload.email}`)

  // --- Session Activity Check ---
  const lastActivityCookie = request.cookies.get(COOKIE_NAMES.LAST_ACTIVITY)?.value
  const now = Date.now()
  let needsActivityUpdate = true // Assume we need to update unless proven otherwise

  if (lastActivityCookie) {
    const lastActivity = Number.parseInt(lastActivityCookie, 10)
    const inactiveTime = now - lastActivity
    // --- CORRECTION HERE ---
    // Using the hardcoded 30 minutes (in milliseconds) because COOKIE_EXPIRY.SESSION_INACTIVITY is not defined
    const maxInactiveTime = 30 * 60 * 1000 // 30 minutes in milliseconds

    if (inactiveTime > maxInactiveTime) {
      console.log(`[Middleware] Session inactive for ${payload.email} (${inactiveTime / 1000}s > ${maxInactiveTime / 1000}s). Redirecting to login and clearing cookies.`)
      const response = NextResponse.redirect(activityExpiredUrl) // Use corrected URL
      response.cookies.delete(COOKIE_NAMES.SESSION)
      response.cookies.delete(COOKIE_NAMES.LAST_ACTIVITY)
      return response // Return immediately after setting redirect and deleting cookies
    }
    // Activity is valid, but we still update the cookie later
  } else {
    console.log(`[Middleware] No activity cookie found for active session (${payload.email}). Will set one.`)
    // No immediate return, cookie will be set later if access is granted
  }

  // --- Role-Based Access Control (RBAC) ---
  const userRole = payload.role
  const onboardingPath = "/profile/create" // Specific path for super_admin onboarding

  // Define role-specific path prefixes
  const superAdminPaths = ["/super-admin", "/admin", "/instructor", "/student"] // Super admin can access all role dashboards + their own
  const adminPaths = ["/admin", "/instructor", "/student"] // Admin can access admin, instructor, student
  const instructorPaths = ["/instructor", "/student"] // Instructor can access instructor, student
  const studentPaths = ["/student"] // Student can access student

  // Define paths accessible by *any* authenticated user (adjust as needed)
  const sharedAuthenticatedPaths = ["/account", "/settings"] // Example

  let isAllowed = false

  // 1. Handle the specific onboarding path FIRST
  if (path.startsWith(onboardingPath)) {
    if (userRole === "super_admin") {
      console.log(`[Middleware] Allowing super_admin access to onboarding path ${path}.`)
      isAllowed = true
    } else {
      // If any other role tries to access onboarding, deny and redirect
      console.log(`[Middleware] Denying non-super_admin (${userRole}) access to ${onboardingPath}. Redirecting to their dashboard.`)
      const userDashboard = getDefaultDashboard(userRole)
      return NextResponse.redirect(new URL(userDashboard, request.url))
    }
  }
  // 2. Handle shared authenticated paths
  else if (sharedAuthenticatedPaths.some((p) => path.startsWith(p))) {
      console.log(`[Middleware] Allowing any authenticated user (${userRole}) access to shared path ${path}.`)
      isAllowed = true
  }
  // 3. Handle standard role-protected paths
  else {
    let allowedPaths: string[] = []
    switch (userRole) {
      case "super_admin": allowedPaths = superAdminPaths; break
      case "admin": allowedPaths = adminPaths; break
      case "instructor": allowedPaths = instructorPaths; break
      case "student": allowedPaths = studentPaths; break
    }

    if (allowedPaths.some((p) => path.startsWith(p))) {
        console.log(`[Middleware] Role (${userRole}) allowed access to role-specific path ${path}.`)
        isAllowed = true
    }
  }

  // 4. If not allowed by any rule, redirect
  if (!isAllowed) {
    console.log(`[Middleware] Role (${userRole}) access DENIED for path ${path}. Redirecting to default dashboard.`)
    const userDashboard = getDefaultDashboard(userRole)
    // Prevent redirect loops if default dashboard itself is somehow restricted
    if (path === userDashboard) {
        console.error(`[Middleware] Potential redirect loop detected for ${userRole} to ${userDashboard}. Allowing request to prevent loop.`);
         // Or redirect to a generic error page or home page
         // return NextResponse.redirect(new URL('/error-unauthorized', request.url));
    } else {
        return NextResponse.redirect(new URL(userDashboard, request.url))
    }
    // If allowing to prevent loop, ensure activity cookie is still updated below
    console.log(`[Middleware] Allowing request for ${path} to prevent redirect loop, despite failed RBAC check.`);
  }

  // --- Update Last Activity Cookie ---
  // If we reach here, access is granted (or allowed to prevent loop). Update the activity cookie.
  const response = NextResponse.next()
  if (needsActivityUpdate) {
      console.log(`[Middleware] Updating activity cookie for ${payload.email}.`)
      // Use the expiry defined for the LAST_ACTIVITY cookie itself for its maxAge
      const lastActivityMaxAgeDays = COOKIE_EXPIRY.LAST_ACTIVITY || 1 // Default to 1 day if not defined
      response.cookies.set(COOKIE_NAMES.LAST_ACTIVITY, now.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: lastActivityMaxAgeDays * 24 * 60 * 60, // Convert days to seconds
        path: "/",
      })
  }

  return response // Return NextResponse.next() with potentially updated cookie
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
