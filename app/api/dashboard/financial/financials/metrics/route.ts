import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { IncomeModel, ExpenseModel } from '@/lib/dashboard/models';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

// Helper to compute date range based on timeframe
function getDateRange(timeframe: string, start?: string, end?: string) {
  const now = new Date();
  let rangeStart: Date | null = null;
  let rangeEnd: Date | null = new Date(); // inclusive end (will use < next day)

  switch (timeframe) {
    case 'monthly':
      rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarterly': {
      const currentQuarter = Math.floor(now.getMonth() / 3); // 0-based
      const qStartMonth = currentQuarter * 3;
      rangeStart = new Date(now.getFullYear(), qStartMonth, 1);
      break;
    }
    case 'halfyearly': {
      const half = now.getMonth() < 6 ? 0 : 1;
      rangeStart = new Date(now.getFullYear(), half === 0 ? 0 : 6, 1);
      break;
    }
    case 'annually':
      rangeStart = new Date(now.getFullYear(), 0, 1);
      break;
    case 'lastyear': {
      rangeStart = new Date(now.getFullYear() - 1, 0, 1);
      rangeEnd = new Date(now.getFullYear(), 0, 1); // start of this year
      break;
    }
    case 'custom': {
      if (start && end) {
        rangeStart = new Date(start);
        rangeEnd = new Date(end);
      }
      break;
    }
    default:
      // fallback: last 30 days
      rangeStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  return { start: rangeStart, end: rangeEnd };
}

function deriveHealth(totalRevenue: number, totalExpenses: number): string {
  if (totalRevenue === 0 && totalExpenses === 0) return 'No Data';
  const net = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? (net / totalRevenue) * 100 : 0;
  if (net < 0) return 'Poor';
  if (margin >= 40) return 'Excellent';
  if (margin >= 20) return 'Good';
  if (margin >= 5) return 'Fair';
  return 'Low';
}

export async function GET(req: NextRequest) {
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
    const { searchParams } = new URL(req.url);
    const timeframe = (searchParams.get('timeframe') || 'monthly').toLowerCase();
    const customStart = searchParams.get('start');
    const customEnd = searchParams.get('end');

    const { start, end } = getDateRange(timeframe, customStart || undefined, customEnd || undefined);

    // Build date filter with explicit tenantId
    const matchStage: any = { tenantId: session.tenantId };
    const dateFilter: any = {};
    if (start) {
      dateFilter.$gte = start;
    }
    if (end) {
      // Make end exclusive by adding one day if end provided & timeframe != lastyear end-of-year boundary
      const exclusiveEnd = new Date(end.getTime());
      if (timeframe === 'custom') {
        // Add one day to include entire selected end date
        exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
      }
      dateFilter.$lt = exclusiveEnd;
    }

    if (Object.keys(dateFilter).length) {
      matchStage.date = dateFilter;
    }

    const [incomeAgg] = await IncomeModel.aggregate([
      { $match: matchStage },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const [expenseAgg] = await ExpenseModel.aggregate([
      { $match: matchStage },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalRevenue = incomeAgg?.total || 0;
    const totalExpenses = expenseAgg?.total || 0;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? +(netProfit / totalRevenue * 100).toFixed(2) : null;
    const financialHealth = deriveHealth(totalRevenue, totalExpenses);

    return NextResponse.json({
      timeframe,
      startDate: start ? start.toISOString() : null,
      endDate: end ? end.toISOString() : null,
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      financialHealth,
    });
  } catch (err: any) {
    console.error('Metrics API error', err);
    return NextResponse.json({ error: 'Failed to compute metrics' }, { status: 500 });
  }
    }
  );
}

export const revalidate = 0; // always fetch fresh metrics