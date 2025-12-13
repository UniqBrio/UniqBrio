"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { PHONE_COUNTRY_CODES } from '@/lib/dashboard/student/phone-country-codes';
import { getCachedPhoneCountryCodes } from '@/lib/dashboard/student/countries-api';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/dashboard/ui/popover';
import { Button } from '@/components/dashboard/ui/button';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/dashboard/student/utils';

interface PhoneCountryCodeSelectProps {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  popoverClassName?: string;
  useExternalAPI?: boolean; // Option to use external API instead of static list
}

export const PhoneCountryCodeSelect: React.FC<PhoneCountryCodeSelectProps> = ({
  value,
  onChange,
  disabled,
  className,
  placeholder = 'Code',
  popoverClassName,
  useExternalAPI = true // Changed to true by default to get all countries
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [apiCodes, setApiCodes] = useState<Array<{ code: string; country: string; iso2: string }>>([]);
  const [loading, setLoading] = useState(false);
  
  // Fetch codes from API if enabled
  useEffect(() => {
    if (useExternalAPI && apiCodes.length === 0) {
      setLoading(true);
      getCachedPhoneCountryCodes()
        .then(codes => {
          setApiCodes(codes);
          console.log(`? Loaded ${codes.length} phone country codes from API`);
        })
        .catch(err => {
          console.error('Failed to load phone codes from API, falling back to static list:', err);
          // Falls back to static list automatically
        })
        .finally(() => setLoading(false));
    }
  }, [useExternalAPI, apiCodes.length]);
  
  // Use API codes if available and enabled, otherwise use static list
  const codes = useExternalAPI && apiCodes.length > 0 ? apiCodes : PHONE_COUNTRY_CODES;
  
  const normalized = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if(!normalized) return codes;
    return codes.filter(c => c.code.includes(normalized) || c.country.toLowerCase().includes(normalized));
  }, [normalized, codes]);

  const sel = codes.find(c => c.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-haspopup="listbox"
          disabled={disabled}
          className={cn('justify-between w-[110px] font-normal', !sel && 'text-muted-foreground', className)}
        >
          <span className="truncate flex items-center gap-1.5">
            {sel ? (
              <>
                <span>{sel.code}</span>
                {sel.iso2 && <span className="text-xs text-black hover:text-white font-medium uppercase">{sel.iso2}</span>}
              </>
            ) : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('w-[300px] p-2', popoverClassName)} sideOffset={4} align="start">
        <div className="flex flex-col gap-2">
          <input
            autoFocus
            value={query}
            onChange={e=> setQuery(e.target.value)}
            placeholder={loading ? "Loading..." : "Search country or code"}
            disabled={loading}
            className="flex h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-background dark:bg-gray-800 px-3 py-1.5 text-sm text-foreground placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A2BE2] focus-visible:ring-offset-2 focus:border-[#8A2BE2]"
          />
          <div
            className="max-h-[200px] overflow-y-auto pr-1 text-sm touch-pan-y overscroll-contain"
            // Ensure two-finger trackpad/touch scrolling works even when inside a Dialog (which locks scroll)
            onWheelCapture={(e) => e.stopPropagation()}
            onTouchMoveCapture={(e) => e.stopPropagation()}
          >
            {loading ? (
              <div className="text-center text-xs text-gray-500 dark:text-white py-4">Loading phone codes...</div>
            ) : (
              <>
                {filtered.map(item => {
                  const active = item.code === value;
                  return (
                    <div
                      key={item.code+item.country}
                      role="option"
                      aria-selected={active}
                      onClick={()=> { onChange(item.code); setOpen(false); }}
                      className={cn('flex items-center gap-3 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-100', active && 'bg-purple-50 border border-[#8A2BE2]')}
                    >
                      <span className="w-14 font-medium tabular-nums">{item.code}</span>
                      <span className="flex-1 truncate">{item.country}</span>
                      {item.iso2 && (
                        <span className="text-xs text-gray-500 dark:text-white font-medium uppercase ml-auto">{item.iso2}</span>
                      )}
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="text-center text-xs text-gray-500 dark:text-white py-4">No matches</div>
                )}
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PhoneCountryCodeSelect;
