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
import { Plus, Search, MessageSquare, Phone, Mail, Bot, Send } from "lucide-react"
import { CRMNavigation } from "@/components/dashboard/crm-navigation"

interface Enquiry {
  id: string
  fullName: string
  contactNumber: string
  email: string
  preferredCourse: string
  enquiryType: "Course" | "Billing" | "Service" | "Technical"
  status: "New" | "In Progress" | "Resolved" | "Escalated"
  priority: "High" | "Medium" | "Low"
  source: string
  assignedCounselor?: string
  createdAt: string
  lastContact?: string
  aiSentiment?: "Positive" | "Neutral" | "Negative"
  conversionProbability?: number
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [filteredEnquiries, setFilteredEnquiries] = useState<Enquiry[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null)
  const [aiResponse, setAiResponse] = useState("")

  useEffect(() => {
    // Simulate API call
      const mockEnquiries: Enquiry[] = [
        {
          id: "ENQ001",
          fullName: "Priya Sharma",
          contactNumber: "+91 9876543210",
          email: "priya.sharma@email.com",
          preferredCourse: "Web Development",
          enquiryType: "Course",
          status: "New",
          priority: "High",
          source: "Website Form",
          createdAt: "2024-01-15T10:30:00Z",
          aiSentiment: "Positive",
          conversionProbability: 85,
        },
        {
          id: "ENQ002",
          fullName: "Rahul Kumar",
          contactNumber: "+91 9876543211",
          email: "rahul.kumar@email.com",
          preferredCourse: "Data Science",
          enquiryType: "Course",
          status: "In Progress",
          priority: "Medium",
          source: "WhatsApp",
          assignedCounselor: "John Doe",
          createdAt: "2024-01-14T15:45:00Z",
          lastContact: "2024-01-15T09:00:00Z",
          aiSentiment: "Neutral",
          conversionProbability: 65,
        },
        {
          id: "ENQ003",
          fullName: "Anita Patel",
          contactNumber: "+91 9876543212",
          email: "anita.patel@email.com",
          preferredCourse: "Python Programming",
          enquiryType: "Billing",
          status: "Escalated",
          priority: "High",
          source: "QR Code",
          assignedCounselor: "Jane Smith",
          createdAt: "2024-01-13T11:20:00Z",
          lastContact: "2024-01-14T16:30:00Z",
          aiSentiment: "Negative",
          conversionProbability: 30,
        },
      ]
      setEnquiries(mockEnquiries)
      setFilteredEnquiries(mockEnquiries)
      setLoading(false)
  }, [])

