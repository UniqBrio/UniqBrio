"use client"

export const dynamic = 'force-dynamic'

import React, { useState, useMemo } from "react"
;
import CampaignFilters from "@/components/dashboard/promotion/campaign-filters";
import CampaignList from "@/components/dashboard/promotion/campaign-list";
import CampaignModal from "@/components/dashboard/promotion/campaign-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card";
import { Badge } from "@/components/dashboard/ui/badge";
import { Button } from "@/components/dashboard/ui/button";
import { Input } from "@/components/dashboard/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/dashboard/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/dashboard/ui/dialog";
import { 
  TrendingUp, 
  Award, 
  Users, 
  Gift, 
  BadgeIcon as Certificate, 
  Megaphone, 
  Palette, 
  Video,
  Sparkles,
  Calendar,
  QrCode,
  FileText,
  Image,
  CreditCard,
  Globe,
  Clock,
  Star,
  Zap,
  Heart,
  Camera,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Download,
  Share2,
  TrendingDown,
  BarChart3,
  Trophy,
  LayoutDashboard,
  Briefcase,
  BarChart4,
  Check,
  Send,
  MessageCircle
} from "lucide-react"
import { useToast } from "@/hooks/dashboard/use-toast"
import AnalyticsDashboard from "@/components/dashboard/promotion/analytics-dashboard"
import { format } from "date-fns"

// Static Promotional Campaigns Data
interface Campaign {
  id: string
  title: string
  type: "Marketing" | "Contest" | "Certificate" | "Design" | "Media" | "Special"
  description: string
  startDate: string
  endDate: string
  status: "Active" | "Scheduled" | "Completed" | "Draft"
  reach: number
  engagement: number
  conversions: number
  roi: number
  featured: boolean
  createdAt: string
}

const mockCampaigns: Campaign[] = [
  {
    id: "CAMP001",
    title: "Summer Enrollment Drive 2025",
    type: "Marketing",
    description: "Targeted campaign to boost summer batch enrollments across all sports",
    startDate: "2025-04-01",
    endDate: "2025-06-30",
    status: "Scheduled",
    reach: 15000,
    engagement: 3200,
    conversions: 450,
    roi: 280,
    featured: true,
    createdAt: "2025-03-15"
  },
  {
    id: "CAMP002",
    title: "Student Achievement Showcase",
    type: "Contest",
    description: "Monthly contest featuring top student achievements and performances",
    startDate: "2025-01-10",
    endDate: "2025-12-31",
    status: "Active",
    reach: 8500,
    engagement: 2100,
    conversions: 320,
    roi: 195,
    featured: true,
    createdAt: "2025-01-01"
  },
  {
    id: "CAMP003",
    title: "Quarterly Newsletter",
    type: "Media",
    description: "Comprehensive newsletter highlighting academy updates and success stories",
    startDate: "2025-01-15",
    endDate: "2025-03-31",
    status: "Active",
    reach: 5200,
    engagement: 1850,
    conversions: 210,
    roi: 165,
    featured: false,
    createdAt: "2025-01-01"
  },
  {
    id: "CAMP004",
    title: "Certificate Generation Event",
    type: "Certificate",
    description: "Annual event for certificate generation and awards distribution",
    startDate: "2025-05-20",
    endDate: "2025-06-20",
    status: "Scheduled",
    reach: 3800,
    engagement: 950,
    conversions: 180,
    roi: 142,
    featured: false,
    createdAt: "2025-03-01"
  },
  {
    id: "CAMP005",
    title: "Student Birthday Campaign",
    type: "Design",
    description: "Personalized birthday celebrations for students with custom cards",
    startDate: "2025-02-01",
    endDate: "2025-12-31",
    status: "Active",
    reach: 12000,
    engagement: 4200,
    conversions: 680,
    roi: 315,
    featured: true,
    createdAt: "2025-01-20"
  },
  {
    id: "CAMP006",
    title: "Referral Program Launch",
    type: "Marketing",
    description: "Launch of academy referral program with attractive incentives",
    startDate: "2025-02-15",
    endDate: "2025-11-30",
    status: "Active",
    reach: 9800,
    engagement: 2650,
    conversions: 420,
    roi: 228,
    featured: true,
    createdAt: "2025-02-01"
  },
  {
    id: "CAMP007",
    title: "Digital Presence Enhancement",
    type: "Media",
    description: "Web app development and digital asset management initiative",
    startDate: "2025-03-01",
    endDate: "2025-08-31",
    status: "Active",
    reach: 6400,
    engagement: 1780,
    conversions: 290,
    roi: 175,
    featured: false,
    createdAt: "2025-02-15"
  },
  {
    id: "CAMP008",
    title: "PR Campaign Initiative",
    type: "Special",
    description: "Professional PR campaign to enhance academy reputation and visibility",
    startDate: "2025-01-20",
    endDate: "2025-12-20",
    status: "Active",
    reach: 22000,
    engagement: 5800,
    conversions: 920,
    roi: 425,
    featured: true,
    createdAt: "2025-01-15"
  }
]

