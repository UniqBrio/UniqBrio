import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import AdminPaymentRecordModel from "@/models/AdminPaymentRecord";
import InvoiceModel from "@/models/Invoice";
import { verifyToken, getSessionCookie } from "@/lib/auth";
import mongoose from "mongoose";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production');

// Helper function to verify admin authentication
async function verifyAdminAuth(req: NextRequest): Promise<{ authenticated: boolean; email?: string }> {
  try {
    const adminSession = req.cookies.get("admin_session")?.value;
    
    if (!adminSession) {
      return { authenticated: false };
    }

    const { payload } = await jwtVerify(adminSession, JWT_SECRET, {
      issuer: "urn:uniqbrio:admin:issuer",
      audience: "urn:uniqbrio:admin:audience"
    });
    
    return { authenticated: true, email: payload.email as string };
  } catch (error) {
    console.error("[Admin Auth] Verification failed:", error);
    return { authenticated: false };
  }
}

// Helper function to generate invoice number
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Find the last invoice number for this year-month
  const lastInvoice = await InvoiceModel.findOne({
    invoiceNumber: { $regex: `^INV-${year}-${month}` }
  }).sort({ invoiceNumber: -1 }).lean();
  
  let sequenceNumber = 1;
  if (lastInvoice && typeof lastInvoice === 'object' && 'invoiceNumber' in lastInvoice) {
    const lastNumber = (lastInvoice as any).invoiceNumber.split('-').pop();
    sequenceNumber = parseInt(lastNumber || '0', 10) + 1;
  }
  
  return `INV-${year}-${month}${String(sequenceNumber).padStart(4, '0')}`;
}

// Helper function to create invoice from payment record
async function createInvoiceFromPaymentRecord(paymentRecord: any) {
  try {
    console.log("[Invoice Creation] Starting for payment record:", paymentRecord._id);
    console.log("[Invoice Creation] Academy ID:", paymentRecord.academyId);
    console.log("[Invoice Creation] Business Name:", paymentRecord.businessName);
    
    // Check if invoice already exists for this payment record
    const existingInvoice = await InvoiceModel.findOne({ 
      paymentRecordId: paymentRecord._id.toString() 
    });
    
    if (existingInvoice) {
      console.log("[Invoice Creation] Invoice already exists:", existingInvoice.invoiceNumber);
      return existingInvoice;
    }

    const invoiceNumber = await generateInvoiceNumber();
    console.log("[Invoice Creation] Generated invoice number:", invoiceNumber);
    
    // Determine plan type based on date range
    const startDate = new Date(paymentRecord.startDate);
    const endDate = new Date(paymentRecord.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const planType = daysDiff > 31 ? "Yearly" : "Monthly";
    
    console.log("[Invoice Creation] Date range:", { startDate, endDate, daysDiff, planType });
    
    // Create description based on plan
    const description = planType === "Yearly" 
      ? `Annual Subscription - ${paymentRecord.plan} Plan` 
      : `Monthly Subscription - ${paymentRecord.plan} Plan`;
    
    const invoiceData = {
      academyId: paymentRecord.academyId,
      academyName: paymentRecord.businessName,
      userId: paymentRecord.userId,
      ownerAdminName: paymentRecord.ownerAdminName,
      email: paymentRecord.email,
      phone: paymentRecord.phone,
      planType,
      invoiceNumber,
      dateIssued: new Date(),
      amount: paymentRecord.amount,
      status: "Paid" as const,
      paymentMethod: "Bank Transfer" as const,
      description,
      paymentRecordId: paymentRecord._id.toString(),
      startDate: paymentRecord.startDate,
      endDate: paymentRecord.endDate,
      studentSize: paymentRecord.studentSize,
      dueMonth: paymentRecord.dueMonth,
    };
    
    console.log("[Invoice Creation] Creating invoice with data:", JSON.stringify(invoiceData, null, 2));
    
    const invoice = await InvoiceModel.create(invoiceData);
    
    console.log("[Invoice Creation] ✅ Success! Invoice created:", invoice.invoiceNumber);
    console.log("[Invoice Creation] Invoice ID:", invoice._id);
    console.log("[Invoice Creation] Academy ID in invoice:", invoice.academyId);
    return invoice;
  } catch (error: any) {
    console.error("[Invoice Creation] ❌ Error:", error);
    console.error("[Invoice Creation] Error details:", error.message);
    console.error("[Invoice Creation] Error stack:", error.stack);
    throw error;
  }
}

export async function GET(req: NextRequest) {
  try {
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
    await dbConnect();

    const body = await req.json();

    // Validate required fields
    const requiredFields = [
      "businessName",
      "ownerAdminName",
      "email",
      "phone",
      "plan",
      "studentSize",
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
      studentSize: Number(body.studentSize),
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
      message: paymentRecord.status === "paid" 
        ? "Payment record created successfully. It will appear in the academy's billing page." 
        : "Payment record created successfully.",
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
    await dbConnect();

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Payment record ID is required" },
        { status: 400 }
      );
    }

    // Get the original record to check if status changed
    const originalRecord = await AdminPaymentRecordModel.findById(id);
    if (!originalRecord) {
      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 404 }
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

    console.log("[PUT Payment Record] Original status:", originalRecord.status, "New status:", updatedRecord.status);

    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: updatedRecord.status === "paid" 
        ? "Payment record updated successfully. It will appear in the academy's billing page." 
        : "Payment record updated successfully.",
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
    console.log("[DELETE Payment Record] Starting delete operation");
    console.log("[DELETE Payment Record] Connecting to database");
    try {
      await dbConnect();
      console.log("[DELETE Payment Record] Database connected successfully");
    } catch (dbError: any) {
      console.error("[DELETE Payment Record] Database connection failed:", dbError);
      return NextResponse.json(
        { 
          error: "Database connection failed",
          details: dbError.message 
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    console.log("[DELETE Payment Record] Record ID:", id);

    if (!id) {
      console.log("[DELETE Payment Record] No ID provided");
      return NextResponse.json(
        { error: "Payment record ID is required" },
        { status: 400 }
      );
    }

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("[DELETE Payment Record] Invalid ObjectId format:", id);
      return NextResponse.json(
        { error: "Invalid payment record ID format" },
        { status: 400 }
      );
    }

    // Delete payment record
    console.log("[DELETE Payment Record] Deleting payment record");
    const deletedRecord = await AdminPaymentRecordModel.findByIdAndDelete(id);

    if (!deletedRecord) {
      console.log("[DELETE Payment Record] Record not found:", id);
      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 404 }
      );
    }

    console.log("[DELETE Payment Record] Successfully deleted record:", id);
    return NextResponse.json({
      success: true,
      message: "Payment record deleted successfully",
    });
  } catch (error: any) {
    console.error("[DELETE Payment Record] Error:", error);
    console.error("[DELETE Payment Record] Error stack:", error.stack);
    return NextResponse.json(
      { 
        error: "Failed to delete payment record",
        details: error.message || "Unknown error",
        type: error.name
      },
      { status: 500 }
    );
  }
}
