import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { IncomeModel, ExpenseModel } from '@/lib/dashboard/models';

// Compute date range from timeframe string and optional custom dates
function getDateRange(timeframe: string, start?: string, end?: string) {
  const now = new Date();
  let rangeStart: Date | null = null;
  let rangeEnd: Date | null = new Date();

  switch ((timeframe || 'monthly').toLowerCase()) {
    case 'monthly':
      rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarterly': {
      const q = Math.floor(now.getMonth() / 3);
      rangeStart = new Date(now.getFullYear(), q * 3, 1);
      break;
    }
    case 'halfyearly':
      rangeStart = new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1);
      break;
    case 'annually':
      rangeStart = new Date(now.getFullYear(), 0, 1);
      break;
    case 'lastyear':
      rangeStart = new Date(now.getFullYear() - 1, 0, 1);
      rangeEnd = new Date(now.getFullYear(), 0, 1);
      break;
    case 'custom':
      if (start) rangeStart = new Date(start);
      if (end) rangeEnd = new Date(end);
      break;
    default:
      rangeStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  return { start: rangeStart, end: rangeEnd };
}

function toISODate(d?: Date | string | null) {
  if (!d) return null;
  const dd = typeof d === 'string' ? new Date(d) : d;
  return isNaN(dd.getTime()) ? null : dd.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect("uniqbrio");
    const { searchParams } = new URL(req.url);
    const timeframe = (searchParams.get('timeframe') || 'monthly').toLowerCase();
    const customStart = searchParams.get('start') || undefined;
    const customEnd = searchParams.get('end') || undefined;

    const { start, end } = getDateRange(timeframe, customStart, customEnd);

    // Build date filter
    const dateFilter: any = {};
    if (start) dateFilter.$gte = start;
    if (end) {
      // Make end exclusive for day selection to include entire end date
      const exclusiveEnd = new Date(end.getTime());
      if (timeframe === 'custom') exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
      dateFilter.$lt = exclusiveEnd;
    }
    const match = Object.keys(dateFilter).length ? { date: dateFilter } : {};

    // Fetch all incomes and expenses in range
    const [incomes, expenses] = await Promise.all([
      IncomeModel.find(match).lean(),
      ExpenseModel.find(match).lean(),
    ]);

    // Normalize into a unified list for the report
    type Item = {
      type: 'Income' | 'Expense';
      date: string; // yyyy-mm-dd
      description: string;
      category: string;
      source?: string;
      vendorName?: string;
      fromAccount?: string;
      toAccount?: string;
      paymentMode?: string;
      amount: number;
    };

    const items: Item[] = [];
    for (const inc of incomes) {
      items.push({
        type: 'Income',
        date: toISODate(inc.date)!,
        description: inc.description || '',
        category: inc.incomeCategory || '',
        source: inc.sourceType || '',
        vendorName: '',
        fromAccount: '',
        toAccount: inc.addToAccount || '',
        paymentMode: inc.paymentMode || '',
        amount: Number(inc.amount) || 0,
      });
    }
    for (const exp of expenses) {
      items.push({
        type: 'Expense',
        date: toISODate(exp.date)!,
        description: exp.description || '',
        category: exp.expenseCategory || '',
        source: '',
        vendorName: exp.vendorName || '',
        fromAccount: exp.addFromAccount || '',
        toAccount: '',
        paymentMode: exp.paymentMode || '',
        amount: Number(exp.amount) || 0,
      });
    }

    // Sort by date asc, then type to keep a stable order (Income before Expense on same day)
    items.sort((a, b) => {
      if (a.date === b.date) {
        if (a.type === b.type) return 0;
        return a.type === 'Income' ? -1 : 1;
      }
      return a.date.localeCompare(b.date);
    });

    // Compute totals (do not persist running balance here; frontend can compute if needed)
    const totalIncome = items.filter(i => i.type === 'Income').reduce((s, i) => s + i.amount, 0);
    const totalExpense = items.filter(i => i.type === 'Expense').reduce((s, i) => s + i.amount, 0);
    const finalBalance = totalIncome - totalExpense;

    return NextResponse.json({
      timeframe,
      startDate: start ? start.toISOString() : null,
      endDate: end ? end.toISOString() : null,
      items,
      totals: { income: totalIncome, expense: totalExpense, balance: finalBalance },
    });
  } catch (e: any) {
    console.error('Profit-Loss API error', e);
    return NextResponse.json({ error: 'Failed to build profit & loss report' }, { status: 500 });
  }
}

export const revalidate = 0;
