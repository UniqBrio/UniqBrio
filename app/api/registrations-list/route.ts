import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import Registration from "@/models/Registration"
import { verifyToken, getSessionCookie } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const sessionToken = await getSessionCookie()
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(sessionToken)
    if (!payload?.email || payload.email !== "frozen9612345@gmail.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

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
