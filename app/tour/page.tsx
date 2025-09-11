"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Home,
  Settings,
  Users,
  MessageSquare,
  CreditCard,
  DollarSign,
  Megaphone,
  Calendar,
  UserIcon as UserGroup,
  Search,
  Bell,
  ChevronDown,
  User,
  Star,
  GraduationCap,
  BookOpen,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"

const attendanceData = [
  { name: "Mon", value: 85 },
  { name: "Tue", value: 92 },
  { name: "Wed", value: 88 },
  { name: "Thu", value: 95 },
  { name: "Fri", value: 82 },
  { name: "Sat", value: 78 },
]

const tourSteps = [
  {
    id: "welcome",
    title: "Welcome to Uniqbrio Academy!",
    content: 'Let\'s take a quick tour of your academy management dashboard. Click "Next" to get started.',
    target: null,
    position: "center",
  },
  {
    id: "sidebar",
    title: "Navigation Menu",
    content: "Use this sidebar to navigate between different sections like User Management, Payments, and Analytics.",
    target: '[data-tour="sidebar"]',
    position: "right",
  },
  {
    id: "metrics",
    title: "Key Metrics",
    content:
      "These cards show your most important academy statistics at a glance - students, courses, revenue, and staff.",
    target: '[data-tour="metrics"]',
    position: "bottom",
  },
  {
    id: "students",
    title: "Total Students",
    content: "Track your student enrollment with growth indicators. Currently showing 450 students with +5% growth.",
    target: '[data-tour="students"]',
    position: "bottom",
  },
  {
    id: "revenue",
    title: "Revenue Tracking",
    content: "Monitor your academy's financial performance. Revenue is up 12% from last month!",
    target: '[data-tour="revenue"]',
    position: "bottom",
  },
  {
    id: "charts",
    title: "Analytics Dashboard",
    content: "View detailed analytics including attendance patterns, enrollment trends, and course distribution.",
    target: '[data-tour="charts"]',
    position: "top",
  },
  {
    id: "complete",
    title: "Tour Complete!",
    content: "You're all set! Explore the dashboard and use the navigation menu to access different features.",
    target: null,
    position: "center",
  },
]

interface TourTooltipProps {
  step: (typeof tourSteps)[0]
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onClose: () => void
}

