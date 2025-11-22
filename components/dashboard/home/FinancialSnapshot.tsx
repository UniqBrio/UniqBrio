"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
  Wallet,
  CreditCard,
  PiggyBank,
} from "lucide-react";

interface FinancialData {
  todayRevenue: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  netProfit: number;
  profitMargin: number;
  revenueChange: number;
  expenseAlerts: number;
  pendingPayments: number;
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
  const [loading, setLoading] = useState(true);

  // Role-based access control
  const hasAccess = ["Admin", "Staff", "SuperAdmin"].includes(userRole);

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }

    // TODO: Fetch real financial data from /api/financial/metrics
    // For now using mock data
    const fetchFinancialData = async () => {
      try {
        // Simulating API call
        setTimeout(() => {
          const mockData: FinancialData = {
            todayRevenue: 12450,
            monthlyRevenue: 285600,
            monthlyExpenses: 178400,
            netProfit: 107200,
            profitMargin: 37.5,
            revenueChange: 12.4,
            expenseAlerts: 2,
            pendingPayments: 5,
          };
          setData(mockData);
          setLoading(false);
        }, 600);
      } catch (error) {
        console.error("Error fetching financial data:", error);
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [hasAccess]);

  if (!hasAccess) {
    return null; // Don't render for unauthorized roles
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  return (
    <Card
      className={`${className} border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
              <DollarSign className="w-4 h-4" />
            </div>
            Financial Overview
          </CardTitle>
          <a
            href="/dashboard/financials"
            className="text-sm text-green-600 dark:text-green-400 hover:underline font-medium flex items-center gap-1"
          >
            View Details
            <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse p-4 rounded-lg bg-white/50 dark:bg-neutral-800/50"
              >
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 mb-2" />
                <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : data ? (
          <div className="space-y-4">
            {/* Today's Revenue Highlight */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium opacity-90">
                  Today's Revenue
                </span>
                <Wallet className="w-5 h-5 opacity-80" />
              </div>
              <div className="text-3xl font-bold mb-1">
                {formatCurrency(data.todayRevenue)}
              </div>
              <div className="text-xs opacity-80">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>

            {/* Monthly Overview Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Monthly Revenue */}
              <div className="p-4 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                  Monthly Revenue
                </p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {formatCurrency(data.monthlyRevenue)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    {formatPercentage(data.revenueChange)}
                  </span>
                </div>
              </div>

              {/* Monthly Expenses */}
              <div className="p-4 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                  Monthly Expenses
                </p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {formatCurrency(data.monthlyExpenses)}
                </p>
                {data.expenseAlerts > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3 h-3 text-orange-600" />
                    <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                      {data.expenseAlerts} alerts
                    </span>
                  </div>
                )}
              </div>

              {/* Net Profit */}
              <div className="p-4 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                    <PiggyBank className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                  Net Profit
                </p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(data.netProfit)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">
                    Margin: {data.profitMargin}%
                  </span>
                </div>
              </div>

              {/* Pending Payments */}
              <div className="p-4 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                  Pending Payments
                </p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {data.pendingPayments}
                </p>
                <a
                  href="/dashboard/financials"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                >
                  Review ?
                </a>
              </div>
            </div>

            {/* Profit Margin Indicator */}
            <div className="p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Financial Health
                </span>
                <span
                  className={`text-xs font-bold ${
                    data.profitMargin > 30
                      ? "text-green-600 dark:text-green-400"
                      : data.profitMargin > 15
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {data.profitMargin > 30
                    ? "Excellent"
                    : data.profitMargin > 15
                    ? "Good"
                    : "Needs Attention"}
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    data.profitMargin > 30
                      ? "bg-gradient-to-r from-green-500 to-emerald-500"
                      : data.profitMargin > 15
                      ? "bg-gradient-to-r from-amber-500 to-yellow-500"
                      : "bg-gradient-to-r from-red-500 to-orange-500"
                  }`}
                  style={{ width: `${Math.min(data.profitMargin * 2, 100)}%` }}
                />
              </div>
            </div>

            {/* Quick Action */}
            <a
              href="/dashboard/financials"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500 shadow-md hover:shadow-lg transition-all"
            >
              <DollarSign className="w-4 h-4" />
              View Complete Financial Dashboard
            </a>
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Unable to load financial data</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FinancialSnapshot;
