"use client"

import { useEffect, useState, Suspense } from "react" // Import Suspense
import { useSearchParams, useRouter } from "next/navigation"
import { verifyEmail } from "@/app/actions/auth-actions"
import { Loader2 } from "lucide-react"

// This component contains the logic that uses useSearchParams
function VerifyEmailLogic() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Verifying your email...")
  const [isExpired, setIsExpired] = useState(false)

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
          setTimeout(() => {
            router.push(result.redirect!)
          }, 2000)
        } else {
          setMessage(result.message || "Email verification failed. The link might be invalid or expired.")
          setStatus("error")
          setIsExpired(result.expired || false)
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white p-4 text-center">
      {status === "loading" && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-semibold">{message}</p>
        </>
      )}
      {status === "success" && (
        <>
          <div className="mb-4 text-6xl">✅</div>
          <p className="text-lg font-semibold text-green-600 dark:text-green-400">{message}</p>
        </>
      )}
      {status === "error" && (
        <>
          <div className="mb-4 text-6xl">❌</div>
          <p className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">{message}</p>
          {isExpired && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg max-w-md">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                Your verification link has expired. You can request a new one from the login page.
              </p>
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                Go to Login
              </button>
            </div>
          )}
          {!isExpired && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              If the problem persists, please{" "}
              <button
                onClick={() => router.push('/login')}
                className="text-primary hover:underline"
              >
                try logging in
              </button>{" "}
              or contact support.
            </p>
          )}
        </>
      )}
    </div>
  )
}

// This is the actual page component that Next.js will render.
// It wraps the logic component with Suspense.
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white p-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-semibold">Loading verification...</p>
        </div>
      }
    >
      <VerifyEmailLogic />
    </Suspense>
  )
}
