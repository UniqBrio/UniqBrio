// External API utilities for fetching countries and states data

export interface Country {
  name: {
    common: string;
    official: string;
  };
  cca2: string; // ISO 2-letter country code
}

export interface State {
  name: string;
  state_code?: string;
}

export interface CountryWithStates {
  name: string;
  iso2: string;
  iso3?: string;
  states: State[];
}

export interface CountryDetails {
  name: {
    common: string;
    official: string;
  };
  cca2: string;
  cca3: string;
  idd?: {
    root?: string;
    suffixes?: string[];
  };
  capital?: string[];
  region?: string;
  subregion?: string;
  population?: number;
  flags?: {
    png?: string;
    svg?: string;
  };
}

/**
 * Fetch all countries with basic info (name and ISO2 code)
 */
export async function fetchCountries(): Promise<Country[]> {
  try {
    const response = await fetch('/api/countries', {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch countries: ${response.statusText}`);
    }
    const result = await response.json();
    if (!result.success || !Array.isArray(result.data)) {
      throw new Error('Invalid response from countries API');
    }
    // Map the API response to Country format
    return result.data.map((item: any) => ({
      name: { common: item.label, official: item.label },
      cca2: item.value
    }));
  } catch (error) {
    console.error('Error fetching countries:', error);
    throw error;
  }
}

/**
 * Fetch states/provinces for a specific country
 * @param countryCode - The ISO2 country code (e.g., "IN", "US")
 */
export async function fetchStates(countryCode: string): Promise<State[]> {
  try {
    const response = await fetch(`/api/countries/states?country=${encodeURIComponent(countryCode)}`, {
      signal: AbortSignal.timeout(10000), // 10 second timeout
      credentials: 'include',
    });

    if (!response.ok) {
      console.warn(`Failed to fetch states for country code: ${countryCode} (${response.status})`);
      return [];
    }

    const result = await response.json();
    
    if (!result.success) {
      console.warn(`API error for country ${countryCode}:`, result.error);
      return [];
    }
    
    if (result.data && Array.isArray(result.data)) {
      return result.data.map((item: any) => ({
        name: item.label || item.value,
        state_code: item.value
      }));
    }
    
    return [];
  } catch (error) {
    // Handle timeout, network errors, and other fetch failures gracefully
    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        console.warn(`Timeout fetching states for ${countryCode}`);
      } else if (error.message.includes('fetch')) {
        console.warn(`Network error fetching states for ${countryCode}:`, error.message);
      } else {
        console.warn(`Error fetching states for ${countryCode}:`, error.message);
      }
    } else {
      console.warn(`Unknown error fetching states for ${countryCode}`);
    }
    return [];
  }
}

/**
 * Fetch detailed information about a country by its ISO2 code
 * @param countryCode - The ISO2 country code (e.g., "IN", "US")
 */
export async function fetchCountryDetails(countryCode: string): Promise<CountryDetails | null> {
  try {
    const response = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch country details: ${response.statusText}`);
    }
    const data: CountryDetails[] = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error('Error fetching country details:', error);
    return null;
  }
}

/**
 * Get phone country code from country details
 * @param countryCode - The ISO2 country code (e.g., "IN", "US")
 * @returns Phone code with + prefix (e.g., "+91", "+1")
 */
export async function getPhoneCodeForCountry(countryCode: string): Promise<string | null> {
  try {
    const details = await fetchCountryDetails(countryCode);
    if (details?.idd?.root) {
      const suffix = details.idd.suffixes?.[0] || '';
      return `${details.idd.root}${suffix}`;
    }
    return null;
  } catch (error) {
    console.error('Error getting phone code:', error);
    return null;
  }
}

/**
 * Cache for countries to avoid repeated API calls
 */
let countriesCache: Country[] | null = null;

/**
 * Get countries with caching
 */
export async function getCachedCountries(): Promise<Country[]> {
  if (countriesCache) {
    return countriesCache;
  }
  countriesCache = await fetchCountries();
  return countriesCache;
}

/**
 * Cache for states by country code
 */
const statesCache = new Map<string, State[]>();

/**
 * Get states with caching
 * @param countryCode - The ISO2 country code (e.g., "IN", "US")
 */
export async function getCachedStates(countryCode: string): Promise<State[]> {
  if (statesCache.has(countryCode)) {
    return statesCache.get(countryCode)!;
  }
  const states = await fetchStates(countryCode);
  statesCache.set(countryCode, states);
  return states;
}

/**
 * Fetch all countries with phone codes
 * This fetches full country details including phone codes (IDD)
 */
