import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';
import { getUserSession } from '@/lib/tenant/api-helpers';
import mongoose from 'mongoose';

// Schema for custom payers
const customPayerSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  payerName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, {
  collection: 'custompayers'
});

const CustomPayer = mongoose.models.CustomPayer || mongoose.model('CustomPayer', customPayerSchema);

// GET - Retrieve all custom payers for the tenant
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const session = await getUserSession();
    if (!session?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return await runWithTenantContext(
      { tenantId: session.tenantId },
      async () => {
        const payers = await CustomPayer.find({ tenantId: session.tenantId }).sort({ createdAt: -1 }).lean();
        
        // Return just the names as an array
        const payerNames = payers.map((p: any) => p.payerName);
        
        return NextResponse.json(payerNames, { status: 200 });
      }
    );
  } catch (error: any) {
    console.error('Error fetching custom payers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom payers', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Add a new custom payer
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const session = await getUserSession();
    if (!session?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return await runWithTenantContext(
      { tenantId: session.tenantId },
      async () => {
        const body = await request.json();
        const { payerName } = body;

        if (!payerName || typeof payerName !== 'string' || !payerName.trim()) {
          return NextResponse.json(
            { error: 'Payer name is required' },
            { status: 400 }
          );
        }

        const trimmedName = payerName.trim();

        // Check if payer already exists for this tenant
        const existing = await CustomPayer.findOne({ 
          tenantId: session.tenantId, 
          payerName: { $regex: new RegExp(`^${trimmedName}$`, 'i') } 
        });

        if (existing) {
          return NextResponse.json(
            { message: 'Payer already exists', payerName: existing.payerName },
            { status: 200 }
          );
        }

        // Create new custom payer
        const newPayer = await CustomPayer.create({
          tenantId: session.tenantId,
          payerName: trimmedName
        });

        return NextResponse.json(
          { message: 'Custom payer added', payerName: newPayer.payerName },
          { status: 201 }
        );
      }
    );
  } catch (error: any) {
    console.error('Error adding custom payer:', error);
    return NextResponse.json(
      { error: 'Failed to add custom payer', details: error.message },
      { status: 500 }
    );
  }
}
