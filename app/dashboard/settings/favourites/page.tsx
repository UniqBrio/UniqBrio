"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Button } from "@/components/dashboard/ui/button"
import { toast } from "@/components/dashboard/ui/use-toast"
import { ToastAction } from "@/components/dashboard/ui/toast"
import { Separator } from "@/components/dashboard/ui/separator"
import {
  Home,
  Briefcase,
  Calendar,
  BookOpen,
  Users,
  UserCog,
  MessageSquare,
  CreditCard,
  TrendingUp,
  CalendarClock,
  Users2,
  Settings,
  HelpCircle,
  DollarSign,
  BarChart3,
  PieChart,
  Save,
  FileText,
  TrendingDown,
  UserCircle,
  GraduationCap,
} from "lucide-react"

interface MenuItem {
  id: string
  name: string
  icon: React.ReactNode
  path: string
  isFavorite: boolean
  parent?: string
}

export default function FavouritesPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: "home", name: "Home Page", icon: <Home className="h-5 w-5" />, path: "/", isFavorite: true },
    {
      id: "services",
      name: "Services",
      icon: <Briefcase className="h-5 w-5" />,
      path: "/services",
      isFavorite: false,
    },
    {
      id: "services-schedule",
      name: "Schedule",
      icon: <Calendar className="h-5 w-5" />,
      path: "/services/schedule",
      isFavorite: false,
      parent: "services",
    },
    {
      id: "services-courses",
      name: "Course Management",
      icon: <BookOpen className="h-5 w-5" />,
      path: "/services/courses",
      isFavorite: false,
      parent: "services",
    },
    {
      id: "user",
      name: "User Management",
      icon: <UserCircle className="h-5 w-5" />,
      path: "/user",
      isFavorite: false,
    },
    {
      id: "user-alumni",
      name: "Alumni Management",
      icon: <GraduationCap className="h-5 w-5" />,
      path: "/user/alumni",
      isFavorite: false,
      parent: "user",
    },
    {
      id: "user-students",
      name: "Students Management",
      icon: <Users className="h-5 w-5" />,
      path: "/user/students",
      isFavorite: true,
      parent: "user",
    },
    {
      id: "user-parents",
      name: "Parent Management",
      icon: <Users className="h-5 w-5" />,
      path: "/user/parents",
      isFavorite: false,
      parent: "user",
    },
    {
      id: "user-staff",
      name: "Staff Management",
      icon: <UserCog className="h-5 w-5" />,
      path: "/user/staff",
      isFavorite: false,
      parent: "user",
    },
    {
      id: "enquiries",
      name: "Enquiries",
      icon: <MessageSquare className="h-5 w-5" />,
      path: "/enquiries",
      isFavorite: false,
    },
    {
      id: "payments",
      name: "Payments",
      icon: <CreditCard className="h-5 w-5" />,
      path: "/payments",
      isFavorite: true,
    },
    {
      id: "financials",
      name: "Financials",
      icon: <DollarSign className="h-5 w-5" />,
      path: "/financials",
      isFavorite: false,
    },
    {
      id: "financials-income",
      name: "Income",
      icon: <BarChart3 className="h-5 w-5" />,
      path: "/financials/income",
      isFavorite: false,
      parent: "financials",
    },
    {
      id: "financials-expenses",
      name: "Expenses",
      icon: <TrendingDown className="h-5 w-5" />,
      path: "/financials/expenses",
      isFavorite: false,
      parent: "financials",
    },
    {
      id: "financials-roi",
      name: "ROI",
      icon: <PieChart className="h-5 w-5" />,
      path: "/financials/roi",
      isFavorite: false,
      parent: "financials",
    },
    {
      id: "financials-balance",
      name: "Balance Sheet",
      icon: <FileText className="h-5 w-5" />,
      path: "/financials/balance-sheet",
      isFavorite: false,
      parent: "financials",
    },
    {
      id: "financials-forecast",
      name: "Forecast",
      icon: <TrendingUp className="h-5 w-5" />,
      path: "/financials/forecast",
      isFavorite: false,
      parent: "financials",
    },
    {
      id: "promotion",
      name: "Promotion",
      icon: <TrendingUp className="h-5 w-5" />,
      path: "/promotion",
      isFavorite: false,
    },
    {
      id: "events",
      name: "Events",
      icon: <CalendarClock className="h-5 w-5" />,
      path: "/events",
      isFavorite: false,
    },
    {
      id: "community",
      name: "Community",
      icon: <Users2 className="h-5 w-5" />,
      path: "/community",
      isFavorite: false,
    },
    {
      id: "settings",
      name: "Settings",
      icon: <Settings className="h-5 w-5" />,
      path: "/settings",
      isFavorite: false,
    },
    {
      id: "help",
      name: "Help",
      icon: <HelpCircle className="h-5 w-5" />,
      path: "/help",
      isFavorite: false,
    },
  ])

  const toggleFavorite = (id: string) => {
    setMenuItems(
      menuItems.map((item) => {
        if (item.id === id) {
          return { ...item, isFavorite: !item.isFavorite }
        }
        return item
      }),
    )
  }

  const saveChanges = () => {
    // In a real application, this would save to a database or local storage
    toast({
      title: "Favourites updated",
      description: "Your favourite menu items have been updated successfully.",
      action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
    })
  }

  const clearAll = () => {
    setMenuItems(
      menuItems.map((item) => ({
        ...item,
        isFavorite: false,
      })),
    )
    toast({
      title: "Favourites cleared",
      description: "All favourite menu items have been cleared.",
      action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
    })
  }

  // Group menu items by parent
  const topLevelItems = menuItems.filter((item) => !item.parent)

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold text-purple-700 mb-6">Favourites Selection</h1>
      <p className="text-gray-500 mb-6">
        Select the menu items you want to appear in your favourites section. These items will be easily accessible from
        the sidebar when you toggle the favourites view.
      </p>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Menu Items</CardTitle>
              <CardDescription>Check the items to add them to your favourites</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearAll}>
                Clear All
              </Button>
              <Button onClick={saveChanges}>Save Changes</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {topLevelItems.map((item) => (
              <div key={item.id} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id={item.id} checked={item.isFavorite} onCheckedChange={() => toggleFavorite(item.id)} />
                  <label
                    htmlFor={item.id}
                    className="flex items-center text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    <span className="mr-2 text-gray-500">{item.icon}</span>
                    {item.name}
                  </label>
                </div>

                {/* Child items */}
                <div className="pl-6 space-y-3">
                  {menuItems
                    .filter((child) => child.parent === item.id)
                    .map((child) => (
                      <div key={child.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={child.id}
                          checked={child.isFavorite}
                          onCheckedChange={() => toggleFavorite(child.id)}
                        />
                        <label
                          htmlFor={child.id}
                          className="flex items-center text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          <span className="mr-2 text-gray-500">{child.icon}</span>
                          {child.name}
                        </label>
                      </div>
                    ))}
                </div>

                <Separator className="my-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
