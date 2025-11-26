"use client"

import { Card } from "@/components/dashboard/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog"
import { Button } from "@/components/dashboard/ui/button"
import { Pencil, Trash2, X, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"
import { useCustomColors } from "@/lib/use-custom-colors"
type DraftType = {
  id: string;
  name: string;
  instructor: string;
  description: string;
  updatedAt: number;
  tags?: string[];
  [key: string]: any;
};

interface DraftsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  drafts: DraftType[];
  onEditDraft: (draft: DraftType) => void;
  onDeleteDraft: (draft: DraftType) => void;
  onRefreshDrafts?: () => void;
}

export default function DraftsDialog({ 
  isOpen, 
  onOpenChange, 
  drafts, 
  onEditDraft, 
  onDeleteDraft,
  onRefreshDrafts
}: DraftsDialogProps) {
  const { primaryColor } = useCustomColors();
  const [deleteConfirmDraft, setDeleteConfirmDraft] = useState<DraftType | null>(null);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Drafts (Create Course)</DialogTitle>
                <DialogDescription>
                  Manage your saved drafts. Click to create course from draft or delete. 
                  {drafts.length > 0 && ` (${drafts.length} draft${drafts.length !== 1 ? 's' : ''} found)`}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {onRefreshDrafts && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={onRefreshDrafts}
                    title="Refresh Drafts"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onOpenChange(false)}
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
            {drafts.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-white py-8">No drafts found.</div>
            ) : (
              (Array.isArray(drafts) ? drafts : [])
                .sort((a: DraftType, b: DraftType) => b.updatedAt - a.updatedAt)
                .map((draft: DraftType, index: number) => (
                  <Card key={draft.id || `draft-${index}-${draft.name}`} className="hover:shadow-md transition-shadow cursor-pointer flex flex-col md:flex-row md:items-center md:justify-between p-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-lg mb-1">{draft.name}</div>
                      <div className="text-sm text-gray-700 dark:text-white mb-1">{draft.instructor}</div>
                      <div className="text-xs text-gray-500 dark:text-white mb-2">{draft.description}</div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {draft.tags && draft.tags.map((tag: string, i: number) => (
                          <span key={`${draft.id}-tag-${i}-${tag}`} className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs font-medium border border-gray-200 dark:border-gray-700">{tag}</span>
                        ))}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-white">Last updated: {format(new Date(draft.updatedAt), 'dd-MMM-yy')}</div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-2 mt-2 md:mt-0 md:ml-4">
                      {/* Create Course button */}
                      <button
                        type="button"
                        className="p-2 rounded border border-gray-200 dark:border-gray-700 flex items-center"
                        style={{ color: primaryColor }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}15`}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="Create Course from Draft"
                        onClick={() => onEditDraft(draft)}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {/* Delete icon button */}
                      <button
                        type="button"
                        className="p-2 rounded hover:bg-red-100 text-red-500 border border-gray-200 flex items-center"
                        title="Delete Draft"
                        onClick={() => setDeleteConfirmDraft(draft)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                        <span className="ml-1 text-sm hidden md:inline"></span>
                      </button>
                    </div>
                  </Card>
                ))
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirmDraft} onOpenChange={(open) => { if (!open) setDeleteConfirmDraft(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Draft?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the draft <span className="font-semibold">{deleteConfirmDraft?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <button
              className="px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-100"
              onClick={() => setDeleteConfirmDraft(null)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
              onClick={() => {
                if (deleteConfirmDraft) onDeleteDraft(deleteConfirmDraft);
                setDeleteConfirmDraft(null);
              }}
            >
              Delete
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
