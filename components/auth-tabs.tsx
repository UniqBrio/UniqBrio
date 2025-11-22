"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function AuthTabs() {
  const pathname = usePathname()
  const isLoginActive = pathname === "/login"
  const isSignupActive = pathname === "/signup"

  return (
    <div>
      {/* Tabs Section */}
      <div className="grid grid-cols-2 gap-3 mb-6 p-1 bg-gray-100/80 rounded-xl backdrop-blur-sm">
        <Link
          href="/login"
          className={`flex items-center justify-center h-11 text-sm font-semibold rounded-lg transition-all duration-300 ${
            isLoginActive 
              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg scale-105" 
              : "bg-transparent text-gray-700 hover:bg-white/50 hover:text-orange-600"
          }`}
        >
          Login
        </Link>
        <Link
          href="/signup"
          className={`flex items-center justify-center h-11 text-sm font-semibold rounded-lg transition-all duration-300 ${
            isSignupActive 
              ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg scale-105" 
              : "bg-transparent text-gray-700 hover:bg-white/50 hover:text-purple-600"
          }`}
        >
          Sign up
        </Link>
      </div>
    </div>
  )
}
