import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import AdminPaymentRecordModel from "@/models/AdminPaymentRecord";
import UserModel from "@/models/User";
import { getSessionCookie } from "@/lib/auth";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production');

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Get user from session cookie
    const sessionToken = await getSessionCookie();
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify JWT token
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
    const userEmail = payload.email as string;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's academyId
    const user = await UserModel.findOne({ email: userEmail })
      .select('academyId')
      .lean();
    if (!user || !user.academyId) {
      return NextResponse.json(
        { error: "Academy not found" },
        { status: 404 }
      );
    }

    // Find active paid payment record
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const activeRecord = await AdminPaymentRecordModel.findOne({
      academyId: user.academyId,
      status: "paid",
      planStatus: "active",
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ endDate: -1 }).lean();

    // If active record exists, check for next cycle
    if (activeRecord) {
      const activeEndDate = new Date((activeRecord as any).endDate);
      activeEndDate.setHours(0, 0, 0, 0);
      
      // Check if there's a paid plan starting on or right after the active plan ends
      const nextCycleRecord = await AdminPaymentRecordModel.findOne({
        academyId: user.academyId,
        status: "paid",
        planStatus: "upcoming",
        startDate: { 
          $gte: activeEndDate,
          $lte: new Date(activeEndDate.getTime() + 2 * 24 * 60 * 60 * 1000) // Within 2 days
        },
      }).sort({ startDate: 1 }).lean();

      return NextResponse.json({
        success: true,
        data: activeRecord,
        isUpcoming: false,
        nextCycle: nextCycleRecord || null,
      });
    }

    // If no active record, check for upcoming
    const upcomingRecord = await AdminPaymentRecordModel.findOne({
      academyId: user.academyId,
      status: "paid",
      planStatus: "upcoming",
      startDate: { $gt: now },
    }).sort({ startDate: 1 }).lean();

    if (upcomingRecord) {
      return NextResponse.json({
        success: true,
        data: upcomingRecord,
        isUpcoming: true,
        nextCycle: null,
      });
    }

    // No payment record found - return default free plan
    return NextResponse.json({
      success: true,
      data: {
        _id: 'default-free',
        plan: 'free',
        amount: 0,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 100)), // Far future date
        status: 'paid',
        planStatus: 'active',
        daysRemaining: 36500, // ~100 years
        studentSize: 7,
        isCancelled: false,
        isDefault: true, // Flag to indicate this is a default free plan
      },
      isUpcoming: false,
      nextCycle: null,
    });
  } catch (error) {
    console.error("Error fetching active payment record:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment record" },
      { status: 500 }
    );
  }
}
