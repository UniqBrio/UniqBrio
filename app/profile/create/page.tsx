// d:\UB\app\profile\create\page.tsx
// **************************************************************************
// ** WARNING: THIS FILE IS MODIFIED FOR TESTING PURPOSES ONLY.            **
// ** OTP VERIFICATION AND PROFILE CREATION ARE BYPASSED.                  **
// ** DO NOT DEPLOY THIS VERSION TO PRODUCTION.                            **
// **************************************************************************
"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation"; // <-- Import useRouter

// --- Server Actions are NOT called in this testing version ---
// import {
//   createBusinessProfile,
//   sendProfileOtp,
//   verifyProfileOtp,
// } from "@/app/actions/auth-actions";

const profileSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  businessType: z.string().min(1, "Business type is required"),
  businessSubType: z.string().min(1, "Business sub type is required"),
  registeredOwner: z.string().min(1, "Registered owner is required"),
  businessDescription: z.string().min(10, "Please provide a description (min 10 characters)"),
  address: z.string().min(1, "Address is required"),
  businessCountry: z.string().min(1, "Country is required"),
  phoneNumber: z.string().min(10, "Please enter a valid phone number"),
  countryCode: z.string().min(1, "Country code is required"),
});

type FormData = z.infer<typeof profileSchema>;

const countries = [
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+1", name: "USA", flag: "🇺🇸" },
  { code: "+44", name: "UK", flag: "🇬🇧" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "+81", name: "Japan", flag: "🇯🇵" },
];

