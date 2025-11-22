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
import { Label } from "@/components/dashboard/ui/label"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/dashboard/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Badge } from "@/components/dashboard/ui/badge"
import { Download, FileText, Filter } from "lucide-react"

interface Session {
  id: string
  serviceId: string
  timeFrom: string
  timeTo: string
  days: string[]
  instructor: string
  location: string
}

interface Service {
  id: string
  name: string
  category: string
  status: "Active" | "Inactive"
  instructor: string
  capacity: number
  enrolled: number
  price: number
  startDate: Date
  endDate: Date
  level: string
  location: string
  description: string
  mode: "Online" | "Offline"
  timeSlot: string
  branch: string
  tags: string[]
  sessions: Session[]
}

interface ExportOptions {
  format: "csv" | "json" | "excel"
  includeColumns: string[]
  statusFilter: "all" | "active" | "inactive"
  categoryFilter: string
  dateRange: "all" | "current" | "upcoming"
}

interface ServiceExportDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  services: Service[]
  onExport: (services: Service[], options: ExportOptions) => Promise<void>
}

const AVAILABLE_COLUMNS = [
  { id: "id", label: "Service ID", required: true },
  { id: "name", label: "Service Name", required: true },
  { id: "category", label: "Category" },
  { id: "status", label: "Status" },
  { id: "instructor", label: "Instructor" },
  { id: "capacity", label: "Capacity" },
  { id: "enrolled", label: "Enrolled Students" },
  { id: "price", label: "Price" },
  { id: "startDate", label: "Start Date" },
  { id: "endDate", label: "End Date" },
  { id: "level", label: "Level" },
  { id: "location", label: "Location" },
  { id: "description", label: "Description" },
  { id: "mode", label: "Mode" },
  { id: "timeSlot", label: "Time Slot" },
  { id: "branch", label: "Branch" },
  { id: "tags", label: "Tags" },
]

export default function ServiceExportDialog({
  isOpen,
  onOpenChange,
  services,
  onExport,
}: ServiceExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "csv",
    includeColumns: ["id", "name", "category", "status", "instructor", "capacity", "enrolled", "price"],
    statusFilter: "all",
    categoryFilter: "all",
    dateRange: "all",
  })

  const categories = Array.from(new Set(services.map(service => service.category)))
  
  const filteredServices = services.filter(service => {
    // Status filter
    if (exportOptions.statusFilter !== "all") {
      const statusMatch = exportOptions.statusFilter === "active" 
        ? service.status === "Active" 
        : service.status === "Inactive"
      if (!statusMatch) return false
    }

    // Category filter
    if (exportOptions.categoryFilter !== "all" && service.category !== exportOptions.categoryFilter) {
      return false
    }

    // Date range filter
    if (exportOptions.dateRange !== "all") {
      const now = new Date()
      const serviceStart = new Date(service.startDate)
      const serviceEnd = new Date(service.endDate)
      
      if (exportOptions.dateRange === "current") {
        if (!(serviceStart <= now && serviceEnd >= now)) return false
      } else if (exportOptions.dateRange === "upcoming") {
        if (serviceStart <= now) return false
      }
    }

    return true
  })

  const handleColumnToggle = (columnId: string, checked: boolean) => {
    if (checked) {
      setExportOptions(prev => ({
        ...prev,
        includeColumns: [...prev.includeColumns, columnId]
      }))
    } else {
      const column = AVAILABLE_COLUMNS.find(col => col.id === columnId)
      if (column?.required) return // Don't allow unchecking required columns
      
      setExportOptions(prev => ({
        ...prev,
        includeColumns: prev.includeColumns.filter(col => col !== columnId)
      }))
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await onExport(filteredServices, exportOptions)
    } catch (error) {
      console.error("Export error:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleClose = () => {
    setIsExporting(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Services
          </DialogTitle>
          <DialogDescription>
            Configure export settings and download your services data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Summary */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-blue-900 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Export Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="bg-white">
                  Total Services: {services.length}
                </Badge>
                <Badge variant="outline" className="bg-white">
                  Filtered: {filteredServices.length}
                </Badge>
                <Badge variant="outline" className="bg-white">
                  Columns: {exportOptions.includeColumns.length}
                </Badge>
                <Badge variant="outline" className="bg-white">
                  Format: {exportOptions.format.toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Export Format */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export Format</CardTitle>
              <CardDescription>Choose the file format for your export</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={exportOptions.format}
                onValueChange={(value: "csv" | "json" | "excel") =>
                  setExportOptions(prev => ({ ...prev, format: value }))
                }
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv">CSV</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="excel" id="excel" />
                  <Label htmlFor="excel">Excel</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="json" id="json" />
                  <Label htmlFor="json">JSON</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
              <CardDescription>Filter which services to include in the export</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Filter */}
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <RadioGroup
                  value={exportOptions.statusFilter}
                  onValueChange={(value: "all" | "active" | "inactive") =>
                    setExportOptions(prev => ({ ...prev, statusFilter: value }))
                  }
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="status-all" />
                    <Label htmlFor="status-all">All</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="active" id="status-active" />
                    <Label htmlFor="status-active">Active Only</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="inactive" id="status-inactive" />
                    <Label htmlFor="status-inactive">Inactive Only</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Category Filter */}
              <div>
                <Label className="text-sm font-medium">Category</Label>
                <RadioGroup
                  value={exportOptions.categoryFilter}
                  onValueChange={(value: string) =>
                    setExportOptions(prev => ({ ...prev, categoryFilter: value }))
                  }
                  className="flex flex-wrap gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="category-all" />
                    <Label htmlFor="category-all">All Categories</Label>
                  </div>
                  {categories.map(category => (
                    <div key={category} className="flex items-center space-x-2">
                      <RadioGroupItem value={category} id={`category-${category}`} />
                      <Label htmlFor={`category-${category}`}>{category}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Date Range Filter */}
              <div>
                <Label className="text-sm font-medium">Date Range</Label>
                <RadioGroup
                  value={exportOptions.dateRange}
                  onValueChange={(value: "all" | "current" | "upcoming") =>
                    setExportOptions(prev => ({ ...prev, dateRange: value }))
                  }
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="date-all" />
                    <Label htmlFor="date-all">All</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="current" id="date-current" />
                    <Label htmlFor="date-current">Current</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="upcoming" id="date-upcoming" />
                    <Label htmlFor="date-upcoming">Upcoming</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Column Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Include Columns</CardTitle>
              <CardDescription>Select which columns to include in the export</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {AVAILABLE_COLUMNS.map(column => (
                  <div key={column.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.id}
                      checked={exportOptions.includeColumns.includes(column.id)}
                      onCheckedChange={(checked) => 
                        handleColumnToggle(column.id, checked as boolean)
                      }
                      disabled={column.required}
                    />
                    <Label 
                      htmlFor={column.id} 
                      className={`text-sm ${column.required ? "font-medium" : ""}`}
                    >
                      {column.label}
                      {column.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                * Required columns cannot be deselected
              </p>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || filteredServices.length === 0}
          >
            {isExporting ? "Exporting..." : `Export ${filteredServices.length} Service${filteredServices.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
