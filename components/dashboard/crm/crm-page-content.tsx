"use client"

import { useState, useEffect } from "react"
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
import { MessageSquare, Sparkles, Bell, CheckCircle2 } from "lucide-react"
import { useCustomColors } from "@/lib/use-custom-colors"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

type CRMSection = "dashboard" | "leads" | "enquiries" | "sessions" | "trials" | "funnel" | "analytics" | "settings"

export default function CRMPageContent() {
  const [activeSection, setActiveSection] = useState<CRMSection>("dashboard")
  const [notified, setNotified] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { primaryColor } = useCustomColors()
  const { toast } = useToast()

  // Check subscription status on mount
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        const response = await fetch("/api/feature-notifications?feature=crm&checkStatus=true")
        if (response.ok) {
          const data = await response.json()
          if (data.isSubscribed) {
            setNotified(true)
          }
        }
      } catch (error) {
        // Silently fail - user can still subscribe
      }
    }
    checkSubscriptionStatus()
  }, [])

  const handleNotifyMe = async () => {
    if (notified || isLoading) return
    setIsLoading(true)
    try {
      const response = await fetch("/api/feature-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature: "crm" }),
      })
      const data = await response.json()
      if (response.ok) {
        setNotified(true)
        if (data.alreadySubscribed) {
          toast({
            title: "Already Subscribed",
            description: "You've already signed up for CRM updates.",
          })
        } else {
          toast({
            title: "🎉 You're on the list!",
            description: "We'll notify you as soon as the new CRM features are ready.",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

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
              <h1 className="text-3xl font-bold flex items-center gap-2 mb-2" style={{ color: primaryColor }}>
                <MessageSquare className="h-8 w-8" />
                Customer Relationship Management
              </h1>
              <p className="text-gray-500 dark:text-white">
                Manage leads, enquiries, sessions, and customer interactions
              </p>
            </div>

            {/* Coming Soon Banner */}
            <div className="mb-6 relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 p-[2px]">
              <div className="relative rounded-[10px] bg-white dark:bg-gray-900 p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        ✨ Your New CRM Experience Is On Its Way
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        Track leads, automate follow-ups, manage enquiries, map conversions, and much more.
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Our team is perfecting the experience — stay tuned!
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleNotifyMe}
                    disabled={notified || isLoading}
                    className={`flex-shrink-0 ${
                      notified
                        ? "bg-green-500 hover:bg-green-500 cursor-default"
                        : "bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                    } text-white`}
                  >
                    {notified ? (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    ) : (
                      <Bell className="h-4 w-4 mr-2" />
                    )}
                    {isLoading ? "..." : notified ? "Subscribed!" : "Notify Me"}
                  </Button>
                </div>
              </div>
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
