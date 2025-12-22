"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Bell, CheckCircle, AlertCircle, Info, Calendar, Settings, Trash2, RefreshCw } from "lucide-react"

type Notification = {
  _id: string
  id?: string
  title: string
  message: string
  type: "payment_received" | "payment_reminder" | "payment_completed" | "general" | "success" | "warning" | "info" | "event"
  date?: string
  createdAt?: string
  read: boolean
  metadata?: {
    amount?: number
    dueAmount?: number
    courseName?: string
    invoiceUrl?: string
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      setError(null)

      // First get the current user session
      const sessionRes = await fetch('/api/auth/session')
      if (!sessionRes.ok) {
        throw new Error('Not authenticated')
      }
      const sessionData = await sessionRes.json()
      
      if (!sessionData.authenticated || !sessionData.session) {
        throw new Error('Not authenticated')
      }

      const currentUserId = sessionData.session.userId || sessionData.session.id

      if (!currentUserId) {
        throw new Error('User ID not found')
      }

      setUserId(currentUserId)

      // Fetch notifications for this user
      const res = await fetch(`/api/dashboard/notifications?studentId=${currentUserId}`)
      if (!res.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await res.json()
      if (data.success) {
        setNotifications(data.notifications || [])
      } else {
        throw new Error(data.error || 'Failed to load notifications')
      }
    } catch (err: any) {
      console.error('Error fetching notifications:', err)
      setError(err.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications(true)
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markAsRead = async (id: string) => {
    try {
      // Optimistically update UI
      setNotifications(
        notifications.map((notification) => 
          (notification._id === id || notification.id === id) 
            ? { ...notification, read: true } 
            : notification
        ),
      )

      // Persist to database
      const res = await fetch('/api/dashboard/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      })

      if (!res.ok) {
        throw new Error('Failed to mark as read')
      }
    } catch (err) {
      console.error('Error marking notification as read:', err)
      // Revert on error
      fetchNotifications(true)
    }
  }

  const markAllAsRead = async () => {
    if (!userId) return

    try {
      // Optimistically update UI
      setNotifications(notifications.map((notification) => ({ ...notification, read: true })))

      // Persist to database
      const res = await fetch('/api/dashboard/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: userId, markAllAsRead: true }),
      })

      if (!res.ok) {
        throw new Error('Failed to mark all as read')
      }
    } catch (err) {
      console.error('Error marking all as read:', err)
      // Revert on error
      fetchNotifications(true)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      // Optimistically update UI
      setNotifications(notifications.filter((notification) => 
        notification._id !== id && notification.id !== id
      ))

      // Delete from database
      const res = await fetch(`/api/dashboard/notifications?notificationId=${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete notification')
      }
    } catch (err) {
      console.error('Error deleting notification:', err)
      // Revert on error
      fetchNotifications(true)
    }
  }

  const clearAllNotifications = async () => {
    if (!userId) return

    try {
      // Optimistically update UI
      setNotifications([])

      // Mark all as read (soft delete)
      await markAllAsRead()
    } catch (err) {
      console.error('Error clearing notifications:', err)
      fetchNotifications(true)
    }
  }

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") return !notification.read
    if (filter === "read") return notification.read
    return true
  })

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Just now'
    
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
      case "payment_completed":
      case "success":
        return <CheckCircle className="text-green-500 dark:text-green-400" size={20} />
      case "payment_reminder":
      case "warning":
        return <AlertCircle className="text-yellow-500 dark:text-yellow-400" size={20} />
      case "payment_received":
      case "info":
        return <Info className="text-blue-500 dark:text-blue-400" size={20} />
      case "event":
        return <Calendar className="text-purple-500 dark:text-purple-400" size={20} />
      case "general":
      default:
        return <Bell className="text-gray-500 dark:text-gray-400" size={20} />
    }
  }

  const getNotificationId = (notification: Notification) => {
    return notification._id || notification.id || ''
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          {refreshing && (
            <RefreshCw className="animate-spin text-purple-600 dark:text-purple-400" size={18} />
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => fetchNotifications(true)}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
            disabled={refreshing}
            title="Refresh notifications"
          >
            <RefreshCw size={18} className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>

          <Link href="/settings" className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            <Settings size={18} className="mr-1" />
            <span className="text-sm">Settings</span>
          </Link>

          <button
            onClick={clearAllNotifications}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={notifications.length === 0 || loading}
          >
            <Trash2 size={18} className="mr-1" />
            <span className="text-sm">Clear All</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
          <button
            onClick={() => fetchNotifications()}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4">
            <button
              className={`text-sm ${filter === "all" ? "text-purple-700 dark:text-purple-400 font-medium" : "text-gray-600 dark:text-gray-300"}`}
              onClick={() => setFilter("all")}
              disabled={loading}
            >
              All ({notifications.length})
            </button>
            <button
              className={`text-sm ${filter === "unread" ? "text-purple-700 dark:text-purple-400 font-medium" : "text-gray-600 dark:text-gray-300"}`}
              onClick={() => setFilter("unread")}
              disabled={loading}
            >
              Unread ({notifications.filter((n) => !n.read).length})
            </button>
            <button
              className={`text-sm ${filter === "read" ? "text-purple-700 dark:text-purple-400 font-medium" : "text-gray-600 dark:text-gray-300"}`}
              onClick={() => setFilter("read")}
              disabled={loading}
            >
              Read ({notifications.filter((n) => n.read).length})
            </button>
          </div>

          <button
            className="text-sm text-purple-700 dark:text-purple-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={markAllAsRead}
            disabled={notifications.every((n) => n.read) || loading}
          >
            Mark all as read
          </button>
        </div>

        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center">
            <RefreshCw className="mx-auto animate-spin text-purple-600 dark:text-purple-400 mb-2" size={32} />
            <p className="text-gray-500 dark:text-gray-400">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="mx-auto text-gray-400 dark:text-gray-500 mb-2" size={32} />
            <p className="text-gray-500 dark:text-gray-400">No notifications to display</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredNotifications.map((notification) => {
              const notificationId = getNotificationId(notification)
              const notificationDate = notification.createdAt || notification.date
              
              return (
                <div key={notificationId} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!notification.read ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <h3 className={`font-medium ${!notification.read ? "text-black dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(notificationDate)}</span>
                          <button
                            onClick={() => deleteNotification(notificationId)}
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            aria-label={`Delete ${notification.title} notification`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <p className={`text-sm mt-1 ${!notification.read ? "text-gray-800 dark:text-gray-200" : "text-gray-600 dark:text-gray-400"}`}>
                        {notification.message}
                      </p>

                      {notification.metadata?.invoiceUrl && (
                        <a
                          href={notification.metadata.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-600 dark:text-purple-400 hover:underline mt-2 inline-block"
                        >
                          View Invoice
                        </a>
                      )}

                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notificationId)}
                          className="text-xs text-purple-700 dark:text-purple-400 hover:underline mt-2 ml-4"
                          aria-label={`Mark ${notification.title} as read`}
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

