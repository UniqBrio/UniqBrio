"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Sidebar from "./sidebar"
import Header from "./header"
import "../styles/responsive-dashboard.css"

import ErrorBoundary from "./error-boundary"
import { useSidebarPosition } from "../app/contexts/sidebar-position-context"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState("English")
  const [userRole, setUserRole] = useState<"admin" | "super admin">("admin")
  const { position } = useSidebarPosition()
  const [academyName, setAcademyName] = useState("");
  const [userName, setUserName] = useState("");
  const [isMobile, setIsMobile] = useState(false)

  // Handle mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const changeLanguage = (language: string) => {
    setCurrentLanguage(language)
  }

  const changeUserRole = (role: "admin" | "super admin") => {
    setUserRole(role)
  }

  // Fetch academy and user name from backend
  useEffect(() => {
    async function fetchInfo() {
      try {
        const res = await fetch("/api/user-academy-info");
        if (res.ok) {
          const data = await res.json();
          setAcademyName(data.academyName || "");
          setUserName(data.userName || "");
        }
      } catch (err) {
        // fallback: do nothing
      }
    }
    fetchInfo();
  }, []);

  // Determine layout based on sidebar position with responsive design
  const renderLayout = () => {
    switch (position) {
      case "left":
        return (
          <div className="flex h-screen bg-gray-50 relative">
            {/* Mobile overlay */}
            {isMobile && !sidebarCollapsed && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" 
                onClick={() => setSidebarCollapsed(true)}
              />
            )}
            
            <Sidebar 
              position={position} 
              collapsed={sidebarCollapsed} 
              toggleSidebar={toggleSidebar} 
              isMobile={isMobile}
            />
            
            <div className="flex flex-col flex-1 overflow-hidden min-w-0">
              <Header
                currentLanguage={currentLanguage}
                changeLanguage={changeLanguage}
                userRole={userRole}
                changeUserRole={changeUserRole}
                academyName={academyName}
                userName={userName}
                toggleSidebar={toggleSidebar}
                isMobile={isMobile}
                sidebarCollapsed={sidebarCollapsed}
              />
              <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6">
                <ErrorBoundary
                  fallback={
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-4 sm:p-6 md:p-8 bg-white rounded-lg shadow-md mx-4">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-purple-700 mb-4">
                          The UniqBrio application is currently unavailable.
                        </h2>
                        <p className="text-sm sm:text-base text-gray-600">Please try again later or contact support.</p>
                      </div>
                    </div>
                  }
                >
                  <div className="w-full max-w-full overflow-hidden">
                    {children}
                  </div>
                </ErrorBoundary>
              </main>
            </div>
          </div>
        )
      case "right":
        return (
          <div className="flex h-screen bg-gray-50">
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header
                currentLanguage={currentLanguage}
                changeLanguage={changeLanguage}
                userRole={userRole}
                changeUserRole={changeUserRole}
                academyName={academyName}
                userName={userName}
              />
              <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <ErrorBoundary
                  fallback={
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-8 bg-white rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold text-purple-700 mb-4">
                          The UniqBrio application is currently unavailable.
                        </h2>
                        <p className="text-gray-600">Please try again later or contact support.</p>
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
        return null
    }
  }

  return renderLayout()
}
