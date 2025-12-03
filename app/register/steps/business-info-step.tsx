"use client"

import type { BusinessInfo, FormState } from "../use-form-state"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { MultiSelect } from "@/components/ui/multi-select"

// Simple FormValidation component
const FormValidation = ({ isValid, isInvalid, message }: { isValid: boolean; isInvalid: boolean; message: string }) => {
  if (!isValid && !isInvalid) return null;
  return (
    <div className={`text-xs mt-1 ${isValid ? "text-green-600" : "text-red-600"}`}>
      {message}
    </div>
  );
};

// Industry options for select
const industryOptions = [
  { value: "arts", label: "Arts" },
  { value: "sports", label: "Sports" },
  { value: "arts_sports", label: "Arts & Sports" },
];

// Arts and Sports service lists
const artsServices = [
  { value: "painting", label: "Painting" },
  { value: "sculpture", label: "Sculpture" },
  { value: "printmaking", label: "Printmaking" },
  { value: "drawing", label: "Drawing" },
  { value: "photography", label: "Photography" },
  { value: "ceramics", label: "Ceramics" },
  { value: "textile_arts", label: "Textile Arts" },
  { value: "crafts", label: "Crafts" },
  { value: "digital_arts", label: "Digital Arts" },
  { value: "performance_arts", label: "Performance Arts" },
  { value: "global_indigenous_art_forms", label: "Global Indigenous Art Forms" },
  { value: "traditional_folk_art", label: "Traditional, Folk Art" },
  { value: "music", label: "Music" },
  { value: "theatre", label: "Theatre" },
  { value: "dance", label: "Dance" },
  { value: "film", label: "Film" },
  { value: "literary_arts", label: "Literary Arts" },
  { value: "street_art", label: "Street Art" },
  { value: "cultural_art", label: "Cultural Art" },
  { value: "pottery_and_ceramics", label: "Pottery and Ceramics" },
  { value: "contemporary_art", label: "Contemporary Art" },
  { value: "weaving_tapestry", label: "Weaving & Tapestry" },
  { value: "quilting", label: "Quilting" },
  { value: "cinema", label: "Cinema" },
  { value: "applied_arts", label: "Applied Arts" },
  { value: "graffiti", label: "Graffiti" },
];

const sportsServices = [
  { value: "football", label: "Football (Soccer)" },
  { value: "basketball", label: "Basketball" },
  { value: "cricket", label: "Cricket" },
  { value: "tennis", label: "Tennis" },
  { value: "volleyball", label: "Volleyball" },
  { value: "american_football", label: "American Football" },
  { value: "ice_hockey", label: "Ice Hockey" },
  { value: "athletics", label: "Athletics / Track & Field" },
  { value: "boxing", label: "Boxing" },
  { value: "martial_arts", label: "Martial Arts" },
  { value: "swimming", label: "Swimming" },
  { value: "badminton", label: "Badminton" },
  { value: "wrestling", label: "Wrestling" },
  { value: "baseball", label: "Baseball" },
  { value: "rugby", label: "Rugby" },
  { value: "surfing", label: "Surfing" },
  { value: "golf", label: "Golf" },
  { value: "skateboarding", label: "Skateboarding" },
  { value: "cycling", label: "Cycling" },
  { value: "table_tennis", label: "Table Tennis" },
  { value: "kabaddi", label: "Kabaddi" },
  { value: "boxing_mma", label: "Boxing/MMA" },
  { value: "formula_1", label: "Formula 1" },
  { value: "motogp", label: "MotoGP" },
];

// Dynamically determine service options based on industryType
const getServiceOptions = (industryType: string) => {
  if (industryType === "arts") return artsServices;
  if (industryType === "sports") return sportsServices;
  if (industryType === "arts_sports") return [...artsServices, ...sportsServices];
  return [];
};

const studentSizeOptions = [
  { value: "micro", label: "Micro (1-20 students)" },
  { value: "small", label: "Small (21-50 students)" },
  { value: "medium", label: "Medium (51-200 students)" },
  { value: "large", label: "Large (201-500 students)" },
  { value: "enterprise", label: "Enterprise (500+ students)" },
]

const staffCountOptions = [
  { value: "solo", label: "Solo (1 instructor)" },
  { value: "small", label: "Small Team (2-5)" },
  { value: "medium", label: "Medium Team (6-15)" },
  { value: "large", label: "Large Team (16+)" },
]


