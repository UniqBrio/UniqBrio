import React, { Suspense } from "react" // Import Suspense 
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import NextAuthSessionProvider from "@/components/session-provider"
import CookieConsent from "@/components/cookie-consent"

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
            
            {/* Allow children (like AuthLayout) to control their own full-screen display */}
            <main className="min-h-screen">{children}</main>
            <Toaster />

            {/* Wrap components that might use client-side hooks like useSearchParams */}
            <Suspense fallback={null}>
              <CookieConsent />
              <MultiTabSessionHandler />
              <TokenRefreshHandler />
              
            </Suspense>
          </ThemeProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  )
}
