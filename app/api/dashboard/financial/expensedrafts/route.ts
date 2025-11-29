import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { ExpenseDraftModel } from "@/lib/dashboard/models";
import { getUserSession } from "@/lib/tenant/api-helpers";
import { runWithTenantContext } from "@/lib/tenant/tenant-context";

// Main route handler for expense drafts (GET all, POST create)
export async function GET(request: NextRequest) {
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
        
        const drafts = await ExpenseDraftModel.find({ tenantId: session.tenantId }).sort({ lastUpdated: -1 });
    
        // Convert MongoDB _id to string id
        const formattedDrafts = drafts.map((draft: any) => ({
          ...draft.toObject(),
          id: draft._id.toString(),
          _id: undefined,
          lastUpdated: draft.lastUpdated.toISOString().split('T')[0] // Format date
        }));
        
        return NextResponse.json(formattedDrafts);
      } catch (error) {
        console.error("Error fetching expense drafts:", error);
        return NextResponse.json(
          { error: "Failed to fetch expense drafts" },
          { status: 500 }
        );
      }
    }
  );
}

export async function POST(request: NextRequest) {
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
        
        const newDraft = {
          name,
          category: category || data.expenseCategory || 'Uncategorized',
          amount: amount || data.amount || '0',
          data,
          lastUpdated: new Date(),
          tenantId: session.tenantId
        };
        
        const result = await ExpenseDraftModel.create(newDraft);
        
        const createdDraft = {
          ...result.toObject(),
          id: result._id.toString(),
          _id: undefined,
          lastUpdated: result.lastUpdated.toISOString().split('T')[0]
        };
        
        return NextResponse.json(createdDraft, { status: 201 });
      } catch (error) {
        console.error("Error creating expense draft:", error);
        return NextResponse.json(
          { error: "Failed to create expense draft" },
          { status: 500 }
        );
      }
    }
  );
}