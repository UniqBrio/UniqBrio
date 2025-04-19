"use client"

import { useEffect, useState } from "react"
import { useSearchParams, usePathname } from "next/navigation"
import { X } from "lucide-react"

export default function SessionExpiredNotification() {
  const [show, setShow] = useState(false)
  const searchParams = useSearchParams()
  const pathname = usePathname()

  useEffect(() => {
    // Show notification if session=expired is in the URL
    if (searchParams.get("session") === "expired") {
      setShow(true)
      return
    }

    // Only show the notification on the homepage
    if (pathname !== "/") return

    // Check when the notification was last shown
    const lastShown = localStorage.getItem("sessionNotificationLastShown")
    const currentTime = Date.now()

    // Only show the notification if it hasn't been shown in the last hour
    if (!lastShown || currentTime - Number.parseInt(lastShown) > 60 * 60 * 1000) {
      // Show the notification after 5 seconds
      const timer = setTimeout(() => {
        setShow(true)
        // Store the current time as the last shown time
        localStorage.setItem("sessionNotificationLastShown", currentTime.toString())
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [searchParams, pathname])

  const handleClose = () => {
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed top-4 right-4 left-4 md:left-auto md:w-96 bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-red-800">Session Expired</h3>
          <p className="text-sm text-red-700 mt-1">
            Your session has expired due to inactivity. Please log in again to continue.
          </p>
        </div>
        <button onClick={handleClose} className="text-red-500 hover:text-red-700">
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

