import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "./lib/auth"
import { COOKIE_NAMES } from "./lib/cookies"

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname

  // Update the publicPaths array to ensure all public routes are properly excluded
  const publicPaths = [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/verify-otp",
    "/support",
    "/api/auth",
    "/troubleshoot",
    "/reset-success",
    "/verification-pending",
    "/api/payload", // Add Payload CMS API routes
  ]

  // Make sure the path matching logic is correct
  const isPublicPath = publicPaths.some(
    (publicPath) =>
      path === publicPath ||
      path.startsWith(`${publicPath}/`) ||
      path.startsWith("/api/auth") ||
      path.startsWith("/api/payload") ||
      path.startsWith("/_next") ||
      path.includes("."), // Static files
  )

  // If it's a public path, allow access
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Get the session cookie
  const sessionCookie = request.cookies.get(COOKIE_NAMES.SESSION)?.value

  // If there's no session cookie, redirect to login
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Verify the token
  const payload = verifyToken(sessionCookie)

  // If the token is invalid, redirect to login
  if (!payload) {
    const response = NextResponse.redirect(new URL("/login?sessionExpired=true", request.url))
    response.cookies.delete(COOKIE_NAMES.SESSION)
    response.cookies.delete(COOKIE_NAMES.LAST_ACTIVITY)
    return response
  }

  // Check for session activity
  const lastActivityCookie = request.cookies.get(COOKIE_NAMES.LAST_ACTIVITY)?.value

  if (lastActivityCookie) {
    const lastActivity = Number.parseInt(lastActivityCookie, 10)
    const now = Date.now()

    // Check if session has been inactive for too long (30 minutes)
    const inactiveTime = now - lastActivity
    const maxInactiveTime = 30 * 60 * 1000 // 30 minutes

    if (inactiveTime > maxInactiveTime) {
      // Session has been inactive for too long
      const response = NextResponse.redirect(new URL("/?session=expired", request.url))
      response.cookies.delete(COOKIE_NAMES.SESSION)
      response.cookies.delete(COOKIE_NAMES.LAST_ACTIVITY)
      return response
    }
  } else {
    // No last activity cookie, set one
    const response = NextResponse.next()
    response.cookies.set(COOKIE_NAMES.LAST_ACTIVITY, Date.now().toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    })
    return response
  }

  // Role-based access control
  const userRole = payload.role

  // Define role-specific paths
  const superAdminPaths = ["/super-admin", "/profile/create"]
  const adminPaths = ["/admin"]
  const instructorPaths = ["/instructor"]
  const studentPaths = ["/student"]

  // Check if user is accessing a path they're not authorized for
  if (
    (userRole !== "super_admin" && superAdminPaths.some((p) => path.startsWith(p))) ||
    (userRole !== "admin" && userRole !== "super_admin" && adminPaths.some((p) => path.startsWith(p))) ||
    (userRole !== "instructor" &&
      userRole !== "super_admin" &&
      userRole !== "admin" &&
      instructorPaths.some((p) => path.startsWith(p))) ||
    (userRole !== "student" &&
      userRole !== "super_admin" &&
      userRole !== "admin" &&
      userRole !== "instructor" &&
      studentPaths.some((p) => path.startsWith(p)))
  ) {
    // Redirect to appropriate dashboard based on role
    let redirectPath = "/"
    switch (userRole) {
      case "super_admin":
        redirectPath = "/super-admin/dashboard"
        break
      case "admin":
        redirectPath = "/admin/dashboard"
        break
      case "instructor":
        redirectPath = "/instructor/dashboard"
        break
      case "student":
        redirectPath = "/student/dashboard"
        break
    }

    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // Update last activity
  const response = NextResponse.next()
  response.cookies.set(COOKIE_NAMES.LAST_ACTIVITY, Date.now().toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 1 day
    path: "/",
  })

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
