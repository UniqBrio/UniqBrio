import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import AdminPaymentRecordModel from "@/models/AdminPaymentRecord";
import UserModel from "@/models/User";

export async function PATCH(request: Request) {
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

    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json(
        { success: false, message: "Payment ID is required" },
        { status: 400 }
      );
    }

    // Update the payment record's isRead field
    // Make sure it belongs to the current academy
    const updatedPayment = await AdminPaymentRecordModel.findOneAndUpdate(
      {
        _id: paymentId,
        academyId: academyId,
      },
      {
        isRead: true,
      },
      {
        new: true,
      }
    );

    if (!updatedPayment) {
      return NextResponse.json(
        { success: false, message: "Payment record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment marked as read",
      data: updatedPayment,
    });
  } catch (error) {
    console.error("Error marking payment as read:", error);
    return NextResponse.json(
      { success: false, message: "Failed to mark payment as read" },
      { status: 500 }
    );
  }
}
