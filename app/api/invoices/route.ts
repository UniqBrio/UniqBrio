import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import AdminPaymentRecordModel from "@/models/AdminPaymentRecord";

export async function GET(req: NextRequest) {
  try {
    console.log("[Invoices API] GET request received");
    
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const academyId = searchParams.get("academyId");

    console.log("[Invoices API] Requested academy ID:", academyId);

    // Build query: filter by academyId (if provided) and status = "paid"
    const query: any = { status: "paid" };
    if (academyId) {
      query.academyId = academyId;
    }
    console.log("[Invoices API] Query filter:", query);

    // Get all paid payment records (these ARE the invoices)
    const paymentRecords = await AdminPaymentRecordModel.find(query)
      .sort({ createdAt: -1 })
      .lean();

    console.log("[Invoices API] Found", paymentRecords.length, "paid payment records for academy:", academyId);

    // Transform payment records to invoice format (matching admin panel columns)
    const invoices = paymentRecords.map((record: any) => {
      // Determine plan type based on date range
      const startDate = new Date(record.startDate);
      const endDate = new Date(record.endDate);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const planType = daysDiff > 31 ? "Yearly" : "Monthly";
      
      // Generate invoice number format from payment record ID
      const invoiceNumber = `INV-${new Date().getFullYear()}-${record._id.toString().slice(-6)}`;
      
      return {
        _id: record._id,
        id: record._id,
        // Admin panel columns
        businessName: record.businessName,
        ownerAdminName: record.ownerAdminName,
        userId: record.userId,
        academyId: record.academyId,
        email: record.email,
        phone: record.phone,
        plan: record.plan,
        studentSize: record.studentSize,
        startDate: record.startDate,
        endDate: record.endDate,
        status: "Paid",
        amount: record.amount,
        dueMonth: record.dueMonth,
        // Invoice specific fields
        academyName: record.businessName,
        planType,
        invoiceNumber,
        dateIssued: record.createdAt || new Date(),
        paymentMethod: "Bank Transfer",
        description: `${planType} Subscription - ${record.plan} Plan`,
        paymentRecordId: record._id.toString(),
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };
    });

    console.log("[Invoices API] Transformed to", invoices.length, "invoice records");

    return NextResponse.json({
      success: true,
      data: invoices,
    });
  } catch (error: any) {
    console.error("[Invoices API] Error:", error);
    console.error("[Invoices API] Error message:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