// Fetch all languages from an external API
const fetchLanguages = async (): Promise<Option[]> => {
  try {
    // Use restcountries.com to get all languages
    const res = await fetch("https://restcountries.com/v3.1/all?fields=languages");
    if (!res.ok) throw new Error("Failed to fetch languages");
    const data = await res.json();
    // Collect all unique language codes and names
    const langMap: Record<string, string> = {};
    data.forEach((country: any) => {
      if (country.languages) {
        Object.entries(country.languages).forEach(([code, name]) => {
          langMap[code] = name as string;
        });
      }
    });
    // Convert to Option[] and sort alphabetically
    return Object.entries(langMap)
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    return [];
  }
};

// Countries will be fetched from our API route
const fetchCountries = async (): Promise<Option[]> => {
  try {
    const response = await fetch('/api/countries', {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch countries');
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('[fetchCountries] Error:', error);
    return [];
  }
};

// Fetch states/provinces for a given country code from our API route
const fetchStates = async (countryCode: string): Promise<Option[]> => {
  if (!countryCode) return [];
  try {
    console.log('[fetchStates] Fetching for country code:', countryCode);
    const response = await fetch(`/api/countries/states?country=${countryCode}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch states');
    const data = await response.json();
    console.log('[fetchStates] States fetched:', data.success ? data.data.length : 0);
    return data.success ? data.data : [];
  } catch (error) {
    console.error('[fetchStates] Error:', error);
    return [];
  }
};

// Types for select options
type Option = { value: string; label: string }


import type { UpdateFormState } from "../use-form-state";

type BusinessInfoStepProps = {
  formState: FormState;
  updateFormState: UpdateFormState;
};

export default function BusinessInfoStep({ formState, updateFormState }: BusinessInfoStepProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null)
  const [states, setStates] = useState<Option[]>([])
  const [statesLoading, setStatesLoading] = useState<boolean>(false);
  const [statesError, setStatesError] = useState<string>("");
  const [cities, setCities] = useState<Option[]>([])
  const [businessNameSuggestions, setBusinessNameSuggestions] = useState<string[]>([])
  // Add state for field validation
  const [validationState, setValidationState] = useState({
    businessName: { isValid: false, isInvalid: false, message: "" },
    businessEmail: { isValid: false, isInvalid: false, message: "" },
    phoneNumber: { isValid: false, isInvalid: false, message: "" },
  })
  // Countries state
  const [countries, setCountries] = useState<Option[]>([]);
  const [countriesLoading, setCountriesLoading] = useState<boolean>(false);
  const [countriesError, setCountriesError] = useState<string>("");
  // Languages state
  const [languages, setLanguages] = useState<Option[]>([]);
  const [languagesLoading, setLanguagesLoading] = useState<boolean>(false);
  const [languagesError, setLanguagesError] = useState<string>("");

  useEffect(() => {
    setCountriesLoading(true);
    fetchCountries()
      .then((data) => {
        setCountries(data);
        setCountriesLoading(false);
      })
      .catch(() => {
        setCountriesError("Failed to load countries");
        setCountriesLoading(false);
      });
  }, []);

  // Fetch states from API when country changes
  useEffect(() => {
    if (formState.businessInfo.country) {
      setStatesLoading(true);
      setStatesError("");
      setStates([]); // Clear previous states
      console.log('[BusinessInfo] Fetching states for country:', formState.businessInfo.country);
      fetchStates(formState.businessInfo.country)
        .then((data) => {
          console.log('[BusinessInfo] States fetched:', data.length, 'states');
          setStates(data);
          setStatesLoading(false);
          if (data.length === 0) {
            setStatesError("No states found for this country");
          }
        })
        .catch((error) => {
          console.error('[BusinessInfo] Failed to fetch states:', error);
          setStatesError("Failed to load states");
          setStatesLoading(false);
        });
    } else {
      setStates([]);
      setStatesError("");
    }
  }, [formState.businessInfo.country]);


// Fetch cities for a given country and state - For now, allow manual entry
// You can add a cities API later if needed
const fetchCities = async (countryCode: string, stateName: string): Promise<Option[]> => {
  // Return empty array - user will manually enter city
  return [];
};

const [citiesLoading, setCitiesLoading] = useState<boolean>(false);
const [citiesError, setCitiesError] = useState<string>("");

// Fetch cities from API when state changes
useEffect(() => {
  if (formState.businessInfo.country && formState.businessInfo.state) {
    setCitiesLoading(true);
    setCitiesError("");
    fetchCities(formState.businessInfo.country, formState.businessInfo.state)
      .then((data) => {
        setCities(data);
        setCitiesLoading(false);
      })
      .catch(() => {
        setCitiesError("Failed to load cities");
        setCitiesLoading(false);
      });
  } else {
    setCities([]);
  }
}, [formState.businessInfo.country, formState.businessInfo.state]);

  // Fetch all languages on mount
  useEffect(() => {
    setLanguagesLoading(true);
    fetchLanguages()
      .then((data) => {
        setLanguages(data);
        setLanguagesLoading(false);
      })
      .catch(() => {
        setLanguagesError("Failed to load languages");
        setLanguagesLoading(false);
      });
  }, []);

  // Auto-detect language and timezone
  useEffect(() => {
    // Set preferred language based on browser
    const browserLang = navigator.language.split("-")[0];
    if (browserLang && !formState.businessInfo.preferredLanguage && languages.length > 0) {
      // Try to match browserLang to a language code
      const match = languages.find(l => l.value === browserLang || l.label.toLowerCase().includes(browserLang));
      if (match) {
        handleInputChange("preferredLanguage", match.value);
      }
    }
  }, [languages]);

  // Mock AI suggestions for business name
  useEffect(() => {
    if (formState.businessInfo.businessName && formState.businessInfo.industryType) {
      // In a real app, this would be an API call to an AI service
      setTimeout(() => {
        const mockSuggestions = [
          `${formState.businessInfo.businessName} Academy`,
          `${formState.businessInfo.businessName} Learning Center`,
          `${formState.businessInfo.businessName} Institute`,
        ]
        setBusinessNameSuggestions(mockSuggestions)
      }, 1000)
    }
  }, [formState.businessInfo.businessName, formState.businessInfo.industryType])

  // Add validation function
  const validateField = (field: string, value: any) => {
    let isValid = false
    let isInvalid = false
    let message = ""

    switch (field) {
      case "businessName":
        if (value.length < 2) {
          isInvalid = true
          message = "Business name must be at least 2 characters"
        } else {
          isValid = true
          message = "Valid business name"
        }
        break
      case "businessEmail":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          isInvalid = true
          message = "Please enter a valid email address"
        } else {
          isValid = true
          message = "Valid email address"
        }
        break
      case "phoneNumber":
        if (value.length < 10) {
          isInvalid = true
          message = "Please enter a valid phone number"
        } else {
          isValid = true
          message = "Valid phone number"
        }
        break
    }

    setValidationState((prev) => ({
      ...prev,
      [field]: { isValid, isInvalid, message },
    }))
  }

  // Modify the handleInputChange function to include validation
  const handleInputChange = (field: keyof BusinessInfo, value: any) => {
    updateFormState({
      businessInfo: {
        ...formState.businessInfo,
        [field]: value,
      },
    });
    // Validate fields that need immediate feedback
    if (["businessName", "businessEmail", "phoneNumber"].includes(field as string)) {
      validateField(field as string, value)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        handleInputChange("logo", file);
      };
      reader.readAsDataURL(file);
    }
  }

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
        handleInputChange("profilePicture", file);
      };
      reader.readAsDataURL(file);
    }
  }

  const handleBusinessNameFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file) {
      handleInputChange("businessNameFile", file);
    }
  }

  const handleServiceToggle = (service: string) => {
    const currentServices = formState.businessInfo.servicesOffered
    const updatedServices = currentServices.includes(service)
      ? currentServices.filter((s: string) => s !== service)
      : [...currentServices, service]

    handleInputChange("servicesOffered", updatedServices)
  }

  const clearServices = () => {
    handleInputChange("servicesOffered", [])
  }

  const applyBusinessNameSuggestion = (suggestion: string) => {
    handleInputChange("businessName", suggestion)
    setBusinessNameSuggestions([])
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Business Information</h3>
        <p className="text-sm text-muted-foreground">Tell us about your academy or class-based business</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Business Name */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="businessName">
              Business Name <span className="text-red-500">*</span>
            </Label>
            {/* Tooltip removed as requested */}
          </div>
          <Input
            id="businessName"
            placeholder="e.g., Harmony Music Academy"
            value={formState.businessInfo.businessName}
            onChange={(e) => handleInputChange("businessName", e.target.value)}
            aria-required="true"
            onBlur={() => validateField("businessName", formState.businessInfo.businessName)}
          />
          <FormValidation
            isValid={validationState.businessName.isValid}
            isInvalid={validationState.businessName.isInvalid}
            message={validationState.businessName.message}
          />
          {businessNameSuggestions.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1">Suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {businessNameSuggestions.map((suggestion, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => applyBusinessNameSuggestion(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Legal Entity Name */}
        <div className="space-y-2">
          <Label htmlFor="legalEntityName">Legal Entity Name </Label>
          <Input
            id="legalEntityName"
            placeholder="e.g., Harmony Music LLC"
            value={formState.businessInfo.legalEntityName}
            onChange={(e) => handleInputChange("legalEntityName", e.target.value)}
          />
        </div>

        {/* Business Email */}
        <div className="space-y-2">
          <Label htmlFor="businessEmail">
            Business Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="businessEmail"
            type="email"
            placeholder="contact@yourbusiness.com"
            value={formState.businessInfo.businessEmail}
            onChange={(e) => handleInputChange("businessEmail", e.target.value)}
            aria-required="true"
            onBlur={() => validateField("businessEmail", formState.businessInfo.businessEmail)}
          />
          <FormValidation
            isValid={validationState.businessEmail.isValid}
            isInvalid={validationState.businessEmail.isInvalid}
            message={validationState.businessEmail.message}
          />
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={formState.businessInfo.phoneNumber}
            onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
            aria-required="true"
            onBlur={() => validateField("phoneNumber", formState.businessInfo.phoneNumber)}
          />
          <FormValidation
            isValid={validationState.phoneNumber.isValid}
            isInvalid={validationState.phoneNumber.isInvalid}
            message={validationState.phoneNumber.message}
          />
        </div>

        {/* Industry Type */}
        <div className="space-y-2">
          <Label htmlFor="industryType">
            Industry Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formState.businessInfo.industryType}
            onValueChange={(value) => handleInputChange("industryType", value)}
          >
            <SelectTrigger id="industryType" aria-required="true">
              <SelectValue placeholder="Select industry type" />
            </SelectTrigger>
            <SelectContent>
              {industryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Services Offered */}
        <div className="space-y-2 md:col-span-2 max-w-md">
          <div className="flex items-center justify-between">
            <Label htmlFor="servicesOffered">
              Services Offered <span className="text-red-500">*</span>
            </Label>
            
          </div>
          <MultiSelect
            options={getServiceOptions(formState.businessInfo.industryType)}
            selected={formState.businessInfo.servicesOffered}
            onChange={(selected: string[]) => handleInputChange("servicesOffered", selected)}
            placeholder={
              formState.businessInfo.industryType 
                ? "Select services offered" 
                : "Please select Industry Type first"
            }
          />
          {!formState.businessInfo.industryType && (
            <p className="text-xs text-amber-600 mt-1">
              ⚠️ Please select an Industry Type above to see available services
            </p>
          )}
        </div>

        {/* Student/Client Size */}
        <div className="space-y-2">
          <Label htmlFor="studentSize">
            Student/Client Size <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formState.businessInfo.studentSize}
            onValueChange={(value) => handleInputChange("studentSize", value)}
          >
            <SelectTrigger id="studentSize" aria-required="true">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {studentSizeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Staff/Instructor Count */}
        <div className="space-y-2">
          <Label htmlFor="staffCount">
            Staff/Instructor Count <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formState.businessInfo.staffCount}
            onValueChange={(value) => handleInputChange("staffCount", value)}
          >
            <SelectTrigger id="staffCount" aria-required="true">
              <SelectValue placeholder="Select count" />
            </SelectTrigger>
            <SelectContent>
              {staffCountOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Country (Dropdown with Search) */}
        <div className="space-y-2">
          <Label htmlFor="country">
            Country <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formState.businessInfo.country}
            onValueChange={(value) => handleInputChange("country", value)}
            disabled={countriesLoading || countriesError !== ""}
          >
            <SelectTrigger id="country" aria-required="true">
              <SelectValue placeholder={countriesLoading ? "Loading countries..." : countriesError ? countriesError : "Select country"} />
            </SelectTrigger>
            <SelectContent>
              {countries.length === 0 && (
                <div className="px-2 py-2 text-sm text-muted-foreground">No countries found</div>
              )}
              {countries.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* State/Province (Dropdown, Mandatory) */}
        <div className="space-y-2">
          <Label htmlFor="state">
            State/Province <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formState.businessInfo.state}
            onValueChange={(value) => handleInputChange("state", value)}
            disabled={statesLoading || statesError !== "" || !formState.businessInfo.country}
          >
            <SelectTrigger id="state" aria-required="true">
              <SelectValue placeholder={
                !formState.businessInfo.country
                  ? "Select country first"
                  : statesLoading
                  ? "Loading states..."
                  : statesError
                  ? statesError
                  : "Select state or province"
              } />
            </SelectTrigger>
            <SelectContent>
              {states.length === 0 && (
                <div className="px-2 py-2 text-sm text-muted-foreground">No states found</div>
              )}
              {states.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Address */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">
            Address <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="address"
            placeholder="Enter your business address"
            value={formState.businessInfo.address}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("address", e.target.value)}
            rows={2}
            aria-required="true"
          />
        </div>

        {/* City (Input, after address, Mandatory) */}
        <div className="space-y-2">
          <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
          <Input
            id="city"
            placeholder="Enter your city"
            value={formState.businessInfo.city}
            onChange={(e) => handleInputChange("city", e.target.value)}
            aria-required="true"
          />
        </div>

        {/* Pincode (Input, after city, Mandatory) */}
        <div className="space-y-2">
          <Label htmlFor="pincode">Pincode <span className="text-red-500">*</span></Label>
          <Input
            id="pincode"
            placeholder="Enter your pincode"
            value={formState.businessInfo.pincode || ""}
            onChange={(e) => handleInputChange("pincode", e.target.value)}
            aria-required="true"
          />
        </div>

        {/* Tax ID (Input, after pincode) */}
        <div className="space-y-2">
          <Label htmlFor="taxId">Tax ID</Label>
          <Input
            id="taxId"
            placeholder="Enter your Tax ID"
            value={formState.businessInfo.taxId || ""}
            onChange={(e) => handleInputChange("taxId", e.target.value)}
          />
          <Input
            id="website"
            type="url"
            placeholder="https://yourbusiness.com"
            value={formState.businessInfo.website}
            onChange={(e) => handleInputChange("website", e.target.value)}
          />
        </div>

        {/* Preferred Language */}
        <div className="space-y-2">
          <Label htmlFor="preferredLanguage">
            Preferred Language <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formState.businessInfo.preferredLanguage}
            onValueChange={(value) => handleInputChange("preferredLanguage", value)}
            disabled={languagesLoading || languagesError !== ""}
          >
            <SelectTrigger id="preferredLanguage" aria-required="true">
              <SelectValue placeholder={languagesLoading ? "Loading languages..." : languagesError ? languagesError : "Select language"} />
            </SelectTrigger>
            <SelectContent>
              {languages.length === 0 && (
                <div className="px-2 py-2 text-sm text-muted-foreground">No languages found</div>
              )}
              {languages.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Logo, Profile Picture, and Business Name Upload */}
        <div className="space-y-2 md:col-span-2">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Business Logo Upload */}
            <div className="flex-1">
              <Label htmlFor="logo">Business Logo </Label>
              <Input
                id="logo"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={handleLogoChange}
                className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">Accepted formats: PNG, JPG, JPEG, SVG. Max size: 2MB</p>
              {logoPreview && (
                <div className="w-16 h-16 rounded border overflow-hidden flex items-center justify-center bg-gray-50 mt-2">
                  <img
                    src={logoPreview || "/placeholder.svg"}
                    alt="Logo preview"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
            </div>

            {/* Business Name Upload (Moved to second) */}
            <div className="flex-1">
              <Label htmlFor="businessNameFile">Business Name Upload </Label>
              <Input
                id="businessNameFile"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={handleBusinessNameFileChange}
                className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 file:cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">Accepted formats: PNG, JPG, JPEG, SVG. Max size: 2MB</p>
              {formState.businessInfo.businessNameFile && (
                <div className="mt-2 text-xs text-green-600">Uploaded: {formState.businessInfo.businessNameFile.name}</div>
              )}
            </div>

            {/* Profile Picture Upload (Moved to third) */}
            <div className="flex-1">
              <Label htmlFor="profilePicture">Profile Picture </Label>
              <Input
                id="profilePicture"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={handleProfilePictureChange}
                className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 file:cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">Accepted formats: PNG, JPG, JPEG, SVG. Max size: 2MB</p>
              {profilePicturePreview && (
                <div className="w-16 h-16 rounded-full border overflow-hidden flex items-center justify-center bg-gray-50 mt-2">
                  <img
                    src={profilePicturePreview || "/placeholder-user.jpg"}
                    alt="Profile preview"
                    className="max-w-full max-h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
