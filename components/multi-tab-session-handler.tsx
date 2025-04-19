"use client"

import { useState, useEffect } from "react"
import { ensureDeviceId, getDeviceId } from "@/lib/cookies"
import { getSession } from "@/app/actions/auth-actions"

export default function MultiTabSessionHandler() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [existingEmail, setExistingEmail] = useState("")

  useEffect(() => {
    const checkMultiTabSession = async () => {
      // Ensure device ID exists
      ensureDeviceId()

      // Check if this is a new tab
      const isNewTab = !sessionStorage.getItem("tabInitialized")
      if (isNewTab) {
        sessionStorage.setItem("tabInitialized", "true")

        // Check if user is already logged in on this device
        const session = await getSession()

        // If user is logged in and using Gmail
        if (session && session.email && session.email.endsWith("@gmail.com")) {
          // Check localStorage for active sessions on this device
          const activeSessionsStr = localStorage.getItem("activeSessions")
          if (activeSessionsStr) {
            try {
              const activeSessions = JSON.parse(activeSessionsStr)
              const deviceId = getDeviceId()

              // If there's an active session for this device but different tab
              const deviceSession = activeSessions.find(
                (s: any) => s.deviceId === deviceId && s.tabId !== sessionStorage.getItem("tabId"),
              )

              if (deviceSession) {
                setExistingEmail(deviceSession.email)
                setShowPrompt(true)
              }
            } catch (error) {
              console.error("Error parsing active sessions:", error)
            }
          }
        }
      }
    }

    // Generate a unique tab ID
    if (!sessionStorage.getItem("tabId")) {
      sessionStorage.setItem("tabId", Math.random().toString(36).substring(2, 15))
    }

    checkMultiTabSession()

    // Set up storage event listener to detect changes in other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "activeSessions") {
        // Update the active sessions if changed in another tab
        checkMultiTabSession()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  // Register this tab's session
  useEffect(() => {
    const registerTabSession = async () => {
      const session = await getSession()

      if (session && session.email) {
        const deviceId = getDeviceId()
        const tabId = sessionStorage.getItem("tabId")

        // Get existing active sessions
        const activeSessionsStr = localStorage.getItem("activeSessions")
        let activeSessions = []

        if (activeSessionsStr) {
          try {
            activeSessions = JSON.parse(activeSessionsStr)
          } catch (error) {
            console.error("Error parsing active sessions:", error)
          }
        }

        // Add this tab's session
        const newSession = {
          deviceId,
          tabId,
          email: session.email,
          timestamp: Date.now(),
        }

        // Remove any old sessions for this tab
        activeSessions = activeSessions.filter((s: any) => s.tabId !== tabId)

        // Add the new session
        activeSessions.push(newSession)

        // Save back to localStorage
        localStorage.setItem("activeSessions", JSON.stringify(activeSessions))
      }
    }

    registerTabSession()

    // Clean up on unmount
    return () => {
      const tabId = sessionStorage.getItem("tabId")
      const activeSessionsStr = localStorage.getItem("activeSessions")

      if (activeSessionsStr && tabId) {
        try {
          let activeSessions = JSON.parse(activeSessionsStr)

          // Remove this tab's session
          activeSessions = activeSessions.filter((s: any) => s.tabId !== tabId)

          // Save back to localStorage
          localStorage.setItem("activeSessions", JSON.stringify(activeSessions))
        } catch (error) {
          console.error("Error cleaning up tab session:", error)
        }
      }
    }
  }, [])

  if (!showPrompt) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h3 className="text-xl font-semibold mb-4">Already Logged In</h3>
        <p className="text-gray-600 mb-6">
          You're already logged in as <span className="font-medium">{existingEmail}</span> in another tab. Would you
          like to continue with this account?
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowPrompt(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setShowPrompt(false)
              window.location.reload()
            }}
            className="px-4 py-2 bg-[#fd9c2d] text-white rounded-lg hover:bg-[#e08c28] transition-colors"
          >
            Continue with {existingEmail.split("@")[0]}
          </button>
        </div>
      </div>
    </div>
  )
}

