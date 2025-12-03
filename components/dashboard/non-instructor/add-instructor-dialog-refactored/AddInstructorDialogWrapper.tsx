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
import type { AddInstructorDialogProps, InstructorFormData } from "./types"
import { useToast } from "@/hooks/dashboard/use-toast"
import { validateEmail } from "./validators"

// Helper to format today's date as YYYY-MM-DD
const __toYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const __today = __toYMD(new Date())

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
  const isEditingDraft = Boolean(draftId || currentDraftId)

  const tabOrder = ["basic", "payment", "professional", "employment"] as const

  const getCurrentTabIndex = () => tabOrder.indexOf(addTab as any)
  const isFirstTab = () => getCurrentTabIndex() === 0
  const isLastTab = () => getCurrentTabIndex() === tabOrder.length - 1

  const goToNextTab = () => {
    const currentIndex = getCurrentTabIndex()
    if (currentIndex < tabOrder.length - 1) {
      if (addTab === "basic") {
        const emailCheck = validateEmail(form.email)
        if (!emailCheck.ok) {
          toast({ title: "Invalid email address", description: emailCheck.reason, variant: "destructive" })
          return
        }
        // Disallow future DOB
        if (form.dob) {
          const today = new Date(); today.setHours(0,0,0,0)
          const dob = new Date(form.dob); dob.setHours(0,0,0,0)
          if (dob.getTime() > today.getTime()) {
            toast({ title: "Invalid date of birth", description: "Date of birth cannot be in the future.", variant: "destructive" })
            return
          }
        }
      }
      setAddTab(tabOrder[currentIndex + 1] as any)
    }
  }
  const goToPreviousTab = () => {
    const currentIndex = getCurrentTabIndex()
    if (currentIndex > 0) setAddTab(tabOrder[currentIndex - 1] as any)
  }

  const isCurrentTabValid = () => {
    if (addTab === "basic") {
      return (
        !!form.joiningDate &&
        !!form.contractType &&
        !!form.firstName &&
        !!form.lastName &&
        !!form.role &&
        !!form.email && validateEmail(form.email).ok &&
        !!form.phone &&
        !!form.dob &&
        !!form.gender &&
        !!form.country &&
        !!form.state
      )
    }
    // Employment tab validation removed - fields not in type
    return true
  }

  // Basic Info mandatory validation reused for disabling Add Instructor on Payment tab
  const isBasicInfoValid = () => (
    !!form.joiningDate &&
    !!form.contractType &&
    !!form.firstName &&
    !!form.lastName &&
    !!form.role &&
    !!form.email && validateEmail(form.email).ok &&
    !!form.phone &&
    !!form.dob &&
    !!form.gender &&
    !!form.country &&
    !!form.state
  )

  useEffect(() => {
    if (open) {
      // Always start on Basic tab whenever the dialog (re)opens
      setAddTab("basic")
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
    // Global validation guard: ensure email remains valid even if user left the Basic tab
    const emailCheck = validateEmail(form.email)
    if (!emailCheck.ok) {
      setAddTab("basic" as any)
      toast({ title: "Invalid email address", description: emailCheck.reason, variant: "destructive" })
      return
    }
    // DOB cannot be in the future
    if (form.dob) {
      const today = new Date(); today.setHours(0,0,0,0)
      const dob = new Date(form.dob); dob.setHours(0,0,0,0)
      if (dob.getTime() > today.getTime()) {
        setAddTab("basic" as any)
        toast({ title: "Invalid date of birth", description: "Please select a date on or before today.", variant: "destructive" })
        return
      }
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 rounded-xl">
          <DialogHeader className="flex flex-row items-center justify-between pr-8">
            <DialogTitle>{title ?? (mode === "edit" ? "Edit Non-Instructor" : "Add New Non-Instructor")}</DialogTitle>
            <Button variant="outline" size="sm" className="flex items-center gap-2 border-purple-300 text-purple-600 hover:bg-purple-50" onClick={handleSaveDraft}>
              <Save className="h-4 w-4" />
              {isEditingDraft ? "Update draft" : "Save draft"}
            </Button>
          </DialogHeader>

          <UITabs value={addTab} onValueChange={(newTab) => {
            // Prevent tab change if trying to move forward without validation
            const currentIndex = tabOrder.indexOf(addTab as any);
            const newIndex = tabOrder.indexOf(newTab as any);
            
            // If moving forward, validate current tab
            if (newIndex > currentIndex && !isCurrentTabValid()) {
              toast({
                title: "Missing Required Fields",
                description: "Please fill all mandatory fields before proceeding.",
                variant: "destructive"
              });
              return;
            }
            
            setAddTab(newTab);
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
                <BasicInfoTab form={form} setForm={setForm} currentId={mode === 'edit' ? currentId : undefined} />
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
