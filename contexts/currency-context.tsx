"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface CurrencyContextType {
  currency: string
  setCurrency: (currency: string) => void
  isLoading: boolean
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<string>("INR")
  const [isLoading, setIsLoading] = useState(true)

  const fetchCurrency = async () => {
    try {
      const response = await fetch("/api/dashboard/academy-info", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (response.ok) {
        const data = await response.json()
        if (data.businessInfo?.currency) {
          console.log('[CurrencyContext] Updated currency to:', data.businessInfo.currency)
          setCurrencyState(data.businessInfo.currency)
        }
      } else if (response.status === 401) {
        // User not authenticated yet, silently fail
        console.log('[CurrencyContext] Not authenticated, using default currency')
      } else {
        console.warn('[CurrencyContext] Failed to fetch currency:', response.status)
      }
    } catch (error) {
      // Silently handle fetch errors (e.g., network issues, API not available)
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.warn('[CurrencyContext] Error fetching currency:', error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Only fetch currency if we're in the browser (not during SSR)
    if (typeof window === 'undefined') return
    
    fetchCurrency()
    
    // Poll every 30 seconds to catch currency changes (event handles immediate updates)
    const interval = setInterval(fetchCurrency, 30000)
    
    // Listen for custom currency update event
    const handleCurrencyUpdate = () => {
      console.log('[CurrencyContext] Received currency update event')
      fetchCurrency()
    }
    window.addEventListener('currencyUpdated', handleCurrencyUpdate)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('currencyUpdated', handleCurrencyUpdate)
    }
  }, [])

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency)
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}

// Helper function to format currency
export function formatCurrency(amount: number, currencyCode: string = ""): string {
  if (!currencyCode) {
    return amount.toLocaleString();
  }
  return `${currencyCode} ${amount.toLocaleString()}`;
}
