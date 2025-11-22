
import React from "react";

import { Label } from "@/components/dashboard/ui/label"
import { Input } from "@/components/dashboard/ui/input"
import { Button } from "@/components/dashboard/ui/button"
import { Textarea } from "@/components/dashboard/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import { toast } from "@/hooks/dashboard/use-toast"
import { Plus, X, Trash2, Paperclip, ArrowUp, ArrowDown } from "lucide-react"

interface ChaptersTabProps {
  formData: any
  onFormChange: (field: string, value: any) => void
  showDeleteConfirmation?: (title: string, description: string, onConfirm: () => void, itemName: string, confirmButtonText?: string) => void
}

export default function ChaptersTab({ 
  formData, 
  onFormChange,
  showDeleteConfirmation = () => {}
}: ChaptersTabProps) {
  
  // Validation functions
  const validateChapterName = (name: string) => {
    // Allow letters, numbers, spaces, and common naming characters
    const nameRegex = /^[a-zA-Z0-9\s\-_()]*$/;
    return nameRegex.test(name);
  };

  const validateChapterDescription = (description: string) => {
    // Allow letters, numbers, spaces, and common punctuation
    const descRegex = /^[a-zA-Z0-9\s.,!?;:()\-_'"]*$/;
    return descRegex.test(description);
  };

  // State for common PDFs
  const [commonRefPdf, setCommonRefPdf] = React.useState<File | undefined>(undefined);
  const [commonAssignPdf, setCommonAssignPdf] = React.useState<File | undefined>(undefined);

  const updateChapters = (chapters: any[]) => {
    onFormChange('chapters', chapters);
  };

  // Always have at least one editable chapter row in the table
  const chapters = React.useMemo(() => {
    if (Array.isArray(formData?.chapters) && formData.chapters.length > 0) {
      return formData.chapters;
    }
    return [{ name: '', description: '', referencePdf: undefined, assignmentPdf: undefined }];
  }, [formData?.chapters]);

  return (
    <div className="space-y-2 compact-form">
      <div className="mb-2">
        <h4 className="font-medium mb-1 text-sm">Course Chapters <span className="text-xs px-1 py-0.5 rounded">(Sub Chapters will be coming soon)</span></h4>
        <div className="flex items-center gap-2 mb-2">
          <Label htmlFor="numChapters" className="text-xs">Number of Chapters</Label>
          <Input
            id="numChapters"
            type="number"
            min="1"
            value={formData.chapters?.length || 1}
            onKeyDown={e => {
              if (e.key === '-') {
                e.preventDefault();
              }
              // Allow clearing the field with backspace/delete
              if ((e.key === 'Backspace' || e.key === 'Delete') && e.currentTarget.value.length === 1) {
                const newChapters = Array(1).fill(null).map((_, i) => 
                  formData.chapters?.[i] || { name: '', description: '', referencePdf: undefined, assignmentPdf: undefined }
                );
                updateChapters(newChapters);
                e.preventDefault();
              }
            }}
            onChange={e => {
              const value = e.target.value;
              // Allow empty value for clearing, default to 1
              if (value === '') {
                const newChapters = Array(1).fill(null).map((_, i) => 
                  formData.chapters?.[i] || { name: '', description: '', referencePdf: undefined, assignmentPdf: undefined }
                );
                updateChapters(newChapters);
                return;
              }
              const num = Math.max(1, parseInt(value) || 1);
              const newChapters = Array(num).fill(null).map((_, i) => 
                formData.chapters?.[i] || { name: '', description: '', referencePdf: undefined, assignmentPdf: undefined }
              );
              updateChapters(newChapters);
            }}
            className="w-16 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-transparent"
          />
          <button
            type="button"
            className="ml-1 text-gray-600 hover:text-purple-600 p-1 rounded-full flex items-center gap-1 text-xs"
            onClick={() => document.getElementById('commonRefInput')?.click()}
            title="Overall reference PDF"
          >
            <Plus className="h-3 w-3" /> Reference PDF
          </button>
          <input
            id="commonRefInput"
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file && file.type === 'application/pdf') {
                setCommonRefPdf(file);
                toast({ title: 'Reference PDF added for all chapters!', description: file.name });
              } else if (file) {
                alert('Only PDF files are allowed.');
              }
            }}
          />
          {commonRefPdf && (
            <div className="inline-flex items-center gap-1 bg-green-50 px-1 py-0.5 rounded-md ml-1">
              <span className="text-xs font-medium text-green-700">{commonRefPdf.name}</span>
              <button
                type="button"
                className="text-red-500 hover:text-red-700 p-1 rounded-full"
                title="Remove Reference PDF for all chapters"
                onClick={() => {
                  showDeleteConfirmation(
                    "Remove Reference PDF (All Chapters)",
                    `Are you sure you want to remove the reference PDF for all chapters?`,
                    () => setCommonRefPdf(undefined),
                    commonRefPdf.name
                  );
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <button
            type="button"
            className="ml-1 text-gray-600 hover:text-blue-600 p-1 rounded-full flex items-center gap-1 text-xs"
            onClick={() => document.getElementById('commonAssignInput')?.click()}
            title="Overall Assignment PDF"
          >
            <Plus className="h-3 w-3" /> Assignment PDF
          </button>
          <input
            id="commonAssignInput"
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file && file.type === 'application/pdf') {
                setCommonAssignPdf(file);
                toast({ title: 'Assignment PDF added for all chapters!', description: file.name });
              } else if (file) {
                alert('Only PDF files are allowed.');
              }
            }}
          />
          {commonAssignPdf && (
            <div className="inline-flex items-center gap-1 bg-blue-50 px-1 py-0.5 rounded-md ml-1">
              <span className="text-xs font-medium text-blue-700">{commonAssignPdf.name}</span>
              <button
                type="button"
                className="text-red-500 hover:text-red-700 p-1 rounded-full"
                title="Remove Assignment PDF for all chapters"
                onClick={() => {
                  showDeleteConfirmation(
                    "Remove Assignment PDF (All Chapters)",
                    `Are you sure you want to remove the assignment PDF for all chapters?`,
                    () => setCommonAssignPdf(undefined),
                    commonAssignPdf.name
                  );
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
        
        <div
          className="overflow-x-auto"
          style={
            (formData.chapters?.length > 3)
              ? { maxHeight: 240, overflowY: 'auto', overflowX: 'auto' }
              : undefined
          }
        >
          <table className="min-w-full border border-gray-200 rounded-md bg-white text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-1 py-0.5 border-b text-left w-8">S.No.</th>
                <th className="px-1 py-0.5 border-b text-left w-40">Name</th>
                <th className="px-1 py-0.5 border-b text-left w-64">Description</th>
                <th className="px-1 py-0.5 border-b text-left w-32">Reference PDF</th>
                <th className="px-1 py-0.5 border-b text-left w-32">Assignment PDF</th>
              </tr>
            </thead>
            <tbody>
              {chapters.map((chapter: any, idx: number) => (
                <tr
                  key={`chapter-${idx}`}
                  className={`border-b hover:bg-gray-50 ${!!(chapter.name && chapter.description) ? 'cursor-move' : 'cursor-not-allowed'}`}
                  draggable={!!(chapter.name && chapter.description)}
                  onDragStart={e => {
                    e.dataTransfer.setData('chapterIdx', idx.toString());
                  }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    const fromIdx = Number(e.dataTransfer.getData('chapterIdx'));
                    if (fromIdx === idx) return;
                    const updated = [...chapters];
                    const moved = updated.splice(fromIdx, 1)[0];
                    updated.splice(idx, 0, moved);
                    updateChapters(updated);
                  }}
                  title={!(chapter.name && chapter.description) ? 'Please fill in both Name and Description to enable reordering.' : 'Drag to reorder'}
                >
                  <td className="px-1 py-0.5 font-bold align-top whitespace-nowrap">{idx + 1}</td>
                  <td className="px-1 py-0.5 align-top">
                    <Input
                      type="text"
                      value={chapter.name || ''}
                      onChange={e => {
                        const newValue = e.target.value;
                        if (newValue === '' || validateChapterName(newValue)) {
                          const updated = [...chapters];
                          updated[idx] = { ...chapter, name: newValue };
                          updateChapters(updated);
                        } else {
                          toast({ 
                            title: 'Invalid Chapter Name', 
                            description: 'Chapter name can only contain letters, numbers, spaces, hyphens, underscores, and parentheses.',
                            variant: 'destructive'
                          });
                        }
                      }}
                      placeholder="Chapter Name (letters, numbers, spaces, -, _, () only)"
                      className="w-full border border-gray-300 rounded-md px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-transparent"
                    />
                  </td>
                  <td className="px-1 py-0.5 align-top">
                    <Textarea
                      value={chapter.description || ''}
                      onChange={e => {
                        const newValue = e.target.value;
                        if (newValue === '' || validateChapterDescription(newValue)) {
                          const updated = [...chapters];
                          updated[idx] = { ...chapter, description: newValue };
                          updateChapters(updated);
                        } else {
                          toast({ 
                            title: 'Invalid Chapter Description', 
                            description: 'Chapter description can only contain letters, numbers, spaces, and basic punctuation marks.',
                            variant: 'destructive'
                          });
                        }
                      }}
                      placeholder="Chapter Description (letters, numbers, basic punctuation only)"
                      className="w-full border border-gray-300 rounded-md px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-transparent"
                      rows={2}
                    />
                  </td>
                  <td className="px-1 py-0.5 align-top">
                    <button
                      type="button"
                      className="text-gray-600 hover:text-purple-600 p-1 rounded-full"
                      onClick={() => document.getElementById(`chapterRefInput${idx}`)?.click()}
                      title="Attach Reference PDF"
                    >
                      <Paperclip className="h-3 w-3" />
                    </button>
                    <input
                      id={`chapterRefInput${idx}`}
                      type="file"
                      accept="application/pdf"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file && file.type === 'application/pdf') {
                          const updated = [...chapters];
                          updated[idx] = { ...chapter, referencePdf: file };
                          updateChapters(updated);
                          toast({ title: 'Reference PDF added!', description: file.name });
                        } else if (file) {
                          alert('Only PDF files are allowed.');
                        }
                      }}
                    />
                    {chapter.referencePdf && (
                      <div className="flex items-center gap-1 bg-green-50 px-1 py-0.5 rounded-md mt-1">
                        <span className="text-xs font-medium text-green-700">{chapter.referencePdf.name}</span>
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700 p-1 rounded-full"
                          title="Remove Reference PDF"
                          onClick={() => {
                            showDeleteConfirmation(
                              "Remove Reference PDF",
                              `Are you sure you want to remove the reference PDF for chapter ${chapter.name || idx + 1}?`,
                              () => {
                                const updated = [...chapters];
                                updated[idx] = { ...chapter, referencePdf: undefined };
                                updateChapters(updated);
                              },
                              chapter.referencePdf?.name || `Reference PDF for Chapter ${idx + 1}`
                            );
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-1 py-0.5 align-top">
                    <button
                      type="button"
                      className="text-gray-600 hover:text-blue-600 p-1 rounded-full"
                      onClick={() => document.getElementById(`chapterAssignInput${idx}`)?.click()}
                      title="Attach Assignment PDF"
                    >
                      <Paperclip className="h-3 w-3" />
                    </button>
                    <input
                      id={`chapterAssignInput${idx}`}
                      type="file"
                      accept="application/pdf"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file && file.type === 'application/pdf') {
                          const updated = [...chapters];
                          updated[idx] = { ...chapter, assignmentPdf: file };
                          updateChapters(updated);
                          toast({ title: 'Assignment PDF added!', description: file.name });
                        } else if (file) {
                          alert('Only PDF files are allowed.');
                        }
                      }}
                    />
                    {chapter.assignmentPdf && (
                      <div className="flex items-center gap-1 bg-blue-50 px-1 py-0.5 rounded-md mt-1">
                        <span className="text-xs font-medium text-blue-700">{chapter.assignmentPdf.name}</span>
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700 p-1 rounded-full"
                          title="Remove Assignment PDF"
                          onClick={() => {
                            showDeleteConfirmation(
                              "Remove Assignment PDF",
                              `Are you sure you want to remove the assignment PDF for chapter ${chapter.name || idx + 1}?`,
                              () => {
                                const updated = [...chapters];
                                updated[idx] = { ...chapter, assignmentPdf: undefined };
                                updateChapters(updated);
                              },
                              chapter.assignmentPdf?.name || `Assignment PDF for Chapter ${idx + 1}`
                            );
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-1 py-0.5 align-top flex flex-col items-center gap-0.5 min-w-[32px]">
                    <div className="flex flex-row gap-0.5">
                      <button
                        type="button"
                        className={`p-1 rounded-full ${idx === 0 || !(chapter.name && chapter.description) ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                        title={idx === 0 ? 'Cannot move first item up' : !(chapter.name && chapter.description) ? 'Please fill in Name and Description to enable reordering.' : 'Move Up'}
                        disabled={idx === 0 || !(chapter.name && chapter.description)}
                        onClick={() => {
                          if (idx === 0) return;
                          const updated = [...chapters];
                          const temp = updated[idx - 1];
                          updated[idx - 1] = updated[idx];
                          updated[idx] = temp;
                          updateChapters(updated);
                        }}
                      >
                        <ArrowUp className="h-3 w-3 text-gray-500" />
                      </button>
                      <button
                        type="button"
                        className={`p-1 rounded-full ${idx === (chapters.length - 1) || !(chapter.name && chapter.description) ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                        title={idx === chapters.length - 1 ? 'Cannot move last item down' : !(chapter.name && chapter.description) ? 'Please fill in Name and Description to enable reordering.' : 'Move Down'}
                        disabled={idx === (chapters.length - 1) || !(chapter.name && chapter.description)}
                        onClick={() => {
                          if (idx === (chapters.length - 1)) return;
                          const updated = [...chapters];
                          const temp = updated[idx + 1];
                          updated[idx + 1] = updated[idx];
                          updated[idx] = temp;
                          updateChapters(updated);
                        }}
                      >
                        <ArrowDown className="h-3 w-3 text-gray-500" />
                      </button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="text-red-500 hover:text-red-700 px-2 py-1 rounded-full ml-2"
                              onClick={() => {
                                showDeleteConfirmation(
                                  "Delete Chapter",
                                  "Are you sure you want to delete this chapter? This will remove all associated content and cannot be undone.",
                                  () => {
                                    updateChapters(chapters.filter((_: any, i: number) => i !== idx));
                                  },
                                  chapter.name || `Chapter ${idx + 1}`
                                );
                              }}
                              aria-label="Delete Chapter"
                            >
                              <Trash2 className="mr-1 h-3 w-3 text-purple-500" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Delete Chapter</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      
      </div>
    </div>
  )
} 