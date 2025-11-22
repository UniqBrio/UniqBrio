"use client"

import { Button } from "@/components/dashboard/ui/button"
import { BookOpen, Users, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface MainTabsProps {
  current: string
}

export default function MainTabs({ current }: MainTabsProps) {
  const router = useRouter()

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
              className={`flex items-center gap-2 px-4 py-2 ${
                isActive 
                  ? "bg-purple-500 text-white hover:bg-purple-600" 
                  : "border-orange-400 text-orange-600 hover:bg-orange-50"
              }`}
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