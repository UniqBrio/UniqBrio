"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog"
import { Button } from "@/components/dashboard/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Badge } from "@/components/dashboard/ui/badge"
import { Copy, Download, CheckCircle, AlertTriangle, Info } from "lucide-react"
import { useToast } from "@/hooks/dashboard/use-toast"

interface CSVColumnMappingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  detectedHeaders?: string[]
  onRetry?: () => void
}

// Expected column format with descriptions
const EXPECTED_COLUMNS = [
  {
    name: "ID",
    description: "Unique instructor identifier (e.g., INSTR0001)",
    required: true,
    examples: ["INSTR0001", "EMP001", "STAFF123"]
  },
  {
    name: "Name", 
    description: "Full name of the instructor",
    required: true,
    examples: ["Mr. John Smith", "Dr. Jane Doe", "Ms. Sarah Wilson"]
  },
  {
    name: "Job Level",
    description: "Position level (Junior Staff, Senior Staff, Manager)",
    required: true,
    examples: ["Junior Staff", "Senior Staff", "Manager", "Assistant Professor"]
  },
  {
    name: "Contract Type",
    description: "Employment type",
    required: true,
    examples: ["Permanent", "Temporary", "Full-time", "Part-time"]
  },
  {
    name: "Leave Type",
    description: "Type of leave being requested",
    required: false,
    examples: ["Casual Leave", "Sick Leave", "Planned Leave", "Emergency Leave"]
  },
  {
    name: "Reason",
    description: "Reason for leave request",
    required: false,
    examples: ["Personal leave", "Medical appointment", "Family vacation"]
  },
  {
    name: "Start Date",
    description: "Leave start date (YYYY-MM-DD format preferred)",
    required: true,
    examples: ["2025-10-04", "04-10-2025", "10/04/2025"]
  },
  {
    name: "End Date",
    description: "Leave end date (YYYY-MM-DD format preferred)", 
    required: true,
    examples: ["2025-10-04", "04-10-2025", "10/04/2025"]
  },
  {
    name: "Approved Date",
    description: "Date when leave was approved",
    required: false,
    examples: ["2025-10-04", "04-10-2025", "10/04/2025"]
  },
  {
    name: "Status",
    description: "Leave request status",
    required: false,
    examples: ["APPROVED", "PENDING", "REJECTED"]
  },
  {
    name: "No. of days",
    description: "Number of leave days (calculated automatically if not provided)",
    required: false,
    examples: ["1", "3", "5"]
  },
  {
    name: "Balance",
    description: "Remaining leave balance (used as fallback if policy allocation unavailable)",
    required: false,
    examples: ["15", "20", "12"]
  }
]

export default function CSVColumnMappingDialog({ 
  open, 
  onOpenChange, 
  detectedHeaders = [],
  onRetry 
}: CSVColumnMappingDialogProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const expectedHeadersText = EXPECTED_COLUMNS.map(col => col.name).join(",")
  const sampleCSVData = `ID,Name,Job Level,Contract Type,Leave Type,Reason,Start Date,End Date,Approved Date,Status,No. of days,Balance
INSTR0001,Mr. John Smith,Senior Staff,Permanent,Casual Leave,Personal leave,2025-10-04,2025-10-04,2025-10-04,APPROVED,1,15
INSTR0002,Ms. Jane Doe,Junior Staff,Permanent,Sick Leave,Medical appointment,2025-10-05,2025-10-07,2025-10-05,APPROVED,3,12`

  const handleCopyHeaders = async () => {
    try {
      await navigator.clipboard.writeText(expectedHeadersText)
      setCopied(true)
      toast({
        title: "Headers copied!",
        description: "Expected column headers have been copied to your clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please manually copy the headers from the text above.",
        variant: "destructive"
      })
    }
  }

  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleCSVData], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'leave-import-template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Template downloaded",
      description: "CSV template has been saved to your downloads folder.",
    })
  }

  const getColumnStatus = (expectedCol: string) => {
    if (!detectedHeaders.length) return 'unknown'
    
    const lowerExpected = expectedCol.toLowerCase()
    const hasExactMatch = detectedHeaders.some(h => h.toLowerCase() === lowerExpected)
    const hasPartialMatch = detectedHeaders.some(h => 
      h.toLowerCase().includes(lowerExpected) || lowerExpected.includes(h.toLowerCase())
    )
    
    if (hasExactMatch) return 'exact'
    if (hasPartialMatch) return 'partial'
    return 'missing'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            CSV Column Format Issues
          </DialogTitle>
          <DialogDescription>
            Your CSV file might have column naming issues that prevent proper data import. 
            Please ensure your CSV uses the exact column names shown below for best results.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Detected vs Expected */}
          {detectedHeaders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Column Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-red-600">Detected Headers:</h4>
                    <div className="text-sm bg-red-50 p-3 rounded border">
                      {detectedHeaders.join(", ")}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-green-600">Expected Headers:</h4>
                    <div className="text-sm bg-green-50 p-3 rounded border">
                      {expectedHeadersText}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleCopyHeaders} className="flex items-center gap-2">
              {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy Headers"}
            </Button>
            
            <Button onClick={handleDownloadTemplate} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>

          {/* Expected Column Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Expected Column Format</CardTitle>
              <p className="text-sm text-muted-foreground">
                Use these exact column names in your CSV header row. Required columns are marked with red badges.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {EXPECTED_COLUMNS.map((column) => {
                  const status = getColumnStatus(column.name)
                  return (
                    <div key={column.name} className="flex items-start gap-3 p-3 border rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                            {column.name}
                          </code>
                          
                          {column.required && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                          
                          {detectedHeaders.length > 0 && (
                            <Badge 
                              variant={status === 'exact' ? 'default' : status === 'partial' ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {status === 'exact' ? '? Found' : status === 'partial' ? '~ Similar' : '? Missing'}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {column.description}
                        </p>
                        
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Examples: </span>
                          <span className="text-xs text-muted-foreground">
                            {column.examples.join(", ")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4" />
                How to Fix Your CSV
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Copy the expected headers using the button above</li>
                <li>Open your CSV file in Excel, Google Sheets, or a text editor</li>
                <li>Replace the first row (header row) with the copied headers</li>
                <li>Ensure your data columns match the order of the expected headers</li>
                <li>Save the file and try importing again</li>
                <li>Alternatively, download the template and copy your data into it</li>
              </ol>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {onRetry && (
              <Button onClick={() => { onOpenChange(false); onRetry() }}>
                Try Again
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