export default function ProfileCreationPage() {
  const router = useRouter(); // <-- Initialize useRouter
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [showOtpSection, setShowOtpSection] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  // const [isVerified, setIsVerified] = useState(false); // Not needed for redirect test
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const formDataRef = useRef<FormData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      businessName: "Test Fitness Studio", // Test defaults
      businessType: "Gym",
      businessSubType: "Test SubType",
      registeredOwner: "Test Owner",
      businessDescription: "Testing profile creation flow with OTP bypass.",
      address: "123 Test St",
      businessCountry: "India",
      phoneNumber: "9876543210", // Test phone
      countryCode: "+91",
    },
  });

  const currentPhoneNumber = watch("phoneNumber");
  const currentCountryCode = watch("countryCode");

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, resendDisabled]);

  // --- Step 1: Handle Initial Profile Form Submission & SIMULATE Send OTP ---
  const onSubmit = async (data: FormData) => {
    setIsSubmittingProfile(true);
    setOtpError(null);
    formDataRef.current = data;

    console.log("TESTING: Simulating OTP send for", data.countryCode + data.phoneNumber);

    // --- Simulate API call delay ---
    await new Promise((resolve) => setTimeout(resolve, 500));

    // --- Directly show OTP section ---
    setShowOtpSection(true);
    toast({
      title: "OTP Sent (Simulated for Testing)",
      description: `Enter any 6 digits for ${data.countryCode}${data.phoneNumber}`,
    });
    setResendDisabled(true);
    setCountdown(60);

    setTimeout(() => {
      otpRefs.current[0]?.focus();
    }, 100);

    setIsSubmittingProfile(false);
  };

  // --- Handle OTP Input Changes ---
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError(null);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    const enteredOtp = newOtp.join("");
    if (enteredOtp.length === 6) {
      // --- Trigger bypass verification ---
      verifyOtpBypassAndRedirect(enteredOtp);
    }
  };

  // --- Handle OTP Input KeyDown Events ---
  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      if (!otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    } else if (event.key === "ArrowRight" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // --- Step 2: BYPASS Verification & Redirect ---
  const verifyOtpBypassAndRedirect = async (enteredOtp: string) => {
    if (enteredOtp.length !== 6) {
      setOtpError("Please enter the complete 6-digit OTP.");
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    console.log("TESTING: Bypassing OTP verification. Entered:", enteredOtp);
    toast({
      title: "Verification Bypassed (Testing)",
      description: "Redirecting to Super Admin Dashboard...",
    });

    // --- Simulate a short delay ---
    await new Promise(resolve => setTimeout(resolve, 1000));

    // --- REDIRECT ---
    router.push("/super-admin/dashboard");

    // No need to set isVerified or call createBusinessProfile
    // setIsVerifyingOtp(false); // Might not run if redirect is fast
  };

  // --- Handle Resend OTP Request (Simulated) ---
  const resendOtp = async () => {
    if (resendDisabled || isResendingOtp || !formDataRef.current) return;

    setIsResendingOtp(true);
    setResendDisabled(true);
    setOtpError(null);

    const { phoneNumber, countryCode } = formDataRef.current;

    console.log("TESTING: Simulating OTP resend for", countryCode + phoneNumber);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

    toast({
      title: "OTP Resent (Simulated)",
      description: "A new verification code has been 'sent'.",
    });
    setOtp(["", "", "", "", "", ""]);
    otpRefs.current[0]?.focus();
    setCountdown(60);

    setIsResendingOtp(false);
  };

  // --- Render Component ---
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-semibold mb-2 text-center text-gray-700">Create Business Profile</h1>
      <p className="text-center text-red-600 font-bold mb-6">[TESTING MODE - OTP BYPASSED]</p>

      {/* --- Profile Form (Remains the same) --- */}
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Name */}
        <div className="space-y-2">
          <label htmlFor="businessName" className="block text-gray-600 text-sm font-medium">Business Name</label>
          <input
            id="businessName"
            type="text"
            className={`w-full p-3 bg-gray-50 rounded-lg border focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition duration-200 ${errors.businessName ? "border-red-500" : "border-gray-300"}`}
            {...register("businessName")}
            disabled={showOtpSection}
          />
          {errors.businessName && <p className="text-red-500 text-sm mt-1">{errors.businessName.message}</p>}
        </div>

        {/* Business Type */}
        <div className="space-y-2">
          <label htmlFor="businessType" className="block text-gray-600 text-sm font-medium">Business Type</label>
          <div className="relative">
            <select
              id="businessType"
              className={`w-full p-3 bg-gray-50 rounded-lg border focus:border-purple-600 focus:ring-1 focus:ring-purple-600 appearance-none transition duration-200 ${errors.businessType ? "border-red-500" : "border-gray-300"}`}
              {...register("businessType")}
              disabled={showOtpSection}
            >
              <option value="Gym">Gym</option>
              <option value="Studio">Studio</option>
              <option value="School">School</option>
              <option value="Other">Other</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6L8 10L12 6" stroke="#39006f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          </div>
          {errors.businessType && <p className="text-red-500 text-sm mt-1">{errors.businessType.message}</p>}
        </div>

        {/* Registered Owner */}
        <div className="space-y-2">
          <label htmlFor="registeredOwner" className="block text-gray-600 text-sm font-medium">Registered Owner</label>
          <input
            id="registeredOwner"
            type="text"
            className={`w-full p-3 bg-gray-50 rounded-lg border focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition duration-200 ${errors.registeredOwner ? "border-red-500" : "border-gray-300"}`}
            {...register("registeredOwner")}
            disabled={showOtpSection}
          />
          {errors.registeredOwner && <p className="text-red-500 text-sm mt-1">{errors.registeredOwner.message}</p>}
        </div>

        {/* Business Sub Type */}
        <div className="space-y-2">
          <label htmlFor="businessSubType" className="block text-gray-600 text-sm font-medium">Business Sub Type</label>
          <input
            id="businessSubType"
            type="text"
            className={`w-full p-3 bg-gray-50 rounded-lg border focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition duration-200 ${errors.businessSubType ? "border-red-500" : "border-gray-300"}`}
            {...register("businessSubType")}
            disabled={showOtpSection}
          />
          {errors.businessSubType && <p className="text-red-500 text-sm mt-1">{errors.businessSubType.message}</p>}
        </div>

        {/* Business Description */}
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="businessDescription" className="block text-gray-600 text-sm font-medium">Business Description*</label>
          <textarea
            id="businessDescription"
            rows={4}
            className={`w-full p-3 bg-gray-50 rounded-lg border focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition duration-200 ${errors.businessDescription ? "border-red-500" : "border-gray-300"}`}
            {...register("businessDescription")}
            disabled={showOtpSection}
          />
          {errors.businessDescription && <p className="text-red-500 text-sm mt-1">{errors.businessDescription.message}</p>}
        </div>

        {/* Address */}
        <div className="space-y-2">
          <label htmlFor="address" className="block text-gray-600 text-sm font-medium">Address*</label>
          <input
            id="address"
            type="text"
            className={`w-full p-3 bg-gray-50 rounded-lg border focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition duration-200 ${errors.address ? "border-red-500" : "border-gray-300"}`}
            {...register("address")}
            disabled={showOtpSection}
          />
          {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
        </div>

        {/* Business Country */}
        <div className="space-y-2">
          <label htmlFor="businessCountry" className="block text-gray-600 text-sm font-medium">Business Country</label>
          <input
            id="businessCountry"
            type="text"
            className={`w-full p-3 bg-gray-50 rounded-lg border focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition duration-200 ${errors.businessCountry ? "border-red-500" : "border-gray-300"}`}
            {...register("businessCountry")}
            disabled={showOtpSection}
          />
          {errors.businessCountry && <p className="text-red-500 text-sm mt-1">{errors.businessCountry.message}</p>}
        </div>

        {/* Phone Number with Country Code */}
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="phoneNumber" className="block text-gray-600 text-sm font-medium">Phone Number for Verification</label>
          <div className="flex">
            <select
              id="countryCode"
              className={`p-3 bg-gray-50 rounded-l-lg border border-r-0 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 appearance-none transition duration-200 ${errors.countryCode ? "border-red-500" : "border-gray-300"}`}
              {...register("countryCode")}
              disabled={showOtpSection}
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.code}
                </option>
              ))}
            </select>
            <input
              id="phoneNumber"
              type="tel"
              placeholder="Enter phone number"
              className={`flex-1 p-3 bg-gray-50 rounded-r-lg border focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition duration-200 ${errors.phoneNumber ? "border-red-500" : "border-gray-300"}`}
              {...register("phoneNumber")}
              disabled={showOtpSection}
            />
          </div>
          {errors.countryCode && <p className="text-red-500 text-sm mt-1">{errors.countryCode.message}</p>}
          {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>}
        </div>

        {/* Submit Button */}
        <div className="md:col-span-2 mt-4">
          <button
            type="submit"
            disabled={isSubmittingProfile || showOtpSection}
            className="w-full md:w-auto py-3 px-8 bg-[#39006f] text-white rounded-lg hover:bg-purple-800 transition duration-200 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmittingProfile ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                Processing...
              </>
            ) : (
              "Save and Verify Phone"
            )}
          </button>
        </div>
      </form>

      {/* --- OTP Section (UI remains, logic is bypassed) --- */}
      {showOtpSection && ( // Show OTP section regardless of verification status in this test version
        <div className="mt-8 bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <h2 className="text-2xl mb-4 text-center font-semibold text-gray-700">Enter OTP</h2>
          <p className="text-gray-600 mb-6 text-center">
            (TESTING) Enter any 6 digits for{" "}
            <span className="font-medium">{currentCountryCode}{currentPhoneNumber}</span>.
          </p>

          {otpError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
              <p className="text-red-700 text-sm">{otpError}</p>
            </div>
          )}

          <div className="flex gap-2 md:gap-4 justify-center mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { otpRefs.current[index] = el; }}
                type="text"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-10 h-10 md:w-12 md:h-12 text-center text-xl bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200"
                maxLength={1}
                inputMode="numeric"
                pattern="[0-9]*"
                disabled={isVerifyingOtp} // Only disable while "verifying" (redirecting)
              />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              onClick={resendOtp}
              disabled={resendDisabled || isResendingOtp}
              className="text-sm text-purple-700 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed flex items-center"
            >
              {isResendingOtp ? (
                <>
                  <Loader2 className="animate-spin mr-1" size={16} /> Resending...
                </>
              ) : countdown > 0 ? (
                `Resend OTP in ${countdown}s`
              ) : (
                "Resend OTP (Simulated)"
              )}
            </button>

            {/* Changed button to trigger bypass directly */}
            <button
              onClick={() => verifyOtpBypassAndRedirect(otp.join(""))}
              disabled={otp.join("").length !== 6 || isVerifyingOtp}
              className="w-full sm:w-auto py-2 px-6 bg-[#ff9800] text-white rounded-lg hover:bg-[#e08c28] transition duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isVerifyingOtp ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Redirecting...
                </>
              ) : (
                "Verify & Redirect (Test)"
              )}
            </button>
          </div>
        </div>
      )}

      {/* --- Success State Block Removed for this test version --- */}
      {/* {isVerified && ( ... )} */}
    </div>
  );
}
