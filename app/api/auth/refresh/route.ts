import { type NextRequest, NextResponse } from "next/server"
import { checkTokenRefresh } from "@/lib/session-refresh"
import { getSession } from "@/app/actions/auth-actions"

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Check and refresh token if needed
    const refreshed = await checkTokenRefresh()

    return NextResponse.json({ success: true, refreshed })
  } catch (error) {
    console.error("Token refresh error:", error)
    return NextResponse.json({ success: false, message: "An error occurred during token refresh" }, { status: 500 })
  }
}
