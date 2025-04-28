"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { resetPassword } from "@/app/actions/auth-actions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { use } from "react";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(12, "Password must not exceed 12 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isTokenChecked, setIsTokenChecked] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(true);
  const router = useRouter();

  // Unwrap params using React.use()
  const { token } = use(params);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch("password", "");

  // Token verification logic
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/verify-reset-token?token=${token}`);
        const data = await response.json();
        setIsTokenValid(data.success);
      } catch (error) {
        console.error("Token verification failed:", error);
        setIsTokenValid(false);
      } finally {
        setIsTokenChecked(true);
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("password", data.password);
      formData.append("confirmPassword", data.confirmPassword);

      await resetPassword(token, formData);

      toast({
        title: "Password reset successful",
        description: "Your password has been reset. You can now log in with your new password.",
      });

      router.push("/reset-success");
    } catch (error) {
      console.error("Password reset error:", error);
      toast({
        title: "Error",
        description: "There was a problem resetting your password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking token
  if (!isTokenChecked) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-md bg-white rounded-lg p-8 text-center">
          <Loader2 className="animate-spin mx-auto mb-4" size={32} />
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (!isTokenValid) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-md bg-white rounded-lg p-8 text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={32} />
          <h1 className="text-2xl font-bold mb-4">Invalid or Expired Link</h1>
          <p className="text-gray-600 mb-6">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link
            href="/forgot-password"
            className="py-2 px-6 bg-[#fd9c2d] text-white rounded-lg hover:bg-[#e08c28] transition-colors inline-block"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Choose a new password</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="password" className="block text-[#fd9c2d]">
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className={`w-full p-3 bg-gray-200 rounded-lg pr-10 ${
                  errors.password ? "border-2 border-red-500" : ""
                }`}
                {...register("password")}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-[#fd9c2d]">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className={`w-full p-3 bg-gray-200 rounded-lg pr-10 ${
                  errors.confirmPassword ? "border-2 border-red-500" : ""
                }`}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#fd9c2d] text-white rounded-lg hover:bg-[#e08c2d] transition-colors flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}