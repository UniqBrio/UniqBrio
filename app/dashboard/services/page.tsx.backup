"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import MainLayout from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import {
  CalendarIcon,
  ChevronDown,
  Download,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  History,
  CalendarPlus2Icon as CalendarIcon2,
  Copy,
  X,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"

// Types
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

interface Session {
  id: string
  serviceId: string
  timeFrom: string
  timeTo: string
  days: string[]
  instructor: string
  location: string
}

interface Filter {
  category: string
  instructor: string
  status: string
  mode: string
  startDateFrom: Date | undefined
  startDateTo: Date | undefined
  branch: string
}

// Sample data
const sampleServices: Service[] = [
  {
    id: "SRV001",
    name: "Advanced Painting",
    category: "Arts",
    status: "Active",
    instructor: "Jane Smith",
    capacity: 20,
    enrolled: 12,
    price: 299.99,
    startDate: new Date(2023, 5, 15),
    endDate: new Date(2023, 8, 15),
    level: "Advanced",
    location: "Studio A",
    description: "Advanced painting techniques for experienced artists.",
    mode: "Offline",
    timeSlot: "Mon, Wed 4:00 PM - 6:00 PM",
    branch: "Main Branch",
    tags: ["Popular", "Limited Seats"],
    sessions: [
      {
        id: "SRV001-1",
        serviceId: "SRV001",
        timeFrom: "16:00",
        timeTo: "18:00",
        days: ["Monday", "Wednesday"],
        instructor: "Jane Smith",
        location: "Studio A",
      },
      {
        id: "SRV001-2",
        serviceId: "SRV001",
        timeFrom: "16:00",
        timeTo: "18:00",
        days: ["Friday"],
        instructor: "Robert Johnson",
        location: "Studio B",
      },
    ],
  },
  {
    id: "SRV002",
    name: "Beginner Swimming",
    category: "Sports",
    status: "Active",
    instructor: "Michael Brown",
    capacity: 15,
    enrolled: 10,
    price: 199.99,
    startDate: new Date(2023, 6, 1),
    endDate: new Date(2023, 8, 30),
    level: "Beginner",
    location: "Pool Area",
    description: "Learn basic swimming techniques for beginners.",
    mode: "Offline",
    timeSlot: "Tue, Thu 5:00 PM - 6:30 PM",
    branch: "Sports Complex",
    tags: ["New", "Trending"],
    sessions: [
      {
        id: "SRV002-1",
        serviceId: "SRV002",
        timeFrom: "17:00",
        timeTo: "18:30",
        days: ["Tuesday", "Thursday"],
        instructor: "Michael Brown",
        location: "Pool Area",
      },
    ],
  },
  {
    id: "SRV003",
    name: "Online Guitar Lessons",
    category: "Music",
    status: "Active",
    instructor: "David Wilson",
    capacity: 30,
    enrolled: 25,
    price: 149.99,
    startDate: new Date(2023, 7, 1),
    endDate: new Date(2023, 9, 30),
    level: "Intermediate",
    location: "Virtual",
    description: "Interactive online guitar lessons for intermediate players.",
    mode: "Online",
    timeSlot: "Sat 10:00 AM - 12:00 PM",
    branch: "Online Branch",
    tags: ["Popular", "Online"],
    sessions: [
      {
        id: "SRV003-1",
        serviceId: "SRV003",
        timeFrom: "10:00",
        timeTo: "12:00",
        days: ["Saturday"],
        instructor: "David Wilson",
        location: "Virtual",
      },
    ],
  },
  {
    id: "SRV004",
    name: "Yoga for Beginners",
    category: "Fitness",
    status: "Inactive",
    instructor: "Sarah Johnson",
    capacity: 25,
    enrolled: 0,
    price: 179.99,
    startDate: new Date(2023, 8, 1),
    endDate: new Date(2023, 10, 30),
    level: "Beginner",
    location: "Yoga Studio",
    description: "Introduction to yoga for beginners.",
    mode: "Offline",
    timeSlot: "Mon, Wed, Fri 7:00 AM - 8:00 AM",
    branch: "Fitness Center",
    tags: [],
    sessions: [
      {
        id: "SRV004-1",
        serviceId: "SRV004",
        timeFrom: "07:00",
        timeTo: "08:00",
        days: ["Monday", "Wednesday", "Friday"],
        instructor: "Sarah Johnson",
        location: "Yoga Studio",
      },
    ],
  },
  {
    id: "SRV005",
    name: "Advanced Mathematics",
    category: "Education",
    status: "Active",
    instructor: "Prof. Richard Lee",
    capacity: 20,
    enrolled: 18,
    price: 249.99,
    startDate: new Date(2023, 6, 15),
    endDate: new Date(2023, 9, 15),
    level: "Advanced",
    location: "Classroom 101",
    description: "Advanced mathematics course for high school students.",
    mode: "Offline",
    timeSlot: "Tue, Thu 4:00 PM - 5:30 PM",
    branch: "Main Branch",
    tags: ["Limited Seats"],
    sessions: [
      {
        id: "SRV005-1",
        serviceId: "SRV005",
        timeFrom: "16:00",
        timeTo: "17:30",
        days: ["Tuesday", "Thursday"],
        instructor: "Prof. Richard Lee",
        location: "Classroom 101",
      },
    ],
  },
]

