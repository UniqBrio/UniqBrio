'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function PreventBackNavigation() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only prevent back navigation when user is on dashboard pages (logged in)
    if (!pathname.startsWith('/dashboard')) {
      return
    }

    // Push a dummy state to prevent back navigation to login/landing pages
    const handlePopState = (event: PopStateEvent) => {
      // Check if user is trying to go back to login or landing pages
      const isDashboardPage = pathname.startsWith('/dashboard')
      
      if (isDashboardPage) {
        // Prevent going back by pushing forward again
        window.history.pushState(null, '', window.location.href)
      }
    }

    // Push initial state
    window.history.pushState(null, '', window.location.href)
    
    // Listen for back button
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [pathname, router])

  return null
}
