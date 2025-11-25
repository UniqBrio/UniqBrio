"use client"

import { useState } from "react"
import Link from "next/link"
import { useCRM } from "@/contexts/dashboard/crm-context"
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  TestTube,
  TrendingUp,
  BarChart3,
  Settings,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/dashboard/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"

const navigation = [
  { name: "Dashboard", section: "dashboard", icon: LayoutDashboard },
  { name: "Leads", section: "leads", icon: Users },
  { name: "Enquiries", section: "enquiries", icon: MessageSquare },
  { name: "Sessions", section: "sessions", icon: Calendar },
  { name: "Trials", section: "trials", icon: TestTube },
  { name: "Funnel", section: "funnel", icon: TrendingUp },
  { name: "Analytics", section: "analytics", icon: BarChart3 },
  { name: "Settings", section: "settings", icon: Settings },
] as const

export function CRMNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { activeSection, setActiveSection } = useCRM()

  return (
    <>
      {/* Desktop Tabs */}
      <div className="hidden md:block">
        <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as any)}>
          <TabsList className="grid w-full grid-cols-8 gap-2 bg-transparent p-0 h-auto">
            {navigation.map((item) => (
              <TabsTrigger
                key={item.name}
                value={item.section}
                className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-[#DE7D14] dark:border-orange-600 text-[#DE7D14] dark:text-orange-400 bg-background transition-colors duration-150 font-semibold rounded-lg data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white data-[state=active]:border-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white hover:border-[#8B5CF6] dark:hover:bg-purple-700 focus:outline-none"
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden lg:inline">{item.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-background dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/dashboard/crm" className="flex items-center space-x-2">
              <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">UB</span>
              </div>
              <span className="text-lg font-bold text-gradient">UniqBrio</span>
            </Link>

            <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-background dark:bg-gray-900">
            <div className="px-4 py-2 space-y-1">
              {navigation.map((item) => {
                const isActive = activeSection === item.section
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setActiveSection(item.section)
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                      isActive 
                        ? "bg-[#8B5CF6] text-white border-[#8B5CF6]" 
                        : "bg-white dark:bg-gray-900 text-[#DE7D14] border-[#DE7D14] hover:bg-[#8B5CF6] hover:text-white hover:border-[#8B5CF6]"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </nav>


    </>
  )
}
