import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import AdminPaymentRecordModel from "@/models/AdminPaymentRecord";
import { verifyToken, getSessionCookie } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const sessionToken = await getSessionCookie();
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(sessionToken);
    if (!payload?.email || payload.email !== "frozen9612345@gmail.com") {
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 403 });
    }

    await dbConnect();

    // Get all payment records, sorted by creation date (newest first)
    const paymentRecords = await AdminPaymentRecordModel.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: paymentRecords,
    });
  } catch (error) {
    console.error("Error fetching payment records:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment records" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const sessionToken = await getSessionCookie();
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(sessionToken);
    if (!payload?.email || payload.email !== "frozen9612345@gmail.com") {
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 403 });
    }

    await dbConnect();

    const body = await req.json();

    // Validate required fields
    const requiredFields = [
      "businessName",
      "ownerAdminName",
      "email",
      "phone",
      "plan",
      "academyId",
      "userId",
      "startDate",
      "endDate",
      "amount",
      "dueMonth",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create new payment record
    const paymentRecord = await AdminPaymentRecordModel.create({
      businessName: body.businessName,
      ownerAdminName: body.ownerAdminName,
      email: body.email,
      phone: body.phone,
      plan: body.plan,
      academyId: body.academyId,
      userId: body.userId,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      status: body.status || "pending",
      amount: Number(body.amount),
      dueMonth: body.dueMonth,
    });

    return NextResponse.json({
      success: true,
      data: paymentRecord,
      message: "Payment record created successfully",
    });
  } catch (error) {
    console.error("Error creating payment record:", error);
    return NextResponse.json(
      { error: "Failed to create payment record" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Verify admin authentication
    const sessionToken = await getSessionCookie();
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(sessionToken);
    if (!payload?.email || payload.email !== "frozen9612345@gmail.com") {
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 403 });
    }

    await dbConnect();

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Payment record ID is required" },
        { status: 400 }
      );
    }

    // Update payment record
    const updatedRecord = await AdminPaymentRecordModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedRecord) {
      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: "Payment record updated successfully",
    });
  } catch (error) {
    console.error("Error updating payment record:", error);
    return NextResponse.json(
      { error: "Failed to update payment record" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Verify admin authentication
    const sessionToken = await getSessionCookie();
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(sessionToken);
    if (!payload?.email || payload.email !== "frozen9612345@gmail.com") {
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Payment record ID is required" },
        { status: 400 }
      );
    }

    const deletedRecord = await AdminPaymentRecordModel.findByIdAndDelete(id);

    if (!deletedRecord) {
      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting payment record:", error);
    return NextResponse.json(
      { error: "Failed to delete payment record" },
      { status: 500 }
    );
  }
}
