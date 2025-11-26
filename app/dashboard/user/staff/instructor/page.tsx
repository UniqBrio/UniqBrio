"use client"

import React, { useState } from "react"
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
    defaultFormat: 'xlsx',
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
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [draftsDialogOpen, setDraftsDialogOpen] = useState(false)
  const [selectedDraftData, setSelectedDraftData] = useState(null)
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null)

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
    <div className="container mx-auto py-6">
      {/* Make the outer container card borderless to avoid an extra visible layer */}
      <Card className="border-0 shadow-none">
        <CardHeader>
          <div className="flex items-start justify-between w-full">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>Instructor Management Hub</h1>
              <p className="text-gray-600 dark:text-white">Comprehensive instructor management and tools</p>
            </div>
            {/* Buttons moved into the Instructors tab toolbar next to Export */}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col gap-2">
              <TabsList className="grid w-full grid-cols-5 gap-1 h-auto p-1">
                <TabsTrigger
                  value="dashboard"
                  className="text-xs border-2 bg-white dark:bg-gray-900 transition-colors duration-150 font-semibold rounded-lg px-4 py-2 focus:outline-none"
                  style={{ borderColor: secondaryColor, color: secondaryColor }}
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger
                  value="profile"
                  className="text-xs border-2 bg-white dark:bg-gray-900 transition-colors duration-150 font-semibold rounded-lg px-4 py-2 focus:outline-none"
                  style={{ borderColor: secondaryColor, color: secondaryColor }}
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Instructors
                </TabsTrigger>
                <TabsTrigger
                  value="leave"
                  className="text-xs border-2 bg-white dark:bg-gray-900 transition-colors duration-150 font-semibold rounded-lg px-4 py-2 focus:outline-none"
                  style={{ borderColor: secondaryColor, color: secondaryColor }}
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Leave Management
                </TabsTrigger>
                <TabsTrigger
                  value="attendance"
                  className="text-xs border-2 bg-white dark:bg-gray-900 transition-colors duration-150 font-semibold rounded-lg px-4 py-2 focus:outline-none"
                  style={{ borderColor: secondaryColor, color: secondaryColor }}
                >
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Attendance Management
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="text-xs border-2 bg-white dark:bg-gray-900 transition-colors duration-150 font-semibold rounded-lg px-4 py-2 focus:outline-none"
                  style={{ borderColor: secondaryColor, color: secondaryColor }}
                >
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="dashboard" className="mt-6">
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
            <TabsContent value="profile" className="mt-6">
              <InstructorProfile 
                onOpenDrafts={() => setDraftsDialogOpen(true)}
                draftsCount={draftsCount}
                onOpenAddDialog={handleOpenAddDialog}
              />
            </TabsContent>
            <TabsContent value="leave" className="mt-6">
              <LeaveAttendance />
            </TabsContent>
            <TabsContent value="attendance" className="mt-6">
              <AttendanceManagement />
            </TabsContent>
            <TabsContent value="settings" className="mt-6">
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
