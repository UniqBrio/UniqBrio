"use client"

import { useState } from "react"
import Link from "next/link"
import { requestPasswordReset } from "../actions/auth-actions"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

type FormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("email", data.email)

      const result = await requestPasswordReset(formData)

      if (result.success) {
        setIsSuccess(true)
        toast({
          title: "Reset link sent",
          description: "Please check your email for the password reset link",
        })
      } else {
        const errorMessage = result.errors?.email?.[0] || "Failed to send reset link. Please try again."
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
      
    } catch (error) {
      console.error("Password reset request error:", error)
      setError("There was a problem sending the reset link. Please try again.")
      toast({
        title: "Error",
        description: "There was a problem sending the reset link. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Forgot password</h1>

        <p className="text-gray-600 text-center mb-6">Please enter the registered email address</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {isSuccess ? (
          <div className="text-center">
            <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-4 flex items-start">
              <CheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
              <p className="text-sm">
                Password reset link has been sent to your email address. Please check your inbox (and spam folder) for
                instructions.
              </p>
            </div>
            <Link href="/login" className="text-[#fd9c2d] hover:underline">
              Return to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-[#fd9c2d]">
                Enter your email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="abc@abc.com"
                className={`w-full p-3 bg-gray-200 rounded-lg ${errors.email ? "border-2 border-red-500" : ""}`}
                {...register("email")}
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#fd9c2d] text-white rounded-lg hover:bg-[#e08c28] transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Sending...
                </>
              ) : (
                "Request reset link"
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-[#fd9c2d] hover:underline">
            Login
          </Link>
          <span className="text-gray-400 mx-1">/</span>
          <Link href="/signup" className="text-[#fd9c2d] hover:underline">
            Signup
          </Link>
        </div>

        <div className="mt-2 text-center">
          <span className="text-gray-600">Still facing issue? </span>
          <Link href="/support" className="text-purple-700 hover:underline">
            Raise a support ticket
          </Link>
        </div>
      </div>
    </div>
  )
}
