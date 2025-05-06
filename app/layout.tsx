import React, { Suspense } from "react" // Import Suspense 
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import NextAuthSessionProvider from "@/components/session-provider"
import CookieConsent from "@/components/cookie-consent"
import SessionActivityTracker from "@/components/session-activity-tracker"
import MultiTabSessionHandler from "@/components/multi-tab-session-handler"
import TokenRefreshHandler from "@/components/token-refresh-handler"
import SessionExpiredNotification from "@/components/session-expired-notification"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "UniqBrio Authentication",
  description: "Authentication system for UniqBrio",
  generator: "v0.dev",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <NextAuthSessionProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <main className="flex min-h-screen flex-col items-center justify-center p-4">
              <div className="w-full max-w-md">{children}</div>
              <footer className="mt-8 text-center text-gray-500">
                UniqBrio Corporation © {new Date().getFullYear()}
              </footer>
            </main>
            <Toaster />

            {/* Wrap components that might use client-side hooks like useSearchParams */}
            <Suspense fallback={null}>
              <CookieConsent />
              <MultiTabSessionHandler />
              <TokenRefreshHandler />
              <SessionExpiredNotification />
            </Suspense>
          </ThemeProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  )
}
