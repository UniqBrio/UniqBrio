import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import UserModel from "@/models/User"
import RegistrationModel from "@/models/Registration"
import { dbConnect } from "@/lib/mongodb"

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
    await dbConnect();
    const user = await UserModel.findOne({ email: decoded.email as string }).lean()

    console.log("[Academy Info API] User found:", !!user, "userId:", user?.userId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get registration data - try multiple search strategies
    let registration = null;
    
    // Strategy 1: Search by userId or academyId if they exist
    if (user.userId || user.academyId) {
      const whereConditions = [];
      if (user.userId) whereConditions.push({ userId: user.userId });
      if (user.academyId) whereConditions.push({ academyId: user.academyId });
      
      registration = await RegistrationModel.findOne({
        $or: whereConditions
      }).lean();
      
      console.log("[Academy Info API] Search by IDs, found:", !!registration)
    }
    
    // Strategy 2: Search by email in adminInfo if no registration found yet
    if (!registration) {
      registration = await RegistrationModel.findOne({
        'adminInfo.email': decoded.email
      }).lean();
      
      console.log("[Academy Info API] Search by email in adminInfo, found:", !!registration)
    }

    console.log("[Academy Info API] Registration found:", !!registration)
    console.log("[Academy Info API] BusinessInfo keys:", registration?.businessInfo ? Object.keys(registration.businessInfo as object) : "none")

    if (!registration) {
      return NextResponse.json({ 
        error: "Registration data not found",
        message: "Please complete your registration first or contact support."
      }, { status: 404 })
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
    await dbConnect();
    const user = await UserModel.findOne({ email: decoded.email as string });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find registration using multiple strategies
    let registration = null;
    
    // Strategy 1: Search by userId or academyId
    if (user.userId || user.academyId) {
      const whereConditions = [];
      if (user.userId) whereConditions.push({ userId: user.userId });
      if (user.academyId) whereConditions.push({ academyId: user.academyId });
      
      registration = await RegistrationModel.findOne({
        $or: whereConditions
      });
    }
    
    // Strategy 2: Search by email in adminInfo
    if (!registration) {
      registration = await RegistrationModel.findOne({
        'adminInfo.email': decoded.email
      });
    }
    
    if (!registration) {
      return NextResponse.json({ 
        error: "Registration not found",
        message: "Please complete your registration first."
      }, { status: 404 })
    }

    // Update registration data
    const updatedRegistration = await RegistrationModel.findOneAndUpdate(
      { _id: registration._id },
      {
        $set: {
          businessInfo: body.businessInfo,
          updatedAt: new Date(),
        }
      },
      { new: true }
    );

    if (!updatedRegistration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      businessInfo: updatedRegistration.businessInfo,
    })
  } catch (error) {
    console.error("Error updating academy info:", error)
    return NextResponse.json({ error: "Failed to update academy info" }, { status: 500 })
  }
}
