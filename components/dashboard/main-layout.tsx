"use client"

import type React from "react"

import { useState } from "react"
import Sidebar from "@/components/sidebar"
import Header from "./header"

import ErrorBoundary from "./error-boundary"
import { useSidebarPosition } from "@/app/contexts/sidebar-position-context"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState("English")
  const [userRole, setUserRole] = useState<"admin" | "super admin">("admin")
  const { position } = useSidebarPosition()

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const changeLanguage = (language: string) => {
    setCurrentLanguage(language)
  }

  const changeUserRole = (role: "admin" | "super admin") => {
    setUserRole(role)
  }

  // Determine layout based on sidebar position
  const renderLayout = () => {
    switch (position) {
      case "left":
        return (
          <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar position={position} collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header
                userRole={userRole}
                changeUserRole={changeUserRole}
              />
              <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <ErrorBoundary
                  fallback={
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                          The UniqBrio application is currently unavailable.
                        </h2>
                        <p className="text-gray-600 dark:text-white">Please try again later or contact support.</p>
                      </div>
                    </div>
                  }
                >
                  {children}
                </ErrorBoundary>
              </main>
            </div>
          </div>
        )
      case "right":
        return (
          <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header
                userRole={userRole}
                changeUserRole={changeUserRole}
              />
              <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <ErrorBoundary
                  fallback={
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-8 bg-white rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold text-purple-700 mb-4">
                          The UniqBrio application is currently unavailable.
                        </h2>
                        <p className="text-gray-600 dark:text-white">Please try again later or contact support.</p>
                      </div>
                    </div>
                  }
                >
                  {children}
                </ErrorBoundary>
              </main>
            </div>
            <Sidebar position={position} collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          </div>
        )
      default:
        return (
          <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header
                userRole={userRole}
                changeUserRole={changeUserRole}
              />
              <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <ErrorBoundary
                  fallback={
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-8 bg-white rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold text-purple-700 mb-4">
                          The UniqBrio application is currently unavailable.
                        </h2>
                        <p className="text-gray-600 dark:text-white">Please try again later or contact support.</p>
                      </div>
                    </div>
                  }
                >
                  {children}
                </ErrorBoundary>
              </main>
            </div>
          </div>
        )
    }
  }

  return renderLayout()
}
