"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"

type SidebarPosition = "left" | "right" 

interface SidebarPositionContextType {
  position: SidebarPosition
  setPosition: (position: SidebarPosition) => void
}

const SidebarPositionContext = createContext<SidebarPositionContextType | undefined>(undefined)

export function SidebarPositionProvider({ children }: { children: React.ReactNode }) {
  // Try to get the saved position from localStorage, default to "left"
  const [position, setPosition] = useState<SidebarPosition>("left")
  const [isClient, setIsClient] = useState(false)

  // Load the saved position from localStorage on component mount
  useEffect(() => {
    setIsClient(true)
    const savedPosition = localStorage.getItem("sidebarPosition") as SidebarPosition | null
    if (savedPosition) {
      setPosition(savedPosition)
    }
  }, [])

  // Save the position to localStorage whenever it changes
  const handleSetPosition = (newPosition: SidebarPosition) => {
    setPosition(newPosition)
    if (typeof window !== 'undefined') {
      localStorage.setItem("sidebarPosition", newPosition)
    }
  }

  return (
    <SidebarPositionContext.Provider value={{ position, setPosition: handleSetPosition }}>
      {children}
    </SidebarPositionContext.Provider>
  )
}

export function useSidebarPosition() {
  const context = useContext(SidebarPositionContext)
  if (context === undefined) {
    throw new Error("useSidebarPosition must be used within a SidebarPositionProvider")
  }
  return context
}
