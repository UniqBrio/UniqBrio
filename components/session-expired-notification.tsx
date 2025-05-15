"use client"

import { useEffect, useState } from "react"
import { useSearchParams, usePathname } from "next/navigation"
import { X } from "lucide-react"

export default function SessionExpiredNotification() {
  const [show, setShow] = useState(false)
  const searchParams = useSearchParams()
  const pathname = usePathname()

  useEffect(() => {
    // 1. Do not show this notification on login or signup pages at all.
    if (pathname === "/login" || pathname === "/signup") {
      setShow(false);
      return;
    }

    // 2. Show notification if session=expired is in the URL (and not on login/signup).
    if (searchParams.get("session") === "expired") {
      setShow(true);
      return;
    }

    // 3. For the timed notification on the homepage: show if user logged in,
    //    inactive for an hour, and notification not yet shown for this session's inactivity.
    //    Assumes 'lastUserActivityTime' (updated globally) and 'userLoginTime' (set on login)
    //    exist in localStorage.
    if (pathname === "/") {
      const lastActivityStr = localStorage.getItem("lastUserActivityTime");
      const loginTimeStr = localStorage.getItem("userLoginTime");
      const currentTime = Date.now();
      const oneHourInMilliseconds = 60 * 60 * 1000; // 1 hour

      // Flag to indicate if the inactivity notification has been shown for the current login session's inactivity period.
      // It's tied to the loginTimeStr to automatically reset for new sessions.
      const inactivityNotifShownForLoginSessionKey = "inactivityNotifShownForSession_" + loginTimeStr;
      const hasInactivityNotifBeenShown = loginTimeStr ? localStorage.getItem(inactivityNotifShownForLoginSessionKey) === "true" : true;


      if (loginTimeStr && lastActivityStr && !hasInactivityNotifBeenShown) {
        const lastActivityTime = Number(lastActivityStr);
        const loginTime = Number(loginTimeStr);

        const isInactiveForAnHour = currentTime - lastActivityTime >= oneHourInMilliseconds;
        // Ensure we also check that it's been at least an hour since login itself,
        // preventing notification if user logs in and is immediately "inactive" due to an old lastActivityTime.
        const hasBeenLoggedInForAnHourOrMore = currentTime - loginTime >= oneHourInMilliseconds;

        if (isInactiveForAnHour && hasBeenLoggedInForAnHourOrMore) {
          // Conditions met: logged in, inactive for an hour, notification not yet shown for this.
          const timer = setTimeout(() => {
            setShow(true);
            // Mark that the notification has been shown for this login session's inactivity.
            localStorage.setItem(inactivityNotifShownForLoginSessionKey, "true");
          }, 1000); // Show after 1 second (delay from original code)

          return () => clearTimeout(timer); // Cleanup timer.
        } else {
          // Conditions for showing (inactivity duration or time since login) not met.
          setShow(false);
        }
      } else {
        // Not logged in, or no activity tracking, or notification already shown for this session's inactivity.
        setShow(false);
      }
      return; // Processed homepage case.
    }
    // 4. For any other page not matching the above conditions, ensure notification is hidden.
    setShow(false);
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
