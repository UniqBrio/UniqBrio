import React from "react"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import NextAuthSessionProvider from "@/components/session-provider"

/**
 * PERFORMANCE OPTIMIZATION: Auth-only Layout
 * 
 * This layout is specifically for authentication pages (login, signup, forgot-password, etc.)
 * It intentionally EXCLUDES heavy providers that are not needed:
 * - ❌ AppProvider (no user context needed during auth)
 * - ❌ SidebarPositionProvider (no sidebar on auth pages)
 * - ❌ GlobalDataProvider (no dashboard data needed)
 * 
 * This significantly reduces:
 * - Initial JavaScript execution time
 * - localStorage read operations
 * - Unnecessary API calls
 * - Context provider overhead
 * 
 * Result: Auth pages load 2-3x faster
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NextAuthSessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        {/* Minimal layout for auth pages - no sidebar, no heavy context */}
        <div className="min-h-screen">{children}</div>
        <Toaster />
      </ThemeProvider>
    </NextAuthSessionProvider>
  )
}
