import React from "react"
import { FileText, Download, IndianRupee } from "lucide-react"
import { PLANS } from "./plans"

export function Invoices() {
  const invoices = [
    { id: "INV-001", date: "2025-08-01", amount: PLANS.grow.yearly },
    { id: "INV-002", date: "2024-08-01", amount: PLANS.grow.yearly },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-gray-600">
            <th className="py-2 pr-4">Date</th>
            <th className="py-2 pr-4">Invoice</th>
            <th className="py-2 pr-4">Amount</th>
            <th className="py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-t">
              <td className="py-2 pr-4">{new Date(inv.date).toLocaleDateString()}</td>
              <td className="py-2 pr-4 flex items-center gap-2"><FileText size={16} /> {inv.id}</td>
              <td className="py-2 pr-4 flex items-center"><IndianRupee size={14} /> {inv.amount.toLocaleString()}</td>
              <td className="py-2">
                <button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 flex items-center gap-2">
                  <Download size={14} /> Download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
