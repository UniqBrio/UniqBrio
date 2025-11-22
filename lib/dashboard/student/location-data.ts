// Location data utilities: fetch countries & states with offline fallback.
// Remote APIs:
//  - Countries: https://restcountries.com/v3.1/all?fields=name,cca2
//  - States: POST https://countriesnow.space/api/v0.1/countries/states { country }
// Provides caching + graceful fallback when offline.

export interface CountryOption { code: string; name: string; }
export interface StateOption { name: string; }

// Minimal curated fallback list (extend as needed)
const fallbackCountries: CountryOption[] = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
];

// Fallback states keyed by ISO2 and by name for robustness
const fallbackStates: Record<string, string[]> = {
  IN: ['Andhra Pradesh','Delhi','Gujarat','Karnataka','Kerala','Maharashtra','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','West Bengal'],
  India: ['Andhra Pradesh','Delhi','Gujarat','Karnataka','Kerala','Maharashtra','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','West Bengal'],
  US: ['Alabama','Arizona','California','Colorado','Florida','Georgia','Illinois','Massachusetts','New Jersey','New York','Texas','Washington'],
  'United States': ['Alabama','Arizona','California','Colorado','Florida','Georgia','Illinois','Massachusetts','New Jersey','New York','Texas','Washington'],
  CA: ['Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland and Labrador','Nova Scotia','Ontario','Quebec','Saskatchewan'],
  Canada: ['Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland and Labrador','Nova Scotia','Ontario','Quebec','Saskatchewan'],
  AU: ['Australian Capital Territory','New South Wales','Northern Territory','Queensland','South Australia','Tasmania','Victoria','Western Australia'],
  Australia: ['Australian Capital Territory','New South Wales','Northern Territory','Queensland','South Australia','Tasmania','Victoria','Western Australia'],
  GB: ['England','Northern Ireland','Scotland','Wales'],
  'United Kingdom': ['England','Northern Ireland','Scotland','Wales'],
  SG: ['Singapore'],
  Singapore: ['Singapore'],
  AE: ['Abu Dhabi','Ajman','Dubai','Fujairah','Ras Al Khaimah','Sharjah','Umm Al Quwain'],
  'United Arab Emirates': ['Abu Dhabi','Ajman','Dubai','Fujairah','Ras Al Khaimah','Sharjah','Umm Al Quwain'],
};

let cachedCountries: CountryOption[] | null = null;
const statesCache = new Map<string, StateOption[]>();

async function fetchRemoteCountries(): Promise<CountryOption[]> {
  try {
    const res = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2', { cache: 'force-cache' });
    if(!res.ok) throw new Error('countries fetch failed');
    const data = await res.json();
    const mapped: CountryOption[] = data
      .map((c: any) => ({ code: String(c.cca2||'').toUpperCase(), name: c?.name?.common || '' }))
      .filter((c: CountryOption) => c.code && c.name);
    // Deduplicate by code
    const uniq = Array.from(new Map(mapped.map(m => [m.code, m])).values());
    uniq.sort((a,b)=> a.name.localeCompare(b.name));
    return uniq;
  } catch {
    return [];
  }
}

export async function getCountries(forceRefresh=false): Promise<CountryOption[]> {
  if(!forceRefresh && cachedCountries) return cachedCountries;
  const remote = await fetchRemoteCountries();
  const merged = [...remote];
  // Ensure fallback countries present
  for(const fc of fallbackCountries){
    if(!merged.find(c=> c.code===fc.code)) merged.push(fc);
  }
  merged.sort((a,b)=> a.name.localeCompare(b.name));
  cachedCountries = merged;
  return merged;
}

async function fetchRemoteStates(countryCodeOrName: string): Promise<StateOption[]> {
  if(!countryCodeOrName) return [];
  let countryName = countryCodeOrName;
  if(countryCodeOrName.length===2){
    const list = await getCountries();
    const found = list.find(c=> c.code.toUpperCase() === countryCodeOrName.toUpperCase());
    if(found) countryName = found.name;
  }
  try {
    const res = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: countryName })
    });
    if(!res.ok) throw new Error('states fetch failed');
    const data = await res.json();
    if(!data?.data?.states || !Array.isArray(data.data.states)) return [];
    const out: StateOption[] = data.data.states.map((s: any)=> ({ name: s.name })).filter((s: any)=> s.name);
    out.sort((a,b)=> a.name.localeCompare(b.name));
    return out;
  } catch {
    return [];
  }
}

export async function getStatesByCountry(countryCodeOrName: string): Promise<StateOption[]> {
  if(!countryCodeOrName) return [];
  const key = countryCodeOrName.toUpperCase();
  if(statesCache.has(key)) return statesCache.get(key)!;
  let states = await fetchRemoteStates(countryCodeOrName);
  if(!states.length){
    const fallback = fallbackStates[countryCodeOrName] || fallbackStates[key] || [];
    states = fallback.map(s=> ({ name: s }));
  }
  statesCache.set(key, states);
  return states;
}

export function clearLocationCaches(){
  cachedCountries = null;
  statesCache.clear();
}
