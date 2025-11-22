"use client"

import { useState } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Label } from "@/components/dashboard/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Switch } from "@/components/dashboard/ui/switch"
import { Separator } from "@/components/dashboard/ui/separator"
import {
  Settings,
  RotateCcw,
  Users,
  Save,
} from "lucide-react"

interface NonInstructorSettingsProps {
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

export default function NonInstructorSettings({ settings, onUpdateSetting, onResetSettings, onSaveSettings }: NonInstructorSettingsProps) {
  // Ensure settings has identity property with defaults
  const defaultIdentity = {
    customIdPrefix: 'NI',
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
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Non-Instructor Management Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Customize non-instructor identity and ID generation</p>
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

      {/* Non-Instructor Identity & ID Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Non-Instructor Identity & ID Configuration</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
          <div className="space-y-2">
            <Label htmlFor="nonInstructorIdPrefix">Non-Instructor ID Prefix</Label>
            <Input
              id="nonInstructorIdPrefix"
              value={localSettings.identity.customIdPrefix}
              onChange={(event) => handleLocalChange('identity', 'customIdPrefix', event.target.value)}
              placeholder="e.g. NI or STAFF-"
            />
            <p className="text-xs text-gray-500">Prefix shown at the start of every non-instructor ID.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nonInstructorIdStrategy">ID Numbering Strategy</Label>
            <Select
              value={localSettings.identity.numberingStrategy}
              onValueChange={(value) => handleLocalChange('identity', 'numberingStrategy', value)}
            >
              <SelectTrigger id="nonInstructorIdStrategy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sequential">Sequential Numbers</SelectItem>
                <SelectItem value="uuid">UUID</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nonInstructorIdPadding">ID Number Padding</Label>
            <Select
              value={String(localSettings.identity.idNumberPadding)}
              onValueChange={(value) => handleLocalChange('identity', 'idNumberPadding', Number(value))}
              disabled={localSettings.identity.numberingStrategy === 'uuid'}
            >
              <SelectTrigger id="nonInstructorIdPadding">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 digits (01, 02...)</SelectItem>
                <SelectItem value="3">3 digits (001, 002...)</SelectItem>
                <SelectItem value="4">4 digits (0001, 0002...)</SelectItem>
                <SelectItem value="5">5 digits (00001, 00002...)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nonInstructorSequenceStart">Sequence Start Number</Label>
            <Input
              id="nonInstructorSequenceStart"
              type="number"
              value={localSettings.identity.sequenceStart}
              onChange={(event) => handleLocalChange('identity', 'sequenceStart', Number(event.target.value))}
              disabled={localSettings.identity.numberingStrategy === 'uuid'}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="allowManualNonInstructorIds" className="flex-1">Allow Manual ID Entry</Label>
            <Switch
              id="allowManualNonInstructorIds"
              checked={localSettings.identity.allowManualIds}
              onCheckedChange={(checked) => handleLocalChange('identity', 'allowManualIds', checked)}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="enforceNonInstructorUppercase" className="flex-1">Enforce Uppercase IDs</Label>
            <Switch
              id="enforceNonInstructorUppercase"
              checked={localSettings.identity.enforceUppercase}
              onCheckedChange={(checked) => handleLocalChange('identity', 'enforceUppercase', checked)}
            />
          </div>
          <div className="flex items-center justify-between space-x-2 md:col-span-2">
            <Label htmlFor="showNonInstructorIdBadges" className="flex-1">Show Non-Instructor ID Badges in Lists</Label>
            <Switch
              id="showNonInstructorIdBadges"
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
          <Users className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-purple-900 mb-1">About Non-Instructor Management Settings</h4>
            <p className="text-sm text-purple-700">
              Configure how non-instructor IDs are generated and displayed. Click &quot;Save Settings&quot; to apply your changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

