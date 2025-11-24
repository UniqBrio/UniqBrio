"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import DividerWithText from "@/components/divider-with-text"
import GoogleAuthButton from "@/components/google-auth-button"
import Link from "next/link"
import { CheckCircle2, Eye, EyeOff, Loader2, Check, X, ChevronDown } from "lucide-react"
import { signup } from "../actions/auth-actions"
import { toast } from "@/components/ui/use-toast"
import AuthLayout from "@/components/auth-layout" // Import AuthLayout
import { useSearchParams } from "next/navigation"
import ConfettiCelebration from "@/components/confetti-celebration"

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(10, "Please enter a valid phone number"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(12, "Password must not exceed 12 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: "You must agree to the policies to continue" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type FormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const searchParams = useSearchParams()

  // Check for URL parameters
  const error = searchParams?.get("error")

  useEffect(() => {
    // Show toast messages based on URL params (e.g., from OAuth errors)
    if (error) {
      const errorMessages: Record<string, string> = {
        "email-exists": "An account with this email already exists.",
        "google-auth-failed": "Failed to sign up with Google.", // Example
        unknown: "An unknown error occurred. Please try again.",
      }

      const errorMessage = errorMessages[error] || errorMessages.unknown

      toast({
        title: "Signup Error",
        description: errorMessage,
        variant: "destructive",
      })
      // Optional: remove the error param from URL
      // window.history.replaceState(null, '', '/signup');
    }
  }, [error])

  const {
    register,
    handleSubmit,
    watch,
    reset, // <-- Import reset function
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
    defaultValues: {
      // role: "student", // Remove default role
    },
  })

  const password = watch("password", "")
  const termsAccepted = watch("termsAccepted")

  useEffect(() => {
    // Calculate password strength
    let strength = 0

    if (password.length >= 8) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1

    setPasswordStrength(strength)
  }, [password])

  const getPasswordStrengthText = () => {
    // Simplified strength calculation for color/text
    if (passwordStrength <= 1) return { text: "Weak", color: "red" }
    if (passwordStrength <= 3) return { text: "Fair", color: "orange" }
    if (passwordStrength === 4) return { text: "Good", color: "yellow" } // Adjusted for 5 criteria
    return { text: "Strong", color: "green" }
  }

  // --- MODIFIED onSubmit function ---
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("name", data.name)
      formData.append("email", data.email)
      formData.append("phone", data.phone)
      formData.append("password", data.password)
      formData.append("confirmPassword", data.confirmPassword)
      formData.append("role", "admin") // Always assign 'admin' role
      formData.append("termsAccepted", data.termsAccepted ? "true" : "false")
      // TODO: Backend integration - store terms acceptance timestamp in user profile
      // Example: formData.append("termsAcceptedAt", new Date().toISOString())

      const result = await signup(formData)
      if (result?.success) {
        // Show confetti celebration
        setShowCelebration(true)
        
        // After celebration (3 seconds), show the verification toast
        setTimeout(() => {
          toast({
            title: "Signup Submitted Successfully",
            description: "Verification link has been sent to your mail. Please click on the verification link to complete account creation.",
            variant: "default",
          })
        }, 3000)
        
        reset() // Reset the form fields to their default values
      } else if (result && !result.success) {
        // --- ERROR: Show specific error from server action ---
        const errorMsg =
          result.message || // Use the generic message from the action first
          (result.errors ? Object.values(result.errors)[0]?.[0] : null) || // Fallback to first validation error
          "An unknown error occurred during signup."; // Final fallback

        toast({
          title: "Signup Error",
          description: errorMsg,
          variant: "destructive",
        });
      } else {
        // Handle cases where the result format is unexpected
        throw new Error("Unexpected response from signup action.");
      }
    } catch (error) {
      // --- CATCH UNEXPECTED ERRORS (e.g., network issues) ---
      console.error("Signup submission error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      // --- Ensure loading state is always turned off ---
      setIsSubmitting(false);
    }
  };
      
  return (
    // Wrap with AuthLayout
    <AuthLayout>
      <form className="space-y-2" onSubmit={handleSubmit(onSubmit)}>
        {/* Removed AuthTabs from here, it's now in AuthLayout */}

        {/* Full Name */}
        <div className="space-y-1">
          <label htmlFor="name" className="block text-black font-medium text-sm">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Enter your full name"
            className={`w-full h-9 px-3 text-sm bg-white border border-[#8a3ffc] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8a3ffc] ${errors.name ? "border-red-500" : ""}`}
            {...register("name")}
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label htmlFor="email" className="block text-black font-medium text-sm">
            Enter your email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="abc@abc.com"
            className={`w-full h-9 px-3 text-sm bg-white border border-[#8a3ffc] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8a3ffc] ${errors.email ? "border-red-500" : ""}`}
            {...register("email")}
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
        </div>

        {/* Phone Number */}
        <div className="space-y-1">
          <label htmlFor="phone" className="block text-black font-medium text-sm">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="Enter your phone number"
            className={`w-full h-9 px-3 text-sm bg-white border border-[#8a3ffc] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8a3ffc] ${errors.phone ? "border-red-500" : ""}`}
            {...register("phone")}
          />
          {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label htmlFor="password" className="block text-black font-medium text-sm">
            Enter password (8 to 12 Characters)
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter strong password"
              className={`w-full h-9 px-3 text-sm bg-white border border-[#8a3ffc] rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-[#8a3ffc] ${errors.password ? "border-red-500" : ""}`}
              {...register("password")}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}

          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-1">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-xs text-gray-500">Password strength:</span>
                <span className={`text-xs font-medium text-${getPasswordStrengthText().color}-500`}>
                  {getPasswordStrengthText().text}
                </span>
              </div>
              <div className="w-full bg-white rounded-full h-1">
                <div
                  className={`h-1 rounded-full bg-${getPasswordStrengthText().color}-500`}
                  style={{ width: `${(passwordStrength / 5) * 100}%` }} // Divide by 5 criteria
                ></div>
              </div>

              {/* Password Criteria List */}
              <ul className="text-xs text-gray-500 mt-1 space-y-0.5">
                <li className="flex items-center">
                  {/^.{8,12}$/.test(password) ? (
                    <Check size={12} className="text-green-500 mr-1 flex-shrink-0" />
                  ) : (
                    <X size={12} className="text-red-500 mr-1 flex-shrink-0" />
                  )}
                  Between 8 and 12 characters
                </li>
                <li className="flex items-center">
                  {/[A-Z]/.test(password) ? (
                    <Check size={12} className="text-green-500 mr-1 flex-shrink-0" />
                  ) : (
                    <X size={12} className="text-red-500 mr-1 flex-shrink-0" />
                  )}
                  At least one uppercase letter
                </li>
                <li className="flex items-center">
                  {/[a-z]/.test(password) ? (
                    <Check size={12} className="text-green-500 mr-1 flex-shrink-0" />
                  ) : (
                    <X size={12} className="text-red-500 mr-1 flex-shrink-0" />
                  )}
                  At least one lowercase letter
                </li>
                <li className="flex items-center">
                  {/[0-9]/.test(password) ? (
                    <Check size={12} className="text-green-500 mr-1 flex-shrink-0" />
                  ) : (
                    <X size={12} className="text-red-500 mr-1 flex-shrink-0" />
                  )}
                  At least one number
                </li>
                <li className="flex items-center">
                  {/[^A-Za-z0-9]/.test(password) ? (
                    <Check size={12} className="text-green-500 mr-1 flex-shrink-0" />
                  ) : (
                    <X size={12} className="text-red-500 mr-1 flex-shrink-0" />
                  )}
                  At least one special character
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label htmlFor="confirmPassword" className="block text-black font-medium text-sm">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              className={`w-full h-9 px-3 text-sm bg-white border border-[#8a3ffc] rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-[#8a3ffc] ${errors.confirmPassword ? "border-red-500" : ""}`}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>}
        </div>

        {/* Terms and Conditions */}
        <div className="flex items-start pt-2">
          <div className="flex items-center h-5">
            <input
              id="terms"
              type="checkbox"
              className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-[#8a3ffc] cursor-pointer"
              {...register("termsAccepted")}
            />
          </div>
          <label htmlFor="terms" className="ml-2 text-sm text-gray-700 leading-relaxed">
            I agree to the{" "}
            <a 
              href="/legal/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#8a3ffc] font-medium hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              User Agreement
            </a>
            ,{" "}
            <a 
              href="/legal/privacy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#8a3ffc] font-medium hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Privacy Policy
            </a>
            , and{" "}
            <a 
              href="/legal/cookies" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#8a3ffc] font-medium hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Cookie Policy
            </a>
            .
          </label>
        </div>
        {errors.termsAccepted && (
          <p className="text-red-500 text-sm mt-1">{errors.termsAccepted.message}</p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full h-10 text-base font-medium text-white bg-purple-700 hover:bg-[#7535e5] rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting || !termsAccepted}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin mr-2" size={16} />
              Signing up...
            </>
          ) : (
            "Join now"
          )}
        </button>
      </form>

      {/* Login Link */}
      <div className="mt-2 text-center text-sm">
        Already on UniqBrio?{" "}
        <Link href="/login" className="text-orange-500 hover:underline font-bold">
          Login
        </Link>
      </div>

      <DividerWithText text="or" />

      {/* Google Auth Button */}
      <GoogleAuthButton mode="signup" color="purple" />

      {/* Confetti Celebration */}
      {showCelebration && (
        <ConfettiCelebration 
          message="Welcome to the family! Let's grow your academy together 🎉"
          onComplete={() => setShowCelebration(false)}
        />
      )}
    </AuthLayout>
  )
}
