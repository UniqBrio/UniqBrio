
"use client"

import React from "react";
import Image from "next/image"
import { useCurrency } from "@/contexts/currency-context"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/dashboard/ui/card"
import { Label } from "@/components/dashboard/ui/label"
import { Button } from "@/components/dashboard/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { TIMEFRAMES } from "./types"
import { FormattedDateInput } from "@/components/dashboard/ui/formatted-date-input"

interface ReportsSectionProps {
  statsTimeframe: string
  setStatsTimeframe: (value: string) => void
  customStartDate: string
  setCustomStartDate: (value: string) => void
  customEndDate: string
  setCustomEndDate: (value: string) => void
}

export function ReportsSection({
  statsTimeframe,
  setStatsTimeframe,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate
}: ReportsSectionProps) {
  const { currency } = useCurrency();
  // State for error message
  const [dateError, setDateError] = React.useState<string>("");
  const [recordCountError, setRecordCountError] = React.useState<string>("");
  // Backend report data
  type ReportItem = {
    type: 'Income' | 'Expense'
    date: string
    description: string
    category: string
    source?: string
    vendorName?: string
    fromAccount?: string
    toAccount?: string
    paymentMode?: string
    amount: number
  }
  const [reportItems, setReportItems] = React.useState<ReportItem[]>([])
  const [totals, setTotals] = React.useState<{ income: number; expense: number; balance: number } | null>(null)
  const [isCheckingRecordCount, setIsCheckingRecordCount] = React.useState<boolean>(false)

  // Validate start and end date
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    setRecordCountError(""); // Clear record count error when date changes
    if (customEndDate && newStart > customEndDate) {
      setDateError("Start Date cannot be after End Date");
    } else {
      setDateError("");
      setCustomStartDate(newStart);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = e.target.value;
    setRecordCountError(""); // Clear record count error when date changes
    if (customStartDate && newEnd < customStartDate) {
      setDateError("End Date cannot be before Start Date");
    } else {
      setDateError("");
      setCustomEndDate(newEnd);
    }
  };

  const handleTimeframeChange = (value: string) => {
    setRecordCountError(""); // Clear record count error when timeframe changes
    setStatsTimeframe(value);
  };

  // Fetch backend data when user clicks download to ensure freshest snapshot
  const fetchReport = async () => {
    const params = new URLSearchParams();
    params.set('timeframe', statsTimeframe || 'monthly');
    if (statsTimeframe === 'custom') {
      if (customStartDate) params.set('start', customStartDate);
      if (customEndDate) params.set('end', customEndDate);
    }
    const res = await fetch(`/api/dashboard/financial/financials/reports/profit-loss?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load report');
    const data = await res.json();
    setReportItems(data.items || []);
    setTotals(data.totals || null);
    return data as { items: ReportItem[]; totals: { income: number; expense: number; balance: number } };
  }

  const handleProfitLossDownload = async () => {
    setIsCheckingRecordCount(true);
    setRecordCountError("");
    
    try {
      const data = await fetchReport();
      const items = data.items || [];
      
      // Check if record count exceeds 1 lakh (100,000)
      if (items.length > 100000) {
        setRecordCountError(`Too many records (${items.length.toLocaleString()}). Please select a smaller time range. Maximum allowed: 1,00,000 records.`);
        setIsCheckingRecordCount(false);
        return;
      }
      
      if (!items.length) {
        setIsCheckingRecordCount(false);
        return;
      }

      // Map mockData to the required columns and calculate running balance
      const columns = [
        'Date',
        'Description',
        'Category',
        'Source',
        'Vendor Name',
        'From Account',
        'To Account',
        'Payment Mode',
        `Income Amount (${currency})`,
        `Expense Amount (${currency})`,
        `Overall Balance (${currency})`
      ];

      let runningBalance = 0;
      const rows = items.map(row => {
        const date = row.date || '';
        const description = row.description || '';
        const category = row.category || '';
        const source = row.source || '';
        const vendorName = row.vendorName || '';
        const fromAccount = row.fromAccount || '';
        const toAccount = row.toAccount || '';
        const paymentMode = row.paymentMode || '';
        let income = '', expense = '';
        if (row.type === 'Income') {
          income = Number(row.amount).toFixed(2);
          runningBalance += Number(row.amount);
        } else {
          expense = Number(row.amount).toFixed(2);
          runningBalance -= Number(row.amount);
        }
        const balance = runningBalance.toFixed(2);
        return [date, description, category, source, vendorName, fromAccount, toAccount, paymentMode, income, expense, balance];
      });

      // Calculate totals
      const totalIncome = items.filter(r => r.type === 'Income').reduce((sum, r) => sum + Number(r.amount), 0).toFixed(2);
      const totalExpense = items.filter(r => r.type === 'Expense').reduce((sum, r) => sum + Number(r.amount), 0).toFixed(2);
      const finalBalance = (Number(totalIncome) - Number(totalExpense)).toFixed(2);

      // Add empty rows for visual spacing (like screenshot)
      while (rows.length < 12) {
        rows.push(Array(columns.length).fill(''));
      }

      // Add Total row
      // Place 'Total' label under Payment Mode, totals for income & expense, and final balance
      const totalRow = Array(columns.length).fill('');
      totalRow[columns.indexOf('Payment Mode')] = 'Total';
      totalRow[columns.indexOf(`Income Amount (${currency})`)] = totalIncome;
      totalRow[columns.indexOf(`Expense Amount (${currency})`)] = totalExpense;
      totalRow[columns.indexOf(`Overall Balance (${currency})`)] = finalBalance;
      rows.push(totalRow);

      // CSV content
      const csvRows = [columns.join(',')].concat(rows.map(r => r.map(cell => `"${cell}"`).join(',')));
      const csvContent = csvRows.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'profit_loss_report.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading report:', error);
      setRecordCountError('Failed to download report. Please try again.');
    } finally {
      setIsCheckingRecordCount(false);
    }
  }

  return (
    
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <CardTitle>Financial Statements & Reports</CardTitle>
              <CardDescription>Access and download financial reports</CardDescription>
            </div>
            <div className="w-full lg:w-auto">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="reports-timeframe" className="text-sm font-medium">Timeframe</Label>
                  <Select value={statsTimeframe} onValueChange={handleTimeframeChange}>
                    <SelectTrigger className="w-full md:w-[160px]" id="reports-timeframe">
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEFRAMES.map(tf => (
                        <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {statsTimeframe === "custom" && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-2 md:mt-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <FormattedDateInput
                        id="reports-start-date"
                        label="Start Date"
                        value={customStartDate}
                        onChange={(date) => handleStartDateChange({ target: { value: date } } as React.ChangeEvent<HTMLInputElement>)}
                        max={customEndDate || new Date().toISOString().split('T')[0]}
                        className="w-full sm:w-[160px]"
                      />
                      <FormattedDateInput
                        id="reports-end-date"
                        label="End Date"
                        value={customEndDate}
                        onChange={(date) => handleEndDateChange({ target: { value: date } } as React.ChangeEvent<HTMLInputElement>)}
                        min={customStartDate || undefined}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full sm:w-[160px]"
                      />
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <div className="h-5"> {/* Reserve space for error message */}
                    {dateError && (
                      <div className="text-red-500 text-xs">{dateError}</div>
                    )}
                    {recordCountError && (
                      <div className="text-red-500 text-xs">{recordCountError}</div>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    disabled
                    className="w-full md:w-auto"
                    // Download All disabled per request; handler removed to prevent accidental trigger
                  >
                    Download All
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Download Report buttons now export mock CSV data for each report */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Profit & Loss</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-white mb-4">Income, expenses, and net profit</p>
                {recordCountError && (
                  <div className="text-red-500 text-xs mb-3 p-2 bg-red-50 rounded border">
                    {recordCountError}
                  </div>
                )}
                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={handleProfitLossDownload}
                  disabled={
                    isCheckingRecordCount || 
                    (statsTimeframe === 'custom' && (!!dateError || !customStartDate || !customEndDate))
                  }
                >
                  {isCheckingRecordCount ? 'Checking Records...' : 'Download Report'}
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base inline-flex items-center gap-2">Balance Sheet <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block" /></CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-white mb-4">View assets, liabilities, and equity</p>
                <Button variant="outline" className="w-full" disabled>
                  Download Report
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base inline-flex items-center gap-2">Cash Flow <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block" /></CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-white mb-4">Track money movement in your business</p>
                <Button variant="outline" className="w-full" disabled>
                  Download Report
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base inline-flex items-center gap-2">Tax Summary <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block" /></CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-white mb-4">GST, TDS, and other tax reports</p>
                <Button variant="outline" className="w-full" disabled>
                  Download Report
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base inline-flex items-center gap-2">Salary Reports <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block" /></CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-white mb-4">Staff salary and payout reports</p>
                <Button variant="outline" className="w-full" disabled>
                  Download Report
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base inline-flex items-center gap-2">Custom Reports <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block" /></CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-white mb-4">Generate custom financial reports</p>
                <Button variant="outline" className="w-full" disabled>
                  Create Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

  )
}