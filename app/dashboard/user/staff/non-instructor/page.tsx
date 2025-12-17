"use client"

import React, { useState } from "react"
import { useCustomColors } from "@/lib/use-custom-colors"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/staff/tabs"
import NonInstructorDashboard from "@/components/dashboard/non-instructor/instructor-dashboard"
import NonInstructorProfile from "@/components/dashboard/non-instructor/instructor-profile/index"
import NonInstructorLeaveAttendance from "@/components/dashboard/non-instructor/leave-attendance"
import { AttendanceManagement as NonInstructorAttendanceManagement } from "@/components/dashboard/non-instructor/attendance/attendance-management"
import AddNonInstructorDialog from "@/components/dashboard/non-instructor/add-instructor-dialog-refactored/AddInstructorDialogWrapper"
import NonInstructorDraftsDialog from "@/components/dashboard/non-instructor/instructor-drafts-dialog"
import { useNonInstructorDrafts } from "@/hooks/dashboard/staff/use-non-instructor-drafts"
import { useNonInstructors } from "@/hooks/dashboard/staff/use-non-instructors"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/staff/card"
import { Bot, Target, Timer } from "@/components/dashboard/ui/staff/feature-icons"
import { DollarSign, Users, MessageCircle, ShieldCheck, Smartphone, LayoutDashboard, GraduationCap, ClipboardCheck, CalendarDays, Settings as SettingsIcon } from "lucide-react"
import { useToast } from "@/hooks/dashboard/use-toast"
import NonInstructorSettings from "@/components/dashboard/non-instructor/non-instructor-settings"
import Image from "next/image"

const NON_INSTRUCTOR_SETTINGS_KEY = 'nonInstructorSettings'

const getDefaultNonInstructorSettings = () => ({
  identity: {
    customIdPrefix: 'NI',
    numberingStrategy: 'sequential' as const,
    idNumberPadding: 4,
    sequenceStart: 1,
    allowManualIds: false,
    enforceUppercase: true,
    showIdBadges: true,
  },
  display: {
    defaultView: 'grid',
    showDepartment: true,
    showShiftInfo: true,
    highlightComplianceFlags: true,
    colorCodeByRole: true,
    compactMode: false,
    showContactInfo: true,
  },
  filters: {
    rememberLastFilters: true,
    autoApplyFilters: false,
    defaultDepartment: 'all',
    defaultRole: 'all',
    showAdvancedFilters: false,
    includeInactive: false,
  },
  notifications: {
    newHire: true,
    roleChange: true,
    contractExpiring: true,
    trainingDue: true,
    attendanceIssue: true,
    shiftChange: true,
    reminderTime: 7,
    soundEnabled: false,
  },
  export: {
    defaultFormat: 'csv',
    includeContactDetails: true,
    includeCompliance: true,
    includeShiftHistory: false,
    autoDownload: false,
  },
  automation: {
    autoAssignOnboarding: true,
    autoScheduleTraining: true,
    autoRefresh: true,
    refreshInterval: 5,
    confirmBeforeDelete: true,
    showDeletedCount: true,
  },
  advanced: {
    enableDebugMode: false,
    cacheEnabled: true,
    maxCacheSize: 100,
    showRecordIds: false,
    enableBetaFeatures: false,
  },
})

type NonInstructorSettingsState = ReturnType<typeof getDefaultNonInstructorSettings>

