import React, { useState } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Plus, Edit3 } from "lucide-react"
import { cn } from "@/lib/dashboard/utils"
import { RemarksEditDialog } from "./RemarksEditDialog"

interface InlineRemarksEditorProps {
  initialValue: string
  onSave: (value: string) => void
  taskName?: string
  className?: string
}

export function InlineRemarksEditor({ 
  initialValue, 
  onSave,
  taskName,
  className 
}: InlineRemarksEditorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleSave = (value: string) => {
    onSave(value)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDialogOpen(true)
  }

  return (
    <div 
      className={cn("flex items-center gap-2", className)}
      onClick={(e) => e.stopPropagation()}
    >
      {initialValue ? (
        <div 
          className="flex items-center gap-1 cursor-pointer hover:text-purple-600 group"
          onClick={handleClick}
          title={`Click to edit remarks: ${initialValue}`}
        >
          <div className="max-w-32 truncate text-sm text-muted-foreground" title={initialValue}>
            {initialValue}
          </div>
          <Edit3 className="h-3 w-3 text-gray-400 dark:text-white group-hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-gray-400 dark:text-white hover:text-purple-600"
          onClick={handleClick}
          title="Add remarks"
        >
          <Plus className="h-3 w-3" />
        </Button>
      )}

      <RemarksEditDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialValue={initialValue}
        onSave={handleSave}
        taskName={taskName}
      />
    </div>
  )
}