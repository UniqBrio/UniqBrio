"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

const REFRESH_CHECK_INTERVAL = 60 * 1000

export default function TokenRefreshHandler() {
  const router = useRouter()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const checkAndRefreshToken = async () => {
      // ✅ Prevent refresh if user is not logged in (use a cookie or localStorage flag)
      const isAuthenticated = localStorage.getItem("isAuthenticated")
      if (!isAuthenticated) return

      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok && response.status === 401) {
          // Session expired
          localStorage.removeItem("isAuthenticated")
          router.push("/?session=expired")
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
