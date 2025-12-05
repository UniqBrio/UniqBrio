'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface UrgencyBannerProps {
  onBookDemo?: () => void
}

export default function UrgencyBanner({ onBookDemo }: UrgencyBannerProps) {
  const [spotsLeft, setSpotsLeft] = useState(58)
  const router = useRouter()

  const handleHurryUpClick = () => {
    router.push('/signup')
  }

  return (
    <div className="bg-gradient-to-r from-purple-500 to-purple-300 text-white py-3 px-2 md:px-4 text-center relative overflow-hidden mt-16">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-10"></div>
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
        <span className="font-semibold text-xs sm:text-sm md:text-base">
          🚀 First 100 Indian academies go live on 10 Dec 2025
        </span>
        <span className="hidden sm:inline">•</span>
        <span
          role="button"
          tabIndex={0}
          onClick={handleHurryUpClick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleHurryUpClick() }}
          className="cursor-pointer text-xs sm:text-sm md:text-base font-semibold bg-white text-black px-2 sm:px-3 py-1 rounded-full"
        >
          Only {spotsLeft} spots left - Hurry up!
        </span>
      </div>
    </div>
  )
}
