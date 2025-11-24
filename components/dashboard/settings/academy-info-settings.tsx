"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Label } from "@/components/dashboard/ui/label"
import { Input } from "@/components/dashboard/ui/input"
import { Textarea } from "@/components/dashboard/ui/textarea"
import { Button } from "@/components/dashboard/ui/button"
import { Badge } from "@/components/dashboard/ui/badge"
import { Switch } from "@/components/dashboard/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { CountryStateDropdown } from "@/components/dashboard/ui/staff/country-state-dropdown"
import { useCountryCodes } from "@/hooks/dashboard/staff/use-country-codes"
import { 
  GraduationCap, 
  Upload, 
  Plus,
  X, 
  Image as ImageIcon,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Users,
  Award,
  Calendar,
  Info,
  Map,
  DollarSign
} from "lucide-react"
import { toast } from "@/components/dashboard/ui/use-toast"

interface AcademyInfoSettingsProps {
  onUpdate?: (updates: any) => Promise<void>
}

export function AcademyInfoSettings({ onUpdate }: AcademyInfoSettingsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const logoInputRefBasic = useRef<HTMLInputElement>(null)
  const { countryCodes, loading: countryCodesLoading } = useCountryCodes()
  const [currencySearch, setCurrencySearch] = useState("")
  const [currencies, setCurrencies] = useState<Array<{code: string, name: string, symbol: string}>>([])
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true)

  // Temporarily disable Banner & Logo section
  const brandingComingSoon = true

  // Fetch currencies from API
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        setIsLoadingCurrencies(true)
        const response = await fetch('https://openexchangerates.org/api/currencies.json')
        
        if (!response.ok) {
          throw new Error('Failed to fetch currencies')
        }
        
        const data = await response.json()
        const popularCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AUD', 'CAD', 'CNY']
        const currencyList: Array<{code: string, name: string, symbol: string}> = []
        
        popularCurrencies.forEach(code => {
          if (data[code]) {
            currencyList.push({ code, name: data[code], symbol: getCurrencySymbol(code) })
          }
        })
        
        Object.keys(data).forEach(code => {
          if (!popularCurrencies.includes(code)) {
            currencyList.push({ code, name: data[code], symbol: getCurrencySymbol(code) })
          }
        })
        
        setCurrencies(currencyList)
      } catch (error) {
        console.error('Error fetching currencies:', error)
        setCurrencies([
          { code: "USD", name: "US Dollar", symbol: "$" },
          { code: "EUR", name: "Euro", symbol: "€" },
          { code: "GBP", name: "British Pound", symbol: "£" },
          { code: "JPY", name: "Japanese Yen", symbol: "¥" },
          { code: "INR", name: "Indian Rupee", symbol: "₹" },
          { code: "AUD", name: "Australian Dollar", symbol: "A$" },
          { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
          { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
        ])
      } finally {
        setIsLoadingCurrencies(false)
      }
    }

    fetchCurrencies()
  }, [])

  const getCurrencySymbol = (code: string): string => {
    const symbols: { [key: string]: string } = {
      USD: "$", EUR: "€", GBP: "£", JPY: "¥", INR: "₹",
      AUD: "A$", CAD: "C$", CNY: "¥", CHF: "Fr", BRL: "R$",
      MXN: "$", ZAR: "R", SEK: "kr", NOK: "kr", DKK: "kr",
      RUB: "₽", KRW: "₩", SGD: "S$", HKD: "HK$", NZD: "NZ$"
    }
    return symbols[code] || code
  }

  const filteredCurrencies = currencies.filter(currency =>
    currency.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
    currency.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
    currency.symbol.includes(currencySearch)
  )

  const [formData, setFormData] = useState({
    academyName: "",
    branchName: "",
    bannerName: "",
    bannerDescription: "",
    tagline: "",
    foundedYear: new Date().getFullYear().toString(),
    currency: "USD",
    address: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    phone: "",
    email: "",
    website: "",
    location: {
      latitude: "",
      longitude: "",
      mapUrl: "",
    },
    socialMedia: {
      facebook: "",
      instagram: "",
      twitter: "",
      youtube: "",
      linkedin: "",
    },
  })

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "banner" | "logo"
  ) => {
    if (brandingComingSoon) return
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        if (type === "banner") {
          setBannerPreview(result)
        } else {
          setLogoPreview(result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Enabled logo upload for Basic Information section
  const handleLogoUploadBasic = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        })
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setLogoPreview(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = (type: "banner" | "logo") => {
    if (brandingComingSoon) return
    if (type === "banner") {
      setBannerPreview(null)
      if (bannerInputRef.current) bannerInputRef.current.value = ""
    } else {
      setLogoPreview(null)
      if (logoInputRef.current) logoInputRef.current.value = ""
    }
  }

  // Removal for Basic Information logo
  const removeLogoBasic = () => {
    setLogoPreview(null)
    if (logoInputRefBasic.current) logoInputRefBasic.current.value = ""
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleNestedInputChange = (parent: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof typeof prev] as any),
        [field]: value,
      },
    }))
  }

  // Currency mapping based on country
  const getCurrencyByCountry = (countryCode: string): string => {
    const currencyMap: Record<string, string> = {
      US: "USD", CA: "CAD", GB: "GBP", IN: "INR", AU: "AUD", NZ: "NZD",
      JP: "JPY", CN: "CNY", KR: "KRW", SG: "SGD", MY: "MYR", TH: "THB",
      PH: "PHP", ID: "IDR", VN: "VND", AE: "AED", SA: "SAR", ZA: "ZAR",
      BR: "BRL", MX: "MXN", AR: "ARS", CL: "CLP", CO: "COP", PE: "PEN",
      EU: "EUR", DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR",
      BE: "EUR", AT: "EUR", PT: "EUR", IE: "EUR", FI: "EUR", GR: "EUR",
      CH: "CHF", NO: "NOK", SE: "SEK", DK: "DKK", PL: "PLN", CZ: "CZK",
      HU: "HUF", RO: "RON", TR: "TRY", RU: "RUB", UA: "UAH", EG: "EGP",
      NG: "NGN", KE: "KES", GH: "GHS", TZ: "TZS", UG: "UGX", BD: "BDT",
      PK: "PKR", LK: "LKR", NP: "NPR", MM: "MMK", KH: "KHR", LA: "LAK",
      HK: "HKD", TW: "TWD", MO: "MOP", IL: "ILS", JO: "JOD", KW: "KWD",
      QA: "QAR", OM: "OMR", BH: "BHD", LB: "LBP", IQ: "IQD", IR: "IRR",
    }
    return currencyMap[countryCode] || "USD"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (onUpdate) {
        await onUpdate({
          ...formData,
          bannerImage: bannerPreview,
          logoImage: logoPreview,
        })
      }

      toast({
        title: "Success",
        description: "Academy information updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update academy information",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-600" />
              <CardTitle>Basic Information</CardTitle>
            </div>
            <Button 
              type="button"
              variant="outline" 
              disabled={true}
              className="gap-2 bg-gray-50 cursor-not-allowed"
            >
              
              <Plus className="h-4 w-4" /> Add Branch
              <Image src="/Coming soon.svg" alt="Coming Soon" width={16} height={16} className="inline-block" />
            </Button>
          </div>
          <CardDescription>Essential details about your academy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="academyName">Academy Name *</Label>
              <Input
                id="academyName"
                placeholder="e.g., Elite Arts & Sports Academy"
                value={formData.academyName}
                onChange={(e) => handleInputChange("academyName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branchName">Branch Name</Label>
              <div className="flex gap-2">
                <Input
                  id="branchName"
                  placeholder="e.g., Downtown Branch, Main Campus"
                  value={formData.branchName}
                  onChange={(e) => handleInputChange("branchName", e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={true}
                  className="gap-1 shrink-0 bg-gray-50 cursor-not-allowed whitespace-nowrap"
                  title="Map Location"
                >
                  <MapPin className="h-4 w-4" />
                  <span>Map Location  </span>
                  <Image src="/Coming soon.svg" alt="Coming Soon" width={16} height={16} className="inline-block" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                placeholder="e.g., Excellence in Arts & Sports Education"
                value={formData.tagline}
                onChange={(e) => handleInputChange("tagline", e.target.value)}
              />
              
            </div>
            <div className="space-y-2">
              <Label htmlFor="foundedYear">Founded Year</Label>
              <Input
                id="foundedYear"
                type="number"
                placeholder="e.g., 2010"
                value={formData.foundedYear}
                onChange={(e) => {
                  const value = e.target.value
                  // Only allow 4-digit years
                  if (value === "" || (value.length <= 4 && /^\d+$/.test(value))) {
                    handleInputChange("foundedYear", value)
                  }
                }}
                onBlur={(e) => {
                  // Ensure it's exactly 4 digits on blur
                  const value = e.target.value
                  if (value && value.length !== 4) {
                    const currentYear = new Date().getFullYear()
                    handleInputChange("foundedYear", currentYear.toString())
                    toast({
                      title: "Invalid Year",
                      description: "Year must be exactly 4 digits. Reset to current year.",
                      variant: "destructive",
                    })
                  }
                }}
                min="1900"
                max={new Date().getFullYear().toString()}
                maxLength={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Preferred Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => {
                  handleInputChange("currency", value)
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
              <p className="text-xs text-gray-500">Auto-set based on country selection</p>
            </div>
            {/* Academy Logo (Enabled) */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="logoBasic">Academy Logo</Label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-purple-200">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeLogoBasic}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => logoInputRefBasic.current?.click()}
                    className="w-24 h-24 border-2 border-dashed border-purple-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
                  >
                    <Upload className="h-6 w-6 text-purple-400 mb-1" />
                    <p className="text-xs text-gray-600 text-center px-2">Upload logo</p>
                    <p className="text-xs text-gray-400">Max 5MB</p>
                  </div>
                )}
                <input
                  ref={logoInputRefBasic}
                  id="logoBasic"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUploadBasic}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-purple-600" />
            <CardTitle>Contact Information</CardTitle>
          </div>
          <CardDescription>How people can reach your academy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CountryStateDropdown
              country={formData.country}
              state={formData.state}
              onCountryChange={(value) => {
                const newCurrency = getCurrencyByCountry(value)
                setFormData(f => ({
                  ...f,
                  country: value,
                  state: "",
                  currency: newCurrency,
                }))
              }}
              onStateChange={(value) => {
                setFormData(f => ({ ...f, state: value }))
              }}
              mode="country"
            />
            <CountryStateDropdown
              country={formData.country}
              state={formData.state}
              onCountryChange={(value) => {
                setFormData(f => ({ ...f, country: value, state: "" }))
              }}
              onStateChange={(value) => {
                setFormData(f => ({ ...f, state: value }))
              }}
              mode="state"
            />
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="New York"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP/Postal Code</Label>
              <Input
                id="zipCode"
                placeholder="10001"
                value={formData.zipCode}
                onChange={(e) => handleInputChange("zipCode", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="hidden sm:block absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="sm:pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                placeholder="123 Main Street"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="hidden sm:block absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@academy.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="sm:pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="hidden sm:block absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="website"
                  type="url"
                  placeholder="https://www.academy.com"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  className="sm:pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

   
      {/* Social Media */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            <CardTitle>Social Media</CardTitle>
          </div>
          <CardDescription>Connect your social media profiles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                placeholder="https://facebook.com/youracademy"
                value={formData.socialMedia.facebook}
                onChange={(e) => handleNestedInputChange("socialMedia", "facebook", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                placeholder="https://instagram.com/youracademy"
                value={formData.socialMedia.instagram}
                onChange={(e) => handleNestedInputChange("socialMedia", "instagram", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter/X</Label>
              <Input
                id="twitter"
                placeholder="https://twitter.com/youracademy"
                value={formData.socialMedia.twitter}
                onChange={(e) => handleNestedInputChange("socialMedia", "twitter", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtube">YouTube</Label>
              <Input
                id="youtube"
                placeholder="https://youtube.com/@youracademy"
                value={formData.socialMedia.youtube}
                onChange={(e) => handleNestedInputChange("socialMedia", "youtube", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                placeholder="https://linkedin.com/company/youracademy"
                value={formData.socialMedia.linkedin}
                onChange={(e) => handleNestedInputChange("socialMedia", "linkedin", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
        <Button type="button" variant="outline" disabled={isLoading} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700">
          {isLoading ? "Saving..." : "Save Academy Information"}
        </Button>
      </div>
    </form>
  )
}
