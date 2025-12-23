import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Payment from '@/models/dashboard/payments/Payment';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

// Cache for 60 seconds
export const dynamic = 'force-dynamic';
export const revalidate = 60;

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

        // Fetch only required fields for analytics with strict tenant isolation
        const payments = await Payment.find({ tenantId: session.tenantId }).select('enrolledCourse enrolledCourseName receivedAmount outstandingAmount collectionRate paymentOption lastPaymentDate courseFee courseRegistrationFee studentRegistrationFee tenantId').lean().exec();

        console.log(`[Analytics] Found ${payments.length} payments for tenant ${session.tenantId}`);

        // Validate and debug payment data
        let filteredByTenant = 0;
        let filteredByFees = 0;
        
        const validPayments = payments.filter((p: any) => {
          // Check tenant isolation (but be flexible with undefined values)
          if (p.tenantId && p.tenantId !== session.tenantId) {
            console.warn(`[Analytics] Found payment with wrong tenant: ${p.tenantId} vs ${session.tenantId}`);
            filteredByTenant++;
            return false;
          }
          
          // Only filter out extremely unrealistic fees (more lenient) - ensure numeric conversion
          const courseFee = Number(p.courseFee) || 0;
          const courseRegFee = Number(p.courseRegistrationFee) || 0;
          const studentRegFee = Number(p.studentRegistrationFee) || 0;
          const totalFees = courseFee + courseRegFee + studentRegFee;
          
          if (totalFees > 10000000) { // More than 1 crore (very lenient)
            console.warn(`[Analytics] Filtering out payment with excessive fees:`, {
              studentId: p.studentId,
              courseFee,
              courseRegFee,
              studentRegFee,
              totalFees
            });
            filteredByFees++;
            return false;
          }
          
          return true;
        });

        console.log(`[Analytics Debug] Tenant ${session.tenantId}:`, {
          totalPayments: payments.length,
          validPayments: validPayments.length,
          filteredByTenant,
          filteredByFees,
          samplePayment: payments[0] || 'none'
        });

        // Additional debugging for empty results
        if (validPayments.length === 0 && payments.length > 0) {
          console.error(`[Analytics] All payments filtered out! Sample payment structure:`, {
            samplePayment: payments[0],
            expectedTenantId: session.tenantId,
            actualTenantIds: [...new Set(payments.map(p => p.tenantId))],
            paymentStructure: Object.keys(payments[0] || {})
          });
        }

        console.log(`[Analytics] Using ${validPayments.length} valid payments after filtering`);

        // Fallback: if no valid payments but we have original payments, use them (with capping)
        const paymentsToUse = validPayments.length > 0 ? validPayments : payments;
        console.log(`[Analytics] Using ${paymentsToUse === validPayments ? 'filtered' : 'original'} payments for calculations`);

        // Calculate analytics with proper validation
        const totalStudents = paymentsToUse.length;
        const totalCourses = new Set(paymentsToUse.map((p: any) => p.enrolledCourse).filter(Boolean)).size;
        const totalReceived = paymentsToUse.reduce((sum: number, p: any) => sum + (p.receivedAmount || 0), 0);
        
        // Sample valid payment for debugging
        if (validPayments.length > 0) {
          console.log(`[Analytics] Sample valid payment:`, {
            studentId: validPayments[0].studentId,
            courseFee: validPayments[0].courseFee,
            receivedAmount: validPayments[0].receivedAmount,
            tenantId: validPayments[0].tenantId
          });
        }

        // Calculate total outstanding with reasonable safeguards
        const totalOutstanding = paymentsToUse.reduce((sum: number, p: any) => {
          const courseFee = Number(p.courseFee) || 0;
          const courseRegFee = Number(p.courseRegistrationFee) || 0;
          const studentRegFee = Number(p.studentRegistrationFee) || 0;
          const totalFees = courseFee + courseRegFee + studentRegFee;
          const received = Number(p.receivedAmount) || 0;
          const outstanding = Math.max(0, totalFees - received); // Ensure non-negative
          return sum + outstanding;
        }, 0);

        // Calculate time-based revenue
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
        startOfWeek.setHours(0, 0, 0, 0);

        let monthlyRevenue = 0;
        let weeklyRevenue = 0;

        // Use lastPaymentDate and receivedAmount to estimate revenue (using selected payments)
        paymentsToUse.forEach((p: any) => {
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

        // Revenue by source (all courses, properly aggregated, using selected payments)
        const courseRevenue = new Map<string, { name: string; amount: number }>();
        paymentsToUse.forEach((p: any) => {
          if (p.enrolledCourse) {
            const courseName = p.enrolledCourseName || p.enrolledCourse || 'Unknown Course';
            const existing = courseRevenue.get(p.enrolledCourse) || { name: courseName, amount: 0 };
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
          .filter(item => item.amount > 0) // Only include courses with revenue
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 10); // Show top 10 instead of just 3

        // Payment completion distribution by payment categories
        const distribution = {
      oneTime: { count: 0, totalToBePaid: 0, courseFees: 0, courseRegFees: 0, studentRegFees: 0, totalPaid: 0 },
      oneTimeWithInstallments: { count: 0, totalToBePaid: 0, courseFees: 0, courseRegFees: 0, studentRegFees: 0, totalPaid: 0 },
      monthly: { count: 0, totalToBePaid: 0, courseFees: 0, courseRegFees: 0, studentRegFees: 0, totalPaid: 0 },
      monthlyWithDiscounts: { count: 0, totalToBePaid: 0, courseFees: 0, courseRegFees: 0, studentRegFees: 0, totalPaid: 0 },
      emi: { count: 0, totalToBePaid: 0, courseFees: 0, courseRegFees: 0, studentRegFees: 0, totalPaid: 0 },
      other: { count: 0, totalToBePaid: 0, courseFees: 0, courseRegFees: 0, studentRegFees: 0, totalPaid: 0 }
        };

        console.log(`[Analytics] Processing ${paymentsToUse.length} payments for category distribution`);
        paymentsToUse.forEach((p: any) => {
          const originalOption = p.paymentOption || 'Other';
          const paymentOption = originalOption.toLowerCase().trim();
          console.log(`[Analytics] Payment option: '${originalOption}' -> '${paymentOption}'`);
          const courseFee = Number(p.courseFee) || 0;
          const courseRegFee = Number(p.courseRegistrationFee) || 0;
          const studentRegFee = Number(p.studentRegistrationFee) || 0;
          const totalFees = courseFee + courseRegFee + studentRegFee;
          const paidAmount = Number(p.receivedAmount) || 0;
      
          let category;
          // Fixed categorization logic to handle all possible payment option values
          if (paymentOption === 'one time') {
            category = distribution.oneTime;
          } else if (paymentOption === 'one time with installments') {
            category = distribution.oneTimeWithInstallments;
          } else if (paymentOption === 'monthly with discounts' || paymentOption === 'monthly subscription with discounts') {
            category = distribution.monthlyWithDiscounts;
          } else if (paymentOption === 'monthly' || paymentOption === 'monthly subscription') {
            category = distribution.monthly;
          } else if (paymentOption === 'emi') {
            category = distribution.emi;
          } else {
            category = distribution.other;
          }
      
          // Debug logging for category assignment
          const categoryName = category === distribution.oneTime ? 'oneTime' :
                               category === distribution.oneTimeWithInstallments ? 'oneTimeWithInstallments' :
                               category === distribution.monthly ? 'monthly' :
                               category === distribution.monthlyWithDiscounts ? 'monthlyWithDiscounts' :
                               category === distribution.emi ? 'emi' : 'other';
          console.log(`[Analytics] Payment '${originalOption}' categorized as: ${categoryName}`);
      
          category.count++;
          category.totalToBePaid += totalFees;
          category.courseFees += courseFee;
          category.courseRegFees += courseRegFee;
          category.studentRegFees += studentRegFee;
          category.totalPaid += paidAmount;
        });

        // Payment method distribution (using selected payments)
        const paymentMethods: { [key: string]: number } = {};
        paymentsToUse.forEach((p: any) => {
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
      paymentsToUse.forEach((p: any) => {
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

        // Debug logging for large values
        console.log(`[Analytics Debug] Tenant ${session.tenantId}: Payments used: ${paymentsToUse.length}, Total Outstanding: ${totalOutstanding}, Total Received: ${totalReceived}`);
        
        if (totalOutstanding > 100000) { // Log if outstanding is > 1 lakh (reasonable threshold)
          console.warn(`[Analytics Warning] High outstanding amount: ${totalOutstanding} for tenant ${session.tenantId}`);
          const sampleHighPayments = paymentsToUse.filter((p: any) => {
            const totalFees = (Number(p.courseFee) || 0) + (Number(p.courseRegistrationFee) || 0) + (Number(p.studentRegistrationFee) || 0);
            const received = Number(p.receivedAmount) || 0;
            return (totalFees - received) > 10000; // Outstanding > 10k
          }).slice(0, 3);
          console.warn(`Sample high outstanding payments:`, sampleHighPayments.map(p => ({
            studentId: p.studentId,
            courseFee: p.courseFee,
            courseRegFee: p.courseRegistrationFee,
            studentRegFee: p.studentRegistrationFee,
            received: p.receivedAmount,
            outstanding: Math.max(0, (Number(p.courseFee) || 0) + (Number(p.courseRegistrationFee) || 0) + (Number(p.studentRegistrationFee) || 0) - (Number(p.receivedAmount) || 0))
          })));
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
