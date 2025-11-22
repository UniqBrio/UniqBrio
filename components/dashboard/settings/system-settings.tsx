"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Info } from "lucide-react"

interface SystemSettingsProps {
  onUpdate: (updates: any) => Promise<void>
}

export function SystemSettings({ onUpdate }: SystemSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-purple-600" />
            System Settings
          </CardTitle>
          <CardDescription>
            System configuration has been moved
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-900 font-medium">Settings Relocated</p>
            <p className="text-sm text-purple-700 mt-1">
              All system settings including Data Management and Danger Zone have been moved to the <strong>System Config</strong> tab for better organization.
            </p>
            <p className="text-sm text-purple-700 mt-2">
              Please navigate to the System Config tab to manage backups, delete account, and configure other system settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
