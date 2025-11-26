"use client"

import { useState, useEffect } from "react"
import { useCustomColors } from '@/lib/use-custom-colors';
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
import { Plus, Search, Users, Phone, Mail, Calendar, Edit, Upload, Download, Star, Clock } from "lucide-react"
import { CRMNavigation } from "@/components/dashboard/crm-navigation"

interface Lead {
  id: string
  leadName: string
  contactNumber: string
  email: string
  age?: number
  guardianName?: string
  programsInterested: string[]
  source: "Referral" | "QR" | "Walk-in" | "Website" | "Event"
  priority: "Hot" | "Warm" | "Cold"
  assignedCounselor?: string
  notes: string
  dateOfEnquiry: string
  customTags: string[]
  status: "New" | "Contacted" | "Qualified" | "Trial Scheduled" | "Converted" | "Lost"
  lastActivity?: string
  nextFollowUp?: string
}

export default function LeadsPage() {
  const { primaryColor, secondaryColor } = useCustomColors();
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  useEffect(() => {
    // Simulate API call
      const mockLeads: Lead[] = [
        {
          id: "LEAD001",
          leadName: "Amit Sharma",
          contactNumber: "+91 9876543210",
          email: "amit.sharma@email.com",
          age: 24,
          programsInterested: ["Web Development", "React.js"],
          source: "Website",
          priority: "Hot",
          assignedCounselor: "John Doe",
          notes: "Very interested in full-stack development. Has some basic HTML/CSS knowledge.",
          dateOfEnquiry: "2024-01-15T10:30:00Z",
          customTags: ["experienced", "motivated"],
          status: "Qualified",
          lastActivity: "2024-01-15T14:30:00Z",
          nextFollowUp: "2024-01-16T10:00:00Z",
        },
        {
          id: "LEAD002",
          leadName: "Sneha Patel",
          contactNumber: "+91 9876543211",
          email: "sneha.patel@email.com",
          age: 22,
          programsInterested: ["Data Science", "Python"],
          source: "Referral",
          priority: "Warm",
          assignedCounselor: "Jane Smith",
          notes: "Recent graduate looking to switch to tech. Needs guidance on career path.",
          dateOfEnquiry: "2024-01-14T15:45:00Z",
          customTags: ["graduate", "career-change"],
          status: "Contacted",
          lastActivity: "2024-01-14T16:00:00Z",
          nextFollowUp: "2024-01-17T11:00:00Z",
        },
        {
          id: "LEAD003",
          leadName: "Rajesh Kumar",
          contactNumber: "+91 9876543212",
          email: "rajesh.kumar@email.com",
          age: 19,
          guardianName: "Suresh Kumar",
          programsInterested: ["AI/ML", "Python"],
          source: "QR",
          priority: "Cold",
          notes: "College student, interested but budget constraints mentioned.",
          dateOfEnquiry: "2024-01-13T11:20:00Z",
          customTags: ["student", "budget-conscious"],
          status: "New",
          lastActivity: "2024-01-13T11:20:00Z",
        },
      ]
      setLeads(mockLeads)
      setFilteredLeads(mockLeads)
      setLoading(false)
  }, [])

  useEffect(() => {
    let filtered = leads

    if (searchTerm) {
      filtered = filtered.filter(
        (lead) =>
          lead.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.programsInterested.some((program) => program.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((lead) => lead.status === statusFilter)
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((lead) => lead.priority === priorityFilter)
    }

    if (sourceFilter !== "all") {
      filtered = filtered.filter((lead) => lead.source === sourceFilter)
    }

    setFilteredLeads(filtered)
  }, [leads, searchTerm, statusFilter, priorityFilter, sourceFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-100 text-blue-800"
      case "Contacted":
        return "bg-yellow-100 text-yellow-800"
      case "Qualified":
        return `bg-[${primaryColor}15] text-[${primaryColor}]`
      case "Trial Scheduled":
        return `bg-[${secondaryColor}15] text-[${secondaryColor}]`
      case "Converted":
        return "bg-green-100 text-green-800"
      case "Lost":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800 dark:text-white"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Hot":
        return "bg-red-100 text-red-800"
      case "Warm":
        return "bg-yellow-100 text-yellow-800"
      case "Cold":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800 dark:text-white"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "Hot":
        return <Star className="w-3 h-3 fill-current" />
      case "Warm":
        return <Star className="w-3 h-3" />
      case "Cold":
        return <Clock className="w-3 h-3" />
      default:
        return null
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Lead Management</h1>
            <p className="text-gray-600 dark:text-white">Track and manage potential students through the conversion funnel</p>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <Button variant="outline" className="w-full md:w-auto bg-transparent">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" className="w-full md:w-auto bg-transparent">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto text-white" style={{ backgroundColor: primaryColor }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}dd`} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lead
                </Button>
              </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Lead</DialogTitle>
                    <DialogDescription>Manually add a new lead to the system</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="leadName">Lead Name *</Label>
                      <Input id="leadName" placeholder="Enter full name" />
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
                      <Label htmlFor="age">Age</Label>
                      <Input id="age" type="number" placeholder="Enter age" />
                    </div>
                    <div>
                      <Label htmlFor="guardianName">Guardian Name (for minors)</Label>
                      <Input id="guardianName" placeholder="Guardian's name" />
                    </div>
                    <div>
                      <Label htmlFor="source">Source</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Referral">Referral</SelectItem>
                          <SelectItem value="QR">QR Code</SelectItem>
                          <SelectItem value="Walk-in">Walk-in</SelectItem>
                          <SelectItem value="Website">Website</SelectItem>
                          <SelectItem value="Event">Event</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">Lead Priority</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hot">Hot</SelectItem>
                          <SelectItem value="Warm">Warm</SelectItem>
                          <SelectItem value="Cold">Cold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="assignedCounselor">Assigned Counselor</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select counselor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="john-doe">John Doe</SelectItem>
                          <SelectItem value="jane-smith">Jane Smith</SelectItem>
                          <SelectItem value="mike-johnson">Mike Johnson</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="programsInterested">Programs Interested</Label>
                      <Input id="programsInterested" placeholder="e.g., Web Development, Data Science" />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="customTags">Custom Tags</Label>
                      <Input id="customTags" placeholder="e.g., experienced, motivated, budget-conscious" />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="notes">Notes/Observations</Label>
                      <Textarea id="notes" placeholder="Enter any observations or notes about the lead..." rows={3} />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button className="gradient-bg text-white">Add Lead</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-white">Total Leads</p>
                    <p className="text-2xl font-bold">{leads.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-white">Hot Leads</p>
                    <p className="text-2xl font-bold text-red-600">
                      {leads.filter((l) => l.priority === "Hot").length}
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-red-500 fill-current" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-white">Qualified</p>
                    <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                      {leads.filter((l) => l.status === "Qualified").length}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8" style={{ color: primaryColor }} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-white">Converted</p>
                    <p className="text-2xl font-bold text-green-600">
                      {leads.filter((l) => l.status === "Converted").length}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white w-4 h-4" />
                    <Input
                      placeholder="Search leads..."
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
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Qualified">Qualified</SelectItem>
                    <SelectItem value="Trial Scheduled">Trial Scheduled</SelectItem>
                    <SelectItem value="Converted">Converted</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="Hot">Hot</SelectItem>
                    <SelectItem value="Warm">Warm</SelectItem>
                    <SelectItem value="Cold">Cold</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="QR">QR Code</SelectItem>
                    <SelectItem value="Walk-in">Walk-in</SelectItem>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Leads Table */}
          <Card>
            <CardHeader>
              <CardTitle>Leads ({filteredLeads.length})</CardTitle>
              <CardDescription>Manage and track all potential students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead ID</TableHead>
                      <TableHead>Lead Details</TableHead>
                      <TableHead>Programs</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Counselor</TableHead>
                      <TableHead>Next Follow-up</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{lead.leadName}</p>
                            <p className="text-sm text-gray-600 dark:text-white">{lead.email}</p>
                            <p className="text-sm text-gray-600 dark:text-white">{lead.contactNumber}</p>
                            {lead.age && <p className="text-sm text-gray-600 dark:text-white">Age: {lead.age}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {lead.programsInterested.map((program, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {program}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{lead.source}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {getPriorityIcon(lead.priority)}
                            <Badge className={getPriorityColor(lead.priority)}>{lead.priority}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {lead.assignedCounselor ? (
                            <span className="text-sm">{lead.assignedCounselor}</span>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-white">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {lead.nextFollowUp ? (
                            <span className="text-sm">{new Date(lead.nextFollowUp).toLocaleDateString()}</span>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-white">Not scheduled</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline">
                              <Phone className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Mail className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
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
      </div>
    </div>
  )
}
