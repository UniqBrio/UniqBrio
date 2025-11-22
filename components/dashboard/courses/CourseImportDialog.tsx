"use client"

import { useState } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/dashboard/ui/dialog"
import { Upload, Download, FileText, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/dashboard/ui/alert"

interface CourseImportDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete?: (importedCount: number) => void
}

export default function CourseImportDialog({ 
  isOpen, 
  onOpenChange, 
  onImportComplete 
}: CourseImportDialogProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
    count?: number
  }>({ type: null, message: '' })

  const downloadTemplate = () => {
    // Define the template structure with mandatory fields and instructions
    const templateHeaders = [
      'name',
      'instructor', 
      'description',
      'level',
      'type',
      'courseCategory',
      'location',
      'maxStudents',
      'priceINR',
      'tags',
      'studentGuidelines',
      'schedulePeriod_startDate',
      'schedulePeriod_endDate',
      'schedulePeriod_totalWeeks',
      'schedulePeriod_totalSessions',
      'sessionDetails_sessionDuration',
      'sessionDetails_sessionType'
    ]

    // Create instructions row that explains each field
    const instructionsRow = [
      'INSTRUCTIONS: Fill in the data below this row. Do not modify this instruction row.',
      'Required field - Name of the course',
      'Required field - Instructor name', 
      'Required field - Course description',
      'Required field - Beginner/Intermediate/Advanced',
      'Required field - Online/Offline/Hybrid',
      'Required field - Category like Sports, Arts, etc.',
      'Optional - Location for offline courses',
      'Required field - Maximum number of students',
      'Required field - Price in INR',
      'Optional - Comma separated tags',
      'Optional - Guidelines for students',
      'Optional - Start date (YYYY-MM-DD format)',
      'Optional - End date (YYYY-MM-DD format)', 
      'Optional - Total duration in weeks',
      'Optional - Total number of sessions',
      'Optional - Duration per session in minutes',
      'Optional - lecture/workshop/lab/exam'
    ]

    // Create sample data row
    const sampleDataRow = [
      'Advanced Yoga Training',
      'Dr. Sarah Johnson',
      'Comprehensive yoga training covering advanced techniques and meditation',
      'Advanced',
      'Offline',
      'Sports',
      'Yoga Studio A',
      '20',
      '15000',
      'yoga,advanced,meditation,fitness',
      'Please bring your own yoga mat and water bottle',
      '2025-11-01',
      '2025-12-31',
      '8',
      '24',
      '90',
      'workshop'
    ]

    // Convert to CSV format with headers first, then instructions, then sample data
    const csvContent = [templateHeaders, instructionsRow, sampleDataRow]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `course_import_template_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadStatus({ type: null, message: '' })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('importType', 'course')
      formData.append('saveAsDraft', 'true')

      const response = await fetch('/api/dashboard/services/courses/import', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        setUploadStatus({
          type: 'success',
          message: result.message || `Successfully imported ${result.imported} courses as drafts. ${result.skipped || 0} rows were skipped due to validation errors.`,
          count: result.imported
        })
        onImportComplete?.(result.imported)
      } else {
        setUploadStatus({
          type: 'error',
          message: result.error || 'Import failed. Please check your file format and try again.'
        })
      }
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: 'Network error occurred. Please try again.'
      })
    } finally {
      setIsUploading(false)
      // Reset file input
      event.target.value = ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import Courses
          </DialogTitle>
          <DialogDescription>
            Download the template, fill in your course data, and upload the completed file. 
            Imported courses will be saved as drafts for review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Alert */}
          {uploadStatus.type && (
            <Alert className={uploadStatus.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {uploadStatus.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={uploadStatus.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {uploadStatus.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Import Instructions:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>� Download the template file first</li>
              <li>� Fill in the required fields (marked in template)</li>
              <li>� Do not modify the header row</li>
              <li>� Course ID will be auto-generated</li>
              <li>� Imported courses are saved as drafts</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>

            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              <Button
                className="w-full flex items-center gap-2"
                disabled={isUploading}
              >
                <Upload className="h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Upload File'}
              </Button>
            </div>
          </div>

          {uploadStatus.type === 'success' && (
            <div className="flex justify-end">
              <Button onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}