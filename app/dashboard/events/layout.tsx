import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Event Management - UniqBrio",
  description: "Create, manage, and track sports academy events with full CRUD functionality",
}

export default function EventLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
