"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const pathname = usePathname()
  const logoPath = "/UniqBrio Logo Transparent.png" // Using the same logo as in AuthTabs

  // Do not render Navbar on login or signup pages
  if (pathname === "/login" || pathname === "/signup") {
    return null
  }

  return (
    <header className="bg-white sticky top-0 z-30">
      {/* Removed max-w-7xl and mx-auto to allow full width. Added consistent padding. */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-17">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center"> {/* Changed items-left to items-center */}
              <Image
                src={logoPath}
                alt="UniqBrio Logo"
                width={200} // Increased width
                height={90} // Increased height, maintaining aspect ratio
                priority
              />
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-3"> {/* Adjusted space-x if needed */}
            <Link href="/login" className="bg-orange-400 hover:bg-orange-500 text-white px-5 py-2.5 rounded-lg text-base font-semibold transition-colors">
              Login
            </Link>
            <Link href="/signup" className="bg-purple-700 hover:bg-purple-800 text-white px-5 py-2.5 rounded-lg text-base font-semibold transition-colors">
              Signup
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}