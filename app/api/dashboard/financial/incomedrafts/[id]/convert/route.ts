import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { IncomeDraftModel } from "@/lib/dashboard/models";
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

// POST /api/incomedrafts/[id]/convert - Convert draft to income record
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
    
    const draft = await IncomeDraftModel.findOne({ _id: params.id, tenantId: session.tenantId });
    
    if (!draft) {
      return NextResponse.json(
        { error: "Income draft not found" },
        { status: 404 }
      );
    }
    
    const draftData = draft.data;
    
    // Delete the draft after retrieving data
    await IncomeDraftModel.findOneAndDelete({ _id: params.id, tenantId: session.tenantId });
    
    return NextResponse.json(draftData);
  } catch (error) {
    console.error("Error converting income draft:", error);
    return NextResponse.json(
      { error: "Failed to convert income draft" },
      { status: 500 }
    );
  }
    }
  );
}