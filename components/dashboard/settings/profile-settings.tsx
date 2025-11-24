"use client"

import React, { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Label } from "@/components/dashboard/ui/label"
import { Textarea } from "@/components/dashboard/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/dashboard/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/dashboard/ui/command"
import { User, Mail, Phone, MapPin, Calendar, Camera, Save, Check, ChevronDown, Pencil } from "lucide-react"
import { toast } from "@/components/dashboard/ui/use-toast"
import { isPossiblePhoneNumber } from "libphonenumber-js"
import { useCountryCodes } from "@/hooks/dashboard/staff/use-country-codes"
import { CountryStateDropdown } from "@/components/dashboard/ui/staff/country-state-dropdown"
import { cn } from "@/lib/dashboard/utils"

interface ProfileSettingsProps {
  user: any
  onUpdate: (updates: any) => Promise<void>
}

export function ProfileSettings({ user, onUpdate }: ProfileSettingsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { countryCodes, loading: countryCodesLoading } = useCountryCodes()
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: user?.name || "",
    firstName: user?.firstName || "",
    middleName: user?.middleName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    phoneCountryCode: user?.phoneCountryCode || "+1",
    mobile: user?.mobile || "",
    country: user?.country || "",
    stateProvince: user?.stateProvince || "",
    address: typeof user?.address === "string" ? user?.address : user?.address?.street || "",
    position: user?.position || "",
    linkedinUrl: user?.linkedinUrl || "",
    bio: user?.instructorProfile?.bio || user?.studentProfile?.goals?.join(", ") || "",
    avatar: user?.avatar || "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload only PNG or JPG images.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image must be smaller than 2MB.",
        variant: "destructive",
      })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
      setFormData(prev => ({ ...prev, avatar: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const validatePhone = (raw: string, countryIso?: string, dial?: string) => {
    const digits = raw.replace(/[^0-9]/g, "")
    if (!digits) {
      setPhoneError("Phone is required.")
      return false
    }
    let iso = countryIso
    if (!iso && dial && countryCodes?.length) {
      const match = countryCodes.find((c: any) => c.dial === dial)
      iso = match?.code
    }
    if (!iso) {
      setPhoneError(null)
      return true
    }
    const possible = isPossiblePhoneNumber(digits, iso as any)
    setPhoneError(possible ? null : `Invalid phone number length for ${iso}`)
    return possible
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await onUpdate(formData)
      setIsEditing(false)
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Manage your personal information and profile details
            </CardDescription>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} className="text-purple-600 bg-transparent hover:bg-purple-100 gap-2" title="Edit Profile" >
              <Pencil className="h-4 w-4" />
              
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="relative group">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <AvatarImage src={avatarPreview || user?.avatar} alt={user?.name} />
              <AvatarFallback className="text-2xl bg-purple-100 text-purple-700">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
              Change Photo
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              JPG or PNG. Max size 2MB.
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="firstName"
                placeholder="First name"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                disabled={!isEditing}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="middleName">Middle Name</Label>
            <Input
              id="middleName"
              placeholder="Middle name"
              value={formData.middleName}
              onChange={(e) => handleInputChange("middleName", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              placeholder="Last name"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={!isEditing}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Role/Position</Label>
            <Input
              id="position"
              placeholder="Founder, CEO, Director, etc."
              value={formData.position}
              onChange={(e) => handleInputChange("position", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input
              id="linkedinUrl"
              type="url"
              placeholder="https://linkedin.com/in/yourprofile"
              value={formData.linkedinUrl}
              onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <CountryCodeSelector
                value={formData.phoneCountryCode}
                onValueChange={(dial) => {
                  setFormData(f => {
                    const list = (countryCodes || []).filter((c: any) => c.dial === dial)
                    const keep = list.find((m: any) => m.code === f.country)
                    const nextCountry = keep ? f.country : (list[0]?.code || f.country)
                    return {
                      ...f,
                      phoneCountryCode: dial,
                      country: nextCountry,
                      stateProvince: keep ? f.stateProvince : "",
                    }
                  })
                  validatePhone(formData.phone, formData.country, dial)
                }}
                countryCodes={countryCodes}
                disabled={!isEditing}
              />
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                placeholder="555 987 6543"
                value={formData.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9\s-]/g, '')
                  handleInputChange("phone", val)
                  validatePhone(val, formData.country, formData.phoneCountryCode)
                }}
                onBlur={(e) => {
                  validatePhone(e.target.value, formData.country, formData.phoneCountryCode)
                }}
                disabled={!isEditing}
                className={cn("flex-1", phoneError ? "border-red-500 focus:ring-red-400" : "")}
              />
            </div>
            {phoneError && (
              <p className="mt-1 text-[12px] text-red-600">{phoneError}</p>
            )}
          </div>

          <CountryStateDropdown
            country={formData.country}
            state={formData.stateProvince}
            onCountryChange={(value) => {
              const match = countryCodes?.find((c: any) => c.code === value)
              setFormData(f => ({
                ...f,
                country: value,
                stateProvince: "",
                phoneCountryCode: match?.dial ?? f.phoneCountryCode,
              }))
              validatePhone(formData.phone, value, match?.dial ?? formData.phoneCountryCode)
            }}
            onStateChange={(value) => {
              setFormData(f => ({ ...f, stateProvince: value }))
            }}
            mode="country"
            disabled={!isEditing}
          />
          <CountryStateDropdown
            country={formData.country}
            state={formData.stateProvince}
            onCountryChange={(value) => {
              setFormData(f => ({ ...f, country: value, stateProvince: "" }))
            }}
            onStateChange={(value) => {
              setFormData(f => ({ ...f, stateProvince: value }))
            }}
            mode="state"
            disabled={!isEditing}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            placeholder="Street address"
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            disabled={!isEditing}
          />
        </div>

        {(user?.role === "instructor" || user?.role === "student") && (
          <div className="space-y-2">
            <Label htmlFor="bio">
              {user?.role === "instructor" ? "Bio" : "Learning Goals"}
            </Label>
            <Textarea
              id="bio"
              placeholder={user?.role === "instructor" ? "Tell us about yourself..." : "What do you want to learn?"}
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              disabled={!isEditing}
              rows={4}
            />
          </div>
        )}

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-purple-600 hover:bg-purple-700 gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                setAvatarPreview(user?.avatar || null)
                setPhoneError(null)
                setFormData({
                  name: user?.name || "",
                  firstName: user?.firstName || "",
                  middleName: user?.middleName || "",
                  lastName: user?.lastName || "",
                  email: user?.email || "",
                  phone: user?.phone || "",
                  phoneCountryCode: user?.phoneCountryCode || "+1",
                  mobile: user?.mobile || "",
                  country: user?.country || "",
                  stateProvince: user?.stateProvince || "",
                  address: typeof user?.address === "string" ? user?.address : user?.address?.street || "",
                  position: user?.position || "",
                  linkedinUrl: user?.linkedinUrl || "",
                  bio: user?.instructorProfile?.bio || user?.studentProfile?.goals?.join(", ") || "",
                  avatar: user?.avatar || "",
                })
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Country Code Selector Component
const CountryCodeSelector: React.FC<{ 
  value: string | undefined; 
  onValueChange: (value: string) => void; 
  countryCodes: any[];
  disabled?: boolean;
}> = ({ value, onValueChange, countryCodes, disabled = false }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [open, setOpen] = useState(false)

  const filteredCountries = React.useMemo(() => {
    if (!countryCodes || countryCodes.length === 0) return []
    
    const grouped = new Map<string, { dial: string; codes: string[]; names: string[] }>()
    for (const c of countryCodes) {
      const existing = grouped.get(c.dial)
      if (existing) {
        existing.codes.push(c.code)
        existing.names.push(c.name)
      } else {
        grouped.set(c.dial, { dial: c.dial, codes: [c.code], names: [c.name] })
      }
    }
    let arr = Array.from(grouped.values()).map(g => ({
      dial: g.dial,
      label: g.names.join(', '),
      codes: g.codes,
    }))
    arr.sort((a,b) => a.label.localeCompare(b.label))
    
    if (!searchQuery.trim()) return arr
    const f = searchQuery.trim().toLowerCase()
    
    const nameMatches = arr.filter(c => c.label.toLowerCase().includes(f))
    const codeMatches = arr.filter(c => 
      !c.label.toLowerCase().includes(f) && 
      (c.dial.includes(f) || c.codes.some(code => code.toLowerCase().includes(f)))
    )
    
    return [...nameMatches, ...codeMatches]
  }, [countryCodes, searchQuery])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="min-w-[10.5rem] justify-between font-normal px-3"
        >
          <div className="text-sm font-medium tracking-wide">
            {(() => {
              if (!value) return 'Code'
              const codes = countryCodes
                ?.filter((c: any) => c.dial === value)
                .map((c: any) => c.code)
                .sort()
              const abbr = codes && codes.length ? ` ${codes.join('/')}` : ''
              return `${value}${abbr}`
            })()}
          </div>
          <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search by country name..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-9"
          />
          <CommandList className="max-h-60">
            <CommandEmpty>No country found.</CommandEmpty>
            {filteredCountries.map(item => (
              <CommandItem
                key={item.dial}
                value={`${item.label} ${item.dial}`}
                onSelect={() => {
                  onValueChange(item.dial)
                  setOpen(false)
                  setSearchQuery("")
                }}
                className="flex items-center gap-2"
              >
                <Check className={cn("mr-2 h-4 w-4", value === item.dial ? "opacity-100" : "opacity-0")} />
                <span className="w-16 text-left">{item.dial}</span>
                <span className="flex-1 truncate text-left text-gray-700">{item.label}</span>
                <span className="text-[10px] px-1 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                  {item.codes.join('/')}
                </span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
