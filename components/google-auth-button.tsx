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
      await signIn("google", {
        callbackUrl: "/select-role", // Redirect to the "Select Role" page
      });
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
      className={`flex items-center justify-center w-full h-14 gap-4 text-xl font-medium ${bgColor} ${hoverColor} ${textColor} rounded-lg transition-colors`}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={24} />
      ) : (
        <>
          <GoogleLogo />
          {mode === "login" ? "Login with Google" : "Signup with Google"}
        </>
      )}
    </button>
  );
}