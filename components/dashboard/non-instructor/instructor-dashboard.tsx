"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Badge } from "@/components/dashboard/ui/badge"
import { Progress } from "@/components/dashboard/ui/progress"
import { Button } from "@/components/dashboard/ui/button"
import { Skeleton } from "@/components/dashboard/ui/skeleton"
import { Clock, Users, BookOpen, TrendingUp, Award, AlertTriangle, Calendar, Star, Target, Trophy } from "lucide-react"
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
import { useNonInstructors } from "@/hooks/dashboard/staff/use-non-instructors"
import { parseToYMDFlexible } from "@/lib/dashboard/staff/date-utils"
// ComingSoonNotice intentionally not used here; sections remain disabled/greyed out without the banner




export default function InstructorDashboard() {
  // Get real non-instructor data
  const { instructors, loading: instructorsLoading } = useNonInstructors();
  // Derived metrics from backend data
  const activeInstructors = instructors.length;

  // Top roles by headcount (group by role)
  const topRoles = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const inst of instructors) {
      const role = (inst.role || "Unspecified").trim();
      counts.set(role, (counts.get(role) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count);
  }, [instructors]);

  // New hires in current calendar month (based on joiningDate)
  const newHiresThisMonth = React.useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1; // 1-12
    return instructors.reduce((acc, inst) => {
      const ymd = parseToYMDFlexible(inst.joiningDate);
      if (!ymd) return acc;
      const [yy, mm] = ymd.split("-").map(n => parseInt(n, 10));
      if (yy === y && mm === m) return acc + 1;
      return acc;
    }, 0);
  }, [instructors]);

  return (
    <div className="space-y-6">
      {/* Quick Stats - Extended */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Active Non-Instructors */}
            <Card className="bg-green-50 border border-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-md font-semibold text-green-700">Total Non-Instructors</CardTitle>
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
                <p className="text-sm text-green-700">Active Non-Instructors</p>
              </CardContent>
            </Card>
            {/* Top Roles by Headcount */}
            <Card className="bg-blue-50 border border-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-md font-semibold text-blue-700">Top 3 categories by role</CardTitle>
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                {instructorsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ) : topRoles.length === 0 ? (
                  <p className="text-sm text-blue-700">No roles found</p>
                ) : (
                  <div className="space-y-2">
                    {topRoles.slice(0,3).map((r, idx) => (
                      <div key={r.role} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">{idx+1}</div>
                          <span className="text-sm text-blue-800">{r.role}</span>
                        </div>
                        <span className="text-sm font-medium text-blue-900">{r.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* New Hires This Month */}
            <Card className="bg-purple-50 border border-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-md font-semibold text-purple-700">New Hires This Month</CardTitle>
                <Calendar className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-purple-800">
                  {instructorsLoading ? <Skeleton className="h-8 w-12" /> : newHiresThisMonth}
                </div>
                <p className="text-sm text-purple-700">
                  Joined during {new Date().toLocaleString(undefined, { month: 'long' })}
                </p>
              </CardContent>
            </Card>
          </div>

      {/* Instructor Analytics: Job Level and Contract Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Level Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Job Level Distribution</CardTitle>
            <CardDescription>Current breakdown of non-instructors by job level</CardDescription>
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
                      label={{ value: "No. of non-instructors", angle: -90, position: "insideLeft", style: { textAnchor: "middle" } }}
                    />
                    <Tooltip formatter={(v: any) => [String(v), "Non-Instructors"]} />
                    <Bar dataKey="value" name="Non-Instructors" fill="#8B5CF6" radius={[4, 4, 0, 0]}>
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
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="font-medium">Low Attendance Alert</p>
                    <p className="text-sm text-gray-600">Class 10-A Math has 65% attendance this week</p>
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
                    <p className="text-sm text-gray-600">Physics Chapter 5 is 3 days behind schedule</p>
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
                    <p className="text-sm text-gray-600">You've maintained 95%+ attendance for 30 days!</p>
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
                  <span>Best Non-Instructor (Monthly)</span>
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
                <p className="text-sm text-gray-600">85% to next milestone</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-500" />
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
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <BookOpen className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-xs font-medium">Innovator</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <p className="text-xs font-medium">Growth</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Trophy className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-xs font-medium text-gray-400">Locked</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      
    </div>
  )
}
