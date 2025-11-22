import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { PaymentTransactionModel, IncomeModel } from "@/lib/dashboard/models";
import { processDropdownValues } from "@/lib/dashboard/dropdown-utils";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Helper function to create an income record from a payment transaction
 */
async function createIncomeFromPayment(paymentData: any) {
  // Map payment transaction fields to income fields
  const incomeData = {
    date: paymentData.paymentDate,
    amount: paymentData.amount,
    description: paymentData.courseName 
      ? `${paymentData.courseId || ''} - ${paymentData.courseName}`.trim() 
      : paymentData.notes || 'Course Payment',
    incomeCategory: "Course Fees",
    sourceType: "Students",
    paymentMode: paymentData.mode || "Cash",
    status: "Completed",
    addToAccount: "", // Can be set based on business logic
    receivedBy: paymentData.receivedBy || "",
    receivedFrom: paymentData.studentName 
      ? `${paymentData.studentId || ''} - ${paymentData.studentName}`.trim()
      : paymentData.payerName || "",
    receiptNumber: "", // Leave empty when creating from payment transactions
  };

  // Create the income record
  const createdIncome = await IncomeModel.create(incomeData);
  
  // Auto-add dropdown values to their respective collections
  await processDropdownValues(incomeData, 'income');
  
  return createdIncome;
}

// GET /api/payments - Get all payment transactions
export async function GET(req: NextRequest) {
  try {
    await dbConnect("uniqbrio");
    const { searchParams } = new URL(req.url);
    
    const id = searchParams.get("id");
    if (id) {
      const doc = await PaymentTransactionModel.findById(id);
      if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(doc);
    }

    // Optional filters
    const q: any = {};
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    if (start || end) {
      q.paymentDate = {};
      if (start) q.paymentDate.$gte = new Date(start);
      if (end) q.paymentDate.$lte = new Date(end);
    }

    const search = searchParams.get("search");
    if (search) {
      q.$or = [
        { studentName: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
        { courseName: { $regex: search, $options: "i" } },
        { courseId: { $regex: search, $options: "i" } },
        { receivedBy: { $regex: search, $options: "i" } },
      ];
    }

    const limit = Number(searchParams.get("limit") || 100);
    const docs = await PaymentTransactionModel.find(q)
      .sort({ paymentDate: -1, createdAt: -1 })
      .limit(limit);
    return NextResponse.json(docs);
  } catch (err: any) {
    console.error("GET /api/payments error", err);
    return NextResponse.json({ error: "Server error", details: err?.message }, { status: 500 });
  }
}

// POST /api/payments - Create payment transaction and corresponding income record
export async function POST(req: NextRequest) {
  try {
    await dbConnect("uniqbrio");
    const body = await req.json();
    
    // Validate required fields
    if (!body.paymentDate || !body.amount) {
      return badRequest("Missing required fields: paymentDate, amount");
    }
    
    // Normalize date
    if (body.paymentDate) {
      try {
        body.paymentDate = new Date(body.paymentDate);
        if (isNaN(body.paymentDate.getTime())) {
          return badRequest("Invalid paymentDate format");
        }
      } catch (e) {
        return badRequest("Invalid paymentDate format");
      }
    }
    
    // Validate amount
    if (body.amount) {
      const amount = Number(body.amount);
      if (isNaN(amount) || amount <= 0) {
        return badRequest("Invalid amount: must be a positive number greater than 0");
      }
      body.amount = amount;
    }

    // Create payment transaction
    const paymentTransaction = await PaymentTransactionModel.create(body);
    
    // Create corresponding income record
    let incomeRecord = null;
    try {
      incomeRecord = await createIncomeFromPayment(body);
      console.log("Income record created:", incomeRecord._id);
    } catch (incomeErr: any) {
      console.error("Failed to create income record:", incomeErr);
      // Note: Payment is still created even if income creation fails
      // You may want to implement compensation logic here
    }

    return NextResponse.json({
      payment: paymentTransaction,
      income: incomeRecord,
      message: incomeRecord 
        ? "Payment and income record created successfully" 
        : "Payment created but income record creation failed"
    }, { status: 201 });
    
  } catch (err: any) {
    console.error("POST /api/payments error", err);
    
    // Handle specific MongoDB errors
    if (err.name === 'ValidationError') {
      return NextResponse.json({ 
        error: "Validation error", 
        details: Object.keys(err.errors).map(key => `${key}: ${err.errors[key].message}`).join(', ')
      }, { status: 400 });
    }
    
    if (err.code === 11000) {
      return NextResponse.json({ 
        error: "Duplicate entry", 
        details: "A payment with this data already exists"
      }, { status: 409 });
    }
    
    return NextResponse.json({ error: "Server error", details: err?.message }, { status: 500 });
  }
}

// PUT /api/payments?id= - Update payment transaction
export async function PUT(req: NextRequest) {
  try {
    await dbConnect("uniqbrio");
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return badRequest("Missing id");

    const body = await req.json();
    
    // Validate date if provided
    if (body.paymentDate) {
      try {
        body.paymentDate = new Date(body.paymentDate);
        if (isNaN(body.paymentDate.getTime())) {
          return badRequest("Invalid paymentDate format");
        }
      } catch (e) {
        return badRequest("Invalid paymentDate format");
      }
    }
    
    // Validate amount if provided
    if (body.amount !== undefined) {
      const amount = Number(body.amount);
      if (isNaN(amount) || amount <= 0) {
        return badRequest("Invalid amount: must be a positive number greater than 0");
      }
      body.amount = amount;
    }

    const updated = await PaymentTransactionModel.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PUT /api/payments error", err);
    
    if (err.name === 'ValidationError') {
      return NextResponse.json({ 
        error: "Validation error", 
        details: Object.keys(err.errors).map(key => `${key}: ${err.errors[key].message}`).join(', ')
      }, { status: 400 });
    }
    
    if (err.name === 'CastError') {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Server error", details: err?.message }, { status: 500 });
  }
}

// DELETE /api/payments?id= - Delete payment transaction
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect("uniqbrio");
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return badRequest("Missing id");

    const deleted = await PaymentTransactionModel.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/payments error", err);
    return NextResponse.json({ error: "Server error", details: err?.message }, { status: 500 });
  }
}