// Available Promotion Tools
interface PromotionTool {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  category: string
}

const promotionTools: PromotionTool[] = [
  {
    id: "TOOL001",
    icon: <Megaphone className="h-6 w-6" />,
    title: "Smart Broadcast",
    description: "Send targeted messages to students, parents, and staff",
    category: "Communication"
  },
  {
    id: "TOOL002",
    icon: <Gift className="h-6 w-6" />,
    title: "Referral System",
    description: "Manage referral programs with reward tracking",
    category: "Marketing"
  },
  {
    id: "TOOL003",
    icon: <Sparkles className="h-6 w-6" />,
    title: "AI Image Generator",
    description: "Create promotional images and graphics",
    category: "Design"
  },
  {
    id: "TOOL004",
    icon: <Palette className="h-6 w-6" />,
    title: "Event Flyer Creator",
    description: "Design professional event flyers easily",
    category: "Design"
  },
  {
    id: "TOOL005",
    icon: <Certificate className="h-6 w-6" />,
    title: "Certificate Generator",
    description: "Generate certificates for achievements",
    category: "Certificates"
  },
  {
    id: "TOOL006",
    icon: <Globe className="h-6 w-6" />,
    title: "Academy Web App",
    description: "Create web presence for your academy",
    category: "Digital"
  },
  {
    id: "TOOL007",
    icon: <QrCode className="h-6 w-6" />,
    title: "QR Code Generator",
    description: "Generate QR codes for quick access",
    category: "Tools"
  },
  {
    id: "TOOL008",
    icon: <Camera className="h-6 w-6" />,
    title: "Art-Focused Calendar",
    description: "Showcase student artwork in calendars",
    category: "Campaigns"
  },
  {
    id: "TOOL009",
    icon: <Heart className="h-6 w-6" />,
    title: "Birthday Card Creator",
    description: "Design personalized birthday cards",
    category: "Campaigns"
  }
]

