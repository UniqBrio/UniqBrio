"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/dashboard/ui/card"
import { Label } from "@/components/dashboard/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts"
import { useData } from "@/contexts/dashboard/data-context"
import { COLORS } from "../types"
import { formatMonthLabel } from "@/lib/dashboard/utils"
import { useIsMobile } from "@/hooks/dashboard/use-mobile"
import { useResponsiveBreakpoints, useResponsiveValue } from "@/hooks/dashboard/useResponsiveBreakpoints"
import React, { useMemo } from "react"

interface ROITabProps {
  roiFilter: string
  setRoiFilter: (value: string) => void
}

export function ROITab({ roiFilter, setRoiFilter }: ROITabProps) {
  const { roiData, courseROIData } = useData();
  const isMobile = useIsMobile()
  const { screenSize } = useResponsiveBreakpoints()
  
  // Responsive chart configurations
  const chartConfig = useResponsiveValue({
    mobile: {
      fontSize: 10,
      outerRadius: 45,
      margins: { left: 5, right: 5, bottom: 30, top: 5 },
      showLabels: false,
      labelFontSize: 8
    },
    tablet: {
      fontSize: 11,
      outerRadius: 60,
      margins: { left: 8, right: 8, bottom: 40, top: 5 },
      showLabels: true,
      labelFontSize: 10
    },
    desktop: {
      fontSize: 12,
      outerRadius: 80,
      margins: { left: 8, right: 8, bottom: 50, top: 5 },
      showLabels: true,
      labelFontSize: 12
    }
  })
  
  // Only year filter
  const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear())

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6 px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base sm:text-lg lg:text-xl break-words leading-tight">ROI Analysis</CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">Return on Investment insights</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          <Card className="p-3 sm:p-4 lg:p-6 w-full overflow-hidden">
            <h3 className="text-xs sm:text-sm lg:text-base font-medium mb-2 sm:mb-3 break-words">ROI by Course</h3>
            <div className="h-48 sm:h-56 lg:h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={chartConfig.margins}>
                  <Pie
                    data={courseROIData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={chartConfig.showLabels ? (props: any) => {
                      const name = props?.name ?? '';
                      const percent = typeof props?.percent === 'number' ? props.percent : 0;
                      // Shorter labels for mobile
                      if (screenSize === 'mobile') {
                        return `${(percent * 100).toFixed(0)}%`;
                      }
                      return `${name} ${(percent * 100).toFixed(0)}%`;
                    } : false}
                    outerRadius={chartConfig.outerRadius}
                    fill="#8884d8"
                    dataKey="value"
                    labelStyle={{
                      fontSize: chartConfig.labelFontSize,
                      fontWeight: 'bold',
                      fill: '#374151'
                    }}
                  >
                    {courseROIData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                    contentStyle={{
                      fontSize: screenSize === "mobile" ? '11px' : '14px',
                      padding: screenSize === "mobile" ? '6px 8px' : '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--background))'
                    }}
                  />
                  {/* Add Legend for mobile to show course names */}
                  {screenSize === 'mobile' && (
                    <Legend 
                      wrapperStyle={{ 
                        paddingTop: '10px',
                        fontSize: '10px'
                      }}
                      iconSize={8}
                    />
                  )}
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-3 sm:p-4 lg:p-6 w-full overflow-hidden">
            <h3 className="text-xs sm:text-sm lg:text-base font-medium mb-2 sm:mb-3 break-words">ROI Trend</h3>
            <div className="h-48 sm:h-56 lg:h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={roiData} margin={chartConfig.margins}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="name" 
                    tickFormatter={formatMonthLabel} 
                    tick={{ fontSize: chartConfig.fontSize }}
                    className="text-xs sm:text-sm"
                  />
                  <YAxis 
                    tick={{ fontSize: chartConfig.fontSize }}
                    className="text-xs sm:text-sm"
                    width={screenSize === "mobile" ? 35 : 50}
                  />
                  <RechartsTooltip 
                    formatter={(value: number) => [`${value}%`, 'ROI']}
                    contentStyle={{
                      fontSize: screenSize === "mobile" ? '11px' : '14px',
                      padding: screenSize === "mobile" ? '6px 8px' : '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--background))'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: screenSize === "mobile" ? '8px' : '15px',
                      fontSize: screenSize === "mobile" ? '11px' : '14px'
                    }}
                    iconSize={screenSize === "mobile" ? 12 : 14}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="roi" 
                    name="ROI %" 
                    stroke="#8b5cf6" 
                    strokeWidth={screenSize === "mobile" ? 2 : 3}
                    dot={{ r: screenSize === "mobile" ? 3 : 4 }}
                    activeDot={{ r: screenSize === "mobile" ? 5 : 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        
      </CardContent>
    </Card>
  )
}
