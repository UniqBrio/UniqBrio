import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import MonthlySubscription from '@/models/dashboard/payments/MonthlySubscription';
import { validateSubscriptionStatusUpdate } from '@/lib/dashboard/payments/subscription-validation';
import { dbConnect } from '@/lib/mongodb';

/**
 * GET /api/payments/monthly-subscriptions/[id]
 * Get specific monthly subscription
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const subscription = await MonthlySubscription.findById(params.id)
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

/**
 * PATCH /api/payments/monthly-subscriptions/[id]
 * Update subscription status (pause, cancel, reactivate)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Get current subscription
    const subscription = await MonthlySubscription.findById(params.id);
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
      // Update subscription status
      const updatedSubscription = await MonthlySubscription.findByIdAndUpdate(
        params.id,
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

/**
 * DELETE /api/payments/monthly-subscriptions/[id]
 * Cancel subscription (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect("uniqbrio");
    
    const { searchParams } = new URL(request.url);
    const updatedBy = searchParams.get('updatedBy') || 'system';
    const reason = searchParams.get('reason') || 'Subscription cancelled';
    
    // Get current subscription
    const subscription = await MonthlySubscription.findById(params.id);
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
      // Update subscription to cancelled
      const updatedSubscription = await MonthlySubscription.findByIdAndUpdate(
        params.id,
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