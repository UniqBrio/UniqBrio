"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Switch } from "@/components/dashboard/ui/switch"
import { Label } from "@/components/dashboard/ui/label"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Badge } from "@/components/dashboard/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/dashboard/ui/select"
import { Settings, Mail, Bell, Globe, Zap, Server, Database, Activity, Save, AlertTriangle, Archive, Trash2 } from "lucide-react"
import { toast } from "@/components/dashboard/ui/use-toast"
import { Progress } from "@/components/dashboard/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/dashboard/ui/alert-dialog"

interface AdminSystemConfigProps {
  onUpdate: (updates: any) => Promise<void>
  disabled?: boolean
}

export function AdminSystemConfig({ onUpdate, disabled = true }: AdminSystemConfigProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [settings, setSettings] = useState({
    // Email Settings
    smtpHost: "smtp.example.com",
    smtpPort: "587",
    smtpUser: "noreply@uniqbrio.com",
    emailFromName: "UniqBrio Learning",
    
    // System Settings
    maintenanceMode: false,
    allowRegistration: true,
    defaultUserRole: "student",
    maxUploadSize: 10,
    sessionDuration: 24,
    
    // Performance
    cacheEnabled: true,
    compressionEnabled: true,
    cdnEnabled: false,
    
    // Database
    autoBackup: true,
    backupFrequency: "daily",
    maxBackupRetention: 30,
    
    // Features
    chatEnabled: true,
    videoChatEnabled: true,
    fileStorageEnabled: true,
    analyticsEnabled: true,
  })

  const handleToggle = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleInputChange = (key: string, value: string | number) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true)
      // Simulate account deletion
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Account Deleted",
        description: "Your account and all data have been permanently deleted.",
      })
      
      // In a real app, redirect to login or homepage
      window.location.href = "/"
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await onUpdate(settings)
      toast({
        title: "System Configuration Updated",
        description: "Changes have been applied successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update system configuration.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={"space-y-6 " + (disabled ? "pointer-events-none opacity-50 grayscale" : "")}>
      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-purple-600" />
            Email Configuration <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block ml-1" />
          </CardTitle>
          <CardDescription>
            Configure SMTP settings for system emails - Coming Soon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50 pointer-events-none">
            <div className="space-y-2">
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input
                id="smtpHost"
                value={settings.smtpHost}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpPort">SMTP Port</Label>
              <Input
                id="smtpPort"
                value={settings.smtpPort}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpUser">SMTP Username</Label>
              <Input
                id="smtpUser"
                value={settings.smtpUser}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailFromName">App Password</Label>
              <Input
                id="emailFromName"
                type="password"
                value={settings.emailFromName}
                disabled
              />
            </div>
          </div>

          <Button variant="outline" size="sm" disabled>
            <Mail className="h-4 w-4 mr-2" />
            Test Email Configuration
          </Button>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-600" />
            Data Management <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block ml-1" />
          </CardTitle>
          <CardDescription>
            Manage your data, backups, and storage - Coming Soon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-purple-50 to-white opacity-50 pointer-events-none">
            <div className="flex items-center gap-3">
              <Archive className="h-5 w-5 text-purple-600" />
              <div>
                <Label htmlFor="autoBackup" className="font-medium">Automatic Backups</Label>
                <p className="text-sm text-gray-500 dark:text-white">
                  Automatically backup your data daily
                </p>
              </div>
            </div>
            <Switch
              id="autoBackup"
              checked={settings.autoBackup}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
     <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            
            <AlertTriangle className="h-5 w-5 text-purple-600" />
            Danger Zone 
          </CardTitle>
          <CardDescription className="text-black/60">
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-red-200 bg-red-50 opacity-50 pointer-events-none grayscale">
              <h4 className="font-semibold text-red-900 mb-2 inline-flex items-center gap-2">Delete Account <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block" /></h4>
              <p className="text-sm text-red-700 mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button
                variant="destructive"
                className="gap-2"
                disabled
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Are you absolutely sure?
            </AlertDialogTitle>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>This action cannot be undone. This will permanently delete your account and remove all your data from our servers.</p>
              <p className="font-semibold text-red-600">All of the following will be deleted:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Your profile and personal information</li>
                <li>All courses and enrollments</li>
                <li>Schedule and calendar data</li>
                <li>Progress and achievements</li>
                <li>All uploaded files and content</li>
              </ul>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Yes, Delete My Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
