"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Label } from "@/components/dashboard/ui/label"
import { Switch } from "@/components/dashboard/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Separator } from "@/components/dashboard/ui/separator"
import {
  LayoutDashboard,
  Settings,
  RotateCcw,
  Save,
  Shield,
  Users,
  CheckCircle
} from "lucide-react"

interface StudentSettingsProps {
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
    enrollment: {
      requireCourseSelection: boolean
      requireCohortAssignment: boolean
      warnBeforeCohortChange: boolean
      autoSyncCohortMembers: boolean
      preventDuplicateEnrollment: boolean
    }
    validation: {
      requireEmail: boolean
      requireMobile: boolean
      requireDOB: boolean
      requireAddress: boolean
      requireGuardianForMinors: boolean
      minAge: number
      allowFutureDOB: boolean
      validateEmailFormat: boolean
      validateMobileDuplicates: boolean
    }
    display: {
      defaultView: string
      cardsPerPage: number
      showAvatars: boolean
      showCohortInfo: boolean
      showEnrollmentDate: boolean
      compactMode: boolean
      colorCodeByStatus: boolean
      showProgressBars: boolean
    }
    automation: {
      autoSaveDrafts: boolean
      autoDraftInterval: number
      confirmBeforeDelete: boolean
      showDeletedCount: boolean
      autoRefresh: boolean
      refreshInterval: number
    }
    advanced: {
      enableDebugMode: boolean
      cacheEnabled: boolean
      maxCacheSize: number
      showStudentIds: boolean
      enableBulkOperations: boolean
      cohortAutoSync: boolean
    }
  }
  onUpdateSetting: (category: string, key: string, value: any) => void
  onResetSettings: () => void
  onSaveSettings: () => void
}

