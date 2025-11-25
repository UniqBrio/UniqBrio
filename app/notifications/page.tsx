"use client"

import { useState } from "react"
import Link from "next/link"
import { Bell, CheckCircle, AlertCircle, Info, Calendar, Settings, Trash2 } from "lucide-react"

type Notification = {
  id: string
  title: string
  message: string
  type: "success" | "warning" | "info" | "event"
  date: string
  read: boolean
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Password Updated",
      message: "Your password has been successfully updated.",
      type: "success",
      date: "2025-03-27T10:30:00",
      read: false,
    },
    {
      id: "2",
      title: "Login Attempt",
      message: "We detected a login attempt from a new device. Was this you?",
      type: "warning",
      date: "2025-03-26T15:45:00",
      read: false,
    },
    {
      id: "3",
      title: "Profile Completion",
      message: "Complete your profile to unlock all features.",
      type: "info",
      date: "2025-03-25T09:15:00",
      read: true,
    },
    {
      id: "4",
      title: "Upcoming Class",
      message: "Reminder: You have a Yoga class scheduled for tomorrow at 10:00 AM.",
      type: "event",
      date: "2025-03-24T18:00:00",
      read: true,
    },
    {
      id: "5",
      title: "Account Verification",
      message: "Your account has been successfully verified.",
      type: "success",
      date: "2025-03-23T11:20:00",
      read: true,
    },
  ])

  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>

        <div className="flex items-center gap-4">
          <Link href="/settings" className="flex items-center text-gray-600 dark:text-white hover:text-gray-900 dark:text-white">
            <Settings size={18} className="mr-1" />
            <span className="text-sm">Settings</span>
          </Link>

          <button
            onClick={clearAllNotifications}
            className="flex items-center text-gray-600 dark:text-white hover:text-gray-900 dark:text-white"
            disabled={notifications.length === 0}
          >
            <Trash2 size={18} className="mr-1" />
            <span className="text-sm">Clear All</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex gap-4">
            <button
              className={`text-sm ${filter === "all" ? "text-purple-700 font-medium" : "text-gray-600 dark:text-white"}`}
              onClick={() => setFilter("all")}
            >
              All ({notifications.length})
            </button>
            <button
              className={`text-sm ${filter === "unread" ? "text-purple-700 font-medium" : "text-gray-600 dark:text-white"}`}
              onClick={() => setFilter("unread")}
            >
              Unread ({notifications.filter((n) => !n.read).length})
            </button>
            <button
              className={`text-sm ${filter === "read" ? "text-purple-700 font-medium" : "text-gray-600 dark:text-white"}`}
              onClick={() => setFilter("read")}
            >
              Read ({notifications.filter((n) => n.read).length})
            </button>
          </div>

          <button
            className="text-sm text-purple-700 hover:underline"
            onClick={markAllAsRead}
            disabled={notifications.every((n) => n.read)}
          >
            Mark all as read
          </button>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="mx-auto text-gray-400 dark:text-white mb-2" size={32} />
            <p className="text-gray-500 dark:text-white">No notifications to display</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredNotifications.map((notification) => (
              <div key={notification.id} className={`p-4 hover:bg-gray-50 ${!notification.read ? "bg-blue-50" : ""}`}>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <h3 className={`font-medium ${!notification.read ? "text-black" : "text-gray-700 dark:text-white"}`}>
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-white">{formatDate(notification.date)}</span>
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-gray-400 dark:text-white hover:text-gray-600 dark:text-white"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <p className={`text-sm mt-1 ${!notification.read ? "text-gray-800" : "text-gray-600 dark:text-white"}`}>
                      {notification.message}
                    </p>

                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs text-purple-700 hover:underline mt-2"
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
  )
}

