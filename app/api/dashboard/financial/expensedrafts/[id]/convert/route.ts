import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { ExpenseDraftModel } from "@/lib/dashboard/models";
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

// POST /api/expensedrafts/[id]/convert - Convert draft to expense record
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
    
    const draftData = draft.data;
    
    // Delete the draft after retrieving data
    await ExpenseDraftModel.findOneAndDelete({ _id: params.id, tenantId: session.tenantId });
    
    return NextResponse.json(draftData);
  } catch (error) {
    console.error("Error converting expense draft:", error);
    return NextResponse.json(
      { error: "Failed to convert expense draft" },
      { status: 500 }
    );
  }
    }
  );
}