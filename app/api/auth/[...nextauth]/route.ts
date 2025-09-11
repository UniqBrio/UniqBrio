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

  // Role-based authentication removed. No role check.

        if (!user.verified) {
          throw new Error("not-verified")
        }

        return {
          id: user.id,
          email: user.email,
          verified: user.verified,
          name: user.name,
          role: "super_admin", // Always set to 'super_admin'
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
          let dbUser = await prisma.user.findUnique({ where: { email: profile.email } });
          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: profile.email,
                name: profile.name || "",
                googleId: user.id,
                verified: true,
                phone: "",
              },
            });
          } else if (!dbUser.googleId && user.id) {
            await prisma.user.update({ where: { id: dbUser.id }, data: { googleId: user.id } });
          }

          // Issue custom session cookie compatible with middleware
          const token = await (await import("@/lib/auth")).createToken({ email: dbUser.email }, "7d");
          await (await import("@/lib/auth")).setSessionCookie(token);
          return true;
        } catch (error) {
          console.error("Error during Google sign-in:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = (user as any).id
        token.verified = (user as any).verified
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
            token.verified = dbUser.verified
            token.name = dbUser.name
            token.academyId = dbUser.academyId
            token.userId = dbUser.userId
          }
        } catch (error) {
          console.error("Error getting user:", error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id
        ;(session.user as any).verified = token.verified
        ;(session.user as any).lastActivity = token.lastActivity
        ;(session.user as any).name = token.name
        ;(session.user as any).academyId = token.academyId
        ;(session.user as any).userId = token.userId
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
