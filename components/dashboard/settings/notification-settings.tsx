"use client"

import { useState } from "react"
import { useCustomColors } from '@/lib/use-custom-colors'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Button } from "@/components/dashboard/ui/button"
import { Switch } from "@/components/dashboard/ui/switch"
import { Label } from "@/components/dashboard/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Textarea } from "@/components/dashboard/ui/textarea"
import { Bell, Mail, MessageSquare, Calendar, Activity, Save, Megaphone, Users, GraduationCap, Briefcase, UserCircle, CheckSquare, Info } from "lucide-react"
import { toast } from "@/components/dashboard/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/dashboard/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/dashboard/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import { NotificationTemplateButton } from "./notification-templates-dialog"

interface NotificationSettingsProps {
  onUpdate: (updates: any) => Promise<void>
  disabled?: boolean
}

export function NotificationSettings({ onUpdate, disabled = true }: NotificationSettingsProps) {
  const { primaryColor, secondaryColor } = useCustomColors();
  const [isSaving, setIsSaving] = useState(false)
  const [showCourseTemplates, setShowCourseTemplates] = useState(false)
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    courseCreated: true,
    courseUpdated: true,
    courseDeleted: true,
    courseSoundEnabled: false,
    cohortCreated: true,
    cohortUpdated: true,
    cohortDeleted: true,
    memberAdded: true,
    memberRemoved: true,
    capacityWarnings: true,
    cohortSoundEnabled: false,
    newInstructor: true,
    profileUpdated: true,
    contractExpiring: true,
    certificationExpiring: true,
    leaveRequest: true,
    scheduleChange: true,
    instructorReminderTime: 7,
    instructorSoundEnabled: false,
    instructorDeleted: true,
    newHire: true,
    roleChange: true,
    nonInstructorUpdated: true,
    nonInstructorDeleted: true,
    nonInstructorContractExpiring: true,
    trainingDue: true,
    attendanceIssue: true,
    shiftChange: true,
    nonInstructorReminderTime: 7,
    nonInstructorSoundEnabled: false,
    studentAdded: true,
    studentUpdated: true,
    studentDeleted: true,
    enrollmentChanges: true,
    paymentReminders: true,
    attendanceAlerts: true,
    leaveRequests: true,
    studentSoundEnabled: false,
    sessionCreated: true,
    sessionUpdated: true,
    sessionCancelled: true,
    sessionRescheduled: true,
    instructorReassigned: true,
    upcomingReminders: true,
    scheduleReminderTime: 30,
    scheduleSoundEnabled: false,
    taskCreated: true,
    taskUpdated: true,
    taskCompleted: true,
    taskDeleted: true,
    dueDateReminders: true,
    overdueAlerts: true,
    taskReminderTime: 1440,
    taskSoundEnabled: false,
  })

  const handleToggle = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleReminderTimeChange = (key: string, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleEnableAll = () => {
    setSettings(prev => {
      const updated = { ...prev }
      Object.keys(updated).forEach(key => {
        if (typeof updated[key as keyof typeof updated] === 'boolean') {
          (updated as any)[key] = true
        }
      })
      return updated
    })
    toast({
      title: "All Notifications Enabled",
      description: "All notification preferences have been turned on.",
    })
  }

  const handleDisableAll = () => {
    setSettings(prev => {
      const updated = { ...prev }
      Object.keys(updated).forEach(key => {
        if (typeof updated[key as keyof typeof updated] === 'boolean') {
          (updated as any)[key] = false
        }
      })
      return updated
    })
    toast({
      title: "All Notifications Disabled",
      description: "All notification preferences have been turned off.",
    })
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await onUpdate(settings)
      toast({
        title: "Notifications Updated",
        description: "Your notification preferences have been saved.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <TooltipProvider>
    <div className={"space-y-6 " + (disabled ? "pointer-events-none opacity-50 grayscale" : "")}>
      {/* Quick Actions */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleEnableAll}
          variant="outline"
          className="gap-2"
          disabled={disabled}
        >
          <Bell className="h-4 w-4" />
          Enable All
        </Button>
        <Button
          onClick={handleDisableAll}
          variant="outline"
          className="gap-2"
          disabled={disabled}
        >
          <Bell className="h-4 w-4" />
          Disable All
        </Button>
      </div>

      {/* Communication Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" style={{ color: primaryColor }} />
            Communication Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5" style={{ color: primaryColor }} />
              <div>
                <Label htmlFor="emailNotifications" className="font-medium">Email Notifications</Label>
                <p className="text-sm text-gray-500 dark:text-white">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <Switch
              id="emailNotifications"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => handleToggle("emailNotifications", checked)}
              disabled={disabled}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border dark:border-gray-700 bg-background dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5" style={{ color: primaryColor }} />
              <div>
                <Label htmlFor="pushNotifications" className="font-medium">In App Notifications</Label>
                <p className="text-sm text-gray-500 dark:text-white">
                  Receive push notifications on your device
                </p>
              </div>
            </div>
            <Switch
              id="pushNotifications"
              checked={settings.pushNotifications}
              onCheckedChange={(checked) => handleToggle("pushNotifications", checked)}
              disabled={disabled}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-gray-50 opacity-60">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-gray-400 dark:text-white" />
              <div>
                <Label htmlFor="smsNotifications" className="font-medium text-gray-500 dark:text-white">SMS Notifications</Label>
                <p className="text-sm text-gray-400 dark:text-white">
                  Receive important alerts via SMS
                </p>
              </div>
            </div>
            <Switch
              id="smsNotifications"
              checked={settings.smsNotifications}
              onCheckedChange={(checked) => handleToggle("smsNotifications", checked)}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Course Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" style={{ color: primaryColor }} />
                Course Notifications
              </CardTitle>
              <CardDescription>
                Manage notifications for course-related activities
              </CardDescription>
            </div>
            <Dialog open={showCourseTemplates} onOpenChange={setShowCourseTemplates}>
              <DialogTrigger asChild>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Info className="h-5 w-5" style={{ color: primaryColor }} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    View message templates
                  </TooltipContent>
                </Tooltip>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5" style={{ color: primaryColor }} />
                    Course Notification Templates
                  </DialogTitle>
                  <DialogDescription>
                    Preview and customize notification templates for course-related activities
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="email" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email">Email</TabsTrigger>
                    <TabsTrigger value="inapp">In-App</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="email" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">Course Created</span>
                        </h4>
                        <div className="space-y-2 text-sm">
                          <Label htmlFor="courseCreatedSubject">Subject</Label>
                          <Textarea
                            id="courseCreatedSubject"
                            className="min-h-[40px] bg-white"
                            defaultValue="New Course Added - {{courseName}}"
                          />
                          <Label htmlFor="courseCreatedBody">Message Body</Label>
                          <Textarea
                            id="courseCreatedBody"
                            className="min-h-[200px] bg-background dark:bg-gray-800 font-mono text-xs"
                            defaultValue={`Hi {{recipientName}},

A new course has been created:

� Course: {{courseName}}
� Code: {{courseCode}}
� Duration: {{duration}}
� Category: {{category}}
� Created by: {{createdBy}}

View course details in the dashboard.`}
                          />
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 bg-gray-50">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">Course Updated</span>
                        </h4>
                        <div className="space-y-2 text-sm">
                          <Label htmlFor="courseUpdatedSubject">Subject</Label>
                          <Textarea
                            id="courseUpdatedSubject"
                            className="min-h-[40px] bg-white"
                            defaultValue="Course Updated - {{courseName}}"
                          />
                          <Label htmlFor="courseUpdatedBody">Message Body</Label>
                          <Textarea
                            id="courseUpdatedBody"
                            className="min-h-[180px] bg-white font-mono text-xs"
                            defaultValue={`Hi {{recipientName}},

The course {{courseName}} has been updated.

Changes made:
� {{changesList}}

Updated by: {{updatedBy}}

Review the changes in the course management section.`}
                          />
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 bg-gray-50">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">Course Deleted</span>
                        </h4>
                        <div className="space-y-2 text-sm">
                          <Label htmlFor="courseDeletedSubject">Subject</Label>
                          <Textarea
                            id="courseDeletedSubject"
                            className="min-h-[40px] bg-white"
                            defaultValue="Course Removed - {{courseName}}"
                          />
                          <Label htmlFor="courseDeletedBody">Message Body</Label>
                          <Textarea
                            id="courseDeletedBody"
                            className="min-h-[200px] bg-white font-mono text-xs"
                            defaultValue={`Hi {{recipientName}},

The following course has been deleted from the system:

� Course: {{courseName}}
� Code: {{courseCode}}
� Deleted by: {{deletedBy}}
� Date: {{deletionDate}}

Note: Associated cohorts and sessions may be affected.`}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="inapp" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>Course Created</span>
                        </h4>
                        <div className="bg-white p-4 rounded border">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full" style={{ backgroundColor: `${primaryColor}20` }}>
                              <Megaphone className="h-5 w-5" style={{ color: primaryColor }} />
                            </div>
                            <div className="flex-1 text-sm">
                              <p className="font-semibold">New Course Created</p>
                              <p className="text-gray-600 dark:text-white mt-1">
                                {"{{courseName}}"} ({"{{courseCode}}"}) has been added to the system.
                              </p>
                              <p className="text-xs text-gray-500 dark:text-white mt-2">{"{{timeAgo}}"}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 bg-gray-50">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">Course Updated</span>
                        </h4>
                        <div className="bg-white p-4 rounded border">
                          <div className="flex items-start gap-3">
                            <div className="bg-blue-100 p-2 rounded-full">
                              <Activity className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 text-sm">
                              <p className="font-semibold">Course Updated</p>
                              <p className="text-gray-600 dark:text-white mt-1">
                                {"{{courseName}}"} was updated by {"{{updatedBy}}"}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-white mt-2">{"{{timeAgo}}"}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 bg-gray-50">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">Course Deleted</span>
                        </h4>
                        <div className="bg-white p-4 rounded border">
                          <div className="flex items-start gap-3">
                            <div className="bg-red-100 p-2 rounded-full">
                              <Bell className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1 text-sm">
                              <p className="font-semibold">Course Deleted</p>
                              <p className="text-gray-600 dark:text-white mt-1">
                                {"{{courseName}}"} has been removed from the system.
                              </p>
                              <p className="text-xs text-gray-500 dark:text-white mt-2">{"{{timeAgo}}"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 p-4 rounded-lg border" style={{ backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}40` }}>
                  <h4 className="font-semibold text-sm mb-2" style={{ color: `${primaryColor}dd` }}>Available Variables</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><code className="bg-white px-2 py-1 rounded">{"{{courseName}}"}</code> - Course name</div>
                    <div><code className="bg-white px-2 py-1 rounded">{"{{courseCode}}"}</code> - Course code</div>
                    <div><code className="bg-white px-2 py-1 rounded">{"{{duration}}"}</code> - Course duration</div>
                    <div><code className="bg-white px-2 py-1 rounded">{"{{category}}"}</code> - Course category</div>
                    <div><code className="bg-white px-2 py-1 rounded">{"{{createdBy}}"}</code> - Creator name</div>
                    <div><code className="bg-white px-2 py-1 rounded">{"{{updatedBy}}"}</code> - Updater name</div>
                    <div><code className="bg-white px-2 py-1 rounded">{"{{deletedBy}}"}</code> - Deleter name</div>
                    <div><code className="bg-white px-2 py-1 rounded">{"{{recipientName}}"}</code> - Recipient name</div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="courseCreated" className="flex-1">Course Created</Label>
              <Switch
                id="courseCreated"
                checked={settings.courseCreated}
                onCheckedChange={(checked) => handleToggle("courseCreated", checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="courseUpdated" className="flex-1">Course Updated</Label>
              <Switch
                id="courseUpdated"
                checked={settings.courseUpdated}
                onCheckedChange={(checked) => handleToggle("courseUpdated", checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="courseDeleted" className="flex-1">Course Deleted</Label>
              <Switch
                id="courseDeleted"
                checked={settings.courseDeleted}
                onCheckedChange={(checked) => handleToggle("courseDeleted", checked)}
                disabled={disabled}
              />
            </div>
            
            
          </div>
        </CardContent>
      </Card>

      {/* Cohort Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" style={{ color: primaryColor }} />
                Cohort Notifications
              </CardTitle>
              <CardDescription>
                Manage notifications for cohort-related activities
              </CardDescription>
            </div>
            <NotificationTemplateButton type="cohort" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="cohortCreated" className="flex-1">Cohort Created</Label>
              <Switch
                id="cohortCreated"
                checked={settings.cohortCreated}
                onCheckedChange={(checked) => handleToggle("cohortCreated", checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="cohortUpdated" className="flex-1">Cohort Updated</Label>
              <Switch
                id="cohortUpdated"
                checked={settings.cohortUpdated}
                onCheckedChange={(checked) => handleToggle("cohortUpdated", checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="cohortDeleted" className="flex-1">Cohort Deleted</Label>
              <Switch
                id="cohortDeleted"
                checked={settings.cohortDeleted}
                onCheckedChange={(checked) => handleToggle("cohortDeleted", checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="memberAdded" className="flex-1">Member Added</Label>
              <Switch
                id="memberAdded"
                checked={settings.memberAdded}
                onCheckedChange={(checked) => handleToggle("memberAdded", checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="memberRemoved" className="flex-1">Member Removed</Label>
              <Switch
                id="memberRemoved"
                checked={settings.memberRemoved}
                onCheckedChange={(checked) => handleToggle("memberRemoved", checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="capacityWarnings" className="flex-1">Capacity Warnings</Label>
              <Switch
                id="capacityWarnings"
                checked={settings.capacityWarnings}
                onCheckedChange={(checked) => handleToggle("capacityWarnings", checked)}
                disabled={disabled}
              />
            </div>
            
          </div>
        </CardContent>
      </Card>

      {/* Instructor Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" style={{ color: primaryColor }} />
                Instructor Notifications
              </CardTitle>
              <CardDescription>
                Manage notifications for instructor-related activities
              </CardDescription>
            </div>
            <NotificationTemplateButton type="instructor" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="newInstructor" className="flex-1">New Instructor Added</Label>
              <Switch
                id="newInstructor"
                checked={settings.newInstructor}
                onCheckedChange={(checked) => handleToggle("newInstructor", checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="profileUpdated" className="flex-1">Instructor Updated</Label>
              <Switch
                id="profileUpdated"
                checked={settings.profileUpdated}
                onCheckedChange={(checked) => handleToggle("profileUpdated", checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="instructorDeleted" className="flex-1">Instructor Deleted</Label>
              <Switch
                id="instructorDeleted"
                checked={settings.instructorDeleted}
                onCheckedChange={(checked) => handleToggle("instructorDeleted", checked)}
                disabled={disabled}
              />
            </div>
            
            
            
          </div>
        </CardContent>
      </Card>

      {/* Non-Instructor Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" style={{ color: primaryColor }} />
                Non-Instructor Notifications
              </CardTitle>
              <CardDescription>
                Manage notifications for non-instructor staff activities
              </CardDescription>
            </div>
            <NotificationTemplateButton type="non-instructor" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="newHire" className="flex-1">New Non Instructor Added</Label>
              <Switch
                id="newHire"
                checked={settings.newHire}
                onCheckedChange={(checked) => handleToggle("newHire", checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="nonInstructorUpdated" className="flex-1">Non Instructor Updated</Label>
              <Switch
                id="nonInstructorUpdated"
                checked={settings.nonInstructorUpdated}
                onCheckedChange={(checked) => handleToggle("nonInstructorUpdated", checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="nonInstructorDeleted" className="flex-1">Non Instructor Deleted</Label>
              <Switch
                id="nonInstructorDeleted"
                checked={settings.nonInstructorDeleted}
                onCheckedChange={(checked) => handleToggle("nonInstructorDeleted", checked)}
                disabled={disabled}
              />
            </div>
            
  
          </div>
        </CardContent>
      </Card>

      {/* Student Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" style={{ color: primaryColor }} />
                Student Notifications
              </CardTitle>
              <CardDescription>
                Manage notifications for student-related activities
              </CardDescription>
            </div>
            <NotificationTemplateButton type="student" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="studentAdded" className="flex-1">Student Added</Label>
              <Switch
                id="studentAdded"
                checked={settings.studentAdded}
                onCheckedChange={(checked) => handleToggle("studentAdded", checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="studentUpdated" className="flex-1">Student Updated</Label>
              <Switch
                id="studentUpdated"
                checked={settings.studentUpdated}
                onCheckedChange={(checked) => handleToggle("studentUpdated", checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="studentDeleted" className="flex-1">Student Deleted</Label>
              <Switch
                id="studentDeleted"
                checked={settings.studentDeleted}
                onCheckedChange={(checked) => handleToggle("studentDeleted", checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="enrollmentChanges" className="flex-1">Enrollment Changes</Label>
              <Switch
                id="enrollmentChanges"
                checked={settings.enrollmentChanges}
                onCheckedChange={(checked) => handleToggle("enrollmentChanges", checked)}
                disabled={disabled}
              />
            </div>
            
          </div>
        </CardContent>
      </Card>

      {/* Schedule Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" style={{ color: primaryColor }} />
                Schedule Notifications
              </CardTitle>
              <CardDescription>
                Manage notifications for schedule and session-related activities
              </CardDescription>
            </div>
            <NotificationTemplateButton type="schedule" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="sessionCreated" className="flex-1">Session Created</Label>
              <Switch
                id="sessionCreated"
                checked={settings.sessionCreated}
                onCheckedChange={(checked) => handleToggle("sessionCreated", checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="sessionUpdated" className="flex-1">Session Updated</Label>
              <Switch
                id="sessionUpdated"
                checked={settings.sessionUpdated}
                onCheckedChange={(checked) => handleToggle("sessionUpdated", checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="sessionCancelled" className="flex-1">Session Cancelled</Label>
              <Switch
                id="sessionCancelled"
                checked={settings.sessionCancelled}
                onCheckedChange={(checked) => handleToggle("sessionCancelled", checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="sessionRescheduled" className="flex-1">Session Rescheduled</Label>
              <Switch
                id="sessionRescheduled"
                checked={settings.sessionRescheduled}
                onCheckedChange={(checked) => handleToggle("sessionRescheduled", checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="instructorReassigned" className="flex-1">Instructor Reassigned</Label>
              <Switch
                id="instructorReassigned"
                checked={settings.instructorReassigned}
                onCheckedChange={(checked) => handleToggle("instructorReassigned", checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="upcomingReminders" className="flex-1">Upcoming Reminders</Label>
              <Switch
                id="upcomingReminders"
                checked={settings.upcomingReminders}
                onCheckedChange={(checked) => handleToggle("upcomingReminders", checked)}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="scheduleReminderTime">Reminder Time (minutes before)</Label>
              <Select 
                value={settings.scheduleReminderTime.toString()} 
                onValueChange={(value) => handleReminderTimeChange("scheduleReminderTime", parseInt(value))}
                disabled={disabled}
              >
                <SelectTrigger id="scheduleReminderTime">
                  <SelectValue placeholder="Select reminder time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="1440">1 day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            
          </div>
        </CardContent>
      </Card>

      {/* Task Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" style={{ color: primaryColor }} />
                Task Notifications
              </CardTitle>
              <CardDescription>
                Manage notifications for task management activities
              </CardDescription>
            </div>
            <NotificationTemplateButton type="task" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="taskCreated" className="flex-1">Task Created</Label>
              <Switch
                id="taskCreated"
                checked={settings.taskCreated}
                onCheckedChange={(checked) => handleToggle("taskCreated", checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="taskUpdated" className="flex-1">Task Updated</Label>
              <Switch
                id="taskUpdated"
                checked={settings.taskUpdated}
                onCheckedChange={(checked) => handleToggle("taskUpdated", checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="taskCompleted" className="flex-1">Task Completed</Label>
              <Switch
                id="taskCompleted"
                checked={settings.taskCompleted}
                onCheckedChange={(checked) => handleToggle("taskCompleted", checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="taskDeleted" className="flex-1">Task Deleted</Label>
              <Switch
                id="taskDeleted"
                checked={settings.taskDeleted}
                onCheckedChange={(checked) => handleToggle("taskDeleted", checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="dueDateReminders" className="flex-1">Due Date Reminders</Label>
              <Switch
                id="dueDateReminders"
                checked={settings.dueDateReminders}
                onCheckedChange={(checked) => handleToggle("dueDateReminders", checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="overdueAlerts" className="flex-1">Overdue Alerts</Label>
              <Switch
                id="overdueAlerts"
                checked={settings.overdueAlerts}
                onCheckedChange={(checked) => handleToggle("overdueAlerts", checked)}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="taskReminderTime">Reminder Time (hours before)</Label>
              <Select 
                value={settings.taskReminderTime.toString()} 
                onValueChange={(value) => handleReminderTimeChange("taskReminderTime", parseInt(value))}
                disabled={disabled}
              >
                <SelectTrigger id="taskReminderTime">
                  <SelectValue placeholder="Select reminder time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                  <SelectItem value="24">1 day</SelectItem>
                  <SelectItem value="48">2 days</SelectItem>
                  <SelectItem value="168">1 week</SelectItem>
                  <SelectItem value="1440">1 day (minutes)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving || disabled}
          className="gap-2"
          style={{ backgroundColor: primaryColor }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}dd`}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
    </TooltipProvider>
  )
}
