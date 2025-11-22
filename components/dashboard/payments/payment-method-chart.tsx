"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card";
import { Badge } from "@/components/dashboard/ui/badge";
import { CreditCard } from "lucide-react";

interface PaymentMethodChartProps {
  distribution: { [key: string]: number };
}

const COLORS: { [key: string]: string } = {
  "One Time": "bg-green-500",
  "One Time With Installments": "bg-blue-500",
  "Custom EMI": "bg-orange-500",
  "Monthly Subscription": "bg-purple-500",
  "Monthly Subscription With Discounts": "bg-pink-500",
  "Not Set": "bg-gray-400"
};

export function PaymentMethodChart({ distribution }: PaymentMethodChartProps) {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  
  const sortedData = Object.entries(distribution)
    .sort(([, a], [, b]) => b - a)
    .map(([method, count]) => ({
      method,
      count,
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : "0"
    }));

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <CreditCard className="h-5 w-5" />
          Payment Methods Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedData.map(({ method, count, percentage }) => (
            <div key={method} className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">{method}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 font-medium">{count} students</span>
                  <Badge variant="secondary" className="font-semibold">{percentage}%</Badge>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                <div
                  className={`h-3 rounded-full ${COLORS[method] || "bg-gray-500"} transition-all duration-500 ease-out shadow-sm`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 text-right">
                {method === "Not Set" ? "Payment method not configured" : 
                 `${count} of ${total} students (${percentage}%)`}
              </div>
            </div>
          ))}
        </div>
        
        {sortedData.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No payment method data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
