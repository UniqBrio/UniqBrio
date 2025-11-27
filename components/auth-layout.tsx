import type { ReactNode } from "react"
import AuthTabs from "./auth-tabs" // Import the AuthTabs component
import Image from "next/image"
import GlobalFooter from "./global-footer"

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    // Main container: flex column to stack logo on top of content
    <div className="flex flex-col min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        {/* Gradient background with mesh effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/40 via-white/60 to-orange-100/40"></div>
        
        {/* Animated circles - positioned away from left panel */}
        <div className="absolute top-20 -right-20 w-96 h-96 bg-gradient-to-br from-orange-300 to-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 right-1/4 w-96 h-96 bg-gradient-to-br from-pink-300 to-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content wrapper with z-index */}
      <div className="relative z-8 flex flex-col min-h-screen">
        {/* Logo and Tagline Section - Centered at Top */}
        <div className="flex flex-col items-center justify-center pt-0 pb-2 z-14 animate-fadeIn">
          <Image
            src="/UniqBrio%20Logo%20Transparent.png" // URL-encoded space in filename
            alt="UniqBrio Logo"
            width={180}
            height={80}
            priority
            className="drop-shadow-lg"
          />
          <p className="text-gray-700 dark:text-white text-base -mt-12 italic font-medium text-center">Mentoring Businesses, Nurturing Learners</p>
        </div>

      {/* Wrapper for Left and Right Panels - This will be a flex row */}
      <div className="flex flex-1 w-full pt-0">
        {/* Left side - Features (Centered horizontally and vertically) */}
        <div className="hidden items-center justify-center lg:flex lg:w-1/2 flex-col bg-transparent p-4 animate-slideInLeft">
          <div className="text-center items-center mb-6">
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
              Streamline Your Academy Management
            </h2>
            <p className="text-gray-700 dark:text-white text-base max-w-md mx-auto leading-relaxed">
              The complete solution for managing classes,<br /> courses, payments, and staff-<br />
              <span className="font-semibold">All in one place.</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 max-w-lg mx-auto"> {/* Added max-w-lg and mx-auto */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-5 rounded-xl shadow-lg border border-purple-100 dark:border-purple-700 hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-500 group">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
              </div>
              <h3 className="font-bold text-base mb-1 text-gray-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Course Management</h3>
              <p className="text-xs text-gray-600 dark:text-white">Organize all your courses</p>
            </div>

            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-5 rounded-xl shadow-lg border border-orange-100 dark:border-orange-700 hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-orange-300 dark:hover:border-orange-500 group">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
              </div>
              <h3 className="font-bold text-base mb-1 text-gray-800 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Class Scheduling</h3>
              <p className="text-xs text-gray-600 dark:text-white">Effortless scheduling</p>
            </div>

            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-5 rounded-xl shadow-lg border border-pink-100 dark:border-pink-700 hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-pink-300 dark:hover:border-pink-500 group">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              </div>
              <h3 className="font-bold text-base mb-1 text-gray-800 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">Payment Tracking</h3>
              <p className="text-xs text-gray-600 dark:text-white">Manage all transactions</p>
            </div>

            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-5 rounded-xl shadow-lg border border-indigo-100 dark:border-indigo-700 hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-indigo-300 dark:hover:border-indigo-500 group">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="font-bold text-base mb-1 text-gray-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Staff Management</h3>
              <p className="text-xs text-gray-600 dark:text-white">Coordinate your team</p>
            </div>
          </div>
        </div>

        {/* Right side - Auth forms */}
        <div className="w-full lg:w-1/2 flex items-start justify-center pt-8 p-3 md:p-6 bg-transparent animate-slideInRight">
          {/* Card container for AuthTabs and form */}
          <div className="w-full max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 dark:border-gray-700/60 p-6 hover:shadow-3xl transition-all duration-500"> {/* Added card styling back */}
            <AuthTabs /> {/* AuthTabs handles its own internal spacing and negative margins */}
            {/* Padding for the form content area below AuthTabs */}
            <div className="px-4 py-4 sm:px-6">
              {children}
            </div>
          </div>
        </div>
      </div>
      
      <GlobalFooter />
      </div>

    </div>
  )
}
