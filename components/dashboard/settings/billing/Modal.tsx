"use client"
import React from "react"
import { X } from "lucide-react"

export function Modal({ open, title, onClose, children, actions }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode; actions?: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4">{children}</div>
        {actions && <div className="mt-6 flex gap-2 justify-end">{actions}</div>}
      </div>
    </div>
  )
}
