"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function AuthTabs() {
  const pathname = usePathname()
  const isLoginActive = pathname === "/login"
  const isSignupActive = pathname === "/signup"

  return (
    <div className="grid grid-cols-2 gap-2 mb-8">
      <Link
        href="/login"
        className={`flex items-center justify-center h-16 text-xl font-medium rounded-lg ${
          isLoginActive ? "bg-[#fd9c2d] text-white" : "bg-[#d9d9d9] text-black"
        }`}
      >
        Login
      </Link>
      <Link
        href="/signup"
        className={`flex items-center justify-center h-16 text-xl font-medium rounded-lg ${
          isSignupActive ? "bg-[#8a3ffc] text-white" : "bg-[#d9d9d9] text-black"
        }`}
      >
        Signup
      </Link>
    </div>
  )
}

