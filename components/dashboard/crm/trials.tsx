"use client"

import { useState, useEffect } from "react"
import { useCustomColors } from '@/lib/use-custom-colors'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Badge } from "@/components/dashboard/ui/badge"
import { Label } from "@/components/dashboard/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/dashboard/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/dashboard/ui/table"
import { Calendar } from "@/components/dashboard/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import {
  Plus,
  Search,
  CalendarIcon,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Video,
  MapPin,
  Star,
  Users,
  TrendingUp,
} from "lucide-react"
import { CRMNavigation } from "@/components/dashboard/crm-navigation"
import { format } from "date-fns"

interface Trial {
  id: string
  studentName: string
  studentId: string
  contactNumber: string
  email: string
  course: string
  trialDate: string
  trialTime: string
  instructor: string
  mode: "Online" | "Offline"
  venue?: string
  status: "Scheduled" | "Confirmed" | "Completed" | "No Show" | "Cancelled" | "Rescheduled"
  outcome?: "Enrolled" | "Follow-up Required" | "Not Interested" | "Pending Decision"
  feedback?: string
  rating?: number
  nextSteps?: string
  scheduledBy: string
  createdAt: string
  lastModified: string
  reminderSent: boolean
  attendanceConfirmed: boolean
}

export default function TrialsPage() {
  const { primaryColor } = useCustomColors();
  const [trials, setTrials] = useState<Trial[]>([])
  const [filteredTrials, setFilteredTrials] = useState<Trial[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [courseFilter, setCourseFilter] = useState("all")
  const [instructorFilter, setInstructorFilter] = useState("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedTrial, setSelectedTrial] = useState<Trial | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>()

  useEffect(() => {
    const mockTrials: Trial[] = [
        {
          id: "TRL001",
          studentName: "Priya Sharma",
          studentId: "LEAD001",
          contactNumber: "+91 9876543210",
          email: "priya.sharma@email.com",
          course: "Web Development",
          trialDate: "2024-01-18",
          trialTime: "10:00 AM",
          instructor: "Rajesh Kumar",
          mode: "Online",
          status: "Scheduled",
          scheduledBy: "John Doe",
          createdAt: "2024-01-15T14:30:00Z",
          lastModified: "2024-01-15T14:30:00Z",
          reminderSent: true,
          attendanceConfirmed: false,
        },
        {
          id: "TRL002",
          studentName: "Amit Patel",
          studentId: "LEAD002",
          contactNumber: "+91 9876543211",
          email: "amit.patel@email.com",
          course: "Data Science",
          trialDate: "2024-01-17",
          trialTime: "2:00 PM",
          instructor: "Dr. Sarah Wilson",
          mode: "Offline",
          venue: "Mumbai Branch - Room 101",
          status: "Completed",
          outcome: "Enrolled",
          feedback: "Excellent session! Very impressed with the hands-on approach and instructor quality.",
          rating: 5,
          nextSteps: "Process enrollment for Data Science Full Stack program",
          scheduledBy: "Jane Smith",
          createdAt: "2024-01-14T10:00:00Z",
          lastModified: "2024-01-17T15:30:00Z",
          reminderSent: true,
          attendanceConfirmed: true,
        },
        {
          id: "TRL003",
          studentName: "Sneha Gupta",
          studentId: "LEAD003",
          contactNumber: "+91 9876543212",
          email: "sneha.gupta@email.com",
          course: "Python Programming",
          trialDate: "2024-01-16",
          trialTime: "11:00 AM",
          instructor: "Vikram Singh",
          mode: "Online",
          status: "No Show",
          outcome: "Follow-up Required",
          nextSteps: "Contact student to reschedule trial session",
          scheduledBy: "Mike Johnson",
          createdAt: "2024-01-13T16:20:00Z",
          lastModified: "2024-01-16T12:00:00Z",
          reminderSent: true,
          attendanceConfirmed: false,
        },
        {
          id: "TRL004",
          studentName: "Rahul Verma",
          studentId: "LEAD004",
          contactNumber: "+91 9876543213",
          email: "rahul.verma@email.com",
          course: "AI/ML Fundamentals",
          trialDate: "2024-01-19",
          trialTime: "3:00 PM",
          instructor: "Dr. Anita Sharma",
          mode: "Online",
          status: "Confirmed",
          scheduledBy: "John Doe",
          createdAt: "2024-01-16T09:15:00Z",
          lastModified: "2024-01-16T14:20:00Z",
          reminderSent: true,
          attendanceConfirmed: true,
        },
      ]
      setTrials(mockTrials)
      setFilteredTrials(mockTrials)
      setLoading(false)
  }, [])

  useEffect(() => {
    let filtered = trials

    if (searchTerm) {
      filtered = filtered.filter(
        (trial) =>
          trial.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trial.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trial.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trial.instructor.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((trial) => trial.status === statusFilter)
    }

    if (courseFilter !== "all") {
      filtered = filtered.filter((trial) => trial.course === courseFilter)
    }

    if (instructorFilter !== "all") {
      filtered = filtered.filter((trial) => trial.instructor === instructorFilter)
    }

    setFilteredTrials(filtered)
  }, [trials, searchTerm, statusFilter, courseFilter, instructorFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-100 text-blue-800"
      case "Confirmed":
        return "bg-green-100 text-green-800"
      case "Completed":
        return "bg-purple-100 text-purple-800"
      case "No Show":
        return "bg-red-100 text-red-800"
      case "Cancelled":
        return "bg-gray-100 text-gray-800 dark:text-white"
      case "Rescheduled":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800 dark:text-white"
    }
  }

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case "Enrolled":
        return "bg-green-100 text-green-800"
      case "Follow-up Required":
        return "bg-yellow-100 text-yellow-800"
      case "Not Interested":
        return "bg-red-100 text-red-800"
      case "Pending Decision":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800 dark:text-white"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="w-4 h-4" />
      case "No Show":
        return <XCircle className="w-4 h-4" />
      case "Confirmed":
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className={`w-4 h-4 ${star <= rating ? "text-yellow-400 fill-current" : "text-gray-300 dark:text-white"}`} />
        ))}
      </div>
    )
  
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: primaryColor }}></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trial Sessions</h1>
          <p className="text-gray-500 dark:text-white">Schedule and manage trial classes</p>
        </div>
        <Button className="w-full md:w-auto text-white" style={{ backgroundColor: primaryColor }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}dd`} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor} onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Trial
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Input
              placeholder="Search trials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="No Show">No Show</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                <SelectItem value="Web Development">Web Development</SelectItem>
                <SelectItem value="Data Science">Data Science</SelectItem>
                <SelectItem value="Python Programming">Python Programming</SelectItem>
              </SelectContent>
            </Select>
            <Select value={instructorFilter} onValueChange={setInstructorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Instructor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Instructors</SelectItem>
                <SelectItem value="Rajesh Kumar">Rajesh Kumar</SelectItem>
                <SelectItem value="Dr. Sarah Wilson">Dr. Sarah Wilson</SelectItem>
                <SelectItem value="Priya Mehta">Priya Mehta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trial ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrials.map((trial) => (
                <TableRow key={trial.id}>
                  <TableCell className="font-medium">{trial.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{trial.studentName}</div>
                      <div className="text-sm text-gray-500 dark:text-white">{trial.contactNumber}</div>
                    </div>
                  </TableCell>
                  <TableCell>{trial.course}</TableCell>
                  <TableCell>
                    <div>
                      <div>{trial.trialDate}</div>
                      <div className="text-sm text-gray-500 dark:text-white">{trial.trialTime}</div>
                    </div>
                  </TableCell>
                  <TableCell>{trial.instructor}</TableCell>
                  <TableCell>
                    <Badge variant={trial.mode === "Online" ? "default" : "secondary"}>
                      {trial.mode}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(trial.status)}>{trial.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTrial(trial)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
