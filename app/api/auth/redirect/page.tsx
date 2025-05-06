"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function AuthRedirectPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated" && session) {
      const role = session?.user?.role

      if (role === "super_admin") {
        router.replace("/profile/create")
      } else if (role === "admin") {
        router.replace("/admin/dashboard")
      } else if (role === "instructor") {
        router.replace("/instructor/dashboard")
      } else {
        router.replace("/student/dashboard")
      }
    } else if (status === "unauthenticated") {
      // Optionally, you can redirect the user to login if they're not authenticated
      router.replace("/login")
    }
  }, [session, status, router])

  if (status === "loading") {
    return <p>Loading session...</p> // Show loading text while session is being fetched
  }

  return <p>Redirecting...</p> // Fallback message during redirection
}