export async function fetchCountriesWithPhoneCodes(): Promise<CountryDetails[]> {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,cca3,idd');
    if (!response.ok) {
      throw new Error(`Failed to fetch countries with phone codes: ${response.statusText}`);
    }
    const data: CountryDetails[] = await response.json();
    // Sort alphabetically by common name
    return data.sort((a, b) => a.name.common.localeCompare(b.name.common));
  } catch (error) {
    console.error('Error fetching countries with phone codes:', error);
    throw error;
  }
}

/**
 * Convert country details to phone country code format
 */
export function convertToPhoneCountryCode(country: CountryDetails): { code: string; country: string; iso2: string } | null {
  if (!country.idd?.root) return null;
  
  // Get the phone code - use first suffix if multiple exist
  const suffix = country.idd.suffixes?.[0] || '';
  const phoneCode = `${country.idd.root}${suffix}`;
  
  return {
    code: phoneCode,
    country: country.name.common,
    iso2: country.cca2
  };
}

/**
 * Get all phone country codes from the API
 */
export async function getPhoneCountryCodes(): Promise<Array<{ code: string; country: string; iso2: string }>> {
  try {
    const countries = await fetchCountriesWithPhoneCodes();
    const phoneCodes = countries
      .map(convertToPhoneCountryCode)
      .filter((code): code is { code: string; country: string; iso2: string } => code !== null)
      // Remove duplicates by phone code (keep first occurrence)
      .filter((code, index, self) => 
        index === self.findIndex(c => c.code === code.code)
      );
    
    return phoneCodes;
  } catch (error) {
    console.error('Error getting phone country codes:', error);
    throw error;
  }
}

/**
 * Cache for phone country codes
 */
let phoneCodesCache: Array<{ code: string; country: string; iso2: string }> | null = null;

/**
 * Get phone country codes with caching
 */
export async function getCachedPhoneCountryCodes(): Promise<Array<{ code: string; country: string; iso2: string }>> {
  if (phoneCodesCache) {
    return phoneCodesCache;
  }
  phoneCodesCache = await getPhoneCountryCodes();
  return phoneCodesCache;
}

/**
 * Map of country ISO2 codes to phone codes
 * This is populated from the API or can be used as a fallback
 */
const COUNTRY_TO_PHONE_CODE_MAP: Record<string, string> = {
  'US': '+1', 'CA': '+1', 'RU': '+7', 'EG': '+20', 'ZA': '+27',
  'GR': '+30', 'NL': '+31', 'BE': '+32', 'FR': '+33', 'ES': '+34',
  'IT': '+39', 'CH': '+41', 'GB': '+44', 'DK': '+45', 'SE': '+46',
  'NO': '+47', 'DE': '+49', 'MX': '+52', 'AR': '+54', 'BR': '+55',
  'AU': '+61', 'NZ': '+64', 'SG': '+65', 'JP': '+81', 'KR': '+82',
  'CN': '+86', 'TR': '+90', 'IN': '+91', 'PK': '+92', 'LK': '+94',
  'AE': '+971', 'IL': '+972', 'BH': '+973', 'QA': '+974', 'BT': '+975',
  'NP': '+977', 'NG': '+234', 'KE': '+254', 'IE': '+353', 'FI': '+358',
  'AD': '+376', 'AL': '+355', 'AT': '+43', 'BA': '+387', 'BG': '+359',
  'HR': '+385', 'CY': '+357', 'CZ': '+420', 'EE': '+372', 'GE': '+995',
  'HU': '+36', 'IS': '+354', 'LV': '+371', 'LT': '+370', 'LU': '+352',
  'MK': '+389', 'MT': '+356', 'MD': '+373', 'MC': '+377', 'ME': '+382',
  'PL': '+48', 'PT': '+351', 'RO': '+40', 'RS': '+381', 'SK': '+421',
  'SI': '+386', 'UA': '+380', 'VA': '+379', 'SM': '+378', 'LI': '+423',
  'AF': '+93', 'BD': '+880', 'KH': '+855', 'ID': '+62', 'IR': '+98',
  'IQ': '+964', 'JO': '+962', 'KZ': '+7', 'KW': '+965', 'KG': '+996',
  'LA': '+856', 'LB': '+961', 'MY': '+60', 'MV': '+960', 'MN': '+976',
  'MM': '+95', 'OM': '+968', 'PH': '+63', 'SA': '+966', 'KP': '+850',
  'TW': '+886', 'TJ': '+992', 'TH': '+66', 'TM': '+993', 'UZ': '+998',
  'VN': '+84', 'YE': '+967', 'BN': '+673', 'SY': '+963', 'AM': '+374',
  'AZ': '+994', 'BY': '+375', 'TL': '+670', 'PS': '+970'
};

/**
 * Map of phone codes to country ISO2 codes
 */
