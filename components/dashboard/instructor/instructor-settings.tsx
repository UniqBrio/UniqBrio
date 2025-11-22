"use client"

import { useState } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Label } from "@/components/dashboard/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Switch } from "@/components/dashboard/ui/switch"
import { Separator } from "@/components/dashboard/ui/separator"
import {
  LayoutDashboard,
  Settings,
  RotateCcw,
  Save
} from "lucide-react"

interface InstructorSettingsProps {
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

export default function InstructorSettings({ settings, onUpdateSetting, onResetSettings, onSaveSettings }: InstructorSettingsProps) {
  // Ensure settings has identity property with defaults
  const defaultIdentity = {
    customIdPrefix: 'INST',
    numberingStrategy: 'sequential' as const,
    idNumberPadding: 4,
    sequenceStart: 1,
    allowManualIds: false,
    enforceUppercase: true,
    showIdBadges: true
  }

  const mergedSettings = {
    identity: settings?.identity ? { ...defaultIdentity, ...settings.identity } : defaultIdentity
  }

  const [localSettings, setLocalSettings] = useState(mergedSettings)
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
    setLocalSettings(mergedSettings)
    setHasChanges(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Instructor Management Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Customize instructor identity and ID generation</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset All
        </Button>
      </div>

      {/* Instructor Identity & ID Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Instructor Identity & ID Configuration</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
          <div className="space-y-2">
            <Label htmlFor="instructorIdPrefix">Instructor ID Prefix</Label>
            <Input
              id="instructorIdPrefix"
              value={localSettings.identity.customIdPrefix}
              onChange={(event) => handleLocalChange('identity', 'customIdPrefix', event.target.value)}
              placeholder="e.g. INST or INS-"
            />
            <p className="text-xs text-gray-500">Prefix shown at the start of every instructor ID.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructorIdStrategy">ID Numbering Strategy</Label>
            <Select
              value={localSettings.identity.numberingStrategy}
              onValueChange={(value) => handleLocalChange('identity', 'numberingStrategy', value)}
            >
              <SelectTrigger id="instructorIdStrategy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sequential">Sequential (INST0001, INST0002...)</SelectItem>
                <SelectItem value="uuid">Random UUID</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructorDigits">Digits to Pad</Label>
            <Select
              value={String(localSettings.identity.idNumberPadding)}
              onValueChange={(value) => handleLocalChange('identity', 'idNumberPadding', Number(value))}
              disabled={localSettings.identity.numberingStrategy !== 'sequential'}
            >
              <SelectTrigger id="instructorDigits">
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
            <Label htmlFor="instructorSequenceStart">Starting Number</Label>
            <Input
              id="instructorSequenceStart"
              type="number"
              min={1}
              value={localSettings.identity.sequenceStart}
              onChange={(event) => handleLocalChange('identity', 'sequenceStart', Number(event.target.value) || 1)}
              disabled={localSettings.identity.numberingStrategy !== 'sequential'}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="allowManualInstructorIds" className="flex-1">Allow Manual Instructor IDs</Label>
            <Switch
              id="allowManualInstructorIds"
              checked={localSettings.identity.allowManualIds}
              onCheckedChange={(checked) => handleLocalChange('identity', 'allowManualIds', checked)}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="enforceUppercaseInstructorIds" className="flex-1">Enforce Uppercase IDs</Label>
            <Switch
              id="enforceUppercaseInstructorIds"
              checked={localSettings.identity.enforceUppercase}
              onCheckedChange={(checked) => handleLocalChange('identity', 'enforceUppercase', checked)}
            />
          </div>
          <div className="flex items-center justify-between space-x-2 md:col-span-2">
            <Label htmlFor="showInstructorIdBadges" className="flex-1">Show Instructor ID Badges in Lists</Label>
            <Switch
              id="showInstructorIdBadges"
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
          className="flex items-center gap-2"
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
            <h4 className="font-semibold text-purple-900 mb-1">About Instructor Management Settings</h4>
            <p className="text-sm text-purple-700">
              Configure how instructor IDs are generated and displayed. Click &quot;Save Settings&quot; to apply your changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
