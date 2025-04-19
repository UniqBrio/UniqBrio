"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { verifyEmail } from "@/app/actions/auth-actions"
import { Loader2 } from "lucide-react"

export default function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Verifying your email...")

  useEffect(() => {
    const token = searchParams.get("token")

    if (!token) {
      setMessage("Verification token is missing or invalid.")
      setStatus("error")
      return
    }

    const performVerification = async () => {
      try {
        const result = await verifyEmail(token)

        if (result.success && result.redirect) {
          setMessage("Verification successful! Redirecting to login...")
          setStatus("success")
          router.push(result.redirect)
        } else {
          setMessage(result.message || "Email verification failed. The link might be invalid or expired.")
          setStatus("error")
        }
      } catch (error) {
        console.error("[VerifyEmailPage] Error:", error)
        setMessage("An unexpected error occurred during verification.")
        setStatus("error")
      }
    }

    performVerification()
  }, [searchParams, router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      {status === "loading" && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-semibold">{message}</p>
        </>
      )}
      {status === "success" && (
        <p className="text-lg font-semibold text-green-600">{message}</p>
      )}
      {status === "error" && (
        <>
          <p className="text-lg font-semibold text-red-600">{message}</p>
          <p className="mt-2 text-sm text-gray-600">
            If the problem persists, please contact support or try signing up again.
          </p>
        </>
      )}
    </div>
  )
}
