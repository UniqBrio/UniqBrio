"use client"

import { useCustomColors } from '@/lib/use-custom-colors';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/dashboard/ui/dialog";
import { Button } from "@/components/dashboard/ui/button";
import { X } from "lucide-react";
import React from "react";

interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  onContinueEditing: () => void;
  onSaveAsDraft: () => void;
  onDiscardChanges: () => void;
}

export default function UnsavedChangesDialog({
  open,
  onOpenChange,
  title = "Unsaved Changes",
  description = "You have unsaved changes. What would you like to do?",
  onContinueEditing,
  onSaveAsDraft,
  onDiscardChanges,
}: UnsavedChangesDialogProps) {
  const { primaryColor } = useCustomColors();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">{description}</DialogDescription>
        </DialogHeader>
        <div className="p-2">
          <p className="text-sm text-gray-600 dark:text-white mb-4">{description}</p>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onContinueEditing}>Continue Editing</Button>
            <Button variant="outline" style={{ borderColor: `${primaryColor}80`, color: primaryColor }} onClick={onSaveAsDraft}>Save as Draft</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={onDiscardChanges}>Discard Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
