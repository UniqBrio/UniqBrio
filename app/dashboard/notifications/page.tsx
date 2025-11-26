"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bell, CheckCircle, AlertCircle, Info, Calendar, Settings, Trash2, User, Check, Clock } from "lucide-react"

type Notification = {
  id: string
  title: string
  message: string
  type: string
  timestamp: string
  date?: string
  read: boolean
  metadata?: any
}

export default function DashboardNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/recent-activities?limit=50')
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }
      
      const data = await response.json()
      
      if (data.success && data.activities) {
        setNotifications(data.activities)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((notification) => ({ ...notification, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((notification) => notification.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") return !notification.read
    if (filter === "read") return notification.read
    return true
  })

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffMinutes = Math.floor(diffTime / (1000 * 60))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    } else {
      return (
        date.toLocaleDateString([], { month: "short", day: "numeric" }) +
        ` at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      )
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "payment_received":
        return <Check className="text-green-600" size={20} />
      case "student_added":
        return <User className="text-blue-600" size={20} />
      case "staff_added":
        return <User className="text-purple-600" size={20} />
      case "course_added":
        return <AlertCircle className="text-indigo-600" size={20} />
      case "reminder":
        return <Clock className="text-orange-600" size={20} />
      case "success":
        return <CheckCircle className="text-green-500" size={20} />
      case "warning":
        return <AlertCircle className="text-yellow-500" size={20} />
      case "info":
        return <Info className="text-blue-500" size={20} />
      case "event":
        return <Calendar className="text-purple-500" size={20} />
      default:
        return <Bell className="text-gray-500 dark:text-white" size={20} />
    }
  }

  return (
    <div className="w-full h-full p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Notifications</h1>

        <div className="flex items-center gap-2 sm:gap-4">
          

          <button
            onClick={clearAllNotifications}
            className="flex items-center text-gray-600 dark:text-white hover:text-gray-900"
            disabled={notifications.length === 0}
          >
            <Trash2 size={18} className="mr-1" />
            <span className="text-sm hidden sm:inline">Clear All</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden h-[calc(100vh-200px)]">
        <div className="flex justify-between items-center p-3 sm:p-4 border-b dark:border-gray-700">
          <div className="flex gap-2 sm:gap-4">
            <button
              className={`text-xs sm:text-sm ${filter === "all" ? "text-purple-700 font-medium" : "text-gray-600 dark:text-gray-300"}`}
              onClick={() => setFilter("all")}
            >
              All ({notifications.length})
            </button>
            <button
              className={`text-xs sm:text-sm ${filter === "unread" ? "text-purple-700 font-medium" : "text-gray-600 dark:text-gray-300"}`}
              onClick={() => setFilter("unread")}
            >
              Unread ({notifications.filter((n) => !n.read).length})
            </button>
            <button
              className={`text-xs sm:text-sm ${filter === "read" ? "text-purple-700 font-medium" : "text-gray-600 dark:text-gray-300"}`}
              onClick={() => setFilter("read")}
            >
              Read ({notifications.filter((n) => n.read).length})
            </button>
          </div>

          <button
            className="text-xs sm:text-sm text-purple-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={markAllAsRead}
            disabled={notifications.every((n) => n.read)}
          >
            Mark all as read
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-60px)]">
          {loading ? (
            <div className="p-8 text-center flex items-center justify-center h-full">
              <div>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading notifications...</p>
              </div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center flex items-center justify-center h-full">
              <div>
                <Bell className="mx-auto text-gray-400 dark:text-gray-600 mb-2" size={32} />
                <p className="text-gray-500 dark:text-gray-400">No notifications to display</p>
              </div>
            </div>
          ) : (
            <div className="divide-y dark:divide-gray-700">
              {filteredNotifications.map((notification) => (
                <div key={notification.id} className={`p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!notification.read ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className={`font-medium text-sm sm:text-base ${!notification.read ? "text-black dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(notification.timestamp)}</span>
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                            title="Delete notification"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <p className={`text-xs sm:text-sm mt-1 ${!notification.read ? "text-gray-800 dark:text-gray-200" : "text-gray-600 dark:text-gray-400"}`}>
                        {notification.message}
                      </p>

                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-purple-700 dark:text-purple-400 hover:underline mt-2"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
