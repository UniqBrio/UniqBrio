"use client"

import { Button } from "@/components/dashboard/ui/button"
import { Label } from "@/components/dashboard/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Switch } from "@/components/dashboard/ui/switch"
import { Separator } from "@/components/dashboard/ui/separator"
import { Input } from "@/components/dashboard/ui/input"
import {
  RotateCcw,
  Grid3x3,
} from "lucide-react"

interface ScheduleSettingsProps {
  settings: {
    display: {
      defaultView: string
      calendarDefaultView: string
      listViewMode: string
      showWeekNumbers: boolean
      highlightToday: boolean
      showWeekends: boolean
      compactMode: boolean
      colorCodeByStatus: boolean
    }
    filters: {
      rememberLastFilters: boolean
      autoApplyFilters: boolean
      showAdvancedFilters: boolean
      defaultInstructor: string
      defaultStatus: string
    }
    modifications: {
      trackReschedules: boolean
      trackCancellations: boolean
      trackReassignments: boolean
      highlightModified: boolean
      showModificationHistory: boolean
      requireReasonForReschedule: boolean
      requireReasonForCancellation: boolean
      requireReasonForReassignment: boolean
      autoNotifyInstructorOnReassignment: boolean
      minimumReasonLength: number
    }
  }
  onUpdateSetting: (category: string, key: string, value: any) => void
  onResetSettings: () => void
}

export default function ScheduleSettings({ settings, onUpdateSetting, onResetSettings }: ScheduleSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Schedule Management Settings</h2>
          <p className="text-sm text-gray-500 dark:text-white mt-1">Configure session modification tracking and behavior</p>
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

      {/* Session Modification Tracking */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Grid3x3 className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Session Modification Tracking</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="trackReschedules" className="flex-1">Track Session Reschedules</Label>
            <Switch
              id="trackReschedules"
              checked={settings?.modifications?.trackReschedules ?? true}
              onCheckedChange={(checked) => onUpdateSetting('modifications', 'trackReschedules', checked)}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="trackCancellations" className="flex-1">Track Session Cancellations</Label>
            <Switch
              id="trackCancellations"
              checked={settings?.modifications?.trackCancellations ?? true}
              onCheckedChange={(checked) => onUpdateSetting('modifications', 'trackCancellations', checked)}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="trackReassignments" className="flex-1">Track Instructor Reassignments</Label>
            <Switch
              id="trackReassignments"
              checked={settings?.modifications?.trackReassignments ?? true}
              onCheckedChange={(checked) => onUpdateSetting('modifications', 'trackReassignments', checked)}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="showModificationHistory" className="flex-1">Show Modification History</Label>
            <Switch
              id="showModificationHistory"
              checked={settings?.modifications?.showModificationHistory ?? true}
              onCheckedChange={(checked) => onUpdateSetting('modifications', 'showModificationHistory', checked)}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="highlightModified" className="flex-1">Highlight Modified Sessions</Label>
            <Switch
              id="highlightModified"
              checked={settings?.modifications?.highlightModified ?? true}
              onCheckedChange={(checked) => onUpdateSetting('modifications', 'highlightModified', checked)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Modification Requirements */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Grid3x3 className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Modification Requirements</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="requireReasonForReschedule" className="flex-1">Require Reason for Reschedule</Label>
            <Switch
              id="requireReasonForReschedule"
              checked={settings?.modifications?.requireReasonForReschedule ?? true}
              onCheckedChange={(checked) => onUpdateSetting('modifications', 'requireReasonForReschedule', checked)}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="requireReasonForCancellation" className="flex-1">Require Reason for Cancellation</Label>
            <Switch
              id="requireReasonForCancellation"
              checked={settings?.modifications?.requireReasonForCancellation ?? true}
              onCheckedChange={(checked) => onUpdateSetting('modifications', 'requireReasonForCancellation', checked)}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="requireReasonForReassignment" className="flex-1">Require Reason for Reassignment</Label>
            <Switch
              id="requireReasonForReassignment"
              checked={settings?.modifications?.requireReasonForReassignment ?? true}
              onCheckedChange={(checked) => onUpdateSetting('modifications', 'requireReasonForReassignment', checked)}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="autoNotifyInstructorOnReassignment" className="flex-1">Auto-Notify Instructor on Reassignment</Label>
            <Switch
              id="autoNotifyInstructorOnReassignment"
              checked={settings?.modifications?.autoNotifyInstructorOnReassignment ?? true}
              onCheckedChange={(checked) => onUpdateSetting('modifications', 'autoNotifyInstructorOnReassignment', checked)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="minimumReasonLength">Minimum Reason Length (characters)</Label>
            <Input
              id="minimumReasonLength"
              type="number"
              min="1"
              max="500"
              value={settings?.modifications?.minimumReasonLength || 10}
              onChange={(e) => onUpdateSetting('modifications', 'minimumReasonLength', Number(e.target.value))}
              className="w-full"
            />
            <p className="text-sm text-gray-500 dark:text-white">Minimum characters required when providing a reason.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
