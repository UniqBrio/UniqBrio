import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { ExpenseDraftModel } from "@/lib/dashboard/models";

// POST /api/expensedrafts/[id]/convert - Convert draft to expense record
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect("uniqbrio");
    
    const draft = await ExpenseDraftModel.findById(params.id);
    
    if (!draft) {
      return NextResponse.json(
        { error: "Expense draft not found" },
        { status: 404 }
      );
    }
    
    const draftData = draft.data;
    
    // Delete the draft after retrieving data
    await ExpenseDraftModel.findByIdAndDelete(params.id);
    
    return NextResponse.json(draftData);
  } catch (error) {
    console.error("Error converting expense draft:", error);
    return NextResponse.json(
      { error: "Failed to convert expense draft" },
      { status: 500 }
    );
  }
}