const PHONE_CODE_TO_COUNTRY_MAP: Record<string, string> = {
  '+1': 'US', '+7': 'RU', '+20': 'EG', '+27': 'ZA', '+30': 'GR',
  '+31': 'NL', '+32': 'BE', '+33': 'FR', '+34': 'ES', '+39': 'IT',
  '+41': 'CH', '+44': 'GB', '+45': 'DK', '+46': 'SE', '+47': 'NO',
  '+49': 'DE', '+52': 'MX', '+54': 'AR', '+55': 'BR', '+61': 'AU',
  '+64': 'NZ', '+65': 'SG', '+81': 'JP', '+82': 'KR', '+86': 'CN',
  '+90': 'TR', '+91': 'IN', '+92': 'PK', '+94': 'LK', '+971': 'AE',
  '+972': 'IL', '+973': 'BH', '+974': 'QA', '+975': 'BT', '+977': 'NP',
  '+234': 'NG', '+254': 'KE', '+353': 'IE', '+358': 'FI', '+376': 'AD',
  '+355': 'AL', '+43': 'AT', '+387': 'BA', '+359': 'BG', '+385': 'HR',
  '+357': 'CY', '+420': 'CZ', '+372': 'EE', '+995': 'GE', '+36': 'HU',
  '+354': 'IS', '+371': 'LV', '+370': 'LT', '+352': 'LU', '+389': 'MK',
  '+356': 'MT', '+373': 'MD', '+377': 'MC', '+382': 'ME', '+48': 'PL',
  '+351': 'PT', '+40': 'RO', '+381': 'RS', '+421': 'SK', '+386': 'SI',
  '+380': 'UA', '+379': 'VA', '+378': 'SM', '+423': 'LI', '+93': 'AF',
  '+880': 'BD', '+855': 'KH', '+62': 'ID', '+98': 'IR', '+964': 'IQ',
  '+962': 'JO', '+965': 'KW', '+996': 'KG', '+856': 'LA', '+961': 'LB',
  '+60': 'MY', '+960': 'MV', '+976': 'MN', '+95': 'MM', '+968': 'OM',
  '+63': 'PH', '+966': 'SA', '+850': 'KP', '+886': 'TW', '+992': 'TJ',
  '+66': 'TH', '+993': 'TM', '+998': 'UZ', '+84': 'VN', '+967': 'YE',
  '+673': 'BN', '+963': 'SY', '+374': 'AM', '+994': 'AZ', '+375': 'BY',
  '+670': 'TL', '+970': 'PS'
};

/**
 * Get phone code for a country ISO2 code
 */
export function getPhoneCodeByCountry(countryCode: string): string | null {
  return COUNTRY_TO_PHONE_CODE_MAP[countryCode] || null;
}

/**
 * Get country ISO2 code from phone code
 */
export function getCountryByPhoneCode(phoneCode: string): string | null {
  return PHONE_CODE_TO_COUNTRY_MAP[phoneCode] || null;
}

/**
 * Build dynamic mapping from API data
 * This enriches the static mappings with all countries from the API
 */
export async function buildPhoneCodeMapping(): Promise<void> {
  try {
    const countries = await fetchCountriesWithPhoneCodes();
    
    let addedCount = 0;
    
    // Update maps with API data for ALL countries
    countries.forEach((country) => {
      if (!country.idd?.root || !country.cca2) return;
      
      // Build phone code
      const suffix = country.idd.suffixes?.[0] || '';
      const phoneCode = `${country.idd.root}${suffix}`;
      
      // Only add if not already in map (preserves our manual overrides)
      if (!COUNTRY_TO_PHONE_CODE_MAP[country.cca2]) {
        COUNTRY_TO_PHONE_CODE_MAP[country.cca2] = phoneCode;
        addedCount++;
      }
      
      // For phone to country mapping, only set if not already mapped
      // This handles shared codes (like +1) where we want to keep the default
      if (!PHONE_CODE_TO_COUNTRY_MAP[phoneCode]) {
        PHONE_CODE_TO_COUNTRY_MAP[phoneCode] = country.cca2;
      }
    });
    
    console.log(`📞 Phone code mapping built: ${Object.keys(COUNTRY_TO_PHONE_CODE_MAP).length} total countries (${addedCount} added from API)`);
  } catch (error) {
    console.error('⚠️ Failed to build phone code mapping from API, using static fallback:', error);
  }
}

/**
 * Flag to track if mapping has been initialized
 */
let mappingInitialized = false;

/**
 * Initialize phone code mapping (call once on app startup)
 */
export async function initializePhoneCodeMapping(): Promise<void> {
  if (mappingInitialized) return;
  
  try {
    await buildPhoneCodeMapping();
    mappingInitialized = true;
  } catch (error) {
    console.error('Failed to initialize phone code mapping:', error);
  }
}
