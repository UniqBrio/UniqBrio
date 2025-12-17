// d:\UB\app\login\page.tsx
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import DividerWithText from "@/components/divider-with-text"
import GoogleAuthButton from "@/components/google-auth-button"
import Link from "next/link"
import { CheckCircle2, Eye, EyeOff, Loader2, ChevronDown, Check, X } from "lucide-react"
import { login } from "../actions/auth-actions" // Ensure this path is correct
import { toast } from "@/components/ui/use-toast"
import AuthLayout from "@/components/auth-layout" // Import AuthLayout
import { useSearchParams, useRouter } from "next/navigation"
import { broadcastSessionChange, clearTabSession } from "@/lib/session-broadcast"

const loginSchema = z.object({
  emailOrPhone: z.string()
    .min(1, "Email or phone number is required")
    .refine((value) => {
      // Check if it's a phone number (only digits, at least 10)
      const isPhone = /^[0-9]{10,}$/.test(value);
      // Check if it's a valid email format with strict regex
      const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
      return isPhone || isEmail;
    }, "Please enter a valid email address (user@example.com) or phone number (10+ digits)"),
  password: z.string().min(1, "Password is required"),
  // Remove role from login schema
  // role: z.enum(["super_admin", "admin", "instructor", "student"], {
  //   required_error: "Please select a role",
  // }),
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
    console.log("[LoginPage] useEffect: Running. Current searchParams:", searchParams?.toString());

    const verified = searchParams?.get('verified') === 'true';
    const alreadyVerified = searchParams?.get('alreadyVerified') === 'true';
    const resetSuccess = searchParams?.get('reset') === 'success';
    const sessionExpired = searchParams?.get('sessionExpired') === 'true';
    const oauthError = searchParams?.get('error'); // Get potential error message

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

    // Handle different types of errors properly
    if (verified && !toastShown) {
      showToastAndReplaceUrl({
        title: "Account Created",
        description: "Account created successfully. Please log in.",
        variant: "default",
      });
    } else if (alreadyVerified && !toastShown) {
      showToastAndReplaceUrl({
        title: "Already Verified",
        description: "Your account was already verified. Please log in.",
        variant: "default",
      });
    } else if (resetSuccess && !toastShown) {
      showToastAndReplaceUrl({
        title: "Password Reset",
        description: "Password reset successfully. Please log in with your new password.",
        variant: "default",
      });
    } else if (sessionExpired && !toastShown) {
      showToastAndReplaceUrl({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
    } else if (oauthError && !toastShown) {
      // Handle specific OAuth error types
      let errorTitle = "Authentication Failed";
      let errorDescription = "Failed to sign in with Google. Please try again.";
      
      switch (oauthError.toLowerCase()) {
        case 'oauthsignin':
          errorDescription = "There was an error starting the Google sign-in process. Please try again.";
          break;
        case 'oauthcallback':
          errorDescription = "There was an error during Google authentication callback. Please try again.";
          break;
        case 'oauthcreateaccount':
          errorDescription = "Could not create your account with Google. Please try again or use email signup.";
          break;
        case 'emailcreateaccount':
          errorDescription = "Could not create account with this email. Please try a different email.";
          break;
        case 'callback':
          errorDescription = "Authentication callback failed. Please try signing in again.";
          break;
        case 'oauthaccountnotlinked':
          errorDescription = "This email is already registered with a different sign-in method. Please use your original sign-in method.";
          break;
        case 'accountexistswithcredentials':
        case 'accessdenied':
          // AccessDenied can be thrown when user exists with password but tries Google sign-in
          errorTitle = "Account Already Exists";
          errorDescription = "An account with this email already exists. Please sign in using your email and password instead.";
          break;
        case 'emailsignin':
          errorDescription = "Could not send sign-in email. Please check your email address.";
          break;
        case 'credentialssignin':
          errorDescription = "Invalid credentials. Please check your email and password.";
          break;
        case 'sessionrequired':
          errorDescription = "You need to be signed in to access this page.";
          break;
        default:
          // For any other error, use a generic message but log the specific error
          console.error("[LoginPage] Unhandled OAuth error:", oauthError);
          errorDescription = `Authentication failed: ${decodeURIComponent(oauthError)}. Please try again.`;
      }

      showToastAndReplaceUrl({
        title: errorTitle,
        description: errorDescription,
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
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      // role: "student", // Remove default role
    },
  })

  // --- onSubmit Function (Keep the robust version from previous answer) ---
  const onSubmit = async (e: React.FormEvent<HTMLFormElement> | FormData) => {
    // Prevent default form submission if it's an event
    if ('preventDefault' in e) {
      e.preventDefault();
    }
    
    setIsSubmitting(true);
    
    // Extract data based on input type
    const data = 'preventDefault' in e 
      ? Object.fromEntries(new FormData(e.currentTarget)) 
      : e;
    
    console.log("[LoginPage] onSubmit: Attempting login with data:", { emailOrPhone: (data as any).emailOrPhone });

    try {
      const formData = new FormData();
      formData.append("emailOrPhone", (data as any).emailOrPhone);
      formData.append("password", (data as any).password);
      
      // Add client-side device info
      if (typeof navigator !== 'undefined') {
        formData.append("userAgent", navigator.userAgent || '');
      }
      
      const result = await login(formData);

      // --- CRITICAL BROWSER CONSOLE LOG ---
      console.log("[LoginPage] onSubmit: Server action result:", result);

      if (result?.success && typeof result.redirect === 'string' && result.redirect.length > 0) {
        console.log(`[LoginPage] onSubmit: Success! Attempting redirect via router.push to: ${result.redirect}`);
        try {
          // Clear any previous tab session and broadcast session change to other tabs
          clearTabSession();
          broadcastSessionChange("SESSION_CHANGED");
          
          // Set items in localStorage upon successful login
          const currentTime = Date.now().toString();
          localStorage.setItem('userLoginTime', currentTime);
          localStorage.setItem('lastUserActivityTime', currentTime);
          // Signal that cookie consent should be shown.
          // A separate component (e.g., a cookie banner) should read this
          // and manage its own state (e.g., not show again if consent given).
          localStorage.setItem('showCookieConsentAfterLogin', 'true');
          console.log("[LoginPage] onSubmit: 'userLoginTime', 'lastUserActivityTime', and 'showCookieConsentAfterLogin' set in localStorage.");

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
    // Wrap with AuthLayout
    <AuthLayout>
      <form 
        className="space-y-3" 
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onSubmit)(e);
        }}
        method="post"
        action="#"
      >
        {/* Removed AuthTabs from here, it's now in AuthLayout */}

        {/* Email or Phone */}
        <div className="space-y-1">
          <label htmlFor="emailOrPhone" className="text-black font-medium text-sm">
            Email or Phone
          </label>
          <input
            id="emailOrPhone"
            type="text"
            placeholder="abc@abc.com or phone number"
            className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fd9c2d] ${errors.emailOrPhone ? "border-red-500" : "border-[#fd9c2d]"}}`}
            {...register("emailOrPhone")}            onInput={(e) => {
              const target = e.target as HTMLInputElement;
              // Remove spaces
              target.value = target.value.replace(/\s/g, '');
              // If it contains @, treat as email and convert to lowercase
              if (target.value.includes('@')) {
                target.value = target.value.toLowerCase();
              }
            }}            autoComplete="username"
            autoFocus
          />
          {errors.emailOrPhone && <p className="text-red-500 text-sm">{errors.emailOrPhone.message}</p>}
          {watch("emailOrPhone") && (
            <ul className="text-xs text-gray-500 dark:text-white mt-1 space-y-0.5">
              <li className="flex items-center">
                {watch("emailOrPhone").length >= 1 ? (
                  <Check size={12} className="text-green-500 mr-1 flex-shrink-0" />
                ) : (
                  <X size={12} className="text-red-500 mr-1 flex-shrink-0" />
                )}
                Not empty
              </li>
              <li className="flex items-center">
                {(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(watch("emailOrPhone")) || /^[0-9]+$/.test(watch("emailOrPhone"))) ? (
                  <Check size={12} className="text-green-500 mr-1 flex-shrink-0" />
                ) : (
                  <X size={12} className="text-red-500 mr-1 flex-shrink-0" />
                )}
                Valid email or phone number format
              </li>
            </ul>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label htmlFor="password" className="text-black font-medium text-sm">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className={`w-full h-10 px-3 pr-10 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fd9c2d] ${errors.password ? "border-red-500" : "border-[#fd9c2d]"}`}
              {...register("password")}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-white"
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
          <Link href="/forgot-password" className="text-m text-gray-600 dark:text-white hover:underline">
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full h-9 text-xs font-semibold text-white bg-orange-500 hover:bg-[#e08c28] rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin mr-2" size={16} />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </button>
      </form>

      {/* Signup Link */}
      <div className="mt-3 text-center text-sm">
        Not a member?{" "}
        <Link href="/signup" className="text-purple-700 font-bold hover:underline">
          Sign up
        </Link>
      </div>

      {/* Troubleshoot Link */}
      <div className="mt-2 text-center text-sm">
        <Link href="/troubleshoot" className="text-black hover:underline font-medium">
          Having trouble logging in? Contact Support
        </Link>
      </div>

      <DividerWithText text="or" />

      {/* Google Auth Button */}
      <GoogleAuthButton mode="login" />
    </AuthLayout>
  )
  // --- End JSX ---
}
