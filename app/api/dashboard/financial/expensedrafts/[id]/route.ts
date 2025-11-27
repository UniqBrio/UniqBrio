import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { ExpenseDraftModel } from "@/lib/dashboard/models";
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

// GET /api/expensedrafts/[id] - Get single draft
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    );
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
  try {
    await dbConnect("uniqbrio");
    
    const draft = await ExpenseDraftModel.findOne({ _id: params.id, tenantId: session.tenantId });
    
    if (!draft) {
      return NextResponse.json(
        { error: "Expense draft not found" },
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
    console.error("Error fetching expense draft:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense draft" },
      { status: 500 }
    );
  }
    }
  );
}

// PUT /api/expensedrafts/[id] - Update draft
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    );
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
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
    
    const updatedDraft = await ExpenseDraftModel.findOneAndUpdate(
      { _id: params.id, tenantId: session.tenantId },
      {
        name,
        category: category || data.expenseCategory || 'Uncategorized',
        amount: amount || data.amount || '0',
        data,
        lastUpdated: new Date()
      },
      { new: true }
    );
    
    if (!updatedDraft) {
      return NextResponse.json(
        { error: "Expense draft not found" },
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
    console.error("Error updating expense draft:", error);
    return NextResponse.json(
      { error: "Failed to update expense draft" },
      { status: 500 }
    );
  }
    }
  );
}

// DELETE /api/expensedrafts/[id] - Delete draft
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    );
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
  try {
    await dbConnect("uniqbrio");
    
    const deletedDraft = await ExpenseDraftModel.findOneAndDelete({ _id: params.id, tenantId: session.tenantId });
    
    if (!deletedDraft) {
      return NextResponse.json(
        { error: "Expense draft not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense draft:", error);
    return NextResponse.json(
      { error: "Failed to delete expense draft" },
      { status: 500 }
    );
  }
    }
  );
}