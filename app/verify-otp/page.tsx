"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, RefreshCw, AlertCircle } from "lucide-react"
import { verifyOtp, resendOtp } from "../actions/auth-actions"

export default function VerifyOtpPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get("email") || ""
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState("")
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Focus the first input on page load
    if (otpRefs.current[0]) {
      otpRefs.current[0].focus()
    }
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [countdown])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(0, 1)
    }

    // Only allow digits
    if (value && !/^\d+$/.test(value)) {
      return
    }

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Clear any previous errors when user types
    if (error) setError("")

    // Auto-focus next input
    if (value && index < 5) {
      if (otpRefs.current[index + 1]) {
        otpRefs.current[index + 1].focus()
      }
    }

    // Auto-submit when all fields are filled
    if (value && index === 5) {
      const isAllFilled = newOtp.every((digit) => digit.length === 1)
      if (isAllFilled) {
        handleVerify(newOtp.join(""))
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      if (otpRefs.current[index - 1]) {
        otpRefs.current[index - 1].focus()
      }
    }
  }

  // Update the handleVerify function to ensure proper redirection
  const handleVerify = async (otpValue: string) => {
    if (otpValue.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      })
      return
    }

    setIsVerifying(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("email", email)
      formData.append("otp", otpValue)

      const result = await verifyOtp(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: "Your email has been verified successfully!",
        })

        // Redirect to login page after successful verification
        if (result.redirectUrl) {
          router.push(result.redirectUrl)
        } else {
          setTimeout(() => {
            router.push("/login?verified=true")
          }, 1500)
        }
      } else {
        setError(result.message || "Invalid OTP. Please try again.")
        toast({
          title: "Verification Failed",
          description: result.message || "Invalid OTP. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("OTP verification error:", error)
      setError("An error occurred during verification. Please try again.")
      toast({
        title: "Error",
        description: "An error occurred during verification. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return

    setIsResending(true)
    setError("")

    try {
      const result = await resendOtp(email)

      if (result.success) {
        toast({
          title: "OTP Resent",
          description: "A new OTP has been sent to your email address",
        })

        // Reset OTP fields
        setOtp(["", "", "", "", "", ""])

        // Focus first OTP input
        if (otpRefs.current[0]) {
          otpRefs.current[0].focus()
        }

        // Start countdown
        setCountdown(60)
      } else {
        setError(result.message || "Failed to resend OTP. Please try again.")
        toast({
          title: "Failed to Resend OTP",
          description: result.message || "An error occurred. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Resend OTP error:", error)
      setError("An error occurred while resending OTP. Please try again.")
      toast({
        title: "Error",
        description: "An error occurred while resending OTP. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
    }
  }

  if (!email) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-md bg-white rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold mb-6">Invalid Request</h1>
          <p className="text-gray-600 mb-6">No email address provided for verification.</p>
          <Link
            href="/signup"
            className="py-2 px-6 bg-[#fd9c2d] text-white rounded-lg hover:bg-[#e08c28] transition-colors"
          >
            Go to Signup
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg p-8">
        <div className="text-center mb-6">
          <CheckCircle className="w-16 h-16 text-[#fd9c2d] mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Verify Your Email</h1>
          <p className="text-gray-600 mt-2">
            We've sent a verification code to <span className="font-medium">{email}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">Enter 6-digit OTP</label>
          <div className="flex justify-between gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (otpRefs.current[index] = el)}
                type="text"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl bg-gray-200 border border-[#fd9c2d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fd9c2d]"
                maxLength={1}
                inputMode="numeric"
                pattern="[0-9]*"
                disabled={isVerifying}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => handleVerify(otp.join(""))}
          disabled={otp.join("").length !== 6 || isVerifying}
          className="w-full py-3 bg-[#fd9c2d] text-white rounded-lg hover:bg-[#e08c28] transition-colors flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isVerifying ? (
            <>
              <Loader2 className="animate-spin mr-2" size={20} />
              Verifying...
            </>
          ) : (
            "Verify Email"
          )}
        </button>

        <div className="mt-6 text-center">
          <p className="text-gray-600 mb-2">Didn't receive the code?</p>
          <button
            onClick={handleResendOtp}
            disabled={isResending || countdown > 0}
            className="text-[#fd9c2d] hover:underline flex items-center justify-center mx-auto disabled:text-gray-400 disabled:no-underline"
          >
            {isResending ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Resending...
              </>
            ) : countdown > 0 ? (
              `Resend OTP in ${countdown}s`
            ) : (
              <>
                <RefreshCw className="mr-2" size={16} />
                Resend OTP
              </>
            )}
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-[#fd9c2d] hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
