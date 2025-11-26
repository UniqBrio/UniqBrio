"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCustomColors } from "@/lib/use-custom-colors"
import { Button } from "@/components/dashboard/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Badge } from "@/components/dashboard/ui/badge"
import { Progress } from "@/components/dashboard/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import { toast } from "@/components/dashboard/ui/use-toast"
import {
  Users,
  UserCheck,
  UserCog,
  GraduationCap,
  Calendar,
  ClipboardCheck,
  TrendingUp,
  Activity,
  BarChart3,
  Plus,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Eye,
  Settings,
  Users2,
  Clock,
  CalendarDays,
  PieChart,
  LineChart,
  Target,
  Trophy,
  Zap
} from "lucide-react"

interface InstructorStats {
  totalInstructors: number
  activeInstructors: number
  onLeaveToday: number
  attendanceRate: number
}

interface NonInstructorStats {
  totalNonInstructors: number
  activeNonInstructors: number
  onLeaveToday: number
  attendanceRate: number
}

interface StaffOverallStats {
  totalStaff: number
  activeStaff: number
  totalOnLeave: number
  overallAttendanceRate: number
}

export default function StaffManagementPage() {
  const { primaryColor, secondaryColor } = useCustomColors()
  const router = useRouter()
  const [instructorStats, setInstructorStats] = useState<InstructorStats>({
    totalInstructors: 0,
    activeInstructors: 0,
    onLeaveToday: 0,
    attendanceRate: 0
  })
  
  const [nonInstructorStats, setNonInstructorStats] = useState<NonInstructorStats>({
    totalNonInstructors: 0,
    activeNonInstructors: 0,
    onLeaveToday: 0,
    attendanceRate: 0
  })

  const [overallStats, setOverallStats] = useState<StaffOverallStats>({
    totalStaff: 0,
    activeStaff: 0,
    totalOnLeave: 0,
    overallAttendanceRate: 0
  })

  const [loading, setLoading] = useState(true)

  // Helper function to calculate staff distribution metrics
  const getDistributionMetrics = () => {
    if (overallStats.totalStaff === 0) return { instructorPercentage: 0, nonInstructorPercentage: 0 }
    
    return {
      instructorPercentage: (instructorStats.totalInstructors / overallStats.totalStaff) * 100,
      nonInstructorPercentage: (nonInstructorStats.totalNonInstructors / overallStats.totalStaff) * 100
    }
  }

  // Helper function to get attendance comparison data
  const getAttendanceComparison = () => {
    return {
      instructorRate: instructorStats.attendanceRate,
      nonInstructorRate: nonInstructorStats.attendanceRate,
      averageRate: overallStats.overallAttendanceRate,
      bestPerforming: instructorStats.attendanceRate > nonInstructorStats.attendanceRate ? 'Instructors' : 'Non-Instructors',
      gap: Math.abs(instructorStats.attendanceRate - nonInstructorStats.attendanceRate)
    }
  }

  // Fetch staff data
  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        setLoading(true)
        
        // Fetch actual instructor data
        const instructorResponse = await fetch('/api/dashboard/staff/instructors/stats')
        const instructorData = await instructorResponse.json()
        console.log('Instructor Stats:', instructorData)

        // Fetch actual non-instructor data
        const nonInstructorResponse = await fetch('/api/dashboard/staff/non-instructors/stats')
        const nonInstructorData = await nonInstructorResponse.json()
        console.log('Non-Instructor Stats:', nonInstructorData)

        setInstructorStats({
          totalInstructors: instructorData.total || 0,
          activeInstructors: instructorData.active || 0,
          onLeaveToday: instructorData.onLeave || 0,
          attendanceRate: instructorData.attendanceRate || 0
        })

        setNonInstructorStats({
          totalNonInstructors: nonInstructorData.total || 0,
          activeNonInstructors: nonInstructorData.active || 0,
          onLeaveToday: nonInstructorData.onLeave || 0,
          attendanceRate: nonInstructorData.attendanceRate || 0
        })
        
        console.log('Instructor State:', {
          totalInstructors: instructorData.total || 0,
          activeInstructors: instructorData.active || 0,
          onLeaveToday: instructorData.onLeave || 0,
          attendanceRate: instructorData.attendanceRate || 0
        })
        
        console.log('Non-Instructor State:', {
          totalNonInstructors: nonInstructorData.total || 0,
          activeNonInstructors: nonInstructorData.active || 0,
          onLeaveToday: nonInstructorData.onLeave || 0,
          attendanceRate: nonInstructorData.attendanceRate || 0
        })
        
        // Calculate overall stats
        const totalStaff = (instructorData.total || 0) + (nonInstructorData.total || 0)
        const activeStaff = (instructorData.active || 0) + (nonInstructorData.active || 0)
        const totalOnLeave = (instructorData.onLeave || 0) + (nonInstructorData.onLeave || 0)
        
        console.log('Overall Stats Calculation:', {
          totalStaff,
          activeStaff,
          totalOnLeave,
          instructorOnLeave: instructorData.onLeave,
          nonInstructorOnLeave: nonInstructorData.onLeave
        })
        
        setOverallStats({
          totalStaff,
          activeStaff,
          totalOnLeave,
          overallAttendanceRate: totalStaff > 0 ? Math.round(
            ((instructorData.attendanceRate || 0) * (instructorData.total || 0) + 
             (nonInstructorData.attendanceRate || 0) * (nonInstructorData.total || 0)) / totalStaff
          ) : 0
        })
        
      } catch (error) {
        console.error('Error fetching staff data:', error)
        toast({
          title: "Error",
          description: "Failed to load staff data. Please try again.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStaffData()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2" style={{ color: primaryColor }}>
              <Users className="h-8 w-8" />
              Staff Management
            </h1>
            <p className="text-gray-500 dark:text-white">
              Comprehensive staff management dashboard with real-time insights and advanced analytics
            </p>
          </div>
        </div>

        {/* Stats Overview - Matching Services Page Theme */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card style={{ borderColor: primaryColor, backgroundImage: `linear-gradient(to bottom right, ${primaryColor}10, ${primaryColor}30)` }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: primaryColor }}>Total Staff</p>
                  <p className="text-2xl font-bold" style={{ color: primaryColor }}>{overallStats.totalStaff}</p>
                </div>
                <Users className="h-8 w-8" style={{ color: primaryColor }} />
              </div>
              <p className="text-xs mt-1" style={{ color: primaryColor }}>
                {overallStats.activeStaff} currently active
              </p>
            </CardContent>
          </Card>

          <Card style={{ borderColor: secondaryColor, backgroundImage: `linear-gradient(to bottom right, ${secondaryColor}10, ${secondaryColor}30)` }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: secondaryColor }}>Instructors</p>
                  <p className="text-2xl font-bold" style={{ color: secondaryColor }}>{instructorStats.totalInstructors}</p>
                </div>
                <GraduationCap className="h-8 w-8" style={{ color: secondaryColor }} />
              </div>
              <p className="text-xs mt-1" style={{ color: secondaryColor }}>
                {instructorStats.activeInstructors} active
              </p>
            </CardContent>
          </Card>

          <Card style={{ borderColor: primaryColor, backgroundImage: `linear-gradient(to bottom right, ${primaryColor}10, ${primaryColor}30)` }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: primaryColor }}>Non-Instructors</p>
                  <p className="text-2xl font-bold" style={{ color: primaryColor }}>{nonInstructorStats.totalNonInstructors}</p>
                </div>
                <UserCog className="h-8 w-8" style={{ color: primaryColor }} />
              </div>
              <p className="text-xs mt-1" style={{ color: primaryColor }}>
                {nonInstructorStats.activeNonInstructors} active
              </p>
            </CardContent>
          </Card>

          <Card style={{ borderColor: secondaryColor, backgroundImage: `linear-gradient(to bottom right, ${secondaryColor}10, ${secondaryColor}30)` }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: secondaryColor }}>On Leave Today</p>
                  <p className="text-2xl font-bold" style={{ color: secondaryColor }}>{overallStats.totalOnLeave}</p>
                </div>
                <Calendar className="h-8 w-8" style={{ color: secondaryColor }} />
              </div>
              <p className="text-xs mt-1" style={{ color: secondaryColor }}>
                {((overallStats.totalOnLeave / overallStats.totalStaff) * 100).toFixed(1)}% of staff
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Views */}
        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-transparent gap-2 p-0 h-auto">
            <TabsTrigger
              value="analytics"
              className="flex items-center justify-center gap-2 px-4 py-2 border-2 font-medium"
              style={{
                borderColor: secondaryColor,
                color: secondaryColor
              }}
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="staff-areas"
              className="flex items-center justify-center gap-2 px-4 py-2 border-2 font-medium"
              style={{
                borderColor: secondaryColor,
                color: secondaryColor
              }}
            >
              <Users className="h-4 w-4" />
              Staff Areas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="staff-areas" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Instructor Management */}
              <Card style={{ borderColor: secondaryColor, backgroundImage: `linear-gradient(to bottom right, ${secondaryColor}10, ${secondaryColor}30)` }}>
                <CardHeader className="pb-2 border-b bg-white dark:bg-gray-900 rounded-t-lg" style={{ borderColor: secondaryColor }}>
                  <CardTitle className="flex items-center gap-2" style={{ color: secondaryColor }}>
                    <GraduationCap className="h-5 w-5" style={{ color: secondaryColor }} />
                    Instructor Management
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-white">
                    Manage teaching staff, schedules, and performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span style={{ color: secondaryColor }}>Active Instructors</span>
                      <span style={{ color: secondaryColor }}>{instructorStats.activeInstructors}/{instructorStats.totalInstructors}</span>
                    </div>
                    <Progress 
                      value={(instructorStats.activeInstructors / instructorStats.totalInstructors) * 100} 
                      className="h-2"
                      style={{ backgroundColor: `${secondaryColor}20` }}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span style={{ color: secondaryColor }}>Attendance Rate</span>
                      <span style={{ color: secondaryColor }}>{instructorStats.attendanceRate}%</span>
                    </div>
                    <Progress value={instructorStats.attendanceRate} className="h-2" style={{ backgroundColor: `${secondaryColor}20` }} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-white/50 p-2 rounded border" style={{ borderColor: secondaryColor }}>
                      <div style={{ color: secondaryColor }}>On Leave Today</div>
                      <div className="font-semibold" style={{ color: secondaryColor }}>{instructorStats.onLeaveToday}</div>
                    </div>
                    <div className="bg-white/50 p-2 rounded border" style={{ borderColor: secondaryColor }}>
                      <div style={{ color: secondaryColor }}>Available</div>
                      <div className="font-semibold" style={{ color: secondaryColor }}>{instructorStats.activeInstructors - instructorStats.onLeaveToday}</div>
                    </div>
                  </div>

                  <Button
                    className="w-full text-white"
                    style={{ backgroundColor: secondaryColor }}
                    onClick={() => router.push("/dashboard/user/staff/instructor")}
                  >
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Manage Instructors
                  </Button>
                </CardContent>
              </Card>

              {/* Non-Instructor Management */}
              <Card style={{ borderColor: primaryColor, backgroundImage: `linear-gradient(to bottom right, ${primaryColor}10, ${primaryColor}30)` }}>
                <CardHeader className="pb-2 border-b bg-white dark:bg-gray-900 rounded-t-lg" style={{ borderColor: primaryColor }}>
                  <CardTitle className="flex items-center gap-2" style={{ color: primaryColor }}>
                    <UserCog className="h-5 w-5" style={{ color: primaryColor }} />
                    Non-Instructor Management
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-white">
                    Manage administrative and support staff
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span style={{ color: primaryColor }}>Active Non-Instructors</span>
                      <span style={{ color: primaryColor }}>{nonInstructorStats.activeNonInstructors}/{nonInstructorStats.totalNonInstructors}</span>
                    </div>
                    <Progress 
                      value={(nonInstructorStats.activeNonInstructors / nonInstructorStats.totalNonInstructors) * 100} 
                      className="h-2"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span style={{ color: primaryColor }}>Attendance Rate</span>
                      <span style={{ color: primaryColor }}>{nonInstructorStats.attendanceRate}%</span>
                    </div>
                    <Progress value={nonInstructorStats.attendanceRate} className="h-2" style={{ backgroundColor: `${primaryColor}20` }} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-white/50 p-2 rounded border" style={{ borderColor: primaryColor }}>
                      <div style={{ color: primaryColor }}>On Leave Today</div>
                      <div className="font-semibold" style={{ color: primaryColor }}>{nonInstructorStats.onLeaveToday}</div>
                    </div>
                    <div className="bg-white/50 p-2 rounded border" style={{ borderColor: primaryColor }}>
                      <div style={{ color: primaryColor }}>Available</div>
                      <div className="font-semibold" style={{ color: primaryColor }}>{nonInstructorStats.activeNonInstructors - nonInstructorStats.onLeaveToday}</div>
                    </div>
                  </div>

                  <Button
                    className="w-full text-white"
                    style={{ backgroundColor: primaryColor }}
                    onClick={() => router.push("/dashboard/user/staff/non-instructor")}
                  >
                    <UserCog className="mr-2 h-4 w-4" />
                    Manage Non-Instructors
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Graph-Focused Analytics Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Staff Distribution Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" style={{ color: primaryColor }} />
                    Staff Distribution by Role
                  </CardTitle>
                  <CardDescription>
                    Live data: {overallStats.totalStaff} total staff members ({overallStats.activeStaff} active, {overallStats.totalOnLeave} on leave)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center">
                    {/* Pie Chart with Labels */}
                    <div className="relative w-full h-64">
                      <svg className="w-full h-64" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet">
                        <defs>
                          <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fb923c" />
                            <stop offset="100%" stopColor="#ea580c" />
                          </linearGradient>
                          <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#7c3aed" />
                          </linearGradient>
                        </defs>
                        
                        {(() => {
                          const total = overallStats.totalStaff;
                          const instructorCount = instructorStats.totalInstructors;
                          const nonInstructorCount = nonInstructorStats.totalNonInstructors;
                          
                          // If no staff, show empty state
                          if (total === 0) {
                            return (
                              <g>
                                <circle
                                  cx="150"
                                  cy="100"
                                  r="70"
                                  fill="#f3f4f6"
                                  stroke="#e5e7eb"
                                  strokeWidth="2"
                                />
                                <text
                                  x="150"
                                  y="100"
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fill="#9ca3af"
                                  fontSize="14"
                                  fontWeight="500"
                                >
                                  No staff data
                                </text>
                              </g>
                            );
                          }
                          
                          const instructorPercent = (instructorCount / total) * 100;
                          const nonInstructorPercent = (nonInstructorCount / total) * 100;
                          
                          // Calculate angles
                          const instructorAngle = (instructorPercent / 100) * 360;
                          const startAngle = 0;
                          const endAngle = instructorAngle;
                          
                          // Convert angles to radians and calculate path
                          const radius = 70;
                          const centerX = 150;
                          const centerY = 100;
                          
                          // Instructor slice
                          const x1 = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
                          const y1 = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
                          const x2 = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
                          const y2 = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
                          const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
                          
                          // Non-instructor slice
                          const x3 = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
                          const y3 = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
                          const x4 = centerX + radius * Math.cos((360 - 90) * Math.PI / 180);
                          const y4 = centerY + radius * Math.sin((360 - 90) * Math.PI / 180);
                          const largeArcFlag2 = 360 - endAngle > 180 ? 1 : 0;
                          
                          // Label positions (outside the pie chart)
                          const instructorMidAngle = (startAngle + endAngle) / 2 - 90;
                          const lineStartRadius = radius + 5;
                          const lineEndRadius = radius + 25;
                          const labelRadius = radius + 35;
                          
                          const instructorLineStartX = centerX + lineStartRadius * Math.cos(instructorMidAngle * Math.PI / 180);
                          const instructorLineStartY = centerY + lineStartRadius * Math.sin(instructorMidAngle * Math.PI / 180);
                          const instructorLineEndX = centerX + lineEndRadius * Math.cos(instructorMidAngle * Math.PI / 180);
                          const instructorLineEndY = centerY + lineEndRadius * Math.sin(instructorMidAngle * Math.PI / 180);
                          const instructorLabelX = centerX + labelRadius * Math.cos(instructorMidAngle * Math.PI / 180);
                          const instructorLabelY = centerY + labelRadius * Math.sin(instructorMidAngle * Math.PI / 180);
                          
                          const nonInstructorMidAngle = (endAngle + 360) / 2 - 90;
                          const nonInstructorLineStartX = centerX + lineStartRadius * Math.cos(nonInstructorMidAngle * Math.PI / 180);
                          const nonInstructorLineStartY = centerY + lineStartRadius * Math.sin(nonInstructorMidAngle * Math.PI / 180);
                          const nonInstructorLineEndX = centerX + lineEndRadius * Math.cos(nonInstructorMidAngle * Math.PI / 180);
                          const nonInstructorLineEndY = centerY + lineEndRadius * Math.sin(nonInstructorMidAngle * Math.PI / 180);
                          const nonInstructorLabelX = centerX + labelRadius * Math.cos(nonInstructorMidAngle * Math.PI / 180);
                          const nonInstructorLabelY = centerY + labelRadius * Math.sin(nonInstructorMidAngle * Math.PI / 180);
                          
                          return (
                            <g>
                              {/* Instructor slice */}
                              <path
                                d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                                fill="url(#orangeGradient)"
                                stroke="white"
                                strokeWidth="2"
                                className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                              />
                              
                              {/* Non-instructor slice */}
                              <path
                                d={`M ${centerX} ${centerY} L ${x3} ${y3} A ${radius} ${radius} 0 ${largeArcFlag2} 1 ${x4} ${y4} Z`}
                                fill="url(#purpleGradient)"
                                stroke="white"
                                strokeWidth="2"
                                className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                              />
                              
                              {/* Connector lines */}
                              <line
                                x1={instructorLineStartX}
                                y1={instructorLineStartY}
                                x2={instructorLineEndX}
                                y2={instructorLineEndY}
                                stroke="#f97316"
                                strokeWidth="1.5"
                              />
                              
                              <line
                                x1={nonInstructorLineStartX}
                                y1={nonInstructorLineStartY}
                                x2={nonInstructorLineEndX}
                                y2={nonInstructorLineEndY}
                                stroke="#a855f7"
                                strokeWidth="1.5"
                              />
                              
                              {/* Labels outside slices */}
                              <text
                                x={instructorLabelX}
                                y={instructorLabelY}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#f97316"
                                fontSize="12"
                                fontWeight="600"
                                className="pointer-events-none"
                              >
                                Instructors
                              </text>
                              
                              <text
                                x={nonInstructorLabelX}
                                y={nonInstructorLabelY}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#a855f7"
                                fontSize="12"
                                fontWeight="600"
                                className="pointer-events-none"
                              >
                                Non-Instructors
                              </text>
                            </g>
                          );
                        })()}
                      </svg>
                    </div>
                  </div>
                  
                  {/* Enhanced Legend with Real Data */}
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 rounded-lg border" style={{ backgroundColor: `${secondaryColor}10`, borderColor: secondaryColor }}>
                      <div className="w-4 h-4 rounded-full" style={{ background: `linear-gradient(to bottom right, ${secondaryColor}, ${secondaryColor}dd)` }}></div>
                      <div>
                        <div className="font-medium" style={{ color: secondaryColor }}>{instructorStats.totalInstructors} Instructors</div>
                        <div className="text-xs" style={{ color: secondaryColor }}>{Math.round((instructorStats.totalInstructors / overallStats.totalStaff) * 100)}% of total staff</div>
                        <div className="text-xs mt-1" style={{ color: secondaryColor }}>{instructorStats.activeInstructors} active • {instructorStats.onLeaveToday} on leave</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-lg border" style={{ backgroundColor: `${primaryColor}10`, borderColor: primaryColor }}>
                      <div className="w-4 h-4 rounded-full" style={{ background: `linear-gradient(to bottom right, ${primaryColor}, ${primaryColor}dd)` }}></div>
                      <div>
                        <div className="font-medium" style={{ color: primaryColor }}>{nonInstructorStats.totalNonInstructors} Non-Instructors</div>
                        <div className="text-xs" style={{ color: primaryColor }}>{Math.round((nonInstructorStats.totalNonInstructors / overallStats.totalStaff) * 100)}% of total staff</div>
                        <div className="text-xs mt-1" style={{ color: primaryColor }}>{nonInstructorStats.activeNonInstructors} active • {nonInstructorStats.onLeaveToday} on leave</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance Performance Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" style={{ color: secondaryColor }} />
                    Attendance Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Enhanced Bar Chart */}
                    <div className="relative h-56 bg-gradient-to-t from-gray-50 to-transparent rounded-lg p-6">
                      <div className="absolute inset-6">
                        {/* Y-axis labels */}
                        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 dark:text-white">
                          <span>100%</span>
                          <span>75%</span>
                          <span>50%</span>
                          <span>25%</span>
                          <span>0%</span>
                        </div>
                        
                        {/* Chart area */}
                        <div className="ml-8 h-full flex items-end justify-around gap-8">
                          {/* Instructor Bar with shadow */}
                          <div className="flex flex-col items-center flex-1">
                            <div className="relative w-16 mb-3 group">
                              <div className="absolute inset-0 bg-orange-300 rounded-lg blur-sm opacity-50"></div>
                              <div 
                                className="relative bg-gradient-to-t from-orange-400 via-orange-500 to-orange-600 rounded-lg transition-all duration-1000 flex items-end justify-center text-white text-sm font-bold pb-2 shadow-lg hover:shadow-xl"
                                style={{ height: `${(instructorStats.attendanceRate / 100) * 160}px` }}
                              >
                                {instructorStats.attendanceRate}%
                              </div>
                            </div>
                            <span className="text-xs font-medium" style={{ color: secondaryColor }}>Instructors</span>
                          </div>

                          {/* Non-Instructor Bar with shadow */}
                          <div className="flex flex-col items-center flex-1">
                            <div className="relative w-16 mb-3 group">
                              <div className="absolute inset-0 bg-purple-300 rounded-lg blur-sm opacity-50"></div>
                              <div 
                                className="relative bg-gradient-to-t from-purple-400 via-purple-500 to-purple-600 rounded-lg transition-all duration-1000 flex items-end justify-center text-white text-sm font-bold pb-2 shadow-lg hover:shadow-xl"
                                style={{ height: `${(nonInstructorStats.attendanceRate / 100) * 160}px` }}
                              >
                                {nonInstructorStats.attendanceRate}%
                              </div>
                            </div>
                            <span className="text-xs font-medium" style={{ color: primaryColor }}>Non-Instructors</span>
                          </div>

                          {/* Average Line Indicator */}
                          <div className="absolute right-0 flex items-center" style={{ bottom: `${(overallStats.overallAttendanceRate / 100) * 160 + 30}px` }}>
                            <div className="w-full h-0.5 bg-gray-400 opacity-60"></div>
                            <span className="text-xs text-gray-600 dark:text-white ml-2 bg-white dark:bg-gray-800 px-1 rounded">Avg {overallStats.overallAttendanceRate}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Performance Gap Indicator */}
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border" style={{ backgroundImage: `linear-gradient(to right, ${primaryColor}10, ${secondaryColor}10)`, borderColor: secondaryColor }}>
                        <Trophy className="h-4 w-4" style={{ color: secondaryColor }} />
                        <span className="text-sm font-medium">
                          Gap: {Math.abs(instructorStats.attendanceRate - nonInstructorStats.attendanceRate)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Advanced Graph Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Status Radial Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" style={{ color: primaryColor }} />
                    Active vs Leave Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center">
                    {/* Radial Progress Chart */}
                    <div className="relative w-40 h-40">
                      <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle cx="50" cy="50" r="35" fill="none" stroke="#e5e7eb" strokeWidth="6"/>
                        
                        {/* Active staff arc (green) */}
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="35" 
                          fill="none" 
                          stroke="url(#activeGradient)" 
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={`${(overallStats.activeStaff / overallStats.totalStaff) * 220} 220`}
                          className="transition-all duration-1500"
                        />
                        
                        {/* Leave staff arc (red) */}
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="35" 
                          fill="none" 
                          stroke="url(#leaveGradient)" 
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={`${(overallStats.totalOnLeave / overallStats.totalStaff) * 220} 220`}
                          strokeDashoffset={`-${(overallStats.activeStaff / overallStats.totalStaff) * 220}`}
                          className="transition-all duration-1500"
                        />
                        
                        <defs>
                          <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#059669" />
                          </linearGradient>
                          <linearGradient id="leaveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="100%" stopColor="#dc2626" />
                          </linearGradient>
                        </defs>
                      </svg>
                      
                      {/* Center content */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-2xl font-bold text-green-600">{Math.round((overallStats.activeStaff / overallStats.totalStaff) * 100)}%</div>
                        <div className="text-xs text-gray-600 dark:text-white">Active</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Status Breakdown with Real Data */}
                  <div className="mt-6 space-y-4">
                    {/* Active Staff Progress Indicator */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium">Active Today</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-green-600">{overallStats.activeStaff}</span>
                          <span className="text-sm text-gray-500 dark:text-white">({Math.round((overallStats.activeStaff / overallStats.totalStaff) * 100)}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${(overallStats.activeStaff / overallStats.totalStaff) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* On Leave Staff Progress Indicator */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                          <span className="text-sm font-medium">On Leave Today</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-red-500">{overallStats.totalOnLeave}</span>
                          <span className="text-sm text-gray-500 dark:text-white">({Math.round((overallStats.totalOnLeave / overallStats.totalStaff) * 100)}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-red-400 to-red-600 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${(overallStats.totalOnLeave / overallStats.totalStaff) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Breakdown by Role */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-600 dark:text-white mb-3 font-medium">Active Staff by Role:</div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between items-center p-2 rounded border" style={{ backgroundColor: `${secondaryColor}10`, borderColor: secondaryColor }}>
                          <span style={{ color: secondaryColor }}>Instructors</span>
                          <span className="font-semibold" style={{ color: secondaryColor }}>{instructorStats.activeInstructors}/{instructorStats.totalInstructors}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded border" style={{ backgroundColor: `${primaryColor}10`, borderColor: primaryColor }}>
                          <span style={{ color: primaryColor }}>Non-Instructors</span>
                          <span className="font-semibold" style={{ color: primaryColor }}>{nonInstructorStats.activeNonInstructors}/{nonInstructorStats.totalNonInstructors}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Department Performance Radar */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" style={{ color: secondaryColor }} />
                    Performance Overview Radar
                  </CardTitle>
                  <CardDescription>
                    Multi-dimensional analysis based on live attendance data ({overallStats.overallAttendanceRate}% baseline)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Enhanced Performance radar with data labels */}
                    <div className="relative h-48 flex items-center justify-center">
                      <div className="relative w-40 h-40">
                        {/* Hexagon grid background with value markers */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
                          {/* Grid lines with percentage markers */}
                          <g stroke="#e5e7eb" strokeWidth="1" fill="none">
                            <polygon points="100,20 160,60 160,140 100,180 40,140 40,60" opacity="0.3"/>
                            <polygon points="100,40 140,70 140,130 100,160 60,130 60,70" opacity="0.3"/>
                            <polygon points="100,60 120,80 120,120 100,140 80,120 80,80" opacity="0.3"/>
                            <line x1="100" y1="20" x2="100" y2="180"/>
                            <line x1="40" y1="60" x2="160" y2="140"/>
                            <line x1="40" y1="140" x2="160" y2="60"/>
                          </g>
                          
                          {/* Percentage markers */}
                          <g fill="#9ca3af" fontSize="8" textAnchor="middle">
                            <text x="100" y="35" opacity="0.7">100%</text>
                            <text x="100" y="55" opacity="0.7">75%</text>
                            <text x="100" y="75" opacity="0.7">50%</text>
                            <text x="100" y="95" opacity="0.7">25%</text>
                          </g>
                          
                          {/* Performance data polygon with real calculations */}
                          <polygon 
                            points={`100,${200 - (instructorStats.attendanceRate * 1.6)} ${40 + (instructorStats.attendanceRate * 1.2)},${60 + (instructorStats.attendanceRate * 0.8)} ${40 + (nonInstructorStats.attendanceRate * 1.2)},${140 - (nonInstructorStats.attendanceRate * 0.8)} 100,${40 + (overallStats.overallAttendanceRate * 1.4)} ${160 - (instructorStats.attendanceRate * 1.2)},${140 - (instructorStats.attendanceRate * 0.8)} ${160 - (nonInstructorStats.attendanceRate * 1.2)},${60 + (nonInstructorStats.attendanceRate * 0.8)}`}
                            fill="url(#performanceGradient)" 
                            fillOpacity="0.3" 
                            stroke="url(#performanceStroke)" 
                            strokeWidth="2"
                          />
                          
                          {/* Data point indicators */}
                          <circle cx="100" cy={`${200 - (instructorStats.attendanceRate * 1.6)}`} r="3" fill="#ea580c"/>
                          <circle cx={`${40 + (instructorStats.attendanceRate * 1.2)}`} cy={`${60 + (instructorStats.attendanceRate * 0.8)}`} r="3" fill="#7c3aed"/>
                          <circle cx={`${40 + (nonInstructorStats.attendanceRate * 1.2)}`} cy={`${140 - (nonInstructorStats.attendanceRate * 0.8)}`} r="3" fill="#fb923c"/>
                          
                          <defs>
                            <linearGradient id="performanceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#a855f7" />
                              <stop offset="100%" stopColor="#fb923c" />
                            </linearGradient>
                            <linearGradient id="performanceStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#7c3aed" />
                              <stop offset="100%" stopColor="#ea580c" />
                            </linearGradient>
                          </defs>
                        </svg>
                        
                        {/* Enhanced Performance labels with values */}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-center">
                          <div className="text-xs font-medium text-gray-700 dark:text-white">Attendance</div>
                          <div className="text-xs font-bold text-orange-600">{instructorStats.attendanceRate}%</div>
                        </div>
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center">
                          <div className="text-xs font-medium text-gray-700 dark:text-white">Overall</div>
                          <div className="text-xs font-bold text-purple-600">{overallStats.overallAttendanceRate}%</div>
                        </div>
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -rotate-90 text-center">
                          <div className="text-xs font-medium text-gray-700 dark:text-white">Active Rate</div>
                          <div className="text-xs font-bold text-green-600">{Math.round((overallStats.activeStaff / overallStats.totalStaff) * 100)}%</div>
                        </div>
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 rotate-90 text-center">
                          <div className="text-xs font-medium text-gray-700 dark:text-white">Coverage</div>
                          <div className="text-xs font-bold text-blue-600">{Math.round(((overallStats.totalStaff - overallStats.totalOnLeave) / overallStats.totalStaff) * 100)}%</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced Performance metrics with context */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-4 rounded-lg border" style={{ backgroundImage: `linear-gradient(to bottom right, ${secondaryColor}10, ${secondaryColor}30)`, borderColor: secondaryColor }}>
                          <div className="text-2xl font-bold" style={{ color: secondaryColor }}>{instructorStats.attendanceRate}%</div>
                          <div className="text-xs mb-1" style={{ color: secondaryColor }}>Instructor Average</div>
                          <div className="text-xs" style={{ color: secondaryColor }}>{instructorStats.activeInstructors} of {instructorStats.totalInstructors} active</div>
                        </div>
                        <div className="p-4 rounded-lg border" style={{ backgroundImage: `linear-gradient(to bottom right, ${primaryColor}10, ${primaryColor}30)`, borderColor: primaryColor }}>
                          <div className="text-2xl font-bold" style={{ color: primaryColor }}>{nonInstructorStats.attendanceRate}%</div>
                          <div className="text-xs mb-1" style={{ color: primaryColor }}>Non-Instructor Average</div>
                          <div className="text-xs" style={{ color: primaryColor }}>{nonInstructorStats.activeNonInstructors} of {nonInstructorStats.totalNonInstructors} active</div>
                        </div>
                      </div>
                      
                      {/* Performance Gap Analysis */}
                      <div className="text-center p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
                        <div className="text-sm font-medium text-gray-700 dark:text-white">
                          Performance Gap: <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {Math.abs(instructorStats.attendanceRate - nonInstructorStats.attendanceRate)}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-white mt-1">
                          {instructorStats.attendanceRate > nonInstructorStats.attendanceRate 
                            ? 'Instructors outperforming by ' + (instructorStats.attendanceRate - nonInstructorStats.attendanceRate) + '%'
                            : 'Non-instructors outperforming by ' + (nonInstructorStats.attendanceRate - instructorStats.attendanceRate) + '%'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>


          </TabsContent>
        </Tabs>
      </div>
  )
}