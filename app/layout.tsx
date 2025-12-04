import React, { Suspense } from "react" // Import Suspense 
import { Source_Sans_3 } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import NextAuthSessionProvider from "@/components/session-provider"
import CookieConsent from "@/components/cookie-consent"
import MultiTabSessionHandler from "../components/multi-tab-session-handler"
import TokenRefreshHandler from "../components/token-refresh-handler"


import { SidebarPositionProvider } from "./contexts/sidebar-position-context"
import { AppProvider } from "@/contexts/dashboard/app-context"
import ShadcnVariablesExposer from "@/components/shadcn-variables-exposer"

const sourceSans = Source_Sans_3({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"]
})

export const metadata = {
  applicationName: "UniqBrio App", // A specific name for the PWA
  title: {
    default: "UniqBrio App", // Default title
    template: "%s | UniqBrio App", // Template for pages with specific titles
  },
  description: "A unique and brilliant application.", // Your app's description  
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json", // Link to your manifest file
  appleWebApp: {
    capable: true, // Enable add to homescreen for iOS
    title: "UniqBrio App",
    statusBarStyle: "default",
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
    <html lang="en" suppressHydrationWarning data-shadcn-ui="true">
      <head>
        <meta name="shadcn-ui" content="configured" />
        <script
          async
          crossOrigin="anonymous"
          src="https://tweakcn.com/live-preview.min.js"
        />
      </head>
      {/* Added a class for potential full-screen PWA styling */}
      {/* Ensure this class doesn't interfere with your existing styling */}
      <body className={`${sourceSans.className} pwa-body`}>
        <NextAuthSessionProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <SidebarPositionProvider>
              <AppProvider>
                {/* Allow children (like AuthLayout) to control their own full-screen display */}
                <main className="min-h-screen">{children}</main>
                <ShadcnVariablesExposer />
                <Toaster />

                {/* Wrap components that might use client-side hooks like useSearchParams */}
                <Suspense fallback={null}>
                  <CookieConsent />
                  {/* <MultiTabSessionHandler /> */}
                  <TokenRefreshHandler />
                </Suspense>
              </AppProvider>
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
