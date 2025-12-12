"use client"

import { usePathname, useRouter } from "next/navigation"
import { useTransition, useEffect } from "react"

export default function AuthTabs() {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isLoginActive = pathname === "/login"
  const isSignupActive = pathname === "/signup"

  // Prefetch both routes on component mount for instant navigation
  useEffect(() => {
    router.prefetch("/login")
    router.prefetch("/signup")
  }, [router])

  const handleTabSwitch = (path: string) => {
    if (pathname !== path) {
      startTransition(() => {
        router.push(path)
      })
    }
  }

  return (
    <div>
      {/* Tabs Section */}
      <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-gray-100/80 dark:bg-gray-800/80 rounded-xl backdrop-blur-sm">
        <button
          type="button"
          onClick={() => handleTabSwitch("/login")}
          disabled={isPending || isLoginActive}
          className={`flex items-center justify-center h-9 text-sm font-semibold rounded-lg transition-all duration-200 ${
            isLoginActive 
              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg scale-105" 
              : "bg-transparent text-gray-700 dark:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-orange-600 dark:hover:text-orange-400"
          } ${isPending ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => handleTabSwitch("/signup")}
          disabled={isPending || isSignupActive}
          className={`flex items-center justify-center h-9 text-sm font-semibold rounded-lg transition-all duration-200 ${
            isSignupActive 
              ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg scale-105" 
              : "bg-transparent text-gray-700 dark:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-purple-600 dark:hover:text-purple-400"
          } ${isPending ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
        >
          Sign up
        </button>
      </div>
    </div>
  )
}
