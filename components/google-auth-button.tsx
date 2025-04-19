/// d:\UB\components\google-auth-button.tsx
"use client"
import { useState } from "react"
// useRouter might still be useful if you add specific error redirects later, but not essential for the basic signIn flow
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
// Import the actual signIn function from next-auth/react
import { signIn } from "next-auth/react"
import { toast } from "@/components/ui/use-toast" // Optional: for error feedback
import GoogleLogo from "@/google-logo"; // Assuming you have this component based on the file list

export default function GoogleAuthButton({
  mode = "login",
  color = "orange",
}: {
  mode?: "login" | "signup"
  color?: "orange" | "purple"
}) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter() // Keep for potential future use

  const handleGoogleAuth = async () => { // Corrected arrow function syntax
    setIsLoading(true)
    try {
      // --- SIMPLIFIED & RECOMMENDED WAY ---
      // Let NextAuth handle the redirect automatically.
      // Specify where the user should land AFTER successful Google login.
      await signIn("google", {
        // *** IMPORTANT: Set this to the correct post-login destination ***
        callbackUrl: "/student/dashboard", // Example: Change as needed
        // redirect: true, // This is the default, so you can omit it
      });
      // If signIn initiates successfully, the browser will redirect to Google.
      // Code execution might not reach past this point on success.
      // NextAuth handles the redirect back from Google to your callbackUrl or error page.

    } catch (error) {
      // This catch block handles errors during the *initiation* of signIn,
      // like network issues or fundamental configuration problems before redirecting.
      console.error("Google auth initiation error:", error);
      toast({
        title: "Login Error",
        description: "Could not start Google Sign-In. Please check your connection or try again later.",
        variant: "destructive",
      });
      setIsLoading(false); // Reset loading state on initiation failure
    }
    // No need to set isLoading to false here if the redirect is expected to happen.
    // It's handled in the catch block for initiation errors.
    // If Google redirects back with an error, NextAuth redirects to the error page (/login?error=...).
  };

  const bgColor = color === "purple" ? "bg-[#e9e9e9]" : "bg-[#d9d9d9]"
  const hoverColor = color === "purple" ? "hover:bg-[#d9d9d9]" : "hover:bg-gray-300"
  const textColor = "text-gray-800"

  return (
    // *** Corrected JSX Tags ***
    <button
      onClick={handleGoogleAuth}
      disabled={isLoading}
      className={`flex items-center justify-center w-full h-14 gap-4 text-xl font-medium ${bgColor} ${hoverColor} ${textColor} rounded-lg transition-colors`}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={24} />
      ) : (
        <>
          {/* Use the imported GoogleLogo component */}
          <GoogleLogo />
          {mode === "login" ? "Login with Google" : "Signup with Google"}
        </>
      )}
    </button>
  )
}
