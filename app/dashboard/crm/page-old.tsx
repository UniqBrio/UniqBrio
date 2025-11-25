'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/dashboard/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/dashboard/ui/tabs';
import { Button } from '@/components/dashboard/ui/button';
import { Input } from '@/components/dashboard/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/dashboard/ui/select';
import { Badge } from '@/components/dashboard/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/dashboard/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/dashboard/ui/dialog';
import { Textarea } from '@/components/dashboard/ui/textarea';
import { Label } from '@/components/dashboard/ui/label';
import { useToast } from '@/hooks/dashboard/use-toast';
import { StatusBadge, PriorityBadge, SourceBadge } from '@/components/dashboard/crm-old/status-badges';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  Edit,
  Trash2,
  Eye,
  MessageSquare,
  PhoneCall,
  Video,
  FileText,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/dashboard/ui/dropdown-menu';

// Helper function for consistent date formatting
const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Mock data for enquiries
const mockEnquiries = [
  {
    _id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '1234567890',
    countryCode: '+1',
    source: 'website',
    interestedIn: ['Web Development', 'Python Course'],
    message: 'Interested in learning web development',
    status: 'new',
    priority: 'high',
    followUpDate: '2025-11-25',
    notes: 'Very interested prospect',
    createdAt: '2025-11-15',
  },
  {
    _id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '9876543210',
    countryCode: '+1',
    source: 'referral',
    interestedIn: ['Data Science', 'Machine Learning'],
    message: 'Want to know more about data science courses',
    status: 'contacted',
    priority: 'medium',
    followUpDate: '2025-11-22',
    notes: 'Already contacted via email',
    createdAt: '2025-11-18',
  },
  {
    _id: '3',
    firstName: 'Michael',
    lastName: 'Johnson',
    email: 'michael.j@example.com',
    phone: '5551234567',
    countryCode: '+1',
    source: 'phone',
    interestedIn: ['Mobile App Development'],
    status: 'in-progress',
    priority: 'high',
    createdAt: '2025-11-19',
  },
];

const formatDisplayDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  return `${month}/${day}/${year}`;
};

// Mock data for leads
const mockLeads = [
  {
    _id: '1',
    firstName: 'Sarah',
    lastName: 'Williams',
    email: 'sarah.w@company.com',
    phone: '5559876543',
    countryCode: '+1',
    company: 'Tech Corp',
    position: 'CTO',
    source: 'email',
    interestedIn: ['Corporate Training', 'React Course'],
    status: 'qualified',
    stage: 'interest',
    priority: 'high',
    leadScore: 85,
    estimatedValue: 5000,
    currency: 'USD',
    followUpDate: '2025-11-23',
    expectedCloseDate: '2025-12-15',
    notes: 'Looking for team training',
    activities: [
      {
        _id: '1',
        type: 'call',
        description: 'Initial discovery call completed',
        date: '2025-11-18T10:00:00Z',
        createdBy: 'Admin',
      },
    ],
    createdAt: '2025-11-10',
  },
  {
    _id: '2',
    firstName: 'Robert',
    lastName: 'Brown',
    email: 'robert.b@startup.io',
    phone: '5551112222',
    countryCode: '+1',
    company: 'Startup Inc',
    position: 'Founder',
    source: 'social-media',
    interestedIn: ['Full Stack Development', 'DevOps'],
    status: 'proposal',
    stage: 'consideration',
    priority: 'high',
    leadScore: 75,
    estimatedValue: 8000,
    currency: 'USD',
    expectedCloseDate: '2025-12-01',
    notes: 'Sent proposal, waiting for response',
    activities: [
      {
        _id: '1',
        type: 'email',
        description: 'Sent detailed proposal',
        date: '2025-11-19T14:30:00Z',
        createdBy: 'Admin',
      },
    ],
    createdAt: '2025-11-12',
  },
  {
    _id: '3',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.d@company.com',
    phone: '5553334444',
    countryCode: '+1',
    company: 'Digital Agency',
    position: 'HR Manager',
    source: 'website',
    interestedIn: ['UI/UX Design', 'Frontend Development'],
    status: 'negotiation',
    stage: 'intent',
    priority: 'medium',
    leadScore: 90,
    estimatedValue: 12000,
    currency: 'USD',
    expectedCloseDate: '2025-11-30',
    notes: 'In final negotiation stage',
    activities: [
      {
        _id: '1',
        type: 'meeting',
        description: 'Had negotiation meeting',
        date: '2025-11-20T09:00:00Z',
        createdBy: 'Admin',
      },
    ],
    createdAt: '2025-11-08',
  },
];

