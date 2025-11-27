"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, SettingsIcon, User, ChevronDown, X, LogOut, Check, Clock, AlertCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/dashboard/ui/dropdown-menu"
import { Button } from "@/components/dashboard/ui/button"
import { Badge } from "@/components/dashboard/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter, DialogDescription } from "@/components/dashboard/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import { useCustomColors } from "@/lib/use-custom-colors"
import { createSampleNotifications } from "@/lib/dashboard/notification-utils"

interface HeaderProps {
  
  userRole: "admin" | "super admin"
  changeUserRole: (role: "admin" | "super admin") => void
}

export default function Header({  userRole, changeUserRole }: HeaderProps) {
  const { primaryColor, secondaryColor } = useCustomColors()
  const [notifications, setNotifications] = useState(3)
  const [notificationsList, setNotificationsList] = useState<any[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [notificationsMenuOpen, setNotificationsMenuOpen] = useState(false)
  const notificationHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  const applyFallbackNotifications = () => {
    const fallback = createSampleNotifications()
    setNotificationsList(fallback)
    setNotifications(fallback.filter((item) => item.read === false).length)
  }

  // Fetch notifications when component mounts
  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true)
      
      // Fetch real activities from the API
      const response = await fetch('/api/dashboard/recent-activities?limit=20')
      
      if (!response.ok) {
        throw new Error('Failed to fetch activities')
      }
      
      const data = await response.json()
      const latestNotifications = Array.isArray(data?.activities)
        ? data.activities
        : Array.isArray(data?.notifications)
          ? data.notifications
          : Array.isArray(data)
            ? data
            : []
      if (latestNotifications.length) {
        setNotificationsList(latestNotifications)
        const unreadFromApi = typeof data?.unreadCount === 'number' ? data.unreadCount : undefined
        const derivedUnread = latestNotifications.filter((item: any) => item && item.read === false).length
        setNotifications(unreadFromApi ?? derivedUnread ?? latestNotifications.length)
      } else {
        applyFallbackNotifications()
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      applyFallbackNotifications()
    } finally {
      setLoadingNotifications(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      // await fetch('/api/dashboard/notifications', {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ notificationId }),
      // })
      
      setNotificationsList(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setNotifications(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      // await fetch('/api/dashboard/notifications', {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ studentId: 'xxx', markAllAsRead: true }),
      // })
      
      setNotificationsList(prev => prev.map(n => ({ ...n, read: true })))
      setNotifications(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_received':
        return <Check className="h-4 w-4 text-green-600" />
      case 'student_added':
        return <User className="h-4 w-4 text-blue-600" />
      case 'staff_added':
        return <User className="h-4 w-4 text-purple-600" />
      case 'course_added':
        return <AlertCircle className="h-4 w-4 text-indigo-600" />
      case 'reminder':
        return <Clock className="h-4 w-4 text-orange-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return ""
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const handleLogout = async () => {
    try {
      // Call logout API
      await fetch("/api/auth/logout", { method: "POST" })
      // Redirect to login page
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const clearNotificationHoverTimeout = () => {
    if (notificationHoverTimeoutRef.current) {
      clearTimeout(notificationHoverTimeoutRef.current)
      notificationHoverTimeoutRef.current = null
    }
  }

  const handleNotificationHoverStart = () => {
    clearNotificationHoverTimeout()
    setNotificationsMenuOpen(true)
  }

  const handleNotificationHoverEnd = () => {
    clearNotificationHoverTimeout()
    notificationHoverTimeoutRef.current = setTimeout(() => {
      setNotificationsMenuOpen(false)
    }, 120)
  }

  useEffect(() => {
    return () => clearNotificationHoverTimeout()
  }, [])

  const unreadNotifications = notificationsList.filter((notification) => !notification.read)
  const hasUnreadNotifications = unreadNotifications.length > 0

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 h-20 flex items-center justify-between px-4 md:px-6">
      {/* Center section - Academy Logo, Name, Tagline */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-6">
          <div className="relative h-12 w-20">
            <Image src="/Academy logo.png" alt="UniqBrio Logo" fill style={{ objectFit: "contain" }} priority />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-xl font-bold leading-tight" style={{ color: primaryColor }}>XYZ Academy</span>
            <span className="text-sm text-gray-500 dark:text-white font-medium">Empowering Minds, Shaping Futures</span>
          </div>
        </div>
      </div>

      {/* Right section - Utilities */}
      <div className="flex items-center space-x-2">
        {/* Notifications Dropdown */}
        <DropdownMenu open={notificationsMenuOpen} onOpenChange={setNotificationsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Notifications"
              onMouseEnter={handleNotificationHoverStart}
              onMouseLeave={handleNotificationHoverEnd}
            >
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 px-1.5 py-0.5 text-white text-xs"
                  style={{ backgroundColor: secondaryColor }}
                  aria-label={`${notifications} unread notifications`}
                >
                  {notifications}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className={`bg-white dark:bg-gray-900 shadow-lg border z-50 ${notificationsList.length === 0 ? "w-64" : "w-80"}`}
            style={{
              backgroundColor: "#ffffff",
              opacity: 1,
              backdropFilter: "none",
            }}
            onMouseEnter={handleNotificationHoverStart}
            onMouseLeave={handleNotificationHoverEnd}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {notifications > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700"
                  onClick={markAllAsRead}
                >
                  Mark all as read
                </Button>
              )}
            </div>
            <div className={hasUnreadNotifications ? "max-h-80 overflow-y-auto pr-1" : "h-[150px] flex items-center justify-center"}>
              {loadingNotifications ? (
                <div className="flex items-center justify-center py-8 w-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
                </div>
              ) : !hasUnreadNotifications ? (
                <div className="flex flex-col items-center justify-center py-6 text-center w-full">
                  <Bell className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No unread notifications</p>
                </div>
              ) : (
                <div className="divide-y">
                  {unreadNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                        !notification.read ? "bg-blue-50 dark:bg-blue-900/20" : ""
                      }`}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id)
                        }
                        router.push("/dashboard/notifications")
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {notification.title}
                            </p>
                            {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {notificationsList.length > 0 && (
              <div className="border-t px-4 py-2 bg-white dark:bg-gray-900">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                  onClick={() => router.push("/dashboard/notifications")}
                >
                  View all notifications
                </Button>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                aria-label="Settings"
                onClick={() => router.push("/dashboard/settings")}
              >
                <SettingsIcon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="items-center space-x-2 rounded-full border"
              aria-label="User profile"
              style={{ borderColor: `${primaryColor}33` }}
            >
              
                <Image
                  src="/placeholder-user.png"
                  alt="Profile"
                  width={32}
                  height={32}
                  className="object-cover h-8 w-8"
                  priority
                />

            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings?tab=profile")}>
              <User className="h-4 w-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings?tab=academy-info")}>
              <SettingsIcon className="h-4 w-4 mr-2" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLogoutDialogOpen(true)} className="text-red-600 focus:text-red-600">
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Logout Confirmation Dialog */}
        <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirm Logout</DialogTitle>
              <DialogDescription>
                Are you sure you want to log out? You will need to sign in again to access your account.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  setLogoutDialogOpen(false)
                  handleLogout()
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  )
}
