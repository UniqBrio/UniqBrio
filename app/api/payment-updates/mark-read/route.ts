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

    // Restrict writes when on Free plan with >14 students
    try {
      const { getRestrictionStatus, shouldBlockWrite } = await import('@/lib/restrictions');
      // Map academyId back to tenant via registrations (fallback to email-based session is used above for academy)
      // Since this route identifies by academy, we cannot derive tenantId directly; return blocked if plan is free and student count > 14 for any registration with same academy.
      // We attempt to read tenantId via Registration by academyId.
      const RegistrationModel = (await import('@/models/Registration')).default;
      const reg = await RegistrationModel.findOne({ academyId }).lean();
      const tenantId = reg?.tenantId;
      if (tenantId) {
        const status = await getRestrictionStatus(tenantId);
        if (shouldBlockWrite('payments', status.restricted, 'write')) {
          return NextResponse.json(
            {
              success: false,
              code: 'PLAN_RESTRICTION',
              message: 'Payments are read-only on Free plan when you have more than 7 students. Please upgrade to continue.',
              details: { plan: status.plan, studentCount: status.studentCount },
            },
            { status: 403 }
          );
        }
      }
    } catch {}

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
