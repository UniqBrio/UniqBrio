"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Badge } from "@/components/dashboard/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/dashboard/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/dashboard/ui/table"
import {
  Users, Plus, Search, Filter, Calendar, MapPin,
  Clock, UserPlus, UserMinus, Edit, Trash2, X, List, Grid3X3
} from "lucide-react"
import CohortManagement from "./CohortManagement"
import { ColumnSelectorModal } from "@/components/dashboard/ui/ColumnSelectorModal"
import { useColumnManagement } from "@/hooks/dashboard/useColumnManagement"

interface Cohort {
  id: string;
  name: string;
  courseId: string;
  notes: string;
  status: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  capacity: number;
  members: { id: string; name: string; }[];
  location?: string;
  instructorName?: string;
}

interface CohortsTabProps {
  cohorts: Cohort[]
  courses: any[]
  onAddCohort?: () => void
  onEditCohort?: (cohort: Cohort) => void
  onDeleteCohort?: (cohort: Cohort) => void
}

export default function CohortsTab({
  cohorts,
  courses,
  onAddCohort,
  onEditCohort,
  onDeleteCohort
}: CohortsTabProps) {
  function GridIcon({ className = "w-6 h-6" }) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="5" height="5" rx="1.5" fill="#7C3AED" />
        <rect x="10" y="3" width="5" height="5" rx="1.5" fill="#7C3AED" />
        <rect x="17" y="3" width="5" height="5" rx="1.5" fill="#7C3AED" />
        <rect x="3" y="10" width="5" height="5" rx="1.5" fill="#7C3AED" />
        <rect x="10" y="10" width="5" height="5" rx="1.5" fill="#7C3AED" />
        <rect x="17" y="10" width="5" height="5" rx="1.5" fill="#7C3AED" />
        <rect x="3" y="17" width="5" height="5" rx="1.5" fill="#7C3AED" />
        <rect x="10" y="17" width="5" height="5" rx="1.5" fill="#7C3AED" />
        <rect x="17" y="17" width="5" height="5" rx="1.5" fill="#7C3AED" />
      </svg>
    );
  }
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  
  // Column management
  const columnManagement = useColumnManagement('cohorts')

  const filteredCohorts = cohorts.filter(cohort =>
    cohort.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cohort.courseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cohort.instructorName && cohort.instructorName.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getCourseName = (courseId: string) => {
    const course = courses.find(c => c.id === courseId || c.courseId === courseId)
    return course ? course.name : 'Unknown Course'
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800 dark:text-white'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800 dark:text-white'
    }
  }

  // Column configuration for table view
  const columnConfig = {
    name: { label: 'Cohort Name', render: (cohort: Cohort) => cohort.name },
    courseName: { label: 'Course Name', render: (cohort: Cohort) => getCourseName(cohort.courseId) },
    status: { 
      label: 'Status', 
      render: (cohort: Cohort) => (
        <Badge className={getStatusColor(cohort.status)}>
          {cohort.status}
        </Badge>
      )
    },
    capacity: { label: 'Capacity', render: (cohort: Cohort) => cohort.capacity },
    members: { label: 'Members', render: (cohort: Cohort) => `${cohort.members.length}/${cohort.capacity}` },
    instructorName: { label: 'Instructor', render: (cohort: Cohort) => cohort.instructorName || '-' },
    location: { label: 'Location', render: (cohort: Cohort) => cohort.location || '-' },
    startDate: { 
      label: 'Start Date', 
      render: (cohort: Cohort) => cohort.startDate ? format(new Date(cohort.startDate), "dd-MMM-yy") : '-' 
    },
    endDate: { 
      label: 'End Date', 
      render: (cohort: Cohort) => cohort.endDate ? format(new Date(cohort.endDate), "dd-MMM-yy") : '-' 
    },
    startTime: { label: 'Start Time', render: (cohort: Cohort) => cohort.startTime || '-' },
    endTime: { label: 'End Time', render: (cohort: Cohort) => cohort.endTime || '-' },
    notes: { label: 'Notes', render: (cohort: Cohort) => cohort.notes ? `${cohort.notes.substring(0, 50)}...` : '-' }
  }

  const handleViewCohort = (cohort: Cohort) => {
    setSelectedCohort(cohort)
    setIsViewDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Cohort Management Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cohort Management</h2>
          <p className="text-muted-foreground">
            Organize students into groups and manage class schedules
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`rounded-r-none ${viewMode === "grid" ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}`}
              title="Grid View"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={`rounded-l-none border-l ${viewMode === "list" ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Button onClick={onAddCohort} className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add Cohort
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white h-4 w-4" />
          <Input
            placeholder="Search cohorts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Results Counter */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <span className="text-sm font-medium text-purple-700">
            {filteredCohorts.length} cohort{filteredCohorts.length !== 1 ? 's' : ''} found
          </span>
        </div>
        {viewMode === "list" && (
          <div className="flex items-center gap-2">
            {/* Column Selection Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={columnManagement.openColumnSelector}
              className="h-8 w-8 border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100"
              title="Column Selection"
            >
              <GridIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Cohorts View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCohorts.map((cohort) => (
            <Card 
              key={cohort.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleViewCohort(cohort)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{cohort.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getCourseName(cohort.courseId)}
                    </p>
                  </div>
                  <Badge className={getStatusColor(cohort.status)}>
                    {cohort.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Instructor and Capacity */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{cohort.members.length}/{cohort.capacity} students</span>
                  </div>
                  {cohort.instructorName && (
                    <span className="text-muted-foreground">
                      {cohort.instructorName}
                    </span>
                  )}
                </div>

                {/* Schedule Info */}
                {cohort.startDate && cohort.endDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(cohort.startDate), "dd-MMM-yy")} - {format(new Date(cohort.endDate), "dd-MMM-yy")}
                    </span>
                  </div>
                )}

                {/* Time and Location */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  {cohort.startTime && cohort.endTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{cohort.startTime} - {cohort.endTime}</span>
                    </div>
                  )}
                  {cohort.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{cohort.location}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewCohort(cohort)}
                    className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onEditCohort?.(cohort); }}
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onDeleteCohort?.(cohort); }}
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {filteredCohorts.length > 2 ? (
            <div className="table-container-with-sticky-header">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columnManagement.displayedColumns.map(columnId => (
                      <TableHead key={columnId} className="sticky-table-header">
                        {columnConfig[columnId as keyof typeof columnConfig]?.label || columnId}
                      </TableHead>
                    ))}
                    <TableHead className="sticky-table-header"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-200">
                  {filteredCohorts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columnManagement.displayedColumns.length + 1} className="text-center text-gray-500 dark:text-white">
                        No cohorts found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCohorts.map((cohort) => (
                      <TableRow 
                        key={cohort.id} 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleViewCohort(cohort)}
                      >
                        {columnManagement.displayedColumns.map(columnId => {
                          const config = columnConfig[columnId as keyof typeof columnConfig];
                          const value = config?.render ? config.render(cohort) : cohort[columnId as keyof Cohort] || '-';
                          return (
                            <TableCell 
                              key={columnId} 
                              className={columnId === 'name' ? 'font-medium' : ''}
                            >
                              {value}
                            </TableCell>
                          );
                        })}
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleViewCohort(cohort); }}
                              className="border-purple-300 text-purple-700 hover:bg-purple-50"
                            >
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); onEditCohort?.(cohort); }}
                              className="border-purple-300 text-purple-700 hover:bg-purple-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); onDeleteCohort?.(cohort); }}
                              className="border-purple-300 text-purple-700 hover:bg-purple-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columnManagement.displayedColumns.map(columnId => (
                      <TableHead key={columnId} className="sticky-table-header">
                        {columnConfig[columnId as keyof typeof columnConfig]?.label || columnId}
                      </TableHead>
                    ))}
                    <TableHead className="sticky-table-header"></TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody className="divide-y divide-gray-200">
                {filteredCohorts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columnManagement.displayedColumns.length + 1} className="text-center text-gray-500 dark:text-white">
                      No cohorts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCohorts.map((cohort) => (
                    <TableRow 
                      key={cohort.id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleViewCohort(cohort)}
                    >
                      {columnManagement.displayedColumns.map(columnId => {
                        const config = columnConfig[columnId as keyof typeof columnConfig];
                        const value = config?.render ? config.render(cohort) : cohort[columnId as keyof Cohort] || '-';
                        return (
                          <TableCell 
                            key={columnId} 
                            className={columnId === 'name' ? 'font-medium' : ''}
                          >
                            {value}
                          </TableCell>
                        );
                      })}
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleViewCohort(cohort); }}
                            className="border-purple-300 text-purple-700 hover:bg-purple-50"
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); onEditCohort?.(cohort); }}
                            className="border-purple-300 text-purple-700 hover:bg-purple-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); onDeleteCohort?.(cohort); }}
                            className="border-purple-300 text-purple-700 hover:bg-purple-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {filteredCohorts.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400 dark:text-white" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No cohorts found</h3>
          <p className="mt-2 text-gray-500 dark:text-white">
            {searchTerm ? "Try adjusting your search terms." : "Get started by creating your first cohort."}
          </p>
          {!searchTerm && (
            <Button onClick={onAddCohort} className="mt-4 bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add Cohort
            </Button>
          )}
        </div>
      )}

      {/* View Cohort Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCohort?.name}</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              onClick={() => setIsViewDialogOpen(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogHeader>
          {selectedCohort && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Course</label>
                  <p className="text-sm text-muted-foreground">
                    {getCourseName(selectedCohort.courseId)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge className={getStatusColor(selectedCohort.status)}>
                    {selectedCohort.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Capacity</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedCohort.members.length}/{selectedCohort.capacity} students
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Instructor</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedCohort.instructorName || 'Not assigned'}
                  </p>
                </div>
              </div>

              {selectedCohort.startDate && selectedCohort.endDate && (
                <div>
                  <label className="text-sm font-medium">Duration</label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedCohort.startDate), "dd-MMM-yy")} - {format(new Date(selectedCohort.endDate), "dd-MMM-yy")}
                  </p>
                </div>
              )}

              {(selectedCohort.startTime || selectedCohort.endTime) && (
                <div>
                  <label className="text-sm font-medium">Schedule</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedCohort.startTime} - {selectedCohort.endTime}
                  </p>
                </div>
              )}

              {selectedCohort.location && (
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedCohort.location}
                  </p>
                </div>
              )}

              {selectedCohort.notes && (
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedCohort.notes}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Students ({selectedCohort.members.length})</label>
                <div className="mt-2 max-h-32 overflow-y-auto">
                  {selectedCohort.members.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedCohort.members.map((member) => (
                        <Badge key={member.id} variant="secondary">
                          {member.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No students enrolled</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Column Selection Modal */}
      <ColumnSelectorModal
        open={columnManagement.isColumnSelectionOpen}
        columns={columnManagement.allColumnIds}
        displayedColumns={columnManagement.displayedColumns}
        setDisplayedColumns={columnManagement.setDisplayedColumns}
        onClose={columnManagement.closeColumnSelector}
        onSave={columnManagement.onSaveColumns}
        onReset={columnManagement.onResetColumns}
        storageKeyPrefix={columnManagement.storageKeyPrefix}
        getColumnLabel={columnManagement.getColumnLabel}
      />
    </div>
  )
}