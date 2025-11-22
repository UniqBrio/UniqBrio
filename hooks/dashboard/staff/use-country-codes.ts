// Dynamic country calling codes hook using REST Countries API
import { useState, useEffect } from 'react';

export interface CountryCallingCode {
  code: string;
  name: string;
  dial: string;
}

// Cache for country codes to avoid repeated API calls
let countryCodesCache: CountryCallingCode[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Fallback data for offline scenarios
const FALLBACK_COUNTRY_CODES: CountryCallingCode[] = [
  { code: 'US', name: 'United States', dial: '+1' },
  { code: 'CA', name: 'Canada', dial: '+1' },
  { code: 'GB', name: 'United Kingdom', dial: '+44' },
  { code: 'AU', name: 'Australia', dial: '+61' },
  { code: 'IN', name: 'India', dial: '+91' },
  { code: 'DE', name: 'Germany', dial: '+49' },
  { code: 'FR', name: 'France', dial: '+33' },
  { code: 'BR', name: 'Brazil', dial: '+55' },
  { code: 'ZA', name: 'South Africa', dial: '+27' },
  { code: 'JP', name: 'Japan', dial: '+81' },
  { code: 'CN', name: 'China', dial: '+86' },
  { code: 'SG', name: 'Singapore', dial: '+65' },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971' },
  { code: 'NG', name: 'Nigeria', dial: '+234' },
  { code: 'KE', name: 'Kenya', dial: '+254' },
  { code: 'MX', name: 'Mexico', dial: '+52' },
  { code: 'ES', name: 'Spain', dial: '+34' },
  { code: 'IT', name: 'Italy', dial: '+39' },
  { code: 'RU', name: 'Russia', dial: '+7' },
  { code: 'AR', name: 'Argentina', dial: '+54' },
  { code: 'TR', name: 'Turkey', dial: '+90' },
  { code: 'KR', name: 'South Korea', dial: '+82' },
  { code: 'SE', name: 'Sweden', dial: '+46' },
  { code: 'NO', name: 'Norway', dial: '+47' },
  { code: 'DK', name: 'Denmark', dial: '+45' },
  { code: 'FI', name: 'Finland', dial: '+358' },
  { code: 'NL', name: 'Netherlands', dial: '+31' },
  { code: 'BE', name: 'Belgium', dial: '+32' },
  { code: 'CH', name: 'Switzerland', dial: '+41' },
  { code: 'IE', name: 'Ireland', dial: '+353' },
  { code: 'NZ', name: 'New Zealand', dial: '+64' },
];

// Fetch country codes from REST Countries API
async function fetchCountryCodes(): Promise<CountryCallingCode[]> {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=cca2,name,idd');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const countries = await response.json();
    
    const countryCodes: CountryCallingCode[] = countries
      .filter((country: any) => country.idd && country.idd.root)
      .map((country: any) => {
        const dialCode = country.idd.root + (country.idd.suffixes?.[0] || '');
        return {
          code: country.cca2,
          name: country.name.common,
          dial: dialCode
        };
      })
      .sort((a: CountryCallingCode, b: CountryCallingCode) => a.name.localeCompare(b.name));
    
    return countryCodes;
  } catch (error) {
    console.warn('Failed to fetch country codes from API:', error);
    return FALLBACK_COUNTRY_CODES;
  }
}

// Custom hook to get country codes
export function useCountryCodes() {
  const [countryCodes, setCountryCodes] = useState<CountryCallingCode[]>(
    countryCodesCache || FALLBACK_COUNTRY_CODES
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCountryCodes = async () => {
      const now = Date.now();
      
      // Return cached data if it exists and is not expired
      if (countryCodesCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
        setCountryCodes(countryCodesCache);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const codes = await fetchCountryCodes();
        countryCodesCache = codes;
        cacheTimestamp = now;
        setCountryCodes(codes);
      } catch (err) {
        setError('Failed to load country codes');
        setCountryCodes(FALLBACK_COUNTRY_CODES);
      } finally {
        setLoading(false);
      }
    };

    loadCountryCodes();
  }, []);

  return { countryCodes, loading, error };
}

// For backward compatibility - export static fallback
export const COUNTRY_CALLING_CODES = FALLBACK_COUNTRY_CODES;
