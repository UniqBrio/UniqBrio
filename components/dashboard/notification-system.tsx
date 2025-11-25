"use client"

import { useState } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Card, CardContent } from "@/components/dashboard/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/dashboard/ui/dialog"
import { Label } from "@/components/dashboard/ui/label"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Textarea } from "@/components/dashboard/ui/textarea"
import { Badge } from "@/components/dashboard/ui/badge"
import { Bell, Send, Users, AlertTriangle } from "lucide-react"
import { toast } from "@/components/dashboard/ui/use-toast"
import { useApp } from "@/contexts/dashboard/app-context"
import type { NotificationTemplate } from "@/types/dashboard/schedule"

interface NotificationSystemProps {
  events: any[]
  selectedEvents?: string[]
}

export default function NotificationSystem({ events, selectedEvents = [] }: NotificationSystemProps) {
  const { user, notifications } = useApp()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  const [customMessage, setCustomMessage] = useState("")
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["push"])
  const [recipientType, setRecipientType] = useState<"all" | "selected" | "custom">("all")
  const [isEmergency, setIsEmergency] = useState(false)

  const emergencyTemplates = [
    {
      id: "weather-alert",
      name: "Weather Alert",
      template: "Due to severe weather conditions, all classes scheduled for {date} have been cancelled. Stay safe!",
    },
    {
      id: "facility-closure",
      name: "Facility Closure",
      template:
        "Our facility will be temporarily closed from {startDate} to {endDate} due to {reason}. All classes during this period are cancelled.",
    },
    {
      id: "health-advisory",
      name: "Health Advisory",
      template: "Important health advisory: {message}. Please follow all safety protocols.",
    },
  ]

  const handleSendNotification = () => {
    const recipientCount =
      recipientType === "all"
        ? events.reduce((sum, event) => sum + event.registeredStudents.length, 0)
        : selectedEvents.length > 0
          ? events
              .filter((e) => selectedEvents.includes(e.id))
              .reduce((sum, event) => sum + event.registeredStudents.length, 0)
          : 0

    // Simulate sending notification
    setTimeout(() => {
      toast({
        title: "Notification Sent",
        description: `${isEmergency ? "Emergency notification" : "Notification"} sent to ${recipientCount} recipients via ${selectedChannels.join(", ")}.`,
      })
      setIsOpen(false)
      setCustomMessage("")
      setSelectedTemplate(null)
      setIsEmergency(false)
    }, 1000)
  }

  const getRecipientCount = () => {
    if (recipientType === "all") {
      return events.reduce((sum, event) => sum + event.registeredStudents.length, 0)
    } else if (recipientType === "selected" && selectedEvents.length > 0) {
      return events
        .filter((e) => selectedEvents.includes(e.id))
        .reduce((sum, event) => sum + event.registeredStudents.length, 0)
    }
    return 0
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Bell className="h-4 w-4 mr-2" />
          Send Notification
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Send Notification
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Emergency Toggle */}
          <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg border border-red-200">
            <Checkbox id="emergency" checked={isEmergency} onCheckedChange={setIsEmergency} />
            <Label htmlFor="emergency" className="flex items-center gap-2 text-red-700 font-medium">
              <AlertTriangle className="h-4 w-4" />
              Emergency Notification
            </Label>
          </div>

          {/* Recipients */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Recipients</Label>
            <Select value={recipientType} onValueChange={(value: any) => setRecipientType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All Students ({events.reduce((sum, event) => sum + event.registeredStudents.length, 0)})
                </SelectItem>
                <SelectItem value="selected" disabled={selectedEvents.length === 0}>
                  Selected Classes (
                  {selectedEvents.length > 0
                    ? events
                        .filter((e) => selectedEvents.includes(e.id))
                        .reduce((sum, event) => sum + event.registeredStudents.length, 0)
                    : 0}
                  )
                </SelectItem>
                <SelectItem value="custom">Custom Selection</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white">
              <Users className="h-4 w-4" />
              <span>{getRecipientCount()} recipients will receive this notification</span>
            </div>
          </div>

          {/* Notification Channels */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Delivery Channels</Label>
            <div className="grid grid-cols-4 gap-3">
              {["push", "SMS", "email", "whatsapp"].map((channel) => (
                <div key={channel} className="flex items-center space-x-2">
                  <Checkbox
                    id={channel}
                    checked={selectedChannels.includes(channel)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedChannels([...selectedChannels, channel])
                      } else {
                        setSelectedChannels(selectedChannels.filter((c) => c !== channel))
                      }
                    }}
                  />
                  <Label htmlFor={channel} className="capitalize">
                    {channel === "SMS" ? "SMS" : channel === "whatsapp" ? "WhatsApp" : channel}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Templates */}
          <div className="space-y-3">
            <Label className="text-base font-medium">{isEmergency ? "Emergency Templates" : "Message Templates"}</Label>
            <div className="grid grid-cols-1 gap-2">
              {(isEmergency ? emergencyTemplates : notifications).map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id ? "ring-2 ring-purple-500 bg-purple-50" : "hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setSelectedTemplate(template)
                    setCustomMessage(template.template)
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-white mt-1">{template.template}</p>
                      </div>
                      {!isEmergency && "channels" in template && (
                        <div className="flex gap-1">
                          {template.channels.map((channel) => (
                            <Badge key={channel} variant="outline" className="text-xs">
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div className="space-y-3">
            <Label htmlFor="custom-message" className="text-base font-medium">
              {selectedTemplate ? "Edit Message" : "Custom Message"}
            </Label>
            <Textarea
              id="custom-message"
              placeholder={isEmergency ? "Enter emergency message..." : "Enter your custom message..."}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="min-h-[100px]"
            />
            {selectedTemplate && "variables" in selectedTemplate && selectedTemplate.variables && (
              <div className="text-sm text-gray-600 dark:text-white">
                <p>Available variables: {selectedTemplate.variables.map((v) => `{${v}}`).join(", ")}</p>
              </div>
            )}
          </div>

          {/* Preview */}
          {customMessage && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Preview</Label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                <p className="text-sm">{customMessage}</p>
              </div>
            </div>
          )}

          {/* Send Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendNotification}
              disabled={!customMessage || selectedChannels.length === 0}
              className={isEmergency ? "bg-red-600 hover:bg-red-700" : ""}
            >
              <Send className="h-4 w-4 mr-2" />
              {isEmergency ? "Send Emergency Alert" : "Send Notification"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
