"use client"

import { useState, useEffect } from "react"
import { useCustomColors } from "@/lib/use-custom-colors"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Label } from "@/components/dashboard/ui/label"
import { Switch } from "@/components/dashboard/ui/switch"
import { Badge } from "@/components/dashboard/ui/badge"
import { Shield, Lock, Key, Smartphone, Eye, EyeOff, Save, Monitor, Tablet, MapPin, Calendar, Loader2, AlertCircle, XCircle } from "lucide-react"
import { toast } from "@/components/dashboard/ui/use-toast"

interface SecuritySettingsProps {
  user: any
  onUpdate: (updates: any) => Promise<void>
}

interface Session {
  _id: string;
  jwtId: string;
  deviceType?: string;
  os?: string;
  browser?: string;
  country?: string;
  issuedAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isCurrentSession: boolean;
}

export function SecuritySettings({ user, onUpdate }: SecuritySettingsProps) {
  const { primaryColor } = useCustomColors()
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [sessionTimeout, setSessionTimeout] = useState(30)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [revokingSession, setRevokingSession] = useState<string | null>(null)

  useEffect(() => {
    fetchSessions()
  }, [])

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      await onUpdate({ password: passwordData })
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSecurityUpdate = async () => {
    try {
      setIsSaving(true)
      await onUpdate({ sessionTimeout })
      toast({
        title: "Security Settings Updated",
        description: "Your security preferences have been saved.",
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

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true)
      const response = await fetch('/api/user-sessions')
      const data = await response.json()

      if (data.success) {
        setSessions(data.data.sessions)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoadingSessions(false)
    }
  }

  const handleRevokeSession = async (jwtId: string, isCurrentSession: boolean) => {
    if (isCurrentSession) {
      if (!confirm('This will log you out from this device. Continue?')) {
        return
      }
    } else {
      if (!confirm('Are you sure you want to revoke this session?')) {
        return
      }
    }

    try {
      setRevokingSession(jwtId)
      const response = await fetch(`/api/user-sessions?jwtId=${jwtId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        if (isCurrentSession) {
          window.location.href = '/login?message=Session revoked successfully'
        } else {
          await fetchSessions()
          toast({
            title: "Session Revoked",
            description: "The device has been logged out successfully.",
          })
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to revoke session",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke session",
        variant: "destructive",
      })
    } finally {
      setRevokingSession(null)
    }
  }

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />
      case 'tablet':
        return <Tablet className="w-5 h-5" />
      case 'desktop':
      default:
        return <Monitor className="w-5 h-5" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  const getDeviceInfo = (session: Session) => {
    const parts = []
    if (session.browser) parts.push(session.browser)
    if (session.os) parts.push(session.os)
    return parts.join(' • ') || 'Unknown Device'
  }

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" style={{ color: primaryColor }} />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-white" />
              <Input
                id="currentPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Enter current password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 dark:text-white hover:text-gray-600 dark:text-white dark:hover:text-gray-300 dark:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            />
          </div>

          <Button
            onClick={handlePasswordChange}
            disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword}
            className="w-full gap-2"
            style={{ backgroundColor: primaryColor }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}dd`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Updating..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" style={{ color: primaryColor }} />
            Session Management
          </CardTitle>
          <CardDescription>
            Manage your active sessions and timeout settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
            <Input
              id="sessionTimeout"
              type="number"
              min={5}
              max={120}
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
            />
            <p className="text-sm text-gray-500 dark:text-white">
              You'll be logged out after this period of inactivity
            </p>
          </div>

          <Button
            onClick={handleSecurityUpdate}
            disabled={isSaving}
            className="w-full gap-2"
            style={{ backgroundColor: primaryColor }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}dd`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Security Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Active Devices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" style={{ color: primaryColor }} />
            Active Devices
          </CardTitle>
          <CardDescription>
            Manage your active sessions across all devices. You can revoke access from any device at any time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin h-6 w-6" style={{ color: primaryColor }} />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No active sessions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session._id}
                  className={`p-4 rounded-lg border ${
                    session.isCurrentSession ? 'border-2' : 'border'
                  }`}
                  style={session.isCurrentSession ? { borderColor: primaryColor } : {}}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-gray-100">
                        {getDeviceIcon(session.deviceType)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">
                            {getDeviceInfo(session)}
                          </h4>
                          {session.isCurrentSession && (
                            <Badge
                              style={{
                                backgroundColor: `${primaryColor}20`,
                                color: primaryColor,
                              }}
                            >
                              This Device
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-1 text-xs text-gray-600">
                          {session.country && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{session.country}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Last active: {formatDate(session.lastActiveAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeSession(session.jwtId, session.isCurrentSession)}
                      disabled={revokingSession === session.jwtId}
                    >
                      {revokingSession === session.jwtId ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Revoking...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          {session.isCurrentSession ? 'Log Out' : 'Revoke'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Privacy Note */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-gray-700">
                <p className="font-semibold mb-1">Privacy & Security</p>
                <p className="mb-1">We collect minimal device information for security purposes only:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li>Browser and OS versions</li>
                  <li>Device type (mobile, tablet, or desktop)</li>
                  <li>Approximate location (country level only)</li>
                  <li>IP addresses are hashed, never stored in plain text</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