function TourTooltip({ step, currentStep, totalSteps, onNext, onPrev, onClose }: TourTooltipProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (step.target) {
      const element = document.querySelector(step.target)
      if (element) {
        const rect = element.getBoundingClientRect()
        let top = 0
        let left = 0

        switch (step.position) {
          case "bottom":
            top = rect.bottom + 10
            left = rect.left + rect.width / 2 - 150
            break
          case "top":
            top = rect.top - 120
            left = rect.left + rect.width / 2 - 150
            break
          case "right":
            top = rect.top + rect.height / 2 - 60
            left = rect.right + 10
            break
          case "left":
            top = rect.top + rect.height / 2 - 60
            left = rect.left - 310
            break
        }

        setPosition({ top, left })
      }
    }
  }, [step])

  if (step.position === "center") {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-[1002]">
        <Card className="w-96 shadow-2xl border-primary">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">{step.title}</CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{step.content}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {currentStep} of {totalSteps}
              </span>
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <Button variant="outline" size="sm" onClick={onPrev}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                )}
                <Button size="sm" onClick={onNext}>
                  {currentStep === totalSteps ? "Finish" : "Next"}
                  {currentStep < totalSteps && <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed z-[1002] w-80" style={{ top: position.top, left: position.left }}>
      <Card className="shadow-2xl border-primary">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">{step.title}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{step.content}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {currentStep} of {totalSteps}
            </span>
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button variant="outline" size="sm" onClick={onPrev}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
              )}
              <Button size="sm" onClick={onNext}>
                {currentStep === totalSteps ? "Finish" : "Next"}
                {currentStep < totalSteps && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AcademyDashboard() {
  const [tourActive, setTourActive] = useState(false)
  const [currentTourStep, setCurrentTourStep] = useState(0)

  const startTour = () => {
    setTourActive(true)
    setCurrentTourStep(0)
  }

  const router = useRouter();
  const nextStep = () => {
    if (currentTourStep < tourSteps.length - 1) {
      setCurrentTourStep(currentTourStep + 1)
    } else {
      setTourActive(false)
      setCurrentTourStep(0)
      // Redirect to dashboard after finishing the tour
      router.push('/dashboard');
    }
  }

  const prevStep = () => {
    if (currentTourStep > 0) {
      setCurrentTourStep(currentTourStep - 1)
    }
  }

  const closeTour = () => {
    setTourActive(false)
    setCurrentTourStep(0)
  }

  const currentStep = tourSteps[currentTourStep]

  useEffect(() => {
    if (tourActive && currentStep?.target) {
      const element = document.querySelector(currentStep.target)
      if (element) {
        element.classList.add("tour-highlight", "tour-pulse")
        return () => {
          element.classList.remove("tour-highlight", "tour-pulse")
        }
      }
    }
  }, [tourActive, currentStep])

  return (
    <div className="min-h-screen bg-background">
      {/* Tour Overlay */}
      {tourActive && <div className="tour-overlay" />}

      {/* Header */}
      <header className="bg-white border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">
                <span className="text-primary">Uniq</span>
                <span className="text-orange-500">Brio</span>
              </span>
            </div>
            <div className="text-2xl font-bold">
              <span className="text-primary">XYZ</span>
              <span className="text-orange-500"> Academy</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={startTour}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Start Tour
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm">English</span>
              <ChevronDown className="h-4 w-4" />
            </div>
            <div className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-orange-500 text-xs">3</Badge>
            </div>
            <Settings className="h-5 w-5" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-green-600">Admin Profile</span>
              <User className="h-5 w-5" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-72 bg-sidebar border-r border-sidebar-border h-[calc(100vh-73px)]" data-tour="sidebar">
          <div className="p-4">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search menu..." className="pl-10" />
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Star className="h-4 w-4 text-orange-500" />
                <Star className="h-4 w-4 text-orange-500" />
                Favourite Menu Items
              </div>
            </div>

            <nav className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground">
                <Home className="h-5 w-5" />
                <span>Home</span>
                <Star className="h-4 w-4 ml-auto" />
              </div>

              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground">
                <BookOpen className="h-5 w-5" />
                <span>Services</span>
                <Star className="h-4 w-4 ml-auto" />
                <ChevronDown className="h-4 w-4" />
              </div>

              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground">
                <Users className="h-5 w-5" />
                <span>User Management</span>
                <Star className="h-4 w-4 ml-auto" />
                <ChevronDown className="h-4 w-4" />
              </div>

              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground">
                <MessageSquare className="h-5 w-5" />
                <span>Enquiries</span>
                <Star className="h-4 w-4 ml-auto" />
              </div>

              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground">
                <CreditCard className="h-5 w-5" />
                <span>Payments</span>
                <Star className="h-4 w-4 ml-auto" />
              </div>

              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground">
                <DollarSign className="h-5 w-5" />
                <span>Financials</span>
                <Star className="h-4 w-4 ml-auto" />
                <ChevronDown className="h-4 w-4" />
              </div>

              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground">
                <Megaphone className="h-5 w-5" />
                <span>Promotion</span>
                <Star className="h-4 w-4 ml-auto" />
              </div>

              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground">
                <Calendar className="h-5 w-5" />
                <span>Events</span>
                <Star className="h-4 w-4 ml-auto" />
              </div>

              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground">
                <UserGroup className="h-5 w-5" />
                <span>Community</span>
                <Star className="h-4 w-4 ml-auto" />
              </div>

              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
                <Star className="h-4 w-4 ml-auto" />
                <ChevronDown className="h-4 w-4" />
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-tour="metrics">
            <Card data-tour="students">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">450</div>
                <p className="text-sm text-green-600 mt-1">+5% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">24</div>
                <p className="text-sm text-muted-foreground mt-1">Same as last month</p>
              </CardContent>
            </Card>

            <Card data-tour="revenue">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$45,670</div>
                <p className="text-sm text-green-600 mt-1">+12% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Staff Count</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">32</div>
                <p className="text-sm text-green-600 mt-1">+2 from last month</p>
              </CardContent>
            </Card>
          </div>

          {/* Dashboard Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Dashboard</h2>
            <p className="text-muted-foreground mb-6">Key metrics and interactive charts</p>

            {/* Chart Navigation */}
            <div className="flex gap-4 mb-6">
              <Button variant="default" className="bg-primary text-primary-foreground">
                Attendance
              </Button>
              <Button variant="ghost">Enrollment</Button>
              <Button variant="ghost">Course Distribution</Button>
              <Button variant="ghost">ROI</Button>
              <Button variant="ghost">Forecast</Button>
            </div>

            {/* Chart */}
            <Card data-tour="charts">
              <CardHeader>
                <CardTitle>Weekly Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-border px-6 py-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>© 2025 XYZ Academy. All rights reserved.</span>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Contact Us</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Powered by</span>
            <div className="flex items-center gap-1">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span className="font-semibold">
                <span className="text-primary">Uniq</span>
                <span className="text-orange-500">Brio</span>
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Tour Tooltip */}
      {tourActive && (
        <TourTooltip
          step={currentStep}
          currentStep={currentTourStep + 1}
          totalSteps={tourSteps.length}
          onNext={nextStep}
          onPrev={prevStep}
          onClose={closeTour}
        />
      )}
    </div>
  )
}
