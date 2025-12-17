"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import KYCRejectionModal from "@/components/kyc-rejection-modal"
import PaymentApprovalManagement from "@/components/admin/payment-approval-management"
import { 
  Users, 
  Shield, 
  Building, 
  FileCheck, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  LogOut,
  Bell,
  Sparkles,
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Trophy,
  Info,
  Loader2,
  Clock,
  Cookie,
  DollarSign,
  Calendar,
  X
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

export default function UBAdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [loginError, setLoginError] = useState("")
  const [activeTab, setActiveTab] = useState("dashboard")
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [kycQueue, setKycQueue] = useState<any[]>([])
  const [academies, setAcademies] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [sessionStats, setSessionStats] = useState<any>(null)
  const [cookieCompliance, setCookieCompliance] = useState<any>(null)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData()
    }
  }, [isAuthenticated])

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard stats
      const statsResponse = await fetch("/api/admin-data?type=dashboard-stats")
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setDashboardStats(statsData.data)
      }

      // Fetch KYC queue
      const kycResponse = await fetch("/api/admin-data?type=kyc-queue")
      if (kycResponse.ok) {
        const kycData = await kycResponse.json()
        setKycQueue(kycData.data)
      }

      // Fetch academies
      const academiesResponse = await fetch("/api/admin-data?type=academies")
      if (academiesResponse.ok) {
        const academiesData = await academiesResponse.json()
        setAcademies(academiesData.data)
      }

      // Fetch sessions
      const sessionsResponse = await fetch("/api/admin-sessions?action=list&limit=50")
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json()
        setSessions(sessionsData.data.sessions)
      }

      // Fetch session stats
      const sessionStatsResponse = await fetch("/api/admin-sessions?action=stats")
      if (sessionStatsResponse.ok) {
        const sessionStatsData = await sessionStatsResponse.json()
        setSessionStats(sessionStatsData.data)
      }

      // Fetch cookie compliance
      const cookieResponse = await fetch("/api/admin-cookie-compliance?action=stats")
      if (cookieResponse.ok) {
        const cookieData = await cookieResponse.json()
        setCookieCompliance(cookieData.data)
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error)
    }
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/admin-auth")
      console.log("Auth check response:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("Auth data:", data)
        setIsAuthenticated(true)
      } else {
        console.log("Auth failed:", response.status)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")

    try {
      const response = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData)
      })

      if (response.ok) {
        setIsAuthenticated(true)
      } else {
        setLoginError("Invalid credentials")
      }
    } catch (error) {
      setLoginError("Login failed")
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch("/api/admin-auth", { method: "DELETE" })
      setIsAuthenticated(false)
      setLoginData({ email: "", password: "" })
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-600 to-orange-500 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8 w-40 h-40 flex items-center justify-center mx-auto">
            <Image
              src="/UniqBrio Logo Transparent.png"
              alt="UniqBrio"
              width={180}
              height={220}
              className="object-contain drop-shadow-2xl filter brightness-110 contrast-110"
            />
          </div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/30 border-t-white mx-auto"></div>
          <p className="mt-6 text-white text-lg font-medium">Loading Admin Portal...</p>
          <div className="mt-2 w-32 h-1 bg-white/20 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-400 to-purple-300 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-600 to-orange-500 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-6 w-36 h-36 flex items-center justify-center transform hover:scale-105 transition-transform">
              <Image
                src="/UniqBrio Logo Transparent.png"
                alt="UniqBrio Logo"
                width={160}
                height={160}
                className="object-contain drop-shadow-xl filter brightness-110 contrast-110"
              />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-orange-600 bg-clip-text text-transparent">
              Admin Portal
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-white text-base">
              Secure access to academy management platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-white font-medium">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@uniqbrio.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  required
                  className="h-12 border-2 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20 rounded-lg transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 dark:text-white font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  required
                  className="h-12 border-2 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20 rounded-lg transition-colors"
                />
              </div>
              {loginError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-red-600 text-sm text-center font-medium">{loginError}</div>
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              >
                Access Admin Panel
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-orange-50/30">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 via-purple-700 to-orange-600 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="w-40 h-60 flex items-center justify-center mr-4">
                <Image
                  src="/UniqBrio Logo Transparent.png"
                  alt="UniqBrio"
                  width={100}
                  height={160}
                  className="object-contain drop-shadow-xl filter brightness-110 contrast-110"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                <p className="text-purple-100 text-sm">Academy Management System</p>
              </div>
            </div>
            <Button 
              variant="secondary" 
              onClick={handleLogout} 
              disabled={isLoggingOut}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-200 hover:shadow-lg disabled:opacity-70"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  Logout
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="bg-white rounded-2xl shadow-lg p-2 border-0">
            <TabsList className="grid w-full grid-cols-8 bg-gradient-to-r from-purple-100 to-orange-100 rounded-xl h-14">
              <TabsTrigger 
                value="dashboard" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg font-semibold transition-all duration-300 hover:bg-white/50"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="kyc"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg font-semibold transition-all duration-300 hover:bg-white/50"
              >
                KYC Management
              </TabsTrigger>
              <TabsTrigger 
                value="payments"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg font-semibold transition-all duration-300 hover:bg-white/50"
              >
                Payment & Approval
              </TabsTrigger>
              <TabsTrigger 
                value="academies"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg font-semibold transition-all duration-300 hover:bg-white/50"
              >
                Academies
              </TabsTrigger>
              <TabsTrigger 
                value="announcements"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg font-semibold transition-all duration-300 hover:bg-white/50"
              >
                Announcements
              </TabsTrigger>
              <TabsTrigger 
                value="analytics"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg font-semibold transition-all duration-300 hover:bg-white/50"
              >
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="sessions"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg font-semibold transition-all duration-300 hover:bg-white/50"
              >
                Sessions
              </TabsTrigger>
              <TabsTrigger 
                value="cookies"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg font-semibold transition-all duration-300 hover:bg-white/50"
              >
                Cookies
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard">
            <AdminDashboard stats={dashboardStats} />
          </TabsContent>

          <TabsContent value="kyc">
            <KYCManagement kycQueue={kycQueue} onRefresh={fetchDashboardData} />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentApprovalManagement />
          </TabsContent>

          <TabsContent value="academies">
            <AcademyManagement academies={academies} />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementsManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalytics stats={dashboardStats} />
          </TabsContent>

          <TabsContent value="sessions">
            <SessionsManagement sessions={sessions} stats={sessionStats} onRefresh={fetchDashboardData} />
          </TabsContent>

          <TabsContent value="cookies">
            <CookieComplianceManagement compliance={cookieCompliance} onRefresh={fetchDashboardData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function AdminDashboard({ stats }: { stats: any }) {
  const [featureNotifications, setFeatureNotifications] = useState<any>(null)
  const [loadingNotifications, setLoadingNotifications] = useState(true)

  useEffect(() => {
    fetchFeatureNotifications()
  }, [])

  const fetchFeatureNotifications = async () => {
    try {
      const response = await fetch("/api/feature-notifications")
      if (response.ok) {
        const data = await response.json()
        setFeatureNotifications(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch feature notifications:", error)
    } finally {
      setLoadingNotifications(false)
    }
  }

  const featureLabels: Record<string, { label: string; gradient: string; icon: string }> = {
    "crm": { label: "CRM System", gradient: "from-purple-500 to-pink-500", icon: "💬" },
    "sell-products": { label: "Sales & Inventory", gradient: "from-emerald-500 to-teal-500", icon: "🚀" },
    "promotions": { label: "Promotions & Marketing", gradient: "from-orange-500 to-red-500", icon: "📣" },
    "parent-management": { label: "Parent Portal", gradient: "from-blue-500 to-indigo-500", icon: "👨‍👩‍👧" },
    "alumni-management": { label: "Alumni Network", gradient: "from-purple-500 to-orange-500", icon: "🎓" },
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90">Total Academies</CardTitle>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Building className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-white">{stats?.totalAcademies || 0}</div>
            <p className="text-xs text-blue-100 mt-1">Registered academies</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90">Pending KYC</CardTitle>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-white">{stats?.pendingKYC || 0}</div>
            <p className="text-xs text-orange-100 mt-1">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90">KYC Submitted</CardTitle>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-white">{stats?.totalKYCSubmissions || 0}</div>
            <p className="text-xs text-emerald-100 mt-1">Documents submitted</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-700"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90">Monthly Growth</CardTitle>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-white">+{stats?.monthlyGrowth || 0}%</div>
            <p className="text-xs text-purple-100 mt-1">Academy registrations</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Overview */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader className="pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-orange-500 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl bg-gradient-to-r from-purple-700 to-orange-600 bg-clip-text text-transparent">Platform Overview</CardTitle>
              <CardDescription className="text-gray-600 dark:text-white">Key metrics and system health insights</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50 shadow-sm hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-400/20 to-blue-500/20 rounded-full -mr-8 -mt-8"></div>
              <div className="relative z-10">
                <div className="text-3xl font-bold text-blue-700 mb-2">{stats?.totalAcademies || 0}</div>
                <div className="text-sm font-medium text-blue-600">Total Academies</div>
                <div className="text-xs text-blue-500 mt-1">Registered on platform</div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200/50 shadow-sm hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-400/20 to-orange-500/20 rounded-full -mr-8 -mt-8"></div>
              <div className="relative z-10">
                <div className="text-3xl font-bold text-orange-700 mb-2">{stats?.pendingKYC || 0}</div>
                <div className="text-sm font-medium text-orange-600">Pending KYC</div>
                <div className="text-xs text-orange-500 mt-1">Awaiting review</div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200/50 shadow-sm hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-emerald-400/20 to-emerald-500/20 rounded-full -mr-8 -mt-8"></div>
              <div className="relative z-10">
                <div className="text-3xl font-bold text-emerald-700 mb-2">{stats?.verifiedAcademies || 0}</div>
                <div className="text-sm font-medium text-emerald-600">Verified Academies</div>
                <div className="text-xs text-emerald-500 mt-1">Successfully verified</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Interest Tracking */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
                  Feature Interest Tracking
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Users interested in upcoming features (Coming Soon pages)
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 text-lg">
                <Sparkles className="w-4 h-4 mr-2" />
                {featureNotifications?.totalSubscribers || 0} Total
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingNotifications ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(featureLabels).map(([key, { label, gradient, icon }]) => (
                <div
                  key={key}
                  className="relative overflow-hidden rounded-xl p-4 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all"
                >
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${gradient}`}></div>
                  <div className="flex flex-col items-center text-center pt-2">
                    <span className="text-3xl mb-2">{icon}</span>
                    <div className="text-2xl font-bold text-gray-800 mb-1">
                      {featureNotifications?.featureCounts?.[key] || 0}
                    </div>
                    <div className="text-xs font-medium text-gray-600">{label}</div>
                    <div className="text-xs text-gray-400 mt-1">interested users</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function KYCManagement({ kycQueue, onRefresh }: { kycQueue: any[], onRefresh: () => void }) {
  const [selectedKYC, setSelectedKYC] = useState<any>(null)
  const [showDocuments, setShowDocuments] = useState(false)
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false)
  const [kycToReject, setKycToReject] = useState<any>(null)

  const handleApproveKYC = async (kycId: string) => {
    try {
      const response = await fetch("/api/admin-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-kyc-status",
          kycId,
          status: "approved"
        })
      })

      if (response.ok) {
        onRefresh()
        alert("KYC approved successfully!")
      }
    } catch (error) {
      alert("Failed to approve KYC")
    }
  }

  const handleRejectKYC = async (kycId: string) => {
    // Find the KYC item to get user info for the modal
    const kycItem = kycQueue.find(item => item.id === kycId)
    setKycToReject(kycItem)
    setRejectionModalOpen(true)
  }

  const handleRejectionSubmit = async (rejectionData: { reasons: string[]; customMessage: string }) => {
    if (!kycToReject) return

    try {
      const response = await fetch("/api/admin-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-kyc-status-with-email",
          kycId: kycToReject.id,
          status: "rejected",
          rejectionReasons: rejectionData.reasons,
          customMessage: rejectionData.customMessage
        })
      })

      if (response.ok) {
        onRefresh()
        alert("KYC rejected and email sent successfully!")
        setKycToReject(null)
      }
    } catch (error) {
      console.error("Error rejecting KYC:", error)
      throw error // Re-throw to let modal handle the error
    }
  }

  const viewDocuments = (kyc: any) => {
    setSelectedKYC(kyc)
    setShowDocuments(true)
  }

  return (
    <div className="space-y-8">
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-purple-50/30">
        <CardHeader className="pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-orange-500 rounded-xl flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl bg-gradient-to-r from-purple-700 to-orange-600 bg-clip-text text-transparent">
                KYC Verification Queue
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-white">
                Review and approve academy KYC submissions ({kycQueue.length} pending)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {kycQueue.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FileCheck className="w-12 h-12 text-purple-400" />
                </div>
                <p className="text-gray-500 dark:text-white text-lg">No pending KYC submissions</p>
                <p className="text-gray-400 dark:text-white text-sm mt-2">All KYC requests have been processed</p>
              </div>
            ) : (
              <>
                {kycQueue.map((item, index) => (
                  <div 
                    key={index} 
                    className="group relative overflow-hidden rounded-2xl border-0 bg-gradient-to-r from-white to-gray-50/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center justify-between p-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="font-semibold text-lg text-gray-800 dark:text-white">{item.academyName}</h4>
                          {item.isResubmission && (
                            <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-sm">
                              Resubmitted
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600 dark:text-white flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Owner: {item.ownerName} ({item.ownerEmail})
                          </p>
                          <p className="text-sm text-gray-600 dark:text-white flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            Location: {item.location} • Submitted: {new Date(item.submittedAt).toLocaleDateString()}
                            {item.totalSubmissions > 1 && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                Submission #{item.totalSubmissions}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-2">
                          <Badge className="bg-gradient-to-r from-orange-400 to-orange-500 text-white border-0">
                            {item.status}
                          </Badge>
                          {item.isResubmission && (
                            <Badge className="bg-gradient-to-r from-blue-400 to-blue-500 text-white border-0 text-xs">
                              Resubmission
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => viewDocuments(item)}
                            className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Review
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleApproveKYC(item.id)}
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleRejectKYC(item.id)}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-sm"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Viewer Modal */}
      {showDocuments && selectedKYC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border-0">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-orange-500 rounded-lg flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-orange-600 bg-clip-text text-transparent">
                      KYC Documents
                    </h3>
                    <p className="text-gray-600 dark:text-white">{selectedKYC.academyName}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDocuments(false)}
                  className="border-gray-300 hover:border-purple-400 hover:text-purple-700"
                >
                  Close
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Owner Photo</h4>
                  <img 
                    src={selectedKYC.ownerImageUrl} 
                    alt="Owner" 
                    className="w-full h-64 object-cover rounded border"
                    onError={(e) => {
                      if (process.env.NODE_ENV === 'development') {
                        console.warn("Failed to load owner image:", selectedKYC.ownerImageUrl);
                      }
                      (e.target as HTMLImageElement).src = "/placeholder-user.jpg";
                    }}
                    onLoad={() => {
                      if (process.env.NODE_ENV === 'development') {
                        console.log("Successfully loaded owner image");
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 dark:text-white mt-1 break-all">{selectedKYC.ownerImageUrl}</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Academy Banner</h4>
                  <img 
                    src={selectedKYC.bannerImageUrl} 
                    alt="Banner" 
                    className="w-full h-64 object-cover rounded border"
                    onError={(e) => {
                      if (process.env.NODE_ENV === 'development') {
                        console.warn("Failed to load banner image:", selectedKYC.bannerImageUrl);
                      }
                      (e.target as HTMLImageElement).src = "/placeholder.jpg";
                    }}
                    onLoad={() => {
                      if (process.env.NODE_ENV === 'development') {
                        console.log("Successfully loaded banner image");
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 dark:text-white mt-1 break-all">{selectedKYC.bannerImageUrl}</p>
                </div>
                
                <div className="md:col-span-2">
                  <h4 className="font-medium mb-2">Owner with Banner</h4>
                  <img 
                    src={selectedKYC.ownerWithBannerImageUrl} 
                    alt="Owner with Banner" 
                    className="w-full h-64 object-cover rounded border"
                    onError={(e) => {
                      if (process.env.NODE_ENV === 'development') {
                        console.warn("Failed to load owner with banner image:", selectedKYC.ownerWithBannerImageUrl);
                      }
                      (e.target as HTMLImageElement).src = "/placeholder.jpg";
                    }}
                    onLoad={() => {
                      if (process.env.NODE_ENV === 'development') {
                        console.log("Successfully loaded owner with banner image");
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 dark:text-white mt-1 break-all">{selectedKYC.ownerWithBannerImageUrl}</p>
                  
                  {/* Location and Time Details for Owner with Banner */}
                  <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                    <h5 className="font-medium text-blue-800 mb-2">📍 Capture Details</h5>
                    <div className="space-y-1 text-sm text-blue-700">
                      {selectedKYC.dateTime && (
                        <p><strong>📅 Date & Time:</strong> {new Date(selectedKYC.dateTime).toLocaleString()}</p>
                      )}
                      {selectedKYC.location && (
                        <p><strong>🌍 Coordinates:</strong> {selectedKYC.location}</p>
                      )}
                      {selectedKYC.address && (
                        <p><strong>📍 Address:</strong> {selectedKYC.address}</p>
                      )}
                      {selectedKYC.latitude && selectedKYC.longitude && (
                        <p><strong>🗺️ GPS:</strong> {selectedKYC.latitude}, {selectedKYC.longitude}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded">
                <h4 className="font-medium mb-2"> Submission Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>👤 Owner:</strong> {selectedKYC.ownerName}</p>
                    <p><strong>📧 Email:</strong> {selectedKYC.ownerEmail}</p>
                    <p><strong>🏫 Academy ID:</strong> {selectedKYC.academyId}</p>
                    <p><strong>🆔 User ID:</strong> {selectedKYC.userId}</p>
                  </div>
                  <div>
                    <p><strong>📅 Submitted:</strong> {new Date(selectedKYC.submittedAt).toLocaleString()}</p>
                    <p><strong>🆔 Submission ID:</strong> {selectedKYC.id}</p>
                    <p><strong>📊 Status:</strong> <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Pending Review</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KYC Rejection Modal */}
      <KYCRejectionModal
        isOpen={rejectionModalOpen}
        onClose={() => {
          setRejectionModalOpen(false)
          setKycToReject(null)
        }}
        onSubmit={handleRejectionSubmit}
        userInfo={kycToReject ? {
          name: kycToReject.ownerName,
          email: kycToReject.ownerEmail
        } : undefined}
      />
    </div>
  )
}

function AcademyManagement({ academies }: { academies: any[] }) {
  const [selectedAcademy, setSelectedAcademy] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'kyc_submitted': return 'bg-gradient-to-r from-green-500 to-emerald-600'
      case 'registered': return 'bg-gradient-to-r from-orange-500 to-orange-600'
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600'
    }
  }

  const getIndustryIcon = (industryType: string) => {
    switch (industryType) {
      case 'sports': return '⚽'
      case 'arts': return '🎨'
      case 'music': return '🎵'
      case 'dance': return '💃'
      case 'academic': return '📚'
      case 'technology': return '💻'
      default: return '🏢'
    }
  }

  const formatServices = (services: string[]) => {
    if (!services || services.length === 0) return 'No services listed'
    return services.slice(0, 3).join(', ') + (services.length > 3 ? ` +${services.length - 3} more` : '')
  }

  const viewDetails = (academy: any) => {
    setSelectedAcademy(academy)
    setShowDetails(true)
  }

  return (
    <div className="space-y-8">
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-purple-50/30">
        <CardHeader className="pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-orange-500 rounded-xl flex items-center justify-center">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl bg-gradient-to-r from-purple-700 to-orange-600 bg-clip-text text-transparent">
                Registered Academies
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-white">
                Comprehensive view of all academies in the UniqBrio platform ({academies.length} total)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {academies.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Building className="w-12 h-12 text-purple-400" />
                </div>
                <p className="text-gray-500 dark:text-white text-lg">No academies registered yet</p>
                <p className="text-gray-400 dark:text-white text-sm mt-2">Academy registrations will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {academies.map((academy, index) => (
                  <div 
                    key={index} 
                    className="group relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-white to-gray-50/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">
                            {getIndustryIcon(academy.businessInfo?.industryType)}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-purple-700 transition-colors">
                              {academy.academyName}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-white">{academy.businessInfo?.legalEntityName}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge className={`${getStatusBadgeColor(academy.status)} text-white border-0 text-xs`}>
                            {academy.status === 'kyc_submitted' ? 'KYC Submitted' : 'Registered'}
                          </Badge>
                          {academy.verified && (
                            <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Academy Details */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-purple-600" />
                          <span className="text-gray-600 dark:text-white">Owner:</span>
                          <span className="font-medium text-gray-800 dark:text-white">{academy.ownerName}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Building className="w-4 h-4 text-orange-600" />
                          <span className="text-gray-600 dark:text-white">Industry:</span>
                          <span className="font-medium text-gray-800 dark:text-white capitalize">
                            {academy.businessInfo?.industryType || 'Not specified'}
                          </span>
                        </div>

                        <div className="flex items-start gap-2 text-sm">
                          <FileCheck className="w-4 h-4 text-blue-600 mt-0.5" />
                          <div>
                            <span className="text-gray-600 dark:text-white">Services:</span>
                            <p className="font-medium text-gray-800 dark:text-white mt-1">
                              {formatServices(academy.businessInfo?.servicesOffered)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-green-600" />
                          <span className="text-gray-600 dark:text-white">Size:</span>
                          <span className="font-medium text-gray-800 dark:text-white capitalize">
                            {academy.businessInfo?.studentSize || 'Not specified'} academy
                          </span>
                        </div>

                        <div className="flex items-start gap-2 text-sm">
                          <Building className="w-4 h-4 text-purple-600 mt-0.5" />
                          <div>
                            <span className="text-gray-600 dark:text-white">Location:</span>
                            <p className="font-medium text-gray-800 dark:text-white">
                              {academy.businessInfo?.city && academy.businessInfo?.state 
                                ? `${academy.businessInfo.city}, ${academy.businessInfo.state}`
                                : 'Location not specified'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-500 dark:text-white">
                          Registered: {new Date(academy.registeredAt).toLocaleDateString()}
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => viewDetails(academy)}
                          className="bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white border-0 shadow-sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Academy Modal */}
      {showDetails && selectedAcademy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-0">
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">
                    {getIndustryIcon(selectedAcademy.businessInfo?.industryType)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-orange-600 bg-clip-text text-transparent">
                      {selectedAcademy.academyName}
                    </h2>
                    <p className="text-gray-600 dark:text-white text-lg">{selectedAcademy.businessInfo?.legalEntityName}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge className={`${getStatusBadgeColor(selectedAcademy.status)} text-white border-0`}>
                        {selectedAcademy.status === 'kyc_submitted' ? 'KYC Submitted' : 'Registered'}
                      </Badge>
                      {selectedAcademy.verified && (
                        <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDetails(false)}
                  className="border-gray-300 hover:border-purple-400 hover:text-purple-700"
                >
                  Close
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Business Information */}
                <Card className="border border-purple-100 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-lg">
                    <CardTitle className="text-purple-700 flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Business Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-white">Business Name</label>
                      <p className="text-gray-800 dark:text-white font-medium">{selectedAcademy.businessInfo?.businessName || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-white">Legal Entity</label>
                      <p className="text-gray-800 dark:text-white">{selectedAcademy.businessInfo?.legalEntityName || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-white">Industry</label>
                      <p className="text-gray-800 dark:text-white capitalize">{selectedAcademy.businessInfo?.industryType || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-white">Services Offered</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedAcademy.businessInfo?.servicesOffered?.length > 0 ? 
                          selectedAcademy.businessInfo.servicesOffered.map((service: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                              {service}
                            </Badge>
                          )) : 
                          <span className="text-gray-500 dark:text-white italic">No services listed</span>
                        }
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-white">Student Size</label>
                        <p className="text-gray-800 dark:text-white capitalize">{selectedAcademy.businessInfo?.studentSize || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-white">Staff Count</label>
                        <p className="text-gray-800 dark:text-white capitalize">{selectedAcademy.businessInfo?.staffCount || 'Not specified'}</p>
                      </div>
                    </div>
                    {selectedAcademy.businessInfo?.website && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-white">Website</label>
                        <p className="text-blue-600 hover:text-blue-700">
                          <a href={selectedAcademy.businessInfo.website} target="_blank" rel="noopener noreferrer">
                            {selectedAcademy.businessInfo.website}
                          </a>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contact & Location */}
                <Card className="border border-orange-100 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-lg">
                    <CardTitle className="text-orange-700 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Contact & Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-white">Owner</label>
                      <p className="text-gray-800 dark:text-white font-medium">{selectedAcademy.adminInfo?.fullName || selectedAcademy.ownerName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-white">Email</label>
                      <p className="text-gray-800 dark:text-white">{selectedAcademy.businessInfo?.businessEmail || selectedAcademy.ownerEmail}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-white">Phone</label>
                      <p className="text-gray-800 dark:text-white">{selectedAcademy.businessInfo?.phoneNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-white">Address</label>
                      <p className="text-gray-800 dark:text-white">
                        {selectedAcademy.businessInfo?.address && (
                          <>
                            {selectedAcademy.businessInfo.address}<br />
                            {selectedAcademy.businessInfo.city}, {selectedAcademy.businessInfo.state}<br />
                            {selectedAcademy.businessInfo.country} - {selectedAcademy.businessInfo.pincode}
                          </>
                        ) || 'Address not provided'}
                      </p>
                    </div>
                    {selectedAcademy.businessInfo?.taxId && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-white">Tax ID</label>
                        <p className="text-gray-800 dark:text-white">{selectedAcademy.businessInfo.taxId}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-white">Language Preference</label>
                      <p className="text-gray-800 dark:text-white capitalize">
                        {selectedAcademy.businessInfo?.preferredLanguage === 'eng' ? 'English' : 
                         selectedAcademy.businessInfo?.preferredLanguage || 'Not specified'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* System Information */}
                <Card className="border border-blue-100 shadow-sm md:col-span-2">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
                    <CardTitle className="text-blue-700 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      System Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-white">Academy ID</label>
                        <p className="text-gray-800 dark:text-white font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {selectedAcademy.academyId}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-white">User ID</label>
                        <p className="text-gray-800 dark:text-white font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {selectedAcademy.userId}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-white">Registration Date</label>
                        <p className="text-gray-800 dark:text-white">{new Date(selectedAcademy.registeredAt).toLocaleString()}</p>
                      </div>
                    </div>
                    {selectedAcademy.preferences?.referralSource && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-500 dark:text-white">Referral Source</label>
                        <p className="text-gray-800 dark:text-white capitalize">{selectedAcademy.preferences.referralSource}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminAnalytics({ stats }: { stats: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>KYC Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Submitted</span>
                <span className="font-medium">{stats?.totalKYCSubmissions || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending</span>
                <span className="font-medium">{stats?.pendingKYC || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Academies</span>
                <span className="font-medium">{stats?.totalAcademies || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Verified Academies</span>
                <span className="font-medium">{stats?.verifiedAcademies || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Growth Rate</span>
                <span className="font-medium text-green-600">+{stats?.monthlyGrowth || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span>KYC Completion</span>
                <span className="font-medium">
                  {stats?.totalAcademies > 0 
                    ? Math.round((stats.totalKYCSubmissions / stats.totalAcademies) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Overall platform performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats?.totalAcademies > 0 && stats?.totalKYCSubmissions > 0
                  ? Math.round((stats.totalKYCSubmissions / stats.totalAcademies) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-gray-600 dark:text-white">KYC Completion Rate</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats?.verifiedAcademies || 0}</div>
              <div className="text-sm text-gray-600 dark:text-white">Verified Academies</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">+{stats?.monthlyGrowth || 0}%</div>
              <div className="text-sm text-gray-600 dark:text-white">Monthly Growth</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SessionsManagement({ sessions, stats, onRefresh }: { sessions: any[], stats: any, onRefresh: () => void }) {
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState({ tenantId: "", userId: "", userEmail: "" })
  const [selectedSession, setSelectedSession] = useState<any>(null)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await onRefresh()
    } catch (error) {
      console.error("Failed to refresh:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to revoke this session? The user will be logged out immediately.")) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/admin-sessions?action=revoke&sessionId=${sessionId}`)
      const data = await response.json()

      if (data.success) {
        alert("Session revoked successfully")
        onRefresh()
      } else {
        alert(`Failed to revoke session: ${data.error}`)
      }
    } catch (error) {
      console.error("Failed to revoke session:", error)
      alert("Failed to revoke session")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString()
  }

  const getStatusBadge = (session: any) => {
    const now = new Date()
    const expiresAt = new Date(session.expiresAt)

    if (session.isRevoked) {
      return <Badge variant="destructive">Revoked</Badge>
    } else if (expiresAt < now) {
      return <Badge variant="outline" className="text-gray-500">Expired</Badge>
    } else {
      return <Badge variant="default" className="bg-green-500">Active</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Session Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats?.totalSessions || 0}</div>
              <div className="text-sm text-gray-600">Total Sessions</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats?.activeSessions || 0}</div>
              <div className="text-sm text-gray-600">Active Sessions</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats?.pwaUsers || 0}</div>
              <div className="text-sm text-gray-600">PWA Users</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{stats?.revokedSessions || 0}</div>
              <div className="text-sm text-gray-600">Revoked Sessions</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {stats?.activeSessions && stats?.pwaUsers
                  ? Math.round((stats.pwaUsers / stats.activeSessions) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-gray-600">PWA Adoption</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>Monitor and manage user sessions across all tenants</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4">
              <Input
                placeholder="Filter by Tenant ID"
                value={filter.tenantId}
                onChange={(e) => setFilter({ ...filter, tenantId: e.target.value })}
                className="max-w-xs"
              />
              <Input
                placeholder="Filter by User ID"
                value={filter.userId}
                onChange={(e) => setFilter({ ...filter, userId: e.target.value })}
                className="max-w-xs"
              />
              <Input
                placeholder="Filter by Email"
                value={filter.userEmail || ''}
                onChange={(e) => setFilter({ ...filter, userEmail: e.target.value })}
                className="max-w-xs"
              />
            </div>

            {/* Sessions List */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">User ID</th>
                    <th className="text-left p-3 font-semibold">User Email</th>
                    <th className="text-left p-3 font-semibold">User Name</th>
                    <th className="text-left p-3 font-semibold">Tenant ID</th>
                    <th className="text-left p-3 font-semibold">Device</th>
                    <th className="text-left p-3 font-semibold">Browser</th>
                    <th className="text-left p-3 font-semibold">OS</th>
                    <th className="text-left p-3 font-semibold">Mode</th>
                    <th className="text-left p-3 font-semibold">Last Active</th>
                    <th className="text-right p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions
                    .filter((session) => {
                      const matchesTenant = !filter.tenantId || session.tenantId.includes(filter.tenantId)
                      const matchesUser = !filter.userId || session.userId.includes(filter.userId)
                      const matchesEmail = !filter.userEmail || (session.userEmail && session.userEmail.toLowerCase().includes(filter.userEmail.toLowerCase()))
                      return matchesTenant && matchesUser && matchesEmail
                    })
                    .map((session) => (
                      <tr key={session._id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{getStatusBadge(session)}</td>
                        <td className="p-3">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {session.userId.substring(0, 12)}...
                          </code>
                        </td>
                        <td className="p-3 text-sm">
                          <span className="text-blue-600" title={session.userEmail || 'Unknown'}>
                            {session.userEmail || 'Unknown'}
                          </span>
                        </td>
                        <td className="p-3 text-sm">
                          <span title={session.userName || 'Unknown'}>
                            {(session.userName || 'Unknown').length > 20 
                              ? (session.userName || 'Unknown').substring(0, 20) + '...' 
                              : (session.userName || 'Unknown')
                            }
                          </span>
                        </td>
                        <td className="p-3">
                          <code className="text-xs bg-purple-100 px-2 py-1 rounded">
                            {session.tenantId.substring(0, 12)}...
                          </code>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs">
                            {session.deviceType || 'unknown'}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">{session.browser || 'Unknown'}</td>
                        <td className="p-3 text-sm">{session.os || 'Unknown'}</td>
                        <td className="p-3">
                          {session.isPWA ? (
                            <Badge className="text-xs bg-green-100 text-green-700 border-green-300">
                              PWA
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Browser
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-sm">{formatDate(session.lastActiveAt)}</td>
                        <td className="p-3 text-right">
                          {!session.isRevoked && new Date(session.expiresAt) > new Date() && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRevokeSession(session._id)}
                              disabled={loading}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Revoke
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {sessions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No sessions found</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions by Tenant */}
      {stats?.sessionsByTenant && stats.sessionsByTenant.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sessions by Tenant</CardTitle>
            <CardDescription>Top 10 tenants by session count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.sessionsByTenant.map((tenant: any, index: number) => (
                <div key={tenant._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-gray-400">#{index + 1}</div>
                    <div>
                      <code className="text-xs bg-purple-100 px-2 py-1 rounded">
                        {tenant._id}
                      </code>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Total</div>
                      <div className="font-bold">{tenant.total}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Active</div>
                      <div className="font-bold text-green-600">{tenant.active}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function CookieComplianceManagement({ compliance, onRefresh }: { compliance: any, onRefresh: () => void }) {
  const [loading, setLoading] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<string>("")
  const [tenantReport, setTenantReport] = useState<any>(null)

  const fetchTenantReport = async (tenantId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin-cookie-compliance?action=tenant-report&tenantId=${tenantId}`)
      const data = await response.json()
      if (data.success) {
        setTenantReport(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch tenant report:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Global Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{compliance?.global?.totalTenants || 0}</div>
              <div className="text-sm text-gray-600">Total Tenants</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{compliance?.global?.totalUsers || 0}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {compliance?.global?.totalUsers && compliance?.global?.globalAnalyticsConsent
                  ? Math.round((compliance.global.globalAnalyticsConsent / compliance.global.totalUsers) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-gray-600">Analytics Consent</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {compliance?.global?.totalUsers && compliance?.global?.globalMarketingConsent
                  ? Math.round((compliance.global.globalMarketingConsent / compliance.global.totalUsers) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-gray-600">Marketing Consent</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Consent by Tenant */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="w-5 h-5" />
                Cookie Compliance by Tenant
              </CardTitle>
              <CardDescription>GDPR/DPDP compliance monitoring across all tenants</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Tenant ID</th>
                  <th className="text-left p-3 font-semibold">Total Users</th>
                  <th className="text-left p-3 font-semibold">Analytics Consent</th>
                  <th className="text-left p-3 font-semibold">Marketing Consent</th>
                  <th className="text-left p-3 font-semibold">Consent Rate</th>
                  <th className="text-left p-3 font-semibold">Last Updated</th>
                  <th className="text-right p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {compliance?.byTenant?.map((tenant: any) => (
                  <tr key={tenant._id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <code className="text-xs bg-purple-100 px-2 py-1 rounded">
                        {tenant._id.substring(0, 16)}...
                      </code>
                    </td>
                    <td className="p-3 font-medium">{tenant.totalUsers}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tenant.analyticsConsent}</span>
                        <span className="text-sm text-gray-500">
                          ({Math.round((tenant.analyticsConsent / tenant.totalUsers) * 100)}%)
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tenant.marketingConsent}</span>
                        <span className="text-sm text-gray-500">
                          ({Math.round((tenant.marketingConsent / tenant.totalUsers) * 100)}%)
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${Math.round(((tenant.analyticsConsent + tenant.marketingConsent) / (tenant.totalUsers * 2)) * 100)}%`
                          }}
                        />
                      </div>
                    </td>
                    <td className="p-3 text-sm">
                      {new Date(tenant.lastUpdated).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTenant(tenant._id)
                          fetchTenantReport(tenant._id)
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(!compliance?.byTenant || compliance.byTenant.length === 0) && (
              <div className="text-center py-12 text-gray-500">
                <Cookie className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No cookie preferences data yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tenant Detail Report */}
      {tenantReport && selectedTenant && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Report for Tenant</CardTitle>
            <CardDescription>
              <code className="text-xs bg-purple-100 px-2 py-1 rounded">{selectedTenant}</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{tenantReport.totalUsers}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(tenantReport.analyticsConsentRate)}%
                </div>
                <div className="text-sm text-gray-600">Analytics Consent Rate</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(tenantReport.marketingConsentRate)}%
                </div>
                <div className="text-sm text-gray-600">Marketing Consent Rate</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Recent Changes</h4>
              <div className="space-y-2">
                {tenantReport.recentChanges?.slice(0, 5).map((change: any) => (
                  <div key={change._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                    <div>
                      <code className="text-xs bg-gray-200 px-2 py-1 rounded">{change.userId.substring(0, 12)}...</code>
                    </div>
                    <div className="flex gap-4">
                      <Badge variant={change.analytics ? "default" : "outline"}>Analytics: {change.analytics ? "✓" : "✗"}</Badge>
                      <Badge variant={change.marketing ? "default" : "outline"}>Marketing: {change.marketing ? "✓" : "✗"}</Badge>
                    </div>
                    <div className="text-gray-500">
                      {new Date(change.updatedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Compliance Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <p><strong>GDPR Compliant:</strong> All cookie preferences are stored with user consent and can be withdrawn at any time.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <p><strong>DPDP Compliant:</strong> User data is processed lawfully with explicit consent for analytics and marketing.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <p><strong>Privacy by Design:</strong> IP addresses are pseudonymized (hashed) for audit trails.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <p><strong>Tenant Isolation:</strong> All queries are tenant-scoped ensuring data separation.</p>
            </div>
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5" />
              <p><strong>Essential Cookies:</strong> Always enabled and cannot be disabled (required for authentication and security).</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AnnouncementsManagement() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null)
  const [formData, setFormData] = useState({
    type: "info",
    title: "",
    message: "",
    link: "",
    priority: "medium",
    isActive: true,
  })

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/announcements?admin=true")
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const method = editingAnnouncement ? "PUT" : "POST"
      const body = editingAnnouncement 
        ? { id: editingAnnouncement._id, ...formData }
        : formData

      const response = await fetch("/api/announcements", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        fetchAnnouncements()
        resetForm()
        alert(editingAnnouncement ? "Announcement updated!" : "Announcement created!")
      }
    } catch (error) {
      alert("Failed to save announcement")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return

    try {
      const response = await fetch(`/api/announcements?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchAnnouncements()
        alert("Announcement deleted!")
      }
    } catch (error) {
      alert("Failed to delete announcement")
    }
  }

  const handleEdit = (announcement: any) => {
    setEditingAnnouncement(announcement)
    setFormData({
      type: announcement.type,
      title: announcement.title,
      message: announcement.message,
      link: announcement.link || "",
      priority: announcement.priority,
      isActive: announcement.isActive,
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingAnnouncement(null)
    setFormData({
      type: "info",
      title: "",
      message: "",
      link: "",
      priority: "medium",
      isActive: true,
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "update": return <Sparkles className="w-4 h-4" />
      case "achievement": return <Trophy className="w-4 h-4" />
      case "alert": return <AlertCircle className="w-4 h-4" />
      default: return <Info className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "update": return "bg-purple-100 text-purple-700 border-purple-200"
      case "achievement": return "bg-green-100 text-green-700 border-green-200"
      case "alert": return "bg-red-100 text-red-700 border-red-200"
      default: return "bg-blue-100 text-blue-700 border-blue-200"
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return <Badge className="bg-red-500 text-white">High</Badge>
      case "medium": return <Badge className="bg-yellow-500 text-white">Medium</Badge>
      default: return <Badge className="bg-gray-500 text-white">Low</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-orange-500 rounded-xl flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-purple-700 to-orange-600 bg-clip-text text-transparent">
                  Announcements Management
                </CardTitle>
                <CardDescription>Create and manage announcements shown on academy dashboards</CardDescription>
              </div>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {showForm ? "Cancel" : "New Announcement"}
            </Button>
          </div>
        </CardHeader>

        {/* Create/Edit Form */}
        {showForm && (
          <CardContent className="border-t">
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                  >
                    <option value="info">Info</option>
                    <option value="update">Update</option>
                    <option value="achievement">Achievement</option>
                    <option value="alert">Alert</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Announcement title"
                  required
                  className="border-gray-200 focus:border-purple-400"
                />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Announcement message"
                  required
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                />
              </div>

              <div>
                <Label htmlFor="link">Link (optional)</Label>
                <Input
                  id="link"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://..."
                  className="border-gray-200 focus:border-purple-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isActive">Active (visible to users)</Label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white">
                  {editingAnnouncement ? "Update Announcement" : "Create Announcement"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Announcements List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">All Announcements ({announcements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No announcements yet</p>
              <p className="text-sm">Create your first announcement to display on academy dashboards</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div
                  key={announcement._id}
                  className={`p-4 rounded-lg border ${announcement.isActive ? "bg-white" : "bg-gray-50 opacity-60"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${getTypeColor(announcement.type)}`}>
                        {getTypeIcon(announcement.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
                          {getPriorityBadge(announcement.priority)}
                          {!announcement.isActive && (
                            <Badge variant="outline" className="text-gray-500">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{announcement.message}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Created: {new Date(announcement.createdAt).toLocaleDateString()}</span>
                          {announcement.link && /^https?:\/\//i.test(announcement.link) && (
                            <a href={announcement.link} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                              View Link
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(announcement)}
                        className="h-8"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(announcement._id)}
                        className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
