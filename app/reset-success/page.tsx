import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function ResetSuccessPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg p-8 text-center">
        <CheckCircle className="mx-auto text-green-600 mb-4" size={64} />

        <h1 className="text-2xl font-bold mb-4">Password Reset Successful</h1>

        <p className="text-gray-600 mb-8">
          Your password has been successfully reset. You can now log in with your new password.
        </p>

        <Link
          href="/login"
          className="py-3 px-6 bg-[#fd9c2d] text-white rounded-lg hover:bg-[#e08c28] transition-colors inline-block"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}