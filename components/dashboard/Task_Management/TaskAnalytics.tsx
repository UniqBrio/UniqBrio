"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  Label,
  LabelList,
} from "recharts"
import { Task } from "./types"
import { TaskSummaryCards } from "./TaskSummaryCards"
import { TaskStats } from "./task-stats"
import { TrendingUp, Calendar, Target, AlertCircle } from "lucide-react"
import { format, parseISO, startOfWeek, endOfWeek, differenceInDays } from "date-fns"

interface TaskAnalyticsProps {
  tasks: Task[]
  stats: TaskStats
}

export function TaskAnalytics({ tasks, stats }: TaskAnalyticsProps) {
  // Priority Distribution
  const priorityData = useMemo(() => {
    const priorities = { high: 0, medium: 0, low: 0 }
    tasks.filter(t => !t.isCompleted).forEach(task => {
      priorities[task.priority]++
    })
    return [
      { name: "High Priority", value: priorities.high, color: "#ef4444" },
      { name: "Medium Priority", value: priorities.medium, color: "#f59e0b" },
      { name: "Low Priority", value: priorities.low, color: "#22c55e" },
    ]
  }, [tasks])

  // Status Distribution (Active tasks only)
  const statusData = useMemo(() => {
    const activeTasks = tasks.filter(t => !t.isCompleted)
    return [
      { name: "Open", value: stats.openCount, color: "#22c55e" },
      { name: "In Progress", value: stats.progCount, color: "#f59e0b" },
      { name: "On Hold", value: stats.holdCount, color: "#ef4444" },
    ].filter(item => item.value > 0)
  }, [tasks, stats])

  // Overdue Tasks Analysis
  const overdueAnalysis = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const activeTasks = tasks.filter(t => !t.isCompleted)
    
    const overdue = activeTasks.filter(t => t.targetDate < today).length
    const dueToday = activeTasks.filter(t => t.targetDate === today).length
    const upcoming = activeTasks.filter(t => t.targetDate > today).length

    return [
      { name: "Overdue", value: overdue, color: "#ef4444" },
      { name: "Due Today", value: dueToday, color: "#f59e0b" },
      { name: "Upcoming", value: upcoming, color: "#22c55e" },
    ]
  }, [tasks])

  // Weekly Task Creation vs Completion
  const weeklyComparison = useMemo(() => {
    const thisWeek = {
      created: tasks.filter(t => {
        const createdDate = parseISO(t.createdOn)
        return createdDate >= startOfWeek(new Date()) && createdDate <= endOfWeek(new Date())
      }).length,
      completed: tasks.filter(t => {
        if (!t.completedAt) return false
        const completedDate = parseISO(t.completedAt)
        return completedDate >= startOfWeek(new Date()) && completedDate <= endOfWeek(new Date())
      }).length,
    }

    return [
      { name: "Tasks Created", value: thisWeek.created, color: "#8b5cf6" },
      { name: "Tasks Completed", value: thisWeek.completed, color: "#22c55e" },
    ]
  }, [tasks])

  const totalActiveTasks = tasks.filter(t => !t.isCompleted).length
  const totalCompletedTasks = tasks.filter(t => t.isCompleted).length
  const completionRate = tasks.length > 0 ? ((totalCompletedTasks / tasks.length) * 100).toFixed(1) : "0"

  return (
    <div className="space-y-6">
      {/* Summary Cards - All in one row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Open Tasks Card */}
        <Card className="bg-emerald-50 border border-emerald-500">
          <CardContent className="pt-6">
            <div className="flex flex-col items-start">
              <div className="flex items-center justify-between w-full mb-2">
                <p className="text-sm text-emerald-700 font-medium">Open Tasks</p>
                <div className="h-3 w-3 rounded-full bg-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-800">{stats.openCount}</p>
              <p className="text-xs text-emerald-700">Summary</p>
            </div>
          </CardContent>
        </Card>

        {/* In Progress Card */}
        <Card className="bg-amber-50 border border-amber-500">
          <CardContent className="pt-6">
            <div className="flex flex-col items-start">
              <div className="flex items-center justify-between w-full mb-2">
                <p className="text-sm text-amber-700 font-medium">In Progress</p>
                <div className="h-3 w-3 rounded-full bg-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-800">{stats.progCount}</p>
              <p className="text-xs text-amber-700">Summary</p>
            </div>
          </CardContent>
        </Card>

        {/* On Hold Card */}
        <Card className="bg-blue-50 border border-blue-500">
          <CardContent className="pt-6">
            <div className="flex flex-col items-start">
              <div className="flex items-center justify-between w-full mb-2">
                <p className="text-sm text-blue-700 font-medium">On hold</p>
              </div>
              <p className="text-2xl font-bold text-blue-800">{stats.holdCount}</p>
              <p className="text-xs text-blue-700">Summary</p>
            </div>
          </CardContent>
        </Card>

        {/* Completed Card */}
        <Card className="bg-violet-50 border border-violet-500">
          <CardContent className="pt-6">
            <div className="flex flex-col items-start">
              <div className="flex items-center justify-between w-full mb-2">
                <p className="text-sm text-violet-700 font-medium">Completed</p>
                <div className="h-3 w-3 rounded-full bg-violet-600" />
              </div>
              <p className="text-2xl font-bold text-violet-800">{stats.completedToday}</p>
              <p className="text-xs text-violet-700">Summary</p>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Card */}
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Overdue</p>
                <p className="text-2xl font-bold text-red-700">{overdueAnalysis[0].value}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Priority Distribution (Active Task)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => (percent && percent > 0) ? `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%` : ''}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value} tasks`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Active Task Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Status', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  allowDecimals={false}
                  label={{ value: 'Tasks', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList dataKey="value" position="top" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Deadline Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-purple-600" />
              Deadline Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={overdueAnalysis}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis type="number" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {overdueAnalysis.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList dataKey="value" position="top" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              This Week's Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  allowDecimals={false}
                  label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {weeklyComparison.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList dataKey="value" position="top" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
