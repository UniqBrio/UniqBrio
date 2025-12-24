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
              <TabsList className="grid w-full grid-cols-3 gap-1 sm:gap-2 h-auto p-1 bg-transparent">
                <TabsTrigger
                  value="dashboard"
                  className="hexagon-tab border border-purple-600 text-purple-600 bg-transparent transition-all duration-150 font-semibold text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:text-white data-[state=active]:bg-purple-600 data-[state=active]:border-purple-600 hover:text-white hover:bg-purple-500 focus:outline-none"
                >
                  <span className="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
                    <LayoutDashboard className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden xs:inline">Analytics</span>
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="leave-request"
                  className="hexagon-tab border border-purple-600 text-purple-600 bg-transparent transition-all duration-150 font-semibold text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:text-white data-[state=active]:bg-purple-600 data-[state=active]:border-purple-600 hover:text-white hover:bg-purple-500 focus:outline-none"
                >
                  <span className="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden xs:inline">Leave Req</span>
                    <span className="xs:hidden">Leave</span>
                  </span>
                </TabsTrigger>
                
                <TabsTrigger
                  value="smart-notifications"
                  className={cn(
                    "text-xs font-semibold rounded-lg px-2 sm:px-4 py-2 select-none transition-colors focus:outline-none whitespace-nowrap",
                    "border border-gray-300 bg-white text-purple-600",
                    "data-[state=active]:bg-[#7F898E] data-[state=active]:border-gray-500 data-[state=active]:text-white"
                  )}
                >
                  <span className="flex items-center gap-1 sm:gap-2">
                    <Bell className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="smart-tab-label hidden sm:inline-flex items-center gap-1">Smart Notifications <Image src="/Coming soon.svg" alt="Coming Soon" width={12} height={12} className="inline-block" /></span>
                    <span className="sm:hidden">Smart</span>
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
