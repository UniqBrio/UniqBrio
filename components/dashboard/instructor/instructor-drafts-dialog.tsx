"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Badge } from "@/components/dashboard/ui/badge"
import { Edit2, Trash2, RefreshCw, X } from "lucide-react"
import { useInstructorDrafts, InstructorDraft } from "@/hooks/dashboard/staff/use-instructor-drafts"
import { useToast } from "@/hooks/dashboard/use-toast"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTrigger,
} from "@/components/dashboard/ui/alert-dialog"

interface InstructorDraftsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoadDraft: (draftData: any, draftId: string) => void
  onOpenAddDialog: () => void
}

export default function InstructorDraftsDialog({ 
  open, 
  onOpenChange, 
  onLoadDraft, 
  onOpenAddDialog 
}: InstructorDraftsDialogProps) {
  const { drafts, deleteDraft, updateDraftName, draftsCount, loadDrafts } = useInstructorDrafts()
  const { toast } = useToast()
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  // Helper: format various date strings to dd-MMM-yyyy (e.g., 18-Oct-2025)
  const formatToDDMMMYYYY = (value?: string) => {
    if (!value) return "";
    const tryFormat = (d: Date) => {
      if (isNaN(d.getTime())) return null;
      const day = String(d.getDate()).padStart(2, '0')
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      const mon = monthNames[d.getMonth()]
      const year = d.getFullYear()
      return `${day}-${mon}-${year}`
    }

    // 1) Try direct parse (ISO or common formats)
    let d = new Date(value)
    let out = tryFormat(d)
    if (out) return out

    // 2) If it looks like a locale string with time, take the date part before comma
    if (value.includes(',')) {
      const datePart = value.split(',')[0].trim()
      d = new Date(datePart)
      out = tryFormat(d)
      if (out) return out
    }

    // 3) Fallback: return the original string without time (before comma) if present
    return value.includes(',') ? value.split(',')[0].trim() : value
  }

  // Refresh drafts when dialog opens
  React.useEffect(() => {
    if (open) {
      console.log('Drafts dialog opened, refreshing drafts')
      loadDrafts()
    }
  }, [open]) // Removed loadDrafts dependency to prevent infinite loop

  const handleEditName = (draft: InstructorDraft) => {
    setEditingDraftId(draft.id)
    setEditName(draft.name)
  }

  const handleSaveName = (draftId: string) => {
    if (editName.trim()) {
      updateDraftName(draftId, editName.trim())
    }
    setEditingDraftId(null)
    setEditName("")
  }

  const handleCancelEdit = () => {
    setEditingDraftId(null)
    setEditName("")
  }

  const performDelete = async (idToDelete: string) => {
    setIsDeleting(true)
    try {
      await deleteDraft(idToDelete)
      toast({ title: "Draft deleted", description: "The draft was removed successfully." })
    } catch (e: any) {
      toast({ title: "Deletion failed", description: e?.message || 'Unable to delete draft', variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLoadDraft = (draft: InstructorDraft) => {
    // Pass both the form data and the draft id so the add dialog can update this draft later
    onLoadDraft(draft.formData, draft.id)
    onOpenChange(false) // Close drafts dialog; caller opens the add dialog
  }

  const getBadgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'intermediate':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'advanced':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:text-white border-gray-200'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="pr-12">
            <DialogTitle className="text-xl font-semibold">Instructor Drafts</DialogTitle>
            <p className="text-sm text-gray-600 dark:text-white mt-1">
              Manage your saved drafts. Click to edit instructor from draft or delete.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Refresh drafts"
            title="Refresh drafts"
            className="absolute right-12 top-4 text-purple-600 hover:bg-purple-50"
            onClick={() => {
              console.log('Manual refresh clicked')
              loadDrafts()
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {drafts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-white">
              <p>No drafts found</p>
              <p className="text-sm">Start creating an instructor to save drafts</p>
            </div>
          ) : (
            drafts.map((draft) => (
              <div
                key={draft.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleLoadDraft(draft)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {editingDraftId === draft.id ? (
                      <div className="flex items-center gap-2 mb-2" onClick={e => e.stopPropagation()}>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="text-lg font-semibold"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveName(draft.id)
                            } else if (e.key === 'Escape') {
                              handleCancelEdit()
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveName(draft.id)}
                          className="px-2"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          className="px-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
                        {draft.name}
                      </h3>
                    )}
                    
                    <p className="text-sm text-gray-600 dark:text-white mb-2">
                      {draft.instructorName}
                    </p>
                    
                    {/* Hidden irrelevant metadata: internal id and level badge */}
                    
                    <p className="text-xs text-gray-500 dark:text-white">
                      Last updated: {formatToDDMMMYYYY(draft.lastUpdated)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4" onClick={e => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLoadDraft(draft)
                      }}
                      className="p-2 text-gray-500 dark:text-white hover:text-purple-600 hover:bg-purple-50"
                    >
                      <Edit2 className="h-4 w-4 text-purple-600" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Draft?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action will permanently remove the draft "{draft.name}". This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => {
                              e.preventDefault();
                              if (!isDeleting) performDelete(draft.id)
                            }}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            disabled={isDeleting}
                          >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
