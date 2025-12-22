"use client"

import { useState } from "react"
import { FormValidation } from "@/components/ui/form-validation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { FormState, UpdateFormState } from "../use-form-state"

const referralOptions = [
  { value: "search", label: "Search Engine" },
  { value: "social", label: "Social Media" },
  { value: "friend", label: "Friend or Colleague" },
  { value: "blog", label: "Blog or Article" },
  { value: "uniqbrio team", label: "UniqBrio Team" },
  { value: "event", label: "Event or Conference" },
  { value: "ad", label: "Advertisement" },
  { value: "other", label: "Other" },
]

type PreferencesStepProps = {
  formState: FormState
  updateFormState: UpdateFormState
  externalErrors: Record<string, string | undefined>
  clearFieldError?: (field: string) => void
}

function PreferencesStep({
  formState,
  updateFormState,
  externalErrors,
  clearFieldError,
}: PreferencesStepProps) {
  const [referralSourceError, setReferralSourceError] = useState("")
  const [otherReferralError, setOtherReferralError] = useState("")

  const showOtherReferralInput = formState.preferences.referralSource === "other"

  const handleInputChange = <K extends keyof FormState["preferences"]>(
    field: K,
    value: FormState["preferences"][K],
  ) => {
    if (clearFieldError) clearFieldError(field as string)

    if (field === "referralSource") {
      setReferralSourceError("")
      if (value !== "other") {
        setOtherReferralError("")
      }
    }

    updateFormState({
      preferences: {
        ...formState.preferences,
        [field]: value,
        ...(field === "referralSource" && value !== "other"
          ? { otherReferral: "" }
          : {}),
      },
    })

    if (field === "otherReferral") {
      const val = typeof value === "string" ? value.trim() : ""
      setOtherReferralError(val ? "" : "Please specify how you heard about us")
    }
  }

  const referralErrorMessage = externalErrors.referralSource || referralSourceError
  const otherReferralMessage = externalErrors.otherReferral || otherReferralError

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <Label htmlFor="referralSource">
          How did you hear about us? <span className="text-red-500">*</span>
        </Label>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
          <Select
            value={formState.preferences.referralSource}
            onValueChange={(value) => handleInputChange("referralSource", value)}
          >
            <SelectTrigger
              id="referralSource"
              data-field="referralSource"
              aria-required="true"
              className={`w-full md:w-64 h-10 text-sm ${referralErrorMessage ? "border-red-500 focus:ring-red-500" : ""}`}
              onBlur={() => {
                if (!formState.preferences.referralSource) {
                  setReferralSourceError("Please select how you heard about us")
                }
              }}
            >
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
            <div className="flex-1 flex items-center gap-2">
              <Input
                  id="otherReferral"
                type="text"
                placeholder="Please specify how you heard about us"
                value={formState.preferences.otherReferral || ""}
                onChange={(event) => handleInputChange("otherReferral", event.target.value)}
                onBlur={() => {
                  const val = formState.preferences.otherReferral?.trim() || ""
                  setOtherReferralError(val ? "" : "Please specify how you heard about us")
                }}
                className={`text-sm ${otherReferralMessage ? "border-red-500 focus:ring-red-500" : ""}`}
                aria-required="true"
                  data-field="otherReferral"
              />
              <span className="text-red-500 text-sm">*</span>
            </div>
          )}
        </div>

        <div className={`flex flex-col gap-2 ${showOtherReferralInput ? "md:flex-row md:items-center md:gap-4" : ""}`}>
          <FormValidation
            isValid={Boolean(formState.preferences.referralSource) && !referralErrorMessage}
            isInvalid={Boolean(referralErrorMessage)}
            message={referralErrorMessage || ""}
          />
          {showOtherReferralInput && (
            <FormValidation
              isValid={Boolean(formState.preferences.otherReferral) && !otherReferralMessage}
              isInvalid={Boolean(otherReferralMessage)}
              message={otherReferralMessage || ""}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default PreferencesStep
