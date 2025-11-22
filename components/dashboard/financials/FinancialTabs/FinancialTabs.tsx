"use client"

import Image from "next/image"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/dashboard/ui/tabs"
import "./financial-tabs.css"
import { OverviewTab } from "./OverviewTab"
import { IncomeTab } from "./IncomeTab"
import { ExpensesTab } from "./ExpensesTab"
import { ROITab } from "./ROITab"
import { ForecastTab } from "./ForecastTab"

interface FinancialTabsProps {
  activeTab: string
  setActiveTab: (value: string) => void
  incomeFilter: string
  setIncomeFilter: (value: string) => void
  expenseFilter: string
  setExpenseFilter: (value: string) => void
  roiFilter: string
  setRoiFilter: (value: string) => void
  forecastPeriod: string
  setForecastPeriod: (value: string) => void
}

export function FinancialTabs({
  activeTab,
  setActiveTab,
  incomeFilter,
  setIncomeFilter,
  expenseFilter,
  setExpenseFilter,
  roiFilter,
  setRoiFilter,
  forecastPeriod,
  setForecastPeriod
}: FinancialTabsProps) {
  return (
    <div className="bg-white shadow-md border-2 border-gray-300 rounded-lg p-4">
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 tabs-purple">
       <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-transparent border-0 p-0">
        <TabsTrigger 
          value="overview" 
          className="text-[#DE7D14] bg-white border-2 border-[#DE7D14] transition-all duration-150 font-semibold data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#DE7D14] data-[state=active]:to-[#8B5CF6] data-[state=active]:border-[#8B5CF6] hover:text-white hover:bg-gradient-to-r hover:from-[#DE7D14] hover:to-[#8B5CF6] hover:border-[#8B5CF6] focus:outline-none"
          
        >
          <span>Overview</span>
        </TabsTrigger>
        <TabsTrigger 
          value="income" 
          className="text-[#DE7D14] bg-white border-2 border-[#DE7D14] transition-all duration-150 font-semibold data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#DE7D14] data-[state=active]:to-[#8B5CF6] data-[state=active]:border-[#8B5CF6] hover:text-white hover:bg-gradient-to-r hover:from-[#DE7D14] hover:to-[#8B5CF6] hover:border-[#8B5CF6] focus:outline-none"
          
        >
          <span>Income</span>
        </TabsTrigger>
        <TabsTrigger 
          value="expenses" 
          className="text-[#DE7D14] bg-white border-2 border-[#DE7D14] transition-all duration-150 font-semibold data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#DE7D14] data-[state=active]:to-[#8B5CF6] data-[state=active]:border-[#8B5CF6] hover:text-white hover:bg-gradient-to-r hover:from-[#DE7D14] hover:to-[#8B5CF6] hover:border-[#8B5CF6] focus:outline-none"
          
        >
          <span>Expenses</span>
        </TabsTrigger>
        <TabsTrigger 
          value="roi" 
          className="tab-trigger"
        >
          <span className="inline-flex items-center gap-2">ROI Analysis <Image src="/Coming soon.svg" alt="Coming Soon" width={12} height={12} className="inline-block" /></span>
        </TabsTrigger>
        <TabsTrigger 
          value="forecast" 
          className="tab-trigger"
        >
          <span className="inline-flex items-center gap-2">Forecasting <Image src="/Coming soon.svg" alt="Coming Soon" width={12} height={12} className="inline-block" /></span>
        </TabsTrigger>      </TabsList>

      <TabsContent value="overview">
       
          
          <OverviewTab />
        
      </TabsContent>

      <TabsContent value="income">
     
          
          <IncomeTab 
            incomeFilter={incomeFilter}
            setIncomeFilter={setIncomeFilter}
          />
        
      </TabsContent>

      <TabsContent value="expenses">

       
          <ExpensesTab 
            expenseFilter={expenseFilter}
            setExpenseFilter={setExpenseFilter}
          />
       
      </TabsContent>

      <TabsContent value="roi">
        
          
          <ROITab 
            roiFilter={roiFilter}
            setRoiFilter={setRoiFilter}
          />
        
      </TabsContent>

      <TabsContent value="forecast">
        
          
          <ForecastTab 
            forecastPeriod={forecastPeriod}
            setForecastPeriod={setForecastPeriod}
          />
       
      </TabsContent>
    </Tabs>
    </div>
  )
}