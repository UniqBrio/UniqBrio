"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/dashboard/ui/dialog"
import { Button } from "@/components/dashboard/ui/button"

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonText?: string; // Add this new prop
}

export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  itemName,
  onConfirm,
  onCancel,
  confirmButtonText = "Delete" // Default to "Delete" for backward compatibility
}: ConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {message}
            {itemName && (
              <span className="block mt-2 font-medium text-gray-900 dark:text-white">
                "{itemName}"
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => {
            onConfirm();
            // Give time for toast to appear before closing dialog
            setTimeout(() => {
              onCancel();
            }, 100);
          }}>
            {confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
