"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mb-6">
        <AlertTriangle className="text-red-600" size={32} />
      </div>

      <h1 className="text-3xl font-bold mb-2">Something went wrong</h1>
      <p className="text-gray-600 dark:text-white mb-8 text-center max-w-md">
        We apologize for the inconvenience. An error has occurred while processing your request.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => reset()}
          className="py-2 px-6 bg-[#fd9c2d] text-white rounded-lg hover:bg-[#e08c28] transition-colors flex items-center justify-center"
        >
          <RefreshCw className="mr-2" size={18} />
          Try again
        </button>
        <Link
          href="/support"
          className="py-2 px-6 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors text-center"
        >
          Contact Support
        </Link>
      </div>

      {error.digest && <p className="mt-8 text-xs text-gray-500 dark:text-white">Error ID: {error.digest}</p>}
    </div>
  )
}

