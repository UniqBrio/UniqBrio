"use client"
import React from "react"

export function Badge({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="inline-flex items-center px-3 py-1.5 text-sm font-semibold rounded-full" style={{ backgroundColor: `${color ?? "#6b7280"}20`, color: color ?? "#374151" }}>
      {children}
    </span>
  )
}
