"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Save, User, Lock, Bell, Shield, CreditCard, Cookie } from "lucide-react"
import { ProfileSettings } from "@/components/dashboard/settings/profile-settings"
import { BillingSettings } from "@/components/dashboard/settings"
import { useCustomColors } from '@/lib/use-custom-colors'
import type { CookiePreferences } from '@/lib/cookie-consent'

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address").min(1, "Email is required"),
  phone: z.string().min(10, "Please enter a valid phone number"),
})

type ProfileFormData = z.infer<typeof profileSchema>

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(12, "Password must not exceed 12 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type PasswordFormData = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false)
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const { primaryColor, secondaryColor } = useCustomColors()
  const [buttonHover, setButtonHover] = useState<Record<string, boolean>>({})
  const [cookiePreferences, setCookiePreferences] = useState<CookiePreferences | null>(null)
  const [isLoadingCookiePrefs, setIsLoadingCookiePrefs] = useState(false)
  const [isSavingCookiePrefs, setIsSavingCookiePrefs] = useState(false)

  const handleMouseEnter = (key: string) => setButtonHover(prev => ({ ...prev, [key]: true }))
  const handleMouseLeave = (key: string) => setButtonHover(prev => ({ ...prev, [key]: false }))

  // Fetch profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/user-profile", {
          credentials: 'include',
        })
        if (!response.ok) throw new Error("Failed to fetch profile")
        const data = await response.json()
        if (data.success) {
          setProfileData(data.user)
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        })
      } finally {
        setIsLoadingProfile(false)
      }
    }
    fetchProfile()
  }, [])

  // Fetch cookie preferences when privacy tab is active
  useEffect(() => {
    if (activeTab === 'privacy' && !cookiePreferences) {
      fetchCookiePreferences()
    }
  }, [activeTab])

  const fetchCookiePreferences = async () => {
    setIsLoadingCookiePrefs(true)
    try {
      const response = await fetch('/api/cookie-preferences')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCookiePreferences(data.preferences)
        }
      }
    } catch (error) {
      console.error('Failed to fetch cookie preferences:', error)
    } finally {
      setIsLoadingCookiePrefs(false)
    }
  }

  const saveCookiePreferences = async (newPrefs: Partial<CookiePreferences>) => {
    setIsSavingCookiePrefs(true)
    try {
      const response = await fetch('/api/cookie-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: { ...cookiePreferences, ...newPrefs } }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCookiePreferences(data.preferences)
          toast({
            title: 'Cookie Preferences Saved',
            description: 'Your cookie preferences have been updated successfully',
          })
        }
      } else {
        throw new Error('Failed to save preferences')
      }
    } catch (error) {
      console.error('Failed to save cookie preferences:', error)
      toast({
        title: 'Error',
        description: 'Failed to save cookie preferences',
        variant: 'destructive',
      })
    } finally {
      setIsSavingCookiePrefs(false)
    }
  }

  // Handle profile update
  const handleProfileUpdate = async (updates: any) => {
    try {
      const response = await fetch("/api/user-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error("Failed to update profile")
      
      const data = await response.json()
      if (data.success) {
        // Refresh profile data
        const refreshResponse = await fetch("/api/user-profile", {
          credentials: 'include',
        })
        const refreshData = await refreshResponse.json()
        if (refreshData.success) {
          setProfileData(refreshData.user)
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      throw error
    }
  }

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "9876543210",
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const onSubmitProfile = async (data: ProfileFormData) => {
    setIsSubmittingProfile(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully",
      })
    } catch (error) {
      console.error("Profile update error:", error)
      toast({
        title: "Error",
        description: "There was a problem updating your profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingProfile(false)
    }
  }

  const onSubmitPassword = async (data: PasswordFormData) => {
    setIsSubmittingPassword(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
      })
    } catch (error) {
      console.error("Password update error:", error)
      toast({
        title: "Error",
        description: "There was a problem updating your password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingPassword(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        {/* Sidebar */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <nav className="space-y-1">
            <button
              className={`flex items-center gap-2 w-full p-2 rounded-lg transition-colors ${activeTab === "profile" ? "" : "hover:bg-gray-100"}`}
              style={activeTab === "profile" ? { backgroundColor: `${primaryColor}20`, color: primaryColor } : {}}
              onClick={() => setActiveTab("profile")}
            >
              <User size={18} />
              <span>Profile</span>
            </button>
            <button
              className={`flex items-center gap-2 w-full p-2 rounded-lg transition-colors ${activeTab === "password" ? "" : "hover:bg-gray-100"}`}
              style={activeTab === "password" ? { backgroundColor: `${primaryColor}20`, color: primaryColor } : {}}
              onClick={() => setActiveTab("password")}
            >
              <Lock size={18} />
              <span>Password</span>
            </button>
            <button
              className={`flex items-center gap-2 w-full p-2 rounded-lg transition-colors ${activeTab === "notifications" ? "" : "hover:bg-gray-100"}`}
              style={activeTab === "notifications" ? { backgroundColor: `${primaryColor}20`, color: primaryColor } : {}}
              onClick={() => setActiveTab("notifications")}
            >
              <Bell size={18} />
              <span>Notifications</span>
            </button>
            <button
              className={`flex items-center gap-2 w-full p-2 rounded-lg transition-colors ${activeTab === "privacy" ? "" : "hover:bg-gray-100"}`}
              style={activeTab === "privacy" ? { backgroundColor: `${primaryColor}20`, color: primaryColor } : {}}
              onClick={() => setActiveTab("privacy")}
            >
              <Shield size={18} />
              <span>Privacy</span>
            </button>
              <button
                className={`flex items-center gap-2 w-full p-2 rounded-lg transition-colors ${activeTab === "billing" ? "" : "hover:bg-gray-100"}`}
                style={activeTab === "billing" ? { backgroundColor: `${primaryColor}20`, color: primaryColor } : {}}
                onClick={() => setActiveTab("billing")}
              >
                <CreditCard size={18} />
                <span>Billings</span>
              </button>
          </nav>
        </div>

        {/* Main content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === "profile" && (
            <div>
              {isLoadingProfile ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin h-8 w-8" style={{ color: primaryColor }} />
                </div>
              ) : profileData ? (
                <ProfileSettings user={profileData} onUpdate={handleProfileUpdate} />
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-white">
                  Failed to load profile data
                </div>
              )}
            </div>
          )}

          {activeTab === "password" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Change Password</h2>
              <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-white">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    className={`w-full p-2 border rounded-lg ${passwordErrors.currentPassword ? "border-red-500" : "border-gray-300"}`}
                    {...registerPassword("currentPassword")}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-red-500 text-sm">{passwordErrors.currentPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-white">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    className={`w-full p-2 border rounded-lg ${passwordErrors.newPassword ? "border-red-500" : "border-gray-300"}`}
                    {...registerPassword("newPassword")}
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-red-500 text-sm">{passwordErrors.newPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-white">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className={`w-full p-2 border rounded-lg ${passwordErrors.confirmPassword ? "border-red-500" : "border-gray-300"}`}
                    {...registerPassword("confirmPassword")}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-red-500 text-sm">{passwordErrors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmittingPassword}
                    className="py-2 px-4 text-white rounded-lg transition-colors flex items-center"
                    style={{ backgroundColor: buttonHover.password ? `${primaryColor}dd` : primaryColor }}
                    onMouseEnter={() => handleMouseEnter('password')}
                    onMouseLeave={() => handleMouseLeave('password')}
                  >
                    {isSubmittingPassword ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={18} />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2" size={18} />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "notifications" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-white">Receive email notifications for account activity</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked onChange={(e) => {
                      const toggle = e.target.nextElementSibling as HTMLElement;
                      if (toggle) toggle.style.backgroundColor = e.target.checked ? primaryColor : '';
                    }} />
                    <div 
                      className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                      style={{ backgroundColor: primaryColor, ['--tw-ring-color' as any]: `${primaryColor}40` }}
                    ></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">SMS Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-white">Receive text messages for important updates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" onChange={(e) => {
                      const toggle = e.target.nextElementSibling as HTMLElement;
                      if (toggle) toggle.style.backgroundColor = e.target.checked ? primaryColor : '';
                    }} />
                    <div 
                      className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                      style={{ ['--tw-ring-color' as any]: `${primaryColor}40` }}
                    ></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Marketing Communications</h3>
                    <p className="text-sm text-gray-500 dark:text-white">Receive promotional emails and offers</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked onChange={(e) => {
                      const toggle = e.target.nextElementSibling as HTMLElement;
                      if (toggle) toggle.style.backgroundColor = e.target.checked ? primaryColor : '';
                    }} />
                    <div 
                      className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                      style={{ backgroundColor: primaryColor, ['--tw-ring-color' as any]: `${primaryColor}40` }}
                    ></div>
                  </label>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    className="py-2 px-4 text-white rounded-lg transition-colors flex items-center"
                    style={{ backgroundColor: buttonHover.notificationsSave ? `${primaryColor}dd` : primaryColor }}
                    onMouseEnter={() => handleMouseEnter('notificationsSave')}
                    onMouseLeave={() => handleMouseLeave('notificationsSave')}
                  >
                    <Save className="mr-2" size={18} />
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Privacy Settings</h2>
              
              {/* Cookie Preferences Section */}
              <div className="mb-8 pb-8 border-b">
                <div className="flex items-center gap-2 mb-4">
                  <Cookie size={20} style={{ color: primaryColor }} />
                  <h3 className="text-lg font-semibold">Cookie Preferences</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Control how we use cookies to improve your experience. You can change your preferences at any time.
                </p>

                {isLoadingCookiePrefs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin h-6 w-6" style={{ color: primaryColor }} />
                  </div>
                ) : cookiePreferences ? (
                  <div className="space-y-4">
                    {/* Essential Cookies */}
                    <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">Essential Cookies</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Required for the website to function properly. These cannot be disabled.
                        </p>
                      </div>
                      <div className="ml-4">
                        <div className="w-11 h-6 bg-gray-400 rounded-full flex items-center px-1 cursor-not-allowed opacity-50">
                          <div className="bg-white h-5 w-5 rounded-full translate-x-full"></div>
                        </div>
                      </div>
                    </div>

                    {/* Analytics Cookies */}
                    <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">Analytics Cookies</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Help us understand how you use our website so we can improve your experience.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={cookiePreferences.analytics}
                          onChange={(e) => {
                            const newPrefs = { ...cookiePreferences, analytics: e.target.checked }
                            setCookiePreferences(newPrefs)
                          }}
                        />
                        <div 
                          className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                          style={{ 
                            backgroundColor: cookiePreferences.analytics ? primaryColor : '',
                            ['--tw-ring-color' as any]: `${primaryColor}40` 
                          }}
                        ></div>
                      </label>
                    </div>

                    {/* Marketing Cookies */}
                    <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">Marketing Cookies</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Used to show you relevant advertisements and measure campaign effectiveness.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={cookiePreferences.marketing}
                          onChange={(e) => {
                            const newPrefs = { ...cookiePreferences, marketing: e.target.checked }
                            setCookiePreferences(newPrefs)
                          }}
                        />
                        <div 
                          className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                          style={{ 
                            backgroundColor: cookiePreferences.marketing ? primaryColor : '',
                            ['--tw-ring-color' as any]: `${primaryColor}40` 
                          }}
                        ></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <p className="text-xs text-gray-500">
                        Policy Version: {cookiePreferences.policyVersion}
                      </p>
                      <button
                        type="button"
                        onClick={() => saveCookiePreferences(cookiePreferences)}
                        disabled={isSavingCookiePrefs}
                        className="py-2 px-4 text-white rounded-lg transition-colors flex items-center"
                        style={{ backgroundColor: buttonHover.cookieSave ? `${primaryColor}dd` : primaryColor }}
                        onMouseEnter={() => handleMouseEnter('cookieSave')}
                        onMouseLeave={() => handleMouseLeave('cookieSave')}
                      >
                        {isSavingCookiePrefs ? (
                          <Loader2 className="mr-2 animate-spin" size={18} />
                        ) : (
                          <Save className="mr-2" size={18} />
                        )}
                        Save Cookie Preferences
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No cookie preferences set yet
                  </div>
                )}
              </div>

              {/* Other Privacy Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500 dark:text-white">Add an extra layer of security to your account</p>
                  </div>
                  <button className="py-1 px-3 bg-[#fd9c2d] text-white text-sm rounded-lg hover:bg-[#e08c28] transition-colors">
                    Enable
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Data Sharing</h3>
                    <p className="text-sm text-gray-500 dark:text-white">Allow us to share your data with trusted partners</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" onChange={(e) => {
                      const toggle = e.target.nextElementSibling as HTMLElement;
                      if (toggle) toggle.style.backgroundColor = e.target.checked ? primaryColor : '';
                    }} />
                    <div 
                      className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                      style={{ ['--tw-ring-color' as any]: `${primaryColor}40` }}
                    ></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Activity Tracking</h3>
                    <p className="text-sm text-gray-500 dark:text-white">Allow us to track your activity for a better experience</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked onChange={(e) => {
                      const toggle = e.target.nextElementSibling as HTMLElement;
                      if (toggle) toggle.style.backgroundColor = e.target.checked ? primaryColor : '';
                    }} />
                    <div 
                      className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                      style={{ backgroundColor: primaryColor, ['--tw-ring-color' as any]: `${primaryColor}40` }}
                    ></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <BillingSettings />
          )}
        </div>
      </div>
    </div>
  )
}

