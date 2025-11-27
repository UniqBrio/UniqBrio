import React, { useState } from 'react'
/**
 * Reusable Drafts dialog listing stored drafts with Load / Delete actions.
 * It doesn't own the draft state – expects it via props from the useDrafts hook.
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card } from '../ui/card'
import { Trash2, FileText, Clock, Pencil, RotateCw, X } from 'lucide-react'
import { DraftItem } from './use-drafts'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog'
import { format } from 'date-fns'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { useCustomColors } from '@/lib/use-custom-colors'

interface DraftsDialogProps<TData = any> {
  drafts: DraftItem<TData>[]
  onLoadDraft: (draft: DraftItem<TData>) => void
  onDeleteDraft: (id: string) => void
  children: React.ReactNode
  title?: string
  filterType?: string
  refreshAction?: React.ReactNode // optional refresh icon/action (like screenshot)
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DraftsDialog<TData = any>({
  drafts,
  onLoadDraft,
  onDeleteDraft,
  children,
  title = 'Drafts',
  filterType,
  refreshAction,
  open,
  onOpenChange,
}: DraftsDialogProps<TData>) {
  const { primaryColor } = useCustomColors()
  const filteredDrafts = filterType ? drafts.filter(d => d.type === filterType) : drafts
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const requestDelete = (id: string) => {
    setPendingDeleteId(id)
    setConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (pendingDeleteId) {
      onDeleteDraft(pendingDeleteId)
      setPendingDeleteId(null)
    }
    setConfirmOpen(false)
  }

  const cancelDelete = () => {
    setPendingDeleteId(null)
    setConfirmOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {title}
              {filteredDrafts.length > 0 && (
                <Badge variant="secondary">{filteredDrafts.length}</Badge>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {refreshAction}
              
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Manage your saved drafts. Click a draft to edit or delete.</p>
        </DialogHeader>
        {/* Note: DialogContent already renders a close button at top-right; avoid adding a second close icon here. */}
        <div className="space-y-4 pt-2">
          {filteredDrafts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No drafts saved yet</p>
              <p className="text-sm">Click "Save Draft" to save your work in progress</p>
            </div>
          ) : (
            filteredDrafts.map(draft => {
              const taskData: any = draft.data || {}
              const orgOrSecondary = taskData?.taskRemarks || ''
              const priority = taskData?.taskPriority || 'medium'
              const end = taskData?.targetDate ? new Date(taskData.targetDate) : null
              return (
                <div
                  key={draft.id}
                  onClick={() => onLoadDraft(draft)}
                  className="group border rounded-md p-4 cursor-pointer hover:shadow-sm transition bg-background"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm md:text-base truncate">
                        {draft.title || 'Untitled Task'}
                      </h3>
                      {orgOrSecondary && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {orgOrSecondary}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {end ? (
                          <>Target: {end.toDateString()}</>
                        ) : (
                          'Target date not set'
                        )}
                      </p>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs capitalize">
                          {priority}
                        </Badge>
                        {draft.type && (
                          <Badge variant="secondary" className="text-xs capitalize">
                            {draft.type.replace('-', ' ')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Last updated: {format(draft.updatedAt, "dd-MMM-yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onLoadDraft(draft) }}
                              className="p-2 rounded"
                              onMouseEnter={(e) => {
                                const el = e.currentTarget as HTMLButtonElement
                                el.style.background = `color-mix(in oklab, ${primaryColor} 12%, white)`
                                el.style.color = primaryColor
                              }}
                              onMouseLeave={(e) => {
                                const el = e.currentTarget as HTMLButtonElement
                                el.style.background = ''
                                el.style.color = ''
                              }}
                              aria-label="Edit draft"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Edit draft</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); requestDelete(draft.id) }}
                              className="p-2 rounded hover:bg-destructive/10 text-destructive"
                              aria-label="Delete draft"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Delete draft</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Draft</AlertDialogTitle>
              <AlertDialogDescription>
                This draft will be permanently removed. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  confirmDelete();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}