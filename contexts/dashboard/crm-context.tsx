"use client"

import { createContext, useContext } from "react"

type CRMSection = "dashboard" | "leads" | "enquiries" | "sessions" | "trials" | "funnel" | "analytics" | "settings"

interface CRMContextType {
  activeSection: CRMSection
  setActiveSection: (section: CRMSection) => void
}

export const CRMContext = createContext<CRMContextType>({
  activeSection: "dashboard",
  setActiveSection: () => {},
})

export const useCRM = () => useContext(CRMContext)
