"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { InfoIcon, EyeIcon, EyeOffIcon } from "lucide-react"
// Import the FormValidation component at the top of the file
import { FormValidation } from "@/components/ui/form-validation"
import type { FormState, UpdateFormState } from "../use-form-state"

type AdminInfoStepProps = {
  formState: FormState;
  updateFormState: UpdateFormState;
};

export default function AdminInfoStep({ formState, updateFormState }: AdminInfoStepProps) {
  // Removed password and confirm password fields

  // Add state for field validation
  const [validationState, setValidationState] = useState({
    fullName: { isValid: false, isInvalid: false, message: "" },
    email: { isValid: false, isInvalid: false, message: "" },
    phone: { isValid: false, isInvalid: false, message: "" },
    socialProfile: { isValid: false, isInvalid: false, message: "" },
    agreeToTerms: { isValid: false, isInvalid: false, message: "" },
  })

  // Add validation function
  const validateField = (field: string, value: any) => {
    let isValid = false
    let isInvalid = false
    let message = ""

    switch (field) {
      case "fullName":
        const nameRegex = /^[a-zA-Z\s.'\-]+$/
        const trimmedName = value?.trim() || ""
        
        if (trimmedName.length === 0) {
          isInvalid = true
          message = "Full name is required"
        } else if (trimmedName.length < 2) {
          isInvalid = true
          message = "Full name must be at least 2 characters"
        } else if (trimmedName.length > 50) {
          isInvalid = true
          message = "Full name cannot exceed 50 characters"
        } else if (!nameRegex.test(trimmedName)) {
          isInvalid = true
          message = "Full name can only contain letters, spaces, dots, apostrophes, and hyphens"
        } else if (trimmedName.split(' ').length < 2) {
          isInvalid = true
          message = "Please enter your full name (first and last name)"
        } else {
          isValid = true
          message = "Valid full name"
        }
        break
      case "email":
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        const trimmedEmail = value?.trim() || ""
        
        if (trimmedEmail.length === 0) {
          isInvalid = true
          message = "Email address is required"
        } else if (trimmedEmail.length < 5) {
          isInvalid = true
          message = "Email must be at least 5 characters long"
        } else if (trimmedEmail.startsWith('.') || trimmedEmail.startsWith('-') || trimmedEmail.startsWith('_')) {
          isInvalid = true
          message = "Email cannot start with special characters"
        } else if (!emailRegex.test(trimmedEmail)) {
          isInvalid = true
          message = "Please enter a valid email address (e.g., name@domain.com)"
        } else if (trimmedEmail.includes('..')) {
          isInvalid = true
          message = "Email cannot contain consecutive dots"
        } else {
          const domainPart = trimmedEmail.split('@')[1]
          if (domainPart && domainPart.length < 4) {
            isInvalid = true
            message = "Domain must be at least 4 characters (e.g., mail.com)"
          } else {
            isValid = true
            message = "Valid email address"
          }
        }
        break
      // Removed password and confirmPassword validation
      case "phone":
        const phoneRegex = /^[\+]?[0-9\s\(\)\-]+$/
        const cleanPhone = (value || '').replace(/[\s\(\)\-]/g, '') // Remove formatting for length check
        
        if (!value || value.trim().length === 0) {
          isInvalid = true
          message = "Phone number is required"
        } else if (!phoneRegex.test(value)) {
          isInvalid = true
          message = "Phone number can only contain numbers, spaces, (), -, and +"
        } else if (cleanPhone.length < 10) {
          isInvalid = true
          message = "Phone number must be at least 10 digits"
        } else if (cleanPhone.length > 15) {
          isInvalid = true
          message = "Phone number cannot exceed 15 digits"
        } else {
          isValid = true
          message = "Valid phone number"
        }
        break
      case "socialProfile":
        const socialUrlRegex = /^(https?:\/\/)?(www\.)?(linkedin\.com\/in\/|twitter\.com\/|facebook\.com\/|instagram\.com\/|github\.com\/|youtube\.com\/|tiktok\.com\/@?)[a-zA-Z0-9._-]+\/?$/
        const generalUrlRegex = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?(\/.*)?(\?.*)?(#.*)?$/
        
        if (!value || value.trim().length === 0) {
          // Social profile is optional
          isValid = false
          isInvalid = false
          message = ""
        } else if (value.trim().length < 10) {
          isInvalid = true
          message = "Social profile URL seems too short"
        } else if (socialUrlRegex.test(value)) {
          isValid = true
          message = "Valid social profile URL"
        } else if (generalUrlRegex.test(value)) {
          isValid = true
          message = "Valid profile URL"
        } else {
          isInvalid = true
          message = "Please enter a valid social media or website URL"
        }
        break
      case "agreeToTerms":
        if (!value) {
          isInvalid = true
          message = "You must agree to the terms and conditions"
        } else {
          isValid = true
          message = "Agreed to terms"
        }
        break
      default:
        break
    }

    setValidationState((prev) => ({
      ...prev,
      [field]: { isValid, isInvalid, message },
    }))
  }

  // Modify the handleInputChange function to include validation
  const handleInputChange = (field: string, value: any) => {
    updateFormState({
      adminInfo: {
        ...formState.adminInfo,
        [field]: value,
      },
    })

    // Validate fields that need immediate feedback
    if (["fullName", "email", "phone", "socialProfile", "agreeToTerms"].includes(field)) {
      validateField(field, value)
    }
  }

  // Removed password strength calculation and helpers

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Owner/Admin Information</h3>
        <p className="text-sm text-muted-foreground">Set up the primary administrator account for your business</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fullName"
            placeholder="John Doe"
            value={formState.adminInfo.fullName}
            onChange={(e) => handleInputChange("fullName", e.target.value)}
            aria-required="true"
            onBlur={() => validateField("fullName", formState.adminInfo.fullName)}
          />
          <FormValidation
            isValid={validationState.fullName.isValid}
            isInvalid={validationState.fullName.isInvalid}
            message={validationState.fullName.message}
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            
          </div>
          <Input
            id="email"
            type="email"
            placeholder="john.doe@example.com"
            value={formState.adminInfo.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            aria-required="true"
            onBlur={() => validateField("email", formState.adminInfo.email)}
          />
          <FormValidation
            isValid={validationState.email.isValid}
            isInvalid={validationState.email.isInvalid}
            message={validationState.email.message}
          />
        </div>

        {/* Password and Confirm Password fields removed */}

  {/* Role selection removed */}

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={formState.adminInfo.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            aria-required="true"
            onBlur={() => validateField("phone", formState.adminInfo.phone)}
          />
          <FormValidation
            isValid={validationState.phone.isValid}
            isInvalid={validationState.phone.isInvalid}
            message={validationState.phone.message}
          />
        </div>

        {/* Social Profile */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="socialProfile">Social Profile URL </Label>
          <Input
            id="socialProfile"
            type="url"
            placeholder="https://linkedin.com/in/yourprofile"
            value={formState.adminInfo.socialProfile}
            onChange={(e) => handleInputChange("socialProfile", e.target.value)}
            onBlur={() => validateField("socialProfile", formState.adminInfo.socialProfile)}
          />
          <FormValidation
            isValid={validationState.socialProfile.isValid}
            isInvalid={validationState.socialProfile.isInvalid}
            message={validationState.socialProfile.message}
          />
        </div>

        {/* Terms and Newsletter */}
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="agreeToTerms"
              checked={formState.adminInfo.agreeToTerms}
              onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked)}
              aria-required="true"
              onBlur={() => validateField("agreeToTerms", formState.adminInfo.agreeToTerms)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="agreeToTerms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the{" "}
                <a href="#" className="text-primary underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-primary underline">
                  Privacy Policy
                </a>{" "}
                <span className="text-red-500">*</span>
              </Label>
              <FormValidation
                isValid={validationState.agreeToTerms.isValid}
                isInvalid={validationState.agreeToTerms.isInvalid}
                message={validationState.agreeToTerms.message}
              />
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="newsletter"
              checked={formState.adminInfo.newsletter}
              onCheckedChange={(checked) => handleInputChange("newsletter", checked)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="newsletter"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Subscribe to our Daily BrioPulse for Latest News, Inspiration Stories and more.
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