  useEffect(() => {
    let filtered = enquiries

    if (searchTerm) {
      filtered = filtered.filter(
        (enquiry) =>
          enquiry.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enquiry.preferredCourse.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((enquiry) => enquiry.status === statusFilter)
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((enquiry) => enquiry.priority === priorityFilter)
    }

    setFilteredEnquiries(filtered)
  }, [enquiries, searchTerm, statusFilter, priorityFilter])

  const generateAIResponse = async (enquiry: Enquiry) => {
    setAiResponse("Generating AI response...")

    // Simulate AI response generation
    setTimeout(() => {
      const responses = [
        `Hi ${enquiry.fullName}! Thank you for your interest in ${enquiry.preferredCourse}. Based on your background, I'd recommend starting with our foundation module. Would you like to schedule a free trial session?`,
        `Hello ${enquiry.fullName}, I understand you have questions about ${enquiry.preferredCourse}. Our program is designed for beginners and includes hands-on projects. Let me know if you'd like to discuss the curriculum in detail.`,
        `Dear ${enquiry.fullName}, thank you for reaching out about ${enquiry.preferredCourse}. I can see you're serious about learning - our success rate for motivated students like you is 95%. Shall we set up a consultation call?`,
      ]
      setAiResponse(responses[Math.floor(Math.random() * responses.length)])
    }, 500)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-100 text-blue-800"
      case "In Progress":
        return "bg-yellow-100 text-yellow-800"
      case "Resolved":
        return "bg-green-100 text-green-800"
      case "Escalated":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Enquiry Management</h1>
              <p className="text-gray-600">Manage and respond to student enquiries with AI assistance</p>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto bg-purple-500 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Enquiry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Enquiry</DialogTitle>
                  <DialogDescription>Manually add a new enquiry to the system</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input id="fullName" placeholder="Enter full name" />
                  </div>
                  <div>
                    <Label htmlFor="contactNumber">Contact Number *</Label>
                    <Input id="contactNumber" placeholder="+91 XXXXXXXXXX" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email ID *</Label>
                    <Input id="email" type="email" placeholder="email@example.com" />
                  </div>
                  <div>
                    <Label htmlFor="preferredCourse">Preferred Course</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="web-dev">Web Development</SelectItem>
                        <SelectItem value="data-science">Data Science</SelectItem>
                        <SelectItem value="python">Python Programming</SelectItem>
                        <SelectItem value="ai-ml">AI/ML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="enquiryType">Enquiry Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Course">Course</SelectItem>
                        <SelectItem value="Billing">Billing</SelectItem>
                        <SelectItem value="Service">Service</SelectItem>
                        <SelectItem value="Technical">Technical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="source">Source</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">Website Form</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="qr">QR Code</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="walk-in">Walk-in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="comments">Additional Comments</Label>
                    <Textarea id="comments" placeholder="Enter any additional details..." />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button className="gradient-bg text-white">Add Enquiry</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search enquiries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Escalated">Escalated</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Enquiries Table */}
          <Card>
            <CardHeader>
              <CardTitle>Enquiries ({filteredEnquiries.length})</CardTitle>
              <CardDescription>Manage all incoming enquiries and track their progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Enquiry ID</TableHead>
                      <TableHead>Student Details</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>AI Insights</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEnquiries.map((enquiry) => (
                      <TableRow key={enquiry.id}>
                        <TableCell className="font-medium">{enquiry.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{enquiry.fullName}</p>
                            <p className="text-sm text-gray-600">{enquiry.email}</p>
                            <p className="text-sm text-gray-600">{enquiry.contactNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>{enquiry.preferredCourse}</TableCell>
                        <TableCell>{enquiry.enquiryType}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(enquiry.status)}>{enquiry.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(enquiry.priority)}>{enquiry.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {enquiry.aiSentiment && (
                              <Badge variant="outline" className="text-xs">
                                {enquiry.aiSentiment}
                              </Badge>
                            )}
                            {enquiry.conversionProbability && (
                              <p className="text-xs text-gray-600">{enquiry.conversionProbability}% conversion</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => setSelectedEnquiry(enquiry)}>
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Phone className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Mail className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* AI Response Dialog */}
          {selectedEnquiry && (
            <Dialog open={!!selectedEnquiry} onOpenChange={() => setSelectedEnquiry(null)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>AI-Powered Response for {selectedEnquiry.fullName}</DialogTitle>
                  <DialogDescription>Generate intelligent responses using AI assistance</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Enquiry Details:</h4>
                    <p>
                      <strong>Course:</strong> {selectedEnquiry.preferredCourse}
                    </p>
                    <p>
                      <strong>Type:</strong> {selectedEnquiry.enquiryType}
                    </p>
                    <p>
                      <strong>Sentiment:</strong> {selectedEnquiry.aiSentiment}
                    </p>
                    <p>
                      <strong>Conversion Probability:</strong> {selectedEnquiry.conversionProbability}%
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>AI-Generated Response:</Label>
                      <Button
                        size="sm"
                        onClick={() => generateAIResponse(selectedEnquiry)}
                        className="gradient-bg text-white"
                      >
                        <Bot className="w-4 h-4 mr-2" />
                        Generate AI Response
                      </Button>
                    </div>
                    <Textarea
                      value={aiResponse}
                      onChange={(e) => setAiResponse(e.target.value)}
                      placeholder="AI response will appear here..."
                      rows={6}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setSelectedEnquiry(null)}>
                      Cancel
                    </Button>
                    <Button className="gradient-bg text-white">
                      <Send className="w-4 h-4 mr-2" />
                      Send Response
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
  )
}
