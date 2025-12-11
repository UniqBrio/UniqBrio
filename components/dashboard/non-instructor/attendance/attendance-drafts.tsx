'use client';

import React, { forwardRef, useImperativeHandle } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog";
import { Button } from "@/components/dashboard/ui/button";
import { FileText, RefreshCcw, Pencil, Trash2, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/dashboard/ui/alert-dialog";
import { useToast } from "@/hooks/dashboard/use-toast";
import { format as formatDateFns } from "date-fns";

export type AttendanceDraft = {
  id: number;
  instructorId: string;
  instructorName: string;
  cohortId?: string;
  cohortName?: string;
  cohortInstructor?: string;
  cohortTiming?: string;
  date: string; // ISO yyyy-mm-dd
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  status: 'present' | 'absent' | string;
  notes?: string;
  savedAt?: string; // timestamp for drafts
};

export interface AttendanceDraftsHandle {
  open: () => void;
  close: () => void;
  addDraft: (draft: AttendanceDraft) => void;
  updateDraft: (draft: AttendanceDraft) => void;
  deleteDraft: (id: number) => void;
  getCount: () => number;
}

interface AttendanceDraftsProps {
  onContinue: (draft: AttendanceDraft) => void;
  onCountChange?: (count: number) => void;
}

export const AttendanceDrafts = forwardRef<AttendanceDraftsHandle, AttendanceDraftsProps>(function AttendanceDrafts(
  { onContinue, onCountChange }: AttendanceDraftsProps,
  ref
) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [drafts, setDrafts] = React.useState<AttendanceDraft[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [draftToDelete, setDraftToDelete] = React.useState<AttendanceDraft | null>(null);

  // Fetch drafts from API
  const fetchDrafts = async () => {
    try {
      setLoading(true);
  const response = await fetch('/api/dashboard/staff/non-instructor/attendance-drafts', {
        credentials: 'include'
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Map MongoDB _id to id for frontend compatibility
          const mappedDrafts = result.data.map((draft: any) => ({
            ...draft,
            id: draft._id
          }));
          setDrafts(mappedDrafts);
        } else {
          console.error('Failed to fetch drafts:', result.error);
        }
      } else {
        throw new Error('Failed to fetch drafts');
      }
    } catch (error) {
      console.error('Error fetching drafts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load drafts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch drafts when dialog opens
  React.useEffect(() => {
    if (open) {
      fetchDrafts();
    }
  }, [open]);

  // Persist draft count for toolbar hydration compatibility
  React.useEffect(() => {
    try { localStorage.setItem('attendanceDraftsCount', String(drafts.length)); } catch {}
    onCountChange?.(drafts.length);
  }, [drafts.length, onCountChange]);

  useImperativeHandle(ref, () => ({
    open: () => {
      setOpen(true);
    },
    close: () => setOpen(false),
    addDraft: (draft: AttendanceDraft) => {
      // Update local state immediately for responsive UI
      setDrafts(prev => [{ ...draft, savedAt: draft.savedAt || new Date().toISOString() }, ...prev]);
      setOpen(true);
    },
    updateDraft: (draft: AttendanceDraft) => {
      // Update local state immediately for responsive UI
      setDrafts(prev => {
        const idx = prev.findIndex(d => d.id === draft.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], ...draft, savedAt: new Date().toISOString() };
          return copy;
        }
        // if not found, treat as add to be safe
        return [{ ...draft, savedAt: new Date().toISOString() }, ...prev];
      });
      setOpen(true);
    },
    deleteDraft: async (id: number | string) => {
      try {
  const response = await fetch(`/api/dashboard/staff/non-instructor/attendance-drafts/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setDrafts(prev => {
              const next = prev.filter(d => d.id !== id);
              // Auto-close the drafts dialog if no drafts remain after deletion
              if (next.length === 0) {
                setOpen(false);
              }
              return next;
            });
            toast({
              title: 'Success',
              description: 'Draft deleted successfully',
            });
          } else {
            throw new Error(result.error);
          }
        } else {
          throw new Error('Failed to delete draft');
        }
      } catch (error: any) {
        console.error('Error deleting draft:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete draft',
          variant: 'destructive'
        });
      }
    },
    getCount: () => drafts.length,
  }), [drafts.length, toast]);

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
          className="max-w-4xl"
          onEscapeKeyDown={(e) => {
            // Prevent closing the dialog with the Escape key for non-instructor attendance drafts
            e.preventDefault()
          }}
          onPointerDownOutside={(e) => {
            // Prevent closing the dialog by clicking the overlay/backdrop
            e.preventDefault()
          }}
        >
        <DialogHeader>
          <div className="flex items-start justify-between w-full">
            <div>
              <DialogTitle>Drafts (Add Attendance)</DialogTitle>
              <p className="text-sm text-gray-600 dark:text-white mt-1">Manage your saved drafts. Click to continue from draft or delete. ({drafts.length} drafts found)</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shadow-sm"
              title="Refresh"
              disabled={loading}
              onClick={fetchDrafts}
            >
              <RefreshCcw className={`w-4 h-4 right-10 absolute ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </DialogHeader>
        <div className="p-4">
          {loading ? (
            <div className="text-center text-gray-500 dark:text-white py-8">
              <RefreshCcw className="h-8 w-8 mx-auto mb-4 text-gray-400 dark:text-white animate-spin" />
              <p>Loading drafts...</p>
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-white py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-white" />
              <p>No attendance drafts found</p>
              <p className="text-sm">Drafts will appear here when you save attendance records as drafts</p>
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map(d => (
                <div
                  key={d.id}
                  className="group border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition cursor-pointer"
                  onClick={() => onContinue(d)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-semibold truncate">{d.instructorName} <span className="text-gray-500 dark:text-white font-normal">({d.instructorId})</span></div>
                      {/* Removed Cohort Name from drafts list per requirement */}
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-600 dark:text-white">
                        <span className="inline-flex items-center gap-1">
                          {formatDateFns(new Date(d.date), 'dd-MMM-yy')} · {d.startTime || '--:--'} - {d.endTime || '--:--'}
                        </span>
                        <span className="inline-flex items-center">
                          <span className="px-2 py-0.5 rounded-full text-purple-700 bg-purple-100 border border-purple-300 text-[11px]">{(d.status||'').charAt(0).toUpperCase() + (d.status||'').slice(1)}</span>
                        </span>
                      </div>
                      {d.notes && (
                        <div className="text-xs text-gray-500 dark:text-white mt-2 line-clamp-1" title={d.notes}>{d.notes}</div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-white mt-3">Last updated: {d.savedAt ? formatDateFns(new Date(d.savedAt), 'dd-MMM-yy') : formatDateFns(new Date(), 'dd-MMM-yy')}</div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2" onClick={(e)=> e.stopPropagation()}>
                      <button
                        className="p-2 rounded-md hover:bg-purple-50 text-purple-600"
                        title="Continue"
                        onClick={() => onContinue(d)}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 rounded-md hover:bg-red-50 text-red-600"
                        title="Delete"
                        onClick={() => { setDraftToDelete(d); setConfirmOpen(true); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
  </Dialog>
  <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center justify-between">
            <AlertDialogTitle>Delete Draft</AlertDialogTitle>
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <AlertDialogDescription>
            {draftToDelete ? (
              <>Are you sure you want to delete the draft for <span className="font-medium">{draftToDelete.instructorName}</span> ({draftToDelete.instructorId})? This action cannot be undone.</>
            ) : (
              <>Are you sure you want to delete this draft? This action cannot be undone.</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={async () => {
              if (draftToDelete) {
                try {
                  const response = await fetch(`/api/dashboard/staff/non-instructor/attendance-drafts/${draftToDelete.id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                  });
                  
                  if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                      setDrafts(prev => {
                        const next = prev.filter(x => x.id !== draftToDelete.id);
                        // Auto-close the drafts dialog if no drafts remain after confirmation delete
                        if (next.length === 0) {
                          setOpen(false);
                        }
                        return next;
                      });
                      const labelName = draftToDelete.instructorName || draftToDelete.instructorId || 'Draft';
                      toast({
                        title: 'Draft Deleted',
                        description: `Attendance draft "${labelName}" has been deleted.`,
                      });
                    } else {
                      throw new Error(result.error);
                    }
                  } else {
                    throw new Error('Failed to delete draft');
                  }
                } catch (error: any) {
                  console.error('Error deleting draft:', error);
                  toast({
                    title: 'Error',
                    description: error.message || 'Failed to delete draft',
                    variant: 'destructive'
                  });
                }
              }
              setConfirmOpen(false);
              setDraftToDelete(null);
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
});

export default AttendanceDrafts;
