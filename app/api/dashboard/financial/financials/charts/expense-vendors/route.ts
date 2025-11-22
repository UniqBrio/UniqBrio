import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { ExpenseModel } from '@/lib/dashboard/models';

// GET /api/financials/charts/expense-vendors
// Returns expense analysis by vendors
export async function GET(req: NextRequest) {
  try {
    // Test MongoDB connection first
    try {
      await dbConnect("uniqbrio");
    } catch (connError: any) {
      console.error('MongoDB connection failed in expense-vendors API:', connError);
      return NextResponse.json({ 
        error: 'Database unavailable', 
        details: connError?.message || 'Unknown connection error' 
      }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get('year');
    const category = searchParams.get('category');
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

    // Build filters
    let match: any = { ...dateFilter };
    
    if (category && category !== 'all') {
      match.expenseCategory = category;
    }
    
    if (vendor && vendor !== 'all') {
      match.vendorName = vendor;
    }
    
    if (paymentMode && paymentMode !== 'all') {
      match.paymentMode = paymentMode;
    }

    // Aggregate expenses by vendor
    const vendorAgg = await ExpenseModel.aggregate([
      { $match: match },
      { 
        $group: { 
          _id: '$vendorName',
          totalExpense: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        } 
      },
      { $sort: { totalExpense: -1 } }
    ]);

    // Calculate total for percentages
    const totalExpense = vendorAgg.reduce((sum, item) => sum + item.totalExpense, 0);

    // Format data
    const vendorData = vendorAgg.map(item => ({
      vendor: item._id || 'Unknown Vendor',
      expense: item.totalExpense,
      count: item.count,
      avgAmount: Math.round(item.avgAmount),
      percentage: totalExpense > 0 ? +((item.totalExpense / totalExpense) * 100).toFixed(1) : 0
    }));

    return NextResponse.json({ 
      year, 
      category: category || 'all',
      vendor: vendor || 'all',
      paymentMode: paymentMode || 'all',
      data: vendorData,
      summary: {
        totalVendors: vendorData.length,
        totalExpense: totalExpense,
        totalTransactions: vendorAgg.reduce((sum, item) => sum + item.count, 0),
        avgTransactionAmount: totalExpense > 0 ? Math.round(totalExpense / vendorAgg.reduce((sum, item) => sum + item.count, 0)) : 0
      }
    });
  } catch (e: any) {
    console.error('Expense vendors API error:', e);
    console.error('Error stack:', e.stack);
    return NextResponse.json({ 
      error: 'Failed to load expense vendor data',
      details: e.message,
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }, { status: 500 });
  }
}

export const revalidate = 0;