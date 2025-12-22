"use client"
import React, { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog"
import { Tabs as UITabs, TabsList as UITabsList, TabsTrigger as UITabsTrigger, TabsContent as UITabsContent } from "@/components/dashboard/ui/tabs"
import { Button } from "@/components/dashboard/ui/button"
import { Save, ChevronLeft, ChevronRight } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import { useNonInstructorDrafts } from "@/hooks/dashboard/staff/use-non-instructor-drafts"
import BasicInfoTab from "./BasicInfoTab"
import PaymentTab from "./PaymentTab"
import ProfessionalTab from "./ProfessionalTab"
import EmploymentTab from "./EmploymentTab"
import UnsavedChangesDialog from "./UnsavedChangesDialog"
import type { AddInstructorDialogProps, InstructorFormData, BasicInfoFieldErrors } from "./types"
import { useToast } from "@/hooks/dashboard/use-toast"
import { validateEmail } from "./validators"

// Helper to format today's date as YYYY-MM-DD
const __toYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const __today = __toYMD(new Date())

const GENERIC_FIELD_ERROR = "Please fix the highlighted fields before continuing.";
const DOB_FUTURE_ERROR = "Date of birth cannot be in the future.";
const EMAIL_REQUIRED_ERROR = "Email is required.";
const PHONE_REQUIRED_ERROR = "Phone is required.";
const FIRST_NAME_REQUIRED = "First name is required.";
const LAST_NAME_REQUIRED = "Last name is required.";
const DOB_REQUIRED = "Date of birth is required.";
const GENDER_REQUIRED = "Gender is required.";
const COUNTRY_REQUIRED = "Country is required.";
const STATE_REQUIRED = "State is required.";
const PINCODE_REQUIRED = "Postal/Zip/Pin Code is required.";
const PINCODE_MIN_ERROR = "Postal/Zip/Pin Code must be at least 3 characters.";
const PINCODE_MAX_ERROR = "Postal/Zip/Pin Code cannot exceed 10 characters.";
const PINCODE_FORMAT_ERROR = "Postal/Zip/Pin Code can only contain letters, numbers, spaces, and hyphens.";
const CONTRACT_REQUIRED = "Contract type is required.";
const JOB_LEVEL_REQUIRED = "Job level is required.";
const ROLE_REQUIRED = "Role is required.";
const EXPERIENCE_REQUIRED = "Years of experience is required.";
const JOINING_DATE_REQUIRED = "Joining date is required.";

const initialForm: InstructorFormData = {
  avatar: "",
  firstName: "",
  middleName: "",
  lastName: "",
  role: "",
  roleOther: "", // additional role information for custom option
  email: "",
  phone: "",
  phoneCountryCode: "+91",
  maritalStatus: "",
  dob: "",
  joiningDate: __today,
  contractType: "",
  contractTypeOther: "", // additional contract type information for custom option
  jobLevel: "", // job level of the instructor
  jobLevelOther: "", // additional job level information
  gender: "",
  genderOther: "",
  address: "",
  pincode: "",
  country: "IN",
  state: "",
  yearsOfExperience: "",
  paymentInfo: {
    classCount: "",
    frequency: "",
    hourlyRate: "",
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    ifsc: "",
    branchAddress: "",
    paymentType: "",
    rate: "",
    overtimeRate: "",
    deductions: "",
    taxId: "",
    paymentMethod: "",
    payrollEmail: "",
    payrollPhone: "",
    idProof: null,
    rateType: "hourly",
    upiProvider: "",
    upiId: "",
  },
}

// Utility function to check if form data has changed
const hasFormChanged = (currentForm: InstructorFormData, originalForm: InstructorFormData): boolean => {
  return JSON.stringify(currentForm) !== JSON.stringify(originalForm)
}

export default function AddInstructorDialogWrapper({ open, onOpenChange, draftData, onSave, mode = "add", title, saveLabel, currentId, draftId }: AddInstructorDialogProps) {
  const { toast } = useToast()
  const [addTab, setAddTab] = useState("basic")
  const { saveDraft, updateDraft, deleteDraft, drafts } = useNonInstructorDrafts()
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null)
  const [form, setForm] = useState<InstructorFormData>(initialForm)
  const [originalForm, setOriginalForm] = useState<InstructorFormData>(initialForm)
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false)
  const [pendingClose, setPendingClose] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string>("")
  const [fieldErrors, setFieldErrors] = useState<BasicInfoFieldErrors>({})
  const isEditingDraft = Boolean(draftId || currentDraftId)

  const tabOrder = ["basic", "payment", "professional", "employment"] as const

  const getCurrentTabIndex = () => tabOrder.indexOf(addTab as any)
  const isFirstTab = () => getCurrentTabIndex() === 0
  const isLastTab = () => getCurrentTabIndex() === tabOrder.length - 1

  const goToNextTab = () => {
    const currentIndex = getCurrentTabIndex()
    if (currentIndex < tabOrder.length - 1) {
      const currentTab = tabOrder[currentIndex]
      if (!runValidationForTab(currentTab, true)) return
      setAddTab(tabOrder[currentIndex + 1] as any)
    }
  }
  const goToPreviousTab = () => {
    const currentIndex = getCurrentTabIndex()
    if (currentIndex > 0) setAddTab(tabOrder[currentIndex - 1] as any)
  }

  const validateBasicInfo = (showErrors = true) => {
    const errors: BasicInfoFieldErrors = {}
    const trimmedFirst = form.firstName.trim()
    const trimmedLast = form.lastName.trim()
    const trimmedEmail = form.email.trim()
    const trimmedPhone = form.phone.trim()
    const trimmedRole = form.role.trim()
    const trimmedExperience = form.yearsOfExperience.trim()
    const trimmedContract = form.contractType.trim()
    const trimmedJobLevel = form.jobLevel.trim()
    const trimmedGender = form.gender.trim()
    const trimmedCountry = form.country?.trim()
    const trimmedState = form.state?.trim()
    const trimmedPincode = form.pincode?.trim()
    const dobValue = form.dob?.trim()
    const joiningValue = form.joiningDate?.trim()

    if (!trimmedFirst) errors.firstName = FIRST_NAME_REQUIRED
    if (!trimmedLast) errors.lastName = LAST_NAME_REQUIRED

    if (!dobValue) {
      errors.dob = DOB_REQUIRED
    } else if (dobValue > __today) {
      errors.dob = DOB_FUTURE_ERROR
    }

    if (!trimmedGender) errors.gender = GENDER_REQUIRED

    if (!trimmedEmail) {
      errors.email = EMAIL_REQUIRED_ERROR
    } else {
      const emailCheck = validateEmail(trimmedEmail)
      if (!emailCheck.ok) errors.email = emailCheck.reason
    }

    if (!trimmedPhone) errors.phone = PHONE_REQUIRED_ERROR
    if (!trimmedPincode) {
      errors.pincode = PINCODE_REQUIRED
    } else if (trimmedPincode.length < 3) {
      errors.pincode = PINCODE_MIN_ERROR
    } else if (trimmedPincode.length > 10) {
      errors.pincode = PINCODE_MAX_ERROR
    } else if (!/^[A-Za-z0-9\s-]+$/.test(trimmedPincode)) {
      errors.pincode = PINCODE_FORMAT_ERROR
    }
    if (!trimmedCountry) errors.country = COUNTRY_REQUIRED
    if (!trimmedState) errors.state = STATE_REQUIRED
    if (!trimmedContract) errors.contractType = CONTRACT_REQUIRED
    if (!trimmedJobLevel) errors.jobLevel = JOB_LEVEL_REQUIRED
    if (!trimmedRole) errors.role = ROLE_REQUIRED
    if (!trimmedExperience) errors.yearsOfExperience = EXPERIENCE_REQUIRED
    if (!joiningValue) errors.joiningDate = JOINING_DATE_REQUIRED

    if (showErrors) {
      setFieldErrors(errors)
      if (Object.values(errors).length) {
        const preferred = Object.values(errors).find(message => message === DOB_FUTURE_ERROR)
        setFormError(preferred || GENERIC_FIELD_ERROR)
      } else {
        setFormError("")
      }
    }

    return Object.keys(errors).length === 0
  }

  const runValidationForTab = (tab: typeof tabOrder[number], showErrors = true) => {
    if (tab === "basic") return validateBasicInfo(showErrors)
    return true
  }

  const isCurrentTabValid = () => runValidationForTab(addTab as typeof tabOrder[number], false)

  const isBasicInfoValid = () => validateBasicInfo(false)

  useEffect(() => {
    if (open) {
      // Always start on Basic tab whenever the dialog (re)opens
      setAddTab("basic")
      setFormError("")
      setFieldErrors({})
      if (draftData) {
        setForm(draftData)
        setOriginalForm(draftData)
        // If a draft id is provided, treat this as editing an existing draft; else ensure we are NOT in update mode
        setCurrentDraftId(draftId ?? null)
      } else {
        setForm(initialForm)
        setOriginalForm(initialForm)
        setCurrentDraftId(null)
      }
    }
  }, [draftData, open])

  const handleSaveDraft = async () => {
    try {
      if (currentDraftId) {
        updateDraft(currentDraftId, form)
        toast({ title: "Draft updated", description: "Your draft was updated successfully." })
        // Close the dialog after saving draft (update case)
        onOpenChange(false)
      } else {
        const newDraftId = await saveDraft(form)
        setCurrentDraftId(newDraftId)
        toast({ title: "Draft saved", description: "Your draft was saved successfully." })
        // Close the dialog after saving draft (create case)
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error saving draft:', error)
      toast({ title: "Save failed", description: "Error saving draft. Please try again.", variant: "destructive" })
    }
  }

  const handleSave = async () => {
    if (!validateBasicInfo(true)) {
      setAddTab("basic" as any)
      return
    }
    if (isSaving) return
    setIsSaving(true)
    // Determine remaining drafts before deletion
    const wasEditingDraft = Boolean(currentDraftId)
    const remainingAfterThis = wasEditingDraft
      ? drafts.filter(d => d.id !== currentDraftId).length
      : drafts.length

    // Fire-and-forget save to make the dialog close instantly; backend can finish in background
    const savePromise = Promise.resolve(onSave && onSave(form))
      .then(async () => {
        if (currentDraftId) {
          try { await deleteDraft(currentDraftId) } catch {}
          setCurrentDraftId(null)
          // If more drafts remain, request reopening the Non-Instructor drafts dialog
          if (remainingAfterThis > 0) {
            try {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('non-instructor-drafts:open'))
              }
            } catch {}
          }
        }
      })
      .catch((err) => {
        console.error('Save failed', err)
        // optional: surface error toast here; keep dialog closed for smoother UX
      })
      .finally(() => setIsSaving(false))

  // Close the dialog immediately; Drafts dialog will reopen if needed
  onOpenChange(false)
    // Avoid unhandled promise rejection warnings
    void savePromise
  }

  // Handle dialog close with unsaved changes check
  const handleDialogClose = (open: boolean) => {
    if (isSaving) return // ignore close while saving to avoid double events
    if (!open && hasFormChanged(form, originalForm)) {
      setShowUnsavedChangesDialog(true)
      setPendingClose(true)
    } else {
      onOpenChange(open)
    }
  }

  // Handlers for unsaved changes dialog
  const handleContinueEditing = () => {
    setShowUnsavedChangesDialog(false)
    setPendingClose(false)
  }

  const handleSaveAsDraftFromDialog = () => {
    handleSaveDraft()
    setShowUnsavedChangesDialog(false)
    setPendingClose(false)
    onOpenChange(false)
  }

  const handleDiscardChanges = () => {
    setForm(initialForm)
    setOriginalForm(initialForm)
    setCurrentDraftId(null)
    setShowUnsavedChangesDialog(false)
    setPendingClose(false)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 rounded-xl"
          onEscapeKeyDown={(e) => { e.preventDefault() }}
          onPointerDownOutside={(e) => { e.preventDefault() }}
        >
          <DialogHeader className="flex flex-row items-center justify-between pr-8">
            <DialogTitle>{title ?? (mode === "edit" ? "Edit Non-Instructor" : "Add New Non-Instructor")}</DialogTitle>
            <Button variant="outline" size="sm" className="flex items-center gap-2 border-purple-300 text-purple-600 hover:bg-purple-50" onClick={handleSaveDraft}>
              <Save className="h-4 w-4" />
              {isEditingDraft ? "Update draft" : "Save draft"}
            </Button>
          </DialogHeader>

          {formError && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <UITabs value={addTab} onValueChange={(newTab) => {
            const currentIndex = tabOrder.indexOf(addTab as any)
            const newIndex = tabOrder.indexOf(newTab as any)
            if (newIndex > currentIndex) {
              const currentTab = tabOrder[currentIndex]
              if (!runValidationForTab(currentTab, true)) {
                return
              }
            }
            setAddTab(newTab)
          }} className="w-full">
            <UITabsList className="flex justify-between gap-1 mb-6 w-full bg-transparent">
              <UITabsTrigger value="basic" className="border-2 border-[#DE7D14] text-[#DE7D14] bg-transparent transition-colors duration-150 font-semibold rounded-lg px-3 py-2 flex-1 text-sm data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white data-[state=active]:border-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white hover:border-[#8B5CF6] focus:outline-none">Basic Info</UITabsTrigger>
              <UITabsTrigger value="payment" className="border-2 border-[#DE7D14] text-[#DE7D14] bg-transparent transition-colors duration-150 font-semibold rounded-lg px-3 py-2 flex-1 text-sm data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white data-[state=active]:border-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white hover:border-[#8B5CF6] focus:outline-none">Payment Setup</UITabsTrigger>
              <UITabsTrigger value="professional" className="border-2 border-gray-400 text-gray-500 bg-transparent transition-colors duration-150 font-semibold rounded-lg px-3 py-2 flex-1 text-sm data-[state=active]:bg-gray-400 data-[state=active]:text-white data-[state=active]:border-gray-400 focus:outline-none">Branch Assignment</UITabsTrigger>
              <UITabsTrigger value="employment" className="border-2 border-gray-400 text-gray-500 bg-transparent transition-colors duration-150 font-semibold rounded-lg px-3 py-2 flex-1 text-sm data-[state=active]:bg-gray-400 data-[state=active]:text-white data-[state=active]:border-gray-400 focus:outline-none">System Access</UITabsTrigger>
            </UITabsList>

            {/* Prevent implicit form submission via Enter key causing duplicate onSave */}
            <form onSubmit={(e) => { e.preventDefault() }}>
              <UITabsContent value="basic">
                <BasicInfoTab
                  form={form}
                  setForm={setForm}
                  currentId={mode === 'edit' ? currentId : undefined}
                  fieldErrors={fieldErrors}
                  setFieldErrors={setFieldErrors}
                  setFormError={setFormError}
                  genericErrorMessage={GENERIC_FIELD_ERROR}
                  dobFutureMessage={DOB_FUTURE_ERROR}
                />
              </UITabsContent>
              <UITabsContent value="payment">
                <PaymentTab form={form} setForm={setForm} />
              </UITabsContent>
              <UITabsContent value="professional">
                <ProfessionalTab form={form} setForm={setForm} />
              </UITabsContent>
              <UITabsContent value="employment">
                <EmploymentTab form={form} setForm={setForm} />
              </UITabsContent>
            </form>
          </UITabs>

          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="flex gap-2" />
            <div className="flex gap-2">
              {addTab !== "professional" && addTab !== "employment" && (
                <Button variant="outline" size="sm" className="flex items-center gap-2 border-purple-300 text-purple-600 hover:bg-purple-50" onClick={handleSaveDraft}>
                  <Save className="h-4 w-4" />
                  {isEditingDraft ? "Update draft" : "Save draft"}
                </Button>
              )}
              {/* Hide Previous on Branch Assignment and System Access */}
              {!isFirstTab() && addTab !== "professional" && addTab !== "employment" && (
                <Button variant="outline" type="button" onClick={goToPreviousTab} className="flex items-center gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
              )}
              {/* Show Add Non-Instructor in Payment tab instead of System Access tab */}
              {addTab === "payment" && (() => {
                const isDirty = hasFormChanged(form, originalForm)
                const shouldDisable = isSaving || !isBasicInfoValid() || (mode === "edit" && !isDirty)
                const tooltipMsg = !isBasicInfoValid()
                  ? "Please fill all mandatory fields."
                  : (mode === "edit" && !isDirty)
                    ? "Please make any changes to update this non-instructor."
                    : undefined
                return (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">
                          <Button
                            type="button"
                            onClick={handleSave}
                            disabled={shouldDisable}
                            // Double-click safety
                            onDoubleClick={(e) => { e.preventDefault() }}
                          >
                            {saveLabel ?? (mode === "edit" ? "Save Changes" : "Add Non-Instructor")}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {shouldDisable && tooltipMsg && (
                        <TooltipContent side="top">{tooltipMsg}</TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )
              })()}
              {/* Hide Next on Payment, Branch Assignment, and System Access */}
              {!isLastTab() && addTab !== "payment" && addTab !== "professional" && addTab !== "employment" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <Button type="button" onClick={goToNextTab} disabled={!isCurrentTabValid()} className="flex items-center gap-2">
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!isCurrentTabValid() && (
                      <TooltipContent side="top">Please fill all mandatory fields.</TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <UnsavedChangesDialog
        open={showUnsavedChangesDialog}
        onContinueEditing={handleContinueEditing}
        onSaveAsDraft={handleSaveAsDraftFromDialog}
        onDiscardChanges={handleDiscardChanges}
      />
    </>
  )
}
