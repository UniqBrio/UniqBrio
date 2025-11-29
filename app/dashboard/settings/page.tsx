"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Badge } from "@/components/dashboard/ui/badge"
import { toast } from "@/components/dashboard/ui/use-toast"

import {
  Settings as SettingsIcon,
  User,
  Bell,
  Palette,
  Calendar,
  Database,
  Activity,
  Users,
  Lock,
  Server,
  GraduationCap,
  Landmark,
} from "lucide-react"

import { ProfileSettings } from "@/components/dashboard/settings/profile-settings"
import { useCustomColors } from "@/lib/use-custom-colors"
import { AppearanceSettings } from "@/components/dashboard/settings/appearance-settings"

import { AdminSecuritySettings } from "@/components/dashboard/settings/admin-security-settings"
import { AdminSystemConfig } from "@/components/dashboard/settings/admin-system-config"
import { AcademyInfoSettings } from "@/components/dashboard/settings/academy-info-settings"
import { NotificationSettings } from "@/components/dashboard/settings/notification-settings"
import { BankAccountSettings } from "@/components/dashboard/settings/bank-account-settings"
import { useApp } from "@/contexts/dashboard/app-context"

export default function SettingsPage() {
  const { user, setUser } = useApp()
  const { primaryColor, secondaryColor } = useCustomColors()
  const [isLoading, setIsLoading] = useState(true)
  const [profileData, setProfileData] = useState<any>(null)
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("appearance")
  
  // Update active tab when URL changes
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab && ["profile", "academy-info", "appearance", "system-config", "notifications", "bank-accounts"].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])
  

  useEffect(() => {
    // Load user data
    const loadUserData = async () => {
      try {
        // Fetch actual profile data from API
        const response = await fetch("/api/user-profile", {
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            setProfileData(data.user)
            console.log('[Settings] Profile data loaded:', data.user)
          }
        } else {
          console.warn('[Settings] Failed to fetch profile:', response.status)
        }
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to load user data:", error)
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [])

  const handleProfileUpdate = async (updates: any) => {
    try {
      // Call the user-profile API to update
      const response = await fetch("/api/user-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error("Failed to update profile")

      // Refresh profile data after update
      const refreshResponse = await fetch("/api/user-profile", {
        credentials: 'include',
      })
      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        if (data.success && data.user) {
          setProfileData(data.user)
          console.log('[Settings] Profile updated and refreshed')
        }
      }
      
      return Promise.resolve()
    } catch (error) {
      console.error("Failed to update profile:", error)
      return Promise.reject(error)
    }
  }

  const handleNotificationUpdate = async (updates: any) => {
    try {
      const response = await fetch("/api/dashboard/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error("Failed to update notifications")

      if (user) {
        const updatedUser = {
          ...user,
          preferences: {
            ...user.preferences,
            notifications: updates.notifications,
          },
        }
        setUser(updatedUser)
        localStorage.setItem("uniqbrio-user", JSON.stringify(updatedUser))
      }

      return Promise.resolve()
    } catch (error) {
      console.error("Failed to update notifications:", error)
      return Promise.reject(error)
    }
  }

  const handleAppearanceUpdate = async (updates: any) => {
    try {
      const response = await fetch("/api/dashboard/settings/appearance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error("Failed to update appearance settings")

      if (user) {
        const updatedUser = {
          ...user,
          preferences: {
            ...user.preferences,
            theme: updates.theme,
            language: updates.language,
          },
        }
        setUser(updatedUser)
        localStorage.setItem("uniqbrio-user", JSON.stringify(updatedUser))
      }

      return Promise.resolve()
    } catch (error) {
      console.error("Failed to update appearance:", error)
      return Promise.reject(error)
    }
  }

  const handleIntegrationUpdate = async (updates: any) => {
    try {
      const response = await fetch("/api/dashboard/settings/integrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error("Failed to update integration settings")

      return Promise.resolve()
    } catch (error) {
      console.error("Failed to update integrations:", error)
      return Promise.reject(error)
    }
  }

  const handleSystemUpdate = async (updates: any) => {
    try {
      const response = await fetch("/api/dashboard/settings/system", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error("Failed to update system settings")

      return Promise.resolve()
    } catch (error) {
      console.error("Failed to update system settings:", error)
      return Promise.reject(error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>)
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col space-y-4 sm:space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2" style={{ color: primaryColor }}>
              <SettingsIcon className="h-6 w-6 sm:h-8 sm:w-8" />Settings
            </h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-white mt-1">Manage your account settings and preferences</p>
          </div>



          {/* Settings Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="inline-flex lg:grid w-full lg:grid-cols-6 gap-2 bg-transparent p-0 h-auto min-w-max lg:min-w-0">
                

                <TabsTrigger
                  value="academy-info"
                  className="text-xs sm:text-sm border-2 bg-white dark:bg-gray-900 transition-colors duration-150 font-semibold rounded-lg px-3 sm:px-4 py-2 focus:outline-none whitespace-nowrap flex-shrink-0 data-[state=active]:text-white"
                  style={{
                    borderColor: activeTab === 'academy-info' ? primaryColor : secondaryColor,
                    color: activeTab === 'academy-info' ? 'white' : secondaryColor,
                    backgroundColor: activeTab === 'academy-info' ? primaryColor : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'academy-info') {
                      e.currentTarget.style.backgroundColor = `${primaryColor}10`
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'academy-info') {
                      e.currentTarget.style.backgroundColor = ''
                    }
                  }}
                >
                  <GraduationCap className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Academy Info</span>
                </TabsTrigger>
                <TabsTrigger
                  value="profile"
                  className="text-xs sm:text-sm border-2 bg-white dark:bg-gray-900 transition-colors duration-150 font-semibold rounded-lg px-3 sm:px-4 py-2 focus:outline-none whitespace-nowrap flex-shrink-0"
                  style={{
                    borderColor: activeTab === 'profile' ? primaryColor : secondaryColor,
                    color: activeTab === 'profile' ? 'white' : secondaryColor,
                    backgroundColor: activeTab === 'profile' ? primaryColor : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'profile') {
                      e.currentTarget.style.backgroundColor = `${primaryColor}10`
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'profile') {
                      e.currentTarget.style.backgroundColor = ''
                    }
                  }}
                >
                  <User className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Profile</span>
                </TabsTrigger>

                <TabsTrigger
                  value="appearance"
                  className="text-xs sm:text-sm border-2 bg-white dark:bg-gray-900 transition-colors duration-150 font-semibold rounded-lg px-3 sm:px-4 py-2 focus:outline-none whitespace-nowrap flex-shrink-0"
                  style={{
                    borderColor: activeTab === 'appearance' ? primaryColor : secondaryColor,
                    color: activeTab === 'appearance' ? 'white' : secondaryColor,
                    backgroundColor: activeTab === 'appearance' ? primaryColor : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'appearance') {
                      e.currentTarget.style.backgroundColor = `${primaryColor}10`
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'appearance') {
                      e.currentTarget.style.backgroundColor = ''
                    }
                  }}
                >
                  <Palette className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Localization</span>
                </TabsTrigger>

                <TabsTrigger
                  value="system-config"
                  className="text-xs sm:text-sm border-2 bg-white dark:bg-gray-900 transition-colors duration-150 font-semibold rounded-lg px-3 sm:px-4 py-2 focus:outline-none whitespace-nowrap flex-shrink-0"
                  style={{
                    borderColor: activeTab === 'system-config' ? primaryColor : secondaryColor,
                    color: activeTab === 'system-config' ? 'white' : secondaryColor,
                    backgroundColor: activeTab === 'system-config' ? primaryColor : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'system-config') {
                      e.currentTarget.style.backgroundColor = `${primaryColor}10`
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'system-config') {
                      e.currentTarget.style.backgroundColor = ''
                    }
                  }}
                >
                  <Server className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline-flex items-center gap-1">System Config <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block" /></span>
                </TabsTrigger>

                <TabsTrigger
                  value="notifications"
                  className="text-xs sm:text-sm border-2 bg-white dark:bg-gray-900 transition-colors duration-150 font-semibold rounded-lg px-3 sm:px-4 py-2 focus:outline-none whitespace-nowrap flex-shrink-0"
                  style={{
                    borderColor: activeTab === 'notifications' ? primaryColor : secondaryColor,
                    color: activeTab === 'notifications' ? 'white' : secondaryColor,
                    backgroundColor: activeTab === 'notifications' ? primaryColor : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'notifications') {
                      e.currentTarget.style.backgroundColor = `${primaryColor}10`
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'notifications') {
                      e.currentTarget.style.backgroundColor = ''
                    }
                  }}
                >
                  <Bell className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline-flex items-center gap-1">Notifications <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block" /></span>
                </TabsTrigger>

                <TabsTrigger
                  value="bank-accounts"
                  className="text-xs sm:text-sm border-2 bg-white dark:bg-gray-900 transition-colors duration-150 font-semibold rounded-lg px-3 sm:px-4 py-2 focus:outline-none whitespace-nowrap flex-shrink-0"
                  style={{
                    borderColor: activeTab === 'bank-accounts' ? primaryColor : secondaryColor,
                    color: activeTab === 'bank-accounts' ? 'white' : secondaryColor,
                    backgroundColor: activeTab === 'bank-accounts' ? primaryColor : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'bank-accounts') {
                      e.currentTarget.style.backgroundColor = `${primaryColor}10`
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'bank-accounts') {
                      e.currentTarget.style.backgroundColor = ''
                    }
                  }}
                >
                  <Landmark className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Bank Accounts</span>
                </TabsTrigger>
                  
              </TabsList>
            </div>

            <TabsContent value="profile" className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }}></div>
                </div>
              ) : profileData ? (
                <ProfileSettings user={profileData} onUpdate={handleProfileUpdate} />
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-white">
                  Failed to load profile data. Please refresh the page.
                </div>
              )}
            </TabsContent>

            <TabsContent value="academy-info" className="space-y-4">
              <AcademyInfoSettings />
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <AppearanceSettings
                preferences={user?.preferences}
                onUpdate={handleAppearanceUpdate}
              />
            </TabsContent>

            <TabsContent value="system-config" className="space-y-4">
              <AdminSystemConfig onUpdate={handleSystemUpdate} />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <NotificationSettings onUpdate={handleNotificationUpdate} />
            </TabsContent>

            <TabsContent value="bank-accounts" className="space-y-4">
              <BankAccountSettings />
            </TabsContent>
              
          </Tabs>
        </div>
      </div>)
}

