"use client";
import React, { useState, useEffect } from "react";
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
  const [data, setData] = useState<FinancialData | null>(null);
  const [chartData, setChartData] = useState<Array<{ name: string; income: number; expense: number; profit: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const { screenSize } = useResponsiveBreakpoints();

  // Role-based access control
  const hasAccess = ["Admin", "Staff", "SuperAdmin"].includes(userRole);

  // Responsive chart configurations
  const chartConfig = useResponsiveValue({
    mobile: {
      fontSize: 10,
      margins: { left: 15, right: 5, bottom: 40, top: 5 },
      showLabels: false,
      strokeWidth: 2
    },
    tablet: {
      fontSize: 11,
      margins: { left: 50, right: 15, bottom: 60, top: 20 },
      showLabels: true,
      strokeWidth: 2
    },
    desktop: {
      fontSize: 12,
      margins: { left: 70, right: 20, bottom: 80, top: 25 },
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
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        if (!res.ok) throw new Error(`Chart request failed: ${res.status}`);
        const apiData = await res.json();
        
        console.log('Chart API response:', apiData);
        setChartData(apiData.data || []);
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
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className={`${className} border-neutral-200 dark:border-neutral-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.15)] transition-shadow duration-300`}>
      <CardHeader className="pb-4 bg-gradient-to-br from-emerald-50/80 via-teal-50/60 to-green-50/80 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-green-950/30 rounded-t-lg">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg transform hover:scale-110 transition-transform duration-200">
            <DollarSign className="w-4 h-4" />
          </div>
          Financial Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 bg-gradient-to-b from-white to-neutral-50/50 dark:from-neutral-900 dark:to-neutral-900/50 rounded-b-lg">
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
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950/30 dark:to-green-900/30 dark:border-green-800">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                      Net Profit
                    </p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {formatCurrency(data.netProfit)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-green-200 dark:bg-green-900 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-300" />
                  </div>
                </div>
                <div className="text-xs text-green-700 dark:text-green-400">
                  Margin: {data.profitMargin.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            {/* Monthly Expenses Card */}
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 dark:from-red-950/30 dark:to-red-900/30 dark:border-red-800">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                      Monthly Expenses
                    </p>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                      {formatCurrency(data.totalExpenses)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-red-200 dark:bg-red-900 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-red-600 dark:text-red-300" />
                  </div>
                </div>
                {data.expenseAlerts > 0 && (
                  <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                    ⚠ {data.expenseAlerts} alerts
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Health Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950/30 dark:to-blue-900/30 dark:border-blue-800">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                      Financial Health
                    </p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {data.financialHealth}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-200 dark:bg-blue-900 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                  </div>
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-400">
                  Profit margin {data.profitMargin > 30 ? 'excellent' : data.profitMargin > 15 ? 'good' : 'needs attention'}
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
                    width={screenSize === "mobile" ? 40 : 60}
                  >
                    {chartConfig.showLabels && (
                      <Label 
                        value="Amount (INR)" 
                        angle={-90} 
                        position="insideLeft" 
                        style={{ textAnchor: 'middle' }} 
                      />
                    )}
                  </YAxis>
                  <RechartsTooltip 
                    formatter={(value: number) => [`INR ${value.toLocaleString()}`, 'Amount']}
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
                    dataKey="income" 
                    fill="#8b5cf6" 
                    name="Income"
                    radius={screenSize === "mobile" ? [2, 2, 0, 0] : [4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="expense" 
                    fill="#f97316" 
                    name="Expenses"
                    radius={screenSize === "mobile" ? [2, 2, 0, 0] : [4, 4, 0, 0]}
                  />
                  <Line 
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
