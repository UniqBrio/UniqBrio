import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { IncomeModel, ExpenseModel } from '@/lib/dashboard/models';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

// GET /api/financials/charts/categories
// Returns profit analysis by categories (both income and expense categories)
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
      console.error('MongoDB connection failed in categories charts API:', connError);
      return NextResponse.json({ 
        error: 'Database unavailable', 
        details: connError?.message || 'Unknown connection error' 
      }, { status: 503 });
    }
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get('year');
    const category = searchParams.get('category');
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

    const match = { ...dateFilter, ...categoryFilter, tenantId: session.tenantId };

    // Aggregate income by category
    const incomeAgg = await IncomeModel.aggregate([
      { $match: match },
      { 
        $group: { 
          _id: '$incomeCategory',
          totalIncome: { $sum: '$amount' },
          count: { $sum: 1 }
        } 
      }
    ]);

    // Aggregate expenses by category
    const expenseAgg = await ExpenseModel.aggregate([
      { $match: match },
      { 
        $group: { 
          _id: '$expenseCategory',
          totalExpense: { $sum: '$amount' },
          count: { $sum: 1 }
        } 
      }
    ]);

    // Combine and calculate profits by category
    const categoryMap = new Map<string, { income: number; expense: number; incomeCount: number; expenseCount: number }>();

    // Process income data
    for (const item of incomeAgg) {
      const cat = item._id || 'Uncategorized';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { income: 0, expense: 0, incomeCount: 0, expenseCount: 0 });
      }
      const existing = categoryMap.get(cat)!;
      existing.income = item.totalIncome;
      existing.incomeCount = item.count;
    }

    // Process expense data
    for (const item of expenseAgg) {
      const cat = item._id || 'Uncategorized';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { income: 0, expense: 0, incomeCount: 0, expenseCount: 0 });
      }
      const existing = categoryMap.get(cat)!;
      existing.expense = item.totalExpense;
      existing.expenseCount = item.count;
    }

    // Convert to array and calculate profits
    const categoryData = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      income: data.income,
      expense: data.expense,
      profit: data.income - data.expense,
      count: data.incomeCount + data.expenseCount,
      profitMargin: data.income > 0 ? ((data.income - data.expense) / data.income) * 100 : 0
    }));

    // Sort by profit descending
    categoryData.sort((a, b) => b.profit - a.profit);

    return NextResponse.json({ 
      year, 
      category: category || 'all',
      data: categoryData,
      summary: {
        totalCategories: categoryData.length,
        totalProfit: categoryData.reduce((sum, cat) => sum + cat.profit, 0),
        totalIncome: categoryData.reduce((sum, cat) => sum + cat.income, 0),
        totalExpenses: categoryData.reduce((sum, cat) => sum + cat.expense, 0)
      }
    });
    } catch (e: any) {
      console.error('Category charts API error', e);
      return NextResponse.json({ error: 'Failed to load category data' }, { status: 500 });
    }
  });
}

export const revalidate = 0;