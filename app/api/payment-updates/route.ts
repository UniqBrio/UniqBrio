import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import AdminPaymentRecordModel from "@/models/AdminPaymentRecord";
import UserModel from "@/models/User";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - No token" },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);

    if (!decoded?.email) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get user to retrieve academyId
    const user = await UserModel.findOne({ email: decoded.email as string }).lean();

    if (!user || !user.academyId) {
      return NextResponse.json(
        { success: false, message: "Academy ID not found" },
        { status: 400 }
      );
    }

    const academyId = user.academyId;

    // Fetch paid payment records for this academy, sorted by newest first
    const paymentRecords = await AdminPaymentRecordModel.find({
      academyId: academyId,
      status: "paid",
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      success: true,
      data: paymentRecords,
    });
  } catch (error) {
    console.error("Error fetching payment updates:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch payment updates" },
      { status: 500 }
    );
  }
}
