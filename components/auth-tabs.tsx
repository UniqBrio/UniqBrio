"use client"

import Link from "next/link"
import Image from "next/image" // Import the Image component
import { usePathname } from "next/navigation"

export default function AuthTabs() {
  const pathname = usePathname()
  const isLoginActive = pathname === "/login"
  const isSignupActive = pathname === "/signup"
  const logoPath = "/UniqBrio Logo Transparent.png" // Define your logo path here

  return (
    // Added -mt-16 to pull the entire component upwards
    <div className="-mt-16">
      {/* Logo Section */}
      <div className="-mb-8  flex justify-center">
        <Image
          src={logoPath}
          alt="UniqBrio Logo"
          width={250} // Adjust as needed
          height={120} // Adjust as needed
          priority
        />
      </div>

      {/* Tabs Section */}
      <div className="grid grid-cols-2 gap-2 mb-8">
        <Link
          href="/login"
          className={`flex items-center justify-center h-16 text-xl font-medium rounded-lg ${
            isLoginActive ? "bg-orange-400 text-white" : "bg-[#d9d9d9] text-black"
          }`}
        >
          Login
        </Link>
        <Link
          href="/signup"
          className={`flex items-center justify-center h-16 text-xl font-medium rounded-lg ${
            isSignupActive ? "bg-purple-700 text-white" : "bg-[#d9d9d9] text-black"
          }`}
        >
          Signup
        </Link>
      </div>
    </div>
  )
}
