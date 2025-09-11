"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CheckIcon, X, Plus, Trash2 } from "lucide-react"
import { FormValidation } from "@/components/ui/form-validation"
import type { FormState, UpdateFormState } from "../use-form-state"

// Define Preferences type if not imported
type Preferences = {
  referralSource?: string;
  otherReferral?: string;
  featuresOfInterest?: string[];
  // Add other fields as needed
};

// Plan selection removed

const featureOptions = [
  { value: "scheduling", label: "Class Scheduling" },
  { value: "payments", label: "Payment Processing" },
  { value: "attendance", label: "Attendance Tracking" },
  { value: "staff", label: "Staff Management" },
  { value: "reporting", label: "Reporting & Analytics" },
  { value: "communication", label: "Student Communication" },
  { value: "marketing", label: "Marketing Tools" },
  { value: "mobile", label: "Mobile App Access" },
  { value: "other", label: "Other" },
]

const referralOptions = [
  { value: "search", label: "Search Engine" },
  { value: "social", label: "Social Media" },
  { value: "friend", label: "Friend or Colleague" },
  { value: "blog", label: "Blog or Article" },
  { value: "event", label: "Event or Conference" },
  { value: "ad", label: "Advertisement" },
  { value: "other", label: "Other" },
]


export default function PreferencesStep({ formState, updateFormState }: { formState: FormState; updateFormState: UpdateFormState }) {
  const router = useRouter();
  // Add currentStep and setCurrentStep props for step navigation
  // @ts-ignore
  const currentStep = typeof window !== 'undefined' && window.__uniqbrio_currentStep !== undefined ? window.__uniqbrio_currentStep : 0;
  // @ts-ignore
  const setCurrentStep = typeof window !== 'undefined' ? window.__uniqbrio_setCurrentStep : undefined;
  const [showReview, setShowReview] = useState(false);
  // Show input for 'Other' referral source
  const showOtherReferralInput = formState.preferences.referralSource === "other";
  // Promo code and teammate validation removed

  // Teammate validation effect removed

  const handleInputChange = (field: keyof Preferences, value: string | string[]) => {
    updateFormState({
      preferences: {
        ...formState.preferences,
        [field]: value,
      },
    })
  }

  const handleFeatureToggle = (feature: string) => {
    const currentFeatures = formState.preferences.featuresOfInterest ?? []
    const updatedFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter((f: string) => f !== feature)
      : [...currentFeatures, feature]

    handleInputChange("featuresOfInterest", updatedFeatures)
  }

  // Features of Interest removed

  // Promo code and teammate handlers removed

  return (
    <div className="space-y-6">
      <div className="space-y-4 relative">
        <h3 className="text-lg font-medium">Setup Preferences</h3>
        <p className="text-sm text-muted-foreground">Customize your UniqBrio experience</p>
        <Button
          className="absolute top-0 right-0 bg-purple-600 text-white px-6 py-2 rounded shadow hover:bg-purple-700"
          type="button"
          onClick={() => setShowReview((prev) => !prev)}
        >
          Review
        </Button>
      </div>

      {/* Referral Source */}
      <div className="space-y-2">
        <Label htmlFor="referralSource">
          How did you hear about us? <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formState.preferences.referralSource}
          onValueChange={(value) => handleInputChange("referralSource", value)}
        >
          <SelectTrigger id="referralSource" aria-required="true" className="w-64 max-w-full h-10 text-sm">
            <SelectValue placeholder="Select source" />
          </SelectTrigger>
          <SelectContent className="w-64 max-w-full text-sm">
            {referralOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showOtherReferralInput && (
          <div className="pt-2 flex items-center gap-2">
            <Input
              type="text"
              placeholder="Please specify how you heard about us"
              value={formState.preferences.otherReferral || ""}
              onChange={e => handleInputChange("otherReferral", e.target.value)}
              className="w-96 text-sm"
            />
          </div>
        )}
      </div>

      {/* Inline Review Section */}
      {showReview && (
        <div className="mt-8 p-6 border rounded-lg bg-white shadow">
          <h3 className="text-lg font-bold mb-4">Review Your Information</h3>
          <div className="flex flex-col md:flex-row gap-0 md:gap-0">
            {/* Step 1 Section */}
            <div className="md:w-1/2 pr-0 md:pr-8 border-b md:border-b-0 md:border-r border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Step 1: Business Information</h4>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-2"
                  onClick={() => {
                    if (typeof setCurrentStep === 'function' && currentStep > 0) {
                      setCurrentStep(currentStep - 1);
                    } else {
                      window.history.back();
                    }
                  }}
                >
                  Edit
                </Button>
              </div>
              <ul className="text-sm space-y-1">
                <li><b>Business Name:</b> {formState.businessInfo?.businessName || '-'}</li>
                <li><b>Legal Entity Name:</b> {formState.businessInfo?.legalEntityName || '-'}</li>
                <li><b>Business Email:</b> {formState.businessInfo?.businessEmail || '-'}</li>
                <li><b>Phone Number:</b> {formState.businessInfo?.phoneNumber || '-'}</li>
                <li><b>Industry Type:</b> {formState.businessInfo?.industryType || '-'}</li>
                <li><b>Services Offered:</b> {formState.businessInfo?.servicesOffered?.join(', ') || '-'}</li>
                <li><b>Student Size:</b> {formState.businessInfo?.studentSize || '-'}</li>
                <li><b>Staff Count:</b> {formState.businessInfo?.staffCount || '-'}</li>
                <li><b>Country:</b> {formState.businessInfo?.country || '-'}</li>
                <li><b>State:</b> {formState.businessInfo?.state || '-'}</li>
                <li><b>City:</b> {formState.businessInfo?.city || '-'}</li>
                <li><b>Address:</b> {formState.businessInfo?.address || '-'}</li>
                <li><b>Pincode:</b> {formState.businessInfo?.pincode || '-'}</li>
                <li><b>Tax ID:</b> {formState.businessInfo?.taxId || '-'}</li>
                <li><b>Website:</b> {formState.businessInfo?.website || '-'}</li>
                <li><b>Preferred Language:</b> {formState.businessInfo?.preferredLanguage || '-'}</li>
              </ul>
            </div>
            {/* Step 2 Section */}
            <div className="md:w-1/2 pl-0 md:pl-8 mt-8 md:mt-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Step 2: Owner/Admin Information</h4>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-2"
                  onClick={() => router.push("/register/preferences", { scroll: false })}
                >
                  Edit
                </Button>
              </div>
              <ul className="text-sm space-y-1">
                <li><b>Full Name:</b> {formState.adminInfo?.fullName || '-'}</li>
                <li><b>Email:</b> {formState.adminInfo?.email || '-'}</li>
                  {/* Role removed from summary */}
                <li><b>Phone:</b> {formState.adminInfo?.phone || '-'}</li>
                <li><b>Social Profile URL:</b> {formState.adminInfo?.socialProfile || '-'}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Plan selection removed */}

      {/* Promo code removed */}

      {/* Invite teammates removed */}

      {/* Features of Interest removed */}
      {/* Confirm Subscription removed */}
    </div>
  )
}
