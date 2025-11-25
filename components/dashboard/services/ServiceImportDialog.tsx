"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dashboard/ui/dialog"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Label } from "@/components/dashboard/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/dashboard/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Badge } from "@/components/dashboard/ui/badge"
import { Separator } from "@/components/dashboard/ui/separator"
import { Upload, FileText, AlertCircle, CheckCircle, Download } from "lucide-react"

interface ImportResult {
  total: number
  successful: number
  failed: number
  errors: string[]
}

interface ServiceImportDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onImport: (file: File) => Promise<ImportResult>
}

export default function ServiceImportDialog({
  isOpen,
  onOpenChange,
  onImport,
}: ServiceImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImportResult(null)
    }
  }

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true)
    } else if (event.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)
    
    const file = event.dataTransfer.files?.[0]
    if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
      setSelectedFile(file)
      setImportResult(null)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    setIsImporting(true)
    try {
      const result = await onImport(selectedFile)
      setImportResult(result)
    } catch (error) {
      console.error("Import error:", error)
      setImportResult({
        total: 0,
        successful: 0,
        failed: 1,
        errors: ["Failed to import file. Please check the file format and try again."],
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setImportResult(null)
    setIsImporting(false)
    onOpenChange(false)
  }

  const downloadTemplate = () => {
    const headers = [
      "name",
      "category",
      "instructor",
      "capacity",
      "price",
      "startDate",
      "endDate",
      "level",
      "location",
      "description",
      "mode",
      "timeSlot",
      "branch",
      "tags",
    ]
    
    const sampleData = [
      "Math Fundamentals",
      "Mathematics",
      "Dr. Smith",
      "30",
      "299",
      "2024-02-01",
      "2024-05-01",
      "Beginner",
      "Room 101",
      "Basic mathematics course covering fundamental concepts",
      "Offline",
      "9:00 AM - 11:00 AM",
      "Main Campus",
      "math,fundamentals,beginner",
    ]

    const csvContent = [headers.join(","), sampleData.join(",")].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "services_template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Services
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple services at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">CSV Template</CardTitle>
              <CardDescription>
                Download the template to see the required format for importing services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={downloadTemplate} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download CSV Template
              </Button>
            </CardContent>
          </Card>

          <Separator />

          {/* File Upload */}
          <div className="space-y-4">
            <Label htmlFor="file-upload" className="text-base font-medium">
              Upload CSV File
            </Label>
            
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-white" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                      Drop your CSV file here, or{" "}
                      <span className="text-blue-600 hover:text-blue-500">browse</span>
                    </span>
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept="text/csv,.csv"
                    className="sr-only"
                    onChange={handleFileSelect}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-white">CSV files only, up to 10MB</p>
              </div>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 dark:text-white">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>

          {/* Import Result */}
          {importResult && (
            <Alert className={importResult.failed > 0 ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Import Complete</AlertTitle>
              <AlertDescription className="space-y-2">
                <div className="flex gap-4 text-sm">
                  <Badge variant="outline" className="bg-white">
                    Total: {importResult.total}
                  </Badge>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Success: {importResult.successful}
                  </Badge>
                  {importResult.failed > 0 && (
                    <Badge variant="outline" className="bg-red-100 text-red-800">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Failed: {importResult.failed}
                    </Badge>
                  )}
                </div>
                
                {importResult.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-red-800 mb-1">Errors:</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      {importResult.errors.map((error, index) => (
                        <li key={index} className="list-disc list-inside">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Format Requirements */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-blue-900">Format Requirements</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-800 space-y-2">
              <ul className="space-y-1">
                <li>� CSV file with comma-separated values</li>
                <li>� First row must contain column headers</li>
                <li>� Required columns: name, category, instructor, capacity, price</li>
                <li>� Date format: YYYY-MM-DD (e.g., 2024-01-15)</li>
                <li>� Tags should be comma-separated within the cell</li>
                <li>� Mode should be either "Online" or "Offline"</li>
                <li>� Status will default to "Active" for all imported services</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
          >
            {isImporting ? "Importing..." : "Import Services"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
