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

  // Load the saved position from tenant-specific localStorage on component mount
  useEffect(() => {
    import('@/lib/tenant-storage').then(async ({ getTenantLocalStorage }) => {
      const savedPosition = await getTenantLocalStorage("sidebarPosition") as SidebarPosition | null;
      if (savedPosition) {
        setPosition(savedPosition);
      }
    });
  }, [])

  // Save the position to tenant-specific localStorage whenever it changes
  const handleSetPosition = (newPosition: SidebarPosition) => {
    setPosition(newPosition)
    import('@/lib/tenant-storage').then(({ setTenantLocalStorage }) => {
      setTenantLocalStorage("sidebarPosition", newPosition).catch(console.error);
    });
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
