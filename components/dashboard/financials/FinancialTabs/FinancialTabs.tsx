"use client"

import Image from "next/image"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/dashboard/ui/tabs"
import "./financial-tabs.css"
import { OverviewTab } from "./OverviewTab"
import { IncomeTab } from "./IncomeTab"
import { ExpensesTab } from "./ExpensesTab"
import { ROITab } from "./ROITab"
import { ForecastTab } from "./ForecastTab"
import { useCustomColors } from "@/lib/use-custom-colors"

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
  const { primaryColor, secondaryColor } = useCustomColors();
  return (
    <div className="bg-white shadow-md border-2 border-gray-300 rounded-lg p-3 sm:p-3 lg:p-4 w-full overflow-hidden">
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="space-y-4 sm:space-y-6 lg:space-y-8 tabs-purple"
      style={{
        // @ts-ignore custom properties
        "--ub-primary-color": primaryColor,
        // @ts-ignore
        "--ub-secondary-color": secondaryColor,
        // @ts-ignore
        "--ub-secondary-tint": `${secondaryColor}1a`,
      } as React.CSSProperties}
    >
       <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2 bg-transparent border-0 p-0 sm:p-2 w-full min-h-0 mb-3 sm:mb-4">
        <TabsTrigger 
          value="overview" 
          className="tab-trigger text-xs sm:text-xs lg:text-sm px-2 py-2 sm:px-2 sm:py-1 lg:px-3 lg:py-2 min-w-0 h-9 sm:h-auto"
        >
          <span className="truncate">Overview</span>
        </TabsTrigger>
        <TabsTrigger 
          value="income" 
          className="tab-trigger text-xs sm:text-xs lg:text-sm px-2 py-2 sm:px-2 sm:py-1 lg:px-3 lg:py-2 min-w-0 h-9 sm:h-auto"
        >
          <span className="truncate">Income</span>
        </TabsTrigger>
        <TabsTrigger 
          value="expenses" 
          className="tab-trigger text-xs sm:text-xs lg:text-sm px-2 py-2 sm:px-2 sm:py-1 lg:px-3 lg:py-2 min-w-0 h-9 sm:h-auto"
        >
          <span className="truncate">Expenses</span>
        </TabsTrigger>
        <TabsTrigger 
          value="roi" 
          className="tab-trigger text-xs sm:text-xs lg:text-sm px-2 py-2 sm:px-2 sm:py-1 lg:px-3 lg:py-2 min-w-0 h-9 sm:h-auto"
        >
          <span className="inline-flex items-center gap-1 sm:gap-2 min-w-0">
            <span className="hidden sm:inline truncate">ROI Analysis</span>
            <span className="sm:hidden truncate">ROI</span>
            <Image src="/Coming soon.svg" alt="Coming Soon" width={8} height={8} className="sm:w-2 sm:h-2 lg:w-3 lg:h-3 flex-shrink-0" />
          </span>
        </TabsTrigger>
        <TabsTrigger 
          value="forecast" 
          className="tab-trigger text-xs sm:text-xs lg:text-sm px-2 py-2 sm:px-2 sm:py-1 lg:px-3 lg:py-2 min-w-0 h-9 sm:h-auto"
        >
          <span className="inline-flex items-center gap-1 sm:gap-2 min-w-0">
            <span className="hidden sm:inline truncate">Forecasting</span>
            <span className="sm:hidden truncate">Forecast</span>
            <Image src="/Coming soon.svg" alt="Coming Soon" width={8} height={8} className="sm:w-2 sm:h-2 lg:w-3 lg:h-3 flex-shrink-0" />
          </span>
        </TabsTrigger>      </TabsList>

      <TabsContent value="overview" className="mt-4 sm:mt-6 lg:mt-8 ">
          <OverviewTab />
      </TabsContent>

      <TabsContent value="income" className="mt-4 sm:mt-6 lg:mt-8">
          <IncomeTab 
            incomeFilter={incomeFilter}
            setIncomeFilter={setIncomeFilter}
          />
      </TabsContent>

      <TabsContent value="expenses" className="mt-4 sm:mt-6 lg:mt-8">
          <ExpensesTab 
            expenseFilter={expenseFilter}
            setExpenseFilter={setExpenseFilter}
          />
      </TabsContent>

      <TabsContent value="roi" className="mt-4 sm:mt-6 lg:mt-8">
          <ROITab 
            roiFilter={roiFilter}
            setRoiFilter={setRoiFilter}
          />
      </TabsContent>

      <TabsContent value="forecast" className="mt-4 sm:mt-6 lg:mt-8">
          <ForecastTab 
            forecastPeriod={forecastPeriod}
            setForecastPeriod={setForecastPeriod}
          />
      </TabsContent>
    </Tabs>
    </div>
  )
}