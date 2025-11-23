"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
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
} from "lucide-react"

import { ProfileSettings } from "@/components/dashboard/settings/profile-settings"

import { AppearanceSettings } from "@/components/dashboard/settings/appearance-settings"

import { AdminSecuritySettings } from "@/components/dashboard/settings/admin-security-settings"
import { AdminSystemConfig } from "@/components/dashboard/settings/admin-system-config"
import { AcademyInfoSettings } from "@/components/dashboard/settings/academy-info-settings"
import { NotificationSettings } from "@/components/dashboard/settings/notification-settings"
import { useApp } from "@/contexts/dashboard/app-context"

export default function SettingsPage() {
  const { user, setUser } = useApp()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("profile")
  
  

  useEffect(() => {
    // Load user data
    const loadUserData = async () => {
      try {
        // Simulate API call
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
      // In a real app, this would call the API
      const response = await fetch("/api/dashboard/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error("Failed to update profile")

      const updatedUser = await response.json()
      setUser(updatedUser)
      
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
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-purple-700 flex items-center gap-2">
                <SettingsIcon className="h-6 w-6 sm:h-8 sm:w-8" />Settings
              </h1>
              <p className="text-sm sm:text-base text-gray-500 mt-1">Manage your account settings and preferences
                
              </p>
            </div>
            
            {user && (
              <Card className="w-full lg:w-auto lg:min-w-[240px]">
                <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-base sm:text-lg flex-shrink-0">
                    {user.name?.charAt(0) || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm sm:text-base truncate">{user.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">
                        {user.role}
                      </Badge>
                      
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>



          {/* Settings Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="inline-flex lg:grid w-full lg:grid-cols-5 gap-2 bg-transparent p-0 h-auto min-w-max lg:min-w-0">
                

                <TabsTrigger
                  value="academy-info"
                  className="text-xs sm:text-sm border-2 border-orange-500 text-orange-600 bg-white transition-colors duration-150 font-semibold rounded-lg px-3 sm:px-4 py-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:border-purple-600 hover:bg-purple-50 focus:outline-none whitespace-nowrap flex-shrink-0"
                >
                  <GraduationCap className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Academy Info</span>
                </TabsTrigger>
                <TabsTrigger
                  value="profile"
                  className="text-xs sm:text-sm border-2 border-orange-500 text-orange-600 bg-white transition-colors duration-150 font-semibold rounded-lg px-3 sm:px-4 py-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:border-purple-600 hover:bg-purple-50 focus:outline-none whitespace-nowrap flex-shrink-0"
                >
                  <User className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Profile</span>
                </TabsTrigger>

                <TabsTrigger
                  value="appearance"
                  className="text-xs sm:text-sm border-2 border-orange-500 text-orange-600 bg-white transition-colors duration-150 font-semibold rounded-lg px-3 sm:px-4 py-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:border-purple-600 hover:bg-purple-50 focus:outline-none whitespace-nowrap flex-shrink-0"
                >
                  <Palette className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Theme</span>
                </TabsTrigger>

                <TabsTrigger
                  value="system-config"
                  className="text-xs sm:text-sm border-2 border-orange-500 text-orange-600 bg-white transition-colors duration-150 font-semibold rounded-lg px-3 sm:px-4 py-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:border-purple-600 hover:bg-purple-50 focus:outline-none whitespace-nowrap flex-shrink-0"
                >
                  <Server className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline-flex items-center gap-1">System Config <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block" /></span>
                </TabsTrigger>

                <TabsTrigger
                  value="notifications"
                  className="text-xs sm:text-sm border-2 border-orange-500 text-orange-600 bg-white transition-colors duration-150 font-semibold rounded-lg px-3 sm:px-4 py-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:border-purple-600 hover:bg-purple-50 focus:outline-none whitespace-nowrap flex-shrink-0"
                >
                  <Bell className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline-flex items-center gap-1">Notifications <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block" /></span>
                </TabsTrigger>
                  
              </TabsList>
            </div>

            <TabsContent value="profile" className="space-y-4">
              <ProfileSettings user={user} onUpdate={handleProfileUpdate} />
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
              
          </Tabs>
        </div>
      </div>)
}
