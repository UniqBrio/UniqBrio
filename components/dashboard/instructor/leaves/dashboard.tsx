"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/dashboard/ui/tabs"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Label } from "@/components/dashboard/ui/label"

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

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState("attendance")
  const [roiPeriod, setRoiPeriod] = useState("monthly")
  const [forecastPeriod, setForecastPeriod] = useState("month")

  // Stats data
  const stats = [
    { title: "Total Students", value: "450", change: "+5% from last month" },
    { title: "Active Courses", value: "24", change: "Same as last month" },
    { title: "Revenue", value: "$45,670", change: "+12% from last month" },
    { title: "Staff Count", value: "32", change: "+2 from last month" },
  ]

  return (
    <div className="flex flex-col space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <CardTitle>Dashboard</CardTitle>
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
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
            <TabsList className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5 gap-2">
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
              <TabsTrigger value="courseDistribution">Course Distribution</TabsTrigger>
              <TabsTrigger value="monthlyRoi">ROI</TabsTrigger>
              <TabsTrigger value="forecast">Forecast</TabsTrigger>
            </TabsList>
            <TabsContent value="attendance" className="pt-4">
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
            <TabsContent value="enrollment" className="pt-4">
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
            <TabsContent value="courseDistribution" className="pt-4">
              <div className="flex justify-center">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={courseDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
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
            <TabsContent value="monthlyRoi" className="pt-4">
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
            <TabsContent value="forecast" className="pt-4">
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
  )
}

export default Dashboard
