"use client"

import Image from "next/image"
import { Tabs, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"

import { LayoutDashboard, CreditCard , Wallet, FileText, Calculator, TrendingUp } from "lucide-react"
import "./top-tabs.css"

type TopTabKey = 'dashboard' | 'income' | 'expense' | 'report' | 'roi' | 'forecast'

export function TopTabs({ value, onChange }: { value: TopTabKey, onChange: (v: TopTabKey) => void }) {
  return (
    <div className="w-full">
      <Tabs value={value} onValueChange={(v) => onChange(v as TopTabKey)} className="space-y-2 tabs-top w-full overflow-hidden">
        <TabsList className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-1 sm:gap-2 bg-transparent border-0 p-0 w-full min-h-0">
          <TabsTrigger value="dashboard" className="tab-trigger min-w-0 flex-1">
            <LayoutDashboard className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
            <span className="text-[10px] sm:text-xs lg:text-sm truncate">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="income" className="tab-trigger min-w-0 flex-1">
            <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
            <span className="text-[10px] sm:text-xs lg:text-sm truncate">Income</span>
          </TabsTrigger>
          <TabsTrigger value="expense" className="tab-trigger min-w-0 flex-1">
            <Wallet className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
            <span className="text-[10px] sm:text-xs lg:text-sm truncate">Expense</span>
          </TabsTrigger>
          <TabsTrigger value="report" className="tab-trigger min-w-0 flex-1">
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
            <span className="text-[10px] sm:text-xs lg:text-sm truncate">Report</span>
          </TabsTrigger>
          <TabsTrigger value="roi" className="tab-trigger coming-soon min-w-0 flex-1">
            <Calculator className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs lg:text-sm min-w-0">
              <span className="hidden sm:inline truncate">ROI Analysis</span>
              <span className="sm:hidden truncate">ROI</span>
              <Image src="/Coming soon.svg" alt="Coming Soon" width={8} height={8} className="sm:w-2 sm:h-2 lg:w-3 lg:h-3 flex-shrink-0" />
            </span>
          </TabsTrigger>
          <TabsTrigger value="forecast" className="tab-trigger coming-soon min-w-0 flex-1">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs lg:text-sm min-w-0">
              <span className="hidden sm:inline truncate">Forecasting</span>
              <span className="sm:hidden truncate">Forecast</span>
              <Image src="/Coming soon.svg" alt="Coming Soon" width={8} height={8} className="sm:w-2 sm:h-2 lg:w-3 lg:h-3 flex-shrink-0" />
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
