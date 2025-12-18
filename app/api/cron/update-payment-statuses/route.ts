import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { updateAllPaymentStatuses } from "@/lib/payment-status-utils";

export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const result = await updateAllPaymentStatuses();
    
    return NextResponse.json({
      success: true,
      message: "Payment statuses updated successfully",
      ...result,
    });
  } catch (error) {
    console.error("Error updating payment statuses:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update payment statuses" },
      { status: 500 }
    );
  }
}
