"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function AuthRedirectPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      const role = session.user.role

      if (role === "super_admin") {
        router.replace("/profile/create")
      } else if (role === "admin") {
        router.replace("/admin/dashboard")
      } else if (role === "instructor") {
        router.replace("/instructor/dashboard")
      } else {
        router.replace("/student/dashboard")
      }
    }
  }, [session, status, router])

  return <p>Redirecting...</p>
}
