// components/session-provider.tsx
"use client"

import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import { ReactNode } from "react"

interface NextAuthSessionProviderProps {
  children: ReactNode
  session?: Session | null
}

export default function NextAuthSessionProvider({ children, session }: NextAuthSessionProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}
