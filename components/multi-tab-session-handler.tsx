"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ensureDeviceId } from "@/lib/cookies"

// Broadcast channel for cross-tab communication
const BROADCAST_CHANNEL_NAME = "uniqbrio_session_sync"
const SESSION_STORAGE_KEY = "current_tab_session"

interface TabSession {
  id: string
  email: string
  tenantId?: string
  timestamp: number
}

interface SessionResponse {
  authenticated: boolean
  session: {
    id: string
    email: string
    role: string
    tenantId?: string
    name?: string
  } | null
}

// Fetch session from API instead of server action to avoid JSON parse errors
async function fetchSession(): Promise<SessionResponse["session"] | null> {
  try {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    })
    
    if (!response.ok) {
      return null
    }
    
    const data: SessionResponse = await response.json()
    return data.authenticated ? data.session : null
  } catch (error) {
    console.error("[MultiTabSession] Error fetching session:", error)
    return null
  }
}

export default function MultiTabSessionHandler() {
  const [showSessionConflict, setShowSessionConflict] = useState(false)
  const [conflictInfo, setConflictInfo] = useState<{
    currentEmail: string
    newEmail: string
    action: "switched" | "logged_out"
  } | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null)
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Get the stored session for this specific tab
  const getTabSession = useCallback((): TabSession | null => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }, [])

  // Store session for this specific tab
  const setTabSession = useCallback((session: TabSession | null) => {
    try {
      if (session) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY)
      }
    } catch (error) {
      console.error("Error storing tab session:", error)
    }
  }, [])

  // Handle session conflict - force page refresh with proper state
  const handleSessionConflict = useCallback((action: "refresh" | "logout") => {
    setShowSessionConflict(false)
    if (action === "logout") {
      // Clear tab session and redirect to login
      setTabSession(null)
      router.push("/login?reason=session_conflict")
    } else {
      // Clear old tab session and refresh to load new session data
      setTabSession(null)
      window.location.reload()
    }
  }, [router, setTabSession])

  // Check if session has changed
  const checkSessionSync = useCallback(async () => {
    // Skip check on public/login pages
    const publicPaths = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email", "/", "/legal", "/UBAdmin"]
    if (publicPaths.some(p => pathname === p || pathname.startsWith(p + "/"))) {
      return
    }

    try {
      const currentServerSession = await fetchSession()
      const tabSession = getTabSession()

      // Case 1: Server has no session (logged out elsewhere)
      if (!currentServerSession) {
        if (tabSession) {
          // User was logged in but session is now gone
          setConflictInfo({
            currentEmail: tabSession.email,
            newEmail: "",
            action: "logged_out"
          })
          setShowSessionConflict(true)
          setTabSession(null)
        }
        return
      }

      // Case 2: Tab has no stored session but server has one (fresh tab or page refresh)
      if (!tabSession) {
        // Store the current session for this tab
        setTabSession({
          id: currentServerSession.id,
          email: currentServerSession.email,
          tenantId: currentServerSession.tenantId,
          timestamp: Date.now()
        })
        return
      }

      // Case 3: Session mismatch - different user logged in elsewhere
      if (tabSession.id !== currentServerSession.id || tabSession.email !== currentServerSession.email) {
        setConflictInfo({
          currentEmail: tabSession.email,
          newEmail: currentServerSession.email,
          action: "switched"
        })
        setShowSessionConflict(true)
      }
    } catch (error) {
      console.error("Error checking session sync:", error)
    }
  }, [pathname, getTabSession, setTabSession])

  // Initialize and set up listeners
  useEffect(() => {
    // Ensure device ID exists
    ensureDeviceId()

    // Generate unique tab ID if not exists
    if (!sessionStorage.getItem("tabId")) {
      sessionStorage.setItem("tabId", `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`)
    }

    // Initial session check
    checkSessionSync()

    // Set up BroadcastChannel for cross-tab communication
    if (typeof BroadcastChannel !== "undefined") {
      broadcastChannelRef.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
      
      broadcastChannelRef.current.onmessage = (event) => {
        const { type } = event.data
        
        if (type === "SESSION_CHANGED") {
          // Another tab logged in/out, check our session
          checkSessionSync()
        } else if (type === "LOGOUT") {
          // Another tab logged out
          const tabSession = getTabSession()
          if (tabSession) {
            setConflictInfo({
              currentEmail: tabSession.email,
              newEmail: "",
              action: "logged_out"
            })
            setShowSessionConflict(true)
            setTabSession(null)
          }
        }
      }
    }

    // Periodic check every 5 seconds (backup for edge cases)
    checkIntervalRef.current = setInterval(checkSessionSync, 5000)

    // Also check when window gains focus (user switches tabs)
    const handleFocus = () => {
      checkSessionSync()
    }
    window.addEventListener("focus", handleFocus)

    // Check on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSessionSync()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Storage event listener (for localStorage changes from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "session_broadcast") {
        checkSessionSync()
      }
    }
    window.addEventListener("storage", handleStorageChange)

    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close()
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [checkSessionSync, getTabSession, setTabSession])

  // Expose broadcast function for login/logout actions to call
  useEffect(() => {
    // Make broadcast function available globally for auth actions
    (window as any).__broadcastSessionChange = (type: "SESSION_CHANGED" | "LOGOUT") => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({ type })
      }
      // Also use localStorage as fallback (triggers storage event in other tabs)
      localStorage.setItem("session_broadcast", `${type}_${Date.now()}`)
    }

    return () => {
      delete (window as any).__broadcastSessionChange
    }
  }, [])

  if (!showSessionConflict || !conflictInfo) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
            <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {conflictInfo.action === "logged_out" ? "Session Ended" : "Account Changed"}
          </h3>
        </div>

        {conflictInfo.action === "logged_out" ? (
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You were logged out in another tab or your session has expired. 
            You were signed in as <span className="font-semibold text-gray-900 dark:text-white">{conflictInfo.currentEmail}</span>.
          </p>
        ) : (
          <div className="text-gray-600 dark:text-gray-300 mb-6">
            <p className="mb-2">
              A different account was logged in from another tab.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1">
              <p className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">This tab:</span>{" "}
                <span className="font-medium text-gray-900 dark:text-white">{conflictInfo.currentEmail}</span>
              </p>
              <p className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">New session:</span>{" "}
                <span className="font-medium text-gray-900 dark:text-white">{conflictInfo.newEmail}</span>
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {conflictInfo.action === "switched" && (
            <button
              onClick={() => handleSessionConflict("refresh")}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#7030a0] to-[#9030c0] text-white rounded-lg hover:from-[#602090] hover:to-[#8020b0] transition-all font-medium"
            >
              Continue as {conflictInfo.newEmail.split("@")[0]}
            </button>
          )}
          <button
            onClick={() => handleSessionConflict("logout")}
            className={`${conflictInfo.action === "logged_out" ? "flex-1" : ""} px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium text-gray-700 dark:text-gray-300`}
          >
            {conflictInfo.action === "logged_out" ? "Go to Login" : "Log Out"}
          </button>
        </div>
      </div>
    </div>
  )
}

