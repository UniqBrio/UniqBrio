"use client";

import { useState, useMemo } from "react";
import React from "react";
import { useCurrency } from "@/contexts/currency-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs";
import { Badge } from "@/components/dashboard/ui/badge";
import { type Parent } from "@/types/dashboard/parent";
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  Users, 
  DollarSign,
  Activity
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList
} from "recharts";

interface ParentAnalyticsProps {
  parents: Parent[];
}

function ParentAnalyticsComponent({ parents }: ParentAnalyticsProps) {
  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    parents.forEach(p => {
      if (p.categories && Array.isArray(p.categories)) {
        p.categories.forEach(cat => cats.add(cat));
      }
    });
    return Array.from(cats).sort() as string[];
  }, [parents]);

  const { currency } = useCurrency();

  // Consistent number formatting function
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Top Stats
  const topStats = [
    { 
      title: "Total Parents", 
      value: parents.length, 
      subtitle: "Active & inactive" 
    },
    { 
      title: "Total Revenue", 
      value: `${parents[0]?.currency } ${formatNumber(parents.reduce((sum, p) => sum + (p.amountPaid || 0), 0))}`, 
      subtitle: "Amount collected" 
    },
    { 
      title: "Pending Payments", 
      value: `${parents[0]?.currency } ${formatNumber(parents.reduce((sum, p) => sum + (p.dueAmount || 0), 0))}`, 
      subtitle: "Amount due" 
    },
    { 
      title: "Average Engagement", 
      value: `${(parents.reduce((sum, p) => sum + (p.engagementScore || 0), 0) / Math.max(parents.length, 1)).toFixed(1)}%`, 
      subtitle: "Parent engagement" 
    },
  ];

  const parentStatStyles = [
    { bg: "bg-gradient-to-br from-purple-50 to-purple-100", titleText: "text-purple-700", valueText: "text-purple-900" },
    { bg: "bg-gradient-to-br from-green-50 to-green-100", titleText: "text-green-700", valueText: "text-green-900" },
    { bg: "bg-gradient-to-br from-red-50 to-red-100", titleText: "text-red-700", valueText: "text-red-900" },
    { bg: "bg-gradient-to-br from-blue-50 to-blue-100", titleText: "text-blue-700", valueText: "text-blue-900" },
  ];

  // Parents by Categories
  const categoryChart = useMemo(() => {
    const data = categoriesList.map(category => ({
      category,
      parents: parents.filter(p => p.categories && p.categories.includes(category)).length,
    }));

    const max = data.reduce((m, d) => Math.max(m, d.parents), 0);
    const validMax = Number.isFinite(max) ? max : 0;
    const targetTickCount = 5;
    const roughStep = Math.max(1, Math.ceil(validMax / targetTickCount));
    const logValue = roughStep > 1 ? Math.log10(roughStep) : 0;
    const pow = Number.isFinite(logValue) ? Math.pow(10, Math.floor(logValue)) : 1;
    const norm = Number.isFinite(pow) && pow > 0 ? roughStep / pow : roughStep;
    const niceNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
    const step = Number.isFinite(pow) ? niceNorm * pow : 1;
    const validStep = Number.isFinite(step) && step > 0 ? step : 1;
    const niceMax = validMax > 0 ? Math.max(validStep, Math.ceil(validMax / validStep) * validStep) : validStep;
    const validNiceMax = Number.isFinite(niceMax) && niceMax > 0 ? niceMax : validStep;
    
    const ticks: number[] = [];
    for (let v = 0; v <= validNiceMax; v += validStep) {
      if (Number.isFinite(v)) {
        ticks.push(v);
      }
    }

    return { data, ticks, max: validNiceMax };
  }, [parents, categoriesList]);

  // Payment Status Distribution
  const paymentChart = useMemo(() => {
    const paymentCounts = {
      "Paid": parents.filter(p => p.paymentStatus === "Paid").length,
      "Pending": parents.filter(p => p.paymentStatus === "Pending").length,
      "Overdue": parents.filter(p => p.paymentStatus === "Overdue").length,
    };

    return Object.entries(paymentCounts).map(([status, count]) => ({
      status,
      count,
    }));
  }, [parents]);

  const paymentColors = {
    "Paid": "#10B981",
    "Pending": "#F59E0B",
    "Overdue": "#EF4444",
  };

  // Parents by Status
  const statusChart = useMemo(() => {
    const statusCounts = {
      "Active": parents.filter(p => p.status === "Active").length,
      "Inactive": parents.filter(p => p.status === "Inactive").length,
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      parents: count,
    }));
  }, [parents]);

  // Engagement Score Distribution
  const engagementChart = useMemo(() => {
    const engagementRanges = {
      "0-25": 0,
      "26-50": 0,
      "51-75": 0,
      "76-100": 0,
    };

    parents.forEach(parent => {
      const score = parent.engagementScore;
      if (score <= 25) engagementRanges["0-25"]++;
      else if (score <= 50) engagementRanges["26-50"]++;
      else if (score <= 75) engagementRanges["51-75"]++;
      else engagementRanges["76-100"]++;
    });

    return Object.entries(engagementRanges).map(([range, count]) => ({
      range,
      parents: count,
    }));
  }, [parents]);

  // Monthly Collection Trend
  const collectionTrend = useMemo(() => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    
    const monthlyData = new Map<string, { collected: number; pending: number }>();
    
    // Initialize all months
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      monthlyData.set(key, { collected: 0, pending: 0 });
    }

    // Add data from parents
    parents.forEach(parent => {
      if (parent.lastPaymentDate) {
        const date = new Date(parent.lastPaymentDate);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const existing = monthlyData.get(key);
        if (existing) {
          existing.collected += parent.amountPaid;
          existing.pending += parent.dueAmount;
        }
      }
    });

    return Array.from(monthlyData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, data]) => {
        const [yearStr, monthStr] = key.split('-');
        const year = Number(yearStr);
        const monthIndex = Number(monthStr) - 1;
        const labelDate = new Date(year, monthIndex, 1);
        const label = labelDate.toLocaleString('en-US', { month: 'short' }) + "'" + String(year).slice(-2);
        return { 
          month: label, 
          collected: Math.round(data.collected / 1000), // in thousands for readability
          pending: Math.round(data.pending / 1000) 
        };
      });
  }, [parents]);

  if (!parents || parents.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-white">
        <p className="text-lg">No parent data available for analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" id="parent-analytics-section">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {topStats.map((stat, index) => {
          const style = parentStatStyles[index] ?? parentStatStyles[0];
          return (
            <Card key={index} className={`${style.bg} border shadow-sm`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${style.titleText}`}>{stat.title}</p>
                    <p className={`text-2xl font-bold ${style.valueText}`}>{stat.value}</p>
                    <p className={`text-xs ${style.titleText} opacity-80`}>{stat.subtitle}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="distribution" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 h-auto gap-2">
          <TabsTrigger 
            value="distribution"
            className="text-[#DE7D14] dark:text-orange-400 bg-background dark:bg-gray-900 border-2 border-[#DE7D14] dark:border-orange-600 rounded-lg transition-all duration-150 font-semibold px-5 py-2 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#DE7D14] data-[state=active]:to-[#8B5CF6] data-[state=active]:border-[#8B5CF6] hover:text-white hover:bg-gradient-to-r hover:from-[#DE7D14] hover:to-[#8B5CF6] hover:border-[#8B5CF6] dark:hover:from-orange-600 dark:hover:to-purple-700 focus:outline-none shadow-sm"
          >
            Distribution & Status
          </TabsTrigger>
          <TabsTrigger 
            value="trends"
            className="text-[#DE7D14] dark:text-orange-400 bg-background dark:bg-gray-900 border-2 border-[#DE7D14] dark:border-orange-600 rounded-lg transition-all duration-150 font-semibold px-5 py-2 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#DE7D14] data-[state=active]:to-[#8B5CF6] data-[state=active]:border-[#8B5CF6] hover:text-white hover:bg-gradient-to-r hover:from-[#DE7D14] hover:to-[#8B5CF6] hover:border-[#8B5CF6] dark:hover:from-orange-600 dark:hover:to-purple-700 focus:outline-none shadow-sm"
          >
            Payment & Engagement
          </TabsTrigger>
        </TabsList>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Parents by Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#8A2BE2]">
                  <BarChart3 className="h-4 w-4" />
                  Parents by Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={(() => {
                        const filteredData = categoryChart.data.filter(item => 
                          Number.isFinite(item.parents) && 
                          item.category && 
                          typeof item.category === 'string' &&
                          item.parents >= 0
                        );
                        return filteredData.length > 0 ? filteredData : [{ category: 'No Data', parents: 0 }];
                      })()}
                      margin={{ top: 25, right: 10, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="category" 
                        label={{ value: 'Categories', position: 'insideBottom', offset: 0 }}
                        angle={0}
                        textAnchor="middle"
                        height={60}
                        style={{ fontSize: '11px' }}
                      />
                      <YAxis 
                        label={{ value: 'Parents', angle: -90, position: 'insideLeft', offset: 0 }}
                        allowDecimals={false}
                        domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax) + 1)]}
                      />
                      <Tooltip formatter={(value: any) => [String(value), 'parents']} />
                      <Bar dataKey="parents" fill="url(#categoryGradient)">
                        <LabelList dataKey="parents" position="top" offset={5} />
                      </Bar>
                      <defs>
                        <linearGradient id="categoryGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#9370DB" />
                          <stop offset="100%" stopColor="#8A2BE2" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Payment Status Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#8A2BE2]">
                  <DollarSign className="h-4 w-4" />
                  Payment Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentChart}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.status}: ${entry.count}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {paymentChart.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={paymentColors[entry.status as keyof typeof paymentColors]}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [String(value), 'Count']}
                        labelFormatter={() => ''}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Parents by Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#8A2BE2]">
                  <Activity className="h-4 w-4" />
                  Parents by Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={statusChart}
                      margin={{ top: 25, right: 10, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="status" 
                        label={{ value: 'Status', position: 'insideBottom', offset: 0 }}
                      />
                      <YAxis 
                        label={{ value: 'Parents', angle: -90, position: 'insideLeft', offset: 0 }}
                        allowDecimals={false}
                      />
                      <Tooltip formatter={(value: any) => [String(value), 'parents']} />
                      <Bar dataKey="parents" fill="url(#statusGradient)">
                        <LabelList dataKey="parents" position="top" offset={5} />
                      </Bar>
                      <defs>
                        <linearGradient id="statusGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FF7F50" />
                          <stop offset="100%" stopColor="#FFA07A" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Payment Collection Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#8A2BE2]">
                  <TrendingUp className="h-4 w-4" />
                  Payment Collection (Last 6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={collectionTrend}
                      margin={{ top: 25, right: 10, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -5 }} />
                      <YAxis 
                        label={{ value: 'Amount (000s)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value: any) => `${currency} ${formatNumber(value * 1000)}`}
                        labelFormatter={(label: string) => `${label}`}
                      />
                      <Legend />
                      <Bar dataKey="collected" fill="url(#collectedGradient)" name="Collected">
                        <LabelList dataKey="collected" position="top" offset={5} />
                      </Bar>
                      <Bar dataKey="pending" fill="url(#pendingGradient)" name="Pending">
                        <LabelList dataKey="pending" position="top" offset={5} />
                      </Bar>
                      <defs>
                        <linearGradient id="collectedGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F59E0B" />
                          <stop offset="100%" stopColor="#D97706" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#8A2BE2]">
                  <Users className="h-4 w-4" />
                  Engagement Score Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={engagementChart}
                      margin={{ top: 25, right: 20, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="range" 
                        interval={0}
                        height={50}
                        tickMargin={10}
                        label={{ value: 'Engagement Score', position: 'insideBottom', offset: 0 }} 
                      />
                      <YAxis 
                        label={{ value: 'Parents', angle: -90, position: 'insideLeft' }}
                        allowDecimals={false}
                      />
                      <Tooltip />
                      <Bar dataKey="parents" fill="url(#engagementGradient)">
                        <LabelList dataKey="parents" position="top" offset={5} />
                      </Bar>
                      <defs>
                        <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#DDA0DD" />
                          <stop offset="100%" stopColor="#BA55D3" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export const ParentAnalytics = React.memo(ParentAnalyticsComponent, (prevProps, nextProps) => {
  // Custom comparison: only re-render if parents array length changes or different data
  return prevProps.parents.length === nextProps.parents.length &&
         prevProps.parents === nextProps.parents
});

export default ParentAnalytics;
