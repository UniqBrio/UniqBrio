"use client"

import React, { useState } from "react";
import Image from "next/image"
import { useCurrency } from "@/contexts/currency-context"

// Mock forecast data generator
function getForecastData(period: number, type: string) {
  // In a real app, fetch or calculate based on period/type
  // Here, just return some mock data
  const baseIncome = 10000;
  const baseExpense = 7000;
  const data = [];
  for (let i = 1; i <= period; i++) {
    data.push({
      month: `Month ${i}`,
      income: baseIncome + i * 500 + (type === "Income" ? 1000 : 0),
      expense: baseExpense + i * 300 + (type === "Expense" ? 800 : 0),
    });
  }
  return data;
}

const periodOptions = [1, 2, 3];
const typeOptions = ["Income & Expense", "Income", "Expense"];
const compareOptions = ["None", "Previous Period", "Same Period Last Year"];

export function ForecastSection() {
  const { currency } = useCurrency();
  // Coming soon flag – greys out the section & disables controls
  const isComingSoon = true;
  const [period, setPeriod] = useState(3);
  const [type, setType] = useState("Income & Expense");
  const [compare, setCompare] = useState("None");

  const forecastData = getForecastData(period, type);
  let compareData: typeof forecastData | null = null;
  if (compare !== "None") {
    // For demo, just shift period by -1 for previous, or -12 for last year
    const comparePeriod = compare === "Previous Period" ? period : period;
    compareData = getForecastData(compare === "Previous Period" ? period : period, type).map((d) => ({
      ...d,
      income: d.income * 0.95,
      expense: d.expense * 1.05,
    }));
  }

  return (
    <section
      className={"bg-background dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-10 shadow-sm"}
      aria-disabled={isComingSoon}
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
        <span className="inline-flex items-center gap-2">Financial Forecast <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block" /></span>
      </h2>
        <p className="text-gray-600 dark:text-white">
          Get a quick projection of your income and expenses for the next {period} month{period > 1 ? "s" : ""}. 
        </p>
        {isComingSoon  }
      </div>
      {/* Greyed content wrapper (everything below heading) */}
      <div className={isComingSoon ? "opacity-60 pointer-events-none" : ""}>
      <div className={`flex flex-wrap gap-4 mb-8`}>
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Forecast Period</label>
          <select
            className="border dark:border-gray-600 rounded px-3 py-2 bg-background dark:bg-gray-800 text-foreground disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 dark:text-white"
            value={period}
            onChange={e => setPeriod(Number(e.target.value))}
            disabled={isComingSoon}
          >
            {periodOptions.map(opt => (
              <option key={opt} value={opt}>{opt} Month{opt > 1 ? "s" : ""}</option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Forecast Type</label>
          <select
            className="border dark:border-gray-600 rounded px-3 py-2 bg-background dark:bg-gray-800 text-foreground disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 dark:text-white"
            value={type}
            onChange={e => setType(e.target.value)}
            disabled={isComingSoon}
          >
            {typeOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Compare With</label>
          <select
            className="border dark:border-gray-600 rounded px-3 py-2 bg-background dark:bg-gray-800 text-foreground disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 dark:text-white"
            value={compare}
            onChange={e => setCompare(e.target.value)}
            disabled={isComingSoon}
          >
            {compareOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-background dark:bg-gray-900 rounded shadow text-sm">
          <thead>
            <tr className="bg-purple-100">
              <th className="px-4 py-2 text-left">Month</th>
              {(type === "Income & Expense" || type === "Income") && <th className="px-4 py-2 text-right">Income</th>}
              {(type === "Income & Expense" || type === "Expense") && <th className="px-4 py-2 text-right">Expense</th>}
              <th className="px-4 py-2 text-right">Net</th>
              {compare !== "None" && <th className="px-4 py-2 text-right">Diff</th>}
            </tr>
          </thead>
          <tbody>
            {forecastData.map((row, idx) => {
              const net = row.income - row.expense;
              let diff = null;
              if (compareData) {
                const c = compareData[idx];
                if (c) {
                  const cNet = c.income - c.expense;
                  diff = net - cNet;
                }
              }
              return (
                <tr key={row.month} className="border-b last:border-none">
                  <td className="px-4 py-2">{row.month}</td>
                  {(type === "Income & Expense" || type === "Income") && <td className="px-4 py-2 text-right">{currency} {row.income.toLocaleString()}</td>}
                  {(type === "Income & Expense" || type === "Expense") && <td className="px-4 py-2 text-right">{currency} {row.expense.toLocaleString()}</td>}
                  <td className={`px-4 py-2 text-right font-semibold ${net >= 0 ? "text-green-700" : "text-red-700"}`}>{currency} {net.toLocaleString()}</td>
                  {compare !== "None" && <td className={`px-4 py-2 text-right ${diff && diff < 0 ? "text-red-600" : "text-green-600"}`}>{diff !== null ? (diff >= 0 ? "+" : "") + `${currency} ${diff.toLocaleString()}` : "-"}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex gap-2">
        <button className="btn btn-outline" onClick={() => alert("Export coming soon!")} disabled={isComingSoon}>Export Forecast</button>
        <button className="btn btn-outline" onClick={() => alert("Compare coming soon!")} disabled={isComingSoon || compare === "None"}>Compare Forecasts</button>
      </div>
      <div className="text-xs text-gray-400 dark:text-white mt-4">
        (Forecast is based on mock data. Integrate with real data for production use.)
      </div>
      </div>
    </section>
  );
}
