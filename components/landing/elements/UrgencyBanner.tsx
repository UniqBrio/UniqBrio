'use client'

import { useState, useEffect } from 'react'

interface UrgencyBannerProps {
  onBookDemo?: () => void
}

export default function UrgencyBanner({ onBookDemo }: UrgencyBannerProps) {
  const [spotsLeft, setSpotsLeft] = useState(58)

  return (
    <div className="bg-gradient-to-r from-red-600 to-red-500 text-white py-3 px-4 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-10"></div>
      <div className="relative z-10 flex items-center justify-center gap-2 flex-wrap">
        <span className="font-semibold text-sm md:text-base animate-pulse">
          🚀 First 100 Indian academies go live on 10 Dec 2025
        </span>
        <span className="hidden md:inline">•</span>
        <span
          role="button"
          tabIndex={0}
          onClick={() => onBookDemo?.()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onBookDemo?.() }}
          className="cursor-pointer text-sm md:text-base font-bold bg-white text-red-600 px-3 py-1 rounded-full animate-bounce"
        >
          Only {spotsLeft} spots left - Hurry up!
        </span>
      </div>
    </div>
  )
}
