"use client"

import { useState } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Label } from "@/components/dashboard/ui/label"
import { Switch } from "@/components/dashboard/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Separator } from "@/components/dashboard/ui/separator"
import {
  ArrowUpDown,
  Users,
  RotateCcw,
  Save
} from "lucide-react"
import { useCustomColors } from "@/lib/use-custom-colors"

interface CohortSettingsProps {
  settings: {
    capacity: {
      showCapacityBar: boolean
      warnAtPercent: number
      enableWarnings: boolean
      blockWhenFull: boolean
    }
    identity: {
      prefixSource: 'course-name' | 'course-id' | 'custom'
      customPrefix: string
      idNumberPadding: number
      allowManualIds: boolean
      enforceUppercase: boolean
    }
  }
  onUpdateSetting: (category: string, key: string, value: any) => void
  onResetSettings: () => void
  onSaveSettings: () => void
}

export default function CohortSettings({ settings, onUpdateSetting, onResetSettings, onSaveSettings }: CohortSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings)
  const [hasChanges, setHasChanges] = useState(false)
  const { primaryColor } = useCustomColors()

  const handleLocalChange = (category: string, key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }))
    setHasChanges(true)
  }

  const handleSave = () => {
    Object.entries(localSettings.identity).forEach(([key, value]) => {
      onUpdateSetting('identity', key, value)
    })
    Object.entries(localSettings.capacity).forEach(([key, value]) => {
      onUpdateSetting('capacity', key, value)
    })
    onSaveSettings()
    setHasChanges(false)
  }

  const handleReset = () => {
    onResetSettings()
    setLocalSettings(settings)
    setHasChanges(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cohort Management Settings</h2>
          <p className="text-sm text-gray-500 dark:text-white mt-1">Customize cohort management preferences</p>
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

      {/* Identity Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-5 w-5" style={{ color: primaryColor }} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cohort Identity & Codes</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-7">
          <div className="space-y-2">
            <Label htmlFor="cohortPrefixSource">Prefix Source</Label>
            <Select
              value={localSettings.identity.prefixSource}
              onValueChange={(value) => handleLocalChange('identity', 'prefixSource', value)}
            >
              <SelectTrigger id="cohortPrefixSource">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="course-name">First letters of course name</SelectItem>
                <SelectItem value="course-id">Mirror course ID</SelectItem>
                <SelectItem value="custom">Use custom prefix</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cohortCustomPrefix">Custom Prefix</Label>
            <Input
              id="cohortCustomPrefix"
              value={localSettings.identity.customPrefix}
              onChange={(event) => handleLocalChange('identity', 'customPrefix', event.target.value)}
              placeholder="e.g. COHR"
              disabled={localSettings.identity.prefixSource !== 'custom'}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cohortDigits">Digits to Pad</Label>
            <Select
              value={String(localSettings.identity.idNumberPadding)}
              onValueChange={(value) => handleLocalChange('identity', 'idNumberPadding', Number(value))}
            >
              <SelectTrigger id="cohortDigits">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2,3,4,5,6].map((digits) => (
                  <SelectItem key={digits} value={String(digits)}>{digits} digits</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="allowManualCohortIds" className="flex-1">Allow Manual Cohort IDs</Label>
            <Switch
              id="allowManualCohortIds"
              checked={localSettings.identity.allowManualIds}
              onCheckedChange={(checked) => handleLocalChange('identity', 'allowManualIds', checked)}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="uppercaseCohortIds" className="flex-1">Enforce Uppercase IDs</Label>
            <Switch
              id="uppercaseCohortIds"
              checked={localSettings.identity.enforceUppercase}
              onCheckedChange={(checked) => handleLocalChange('identity', 'enforceUppercase', checked)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Capacity Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" style={{ color: primaryColor }} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Capacity Management</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="showCapacityBar" className="flex-1">Show Capacity Bar</Label>
            <Switch
              id="showCapacityBar"
              checked={localSettings.capacity.showCapacityBar}
              onCheckedChange={(checked) => handleLocalChange('capacity', 'showCapacityBar', checked)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="warnAtPercent">Warning Threshold (%)</Label>
            <Select
              value={String(localSettings.capacity.warnAtPercent)}
              onValueChange={(value) => handleLocalChange('capacity', 'warnAtPercent', Number(value))}
            >
              <SelectTrigger id="warnAtPercent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="70">70%</SelectItem>
                <SelectItem value="75">75%</SelectItem>
                <SelectItem value="80">80%</SelectItem>
                <SelectItem value="85">85%</SelectItem>
                <SelectItem value="90">90%</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="enableWarnings" className="flex-1">Enable Capacity Warnings</Label>
            <Switch
              id="enableWarnings"
              checked={localSettings.capacity.enableWarnings}
              onCheckedChange={(checked) => handleLocalChange('capacity', 'enableWarnings', checked)}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="blockWhenFull" className="flex-1">Block When Full</Label>
            <Switch
              id="blockWhenFull"
              checked={localSettings.capacity.blockWhenFull}
              onCheckedChange={(checked) => handleLocalChange('capacity', 'blockWhenFull', checked)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!hasChanges}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          className="flex items-center gap-2 dark:text-white"
          style={hasChanges ? { backgroundColor: primaryColor, color: 'white' } : {}}
        >
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>

      {/* Settings Info Footer */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">About Cohort Settings</h4>
            <p className="text-sm text-blue-700">
              These settings are specific to cohort management. Click &quot;Save Settings&quot; to apply your changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
