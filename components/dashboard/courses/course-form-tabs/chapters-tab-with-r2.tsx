import React from "react";
import { Label } from "@/components/dashboard/ui/label"
import { Input } from "@/components/dashboard/ui/input"
import { Button } from "@/components/dashboard/ui/button"
import { Textarea } from "@/components/dashboard/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import { toast } from "@/hooks/dashboard/use-toast"
import FileUploadComponent from "@/components/dashboard/ui/file-upload"
import { Plus, X, Trash2, Paperclip, ArrowUp, ArrowDown, Upload, File } from "lucide-react"

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
    const nameRegex = /^[a-zA-Z0-9\s\-_()]*$/;
    return nameRegex.test(name);
  };

  const validateChapterDescription = (description: string) => {
    const descRegex = /^[a-zA-Z0-9\s.,!?;:()\-_'"]*$/;
    return descRegex.test(description);
  };

  const updateChapters = (chapters: any[]) => {
    onFormChange('chapters', chapters);
  };

  // Always have at least one editable chapter row in the table
  const chapters = React.useMemo(() => {
    if (Array.isArray(formData?.chapters) && formData.chapters.length > 0) {
      return formData.chapters;
    }
    return [{ name: '', description: '', referencePdf: null, assignmentPdf: null }];
  }, [formData?.chapters]);

  const handleFileUpload = (chapterIndex: number, fileType: 'referencePdf' | 'assignmentPdf') => {
    return (uploadData: any) => {
      const updatedChapters = [...chapters];
      updatedChapters[chapterIndex] = {
        ...updatedChapters[chapterIndex],
        [fileType]: {
          key: uploadData.key,
          url: uploadData.url,
          name: uploadData.originalName,
          size: uploadData.size
        }
      };
      updateChapters(updatedChapters);
    };
  };

  const handleRemoveFile = (chapterIndex: number, fileType: 'referencePdf' | 'assignmentPdf') => {
    const updatedChapters = [...chapters];
    updatedChapters[chapterIndex] = {
      ...updatedChapters[chapterIndex],
      [fileType]: null
    };
    updateChapters(updatedChapters);
  };

  const addChapter = () => {
    const newChapters = [...chapters, { name: '', description: '', referencePdf: null, assignmentPdf: null }];
    updateChapters(newChapters);
  };

  const removeChapter = (index: number) => {
    if (chapters.length <= 1) {
      // Keep at least one chapter
      updateChapters([{ name: '', description: '', referencePdf: null, assignmentPdf: null }]);
    } else {
      const newChapters = chapters.filter((_: any, i: number) => i !== index);
      updateChapters(newChapters);
    }
  };

  const moveChapter = (index: number, direction: 'up' | 'down') => {
    const newChapters = [...chapters];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < chapters.length) {
      [newChapters[index], newChapters[targetIndex]] = [newChapters[targetIndex], newChapters[index]];
      updateChapters(newChapters);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Course Chapters</Label>
          <p className="text-xs text-gray-500 dark:text-white mt-1">
            Add chapters to organize your course content. You can attach reference materials and assignments.
          </p>
        </div>
        <Button
          type="button"
          onClick={addChapter}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Chapter
        </Button>
      </div>

      <div className="space-y-4">
        {chapters.map((chapter: any, index: number) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded">
                  Chapter {index + 1}
                </span>
                <div className="flex space-x-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => moveChapter(index, 'up')}
                    disabled={index === 0}
                    className="h-6 w-6 p-0"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => moveChapter(index, 'down')}
                    disabled={index === chapters.length - 1}
                    className="h-6 w-6 p-0"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => removeChapter(index)}
                className="text-red-600 hover:text-red-800 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Chapter Name</Label>
                <Input
                  type="text"
                  value={chapter.name || ''}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    if (newValue === '' || validateChapterName(newValue)) {
                      const updated = [...chapters];
                      updated[index] = { ...chapter, name: newValue };
                      updateChapters(updated);
                    } else {
                      toast({ 
                        title: 'Invalid Chapter Name', 
                        description: 'Chapter name can only contain letters, numbers, spaces, hyphens, underscores, and parentheses.',
                        variant: 'destructive'
                      });
                    }
                  }}
                  placeholder="Enter chapter name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Description</Label>
                <Textarea
                  value={chapter.description || ''}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    if (newValue === '' || validateChapterDescription(newValue)) {
                      const updated = [...chapters];
                      updated[index] = { ...chapter, description: newValue };
                      updateChapters(updated);
                    } else {
                      toast({ 
                        title: 'Invalid Description', 
                        description: 'Description contains invalid characters.',
                        variant: 'destructive'
                      });
                    }
                  }}
                  placeholder="Enter chapter description"
                  className="mt-1 h-20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Reference PDF Upload */}
              <div>
                <Label className="text-sm font-medium">Reference Material</Label>
                {chapter.referencePdf ? (
                  <div className="mt-2 p-2 bg-gray-50 rounded border flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <File className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-700 dark:text-white">{chapter.referencePdf.name}</span>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(chapter.referencePdf.url, '_blank')}
                      >
                        View
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveFile(index, 'referencePdf')}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <FileUploadComponent
                      onUploadSuccess={handleFileUpload(index, 'referencePdf')}
                      uploadOptions={{
                        courseId: formData.id,
                        category: 'reference-materials',
                        makePublic: true
                      }}
                      accept={{
                        'application/pdf': ['.pdf'],
                        'application/msword': ['.doc'],
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
                      }}
                      maxSize={10 * 1024 * 1024} // 10MB
                      multiple={false}
                      className="border-dashed border-gray-300 rounded p-2"
                      showPreview={false}
                    />
                  </div>
                )}
              </div>

              {/* Assignment PDF Upload */}
              <div>
                <Label className="text-sm font-medium">Assignment</Label>
                {chapter.assignmentPdf ? (
                  <div className="mt-2 p-2 bg-gray-50 rounded border flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <File className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-700 dark:text-white">{chapter.assignmentPdf.name}</span>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(chapter.assignmentPdf.url, '_blank')}
                      >
                        View
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveFile(index, 'assignmentPdf')}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <FileUploadComponent
                      onUploadSuccess={handleFileUpload(index, 'assignmentPdf')}
                      uploadOptions={{
                        courseId: formData.id,
                        category: 'assignments',
                        makePublic: true
                      }}
                      accept={{
                        'application/pdf': ['.pdf'],
                        'application/msword': ['.doc'],
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
                      }}
                      maxSize={10 * 1024 * 1024} // 10MB
                      multiple={false}
                      className="border-dashed border-gray-300 rounded p-2"
                      showPreview={false}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {chapters.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 dark:text-white mb-4">No chapters added yet</p>
          <Button onClick={addChapter} className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add First Chapter
          </Button>
        </div>
      )}
    </div>
  );
}