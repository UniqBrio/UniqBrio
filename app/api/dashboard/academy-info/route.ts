import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  console.log("[Academy Info API] GET request received")
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("session")?.value

    console.log("[Academy Info API] Token exists:", !!token)

    if (!token) {
      console.log("[Academy Info API] No token found, returning 401")
      return NextResponse.json({ error: "Unauthorized - No token" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    console.log("[Academy Info API] Decoded email:", decoded?.email)
    
    if (!decoded?.email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: decoded.email as string },
    })

    console.log("[Academy Info API] User found:", !!user, "userId:", user?.userId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get registration data
    const registration = await prisma.registration.findFirst({
      where: { userId: user.userId || "" },
    })

    console.log("[Academy Info API] Registration found:", !!registration)
    console.log("[Academy Info API] BusinessInfo keys:", registration?.businessInfo ? Object.keys(registration.businessInfo as object) : "none")

    if (!registration) {
      return NextResponse.json({ error: "Registration data not found" }, { status: 404 })
    }

    return NextResponse.json({
      businessInfo: registration.businessInfo,
      academyId: registration.academyId,
    })
  } catch (error) {
    console.error("[Academy Info API] Error fetching academy info:", error)
    console.error("[Academy Info API] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch academy info"
    return NextResponse.json({ 
      error: "Failed to fetch academy info", 
      details: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("session")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded?.email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await req.json()

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: decoded.email as string },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update registration data
    const updatedRegistration = await prisma.registration.update({
      where: { userId: user.userId || "" },
      data: {
        businessInfo: body.businessInfo,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      businessInfo: updatedRegistration.businessInfo,
    })
  } catch (error) {
    console.error("Error updating academy info:", error)
    return NextResponse.json({ error: "Failed to update academy info" }, { status: 500 })
  }
}
