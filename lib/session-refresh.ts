import { getSession } from "@/app/actions/auth-actions"
import { isSessionActive, updateLastActivity } from "./cookies"
import { createToken, setSessionCookie } from "./auth"

// Token refresh threshold (5 minutes before expiration)
const REFRESH_THRESHOLD = 5 * 60 * 1000

// Check if token needs refresh
export async function checkTokenRefresh() {
  try {
    const session = await getSession()

    if (!session) return false

    // If session is active, check if token needs refresh
    if (isSessionActive()) {
      // Get token expiry from session (JWT typically includes exp claim)
      const tokenExp = (session as any).exp

      if (tokenExp) {
        const expiryTime = tokenExp * 1000 // Convert to milliseconds
        const currentTime = Date.now()

        // If token is about to expire, refresh it
        if (expiryTime - currentTime < REFRESH_THRESHOLD) {
          await refreshToken(session)
          return true
        }
      }

      // Update last activity timestamp
      updateLastActivity()
    }

    return false
  } catch (error) {
    console.error("Error checking token refresh:", error)
    return false
  }
}

// Refresh the token
async function refreshToken(session: any) {
  try {
    // Create a new token with updated expiry
    const newToken = await createToken({
      id: session?.id,
      email: session?.email,
      role: session?.role,
      verified: session?.verified,
      name: session?.name,
      lastActivity: Date.now(),
    })

    // Set the new token in cookies
    await setSessionCookie(newToken)

    // Update last activity
    updateLastActivity()

    return true
  } catch (error) {
    console.error("Error refreshing token:", error)
    return false
  }
}
