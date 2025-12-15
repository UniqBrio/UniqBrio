"use client"

import React, { useState, useRef } from "react"
import { useCustomColors } from "@/lib/use-custom-colors"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Label } from "@/components/dashboard/ui/label"
import { Textarea } from "@/components/dashboard/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/dashboard/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/dashboard/ui/command"
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
import { User, Mail, Phone, MapPin, Calendar, Camera, Save, Check, ChevronDown, Pencil, X } from "lucide-react"
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
  const { primaryColor } = useCustomColors()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showRemovePhotoDialog, setShowRemovePhotoDialog] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null)
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { countryCodes, loading: countryCodesLoading } = useCountryCodes()
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
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

  // Fetch profile picture from academy info
  React.useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        const response = await fetch('/api/user-academy-info')
        if (response.ok) {
          const data = await response.json()
          // Get profile picture from the response
          const profilePic = data.profilePictureUrl
          if (profilePic) {
            setProfilePictureUrl(profilePic)
            setAvatarPreview(profilePic)
            setFormData(prev => ({ ...prev, avatar: profilePic }))
          }
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error)
      }
    }
    
    fetchProfilePicture()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Create preview and save immediately
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64Image = reader.result as string
      setAvatarPreview(base64Image)
      setFormData(prev => ({ ...prev, avatar: base64Image }))
      
      // Save to backend immediately
      try {
        // Update user profile with avatar
        await onUpdate({ ...formData, avatar: base64Image })
        
        // Also update profile picture in academy info
        const academyResponse = await fetch('/api/dashboard/academy-info')
        if (academyResponse.ok) {
          const academyData = await academyResponse.json()
          const businessInfo = academyData.businessInfo || {}
          
          await fetch('/api/dashboard/academy-info', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessInfo: {
                ...businessInfo,
                profilePicture: base64Image
              }
            })
          })
        }
        
        // Emit event to refresh header immediately
        window.dispatchEvent(new CustomEvent('profileImageUpdated'))
        
        toast({
          title: "Profile Picture Updated",
          description: "Your profile picture has been updated successfully.",
        })
      } catch (error) {
        console.error('Error saving profile picture:', error)
        toast({
          title: "Error",
          description: "Failed to save profile picture. Please try again.",
          variant: "destructive",
        })
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = async () => {
    try {
      // Clear local state
      setAvatarPreview(null)
      setProfilePictureUrl(null)
      setFormData(prev => ({ ...prev, avatar: "" }))

      // Update user profile with empty avatar
      await onUpdate({ ...formData, avatar: "" })

      // Also update profile picture in academy info
      const academyResponse = await fetch('/api/dashboard/academy-info')
      if (academyResponse.ok) {
        const academyData = await academyResponse.json()
        const businessInfo = academyData.businessInfo || {}

        await fetch('/api/dashboard/academy-info', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessInfo: {
              ...businessInfo,
              profilePicture: null
            }
          })
        })
      }

      // Emit event to refresh header immediately
      window.dispatchEvent(new CustomEvent('profileImageUpdated'))

      toast({
        title: "Profile Picture Removed",
        description: "Your profile picture has been removed successfully.",
      })
    } catch (error) {
      console.error('Error removing profile picture:', error)
      toast({
        title: "Error",
        description: "Failed to remove profile picture. Please try again.",
        variant: "destructive",
      })
    } finally {
      setShowRemovePhotoDialog(false)
    }
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

  const validateEmail = (email: string) => {
    if (!email || !email.trim()) {
      setEmailError("Email is required.")
      return false
    }
    
    const trimmedEmail = email.trim()
    
    // Check for basic structure first
    if (!trimmedEmail.includes('@')) {
      setEmailError("Email must contain @ symbol")
      return false
    }
    
    const [localPart, ...domainParts] = trimmedEmail.split('@')
    const domain = domainParts.join('@')
    
    // Validate local part (before @)
    if (!localPart || localPart.length === 0) {
      setEmailError("Email must have characters before @")
      return false
    }
    
    // Local part must contain at least one alphanumeric character
    if (!/[a-zA-Z0-9]/.test(localPart)) {
      setEmailError("Email must contain at least one letter or number before @")
      return false
    }
    
    // Local part cannot start or end with a dot
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      setEmailError("Email cannot start or end with a dot before @")
      return false
    }
    
    // Local part cannot have consecutive dots
    if (/\.\./.test(localPart)) {
      setEmailError("Email cannot have consecutive dots")
      return false
    }
    
    // Validate domain part (after @)
    if (!domain || domain.length === 0) {
      setEmailError("Email must have a domain after @")
      return false
    }
    
    // Domain must have at least one dot
    if (!domain.includes('.')) {
      setEmailError("Email domain must include a dot (e.g., example.com)")
      return false
    }
    
    // RFC 5322 compliant email regex pattern
    const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]*[a-zA-Z0-9]@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
    const isValid = emailRegex.test(trimmedEmail)
    setEmailError(isValid ? null : "Please enter a valid email address (e.g., user@example.com)")
    return isValid
  }

  const handleSave = async () => {
    // Validate email before saving
    if (!validateEmail(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address before saving.",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsSaving(true)
      
      // If avatar was changed, also update it in academy info
      if (avatarPreview && avatarPreview !== profilePictureUrl) {
        try {
          const academyResponse = await fetch('/api/dashboard/academy-info')
          if (academyResponse.ok) {
            const academyData = await academyResponse.json()
            const businessInfo = academyData.businessInfo || {}
            
            // Update profile picture in academy info
            await fetch('/api/dashboard/academy-info', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                businessInfo: {
                  ...businessInfo,
                  profilePicture: avatarPreview
                }
              })
            })
          }
        } catch (error) {
          console.error('Error updating academy info profile picture:', error)
        }
      }
      
      await onUpdate(formData)
      setIsEditing(false)
      // Emit event to refresh header
      window.dispatchEvent(new CustomEvent('profileImageUpdated'))
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
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" style={{ color: primaryColor }} />
              Profile Information
            </CardTitle>
            <CardDescription>
              Manage your personal information and profile details
            </CardDescription>
          </div>
          {!isEditing && (
            <Button 
              onClick={() => setIsEditing(true)} 
              variant="ghost"
              className="gap-2"
              style={{ color: primaryColor }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}15`}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Edit Profile"
            >
              <Pencil className="h-4 w-4" />
              
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="relative group">
            {avatarPreview || user?.avatar ? (
              <>
                <Avatar
                  className="h-20 w-20 sm:h-24 sm:w-24 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to change photo (PNG/JPG, max 2MB)"
                >
                  <AvatarImage src={avatarPreview || user?.avatar} alt={user?.name} />
                  <AvatarFallback
                    className="text-2xl"
                    style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                  >
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to change photo (PNG/JPG, max 2MB)"
                >
               
                </div>
                <button
                  type="button"
                  onClick={() => setShowRemovePhotoDialog(true)}
                  className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove profile picture"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <div
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
                style={{ borderColor: `${primaryColor}40` }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${primaryColor}80`)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = `${primaryColor}40`)}
                title="Click to upload photo (PNG/JPG, max 2MB)"
              >
                <Camera className="h-8 w-8 text-gray-400 dark:text-gray-500" style={{ color: `${primaryColor}80` }} />
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handlePhotoChange}
              className="hidden"
            />
            
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-white" />
              <Input
                id="firstName"
                placeholder="First name"
                value={formData.firstName}
                onChange={(e) => {
                  const value = e.target.value
                  // Only allow letters, spaces, hyphens, and apostrophes
                  const sanitizedValue = value.replace(/[^a-zA-Z\s\-']/g, '')
                  if (value !== sanitizedValue) {
                    toast({
                      title: "Invalid Characters",
                      description: "First name can only contain letters, spaces, hyphens, and apostrophes",
                      variant: "destructive",
                    })
                  }
                  handleInputChange("firstName", sanitizedValue)
                }}
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
              onChange={(e) => {
                const value = e.target.value
                // Only allow letters, spaces, hyphens, and apostrophes
                const sanitizedValue = value.replace(/[^a-zA-Z\s\-']/g, '')
                if (value !== sanitizedValue) {
                  toast({
                    title: "Invalid Characters",
                    description: "Middle name can only contain letters, spaces, hyphens, and apostrophes",
                    variant: "destructive",
                  })
                }
                handleInputChange("middleName", sanitizedValue)
              }}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              placeholder="Last name"
              value={formData.lastName}
              onChange={(e) => {
                const value = e.target.value
                // Only allow letters, spaces, hyphens, and apostrophes
                const sanitizedValue = value.replace(/[^a-zA-Z\s\-']/g, '')
                if (value !== sanitizedValue) {
                  toast({
                    title: "Invalid Characters",
                    description: "Last name can only contain letters, spaces, hyphens, and apostrophes",
                    variant: "destructive",
                  })
                }
                handleInputChange("lastName", sanitizedValue)
              }}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-white" />
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => {
                  const value = e.target.value
                  // Only allow valid email characters: letters, numbers, @ and valid symbols
                  // Valid symbols in email: . ! # $ % & ' * + - / = ? ^ _ ` { | } ~
                  const sanitizedValue = value.replace(/[^a-zA-Z0-9@.!#$%&'*+\-/=?^_`{|}~]/g, '')
                  
                  // Ensure only one @ symbol
                  const atCount = (sanitizedValue.match(/@/g) || []).length
                  let finalValue = sanitizedValue
                  if (atCount > 1) {
                    // Keep only the first @
                    const parts = sanitizedValue.split('@')
                    finalValue = parts[0] + '@' + parts.slice(1).join('')
                  }
                  
                  if (value !== finalValue) {
                    toast({
                      title: "Invalid Characters",
                      description: "Email can only contain letters, numbers, @ symbol, and valid punctuation (. - _ + etc.)",
                      variant: "destructive",
                    })
                  }
                  
                  handleInputChange("email", finalValue)
                  if (finalValue) validateEmail(finalValue)
                }}
                onBlur={(e) => {
                  const trimmed = e.target.value.trim()
                  if (trimmed !== e.target.value) {
                    handleInputChange("email", trimmed)
                  }
                  if (trimmed) validateEmail(trimmed)
                }}
                disabled={!isEditing}
                className={cn("pl-10", emailError ? "border-red-500 focus:ring-red-400" : "")}
              />
            </div>
            {emailError && (
              <p className="mt-1 text-[12px] text-red-600">{emailError}</p>
            )}
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

        <div className="space-y-2 md:col-span-2 gap-2">
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
              className="gap-2"
              style={{ backgroundColor: primaryColor }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}dd`}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                setAvatarPreview(profilePictureUrl || user?.avatar || null)
                setPhoneError(null)
                setEmailError(null)
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

      {/* Remove Photo Confirmation Dialog */}
      <AlertDialog open={showRemovePhotoDialog} onOpenChange={setShowRemovePhotoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Profile Picture</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove your profile picture? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemovePhoto}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
                <span className="flex-1 truncate text-left text-gray-700 dark:text-white">{item.label}</span>
                <span className="text-[10px] px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-600">
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
