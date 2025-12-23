"use client"

import type { BusinessInfo, FormState } from "../use-form-state"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { PhoneCountryCodeSelect } from "@/components/dashboard/student/common/phone-country-code-select"
import { getPhoneCodeByCountry, getCountryByPhoneCode } from "@/lib/dashboard/student/countries-api"

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

// Searchable Country selector component with scrollbar
function CountrySelect({ 
  country, 
  onChange, 
  countries, 
  loading, 
  error, 
  hasError, 
  id,
}: { 
  country?: string; 
  onChange: (code: string, label: string) => void; 
  countries: Option[]; 
  loading: boolean; 
  error: string; 
  hasError?: boolean; 
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  
  const norm = query.trim().toLowerCase();
  const filtered = norm 
    ? countries.filter((c: Option) => 
        c.label.toLowerCase().includes(norm) || 
        c.value.toLowerCase().includes(norm)
      ) 
    : countries;
  
  const selectedCountry = countries.find((c: Option) => c.value === country);
  const placeholder = loading 
    ? 'Loading countries...' 
    : error 
    ? error 
    : selectedCountry?.label || 'Select country';
  
  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setQuery(''); }}>
      <PopoverTrigger asChild>
        <Button 
          id={id}
          data-field={id}
          variant="outline" 
          role="combobox" 
          aria-expanded={open}
          disabled={loading || error !== ""}
          className={cn(
            'w-full justify-between mt-1 font-normal',
            hasError && 'border-red-500 focus-visible:ring-red-500'
          )}
        >
          <span className="truncate max-w-full">{placeholder}</span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-70 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start" sideOffset={4}>
        <div className="flex flex-col gap-2">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={loading ? 'Loading...' : 'Search countries...'}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          />
          <div className="max-h-60 overflow-y-auto text-sm pr-1">
            {loading && <div className="text-xs text-gray-500 py-2">Loading...</div>}
            {!loading && filtered.map((c: Option) => (
              <div
                key={c.value}
                onClick={() => {
                  onChange(c.value, c.label);
                  setOpen(false);
                }}
                className="cursor-pointer px-2 py-1.5 rounded-md hover:bg-gray-100"
              >
                {c.label}
              </div>
            ))}
            {!loading && !filtered.length && (
              <div className="text-xs text-gray-500 py-2">No countries found</div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Searchable State selector component with scrollbar
function StateSelect({ 
  countryCode, 
  state, 
  onChange, 
  states, 
  loading, 
  error, 
  hasError, 
  id,
}: { 
  countryCode?: string; 
  state?: string; 
  onChange: (s: string) => void; 
  states: Option[]; 
  loading: boolean; 
  error: string; 
  hasError?: boolean; 
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  
  const norm = query.trim().toLowerCase();
  const filtered = norm 
    ? states.filter((s: Option) => s.label.toLowerCase().includes(norm)) 
    : states;
  
  const noStates = !!countryCode && !loading && states.length === 0 && !error;
  const selectedState = states.find((s: Option) => s.value === state);
  
  const placeholder = !countryCode
    ? 'Select country first'
    : loading
    ? 'Loading states...'
    : error
    ? error
    : noStates
    ? 'Not applicable'
    : selectedState?.label || 'Select state or province';
  
  // Automatically set 'Not applicable' for countries without states
  useEffect(() => {
    if (!countryCode) return;
    if (noStates && (!state || state === "")) {
      onChange("Not applicable");
      return;
    }

    if (!loading && states.length > 0 && state && state.toLowerCase() === "not applicable") {
      onChange("");
    }
  }, [countryCode, noStates, state, loading, states, onChange]);
  
  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setQuery(''); }}>
      <PopoverTrigger asChild>
        <Button 
          id={id}
          data-field={id}
          variant="outline" 
          role="combobox" 
          aria-expanded={open}
          disabled={!countryCode || noStates || loading || error !== ""}
          className={cn(
            'w-full justify-between mt-1 font-normal',
            hasError && 'border-red-500 focus-visible:ring-red-500'
          )}
        >
          <span className="truncate max-w-full">{placeholder}</span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-70 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start" sideOffset={4}>
        <div className="flex flex-col gap-2">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={loading ? 'Loading...' : 'Search states...'}
            disabled={!countryCode || loading}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          />
          <div className="max-h-60 overflow-y-auto text-sm pr-1">
            {loading && <div className="text-xs text-gray-500 py-2">Loading...</div>}
            {!loading && noStates && (
              <div className="text-xs text-gray-500 py-2">Not applicable</div>
            )}
            {!loading && !noStates && filtered.map((s: Option) => (
              <div
                key={s.value}
                onClick={() => {
                  onChange(s.value);
                  setOpen(false);
                }}
                className="cursor-pointer px-2 py-1.5 rounded-md hover:bg-gray-100"
              >
                {s.label}
              </div>
            ))}
            {!loading && !noStates && !filtered.length && (
              <div className="text-xs text-gray-500 py-2">No states found</div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

import type { UpdateFormState } from "../use-form-state";

type BusinessInfoStepProps = {
  formState: FormState;
  updateFormState: UpdateFormState;
  externalErrors?: Record<string, string>;
  clearFieldError?: (field: string) => void;
};

export default function BusinessInfoStep({ formState, updateFormState, externalErrors = {}, clearFieldError }: BusinessInfoStepProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null)
  const [businessNamePreview, setBusinessNamePreview] = useState<string | null>(null)
  const [states, setStates] = useState<Option[]>([])
  const [statesLoading, setStatesLoading] = useState<boolean>(false);
  const [statesError, setStatesError] = useState<string>("");
  const [cities, setCities] = useState<Option[]>([])
  const [businessNameSuggestions, setBusinessNameSuggestions] = useState<string[]>([])
  const [countryCode, setCountryCode] = useState("+91") // Default to India
  const logoInputRef = useRef<HTMLInputElement | null>(null)
  const businessNameFileInputRef = useRef<HTMLInputElement | null>(null)
  const profilePictureInputRef = useRef<HTMLInputElement | null>(null)
  // Add state for field validation
  const [validationState, setValidationState] = useState({
    businessName: { isValid: false, isInvalid: false, message: "" },
    legalEntityName: { isValid: false, isInvalid: false, message: "" },
    businessEmail: { isValid: false, isInvalid: false, message: "" },
    phoneNumber: { isValid: false, isInvalid: false, message: "" },
    address: { isValid: false, isInvalid: false, message: "" },
    city: { isValid: false, isInvalid: false, message: "" },
    pincode: { isValid: false, isInvalid: false, message: "" },
    taxId: { isValid: false, isInvalid: false, message: "" },
    website: { isValid: false, isInvalid: false, message: "" },
  })
  // Countries state
  const [countries, setCountries] = useState<Option[]>([]);
  const [countriesLoading, setCountriesLoading] = useState<boolean>(false);
  const [countriesError, setCountriesError] = useState<string>("");
  // Languages state
  const [languages, setLanguages] = useState<Option[]>([]);
  const [languagesLoading, setLanguagesLoading] = useState<boolean>(false);
  const [languagesError, setLanguagesError] = useState<string>("");
  const [availableServiceOptions, setAvailableServiceOptions] = useState<Option[]>(() => getServiceOptions(formState.businessInfo.industryType))
  const [customServiceOptions, setCustomServiceOptions] = useState<Option[]>([])
  const [serviceSearchTerm, setServiceSearchTerm] = useState("")
  const [serviceInputError, setServiceInputError] = useState("")
  const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024
  const MAX_UPLOAD_SIZE_LABEL = "2 MB"
  const formatSizeInMb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1)
  type UploadField = "logo" | "profilePicture" | "businessNameFile"
  const [uploadErrors, setUploadErrors] = useState<Record<UploadField, string>>({
    logo: "",
    profilePicture: "",
    businessNameFile: "",
  })

  const ensureFileSizeWithinLimit = (file: File, field: UploadField, fieldLabel: string) => {
    if (file.size <= MAX_UPLOAD_SIZE_BYTES) {
      setUploadErrors((prev) => {
        if (!prev[field]) return prev
        return { ...prev, [field]: "" }
      })
      return true
    }

    setUploadErrors((prev) => ({
      ...prev,
      [field]: `${fieldLabel} is ${formatSizeInMb(file.size)} MB. Please upload an image under ${MAX_UPLOAD_SIZE_LABEL}.`,
    }))
    return false
  }

  useEffect(() => {
    const logoFile = formState.businessInfo.logo;
    if (logoFile instanceof File && !logoPreview) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(logoFile);
      return;
    }

    if (!logoFile && formState.businessInfo.businessLogoUrl && !logoPreview) {
      setLogoPreview(formState.businessInfo.businessLogoUrl);
    }
  }, [formState.businessInfo.logo, formState.businessInfo.businessLogoUrl, logoPreview]);

  useEffect(() => {
    const profileFile = formState.businessInfo.profilePicture;
    if (profileFile instanceof File && !profilePicturePreview) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePicturePreview(reader.result as string);
      reader.readAsDataURL(profileFile);
      return;
    }

    if (!profileFile && formState.businessInfo.profilePictureUrl && !profilePicturePreview) {
      setProfilePicturePreview(formState.businessInfo.profilePictureUrl);
    }
  }, [formState.businessInfo.profilePicture, formState.businessInfo.profilePictureUrl, profilePicturePreview]);

  useEffect(() => {
    const nameFile = formState.businessInfo.businessNameFile;
    if (nameFile instanceof File && !businessNamePreview) {
      const reader = new FileReader();
      reader.onloadend = () => setBusinessNamePreview(reader.result as string);
      reader.readAsDataURL(nameFile);
      return;
    }

    if (!nameFile && formState.businessInfo.businessNameUploadUrl && !businessNamePreview) {
      setBusinessNamePreview(formState.businessInfo.businessNameUploadUrl);
    }
  }, [formState.businessInfo.businessNameFile, formState.businessInfo.businessNameUploadUrl, businessNamePreview]);

  useEffect(() => {
    setCountriesLoading(true);
    fetchCountries()
      .then((data) => {
        setCountries(data);
        setCountriesLoading(false);
        
        // Set India as default country if not already set
        if (!formState.businessInfo.country) {
          updateFormState({
            businessInfo: {
              ...formState.businessInfo,
              country: "IN", // India's ISO code
            },
          });
        }
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

  // Set English as default language
  useEffect(() => {
    // Set English as default preferred language if not already set
    if (!formState.businessInfo.preferredLanguage && languages.length > 0) {
      // Try to find English in the languages list
      const englishLang = languages.find(l => 
        l.value === 'en' || 
        l.value === 'eng' || 
        l.label.toLowerCase().includes('english')
      );
      if (englishLang) {
        handleInputChange("preferredLanguage", englishLang.value);
      }
    }
  }, [languages]);

  // Refresh available services when industry or manual entries change
  useEffect(() => {
    const defaults = getServiceOptions(formState.businessInfo.industryType);
    const manualCustoms = customServiceOptions.filter(
      (option) => !defaults.some((def) => def.value === option.value)
    );

    const selectedCustoms = (formState.businessInfo.servicesOffered || []).map((value) => {
      const defaultMatch = defaults.find((def) => def.value === value);
      if (defaultMatch) return defaultMatch;
      const manualMatch = manualCustoms.find((opt) => opt.value === value);
      return manualMatch || { value, label: value };
    });

    const mergedOptions = new Map<string, Option>();
    [...defaults, ...manualCustoms, ...selectedCustoms].forEach((option) => {
      const key = option.value.toLowerCase();
      if (!mergedOptions.has(key)) {
        mergedOptions.set(key, option);
      }
    });

    setAvailableServiceOptions(Array.from(mergedOptions.values()))
  }, [customServiceOptions, formState.businessInfo.industryType, formState.businessInfo.servicesOffered]);

  useEffect(() => {
    setServiceSearchTerm("")
    setServiceInputError("")
  }, [formState.businessInfo.industryType])

  // Refresh available services when industry type or selections change
  useEffect(() => {
    setAvailableServiceOptions((prev) => {
      const defaults = getServiceOptions(formState.businessInfo.industryType);
      const customOptions = prev.filter((opt) => !defaults.some((def) => def.value === opt.value));
      const selectedCustoms = (formState.businessInfo.servicesOffered || [])
        .filter((value) => !defaults.some((def) => def.value === value))
        .filter((value) => !customOptions.some((opt) => opt.value === value))
        .map((value) => ({ value, label: value }));
      return [...defaults, ...customOptions, ...selectedCustoms];
    });
    setServiceSearchTerm("");
    setServiceInputError("");
  }, [formState.businessInfo.industryType, formState.businessInfo.servicesOffered]);

  // Sync country code when country changes
  useEffect(() => {
    if (formState.businessInfo.country) {
      const phoneCode = getPhoneCodeByCountry(formState.businessInfo.country);
      if (phoneCode) {
        setCountryCode(phoneCode);
      }
    }
  }, [formState.businessInfo.country]);

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
        const nameRegex = /^[a-zA-Z\s&.-]+$/; // Only letters, spaces, &, ., and - allowed
        if (value.length < 2) {
          isInvalid = true
          message = "Business name must be at least 2 characters"
        } else if (!nameRegex.test(value)) {
          isInvalid = true
          message = "Business name should only contain letters, spaces, &, ., and -"
        } else {
          isValid = true
          message = "Valid business name"
        }
        break
      case "legalEntityName":
        const legalNameRegex = /^[a-zA-Z0-9\s&.,-]+$/
        
        if (value.trim().length === 0) {
          // Legal entity name is optional, so empty is valid
          isValid = false
          isInvalid = false
          message = ""
        } else if (value.trim().length < 2) {
          isInvalid = true
          message = "Legal entity name must be at least 2 characters"
        } else if (!legalNameRegex.test(value)) {
          isInvalid = true
          message = "Legal entity name should only contain letters, numbers, spaces, &, ., , and -"
        } else {
          isValid = true
          message = "Valid legal entity name"
        }
        break
      case "businessEmail":
        // More robust email validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        const trimmedEmail = value.trim()
        
        if (trimmedEmail.length === 0) {
          isInvalid = true
          message = "Business email is required"
        } else if (trimmedEmail.length < 5) {
          isInvalid = true
          message = "Email must be at least 5 characters long"
        } else if (trimmedEmail.startsWith('.') || trimmedEmail.startsWith('-') || trimmedEmail.startsWith('_')) {
          isInvalid = true
          message = "Email cannot start with special characters"
        } else if (!emailRegex.test(trimmedEmail)) {
          isInvalid = true
          message = "Please enter a valid email address (e.g., name@domain.com)"
        } else if (trimmedEmail.includes('..')) {
          isInvalid = true
          message = "Email cannot contain consecutive dots"
        } else {
          // Additional validation for domain part
          const domainPart = trimmedEmail.split('@')[1]
          if (domainPart && domainPart.length < 4) {
            isInvalid = true
            message = "Domain must be at least 4 characters (e.g., mail.com)"
          } else {
            isValid = true
            message = "Valid email address"
          }
        }
        break
      case "phoneNumber":
        // Phone number validation - only numbers, spaces, parentheses, hyphens, and plus
        const phoneRegex = /^[\+]?[0-9\s\(\)\-]+$/
        const cleanPhone = value.replace(/[\s\(\)\-]/g, '') // Remove formatting for length check
        
        if (value.trim().length === 0) {
          isInvalid = true
          message = "Phone number is required"
        } else if (!phoneRegex.test(value)) {
          isInvalid = true
          message = "Phone number can only contain numbers, spaces, (), -, and +"
        } else if (cleanPhone.length < 10) {
          isInvalid = true
          message = "Phone number must be at least 10 digits"
        } else if (cleanPhone.length > 15) {
          isInvalid = true
          message = "Phone number cannot exceed 15 digits"
        } else {
          isValid = true
          message = "Valid phone number"
        }
        break
      case "city":
        const cityRegex = /^[a-zA-Z\s.-]+$/; // Only letters, spaces, ., and - allowed
        if (value.length < 2) {
          isInvalid = true
          message = "City must be at least 2 characters"
        } else if (!cityRegex.test(value)) {
          isInvalid = true
          message = "City should only contain letters, spaces, ., and -"
        } else {
          isValid = true
          message = "Valid city name"
        }
        break
      case "pincode":
        const pincodeRegex = /^[a-zA-Z0-9\s\-]+$/; // Alphanumeric with spaces and hyphens
        const trimmedPincode = value.trim();
        if (trimmedPincode.length < 3) {
          isInvalid = true
          message = "Postal code must be at least 3 characters"
        } else if (trimmedPincode.length > 10) {
          isInvalid = true
          message = "Postal code cannot exceed 10 characters"
        } else if (!pincodeRegex.test(trimmedPincode)) {
          isInvalid = true
          message = "Postal code should only contain letters, numbers, spaces, and hyphens"
        } else {
          isValid = true
          message = "Valid postal code"
        }
        break
      case "address":
        const addressRegex = /^[a-zA-Z0-9\s\.,\/#&\-]+$/
        
        if (value.trim().length === 0) {
          isInvalid = true
          message = "Address is required"
        } else if (value.trim().length < 5) {
          isInvalid = true
          message = "Address must be at least 5 characters"
        } else if (!addressRegex.test(value)) {
          isInvalid = true
          message = "Address contains invalid characters"
        } else {
          isValid = true
          message = "Valid address"
        }
        break
      case "taxId":
        const taxIdRegex = /^[a-zA-Z0-9\-]+$/
        
        if (value.trim().length === 0) {
          // Tax ID is optional
          isValid = false
          isInvalid = false
          message = ""
        } else if (value.trim().length < 3) {
          isInvalid = true
          message = "Tax ID must be at least 3 characters"
        } else if (!taxIdRegex.test(value)) {
          isInvalid = true
          message = "Tax ID should only contain letters, numbers, and hyphens"
        } else {
          isValid = true
          message = "Valid tax ID"
        }
        break
      case "website":
        const trimmedUrl = value.trim()
        if (trimmedUrl.length === 0) {
          // Website is optional
          isValid = false
          isInvalid = false
          message = ""
          break
        }

        const normalizedUrl = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`
        try {
          const url = new URL(normalizedUrl)
          const hostnameParts = url.hostname.split('.')
          const tld = hostnameParts.pop()
          const baseParts = hostnameParts
          const hasDomain =
            baseParts.length >= 1 &&
            baseParts.every((part) => /^[a-zA-Z0-9-]{1,63}$/.test(part) && !part.startsWith('-') && !part.endsWith('-')) &&
            baseParts.some((part) => part.toLowerCase() !== 'www')
          const validTld = !!tld && /^[a-zA-Z]{2,}$/.test(tld)

          if (!hasDomain || !validTld) {
            isInvalid = true
            message = "Please enter a valid website URL (e.g., https://example.com)"
          } else {
            isValid = true
            message = "Valid website URL"
          }
        } catch (error) {
          isInvalid = true
          message = "Please enter a valid website URL (e.g., https://example.com)"
        }
        break
    }

    setValidationState((prev) => ({
      ...prev,
      [field]: { isValid, isInvalid, message },
    }))
  }

  // Handle phone code change and sync with country
  const handlePhoneCodeChange = (phoneCode: string) => {
    setCountryCode(phoneCode);
    
    // Auto-update country based on selected phone code
    const countryIso = getCountryByPhoneCode(phoneCode);
    if (countryIso && countryIso !== formState.businessInfo.country) {
      updateFormState({
        businessInfo: {
          ...formState.businessInfo,
          country: countryIso,
          state: "", // Reset state when country changes
        },
      });
    }
  };

  // Modify the handleInputChange function to include validation
  const handleInputChange = (field: keyof BusinessInfo, value: any) => {
    if (clearFieldError) clearFieldError(field as string)
    updateFormState({
      businessInfo: {
        ...formState.businessInfo,
        [field]: value,
      },
    });
    // Validate fields that need immediate feedback
    if (["businessName", "legalEntityName", "businessEmail", "phoneNumber", "address", "city", "pincode", "taxId", "website"].includes(field as string)) {
      validateField(field as string, value)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file) {
      if (!ensureFileSizeWithinLimit(file, "logo", "Business logo")) {
        setLogoPreview(null)
        handleInputChange("logo", null)
        if (logoInputRef.current) {
          logoInputRef.current.value = ""
        }
        return
      }
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
      if (!ensureFileSizeWithinLimit(file, "profilePicture", "Profile picture")) {
        setProfilePicturePreview(null)
        handleInputChange("profilePicture", null)
        if (profilePictureInputRef.current) {
          profilePictureInputRef.current.value = ""
        }
        return
      }
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
      if (!ensureFileSizeWithinLimit(file, "businessNameFile", "Business name proof")) {
        setBusinessNamePreview(null)
        handleInputChange("businessNameFile", null)
        if (businessNameFileInputRef.current) {
          businessNameFileInputRef.current.value = ""
        }
        return
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBusinessNamePreview(reader.result as string)
        handleInputChange("businessNameFile", file);
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLogoRemove = () => {
    setLogoPreview(null)
    handleInputChange("logo", null)
    setUploadErrors((prev) => ({ ...prev, logo: "" }))
    if (logoInputRef.current) {
      logoInputRef.current.value = ""
    }
  }

  const handleBusinessNameFileRemove = () => {
    handleInputChange("businessNameFile", null)
    setBusinessNamePreview(null)
    setUploadErrors((prev) => ({ ...prev, businessNameFile: "" }))
    if (businessNameFileInputRef.current) {
      businessNameFileInputRef.current.value = ""
    }
  }

  const handleProfilePictureRemove = () => {
    setProfilePicturePreview(null)
    handleInputChange("profilePicture", null)
    setUploadErrors((prev) => ({ ...prev, profilePicture: "" }))
    if (profilePictureInputRef.current) {
      profilePictureInputRef.current.value = ""
    }
  }

  const getServiceLabel = (value: string) => {
    const match = availableServiceOptions.find((option) => option.value === value)
    return match ? match.label : value
  }

  const addCustomService = (rawValue: string) => {
    const sanitizedValue = rawValue.trim().replace(/\s+/g, " ")
    if (!sanitizedValue) return
    const allowedPattern = /^[a-zA-Z\s]+$/
    if (!allowedPattern.test(sanitizedValue)) {
      setServiceInputError("Only letters and spaces allowed")
      return
    }

    const existing = availableServiceOptions.find(
      (option) => option.value.toLowerCase() === sanitizedValue.toLowerCase()
    )
    const normalizedValue = existing ? existing.value : sanitizedValue

    if (!existing) {
      setCustomServiceOptions((prev) => {
        const existsInCustom = prev.some(
          (option) => option.value.toLowerCase() === sanitizedValue.toLowerCase()
        )
        return existsInCustom ? prev : [...prev, { value: sanitizedValue, label: sanitizedValue }]
      })
    }

    const currentServices = formState.businessInfo.servicesOffered || []
    const alreadySelected = currentServices.some(
      (service) => service.toLowerCase() === normalizedValue.toLowerCase()
    )

    if (!alreadySelected) {
      handleInputChange("servicesOffered", [...currentServices, normalizedValue])
      clearFieldError?.("servicesOffered")
    }

    setServiceInputError("")
    setServiceSearchTerm("")
  }

  const handleServiceToggle = (service: string) => {
    const currentServices = formState.businessInfo.servicesOffered
    const updatedServices = currentServices.includes(service)
      ? currentServices.filter((s: string) => s !== service)
      : [...currentServices, service]

    handleInputChange("servicesOffered", updatedServices)
    clearFieldError?.("servicesOffered")
  }

  const clearServices = () => {
    handleInputChange("servicesOffered", [])
    clearFieldError?.("servicesOffered")
  }

  const applyBusinessNameSuggestion = (suggestion: string) => {
    handleInputChange("businessName", suggestion)
    setBusinessNameSuggestions([])
  }

  const selectedServiceLabels = (formState.businessInfo.servicesOffered || []).map(getServiceLabel)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
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
            className={cn(externalErrors.businessName && "border-red-500 focus-visible:ring-red-500")}
          />
          <FormValidation
            isValid={validationState.businessName.isValid && !externalErrors.businessName}
            isInvalid={validationState.businessName.isInvalid || !!externalErrors.businessName}
            message={externalErrors.businessName || validationState.businessName.message}
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
            onBlur={() => validateField("legalEntityName", formState.businessInfo.legalEntityName)}
            className={cn(externalErrors.legalEntityName && "border-red-500 focus-visible:ring-red-500")}
          />
          <FormValidation
            isValid={validationState.legalEntityName.isValid && !externalErrors.legalEntityName}
            isInvalid={validationState.legalEntityName.isInvalid || !!externalErrors.legalEntityName}
            message={externalErrors.legalEntityName || validationState.legalEntityName.message}
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
            className={cn(externalErrors.businessEmail && "border-red-500 focus-visible:ring-red-500")}
          />
          <FormValidation
            isValid={validationState.businessEmail.isValid && !externalErrors.businessEmail}
            isInvalid={validationState.businessEmail.isInvalid || !!externalErrors.businessEmail}
            message={externalErrors.businessEmail || validationState.businessEmail.message}
          />
        </div>

        {/* Country (Dropdown with Search) */}
        <div className="space-y-2">
          <Label htmlFor="country">
            Country <span className="text-red-500">*</span>
          </Label>
          <CountrySelect
            country={formState.businessInfo.country}
            onChange={(value, label) => handleInputChange("country", value)}
            countries={countries}
            loading={countriesLoading}
            error={countriesError}
            hasError={!!externalErrors.country}
            id="country"
          />
          <FormValidation
            isValid={!!formState.businessInfo.country && !externalErrors.country}
            isInvalid={!!externalErrors.country}
            message={externalErrors.country || ""}
          />
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-2">
            <PhoneCountryCodeSelect 
              value={countryCode} 
              onChange={handlePhoneCodeChange}
              className="w-[130px]"
            />
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="9876543210"
              value={formState.businessInfo.phoneNumber}
              onChange={(e) => {
                const sanitized = e.target.value.replace(/[^0-9]/g, '');
                handleInputChange("phoneNumber", sanitized);
              }}
              aria-required="true"
              onBlur={() => validateField("phoneNumber", formState.businessInfo.phoneNumber)}
              className={cn("flex-1", externalErrors.phoneNumber && "border-red-500 focus-visible:ring-red-500")}
              maxLength={15}
            />
          </div>
          <FormValidation
            isValid={validationState.phoneNumber.isValid && !externalErrors.phoneNumber}
            isInvalid={validationState.phoneNumber.isInvalid || !!externalErrors.phoneNumber}
            message={externalErrors.phoneNumber || validationState.phoneNumber.message}
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
            <SelectTrigger
              id="industryType"
              data-field="industryType"
              aria-required="true"
              className={cn(externalErrors.industryType && "border-red-500 focus-visible:ring-red-500")}
            >
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
          <FormValidation
            isValid={!!formState.businessInfo.industryType && !externalErrors.industryType}
            isInvalid={!!externalErrors.industryType}
            message={externalErrors.industryType || ""}
          />
        </div>

        {/* Services Offered */}
        <div className="space-y-2 md:col-span-2 max-w-md">
          <div className="flex items-center justify-between">
            <Label htmlFor="servicesOffered">
              Services Offered <span className="text-red-500">*</span>
            </Label>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                id="servicesOffered"
                data-field="servicesOffered"
                variant="outline"
                className={cn(
                  "mt-2 text-left text-[15px] border-2 hover:bg-gray-50 hover:border-gray-400 focus:!border-purple-500 focus:!ring-2 focus:!ring-purple-500 focus:outline-none data-[state=open]:!border-purple-500 data-[state=open]:!ring-2 data-[state=open]:!ring-purple-500",
                  externalErrors.servicesOffered && "border-red-500 focus:!ring-red-500 focus:!border-red-500"
                )}
                style={{
                  minWidth: "120px",
                  width: selectedServiceLabels.length === 0
                    ? "120px"
                    : `${Math.min(480, 120 + selectedServiceLabels.join(', ').length * 8)}px`,
                  maxWidth: "100%",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  transition: "width 0.2s",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <span
                  style={{ overflow: "hidden", textOverflow: "ellipsis" }}
                  className={!selectedServiceLabels.length ? "text-gray-400" : ""}
                >
                  {selectedServiceLabels.length > 0
                    ? selectedServiceLabels.join(", ")
                    : formState.businessInfo.industryType
                      ? "Select services"
                      : "Select industry to load services"}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start" className="w-48 p-2 text-[15px]">
              <div className="flex items-center mb-2 gap-1">
                <Input
                  placeholder="Search or add service..."
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={serviceSearchTerm}
                  onChange={(e) => {
                    const value = e.target.value
                    const allowedPattern = /^[a-zA-Z\s]*$/
                    if (allowedPattern.test(value)) {
                      setServiceSearchTerm(value)
                      setServiceInputError("")
                    } else {
                      setServiceInputError("Only letters and spaces allowed")
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addCustomService(serviceSearchTerm)
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs px-1 py-1 border border-gray-300"
                  onClick={clearServices}
                  disabled={(formState.businessInfo.servicesOffered || []).length === 0}
                >
                  Clear All
                </Button>
              </div>
              {serviceInputError && (
                <p className="text-red-500 text-xs mb-2">{serviceInputError}</p>
              )}
              <div
                style={{
                  minHeight: "32px",
                  maxHeight:
                    ((formState.businessInfo.servicesOffered?.length || 0) + availableServiceOptions.length) <= 2
                      ? "48px"
                      : `${Math.min(160, ((formState.businessInfo.servicesOffered?.length || 0) + availableServiceOptions.length) * 32)}px`,
                  overflowY:
                    ((formState.businessInfo.servicesOffered?.length || 0) + availableServiceOptions.length) > 4
                      ? "auto"
                      : "visible",
                  transition: "max-height 0.2s"
                }}
                className="overflow-y-auto text-[15px]"
              >
                {availableServiceOptions
                  .filter((service) =>
                    service.label.toLowerCase().includes(serviceSearchTerm.toLowerCase())
                  )
                  .map((service) => (
                    <div key={service.value} className="flex items-center gap-1 py-1 text-[15px]">
                      <Checkbox
                        checked={(formState.businessInfo.servicesOffered || []).includes(service.value)}
                        onCheckedChange={() => handleServiceToggle(service.value)}
                        id={`service-${service.value}`}
                        className="border-purple-300 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500 data-[state=checked]:text-white"
                      />
                      <Label htmlFor={`service-${service.value}`}>{service.label}</Label>
                    </div>
                  ))}
                {(formState.businessInfo.servicesOffered || [])
                  .filter((value) => !availableServiceOptions.some((opt) => opt.value === value))
                  .filter((value) => value.toLowerCase().includes(serviceSearchTerm.toLowerCase()))
                  .map((value) => (
                    <div key={`custom-${value}`} className="flex items-center gap-1 py-1 text-[15px]">
                      <Checkbox
                        checked={(formState.businessInfo.servicesOffered || []).includes(value)}
                        onCheckedChange={() => handleServiceToggle(value)}
                        id={`service-custom-${value}`}
                        className="border-purple-300 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500 data-[state=checked]:text-white"
                      />
                      <Label htmlFor={`service-custom-${value}`}>{value}</Label>
                    </div>
                  ))}
                {availableServiceOptions.filter((service) =>
                  service.label.toLowerCase().includes(serviceSearchTerm.toLowerCase())
                ).length === 0 && serviceSearchTerm.trim() !== "" && (
                  <div className="flex items-center gap-2 py-1 text-[15px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2 py-1 text-[15px]"
                      onClick={() => addCustomService(serviceSearchTerm)}
                    >
                      Add "{serviceSearchTerm.trim()}" as new service
                    </Button>
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="text-[13px] text-gray-500 mt-0.5">Select one or more services.</div>
          <FormValidation
            isValid={formState.businessInfo.servicesOffered.length > 0 && !externalErrors.servicesOffered}
            isInvalid={!!externalErrors.servicesOffered}
            message={externalErrors.servicesOffered || ""}
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
            <SelectTrigger
              id="studentSize"
              data-field="studentSize"
              aria-required="true"
              className={cn(externalErrors.studentSize && "border-red-500 focus-visible:ring-red-500")}
            >
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
          <FormValidation
            isValid={!!formState.businessInfo.studentSize && !externalErrors.studentSize}
            isInvalid={!!externalErrors.studentSize}
            message={externalErrors.studentSize || ""}
          />
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
            <SelectTrigger
              id="staffCount"
              data-field="staffCount"
              aria-required="true"
              className={cn(externalErrors.staffCount && "border-red-500 focus-visible:ring-red-500")}
            >
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
          <FormValidation
            isValid={!!formState.businessInfo.staffCount && !externalErrors.staffCount}
            isInvalid={!!externalErrors.staffCount}
            message={externalErrors.staffCount || ""}
          />
        </div>

        {/* State/Province (Dropdown, Mandatory) */}
        <div className="space-y-2">
          <Label htmlFor="state">
            State/Province <span className="text-red-500">*</span>
          </Label>
          <StateSelect
            countryCode={formState.businessInfo.country}
            state={formState.businessInfo.state}
            onChange={(value) => handleInputChange("state", value)}
            states={states}
            loading={statesLoading}
            error={statesError}
            hasError={!!externalErrors.state}
            id="state"
          />
          <FormValidation
            isValid={!!formState.businessInfo.state && !externalErrors.state}
            isInvalid={!!externalErrors.state}
            message={externalErrors.state || ""}
          />
        </div>

        {/* Address */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">
            Address <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="address"
            placeholder="Enter your complete business address"
            value={formState.businessInfo.address}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("address", e.target.value)}
            onBlur={() => validateField("address", formState.businessInfo.address)}
            rows={2}
            aria-required="true"
            className={cn(externalErrors.address && "border-red-500 focus-visible:ring-red-500")}
          />
          <FormValidation
            isValid={validationState.address.isValid && !externalErrors.address}
            isInvalid={validationState.address.isInvalid || !!externalErrors.address}
            message={externalErrors.address || validationState.address.message}
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
            onBlur={() => validateField("city", formState.businessInfo.city)}
            aria-required="true"
            className={cn(externalErrors.city && "border-red-500 focus-visible:ring-red-500")}
          />
          <FormValidation 
            isValid={validationState.city.isValid && !externalErrors.city}
            isInvalid={validationState.city.isInvalid || !!externalErrors.city}
            message={externalErrors.city || validationState.city.message}
          />
        </div>

        {/* Postal/Zip/Pin Code (Input, after city, Mandatory) */}
        <div className="space-y-2">
          <Label htmlFor="pincode">Postal/Zip/Pin Code <span className="text-red-500">*</span></Label>
          <Input
            id="pincode"
            placeholder="e.g., 110001 or K1A 0B1"
            value={formState.businessInfo.pincode || ""}
            onChange={(e) => {
              const sanitized = e.target.value.replace(/[^a-zA-Z0-9\s-]/g, "");
              handleInputChange("pincode", sanitized);
            }}
            onBlur={() => validateField("pincode", formState.businessInfo.pincode || "")}
            aria-required="true"
            maxLength={10}
            className={cn(externalErrors.pincode && "border-red-500 focus-visible:ring-red-500")}
          />
          <FormValidation 
            isValid={validationState.pincode.isValid && !externalErrors.pincode}
            isInvalid={validationState.pincode.isInvalid || !!externalErrors.pincode}
            message={externalErrors.pincode || validationState.pincode.message}
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
            onBlur={() => validateField("taxId", formState.businessInfo.taxId || "")}
            className={cn(externalErrors.taxId && "border-red-500 focus-visible:ring-red-500")}
          />
          <FormValidation
            isValid={validationState.taxId.isValid}
            isInvalid={validationState.taxId.isInvalid}
            message={validationState.taxId.message}
          />
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            placeholder="https://yourbusiness.com"
            value={formState.businessInfo.website}
            onChange={(e) => handleInputChange("website", e.target.value)}
            onBlur={() => validateField("website", formState.businessInfo.website)}
            className={cn(externalErrors.website && "border-red-500 focus-visible:ring-red-500")}
          />
          <FormValidation
            isValid={validationState.website.isValid}
            isInvalid={validationState.website.isInvalid}
            message={validationState.website.message}
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
            <SelectTrigger
              id="preferredLanguage"
              data-field="preferredLanguage"
              aria-required="true"
              className={cn(externalErrors.preferredLanguage && "border-red-500 focus-visible:ring-red-500")}
            >
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
          <FormValidation
            isValid={!!formState.businessInfo.preferredLanguage && !externalErrors.preferredLanguage}
            isInvalid={!!externalErrors.preferredLanguage}
            message={externalErrors.preferredLanguage || ""}
          />
        </div>

        {/* Logo, Profile Picture, and Business Name Upload */}
        <div className="space-y-2 md:col-span-2">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Business Logo Upload */}
            <div className="flex-1">
              <Label htmlFor="logo">Business Logo</Label>
              <Input
                id="logo"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={handleLogoChange}
                ref={logoInputRef}
                className="cursor-pointer w-full h-[42px] !py-0 !px-0 !mt-0 !leading-[42px] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer file:!leading-normal"
              />
              <p className="text-xs text-muted-foreground mt-1">Accepted formats: PNG, JPG, JPEG, SVG. Max size: {MAX_UPLOAD_SIZE_LABEL}</p>
              {uploadErrors.logo && (
                <p className="text-xs text-red-600 mt-1">{uploadErrors.logo}</p>
              )}
              {(formState.businessInfo.logo || formState.businessInfo.businessLogoUrl) && (
                <div className="mt-2 flex items-center gap-3 text-xs text-green-600">
                  <span>
                    Uploaded: {formState.businessInfo.logo ? formState.businessInfo.logo.name : "Existing logo on file"}
                  </span>
                </div>
              )}
              {logoPreview && (
                <div className="relative w-20 h-20 mt-2">
                  <div className="w-full h-full rounded border overflow-hidden flex items-center justify-center bg-gray-50">
                    <img
                      src={logoPreview || "/placeholder.svg"}
                      alt="Logo preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleLogoRemove}
                    className="absolute -top-3 -right-3 bg-white border rounded-full shadow-sm h-7 w-7 flex items-center justify-center text-gray-600 hover:text-red-600"
                    aria-label="Remove business logo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Business Name Upload (Moved to second) */}
            <div className="flex-1">
              <Label htmlFor="businessNameFile">Business Name Upload</Label>
              <Input
                id="businessNameFile"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={handleBusinessNameFileChange}
                ref={businessNameFileInputRef}
                className="cursor-pointer w-full h-[42px] !py-0 !px-0 !mt-0 !leading-[42px] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 file:cursor-pointer file:!leading-normal"
              />
              <p className="text-xs text-muted-foreground mt-1">Accepted formats: PNG, JPG, JPEG, SVG. Max size: {MAX_UPLOAD_SIZE_LABEL}</p>
              {uploadErrors.businessNameFile && (
                <p className="text-xs text-red-600 mt-1">{uploadErrors.businessNameFile}</p>
              )}
              {formState.businessInfo.businessNameFile && (
                <div className="mt-2 flex items-center gap-3 text-xs text-green-600">
                  <span>Uploaded: {formState.businessInfo.businessNameFile.name}</span>
                </div>
              )}
              {businessNamePreview && (
                <div className="relative w-20 h-20 mt-2">
                  <div className="w-full h-full rounded border overflow-hidden flex items-center justify-center bg-gray-50">
                    <img
                      src={businessNamePreview}
                      alt="Business name preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleBusinessNameFileRemove}
                    className="absolute -top-3 -right-3 bg-white border rounded-full shadow-sm h-7 w-7 flex items-center justify-center text-gray-600 hover:text-red-600"
                    aria-label="Remove business name upload"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Profile Picture Upload (Moved to third) */}
            <div className="flex-1">
              <Label htmlFor="profilePicture">Profile Picture</Label>
              <Input
                id="profilePicture"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={handleProfilePictureChange}
                ref={profilePictureInputRef}
                className="cursor-pointer w-full h-[42px] !py-0 !px-0 !mt-0 !leading-[42px] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 file:cursor-pointer file:!leading-normal"
              />
              <p className="text-xs text-muted-foreground mt-1">Accepted formats: PNG, JPG, JPEG, SVG. Max size: {MAX_UPLOAD_SIZE_LABEL}</p>
              {uploadErrors.profilePicture && (
                <p className="text-xs text-red-600 mt-1">{uploadErrors.profilePicture}</p>
              )}
              {profilePicturePreview && (
                <div className="relative w-20 h-20 mt-2">
                  <div className="w-full h-full rounded-full border overflow-hidden flex items-center justify-center bg-gray-50">
                    <img
                      src={profilePicturePreview || "/placeholder-user.jpg"}
                      alt="Profile preview"
                      className="max-w-full max-h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleProfilePictureRemove}
                    className="absolute -top-3 -right-3 bg-white border rounded-full shadow-sm h-7 w-7 flex items-center justify-center text-gray-600 hover:text-red-600"
                    aria-label="Remove profile picture"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {formState.businessInfo.profilePicture && (
                <div className="mt-2 flex items-center gap-3 text-xs text-green-600">
                  <span>Uploaded: {formState.businessInfo.profilePicture.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
