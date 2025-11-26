"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Label } from "@/components/dashboard/ui/label"
import { Textarea } from "@/components/dashboard/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Switch } from "@/components/dashboard/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import { Badge } from "@/components/dashboard/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/dashboard/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/dashboard/ui/table"
import { Plus, Edit, Trash2, Mail, MessageSquare, Phone, Bell, Users, Tag, Save, Upload, Download } from "lucide-react"
import { format } from "date-fns"
import { useCustomColors } from '@/lib/use-custom-colors'

interface CommunicationTemplate {
  id: string
  name: string
  type: "Email" | "SMS" | "WhatsApp"
  subject?: string
  content: string
  variables: string[]
  isActive: boolean
  createdBy: string
  createdAt: string
  lastUsed?: string
}

interface TagRule {
  id: string
  name: string
  condition: string
  action: string
  tag: string
  isActive: boolean
  priority: number
}

interface NotificationSetting {
  id: string
  type: string
  enabled: boolean
  channels: string[]
  frequency: string
}

interface UserRole {
  id: string
  name: string
  permissions: string[]
  userCount: number
}

export default function SettingsPage() {
  const { primaryColor } = useCustomColors()
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([])
  const [tagRules, setTagRules] = useState<TagRule[]>([])
  const [notifications, setNotifications] = useState<NotificationSetting[]>([])
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showTagRuleDialog, setShowTagRuleDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<CommunicationTemplate | null>(null)

  useEffect(() => {
    const mockTemplates: CommunicationTemplate[] = [
        {
          id: "TPL001",
          name: "Welcome Email",
          type: "Email",
          subject: "Welcome to UniqBrio - {{studentName}}",
          content:
            "Hi {{studentName}},\n\nWelcome to UniqBrio! We're excited to have you join our {{courseName}} program.\n\nYour learning journey starts here. Our team will be in touch with you soon with next steps.\n\nBest regards,\nUniqBrio Team",
          variables: ["studentName", "courseName"],
          isActive: true,
          createdBy: "Admin",
          createdAt: "2024-01-10T10:00:00Z",
          lastUsed: "2024-01-15T14:30:00Z",
        },
        {
          id: "TPL002",
          name: "Trial Reminder SMS",
          type: "SMS",
          content:
            "Hi {{studentName}}, this is a reminder about your trial session for {{courseName}} tomorrow at {{trialTime}}. Join link: {{joinLink}}",
          variables: ["studentName", "courseName", "trialTime", "joinLink"],
          isActive: true,
          createdBy: "Admin",
          createdAt: "2024-01-12T15:00:00Z",
          lastUsed: "2024-01-16T09:00:00Z",
        },
        {
          id: "TPL003",
          name: "Follow-up WhatsApp",
          type: "WhatsApp",
          content:
            "Hello {{studentName}}! ??\n\nI hope you enjoyed your trial session for {{courseName}}. Do you have any questions about the program?\n\nI'm here to help! ??",
          variables: ["studentName", "courseName"],
          isActive: true,
          createdBy: "John Doe",
          createdAt: "2024-01-14T11:00:00Z",
        },
      ]

      const mockTagRules: TagRule[] = [
        {
          id: "TR001",
          name: "High Priority Lead",
          condition: "Source = 'Referral' AND Interest Level = 'High'",
          action: "Add Tag",
          tag: "hot-lead",
          isActive: true,
          priority: 1,
        },
        {
          id: "TR002",
          name: "Budget Conscious",
          condition: "Enquiry contains 'budget' OR 'cost' OR 'fee'",
          action: "Add Tag",
          tag: "budget-conscious",
          isActive: true,
          priority: 2,
        },
        {
          id: "TR003",
          name: "Technical Background",
          condition: "Background contains 'engineer' OR 'developer' OR 'IT'",
          action: "Add Tag",
          tag: "technical-background",
          isActive: true,
          priority: 3,
        },
      ]

      const mockNotifications: NotificationSetting[] = [
        {
          id: "N001",
          type: "New Lead Assignment",
          enabled: true,
          channels: ["Email", "In-app"],
          frequency: "Immediate",
        },
        {
          id: "N002",
          type: "Trial Session Reminder",
          enabled: true,
          channels: ["Email", "SMS"],
          frequency: "1 hour before",
        },
        {
          id: "N003",
          type: "Follow-up Due",
          enabled: true,
          channels: ["In-app"],
          frequency: "Daily digest",
        },
        {
          id: "N004",
          type: "Weekly Performance Report",
          enabled: false,
          channels: ["Email"],
          frequency: "Weekly",
        },
      ]

      const mockUserRoles: UserRole[] = [
        {
          id: "R001",
          name: "Admin",
          permissions: ["All Access"],
          userCount: 2,
        },
        {
          id: "R002",
          name: "Counselor",
          permissions: ["View Leads", "Edit Leads", "Schedule Trials", "Log Sessions"],
          userCount: 5,
        },
        {
          id: "R003",
          name: "Viewer",
          permissions: ["View Only"],
          userCount: 3,
        },
      ]

      setTemplates(mockTemplates)
      setTagRules(mockTagRules)
      setNotifications(mockNotifications)
      setUserRoles(mockUserRoles)
      setLoading(false)
  }, [])

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case "Email":
        return <Mail className="w-4 h-4" />
      case "SMS":
        return <Phone className="w-4 h-4" />
      case "WhatsApp":
        return <MessageSquare className="w-4 h-4" />
      default:
        return <Mail className="w-4 h-4" />
    }
  }

  const getTemplateColor = (type: string) => {
    switch (type) {
      case "Email":
        return "bg-blue-100 text-blue-800"
      case "SMS":
        return "bg-green-100 text-green-800"
      case "WhatsApp":
        return `bg-[${primaryColor}15] text-[${primaryColor}]`
      default:
        return "bg-gray-100 text-gray-800 dark:text-white"
    }
  
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: primaryColor }}></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">CRM Settings</h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-white">Configure communication templates and automation rules</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="templates" className="w-full">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-4">
          <TabsList className="inline-flex w-full sm:w-auto gap-2 bg-gray-100 p-1 rounded-lg min-w-max">
            <TabsTrigger 
              value="templates" 
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:text-white data-[state=active]:shadow-sm whitespace-nowrap"
            >
              Communication Templates
            </TabsTrigger>
            <TabsTrigger 
              value="tagging" 
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:text-white data-[state=active]:shadow-sm whitespace-nowrap"
            >
              Auto-Tagging Rules
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:text-white data-[state=active]:shadow-sm whitespace-nowrap"
            >
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="roles" 
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:text-white data-[state=active]:shadow-sm whitespace-nowrap"
            >
              User Roles
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="templates" className="space-y-4 mt-6">
          <Card className="border-gray-200">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold">Communication Templates</CardTitle>
                <CardDescription className="text-sm mt-1">Manage email, SMS, and WhatsApp templates</CardDescription>
              </div>
              <Button 
                onClick={() => setShowTemplateDialog(true)}
                className="text-white gap-2"
                style={{ backgroundColor: primaryColor }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}dd`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
              >
                <Plus className="w-4 h-4" />
                <span>Add Template</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800 border-y dark:border-gray-700">
                      <TableHead className="font-semibold text-gray-600 dark:text-white">Template Name</TableHead>
                      <TableHead className="font-semibold text-gray-600 dark:text-white">Type</TableHead>
                      <TableHead className="font-semibold text-gray-600 dark:text-white">Status</TableHead>
                      <TableHead className="font-semibold text-gray-600 dark:text-white">Last Used</TableHead>
                      <TableHead className="font-semibold text-gray-600 dark:text-white text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell className="font-medium text-gray-900 dark:text-white">{template.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTemplateIcon(template.type)}
                            <Badge 
                              variant="secondary"
                              className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-0 font-medium"
                            >
                              {template.type}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch 
                            checked={template.isActive}
                            style={{ '--primary-color': primaryColor } as React.CSSProperties}
                            className="data-[state=checked]:bg-[var(--primary-color)]"
                          />
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-white">
                          {template.lastUsed ? format(new Date(template.lastUsed), "yyyy-MM-dd'T'HH:mm:ss'Z'") : "Never"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                            >
                              <Edit className="w-4 h-4 text-gray-600 dark:text-white" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y">
                {templates.map((template) => (
                  <div key={template.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">{template.name}</h4>
                        <div className="flex items-center gap-2 mb-2">
                          {getTemplateIcon(template.type)}
                          <Badge 
                            variant="secondary"
                            className="bg-blue-50 text-blue-700 border-0 font-medium text-xs"
                          >
                            {template.type}
                          </Badge>
                        </div>
                      </div>
                      <Switch 
                        checked={template.isActive}
                        className="data-[state=checked]:bg-purple-600"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-white">
                        Last used: {template.lastUsed ? format(new Date(template.lastUsed), "yyyy-MM-dd'T'HH:mm:ss'Z'") : "Never"}
                      </span>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4 text-gray-600 dark:text-white" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tagging" className="space-y-4 mt-6">
          <Card className="border-gray-200">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold">Auto-Tagging Rules</CardTitle>
                <CardDescription className="text-sm mt-1">Automatically tag leads based on conditions</CardDescription>
              </div>
              <Button 
                onClick={() => setShowTagRuleDialog(true)}
                className="text-white gap-2"
                style={{ backgroundColor: primaryColor }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}dd`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
              >
                <Plus className="w-4 h-4" />
                Add Rule
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tagRules.map((rule) => (
                  <div key={rule.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{rule.name}</h4>
                        <Badge variant="outline" className="text-xs" style={{ borderColor: `${primaryColor}20`, color: primaryColor, backgroundColor: `${primaryColor}15` }}>
                          {rule.tag}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-white break-words">{rule.condition} ? {rule.action}</p>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                      <Switch 
                        checked={rule.isActive}
                        style={{ '--primary-color': primaryColor } as React.CSSProperties}
                        className="data-[state=checked]:bg-[var(--primary-color)]"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                      >
                        <Edit className="w-4 h-4 text-gray-600 dark:text-white" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-6">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl font-bold">Notification Settings</CardTitle>
              <CardDescription className="text-sm mt-1">Configure notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div key={notification.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 first:pt-0 last:pb-0 gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{notification.type}</h4>
                      <p className="text-sm text-gray-600 dark:text-white mt-1">Frequency: {notification.frequency}</p>
                    </div>
                    <Switch 
                      checked={notification.enabled}
                      style={{ '--primary-color': primaryColor } as React.CSSProperties}
                      className="data-[state=checked]:bg-[var(--primary-color)] self-end sm:self-center"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4 mt-6">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl font-bold">User Roles & Permissions</CardTitle>
              <CardDescription className="text-sm mt-1">Manage user roles and access levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userRoles.map((role) => (
                  <div key={role.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-gray-500 dark:text-white flex-shrink-0" />
                        <h4 className="font-medium text-gray-900 dark:text-white">{role.name}</h4>
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 dark:text-white">
                          {role.userCount} users
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-white ml-6">{role.permissions.length} permissions</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="gap-2 self-end sm:self-center border-gray-300 hover:bg-gray-50"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
