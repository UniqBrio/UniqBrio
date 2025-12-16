"use client";

import React, { useMemo } from 'react';
import { useCurrency } from '@/contexts/currency-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/dashboard/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/dashboard/ui/select';
import { Label } from '@/components/dashboard/ui/label';
import { ComposedChart, Area, Line, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { formatMonthLabel } from '@/lib/dashboard/utils';

interface IncomeTabProps { incomeFilter: string; setIncomeFilter: (value: string) => void }

export function IncomeTab({ incomeFilter, setIncomeFilter }: IncomeTabProps) {
  const { currency } = useCurrency();
  const [data, setData] = React.useState<Array<{ name: string; income: number }>>([]);
  const [categoryData, setCategoryData] = React.useState<Array<{ category: string; income: number; count: number; avgAmount: number; percentage: number }>>([]);
  const [sourceData, setSourceData] = React.useState<Array<{ source: string; income: number; count: number; avgAmount: number }>>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Only year filter
  const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear());

  // Load chart & analysis data
  React.useEffect(() => {
    let abort = false;
    async function load() {
      setLoading(true); setError(null);
      try {
        const params = new URLSearchParams({
          year: selectedYear.toString(),
          _t: Date.now().toString() // Cache busting parameter
        });
        const cacheHeaders = {
          cache: 'no-store' as RequestCache,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        };
        const [chartsRes, categoryRes, sourceRes] = await Promise.all([
          fetch(`/api/dashboard/financial/financials/charts?${params}`, { ...cacheHeaders, credentials: 'include' }),
          fetch(`/api/dashboard/financial/financials/charts/income-categories?${params}`, { ...cacheHeaders, credentials: 'include' }),
          fetch(`/api/dashboard/financial/financials/charts/income-sources?${params}`, { ...cacheHeaders, credentials: 'include' })
        ]);
        console.log('IncomeTab: API responses:', {
          charts: chartsRes.status,
          category: categoryRes.status,
          source: sourceRes.status
        });
        if (!chartsRes.ok) {
          const errorText = await chartsRes.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || chartsRes.statusText };
          }
          console.error('IncomeTab: Charts API error:', { status: chartsRes.status, errorData });
          throw new Error(`Charts API error (${chartsRes.status}): ${errorData.details || errorData.error || chartsRes.statusText || 'Unknown error'}`)
        }
        const chartsJson = await chartsRes.json();
        console.log('IncomeTab: Charts data received:', chartsJson.data?.length, 'items');
        if (!abort) setData(chartsJson.data.map((d: any) => ({ name: d.name, income: d.income })));
        if (categoryRes.ok) {
          const c = await categoryRes.json(); 
          console.log('IncomeTab: Category data received:', c.data?.length, 'items', c.data);
          if (!abort) setCategoryData(c.data);
        }
        if (sourceRes.ok) {
          const s = await sourceRes.json(); 
          console.log('IncomeTab: Source data received:', s.data?.length, 'items', s.data);
          if (!abort) setSourceData(s.data);
        }
      } catch (e: any) {
        if (abort) return;
        console.error('IncomeTab chart loading error:', e);
        console.error('Error details:', {
          message: e.message,
          stack: e.stack,
          name: e.name
        });
        setError(e.message || 'Failed to load income data');
      } finally { if (!abort) setLoading(false); }
    }
    load();
    return () => { abort = true; };
  }, [selectedYear]);

  const topPerformers = useMemo(() => {
    console.log('IncomeTab: Computing topPerformers with:', {
      categoryData: categoryData.length,
      sourceData: sourceData.length,
      categorySample: categoryData[0],
      sourceSample: sourceData[0]
    });
    const sortedCategories = [...categoryData].sort((a, b) => b.income - a.income);
    const sortedSources = [...sourceData].sort((a, b) => b.income - a.income);
    return { topCategories: sortedCategories.slice(0, 5), topSources: sortedSources.slice(0, 5) };
  }, [categoryData, sourceData]);

  return (
    <Card>
      <CardHeader className="pb-4 sm:pb-6 lg:pb-8 px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
          <div className="min-w-0 flex-1 space-y-3 sm:space-y-2">
            <CardTitle className="text-base sm:text-xl lg:text-2xl break-words leading-snug font-bold">Income Management & Analysis</CardTitle>
            <CardDescription className="text-xs sm:text-base leading-relaxed">Advanced income tracking with category and source analysis</CardDescription>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
            <Label htmlFor="year-select" className="text-sm font-medium sr-only">Year Selection</Label>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-full sm:w-48 lg:w-56 min-w-0 h-10 sm:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={(new Date().getFullYear() - 1).toString()}>
                  Last Year ({new Date().getFullYear() - 1})
                </SelectItem>
                <SelectItem value={new Date().getFullYear().toString()}>
                  Current Year ({new Date().getFullYear()})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
        {error && <div className="text-red-600 text-xs sm:text-sm p-2 sm:p-3 bg-red-50 rounded">{error}</div>}
        
       
        
        <Card className="p-3 sm:p-4 lg:p-6 w-full overflow-hidden">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-3 sm:mb-4 break-words">Income Trend Analysis</h3>
          {loading ? (
            <div className="h-60 sm:h-80 flex items-center justify-center bg-gray-50 rounded">
              <p className="text-gray-500 dark:text-white text-sm sm:text-base text-center px-4">Loading income data...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="h-60 sm:h-80 flex items-center justify-center bg-gray-50 rounded">
              <p className="text-gray-500 dark:text-white text-sm sm:text-base text-center px-4">No income data available for {selectedYear}</p>
            </div>
          ) : (
            <div className="h-60 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart 
                  data={data} 
                  margin={{ 
                    top: 25, 
                    right: 20, 
                    bottom: 80, 
                    left: 70 
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={formatMonthLabel}
                    label={{ value: 'Period', position: 'insideBottom', offset: -40 }}
                  />
                  <YAxis
                    domain={[0, (dataMax: number) => {
                      if (!dataMax || dataMax === 0) return 100;
                      const buffer = dataMax * 0.1;
                      const maxWithBuffer = dataMax + buffer;
                      const magnitude = Math.pow(10, Math.floor(Math.log10(maxWithBuffer)));
                      return Math.ceil(maxWithBuffer / magnitude) * magnitude;
                    }]}
                    label={{ value: 'Income', angle: -90, position: 'insideLeft', offset: -30 }}
                  />
                  <RechartsTooltip 
                    formatter={(value: number) => `${currency} ${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.3} 
                    name="Income"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#7c3aed" 
                    strokeWidth={3}
                    dot={{ fill: '#7c3aed', r: 4 }}
                    name="Income Trend"
                    label={{ position: 'top', offset: 5, fill: '#7c3aed', fontSize: 12 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
        {topPerformers.topCategories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            <Card className="p-3 sm:p-4 lg:p-6 w-full overflow-hidden">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-3 sm:mb-4 text-purple-700 break-words">Top Income Categories</h3>
              {topPerformers.topCategories.length === 0 ? (
                <div className="text-xs sm:text-sm text-gray-500 dark:text-white p-3 sm:p-4 text-center">No category data available</div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {topPerformers.topCategories.map(cat => (
                    <div key={cat.category} className="flex justify-between items-center p-2 sm:p-3 bg-purple-50 rounded gap-2">
                      <span className="font-medium text-xs sm:text-sm min-w-0 flex-1 truncate">{cat.category}</span>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-purple-700 text-xs sm:text-sm">{currency} {cat.income.toLocaleString()}</div>
                        <div className="text-[10px] sm:text-xs text-purple-600">{cat.count} transactions</div>
                        <div className="text-[10px] sm:text-xs text-purple-600">Avg: {currency} {cat.avgAmount.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            {topPerformers.topSources.length > 0 && (
              <Card className="p-3 sm:p-4 lg:p-6 w-full overflow-hidden">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-3 sm:mb-4 text-orange-700 break-words">Top Income Sources</h3>
                <div className="space-y-2 sm:space-y-3">
                  {topPerformers.topSources.map(source => (
                    <div key={source.source} className="flex justify-between items-center p-2 sm:p-3 bg-orange-50 rounded gap-2">
                      <span className="font-medium text-xs sm:text-sm min-w-0 flex-1 truncate">{source.source}</span>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-orange-700 text-xs sm:text-sm">{currency} {source.income.toLocaleString()}</div>
                        <div className="text-[10px] sm:text-xs text-orange-600">{source.count} transactions</div>
                        <div className="text-[10px] sm:text-xs text-orange-600">Avg: {currency} {source.avgAmount.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
        
        {/* Show message when no data */}
        {!loading && !error && topPerformers.topCategories.length === 0 && (
          <div className="text-center p-4 sm:p-6 lg:p-8 bg-gray-50 rounded-lg">
            <p className="text-sm sm:text-base text-gray-600 dark:text-white">No income data available for {selectedYear}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-white mt-1 sm:mt-2">Income data will appear here once transactions are recorded</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}