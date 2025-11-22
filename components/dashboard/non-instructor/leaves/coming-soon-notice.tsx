"use client"

import React from "react"

export const ComingSoonNotice: React.FC<{ text?: string }>
  = ({ text = "Coming Soon" }) => (
  <div className="w-full rounded-md border border-gray-200 bg-gray-50 text-purple-600 text-center py-2 mb-4">
    {text}
  </div>
)

export default ComingSoonNotice
