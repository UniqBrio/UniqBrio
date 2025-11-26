"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Badge } from "@/components/dashboard/ui/badge"
import { Progress } from "@/components/dashboard/ui/progress"
import { Button } from "@/components/dashboard/ui/button"
import { Skeleton } from "@/components/dashboard/ui/skeleton"
import { Clock, Users, BookOpen, TrendingUp, Award, AlertTriangle, Calendar, Star, Target, Trophy } from "lucide-react"
import { useCustomColors } from "@/lib/use-custom-colors";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList,
} from "recharts"
import React from "react"
import { useInstructors } from "@/hooks/dashboard/staff/use-instructors"
import { useDashboardStats } from "@/hooks/dashboard/staff/use-dashboard-stats"
// ComingSoonNotice intentionally not used here; sections remain disabled/greyed out without the banner




export default function InstructorDashboard() {
  const { primaryColor, secondaryColor } = useCustomColors();
  // Get real instructor data
  const { instructors, loading: instructorsLoading } = useInstructors();
  
  // Get real dashboard stats
  const { stats, loading: statsLoading, error: statsError } = useDashboardStats();
  // Mock data for new features
  const activeInstructors = instructors.length;
  const classesToday = 12;
  const newEnrollmentsWeek = 35;
  const newEnrollmentsMonth = 120;
  const topInstructors = [
    { name: "A. Sharma", rating: 4.9 },
    { name: "B. Singh", rating: 4.8 },
    { name: "C. Patel", rating: 4.7 }
  ];
  const popularClassTypes = [
    { type: "Football", enrollments: 38 },
    { type: "Music", enrollments: 34 },
    { type: "Painting", enrollments: 29 }
  ];
  const retentionRate = 92; // %

  return (
    <div className="space-y-6">
      {/* Quick Stats - Extended */}
      {/* Quick Stats - Extended */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Active Instructors */}
            <Card className="bg-green-50 border border-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-md font-semibold text-green-700">Total Instructors</CardTitle>
                <Users className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-green-800">
                  {instructorsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    activeInstructors
                  )}
                </div>
                <p className="text-sm text-green-700">Active Instructors</p>
              </CardContent>
            </Card>
            {/* Active Courses */}
            <Card className="bg-blue-50 border border-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-md font-semibold text-blue-700">Active Courses</CardTitle>
                <BookOpen className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-blue-800">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : statsError ? (
                    <span className="text-red-600 text-xl">--</span>
                  ) : (
                    stats.activeCourses
                  )}
                </div>
                <p className="text-sm text-blue-700">Currently running</p>
              </CardContent>
            </Card>
            
            {/* Total Students */}
            <Card className="border" style={{ backgroundColor: `${primaryColor}20`, borderColor: primaryColor }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-md font-semibold" style={{ color: `${primaryColor}dd` }}>Total Students</CardTitle>
                <Users className="h-5 w-5" style={{ color: primaryColor }} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold" style={{ color: primaryColor }}>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : statsError ? (
                    <span className="text-red-600 text-xl">--</span>
                  ) : (
                    stats.totalStudents
                  )}
                </div>
                <p className="text-sm" style={{ color: `${primaryColor}dd` }}>Enrolled students</p>
              </CardContent>
            </Card>
          </div>

      {/* Instructor Analytics: Job Level and Contract Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Level Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Job Level Distribution</CardTitle>
            <CardDescription>Current breakdown of instructors by job level</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] md:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              {(() => {
                const data = [...instructors.reduce((map, inst) => {
                  const key = (inst.jobLevel || "Unspecified").trim()
                  map.set(key, (map.get(key) || 0) + 1)
                  return map
                }, new Map<string, number>())]
                  .map(([name, value]) => ({ name, value }))
                  .sort((a, b) => b.value - a.value)

                return (
                  <BarChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      tick={{ fontSize: 12 }}
                      tickMargin={10}
                      height={60}
                      label={{ value: "Job level", position: "insideBottom", offset: -4 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      label={{ value: "No. of instructors", angle: -90, position: "insideLeft", style: { textAnchor: "middle" } }}
                    />
                    <Tooltip formatter={(v: any) => [String(v), "Instructors"]} />
                    <Bar dataKey="value" name="Instructors" fill="#8B5CF6" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="value" position="top" formatter={(v: any) => String(v)} />
                    </Bar>
                  </BarChart>
                )
              })()}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Contract Type Mix */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Contract Type Distribution</CardTitle>
            <CardDescription>Full-time, Part-time, Contract and others</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] md:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              {(() => {
                const rawMap = instructors.reduce((map, inst) => {
                  const raw = (inst.contractType || "Unspecified").trim()
                  const v = raw.toLowerCase()
                  let key = raw
                  if (v.includes("full")) key = "Full-time"
                  else if (v.includes("part")) key = "Part-time"
                  else if (v.includes("guest")) key = "Guest Faculty"
                  else if (v.includes("temp")) key = "Temporary"
                  else if (v.includes("contract")) key = "Contract"
                  map.set(key, (map.get(key) || 0) + 1)
                  return map
                }, new Map<string, number>())
                // Filter out Unspecified
                const data = [...rawMap]
                  .map(([name, value]) => ({ name, value }))
                  .filter(d => d.name !== "Unspecified" && d.value > 0)
                  .sort((a, b) => b.value - a.value)

                if (!data.length) {
                  return (
                    <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                      No data found
                    </div>
                  )
                }

                const colors = ["#8B5CF6", "#DE7D14", "#22C55E", "#06B6D4", "#F97316", "#A3E635", "#EF4444"]
                return (
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={54}
                      outerRadius={96}
                      paddingAngle={2}
                      label={(entry) => `${entry.value}`}
                      labelLine={false}
                    >
                      {data.map((_, i) => (
                        <Cell key={i} fill={colors[i % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={24} />
                  </PieChart>
                )
              })()}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      

      <Card>
        <CardHeader>
          <CardTitle>
                      Smart Nudges & Alerts{" "}
                      
                    </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Disabled state to match Attendance tab (banner removed as requested) */}
          <div className="opacity-50 pointer-events-none select-none">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: `${secondaryColor}15` }}>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4" style={{ color: secondaryColor }} />
                  <div>
                    <p className="font-medium">Low Attendance Alert</p>
                    <p className="text-sm text-gray-600 dark:text-white">Class 10-A Math has 65% attendance this week</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="font-medium">Syllabus Delay</p>
                    <p className="text-sm text-gray-600 dark:text-white">Physics Chapter 5 is 3 days behind schedule</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Update Progress
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Trophy className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="font-medium">Achievement Unlocked</p>
                    <p className="text-sm text-gray-600 dark:text-white">You've maintained 95%+ attendance for 30 days!</p>
                  </div>
                </div>
                <Badge variant="secondary">New Badge</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Leaderboard & Recognition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Leaderboard Status{" "}
                      

            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="opacity-50 pointer-events-none select-none">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Best Instructor (Monthly)</span>
                  <Badge className="bg-yellow-100 text-yellow-800">#3</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Punctuality Ranking</span>
                  <Badge className="bg-green-100 text-green-800">#1</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Student Satisfaction</span>
                  <Badge className="bg-blue-100 text-blue-800">#2</Badge>
                </div>
                <Progress value={85} className="w-full" />
                <p className="text-sm text-gray-600 dark:text-white">85% to next milestone</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" style={{ color: primaryColor }} />
              Recognition Badges {" "}
                      

            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="opacity-50 pointer-events-none select-none">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                  <p className="text-xs font-medium">Excellence</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-xs font-medium">Punctual</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-xs font-medium">Mentor</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: `${primaryColor}20` }}>
                    <BookOpen className="h-6 w-6" style={{ color: primaryColor }} />
                  </div>
                  <p className="text-xs font-medium">Innovator</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: `${secondaryColor}20` }}>
                    <TrendingUp className="h-6 w-6" style={{ color: secondaryColor }} />
                  </div>
                  <p className="text-xs font-medium">Growth</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Trophy className="h-6 w-6 text-gray-400 dark:text-white" />
                  </div>
                  <p className="text-xs font-medium text-gray-400 dark:text-white">Locked</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      
    </div>
  )
}
