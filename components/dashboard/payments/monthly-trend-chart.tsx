"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card";
import { useCurrency } from "@/contexts/currency-context";
import { TrendingUp } from "lucide-react";
import { type MonthlyTrend } from "@/types/dashboard/payment";

interface MonthlyTrendChartProps {
  data: MonthlyTrend[];
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const { currency } = useCurrency();
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  
  // Reverse the data so current month appears at the top
  const reversedData = [...data].reverse();
  
  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <TrendingUp className="h-5 w-5" />
          Revenue Trends (Last 6 Months)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Header row with labels */}
        <div className="flex items-center gap-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          <div className="w-28 text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide">Month</div>
          <div className="flex-1 text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide text-center">Revenue Progress</div>
          <div className="w-36 text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide text-right">Amount ({currency})</div>
        </div>
        
        <div className="space-y-4">
          {reversedData.map((item, index) => {
            const heightPercentage = (item.revenue / maxRevenue) * 100;
            // Current month is now at index 0 (first item) after reversing
            const isCurrentMonth = index === 0;
            
            return (
              <div key={item.month} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-28 text-sm font-semibold text-gray-700 dark:text-white">{item.month}</div>
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out shadow-sm ${
                        isCurrentMonth 
                          ? "bg-gradient-to-r from-purple-500 to-pink-500" 
                          : "bg-gradient-to-r from-blue-400 to-purple-500"
                      }`}
                      style={{ width: `${Math.max(heightPercentage, 2)}%` }}
                    ></div>
                  </div>
                  <div className="w-36 text-sm font-bold text-right text-gray-900 dark:text-white">
                    {currency} {item.revenue.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {data.length === 0 && (
          <div className="text-center text-gray-500 dark:text-white py-8">
            No trend data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
