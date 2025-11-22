import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Payment from '@/models/dashboard/payments/Payment';

export async function POST() {
  try {
    await dbConnect("uniqbrio");

    console.log('🔄 Starting payment status migration...');

    // Update "Partial" to "Paid"
    const partialResult = await Payment.updateMany(
      { status: 'Partial' },
      { $set: { status: 'Paid' } }
    );
    console.log(`✓ Updated ${partialResult.modifiedCount} "Partial" -> "Paid"`);

    // Update "Completed" to "Paid"
    const completedResult = await Payment.updateMany(
      { status: 'Completed' },
      { $set: { status: 'Paid' } }
    );
    console.log(`✓ Updated ${completedResult.modifiedCount} "Completed" -> "Paid"`);

    // Update "In Progress" to "Paid"
    const inProgressResult = await Payment.updateMany(
      { status: 'In Progress' },
      { $set: { status: 'Paid' } }
    );
    console.log(`✓ Updated ${inProgressResult.modifiedCount} "In Progress" -> "Paid"`);

    // Get current status distribution
    const statusCounts = await Payment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    return NextResponse.json({
      success: true,
      message: 'Payment status migration completed successfully',
      results: {
        partial: partialResult.modifiedCount,
        completed: completedResult.modifiedCount,
        inProgress: inProgressResult.modifiedCount
      },
      currentStatusDistribution: statusCounts
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: 'Migration failed', details: String(error) },
      { status: 500 }
    );
  }
}
