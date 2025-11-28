"use client";
import React, { useState, useEffect } from "react";
import { useCurrency } from "@/contexts/currency-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Label,
} from "recharts";
import { formatMonthLabel } from "@/lib/dashboard/utils";
import { useResponsiveBreakpoints, useResponsiveValue } from "@/hooks/dashboard/useResponsiveBreakpoints";
import { ResponsiveChartContainer } from "@/components/dashboard/ui/responsive-container";

interface FinancialData {
  totalExpenses: number;
  netProfit: number;
  financialHealth: string;
  profitMargin: number;
  expenseAlerts: number;
}

interface FinancialSnapshotProps {
  className?: string;
  userRole?: string;
}

export function FinancialSnapshot({
  className = "",
  userRole = "Staff",
}: FinancialSnapshotProps) {
  const { currency } = useCurrency();
  const [data, setData] = useState<FinancialData | null>(null);
  const [chartData, setChartData] = useState<Array<{ id: string; name: string; income: number; expense: number; profit: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const { screenSize } = useResponsiveBreakpoints();

  // Role-based access control
  const hasAccess = ["Admin", "Staff", "SuperAdmin"].includes(userRole);

  // Responsive chart configurations
  const chartConfig = useResponsiveValue({
    mobile: {
      fontSize: 10,
      margins: { left: 25, right: 15, bottom: 50, top: 15 },
      showLabels: false,
      strokeWidth: 2
    },
    tablet: {
      fontSize: 11,
      margins: { left: 70, right: 25, bottom: 70, top: 25 },
      showLabels: true,
      strokeWidth: 2
    },
    desktop: {
      fontSize: 12,
      margins: { left: 90, right: 30, bottom: 90, top: 30 },
      showLabels: true,
      strokeWidth: 3
    }
  });

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      setChartLoading(false);
      return;
    }

    const fetchFinancialData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ 
          timeframe: 'monthly',
          _t: Date.now().toString()
        });
        const res = await fetch(`/api/dashboard/financial/financials/metrics?${params.toString()}`, { 
          cache: 'no-store',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const apiData = await res.json();
        
        const financialData: FinancialData = {
          totalExpenses: apiData.totalExpenses || 0,
          netProfit: apiData.netProfit || 0,
          financialHealth: apiData.financialHealth || 'Good',
          profitMargin: apiData.profitMargin || 0,
          expenseAlerts: 2,
        };
        
        setData(financialData);
      } catch (error) {
        console.error("Error fetching financial data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [hasAccess]);

  // Fetch chart data
  useEffect(() => {
    if (!hasAccess) return;

    const fetchChartData = async () => {
      setChartLoading(true);
      try {
        const params = new URLSearchParams({
          year: new Date().getFullYear().toString(),
          _t: Date.now().toString()
        });

        const res = await fetch(`/api/dashboard/financial/financials/charts?${params}`, {
          cache: 'no-store',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        if (!res.ok) throw new Error(`Chart request failed: ${res.status}`);
        const apiData = await res.json();
        
        console.log('Chart API response:', apiData);
        // Show only last 6 months and exclude any future periods
        const allData = apiData.data || [];
        const now = new Date();

        // Attempt to parse a Date from the item. Prefer explicit date fields; fallback to name like "Dec'25"
        const parseItemDate = (item: any): Date | null => {
          if (item?.date) {
            const d = new Date(item.date);
            return isNaN(d.getTime()) ? null : d;
          }
          const name: string = item?.name ?? '';
          // Match formats like: Dec'25, Dec 2025, 2025-12
          const apostropheMatch = name.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)'(\d{2})$/);
          if (apostropheMatch) {
            const monthStr = apostropheMatch[1];
            const yy = parseInt(apostropheMatch[2], 10);
            const year = 2000 + yy;
            const monthIndex = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(monthStr);
            return new Date(year, monthIndex, 1);
          }
          const spaceYearMatch = name.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s-](\d{4})$/);
          if (spaceYearMatch) {
            const monthStr = spaceYearMatch[1];
            const year = parseInt(spaceYearMatch[2], 10);
            const monthIndex = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(monthStr);
            return new Date(year, monthIndex, 1);
          }
          const isoYearMonth = name.match(/^(\d{4})-(\d{2})$/);
          if (isoYearMonth) {
            const year = parseInt(isoYearMonth[1], 10);
            const monthIndex = parseInt(isoYearMonth[2], 10) - 1;
            return new Date(year, monthIndex, 1);
          }
          return null;
        };

        const filtered = allData.filter((item: any) => {
          const d = parseItemDate(item);
          if (!d) return true; // If unknown, keep but will be trimmed by slicing
          // Keep only items where item month <= current month (no future)
          const cmp = new Date(d.getFullYear(), d.getMonth(), 1).getTime() <= new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          return cmp;
        });

        // Take the last 6 entries after filtering and add unique IDs
        const last6Months = filtered.slice(-6).map((item: any, index: number) => ({
          ...item,
          id: `${item.name || 'month'}-${index}`
        }));
        setChartData(last6Months);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setChartLoading(false);
      }
    };

    fetchChartData();
  }, [hasAccess]);

  if (!hasAccess) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    if (!currency) {
      return amount.toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    }
    return `${currency} ${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <Card className={`${className} border-0 shadow-[0_10px_40px_rgba(0,0,0,0.12)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.18)] transition-all duration-500 overflow-hidden bg-white dark:bg-neutral-900`}>
      <CardHeader className="pb-6 bg-gradient-to-br from-emerald-500 via-teal-500 to-green-500 relative overflow-hidden">
        {/* Decorative gradient orbs */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        
        <CardTitle className="text-xl font-bold flex items-center gap-3 text-white relative z-10">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg transform hover:rotate-12 hover:scale-110 transition-all duration-300">
            <DollarSign className="w-6 h-6" />
          </div>
          Financial Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 bg-gradient-to-b from-neutral-50/50 to-white dark:from-neutral-900/50 dark:to-neutral-900 pt-6">
        {/* Financial Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse p-6 rounded-lg bg-neutral-100 dark:bg-neutral-800/50"
              >
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 mb-3" />
                <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3 mb-2" />
                <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Net Profit Card */}
            <Card className="group bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-0 shadow-lg hover:shadow-2xl dark:from-emerald-950/40 dark:via-green-950/40 dark:to-teal-950/40 transition-all duration-500 hover:-translate-y-1 overflow-hidden relative">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-green-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mb-2 uppercase tracking-wider">
                      Net Profit
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-green-700 dark:from-emerald-300 dark:to-green-300 bg-clip-text text-transparent">
                      {formatCurrency(data.netProfit)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-xs text-green-700 dark:text-green-400">
                  This month
                </div>
              </CardContent>
            </Card>

            {/* Monthly Expenses Card */}
            <Card className="group bg-gradient-to-br from-rose-50 via-red-50 to-pink-50 border-0 shadow-lg hover:shadow-2xl dark:from-rose-950/40 dark:via-red-950/40 dark:to-pink-950/40 transition-all duration-500 hover:-translate-y-1 overflow-hidden relative">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-rose-400/20 to-red-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-rose-700 dark:text-rose-300 mb-2 uppercase tracking-wider">
                      Monthly Expenses
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-rose-700 to-red-700 dark:from-rose-300 dark:to-red-300 bg-clip-text text-transparent">
                      {formatCurrency(data.totalExpenses)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                </div>
                {data.expenseAlerts > 0 && (
                  <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                    This month
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Health Card */}
            <Card className="group bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 border-0 shadow-lg hover:shadow-2xl dark:from-blue-950/40 dark:via-cyan-950/40 dark:to-sky-950/40 transition-all duration-500 hover:-translate-y-1 overflow-hidden relative">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-2 uppercase tracking-wider">
                      Financial Health
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-cyan-700 dark:from-blue-300 dark:to-cyan-300 bg-clip-text text-transparent">
                      {data.financialHealth}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-400">
                  Margin: {data.profitMargin.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Unable to load financial data</p>
          </div>
        )}

        {/* Income to Profit Flow Chart */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Income to Profit Flow Analysis</h3>
          {chartLoading ? (
            <div className="h-[300px] sm:h-[400px] flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 rounded-lg">
              <div className="text-sm text-neutral-500">Loading chart...</div>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveChartContainer>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart 
                  data={chartData} 
                  margin={chartConfig.margins}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={formatMonthLabel}
                    tick={{ fontSize: chartConfig.fontSize }}
                    className="text-xs sm:text-sm"
                  >
                    {chartConfig.showLabels && (
                      <Label value="Period" offset={-5} position="insideBottom" />
                    )}
                  </XAxis>
                  <YAxis
                    domain={[0, (dataMax: number) => {
                      if (!isFinite(dataMax) || dataMax <= 0) return 100;
                      const buffer = dataMax * 0.1;
                      const maxWithBuffer = dataMax + buffer;
                      if (!isFinite(maxWithBuffer) || maxWithBuffer <= 0) return 100;
                      const magnitude = Math.pow(10, Math.floor(Math.log10(maxWithBuffer)));
                      if (!isFinite(magnitude) || magnitude <= 0) return Math.ceil(maxWithBuffer);
                      return Math.ceil(maxWithBuffer / magnitude) * magnitude;
                    }]}
                    tick={{ fontSize: chartConfig.fontSize }}
                    className="text-xs sm:text-sm"
                    width={screenSize === "mobile" ? 50 : 75}
                  >
                    {chartConfig.showLabels && (
                      <Label 
                        value={`Amount (${currency})`} 
                        angle={-90} 
                        position="insideLeft" 
                        style={{ textAnchor: 'middle' }} 
                      />
                    )}
                  </YAxis>
                  <RechartsTooltip 
                    formatter={(value: number) => [`${currency} ${value.toLocaleString()}`, 'Amount']}
                    contentStyle={{
                      fontSize: screenSize === "mobile" ? '11px' : '14px',
                      padding: screenSize === "mobile" ? '6px 8px' : '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--background))'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: screenSize === "mobile" ? '8px' : '20px',
                      fontSize: screenSize === "mobile" ? '11px' : '14px'
                    }}
                    iconSize={screenSize === "mobile" ? 12 : 14}
                  />
                  <Bar 
                    key="income-bar"
                    dataKey="income" 
                    fill="#8b5cf6" 
                    name="Income"
                    radius={screenSize === "mobile" ? [2, 2, 0, 0] : [4, 4, 0, 0]}
                  />
                  <Bar 
                    key="expense-bar"
                    dataKey="expense" 
                    fill="#f97316" 
                    name="Expenses"
                    radius={screenSize === "mobile" ? [2, 2, 0, 0] : [4, 4, 0, 0]}
                  />
                  <Line 
                    key="profit-line"
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#10b981" 
                    strokeWidth={chartConfig.strokeWidth}
                    name="Net Profit"
                    dot={{ r: screenSize === "mobile" ? 3 : 4 }}
                    activeDot={{ r: screenSize === "mobile" ? 5 : 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ResponsiveChartContainer>
          ) : (
            <div className="h-[300px] sm:h-[400px] flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 rounded-lg">
              <div className="text-sm text-neutral-500">No chart data available</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default FinancialSnapshot;
