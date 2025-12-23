"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Switch } from "@/components/dashboard/ui/switch"
import { Label } from "@/components/dashboard/ui/label"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/dashboard/ui/alert-dialog"
import { Palette, Globe, Save, X, ArrowUp, ArrowDown, RotateCcw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/dashboard/ui/alert"
import { useApp } from "@/contexts/dashboard/app-context"
import { DATE_FORMATS } from "./date-formats"
import Image from "next/image"

interface AppearanceSettingsProps {
  preferences: any
  onUpdate: (updates: any) => Promise<void>
}

interface DateFormat {
  format: string
  label: string
}

interface Currency {
  code: string
  name: string
  symbol: string
}

interface TimeZoneInfo {
  name: string
  offset: string
  gmtOffset: string
}

export function AppearanceSettings({ preferences, onUpdate }: AppearanceSettingsProps) {
  const { theme, toggleTheme, customColors, setCustomColors, applyCustomColors, resetToDefaultColors: resetColors } = useApp()
  const [isSaving, setIsSaving] = useState(false)
  const [showResetThemeDialog, setShowResetThemeDialog] = useState(false)
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; title: string; description?: string } | null>(null)
  const [colorError, setColorError] = useState<string | null>(null)
  const [isLoadingFormats, setIsLoadingFormats] = useState(true)
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true)
  const DEFAULT_COLORS = ["#6708c0", "#DE7D14"]
  const [selectedColors, setSelectedColors] = useState<string[]>(
    customColors || DEFAULT_COLORS
  )
  const primaryPreviewColor = selectedColors[0] || DEFAULT_COLORS[0]
  const secondaryPreviewColor = selectedColors[1] || selectedColors[0] || DEFAULT_COLORS[1]
  const gradientPreviewStyle = {
    backgroundImage: `linear-gradient(135deg, ${primaryPreviewColor} 0%, ${secondaryPreviewColor} 100%)`,
  }
  const [dateFormats, setDateFormats] = useState<DateFormat[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [currencySearch, setCurrencySearch] = useState("")
  const [timeZones, setTimeZones] = useState<string[]>([])
  const [timeZoneInfo, setTimeZoneInfo] = useState<Map<string, TimeZoneInfo>>(new Map())
  const [showTimeZoneWarning, setShowTimeZoneWarning] = useState(false)
  const [countryFromAcademy, setCountryFromAcademy] = useState<string>("")
  const [settings, setSettings] = useState({
    dateFormat: preferences?.dateFormat || "dd-MMM-yyyy",
    timeFormat: preferences?.timeFormat || "12h",
    currency: preferences?.currency || "INR",
    country: preferences?.country || "",
    timeZone: preferences?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  })

  // Auto-dismiss feedback after 6 seconds
  useEffect(() => {
    if (!feedback) return
    const timer = window.setTimeout(() => setFeedback(null), 6000)
    return () => window.clearTimeout(timer)
  }, [feedback])

  // Load date formats from local static list (hardcoded)
  useEffect(() => {
    setIsLoadingFormats(true)
    try {
      const uniqueByFormat = Array.from(
        new Map(DATE_FORMATS.map((d) => [d.format, d])).values()
      )
      setDateFormats(uniqueByFormat)
    } finally {
      setIsLoadingFormats(false)
    }
  }, [])

  // Fetch country from academy info
  useEffect(() => {
    const fetchAcademyInfo = async () => {
      try {
        const response = await fetch('/api/user-academy-info')
        if (response.ok) {
          const data = await response.json()
          if (data.academyInfo?.businessInfo?.country) {
            const country = data.academyInfo.businessInfo.country
            setCountryFromAcademy(country)
            
            // Check if timezone matches this country
            if (country && settings.timeZone) {
              const expectedTimeZone = getDefaultTimeZoneForCountry(country)
              if (settings.timeZone !== expectedTimeZone) {
                setShowTimeZoneWarning(true)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching academy info:', error)
      }
    }
    
    fetchAcademyInfo()
  }, [])

  // Fetch currencies from API
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        setIsLoadingCurrencies(true)
        // Using a public API for currency data
        const response = await fetch('https://openexchangerates.org/api/currencies.json')
        
        if (!response.ok) {
          throw new Error('Failed to fetch currencies')
        }
        
        const data = await response.json()
        
        // Convert object to array and add popular currencies first
        const popularCurrencies = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CNY']
        const currencyList: Currency[] = []
        
        // Add popular currencies first
        popularCurrencies.forEach(code => {
          if (data[code]) {
            currencyList.push({
              code,
              name: data[code],
              symbol: getCurrencySymbol(code)
            })
          }
        })
        
        // Add remaining currencies
        Object.keys(data).forEach(code => {
          if (!popularCurrencies.includes(code)) {
            currencyList.push({
              code,
              name: data[code],
              symbol: getCurrencySymbol(code)
            })
          }
        })
        
        setCurrencies(currencyList)
      } catch (error) {
        console.error('Error fetching currencies:', error)
        // Fallback to default currencies
        setCurrencies([
          { code: "INR", name: "Indian Rupee", symbol: "" },
          { code: "USD", name: "US Dollar", symbol: "" },
          { code: "EUR", name: "Euro", symbol: "" },
          { code: "GBP", name: "British Pound", symbol: "" },
          { code: "JPY", name: "Japanese Yen", symbol: "" },
          { code: "AUD", name: "Australian Dollar", symbol: "" },
          { code: "CAD", name: "Canadian Dollar", symbol: "" },
          { code: "CNY", name: "Chinese Yuan", symbol: "" },
        ])
      } finally {
        setIsLoadingCurrencies(false)
      }
    }

    fetchCurrencies()
  }, [])

  // Helper function to get GMT offset for a timezone
  const getTimeZoneOffset = (timeZone: string): string => {
    try {
      const date = new Date()
      const options: Intl.DateTimeFormatOptions = { 
        timeZone, 
        timeZoneName: 'longOffset' 
      }
      const formatter = new Intl.DateTimeFormat('en-US', options)
      const parts = formatter.formatToParts(date)
      const offsetPart = parts.find(part => part.type === 'timeZoneName')
      
      if (offsetPart && offsetPart.value.includes('GMT')) {
        return offsetPart.value.replace('GMT', '').trim()
      }
      
      // Fallback: calculate offset manually
      const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
      const tzDate = new Date(date.toLocaleString('en-US', { timeZone }))
      const offset = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60)
      
      const hours = Math.floor(Math.abs(offset))
      const minutes = Math.abs((offset % 1) * 60)
      const sign = offset >= 0 ? '+' : '-'
      
      return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    } catch (error) {
      return '+00:00'
    }
  }

  // Load time zones from API
  useEffect(() => {
    const fetchTimeZones = async () => {
      try {
        // Use Intl API directly (more reliable and no network dependency)
        const zones = Intl.supportedValuesOf('timeZone')
        setTimeZones(zones)
        
        // Build timezone info map
        const infoMap = new Map<string, TimeZoneInfo>()
        zones.forEach((zone: string) => {
          const offset = getTimeZoneOffset(zone)
          infoMap.set(zone, {
            name: zone,
            offset: offset,
            gmtOffset: `GMT${offset}`
          })
        })
        setTimeZoneInfo(infoMap)
      } catch (error) {
        console.error('Error loading timezones:', error)
        // Minimal fallback
        const fallbackZones = ['Asia/Kolkata', 'America/New_York', 'Europe/London', 'Asia/Tokyo']
        setTimeZones(fallbackZones)
        
        const infoMap = new Map<string, TimeZoneInfo>()
        fallbackZones.forEach((zone: string) => {
          const offset = getTimeZoneOffset(zone)
          infoMap.set(zone, {
            name: zone,
            offset: offset,
            gmtOffset: `GMT${offset}`
          })
        })
        setTimeZoneInfo(infoMap)
      }
    }
    
    fetchTimeZones()
  }, [])

  // Get default timezone for country
  const getDefaultTimeZoneForCountry = (country: string): string => {
    const countryTimeZones: { [key: string]: string } = {
      'United States': 'America/New_York',
      'United Kingdom': 'Europe/London',
      'India': 'Asia/Kolkata',
      'Australia': 'Australia/Sydney',
      'Canada': 'America/Toronto',
      'Germany': 'Europe/Berlin',
      'France': 'Europe/Paris',
      'Japan': 'Asia/Tokyo',
      'China': 'Asia/Shanghai',
      'Brazil': 'America/Sao_Paulo',
      'Singapore': 'Asia/Singapore',
      'UAE': 'Asia/Dubai',
    }
    return countryTimeZones[country] || Intl.DateTimeFormat().resolvedOptions().timeZone
  }

  // Check if timezone matches country
  const checkTimeZoneCountryMatch = (country: string, timeZone: string): boolean => {
    const expectedTimeZone = getDefaultTimeZoneForCountry(country)
    return timeZone === expectedTimeZone
  }

  // Handle timezone change
  const handleTimeZoneChange = (newTimeZone: string) => {
    setSettings(prev => ({ ...prev, timeZone: newTimeZone }))
    
    // Check against country from academy info
    if (countryFromAcademy && !checkTimeZoneCountryMatch(countryFromAcademy, newTimeZone)) {
      setShowTimeZoneWarning(true)
    } else {
      setShowTimeZoneWarning(false)
    }
  }

  // Handle country change
  const handleCountryChange = (newCountry: string) => {
    const defaultTimeZone = getDefaultTimeZoneForCountry(newCountry)
    setSettings(prev => ({ ...prev, country: newCountry, timeZone: defaultTimeZone }))
    setShowTimeZoneWarning(false)
  }

  // Helper function to get currency symbols
  const getCurrencySymbol = (code: string): string => {
    const symbols: { [key: string]: string } = {
      INR: "", USD: "", EUR: "", GBP: "", JPY: "",
      AUD: "", CAD: "", CNY: "", CHF: "", BRL: "",
      MXN: "", ZAR: "", SEK: "", NOK: "", DKK: "",
      RUB: "", KRW: "", SGD: "", HKD: "", NZD: ""
    }
    return symbols[code] || code
  }

  const addColor = () => {
    if (selectedColors.length < 2) {
      setSelectedColors([...selectedColors, "#000000"])
      setColorError(null)
    } else {
      setColorError("You can only select up to 2 colors.")
    }
  }

  const updateColor = (index: number, color: string) => {
    const newColors = [...selectedColors]
    newColors[index] = color
    setSelectedColors(newColors)
  }

  const removeColor = (index: number) => {
    if (selectedColors.length > 1) {
      setSelectedColors(selectedColors.filter((_, i) => i !== index))
      setColorError(null)
    } else {
      setColorError("You must have at least one color selected.")
    }
  }

  const moveColor = (index: number, direction: 'up' | 'down') => {
    const newColors = [...selectedColors]
    if (direction === 'up' && index > 0) {
      const temp = newColors[index - 1]
      newColors[index - 1] = newColors[index]
      newColors[index] = temp
    } else if (direction === 'down' && index < selectedColors.length - 1) {
      const temp = newColors[index + 1]
      newColors[index + 1] = newColors[index]
      newColors[index] = temp
    }
    setSelectedColors(newColors)
  }

  const resetToDefaultColors = () => {
    setSelectedColors([...DEFAULT_COLORS])
    resetColors() // Call the context function to reset globally
    setShowResetThemeDialog(false)
    setColorError(null)
    setFeedback({
      variant: "success",
      title: "Colors Reset",
      description: "Theme colors have been reset to default (Purple and Orange).",
    })
  }

  const filteredCurrencies = currencies.filter(currency =>
    currency.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
    currency.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
    currency.symbol.includes(currencySearch)
  )

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      // Apply colors globally through context
      setCustomColors(selectedColors)
      applyCustomColors(selectedColors)
      
      // Also save to backend if needed
      await onUpdate({ ...settings, theme, customColors: selectedColors })
      
      setFeedback({
        variant: "success",
        title: "Appearance Updated",
        description: "Your appearance preferences have been saved.",
      })
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Error",
        description: "Failed to update appearance settings.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <Alert
          variant={feedback.variant === "error" ? "destructive" : "default"}
          className={feedback.variant === "success" ? "border-green-200 bg-green-50 text-green-900" : ""}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <AlertTitle>{feedback.title}</AlertTitle>
              {feedback.description && (
                <AlertDescription>{feedback.description}</AlertDescription>
              )}
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-sm text-muted-foreground hover:text-foreground mt-1"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </Alert>
      )}
      
      {/* Localization Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" style={{ color: 'var(--custom-color-1)' }} />
            Localization
          </CardTitle>
          <CardDescription>
            Set your date and time preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFormat" className="flex items-center gap-2">
                Date Format
                <Image src="/Coming soon.svg" alt="Coming Soon" width={16} height={16} className="inline-block" />
              </Label>
            <Select
              value={settings.dateFormat}
              onValueChange={(value) => setSettings(prev => ({ ...prev, dateFormat: value }))}
              disabled={true}
            >
              <SelectTrigger id="dateFormat" className="bg-gray-50">
                <SelectValue placeholder="dd-MMM-yyyy" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                <SelectItem value="dd-MMM-yyyy">dd-MMM-yyyy (e.g., 24-Nov-2025)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeFormat" className="flex items-center gap-2">
              Time Format
              <Image src="/Coming soon.svg" alt="Coming Soon" width={16} height={16} className="inline-block" />
            </Label>
            <Select
              value={settings.timeFormat}
              onValueChange={(value) => setSettings(prev => ({ ...prev, timeFormat: value }))}
              disabled={true}
            >
              <SelectTrigger id="timeFormat" className="bg-gray-50">
                <SelectValue placeholder="Select time format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                <SelectItem value="24h">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeZone">Time Zone</Label>
            <Select
              value={settings.timeZone}
              onValueChange={handleTimeZoneChange}
            >
              <SelectTrigger id="timeZone">
                <SelectValue placeholder="Select time zone" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                {timeZones.map((zone) => {
                  const info = timeZoneInfo.get(zone)
                  return (
                    <SelectItem key={zone} value={zone}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>{zone.replace(/_/g, ' ')}</span>
                        {info && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                            {info.gmtOffset}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {showTimeZoneWarning && (
              <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    The selected time zone doesn't match your country. Please verify this is correct.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Theme Settings - now inside the same card */}
          <div className="pt-6 border-t">
            <div className="mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Palette className="h-5 w-5" style={{ color: 'var(--custom-color-1)' }} />
                Theme Preferences
              </h3>
              <p className="text-sm text-gray-500 dark:text-white mt-1">
                Customize the appearance of your application
              </p>
            </div>

            {/* Color Palette Selection */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <Label className="font-medium">Custom Color Palette</Label>
                  <p className="text-sm text-gray-500 dark:text-white mt-1">
                    Select up to 2 colors for your theme ({selectedColors.length}/2)
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowResetThemeDialog(true)}
                    className="gap-2 flex-1 sm:flex-initial"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="hidden sm:inline">Reset Theme</span>
                    <span className="sm:hidden">Reset</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addColor}
                    disabled={selectedColors.length >= 2}
                    className="gap-2 flex-1 sm:flex-initial"
                  >
                    <Palette className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Color</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {colorError && (
                  <Alert variant="destructive">
                    <AlertDescription>{colorError}</AlertDescription>
                  </Alert>
                )}
                {selectedColors.map((color, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2 flex-1 w-full">
                      <Label className="text-sm font-medium min-w-16 sm:min-w-20">Color {index + 1}</Label>
                      <Input
                        type="color"
                        value={color}
                        onChange={(e) => updateColor(index, e.target.value)}
                        className="w-16 sm:w-20 h-10 cursor-pointer flex-shrink-0"
                      />
                      <Input
                        type="text"
                        value={color}
                        onChange={(e) => updateColor(index, e.target.value)}
                        placeholder="#000000"
                        className="flex-1 min-w-0"
                      />
                    </div>
                    <div className="flex items-center gap-1 self-end sm:self-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveColor(index, 'up')}
                        disabled={index === 0}
                        className={`p-2 ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                        title={index === 0 ? 'Cannot move first item up' : 'Move Up'}
                      >
                        <ArrowUp className="h-4 w-4 text-gray-500 dark:text-white" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveColor(index, 'down')}
                        disabled={index === selectedColors.length - 1}
                        className={`p-2 ${index === selectedColors.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                        title={index === selectedColors.length - 1 ? 'Cannot move last item down' : 'Move Down'}
                      >
                        <ArrowDown className="h-4 w-4 text-gray-500 dark:text-white" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeColor(index)}
                        disabled={selectedColors.length === 1}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Theme Preview inspired by design stash */}
              <div className="p-4 border rounded-2xl bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
                  <p className="text-sm font-semibold">Theme Preview</p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Live preview</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div
                    className="rounded-2xl p-5 text-white shadow-lg min-h-[180px] flex flex-col justify-between overflow-hidden"
                    style={gradientPreviewStyle}
                  >
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.25em] opacity-80">Gradient Banner</p>
                      <p className="text-xl font-semibold mt-2">Primary Hero</p>
                      <p className="text-sm opacity-90">Preview how gradients appear across your workspace.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                      <span className="px-2 py-1 rounded-full bg-black/25 backdrop-blur">Primary · {primaryPreviewColor}</span>
                      <span className="px-2 py-1 rounded-full bg-black/25 backdrop-blur">Secondary · {secondaryPreviewColor}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-white shadow transition-transform hover:scale-[1.01]"
                        style={{ backgroundColor: primaryPreviewColor }}
                        disabled
                      >
                        Primary Button
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-lg text-sm font-semibold border transition-colors"
                        style={{
                          color: secondaryPreviewColor,
                          borderColor: secondaryPreviewColor,
                          backgroundColor: `${secondaryPreviewColor}14`,
                        }}
                        disabled
                      >
                        Secondary Button
                      </button>
                      <span
                        className="px-3 py-1 text-xs font-semibold rounded-full border"
                        style={{
                          color: secondaryPreviewColor,
                          borderColor: `${secondaryPreviewColor}80`,
                          backgroundColor: `${secondaryPreviewColor}14`,
                        }}
                      >
                        Accent Badge
                      </span>
                    </div>
                    <div className="rounded-xl border border-dashed p-3">
                      <p className="text-xs tracking-wide text-gray-500 dark:text-gray-400 mb-2">Palette Chips</p>
                      <div className="flex gap-3 flex-wrap">
                        {selectedColors.map((color, index) => (
                          <div key={`${color}-${index}`} className="flex items-center gap-2">
                            <div
                              className="w-10 h-10 rounded-lg border shadow-sm"
                              style={{ backgroundColor: color }}
                              title={`Color ${index + 1}: ${color}`}
                            />
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-200">
                              {`Color ${index + 1}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full text-white gap-2"
            style={{ backgroundColor: 'var(--custom-color-1)' }}
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Appearance Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Reset Theme Confirmation Dialog */}
      <AlertDialog open={showResetThemeDialog} onOpenChange={setShowResetThemeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Theme Colors</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset the theme colors to default (Purple and Orange)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={resetToDefaultColors}
              style={{ backgroundColor: 'var(--custom-color-1)' }}
            >
              Reset Theme
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