export default function StudentSettings({ settings, onUpdateSetting, onResetSettings, onSaveSettings }: StudentSettingsProps) {
  // Ensure all required properties exist with defaults
  const initialSettings = {
    identity: settings.identity || {
      customIdPrefix: 'STU',
      numberingStrategy: 'sequential' as 'sequential' | 'uuid',
      idNumberPadding: 4,
      sequenceStart: 1,
      allowManualIds: false,
      enforceUppercase: true,
      showIdBadges: true,
    },
    enrollment: settings.enrollment || {
      requireCourseSelection: true,
      requireCohortAssignment: false,
      warnBeforeCohortChange: true,
      autoSyncCohortMembers: true,
      preventDuplicateEnrollment: true,
    },
    validation: settings.validation || {
      requireEmail: true,
      requireMobile: true,
      requireDOB: true,
      requireAddress: false,
      requireGuardianForMinors: true,
      minAge: 0,
      allowFutureDOB: false,
      validateEmailFormat: true,
      validateMobileDuplicates: true,
    },
    display: settings.display || {
      defaultView: 'list',
      cardsPerPage: 25,
      showAvatars: true,
      showCohortInfo: true,
      showEnrollmentDate: true,
      compactMode: false,
      colorCodeByStatus: true,
      showProgressBars: true,
    },
    automation: settings.automation || {
      autoSaveDrafts: true,
      autoDraftInterval: 3,
      confirmBeforeDelete: true,
      showDeletedCount: true,
      autoRefresh: false,
      refreshInterval: 5,
    },
    advanced: settings.advanced || {
      enableDebugMode: false,
      cacheEnabled: true,
      maxCacheSize: 100,
      showStudentIds: true,
      enableBulkOperations: true,
      cohortAutoSync: true,
    },
  }

  const [localSettings, setLocalSettings] = useState(initialSettings)
  const [hasChanges, setHasChanges] = useState(false)

  // Sync local settings when parent settings change (e.g., after reset)
  useEffect(() => {
    setLocalSettings({
      identity: settings.identity || initialSettings.identity,
      enrollment: settings.enrollment || initialSettings.enrollment,
      validation: settings.validation || initialSettings.validation,
      display: settings.display || initialSettings.display,
      automation: settings.automation || initialSettings.automation,
      advanced: settings.advanced || initialSettings.advanced,
    })
  }, [settings])

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
    if (localSettings.identity) {
      Object.entries(localSettings.identity).forEach(([key, value]) => {
        onUpdateSetting('identity', key, value)
      })
    }
    if (localSettings.enrollment) {
      Object.entries(localSettings.enrollment).forEach(([key, value]) => {
        onUpdateSetting('enrollment', key, value)
      })
    }
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
          <h2 className="text-2xl font-bold text-gray-900">Student Management Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Customize student identity and enrollment settings</p>
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

      {/* Student Identity & ID Settings */}
      {localSettings.identity && (
        <>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Student Identity & ID Configuration</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
              <div className="space-y-2">
                <Label htmlFor="studentIdPrefix">Student ID Prefix</Label>
                <Input  
                  id="studentIdPrefix"
                  value={localSettings.identity.customIdPrefix}
                  onChange={(event) => handleLocalChange('identity', 'customIdPrefix', event.target.value)}
                  placeholder="e.g. STU or STUD-"
                />
                <p className="text-xs text-gray-500">Prefix shown at the start of every student ID.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentIdStrategy">ID Numbering Strategy</Label>
                <Select
                  value={localSettings.identity.numberingStrategy}
                  onValueChange={(value) => handleLocalChange('identity', 'numberingStrategy', value)}
                >
                  <SelectTrigger id="studentIdStrategy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sequential">Sequential (STU0001, STU0002...)</SelectItem>
                    <SelectItem value="uuid">Random UUID</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentDigits">Digits to Pad</Label>
                <Select
                  value={String(localSettings.identity.idNumberPadding)}
                  onValueChange={(value) => handleLocalChange('identity', 'idNumberPadding', Number(value))}
                  disabled={localSettings.identity.numberingStrategy !== 'sequential'}
                >
                  <SelectTrigger id="studentDigits">
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
                <Label htmlFor="studentSequenceStart">Starting Number</Label>
                <Input
                  id="studentSequenceStart"
                  type="number"
                  min={1}
                  value={localSettings.identity.sequenceStart}
                  onChange={(event) => handleLocalChange('identity', 'sequenceStart', Number(event.target.value) || 1)}
                  disabled={localSettings.identity.numberingStrategy !== 'sequential'}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="allowManualStudentIds" className="flex-1">Allow Manual Student IDs</Label>
                <Switch
                  id="allowManualStudentIds"
                  checked={localSettings.identity.allowManualIds}
                  onCheckedChange={(checked) => handleLocalChange('identity', 'allowManualIds', checked)}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="enforceUppercaseStudentIds" className="flex-1">Enforce Uppercase IDs</Label>
                <Switch
                  id="enforceUppercaseStudentIds"
                  checked={localSettings.identity.enforceUppercase}
                  onCheckedChange={(checked) => handleLocalChange('identity', 'enforceUppercase', checked)}
                />
              </div>
              <div className="flex items-center justify-between space-x-2 md:col-span-2">
                <Label htmlFor="showStudentIdBadges" className="flex-1">Show Student ID Badges in Lists</Label>
                <Switch
                  id="showStudentIdBadges"
                  checked={localSettings.identity.showIdBadges}
                  onCheckedChange={(checked) => handleLocalChange('identity', 'showIdBadges', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />
        </>
      )}

      {/* Enrollment Rules */}
      {localSettings.enrollment && (
        <>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Enrollment & Cohort Rules</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="requireCourse" className="flex-1">Require Course Selection</Label>
                <Switch
                  id="requireCourse"
                  checked={localSettings.enrollment.requireCourseSelection}
                  onCheckedChange={(checked) => handleLocalChange('enrollment', 'requireCourseSelection', checked)}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="requireCohort" className="flex-1">Require Cohort Assignment</Label>
                <Switch
                  id="requireCohort"
                  checked={localSettings.enrollment.requireCohortAssignment}
                  onCheckedChange={(checked) => handleLocalChange('enrollment', 'requireCohortAssignment', checked)}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="warnCohortChange" className="flex-1">Warn Before Cohort Change</Label>
                <Switch
                  id="warnCohortChange"
                  checked={localSettings.enrollment.warnBeforeCohortChange}
                  onCheckedChange={(checked) => handleLocalChange('enrollment', 'warnBeforeCohortChange', checked)}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="autoSyncCohort" className="flex-1">Auto-Sync Cohort Members</Label>
                <Switch
                  id="autoSyncCohort"
                  checked={localSettings.enrollment.autoSyncCohortMembers}
                  onCheckedChange={(checked) => handleLocalChange('enrollment', 'autoSyncCohortMembers', checked)}
                />
              </div>
              <div className="flex items-center justify-between space-x-2 md:col-span-2">
                <Label htmlFor="preventDuplicate" className="flex-1">Prevent Duplicate Enrollment</Label>
                <Switch
                  id="preventDuplicate"
                  checked={localSettings.enrollment.preventDuplicateEnrollment}
                  onCheckedChange={(checked) => handleLocalChange('enrollment', 'preventDuplicateEnrollment', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />
        </>
      )}

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
            <h4 className="font-semibold text-purple-900 mb-1">About Student Management Settings</h4>
            <p className="text-sm text-purple-700">
              Configure how student IDs are generated and enrollment policies. Click &quot;Save Settings&quot; to apply your changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
