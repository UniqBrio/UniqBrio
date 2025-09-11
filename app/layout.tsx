import React, { Suspense } from "react" // Import Suspense 
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import NextAuthSessionProvider from "@/components/session-provider"
import CookieConsent from "@/components/cookie-consent"
import MultiTabSessionHandler from "../components/multi-tab-session-handler"
import TokenRefreshHandler from "../components/token-refresh-handler"


import { SidebarPositionProvider } from "./contexts/sidebar-position-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  applicationName: "UniqBrio App", // A specific name for the PWA
  title: {
    default: "UniqBrio App", // Default title
    template: "%s | UniqBrio App", // Template for pages with specific titles
  },
  description: "A unique and brilliant application.", // Your app's description  
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json", // Link to your manifest file
  appleWebApp: {
    capable: true, // Enable add to homescreen for iOS
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Viewport configuration should be a separate export
  // This will be picked up by Next.js for all pages using this layout.
  // const viewport = { // This is implicitly handled by Next.js if exported directly
  //   width: 'device-width',
  //   initialScale: 1,
  //   themeColor: '#ffffff',
  // };
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      {/* Added a class for potential full-screen PWA styling */}
      {/* Ensure this class doesn't interfere with your existing styling */}
      <body className={`${inter.className} pwa-body`}>
        <NextAuthSessionProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <SidebarPositionProvider>
              {/* Allow children (like AuthLayout) to control their own full-screen display */}
              <main className="min-h-screen">{children}</main>
              <Toaster />

              {/* Wrap components that might use client-side hooks like useSearchParams */}
              <Suspense fallback={null}>
                <CookieConsent />
                <MultiTabSessionHandler />
                <TokenRefreshHandler />
              </Suspense>
            </SidebarPositionProvider>
          </ThemeProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  )
}

// Correct way to export viewport configuration
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff', // Corresponds to the theme-color meta tag
};

// Optional: Add some basic PWA styling if needed (e.g., for standalone display)
// You can add this to your globals.css or a dedicated PWA CSS file
/*
@media all and (display-mode: standalone) {
  .pwa-body {
    // Add styles specific to standalone mode, e.g., padding for notch/status bar
  }
}
*/
