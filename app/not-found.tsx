"use client"

import Link from "next/link"
import { Suspense } from "react"

function NotFoundContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="text-9xl font-bold text-[#fd9c2d]">404</div>
      <h1 className="text-3xl font-bold mt-4 mb-2">Page Not Found</h1>
      <p className="text-gray-600 dark:text-white mb-8 text-center max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="py-2 px-6 bg-[#fd9c2d] text-white rounded-lg hover:bg-[#e08c28] transition-colors text-center"
        >
          Go to Home
        </Link>
        <Link
          href="/support"
          className="py-2 px-6 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors text-center"
        >
          Contact Support
        </Link>
      </div>
    </div>
  )
}

export default function NotFound() {
  return <Suspense fallback={<div>Loading...</div>}><NotFoundContent /></Suspense>
}
