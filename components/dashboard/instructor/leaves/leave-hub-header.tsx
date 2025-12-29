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
      <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-bold text-purple-600 md:text-4xl">
          Instructor Leave Management
        </h2>
        <p className="mt-2 text-lg text-foreground/70">
          Comprehensive leave management and tools
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => onTabChange(v as HubTab)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 w-full gap-2 bg-transparent h-auto p-0">
          <TabsTrigger
            value="dashboard"
            className="text-[#DE7D14] bg-white border-2 border-[#DE7D14] rounded-lg transition-all duration-150 font-semibold px-2 sm:px-5 py-1.5 sm:py-2 text-[10px] sm:text-sm data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#DE7D14] data-[state=active]:to-[#8B5CF6] data-[state=active]:border-[#8B5CF6] hover:text-white hover:bg-gradient-to-r hover:from-[#DE7D14] hover:to-[#8B5CF6] hover:border-[#8B5CF6] focus:outline-none shadow-sm"
          >
            <LayoutDashboard className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 inline-block" />
            Analytics
          </TabsTrigger>
          
          <TabsTrigger
            value="leave-request"
            className="text-[#DE7D14] bg-white border-2 border-[#DE7D14] rounded-lg transition-all duration-150 font-semibold px-2 sm:px-5 py-1.5 sm:py-2 text-[10px] sm:text-sm data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#DE7D14] data-[state=active]:to-[#8B5CF6] data-[state=active]:border-[#8B5CF6] hover:text-white hover:bg-gradient-to-r hover:from-[#DE7D14] hover:to-[#8B5CF6] hover:border-[#8B5CF6] focus:outline-none shadow-sm"
          >
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 inline-block" />
            <span className="hidden xs:inline">Leave Req</span>
            <span className="xs:hidden">Leave</span>
          </TabsTrigger>
          
          <TabsTrigger
            value="smart-notifications"
            className="border-2 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-sm font-semibold transition-all duration-200 data-[state=active]:bg-gray-400 data-[state=active]:text-white data-[state=active]:border-gray-600 bg-white text-gray-600 dark:text-white border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          >
            <Bell className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 inline-block" />
            <span className="hidden sm:inline-flex items-center gap-1">Smart Notifications <Image src="/Coming soon.svg" alt="Coming Soon" width={10} height={10} className="inline-block sm:w-[14px] sm:h-[14px]" /></span>
            <span className="sm:hidden">Smart</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
