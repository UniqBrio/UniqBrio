"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { User, NotificationTemplate, CalendarIntegration } from "@/types/dashboard/schedule"

interface AppContextType {
  user: User | null
  setUser: (user: User | null) => void
  theme: "light" | "dark"
  toggleTheme: () => void
  language: string
  setLanguage: (language: string) => void
  notifications: NotificationTemplate[]
  calendarIntegrations: CalendarIntegration[]
  isOffline: boolean
  pinnedMenuItems: string[]
  setPinnedMenuItems: (items: string[]) => void
  customColors: string[]
  setCustomColors: (colors: string[]) => void
  applyCustomColors: (colors: string[]) => void
  resetToDefaultColors: () => void
}

const DEFAULT_COLORS = ["#8b5cf6", "#fd9c2d"] // Purple and Orange

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [language, setLanguage] = useState("en")
  const [isOffline, setIsOffline] = useState(false)
  const [pinnedMenuItems, setPinnedMenuItems] = useState<string[]>([])
  const [customColors, setCustomColors] = useState<string[]>(DEFAULT_COLORS)

  // Helper function to convert hex to HSL
  const hexToHSL = (hex: string): string => {
    // Remove # if present
    hex = hex.replace(/^#/, '')
    
    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16) / 255
    const g = parseInt(hex.substring(2, 4), 16) / 255
    const b = parseInt(hex.substring(4, 6), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }

    h = Math.round(h * 360)
    s = Math.round(s * 100)
    l = Math.round(l * 100)

    return `${h} ${s}% ${l}%`
  }

  // Function to apply custom colors to CSS variables
  const applyCustomColors = (colors: string[]) => {
    if (typeof window === 'undefined') return
    
    const root = document.documentElement
    
    // Apply primary color (first color)
    if (colors[0]) {
      const primaryHSL = hexToHSL(colors[0])
      root.style.setProperty('--primary', primaryHSL)
      root.style.setProperty('--ring', primaryHSL)
    }
    
    // Apply secondary color (second color)
    if (colors[1]) {
      const secondaryHSL = hexToHSL(colors[1])
      root.style.setProperty('--secondary', secondaryHSL)
    }
    
    // Apply additional colors as custom CSS variables
    colors.forEach((color, index) => {
      root.style.setProperty(`--custom-color-${index + 1}`, color)
      root.style.setProperty(`--custom-color-${index + 1}-hsl`, hexToHSL(color))
    })
    
    // Save to localStorage
    localStorage.setItem('uniqbrio-custom-colors', JSON.stringify(colors))
  }

  // Function to reset to default colors
  const resetToDefaultColors = () => {
    setCustomColors(DEFAULT_COLORS)
    applyCustomColors(DEFAULT_COLORS)
  }

  // Load custom colors from localStorage on mount
  useEffect(() => {
    const savedColors = localStorage.getItem('uniqbrio-custom-colors')
    if (savedColors) {
      try {
        const colors = JSON.parse(savedColors)
        setCustomColors(colors)
        applyCustomColors(colors)
      } catch (error) {
        console.error('Error loading custom colors:', error)
        applyCustomColors(DEFAULT_COLORS)
      }
    } else {
      applyCustomColors(DEFAULT_COLORS)
    }
  }, [])

  // Sample notification templates
  const [notifications] = useState<NotificationTemplate[]>([
    {
      id: "reminder",
      name: "Class Reminder",
      type: "reminder",
      channels: ["push", "email"],
      template: "Your class {className} starts in {timeUntil}",
      variables: ["className", "timeUntil"],
    },
    {
      id: "cancellation",
      name: "Class Cancellation",
      type: "cancellation",
      channels: ["push", "sms", "email"],
      template: "Your class {className} on {date} has been cancelled. Reason: {reason}",
      variables: ["className", "date", "reason"],
    },
  ])

  const [calendarIntegrations] = useState<CalendarIntegration[]>([
    { provider: "google", isConnected: false, syncEnabled: false },
    { provider: "outlook", isConnected: false, syncEnabled: false },
    { provider: "apple", isConnected: false, syncEnabled: false },
  ])

  // Initialize user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("uniqbrio-user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    } else {
      // Default user for demo
      const defaultUser: User = {
        id: "user-1",
        name: "John Doe",
        email: "john@example.com",
        role: "admin",
        preferences: {
          theme: "light",
          language: "en",
          notifications: {
            push: true,
            sms: true,
            email: true,
            classReminders: true,
            cancellations: true,
            rescheduling: true,
            assignments: true,
          },
          pinnedMenuItems: ["home", "services-schedule", "payments"],
        },
      }
      setUser(defaultUser)
      localStorage.setItem("uniqbrio-user", JSON.stringify(defaultUser))
    }
  }, [])

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("uniqbrio-theme") as "light" | "dark"
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    }
  }, [])

  // Load language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem("uniqbrio-language")
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }
  }, [])

  // Load pinned menu items
  useEffect(() => {
    if (user?.preferences.pinnedMenuItems) {
      setPinnedMenuItems(user.preferences.pinnedMenuItems)
    }
  }, [user])

  // Check online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("uniqbrio-theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")

    // Update user preferences
    if (user) {
      const updatedUser = {
        ...user,
        preferences: { ...user.preferences, theme: newTheme },
      }
      setUser(updatedUser)
      localStorage.setItem("uniqbrio-user", JSON.stringify(updatedUser))
    }
  }

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        theme,
        toggleTheme,
        language,
        setLanguage,
        notifications,
        calendarIntegrations,
        isOffline,
        pinnedMenuItems,
        setPinnedMenuItems,
        customColors,
        setCustomColors,
        applyCustomColors,
        resetToDefaultColors,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
