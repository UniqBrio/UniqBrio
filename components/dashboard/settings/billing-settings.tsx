"use client"

import React, { useState } from "react"
import { Section } from "./billing/Section"
import { Overview } from "./billing/Overview"
import { Invoices } from "./billing/Invoices"
import { Branches } from "./billing/Branches"

export default function BillingSettings() {
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "plans" | "invoices" | "branches">("overview")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        <p className="text-sm text-gray-600">Manage your plan and invoices.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-2 border-0 mb-6">
        <div className="grid w-full grid-cols-3 sm:grid-cols-4 gap-2 bg-gradient-to-r from-purple-100 to-orange-100 rounded-xl h-12 p-1">
          {[
            { key: "overview", label: "Overview" },
            { key: "plans", label: "Plan Comparison" },
            { key: "invoices", label: "Invoices" },
            { key: "branches", label: "Branch Billing" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveSubTab(t.key as any)}
              className={`rounded-lg font-semibold text-sm transition-all duration-300 ${activeSubTab === t.key ? "text-white bg-gradient-to-r from-purple-600 to-orange-500" : "hover:bg-white/50 bg-transparent"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === "overview" && (
        <Section title="Current Plan" subtitle="Your active subscription details">
          <Overview />
        </Section>
      )}

      {activeSubTab === "plans" && (
        <Section title="Compare Plans" subtitle="Choose Monthly or Yearly and pick your plan">
          <div className="text-center py-10 text-gray-500">
            Plans comparison component coming soon
          </div>
        </Section>
      )}

      {activeSubTab === "invoices" && (
        <Section title="Invoices" subtitle="Your past billing receipts">
          <Invoices />
        </Section>
      )}

      {activeSubTab === "branches" && (
        <Section title="Branch Billing" subtitle="Manage billing across branches">
          <Branches />
        </Section>
      )}
    </div>
  )
}
