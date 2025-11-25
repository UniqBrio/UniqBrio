"use client"

import { useState } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Label } from "@/components/dashboard/ui/label"
import { Switch } from "@/components/dashboard/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Separator } from "@/components/dashboard/ui/separator"
import { Save } from "lucide-react"
import {
  LayoutDashboard,
  Settings,
  RotateCcw
} from "lucide-react"

interface CourseSettingsProps {
  settings: {
    identity: {
      customIdPrefix: string
      numberingStrategy: 'sequential' | 'uuid'
      idNumberPadding: number
      sequenceStart: number
      allowManualIds: boolean
      enforceUppercase: boolean
      showIdBadges: boolean
    }
  }
  onUpdateSetting: (category: string, key: string, value: any) => void
  onResetSettings: () => void
  onSaveSettings: () => void
}

export default function CourseSettings({ settings, onUpdateSetting, onResetSettings, onSaveSettings }: CourseSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings)
  const [hasChanges, setHasChanges] = useState(false)

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Course Management Settings</h2>
          <p className="text-sm text-gray-500 dark:text-white mt-1">Customize your course management experience</p>
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
          <LayoutDashboard className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Course Identity & Codes</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
          <div className="space-y-2">
            <Label htmlFor="courseIdPrefix">ID Prefix</Label>
            <Input
              id="courseIdPrefix"
              value={localSettings.identity.customIdPrefix}
              onChange={(event) => handleLocalChange('identity', 'customIdPrefix', event.target.value)}
              placeholder="e.g. COURSE or CLS-"
            />
            <p className="text-xs text-gray-500 dark:text-white">Shown at the start of every new course ID.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="courseIdStrategy">Numbering Strategy</Label>
            <Select
              value={localSettings.identity.numberingStrategy}
              onValueChange={(value) => handleLocalChange('identity', 'numberingStrategy', value)}
            >
              <SelectTrigger id="courseIdStrategy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sequential">Sequential (PREFIX0001)</SelectItem>
                <SelectItem value="uuid">Random UUID</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="courseDigits">Digits to Pad</Label>
            <Select
              value={String(localSettings.identity.idNumberPadding)}
              onValueChange={(value) => handleLocalChange('identity', 'idNumberPadding', Number(value))}
              disabled={localSettings.identity.numberingStrategy !== 'sequential'}
            >
              <SelectTrigger id="courseDigits">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2,3,4,5,6].map((digits) => (
                  <SelectItem key={digits} value={String(digits)}>{digits} digits</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="courseSequenceStart">Starting Number</Label>
            <Input
              id="courseSequenceStart"
              type="number"
              min={1}
              value={localSettings.identity.sequenceStart}
              onChange={(event) => handleLocalChange('identity', 'sequenceStart', Number(event.target.value) || 1)}
              disabled={localSettings.identity.numberingStrategy !== 'sequential'}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="allowManualCourseIds" className="flex-1">Allow Manual Course IDs</Label>
            <Switch
              id="allowManualCourseIds"
              checked={localSettings.identity.allowManualIds}
              onCheckedChange={(checked) => handleLocalChange('identity', 'allowManualIds', checked)}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="enforceUppercaseIds" className="flex-1">Enforce Uppercase IDs</Label>
            <Switch
              id="enforceUppercaseIds"
              checked={localSettings.identity.enforceUppercase}
              onCheckedChange={(checked) => handleLocalChange('identity', 'enforceUppercase', checked)}
            />
          </div>
          <div className="flex items-center justify-between space-x-2 md:col-span-2">
            <Label htmlFor="showIdBadges" className="flex-1">Show Course ID Badges in Lists</Label>
            <Switch
              id="showIdBadges"
              checked={localSettings.identity.showIdBadges}
              onCheckedChange={(checked) => handleLocalChange('identity', 'showIdBadges', checked)}
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
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-300 disabled:text-gray-500 dark:text-white"
        >
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>

      {/* Settings Info Footer */}
      <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex items-start gap-3">
          <Settings className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-purple-900 mb-1">About Course Identity Settings</h4>
            <p className="text-sm text-purple-700">
              Configure how course IDs are generated and displayed. Click &quot;Save Settings&quot; to apply your changes to new courses.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
