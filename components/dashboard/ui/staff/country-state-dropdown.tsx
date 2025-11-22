import { useEffect, useMemo, useState } from "react"
import { Label } from "@/components/dashboard/ui/label"
import { Button } from "@/components/dashboard/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/dashboard/ui/command"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/dashboard/staff/utils"

// Types for select options
type Option = { value: string; label: string }

async function fetchCountries(): Promise<Option[]> {
  try {
    const res = await fetch("https://restcountries.com/v3.1/all?fields=name,cca2", { cache: "force-cache" });
    if (!res.ok) throw new Error("Failed to fetch countries");
    const data = await res.json();
    return data
      .map((country: any) => ({
        value: country.cca2,
        label: country.name.common,
      }))
      .sort((a: Option, b: Option) => a.label.localeCompare(b.label));
  } catch {
    return [];
  }
}

async function fetchStates(countryCode: string): Promise<Option[]> {
  if (!countryCode) return [];
  try {
    const countryRes = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`);
    if (!countryRes.ok) throw new Error("Failed to fetch country");
    const countryData = await countryRes.json();
    const countryName = countryData[0]?.name?.common;
    if (!countryName) return [];
    const res = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: countryName })
    });
    if (!res.ok) throw new Error("Failed to fetch states");
    const data = await res.json();
    if (!data.data || !Array.isArray(data.data.states)) return [];
    return data.data.states.map((s: any) => ({ value: s.name, label: s.name }));
  } catch {
    return [];
  }
}

interface CountryStateDropdownProps {
  country: string
  state: string
  onCountryChange: (value: string) => void
  onStateChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  // Render mode: 'both' (default), or only 'country', or only 'state'
  mode?: 'both' | 'country' | 'state'
}

export function CountryStateDropdown({
  country,
  state,
  onCountryChange,
  onStateChange,
  required = true,
  disabled = false,
  mode = 'both',
}: CountryStateDropdownProps) {
  const [countries, setCountries] = useState<Option[]>([])
  const [countriesLoading, setCountriesLoading] = useState(false)
  const [countriesError, setCountriesError] = useState("")
  const [states, setStates] = useState<Option[]>([])
  const [statesLoading, setStatesLoading] = useState(false)
  const [statesError, setStatesError] = useState("")
  const [countryOpen, setCountryOpen] = useState(false)
  const [stateOpen, setStateOpen] = useState(false)
  const [countrySearch, setCountrySearch] = useState("")
  const [stateSearch, setStateSearch] = useState("")

  useEffect(() => {
    setCountriesLoading(true)
    fetchCountries()
      .then((data) => {
        setCountries(data)
        setCountriesLoading(false)
      })
      .catch(() => {
        setCountriesError("Failed to load countries")
        setCountriesLoading(false)
      })
  }, [])

  useEffect(() => {
    if (country) {
      setStatesLoading(true)
      setStatesError("")
      fetchStates(country)
        .then((data) => {
          setStates(data)
          setStatesLoading(false)
          // Auto-fill state with 'N/A' if country has no states; else clear invalid values
          try {
            if (Array.isArray(data) && data.length === 0) {
              if (state !== 'N/A') onStateChange('N/A')
            } else if (Array.isArray(data) && data.length > 0) {
              // If previously auto-set to N/A or value is not in the list, reset to empty
              if (state === 'N/A' || (state && !data.some((s) => s.value === state))) {
                onStateChange('')
              }
            }
          } catch {}
        })
        .catch(() => {
          setStatesError("Failed to load states")
          setStatesLoading(false)
        })
    } else {
      setStates([])
      // No country selected, clear state value
      if (state) {
        try { onStateChange('') } catch {}
      }
    }
  }, [country])

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase()
    if (!q) return countries
    return countries.filter(c => c.label.toLowerCase().includes(q))
  }, [countries, countrySearch])

  const filteredStates = useMemo(() => {
    const q = stateSearch.trim().toLowerCase()
    if (!q) return states
    return states.filter(s => s.label.toLowerCase().includes(q))
  }, [states, stateSearch])

  const CountryField = (
      <div>
        <Label htmlFor="country">Country {required && <span className="text-red-500">*</span>}</Label>
        <Popover
          open={countryOpen}
          onOpenChange={(o) => {
            setCountryOpen(o)
            if (!o) setCountrySearch("")
          }}
        >
          <PopoverTrigger asChild>
            <Button
              id="country"
              variant="outline"
              role="combobox"
              aria-expanded={countryOpen}
              aria-required={required}
              className="w-full justify-between"
              disabled={disabled || countriesLoading || !!countriesError}
            >
              <div className="truncate text-left">
                {countriesLoading
                  ? "Loading countries..."
                  : countriesError
                  ? countriesError
                  : country
                  ? countries.find(c => c.value === country)?.label || country
                  : "Select country"}
              </div>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search countries..."
                value={countrySearch}
                onValueChange={setCountrySearch}
                className="h-9"
              />
              <CommandList
                className="max-h-60 overflow-y-auto scroll-smooth"
                style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' as any }}
                onWheel={(e) => {
                  // Ensure trackpad/two-finger scroll moves this list (not the background)
                  e.stopPropagation()
                  const el = e.currentTarget
                  // Some environments need manual nudging to avoid being swallowed by overlay
                  el.scrollTop += e.deltaY
                }}
              >
                {countriesLoading ? (
                  <div className="px-2 py-2 text-sm text-muted-foreground">Loading...</div>
                ) : countriesError ? (
                  <div className="px-2 py-2 text-sm text-red-600">{countriesError}</div>
                ) : (
                  <>
                    <CommandEmpty>No countries found</CommandEmpty>
                    <CommandGroup>
                      {filteredCountries.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.label}
                          onSelect={() => {
                            onCountryChange(option.value)
                            setCountryOpen(false)
                            setCountrySearch("")
                          }}
                          className="flex items-center"
                        >
                          <Check className={cn("mr-2 h-4 w-4", country === option.value ? "opacity-100" : "opacity-0")} />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
  )

  const StateField = (
      <div>
        <Label htmlFor="state">State/Province {required && <span className="text-red-500">*</span>}</Label>
        <Popover
          open={stateOpen}
          onOpenChange={(o) => {
            setStateOpen(o)
            if (!o) setStateSearch("")
          }}
        >
          <PopoverTrigger asChild>
            <Button
              id="state"
              variant="outline"
              role="combobox"
              aria-expanded={stateOpen}
              aria-required={required}
              className="w-full justify-between"
              disabled={disabled || statesLoading || !!statesError || !country}
            >
              <div className="truncate text-left">
                {!country
                  ? "Select country first"
                  : statesLoading
                  ? "Loading states..."
                  : statesError
                  ? statesError
                  : state
                  ? states.find(s => s.value === state)?.label || state
                  : "Select state or province"}
              </div>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search states..."
                value={stateSearch}
                onValueChange={setStateSearch}
                className="h-9"
              />
              <CommandList
                className="max-h-60 overflow-y-auto scroll-smooth"
                style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' as any }}
                onWheel={(e) => {
                  e.stopPropagation()
                  const el = e.currentTarget
                  el.scrollTop += e.deltaY
                }}
              >
                {statesLoading ? (
                  <div className="px-2 py-2 text-sm text-muted-foreground">Loading...</div>
                ) : statesError ? (
                  <div className="px-2 py-2 text-sm text-red-600">{statesError}</div>
                ) : states.length === 0 ? (
                  <div className="px-2 py-2 text-sm text-muted-foreground">N/A</div>
                ) : (
                  <>
                    <CommandEmpty>N/A</CommandEmpty>
                    <CommandGroup>
                      {filteredStates.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.label}
                          onSelect={() => {
                            onStateChange(option.value)
                            setStateOpen(false)
                            setStateSearch("")
                          }}
                          className="flex items-center"
                        >
                          <Check className={cn("mr-2 h-4 w-4", state === option.value ? "opacity-100" : "opacity-0")} />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
  )

  if (mode === 'country') return CountryField
  if (mode === 'state') return StateField
  return (<>{CountryField}{StateField}</>)
}
