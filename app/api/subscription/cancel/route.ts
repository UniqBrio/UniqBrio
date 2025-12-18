import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import AdminPaymentRecordModel from "@/models/AdminPaymentRecord";
import UserModel from "@/models/User";
import { getSessionCookie } from "@/lib/auth";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production');

export async function POST(req: NextRequest) {
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
    const user = await UserModel.findOne({ email: userEmail });
    if (!user || !user.academyId) {
      return NextResponse.json(
        { error: "Academy not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { cancellationType, cancellationReason } = body;

    // Validate cancellation type
    if (!cancellationType || !["immediate", "end_of_cycle"].includes(cancellationType)) {
      return NextResponse.json(
        { error: "Invalid cancellation type" },
        { status: 400 }
      );
    }

    // Find active payment record
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const activeRecord = await AdminPaymentRecordModel.findOne({
      academyId: user.academyId,
      status: "paid",
      planStatus: "active",
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { isCancelled: false },
        { isCancelled: { $exists: false } }
      ]
    }).sort({ endDate: -1 });

    if (!activeRecord) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Check if already cancelled
    if (activeRecord.isCancelled) {
      return NextResponse.json(
        { error: "This subscription is already cancelled" },
        { status: 400 }
      );
    }

    // Update cancellation fields
    activeRecord.isCancelled = true;
    activeRecord.cancellationDate = new Date();
    activeRecord.cancellationReason = cancellationReason || "";
    activeRecord.cancellationType = cancellationType;

    // If immediate cancellation, set endDate to today
    if (cancellationType === "immediate") {
      activeRecord.endDate = now;
      activeRecord.planStatus = "expired";
      activeRecord.daysRemaining = 0;
    }

    await activeRecord.save();

    return NextResponse.json({
      success: true,
      message: cancellationType === "immediate" 
        ? "Subscription cancelled immediately. You've been moved to the Free plan." 
        : `Subscription will be cancelled at the end of billing cycle on ${activeRecord.endDate.toLocaleDateString('en-GB')}.`,
      data: activeRecord,
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
