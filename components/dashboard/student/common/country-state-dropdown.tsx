"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getCachedCountries, getCachedStates, type Country, type State } from '@/lib/dashboard/student/countries-api';
import { Label } from '@/components/dashboard/ui/label';
import { Button } from '@/components/dashboard/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/dashboard/ui/popover';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/dashboard/student/utils';

interface CountryStateDropdownProps {
  country: string; // ISO2 code or full name
  state: string;   // State / Province name
  onCountryChange: (code: string, countryName?: string)=>void;
  onStateChange: (state: string)=>void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  showLabels?: boolean;
  countryLabel?: string;
  stateLabel?: string;
  hasCountryError?: boolean;
  hasStateError?: boolean;
}

interface SearchableListProps<T> {
  open: boolean; setOpen:(o:boolean)=>void;
  items: T[]; getKey:(i:T)=>string; getLabel:(i:T)=>string;
  placeholder: string; emptyText: string;
  onSelect:(i:T)=>void; loading?: boolean; error?: string;
  widthClass?: string; searchAriaLabel?: string;
  hasError?: boolean;
}

function SearchableList<T>(props: SearchableListProps<T>){
  const { open,setOpen,items,getKey,getLabel,placeholder,emptyText,onSelect,loading,error,widthClass='w-[260px]',searchAriaLabel,hasError } = props;
  const [query,setQuery]=useState('');
  const norm=query.trim().toLowerCase();
  const filtered = norm ? items.filter(i=> getLabel(i).toLowerCase().includes(norm)) : items;
  return (
    <Popover open={open} onOpenChange={(o)=>{ setOpen(o); if(o) setQuery(''); }}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          role="combobox" 
          aria-expanded={open} 
          className={cn(
            'w-full justify-between mt-1 font-normal', 
            (!placeholder && !loading && !error) && 'text-muted-foreground',
            hasError && 'border-red-500 focus-visible:ring-red-500'
          )}
        >
          <span className="truncate max-w-[180px] md:max-w-[220px]">
            {loading? 'Loading...' : (error? error : placeholder)}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn(widthClass,'p-2')} align="start" sideOffset={4}>
        <div className="flex flex-col gap-2">
          <input
            autoFocus
            aria-label={searchAriaLabel || 'Search'}
            value={query}
            onChange={e=> setQuery(e.target.value)}
            placeholder={loading? 'Loading...' : 'Search...'}
            disabled={loading}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A2BE2] focus-visible:ring-offset-2 focus:border-[#8A2BE2] transition-colors"
          />
          <div className="max-h-60 overflow-y-auto text-sm pr-1">
            {loading && <div className="text-xs text-gray-500 py-2 px-2">Loading...</div>}
            {!loading && error && <div className="text-xs text-red-500 py-2 px-2">{error}</div>}
            {!loading && !error && filtered.map(item => (
              <div key={getKey(item)} onClick={()=> { onSelect(item); setOpen(false); }} className="cursor-pointer px-2 py-1.5 rounded-md hover:bg-gray-100">
                {getLabel(item)}
              </div>
            ))}
            {!loading && !error && filtered.length===0 && (
              <div className="text-center text-xs text-gray-500 py-2">{emptyText}</div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export const CountryStateDropdown: React.FC<CountryStateDropdownProps> = ({
  country,
  state,
  onCountryChange,
  onStateChange,
  required=true,
  disabled=false,
  className,
  showLabels=true,
  countryLabel='Country',
  stateLabel='State/Province',
  hasCountryError=false,
  hasStateError=false
}) => {
  const [countries,setCountries]=useState<Country[]>([]);
  const [countriesLoading,setCountriesLoading]=useState(false);
  const [countriesError,setCountriesError]=useState('');
  const [states,setStates]=useState<State[]>([]);
  const [statesLoading,setStatesLoading]=useState(false);
  const [statesError,setStatesError]=useState('');
  const [openCountry,setOpenCountry]=useState(false);
  const [openState,setOpenState]=useState(false);

  // Load countries from external API
  useEffect(()=>{
    let cancelled=false; setCountriesLoading(true); setCountriesError('');
    getCachedCountries()
      .then(c=>{ if(!cancelled) setCountries(c); })
      .catch((err)=> { 
        console.error('Failed to load countries:', err);
        if(!cancelled) setCountriesError('Failed to load countries'); 
      })
      .finally(()=> { if(!cancelled) setCountriesLoading(false); });
    return ()=> { cancelled=true; };
  },[]);

  // Load states from external API when country changes
  const loadStates = useCallback((countryCode:string)=>{
    if(!countryCode){ setStates([]); return; }
    
    // Find the country name from the code
    const selectedCountry = countries.find(c=> c.cca2 === countryCode);
    if (!selectedCountry) {
      setStates([]);
      return;
    }
    
    let cancelled=false; setStatesLoading(true); setStatesError('');
    getCachedStates(selectedCountry.name.common)
      .then(s=> { 
        if(!cancelled) {
          setStates(s);
          // If no states found, show a message but don't treat as error
          if (s.length === 0) {
            console.log(`No states/provinces found for ${selectedCountry.name.common}`);
          }
        }
      })
      .catch((err)=> { 
        console.error('Failed to load states:', err);
        if(!cancelled) setStatesError('Failed to load states'); 
      })
      .finally(()=> { if(!cancelled) setStatesLoading(false); });
    return ()=> { cancelled=true; };
  },[countries]);

  useEffect(()=> { if(country) loadStates(country); else setStates([]); }, [country, loadStates]);

  const selectedCountry = countries.find(c=> c.cca2===country);
  const countryPlaceholder = selectedCountry ? selectedCountry.name.common : (countriesLoading? 'Loading countries...' : (countriesError || 'Select country'));
  const statePlaceholder = state || (!country ? 'Select country first' : (statesLoading? 'Loading states...' : (statesError || 'Select state / province')));

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-2', className)}>
      <div>
        {showLabels && <Label className="text-sm font-medium text-gray-700">{countryLabel} {required && <span className="text-red-500">*</span>}</Label>}
        <SearchableList
          open={openCountry}
          setOpen={setOpenCountry}
          items={countries}
          getKey={c=>c.cca2}
          getLabel={c=>c.name.common}
          placeholder={countryPlaceholder}
          emptyText={countriesLoading? 'Loading...' : 'No countries found'}
          onSelect={(c)=> { onCountryChange(c.cca2, c.name.common); onStateChange(''); }}
          loading={countriesLoading}
          error={countriesError || undefined}
          widthClass="w-[280px]"
          searchAriaLabel="Search countries"
          hasError={hasCountryError}
        />
      </div>
      <div>
        {showLabels && <Label className="text-sm font-medium text-gray-700">{stateLabel} {required && <span className="text-red-500">*</span>}</Label>}
        <SearchableList
          open={openState}
          setOpen={setOpenState}
            items={states}
            getKey={s=>s.name}
            getLabel={s=>s.name}
            placeholder={statePlaceholder}
            emptyText={!country? 'Select a country first' : (statesLoading? 'Loading...' : 'No states/provinces available')}
            onSelect={(s)=> onStateChange(s.name)}
            loading={statesLoading}
            error={statesError || undefined}
            widthClass="w-[280px]"
            searchAriaLabel="Search states"
            hasError={hasStateError}
        />
      </div>
    </div>
  );
};

export default CountryStateDropdown;
