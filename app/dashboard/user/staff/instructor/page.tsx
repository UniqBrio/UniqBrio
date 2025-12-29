"use client"

import React, { useState, useEffect } from "react"
import { useCustomColors } from "@/lib/use-custom-colors"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/staff/tabs"
import InstructorDashboard from "@/components/dashboard/instructor/instructor-dashboard"
import InstructorProfile from "@/components/dashboard/instructor/instructor-profile/index"
import LeaveAttendance from "@/components/dashboard/instructor/leave-attendance"
import { AttendanceManagement } from "@/components/dashboard/instructor/attendance/attendance-management"
import AddInstructorDialog from "@/components/dashboard/instructor/add-instructor-dialog-refactored/AddInstructorDialogWrapper"
import InstructorDraftsDialog from "@/components/dashboard/instructor/instructor-drafts-dialog"
import { useInstructorDrafts } from "@/hooks/dashboard/staff/use-instructor-drafts"
import { useInstructors } from "@/hooks/dashboard/staff/use-instructors"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/staff/card"
import { Bot, Target, Timer } from "@/components/dashboard/ui/staff/feature-icons"
import { DollarSign, Users, MessageCircle, ShieldCheck, Smartphone, LayoutDashboard, GraduationCap, ClipboardCheck, CalendarDays, Settings as SettingsIcon } from "lucide-react"
import { Button } from "@/components/dashboard/ui/staff/button"
import { useToast } from "@/hooks/dashboard/use-toast"
import InstructorSettings from "@/components/dashboard/instructor/instructor-settings"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
// Removed Save icon import; Drafts button moved into toolbar within Instructors tab

const INSTRUCTOR_SETTINGS_KEY = 'instructorSettings'

