import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { IncomeModel, ExpenseModel, BankAccountModel, PaymentTransactionModel } from "@/lib/dashboard/models";
import { processDropdownValues } from "@/lib/dashboard/dropdown-utils";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function getCollection(model: string) {
  switch (model) {
    case "income":
    case "incomes":
      return IncomeModel;
    case "expense":
    case "expenses":
      return ExpenseModel;
    case "bankaccount":
    case "bankaccounts":
      return BankAccountModel;
    case "paymenttransaction":
    case "paymenttransactions":
      return PaymentTransactionModel;
    default:
      return null;
  }
}

// GET /api?collection=incomes|expenses|bankaccounts&id=optional
export async function GET(req: NextRequest) {
  try {
    await dbConnect("uniqbrio");
    const { searchParams } = new URL(req.url);
    const collection = searchParams.get("collection");
    if (!collection) return badRequest("Missing collection query param");

    const Model = getCollection(collection);
    if (!Model) return badRequest("Invalid collection");

    const id = searchParams.get("id");
    if (id) {
      const doc = await Model.findById(id);
      if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(doc);
    }

    // Optional filters: date range, search, limit
    const q: any = {};
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    if (start || end) {
      q.date = {};
      if (start) (q.date as any).$gte = new Date(start);
      if (end) (q.date as any).$lte = new Date(end);
    }

    const search = searchParams.get("search");
    if (search) {
      q.$or = [
        { description: { $regex: search, $options: "i" } },
        { incomeCategory: { $regex: search, $options: "i" } },
        { expenseCategory: { $regex: search, $options: "i" } },
        { vendorName: { $regex: search, $options: "i" } },
        { receiptNumber: { $regex: search, $options: "i" } },
      ];
    }

    const limit = Number(searchParams.get("limit") || 100);
    const docs = await Model.find(q).sort({ date: -1, createdAt: -1 }).limit(limit);
    return NextResponse.json(docs);
  } catch (err: any) {
    console.error("GET /api error", err);
    return NextResponse.json({ error: "Server error", details: err?.message }, { status: 500 });
  }
}

// POST /api?collection=
export async function POST(req: NextRequest) {
  try {
    await dbConnect("uniqbrio");
    const { searchParams } = new URL(req.url);
    const collection = searchParams.get("collection");
    if (!collection) return badRequest("Missing collection query param");

    const Model = getCollection(collection);
    if (!Model) return badRequest("Invalid collection");

    const body = await req.json();
    
    // Validate required fields
    if (collection === "income" || collection === "incomes") {
      if (!body.date || !body.amount || !body.incomeCategory) {
        return badRequest("Missing required fields: date, amount, incomeCategory");
      }
    } else if (collection === "expense" || collection === "expenses") {
      if (!body.date || !body.amount || !body.expenseCategory) {
        return badRequest("Missing required fields: date, amount, expenseCategory");
      }
    }
    
    // Normalize id/date/amount types
    if (body.date) {
      try {
        body.date = new Date(body.date);
        if (isNaN(body.date.getTime())) {
          return badRequest("Invalid date format");
        }
      } catch (e) {
        return badRequest("Invalid date format");
      }
    }
    
    if (body.amount) {
      const amount = Number(body.amount);
      if (isNaN(amount) || amount <= 0) {
        return badRequest("Invalid amount: must be a positive number greater than 0");
      }
      body.amount = amount;
    }

    const created = await Model.create(body);

    // Auto-add dropdown values to their respective collections
    if (collection === "income" || collection === "incomes") {
      await processDropdownValues(body, 'income');
    } else if (collection === "expense" || collection === "expenses") {
      await processDropdownValues(body, 'expense');
    }

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("POST /api error", err);
    
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
        details: "A record with this data already exists"
      }, { status: 409 });
    }
    
    return NextResponse.json({ error: "Server error", details: err?.message }, { status: 500 });
  }
}

// PUT /api?collection=&id=
export async function PUT(req: NextRequest) {
  try {
    await dbConnect("uniqbrio");
    const { searchParams } = new URL(req.url);
    const collection = searchParams.get("collection");
    const id = searchParams.get("id");
    if (!collection || !id) return badRequest("Missing collection or id");

    const Model = getCollection(collection);
    if (!Model) return badRequest("Invalid collection");

    const body = await req.json();
    
    // Validate date and amount if provided
    if (body.date) {
      try {
        body.date = new Date(body.date);
        if (isNaN(body.date.getTime())) {
          return badRequest("Invalid date format");
        }
      } catch (e) {
        return badRequest("Invalid date format");
      }
    }
    
    if (body.amount !== undefined) {
      const amount = Number(body.amount);
      if (isNaN(amount) || amount <= 0) {
        return badRequest("Invalid amount: must be a positive number greater than 0");
      }
      body.amount = amount;
    }

    const updated = await Model.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Auto-add dropdown values to their respective collections
    if (collection === "income" || collection === "incomes") {
      await processDropdownValues(body, 'income');
    } else if (collection === "expense" || collection === "expenses") {
      await processDropdownValues(body, 'expense');
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PUT /api error", err);
    
    // Handle specific MongoDB errors
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

// DELETE /api?collection=&id=
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect("uniqbrio");
    const { searchParams } = new URL(req.url);
    const collection = searchParams.get("collection");
    const id = searchParams.get("id");
    if (!collection || !id) return badRequest("Missing collection or id");

    const Model = getCollection(collection);
    if (!Model) return badRequest("Invalid collection");

    const deleted = await Model.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api error", err);
    return NextResponse.json({ error: "Server error", details: err?.message }, { status: 500 });
  }
}