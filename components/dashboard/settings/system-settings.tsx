"use client"

import { useState } from "react"
import { useCustomColors } from "@/lib/use-custom-colors"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Info } from "lucide-react"

interface SystemSettingsProps {
  onUpdate: (updates: any) => Promise<void>
}

export function SystemSettings({ onUpdate }: SystemSettingsProps) {
  const { primaryColor } = useCustomColors()
  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" style={{ color: primaryColor }} />
            System Settings
          </CardTitle>
          <CardDescription>
            System configuration has been moved
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg" style={{ backgroundColor: `${primaryColor}15`, borderWidth: '1px', borderColor: `${primaryColor}80` }}>
            <p className="text-sm font-medium" style={{ color: `${primaryColor}dd` }}>Settings Relocated</p>
            <p className="text-sm mt-1" style={{ color: `${primaryColor}cc` }}>
              All system settings including Data Management and Danger Zone have been moved to the <strong>System Config</strong> tab for better organization.
            </p>
            <p className="text-sm mt-2" style={{ color: `${primaryColor}cc` }}>
              Please navigate to the System Config tab to manage backups, delete account, and configure other system settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
