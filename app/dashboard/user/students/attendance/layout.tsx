import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Attendance Management - UniqBrio",
  description: "Track, manage, and analyze attendance for all students and classes",
}

export default function AttendanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
