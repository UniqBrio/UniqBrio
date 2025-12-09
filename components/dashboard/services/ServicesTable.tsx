"use client"

import { useCustomColors } from '@/lib/use-custom-colors';
import { Button } from "@/components/dashboard/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/dashboard/ui/table"
import { format } from "date-fns"
import { Badge } from "@/components/dashboard/ui/badge"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Label } from "@/components/dashboard/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/dashboard/ui/dropdown-menu"
import {
  ChevronDown,
  Eye,
  Pencil,
  MoreHorizontal,
  Copy,
  CalendarPlus2Icon as CalendarIcon2,
  History,
  Trash2,
} from "lucide-react"

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
  sessions: any[]
}

interface VisibleColumns {
  id: boolean
  name: boolean
  category: boolean
  status: boolean
  instructor: boolean
  capacity: boolean
  price: boolean
  startDate: boolean
  level: boolean
  mode: boolean
  branch: boolean
  actions: boolean
}

interface ServicesTableProps {
  services: Service[]
  visibleColumns: VisibleColumns
  setVisibleColumns: (columns: VisibleColumns) => void
  onView: (service: Service) => void
  onEdit: (service: Service) => void
  onDelete: (service: Service) => void
  onToggleStatus: (service: Service) => void
  onDuplicate: (service: Service) => void
  onExportToCalendar: (service: Service) => void
  onViewHistory: (service: Service) => void
}

