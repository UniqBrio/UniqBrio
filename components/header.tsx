"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Bell, SettingsIcon, User, ChevronDown, LogOut, Check, Clock, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { createSampleNotifications } from "@/lib/dashboard/notification-utils"

interface HeaderNotification {
  id: string
  title?: string
  message?: string
  type?: string
  timestamp?: string
  read?: boolean
}

interface HeaderProps {
  academyName?: string;
  userName?: string;
  businessLogoUrl?: string;
  profilePictureUrl?: string;
  toggleSidebar?: () => void;
  isMobile?: boolean;
  sidebarCollapsed?: boolean;
  tagline?: string;
  currentLanguage?: string;
  changeLanguage?: (language: string) => void;
  userRole?: "admin" | "super admin";
  changeUserRole?: (role: "admin" | "super admin") => void;
}

export default function Header(props: HeaderProps) {
  const {
    academyName = "",
    userName = "",
    businessLogoUrl = "",
    profilePictureUrl = "",
    tagline = "",
    toggleSidebar,
    isMobile = false,
    sidebarCollapsed = false,
  } = props
  const [notifications, setNotifications] = useState(0)
  const [notificationsList, setNotificationsList] = useState<HeaderNotification[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
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
      const latestNotifications: HeaderNotification[] = (Array.isArray(data?.activities)
        ? data.activities
        : Array.isArray(data?.notifications)
          ? data.notifications
          : Array.isArray(data)
            ? data
            : []) as HeaderNotification[]
      if (latestNotifications.length) {
        setNotificationsList(latestNotifications)
        const unreadFromApi = typeof data?.unreadCount === 'number' ? data.unreadCount : undefined
        const derivedUnread = latestNotifications.filter((item: HeaderNotification) => item && item.read === false).length
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
      setNotificationsList(prev => prev.map(n => ({ ...n, read: true })))
      setNotifications(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const getNotificationIcon = (type?: string) => {
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

  const unreadNotifications = notificationsList.filter((notification) => !notification?.read)
  const hasUnreadNotifications = unreadNotifications.length > 0
  const shouldShowViewAllButton = notificationsList.length > 0

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 h-16 sm:h-18 md:h-20 flex items-center justify-between px-1 sm:px-2 md:px-4 lg:px-6 relative z-30 min-w-0">
      {/* Mobile hamburger menu */}
      {isMobile && toggleSidebar && (
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <div className="space-y-1">
            <div className="w-5 h-0.5 bg-gray-600 dark:bg-gray-300"></div>
            <div className="w-5 h-0.5 bg-gray-600 dark:bg-gray-300"></div>
            <div className="w-5 h-0.5 bg-gray-600 dark:bg-gray-300"></div>
          </div>
        </Button>
      )}
      
      {/* Center section - Academy Logo, Name, Tagline */}
      <div className="flex-1 flex items-center justify-center px-1 sm:px-2 min-w-0">
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4 min-w-0 max-w-full">
          {businessLogoUrl && (
            <div className="relative h-6 w-8 sm:h-8 sm:w-12 md:h-10 md:w-16 lg:h-12 lg:w-20 flex-shrink-0">
              <Image 
                src={businessLogoUrl} 
                alt={`${academyName || "Academy"} Logo`} 
                fill 
                style={{ objectFit: "contain" }} 
                priority 
                className="rounded"
              />
            </div>
          )}
          <div className="flex flex-col justify-center min-w-0 flex-1 max-w-[150px] sm:max-w-[200px] md:max-w-none">
            <span className="text-xs sm:text-sm md:text-lg lg:text-xl font-bold text-purple-700 dark:text-purple-400 leading-tight truncate">
              {academyName || "Academy"}
            </span>
            {tagline && (
              <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-white font-medium hidden md:block truncate">
                {tagline}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right section - Utilities */}
      <div className="flex items-center space-x-0.5 sm:space-x-1 md:space-x-2 flex-shrink-0">
        {/* Notifications Dropdown */}
        <DropdownMenu
          open={notificationsMenuOpen}
          onOpenChange={setNotificationsMenuOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative p-1 sm:p-2"
              aria-label="Notifications"
              data-tour-id="notifications"
              onMouseEnter={handleNotificationHoverStart}
              onMouseLeave={handleNotificationHoverEnd}
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              {notifications > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 px-1 py-0 text-[10px] sm:px-1.5 sm:py-0.5 bg-orange-500 text-white sm:text-xs min-w-[16px] h-4 sm:min-w-[18px] sm:h-5 flex items-center justify-center"
                  aria-label={`${notifications} unread notifications`}
                >
                  {notifications}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-72 sm:w-80 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 shadow-2xl rounded-xl p-0"
            onMouseEnter={handleNotificationHoverStart}
            onMouseLeave={handleNotificationHoverEnd}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {notifications > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700 hover:bg-transparent"
                  onClick={markAllAsRead}
                >
                  Mark all as read
                </Button>
              )}
            </div>
            {loadingNotifications ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              </div>
            ) : hasUnreadNotifications ? (
              <div className="max-h-64 overflow-y-auto pr-1">
                <div className="divide-y">
                  {unreadNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-950' : ''
                      }`}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id)
                        }
                        router.push('/dashboard/notifications')
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-6 text-center">
                <Bell className="h-10 w-10 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No unread notifications</p>
              </div>
            )}
            {shouldShowViewAllButton && (
              <div className="border-t px-4 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  onClick={() => router.push('/dashboard/notifications')}
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
            <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 md:px-3 min-w-0 max-w-[120px] sm:max-w-[150px] md:max-w-none" aria-label="User profile" data-tour-id="profile">
              <span className="flex items-center gap-1 sm:gap-2 min-w-0">
                {profilePictureUrl ? (
                  <Image 
                    src={profilePictureUrl} 
                    alt={userName || "User"} 
                    width={32}
                    height={32}
                    className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <span className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-purple-100 flex-shrink-0">
                    <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-purple-600" />
                  </span>
                )}
                <span className="text-xs sm:text-sm md:text-sm font-medium truncate min-w-0 hidden sm:block">
                  {userName || "User"}
                </span>
              </span>
              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0 hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-md shadow-lg">
            <div className="px-2 pt-2 pb-2 bg-white dark:bg-gray-900">
              <div className="text-sm font-semibold">{userName || "User"}</div>
              <div className="text-xs text-muted-foreground">{academyName || "Academy"}</div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings?tab=profile")}>
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings?tab=academy-info")}>
              <SettingsIcon className="w-4 h-4 mr-2" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 focus:bg-red-50 focus:text-red-600" 
              onClick={() => setLogoutDialogOpen(true)}
            >
              <LogOut className="w-4 h-4 mr-2" />
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
