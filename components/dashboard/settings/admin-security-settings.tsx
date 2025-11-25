"use client"

import { useState } from "react"
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
import { Shield, Users, Lock, Key, Globe, Server, Database, AlertTriangle, CheckCircle, Save } from "lucide-react"
import { toast } from "@/components/dashboard/ui/use-toast"

interface AdminSecuritySettingsProps {
  onUpdate: (updates: any) => Promise<void>
}

export function AdminSecuritySettings({ onUpdate }: AdminSecuritySettingsProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    requireMfa: false,
    enforcePasswordPolicy: true,
    minPasswordLength: 8,
    passwordExpiration: 90,
    maxLoginAttempts: 5,
    sessionTimeout: 30,
    requireEmailVerification: true,
    allowApiAccess: true,
    ipWhitelist: "",
    ssoEnabled: false,
    auditLogRetention: 365,
  })

  const handleToggle = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleInputChange = (key: string, value: string | number) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await onUpdate(settings)
      toast({
        title: "Security Settings Updated",
        description: "System-wide security policies have been applied.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update security settings.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Authentication Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Authentication Policies
          </CardTitle>
          <CardDescription>
            Configure system-wide authentication and access control
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-red-50 to-white">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-red-600" />
              <div>
                <Label htmlFor="requireMfa" className="font-medium">Require Multi-Factor Authentication</Label>
                <p className="text-sm text-gray-500 dark:text-white">Force all users to enable MFA</p>
              </div>
            </div>
            <Switch
              id="requireMfa"
              checked={settings.requireMfa}
              onCheckedChange={(checked) => handleToggle("requireMfa", checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-purple-50 to-white">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-purple-600" />
              <div>
                <Label htmlFor="enforcePasswordPolicy" className="font-medium">Enforce Password Policy</Label>
                <p className="text-sm text-gray-500 dark:text-white">Require strong passwords for all users</p>
              </div>
            </div>
            <Switch
              id="enforcePasswordPolicy"
              checked={settings.enforcePasswordPolicy}
              onCheckedChange={(checked) => handleToggle("enforcePasswordPolicy", checked)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minPasswordLength">Minimum Password Length</Label>
              <Input
                id="minPasswordLength"
                type="number"
                min={6}
                max={32}
                value={settings.minPasswordLength}
                onChange={(e) => handleInputChange("minPasswordLength", parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordExpiration">Password Expiration (days)</Label>
              <Input
                id="passwordExpiration"
                type="number"
                min={0}
                max={365}
                value={settings.passwordExpiration}
                onChange={(e) => handleInputChange("passwordExpiration", parseInt(e.target.value))}
              />
              <p className="text-xs text-gray-500 dark:text-white">0 = never expires</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-blue-600" />
              <div>
                <Label htmlFor="requireEmailVerification" className="font-medium">Require Email Verification</Label>
                <p className="text-sm text-gray-500 dark:text-white">Users must verify email before access</p>
              </div>
            </div>
            <Switch
              id="requireEmailVerification"
              checked={settings.requireEmailVerification}
              onCheckedChange={(checked) => handleToggle("requireEmailVerification", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Session & Access Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-purple-600" />
            Session & Access Control
          </CardTitle>
          <CardDescription>
            Manage user sessions and API access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                min={3}
                max={10}
                value={settings.maxLoginAttempts}
                onChange={(e) => handleInputChange("maxLoginAttempts", parseInt(e.target.value))}
              />
              <p className="text-xs text-gray-500 dark:text-white">Account locked after this many failed attempts</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                min={5}
                max={480}
                value={settings.sessionTimeout}
                onChange={(e) => handleInputChange("sessionTimeout", parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-green-50 to-white">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-green-600" />
              <div>
                <Label htmlFor="allowApiAccess" className="font-medium">Allow API Access</Label>
                <p className="text-sm text-gray-500 dark:text-white">Enable REST API access for integrations</p>
              </div>
            </div>
            <Switch
              id="allowApiAccess"
              checked={settings.allowApiAccess}
              onCheckedChange={(checked) => handleToggle("allowApiAccess", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ipWhitelist">IP Whitelist</Label>
            <Input
              id="ipWhitelist"
              placeholder="192.168.1.1, 10.0.0.1 (comma-separated)"
              value={settings.ipWhitelist}
              onChange={(e) => handleInputChange("ipWhitelist", e.target.value)}
            />
            <p className="text-xs text-gray-500 dark:text-white">Leave empty to allow all IPs</p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-orange-50 to-white">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-orange-600" />
              <div>
                <Label htmlFor="ssoEnabled" className="font-medium">Single Sign-On (SSO)</Label>
                <p className="text-sm text-gray-500 dark:text-white">Enable SAML/OAuth SSO integration</p>
              </div>
            </div>
            <Switch
              id="ssoEnabled"
              checked={settings.ssoEnabled}
              onCheckedChange={(checked) => handleToggle("ssoEnabled", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Audit & Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-600" />
            Audit & Compliance
          </CardTitle>
          <CardDescription>
            Configure audit logging and compliance settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="auditLogRetention">Audit Log Retention (days)</Label>
            <Select
              value={settings.auditLogRetention.toString()}
              onValueChange={(value) => handleInputChange("auditLogRetention", parseInt(value))}
            >
              <SelectTrigger id="auditLogRetention">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">180 days</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
                <SelectItem value="730">2 years</SelectItem>
                <SelectItem value="1825">5 years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Compliance Information</p>
                <p className="text-sm text-blue-700 mt-1">
                  All security events, login attempts, and administrative actions are automatically logged.
                  Logs cannot be deleted or modified.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-purple-600 hover:bg-purple-700 gap-2"
      >
        <Save className="h-4 w-4" />
        {isSaving ? "Saving..." : "Save Security Settings"}
      </Button>
    </div>
  )
}
