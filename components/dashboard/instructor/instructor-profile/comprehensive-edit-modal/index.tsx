"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog";
import { Tabs as UITabs, TabsList as UITabsList, TabsTrigger as UITabsTrigger, TabsContent as UITabsContent } from "@/components/dashboard/ui/tabs";
import { Button } from "@/components/dashboard/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProfileData } from "../types";
import { EditFormData } from "./types";
import { BasicTab } from "./BasicTab";
import { EmploymentTab } from "./EmploymentTab";
import { ProfessionalTab } from "./ProfessionalTab";
import { PaymentTab } from "./PaymentTab";
import { ComingSoonNotice } from "./ComingSoonNotice";
import UnsavedChangesDialog from "./UnsavedChangesDialog";
import { validateEmail } from "../../add-instructor-dialog-refactored/validators";
import { useToast } from "@/hooks/dashboard/use-toast";

// Utility function to check if form data has changed
const hasFormChanged = (currentForm: EditFormData, originalForm: EditFormData): boolean => {
  return JSON.stringify(currentForm) !== JSON.stringify(originalForm)
}

export interface ComprehensiveEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: ProfileData;
  editForm: EditFormData;
  setEditForm: React.Dispatch<React.SetStateAction<EditFormData>>;
  onSave: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  originalForm: EditFormData;
}

