"use client";
import React from "react";

export const ComingSoonNotice: React.FC<{ text?: string }> = ({ text = "Coming Soon" }) => (
  <div className="w-full rounded-md border border-purple-200 bg-purple-50 text-purple-700 text-center py-2 mb-4">
    {text}
  </div>
);
