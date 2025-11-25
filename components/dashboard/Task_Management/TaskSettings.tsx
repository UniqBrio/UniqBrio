"use client"

import { Button } from "@/components/dashboard/ui/button"
import { Label } from "@/components/dashboard/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Switch } from "@/components/dashboard/ui/switch"
import { Separator } from "@/components/dashboard/ui/separator"
import {
  Zap,
  Settings,
  RotateCcw,
  Bell,
  FileText,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"

interface TaskSettingsProps {
  settings: {
    taskDisplay: {
      showTaskIds: boolean
      highlightOverdue: boolean
      showProgress: boolean
    }
    taskNotifications: {
      dueDateReminder: boolean
      reminderTime: number
      overdueAlert: boolean
    }
    taskAutomation: {
      autoDraftSave: boolean
      autoDraftInterval: number
      confirmBeforeDelete: boolean
      confirmBeforeComplete: boolean
    }
    taskExport: {
      includeRemarks: boolean
      includeSubtasks: boolean
    }
  }
  onUpdateSetting: (category: string, key: string, value: any) => void
  onResetSettings: () => void
}

export default function TaskSettings({ settings, onUpdateSetting, onResetSettings }: TaskSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Task-Specific Settings</h2>
          <p className="text-sm text-gray-500 dark:text-white mt-1">Configure task management preferences</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onResetSettings}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset All
        </Button>
      </div>

      {/* Task Display Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Task Display</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="showTaskIds" className="flex-1">Show Task IDs</Label>
            <Switch
              id="showTaskIds"
              checked={settings?.taskDisplay?.showTaskIds ?? true}
              onCheckedChange={(checked) => onUpdateSetting('taskDisplay', 'showTaskIds', checked)}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="highlightOverdue" className="flex-1">Highlight Overdue Tasks</Label>
            <Switch
              id="highlightOverdue"
              checked={settings?.taskDisplay?.highlightOverdue ?? true}
              onCheckedChange={(checked) => onUpdateSetting('taskDisplay', 'highlightOverdue', checked)}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="showProgress" className="flex-1">Show Progress Indicators</Label>
            <Switch
              id="showProgress"
              checked={settings?.taskDisplay?.showProgress ?? true}
              onCheckedChange={(checked) => onUpdateSetting('taskDisplay', 'showProgress', checked)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Task Notification Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Task Reminders</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="dueDateReminder" className="flex-1">Due Date Reminders</Label>
            <Switch
              id="dueDateReminder"
              checked={settings?.taskNotifications?.dueDateReminder ?? true}
              onCheckedChange={(checked) => onUpdateSetting('taskNotifications', 'dueDateReminder', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="overdueAlert" className="flex-1">Overdue Alerts</Label>
            <Switch
              id="overdueAlert"
              checked={settings?.taskNotifications?.overdueAlert ?? true}
              onCheckedChange={(checked) => onUpdateSetting('taskNotifications', 'overdueAlert', checked)}
            />
          </div>
        </div>
      </div>

      <Separator />

      
      {/* Settings Info Footer */}
      <div className="mt-8 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-purple-900 mb-1">Task-Specific Settings</h4>
            <p className="text-sm text-purple-700">
              These settings only apply to task management features. For general application settings like appearance, 
              notifications, and system preferences, visit the main Settings page.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