const getDefaultInstructorSettings = () => ({
  identity: {
    customIdPrefix: 'INST',
    numberingStrategy: 'sequential' as const,
    idNumberPadding: 4,
    sequenceStart: 1,
    allowManualIds: false,
    enforceUppercase: true,
    showIdBadges: true,
  },
  display: {
    defaultView: 'cards',
    highlightExpiringDocs: true,
    showCertifications: true,
    showContactInfo: true,
    colorCodeByStatus: true,
    compactMode: false,
    showPerformanceBadges: true,
  },
  filters: {
    rememberLastFilters: true,
    autoApplyFilters: false,
    defaultStatus: 'active',
    defaultSpecialization: 'all',
    showAdvancedFilters: false,
    includeInactive: false,
  },
  notifications: {
    newInstructor: true,
    profileUpdated: true,
    contractExpiring: true,
    certificationExpiring: true,
    leaveRequest: true,
    scheduleChange: true,
    reminderTime: 7,
    soundEnabled: false,
  },
  export: {
    defaultFormat: 'csv',
    includeContactDetails: true,
    includeDocuments: true,
    includeCompensation: false,
    autoDownload: false,
  },
  automation: {
    autoAssignMentor: true,
    autoScheduleOrientation: true,
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

type InstructorSettingsState = ReturnType<typeof getDefaultInstructorSettings>

export default function InstructorPage() {
  const { primaryColor, secondaryColor } = useCustomColors()
  const { toast } = useToast()
  const { addInstructor } = useInstructors()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [draftsDialogOpen, setDraftsDialogOpen] = useState(false)
  const [selectedDraftData, setSelectedDraftData] = useState(null)
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null)

  // Handle URL parameter for tab switching
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['dashboard', 'profile', 'leave', 'attendance', 'settings'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Draft management
  const { draftsCount, drafts, saveDraft } = useInstructorDrafts()
  
  console.log('Drafts count:', draftsCount)
  console.log('All drafts:', drafts)

  // Handle loading draft data
  const handleLoadDraft = (draftData: any, draftId: string) => {
    setSelectedDraftData(draftData)
    setSelectedDraftId(draftId)
    setAddDialogOpen(true)
  }

  // Reopen Drafts dialog automatically if a draft was converted to instructor and more drafts remain
  React.useEffect(() => {
    const handler = () => {
      // Ensure the user is on the Instructors tab
      setActiveTab('profile')
      setDraftsDialogOpen(true)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('instructor-drafts:open', handler)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('instructor-drafts:open', handler)
      }
    }
  }, [])

  // Handle opening add dialog fresh (no draft)
  const handleOpenAddDialog = () => {
    setSelectedDraftData(null)
    setSelectedDraftId(null)
    setAddDialogOpen(true)
  }

  const [instructorSettings, setInstructorSettings] = useState<InstructorSettingsState>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(INSTRUCTOR_SETTINGS_KEY)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (error) {
          console.error('Failed to parse instructor settings from storage', error)
        }
      }
    }
    return getDefaultInstructorSettings()
  })

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(INSTRUCTOR_SETTINGS_KEY, JSON.stringify(instructorSettings))
    }
  }, [instructorSettings])

  const handleUpdateSetting = (category: string, key: string, value: any) => {
    setInstructorSettings(prev => {
      const typedCategory = category as keyof InstructorSettingsState
      return {
        ...prev,
        [typedCategory]: {
          ...prev[typedCategory],
          [key]: value,
        },
      }
    })
  }

  const handleResetSettings = () => {
    const defaults = getDefaultInstructorSettings()
    setInstructorSettings(defaults)
    toast({
      title: 'Instructor settings reset',
      description: 'All instructor preferences are back to their defaults.',
    })
  }

  return (
    <div className="container mx-auto py-3 sm:py-4 md:py-6">
      {/* Make the outer container card borderless to avoid an extra visible layer */}
      <Card className="border-0 shadow-none">
        <CardHeader className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
          <div className="flex items-start justify-between w-full">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2" style={{ color: primaryColor }}>Instructor Management Hub</h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-white">Comprehensive instructor management and tools</p>
            </div>
            {/* Buttons moved into the Instructors tab toolbar next to Export */}
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-4 md:px-6">
          {/* Enhanced Navigation Tabs with Course Page Design */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mb-3 sm:mb-4 md:mb-6 bg-transparent gap-1 sm:gap-2 p-0 h-auto">
              <TabsTrigger 
                value="dashboard" 
                className="flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border-2 text-xs sm:text-sm md:text-base font-medium transition-all"
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
                <LayoutDashboard className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                <span className="hidden xs:inline sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger 
                value="profile" 
                className="flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border-2 text-xs sm:text-sm md:text-base font-medium transition-all"
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
                <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                <span className="hidden xs:inline sm:inline">Instructors</span>
              </TabsTrigger>
              <TabsTrigger 
                value="leave" 
                className="flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border-2 text-xs sm:text-sm md:text-base font-medium transition-all"
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
                <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                <span className="hidden xs:inline sm:inline">Leave</span>
              </TabsTrigger>
              <TabsTrigger 
                value="attendance" 
                className="flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border-2 text-xs sm:text-sm md:text-base font-medium transition-all"
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
                <ClipboardCheck className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                <span className="hidden xs:inline sm:inline">Attendance</span>
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border-2 text-xs sm:text-sm md:text-base font-medium transition-all"
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
                <SettingsIcon className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                <span className="hidden xs:inline sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="mt-3 sm:mt-4 md:mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Instructor Dashboard</CardTitle>
                  <CardDescription>Overview of your instructor activities and performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <InstructorDashboard />
                </CardContent>
              </Card>
            </TabsContent>
            {/* Remove extra Card wrapper so the tab shows only the two intended sections (List and Performance) */}
            <TabsContent value="profile" className="mt-3 sm:mt-4 md:mt-6">
              <InstructorProfile 
                onOpenDrafts={() => setDraftsDialogOpen(true)}
                draftsCount={draftsCount}
                onOpenAddDialog={handleOpenAddDialog}
              />
            </TabsContent>
            <TabsContent value="leave" className="mt-3 sm:mt-4 md:mt-6">
              <LeaveAttendance />
            </TabsContent>
            <TabsContent value="attendance" className="mt-3 sm:mt-4 md:mt-6">
              <AttendanceManagement />
            </TabsContent>
            <TabsContent value="settings" className="mt-3 sm:mt-4 md:mt-6">
              <Card>
                <CardContent className="p-6">
                  <InstructorSettings
                    settings={instructorSettings}
                    onUpdateSetting={handleUpdateSetting}
                    onResetSettings={handleResetSettings}
                    onSaveSettings={() => {
                      toast({
                        title: 'Settings saved',
                        description: 'Instructor settings have been saved successfully.',
                      })
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add New Instructor Dialog */}
      <AddInstructorDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen}
        draftData={selectedDraftData}
        draftId={selectedDraftId || undefined}
        // Provide the draft id to allow updating the same draft when clicking Save Draft inside the dialog
        currentId={undefined}
        onSave={async (form) => {
          const added = await addInstructor(form)
          toast({ title: 'Instructor created', description: `Instructor ${added.name} added successfully.` })
        }}
      />

      {/* Drafts Dialog */}
      <InstructorDraftsDialog
        open={draftsDialogOpen}
        onOpenChange={setDraftsDialogOpen}
        onLoadDraft={handleLoadDraft}
        onOpenAddDialog={handleOpenAddDialog}
      />

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-6 md:mt-8 px-3 sm:px-4 md:px-0">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-2 sm:p-3 md:p-4 text-center">
            <Target className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-yellow-600 mx-auto mb-1 sm:mb-2" />
            <h3 className="font-medium text-xs sm:text-sm inline-flex items-center justify-center gap-1">
              My Performance
              <Image src="/Coming soon.svg" alt="Coming Soon" width={12} height={12} className="inline-block sm:w-4 sm:h-4" />
            </h3>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-white">Smart scheduling</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-2 sm:p-3 md:p-4 text-center">
            <DollarSign className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-green-600 mx-auto mb-1 sm:mb-2" />
            <h3 className="font-medium text-xs sm:text-sm inline-flex items-center justify-center gap-1">
              Payroll
              <Image src="/Coming soon.svg" alt="Coming Soon" width={12} height={12} className="inline-block sm:w-4 sm:h-4" />
            </h3>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-white">Badges & rewards</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-2 sm:p-3 md:p-4 text-center">
            <Bot className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-pink-600 mx-auto mb-1 sm:mb-2" />
            <h3 className="font-medium text-xs sm:text-sm inline-flex items-center justify-center gap-1">
              AI Tools
              <Image src="/Coming soon.svg" alt="Coming Soon" width={12} height={12} className="inline-block sm:w-4 sm:h-4" />
            </h3>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-white">Auto grading</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-2 sm:p-3 md:p-4 text-center">
            <Timer className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-blue-600 mx-auto mb-1 sm:mb-2" />
            <h3 className="font-medium text-xs sm:text-sm inline-flex items-center justify-center gap-1">
              Development
              <Image src="/Coming soon.svg" alt="Coming Soon" width={12} height={12} className="inline-block sm:w-4 sm:h-4" />
            </h3>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-white">Study duration</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-2 sm:p-3 md:p-4 text-center">
            <Users className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 mx-auto mb-1 sm:mb-2" style={{ color: primaryColor }} />
            <h3 className="font-medium text-xs sm:text-sm inline-flex items-center justify-center gap-1">
              Hiring
              <Image src="/Coming soon.svg" alt="Coming Soon" width={12} height={12} className="inline-block sm:w-4 sm:h-4" />
            </h3>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-white">Mentorship & recruitment</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-2 sm:p-3 md:p-4 text-center">
            <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-pink-600 mx-auto mb-1 sm:mb-2" />
            <h3 className="font-medium text-xs sm:text-sm inline-flex items-center justify-center gap-1">
              Communication
              <Image src="/Coming soon.svg" alt="Coming Soon" width={12} height={12} className="inline-block sm:w-4 sm:h-4" />
            </h3>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-white">Messaging & feedback</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-2 sm:p-3 md:p-4 text-center">
            <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-blue-600 mx-auto mb-1 sm:mb-2" />
            <h3 className="font-medium text-xs sm:text-sm inline-flex items-center justify-center gap-1">
              Security
              <Image src="/Coming soon.svg" alt="Coming Soon" width={12} height={12} className="inline-block sm:w-4 sm:h-4" />
            </h3>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-white">Compliance & safety</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-2 sm:p-3 md:p-4 text-center">
            <Smartphone className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-green-600 mx-auto mb-1 sm:mb-2" />
            <h3 className="font-medium text-xs sm:text-sm inline-flex items-center justify-center gap-1">
              Mobile
              <Image src="/Coming soon.svg" alt="Coming Soon" width={12} height={12} className="inline-block sm:w-4 sm:h-4" />
            </h3>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-white">Mobile features</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}