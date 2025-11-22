"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Badge } from "@/components/dashboard/ui/badge"
import { Textarea } from "@/components/dashboard/ui/textarea"
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
import {
  Plus,
  Search,
  Calendar,
  Clock,
  User,
  FileText,
  Paperclip,
  MessageSquare,
  Phone,
  Video,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { CRMNavigation } from "@/components/dashboard/crm-navigation"

interface CounselingSession {
  id: string
  studentName: string
  studentId: string
  counselorName: string
  sessionDate: string
  sessionType: "First-level" | "Second-level" | "Follow-up" | "Trial Feedback"
  duration: number // in minutes
  outcome: "Positive" | "Negative" | "Neutral"
  notesDiscussed: string
  nextSteps: string
  attachments?: string[]
  status: "Scheduled" | "Completed" | "Cancelled" | "No Show"
  communicationMode: "In-person" | "Phone" | "Video Call" | "WhatsApp"
  stage: string
  internalNotes?: string
  createdBy: string
  lastModified: string
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<CounselingSession[]>([])
  const [filteredSessions, setFilteredSessions] = useState<CounselingSession[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [counselorFilter, setCounselorFilter] = useState("all")
  const [sessionTypeFilter, setSessionTypeFilter] = useState("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedSession, setSelectedSession] = useState<CounselingSession | null>(null)

  useEffect(() => {
    const mockSessions: CounselingSession[] = [
        {
          id: "SES001",
          studentName: "Priya Sharma",
          studentId: "LEAD001",
          counselorName: "John Doe",
          sessionDate: "2024-01-15T14:30:00Z",
          sessionType: "First-level",
          duration: 45,
          outcome: "Positive",
          notesDiscussed:
            "Discussed Web Development curriculum, career prospects, and fee structure. Student showed high interest and asked detailed questions about placement support.",
          nextSteps: "Schedule trial class for React.js basics. Send course brochure and fee details.",
          attachments: ["course_brochure.pdf", "fee_structure.pdf"],
          status: "Completed",
          communicationMode: "Video Call",
          stage: "Initial Consultation",
          internalNotes: "Very motivated student, high conversion probability. Follow up within 2 days.",
          createdBy: "John Doe",
          lastModified: "2024-01-15T15:15:00Z",
        },
        {
          id: "SES002",
          studentName: "Rahul Kumar",
          studentId: "LEAD002",
          counselorName: "Jane Smith",
          sessionDate: "2024-01-14T16:00:00Z",
          sessionType: "Second-level",
          duration: 30,
          outcome: "Neutral",
          notesDiscussed:
            "Addressed concerns about course difficulty and time commitment. Explained flexible batch timings and support system.",
          nextSteps: "Arrange meeting with course instructor. Provide sample projects for review.",
          status: "Completed",
          communicationMode: "Phone",
          stage: "Objection Handling",
          internalNotes: "Student has some reservations about time commitment due to current job.",
          createdBy: "Jane Smith",
          lastModified: "2024-01-14T16:30:00Z",
        },
        {
          id: "SES003",
          studentName: "Anita Patel",
          studentId: "LEAD003",
          counselorName: "Mike Johnson",
          sessionDate: "2024-01-16T10:00:00Z",
          sessionType: "Trial Feedback",
          duration: 20,
          outcome: "Positive",
          notesDiscussed:
            "Collected feedback on Python trial class. Student enjoyed hands-on approach and instructor quality.",
          nextSteps: "Process enrollment for Python Full Stack course. Send admission form.",
          status: "Scheduled",
          communicationMode: "In-person",
          stage: "Post-Trial",
          createdBy: "Mike Johnson",
          lastModified: "2024-01-15T18:00:00Z",
        },
      ]
      setSessions(mockSessions)
      setFilteredSessions(mockSessions)
      setLoading(false)
  }, [])

  useEffect(() => {
    let filtered = sessions

    if (searchTerm) {
      filtered = filtered.filter(
        (session) =>
          session.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          session.counselorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          session.notesDiscussed.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((session) => session.status === statusFilter)
    }

    if (counselorFilter !== "all") {
      filtered = filtered.filter((session) => session.counselorName === counselorFilter)
    }

    if (sessionTypeFilter !== "all") {
      filtered = filtered.filter((session) => session.sessionType === sessionTypeFilter)
    }

    setFilteredSessions(filtered)
  }, [sessions, searchTerm, statusFilter, counselorFilter, sessionTypeFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-100 text-blue-800"
      case "Completed":
        return "bg-green-100 text-green-800"
      case "Cancelled":
        return "bg-red-100 text-red-800"
      case "No Show":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case "Positive":
        return "bg-green-100 text-green-800"
      case "Negative":
        return "bg-red-100 text-red-800"
      case "Neutral":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case "Positive":
        return <CheckCircle className="w-4 h-4" />
      case "Negative":
        return <XCircle className="w-4 h-4" />
      case "Neutral":
        return <AlertCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  const getCommunicationIcon = (mode: string) => {
    switch (mode) {
      case "Phone":
        return <Phone className="w-4 h-4" />
      case "Video Call":
        return <Video className="w-4 h-4" />
      case "WhatsApp":
        return <MessageSquare className="w-4 h-4" />
      case "In-person":
        return <User className="w-4 h-4" />
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Counseling Sessions</h1>
          <p className="text-gray-500">Manage and track counseling sessions</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Session
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Input
              placeholder="Search sessions..."
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
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
                <SelectItem value="No Show">No Show</SelectItem>
              </SelectContent>
            </Select>
            <Select value={counselorFilter} onValueChange={setCounselorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Counselor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Counselors</SelectItem>
                <SelectItem value="John Doe">John Doe</SelectItem>
                <SelectItem value="Jane Smith">Jane Smith</SelectItem>
                <SelectItem value="Mike Johnson">Mike Johnson</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sessionTypeFilter} onValueChange={setSessionTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Session Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="First-level">First-level</SelectItem>
                <SelectItem value="Second-level">Second-level</SelectItem>
                <SelectItem value="Follow-up">Follow-up</SelectItem>
                <SelectItem value="Trial Feedback">Trial Feedback</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Counselor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.id}</TableCell>
                  <TableCell>{session.studentName}</TableCell>
                  <TableCell>{session.counselorName}</TableCell>
                  <TableCell>{new Date(session.sessionDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{session.sessionType}</Badge>
                  </TableCell>
                  <TableCell>{session.duration} min</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(session.status)}>{session.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getOutcomeColor(session.outcome)}>{session.outcome}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedSession(session)}>
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
