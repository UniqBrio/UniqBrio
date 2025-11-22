/**
 * Example usage of the course form tabs
 * This demonstrates how to integrate all the course form components
 */

"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import {
  BasicInfoTab,
  ChaptersTab,
  ContentTab,
  PricingTab,
  ScheduleTab,
  SettingsTab,
  MarketingTab
} from "./index"

interface CourseFormProps {
  initialData?: any
  onSave?: (data: any) => void
}

export default function CourseFormExample({ initialData = {}, onSave }: CourseFormProps) {
  const [formData, setFormData] = useState({
    // Basic Info
    id: '',
    name: '',
    status: 'Active',
    instructor: '',
    location: '',
    maxStudents: '',
    description: '',
    level: '',
    type: '',
    courseCategory: 'Regular',
    tags: [],
    duration: '',
    schedule: '',
    studentGuidelines: '',
    freeGifts: [],
    faqs: [],
    
    // Pricing
    priceINR: '',
    paymentCategory: '',
    affiliateEnabled: false,
    referralCode: '',
    commissionRate: '',
    referralStart: '',
    referralEnd: '',
    
    // Schedule
    schedulePeriod: {
      startDate: '',
      endDate: '',
      totalWeeks: ''
    },
    sessionDetails: {
      sessionDuration: '',
      maxClasses: ''
    },
    frequencies: [],
    reminderSettings: {
      pushEnabled: false,
      emailEnabled: false,
      smsEnabled: false,
      whatsappEnabled: false,
      customSchedule: []
    },
    
    // Chapters
    chapters: [],
    
    // Settings
    contentSecurity: {
      watermark: false,
      downloadProtection: false,
      screenRecording: false,
      accessLogging: false
    },
    offlineAccess: {
      enabled: false,
      downloadLimit: '',
      expiryDays: ''
    },
    integrations: {
      credentialVerification: false,
      marketplace: false,
      ltiIntegration: false
    },
    gamification: {
      enabled: false,
      streakRewards: false,
      instructorBadges: false
    },
    
    // Marketing
    promotionTemplate: {
      message: '',
      channels: {
        email: false,
        social: false,
        website: false
      }
    },
    seasonalPromotion: {
      name: '',
      discount: '',
      startDate: '',
      endDate: '',
      conditions: ''
    },
    
    ...initialData
  })

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    onSave?.(formData)
  }

  // Mock data for dropdowns
  const instructorOptions = [
    { id: 'INST001', name: 'Jane Smith' },
    { id: 'INST002', name: 'John Doe' },
    { id: 'INST003', name: 'Priya Patel' }
  ]

  const courseTypeOptions = ['Online', 'Offline', 'Hybrid']
  const tagOptions = ['Art', 'Painting', 'Music', 'Dance', 'Sports', 'Technology', 'Science']
  const freeGiftOptions = ['Badge', 'Keychain', 'Certificate', 'T-Shirt', 'Stickers']
  const mockReferralCodes = [
    { code: 'ART2024', status: 'Active' },
    { code: 'PAINT50', status: 'Active' },
    { code: 'NEWUSER10', status: 'Active' }
  ]

  const showDeleteConfirmation = (title: string, description: string, onConfirm: () => void, itemName: string) => {
    if (confirm(`${title}\n\n${description}\n\nItem: ${itemName}`)) {
      onConfirm()
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Course Form</h1>
      
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="chapters">Chapters</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <BasicInfoTab
            formData={formData}
            onFormChange={handleFormChange}
            instructorOptions={instructorOptions}
            courseTypeOptions={courseTypeOptions}
            tagOptions={tagOptions}
            freeGiftOptions={freeGiftOptions}
            showDeleteConfirmation={showDeleteConfirmation}
          />
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <ContentTab
            formData={formData}
            onFormChange={handleFormChange}
          />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <PricingTab
            formData={formData}
            onFormChange={handleFormChange}
            mockReferralCodes={mockReferralCodes}
            courses={[]}
          />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <ScheduleTab
            formData={formData}
            onFormChange={handleFormChange}
            showDeleteConfirmation={showDeleteConfirmation}
          />
        </TabsContent>

        <TabsContent value="chapters" className="space-y-4">
          <ChaptersTab
            formData={formData}
            onFormChange={handleFormChange}
            showDeleteConfirmation={showDeleteConfirmation}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <SettingsTab
            formData={formData}
            onFormChange={handleFormChange}
          />
        </TabsContent>

        <TabsContent value="marketing" className="space-y-4">
          <MarketingTab
            formData={formData}
            onFormChange={handleFormChange}
          />
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save Course
        </button>
      </div>
    </div>
  )
}
