"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import { Switch } from "@/components/dashboard/ui/switch"
import { Label } from "@/components/dashboard/ui/label"
import { Button } from "@/components/dashboard/ui/button"
import { Textarea } from "@/components/dashboard/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Bell, Mail, MessageSquare, AlertTriangle, CheckCircle2 } from "lucide-react"

export function AttendanceSettings() {
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [smsEnabled, setSmsEnabled] = useState(true)
  const [whatsappEnabled, setWhatsappEnabled] = useState(false)
  const [inAppEnabled, setInAppEnabled] = useState(true)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notification Settings </h2>
        <p className="text-gray-500">Configure attendance notifications and alerts</p>
      </div>

      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="channels">Notification Channels</TabsTrigger>
          <TabsTrigger value="templates">Message Templates</TabsTrigger>
          <TabsTrigger value="rules">Automation Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>Configure which channels to use for attendance notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-gray-500">Send attendance notifications via email</p>
                    </div>
                  </div>
                  <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">SMS Notifications</h4>
                      <p className="text-sm text-gray-500">Send attendance notifications via SMS</p>
                    </div>
                  </div>
                  <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">WhatsApp Notifications</h4>
                      <p className="text-sm text-gray-500">Send attendance notifications via WhatsApp</p>
                    </div>
                  </div>
                  <Switch checked={whatsappEnabled} onCheckedChange={setWhatsappEnabled} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Bell className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Push Notifications</h4>
                      <p className="text-sm text-gray-500">Send attendance notifications within the app</p>
                    </div>
                  </div>
                  <Switch checked={inAppEnabled} onCheckedChange={setInAppEnabled} />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Notification Recipients</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="notify-admin" defaultChecked />
                    <Label htmlFor="notify-admin">Administrators</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="notify-instructor" defaultChecked />
                    <Label htmlFor="notify-instructor">Non-Instructors</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="notify-student" defaultChecked />
                    <Label htmlFor="notify-student">Students</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="notify-parent" defaultChecked />
                    <Label htmlFor="notify-parent">Parents/Guardians</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Frequency</CardTitle>
              <CardDescription>Configure how often notifications are sent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="absence-reminder">Absence Reminder</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger id="absence-reminder">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attendance-summary">Attendance Summary</Label>
                  <Select defaultValue="weekly">
                    <SelectTrigger id="attendance-summary">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="late-arrival">Late Arrival Notification</Label>
                  <Select defaultValue="immediate">
                    <SelectTrigger id="late-arrival">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="none">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consecutive-absence">Consecutive Absence Alert</Label>
                  <Select defaultValue="2days">
                    <SelectTrigger id="consecutive-absence">
                      <SelectValue placeholder="Select threshold" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1day">After 1 day</SelectItem>
                      <SelectItem value="2days">After 2 days</SelectItem>
                      <SelectItem value="3days">After 3 days</SelectItem>
                      <SelectItem value="1week">After 1 week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Templates</CardTitle>
              <CardDescription>Customize the content of attendance notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="absence-template" className="text-base font-medium">
                    Absence Notification
                  </Label>
                  <p className="text-sm text-gray-500 mb-2">Sent when a student is marked absent</p>
                  <Textarea
                    id="absence-template"
                    className="min-h-[100px]"
                    defaultValue="Dear {parent_name}, This is to inform you that {student_name} was absent from {class_name} on {date}. Please contact us if you have any questions. Regards, {academy_name}"
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    Available variables: {"{student_name}"}, {"{parent_name}"}, {"{class_name}"}, {"{date}"},{" "}
                    {"{academy_name}"}
                  </div>
                </div>

                <div>
                  <Label htmlFor="late-template" className="text-base font-medium">
                    Late Arrival Notification
                  </Label>
                  <p className="text-sm text-gray-500 mb-2">Sent when a student arrives late</p>
                  <Textarea
                    id="late-template"
                    className="min-h-[100px]"
                    defaultValue="Dear {parent_name}, This is to inform you that {student_name} arrived late to {class_name} on {date} at {time}. Regards, {academy_name}"
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    Available variables: {"{student_name}"}, {"{parent_name}"}, {"{class_name}"}, {"{date}"}, {"{time}"}
                    , {"{academy_name}"}
                  </div>
                </div>

                <div>
                  <Label htmlFor="summary-template" className="text-base font-medium">
                    Weekly Summary Notification
                  </Label>
                  <p className="text-sm text-gray-500 mb-2">Sent as a weekly attendance summary</p>
                  <Textarea
                    id="summary-template"
                    className="min-h-[100px]"
                    defaultValue="Dear {parent_name}, Here is the weekly attendance summary for {student_name}: Present: {present_days} days, Absent: {absent_days} days, Late: {late_days} days. Overall attendance: {attendance_percentage}%. Regards, {academy_name}"
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    Available variables: {"{student_name}"}, {"{parent_name}"}, {"{present_days}"}, {"{absent_days}"},{" "}
                    {"{late_days}"}, {"{attendance_percentage}"}, {"{academy_name}"}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <Button variant="outline">Reset to Default</Button>
                <Button>Save Templates</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Rules</CardTitle>
              <CardDescription>Configure automated actions based on attendance patterns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border rounded-md">
                  <div className="flex items-start">
                    <div className="mr-4">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Consecutive Absence Alert</h4>
                      <p className="text-sm text-gray-500 mb-2">
                        Send escalated notifications when a student is absent for consecutive days
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="consecutive-days">Consecutive Days</Label>
                          <Select defaultValue="3">
                            <SelectTrigger id="consecutive-days">
                              <SelectValue placeholder="Select days" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2">2 days</SelectItem>
                              <SelectItem value="3">3 days</SelectItem>
                              <SelectItem value="5">5 days</SelectItem>
                              <SelectItem value="7">7 days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="escalation-action">Action</Label>
                          <Select defaultValue="email_sms">
                            <SelectTrigger id="escalation-action">
                              <SelectValue placeholder="Select action" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">Email Only</SelectItem>
                              <SelectItem value="sms">SMS Only</SelectItem>
                              <SelectItem value="email_sms">Email + SMS</SelectItem>
                              <SelectItem value="all">All Channels</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-4">
                        <Switch id="enable-consecutive" defaultChecked />
                        <Label htmlFor="enable-consecutive">Enable this rule</Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-md">
                  <div className="flex items-start">
                    <div className="mr-4">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Perfect Attendance Celebration</h4>
                      <p className="text-sm text-gray-500 mb-2">Send congratulatory message for perfect attendance</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="perfect-period">Time Period</Label>
                          <Select defaultValue="month">
                            <SelectTrigger id="perfect-period">
                              <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="week">Week</SelectItem>
                              <SelectItem value="month">Month</SelectItem>
                              <SelectItem value="quarter">Quarter</SelectItem>
                              <SelectItem value="year">Year</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="celebration-action">Action</Label>
                          <Select defaultValue="notification_badge">
                            <SelectTrigger id="celebration-action">
                              <SelectValue placeholder="Select action" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="notification">Notification Only</SelectItem>
                              <SelectItem value="badge">Badge Only</SelectItem>
                              <SelectItem value="notification_badge">Notification + Badge</SelectItem>
                              <SelectItem value="certificate">Digital Certificate</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-4">
                        <Switch id="enable-celebration" defaultChecked />
                        <Label htmlFor="enable-celebration">Enable this rule</Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-md">
                  <div className="flex items-start">
                    <div className="mr-4">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Attendance Below Threshold</h4>
                      <p className="text-sm text-gray-500 mb-2">
                        Alert when student's attendance falls below a threshold
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="threshold-percentage">Threshold Percentage</Label>
                          <Select defaultValue="75">
                            <SelectTrigger id="threshold-percentage">
                              <SelectValue placeholder="Select percentage" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="90">90%</SelectItem>
                              <SelectItem value="85">85%</SelectItem>
                              <SelectItem value="80">80%</SelectItem>
                              <SelectItem value="75">75%</SelectItem>
                              <SelectItem value="70">70%</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="threshold-action">Action</Label>
                          <Select defaultValue="notify_all">
                            <SelectTrigger id="threshold-action">
                              <SelectValue placeholder="Select action" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="notify_student">Notify Student</SelectItem>
                              <SelectItem value="notify_parent">Notify Parent</SelectItem>
                              <SelectItem value="notify_all">Notify All</SelectItem>
                              <SelectItem value="schedule_meeting">Schedule Meeting</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-4">
                        <Switch id="enable-threshold" defaultChecked />
                        <Label htmlFor="enable-threshold">Enable this rule</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button>Save Rules</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