export default function ComprehensiveEditModalSplit({
  isOpen,
  onClose,
  profileData,
  editForm,
  setEditForm,
  onSave,
  activeTab,
  setActiveTab,
  originalForm,
}: ComprehensiveEditModalProps) {
  const { toast } = useToast()
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false)
  const [pendingClose, setPendingClose] = useState(false)
  
  const tabOrder = ["basic", "payment", "professional", "employment"] as const;

  const getCurrentTabIndex = () => tabOrder.indexOf(activeTab as typeof tabOrder[number]);
  const isFirstTab = () => getCurrentTabIndex() === 0;
  const isLastTab = () => getCurrentTabIndex() === tabOrder.length - 1;
  const goToNextTab = () => {
    const currentIndex = getCurrentTabIndex();
    if (currentIndex < tabOrder.length - 1) {
      if (activeTab === "basic") {
        const emailCheck = validateEmail(editForm.email)
        if (!emailCheck.ok) {
          toast({ title: "Invalid email address", description: emailCheck.reason, variant: "destructive" })
          return
        }
        if (editForm.dob) {
          const today = new Date(); today.setHours(0,0,0,0)
          const dob = new Date(editForm.dob); dob.setHours(0,0,0,0)
          if (dob.getTime() > today.getTime()) {
            toast({ title: "Invalid date of birth", description: "Date of birth cannot be in the future.", variant: "destructive" })
            return
          }
        }
      }
      setActiveTab(tabOrder[currentIndex + 1]);
    }
  };
  const goToPreviousTab = () => {
    const currentIndex = getCurrentTabIndex();
    if (currentIndex > 0) setActiveTab(tabOrder[currentIndex - 1]);
  };

  // Mirror validation logic from original file
  const isCurrentTabValid = () => {
    if (activeTab === "basic") {
      return (
        !!editForm.joiningDate &&
        !!editForm.contractType &&
        !!editForm.firstName &&
        !!editForm.lastName &&
        !!editForm.role &&
        !!editForm.email && validateEmail(editForm.email).ok &&
        !!editForm.phone &&
        !!editForm.dob &&
        !!editForm.gender &&
        !!editForm.address &&
        !!editForm.country &&
        !!editForm.state
      );
    }
    if (activeTab === "employment") {
      return !!editForm.temporaryPassword && !!editForm.permissionsLevel;
    }
    return true;
  };

  // Handle dialog close with unsaved changes check
  const handleDialogClose = (open: boolean) => {
    if (!open && hasFormChanged(editForm, originalForm)) {
      setShowUnsavedChangesDialog(true)
      setPendingClose(true)
    } else {
      onClose()
    }
  }

  // Handlers for unsaved changes dialog
  const handleContinueEditing = () => {
    setShowUnsavedChangesDialog(false)
    setPendingClose(false)
  }

  const handleDiscardChanges = () => {
    setEditForm(originalForm)
    setShowUnsavedChangesDialog(false)
    setPendingClose(false)
    onClose()
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle>Edit Instructor</DialogTitle>
          </DialogHeader>
          <UITabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <UITabsList className="flex justify-between gap-1 mb-6 w-full">
              <UITabsTrigger value="basic" className="border-2 border-[#DE7D14] text-[#DE7D14] bg-white transition-colors duration-150 font-semibold rounded-lg px-3 py-2 flex-1 text-sm data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white data-[state=active]:border-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white hover:border-[#8B5CF6] focus:outline-none">Basic Info</UITabsTrigger>
              <UITabsTrigger value="payment" className="border-2 border-[#DE7D14] text-[#DE7D14] bg-white transition-colors duration-150 font-semibold rounded-lg px-3 py-2 flex-1 text-sm data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white data-[state=active]:border-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white hover:border-[#8B5CF6] focus:outline-none">Payment Setup</UITabsTrigger>
              <UITabsTrigger value="professional" className="border-2 border-purple-300 text-purple-600 bg-white transition-colors duration-150 font-semibold rounded-lg px-3 py-2 flex-1 text-sm data-[state=active]:bg-gray-400 data-[state=active]:text-white data-[state=active]:border-gray-400 hover:bg-gray-300 hover:text-white hover:border-gray-300 focus:outline-none">Branch Assignment</UITabsTrigger>
              <UITabsTrigger value="employment" className="border-2 border-purple-300 text-purple-600 bg-white transition-colors duration-150 font-semibold rounded-lg px-3 py-2 flex-1 text-sm data-[state=active]:bg-gray-400 data-[state=active]:text-white data-[state=active]:border-gray-400 hover:bg-gray-300 hover:text-white hover:border-gray-300 focus:outline-none">System Access</UITabsTrigger>
            </UITabsList>

            <UITabsContent value="basic">
              <BasicTab profileData={profileData} editForm={editForm} setEditForm={setEditForm} />
            </UITabsContent>

            <UITabsContent value="employment">
              <ComingSoonNotice />
              <EmploymentTab editForm={editForm} setEditForm={setEditForm} />
            </UITabsContent>

            <UITabsContent value="professional">
              <ComingSoonNotice />
              <ProfessionalTab editForm={editForm} setEditForm={setEditForm} />
            </UITabsContent>

            <UITabsContent value="payment">
              <PaymentTab editForm={editForm} setEditForm={setEditForm} />
            </UITabsContent>
          </UITabs>

          <div className="flex justify-end items-center mt-4 pt-4 border-t">
            <div className="flex items-center gap-3">
              {!isFirstTab() && (
                <Button type="button" variant="outline" className="flex items-center gap-2 border-purple-300 text-purple-600 hover:bg-purple-50" onClick={goToPreviousTab}>
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
              )}

              {!isLastTab() && (
                <Button type="button" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white" onClick={goToNextTab} disabled={!isCurrentTabValid()}>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}

              {isLastTab() && (
                <Button type="button" onClick={() => {
                  const emailCheck = validateEmail(editForm.email)
                  if (!emailCheck.ok) {
                    setActiveTab('basic')
                    toast({ title: "Invalid email address", description: emailCheck.reason, variant: "destructive" })
                    return
                  }
                  if (editForm.dob) {
                    const today = new Date(); today.setHours(0,0,0,0)
                    const dob = new Date(editForm.dob); dob.setHours(0,0,0,0)
                    if (dob.getTime() > today.getTime()) {
                      setActiveTab('basic')
                      toast({ title: "Invalid date of birth", description: "Please select a date on or before today.", variant: "destructive" })
                      return
                    }
                  }
                  onSave()
                }} className="bg-purple-600 hover:bg-purple-700 text-white">
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <UnsavedChangesDialog
        open={showUnsavedChangesDialog}
        onContinueEditing={handleContinueEditing}
        onDiscardChanges={handleDiscardChanges}
      />
    </>
  );
}

export type { EditFormData } from "./types";
