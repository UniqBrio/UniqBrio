import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { IncomeDraftModel } from "@/lib/dashboard/models";

// GET /api/incomedrafts/[id] - Get single draft
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect("uniqbrio");
    
    const draft = await IncomeDraftModel.findById(params.id);
    
    if (!draft) {
      return NextResponse.json(
        { error: "Income draft not found" },
        { status: 404 }
      );
    }
    
    const formattedDraft = {
      ...draft.toObject(),
      id: draft._id.toString(),
      _id: undefined,
      lastUpdated: draft.lastUpdated.toISOString().split('T')[0]
    };
    
    return NextResponse.json(formattedDraft);
  } catch (error) {
    console.error("Error fetching income draft:", error);
    return NextResponse.json(
      { error: "Failed to fetch income draft" },
      { status: 500 }
    );
  }
}

// PUT /api/incomedrafts/[id] - Update draft
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect("uniqbrio");
    
    const body = await request.json();
    const { name, category, amount, data } = body;
    
    if (!name || !data) {
      return NextResponse.json(
        { error: "Name and data are required" },
        { status: 400 }
      );
    }
    
    const updatedDraft = await IncomeDraftModel.findByIdAndUpdate(
      params.id,
      {
        name,
        category: category || data.incomeCategory || 'Uncategorized',
        amount: amount || data.amount || '0',
        data,
        lastUpdated: new Date()
      },
      { new: true }
    );
    
    if (!updatedDraft) {
      return NextResponse.json(
        { error: "Income draft not found" },
        { status: 404 }
      );
    }
    
    const formattedDraft = {
      ...updatedDraft.toObject(),
      id: updatedDraft._id.toString(),
      _id: undefined,
      lastUpdated: updatedDraft.lastUpdated.toISOString().split('T')[0]
    };
    
    return NextResponse.json(formattedDraft);
  } catch (error) {
    console.error("Error updating income draft:", error);
    return NextResponse.json(
      { error: "Failed to update income draft" },
      { status: 500 }
    );
  }
}

// DELETE /api/incomedrafts/[id] - Delete draft
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect("uniqbrio");
    
    const deletedDraft = await IncomeDraftModel.findByIdAndDelete(params.id);
    
    if (!deletedDraft) {
      return NextResponse.json(
        { error: "Income draft not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting income draft:", error);
    return NextResponse.json(
      { error: "Failed to delete income draft" },
      { status: 500 }
    );
  }
}