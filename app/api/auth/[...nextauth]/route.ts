import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import UserModel from "@/models/User"
import { dbConnect } from "@/lib/mongodb"
import { verifyPassword } from "@/lib/auth"
import { updateLastActivity } from "@/lib/cookies"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
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

        await dbConnect();
        const user = await UserModel.findOne({
          $or: [{ email: credentials.email }, { phone: credentials.email }],
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
    error: "/login", // OAuth errors will redirect here with error parameter
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        try {
          console.log("[NextAuth] Google sign-in attempt for:", profile.email);
          await dbConnect();
          console.log("[NextAuth] Database connected");
          
          let dbUser = await UserModel.findOne({ email: profile.email });
          console.log("[NextAuth] User found:", !!dbUser);
          
          if (!dbUser) {
            // Create new user for Google sign-in with super_admin role
            // userId, academyId, and tenantId will be set during registration
            console.log("[NextAuth] Creating new user with super_admin role");
            dbUser = await UserModel.create({
              email: profile.email,
              name: profile.name || "",
              googleId: user.id,
              verified: true, // Google users are pre-verified
              phone: "", // Will be filled during registration
              role: "super_admin",
              registrationComplete: false, // User must complete registration to get IDs
              failedAttempts: 0,
              kycStatus: "pending",
              lockedUntil: null,
              image: (profile as any).picture || "", // Store Google profile picture
            });
            console.log("[NextAuth] User created successfully with schema:", {
              email: dbUser.email,
              name: dbUser.name,
              googleId: dbUser.googleId,
              verified: dbUser.verified,
              role: dbUser.role,
              kycStatus: dbUser.kycStatus,
              failedAttempts: dbUser.failedAttempts
            });
          } else {
            // User exists - check if they signed up with password (credentials)
            if (dbUser.password && !dbUser.googleId) {
              // User exists with password-based signup, don't allow Google signup
              console.log("[NextAuth] User exists with password, blocking Google signup");
              throw new Error("AccountExistsWithCredentials");
            } else if (!dbUser.googleId) {
              // Link Google ID to existing user (user exists but has no password or googleId)
              console.log("[NextAuth] Linking Google ID to existing user");
              dbUser.googleId = user.id;
              await dbUser.save();
              console.log("[NextAuth] Google ID linked successfully");
            } else {
              // User already has Google ID, just continue
              console.log("[NextAuth] User already linked to Google");
            }
          }
          
          // Store the email in token for the redirect callback to use
          (user as any).dbEmail = dbUser.email;
          (user as any).dbId = dbUser.id;

          console.log("[NextAuth] Sign-in successful for:", profile.email);
          return true;
        } catch (error) {
          console.error("[NextAuth] Error during Google sign-in:", error);
          console.error("[NextAuth] Error details:", error instanceof Error ? error.message : String(error));
          console.error("[NextAuth] Error stack:", error instanceof Error ? error.stack : "No stack trace");
          
          // If it's our custom AccountExistsWithCredentials error, return "/login?error=AccountExistsWithCredentials"
          if (error instanceof Error && error.message === "AccountExistsWithCredentials") {
            console.log("[NextAuth] Redirecting to login with AccountExistsWithCredentials error");
            // NextAuth will handle this and add error parameter to redirect URL
          }
          
          // Return false to trigger error page redirect with AccessDenied
          return false;
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Handle OAuth callback redirects
      console.log("[NextAuth] Redirect callback - url:", url, "baseUrl:", baseUrl);
      
      // If there's an error in the URL, redirect to login with error
      if (url.includes("error=")) {
        const errorMatch = url.match(/error=([^&]+)/);
        if (errorMatch) {
          console.log("[NextAuth] Error detected in URL, redirecting to login with error:", errorMatch[1]);
          return `${baseUrl}/login?error=${errorMatch[1]}`;
        }
      }
      
      // Check if the URL contains signin or signup (where Google auth was initiated)
      // These indicate a Google OAuth flow that needs our custom handler
      if (url.includes("/signup") || url.includes("/signin") || url.includes("/login")) {
        console.log("[NextAuth] OAuth flow from signup/login detected, redirecting to google-redirect handler");
        return `${baseUrl}/api/auth/google-redirect`;
      }
      
      // If URL is relative, prepend baseUrl
      if (url.startsWith("/")) {
        console.log("[NextAuth] Relative URL, returning as-is:", url);
        return `${baseUrl}${url}`;
      }
      
      // If same origin, allow it
      if (new URL(url).origin === baseUrl) {
        console.log("[NextAuth] Same origin, allowing:", url);
        return url;
      }
      
      // Default to baseUrl
      console.log("[NextAuth] Default, returning baseUrl");
      return baseUrl;
    },
    async jwt({ token, user, account }) {
      if (user) {
        console.log("[NextAuth JWT] User object received:", { id: user.id, email: user.email });
        token.id = (user as any).dbId || (user as any).id;
        token.email = (user as any).dbEmail || (user as any).email;
        token.verified = (user as any).verified;
        token.lastActivity = Date.now();
      } else {
        token.lastActivity = Date.now();
      }

      if (account?.provider === "google") {
        try {
          console.log("[NextAuth JWT] Google provider, fetching user from DB");
          await dbConnect();
          const dbUser = await UserModel.findOne({
            email: token.email || "",
          })

          if (dbUser) {
            console.log("[NextAuth JWT] DB user found, updating token");
            token.id = dbUser.id
            token.verified = dbUser.verified
            token.name = dbUser.name
            token.academyId = dbUser.academyId
            token.userId = dbUser.userId
            token.registrationComplete = dbUser.registrationComplete
            token.email = dbUser.email // Ensure email is in token
          } else {
            console.log("[NextAuth JWT] DB user not found for email:", token.email);
          }
        } catch (error) {
          console.error("[NextAuth JWT] Error getting user:", error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id
        ;(session.user as any).email = token.email // Ensure email is in session
        ;(session.user as any).verified = token.verified
        ;(session.user as any).lastActivity = token.lastActivity
        ;(session.user as any).name = token.name
        ;(session.user as any).academyId = token.academyId
        ;(session.user as any).userId = token.userId
        ;(session.user as any).registrationComplete = token.registrationComplete
      }
      return session
    },
  },
  events: {
    async signIn({ user }) {
      if (user) {
        updateLastActivity()
      }
    },
  },
  debug: true, // Enable debug mode to see detailed errors
})

export { handler as GET, handler as POST }
