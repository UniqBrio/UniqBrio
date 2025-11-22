"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import GoogleLogo from "@/google-logo"; // Assuming you have this component

export default function GoogleAuthButton({
  mode = "login",
  color = "orange",
}: {
  mode?: "login" | "signup";
  color?: "orange" | "purple";
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      // Redirect to the "Select Role" page after successful Google login
      const result = await signIn("google", {
        callbackUrl: "/select-role", // Redirect to the "Select Role" page
        redirect: false, // Don't redirect immediately, let us handle the result
      });

      if (result?.error) {
        console.error("Google auth error:", result.error);
        toast({
          title: "Authentication Failed",
          description: "Could not sign in with Google. Please try again or use email login.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // If successful and we have a URL, redirect manually
      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Google auth initiation error:", error);
      toast({
        title: "Login Error",
        description: "Could not start Google Sign-In. Please check your connection or try again later.",
        variant: "destructive",
      });
      setIsLoading(false); // Reset loading state on initiation failure
    }
  };

  const bgColor = color === "purple" ? "bg-[#e9e9e9]" : "bg-[#d9d9d9]";
  const hoverColor = color === "purple" ? "hover:bg-[#d9d9d9]" : "hover:bg-gray-300";
  const textColor = "text-gray-800";

  return (
    <button
      onClick={handleGoogleAuth}
      disabled={isLoading}
      className={`flex items-center justify-center w-full h-11 gap-3 text-sm font-semibold bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-md ${textColor} rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed`}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={18} />
      ) : (
        <>
          <GoogleLogo />
          {mode === "login" ? "Login with Google" : "Signup with Google"}
        </>
      )}
    </button>
  );
}