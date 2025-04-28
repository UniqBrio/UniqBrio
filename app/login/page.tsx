// d:\UB\app\login\page.tsx
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import AuthTabs from "@/components/auth-tabs"
import DividerWithText from "@/components/divider-with-text"
import GoogleAuthButton from "@/components/google-auth-button"
import Link from "next/link"
import { CheckCircle2, Eye, EyeOff, Loader2, ChevronDown } from "lucide-react"
import { login } from "../actions/auth-actions" // Ensure this path is correct
import { toast } from "@/components/ui/use-toast"
import { useSearchParams, useRouter } from "next/navigation"

const loginSchema = z.object({
  emailOrPhone: z.string().min(1, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["super_admin", "admin", "instructor", "student"], {
    required_error: "Please select a role",
  }),
})

type FormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  // --- useEffect for Toasts with Enhanced Logging ---
  useEffect(() => {
    // Log exactly what params are seen when the effect runs
    console.log("[LoginPage] useEffect: Running. Current searchParams:", searchParams.toString());

    const verified = searchParams.get('verified') === 'true';
    const alreadyVerified = searchParams.get('alreadyVerified') === 'true';
    const resetSuccess = searchParams.get('reset') === 'success';
    const sessionExpired = searchParams.get('sessionExpired') === 'true';
    const oauthError = searchParams.get('error'); // Get potential error message

    let toastShown = false;
    const currentPath = '/login'; // Define the path to replace to

    // Use a function to avoid repeating router.replace logic
    const showToastAndReplaceUrl = (toastOptions: Parameters<typeof toast>[0]) => {
        console.log(`[LoginPage] useEffect: Condition met for toast: ${toastOptions.title}. Showing toast.`);
        toast(toastOptions);
        toastShown = true;
        console.log(`[LoginPage] useEffect: Calling router.replace('${currentPath}') to clean URL.`);
        // Use setTimeout to slightly delay replace, allowing toast to potentially render first
        // Adjust delay as needed, or remove if it causes other issues. Start with 0 or small value.
        setTimeout(() => {
            router.replace(currentPath);
            console.log(`[LoginPage] useEffect: router.replace('${currentPath}') executed.`);
        }, 50); // Small delay (e.g., 50ms)
    }

    if (verified && !toastShown) {
      showToastAndReplaceUrl({
        title: "Account Created",
        description: "Account created successfully. Please log in.",
        variant: "default", // Use "success" if you have it defined
      });
    } else if (alreadyVerified && !toastShown) {
      showToastAndReplaceUrl({
        title: "Already Verified",
        description: "Your account was already verified. Please log in.",
        variant: "default", // Use "info" if defined, or default
      });
    } else if (resetSuccess && !toastShown) {
      showToastAndReplaceUrl({
        title: "Password Reset",
        description: "Password reset successfully. Please log in with your new password.",
        variant: "default", // Use "success" if defined
      });
    } else if (sessionExpired && !toastShown) {
      showToastAndReplaceUrl({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
    } else if (oauthError && !toastShown) {
       showToastAndReplaceUrl({
         title: "Login Error",
         // Decode the error message in case it's URL-encoded
         description: `Failed to sign in with provider. Error: ${decodeURIComponent(oauthError)}`,
         variant: "destructive",
       });
    } else {
        console.log("[LoginPage] useEffect: No relevant query parameters found for toast display.");
    }

  }, [searchParams, router]); // Dependencies are correct
  // --- End useEffect ---


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: "student", // Sensible default
    },
  })

  // --- onSubmit Function (Keep the robust version from previous answer) ---
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    console.log("[LoginPage] onSubmit: Attempting login with data:", { emailOrPhone: data.emailOrPhone, role: data.role });

    try {
      const formData = new FormData();
      formData.append("emailOrPhone", data.emailOrPhone);
      formData.append("password", data.password);
      formData.append("role", data.role);

      const result = await login(formData);

      // --- CRITICAL BROWSER CONSOLE LOG ---
      console.log("[LoginPage] onSubmit: Server action result:", result);

      if (result?.success && typeof result.redirect === 'string' && result.redirect.length > 0) {
        console.log(`[LoginPage] onSubmit: Success! Attempting redirect via router.push to: ${result.redirect}`);
        try {
          router.push(result.redirect);
          console.log(`[LoginPage] onSubmit: router.push(${result.redirect}) called.`);
          // Note: setIsSubmitting(false) will be handled by finally, even on successful redirect start
        } catch (navigationError) {
          console.error("[LoginPage] onSubmit: Error during router.push navigation:", navigationError);
          toast({
            title: "Navigation Error",
            description: `Login successful, but failed to redirect to ${result.redirect}. Please try navigating manually.`,
            variant: "destructive",
          });
          setIsSubmitting(false); // Explicitly set here on navigation error
        }
      } else {
        let errorMsg = "Login failed. Please check your credentials and role.";
        if (result?.success && !(typeof result.redirect === 'string' && result.redirect.length > 0)) {
           errorMsg = result?.message || "Login successful, but the redirect path was missing or invalid.";
           console.error("[LoginPage] onSubmit: Login successful but redirect path missing/invalid. Result:", result);
        } else {
           errorMsg = result?.message || errorMsg;
           console.error("[LoginPage] onSubmit: Login failed. Reason:", errorMsg, "Result:", result);
        }
        toast({
          title: "Login Failed",
          description: errorMsg,
          variant: "destructive",
        });
        setIsSubmitting(false); // Explicitly set here on failure
      }
    } catch (error) {
      console.error("[LoginPage] onSubmit: Unexpected error during login process:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected network or server error occurred.",
        variant: "destructive",
      });
      setIsSubmitting(false); // Explicitly set here on unexpected error
    } finally {
      // Ensure isSubmitting is reset, checking avoids redundant state update if already set false
      if (isSubmitting) {
          setIsSubmitting(false);
      }
    }
  };
  // --- End onSubmit Function ---


  // --- JSX (Return statement) ---
  return (
    // Keep your existing JSX structure here...
    // No changes needed in the JSX based on the problem description
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-2xl mt-10" style={{ fontFamily: "Times New Roman, serif" }}>
      <AuthTabs />

      <form className="space-y-6 mt-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Role Selection */}
        <div className="space-y-1">
          <label htmlFor="role" className="text-[#fd9c2d] font-semibold text-base">
            Login as
          </label>
          <div className="relative">
            <select
              id="role"
              className="w-full h-14 px-4 bg-[#d9d9d9] border border-[#fd9c2d] rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-[#fd9c2d]"
              {...register("role")}
            >
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="instructor">Instructor</option>
              <option value="student">Student</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown className="h-5 w-5 text-[#39006f]" />
            </div>
          </div>
          {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
        </div>

        {/* Email or Phone */}
        <div className="space-y-1">
          <label htmlFor="emailOrPhone" className="text-[#fd9c2d] font-semibold text-base">
            Email or Phone
          </label>
          <input
            id="emailOrPhone"
            type="text"
            placeholder="abc@abc.com or phone number"
            className={`w-full h-14 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fd9c2d] ${errors.emailOrPhone ? "border-red-500" : "border-[#fd9c2d]"}`}
            {...register("emailOrPhone")}
            autoComplete="username"
          />
          {errors.emailOrPhone && <p className="text-red-500 text-sm">{errors.emailOrPhone.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label htmlFor="password" className="text-[#fd9c2d] font-semibold text-base">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className={`w-full h-14 px-4 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fd9c2d] ${errors.password ? "border-red-500" : "border-[#fd9c2d]"}`}
              {...register("password")}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
        </div>

        {/* Forgot Password Link */}
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-gray-600 hover:underline">
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full h-14 text-xl font-semibold text-white bg-[#fd9c2d] hover:bg-[#e08c28] rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin mr-2" size={20} />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </button>
      </form>

      {/* Signup Link */}
      <div className="mt-6 text-center text-sm">
        Not a member?{" "}
        <Link href="/signup" className="text-[#fd9c2d] font-semibold hover:underline">
          Signup
        </Link>
      </div>

      {/* Troubleshoot Link */}
      <div className="mt-2 text-center text-sm">
        <Link href="/troubleshoot" className="text-[#fd9c2d] hover:underline">
          Having trouble logging in? Contact Support
        </Link>
      </div>

      <DividerWithText text="or" />

      {/* Google Auth Button */}
      <GoogleAuthButton mode="login" />
    </div>
  )
  // --- End JSX ---
}
