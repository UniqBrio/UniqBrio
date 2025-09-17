"use client"

import { useState, useEffect } from "react"
import KYCForm from "./kyc-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

const attendanceData = [
  { name: "Mon", present: 85, absent: 15 },
  { name: "Tue", present: 88, absent: 12 },
  { name: "Wed", present: 90, absent: 10 },
  { name: "Thu", present: 92, absent: 8 },
  { name: "Fri", present: 85, absent: 15 },
  { name: "Sat", present: 78, absent: 22 },
  { name: "Sun", present: 0, absent: 0 },
]

const enrollmentData = [
  { name: "Jan", students: 65 },
  { name: "Feb", students: 72 },
  { name: "Mar", students: 80 },
  { name: "Apr", students: 85 },
  { name: "May", students: 90 },
  { name: "Jun", students: 95 },
  { name: "Jul", students: 100 },
]

const courseDistributionData = [
  { name: "Mathematics", value: 35 },
  { name: "Science", value: 25 },
  { name: "Language", value: 20 },
  { name: "Arts", value: 15 },
  { name: "Physical Ed", value: 5 },
]

const monthlyRoiData = [
  { name: "Jan", roi: 12 },
  { name: "Feb", roi: 15 },
  { name: "Mar", roi: 18 },
  { name: "Apr", roi: 16 },
  { name: "May", roi: 21 },
  { name: "Jun", roi: 24 },
  { name: "Jul", roi: 22 },
]

const yearlyRoiData = [
  { name: "2020", roi: 14 },
  { name: "2021", roi: 16 },
  { name: "2022", roi: 20 },
  { name: "2023", roi: 22 },
  { name: "2024", roi: 25 },
]


