"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import KYCRejectionModal from "@/components/kyc-rejection-modal"
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
  LogOut
} from "lucide-react"

export default function UBAdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [loginError, setLoginError] = useState("")
  const [activeTab, setActiveTab] = useState("dashboard")
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [kycQueue, setKycQueue] = useState<any[]>([])
  const [academies, setAcademies] = useState<any[]>([])

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
    try {
      await fetch("/api/admin-auth", { method: "DELETE" })
      setIsAuthenticated(false)
      setLoginData({ email: "", password: "" })
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading UniqBrio Admin...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-purple-700">UniqBrio Admin</CardTitle>
            <CardDescription>Secure access to academy management</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@uniqbrio.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  required
                />
              </div>
              {loginError && (
                <div className="text-red-500 text-sm text-center">{loginError}</div>
              )}
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                Access Admin Panel
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-purple-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">UniqBrio Admin Panel</h1>
            </div>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="kyc">KYC Management</TabsTrigger>
            <TabsTrigger value="academies">Academies</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdminDashboard stats={dashboardStats} />
          </TabsContent>

          <TabsContent value="kyc">
            <KYCManagement kycQueue={kycQueue} onRefresh={fetchDashboardData} />
          </TabsContent>

          <TabsContent value="academies">
            <AcademyManagement academies={academies} />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalytics stats={dashboardStats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function AdminDashboard({ stats }: { stats: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Academies</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAcademies || 0}</div>
            <p className="text-xs text-muted-foreground">Registered academies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingKYC || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KYC Submitted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalKYCSubmissions || 0}</div>
            <p className="text-xs text-muted-foreground">Documents submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats?.monthlyGrowth || 0}%</div>
            <p className="text-xs text-muted-foreground">Academy registrations</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Overview</CardTitle>
          <CardDescription>Key metrics and system health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats?.totalAcademies || 0}</div>
              <div className="text-sm text-gray-600">Total Academies</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats?.pendingKYC || 0}</div>
              <div className="text-sm text-gray-600">Pending KYC</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats?.verifiedAcademies || 0}</div>
              <div className="text-sm text-gray-600">Verified Academies</div>
            </div>
          </div>
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>KYC Verification Queue</CardTitle>
          <CardDescription>Review and approve academy KYC submissions ({kycQueue.length} pending)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {kycQueue.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No pending KYC submissions</p>
              </div>
            ) : (
              kycQueue.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{item.academyName}</h4>
                      {item.isResubmission && (
                        <Badge variant="secondary" className="text-blue-600 border-blue-600 bg-blue-50">
                          Resubmitted
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Owner: {item.ownerName} ({item.ownerEmail})
                    </p>
                    <p className="text-sm text-gray-600">
                      Location: {item.location} • Submitted: {new Date(item.submittedAt).toLocaleDateString()}
                      {item.totalSubmissions > 1 && (
                        <span className="ml-2 text-xs text-blue-600">
                          (Submission #{item.totalSubmissions})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        {item.status}
                      </Badge>
                      {item.isResubmission && (
                        <Badge variant="secondary" className="text-xs text-blue-700 bg-blue-100 border-blue-300">
                          Resubmission
                        </Badge>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => viewDocuments(item)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Review
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleApproveKYC(item.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleRejectKYC(item.id)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Viewer Modal */}
      {showDocuments && selectedKYC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">KYC Documents - {selectedKYC.academyName}</h3>
                <Button variant="outline" onClick={() => setShowDocuments(false)}>
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
                  <p className="text-xs text-gray-500 mt-1 break-all">{selectedKYC.ownerImageUrl}</p>
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
                  <p className="text-xs text-gray-500 mt-1 break-all">{selectedKYC.bannerImageUrl}</p>
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
                  <p className="text-xs text-gray-500 mt-1 break-all">{selectedKYC.ownerWithBannerImageUrl}</p>
                  
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
                <h4 className="font-medium mb-2">📋 Submission Details</h4>
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
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Registered Academies</CardTitle>
          <CardDescription>Manage all academies in the UniqBrio platform ({academies.length} total)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {academies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No academies registered yet</p>
              </div>
            ) : (
              academies.map((academy, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{academy.academyName}</h4>
                    <p className="text-sm text-gray-600">
                      Owner: {academy.ownerName} ({academy.ownerEmail})
                    </p>
                    <p className="text-sm text-gray-600">
                      Academy ID: {academy.academyId} • User ID: {academy.userId}
                    </p>
                    <p className="text-sm text-gray-600">
                      Registered: {new Date(academy.registeredAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={academy.hasKYC ? "default" : "secondary"}>
                      {academy.hasKYC ? "KYC Submitted" : "KYC Pending"}
                    </Badge>
                    <Badge variant={academy.verified ? "default" : "outline"}>
                      {academy.verified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
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
              <div className="text-sm text-gray-600">KYC Completion Rate</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats?.verifiedAcademies || 0}</div>
              <div className="text-sm text-gray-600">Verified Academies</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">+{stats?.monthlyGrowth || 0}%</div>
              <div className="text-sm text-gray-600">Monthly Growth</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
