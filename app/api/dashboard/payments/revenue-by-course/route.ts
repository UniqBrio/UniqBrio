import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

// Define payment schema for aggregation
const paymentSchema = new mongoose.Schema({
  studentId: String,
  enrolledCourse: String,
  enrolledCourseName: String,
  receivedAmount: Number,
  totalAmount: Number,
  tenantId: String,
}, { collection: 'payments', strict: false });

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export async function GET() {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: No tenant context' },
      { status: 401 }
    );
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio");

        // Aggregate revenue by course
        const revenueData = await Payment.aggregate([
          {
            $match: {
              tenantId: session.tenantId,
              receivedAmount: { $gt: 0 }, // Only include payments that have been received
              enrolledCourse: { 
                $exists: true, 
                $ne: null, 
                $nin: [null, ''] // Not null and not empty string
              }
            }
          },
          {
            $group: {
              _id: {
                courseId: '$enrolledCourse',
                courseName: '$enrolledCourseName'
              },
              totalRevenue: { $sum: '$receivedAmount' },
              paymentCount: { $sum: 1 }
            }
          },
          {
            $project: {
              _id: 0,
              courseId: '$_id.courseId',
              courseName: { 
                $ifNull: ['$_id.courseName', '$_id.courseId'] 
              },
              amount: '$totalRevenue',
              paymentCount: 1
            }
          },
          {
            $sort: { amount: -1 } // Sort by revenue in descending order
          },
          {
            $limit: 20 // Limit to top 20 courses to show more data
          }
        ]);

        console.log(`[Revenue API] Found ${revenueData.length} courses with revenue for tenant ${session.tenantId}`);

        return NextResponse.json({
          success: true,
          data: revenueData,
          count: revenueData.length
        });

      } catch (error) {
        console.error('[Revenue API] Error fetching revenue data:', error);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }
  );
}