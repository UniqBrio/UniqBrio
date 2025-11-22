import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { IncomeModel } from '@/lib/dashboard/models';

// GET /api/financials/charts/income-categories
// Returns income analysis by categories
export async function GET(req: NextRequest) {
  try {
    // Test MongoDB connection first
    try {
      await dbConnect("uniqbrio");
    } catch (connError: any) {
      console.error('MongoDB connection failed in income-categories API:', connError);
      return NextResponse.json({ 
        error: 'Database unavailable', 
        details: connError?.message || 'Unknown connection error' 
      }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get('year');
    const category = searchParams.get('category');
    const source = searchParams.get('source');
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

    // Build filters
    let match: any = { ...dateFilter };
    
    if (category && category !== 'all') {
      match.incomeCategory = category;
    }
    
    if (source && source !== 'all') {
      match.sourceType = source;
    }

    // Aggregate income by category
    const categoryAgg = await IncomeModel.aggregate([
      { $match: match },
      { 
        $group: { 
          _id: '$incomeCategory',
          totalIncome: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        } 
      },
      { $sort: { totalIncome: -1 } }
    ]);

    // Calculate total for percentages
    const totalIncome = categoryAgg.reduce((sum, item) => sum + item.totalIncome, 0);

    // Format data
    const categoryData = categoryAgg.map(item => ({
      category: item._id || 'Uncategorized',
      income: item.totalIncome,
      count: item.count,
      avgAmount: Math.round(item.avgAmount),
      percentage: totalIncome > 0 ? +((item.totalIncome / totalIncome) * 100).toFixed(1) : 0
    }));

    return NextResponse.json({ 
      year, 
      category: category || 'all',
      source: source || 'all',
      data: categoryData,
      summary: {
        totalCategories: categoryData.length,
        totalIncome: totalIncome,
        totalTransactions: categoryAgg.reduce((sum, item) => sum + item.count, 0),
        avgTransactionAmount: totalIncome > 0 ? Math.round(totalIncome / categoryAgg.reduce((sum, item) => sum + item.count, 0)) : 0
      }
    });
  } catch (e: any) {
    console.error('Income categories API error:', e);
    console.error('Error stack:', e.stack);
    return NextResponse.json({ 
      error: 'Failed to load income category data',
      details: e.message,
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }, { status: 500 });
  }
}

export const revalidate = 0;