export default function ServicesTable({
  services,
  visibleColumns,
  setVisibleColumns,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onDuplicate,
  onExportToCalendar,
  onViewHistory
}: ServicesTableProps) {
  const { primaryColor, secondaryColor } = useCustomColors();
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Services ({services.length})</CardTitle>
            <CardDescription>Manage and view all your services</CardDescription>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px]" align="end">
              <div className="grid gap-2">
                <div className="text-sm font-medium">Toggle columns</div>
                <div className="grid gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-id"
                      checked={visibleColumns.id}
                      onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, id: checked as boolean })}
                    />
                    <Label htmlFor="col-id">ID</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-name"
                      checked={visibleColumns.name}
                      onCheckedChange={(checked) =>
                        setVisibleColumns({ ...visibleColumns, name: checked as boolean })
                      }
                    />
                    <Label htmlFor="col-name">Name</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-category"
                      checked={visibleColumns.category}
                      onCheckedChange={(checked) =>
                        setVisibleColumns({ ...visibleColumns, category: checked as boolean })
                      }
                    />
                    <Label htmlFor="col-category">Category</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-status"
                      checked={visibleColumns.status}
                      onCheckedChange={(checked) =>
                        setVisibleColumns({ ...visibleColumns, status: checked as boolean })
                      }
                    />
                    <Label htmlFor="col-status">Status</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-instructor"
                      checked={visibleColumns.instructor}
                      onCheckedChange={(checked) =>
                        setVisibleColumns({ ...visibleColumns, instructor: checked as boolean })
                      }
                    />
                    <Label htmlFor="col-instructor">Instructor</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-capacity"
                      checked={visibleColumns.capacity}
                      onCheckedChange={(checked) =>
                        setVisibleColumns({ ...visibleColumns, capacity: checked as boolean })
                      }
                    />
                    <Label htmlFor="col-capacity">Capacity</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-price"
                      checked={visibleColumns.price}
                      onCheckedChange={(checked) =>
                        setVisibleColumns({ ...visibleColumns, price: checked as boolean })
                      }
                    />
                    <Label htmlFor="col-price">Price</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-startDate"
                      checked={visibleColumns.startDate}
                      onCheckedChange={(checked) =>
                        setVisibleColumns({ ...visibleColumns, startDate: checked as boolean })
                      }
                    />
                    <Label htmlFor="col-startDate">Start Date</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-level"
                      checked={visibleColumns.level}
                      onCheckedChange={(checked) =>
                        setVisibleColumns({ ...visibleColumns, level: checked as boolean })
                      }
                    />
                    <Label htmlFor="col-level">Level</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-mode"
                      checked={visibleColumns.mode}
                      onCheckedChange={(checked) =>
                        setVisibleColumns({ ...visibleColumns, mode: checked as boolean })
                      }
                    />
                    <Label htmlFor="col-mode">Mode</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-branch"
                      checked={visibleColumns.branch}
                      onCheckedChange={(checked) =>
                        setVisibleColumns({ ...visibleColumns, branch: checked as boolean })
                      }
                    />
                    <Label htmlFor="col-branch">Branch</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-actions"
                      checked={visibleColumns.actions}
                      onCheckedChange={(checked) =>
                        setVisibleColumns({ ...visibleColumns, actions: checked as boolean })
                      }
                    />
                    <Label htmlFor="col-actions">Actions</Label>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.id && <TableHead>ID</TableHead>}
                {visibleColumns.name && <TableHead>Name</TableHead>}
                {visibleColumns.category && <TableHead>Category</TableHead>}
                {visibleColumns.status && <TableHead>Status</TableHead>}
                {visibleColumns.instructor && <TableHead>Instructor</TableHead>}
                {visibleColumns.capacity && <TableHead>Capacity</TableHead>}
                {visibleColumns.price && <TableHead>Price</TableHead>}
                {visibleColumns.startDate && <TableHead>Start Date</TableHead>}
                {visibleColumns.level && <TableHead>Level</TableHead>}
                {visibleColumns.mode && <TableHead>Mode</TableHead>}
                {visibleColumns.branch && <TableHead>Branch</TableHead>}
                {visibleColumns.actions && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-gray-500 dark:text-white">
                    No services found
                  </TableCell>
                </TableRow>
              ) : (
                services.map((service) => (
                  <TableRow key={service.id}>
                    {visibleColumns.id && <TableCell>{service.id}</TableCell>}
                    {visibleColumns.name && (
                      <TableCell>
                        <div className="font-medium">{service.name}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {service.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.category && <TableCell>{service.category}</TableCell>}
                    {visibleColumns.status && (
                      <TableCell>
                        <Badge
                          variant={service.status === "Active" ? "default" : "secondary"}
                          className={service.status === "Active" ? "bg-green-500" : "bg-gray-500"}
                        >
                          {service.status}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.instructor && <TableCell>{service.instructor}</TableCell>}
                    {visibleColumns.capacity && (
                      <TableCell>
                        <div className="flex items-center">
                          <span
                            style={service.enrolled === service.capacity ? { color: secondaryColor } : undefined}
                          >
                            {service.enrolled}/{service.capacity}
                          </span>
                          <div className="w-24 h-2 bg-gray-200 rounded-full ml-2">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(service.enrolled / service.capacity) * 100}%`,
                                backgroundColor:
                                  service.enrolled / service.capacity > 0.8 ? secondaryColor : "#22c55e",
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.price && <TableCell>${service.price}</TableCell>}
                    {visibleColumns.startDate && <TableCell>{format(service.startDate, 'dd-MMM-yy')}</TableCell>}
                    {visibleColumns.level && <TableCell>{service.level}</TableCell>}
                    {visibleColumns.mode && <TableCell>{service.mode}</TableCell>}
                    {visibleColumns.branch && <TableCell>{service.branch}</TableCell>}
                    {visibleColumns.actions && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => onView(service)}>
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">View</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Service Details</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => onEdit(service)}>
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit Service</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">More</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>More Actions</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onToggleStatus(service)}>
                                {service.status === "Active" ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onDuplicate(service)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onExportToCalendar(service)}>
                                <CalendarIcon2 className="mr-2 h-4 w-4" />
                                Export to Calendar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onViewHistory(service)}>
                                <History className="mr-2 h-4 w-4" />
                                View History
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => onDelete(service)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" style={{ color: primaryColor }} />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
