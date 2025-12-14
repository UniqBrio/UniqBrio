"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card";
import { TrendingUp } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";
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

interface PaymentCategory {
  count: number;
  totalToBePaid: number;
  courseFees: number;
  courseRegFees: number;
  studentRegFees: number;
  totalPaid: number;
}

interface PaymentCompletionChartProps {
  distribution: {
    oneTime: PaymentCategory;
    oneTimeWithInstallments: PaymentCategory;
    monthly: PaymentCategory;
    monthlyWithDiscounts: PaymentCategory;
    emi: PaymentCategory;
    other: PaymentCategory;
  };
}

export function PaymentCompletionChart({ distribution }: PaymentCompletionChartProps) {
  const { currency } = useCurrency();
  // Safely extract data with fallbacks
  const safeDistribution = {
    oneTime: distribution?.oneTime || { count: 0, totalToBePaid: 0, courseFees: 0, courseRegFees: 0, studentRegFees: 0, totalPaid: 0 },
    oneTimeWithInstallments: distribution?.oneTimeWithInstallments || { count: 0, totalToBePaid: 0, courseFees: 0, courseRegFees: 0, studentRegFees: 0, totalPaid: 0 },
    monthly: distribution?.monthly || { count: 0, totalToBePaid: 0, courseFees: 0, courseRegFees: 0, studentRegFees: 0, totalPaid: 0 },
    monthlyWithDiscounts: distribution?.monthlyWithDiscounts || { count: 0, totalToBePaid: 0, courseFees: 0, courseRegFees: 0, studentRegFees: 0, totalPaid: 0 },
    emi: distribution?.emi || { count: 0, totalToBePaid: 0, courseFees: 0, courseRegFees: 0, studentRegFees: 0, totalPaid: 0 },
    other: distribution?.other || { count: 0, totalToBePaid: 0, courseFees: 0, courseRegFees: 0, studentRegFees: 0, totalPaid: 0 },
  };

  const chartData = [
    {
      category: "One Time",
      students: safeDistribution.oneTime.count,
      totalToBePaid: safeDistribution.oneTime.totalToBePaid,
      courseFees: safeDistribution.oneTime.courseFees,
      courseRegFees: safeDistribution.oneTime.courseRegFees,
      studentRegFees: safeDistribution.oneTime.studentRegFees,
      totalPaid: safeDistribution.oneTime.totalPaid,
    },
    {
      category: "One Time With Installments",
      students: safeDistribution.oneTimeWithInstallments.count,
      totalToBePaid: safeDistribution.oneTimeWithInstallments.totalToBePaid,
      courseFees: safeDistribution.oneTimeWithInstallments.courseFees,
      courseRegFees: safeDistribution.oneTimeWithInstallments.courseRegFees,
      studentRegFees: safeDistribution.oneTimeWithInstallments.studentRegFees,
      totalPaid: safeDistribution.oneTimeWithInstallments.totalPaid,
    },
    {
      category: "Monthly",
      students: safeDistribution.monthly.count,
      totalToBePaid: safeDistribution.monthly.totalToBePaid,
      courseFees: safeDistribution.monthly.courseFees,
      courseRegFees: safeDistribution.monthly.courseRegFees,
      studentRegFees: safeDistribution.monthly.studentRegFees,
      totalPaid: safeDistribution.monthly.totalPaid,
    },
    {
      category: "Monthly + Discounts",
      students: safeDistribution.monthlyWithDiscounts.count,
      totalToBePaid: safeDistribution.monthlyWithDiscounts.totalToBePaid,
      courseFees: safeDistribution.monthlyWithDiscounts.courseFees,
      courseRegFees: safeDistribution.monthlyWithDiscounts.courseRegFees,
      studentRegFees: safeDistribution.monthlyWithDiscounts.studentRegFees,
      totalPaid: safeDistribution.monthlyWithDiscounts.totalPaid,
    },
    {
      category: "EMI",
      students: safeDistribution.emi.count,
      totalToBePaid: safeDistribution.emi.totalToBePaid,
      courseFees: safeDistribution.emi.courseFees,
      courseRegFees: safeDistribution.emi.courseRegFees,
      studentRegFees: safeDistribution.emi.studentRegFees,
      totalPaid: safeDistribution.emi.totalPaid,
    },
    {
      category: "Other",
      students: safeDistribution.other.count,
      totalToBePaid: safeDistribution.other.totalToBePaid,
      courseFees: safeDistribution.other.courseFees,
      courseRegFees: safeDistribution.other.courseRegFees,
      studentRegFees: safeDistribution.other.studentRegFees,
      totalPaid: safeDistribution.other.totalPaid,
    },
  ];

  // Filter out categories with no students, but ensure we have at least something to show
  const displayData = chartData.filter(item => item.students > 0);
  
  // If no data, create sample data to show the chart structure
  const finalData = displayData.length > 0 ? displayData : [
    { 
      category: "No Payment Data", 
      students: 0, 
      totalToBePaid: 0, 
      courseFees: 0, 
      courseRegFees: 0, 
      studentRegFees: 0, 
      totalPaid: 0 
    }
  ];

  const formatCurrency = (amount: number) => {
    if (!currency) {
      return amount.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    }
    return `${currency} ${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <TrendingUp className="h-5 w-5" />
          Payment Category Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={finalData}
              margin={{ top: 25, right: 30, left: 90, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="category"
                angle={-45}
                textAnchor="end"
                height={100}
                style={{ fontSize: '12px', fontWeight: '500' }}
                label={{
                  value: 'Payment Categories',
                  position: 'insideBottom',
                  offset: -15,
                  style: { fontSize: '14px', fontWeight: '600', fill: '#4B5563' }
                }}
                tick={{ fill: '#374151' }}
              />
              <YAxis
                width={80}
                label={{
                  value: 'Students',
                  angle: -90,
                  position: 'outside',
                  offset: 15,
                  style: { textAnchor: 'middle', fontSize: '14px', fontWeight: '600', fill: '#4B5563' }
                }}
                allowDecimals={false}
                style={{ fontSize: '12px', fontWeight: '500' }}
                tick={{ fill: '#374151' }}
              />
              <Tooltip
                formatter={(value: any, name: string, props: any) => {
                  if (name === 'students') {
                    const data = props.payload;
                    
                    // Handle no data case
                    if (data.category === "No Payment Data") {
                      return [
                        <div key="tooltip" className="space-y-0.5">
                          <div className="text-xs font-semibold text-gray-600 dark:text-white">No Data</div>
                          <div className="text-[10px] text-gray-500 dark:text-white">
                            No categories assigned
                          </div>
                        </div>,
                        ''
                      ];
                    }
                    
                    const completionRate = data.totalToBePaid > 0 ? 
                      ((data.totalPaid / data.totalToBePaid) * 100).toFixed(1) : '0.0';
                    
                    return [
                      <div key="tooltip" className="space-y-0.5">
                        <div className="text-xs font-semibold">{value} Student{value !== 1 ? 's' : ''}</div>
                        <div className="text-[10px] space-y-0.5">
                          <div>Total Due: {formatCurrency(data.totalToBePaid || 0)}</div>
                          <div>Total Paid: {formatCurrency(data.totalPaid || 0)}</div>
                          <div className={`font-medium ${parseFloat(completionRate) >= 100 ? 'text-green-600' : parseFloat(completionRate) >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                            Completion: {completionRate}%
                          </div>
                        </div>
                      </div>,
                      ''
                    ];
                  }
                  return [value, name];
                }}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  padding: '8px',
                  minWidth: '130px',
                }}
              />
              <Bar dataKey="students" fill="url(#completionGradient)" radius={[8, 8, 0, 0]}>
                <LabelList 
                  dataKey="students" 
                  position="top" 
                  style={{ fontSize: '12px', fontWeight: '600', fill: '#4B5563' }}
                  formatter={(value: number) => value > 0 ? value.toString() : ''}
                />
              </Bar>
              <defs>
                <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#6D28D9" stopOpacity={0.9} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Category Details Section */}
        {displayData.length > 0 && (
          <div className="border-t pt-4 mt-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-white mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Category Details
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {displayData.map((item) => {
                const completionRate = item.totalToBePaid > 0 
                  ? ((item.totalPaid / item.totalToBePaid) * 100).toFixed(1) 
                  : '0.0';
                return (
                  <div key={item.category} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-1 rounded font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                        {item.students} {item.students === 1 ? 'student' : 'students'}
                      </span>
                      <span className="text-sm font-medium text-gray-700 dark:text-white">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        Paid: {formatCurrency(item.totalPaid)}
                      </span>
                      <span className={`font-semibold ${parseFloat(completionRate) >= 100 ? 'text-green-600' : parseFloat(completionRate) >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {completionRate}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {displayData.length === 0 && (
          <div className="text-center text-gray-500 dark:text-white py-8">
            <p className="text-sm">No payment category data available</p>
            <p className="text-xs mt-1">Students may not have payment categories assigned yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
