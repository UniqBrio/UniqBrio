"use client"

import { Button } from "@/components/dashboard/ui/button"
import { BookOpen, Users, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCustomColors } from "@/lib/use-custom-colors"

interface MainTabsProps {
  current: string
}

export default function MainTabs({ current }: MainTabsProps) {
  const router = useRouter()
  const { primaryColor, secondaryColor } = useCustomColors()

  const tabs = [
    { id: "/services/courses", label: "Dashboard", icon: LayoutDashboard, href: "/services/courses" },
    { id: "/courses", label: "Courses", icon: BookOpen, href: "/services/courses" },
    { id: "/cohorts", label: "Cohorts", icon: Users, href: "/services/cohorts" }
  ]

  return (
    <div className="flex gap-2 mb-6">
      {tabs.map((tab) => {
        const isActive = current === tab.id
        const Icon = tab.icon
        
        return (
          <Link key={tab.id} href={tab.href}>
            <Button
              variant={isActive ? "default" : "outline"}
              className="flex items-center gap-2 px-4 py-2 text-white"
              style={isActive 
                ? { backgroundColor: primaryColor }
                : { borderColor: secondaryColor, color: secondaryColor }}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Button>
          </Link>
        )
      })}
    </div>
  )
}