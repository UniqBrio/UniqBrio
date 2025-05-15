import type { ReactNode } from "react"
import AuthTabs from "./auth-tabs" // Import the AuthTabs component
import Image from "next/image"
interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    // Main container: flex column to stack logo on top of content
    <div className="flex flex-col min-h-screen w-full">

      {/* Logo and Tagline Section - Centered at the top */}
      {/* This div takes full width and centers its flex children */}
      <div className="flex flex-col items-center justify-center py-2 bg-[#f9f6ff] lg:bg-transparent">
        <Image
          src="/UniqBrio Logo Transparent.png" // Ensure this path is correct
          alt="UniqBrio Logo"
          width={200} // Adjust size as needed
          height={100} // Adjust size as needed
          priority
          className="mb-2" // Add some space below the logo
        />
        <p className="text-gray-600 text-lg -mt-14 italic">Mentoring Businesses, Nurturing Learners</p>
      </div>

      {/* Wrapper for Left and Right Panels - This will be a flex row */}
      <div className="flex flex-1 w-full">
        {/* Left side - Features (Centered horizontally and vertically) */}
        <div className="hidden items-center justify-center lg:flex lg:w-1/2 flex-col bg-[#f9f6ff] p-8">
          <div className="text-center items-center mb-8">
            <h2 className="text-3xl font-bold mb-2">
              <span className="text-[#5a2ca0]">Streamline Your</span>{" "}
              <span className="text-[#e67e22]">Academy Management</span>
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              The complete solution for managing classes, courses, payments, and staff-
              <span className="font-semibold">All in one place.</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8 max-w-lg mx-auto"> {/* Added max-w-lg and mx-auto */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-10 h-10 bg-[#f0e6ff] rounded-lg flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5a2ca0"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
              </div>
              <h3 className="font-semibold mb-1">Course Management</h3>
              <p className="text-sm text-gray-600">Organize all your courses</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-10 h-10 bg-[#f0e6ff] rounded-lg flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5a2ca0"
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
              <h3 className="font-semibold mb-1">Class Scheduling</h3>
              <p className="text-sm text-gray-600">Effortless scheduling</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-10 h-10 bg-[#f0e6ff] rounded-lg flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5a2ca0"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              </div>
              <h3 className="font-semibold mb-1">Payment Tracking</h3>
              <p className="text-sm text-gray-600">Manage all transactions</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-10 h-10 bg-[#f0e6ff] rounded-lg flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5a2ca0"
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
              <h3 className="font-semibold mb-1">Staff Management</h3>
              <p className="text-sm text-gray-600">Coordinate your team</p>
            </div>
          </div>
        </div>

        {/* Right side - Auth forms */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-8 bg-gray-100">
          {/* Card container for AuthTabs and form */}
          <div className="w-full max-w-md "> {/* Added card styling back */}
            <AuthTabs /> {/* AuthTabs handles its own internal spacing and negative margins */}
            {/* Padding for the form content area below AuthTabs */}
            <div className="px-6 py-8 sm:px-8">
              {children}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
