export interface CountryCallingCode {
  code: string;
  name: string;
  dial: string;
}

export const COUNTRY_CALLING_CODES: CountryCallingCode[] = [
  { code: 'US', name: 'United States', dial: '+1' },
  { code: 'CA', name: 'Canada', dial: '+1' },
  { code: 'GB', name: 'United Kingdom', dial: '+44' }
];
