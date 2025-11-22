"use client"

import { Button } from "@/components/dashboard/ui/button"
import { Plus, Upload, Download } from "lucide-react"

interface ServicesHeaderProps {
  onAddService: () => void
  onImport: () => void
  onExport: () => void
}

export default function ServicesHeader({ onAddService, onImport, onExport }: ServicesHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold text-purple-700">Services</h1>
        <p className="text-gray-500">Manage your arts and sports classes</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onAddService}>
          <Plus className="mr-2 h-4 w-4" /> Add Service
        </Button>
        <Button variant="outline" onClick={onImport}>
          <Upload className="mr-2 h-4 w-4" /> Import
        </Button>
        <Button variant="outline" onClick={onExport}>
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
      </div>
    </div>
  )
}