const tourSteps = [
  {
    selector: ".dashboard-stats",
    content: ({ setIsTourOpen }: { setIsTourOpen: (open: boolean) => void }) => (
      <div>
        Here are your key stats: students, courses, revenue, and staff.
        <button
          style={{ marginTop: 16, padding: "6px 12px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
          onClick={() => setIsTourOpen(false)}
        >
          Close Tour
        </button>
      </div>
    ),
  },
  {
    selector: ".dashboard-tabs",
    content: ({ setIsTourOpen }: { setIsTourOpen: (open: boolean) => void }) => (
      <div>
        Switch between different dashboard views using these tabs.
        <button
          style={{ marginTop: 16, padding: "6px 12px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
          onClick={() => setIsTourOpen(false)}
        >
          Close Tour
        </button>
      </div>
    ),
  },
  {
    selector: ".dashboard-charts",
    content: ({ setIsTourOpen }: { setIsTourOpen: (open: boolean) => void }) => (
      <div>
        Visualize your data with interactive charts.
        <button
          style={{ marginTop: 16, padding: "6px 12px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
          onClick={() => setIsTourOpen(false)}
        >
          Close Tour
        </button>
      </div>
    ),
  },
];

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState("attendance");
  const [roiPeriod, setRoiPeriod] = useState("monthly");
  const [forecastPeriod, setForecastPeriod] = useState("month");
  const [showKycPopup, setShowKycPopup] = useState(false);
  const [kycDaysLeft, setKycDaysLeft] = useState(14);
  const [showKycForm, setShowKycForm] = useState(false);
  const [academyName, setAcademyName] = useState("");
  const [userName, setUserName] = useState("");
  const [academyId, setAcademyId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [registrationRecords, setRegistrationRecords] = useState<number>(0);
  const [kycStatus, setKycStatus] = useState<"pending" | "submitted" | "verified" | "expired" | "rejected" | null>(null);
  const [showKycSuccessNotification, setShowKycSuccessNotification] = useState(false);

  useEffect(() => {
    // Check for KYC success notification from localStorage
    const kycSuccessShown = localStorage.getItem('kycSuccessShown');
    if (kycSuccessShown && !showKycSuccessNotification) {
      setShowKycSuccessNotification(true);
      localStorage.removeItem('kycSuccessShown'); // Clear after showing
    }
    
    // Calculate days left for KYC
    const kycDeadlineStr = window.localStorage.getItem("kycDeadline");
    if (kycDeadlineStr) {
      const kycDeadline = new Date(kycDeadlineStr);
      const today = new Date();
      const diff = Math.ceil((kycDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      setKycDaysLeft(diff > 0 ? diff : 0);
    } else {
      // If no deadline, set it to 14 days from now
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 14);
      window.localStorage.setItem("kycDeadline", deadline.toISOString());
      setKycDaysLeft(14);
    }

    // For first-time users, ensure KYC deadline is set correctly
    const registrationCompleted = window.localStorage.getItem("justRegistered");
    if (registrationCompleted === "true") {
      // Reset KYC deadline for newly registered users
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 14);
      window.localStorage.setItem("kycDeadline", deadline.toISOString());
      setKycDaysLeft(14);
      window.localStorage.removeItem("justRegistered");
    }

    // Fetch KYC status from API instead of localStorage
    const fetchKycStatus = async () => {
      try {
        const response = await fetch("/api/kyc-status");
        if (response.ok) {
          const data = await response.json();
          console.log("KYC Status API Response:", data);
          setKycStatus(data.status);
          
          // Only show KYC popup if KYC is not submitted or verified
          if (data.status === "pending") {
            setShowKycPopup(true);
          } else if (data.status === "verified") {
            // Clear any pending banners and show a one-time congrats
            setShowKycPopup(false);
            setShowKycForm(false);
            if (!localStorage.getItem('kycVerifiedShown')) {
              setShowKycSuccessNotification(true);
              localStorage.setItem('kycVerifiedShown', '1');
            }
          }
        } else {
          console.error("Failed to fetch KYC status:", response.status);
          // Fallback to localStorage if API fails
          const storedKycStatus = localStorage.getItem('kycStatus');
          if (storedKycStatus) {
            setKycStatus(storedKycStatus as "pending" | "submitted" | "verified");
          }
          
          if (!storedKycStatus || storedKycStatus === "pending") {
            setShowKycPopup(true);
          }
        }
      } catch (error) {
        console.error("Error fetching KYC status:", error);
        // Fallback to localStorage if API fails
        const storedKycStatus = localStorage.getItem('kycStatus');
        if (storedKycStatus) {
          setKycStatus(storedKycStatus as "pending" | "submitted" | "verified");
        }
        
        if (!storedKycStatus || storedKycStatus === "pending") {
          setShowKycPopup(true);
        }
      }
    };

    fetchKycStatus();

    // Fetch academy/user info (scoped by session cookie)
    const fetchAcademyInfo = async () => {
      try {
        const response = await fetch("/api/user-academy-info");
        if (response.ok) {
          const data = await response.json();
          console.log("Academy Info API Response:", data); // Debug log
          setAcademyName(data.academyName || "");
          setUserName(data.userName || "");
          setAcademyId(data.academyId || "");
          setUserId(data.userId || "");
        } else {
          // Handle specific error cases
          if (response.status === 404) {
            console.warn("User not found or no registration - setting defaults");
            setAcademyName("Academy Setup Required");
            setUserName("User");
            setAcademyId("N/A");
            setUserId("N/A");
          } else {
            console.error("Failed to fetch academy info:", response.status, response.statusText);
            // Set fallback values
            setAcademyName("Academy");
            setUserName("User");
          }
        }
      } catch (error) {
        console.error("Failed to fetch academy info:", error);
        // Set fallback values on network error
        setAcademyName("Academy");
        setUserName("User");
        setAcademyId("N/A");
        setUserId("N/A");
      }
    };

    // Fetch dashboard summary (server filters by academyId/userId)
    const fetchDashboardSummary = async () => {
      try {
        const res = await fetch("/api/dashboard/summary");
        if (res.ok) {
          const data = await res.json();
          setRegistrationRecords(data.registrationRecords || 0);
          if (data.academyId) setAcademyId(data.academyId);
          if (data.userId) setUserId(data.userId);
        }
      } catch (e) {
        console.error("Failed to fetch dashboard summary:", e);
      }
    };

    fetchAcademyInfo();
    fetchDashboardSummary();
  }, []);

  // Stats data
  const stats = [
    { title: "Total Students", value: "450", change: "+5% from last month" },
    { title: "Active Courses", value: "24", change: "Same as last month" },
    { title: "Revenue", value: "$45,670", change: "+12% from last month" },
    { title: "Staff Count", value: "32", change: "+2 from last month" },
  ];

  const handleKycSuccess = () => {
    setKycStatus("submitted");
    localStorage.setItem('kycStatus', 'submitted');
    setShowKycForm(false);
    setShowKycPopup(false);
    setShowKycSuccessNotification(true);
    
    // Auto-hide the success notification after 5 seconds
    setTimeout(() => {
      setShowKycSuccessNotification(false);
    }, 5000);
  };

  const isBrowser = typeof window !== "undefined";
  return (
    <div className="flex flex-col space-y-6">
      {/* KYC Success Notification - Temporary toast-style popup */}
      {showKycSuccessNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white p-4 rounded-lg shadow-lg max-w-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold">KYC Submitted Successfully!</h3>
              <p className="text-sm mt-1">Your documents are under review. You'll receive confirmation within 24 hours.</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setShowKycSuccessNotification(false)}
                className="text-green-300 hover:text-white"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Single KYC Status Banner - Consolidated notification logic */}
      {!showKycSuccessNotification && (
        <>
          {/* Pending KYC - Show warning with days left */}
          {kycDaysLeft > 0 && kycStatus !== "submitted" && kycStatus !== "verified" && (
            <div className="w-full bg-orange-100 border-b-2 border-orange-400 text-orange-800 py-3 px-4 text-center font-semibold sticky top-0 z-40">
              Please complete verification to continue using the amazing features of UniqBrio —
              <span className="ml-2 font-bold">{kycDaysLeft} days</span> of verification pending.
            </div>
          )}
          
          {/* Submitted KYC - Show under review message */}
          {kycStatus === 'submitted' && (
            <div className="w-full bg-blue-100 border-b-2 border-blue-400 text-blue-800 py-3 px-4 text-center font-semibold sticky top-0 z-40">
              ✅ KYC Submitted Successfully! Your documents are under review. You'll receive confirmation within 24 hours.
            </div>
          )}
          
          {/* Verified KYC - Show success message */}
          {kycStatus === 'verified' && (
            <div className="w-full bg-green-100 border-b-2 border-green-400 text-green-800 py-3 px-4 text-center font-semibold sticky top-0 z-40">
              🎉 Congratulations! Your KYC is verified.
            </div>
          )}
          
          {/* Rejected KYC - Show rejection message */}
          {kycStatus === 'rejected' && (
            <div className="w-full bg-red-100 border-b-2 border-red-400 text-red-800 py-3 px-4 text-center font-semibold sticky top-0 z-40">
              ❌ KYC Rejected. Please re-upload your documents to proceed.
            </div>
          )}
          
          {/* Expired KYC - Show expiration message */}
          {kycStatus === 'expired' && (
            <div className="w-full bg-yellow-100 border-b-2 border-yellow-400 text-yellow-800 py-3 px-4 text-center font-semibold sticky top-0 z-40">
              ⌛ Your KYC window has expired. Please submit your KYC to regain access.
            </div>
          )}
        </>
      )}
      
      {/* KYC Popup - only show if KYC status is pending */}
      {showKycPopup && kycStatus !== "submitted" && kycStatus !== "verified" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-2 border-orange-400">
            <h2 className="text-2xl font-extrabold mb-3 text-purple-700">Continue using UniqBrio uninterrupted!</h2>
            <p className="mb-6 text-gray-700">
              <span className="inline-block px-2 py-1 rounded bg-orange-100 text-orange-700 font-bold mr-1">{kycDaysLeft} days</span>
              left to upload your KYC and avoid service interruption.
            </p>
            <button
              className="bg-gradient-to-r from-orange-400 to-purple-600 text-white px-6 py-2 rounded-full font-semibold shadow hover:scale-105 transition-transform"
              onClick={() => { setShowKycPopup(false); setShowKycForm(true); }}
            >
              <span className="mr-2">&#x2714;</span> Verify
            </button>
          </div>
        </div>
      )}

      {/* Verification Button - only show if KYC not submitted */}
      {!showKycForm && kycStatus !== "submitted" && kycStatus !== "verified" && (
        <div className="flex justify-end mb-4">
          <button
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            onClick={() => setShowKycForm(true)}
          >
            Verification
          </button>
        </div>
      )}

      {/* KYC Form Modal */}
      {showKycForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-40 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-lg w-full border-2 border-purple-600 h-[90vh] overflow-y-auto">
            <button className="float-right text-purple-600 hover:text-orange-500 text-2xl font-bold" onClick={() => setShowKycForm(false)}>&times;</button>
            <h2 className="text-xl font-extrabold mb-4 text-orange-500">KYC Upload</h2>
            <KYCForm onSubmit={handleKycSuccess} />
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-orange-500 rounded-lg shadow-lg p-6 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Welcome back{userName && userName !== "User" ? `, ${userName}` : ''}!
            </h1>
            {academyName && academyName !== "Academy" && academyName !== "Academy Setup Required" && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <p className="text-lg font-medium">
                  {academyName} Dashboard
                </p>
              </div>
            )}
            {academyName === "Academy Setup Required" && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
                <p className="text-lg font-medium text-yellow-100">
                  Academy Registration Required
                </p>
              </div>
            )}
            {(!academyName || academyName === "Academy") && (
              <p className="text-lg opacity-90">
                {userName && userName !== "User" ? "Your Academy Dashboard" : "Academy Dashboard"}
              </p>
            )}
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col items-end text-right">
            {academyId && academyId !== "N/A" && (
              <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium mb-1">
                Academy ID: {academyId}
              </div>
            )}
            {userId && userId !== "N/A" && (
              <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                User ID: {userId}
              </div>
            )}
            {(academyId === "N/A" || userId === "N/A") && (
              <div className="bg-yellow-500 bg-opacity-80 px-3 py-1 rounded-full text-sm font-medium">
                Setup Required
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-stats grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>Key metrics and interactive charts</CardDescription>
            </div>
            {selectedTab === "monthlyRoi" && (
              <div className="mt-2 sm:mt-0">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="roi-period">Period</Label>
                  <Select value={roiPeriod} onValueChange={setRoiPeriod}>
                    <SelectTrigger className="w-[120px]" id="roi-period">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            {selectedTab === "forecast" && (
              <div className="mt-2 sm:mt-0">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="forecast-period">Forecast</Label>
                  <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
                    <SelectTrigger className="w-[120px]" id="forecast-period">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Next Month</SelectItem>
                      <SelectItem value="year">Next Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="dashboard-tabs space-y-4">
            <TabsList className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5 gap-2">
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
              <TabsTrigger value="courseDistribution">Course Distribution</TabsTrigger>
              <TabsTrigger value="monthlyRoi">ROI</TabsTrigger>
              <TabsTrigger value="forecast">Forecast <span title="Coming Soon"> 🔜</span></TabsTrigger>
            </TabsList>
            <TabsContent value="attendance" className="dashboard-charts pt-4">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="present" fill="#8b5cf6" name="Present" />
                  <Bar dataKey="absent" fill="#f97316" name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="enrollment" className="dashboard-charts pt-4">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={enrollmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="students" stroke="#8b5cf6" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="courseDistribution" className="dashboard-charts pt-4">
              <div className="flex justify-center">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={courseDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {courseDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#8b5cf6" : "#f97316"} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            <TabsContent value="monthlyRoi" className="dashboard-charts pt-4">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={roiPeriod === "monthly" ? monthlyRoiData : yearlyRoiData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, "ROI"]} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="roi"
                    stroke="#8b5cf6"
                    activeDot={{ r: 8 }}
                    name="Return on Investment"
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="forecast" className="dashboard-charts pt-4">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={forecastPeriod === "month" ? monthlyRoiData : yearlyRoiData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="roi" stroke="#f97316" name="Forecast" strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="roi" stroke="#8b5cf6" name="Actual" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard
