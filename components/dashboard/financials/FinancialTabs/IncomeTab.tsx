"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/dashboard/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/dashboard/ui/select';
import { Label } from '@/components/dashboard/ui/label';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { formatMonthLabel } from '@/lib/dashboard/utils';

interface IncomeTabProps { incomeFilter: string; setIncomeFilter: (value: string) => void }

export function IncomeTab({ incomeFilter, setIncomeFilter }: IncomeTabProps) {
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
          fetch(`/api/dashboard/financial/financials/charts?${params}`, cacheHeaders),
          fetch(`/api/dashboard/financial/financials/charts/income-categories?${params}`, cacheHeaders),
          fetch(`/api/dashboard/financial/financials/charts/income-sources?${params}`, cacheHeaders)
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
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Income Management & Analysis</CardTitle>
            <CardDescription>Advanced income tracking with category and source analysis</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="year-select" className="text-sm font-medium"></Label>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-48">
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
      <CardContent className="space-y-6">
        {error && <div className="text-red-600 text-sm p-3 bg-red-50 rounded">{error}</div>}
        {loading && <div className="text-sm text-muted-foreground p-3 bg-gray-50 rounded">Loading income data...</div>}
        
        {/* Debug info */}
        {!loading && !error && (
          <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
            Debug: Chart data: {data.length} | Categories: {categoryData.length} | Sources: {sourceData.length} | Top cats: {topPerformers.topCategories.length} | Top sources: {topPerformers.topSources.length}
          </div>
        )}
        
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Income Trend Analysis</h3>
          {data.length === 0 ? (
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded">
              <p className="text-gray-500">No income data available for {selectedYear}</p>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 25, right: 20, bottom: 80, left: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={formatMonthLabel}
                    label={{ value: 'Period', position: 'insideBottom', offset: -30 }}
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
                  <RechartsTooltip formatter={(value: number) => `INR ${value.toLocaleString()}`} />
                  <Area type="monotone" dataKey="income" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} name="Income" label={{ position: 'top', offset: 5, fill: '#8b5cf6', fontSize: 12 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
        {topPerformers.topCategories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4 text-purple-700">Top Income Categories</h3>
              {topPerformers.topCategories.length === 0 ? (
                <div className="text-sm text-gray-500 p-4 text-center">No category data available</div>
              ) : (
                <div className="space-y-3">
                  {topPerformers.topCategories.map(cat => (
                    <div key={cat.category} className="flex justify-between items-center p-3 bg-purple-50 rounded">
                      <span className="font-medium">{cat.category}</span>
                      <div className="text-right">
                        <div className="font-bold text-purple-700">INR {cat.income.toLocaleString()}</div>
                        <div className="text-xs text-purple-600">{cat.count} transactions</div>
                        <div className="text-xs text-purple-600">Avg: INR {cat.avgAmount.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            {topPerformers.topSources.length > 0 && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4 text-orange-700">Top Income Sources</h3>
                <div className="space-y-3">
                  {topPerformers.topSources.map(source => (
                    <div key={source.source} className="flex justify-between items-center p-3 bg-orange-50 rounded">
                      <span className="font-medium">{source.source}</span>
                      <div className="text-right">
                        <div className="font-bold text-orange-700">INR {source.income.toLocaleString()}</div>
                        <div className="text-xs text-orange-600">{source.count} transactions</div>
                        <div className="text-xs text-orange-600">Avg: INR {source.avgAmount.toLocaleString()}</div>
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
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No income data available for {selectedYear}</p>
            <p className="text-sm text-gray-500 mt-2">Income data will appear here once transactions are recorded</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}