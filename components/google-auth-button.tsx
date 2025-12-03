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
      // Use redirect: true to let NextAuth handle the full flow
      await signIn("google", {
        callbackUrl: "/register",
      });
      // No need to handle result when redirect: true (default behavior)
    } catch (error) {
      console.error("Google auth initiation error:", error);
      toast({
        title: "Login Error",
        description: "Could not start Google Sign-In. Please check your connection or try again later.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const bgColor = color === "purple" ? "bg-[#e9e9e9]" : "bg-[#d9d9d9]";
  const hoverColor = color === "purple" ? "hover:bg-[#d9d9d9]" : "hover:bg-gray-300";
  const textColor = "text-gray-800 dark:text-white";

  return (
    <button
      onClick={handleGoogleAuth}
      disabled={isLoading}
      className={`flex items-center justify-center w-full h-9 gap-2 text-xs font-semibold bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md ${textColor} rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed`}
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