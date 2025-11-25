"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/dashboard/ui/alert-dialog";
import { Button } from "@/components/dashboard/ui/button";
import { Badge } from "@/components/dashboard/ui/badge";
import { X, Pencil, Edit, Trash2, RefreshCw } from "lucide-react";
import { type Student } from "@/types/dashboard/student";
import { StudentDraftsAPI, type StudentDraft } from "@/lib/dashboard/student/student-drafts-api";
import { useToast } from "@/hooks/dashboard/use-toast";

interface StudentDraftsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditDraft: (draft: Partial<Student>, draftId: string) => void;
}

export function StudentDraftsDialog({ 
  open, 
  onOpenChange, 
  onEditDraft
}: StudentDraftsDialogProps) {
  const [drafts, setDrafts] = useState<StudentDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<StudentDraft | null>(null);
  const { toast } = useToast();

  // Load drafts from backend API
  const loadDrafts = async () => {
    setLoading(true);
    setError(null);
    try {
      const draftsData = await StudentDraftsAPI.getAllDrafts();
      setDrafts(draftsData);
      
      // Migrate legacy localStorage drafts to backend if they exist
      await migrateLegacyDrafts();

      // After migrating legacy drafts, re-fetch to include any newly created drafts
      try {
        const refreshed = await StudentDraftsAPI.getAllDrafts();
        setDrafts(refreshed);
        // Notify other components with the full, authoritative list
        StudentDraftsAPI.triggerDraftsUpdatedEvent(refreshed, 'migrated');
      } catch (refreshError) {
        console.warn('Failed to refresh drafts after migration:', refreshError);
      }
    } catch (error) {
      console.error('Error loading student drafts:', error);
      setError('Failed to load drafts');
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  };

  // Migrate legacy localStorage drafts to backend
  const migrateLegacyDrafts = async () => {
    try {
      const savedDrafts = localStorage.getItem('student-drafts');
      const legacyDraft = localStorage.getItem('draft-new-student');
      
      if (savedDrafts) {
        const parsedDrafts = JSON.parse(savedDrafts);
        for (const draft of parsedDrafts) {
          await StudentDraftsAPI.createDraft({
            name: draft.name,
            instructor: draft.instructor,
            level: draft.level,
            data: draft.data
          });
        }
        localStorage.removeItem('student-drafts');
      }
      
      if (legacyDraft && !savedDrafts) {
        const parsed = JSON.parse(legacyDraft);
        const name = (parsed.firstName && parsed.lastName) 
          ? `${parsed.firstName} ${parsed.lastName}` 
          : parsed.name || 'Untitled Student';
          
        await StudentDraftsAPI.createDraft({
          name,
          instructor: parsed.activity || 'No Course Selected',
          level: parsed.category || 'Beginner',
          data: parsed
        });
        localStorage.removeItem('draft-new-student');
      }
    } catch (error) {
      console.error('Error migrating legacy drafts:', error);
    }
  };

  useEffect(() => {
    if (open) {
      loadDrafts();
    }
  }, [open]);

  const handleDeleteClick = (draft: StudentDraft) => {
    setDraftToDelete(draft);
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    if (!draftToDelete) return;
    
    try {
      await StudentDraftsAPI.deleteDraft(draftToDelete.id);
      const updatedDrafts = drafts.filter(d => d.id !== draftToDelete.id);
      setDrafts(updatedDrafts);
      
      // Trigger custom event for other components to update
      StudentDraftsAPI.triggerDraftsUpdatedEvent(updatedDrafts, 'deleted');
      
      // Show success toast
      toast({
        title: "??? Draft Deleted",
        description: `Draft "${draftToDelete.name}" has been deleted successfully.`,
        duration: 3000,
      });
      
      // Close the dialog if this was the last draft
      if (updatedDrafts.length === 0) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
      setError('Failed to delete draft');
      toast({
        title: "? Delete Failed",
        description: "Unable to delete draft. Please try again.",
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

  const handleEditDraft = (draft: StudentDraft) => {
    onEditDraft(draft.data, draft.id);
    
    // Close the dialog immediately when editing a draft
    onOpenChange(false);
  };



  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="border-b pb-4 flex-shrink-0 relative">
          {/* Top-right refresh button */}
          <Button
            variant="outline"
            size="icon"
            onClick={loadDrafts}
            title="Refresh"
            disabled={loading}
            className="absolute top-2 right-2 h-9 w-9 rounded-md border-purple-300 text-purple-600 hover:bg-purple-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <div className="pr-12">
            <div>
              <DialogTitle className="text-xl font-semibold">
                Drafts (Add Student)
              </DialogTitle>
              <p className="text-sm text-gray-600 dark:text-white mt-1">
                Manage your saved drafts. Click to create student from draft or delete. ({drafts.length} draft{drafts.length !== 1 ? 's' : ''} found)
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 py-4 min-h-0">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
              <p className="text-gray-500 dark:text-white">Loading drafts...</p>
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
            <div className="text-center py-8 text-gray-500 dark:text-white">
              <p>No drafts found</p>
              <p className="text-sm">Start adding a student and save as draft to see them here</p>
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
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                        {draft.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-white mb-2">
                        {draft.instructor}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant="outline" 
                          className="bg-purple-50 border-purple-200 text-purple-700"
                        >
                          {draft.level}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-white">
                        Last updated: {draft.lastUpdated}
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
            Are you sure you want to delete the draft {draftToDelete?.name}? 
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