export default function NonInstructorPage() {
  const { primaryColor, secondaryColor } = useCustomColors()
  React.useEffect(() => {
    try { (window as any).__NI_SCOPE = true } catch {}
    return () => { try { delete (window as any).__NI_SCOPE } catch {} }
  }, [])
  const { toast } = useToast()
  const { addInstructor } = useNonInstructors()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [draftsDialogOpen, setDraftsDialogOpen] = useState(false)
  const [selectedDraftData, setSelectedDraftData] = useState<any>(null)
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null)

  // Draft management (non-instructors only)
  const { draftsCount, drafts } = useNonInstructorDrafts()

  const handleLoadDraft = (draftData: any, draftId: string) => {
    setSelectedDraftData(draftData)
    setSelectedDraftId(draftId)
    setAddDialogOpen(true)
  }

  const handleOpenAddDialog = () => {
    setSelectedDraftData(null)
    setSelectedDraftId(null)
    setAddDialogOpen(true)
  }

  const [nonInstructorSettings, setNonInstructorSettings] = useState<NonInstructorSettingsState>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(NON_INSTRUCTOR_SETTINGS_KEY)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (error) {
          console.error('Failed to parse non-instructor settings from storage', error)
        }
      }
    }
    return getDefaultNonInstructorSettings()
  })

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(NON_INSTRUCTOR_SETTINGS_KEY, JSON.stringify(nonInstructorSettings))
    }
  }, [nonInstructorSettings])

  const handleUpdateSetting = (category: string, key: string, value: any) => {
    const typedCategory = category as keyof NonInstructorSettingsState
    setNonInstructorSettings(prev => ({
      ...prev,
      [typedCategory]: {
        ...prev[typedCategory],
        [key]: value,
      },
    }))
  }

  const handleResetSettings = () => {
    const defaults = getDefaultNonInstructorSettings()
    setNonInstructorSettings(defaults)
    toast({
      title: 'Non-instructor settings reset',
      description: 'Preferences restored to the defaults for this browser.',
    })
  }

  // Reopen Drafts dialog automatically when a draft was converted and more drafts remain
  React.useEffect(() => {
    const handler = () => {
      setActiveTab('profile')
      setDraftsDialogOpen(true)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('non-instructor-drafts:open', handler)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('non-instructor-drafts:open', handler)
      }
    }
  }, [])

  return (
    <div className="container mx-auto py-6">
      <Card className="border-0 shadow-none">
        <CardHeader>
          <div className="flex items-start justify-between w-full">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>Non-Instructor Management Hub</h1>
              <p className="text-gray-600 dark:text-white">Comprehensive non-instructor management and tools</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6 bg-transparent gap-2 p-0 h-auto">
                <TabsTrigger
                  value="dashboard"
                  className="text-xs border-2 transition-colors duration-150 font-semibold rounded-lg px-4 py-2 focus:outline-none"
                  style={{
                    ...(activeTab === 'dashboard' ? {
                      backgroundColor: '#9333ea',
                      borderColor: '#9333ea',
                      color: 'white'
                    } : {
                      backgroundColor: 'transparent',
                      borderColor: '#f97316',
                      color: '#ea580c'
                    })
                  }}
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger
                  value="profile"
                  className="text-xs border-2 transition-colors duration-150 font-semibold rounded-lg px-4 py-2 focus:outline-none"
                  style={{
                    ...(activeTab === 'profile' ? {
                      backgroundColor: '#9333ea',
                      borderColor: '#9333ea',
                      color: 'white'
                    } : {
                      backgroundColor: 'transparent',
                      borderColor: '#f97316',
                      color: '#ea580c'
                    })
                  }}
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Non-Instructors
                </TabsTrigger>
                <TabsTrigger
                  value="leave"
                  className="text-xs border-2 transition-colors duration-150 font-semibold rounded-lg px-4 py-2 focus:outline-none"
                  style={{
                    ...(activeTab === 'leave' ? {
                      backgroundColor: '#9333ea',
                      borderColor: '#9333ea',
                      color: 'white'
                    } : {
                      backgroundColor: 'transparent',
                      borderColor: '#f97316',
                      color: '#ea580c'
                    })
                  }}
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Leave Management
                </TabsTrigger>
                <TabsTrigger
                  value="attendance"
                  className="text-xs border-2 transition-colors duration-150 font-semibold rounded-lg px-4 py-2 focus:outline-none"
                  style={{
                    ...(activeTab === 'attendance' ? {
                      backgroundColor: '#9333ea',
                      borderColor: '#9333ea',
                      color: 'white'
                    } : {
                      backgroundColor: 'transparent',
                      borderColor: '#f97316',
                      color: '#ea580c'
                    })
                  }}
                >
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Attendance Management
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="text-xs border-2 transition-colors duration-150 font-semibold rounded-lg px-4 py-2 focus:outline-none"
                  style={{
                    ...(activeTab === 'settings' ? {
                      backgroundColor: '#9333ea',
                      borderColor: '#9333ea',
                      color: 'white'
                    } : {
                      backgroundColor: 'transparent',
                      borderColor: '#f97316',
                      color: '#ea580c'
                    })
                  }}
                >
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>

            <TabsContent value="dashboard" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Non-Instructor Dashboard</CardTitle>
                  <CardDescription>Overview of non-instructor activities and performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <NonInstructorDashboard />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="mt-6">
              <NonInstructorProfile 
                onOpenDrafts={() => setDraftsDialogOpen(true)}
                draftsCount={draftsCount}
                onOpenAddDialog={handleOpenAddDialog}
              />
            </TabsContent>

            <TabsContent value="leave" className="mt-6">
              <NonInstructorLeaveAttendance />
            </TabsContent>

            <TabsContent value="attendance" className="mt-6">
              <NonInstructorAttendanceManagement />
            </TabsContent>
            <TabsContent value="settings" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <NonInstructorSettings
                    settings={nonInstructorSettings}
                    onUpdateSetting={handleUpdateSetting}
                    onResetSettings={handleResetSettings}
                    onSaveSettings={() => {
                      toast({
                        title: 'Settings saved',
                        description: 'Non-instructor settings have been saved successfully.',
                      })
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add New Non-Instructor Dialog */}
      <AddNonInstructorDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen}
        draftData={selectedDraftData}
        draftId={selectedDraftId || undefined}
        currentId={undefined}
        onSave={async (form) => {
          const added = await addInstructor(form)
          toast({ title: 'Non-instructor created', description: `Entry ${added.name} added successfully.` })
        }}
      />

      {/* Drafts Dialog */}
      <NonInstructorDraftsDialog
        open={draftsDialogOpen}
        onOpenChange={setDraftsDialogOpen}
        onLoadDraft={handleLoadDraft}
        onOpenAddDialog={handleOpenAddDialog}
      />

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mt-8">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <h3 className="font-medium text-sm inline-flex items-center justify-center gap-1">
              My Performance
              <Image src="/Coming soon.svg" alt="Coming Soon" width={16} height={16} className="inline-block" />
            </h3>
            <p className="text-xs text-gray-500 dark:text-white">Smart scheduling</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-medium text-sm inline-flex items-center justify-center gap-1">
              Payroll
              <Image src="/Coming soon.svg" alt="Coming Soon" width={16} height={16} className="inline-block" />
            </h3>
            <p className="text-xs text-gray-500 dark:text-white">Badges & rewards</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <Bot className="h-8 w-8 text-pink-600 mx-auto mb-2" />
            <h3 className="font-medium text-sm inline-flex items-center justify-center gap-1">
              AI Tools
              <Image src="/Coming soon.svg" alt="Coming Soon" width={16} height={16} className="inline-block" />
            </h3>
            <p className="text-xs text-gray-500 dark:text-white">Auto grading</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <Timer className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-medium text-sm inline-flex items-center justify-center gap-1">
              Development
              <Image src="/Coming soon.svg" alt="Coming Soon" width={16} height={16} className="inline-block" />
            </h3>
            <p className="text-xs text-gray-500 dark:text-white">Study duration</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2" style={{ color: primaryColor }} />
            <h3 className="font-medium text-sm inline-flex items-center justify-center gap-1">
              Hiring
              <Image src="/Coming soon.svg" alt="Coming Soon" width={16} height={16} className="inline-block" />
            </h3>
            <p className="text-xs text-gray-500 dark:text-white">Mentorship & recruitment</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <MessageCircle className="h-8 w-8 text-pink-600 mx-auto mb-2" />
            <h3 className="font-medium text-sm inline-flex items-center justify-center gap-1">
              Communication
              <Image src="/Coming soon.svg" alt="Coming Soon" width={16} height={16} className="inline-block" />
            </h3>
            <p className="text-xs text-gray-500 dark:text-white">Messaging & feedback</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <ShieldCheck className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-medium text-sm inline-flex items-center justify-center gap-1">
              Security
              <Image src="/Coming soon.svg" alt="Coming Soon" width={16} height={16} className="inline-block" />
            </h3>
            <p className="text-xs text-gray-500 dark:text-white">Compliance & safety</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <Smartphone className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-medium text-sm inline-flex items-center justify-center gap-1">
              Mobile
              <Image src="/Coming soon.svg" alt="Coming Soon" width={16} height={16} className="inline-block" />
            </h3>
            <p className="text-xs text-gray-500 dark:text-white">Mobile features</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
