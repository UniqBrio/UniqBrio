"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { InfoIcon, EyeIcon, EyeOffIcon } from "lucide-react"
import { FormValidation } from "@/components/ui/form-validation"
import { PhoneCountryCodeSelect } from "@/components/dashboard/student/common/phone-country-code-select"
import { getPhoneCodeByCountry } from "@/lib/dashboard/student/countries-api"
import { cn } from "@/lib/utils"
import type { FormState, UpdateFormState } from "../use-form-state"

type AdminInfoStepProps = {
  formState: FormState;
  updateFormState: UpdateFormState;
  externalErrors?: Record<string, string>;
  clearFieldError?: (field: string) => void;
};

export default function AdminInfoStep({ formState, updateFormState, externalErrors = {}, clearFieldError }: AdminInfoStepProps) {
  // Removed password and confirm password fields
  const [countryCode, setCountryCode] = useState("+91") // Default to India

  // Add state for field validation
  const [validationState, setValidationState] = useState({
    fullName: { isValid: false, isInvalid: false, message: "" },
    email: { isValid: false, isInvalid: false, message: "" },
    phone: { isValid: false, isInvalid: false, message: "" },
  })

  // Sync country code when business country changes
  useEffect(() => {
    if (formState.businessInfo?.country) {
      const phoneCode = getPhoneCodeByCountry(formState.businessInfo.country);
      if (phoneCode) {
        setCountryCode(phoneCode);
      }
    }
  }, [formState.businessInfo?.country]);

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
    if (clearFieldError) clearFieldError(field)
    updateFormState({
      adminInfo: {
        ...formState.adminInfo,
        [field]: value,
      },
    })

    // Validate fields that need immediate feedback
    if (["fullName", "email", "phone"].includes(field)) {
      validateField(field, value)
    }
  }

  // Removed password strength calculation and helpers

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
     

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
            className={cn(externalErrors.fullName && "border-red-500 focus-visible:ring-red-500")}
          />
          <FormValidation
              isValid={validationState.fullName.isValid && !externalErrors.fullName}
              isInvalid={validationState.fullName.isInvalid || !!externalErrors.fullName}
              message={externalErrors.fullName || validationState.fullName.message}
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
            className={cn(externalErrors.email && "border-red-500 focus-visible:ring-red-500")}
          />
          <FormValidation
            isValid={validationState.email.isValid && !externalErrors.email}
            isInvalid={validationState.email.isInvalid || !!externalErrors.email}
            message={externalErrors.email || validationState.email.message}
          />
        </div>

        {/* Password and Confirm Password fields removed */}

  {/* Role selection removed */}

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
          <div className="flex gap-2">
            <PhoneCountryCodeSelect 
              value={countryCode} 
              onChange={setCountryCode}
              className="w-[130px]"
            />
            <Input
              id="phone"
              type="tel"
              placeholder="9876543210"
              value={formState.adminInfo.phone}
              onChange={(e) => {
                const sanitized = e.target.value.replace(/[^0-9]/g, '');
                handleInputChange("phone", sanitized);
              }}
              aria-required="true"
              onBlur={() => validateField("phone", formState.adminInfo.phone)}
              className={cn("flex-1", externalErrors.phone && "border-red-500 focus-visible:ring-red-500")}
              maxLength={15}
            />
          </div>
          <FormValidation
            isValid={validationState.phone.isValid && !externalErrors.phone}
            isInvalid={validationState.phone.isInvalid || !!externalErrors.phone}
            message={externalErrors.phone || validationState.phone.message}
          />
        </div>
      </div>
    </div>
  )
}
