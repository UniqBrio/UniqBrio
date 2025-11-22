"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Switch } from "@/components/dashboard/ui/switch"
import { Label } from "@/components/dashboard/ui/label"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Palette, Globe, Save, X, ArrowUp, ArrowDown, RotateCcw } from "lucide-react"
import { toast } from "@/components/dashboard/ui/use-toast"
import { useApp } from "@/contexts/dashboard/app-context"
import { DATE_FORMATS } from "./date-formats"

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

export function AppearanceSettings({ preferences, onUpdate }: AppearanceSettingsProps) {
  const { theme, toggleTheme } = useApp()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingFormats, setIsLoadingFormats] = useState(true)
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true)
  const DEFAULT_COLORS = ["#8b5cf6", "#DE7D14"]
  const [selectedColors, setSelectedColors] = useState<string[]>(
    preferences?.customColors || DEFAULT_COLORS
  )
  const [dateFormats, setDateFormats] = useState<DateFormat[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [currencySearch, setCurrencySearch] = useState("")
  const [settings, setSettings] = useState({
    dateFormat: preferences?.dateFormat || "MM/DD/YYYY",
    timeFormat: preferences?.timeFormat || "12h",
    currency: preferences?.currency || "USD",
  })

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
        const popularCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AUD', 'CAD', 'CNY']
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
          { code: "USD", name: "US Dollar", symbol: "$" },
          { code: "EUR", name: "Euro", symbol: "�" },
          { code: "GBP", name: "British Pound", symbol: "�" },
          { code: "JPY", name: "Japanese Yen", symbol: "�" },
          { code: "INR", name: "Indian Rupee", symbol: "?" },
          { code: "AUD", name: "Australian Dollar", symbol: "A$" },
          { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
          { code: "CNY", name: "Chinese Yuan", symbol: "�" },
        ])
      } finally {
        setIsLoadingCurrencies(false)
      }
    }

    fetchCurrencies()
  }, [])

  // Helper function to get currency symbols
  const getCurrencySymbol = (code: string): string => {
    const symbols: { [key: string]: string } = {
      USD: "$", EUR: "�", GBP: "�", JPY: "�", INR: "?",
      AUD: "A$", CAD: "C$", CNY: "�", CHF: "Fr", BRL: "R$",
      MXN: "$", ZAR: "R", SEK: "kr", NOK: "kr", DKK: "kr",
      RUB: "?", KRW: "?", SGD: "S$", HKD: "HK$", NZD: "NZ$"
    }
    return symbols[code] || code
  }

  const addColor = () => {
    if (selectedColors.length < 5) {
      setSelectedColors([...selectedColors, "#000000"])
    } else {
      toast({
        title: "Maximum reached",
        description: "You can only select up to 5 colors.",
        variant: "destructive",
      })
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
    } else {
      toast({
        title: "Cannot remove",
        description: "You must have at least one color selected.",
        variant: "destructive",
      })
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
    toast({
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
      await onUpdate({ ...settings, theme, customColors: selectedColors })
      toast({
        title: "Appearance Updated",
        description: "Your appearance preferences have been saved.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update appearance settings.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-600" />
            Theme Preferences
          </CardTitle>
          <CardDescription>
            Customize the appearance of your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Color Palette Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Custom Color Palette</Label>
                <p className="text-sm text-gray-500 mt-1">
                  Select up to 5 colors for your theme ({selectedColors.length}/5)
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetToDefaultColors}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Theme
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addColor}
                  disabled={selectedColors.length >= 5}
                  className="gap-2"
                >
                  <Palette className="h-4 w-4" />
                  Add Color
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {selectedColors.map((color, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2 flex-1">
                    <Label className="text-sm font-medium min-w-20">Color {index + 1}</Label>
                    <Input
                      type="color"
                      value={color}
                      onChange={(e) => updateColor(index, e.target.value)}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={color}
                      onChange={(e) => updateColor(index, e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveColor(index, 'up')}
                      disabled={index === 0}
                      className={`p-2 ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                      title={index === 0 ? 'Cannot move first item up' : 'Move Up'}
                    >
                      <ArrowUp className="h-4 w-4 text-gray-500" />
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
                      <ArrowDown className="h-4 w-4 text-gray-500" />
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

            {/* Color Preview */}
            <div className="p-4 border rounded-lg bg-white">
              <p className="text-sm font-medium mb-3">Color Preview</p>
              <div className="flex gap-2 flex-wrap">
                {selectedColors.map((color, index) => (
                  <div
                    key={index}
                    className="w-16 h-16 rounded-lg shadow-md border-2 border-gray-200 transition-transform hover:scale-105"
                    style={{ backgroundColor: color }}
                    title={`Color ${index + 1}: ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Localization Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-600" />
            Localization
          </CardTitle>
          <CardDescription>
            Set your date and time preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select
              value={settings.dateFormat}
              onValueChange={(value) => setSettings(prev => ({ ...prev, dateFormat: value }))}
              disabled={isLoadingFormats}
            >
              <SelectTrigger id="dateFormat">
                <SelectValue placeholder={isLoadingFormats ? "Loading formats..." : "Select date format"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                {dateFormats.map((format, idx) => (
                  <SelectItem key={`${format.format}-${idx}`} value={format.format}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeFormat">Time Format</Label>
            <Select
              value={settings.timeFormat}
              onValueChange={(value) => setSettings(prev => ({ ...prev, timeFormat: value }))}
            >
              <SelectTrigger id="timeFormat">
                <SelectValue placeholder="Select time format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                <SelectItem value="24h">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={settings.currency}
              onValueChange={(value) => {
                setSettings(prev => ({ ...prev, currency: value }))
                setCurrencySearch("")
              }}
              disabled={isLoadingCurrencies}
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder={isLoadingCurrencies ? "Loading currencies..." : "Select currency"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]" hideScrollButtons>
                <div className="sticky top-0 z-10 bg-white p-2 border-b" onPointerDown={(e) => e.preventDefault()}>
                  <Input
                    placeholder="Search currencies..."
                    value={currencySearch}
                    onChange={(e) => {
                      setCurrencySearch(e.target.value)
                    }}
                    onKeyDown={(e) => {
                      e.stopPropagation()
                    }}
                    className="h-8"
                    autoFocus
                    onPointerDown={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="overflow-y-auto max-h-[250px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {filteredCurrencies.length > 0 ? (
                    filteredCurrencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No currencies found
                    </div>
                  )}
                </div>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-purple-600 hover:bg-purple-700 gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Appearance Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