export default function CRMPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('enquiries');
  const [enquiries, setEnquiries] = useState<any[]>(mockEnquiries);
  const [leads, setLeads] = useState<any[]>(mockLeads);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Dialog states
  const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [addActivityOpen, setAddActivityOpen] = useState(false);
  const [activityType, setActivityType] = useState('note');
  const [activityDescription, setActivityDescription] = useState('');

  // Filter data
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((enquiry) => {
      const matchesSearch =
        !searchTerm ||
        enquiry.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.phone.includes(searchTerm);

      const matchesStatus = statusFilter === 'all' || enquiry.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || enquiry.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [enquiries, searchTerm, statusFilter, priorityFilter]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        !searchTerm ||
        lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [leads, searchTerm, statusFilter, priorityFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const data = activeTab === 'enquiries' ? filteredEnquiries : filteredLeads;
    const statsObj: any = {};

    data.forEach((item) => {
      if (statsObj[item.status]) {
        statsObj[item.status]++;
      } else {
        statsObj[item.status] = 1;
      }
    });

    return statsObj;
  }, [activeTab, filteredEnquiries, filteredLeads]);

  const handleDeleteEnquiry = (id: string) => {
    if (!confirm('Are you sure you want to delete this enquiry?')) return;

    setEnquiries((prev) => prev.filter((e) => e._id !== id));
    toast({
      title: 'Success',
      description: 'Enquiry deleted successfully',
    });
  };

  const handleDeleteLead = (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    setLeads((prev) => prev.filter((l) => l._id !== id));
    toast({
      title: 'Success',
      description: 'Lead deleted successfully',
    });
  };

  const handleAddActivity = () => {
    if (!selectedLead || !activityDescription) return;

    const now = new Date();
    const newActivity = {
      _id: Date.now().toString(),
      type: activityType,
      description: activityDescription,
      date: now.toISOString(),
      createdBy: 'Admin',
    };

    setLeads((prev) =>
      prev.map((lead) =>
        lead._id === selectedLead._id
          ? { ...lead, activities: [...(lead.activities || []), newActivity] }
          : lead
      )
    );

    toast({
      title: 'Success',
      description: 'Activity added successfully',
    });
    setAddActivityOpen(false);
    setActivityDescription('');
  };

  const viewDetails = (item: any) => {
    if (activeTab === 'enquiries') {
      setSelectedEnquiry(item);
    } else {
      setSelectedLead(item);
    }
    setViewDetailsOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Customer Relations Management</h1>
          <p className="text-muted-foreground mt-2">Manage enquiries and leads efficiently</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total {activeTab === 'enquiries' ? 'Enquiries' : 'Leads'}</p>
                <p className="text-2xl font-bold text-purple-800">
                  {activeTab === 'enquiries' ? filteredEnquiries.length : filteredLeads.length}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-xs text-purple-600 mt-1">
              across all sources
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">New</p>
                <p className="text-2xl font-bold text-blue-800">{stats?.new || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-blue-600 mt-1">
              pending review
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">In Progress</p>
                <p className="text-2xl font-bold text-orange-800">
                  {activeTab === 'enquiries' 
                    ? (stats?.contacted || 0) + (stats?.['in-progress'] || 0)
                    : (stats?.qualified || 0) + (stats?.proposal || 0)
                  }
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-xs text-orange-600 mt-1">
              being processed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">
                  {activeTab === 'enquiries' ? 'Converted' : 'Won'}
                </p>
                <p className="text-2xl font-bold text-green-800">
                  {activeTab === 'enquiries' ? (stats?.converted || 0) : (stats?.won || 0)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-green-600 mt-1">
              successfully closed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-purple-300 bg-gradient-to-br from-purple-50 to-purple-150">
        <CardHeader className="pb-2 border-b border-purple-200 bg-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2 text-purple-700">
                <Users className="h-6 w-6 text-purple-600" />
                Customer Relations
              </CardTitle>
              <CardDescription className="mt-1 text-gray-600 dark:text-white">View and manage all customer enquiries and leads</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-transparent gap-2 p-0 h-auto">
              <TabsTrigger
                value="enquiries"
                className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-transparent bg-purple-500 text-white font-medium data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:border-orange-400 data-[state=inactive]:text-orange-600 hover:bg-purple-600 data-[state=inactive]:hover:bg-orange-50"
              >
                <Mail className="h-4 w-4" />
                Enquiries
              </TabsTrigger>
              <TabsTrigger
                value="leads"
                className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-orange-400 bg-transparent text-orange-600 font-medium data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-orange-400 data-[state=inactive]:text-orange-600 hover:bg-orange-50 data-[state=active]:hover:bg-purple-600"
              >
                <TrendingUp className="h-4 w-4" />
                Leads
              </TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {activeTab === 'enquiries' ? (
                    <>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="enquiries" className="space-y-4 mt-0">
              {filteredEnquiries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Mail className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">No enquiries found</p>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">Contact</TableHead>
                        <TableHead className="font-semibold">Source</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Priority</TableHead>
                        <TableHead className="font-semibold">Interested In</TableHead>
                        <TableHead className="font-semibold">Follow-up</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEnquiries.map((enquiry) => (
                        <TableRow key={enquiry._id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            {enquiry.firstName} {enquiry.lastName}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                {enquiry.email}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {enquiry.countryCode} {enquiry.phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <SourceBadge source={enquiry.source} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={enquiry.status} variant="enquiry" />
                          </TableCell>
                          <TableCell>
                            <PriorityBadge priority={enquiry.priority} />
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {enquiry.interestedIn?.slice(0, 2).map((item: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {item}
                                </Badge>
                              ))}
                              {enquiry.interestedIn?.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{enquiry.interestedIn.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {enquiry.followUpDate && (
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3" />
                                {formatDisplayDate(enquiry.followUpDate)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => viewDetails(enquiry)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteEnquiry(enquiry._id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="leads" className="space-y-4 mt-0">
              {filteredLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">No leads found</p>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">Contact</TableHead>
                        <TableHead className="font-semibold">Company</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Stage</TableHead>
                        <TableHead className="font-semibold">Priority</TableHead>
                        <TableHead className="font-semibold">Score</TableHead>
                        <TableHead className="font-semibold">Value</TableHead>
                        <TableHead className="font-semibold">Close Date</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.map((lead) => (
                        <TableRow key={lead._id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            {lead.firstName} {lead.lastName}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                {lead.email}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {lead.countryCode} {lead.phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {lead.company && (
                              <div>
                                <div className="font-medium">{lead.company}</div>
                                {lead.position && (
                                  <div className="text-sm text-muted-foreground">{lead.position}</div>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={lead.status} variant="lead" />
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {lead.stage}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <PriorityBadge priority={lead.priority} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-12 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${lead.leadScore}%` }}
                                />
                              </div>
                              <span className="text-sm">{lead.leadScore}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {lead.estimatedValue && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {lead.currency} {lead.estimatedValue.toLocaleString()}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {lead.expectedCloseDate && (
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3" />
                                {formatDisplayDate(lead.expectedCloseDate)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => viewDetails(lead)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedLead(lead);
                                    setAddActivityOpen(true);
                                  }}
                                >
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Add Activity
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteLead(lead._id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl">
              {activeTab === 'enquiries' ? 'Enquiry' : 'Lead'} Details
            </DialogTitle>
          </DialogHeader>
          {activeTab === 'enquiries' && selectedEnquiry ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">
                    {selectedEnquiry.firstName} {selectedEnquiry.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p>{selectedEnquiry.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p>
                    {selectedEnquiry.countryCode} {selectedEnquiry.phone}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Source</Label>
                  <p className="capitalize">{selectedEnquiry.source.replace('-', ' ')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={selectedEnquiry.status} variant="enquiry" />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Priority</Label>
                  <div className="mt-1">
                    <PriorityBadge priority={selectedEnquiry.priority} />
                  </div>
                </div>
              </div>
              {selectedEnquiry.interestedIn?.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Interested In</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedEnquiry.interestedIn.map((item: string, idx: number) => (
                      <Badge key={idx} variant="outline">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedEnquiry.message && (
                <div>
                  <Label className="text-muted-foreground">Message</Label>
                  <p className="mt-1 text-sm bg-muted p-3 rounded-md">{selectedEnquiry.message}</p>
                </div>
              )}
              {selectedEnquiry.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="mt-1 text-sm bg-muted p-3 rounded-md">{selectedEnquiry.notes}</p>
                </div>
              )}
              {selectedEnquiry.followUpDate && (
                <div>
                  <Label className="text-muted-foreground">Follow-up Date</Label>
                  <p>{formatDisplayDate(selectedEnquiry.followUpDate)}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Created At</Label>
                <p>{formatDisplayDate(selectedEnquiry.createdAt)}</p>
              </div>
            </div>
          ) : selectedLead ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">
                    {selectedLead.firstName} {selectedLead.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p>{selectedLead.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p>
                    {selectedLead.countryCode} {selectedLead.phone}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Company</Label>
                  <p>{selectedLead.company || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Position</Label>
                  <p>{selectedLead.position || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Source</Label>
                  <p className="capitalize">{selectedLead.source.replace('-', ' ')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={selectedLead.status} variant="lead" />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Stage</Label>
                  <div className="mt-1">
                    <Badge variant="secondary" className="capitalize">
                      {selectedLead.stage}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Priority</Label>
                  <div className="mt-1">
                    <PriorityBadge priority={selectedLead.priority} />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Lead Score</Label>
                  <p className="font-medium">{selectedLead.leadScore}/100</p>
                </div>
                {selectedLead.estimatedValue && (
                  <div>
                    <Label className="text-muted-foreground">Estimated Value</Label>
                    <p className="font-medium">
                      {selectedLead.currency} {selectedLead.estimatedValue.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
              {selectedLead.interestedIn?.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Interested In</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedLead.interestedIn.map((item: string, idx: number) => (
                      <Badge key={idx} variant="outline">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedLead.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="mt-1 text-sm bg-muted p-3 rounded-md">{selectedLead.notes}</p>
                </div>
              )}
              {selectedLead.activities?.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Activities</Label>
                  <div className="mt-2 space-y-2">
                    {selectedLead.activities.map((activity: any, idx: number) => (
                      <div key={idx} className="bg-muted p-3 rounded-md">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="capitalize">
                            {activity.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDisplayDate(activity.date.split('T')[0])}
                          </span>
                        </div>
                        <p className="text-sm">{activity.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {selectedLead.followUpDate && (
                  <div>
                    <Label className="text-muted-foreground">Follow-up Date</Label>
                    <p>{formatDisplayDate(selectedLead.followUpDate)}</p>
                  </div>
                )}
                {selectedLead.expectedCloseDate && (
                  <div>
                    <Label className="text-muted-foreground">Expected Close Date</Label>
                    <p>{formatDisplayDate(selectedLead.expectedCloseDate)}</p>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground">Created At</Label>
                <p>{formatDisplayDate(selectedLead.createdAt)}</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Add Activity Dialog */}
      <Dialog open={addActivityOpen} onOpenChange={setAddActivityOpen}>
        <DialogContent>
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl">Add Activity</DialogTitle>
            <DialogDescription>Record a new activity for this lead</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="activityType">Activity Type</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">
                    <div className="flex items-center gap-2">
                      <PhoneCall className="h-4 w-4" />
                      Phone Call
                    </div>
                  </SelectItem>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                  </SelectItem>
                  <SelectItem value="meeting">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Meeting
                    </div>
                  </SelectItem>
                  <SelectItem value="note">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Note
                    </div>
                  </SelectItem>
                  <SelectItem value="task">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Task
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="activityDescription">Description</Label>
              <Textarea
                id="activityDescription"
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                rows={4}
                placeholder="Describe the activity..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddActivityOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddActivity} disabled={!activityDescription}>
              Add Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </MainLayout>
  );
}
