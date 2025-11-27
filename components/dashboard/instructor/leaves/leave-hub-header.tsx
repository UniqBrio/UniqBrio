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
                  className="hexagon-tab border border-[#DE7D14] text-[#DE7D14] bg-transparent transition-all duration-150 font-semibold px-4 py-2 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#DE7D14] data-[state=active]:to-[#8B5CF6] data-[state=active]:border-transparent hover:text-white hover:bg-gradient-to-r hover:from-[#DE7D14] hover:to-[#8B5CF6] focus:outline-none"
                >
                  <span className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Analytics
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="leave-request"
                  className="hexagon-tab border border-[#DE7D14] text-[#DE7D14] bg-transparent transition-all duration-150 font-semibold px-4 py-2 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#DE7D14] data-[state=active]:to-[#8B5CF6] data-[state=active]:border-transparent hover:text-white hover:bg-gradient-to-r hover:from-[#DE7D14] hover:to-[#8B5CF6] focus:outline-none"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Leave Request
                  </span>
                </TabsTrigger>
                
                <TabsTrigger
                  value="smart-notifications"
                  // Inactive: white with purple text. Active: grey pill with white text.
                  className={cn(
                    "text-xs font-semibold rounded-lg px-4 py-2 select-none transition-colors focus:outline-none",
                    // Base (inactive)
                    "border border-gray-300 bg-white text-purple-600",
                    // Active overrides
                    "data-[state=active]:bg-[#7F898E] data-[state=active]:border-gray-500 data-[state=active]:text-white"
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
