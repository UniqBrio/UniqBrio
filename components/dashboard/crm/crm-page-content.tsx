"use client"

import { useState } from "react"
import { CRMContext } from "@/contexts/dashboard/crm-context"
import { CRMNavigation } from "@/components/dashboard/crm-navigation"
import CRMDashboard from "@/components/dashboard/crm/dashboard"
import LeadsPage from "@/components/dashboard/crm/leads"
import EnquiriesPage from "@/components/dashboard/crm/enquiries"
import SessionsPage from "@/components/dashboard/crm/sessions"
import TrialsPage from "@/components/dashboard/crm/trials"
import FunnelPage from "@/components/dashboard/crm/funnel"
import AnalyticsPage from "@/components/dashboard/crm/analytics"
import SettingsPage from "@/components/dashboard/crm/settings"
import { Card, CardContent } from "@/components/dashboard/ui/card"
import { MessageSquare } from "lucide-react"

type CRMSection = "dashboard" | "leads" | "enquiries" | "sessions" | "trials" | "funnel" | "analytics" | "settings"

export default function CRMPageContent() {
  const [activeSection, setActiveSection] = useState<CRMSection>("dashboard")

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <CRMDashboard />
      case "leads":
        return <LeadsPage />
      case "enquiries":
        return <EnquiriesPage />
      case "sessions":
        return <SessionsPage />
      case "trials":
        return <TrialsPage />
      case "funnel":
        return <FunnelPage />
      case "analytics":
        return <AnalyticsPage />
      case "settings":
        return <SettingsPage />
      default:
        return <CRMDashboard />
    }
  }

  return (
    <CRMContext.Provider value={{ activeSection, setActiveSection }}>
      <div className="container mx-auto py-6">
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-purple-700 flex items-center gap-2 mb-2">
                <MessageSquare className="h-8 w-8" />
                Customer Relationship Management
              </h1>
              <p className="text-gray-500 dark:text-white">
                Manage leads, enquiries, sessions, and customer interactions
              </p>
            </div>

            {/* Navigation Tabs */}
            <CRMNavigation />

            {/* Content */}
            <div className="mt-6">
              {renderSection()}
            </div>
          </CardContent>
        </Card>
      </div>
    </CRMContext.Provider>
  )
}
