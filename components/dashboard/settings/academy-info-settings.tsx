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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dashboard/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/dashboard/ui/radio-group"
import { CountryStateDropdown } from "@/components/dashboard/ui/staff/country-state-dropdown"
import { useCountryCodes } from "@/hooks/dashboard/staff/use-country-codes"
import { useCurrency } from "@/contexts/currency-context"
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
  const { setCurrency } = useCurrency()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null)
  const [businessNameFilePreview, setBusinessNameFilePreview] = useState<string | null>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const logoInputRefBasic = useRef<HTMLInputElement>(null)
  const { countryCodes, loading: countryCodesLoading } = useCountryCodes()
  const [currencySearch, setCurrencySearch] = useState("")
  const [currencies, setCurrencies] = useState<Array<{code: string, name: string, symbol: string}>>([])
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true)
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false)
  const [pendingCurrency, setPendingCurrency] = useState<string>("")
  const [currencyChangeOption, setCurrencyChangeOption] = useState<"display" | "convert">("display")
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)
  const [exchangeRateSource, setExchangeRateSource] = useState<string>("")
  const [loadingExchangeRate, setLoadingExchangeRate] = useState(false)
  const [exchangeRateDate, setExchangeRateDate] = useState<string>("")

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
        const popularCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CNY']
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

  const getCurrencySymbol = (code: string): string => {
    const symbols: { [key: string]: string } = {
      USD: "", EUR: "", GBP: "", JPY: "",
      AUD: "", CAD: "", CNY: "", CHF: "", BRL: "",
      MXN: "", ZAR: "", SEK: "", NOK: "", DKK: "",
      RUB: "", KRW: "", SGD: "", HKD: "", NZD: ""
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
    legalEntityName: "",
    bannerName: "",
    bannerDescription: "",
    tagline: "",
    foundedYear: new Date().getFullYear().toString(),
    currency: "",
    industryType: "",
    servicesOffered: [] as string[],
    studentSize: "",
    staffCount: "",
    address: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    phone: "",
    email: "",
    website: "",
    taxId: "",
    preferredLanguage: "",
    logo: null as File | null,
    profilePicture: null as File | null,
    businessNameFile: null as File | null,
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

  // Fetch academy info from registration data on mount
  useEffect(() => {
    const fetchAcademyInfo = async () => {
      try {
        setIsFetching(true)
        const response = await fetch("/api/dashboard/academy-info", {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        
        console.log("Academy Info Response Status:", response.status)
        console.log("Academy Info Response OK:", response.ok)
        
        if (response.ok) {
          const data = await response.json()
          console.log("Academy Info Data:", data)
          const businessInfo = data.businessInfo
          
          if (!businessInfo) {
            console.warn("No businessInfo found in response")
            toast({
              title: "No Data",
              description: "No academy information found. Please complete your registration.",
              variant: "destructive",
            })
            return
          }
          
          // Map registration businessInfo to formData
          setFormData(prev => ({
            ...prev,
            academyName: businessInfo.businessName || "",
            legalEntityName: businessInfo.legalEntityName || "",
            tagline: businessInfo.tagline || "",
            phone: businessInfo.phoneNumber || "",
            email: businessInfo.businessEmail || "",
            industryType: businessInfo.industryType || "",
            servicesOffered: businessInfo.servicesOffered || [],
            studentSize: businessInfo.studentSize || "",
            staffCount: businessInfo.staffCount || "",
            country: businessInfo.country || "",
            state: businessInfo.state || "",
            address: businessInfo.address || "",
            city: businessInfo.city || "",
            zipCode: businessInfo.pincode || "",
            website: businessInfo.website || "",
            taxId: businessInfo.taxId || "",
            preferredLanguage: businessInfo.preferredLanguage || "",
            // Set currency from backend, or auto-set from country, or fallback to country mapping
            currency: businessInfo.currency || (businessInfo.country ? getCurrencyByCountry(businessInfo.country) : ""),
          }))

          // Set image previews if they exist in the backend
          if (businessInfo.logo) {
            setLogoPreview(businessInfo.logo)
          }
          if (businessInfo.profilePicture) {
            setProfilePicturePreview(businessInfo.profilePicture)
          }
          if (businessInfo.businessNameFile) {
            setBusinessNameFilePreview(businessInfo.businessNameFile)
          }
        } else {
          let errorMessage = "Failed to load academy information"
          try {
            const errorData = await response.json()
            console.error("API Error Response:", errorData)
            errorMessage = errorData.error || errorMessage
          } catch (e) {
            const errorText = await response.text()
            console.error("API Error Text:", errorText)
            errorMessage = errorText || errorMessage
          }
          
          toast({
            title: `Error (${response.status})`,
            description: errorMessage,
            variant: "destructive",
          })
        }
      } catch (error) {
        // Silently handle fetch errors (network issues, API unavailable)
        if (process.env.NODE_ENV === 'development') {
          console.warn('[AcademyInfoSettings] Failed to fetch academy info:', error)
        }
        // Don't show error toast to avoid spamming users
      } finally {
        setIsFetching(false)
      }
    }

    fetchAcademyInfo()
  }, [])

  // Fetch exchange rate when dialog opens with convert option
  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (!showCurrencyDialog || !pendingCurrency || !formData.currency || pendingCurrency === formData.currency) {
        setExchangeRate(null)
        return
      }

      setLoadingExchangeRate(true)
      try {
        // Try primary API: exchangerate-api.com
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${formData.currency}`)
        if (response.ok) {
          const data = await response.json()
          if (data.rates && data.rates[pendingCurrency]) {
            setExchangeRate(data.rates[pendingCurrency])
            setExchangeRateSource("exchangerate-api.com")
            setExchangeRateDate(new Date(data.time_last_updated * 1000).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }))
          }
        }
      } catch (error) {
        console.error("Error fetching exchange rate:", error)
        // Try fallback API: frankfurter.app
        try {
          const response = await fetch(`https://api.frankfurter.app/latest?from=${formData.currency}&to=${pendingCurrency}`)
          if (response.ok) {
            const data = await response.json()
            if (data.rates && data.rates[pendingCurrency]) {
              setExchangeRate(data.rates[pendingCurrency])
              setExchangeRateSource("frankfurter.app")
              setExchangeRateDate(new Date(data.date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }))
            }
          }
        } catch (fallbackError) {
          console.error("Fallback exchange rate API also failed:", fallbackError)
        }
      } finally {
        setLoadingExchangeRate(false)
      }
    }

    fetchExchangeRate()
  }, [showCurrencyDialog, pendingCurrency, formData.currency])

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

  // Handle profile picture upload
  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 2MB",
          variant: "destructive",
        })
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      handleInputChange("profilePicture", file)
    }
  }

  // Handle business name file upload
  const handleBusinessNameFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 2MB",
          variant: "destructive",
        })
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setBusinessNameFilePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      handleInputChange("businessNameFile", file)
    }
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
      US: "USD", CA: "CAD", GB: "GBP", IN: "USD", AU: "AUD", NZ: "NZD",
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
    return currencyMap[countryCode] || ""
  }

  const handleCurrencyChange = (newCurrency: string) => {
    // If currency is actually changing, show dialog
    if (newCurrency !== formData.currency) {
      setPendingCurrency(newCurrency)
      setShowCurrencyDialog(true)
    }
  }

  const confirmCurrencyChange = async () => {
    const oldCurrency = formData.currency
    const newCurrency = pendingCurrency
    
    // Update the currency in formData
    handleInputChange("currency", newCurrency)
    setCurrencySearch("")
    
    try {
      // Update in backend immediately
      const businessInfo = {
        businessName: formData.academyName,
        legalEntityName: formData.legalEntityName,
        businessEmail: formData.email,
        phoneNumber: formData.phone,
        industryType: formData.industryType,
        servicesOffered: formData.servicesOffered,
        studentSize: formData.studentSize,
        staffCount: formData.staffCount,
        country: formData.country,
        state: formData.state,
        address: formData.address,
        city: formData.city,
        pincode: formData.zipCode,
        website: formData.website,
        taxId: formData.taxId,
        preferredLanguage: formData.preferredLanguage,
        tagline: formData.tagline,
        foundedYear: formData.foundedYear,
        currency: newCurrency,
        currencyChangeOption: currencyChangeOption, // Store which option was selected
        socialMedia: formData.socialMedia,
        logo: logoPreview,
        profilePicture: profilePicturePreview,
        businessNameFile: businessNameFilePreview,
      }

      // Save to backend
      await fetch("/api/dashboard/academy-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessInfo }),
      })

      // If convert option selected, trigger currency conversion across all prices in the system
      if (currencyChangeOption === "convert") {
        // Call API to convert all prices in the database and WAIT for it to complete
        const conversionResponse = await fetch("/api/dashboard/convert-currency", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            fromCurrency: oldCurrency, 
            toCurrency: newCurrency 
          }),
        })
        
        const conversionResult = await conversionResponse.json()
        console.log('[Currency Conversion] Result:', conversionResult)
      }

      setShowCurrencyDialog(false)
      
      // Update the currency context immediately
      setCurrency(newCurrency)
      
      // Dispatch custom event to notify all components
      window.dispatchEvent(new Event('currencyUpdated'))
      
      toast({
        title: currencyChangeOption === "display" ? "Currency Code Replaced" : "Currency Converted",
        description: currencyChangeOption === "display" 
          ? `Currency changed to ${newCurrency}. All prices now display in ${newCurrency} with the same values.`
          : `Currency converted to ${newCurrency}. All prices have been recalculated using current exchange rates.`,
      })

      // Reload the page to reflect changes throughout the app
      setTimeout(() => {
        window.location.reload()
      }, 2000)
      
    } catch (error) {
      console.error("Error updating currency:", error)
      toast({
        title: "Error",
        description: "Failed to update currency. Please try again.",
        variant: "destructive",
      })
      // Revert currency change on error
      handleInputChange("currency", oldCurrency)
    }
  }

  const cancelCurrencyChange = () => {
    setShowCurrencyDialog(false)
    setPendingCurrency("")
    setCurrencyChangeOption("display")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Map formData back to businessInfo structure
      const businessInfo = {
        businessName: formData.academyName,
        legalEntityName: formData.legalEntityName,
        businessEmail: formData.email,
        phoneNumber: formData.phone,
        industryType: formData.industryType,
        servicesOffered: formData.servicesOffered,
        studentSize: formData.studentSize,
        staffCount: formData.staffCount,
        country: formData.country,
        state: formData.state,
        address: formData.address,
        city: formData.city,
        pincode: formData.zipCode,
        website: formData.website,
        taxId: formData.taxId,
        preferredLanguage: formData.preferredLanguage,
        // Additional fields from academy info
        tagline: formData.tagline,
        foundedYear: formData.foundedYear,
        currency: formData.currency,
        socialMedia: formData.socialMedia,
        // Image URLs (keep existing if not changed)
        logo: logoPreview,
        profilePicture: profilePicturePreview,
        businessNameFile: businessNameFilePreview,
      }

      // Update registration data via API
      const response = await fetch("/api/dashboard/academy-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessInfo }),
      })

      if (!response.ok) throw new Error("Failed to update")

      // Also call the parent onUpdate if provided
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
      {isFetching ? (
        <Card>
          <CardContent className="py-10">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600 dark:text-white">Loading academy information...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
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
              <Label htmlFor="legalEntityName">Legal Entity Name</Label>
              <Input
                id="legalEntityName"
                placeholder="e.g., Elite Arts & Sports LLC"
                value={formData.legalEntityName}
                onChange={(e) => handleInputChange("legalEntityName", e.target.value)}
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
                onValueChange={handleCurrencyChange}
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
                      <div className="p-4 text-center text-sm text-gray-500 dark:text-white">
                        No currencies found
                      </div>
                    )}
                  </div>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-white">Auto-set based on country selection</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="industryType">Industry Type</Label>
              <Select
                value={formData.industryType}
                onValueChange={(value) => handleInputChange("industryType", value)}
              >
                <SelectTrigger id="industryType">
                  <SelectValue placeholder="Select industry type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="arts">Arts</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="arts_sports">Arts & Sports</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="servicesOffered">Services Offered</Label>
              <Input
                id="servicesOffered"
                placeholder="e.g., Painting, Music, Football, Dance"
                value={Array.isArray(formData.servicesOffered) ? formData.servicesOffered.join(", ") : ""}
                onChange={(e) => {
                  const services = e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                  handleInputChange("servicesOffered", services)
                }}
              />
              <p className="text-xs text-gray-500 dark:text-white">Enter services separated by commas</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentSize">Student/Client Size</Label>
              <Select
                value={formData.studentSize}
                onValueChange={(value) => handleInputChange("studentSize", value)}
              >
                <SelectTrigger id="studentSize">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="micro">Micro (1-20 students)</SelectItem>
                  <SelectItem value="small">Small (21-50 students)</SelectItem>
                  <SelectItem value="medium">Medium (51-200 students)</SelectItem>
                  <SelectItem value="large">Large (201-500 students)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (500+ students)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staffCount">Staff/Instructor Count</Label>
              <Select
                value={formData.staffCount}
                onValueChange={(value) => handleInputChange("staffCount", value)}
              >
                <SelectTrigger id="staffCount">
                  <SelectValue placeholder="Select count" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solo">Solo (1 instructor)</SelectItem>
                  <SelectItem value="small">Small Team (2-5)</SelectItem>
                  <SelectItem value="medium">Medium Team (6-15)</SelectItem>
                  <SelectItem value="large">Large Team (16+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredLanguage">Preferred Language</Label>
              <Input
                id="preferredLanguage"
                placeholder="e.g., English"
                value={formData.preferredLanguage}
                onChange={(e) => handleInputChange("preferredLanguage", e.target.value)}
              />
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
                    <p className="text-xs text-gray-600 dark:text-white text-center px-2">Upload logo</p>
                    <p className="text-xs text-gray-400 dark:text-white">Max 5MB</p>
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
                <Phone className="hidden sm:block absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-white" />
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
                <Mail className="hidden sm:block absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-white" />
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
                <Globe className="hidden sm:block absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-white" />
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
            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID</Label>
              <Input
                id="taxId"
                placeholder="Enter your Tax ID"
                value={formData.taxId}
                onChange={(e) => handleInputChange("taxId", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branding Assets */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-purple-600" />
            <CardTitle>Branding Assets</CardTitle>
          </div>
          <CardDescription>Upload your academy branding materials</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label htmlFor="logoUpload">Business Logo</Label>
              <Input
                id="logoUpload"
                ref={logoInputRefBasic}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={handleLogoUploadBasic}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">PNG, JPG, JPEG, SVG (Max 5MB)</p>
              {logoPreview && (
                <div className="mt-2 space-y-2">
                  <div className="w-20 h-20 rounded border overflow-hidden flex items-center justify-center bg-gray-50">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeLogoBasic}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>

            {/* Business Name File Upload */}
            <div className="space-y-2">
              <Label htmlFor="businessNameFileUpload">Business Name Image</Label>
              <Input
                id="businessNameFileUpload"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={handleBusinessNameFileUpload}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">PNG, JPG, JPEG, SVG (Max 2MB)</p>
              {businessNameFilePreview && (
                <div className="mt-2 space-y-2">
                  <div className="w-20 h-20 rounded border overflow-hidden flex items-center justify-center bg-gray-50">
                    <img
                      src={businessNameFilePreview}
                      alt="Business name preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBusinessNameFilePreview(null)
                      handleInputChange("businessNameFile", null)
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>

            {/* Profile Picture Upload */}
            <div className="space-y-2">
              <Label htmlFor="profilePictureUpload">Profile Picture</Label>
              <Input
                id="profilePictureUpload"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={handleProfilePictureUpload}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">PNG, JPG, JPEG, SVG (Max 2MB)</p>
              {profilePicturePreview && (
                <div className="mt-2 space-y-2">
                  <div className="w-20 h-20 rounded-full border overflow-hidden flex items-center justify-center bg-gray-50">
                    <img
                      src={profilePicturePreview}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setProfilePicturePreview(null)
                      handleInputChange("profilePicture", null)
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
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
        </>
      )}

      {/* Currency Change Dialog */}
      <Dialog open={showCurrencyDialog} onOpenChange={setShowCurrencyDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>How do you want to change the currency?</DialogTitle>
            <DialogDescription>
              You're changing from <strong>{formData.currency}</strong> to <strong>{pendingCurrency}</strong>. 
              <br/>
              <span className="text-red-600 font-medium">Please select one option below:</span>
            </DialogDescription>
          </DialogHeader>
          
          <RadioGroup value={currencyChangeOption} onValueChange={(value: "display" | "convert") => setCurrencyChangeOption(value)}>
            <div className="space-y-3">
              {/* Option 1: Change Display */}
              <div 
                className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  currencyChangeOption === "display" 
                    ? "border-purple-500 bg-purple-50" 
                    : "border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => setCurrencyChangeOption("display")}
              >
                <RadioGroupItem value="display" id="display" className="mt-1" />
                <Label htmlFor="display" className="flex-1 cursor-pointer">
                  <div className="space-y-1">
                    <p className="font-semibold text-base">Option 1: Replace Currency Code</p>
                    <p className="text-xs text-gray-600 dark:text-white">
                      <strong>{formData.currency}</strong> will be replaced with <strong>{pendingCurrency}</strong> - keeps the same numbers
                    </p>
                    <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs text-blue-900 font-medium">
                        Example: {formData.currency} 5,000 → {pendingCurrency} 5,000
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        ✓ Price numbers stay the same<br/>
                        ✓ Only currency code changes
                      </p>
                    </div>
                  </div>
                </Label>
              </div>

              {/* Option 2: Convert */}
              <div 
                className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  currencyChangeOption === "convert" 
                    ? "border-purple-500 bg-purple-50" 
                    : "border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => setCurrencyChangeOption("convert")}
              >
                <RadioGroupItem value="convert" id="convert" className="mt-1" />
                <Label htmlFor="convert" className="flex-1 cursor-pointer">
                  <div className="space-y-1">
                    <p className="font-semibold text-base">Option 2: Convert Currency Values</p>
                    <p className="text-xs text-gray-600 dark:text-white">
                      <strong>{formData.currency}</strong> will be converted to <strong>{pendingCurrency}</strong> using exchange rates
                    </p>
                    <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                      {loadingExchangeRate ? (
                        <p className="text-xs text-green-900 font-medium">Loading exchange rate...</p>
                      ) : exchangeRate ? (
                        <>
                          <p className="text-xs text-green-900 font-medium">
                            Example: {formData.currency} 5,000 → {pendingCurrency} {(5000 * exchangeRate).toLocaleString(undefined, {maximumFractionDigits: 2})}
                          </p>
                          <div className="text-xs text-green-700 mt-2 space-y-1">
                            <p>✓ Prices recalculated at current rate</p>
                            <p>✓ Reflects actual currency value</p>
                            <div className="mt-2 pt-2 border-t border-green-300">
                              <p className="font-semibold">Exchange Rate: 1 {formData.currency} = {exchangeRate.toFixed(4)} {pendingCurrency}</p>
                              <p className="text-green-600 mt-1">Source: {exchangeRateSource}</p>
                              <p className="text-green-600">As of: {exchangeRateDate}</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-green-900 font-medium">
                            Example: {formData.currency} 5,000 → {pendingCurrency} (calculating...)
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            ✓ Prices recalculated at current rate<br/>
                            ✓ Reflects actual currency value
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-900">
              <strong>💡 Recommendation:</strong> Choose "Replace Currency Code" if you want to keep your existing price numbers (e.g., switching from USD to CAD for a new market). Choose "Convert Currency" only if you want to recalculate all prices based on exchange rates.
            </p>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={cancelCurrencyChange}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={confirmCurrencyChange} 
              className="bg-purple-600 hover:bg-purple-700"
            >
              {currencyChangeOption === "display" ? "Replace with " + pendingCurrency : "Convert to " + pendingCurrency}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
