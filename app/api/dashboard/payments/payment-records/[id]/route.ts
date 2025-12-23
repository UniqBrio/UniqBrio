import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import {
  getPaymentRecordById,
  updatePaymentRecord,
  deletePaymentRecord,
  verifyPaymentRecord,
} from '@/lib/dashboard/payments/payment-record-service';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

/**
 * GET /api/payments/payment-records/[id]
 * Get a specific payment record by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const record = await getPaymentRecordById(id, session.tenantId);

    if (!record) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment record not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error: any) {
    console.error('Error fetching payment record:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch payment record',
      },
      { status: 500 }
    );
  }
  });
}

/**
 * PATCH /api/payments/payment-records/[id]
 * Update a payment record
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const restriction = await import('@/lib/restrictions');
    const block = await restriction.assertWriteAllowed(session.tenantId!, 'payments');
    if (block) return block;
    await dbConnect("uniqbrio");

    const { id } = await params;
    const body = await request.json();

    const result = await updatePaymentRecord(id, body, session.tenantId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment record updated successfully',
      data: result.record,
    });
  } catch (error: any) {
    console.error('Error updating payment record:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update payment record',
      },
      { status: 500 }
    );
  }
  });
}

/**
 * DELETE /api/payments/payment-records/[id]
 * Soft delete a payment record
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const restriction = await import('@/lib/restrictions');
    const block = await restriction.assertWriteAllowed(session.tenantId!, 'payments');
    if (block) return block;
    await dbConnect("uniqbrio");

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const deletedBy = searchParams.get('deletedBy') || session.userId || 'system';

    const result = await deletePaymentRecord(id, deletedBy, session.tenantId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment record deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting payment record:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete payment record',
      },
      { status: 500 }
    );
  }
  });
}

/**
 * POST /api/payments/payment-records/[id]/verify
 * Verify a payment record
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const restriction = await import('@/lib/restrictions');
    const block = await restriction.assertWriteAllowed(session.tenantId!, 'payments');
    if (block) return block;
    await dbConnect("uniqbrio");

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'verify') {
      const body = await request.json();
      const verifiedBy = body.verifiedBy || session.userId || 'system';

      const result = await verifyPaymentRecord(id, verifiedBy, session.tenantId);

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Payment record verified successfully',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action',
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error processing payment record action:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process action',
      },
      { status: 500 }
    );
  }
  });
}