export default function PromotionPage() {
  const { toast } = useToast()
  
  // Campaign State Management
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"All" | "Active" | "Scheduled" | "Completed" | "Draft">("All")
  const [filterType, setFilterType] = useState<"All" | Campaign["type"]>("All")
  const [sortBy, setSortBy] = useState<"reach" | "engagement" | "roi">("reach")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | undefined>(undefined)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null)
  const [selectedTool, setSelectedTool] = useState<PromotionTool | null>(null)
  const [toolModalOpen, setToolModalOpen] = useState(false)
  const [toolChatMessages, setToolChatMessages] = useState<Array<{role: string, content: string}>>([])
  const [toolPromptInput, setToolPromptInput] = useState("")

  // CRUD Operations
  const handleAddCampaign = () => {
    setEditingCampaign(undefined)
    setIsModalOpen(true)
  }

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setIsModalOpen(true)
  }

  const handleSaveCampaign = (campaignData: Campaign) => {
    if (editingCampaign) {
      // Update existing campaign
      setCampaigns(campaigns.map(c => c.id === campaignData.id ? campaignData : c))
    } else {
      // Create new campaign
      setCampaigns([...campaigns, campaignData])
    }
  }

  const handleDeleteClick = (campaignId: string) => {
    setCampaignToDelete(campaignId)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (campaignToDelete) {
      setCampaigns(campaigns.filter(c => c.id !== campaignToDelete))
      setDeleteConfirmOpen(false)
      setCampaignToDelete(null)
    }
  }

  // CSV Export helpers
  const toCSV = (rows: Campaign[]) => {
    const columns: { header: string; getter: (c: Campaign) => any }[] = [
      { header: 'Campaign ID', getter: c => c.id },
      { header: 'Title', getter: c => c.title },
      { header: 'Type', getter: c => c.type },
      { header: 'Description', getter: c => c.description },
      { header: 'Start Date', getter: c => c.startDate },
      { header: 'End Date', getter: c => c.endDate },
      { header: 'Status', getter: c => c.status },
      { header: 'Reach', getter: c => c.reach },
      { header: 'Engagement', getter: c => c.engagement },
      { header: 'Conversions', getter: c => c.conversions },
      { header: 'ROI %', getter: c => c.roi },
      { header: 'Featured', getter: c => c.featured ? 'Yes' : 'No' },
      { header: 'Created At', getter: c => c.createdAt },
    ]

    const esc = (v: any) => {
      const s = v == null ? '' : String(v)
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
      return s
    }
    const headerLine = columns.map(c => esc(c.header)).join(',')
    const lines = [headerLine]
    rows.forEach(c => {
      lines.push(columns.map(col => esc(col.getter(c))).join(','))
    })
    return lines.join('\n')
  }

  const download = (filename: string, content: string, type = 'text/csv;charset=utf-8;') => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleExportAll = () => {
    const csv = toCSV(filteredCampaigns)
    download(`campaigns-all-${format(new Date(), 'dd-MMM-yyyy')}.csv`, csv)
    toast({
      title: "? Export completed",
      description: `Exported ${filteredCampaigns.length} campaign(s) successfully.`,
      duration: 3000,
    })
  }

  const handleExportSelected = () => {
    if (!selectedIds?.length) {
      handleExportAll()
      return
    }
    const byId = new Map(filteredCampaigns.map(c => [c.id, c] as const))
    const rows = selectedIds.map(id => byId.get(id)).filter(Boolean) as Campaign[]
    const csv = toCSV(rows)
    download(`campaigns-selected-${format(new Date(), 'dd-MMM-yyyy')}.csv`, csv)
    toast({
      title: "? Export completed",
      description: `Exported ${rows.length} selected campaign(s) successfully.`,
      duration: 3000,
    })
  }

  const handleOpenTool = (tool: PromotionTool) => {
    setSelectedTool(tool)
    setToolModalOpen(true)
    setToolChatMessages([
      {
        role: "assistant",
        content: `Hello! I'm here to help you with ${tool.title}. What would you like to create or customize today?`
      }
    ])
    setToolPromptInput("")
  }

  const handleSendToolPrompt = () => {
    if (!toolPromptInput.trim()) return

    // Add user message
    const userMessage = { role: "user", content: toolPromptInput }
    const updatedMessages = [...toolChatMessages, userMessage]
    setToolChatMessages(updatedMessages)
    setToolPromptInput("")

    // Simulate AI response based on tool
    setTimeout(() => {
      let response = ""
      const toolId = selectedTool?.id

      if (toolId === "TOOL001") {
        response = `Great! I'll help you send a broadcast message about "${toolPromptInput}" to your audience. This will be sent via SMS, email, and in-app notifications to all targeted recipients.`
      } else if (toolId === "TOOL002") {
        response = `Perfect! I'll create a referral program incentive based on "${toolPromptInput}". This will help increase your student referrals and track performance automatically.`
      } else if (toolId === "TOOL003") {
        response = `Excellent! I'm generating AI images for "${toolPromptInput}". This will create professional promotional graphics ready for your campaigns in moments.`
      } else if (toolId === "TOOL004") {
        response = `I'll design a beautiful flyer about "${toolPromptInput}" using our professional templates. The design will be ready to download as PDF or PNG.`
      } else if (toolId === "TOOL005") {
        response = `Creating certificates for "${toolPromptInput}"... I'll generate batch certificates with automatic numbering and QR codes for verification.`
      } else if (toolId === "TOOL006") {
        response = `Building your web presence for "${toolPromptInput}"... I'll create a responsive website optimized for mobile and desktop with all your academy information.`
      } else if (toolId === "TOOL007") {
        response = `Generating QR codes for "${toolPromptInput}"... These dynamic QR codes will track scans and direct users to your campaigns.`
      } else if (toolId === "TOOL008") {
        response = `Designing your calendar with "${toolPromptInput}"... I'll showcase your student artwork in a beautiful monthly calendar format.`
      } else if (toolId === "TOOL009") {
        response = `Creating personalized birthday cards for "${toolPromptInput}"... Each card will be customized and ready for printing or digital sending.`
      } else {
        response = `I'll help you with "${toolPromptInput}". The system will process your request and generate the output shortly.`
      }

      setToolChatMessages(prev => [...prev, { role: "assistant", content: response }])
    }, 800)
  }

  const getToolContent = (toolId: string) => {
    switch (toolId) {
      case "TOOL001":
        return {
          title: "Smart Broadcast",
          features: ["Send SMS notifications", "Email campaigns", "In-app notifications", "Scheduled sending", "Recipient targeting"],
          demo: "Sample broadcast message to students about Summer Enrollment Drive"
        }
      case "TOOL002":
        return {
          title: "Referral System",
          features: ["Create referral codes", "Track referrals", "Reward management", "Commission tracking", "Leaderboards"],
          demo: "Referral code: SUMMER25 - 10% commission per referral"
        }
      case "TOOL003":
        return {
          title: "AI Image Generator",
          features: ["Text-to-image generation", "Brand customization", "Template library", "Batch processing", "Quality controls"],
          demo: "Generate promotional images for your campaigns with AI"
        }
      case "TOOL004":
        return {
          title: "Event Flyer Creator",
          features: ["Professional templates", "Drag-and-drop editor", "Image library", "Brand consistency", "Export as PDF/PNG"],
          demo: "Create beautiful event flyers in minutes"
        }
      case "TOOL005":
        return {
          title: "Certificate Generator",
          features: ["Custom templates", "Batch generation", "Digital signatures", "QR code embedding", "Multiple formats"],
          demo: "Generate certificates for student achievements and events"
        }
      case "TOOL006":
        return {
          title: "Academy Web App",
          features: ["Website builder", "Mobile responsive", "SEO optimized", "Payment integration", "Analytics dashboard"],
          demo: "Create a professional web presence for your academy"
        }
      case "TOOL007":
        return {
          title: "QR Code Generator",
          features: ["Dynamic QR codes", "Campaign tracking", "Custom branding", "Batch generation", "Analytics"],
          demo: "Generate QR codes for quick access to campaigns and resources"
        }
      case "TOOL008":
        return {
          title: "Art-Focused Calendar",
          features: ["Student artwork showcase", "Monthly themes", "Print-ready", "Digital sharing", "Archive management"],
          demo: "Showcase student artwork in beautifully designed calendars"
        }
      case "TOOL009":
        return {
          title: "Birthday Card Creator",
          features: ["Personalized templates", "Photo integration", "Auto-scheduling", "Digital & print", "Bulk sending"],
          demo: "Create personalized birthday cards for students"
        }
      default:
        return { title: "Tool", features: [], demo: "" }
    }
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const activeCampaigns = campaigns.filter(c => c.status === "Active").length
    const totalReach = campaigns.reduce((sum, c) => sum + c.reach, 0)
    const totalEngagement = campaigns.reduce((sum, c) => sum + c.engagement, 0)
    const avgROI = (campaigns.reduce((sum, c) => sum + c.roi, 0) / campaigns.length).toFixed(1)
    
    return { activeCampaigns, totalReach, totalEngagement, avgROI }
  }, [campaigns])

  // Filter and sort campaigns
  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns.filter(campaign => {
      const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === "All" || campaign.status === filterStatus
      const matchesType = filterType === "All" || campaign.type === filterType
      
      return matchesSearch && matchesStatus && matchesType
    })

    // Sort by selected metric
    return filtered.sort((a, b) => {
      if (sortBy === "reach") return b.reach - a.reach
      if (sortBy === "engagement") return b.engagement - a.engagement
      if (sortBy === "roi") return b.roi - a.roi
      return 0
    })
  }, [campaigns, searchTerm, filterStatus, filterType, sortBy])

  return (
    <div className="w-full bg-background">
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Promotion & Marketing</h1>
            </div>
            <p className="text-sm text-muted-foreground">Manage campaigns, certifications, and promotional initiatives</p>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-2 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-purple-700">Active Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900">{stats.activeCampaigns}</div>
                <p className="text-xs text-purple-600 mt-1">Running campaigns</p>
              </CardContent>
            </Card>

            <Card className="border-2 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-700">Total Reach</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900">{(stats.totalReach / 1000).toFixed(1)}k</div>
                <p className="text-xs text-blue-600 mt-1">Audience reached</p>
              </CardContent>
            </Card>

            <Card className="border-2 bg-gradient-to-br from-indigo-50 to-indigo-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-indigo-700">Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-indigo-900">{(stats.totalEngagement / 1000).toFixed(1)}k</div>
                <p className="text-xs text-indigo-600 mt-1">Total interactions</p>
              </CardContent>
            </Card>

            <Card className="border-2 bg-gradient-to-br from-amber-50 to-amber-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-amber-700">Average ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-900">{stats.avgROI}%</div>
                <p className="text-xs text-amber-600 mt-1">Return on investment</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="analytics" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 bg-transparent gap-2 p-0">
              <TabsTrigger 
                value="analytics" 
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-orange-500 bg-white text-gray-700 font-medium data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:border-purple-600 hover:bg-gray-50 data-[state=active]:hover:bg-purple-700"
              >
                <BarChart4 className="h-4 w-4" />
                <span>Analytics</span>
              </TabsTrigger>
              <TabsTrigger 
                value="campaigns" 
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-orange-500 bg-white text-gray-700 font-medium data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:border-purple-600 hover:bg-gray-50 data-[state=active]:hover:bg-purple-700"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Campaigns</span>
              </TabsTrigger>
              <TabsTrigger 
                value="tools" 
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-orange-500 bg-white text-gray-700 font-medium data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:border-purple-600 hover:bg-gray-50 data-[state=active]:hover:bg-purple-700"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Tools</span>
              </TabsTrigger>
            </TabsList>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <div className="bg-card rounded-3xl shadow-xl p-6 border animate-fade-in">
                <AnalyticsDashboard campaigns={filteredCampaigns} />
              </div>
            </TabsContent>

            {/* Campaigns Tab */}
            <TabsContent value="campaigns">
              <div className="bg-card rounded-3xl shadow-xl p-6 border animate-fade-in">
                <div className="space-y-4">
                  {/* Enhanced Filter Component */}
                  <CampaignFilters
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    filterStatus={filterStatus}
                    onStatusChange={setFilterStatus}
                    filterType={filterType}
                    onTypeChange={setFilterType}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    campaignCount={filteredCampaigns.length}
                    onAddCampaign={handleAddCampaign}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    selectedCount={selectedIds.length}
                    onExportAll={handleExportAll}
                    onExportSelected={handleExportSelected}
                  />

                  {/* New Campaign Button */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-muted-foreground"></span>
                  </div>

                  {/* Campaigns List with View Mode Support */}
                  <CampaignList
                    campaigns={filteredCampaigns}
                    viewMode={viewMode}
                    onEdit={handleEditCampaign}
                    onDelete={handleDeleteClick}
                    selectedIds={selectedIds}
                    onSelectChange={setSelectedIds}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tools Tab */}
            <TabsContent value="tools">
              <div className="bg-card rounded-3xl shadow-xl p-6 border">
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-foreground">Available Tools & Features</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {promotionTools.map((tool) => (
                      <Card key={tool.id} className="border-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                              {tool.icon}
                            </div>
                            <Badge variant="outline">{tool.category}</Badge>
                          </div>
                          <CardTitle className="text-base mt-3">{tool.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <CardDescription>{tool.description}</CardDescription>
                          <Button 
                            onClick={() => handleOpenTool(tool)}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white" 
                            size="sm"
                          >
                            Open Tool
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Tool Modal */}
          <Dialog open={toolModalOpen} onOpenChange={setToolModalOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              {selectedTool && (
                <>
                  <DialogHeader>
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg text-primary">
                        {selectedTool.icon}
                      </div>
                      <div className="flex-1">
                        <DialogTitle className="text-2xl">{selectedTool.title}</DialogTitle>
                        <DialogDescription className="text-base mt-2">
                          {selectedTool.description}
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    {/* Chat Interface */}
                    <div className="flex flex-col h-[400px] border rounded-lg bg-muted/30">
                      {/* Messages Container */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {toolChatMessages.map((message, idx) => (
                          <div
                            key={idx}
                            className={`flex ${
                              message.role === "user" ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg text-sm ${
                                message.role === "user"
                                  ? "bg-primary text-primary-foreground rounded-br-none"
                                  : "bg-secondary text-secondary-foreground rounded-bl-none"
                              }`}
                            >
                              {message.content}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Input Area */}
                      <div className="border-t p-3 flex gap-2 bg-card">
                        <Input
                          placeholder="Type your request or customization..."
                          value={toolPromptInput}
                          onChange={(e) => setToolPromptInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleSendToolPrompt()
                            }
                          }}
                          className="text-sm"
                        />
                        <Button
                          onClick={handleSendToolPrompt}
                          disabled={!toolPromptInput.trim()}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Tool Info Section */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Key Features */}
                      <div className="space-y-2 p-3 rounded-lg bg-secondary/20 border">
                        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />
                          Key Features
                        </h4>
                        <div className="space-y-1 text-xs">
                          {(() => {
                            const content = getToolContent(selectedTool.id)
                            return content.features.slice(0, 4).map((feature, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <Check className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-muted-foreground">{feature}</span>
                              </div>
                            ))
                          })()}
                        </div>
                      </div>

                      {/* Quick Tips */}
                      <div className="space-y-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          Quick Tips
                        </h4>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          <li>� Be specific with your requests</li>
                          <li>� Use natural language</li>
                          <li>� Ask for customizations easily</li>
                          <li>� Get instant AI-powered results</li>
                        </ul>
                      </div>
                    </div>

                    {/* Close Button */}
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setToolModalOpen(false)}
                    >
                      Close
                    </Button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* Campaign Modal */}
          <CampaignModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            campaign={editingCampaign}
            onSave={handleSaveCampaign}
            isEditing={!!editingCampaign}
          />

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this campaign? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex justify-end gap-3">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleConfirmDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>)
}
