"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

const REFRESH_CHECK_INTERVAL = 60 * 1000

export default function TokenRefreshHandler() {
  const router = useRouter()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const checkAndRefreshToken = async () => {
      // ✅ Check for actual session cookie first, then localStorage flag
      // This handles cases where user comes from email verification directly to register
      const hasSessionCookie = document.cookie.split(';').some(cookie => cookie.trim().startsWith('session='))
      const isAuthenticated = localStorage.getItem("isAuthenticated")
      
      // Skip refresh check if neither session cookie nor localStorage flag exists
      if (!hasSessionCookie && !isAuthenticated) return

      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          // Check if response is HTML (not JSON)
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("text/html")) {
            // Server returned HTML instead of JSON, likely a redirect or error page
            localStorage.removeItem("isAuthenticated")
            return
          }
          
          if (response.status === 401) {
            // Don't redirect if user is on registration page - they might still be completing registration
            const currentPath = window.location.pathname
            if (currentPath.startsWith('/register') || currentPath.startsWith('/verification-pending')) {
              console.log('[TokenRefresh] Skipping logout on registration/verification page')
              return
            }
            
            // Session expired
            localStorage.removeItem("isAuthenticated")
            router.push("/?session=expired")
          }
        }
      } catch (error) {
        console.error("Error refreshing token:", error)
      }
    }

    // Initial check
    checkAndRefreshToken()

    // Repeat every minute
    intervalRef.current = setInterval(checkAndRefreshToken, REFRESH_CHECK_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [router])

  return null
}