const categories = ["All", "Arts", "Sports", "Music", "Fitness", "Education"]
const instructors = [
  "All",
  "Jane Smith",
  "Michael Brown",
  "David Wilson",
  "Sarah Johnson",
  "Prof. Richard Lee",
  "Robert Johnson",
]
const statuses = ["All", "Active", "Inactive"]
const modes = ["All", "Online", "Offline"]
const branches = ["All", "Main Branch", "Sports Complex", "Online Branch", "Fitness Center"]
const levels = ["Beginner", "Intermediate", "Advanced"]

export default function ServicesPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>(sampleServices)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<Filter>({
    category: "All",
    instructor: "All",
    status: "All",
    mode: "All",
    startDateFrom: undefined,
    startDateTo: undefined,
    branch: "All",
  })

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [currentService, setCurrentService] = useState<Service | null>(null)
  const [newService, setNewService] = useState<Partial<Service>>({
    name: "",
    category: "Arts",
    status: "Active",
    instructor: "",
    capacity: 20,
    enrolled: 0,
    price: 0,
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
    level: "Beginner",
    location: "",
    description: "",
    mode: "Offline",
    timeSlot: "",
    branch: "Main Branch",
    tags: [],
    sessions: [],
  })
  const [newSession, setNewSession] = useState<Partial<Session>>({
    timeFrom: "09:00",
    timeTo: "10:00",
    days: ["Monday"],
    instructor: "",
    location: "",
  })
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    name: true,
    category: true,
    status: true,
    instructor: true,
    capacity: true,
    actions: true,
  })

  // Filter services based on search term and filters
  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.instructor.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = filter.category === "All" || service.category === filter.category
    const matchesInstructor = filter.instructor === "All" || service.instructor === filter.instructor
    const matchesStatus = filter.status === "All" || service.status === filter.status
    const matchesMode = filter.mode === "All" || service.mode === filter.mode
    const matchesBranch = filter.branch === "All" || service.branch === filter.branch

    let matchesStartDate = true
    if (filter.startDateFrom && filter.startDateTo) {
      matchesStartDate = service.startDate >= filter.startDateFrom && service.startDate <= filter.startDateTo
    } else if (filter.startDateFrom) {
      matchesStartDate = service.startDate >= filter.startDateFrom
    } else if (filter.startDateTo) {
      matchesStartDate = service.startDate <= filter.startDateTo
    }

    return (
      matchesSearch &&
      matchesCategory &&
      matchesInstructor &&
      matchesStatus &&
      matchesMode &&
      matchesBranch &&
      matchesStartDate
    )
  })

  // Handle adding a new service
  const handleAddService = () => {
    const id = `SRV${String(services.length + 1).padStart(3, "0")}`
    const newServiceWithId: Service = {
      ...(newService as Service),
      id,
      sessions: newService.sessions || [],
    }
    setServices([...services, newServiceWithId])
    setIsAddDialogOpen(false)
    setNewService({
      name: "",
      category: "Arts",
      status: "Active",
      instructor: "",
      capacity: 20,
      enrolled: 0,
      price: 0,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      level: "Beginner",
      location: "",
      description: "",
      mode: "Offline",
      timeSlot: "",
      branch: "Main Branch",
      tags: [],
      sessions: [],
    })
    toast({
      title: "Service Added",
      description: `Service ${newServiceWithId.name} has been added successfully.`,
      action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
    })
  }

  // Handle editing a service
  const handleEditService = () => {
    if (!currentService) return

    const updatedServices = services.map((service) => (service.id === currentService.id ? currentService : service))

    setServices(updatedServices)
    setIsEditDialogOpen(false)
    setCurrentService(null)

    toast({
      title: "Service Updated",
      description: `Service ${currentService.name} has been updated successfully.`,
      action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
    })
  }

  // Handle deleting a service
  const handleDeleteService = () => {
    if (!currentService) return

    const updatedServices = services.filter((service) => service.id !== currentService.id)
    setServices(updatedServices)
    setIsDeleteDialogOpen(false)
    setCurrentService(null)

    toast({
      title: "Service Deleted",
      description: `Service ${currentService.name} has been deleted successfully.`,
      action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
    })
  }

  // Handle duplicating a service
  const handleDuplicateService = (service: Service) => {
    const id = `SRV${String(services.length + 1).padStart(3, "0")}`
    const duplicatedService: Service = {
      ...service,
      id,
      name: `${service.name} (Copy)`,
      enrolled: 0,
    }

    setServices([...services, duplicatedService])

    toast({
      title: "Service Duplicated",
      description: `Service ${service.name} has been duplicated successfully.`,
      action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
    })
  }

  // Handle exporting services
  const handleExportServices = () => {
    setIsExportDialogOpen(false)

    toast({
      title: "Export Successful",
      description: "Services have been exported successfully.",
      action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
    })
  }

  // Handle importing services
  const handleImportServices = () => {
    setIsImportDialogOpen(false)

    toast({
      title: "Import Successful",
      description: "Services have been imported successfully.",
      action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
    })
  }

  // Handle toggling service status
  const handleToggleStatus = (service: Service) => {
    const updatedServices = services.map((s) => {
      if (s.id === service.id) {
        return {
          ...s,
          status: s.status === "Active" ? "Inactive" : "Active",
        }
      }
      return s
    })

    setServices(updatedServices)

    toast({
      title: "Status Updated",
      description: `Service ${service.name} is now ${service.status === "Active" ? "Inactive" : "Active"}.`,
      action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
    })
  }

  // Handle adding a session to a service
  const handleAddSession = () => {
    if (!currentService) return

    const sessionId = `${currentService.id}-${currentService.sessions.length + 1}`
    const newSessionWithId: Session = {
      ...(newSession as Session),
      id: sessionId,
      serviceId: currentService.id,
    }

    const updatedService = {
      ...currentService,
      sessions: [...currentService.sessions, newSessionWithId],
    }

    setCurrentService(updatedService)
    setNewSession({
      timeFrom: "09:00",
      timeTo: "10:00",
      days: ["Monday"],
      instructor: "",
      location: "",
    })

    toast({
      title: "Session Added",
      description: `Session ${sessionId} has been added to ${currentService.name}.`,
      action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
    })
  }

  // Handle removing a session from a service
  const handleRemoveSession = (sessionId: string) => {
    if (!currentService) return

    const updatedSessions = currentService.sessions.filter((session) => session.id !== sessionId)
    const updatedService = {
      ...currentService,
      sessions: updatedSessions,
    }

    setCurrentService(updatedService)

    toast({
      title: "Session Removed",
      description: `Session ${sessionId} has been removed.`,
      action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
    })
  }

  // Handle exporting to calendar
  const handleExportToCalendar = (service: Service) => {
    toast({
      title: "Calendar Export",
      description: `${service.name} has been exported to calendar (.ics).`,
      action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
    })
  }

  // Handle view history
  const handleViewHistory = (service: Service) => {
    toast({
      title: "History View",
      description: `Viewing history for ${service.name}.`,
      action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
    })
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-purple-700">Services</h1>
              <p className="text-gray-500">Manage your arts and sports classes</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Service
              </Button>
              <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" /> Import
              </Button>
              <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}>
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Filter services by various criteria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by name, ID, or instructor..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={filter.category} onValueChange={(value) => setFilter({ ...filter, category: value })}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructor">Instructor</Label>
                  <Select
                    value={filter.instructor}
                    onValueChange={(value) => setFilter({ ...filter, instructor: value })}
                  >
                    <SelectTrigger id="instructor">
                      <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {instructors.map((instructor) => (
                        <SelectItem key={instructor} value={instructor}>
                          {instructor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={filter.status} onValueChange={(value) => setFilter({ ...filter, status: value })}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mode">Mode</Label>
                  <Select value={filter.mode} onValueChange={(value) => setFilter({ ...filter, mode: value })}>
                    <SelectTrigger id="mode">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {modes.map((mode) => (
                        <SelectItem key={mode} value={mode}>
                          {mode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Select value={filter.branch} onValueChange={(value) => setFilter({ ...filter, branch: value })}>
                    <SelectTrigger id="branch">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Date Range</Label>
                  <div className="flex space-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filter.startDateFrom ? format(filter.startDateFrom, "PPP") : "From date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filter.startDateFrom}
                          onSelect={(date) => setFilter({ ...filter, startDateFrom: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filter.startDateTo ? format(filter.startDateTo, "PPP") : "To date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filter.startDateTo}
                          onSelect={(date) => setFilter({ ...filter, startDateTo: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() =>
                  setFilter({
                    category: "All",
                    instructor: "All",
                    status: "All",
                    mode: "All",
                    startDateFrom: undefined,
                    startDateTo: undefined,
                    branch: "All",
                  })
                }
              >
                Reset Filters
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    Column Visibility <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56">
                  <div className="space-y-2">
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
                        id="col-actions"
                        checked={visibleColumns.actions}
                        onCheckedChange={(checked) =>
                          setVisibleColumns({ ...visibleColumns, actions: checked as boolean })
                        }
                      />
                      <Label htmlFor="col-actions">Actions</Label>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </CardFooter>
          </Card>

          {/* Services Table */}
          <Card>
            <CardHeader>
              <CardTitle>Services List</CardTitle>
              <CardDescription>
                Showing {filteredServices.length} of {services.length} services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {visibleColumns.id && <TableHead>ID</TableHead>}
                    {visibleColumns.name && <TableHead>Name</TableHead>}
                    {visibleColumns.category && <TableHead>Category</TableHead>}
                    {visibleColumns.status && <TableHead>Status</TableHead>}
                    {visibleColumns.instructor && <TableHead>Instructor</TableHead>}
                    {visibleColumns.capacity && <TableHead>Capacity</TableHead>}
                    {visibleColumns.actions && <TableHead className="text-right">Actions</TableHead>}
                  </TableHeader>
                  <TableBody>
                    {filteredServices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No services found. Try adjusting your filters or add a new service.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredServices.map((service) => (
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
                                <span className={service.enrolled === service.capacity ? "text-orange-500" : ""}>
                                  {service.enrolled}/{service.capacity}
                                </span>
                                <div className="w-24 h-2 bg-gray-200 rounded-full ml-2">
                                  <div
                                    className={`h-full rounded-full ${
                                      service.enrolled / service.capacity > 0.8 ? "bg-orange-500" : "bg-green-500"
                                    }`}
                                    style={{ width: `${(service.enrolled / service.capacity) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                          )}
                          {visibleColumns.actions && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setCurrentService(service)
                                    setIsViewDialogOpen(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">View</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setCurrentService(service)
                                    setIsEditDialogOpen(true)
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">More</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleToggleStatus(service)}>
                                      {service.status === "Active" ? "Deactivate" : "Activate"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDuplicateService(service)}>
                                      <Copy className="mr-2 h-4 w-4" />
                                      Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExportToCalendar(service)}>
                                      <CalendarIcon2 className="mr-2 h-4 w-4" />
                                      Export to Calendar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleViewHistory(service)}>
                                      <History className="mr-2 h-4 w-4" />
                                      View History
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => {
                                        setCurrentService(service)
                                        setIsDeleteDialogOpen(true)
                                      }}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
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
        </div>
      </div>

      {/* Add Service Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
            <DialogDescription>Fill in the details to create a new service.</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Service Details</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Service Name</Label>
                  <Input
                    id="name"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    placeholder="Enter service name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newService.category}
                    onValueChange={(value) => setNewService({ ...newService, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((c) => c !== "All")
                        .map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructor">Instructor</Label>
                  <Input
                    id="instructor"
                    value={newService.instructor}
                    onChange={(e) => setNewService({ ...newService, instructor: e.target.value })}
                    placeholder="Enter instructor name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newService.status}
                    onValueChange={(value: "Active" | "Inactive") => setNewService({ ...newService, status: value })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Max Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={newService.capacity}
                    onChange={(e) => setNewService({ ...newService, capacity: Number.parseInt(e.target.value) })}
                    placeholder="Enter maximum capacity"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: Number.parseFloat(e.target.value) })}
                    placeholder="Enter price"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <Select
                    value={newService.level}
                    onValueChange={(value) => setNewService({ ...newService, level: value })}
                  >
                    <SelectTrigger id="level">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mode">Mode</Label>
                  <Select
                    value={newService.mode}
                    onValueChange={(value: "Online" | "Offline") => setNewService({ ...newService, mode: value })}
                  >
                    <SelectTrigger id="mode">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Online">Online</SelectItem>
                      <SelectItem value="Offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newService.location}
                    onChange={(e) => setNewService({ ...newService, location: e.target.value })}
                    placeholder="Enter location"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Select
                    value={newService.branch}
                    onValueChange={(value) => setNewService({ ...newService, branch: value })}
                  >
                    <SelectTrigger id="branch">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches
                        .filter((b) => b !== "All")
                        .map((branch) => (
                          <SelectItem key={branch} value={branch}>
                            {branch}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newService.startDate ? format(newService.startDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newService.startDate}
                        onSelect={(date) => date && setNewService({ ...newService, startDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newService.endDate ? format(newService.endDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newService.endDate}
                        onSelect={(date) => date && setNewService({ ...newService, endDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="w-full min-h-[100px] p-2 border rounded-md"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  placeholder="Enter service description"
                />
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {["Popular", "New", "Trending", "Limited Seats", "Online"].map((tag) => (
                    <Badge
                      key={tag}
                      variant={newService.tags?.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const currentTags = newService.tags || []
                        if (currentTags.includes(tag)) {
                          setNewService({
                            ...newService,
                            tags: currentTags.filter((t) => t !== tag),
                          })
                        } else {
                          setNewService({
                            ...newService,
                            tags: [...currentTags, tag],
                          })
                        }
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="sessions" className="space-y-4 py-4">
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Add New Session</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="session-instructor">Instructor</Label>
                      <Input
                        id="session-instructor"
                        value={newSession.instructor}
                        onChange={(e) => setNewSession({ ...newSession, instructor: e.target.value })}
                        placeholder="Enter instructor name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="session-location">Location</Label>
                      <Input
                        id="session-location"
                        value={newSession.location}
                        onChange={(e) => setNewSession({ ...newSession, location: e.target.value })}
                        placeholder="Enter location"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="session-timeFrom">Time From</Label>
                      <Input
                        id="session-timeFrom"
                        type="time"
                        value={newSession.timeFrom}
                        onChange={(e) => setNewSession({ ...newSession, timeFrom: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="session-timeTo">Time To</Label>
                      <Input
                        id="session-timeTo"
                        type="time"
                        value={newSession.timeTo}
                        onChange={(e) => setNewSession({ ...newSession, timeTo: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Label>Days</Label>
                    <div className="flex flex-wrap gap-2">
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                        <Badge
                          key={day}
                          variant={newSession.days?.includes(day) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            const currentDays = newSession.days || []
                            if (currentDays.includes(day)) {
                              setNewSession({
                                ...newSession,
                                days: currentDays.filter((d) => d !== day),
                              })
                            } else {
                              setNewSession({
                                ...newSession,
                                days: [...currentDays, day],
                              })
                            }
                          }}
                        >
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    className="mt-4"
                    onClick={() => {
                      if (!newService.sessions) {
                        setNewService({ ...newService, sessions: [] })
                      }

                      const sessionId = `TEMP-${newService.sessions?.length || 0 + 1}`
                      const newSessionWithId: Session = {
                        ...(newSession as Session),
                        id: sessionId,
                        serviceId: "TEMP",
                      }

                      setNewService({
                        ...newService,
                        sessions: [...(newService.sessions || []), newSessionWithId],
                      })

                      setNewSession({
                        timeFrom: "09:00",
                        timeTo: "10:00",
                        days: ["Monday"],
                        instructor: "",
                        location: "",
                      })
                    }}
                  >
                    Add Session
                  </Button>
                </div>

                {/* Session List */}
                {newService.sessions && newService.sessions.length > 0 ? (
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-4">Sessions ({newService.sessions.length})</h3>
                    <div className="space-y-4">
                      {newService.sessions.map((session, index) => (
                        <div key={session.id} className="border rounded-md p-3 relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setNewService({
                                ...newService,
                                sessions: newService.sessions?.filter((s) => s.id !== session.id) || [],
                              })
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <span className="text-sm font-medium">Instructor:</span>
                              <span className="ml-2">{session.instructor || "Not specified"}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Location:</span>
                              <span className="ml-2">{session.location || "Not specified"}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Time:</span>
                              <span className="ml-2">
                                {session.timeFrom} - {session.timeTo}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Days:</span>
                              <span className="ml-2">{session.days.join(", ")}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md">
                    <p className="text-gray-500">No sessions added yet.</p>
                    <p className="text-sm text-gray-400">Add sessions using the form above.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddService}>Add Service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      {currentService && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Service</DialogTitle>
              <DialogDescription>Update the details for {currentService.name}.</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Service Details</TabsTrigger>
                <TabsTrigger value="sessions">Sessions</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Service Name</Label>
                    <Input
                      id="edit-name"
                      value={currentService.name}
                      onChange={(e) => setCurrentService({ ...currentService, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Select
                      value={currentService.category}
                      onValueChange={(value) => setCurrentService({ ...currentService, category: value })}
                    >
                      <SelectTrigger id="edit-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter((c) => c !== "All")
                          .map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-instructor">Instructor</Label>
                    <Input
                      id="edit-instructor"
                      value={currentService.instructor}
                      onChange={(e) => setCurrentService({ ...currentService, instructor: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={currentService.status}
                      onValueChange={(value: "Active" | "Inactive") =>
                        setCurrentService({ ...currentService, status: value })
                      }
                    >
                      <SelectTrigger id="edit-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-capacity">Max Capacity</Label>
                    <Input
                      id="edit-capacity"
                      type="number"
                      value={currentService.capacity}
                      onChange={(e) =>
                        setCurrentService({ ...currentService, capacity: Number.parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-enrolled">Enrolled Students</Label>
                    <Input
                      id="edit-enrolled"
                      type="number"
                      value={currentService.enrolled}
                      onChange={(e) =>
                        setCurrentService({ ...currentService, enrolled: Number.parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-price">Price ($)</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      step="0.01"
                      value={currentService.price}
                      onChange={(e) =>
                        setCurrentService({ ...currentService, price: Number.parseFloat(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-level">Level</Label>
                    <Select
                      value={currentService.level}
                      onValueChange={(value) => setCurrentService({ ...currentService, level: value })}
                    >
                      <SelectTrigger id="edit-level">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {levels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-mode">Mode</Label>
                    <Select
                      value={currentService.mode}
                      onValueChange={(value: "Online" | "Offline") =>
                        setCurrentService({ ...currentService, mode: value })
                      }
                    >
                      <SelectTrigger id="edit-mode">
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Online">Online</SelectItem>
                        <SelectItem value="Offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-location">Location</Label>
                    <Input
                      id="edit-location"
                      value={currentService.location}
                      onChange={(e) => setCurrentService({ ...currentService, location: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-branch">Branch</Label>
                    <Select
                      value={currentService.branch}
                      onValueChange={(value) => setCurrentService({ ...currentService, branch: value })}
                    >
                      <SelectTrigger id="edit-branch">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches
                          .filter((b) => b !== "All")
                          .map((branch) => (
                            <SelectItem key={branch} value={branch}>
                              {branch}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(currentService.startDate, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={currentService.startDate}
                          onSelect={(date) => date && setCurrentService({ ...currentService, startDate: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(currentService.endDate, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={currentService.endDate}
                          onSelect={(date) => date && setCurrentService({ ...currentService, endDate: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <textarea
                    id="edit-description"
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    value={currentService.description}
                    onChange={(e) => setCurrentService({ ...currentService, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Popular", "New", "Trending", "Limited Seats", "Online"].map((tag) => (
                      <Badge
                        key={tag}
                        variant={currentService.tags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          if (currentService.tags.includes(tag)) {
                            setCurrentService({
                              ...currentService,
                              tags: currentService.tags.filter((t) => t !== tag),
                            })
                          } else {
                            setCurrentService({
                              ...currentService,
                              tags: [...currentService.tags, tag],
                            })
                          }
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="sessions" className="space-y-4 py-4">
                <div className="space-y-4">
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">Add New Session</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-session-instructor">Instructor</Label>
                        <Input
                          id="edit-session-instructor"
                          value={newSession.instructor}
                          onChange={(e) => setNewSession({ ...newSession, instructor: e.target.value })}
                          placeholder="Enter instructor name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-session-location">Location</Label>
                        <Input
                          id="edit-session-location"
                          value={newSession.location}
                          onChange={(e) => setNewSession({ ...newSession, location: e.target.value })}
                          placeholder="Enter location"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-session-timeFrom">Time From</Label>
                        <Input
                          id="edit-session-timeFrom"
                          type="time"
                          value={newSession.timeFrom}
                          onChange={(e) => setNewSession({ ...newSession, timeFrom: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-session-timeTo">Time To</Label>
                        <Input
                          id="edit-session-timeTo"
                          type="time"
                          value={newSession.timeTo}
                          onChange={(e) => setNewSession({ ...newSession, timeTo: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Label>Days</Label>
                      <div className="flex flex-wrap gap-2">
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                          <Badge
                            key={day}
                            variant={newSession.days?.includes(day) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              const currentDays = newSession.days || []
                              if (currentDays.includes(day)) {
                                setNewSession({
                                  ...newSession,
                                  days: currentDays.filter((d) => d !== day),
                                })
                              } else {
                                setNewSession({
                                  ...newSession,
                                  days: [...currentDays, day],
                                })
                              }
                            }}
                          >
                            {day}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button className="mt-4" onClick={handleAddSession}>
                      Add Session
                    </Button>
                  </div>

                  {/* Session List */}
                  {currentService.sessions.length > 0 ? (
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-4">Sessions ({currentService.sessions.length})</h3>
                      <div className="space-y-4">
                        {currentService.sessions.map((session) => (
                          <div key={session.id} className="border rounded-md p-3 relative">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={() => handleRemoveSession(session.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                <span className="text-sm font-medium">Instructor:</span>
                                <span className="ml-2">{session.instructor || "Not specified"}</span>
                              </div>
                              <div>
                                <span className="text-sm font-medium">Location:</span>
                                <span className="ml-2">{session.location || "Not specified"}</span>
                              </div>
                              <div>
                                <span className="text-sm font-medium">Time:</span>
                                <span className="ml-2">
                                  {session.timeFrom} - {session.timeTo}
                                </span>
                              </div>
                              <div>
                                <span className="text-sm font-medium">Days:</span>
                                <span className="ml-2">{session.days.join(", ")}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 border rounded-md">
                      <p className="text-gray-500">No sessions added yet.</p>
                      <p className="text-sm text-gray-400">Add sessions using the form above.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditService}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View Service Dialog */}
      {currentService && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{currentService.name}</DialogTitle>
              <DialogDescription>Service details and information</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="sessions">Sessions</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">ID</p>
                    <p>{currentService.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Category</p>
                    <p>{currentService.category}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <Badge
                      variant={currentService.status === "Active" ? "default" : "secondary"}
                      className={currentService.status === "Active" ? "bg-green-500" : "bg-gray-500"}
                    >
                      {currentService.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Instructor</p>
                    <p>{currentService.instructor}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Capacity</p>
                    <div className="flex items-center">
                      <span>
                        {currentService.enrolled}/{currentService.capacity}
                      </span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full ml-2">
                        <div
                          className={`h-full rounded-full ${
                            currentService.enrolled / currentService.capacity > 0.8 ? "bg-orange-500" : "bg-green-500"
                          }`}
                          style={{ width: `${(currentService.enrolled / currentService.capacity) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Price</p>
                    <p>${currentService.price.toFixed(2)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Level</p>
                    <p>{currentService.level}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Mode</p>
                    <p>{currentService.mode}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p>{currentService.location}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Branch</p>
                    <p>{currentService.branch}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Start Date</p>
                    <p>{format(currentService.startDate, "PPP")}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">End Date</p>
                    <p>{format(currentService.endDate, "PPP")}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="text-sm">{currentService.description}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {currentService.tags.length > 0 ? (
                      currentService.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">No tags</p>
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="sessions" className="space-y-4 py-4">
                {currentService.sessions.length > 0 ? (
                  <div className="space-y-4">
                    {currentService.sessions.map((session) => (
                      <Card key={session.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Session {session.id}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <span className="text-sm font-medium">Instructor:</span>
                              <span className="ml-2">{session.instructor || "Not specified"}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Location:</span>
                              <span className="ml-2">{session.location || "Not specified"}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Time:</span>
                              <span className="ml-2">
                                {session.timeFrom} - {session.timeTo}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Days:</span>
                              <span className="ml-2">{session.days.join(", ")}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No sessions available for this service.</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="students" className="space-y-4 py-4">
                <div className="text-center py-8">
                  <p className="text-gray-500">This service has {currentService.enrolled} enrolled students.</p>
                  <p className="text-sm text-gray-400">Detailed student information would be displayed here.</p>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {currentService && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the service "{currentService.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteService}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Services</DialogTitle>
            <DialogDescription>Upload a CSV or XLSX file to import services.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-format">File Format</Label>
              <Select defaultValue="csv">
                <SelectTrigger id="import-format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">XLSX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-file">File</Label>
              <div className="flex items-center gap-2">
                <Input id="import-file" type="file" accept=".csv,.xlsx" />
                <Button variant="outline" size="sm">
                  Browse
                </Button>
              </div>
              <p className="text-xs text-gray-500">File name format: CustomerBrand_Services_ddmmyyyy</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportServices}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Services</DialogTitle>
            <DialogDescription>Export services to a CSV or XLSX file.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="export-format">File Format</Label>
              <Select defaultValue="csv">
                <SelectTrigger id="export-format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">XLSX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="export-filename">File Name</Label>
              <Input id="export-filename" defaultValue={`XYZ_Services_${format(new Date(), "ddMMyyyy")}`} />
              <p className="text-xs text-gray-500">Recommended format: CustomerBrand_Services_ddmmyyyy</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportServices}>Export</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
