"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/dashboard/ui/alert-dialog";
import { Button } from "@/components/dashboard/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { CampaignDraftsAPI, type CampaignDraft } from "@/lib/dashboard/campaign-drafts-api";
import { useToast } from "@/hooks/dashboard/use-toast";

interface CampaignDraftsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditDraft: (draft: any, draftId: string) => void;
  onDraftsChange?: (drafts: CampaignDraft[]) => void;
}

export function CampaignDraftsDialog({
  open,
  onOpenChange,
  onEditDraft,
  onDraftsChange,
}: CampaignDraftsDialogProps) {
  const [drafts, setDrafts] = useState<CampaignDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<CampaignDraft | null>(null);
  const { toast } = useToast();

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const draftsData = await CampaignDraftsAPI.getAllDrafts();
      setDrafts(draftsData);
      onDraftsChange?.(draftsData);
    } catch (error) {
      console.error('Error loading campaign drafts:', error);
      setDrafts([]);
      onDraftsChange?.([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadDrafts();
    }
  }, [open]);

  const handleDeleteClick = (draft: CampaignDraft) => {
    setDraftToDelete(draft);
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    if (!draftToDelete) return;

    try {
      await CampaignDraftsAPI.deleteDraft(draftToDelete.id);
      const updatedDrafts = drafts.filter(d => d.id !== draftToDelete.id);
      setDrafts(updatedDrafts);
      onDraftsChange?.(updatedDrafts);

      toast({
        title: "Draft Deleted",
        description: `Draft "${draftToDelete.name}" has been deleted successfully.`,
        duration: 3000,
      });

      // Close dialog if no drafts left
      if (updatedDrafts.length === 0) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast({
        title: "Delete Failed",
        description: "Unable to delete draft. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setShowDeleteConfirmation(false);
      setDraftToDelete(null);
    }
  };

  const handleEditDraft = (draft: CampaignDraft) => {
    onEditDraft(draft.data, draft.id);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Campaign Drafts</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading drafts...</p>
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">No drafts saved yet</p>
              <p className="text-xs text-muted-foreground">
                Start creating a campaign and save it as a draft to see it here
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{draft.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      Updated {new Date(draft.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditDraft(draft)}
                      title="Edit draft"
                    >
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(draft)}
                      title="Delete draft"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{draftToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
