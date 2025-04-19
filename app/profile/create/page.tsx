"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle } from "lucide-react"
import { createBusinessProfile } from "@/app/actions/auth-actions"

const profileSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  businessType: z.string().min(1, "Business type is required"),
  businessSubType: z.string().min(1, "Business sub type is required"),
  registeredOwner: z.string().min(1, "Registered owner is required"),
  businessDescription: z.string().min(10, "Please provide a description (min 10 characters)"),
  address: z.string().min(1, "Address is required"),
  businessCountry: z.string().min(1, "Country is required"),
  phoneNumber: z.string().min(10, "Please enter a valid phone number"),
})

type FormData = z.infer<typeof profileSchema>

export default function ProfileCreationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showOtpSection, setShowOtpSection] = useState(false)
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isVerified, setIsVerified] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [resendDisabled, setResendDisabled] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const formDataRef = useRef<FormData | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      businessName: "Fitness Studio",
      businessType: "Gym",
      businessSubType: "Free text",
      registeredOwner: "Individual/group name",
      businessDescription:
        "UniqBrio was established in 2025 and is primarily known for providing various types of courses related to Arts, Gym, Teaching ...",
      address: "",
      businessCountry: "India",
      phoneNumber: "8956648738",
    },
  })

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [countdown, resendDisabled])

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    formDataRef.current = data

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Show OTP section
      setShowOtpSection(true)
      toast({
        title: "OTP sent",
        description: "A verification code has been sent to your phone number",
      })

      // Focus first OTP input
      setTimeout(() => {
        if (otpRefs.current[0]) {
          otpRefs.current[0].focus()
        }
      }, 100)
    } catch (error) {
      console.error("Profile creation error:", error)
      toast({
        title: "Error",
        description: "There was a problem creating your profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(0, 1);
    }
  
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
  
    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  
    // Auto-submit when all fields are filled
    if (value && index === 5) {
      const isAllFilled = newOtp.every((digit) => digit.length === 1);
      if (isAllFilled) {
        verifyOtp();
      }
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };
  
const verifyOtp = async () => {
  setIsVerifying(true)

  try {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const enteredOtp = otp.join("")

    if (enteredOtp.length === 6) {
      setIsVerified(true)
      toast({
        title: "Verification successful",
        description: "Your phone number has been verified",
      })

      // Ensure formDataRef.current exists before accessing
      if (formDataRef.current) {
        const formData = new FormData()
        Object.entries(formDataRef.current).forEach(([key, value]) => {
          formData.append(key, value)
        })

        await createBusinessProfile(formData)
      }
    } else {
      toast({
        title: "Invalid OTP",
        description: "Please enter the correct verification code",
        variant: "destructive",
      })
    }
  } catch (error) {
    console.error("OTP verification error:", error)
    toast({
      title: "Error",
      description: "There was a problem verifying your OTP. Please try again.",
      variant: "destructive",
    })
  } finally {
    setIsVerifying(false)
  }
}


  const resendOtp = async () => {
    setResendDisabled(true)
    setCountdown(30)

    try {
      // Simulate resending OTP
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "OTP resent",
        description: "A new verification code has been sent to your phone number",
      })

      // Clear OTP fields
      setOtp(["", "", "", "", "", ""])

      // Focus first OTP input
      if (otpRefs.current[0]) {
        otpRefs.current[0].focus()
      }
    } catch (error) {
      console.error("Resend OTP error:", error)
      toast({
        title: "Error",
        description: "There was a problem sending a new OTP. Please try again.",
        variant: "destructive",
      })
      setResendDisabled(false)
      setCountdown(0)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Profile creation</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="businessName" className="block text-gray-500">
            Business Name
          </label>
          <input
            id="businessName"
            type="text"
            className={`w-full p-3 bg-gray-200 rounded-lg ${errors.businessName ? "border-2 border-red-500" : ""}`}
            {...register("businessName")}
          />
          {errors.businessName && <p className="text-red-500 text-sm">{errors.businessName.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="businessType" className="block text-gray-500">
            Business Type
          </label>
          <div className="relative">
            <select
              id="businessType"
              className={`w-full p-3 bg-gray-200 rounded-lg appearance-none ${errors.businessType ? "border-2 border-red-500" : ""}`}
              {...register("businessType")}
            >
              <option value="Gym">Gym</option>
              <option value="Studio">Studio</option>
              <option value="School">School</option>
              <option value="Other">Other</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4 6L8 10L12 6"
                  stroke="#39006f"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          {errors.businessType && <p className="text-red-500 text-sm">{errors.businessType.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="registeredOwner" className="block text-gray-500">
            Registered owner
          </label>
          <input
            id="registeredOwner"
            type="text"
            className={`w-full p-3 bg-gray-200 rounded-lg ${errors.registeredOwner ? "border-2 border-red-500" : ""}`}
            {...register("registeredOwner")}
          />
          {errors.registeredOwner && <p className="text-red-500 text-sm">{errors.registeredOwner.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="businessSubType" className="block text-gray-500">
            Business sub type
          </label>
          <input
            id="businessSubType"
            type="text"
            className={`w-full p-3 bg-gray-200 rounded-lg ${errors.businessSubType ? "border-2 border-red-500" : ""}`}
            {...register("businessSubType")}
          />
          {errors.businessSubType && <p className="text-red-500 text-sm">{errors.businessSubType.message}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="businessDescription" className="block text-gray-500">
            Business Description*
          </label>
          <textarea
            id="businessDescription"
            className={`w-full p-3 bg-gray-200 rounded-lg min-h-[100px] ${errors.businessDescription ? "border-2 border-red-500" : ""}`}
            {...register("businessDescription")}
          />
          {errors.businessDescription && <p className="text-red-500 text-sm">{errors.businessDescription.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="address" className="block text-gray-500">
            Address*
          </label>
          <input
            id="address"
            type="text"
            className={`w-full p-3 bg-gray-200 rounded-lg ${errors.address ? "border-2 border-red-500" : ""}`}
            {...register("address")}
          />
          {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="businessCountry" className="block text-gray-500">
            Business Country
          </label>
          <input
            id="businessCountry"
            type="text"
            className={`w-full p-3 bg-gray-200 rounded-lg ${errors.businessCountry ? "border-2 border-red-500" : ""}`}
            {...register("businessCountry")}
          />
          {errors.businessCountry && <p className="text-red-500 text-sm">{errors.businessCountry.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="phoneNumber" className="block text-gray-500">
            Phone Number
          </label>
          <div className="flex">
            <div className="bg-gray-200 p-3 rounded-l-lg border-r border-gray-300">
              <span>91</span>
            </div>
            <input
              id="phoneNumber"
              type="text"
              className={`flex-1 p-3 bg-gray-200 rounded-r-lg ${errors.phoneNumber ? "border-2 border-red-500" : ""}`}
              {...register("phoneNumber")}
            />
          </div>
          {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber.message}</p>}
        </div>

        <div className="md:col-span-2 flex justify-between items-center">
          <button
            type="submit"
            disabled={isSubmitting || showOtpSection}
            className="py-3 px-6 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors flex items-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                Creating...
              </>
            ) : (
              "Create Profile"
            )}
          </button>

          {showOtpSection && <div className="text-gray-600">Please enter the OTP to complete the profile</div>}
        </div>
      </form>

      {showOtpSection && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl mb-4">Enter OTP</h2>
          <p className="text-gray-600 mb-4">
            A 6-digit verification code has been sent to your phone number ending with{" "}
            {formDataRef.current?.phoneNumber.slice(-4)}
          </p>

          <div className="flex gap-2 mb-4 justify-center">
            {otp.map((digit, index) => (
              <input
              key={index}
              ref={(el) => {
                if (el) {
                  otpRefs.current[index] = el;
                }
              }}
              type="text"
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-xl bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              maxLength={1}
              inputMode="numeric"
              pattern="[0-9]*"
            />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              onClick={resendOtp}
              disabled={resendDisabled}
              className="text-purple-700 hover:underline disabled:text-gray-400 disabled:no-underline"
            >
              {resendDisabled ? `Resend OTP in ${countdown}s` : "Resend OTP"}
            </button>

            <button
              onClick={verifyOtp}
              disabled={otp.join("").length !== 6 || isVerifying}
              className="py-2 px-6 bg-[#fd9c2d] text-white rounded-lg hover:bg-[#e08c28] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </button>
          </div>

          {isVerified && (
            <div className="mt-4 flex items-center text-green-600">
              <CheckCircle className="mr-2" size={18} />
              Verified successfully
            </div>
          )}
        </div>
      )}

      {isVerified && (
        <div className="mt-6 flex justify-end">
          <Link
            href="/dashboard"
            className="py-3 px-6 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors"
          >
            Add students/members
          </Link>
        </div>
      )}
    </div>
  )
}

