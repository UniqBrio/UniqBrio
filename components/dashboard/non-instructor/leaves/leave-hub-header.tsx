"use client"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import { cn } from "@/lib/dashboard/staff/utils"
import { LayoutDashboard, FileText, Bell } from "lucide-react"

type HubTab = "dashboard" | "leave-request" | "smart-notifications"

interface Props {
  activeTab: HubTab
  onTabChange: (value: HubTab) => void
}

export default function LeaveHubHeader({ activeTab, onTabChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-purple-700">Leave Management Hub</h1>
        <p className="text-sm text-muted-foreground mt-1">Comprehensive leave management and tools</p>
      </div>

      <Card>
        {/* Header text removed as requested */}
        <CardHeader className="pb-0" />
        <CardContent>
          <Tabs
            value={activeTab}
            // Allow selecting smart-notifications so visual active state (grey pill) is shown
            onValueChange={(v) => onTabChange(v as HubTab)}
            className="w-full"
          >
            <div className="flex flex-col gap-2">
              <TabsList className="grid w-full grid-cols-3 gap-1 h-auto p-1 bg-transparent">
                <TabsTrigger
                  value="dashboard"
                  className="rounded-lg bg-transparent transition-all duration-150 font-semibold px-4 py-2 border-2 border-[#DE7D14] text-[#DE7D14] data-[state=active]:text-white data-[state=active]:border-transparent hover:text-white hover:border-transparent focus:outline-none"
                  style={activeTab === 'dashboard' ? { background: 'linear-gradient(90deg, #DE7D14 0%, #8B5CF6 100%)' } : undefined}
                  onMouseEnter={(e) => { if (activeTab !== 'dashboard') e.currentTarget.style.background = 'linear-gradient(90deg, #DE7D14 0%, #8B5CF6 100%)' }}
                  onMouseLeave={(e) => { if (activeTab !== 'dashboard') e.currentTarget.style.background = 'transparent' }}
                >
                  <span className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Analytics
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="leave-request"
                  className="rounded-lg bg-transparent transition-all duration-150 font-semibold px-4 py-2 border-2 border-[#DE7D14] text-[#DE7D14] data-[state=active]:text-white data-[state=active]:border-transparent hover:text-white hover:border-transparent focus:outline-none"
                  style={activeTab === 'leave-request' ? { background: 'linear-gradient(90deg, #DE7D14 0%, #8B5CF6 100%)' } : undefined}
                  onMouseEnter={(e) => { if (activeTab !== 'leave-request') e.currentTarget.style.background = 'linear-gradient(90deg, #DE7D14 0%, #8B5CF6 100%)' }}
                  onMouseLeave={(e) => { if (activeTab !== 'leave-request') e.currentTarget.style.background = 'transparent' }}
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Leave Request
                  </span>
                </TabsTrigger>
                
                <TabsTrigger
                  value="smart-notifications"
                  // Inactive: grey border with grey text. Active: grey pill with white text.
                  className={cn(
                    "rounded-lg bg-transparent transition-all duration-150 font-semibold px-4 py-2 select-none focus:outline-none",
                    // Base (inactive)
                    "border-2 border-gray-400 text-gray-500",
                    // Active overrides
                    "data-[state=active]:bg-[#7F898E] data-[state=active]:border-transparent data-[state=active]:text-white"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <span className="smart-tab-label inline-flex items-center gap-1">Smart Notifications <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block" /></span>
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
