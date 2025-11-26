import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { IncomeModel, ExpenseModel } from '@/lib/dashboard/models';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

// Aggregate monthly totals for a given year (default current year)
function monthKey(date: Date) {
  const m = date.getMonth(); // 0-11
  const monthAbbr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m];
  return `${monthAbbr}'${date.getFullYear().toString().slice(-2)}`;
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
    // Test MongoDB connection first
    try {
      await dbConnect("uniqbrio");
    } catch (connError: any) {
      console.error('MongoDB connection failed in charts API:', connError);
      return NextResponse.json({ 
        error: 'Database unavailable', 
        details: connError?.message || 'Unknown connection error' 
      }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get('year');
    const period = searchParams.get('period') || 'monthly';
    const category = searchParams.get('category');
    const source = searchParams.get('source');
    const vendor = searchParams.get('vendor');
    const paymentMode = searchParams.get('paymentMode');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
    
    // Build date filter
    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = { 
        date: { 
          $gte: new Date(startDate), 
          $lte: new Date(endDate) 
        } 
      };
    } else {
      const start = new Date(year, 0, 1);
      const end = new Date(year + 1, 0, 1);
      dateFilter = { date: { $gte: start, $lt: end } };
    }

    // Build category filter if specified
    const categoryFilter = category && category !== 'all' ? {
      $or: [
        { incomeCategory: category },
        { expenseCategory: category }
      ]
    } : {};

    // Build source filter if specified (for income)
    const sourceFilter = source && source !== 'all' ? {
      sourceType: source
    } : {};

    // Build vendor filter if specified (for expenses)
    const vendorFilter = vendor && vendor !== 'all' ? {
      vendorName: vendor
    } : {};

    // Build payment mode filter if specified
    const paymentFilter = paymentMode && paymentMode !== 'all' ? {
      paymentMode: paymentMode
    } : {};

    // Common match filters
    const incomeMatch = { ...dateFilter, ...categoryFilter, ...sourceFilter, ...paymentFilter, tenantId: session.tenantId };
    const expenseMatch = { ...dateFilter, ...categoryFilter, ...vendorFilter, ...paymentFilter, tenantId: session.tenantId };

    let incomeAgg, expenseAgg;
    
    try {
      const incomePromise = IncomeModel.aggregate([
        { $match: incomeMatch },
        { $group: { _id: { m: { $month: '$date' } }, total: { $sum: '$amount' } } },
      ]);
      const expensePromise = ExpenseModel.aggregate([
        { $match: expenseMatch },
        { $group: { _id: { m: { $month: '$date' } }, total: { $sum: '$amount' } } },
      ]);

      [incomeAgg, expenseAgg] = await Promise.all([incomePromise, expensePromise]);
    } catch (aggError: any) {
      console.error('Aggregation error:', aggError);
      // Return empty data if aggregation fails
      incomeAgg = [];
      expenseAgg = [];
    }

    // Convert to lookup maps month->total
    const incomeMap: Record<number, number> = {};
    for (const row of incomeAgg) incomeMap[row._id.m] = row.total;
    const expenseMap: Record<number, number> = {};
    for (const row of expenseAgg) expenseMap[row._id.m] = row.total;

    // Build series based on period
    const series = [] as Array<{ name: string; income: number; expense: number; profit: number; roi: number }>;
    
    if (period === 'quarterly') {
      // Group by quarters
      const quarterData = new Map<number, { income: number; expense: number }>();
      
      for (const [month, income] of Object.entries(incomeMap)) {
        const quarter = Math.ceil(parseInt(month) / 3);
        if (!quarterData.has(quarter)) quarterData.set(quarter, { income: 0, expense: 0 });
        quarterData.get(quarter)!.income += income;
      }
      
      for (const [month, expense] of Object.entries(expenseMap)) {
        const quarter = Math.ceil(parseInt(month) / 3);
        if (!quarterData.has(quarter)) quarterData.set(quarter, { income: 0, expense: 0 });
        quarterData.get(quarter)!.expense += expense;
      }
      
      for (let q = 1; q <= 4; q++) {
        const data = quarterData.get(q) || { income: 0, expense: 0 };
        const profit = data.income - data.expense;
        let roi = 0;
        if (data.expense > 0 && isFinite(profit) && isFinite(data.expense)) {
          roi = +((profit / data.expense) * 100).toFixed(2);
          if (!isFinite(roi)) roi = 0;
        }
        series.push({ 
          name: `Q${q}'${year.toString().slice(-2)}`, 
          income: isFinite(data.income) ? data.income : 0, 
          expense: isFinite(data.expense) ? data.expense : 0, 
          profit: isFinite(profit) ? profit : 0, 
          roi 
        });
      }
    } else if (period === 'yearly') {
      // Single yearly summary
      const totalIncome = Object.values(incomeMap).reduce((sum, val) => sum + val, 0);
      const totalExpense = Object.values(expenseMap).reduce((sum, val) => sum + val, 0);
      const profit = totalIncome - totalExpense;
      let roi = 0;
      if (totalExpense > 0 && isFinite(profit) && isFinite(totalExpense)) {
        roi = +((profit / totalExpense) * 100).toFixed(2);
        if (!isFinite(roi)) roi = 0;
      }
      series.push({ 
        name: year.toString(), 
        income: isFinite(totalIncome) ? totalIncome : 0, 
        expense: isFinite(totalExpense) ? totalExpense : 0, 
        profit: isFinite(profit) ? profit : 0, 
        roi 
      });
    } else {
      // Default monthly
      for (let m = 1; m <= 12; m++) {
        const revenue = incomeMap[m] || 0;
        const cost = expenseMap[m] || 0;
        const profit = revenue - cost;
        let roi = 0;
        if (cost > 0 && isFinite(profit) && isFinite(cost)) {
          roi = +(profit / cost * 100).toFixed(2);
          if (!isFinite(roi)) roi = 0;
        }
        const monthDate = new Date(year, m - 1, 1);
        series.push({ 
          name: monthKey(monthDate), 
          income: isFinite(revenue) ? revenue : 0, 
          expense: isFinite(cost) ? cost : 0, 
          profit: isFinite(profit) ? profit : 0, 
          roi 
        });
      }
    }

    return NextResponse.json({ 
      year, 
      period, 
      category: category || 'all',
      source: source || 'all',
      vendor: vendor || 'all',
      paymentMode: paymentMode || 'all',
      data: series 
    });
    } catch (e: any) {
      console.error('Charts API error:', e);
      console.error('Error stack:', e.stack);
      return NextResponse.json({ 
        error: 'Failed to load chart data', 
        details: e.message,
        stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
      }, { status: 500 });
    }
  });
}

export const revalidate = 0;