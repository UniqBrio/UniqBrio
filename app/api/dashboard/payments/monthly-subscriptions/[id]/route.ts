import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import MonthlySubscription from '@/models/dashboard/payments/MonthlySubscription';
import { validateSubscriptionStatusUpdate } from '@/lib/dashboard/payments/subscription-validation';
import { dbConnect } from '@/lib/mongodb';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';
import { logEntityUpdate, logEntityDelete, getClientIp, getUserAgent } from '@/lib/audit-logger';
import { AuditModule } from '@/models/AuditLog';

/**
 * GET /api/payments/monthly-subscriptions/[id]
 * Get specific monthly subscription
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    await dbConnect();
    
    const subscription = await MonthlySubscription.findOne({ _id: params.id, tenantId: session.tenantId })
      .populate('paymentRecords');
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      subscription
    });
    
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to get subscription' 
      }, 
      { status: 500 }
    );
  }
  }
  );
}

/**
 * PATCH /api/payments/monthly-subscriptions/[id]
 * Update subscription status (pause, cancel, reactivate)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userSession = await getUserSession();
  
  if (!userSession?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    );
  }
  
  return runWithTenantContext(
    { tenantId: userSession.tenantId },
    async () => {
  try {
    await dbConnect("uniqbrio");
    
    const body = await request.json();
    const validation = validateSubscriptionStatusUpdate({
      ...body,
      subscriptionId: params.id
    });
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.error.issues 
        }, 
        { status: 400 }
      );
    }

    const data = validation.data;
    
    // Get current subscription with tenant isolation
    const subscription = await MonthlySubscription.findOne({ _id: params.id, tenantId: userSession.tenantId });
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }
    
    const currentStatus = subscription.status;
    
    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      'ACTIVE': ['PAUSED', 'CANCELLED'],
      'PAUSED': ['ACTIVE', 'CANCELLED'], 
      'CANCELLED': [], // Cannot change from cancelled
      'COMPLETED': [] // Cannot change from completed
    };
    
    if (!validTransitions[currentStatus]?.includes(data.status)) {
      return NextResponse.json(
        { 
          error: `Cannot change status from ${currentStatus} to ${data.status}` 
        },
        { status: 400 }
      );
    }
    
    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Update subscription status with tenant isolation
      const updatedSubscription = await MonthlySubscription.findOneAndUpdate(
        { _id: params.id, tenantId: userSession.tenantId },
        { 
          status: data.status,
          lastUpdatedBy: data.updatedBy
        },
        { session, new: true }
      );
      
      // Add audit log
      await subscription.addAuditLog(
        'STATUS_CHANGED',
        data.updatedBy,
        {
          oldStatus: currentStatus,
          newStatus: data.status,
          reason: data.reason
        },
        `Status changed from ${currentStatus} to ${data.status}: ${data.reason}`
      );
      
      await session.commitTransaction();
      
      // Get session for audit logging
      const userSession = await getUserSession();
      
      // Log subscription update to audit logger
      await logEntityUpdate({
        module: AuditModule.PAYMENTS,
        action: 'UPDATE_SUBSCRIPTION_STATUS',
        entityType: 'MonthlySubscription',
        entityId: params.id,
        entityName: `${updatedSubscription?.studentName} - ${updatedSubscription?.courseName}`,
        changes: {
          status: {
            old: currentStatus,
            new: data.status
          },
          reason: data.reason
        },
        details: {
          subscriptionId: params.id,
          studentId: subscription.studentId,
          courseId: subscription.courseId,
          oldStatus: currentStatus,
          newStatus: data.status,
          reason: data.reason,
          updatedBy: data.updatedBy
        },
        performedBy: {
          userId: userSession?.userId || 'system',
          email: userSession?.email || 'system@uniqbrio.com',
          role: 'super_admin',
          tenantId: userSession?.tenantId || subscription.tenantId
        },
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers)
      });
      
      return NextResponse.json({
        success: true,
        subscription: updatedSubscription,
        message: `Subscription status updated to ${data.status}`
      });
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
    
  } catch (error) {
    console.error('Update subscription status error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to update subscription' 
      }, 
      { status: 500 }
    );
  }
  }
  );
}

/**
 * DELETE /api/payments/monthly-subscriptions/[id]
 * Cancel subscription (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userSession = await getUserSession();
  
  if (!userSession?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    );
  }
  
  return runWithTenantContext(
    { tenantId: userSession.tenantId },
    async () => {
  try {
    await dbConnect("uniqbrio");
    
    const { searchParams } = new URL(request.url);
    const updatedBy = searchParams.get('updatedBy') || 'system';
    const reason = searchParams.get('reason') || 'Subscription cancelled';
    
    // Get current subscription with tenant isolation
    const subscription = await MonthlySubscription.findOne({ _id: params.id, tenantId: userSession.tenantId });
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }
    
    if (subscription.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Subscription is already cancelled' },
        { status: 400 }
      );
    }
    
    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Update subscription to cancelled with tenant isolation
      const updatedSubscription = await MonthlySubscription.findOneAndUpdate(
        { _id: params.id, tenantId: userSession.tenantId },
        { 
          status: 'CANCELLED',
          lastUpdatedBy: updatedBy
        },
        { session, new: true }
      );
      
      // Add audit log
      await subscription.addAuditLog(
        'CANCELLED',
        updatedBy,
        {
          reason,
          cancelledAt: new Date()
        },
        `Subscription cancelled: ${reason}`
      );
      
      await session.commitTransaction();
      
      // Log subscription deletion to audit logger
      await logEntityDelete({
        module: AuditModule.PAYMENTS,
        action: 'DELETE_SUBSCRIPTION',
        entityType: 'MonthlySubscription',
        entityId: params.id,
        entityName: `${updatedSubscription?.studentName} - ${updatedSubscription?.courseName}`,
        details: {
          subscriptionId: params.id,
          studentId: subscription.studentId,
          courseId: subscription.courseId,
          cohortId: subscription.cohortId,
          courseFee: subscription.courseFee,
          totalPaidAmount: subscription.totalPaidAmount,
          currentMonth: subscription.currentMonth,
          reason,
          cancelledAt: new Date(),
          cancelledBy: updatedBy
        },
        performedBy: {
          userId: userSession?.userId || 'system',
          email: userSession?.email || 'system@uniqbrio.com',
          role: 'super_admin',
          tenantId: userSession?.tenantId || subscription.tenantId
        },
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers)
      });
      
      return NextResponse.json({
        success: true,
        subscription: updatedSubscription,
        message: 'Subscription cancelled successfully'
      });
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
    
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to cancel subscription' 
      }, 
      { status: 500 }
    );
  }
  }
  );
}