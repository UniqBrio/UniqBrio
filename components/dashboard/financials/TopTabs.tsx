"use client"

import Image from "next/image"
import { Tabs, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"

import { LayoutDashboard, CreditCard , Wallet, FileText, Calculator, TrendingUp } from "lucide-react"
import "./top-tabs.css"

type TopTabKey = 'dashboard' | 'income' | 'expense' | 'report' | 'roi' | 'forecast'

export function TopTabs({ value, onChange }: { value: TopTabKey, onChange: (v: TopTabKey) => void }) {
  return (
    <div className="w-full">
      <Tabs value={value} onValueChange={(v) => onChange(v as TopTabKey)} className="space-y-2 tabs-top">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-transparent border-0 p-0">
          <TabsTrigger value="dashboard" className="tab-trigger">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="income" className="tab-trigger">
            <CreditCard className="w-4 h-4 mr-2" />
            Income
          </TabsTrigger>
          <TabsTrigger value="expense" className="tab-trigger">
            <Wallet className="w-4 h-4 mr-2" />
            Expense
          </TabsTrigger>
          <TabsTrigger value="report" className="tab-trigger">
            <FileText className="w-4 h-4 mr-2" />
            Report
          </TabsTrigger>
          <TabsTrigger value="roi" className="tab-trigger coming-soon">
            <Calculator className="w-4 h-4 mr-2" />
            <span className="inline-flex items-center gap-2">ROI Analysis <Image src="/Coming soon.svg" alt="Coming Soon" width={12} height={12} className="inline-block" /></span>
          </TabsTrigger>
          <TabsTrigger value="forecast" className="tab-trigger coming-soon">
            <TrendingUp className="w-4 h-4 mr-2" />
            <span className="inline-flex items-center gap-2">Forecasting <Image src="/Coming soon.svg" alt="Coming Soon" width={12} height={12} className="inline-block" /></span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
