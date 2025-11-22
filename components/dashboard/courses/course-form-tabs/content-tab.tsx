"use client"

import { Label } from "@/components/dashboard/ui/label"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Switch } from "@/components/dashboard/ui/switch"
import { Separator } from "@/components/dashboard/ui/separator"
import {
  Video,
  Headphones,
  FileText,
  Eye,
  Zap
} from "lucide-react"

interface ContentTabProps {
  formData: any
  onFormChange: (field: string, value: any) => void
}

export default function ContentTab({ formData, onFormChange }: ContentTabProps) {
  return (
    <div className="space-y-2 compact-form">
  <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700 text-center italic">
          Coming Soon
        </p>
      </div>
      
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Content Formats</h4>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div className="flex items-center space-x-1 text-xs">
            <Checkbox id="video" />
            <Label htmlFor="video" className="flex items-center gap-1 text-xs">
              <Video className="h-3 w-3" />
              Video Content
            </Label>
          </div>
          <div className="flex items-center space-x-1 text-xs">
            <Checkbox id="podcast" />
            <Label htmlFor="podcast" className="flex items-center gap-1 text-xs">
              <Headphones className="h-3 w-3" />
              Podcasts
            </Label>
          </div>
          <div className="flex items-center space-x-1 text-xs">
            <Checkbox id="interactive-pdf" />
            <Label htmlFor="interactive-pdf" className="flex items-center gap-1 text-xs">
              <FileText className="h-3 w-3" />
              Interactive PDFs
            </Label>
          </div>
          <div className="flex items-center space-x-1 text-xs">
            <Checkbox id="ar-vr" />
            <Label htmlFor="ar-vr" className="flex items-center gap-1 text-xs">
              <Eye className="h-3 w-3" />
              AR/VR Content
            </Label>
          </div>
          <div className="flex items-center space-x-1 text-xs">
            <Checkbox id="simulation" />
            <Label htmlFor="simulation" className="flex items-center gap-1 text-xs">
              <Zap className="h-3 w-3" />
              Simulations
            </Label>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <h4 className="font-medium text-sm">Video Player Settings</h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="flex items-center space-x-1 text-xs">
            <Switch id="speedControl" />
            <Label htmlFor="speedControl" className="text-xs">Speed Control</Label>
          </div>
          <div className="flex items-center space-x-1 text-xs">
            <Switch id="downloadEnabled" />
            <Label htmlFor="downloadEnabled" className="text-xs">Download</Label>
          </div>
          <div className="flex items-center space-x-1 text-xs">
            <Switch id="subtitles" />
            <Label htmlFor="subtitles" className="text-xs">Subtitles</Label>
          </div>.l
          <div className="flex items-center space-x-1 text-xs">
            <Switch id="chapters" />
            <Label htmlFor="chapters" className="text-xs">Chapters</Label>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <h4 className="font-medium text-sm">Microlearning Modules</h4>
        <p className="text-xs text-gray-600">Break course into 5-10 minute modules</p>

        <div className="flex items-center space-x-1 text-xs">
          <Switch id="enableMicrolearning" />
          <Label htmlFor="enableMicrolearning" className="text-xs">Enable Microlearning</Label>
        </div>

        <div className="flex items-center space-x-1 text-xs">
          <Switch id="adaptiveContent" />
          <Label htmlFor="adaptiveContent" className="text-xs">Adaptive Content Delivery</Label>
        </div>
      </div>
    </div>
  )
}
