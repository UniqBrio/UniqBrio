import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { TaskStats } from "./task-stats"
import { cn } from "@/lib/dashboard/utils"

interface TaskSummaryCardsProps {
  stats: TaskStats
}

export function TaskSummaryCards({ stats }: TaskSummaryCardsProps) {
  // Reusable card color themes from your leave-management component
  const cardThemes = [
    // Blue theme for New Tasks
    {
      card: "bg-blue-50 border border-blue-500",
      title: "text-blue-700",
      value: "text-blue-800",
      subtitle: "text-blue-700",
      icon: "text-blue-600",
    },
    // Emerald/Green theme for Open Tasks
    {
      card: "bg-emerald-50 border border-emerald-500",
      title: "text-emerald-700",
      value: "text-emerald-800", 
      subtitle: "text-emerald-700",
      icon: "text-emerald-600",
    },
    // Amber/Yellow theme for In Progress
    {
      card: "bg-amber-50 border border-amber-500",
      title: "text-amber-700",
      value: "text-amber-800",
      subtitle: "text-amber-700", 
      icon: "text-amber-600",
    },
    // Rose/Pink theme for On hold
    {
      card: "bg-rose-50 border border-rose-500",
      title: "text-rose-700",
      value: "text-rose-800",
      subtitle: "text-rose-700",
      icon: "text-rose-600",
    },
    // Violet/Purple theme for Completed Today
    {
      card: "bg-violet-50 border border-violet-500",
      title: "text-violet-700",
      value: "text-violet-800",
      subtitle: "text-violet-700",
      icon: "text-violet-600",
    },
  ] as const

  const summaryData = [
    { title: "Open Tasks", value: stats.openCount, themeIndex: 1 },
    { title: "In Progress", value: stats.progCount, themeIndex: 2 },
    { title: "On hold", value: stats.holdCount, themeIndex: 3 },
    { title: "Completed", value: stats.completedToday, themeIndex: 4 },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {summaryData.map((box, i) => {
        const theme = cardThemes[box.themeIndex]
        return (
          <Card key={i} className={cn("hover:shadow-lg transition-shadow", theme.card)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className={cn("text-sm font-medium", theme.title)}>{box.title}</CardTitle>
              <div className={cn("h-6 w-6 rounded-full flex items-center justify-center", theme.icon)}>
                <div className="h-3 w-3 rounded-full bg-current opacity-60" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", theme.value)}>{box.value}</div>
              <p className={cn("text-xs", theme.subtitle)}>Summary</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}