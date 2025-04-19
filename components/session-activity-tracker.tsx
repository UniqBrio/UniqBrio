"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { updateLastActivity, isSessionActive, SESSION_TIMEOUT } from "@/lib/cookies"
import { logout } from "@/app/actions/auth-actions"

export default function SessionActivityTracker() {
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const activityRef = useRef<NodeJS.Timeout | null>(null)

  const handleUserActivity = () => {
    // Debounce to avoid frequent calls
    if (activityRef.current) clearTimeout(activityRef.current)

    activityRef.current = setTimeout(() => {
      updateLastActivity()

      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      timeoutRef.current = setTimeout(async () => {
        await logout()
        router.push("/?session=expired")
      }, SESSION_TIMEOUT)
    }, 300)
  }

  useEffect(() => {
    if (typeof window === "undefined") return

    if (!isSessionActive()) {
      // Graceful session expiry
      setTimeout(() => {
        logout().then(() => router.push("/?session=expired"))
      }, 5000)
      return
    }

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"]
    events.forEach((event) => window.addEventListener(event, handleUserActivity))

    // Fire once at start
    handleUserActivity()

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleUserActivity))
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (activityRef.current) clearTimeout(activityRef.current)
    }
  }, [router])

  return null
}
