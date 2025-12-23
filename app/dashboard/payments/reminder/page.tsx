"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs";
import ReminderTemplateManager from "@/components/dashboard/payments/reminder/template-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card";
import { Button } from "@/components/dashboard/ui/button";
import { Mail, Settings, Clock, BarChart3 } from "lucide-react";

export default function ReminderPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reminder Management</h1>
        <p className="text-gray-600 dark:text-white mt-2">
          Manage email reminder templates, configure settings, and track communication
        </p>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="scheduler">Schedule</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <ReminderTemplateManager />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="opacity-75">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-orange-600" />
                <CardTitle>Reminder Settings</CardTitle>
              </div>
              <CardDescription>
                Configure reminder schedules, frequencies, and communication preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>
                <Settings className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
              <p className="text-sm text-gray-500 dark:text-white mt-4">
                Configure default reminder timing, email sending limits, payment reminder settings, subscription notifications, and communication channel preferences.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduler" className="space-y-4">
          <Card className="opacity-75">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-green-600" />
                <CardTitle>Schedule Reminders</CardTitle>
              </div>
              <CardDescription>
                Set up automated reminder schedules for different scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>
                <Clock className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
              <p className="text-sm text-gray-500 dark:text-white mt-4">
                This feature will allow you to create automated reminder schedules based on payment due dates, course start dates, and custom triggers.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="opacity-75">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-purple-600" />
                <CardTitle>Reminder Analytics</CardTitle>
              </div>
              <CardDescription>
                Track reminder performance and engagement rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>
                <BarChart3 className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
              <p className="text-sm text-gray-500 dark:text-white mt-4">
                Monitor email open rates, click-through rates, payment completion rates after reminders, and overall reminder effectiveness.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}