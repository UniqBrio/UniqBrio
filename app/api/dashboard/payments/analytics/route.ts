import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Payment from '@/models/dashboard/payments/Payment';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

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

        // Fetch only required fields for analytics (much faster)
        const payments = await Payment.find({}).select('enrolledCourse enrolledCourseName receivedAmount outstandingAmount collectionRate paymentOption lastPaymentDate').lean().exec();

        // Calculate analytics
        const totalStudents = payments.length;
        const totalCourses = new Set(payments.map((p: any) => p.enrolledCourse).filter(Boolean)).size;
        const totalReceived = payments.reduce((sum: number, p: any) => sum + (p.receivedAmount || 0), 0);
        const totalOutstanding = payments.reduce((sum: number, p: any) => sum + (p.outstandingAmount || 0), 0);

        // Calculate time-based revenue
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
        startOfWeek.setHours(0, 0, 0, 0);

        let monthlyRevenue = 0;
        let weeklyRevenue = 0;

        // Use lastPaymentDate and receivedAmount to estimate revenue
        // Note: This counts the total receivedAmount if last payment was in the time period
        // For more accurate tracking, implement a proper transaction history system
        payments.forEach((p: any) => {
      if (p.lastPaymentDate && p.receivedAmount > 0) {
        const paymentDate = new Date(p.lastPaymentDate);
        
        // Add to monthly revenue if last payment was in current month
        if (paymentDate >= startOfMonth) {
          monthlyRevenue += p.receivedAmount || 0;
        }
        
        // Add to weekly revenue if last payment was in current week
        if (paymentDate >= startOfWeek) {
          weeklyRevenue += p.receivedAmount || 0;
        }
      }
        });

        // Revenue by source (top 3 courses)
        const courseRevenue = new Map<string, { name: string; amount: number }>();
        (payments as any[]).forEach((p: any) => {
      if (p.enrolledCourse && p.enrolledCourseName) {
        const existing = courseRevenue.get(p.enrolledCourse) || { name: p.enrolledCourseName, amount: 0 };
        courseRevenue.set(p.enrolledCourse, {
          name: existing.name,
          amount: existing.amount + (p.receivedAmount || 0),
        });
      }
        });

        const revenueBySource = Array.from(courseRevenue.entries())
      .map(([courseId, data]) => ({
        courseId,
        courseName: data.name,
        amount: data.amount,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

        // Payment completion distribution by payment categories
        const distribution = {
      oneTime: { count: 0, totalToBePaid: 0, courseFees: 0, courseRegFees: 0, studentRegFees: 0, totalPaid: 0 },
      oneTimeWithInstallments: { count: 0, totalToBePaid: 0, courseFees: 0, courseRegFees: 0, studentRegFees: 0, totalPaid: 0 },
      monthly: { count: 0, totalToBePaid: 0, courseFees: 0, courseRegFees: 0, studentRegFees: 0, totalPaid: 0 },
      monthlyWithDiscounts: { count: 0, totalToBePaid: 0, courseFees: 0, courseRegFees: 0, studentRegFees: 0, totalPaid: 0 },
      emi: { count: 0, totalToBePaid: 0, courseFees: 0, courseRegFees: 0, studentRegFees: 0, totalPaid: 0 },
      other: { count: 0, totalToBePaid: 0, courseFees: 0, courseRegFees: 0, studentRegFees: 0, totalPaid: 0 }
        };

        (payments as any[]).forEach((p: any) => {
      const paymentOption = p.paymentOption || 'Other';
      const courseFee = p.courseFee || 0;
      const courseRegFee = p.courseRegistrationFee || 0;
      const studentRegFee = p.studentRegistrationFee || 0;
      const totalFees = courseFee + courseRegFee + studentRegFee;
      const paidAmount = p.receivedAmount || 0;
      
      let category;
      switch (paymentOption) {
        case 'One Time':
          category = distribution.oneTime;
          break;
        case 'One Time With Installments':
          category = distribution.oneTimeWithInstallments;
          break;
        case 'Monthly':
        case 'Monthly Subscription':
          category = distribution.monthly;
          break;
        case 'Monthly With Discounts':
        case 'Monthly Subscription With Discounts':
          category = distribution.monthlyWithDiscounts;
          break;
        case 'EMI':
        case 'Custom EMI':
          category = distribution.emi;
          break;
        default:
          category = distribution.other;
          break;
      }
      
      category.count++;
      category.totalToBePaid += totalFees;
      category.courseFees += courseFee;
      category.courseRegFees += courseRegFee;
      category.studentRegFees += studentRegFee;
      category.totalPaid += paidAmount;
        });

        // Payment method distribution
        const paymentMethods: { [key: string]: number } = {};
        (payments as any[]).forEach((p: any) => {
      const category = p.paymentOption || 'Not Set';
      paymentMethods[category] = (paymentMethods[category] || 0) + 1;
        });

        // Monthly trend (last 6 months)
        const monthlyTrend = [];
        for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      
      let revenue = 0;
      (payments as any[]).forEach((p: any) => {
        if (p.lastPaymentDate && p.receivedAmount > 0) {
          const paymentDate = new Date(p.lastPaymentDate);
          if (paymentDate >= monthStart && paymentDate <= monthEnd) {
            revenue += p.receivedAmount || 0;
          }
        }
      });
      
      monthlyTrend.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue
      });
        }

        const analytics = {
      totalCourses,
      totalStudents,
      totalReceived,
      totalOutstanding,
      monthlyRevenue,
      weeklyRevenue,
      revenueBySource,
      paymentCompletionDistribution: distribution,
      paymentMethodDistribution: paymentMethods,
      monthlyTrend,
        };

        const response = NextResponse.json(analytics, { status: 200 });
        // Cache for 30 seconds to speed up repeated requests
        response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
        return response;
  } catch (error: any) {
        console.error('Error fetching payment analytics:', error);
        return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
        );
  }
        }
  );
}
