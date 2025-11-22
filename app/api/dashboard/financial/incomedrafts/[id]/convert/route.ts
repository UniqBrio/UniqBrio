import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { IncomeDraftModel } from "@/lib/dashboard/models";

// POST /api/incomedrafts/[id]/convert - Convert draft to income record
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect("uniqbrio");
    
    const draft = await IncomeDraftModel.findById(params.id);
    
    if (!draft) {
      return NextResponse.json(
        { error: "Income draft not found" },
        { status: 404 }
      );
    }
    
    const draftData = draft.data;
    
    // Delete the draft after retrieving data
    await IncomeDraftModel.findByIdAndDelete(params.id);
    
    return NextResponse.json(draftData);
  } catch (error) {
    console.error("Error converting income draft:", error);
    return NextResponse.json(
      { error: "Failed to convert income draft" },
      { status: 500 }
    );
  }
}