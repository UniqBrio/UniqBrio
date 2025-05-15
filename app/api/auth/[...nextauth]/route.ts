import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "@/lib/db"
import { verifyPassword } from "@/lib/auth"
import { updateLastActivity } from "@/lib/cookies"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: credentials.email }, { phone: credentials.email }],
          },
        })

        if (!user || !user.password) {
          return null
        }

        const isValid = await verifyPassword(credentials.password, user.password)

        if (!isValid) {
          return null
        }

        if (credentials.role && credentials.role !== user.role) {
          return null
        }

        if (!user.verified) {
          throw new Error("not-verified")
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role as "student" | "instructor" | "admin" | "super_admin",
          verified: user.verified,
          name: user.name,
          lastActivity: Date.now(),
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: profile.email },
          })

          if (existingUser) {
            if (!existingUser.googleId && user.id) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { googleId: user.id },
              })
            }
            return true
          } else {
            await prisma.user.create({
              data: {
                email: profile.email,
                name: profile.name || "",
                googleId: user.id,
                role: "student",
                verified: true,
                phone: "",
              },
            })
            return true
          }
        } catch (error) {
          console.error("Error during Google sign-in:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.verified = user.verified
        token.lastActivity = Date.now()
      } else {
        token.lastActivity = Date.now()
      }

      if (account?.provider === "google") {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email || "" },
          })

          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role as "super_admin" | "admin" | "instructor" | "student"
            token.verified = dbUser.verified
            token.name = dbUser.name
          }
        } catch (error) {
          console.error("Error getting user role:", error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role as "super_admin" | "admin" | "instructor" | "student"
        session.user.verified = token.verified
        session.user.lastActivity = token.lastActivity
        session.user.name = token.name
      }
      return session
    },
    // ✅ Removed redirect callback — handled on frontend instead
  },
  events: {
    async signIn({ user }) {
      if (user) {
        updateLastActivity()
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
})

export { handler as GET, handler as POST }
