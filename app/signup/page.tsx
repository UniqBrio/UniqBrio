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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import AuthLayout from "@/components/auth-layout" // Import AuthLayout
import { useSearchParams } from "next/navigation"
import ConfettiCelebration from "@/components/confetti-celebration"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TermsContent } from "@/components/legal/terms-content"
import { PrivacyContent } from "@/components/legal/privacy-content"
import { CookiesContent } from "@/components/legal/cookies-content"

const signupSchema = z
  .object({
    name: z.string()
      .min(2, "Name must be at least 2 characters")
      .regex(/^[a-zA-Z\s.'-]+$/, "Name can only contain letters, spaces, dots, apostrophes, and hyphens"),
    email: z.string()
      .min(1, "Email address is required")
      .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please enter a valid email address (e.g., user@example.com)")
      .email("Please enter a valid email address"),
    phone: z.string()
      .min(10, "Please enter a valid phone number")
      .regex(/^[0-9]+$/, "Phone number can only contain numbers"),
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

interface SignupPageProps {
  initialPlan?: 'free' | 'grow' | 'scale' | 'beta';
}

export default function SignupPage({ initialPlan }: SignupPageProps = {}) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; title: string; description?: string } | null>(null)
  const searchParams = useSearchParams()

  // Check for URL parameters - prioritize query param over initialPlan prop
  const error = searchParams?.get("error")
  const planFromQuery = searchParams?.get("plan") as 'free' | 'grow' | 'scale' | 'beta' | null
  const selectedPlan = planFromQuery || initialPlan || 'free' // Query param > Prop > Default

  useEffect(() => {
    // Show feedback messages based on URL params (e.g., from OAuth errors)
    if (error) {
      const errorMessages: Record<string, string> = {
        "email-exists": "An account with this email already exists.",
        "google-auth-failed": "Failed to sign up with Google.", // Example
        unknown: "An unknown error occurred. Please try again.",
      }

      const errorMessage = errorMessages[error] || errorMessages.unknown

      setFeedback({
        variant: "error",
        title: "Signup Error",
        description: errorMessage,
      })
      // Optional: remove the error param from URL
      // window.history.replaceState(null, '', '/signup');
    }
  }, [error])

  // Auto-dismiss feedback after 6 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

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
      // Add plan information - use selectedPlan which reads from query param or prop
      formData.append("planChoosed", selectedPlan)
      // Add client-side device info
      if (typeof navigator !== 'undefined') {
        formData.append("userAgent", navigator.userAgent || '')
      }
      // TODO: Backend integration - store terms acceptance timestamp in user profile
      // Example: formData.append("termsAcceptedAt", new Date().toISOString())

      const result = await signup(formData)
      if (result?.success) {
        // Show confetti celebration
        setShowCelebration(true)
        
        // After celebration (3 seconds), show the verification feedback
        setTimeout(() => {
          setFeedback({
            variant: "success",
            title: "Signup Submitted Successfully",
            description: "Verification link has been sent to your mail. Please click on the verification link to complete account creation.",
          })
        }, 3000)
        
        reset() // Reset the form fields to their default values
      } else if (result && !result.success) {
        // --- ERROR: Show specific error from server action ---
        const errorMsg =
          result.message || // Use the generic message from the action first
          (result.errors ? Object.values(result.errors)[0]?.[0] : null) || // Fallback to first validation error
          "An unknown error occurred during signup."; // Final fallback

        setFeedback({
          variant: "error",
          title: "Signup Error",
          description: errorMsg,
        });
      } else {
        // Handle cases where the result format is unexpected
        throw new Error("Unexpected response from signup action.");
      }
    } catch (error) {
      // --- CATCH UNEXPECTED ERRORS (e.g., network issues) ---
      console.error("Signup submission error:", error);
      setFeedback({
        variant: "error",
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
      });
    } finally {
      // --- Ensure loading state is always turned off ---
      setIsSubmitting(false);
    }
  };
      
  return (
    // Wrap with AuthLayout
    <AuthLayout>
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        {/* Removed AuthTabs from here, it's now in AuthLayout */}

        {/* Plan Selection Banner - Show if plan was pre-selected from URL */}
        {selectedPlan && selectedPlan !== 'free' && (
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-center animate-in fade-in duration-300">
            <p className="text-sm text-purple-700 font-medium">
              You selected the <span className="font-bold capitalize">{selectedPlan}</span> plan
            </p>
          </div>
        )}

        {/* Full Name */}
        <div className="space-y-1">
          <label htmlFor="name" className="block text-black font-medium text-sm">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Enter your full name"
            className={`w-full h-10 px-3 text-sm bg-white border border-[#8a3ffc] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8a3ffc] ${errors.name ? "border-red-500" : ""}}`}
            {...register("name")}            onInput={(e) => {
              const target = e.target as HTMLInputElement;
              target.value = target.value.replace(/[0-9]/g, '');
            }}            autoFocus
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          {watch("name") && (
            <ul className="text-xs text-gray-500 dark:text-white mt-1 space-y-0.5">
              <li className="flex items-center">
                {watch("name").length >= 2 ? (
                  <Check size={12} className="text-green-500 mr-1 flex-shrink-0" />
                ) : (
                  <X size={12} className="text-red-500 mr-1 flex-shrink-0" />
                )}
                At least 2 characters
              </li>
              <li className="flex items-center">
                {/^[a-zA-Z\s.'-]+$/.test(watch("name")) ? (
                  <Check size={12} className="text-green-500 mr-1 flex-shrink-0" />
                ) : (
                  <X size={12} className="text-red-500 mr-1 flex-shrink-0" />
                )}
                Only letters, spaces, dots, apostrophes, and hyphens
              </li>
            </ul>
          )}
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <Alert variant={feedback.variant === "error" ? "destructive" : "default"} className="mb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <AlertTitle>{feedback.title}</AlertTitle>
                {feedback.description && (
                  <AlertDescription>{feedback.description}</AlertDescription>
                )}
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </Alert>
        )}

        {/* Email */}
        <div className="space-y-1">
          <label htmlFor="email" className="block text-black font-medium text-sm">
            Enter your email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="abc@abc.com"
            className={`w-full h-10 px-3 text-sm bg-white border border-[#8a3ffc] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8a3ffc] ${errors.email ? "border-red-500" : ""}`}
            {...register("email")}
            onInput={(e) => {
              const target = e.target as HTMLInputElement;
              // Remove spaces and convert to lowercase for consistency
              target.value = target.value.replace(/\s/g, '').toLowerCase();
            }}
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          {watch("email") && (
            <ul className="text-xs text-gray-500 dark:text-white mt-1 space-y-0.5">
              <li className="flex items-center">
                {watch("email").includes('@') ? (
                  <Check size={12} className="text-green-500 mr-1 flex-shrink-0" />
                ) : (
                  <X size={12} className="text-red-500 mr-1 flex-shrink-0" />
                )}
                Contains @ symbol
              </li>
              <li className="flex items-center">
                {/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(watch("email")) ? (
                  <Check size={12} className="text-green-500 mr-1 flex-shrink-0" />
                ) : (
                  <X size={12} className="text-red-500 mr-1 flex-shrink-0" />
                )}
                Valid email format (e.g., user@domain.com)
              </li>
            </ul>
          )}
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
            className={`w-full h-10 px-3 text-sm bg-white border border-[#8a3ffc] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8a3ffc] ${errors.phone ? "border-red-500" : ""}`}
            {...register("phone")}
            onInput={(e) => {
              const target = e.target as HTMLInputElement;
              target.value = target.value.replace(/[^0-9]/g, '');
            }}
          />
          {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
          {watch("phone") && (
            <ul className="text-xs text-gray-500 dark:text-white mt-1 space-y-0.5">
              <li className="flex items-center">
                {watch("phone").length >= 10 ? (
                  <Check size={12} className="text-green-500 mr-1 flex-shrink-0" />
                ) : (
                  <X size={12} className="text-red-500 mr-1 flex-shrink-0" />
                )}
                At least 10 digits
              </li>
              <li className="flex items-center">
                {/^[0-9]+$/.test(watch("phone")) ? (
                  <Check size={12} className="text-green-500 mr-1 flex-shrink-0" />
                ) : (
                  <X size={12} className="text-red-500 mr-1 flex-shrink-0" />
                )}
                Only numbers allowed
              </li>
            </ul>
          )}
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
              className={`w-full h-10 px-3 text-sm bg-white border border-[#8a3ffc] rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-[#8a3ffc] ${errors.password ? "border-red-500" : ""}`}
              {...register("password")}
            />
              <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-white"
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
                <span className="text-xs text-gray-500 dark:text-white">Password strength:</span>
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
              <ul className="text-xs text-gray-500 dark:text-white mt-1 space-y-0.5">
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
              className={`w-full h-10 px-3 text-sm bg-white border border-[#8a3ffc] rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-[#8a3ffc] ${errors.confirmPassword ? "border-red-500" : ""}`}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-white"
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
          <label htmlFor="terms" className="ml-2 text-sm text-gray-700 dark:text-white leading-relaxed">
            I agree to the{" "}
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="text-[#8a3ffc] font-medium hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  User Agreement
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Terms of Service</DialogTitle>
                </DialogHeader>
                <TermsContent />
              </DialogContent>
            </Dialog>
            ,{" "}
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="text-[#8a3ffc] font-medium hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy Policy
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Privacy Policy</DialogTitle>
                </DialogHeader>
                <PrivacyContent />
              </DialogContent>
            </Dialog>
            , and{" "}
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="text-[#8a3ffc] font-medium hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Cookie Policy
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Cookie Policy</DialogTitle>
                </DialogHeader>
                <CookiesContent />
              </DialogContent>
            </Dialog>
            .
          </label>
        </div>
        {errors.termsAccepted && (
          <p className="text-red-500 text-sm mt-1">{errors.termsAccepted.message}</p>
        )}

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            className="w-full max-w-xs h-9 text-sm font-medium text-white bg-purple-700 hover:bg-[#7535e5] rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
      </form>

      {/* Login Link */}
      <div className="mt-3 text-center text-sm">
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
