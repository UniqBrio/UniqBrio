"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/dashboard/ui/alert-dialog";
import { Button } from "@/components/dashboard/ui/button";
import { Badge } from "@/components/dashboard/ui/badge";
import { Pencil, Trash2, RefreshCw } from "lucide-react";
import { ExpenseDraftsAPI, type ExpenseDraft } from "@/lib/dashboard/expense-drafts-api";
import { useToast } from "@/hooks/dashboard/use-toast";
import { ExpenseFormData } from "@/components/dashboard/financials/types";

interface ExpenseDraftsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditDraft: (draft: ExpenseFormData, draftId: string) => void;
}

// Helper function to format date as dd-mmm-yyyy
function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateString;
  }
}

export function ExpenseDraftsDialog({ 
  open, 
  onOpenChange, 
  onEditDraft
}: ExpenseDraftsDialogProps) {
  const [drafts, setDrafts] = useState<ExpenseDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<ExpenseDraft | null>(null);
  const { toast } = useToast();

  // Load drafts from backend API
  const loadDrafts = async () => {
    setLoading(true);
    setError(null);
    try {
      const draftsData = await ExpenseDraftsAPI.getAllDrafts();
      setDrafts(draftsData);
      
      // Trigger event with initial draft count
      ExpenseDraftsAPI.triggerDraftsUpdatedEvent(draftsData, 'migrated');
      
      // Migrate legacy localStorage drafts to backend if they exist
      await migrateLegacyDrafts();

      // After migrating legacy drafts, re-fetch to include any newly created drafts
      try {
        const refreshed = await ExpenseDraftsAPI.getAllDrafts();
        setDrafts(refreshed);
        // Notify other components with the full, authoritative list
        ExpenseDraftsAPI.triggerDraftsUpdatedEvent(refreshed, 'migrated');
      } catch (refreshError) {
        console.warn('Failed to refresh drafts after migration:', refreshError);
      }
    } catch (error) {
      console.error('Error loading expense drafts:', error);
      setError('Failed to load drafts');
      setDrafts([]);
      // Trigger event with empty array
      ExpenseDraftsAPI.triggerDraftsUpdatedEvent([], 'migrated');
    } finally {
      setLoading(false);
    }
  };

  // Migrate legacy localStorage drafts to backend
  const migrateLegacyDrafts = async () => {
    try {
      const savedDrafts = localStorage.getItem('expense-drafts');
      const legacyDraft = localStorage.getItem('draft-expense');
      
      if (savedDrafts) {
        const parsedDrafts = JSON.parse(savedDrafts);
        for (const draft of parsedDrafts) {
          await ExpenseDraftsAPI.createDraft({
            name: draft.name || ExpenseDraftsAPI.generateDraftName(draft.data),
            category: draft.category || draft.data.expenseCategory || 'Uncategorized',
            amount: draft.amount || draft.data.amount || '0',
            data: draft.data
          });
        }
        localStorage.removeItem('expense-drafts');
      }
      
      if (legacyDraft && !savedDrafts) {
        const parsed = JSON.parse(legacyDraft);
        const name = ExpenseDraftsAPI.generateDraftName(parsed);
          
        await ExpenseDraftsAPI.createDraft({
          name,
          category: parsed.expenseCategory || 'Uncategorized',
          amount: parsed.amount || '0',
          data: parsed
        });
        localStorage.removeItem('draft-expense');
      }
    } catch (error) {
      console.error('Error migrating legacy expense drafts:', error);
    }
  };

  useEffect(() => {
    if (open) {
      loadDrafts();
    }
  }, [open]);

  const handleDeleteClick = (draft: ExpenseDraft) => {
    setDraftToDelete(draft);
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    if (!draftToDelete) return;
    
    try {
      await ExpenseDraftsAPI.deleteDraft(draftToDelete.id);
      const updatedDrafts = drafts.filter(d => d.id !== draftToDelete.id);
      setDrafts(updatedDrafts);
      
      // Trigger custom event for other components to update
      ExpenseDraftsAPI.triggerDraftsUpdatedEvent(updatedDrafts, 'deleted');
      
      // Show success toast
      toast({
        title: "??? Draft Deleted",
        description: `Expense draft "${draftToDelete.name}" has been deleted successfully.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error deleting draft:', error);
      setError('Failed to delete draft');
      toast({
        title: "? Delete Failed",
        description: "Unable to delete expense draft. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setShowDeleteConfirmation(false);
      setDraftToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
    setDraftToDelete(null);
  };

  const handleEditDraft = (draft: ExpenseDraft) => {
    onEditDraft(draft.data, draft.id);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="border-b pb-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold">
                  Expense Drafts
                </DialogTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Manage your saved expense drafts. Click to edit draft or delete. ({drafts.length} draft{drafts.length !== 1 ? 's' : ''} found)
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadDrafts}
                  title="Refresh"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 py-4 min-h-0">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                <p className="text-gray-500">Loading drafts...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                <p>{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadDrafts}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            ) : drafts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No expense drafts found</p>
                <p className="text-sm">Start adding an expense and save as draft to see them here</p>
              </div>
            ) : (
              <div className="space-y-3 pr-2">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {draft.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                                                <div className="text-sm text-muted-foreground">
                          {draft.category} {draft.amount && draft.amount !== '0' && `� ${draft.amount} INR`}
                        </div>
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant="outline" 
                            className="bg-red-50 border-red-200 text-red-700"
                          >
                            Expense
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          Last updated: {formatDate(draft.lastUpdated)}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditDraft(draft)}
                          title="Edit Draft"
                        >
                          <Pencil className="h-4 w-4 text-purple-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(draft)}
                          title="Delete Draft"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the draft "{draftToDelete?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}