import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import {
  addPaymentRecord,
  getPaymentHistory,
  calculateRemainingBalance,
  generateInvoiceBreakdown,
  getPaymentRecordById,
  updatePaymentRecord,
  deletePaymentRecord,
  verifyPaymentRecord,
  getStudentPaymentSummary,
} from '@/lib/dashboard/payments/payment-record-service';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

/**
 * POST /api/payments/payment-records
 * Create a new payment record
 */
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

    // Validate required fields
    if (!body.paymentId || !body.studentId || !body.paidAmount || !body.paymentMode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: paymentId, studentId, paidAmount, paymentMode',
        },
        { status: 400 }
      );
    }

    // Add payment record
    const result = await addPaymentRecord(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Payment record created successfully',
        data: result.record,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating payment record:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create payment record',
      },
      { status: 500 }
    );
  }
  });
}

/**
 * GET /api/payments/payment-records?paymentId=xxx
 * Get payment history for a specific payment
 */
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

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const recordId = searchParams.get('recordId');
    const studentId = searchParams.get('studentId');
    const action = searchParams.get('action');

    // Get single record by ID
    if (recordId) {
      const record = await getPaymentRecordById(recordId);
      
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
    }

    // Get payment history for a payment
    if (paymentId && (!action || action === 'history')) {
      const sortBy = searchParams.get('sortBy') || 'paidDate';
      const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
      const skip = searchParams.get('skip') ? parseInt(searchParams.get('skip')!) : undefined;

      const history = await getPaymentHistory(paymentId, {
        sortBy,
        sortOrder,
        limit,
        skip,
      });

      return NextResponse.json({
        success: true,
        records: history,
        count: history.length,
      });
    }

    // Calculate remaining balance
    if (paymentId && action === 'balance') {
      const balance = await calculateRemainingBalance(paymentId);

      return NextResponse.json({
        success: true,
        data: balance,
      });
    }

    // Generate invoice breakdown
    if (paymentId && action === 'invoice') {
      const invoice = await generateInvoiceBreakdown(paymentId);

      if (!invoice) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to generate invoice breakdown',
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: invoice,
      });
    }

    // Get student payment summary
    if (studentId && action === 'summary') {
      const summary = await getStudentPaymentSummary(studentId);

      return NextResponse.json({
        success: true,
        data: summary,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Missing required query parameters',
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error fetching payment records:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch payment records',
      },
      { status: 500 }
    );
  }
  });
}
