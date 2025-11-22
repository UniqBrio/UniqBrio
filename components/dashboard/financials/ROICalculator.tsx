"use client"

import { useState, Fragment } from "react"
import Image from "next/image"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/dashboard/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Label } from "@/components/dashboard/ui/label"
import { Button } from "@/components/dashboard/ui/button"
import { toast } from "@/components/dashboard/ui/use-toast"
import { saveAs } from "file-saver"
import * as XLSX from "xlsx"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { COLORS } from "./types"

const ROI_TYPES = [
  "Course / Program",
  "Instructor",
  "Marketing Campaign",
  "Products and Services",
  "Event / Workshop",
  "Custom",
]

export function ROICalculator() {
  return <ROICalculatorMultiStep />
}

function ROICalculatorMultiStep() {
  const [roiType, setRoiType] = useState(ROI_TYPES[0])
  const [fields, setFields] = useState({
    academyName: "",
    branch: "",
    initialInvestment: "",
    ongoingCost: "",
    startDate: "",
    endDate: "",
    instructorSalaries: "",
    marketingSpend: "",
    equipmentCost: "",
    maintenance: "",
    enrollments: "",
    pricePerEnrollment: "",
    totalIncome: "",
    upsellRevenue: "",
    paymentIncome: "", // Income from payments
    loanRepayments: "", // Loan repayments
  })
  const [showResult, setShowResult] = useState(false)
  const [errors, setErrors] = useState<any>({})

  function handleFieldChange(field: string, value: string) {
    setFields((prev) => ({ ...prev, [field]: value }))
    setErrors((prev: any) => ({ ...prev, [field]: undefined }))
  }

  function validateFields() {
    const newErrors: any = {}
    if (!fields.initialInvestment || isNaN(Number(fields.initialInvestment)) || Number(fields.initialInvestment) <= 0) {
      newErrors.initialInvestment = "Enter a valid initial investment (>0)"
    }
    if (!fields.ongoingCost || isNaN(Number(fields.ongoingCost))) {
      newErrors.ongoingCost = "Enter ongoing cost"
    }
    if (!fields.startDate || !fields.endDate) {
      newErrors.date = "Select a valid date range"
    }
    if (!fields.enrollments || isNaN(Number(fields.enrollments)) || Number(fields.enrollments) < 0) {
      newErrors.enrollments = "Enter number of enrollments"
    }
    if (!fields.pricePerEnrollment || isNaN(Number(fields.pricePerEnrollment))) {
      newErrors.pricePerEnrollment = "Enter price per enrollment"
    }
    if (fields.paymentIncome && isNaN(Number(fields.paymentIncome))) {
      newErrors.paymentIncome = "Enter valid payment income"
    }
    if (fields.loanRepayments && isNaN(Number(fields.loanRepayments))) {
      newErrors.loanRepayments = "Enter valid loan repayments"
    }
    return newErrors
  }

  function handleCalculate() {
    const newErrors = validateFields()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setShowResult(false)
      return
    }
    setShowResult(true)
  }

  // Improved Calculation logic
  function getMonthsBetween(start: string, end: string) {
    if (!start || !end) return 0
    const s = new Date(start)
    const e = new Date(end)
    return (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1
  }

  const months = getMonthsBetween(fields.startDate, fields.endDate)
  const years = months / 12
  const totalCost =
    Number(fields.initialInvestment || 0) +
    Number(fields.ongoingCost || 0) +
    Number(fields.instructorSalaries || 0) +
    Number(fields.marketingSpend || 0) +
    Number(fields.equipmentCost || 0) +
    Number(fields.maintenance || 0) +
    Number(fields.loanRepayments || 0)
  const totalIncome = (fields.totalIncome
    ? Number(fields.totalIncome)
    : Number(fields.enrollments || 0) * Number(fields.pricePerEnrollment || 0) + Number(fields.upsellRevenue || 0))
    + Number(fields.paymentIncome || 0)
  const netProfit = totalIncome - totalCost
  const roi = totalCost > 0 ? ((totalIncome - totalCost) / totalCost) * 100 : 0
  const costPerEnrollment = Number(fields.enrollments) > 0 ? totalCost / Number(fields.enrollments) : 0
  const breakeven = netProfit >= 0

  // Annualized ROI
  const annualCost = years > 0 ? totalCost / years : totalCost
  const annualIncome = years > 0 ? totalIncome / years : totalIncome
  const annualROI = annualCost > 0 ? ((annualIncome - annualCost) / annualCost) * 100 : 0

  // Breakeven enrollments
  const breakevenEnrollments = Number(fields.pricePerEnrollment) > 0 ? totalCost / Number(fields.pricePerEnrollment) : null

  // Improved payback period (months/years)
  const monthlyIncome = months > 0 ? totalIncome / months : 0
  const paybackMonths = monthlyIncome > 0 ? totalCost / monthlyIncome : null
  const paybackYears = paybackMonths ? paybackMonths / 12 : null

  // Edge case handling
  const showBreakevenEnrollments = breakevenEnrollments && breakevenEnrollments > 0 && isFinite(breakevenEnrollments)
  const showPayback = paybackMonths && paybackMonths > 0 && isFinite(paybackMonths)

  // Chart data
  const roiOverTime = Array.from({ length: getMonthsBetween(fields.startDate, fields.endDate) }, (_, i) => ({
    month: `Month ${i + 1}`,
    roi: roi,
  }))
  const revenueVsCost = [
    { name: "Revenue", value: totalIncome },
    { name: "Cost", value: totalCost },
  ]
  const costBreakdown = [
    { name: "Initial Investment", value: Number(fields.initialInvestment || 0) },
    { name: "Ongoing Cost", value: Number(fields.ongoingCost || 0) },
    { name: "Instructor Salaries", value: Number(fields.instructorSalaries || 0) },
    { name: "Marketing Spend", value: Number(fields.marketingSpend || 0) },
    { name: "Equipment/Facility", value: Number(fields.equipmentCost || 0) },
    { name: "Maintenance/Overheads", value: Number(fields.maintenance || 0) },
  ]

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-10 shadow-sm">
      
      <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
        <span className="inline-flex items-center gap-2">ROI Calculator <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block" /></span>
      </h2>
      <Accordion type="single" collapsible className="mb-4">
        <AccordionItem value="step1">
          <AccordionTrigger className="text-sm font-semibold text-gray-400 cursor-not-allowed select-none">1. ROI Type</AccordionTrigger>
          <AccordionContent>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative group">
                <Label htmlFor="academyName" className="text-sm text-purple-700 mb-1">Academy Name</Label>
                <input id="academyName" type="text" className="input input-bordered w-full" value={fields.academyName} onChange={e => handleFieldChange("academyName", e.target.value)} placeholder="e.g. UniqBrio Academy" disabled />
              </div>
              <div className="relative group">
                <Label htmlFor="branch" className="text-sm text-purple-700 mb-1">Branch</Label>
                <input id="branch" type="text" className="input input-bordered w-full" value={fields.branch} onChange={e => handleFieldChange("branch", e.target.value)} placeholder="e.g. Chennai" disabled />
              </div>
              <div className="relative group col-span-2">
                <Label htmlFor="roiType" className="text-sm text-purple-700 mb-1">ROI Type</Label>
                <Select value={roiType} onValueChange={setRoiType} disabled>
                  <SelectTrigger className="w-full" id="roiType" disabled>
                    <SelectValue placeholder="Select ROI Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROI_TYPES.map(type => (
                      <SelectItem key={type} value={type} disabled>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="step2">
          <AccordionTrigger className="text-lg font-semibold text-gray-400 cursor-not-allowed select-none">2. Investment Details</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative group">
                <Label htmlFor="initialInvestment" className="text-sm text-purple-700 mb-1">Initial Investment</Label>
                <input id="initialInvestment" type="text" className="input input-bordered w-full" value={fields.initialInvestment} onChange={e => handleFieldChange("initialInvestment", e.target.value)} placeholder="e.g. 50000 (Initial Investment)" disabled />
              </div>
              <div className="relative group">
                <Label htmlFor="ongoingCost" className="text-sm text-purple-700 mb-1">Ongoing Cost</Label>
                <input id="ongoingCost" type="text" className="input input-bordered w-full" value={fields.ongoingCost} onChange={e => handleFieldChange("ongoingCost", e.target.value)} placeholder="e.g. 2000 (Monthly Ongoing Cost)" disabled />
              </div>
              <div className="relative group flex flex-col">
                <Label htmlFor="startDate" className="text-sm text-purple-700 mb-1">Start Date</Label>
                <input id="startDate" type="date" className="input input-bordered w-full" value={fields.startDate} onChange={e => handleFieldChange("startDate", e.target.value)} placeholder="Start Date" disabled />
                <Label htmlFor="endDate" className="text-sm text-purple-700 mb-1 mt-2">End Date</Label>
                <input id="endDate" type="date" className="input input-bordered w-full mt-2" value={fields.endDate} onChange={e => handleFieldChange("endDate", e.target.value)} placeholder="End Date" disabled />
              </div>
              <div className="relative group">
                <Label htmlFor="instructorSalaries" className="text-sm text-purple-700 mb-1">Instructor Salaries</Label>
                <input id="instructorSalaries" type="text" className="input input-bordered w-full" value={fields.instructorSalaries} onChange={e => handleFieldChange("instructorSalaries", e.target.value)} placeholder="e.g. 10000 (Instructor Salaries)" disabled />
              </div>
              <div className="relative group">
                <Label htmlFor="marketingSpend" className="text-sm text-purple-700 mb-1">Marketing Spend</Label>
                <input id="marketingSpend" type="text" className="input input-bordered w-full" value={fields.marketingSpend} onChange={e => handleFieldChange("marketingSpend", e.target.value)} placeholder="e.g. 3000 (Marketing Spend)" disabled />
              </div>
              <div className="relative group">
                <Label htmlFor="equipmentCost" className="text-sm text-purple-700 mb-1">Equipment/Facility Cost</Label>
                <input id="equipmentCost" type="text" className="input input-bordered w-full" value={fields.equipmentCost} onChange={e => handleFieldChange("equipmentCost", e.target.value)} placeholder="e.g. 5000 (Equipment/Facility Cost)" disabled />
              </div>
              <div className="relative group">
                <Label htmlFor="maintenance" className="text-sm text-purple-700 mb-1">Maintenance/Overheads</Label>
                <input id="maintenance" type="text" className="input input-bordered w-full" value={fields.maintenance} onChange={e => handleFieldChange("maintenance", e.target.value)} placeholder="e.g. 1200 (Maintenance/Overheads)" disabled />
              </div>
              <div className="relative group">
                <Label htmlFor="loanRepayments" className="text-sm text-purple-700 mb-1">Loan Repayments</Label>
                <input id="loanRepayments" type="text" className="input input-bordered w-full" value={fields.loanRepayments} onChange={e => handleFieldChange("loanRepayments", e.target.value)} placeholder="e.g. 2500 (Loan Repayments)" disabled />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="step3">
          <AccordionTrigger className="text-lg font-semibold text-gray-400 cursor-not-allowed select-none">3. Revenue Details</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative group">
                <Label htmlFor="enrollments" className="text-sm text-purple-700 mb-1">Enrollments</Label>
                <input id="enrollments" type="text" className="input input-bordered w-full" value={fields.enrollments} onChange={e => handleFieldChange("enrollments", e.target.value)} placeholder="e.g. 120 (Enrollments)" disabled />
              </div>
              <div className="relative group">
                <Label htmlFor="pricePerEnrollment" className="text-sm text-purple-700 mb-1">Price per Enrollment</Label>
                <input id="pricePerEnrollment" type="text" className="input input-bordered w-full" value={fields.pricePerEnrollment} onChange={e => handleFieldChange("pricePerEnrollment", e.target.value)} placeholder="e.g. 500 (Price per Enrollment)" disabled />
              </div>
              <div className="relative group">
                <Label htmlFor="totalIncome" className="text-sm text-purple-700 mb-1">Total Income</Label>
                <input id="totalIncome" type="text" className="input input-bordered w-full" value={fields.totalIncome} onChange={e => handleFieldChange("totalIncome", e.target.value)} placeholder="e.g. 80000 (Total Income)" disabled />
              </div>
              <div className="relative group">
                <Label htmlFor="upsellRevenue" className="text-sm text-purple-700 mb-1">Upsell Revenue</Label>
                <input id="upsellRevenue" type="text" className="input input-bordered w-full" value={fields.upsellRevenue} onChange={e => handleFieldChange("upsellRevenue", e.target.value)} placeholder="e.g. 5000 (Upsell Revenue)" disabled />
              </div>
              <div className="relative group">
                <Label htmlFor="paymentIncome" className="text-sm text-purple-700 mb-1">Income from Payments</Label>
                <input id="paymentIncome" type="text" className="input input-bordered w-full" value={fields.paymentIncome} onChange={e => handleFieldChange("paymentIncome", e.target.value)} placeholder="e.g. 15000 (Income from Payments)" disabled />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <div className="flex gap-2 mb-6">
        <Button variant="outline" disabled className="opacity-60 cursor-not-allowed">Reset</Button>
        <Button disabled className="opacity-60 cursor-not-allowed">Calculate ROI</Button>
      </div>
      {showResult && (
        <Fragment>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card className="bg-white border border-orange-200">
              <CardHeader>
                <CardTitle className="text-lg text-purple-700">ROI %</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700">{roi.toFixed(2)}%</div>
                <div className="text-xs text-gray-500 mt-1">Annualized: {annualROI.toFixed(2)}%</div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-orange-200">
              <CardHeader>
                <CardTitle className="text-lg text-purple-700">Total Profit / Loss</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{netProfit.toLocaleString("en-IN", { maximumFractionDigits: 0 })} INR</div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-orange-200">
              <CardHeader>
                <CardTitle className="text-lg text-purple-700">Payback Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700">{showPayback ? `${paybackMonths!.toFixed(1)} months (${paybackYears?.toFixed(2)} yrs)` : "N/A"}</div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-orange-200">
              <CardHeader>
                <CardTitle className="text-lg text-purple-700">Breakeven Status</CardTitle>
              </CardHeader>
              <CardContent>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${breakeven ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{breakeven ? "Achieved" : "Not Achieved"}</span>
              </CardContent>
            </Card>
            <Card className="bg-white border border-orange-200">
              <CardHeader>
                <CardTitle className="text-lg text-purple-700">Breakeven Enrollments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700">{showBreakevenEnrollments ? breakevenEnrollments!.toFixed(0) : "N/A"}</div>
                <div className="text-xs text-gray-500 mt-1">Enrollments needed to break even</div>
              </CardContent>
            </Card>
          </div>
          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white border border-orange-200">
              <CardHeader>
                <CardTitle className="text-base text-purple-700">ROI Over Time</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={roiOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="roi" stroke="#8b5cf6" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="bg-white border border-orange-200">
              <CardHeader>
                <CardTitle className="text-base text-purple-700">Revenue vs Cost</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueVsCost}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="bg-white border border-orange-200">
              <CardHeader>
                <CardTitle className="text-base text-purple-700">Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={costBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {costBreakdown.map((entry: { name: string; value: number }, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* AI-generated Insights (Improved) */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-purple-700 mb-2">AI-generated Insights</h3>
            <ul className="list-disc ml-6 text-purple-700">
              <li>Annualized ROI: <span className="font-semibold">{annualROI.toFixed(2)}%</span> {annualROI > 20 ? "(Excellent)" : annualROI > 10 ? "(Good)" : "(Needs Improvement)"}</li>
              <li>Breakeven Enrollments: <span className="font-semibold">{showBreakevenEnrollments ? breakevenEnrollments!.toFixed(0) : "N/A"}</span></li>
              <li>Payback Period: <span className="font-semibold">{showPayback ? `${paybackMonths!.toFixed(1)} months (${paybackYears?.toFixed(2)} yrs)` : "N/A"}</span></li>
              <li>Cost per enrollment: <span className="font-semibold">{costPerEnrollment.toFixed(2)}</span></li>
              {annualROI < 10 && <li>Low ROI: Review marketing spend, instructor efficiency, or pricing.</li>}
              {netProfit < 0 && <li>Warning: Net profit is negative. Consider reducing costs or increasing revenue.</li>}
            </ul>
            <div className="text-xs text-gray-400 mt-2">(AI logic not implemented yet)</div>
          </div>
          {/* Export & Compare */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              // Export ROI summary to CSV
              const ws = XLSX.utils.json_to_sheet([
                { Metric: 'ROI %', Value: roi.toFixed(2) },
                { Metric: 'Annualized ROI %', Value: annualROI.toFixed(2) },
                { Metric: 'Total Profit/Loss', Value: netProfit.toLocaleString("en-IN", { maximumFractionDigits: 0 }) + ' INR' },
                { Metric: 'Payback Duration', Value: showPayback ? `${paybackMonths!.toFixed(1)} months (${paybackYears?.toFixed(2)} yrs)` : "N/A" },
                { Metric: 'Breakeven Status', Value: breakeven ? "Achieved" : "Not Achieved" },
                { Metric: 'Breakeven Enrollments', Value: showBreakevenEnrollments ? breakevenEnrollments!.toFixed(0) : "N/A" },
              ]);
              const csv = XLSX.utils.sheet_to_csv(ws);
              saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'roi_summary.csv');
              toast({ title: "Export", description: "ROI summary exported as CSV." });
            }}>Export Report</Button>
          </div>
        </Fragment>
      )}
    </div>
  )
}