"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card";
import { useCurrency } from "@/contexts/currency-context";
import { useCustomColors } from "@/lib/use-custom-colors";
import { BookOpen } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

interface RevenueBySourceChartProps {
  data: Array<{
    courseId: string;
    courseName: string;
    amount: number;
  }>;
}

export function RevenueBySourceChart({ data }: RevenueBySourceChartProps) {
  const { currency } = useCurrency();
  const { primaryColor } = useCustomColors();
  // Transform data for the chart - limit to top 3
  const chartData = data.slice(0, 3).map((item) => ({
    course: item.courseId,
    amount: item.amount,
    courseName: item.courseName,
  }));

  // Ensure we have at least some data to display
  const displayData = chartData.length > 0 ? chartData : [
    { course: 'COURSE0003', amount: 0, courseName: 'No Data Available' },
    { course: 'COURSE0005', amount: 0, courseName: 'No Data Available' },
    { course: 'COURSE0004', amount: 0, courseName: 'No Data Available' },
  ];

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: primaryColor }}>
          <BookOpen className="h-5 w-5" />
          Revenue by Source (Top 3)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayData}
              margin={{ top: 30, right: 40, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="course"
                angle={-45}
                textAnchor="end"
                height={80}
                style={{ fontSize: '13px', fontWeight: '500' }}
                label={{ 
                  value: 'Course IDs', 
                  position: 'insideBottom', 
                  offset: -10,
                  style: { fontSize: '14px', fontWeight: '600', fill: '#4B5563' }
                }}
                tick={{ fill: '#374151' }}
              />
              <YAxis
                width={150}
                label={{
                  value: `Revenue (${currency})`,
                  angle: -90,
                  position: 'outside',
                  offset: 25,
                  style: { textAnchor: 'middle', fontSize: '14px', fontWeight: '600', fill: '#4B5563' }
                }}
                style={{ fontSize: '12px', fontWeight: '500' }}
                tick={{ fill: '#374151', dx: -5 }}
                tickFormatter={(value) => `${currency} ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: any, name: string, props: any) => {
                  const courseName = props.payload?.courseName || 'Unknown Course';
                  return [
                    <div key="revenue-tooltip" className="space-y-0">
                      <div className="text-[10px] font-semibold" style={{ color: primaryColor }}>{courseName}</div>
                      <div className="text-xs font-bold">{currency} {value.toLocaleString()}</div>
                    </div>,
                    ''
                  ];
                }}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  padding: '6px 8px',
                  minWidth: '100px',
                }}
              />
              <Bar dataKey="amount" fill="url(#revenueGradient)" radius={[8, 8, 0, 0]}>
                <LabelList
                  dataKey="amount"
                  position="top"
                  formatter={(value: number) => value > 0 ? `${currency} ${value.toLocaleString()}` : `${currency} 0`}
                  style={{ fontSize: '12px', fontWeight: '600', fill: '#4B5563' }}
                />
              </Bar>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={primaryColor} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={primaryColor} stopOpacity={0.7} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Course Details Section */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-white mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Course Details
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {displayData.map((item, index) => (
              <div key={item.course} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded font-mono" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                    {item.course}
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-white">
                    {item.courseName}
                  </span>
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {currency} {item.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          {displayData.every(item => item.amount === 0) && (
            <div className="text-center py-4 text-gray-500 dark:text-white text-sm">
              No revenue data available for courses
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
