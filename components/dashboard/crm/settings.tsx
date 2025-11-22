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
import { CRMNavigation } from "@/components/dashboard/crm-navigation"

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
            "Hello {{studentName}}! 👋\n\nI hope you enjoyed your trial session for {{courseName}}. Do you have any questions about the program?\n\nI'm here to help! 😊",
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
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">CRM Settings</h1>
        <p className="text-gray-500">Configure communication templates and automation rules</p>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList>
          <TabsTrigger value="templates">Communication Templates</TabsTrigger>
          <TabsTrigger value="tagging">Auto-Tagging Rules</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="roles">User Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Communication Templates</CardTitle>
                <CardDescription>Manage email, SMS, and WhatsApp templates</CardDescription>
              </div>
              <Button onClick={() => setShowTemplateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Template
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTemplateIcon(template.type)}
                          <Badge className={getTemplateColor(template.type)}>
                            {template.type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch checked={template.isActive} />
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {template.lastUsed || "Never"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tagging" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Auto-Tagging Rules</CardTitle>
                <CardDescription>Automatically tag leads based on conditions</CardDescription>
              </div>
              <Button onClick={() => setShowTagRuleDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tagRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{rule.name}</h4>
                        <Badge variant="outline" className="text-xs">{rule.tag}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">{rule.condition} → {rule.action}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={rule.isActive} />
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <h4 className="font-medium">{notification.type}</h4>
                      <p className="text-sm text-gray-500">Frequency: {notification.frequency}</p>
                    </div>
                    <Switch checked={notification.enabled} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Roles & Permissions</CardTitle>
              <CardDescription>Manage user roles and access levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userRoles.map((role) => (
                  <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        <h4 className="font-medium">{role.name}</h4>
                        <Badge variant="secondary" className="text-xs">{role.userCount} users</Badge>
                      </div>
                      <p className="text-sm text-gray-500">{role.permissions.length} permissions</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
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
