import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's id */
      id: string
      /** The user's role */
      role: "student" | "instructor" | "admin" | "super_admin"
      /** Whether the user's email is verified */
      verified: boolean
      /** Timestamp of the last activity */
      lastActivity?: number
    } & DefaultSession["user"]
  }
interface User {
    id: string;
    email: string;
    name: string;
    role: "student" | "instructor" | "admin" | "super_admin";
    verified: boolean;
    lastActivity: number;
    userType?: string; // If you really store this separately
  }
}

// For JWT session
declare module "next-auth/jwt" {
  interface JWT {
    /** The user's id */
    id: string
    /** The user's role */
    role: "student" | "instructor" | "admin" | "super_admin"
    /** Whether the user's email is verified */
    verified: boolean
    /** Timestamp of the last activity */
    lastActivity?: number
  }
}
