import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import Registration from "@/models/Registration"
import { verifyToken, getSessionCookie } from "@/lib/auth"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production');

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    // Fetch all registrations with userId and academyId
    const registrations = await Registration.find({
      userId: { $exists: true, $ne: null },
      academyId: { $exists: true, $ne: null },
    })
      .select("userId academyId businessInfo adminInfo")
      .lean()

    console.log("Total registrations found:", registrations.length)

    // Transform data for dropdown - removed filter to show all records
    const formattedRegistrations = registrations.map((reg: any) => {
      const formatted = {
        userId: reg.userId,
        academyId: reg.academyId,
        businessName: reg.businessInfo?.businessName || reg.businessInfo?.legalEntityName || "N/A",
        ownerName: reg.businessInfo?.legalEntityName || reg.adminInfo?.fullName || "N/A",
        email: reg.adminInfo?.email || reg.businessInfo?.businessEmail || "",
        phone: reg.adminInfo?.phone || reg.businessInfo?.phoneNumber || "",
      }
      console.log("Formatted registration:", formatted)
      return formatted
    })

    console.log("Fetched registrations:", formattedRegistrations.length)

    return NextResponse.json({ registrations: formattedRegistrations }, { status: 200 })
  } catch (error) {
    console.error("Error fetching registrations:", error)
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    )
  }
}
