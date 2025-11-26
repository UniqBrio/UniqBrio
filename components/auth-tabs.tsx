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
      <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-gray-100/80 dark:bg-gray-800/80 rounded-xl backdrop-blur-sm">
        <Link
          href="/login"
          className={`flex items-center justify-center h-9 text-sm font-semibold rounded-lg transition-all duration-300 ${
            isLoginActive 
              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg scale-105" 
              : "bg-transparent text-gray-700 dark:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-orange-600 dark:hover:text-orange-400"
          }`}
        >
          Login
        </Link>
        <Link
          href="/signup"
          className={`flex items-center justify-center h-9 text-sm font-semibold rounded-lg transition-all duration-300 ${
            isSignupActive 
              ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg scale-105" 
              : "bg-transparent text-gray-700 dark:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-purple-600 dark:hover:text-purple-400"
          }`}
        >
          Sign up
        </Link>
      </div>
    </div>
  )
}
