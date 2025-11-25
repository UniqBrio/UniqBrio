import Link from "next/link"
import { Mail, RefreshCw } from "lucide-react"

export default function VerificationPendingPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg p-8 text-center">
        <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <Mail className="text-blue-600" size={32} />
        </div>

        <h1 className="text-2xl font-bold mb-4">Verify your email address</h1>

        <p className="text-gray-600 dark:text-white mb-6">
          We've sent a verification link to your email address. Please check your inbox and click the link to verify
          your account.
        </p>

        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-600 dark:text-white">
            If you don't see the email in your inbox, please check your spam folder or click the button below to resend
            the verification email.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="py-2 px-6 bg-[#fd9c2d] text-white rounded-lg hover:bg-[#e08c28] transition-colors flex items-center justify-center">
            <RefreshCw className="mr-2" size={18} />
            Resend verification email
          </button>
          <Link
            href="/login"
            className="py-2 px-6 bg-gray-200 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
