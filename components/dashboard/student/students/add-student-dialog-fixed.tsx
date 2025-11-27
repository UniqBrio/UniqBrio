"use client";
import { useState, useEffect, useRef, useMemo } from 'react';
import { useCustomColors } from '@/lib/use-custom-colors';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/dashboard/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/dashboard/ui/alert-dialog';
import { fetchCourses, type Course } from '@/data/dashboard/courses';
import { fetchCohorts, type Cohort } from '@/data/dashboard/cohorts';
import { Input } from '@/components/dashboard/ui/input';
import { Label } from '@/components/dashboard/ui/label';
import { Button } from '@/components/dashboard/ui/button';
import { Textarea } from '@/components/dashboard/ui/textarea';
import { Checkbox } from '@/components/dashboard/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/dashboard/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/dashboard/ui/popover';
import { ChevronDown, Save, RefreshCw, X } from 'lucide-react';
import { PhoneCountryCodeSelect } from '@/components/dashboard/student/common/phone-country-code-select';
import { cn } from '@/lib/dashboard/student/utils';
import { useToast } from '@/hooks/dashboard/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/dashboard/ui/tabs';
import { type Student, type Parent } from '@/types/dashboard/student';
import { CountryStateDropdown } from '@/components/dashboard/student/common/country-state-dropdown';
import { getPhoneCodeByCountry, getCountryByPhoneCode, initializePhoneCodeMapping, getCachedCountries, getCachedStates } from '@/lib/dashboard/student/countries-api';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';
import { FormattedDateInput } from '@/components/dashboard/student/common/formatted-date-input';
import { format as formatDateFns } from 'date-fns';

interface AddStudentDialogProps { open:boolean; onOpenChange:(open:boolean)=>void; onAdd:(student:Student)=>void; initialStudent?:Partial<Student>|null; courses?:Course[]; coursesLoading?:boolean; draftId?:string|null; }

// Re-usable creatable combobox for gender selection
interface GenderComboboxProps { value:string; onChange:(value:string)=>void; error?:boolean; }
function GenderCombobox({ value, onChange, error }: GenderComboboxProps){
  const [open,setOpen]=useState(false);
  const baseOptions = ['Male','Female','Other'];
  const [custom,setCustom]=useState<string[]>([]);
  const allOptions=[...baseOptions,...custom];
  const [query,setQuery]=useState('');
  const normalizedQuery=query.trim().toLowerCase();
  const filtered = normalizedQuery ? allOptions.filter(o=> o.toLowerCase().includes(normalizedQuery)) : allOptions;
  const canAdd = normalizedQuery.length>0 && !allOptions.some(o=> o.toLowerCase()===normalizedQuery);
  const firstOptionRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectValue=(val:string)=>{ onChange(val); setOpen(false); setQuery(''); };
  const addNew=()=>{ const v=query.trim(); if(!v) return; setCustom(prev=>[...prev,v]); selectValue(v); };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className={cn('w-full justify-between mt-1 font-normal', !value && 'text-muted-foreground', error && 'border-red-500 focus-visible:ring-red-500')}>
          <span>{value || 'Select gender'}</span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-2" align="start" sideOffset={4}>
        <div className="flex flex-col gap-2">
          <input
            ref={searchInputRef}
            autoFocus
            value={query}
            onChange={e=> setQuery(e.target.value)}
            placeholder="Search or type new gender..."
            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-background dark:bg-gray-800 px-3 py-2 text-sm text-foreground placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A2BE2] focus-visible:ring-offset-2 focus:border-[#8A2BE2] transition-colors"
          />
          <div className="max-h-52 overflow-y-auto text-sm pr-1">
            {filtered.map((opt, index)=> {
              const active = opt===value;
              return (
                <div
                  key={opt}
                  ref={index === 0 ? firstOptionRef : undefined}
                  tabIndex={-1}
                  onClick={()=> selectValue(opt)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      selectValue(opt);
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                      if (nextElement?.focus) nextElement.focus();
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      const prevElement = e.currentTarget.previousElementSibling as HTMLElement;
                      if (prevElement?.focus) {
                        prevElement.focus();
                      } else if (searchInputRef.current) {
                        searchInputRef.current.focus();
                      }
                    } else if (e.key === 'Escape') {
                      setOpen(false);
                    }
                  }}
                  className={cn('cursor-pointer px-2 py-1.5 rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none', active && 'bg-purple-50 border border-[#8A2BE2]')}
                >
                  {opt}
                </div>
              );
            })}
            {canAdd && (
              <div
                tabIndex={-1}
                onClick={addNew}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    addNew();
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevElement = e.currentTarget.previousElementSibling as HTMLElement;
                    if (prevElement?.focus) {
                      prevElement.focus();
                    } else if (searchInputRef.current) {
                      searchInputRef.current.focus();
                    }
                  } else if (e.key === 'Escape') {
                    setOpen(false);
                  }
                }}
                className="cursor-pointer px-2 py-2 mt-1 text-center text-[#8A2BE2] text-sm hover:underline rounded-md focus:bg-gray-100 focus:outline-none"
              >
                Add "{query}" as new gender
              </div>
            )}
            {!filtered.length && !canAdd && (
              <div className="text-center text-xs text-gray-500 dark:text-white py-2">No results</div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Search-only combobox for courses with course draft creation capability
interface CourseSearchComboboxProps { value:string; onChange:(id:string)=>void; courses:Course[]; loading:boolean; error?:string|null; width?:number; hasError?:boolean; onCourseDraftCreated?:(courseName:string, level:string)=>void; onRefresh?:()=>void; }
function CourseSearchCombobox({ value, onChange, courses, loading, error, width, hasError, onCourseDraftCreated, onRefresh }: CourseSearchComboboxProps){
  const { primaryColor } = useCustomColors();
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const normalized=query.trim().toLowerCase();
  
  const courseLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Professional'];
  
  const handleCreateCourseDraft = async () => {
    if (!normalized || !selectedLevel) return;
    
    setIsCreating(true);
    try {
      // Create course draft via API
      const courseDraftData = {
        name: query.trim(),
        level: selectedLevel,
        type: "Online", // Default type
        courseCategory: "Regular", // Default category
        status: "Draft",
        tags: [selectedLevel],
        prerequisites: [],
        learningOutcomes: [],
        materialRequirements: [],
        priceINR: "0" // Default price
      };

      console.log('Creating course draft:', courseDraftData);

      const response = await fetch('/api/dashboard/student/courses/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseDraftData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create course draft');
      }

      const createdDraft = await response.json();
      console.log('Course draft created successfully:', createdDraft);
      
      onCourseDraftCreated?.(query.trim(), selectedLevel);
      
      // Close the form and reset states
      setShowCreateForm(false);
      setSelectedLevel('');
      setQuery('');
      setOpen(false);
    } catch (error) {
      console.error('Failed to create course draft:', error);
      // Show error to user (you might want to add error state handling here)
      alert(`Failed to create course draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };
  
  const filtered = normalized ? courses.filter(c=> {
    const label = (c.courseId? c.courseId + ' - ' : '') + c.name + (c.level? ' - ' + c.level : '');
    const category = c.category || '';
    const type = c.type || '';
    const searchableText = `${label} ${category} ${type}`.toLowerCase();
    return searchableText.includes(normalized);
  }) : courses;
  const selected = courses.find(c=> c.id===value);
  const triggerLabel = selected ? (selected.courseId? `${selected.courseId} - ${selected.name}${selected.level?` - ${selected.level}`:''}` : `${selected.name}${selected.level?` - ${selected.level}`:''}`) : '';
  const triggerRef = useRef<HTMLButtonElement|null>(null);
  const [contentWidth, setContentWidth] = useState<number|undefined>();
  useEffect(() => {
    if (open && triggerRef.current) {
      setContentWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);
  return (
    <Popover open={open} onOpenChange={(o)=> { setOpen(o); if(o) setQuery(''); }}>
      <PopoverTrigger asChild>
        <Button ref={triggerRef} variant="outline" role="combobox" aria-expanded={open} className={cn('justify-between mt-1 font-normal w-full h-auto min-h-[44px] py-2', !triggerLabel && 'text-muted-foreground', hasError && 'border-red-500 focus-visible:ring-red-500')}>
          <span className="truncate text-left">{triggerLabel || (error? 'Error loading courses':'Select course')}</span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-70 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-2" align="start" sideOffset={4} style={{ width: Math.max(contentWidth || 0, 440) }}>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              autoFocus
              value={query}
              onChange={e=> setQuery(e.target.value)}
              placeholder={loading? 'Loading courses...' : 'Search courses...'}
              disabled={loading}
              className="flex h-10 flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-background dark:bg-gray-800 px-3 py-2 text-sm text-foreground placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500 dark:text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A2BE2] focus-visible:ring-offset-2 focus:border-[#8A2BE2] transition-colors"
            />
            {onRefresh && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRefresh();
                }}
                disabled={loading}
                className="h-10 px-3 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300"
                title="Refresh courses"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
            )}
          </div>
          <div className="max-h-[180px] overflow-y-auto text-sm pr-1">
            {loading && <div className="text-xs text-gray-500 dark:text-white py-2 px-2">Loading courses...</div>}
            {!loading && error && <div className="text-xs text-red-500 py-2 px-2">{error}</div>}
            {!loading && !error && filtered.map(c=> {
              const label=(c.courseId? `${c.courseId} - ${c.name}${c.level?` - ${c.level}`:''}`: `${c.name}${c.level?` - ${c.level}`:''}`);
              const sub=[c.category,c.type,c.duration].filter(Boolean).join(' � ');
              const isSel = c.id===value;
              return (
                <div key={c.id} onClick={()=> { onChange(c.id); setOpen(false); }} className={cn('cursor-pointer px-3 py-2 rounded-md hover:bg-gray-100 flex flex-col gap-0.5', isSel && 'bg-gray-100')}>
                  <span className="font-medium text-[13px] leading-snug">{label}</span>
                  {sub && <span className="text-xs text-gray-500 dark:text-white">{sub}</span>}
                </div>
              );
            })}
            {!loading && !error && !filtered.length && normalized && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                {!showCreateForm ? (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 dark:text-white text-center">No courses found for "{query}"</div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCreateForm(true)}
                      className="w-full text-xs border-dashed border-purple-300 text-purple-600 hover:bg-purple-50"
                    >
                      + Create course draft "{query}"
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs text-gray-700 dark:text-white font-medium">Create course draft: "{query}"</div>
                    <div>
                      <label className="text-xs text-gray-600 dark:text-white block mb-1">Select Level:</label>
                      <select
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Choose level</option>
                        {courseLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleCreateCourseDraft}
                        disabled={!selectedLevel || isCreating}
                        className="flex-1 text-xs text-white"
                        style={{ backgroundColor: primaryColor }}
                        onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = `${primaryColor}dd`)}
                        onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = primaryColor)}
                      >
                        {isCreating ? 'Creating...' : 'Create Draft'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCreateForm(false);
                          setSelectedLevel('');
                        }}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {!loading && !error && !filtered.length && !normalized && (
              <div className="text-center text-xs text-gray-500 dark:text-white py-3">Type to search courses</div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Small Country selector (searchable)
function CountrySelect({ country, onChange, hasError }: { country?: string; onChange: (code: string, name?: string)=>void; hasError?: boolean }){
  const [open,setOpen]=useState(false);
  const [countries,setCountries]=useState<any[]>([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState<string|undefined>();
  const [query,setQuery]=useState('');
  useEffect(()=>{ let cancelled=false; setLoading(true); getCachedCountries().then(c=>{ if(!cancelled) setCountries(c); }).catch(e=>{ if(!cancelled) setError('Failed to load countries'); }).finally(()=>{ if(!cancelled) setLoading(false); }); return ()=>{ cancelled=true; }; },[]);
  const norm=query.trim().toLowerCase();
  const filtered = norm ? countries.filter((c:any)=> (c.name?.common||'').toLowerCase().includes(norm) || (c.cca2||'').toLowerCase().includes(norm)) : countries;
  const placeholder = countries.length===0 ? (loading? 'Loading countries...' : (error||'Select country')) : (countries.find((c:any)=>c.cca2===country)?.name?.common || 'Select country');
  return (
    <Popover open={open} onOpenChange={(o)=>{ setOpen(o); if(o) setQuery(''); }}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className={cn('w-full justify-between mt-1 font-normal', hasError && 'border-red-500 focus-visible:ring-red-500')}>
          <span className="truncate max-w-[220px]">{placeholder}</span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-2" align="start" sideOffset={4}>
        <div className="flex flex-col gap-2">
          <input autoFocus value={query} onChange={e=> setQuery(e.target.value)} placeholder={loading? 'Loading...' : 'Search countries...'} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" />
          <div className="max-h-60 overflow-y-auto text-sm pr-1">
            {loading && <div className="text-xs text-gray-500 dark:text-white py-2">Loading...</div>}
            {!loading && filtered.map((c:any)=> <div key={c.cca2} onClick={()=>{ onChange(c.cca2, c.name?.common); setOpen(false); }} className="cursor-pointer px-2 py-1.5 rounded-md hover:bg-gray-100">{c.cca2} - {c.name?.common}</div>)}
            {!loading && !filtered.length && <div className="text-xs text-gray-500 dark:text-white py-2">No countries found</div>}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Small State selector (searchable) - loads states for selected country
function StateSelect({ countryName, state, onChange, hasError }: { countryName?: string; state?: string; onChange:(s:string)=>void; hasError?: boolean }){
  const [open,setOpen]=useState(false);
  const [states,setStates]=useState<any[]>([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState<string|undefined>();
  const [query,setQuery]=useState('');
  useEffect(()=>{
    if(!countryName){ setStates([]); return; }
    let cancelled=false; setLoading(true); getCachedStates(countryName).then(s=>{ if(!cancelled) setStates(s); }).catch(e=>{ if(!cancelled) setError('Failed to load states'); }).finally(()=>{ if(!cancelled) setLoading(false); }); return ()=>{ cancelled=true; };
  },[countryName]);
  const norm=query.trim().toLowerCase();
  const filtered = norm ? states.filter((s:any)=> (s.name||'').toLowerCase().includes(norm)) : states;
  const noStates = !!countryName && !loading && states.length === 0 && !error;
  const placeholder = countryName ? (noStates ? 'Not applicable' : (state|| (loading? 'Loading states...' : (error|| 'Select state / province')))) : 'Select country first';

  // If the selected country has no states, mark state as 'Not applicable' so validation treats it as filled
  useEffect(() => {
    if (!countryName) return;
    if (noStates) {
      // Only set 'Not applicable' if there's no value already selected
      // This prevents overwriting user selections when switching tabs
      if (!state || state === '') {
        onChange('Not applicable');
      }
    }
    // Note: We don't clear the state when states become available, as this causes
    // the selected state to be lost when switching tabs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryName, noStates]);
  return (
    <Popover open={open} onOpenChange={(o)=>{ setOpen(o); if(o) setQuery(''); }}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} disabled={!countryName || noStates} className={cn('w-full justify-between mt-1 font-normal', hasError && 'border-red-500 focus-visible:ring-red-500')}>
          <span className="truncate max-w-[220px]">{placeholder}</span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-2" align="start" sideOffset={4}>
        <div className="flex flex-col gap-2">
          <input autoFocus value={query} onChange={e=> setQuery(e.target.value)} placeholder={loading? 'Loading...' : 'Search states...'} disabled={!countryName || loading} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" />
          <div className="max-h-60 overflow-y-auto text-sm pr-1">
            {loading && <div className="text-xs text-gray-500 dark:text-white py-2">Loading...</div>}
            {!loading && noStates && (
              <div className="text-xs text-gray-500 dark:text-white py-2">Not applicable</div>
            )}
            {!loading && !noStates && filtered.map((s:any)=> <div key={s.name} onClick={()=>{ onChange(s.name); setOpen(false); }} className="cursor-pointer px-2 py-1.5 rounded-md hover:bg-gray-100">{s.name}</div>)}
            {!loading && !noStates && !filtered.length && <div className="text-xs text-gray-500 dark:text-white py-2">No states found</div>}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Search-only combobox for cohorts (no create)
interface CohortSearchComboboxProps { value:string; onChange:(id:string)=>void; cohorts:Cohort[]; loading:boolean; disabled?:boolean; }
function CohortSearchCombobox({ value, onChange, cohorts, loading, disabled }: CohortSearchComboboxProps){
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');
  const normalized=query.trim().toLowerCase();
  const filtered = normalized ? cohorts.filter(co=> {
    const enrolled = (co.enrolledStudents?.length||0) + '/' + (co.capacity||0);
    const label = [co.id, co.name, co.instructor || 'TBA', co.timing || '--', enrolled].filter(Boolean).join(' - ');
    return label.toLowerCase().includes(normalized);
  }) : cohorts;
  const selected = cohorts.find(c=> c.id===value);
  const triggerLabel = selected 
    ? `${selected.id} - ${selected.name}${selected.timing ? ` | Timing: ${selected.timing}` : ''}`
    : '';
  const triggerRef = useRef<HTMLButtonElement|null>(null);
  const [contentWidth, setContentWidth] = useState<number|undefined>();
  useEffect(() => {
    if (open && triggerRef.current) {
      setContentWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);
  const formatDateForInfo = (iso?: string) => {
    if (!iso) return '';
    const [datePart] = iso.split('T');
    const parts = datePart?.split('-');
    if (!parts || parts.length < 3) return '';
    const [year, month, day] = parts.map(Number);
    if (!year || !month || !day) return '';
    const date = new Date(Date.UTC(year, month - 1, day));
    if (Number.isNaN(date.getTime())) return '';
    try {
      return formatDateFns(date, 'dd-MMM-yyyy');
    } catch {
      return '';
    }
  };
  return (
    <Popover open={open} onOpenChange={(o)=> { if(disabled) return; setOpen(o); if(o) setQuery(''); }}>
      <PopoverTrigger asChild>
        <Button ref={triggerRef} variant="outline" role="combobox" disabled={disabled} aria-expanded={open} className={cn('justify-between mt-1 font-normal w-full h-auto min-h-[44px] py-2', (disabled && 'opacity-60 cursor-not-allowed'), !triggerLabel && 'text-muted-foreground')}>
          <span className="truncate text-left">{triggerLabel || (disabled? 'Select a course first':'Select cohort')}</span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-70 shrink-0" />
        </Button>
      </PopoverTrigger>
  <PopoverContent className="p-2" align="start" sideOffset={4} style={{ width: Math.max(contentWidth || 0, 440) }}>
        <div className="flex flex-col gap-2">
          <input
            autoFocus
            value={query}
            onChange={e=> setQuery(e.target.value)}
            placeholder={loading? 'Loading cohorts...' : 'Search cohorts...'}
            disabled={loading}
            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-background dark:bg-gray-800 px-3 py-2 text-sm text-foreground placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500 dark:text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A2BE2] focus-visible:ring-offset-2 focus:border-[#8A2BE2] transition-colors"
          />
          <div className="max-h-[180px] overflow-y-auto text-sm pr-1">
            {loading && <div className="text-xs text-gray-500 dark:text-white py-2 px-2">Loading cohorts...</div>}
            {!loading && filtered.map(co=> {
              const enrolledCount = co.enrolledStudents?.length || 0;
              const capacity = typeof co.capacity === 'number' && co.capacity > 0 ? co.capacity : 0;
              const seats = capacity ? `${enrolledCount}/${capacity}` : String(enrolledCount);
              const infoParts = [`Timing: ${co.timing || 'Not set'}`, `Seats: ${seats}`];
              const formattedStart = formatDateForInfo(co.startDate);
              if (formattedStart) infoParts.push(`Start: ${formattedStart}`);
              const label=[co.id, co.name, co.instructor || 'TBA'].filter(Boolean).join(' - ');
              const isSel = co.id===value;
              return (
                <div key={co.id} onClick={()=> { onChange(co.id); setOpen(false); }} className={cn('cursor-pointer px-3 py-2 rounded-md hover:bg-gray-100 flex flex-col gap-0.5', isSel && 'bg-gray-100')}>
                  <span className="font-medium text-[13px] leading-snug">{label}</span>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-white">
                    {infoParts.map((text, idx) => (
                      <span key={`${text}-${idx}`} className="flex items-center gap-1">
                        {idx > 0 && <span>�</span>}
                        <span>{text}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
            {!loading && !filtered.length && (
              <div className="text-center text-xs text-gray-500 dark:text-white py-3">No cohorts found</div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// (Deprecated) Inline COUNTRY_CODES removed in favor of reusable PhoneCountryCodeSelect component.

// Multi-select for preferred timings
interface MultiSelectTimingsProps { values:(string[]|string|undefined); onChange:(vals:string[])=>void; options?:string[]; }
function MultiSelectTimings({ values, onChange, options = ['5pm - 6pm','6pm - 7pm','7pm - 8pm','Other'] }: MultiSelectTimingsProps){
  const selected = Array.isArray(values) ? values : (values ? [values] : []);
  const [open,setOpen]=useState(false);
  const toggle=(val:string)=>{ onChange(selected.includes(val)? selected.filter(v=>v!==val): [...selected,val]); };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full mt-1 font-normal min-h-[44px] px-3 py-2 flex items-start gap-2 text-left justify-between')}
        >
          <div className="flex flex-wrap gap-1 flex-1 pr-4">
            {selected.length === 0 && (
              <span className="text-gray-500 dark:text-white text-sm">Select timing(s)</span>
            )}
            {selected.map(t => (
              <span
                key={t}
                className="bg-purple-100 border border-purple-300 text-purple-700 text-xs px-2 py-0.5 rounded-md flex items-center gap-1"
              >
                {t}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e)=> { e.stopPropagation(); toggle(t); }}
                  onKeyDown={(e)=> { if(e.key==='Enter'||e.key===' '){ e.preventDefault(); e.stopPropagation(); toggle(t);} }}
                  className="ml-0.5 text-purple-500 hover:text-purple-700 leading-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-500 rounded"
                  aria-label={`Remove ${t}`}
                >
                  �
                </span>
              </span>
            ))}
          </div>
          <ChevronDown className="h-4 w-4 opacity-70 shrink-0 mt-0.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-2" align="start" sideOffset={4}>
        <div className="flex flex-col gap-2">
          <div className="max-h-60 overflow-y-auto text-sm pr-1">
            {options.map(opt=> {
              const active = selected.includes(opt);
              return (
                <div key={opt} className={cn('px-2 py-1.5 rounded-md flex items-center gap-2 hover:bg-gray-100 cursor-pointer', active && 'bg-purple-50 border border-[#8A2BE2]')} onClick={()=> toggle(opt)}>
                  <Checkbox checked={active} onCheckedChange={()=> toggle(opt)} className="h-4 w-4" />
                  <span className="flex-1 text-sm select-none">{opt}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" size="sm" variant="ghost" onClick={()=> { onChange([]); }}>Clear</Button>
            <Button type="button" size="sm" className="bg-[#8A2BE2] hover:bg-[#7A1FD2] text-white" onClick={()=> setOpen(false)}>Done</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Creatable combobox for 'Referred By'
interface ReferredByComboboxProps { value:string; onChange:(value:string)=>void; }
function ReferredByCombobox({ value, onChange }: ReferredByComboboxProps){
  const [open,setOpen]=useState(false);
  const baseOptions = ['Student','Parent','Friend','Advertisement','Online','Other'];
  const [custom,setCustom]=useState<string[]>([]);
  const allOptions=[...baseOptions,...custom];
  const [query,setQuery]=useState('');
  const normalizedQuery=query.trim().toLowerCase();
  const filtered = normalizedQuery ? allOptions.filter(o=> o.toLowerCase().includes(normalizedQuery)) : allOptions;
  const canAdd = normalizedQuery.length>0 && !allOptions.some(o=> o.toLowerCase()===normalizedQuery);
  const firstOptionRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const selectValue=(val:string)=>{ onChange(val); setOpen(false); setQuery(''); };
  const addNew=()=>{ const v=query.trim(); if(!v) return; setCustom(prev=>[...prev,v]); selectValue(v); };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className={cn('w-full justify-between mt-1 font-normal', !value && 'text-muted-foreground')}>
          <span>{value || 'Select referral source'}</span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-2" align="start" sideOffset={4}>
        <div className="flex flex-col gap-2">
          <input
            ref={searchInputRef}
            autoFocus
            value={query}
            onChange={e=> setQuery(e.target.value)}
            placeholder="Search or type new source..."
            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-background dark:bg-gray-800 px-3 py-2 text-sm text-foreground placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A2BE2] focus-visible:ring-offset-2 focus:border-[#8A2BE2] transition-colors"
          />
          <div className="max-h-52 overflow-y-auto text-sm pr-1">
              {filtered.map((opt, index)=> {
                const active = opt===value;
                return (
                  <div 
                    key={opt} 
                    ref={index === 0 ? firstOptionRef : undefined}
                    tabIndex={-1}
                    onClick={()=> selectValue(opt)} 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectValue(opt);
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement?.focus) nextElement.focus();
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const prevElement = e.currentTarget.previousElementSibling as HTMLElement;
                        if (prevElement?.focus) {
                          prevElement.focus();
                        } else if (searchInputRef.current) {
                          searchInputRef.current.focus();
                        }
                      } else if (e.key === 'Escape') {
                        setOpen(false);
                      }
                    }}
                    className={cn('cursor-pointer px-2 py-1.5 rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none', active && 'bg-purple-50 border border-[#8A2BE2]')}
                  >
                    {opt}
                  </div>
                );
            })}
            {canAdd && (
              <div 
                tabIndex={-1}
                onClick={addNew} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    addNew();
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevElement = e.currentTarget.previousElementSibling as HTMLElement;
                    if (prevElement?.focus) {
                      prevElement.focus();
                    } else if (searchInputRef.current) {
                      searchInputRef.current.focus();
                    }
                  } else if (e.key === 'Escape') {
                    setOpen(false);
                  }
                }}
                className="cursor-pointer px-2 py-2 mt-1 text-center text-[#8A2BE2] text-sm hover:underline rounded-md focus:bg-gray-100 focus:outline-none"
              >
                Add "{query}" as new source
              </div>
            )}
            {!filtered.length && !canAdd && (<div className="text-center text-xs text-gray-500 dark:text-white py-2">No results</div>)}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Creatable combobox for Guardian Relationship
interface RelationshipComboboxProps { value:string; onChange:(value:string)=>void; }
function RelationshipCombobox({ value, onChange }: RelationshipComboboxProps){
  const [open,setOpen]=useState(false);
  const baseOptions = ['Mother','Father'];
  const [custom,setCustom]=useState<string[]>([]);
  const allOptions=[...baseOptions,...custom];
  const [query,setQuery]=useState('');
  const normalizedQuery=query.trim().toLowerCase();
  const filtered = normalizedQuery ? allOptions.filter(o=> o.toLowerCase().includes(normalizedQuery)) : allOptions;
  const canAdd = normalizedQuery.length>0 && !allOptions.some(o=> o.toLowerCase()===normalizedQuery);
  const firstOptionRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const selectValue=(val:string)=>{ onChange(val); setOpen(false); setQuery(''); };
  const addNew=()=>{ const v=query.trim(); if(!v) return; setCustom(prev=>[...prev,v]); selectValue(v); };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className={cn('w-full justify-between mt-1 font-normal', !value && 'text-muted-foreground')}>
          <span>{value || 'Select relationship'}</span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-2" align="start" sideOffset={4}>
        <div className="flex flex-col gap-2">
          <input
            ref={searchInputRef}
            autoFocus
            value={query}
            onChange={e=> setQuery(e.target.value)}
            placeholder="Search or type new relationship..."
            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-background dark:bg-gray-800 px-3 py-2 text-sm text-foreground placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A2BE2] focus-visible:ring-offset-2 focus:border-[#8A2BE2] transition-colors"
          />
          <div className="max-h-52 overflow-y-auto text-sm pr-1">
              {filtered.map((opt, index)=> {
                const active = opt===value;
                return (
                  <div 
                    key={opt} 
                    ref={index === 0 ? firstOptionRef : undefined}
                    tabIndex={-1}
                    onClick={()=> selectValue(opt)} 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectValue(opt);
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement?.focus) nextElement.focus();
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const prevElement = e.currentTarget.previousElementSibling as HTMLElement;
                        if (prevElement?.focus) {
                          prevElement.focus();
                        } else if (searchInputRef.current) {
                          searchInputRef.current.focus();
                        }
                      } else if (e.key === 'Escape') {
                        setOpen(false);
                      }
                    }}
                    className={cn('cursor-pointer px-2 py-1.5 rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none', active && 'bg-purple-50 border border-[#8A2BE2]')}
                  >
                    {opt}
                  </div>
                );
            })}
            {canAdd && (
              <div 
                tabIndex={-1}
                onClick={addNew} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    addNew();
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevElement = e.currentTarget.previousElementSibling as HTMLElement;
                    if (prevElement?.focus) {
                      prevElement.focus();
                    } else if (searchInputRef.current) {
                      searchInputRef.current.focus();
                    }
                  } else if (e.key === 'Escape') {
                    setOpen(false);
                  }
                }}
                className="cursor-pointer px-2 py-2 mt-1 text-center text-[#8A2BE2] text-sm hover:underline rounded-md focus:bg-gray-100 focus:outline-none"
              >
                Add "{query}" as new relationship
              </div>
            )}
            {!filtered.length && !canAdd && (<div className="text-center text-xs text-gray-500 dark:text-white py-2">No results</div>)}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

type NewStudentType = Omit<Partial<Student>, 'guardian'> & { guardian: Parent; firstName?:string; middleName?:string; lastName?:string; guardianFirstName?:string; guardianMiddleName?:string; guardianLastName?:string; };

export function AddStudentDialogFixed(props: AddStudentDialogProps){
  const { primaryColor } = useCustomColors();
  const { open,onOpenChange,onAdd,initialStudent,courses:prefetchedCourses,coursesLoading,draftId } = props;
  const { toast } = useToast();
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId || null);
  const todayLocal=()=>{ const d=new Date(); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); };
  const emptyGuardian: Parent={ fullName:'', relationship:'', contact:'', linkedStudentId:'' };
  const splitName=(full?:string|null)=>{ const parts=(full||'').trim().split(/\s+/).filter(Boolean); return { first:parts[0]||'', last:parts.length>1?parts[parts.length-1]:'', middle:parts.length>2?parts.slice(1,-1).join(' '):'' }; };
  const composeInitial=():NewStudentType=>{
    const base:NewStudentType={ guardian:emptyGuardian,name:'',firstName:'',middleName:'',lastName:'',email:'',courseOfInterestId:'',guardianFirstName:'',guardianMiddleName:'',guardianLastName:'',communicationPreferences:{enabled:true,channels:['Email','SMS','WhatsApp']},registrationDate:todayLocal(), cohortId:'', country: 'IN' };
  if(!initialStudent) return {...base, cohortId: ''};
    const sn=splitName(initialStudent.name);
    const gn=splitName(initialStudent.guardian?.fullName);
    const sanitizedInitial = { ...(initialStudent || {}) } as any;
    if(sanitizedInitial.batch && !sanitizedInitial.cohortId) sanitizedInitial.cohortId = sanitizedInitial.batch;
    if(sanitizedInitial.cohort && !sanitizedInitial.cohortId) sanitizedInitial.cohortId = sanitizedInitial.cohort;
    if('batch' in sanitizedInitial) delete sanitizedInitial.batch;
    if('cohort' in sanitizedInitial) delete sanitizedInitial.cohort;
    return { ...base, ...sanitizedInitial, guardian: initialStudent.guardian?{...emptyGuardian,...initialStudent.guardian}:emptyGuardian, firstName:sn.first,middleName:sn.middle,lastName:sn.last, guardianFirstName:gn.first,guardianMiddleName:gn.middle,guardianLastName:gn.last };
  };
  // Helper to detect meaningful user edits vs default-initial values.
  // By default we ignore some fields that are programmatically set (like registrationDate)
  // when deciding whether the form is "empty". You can extend ignoredFields to
  // include or exclude additional keys as needed.
  const hasMeaningfulChanges = (current: NewStudentType, baseline: NewStudentType, ignoredFields: string[] = ['countryCode']) => {
    try {
      const keys = Array.from(new Set([...Object.keys(baseline), ...Object.keys(current)]));
      for (const k of keys) {
        if (ignoredFields.includes(k)) continue;
        const a = (baseline as any)[k];
        const b = (current as any)[k];
        // Simple deep check for values - arrays/objects will be JSON-stringified
        const as = a === undefined ? '__undefined__' : (typeof a === 'object' ? JSON.stringify(a) : String(a));
        const bs = b === undefined ? '__undefined__' : (typeof b === 'object' ? JSON.stringify(b) : String(b));
        if (as !== bs) return true;
      }
      return false;
    } catch (e) {
      // Fallback to conservative behavior: assume there are meaningful changes
      return true;
    }
  };
  const [newStudent,setNewStudent]=useState<NewStudentType>(composeInitial); 
  const [countryCode, setCountryCode] = useState('+91'); // Default to India
  const [guardianCountryCode, setGuardianCountryCode] = useState('+91'); // Default to India for guardian
  const [selectedCountryName, setSelectedCountryName] = useState<string|undefined>();
  const [nextStudentId, setNextStudentId] = useState<string>('STU####');
  
  // Fetch next available student ID for new students
  useEffect(() => {
    if (!initialStudent && open) {
      // Fetch all students to determine next ID
      fetch('/api/dashboard/student/students')
        .then(res => res.json())
        .then(data => {
          const students = Array.isArray(data) ? data : [];
          const existingIds = students
            .map((s: any) => s.studentId)
            .filter((id: string) => /^STU\d{4}$/.test(id))
            .map((id: string) => parseInt(id.substring(3), 10))
            .filter((n: number) => !isNaN(n) && n > 0);
          
          existingIds.sort((a, b) => a - b);
          
          let nextNum = 1;
          for (const n of existingIds) {
            if (n === nextNum) {
              nextNum++;
            } else if (n > nextNum) {
              break;
            }
          }
          
          setNextStudentId(`STU${String(nextNum).padStart(4, '0')}`);
        })
        .catch(() => {
          setNextStudentId('STU####');
        });
    }
  }, [initialStudent, open]);
  
  // Compute stable Student ID for display
  const displayStudentId = useMemo(() => {
    if (initialStudent?.studentId) return initialStudent.studentId;
    if (initialStudent?.id) return initialStudent.id;
    if (currentDraftId) return `${nextStudentId}`;
    return nextStudentId;
  }, [initialStudent?.studentId, initialStudent?.id, currentDraftId, nextStudentId]);
  
  // Track form changes for unsaved changes detection
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  const [initialFormState, setInitialFormState] = useState<Partial<Student> | null>(null);
  // Guard to prevent duplicate draft saves from rapid clicks
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const savingDraftRef = useRef(false);
  // Snapshot used to compute a conservative "dirty" / meaningful-edit flag
  const initialSnapshotRef = useRef<{
    firstName?: string;
    lastName?: string;
    email?: string;
    dob?: string;
    mobile?: string;
    gender?: string;
    courseOfInterestId?: string;
    enrolledCourse?: string;
    cohortId?: string;
    country?: string;
    stateProvince?: string;
    registrationDate?: string;
    address?: string;
  }>({});
  
  // Tab management
  const tabKeys=['student-info','course-details','communication','guardian-details'];
  const [activeTab,setActiveTab]=useState(tabKeys[0]);
  const nextTab=(e?: React.MouseEvent)=>{
    e?.preventDefault();
    e?.stopPropagation();
    const i = tabKeys.indexOf(activeTab);
    if(i===-1) return;
    const tabRequired: Record<string,string[]> = {
      'student-info': ['firstName','lastName','email','dob','mobile','gender','country','stateProvince','courseOfInterestId'],
      'course-details': ['registrationDate'],
      'communication': [],
      'guardian-details': []
    };
    const req = tabRequired[activeTab] || [];
    const invalidInTab = req.filter(f => validationStatus.errors?.[f]);
    if(invalidInTab.length){
      setErrorFields(prev => new Set([...Array.from(prev), ...invalidInTab]));
      const first = invalidInTab[0];
      setTimeout(()=>{
        const el = document.querySelector(`[name="${first}"]`) as HTMLElement | null;
        el?.focus();
      },30);
      return; // block navigation
    }
    if(i<tabKeys.length-1) setActiveTab(tabKeys[i+1]);
  };
  const prevTab=(e?: React.MouseEvent)=>{ e?.preventDefault(); e?.stopPropagation(); const i=tabKeys.indexOf(activeTab); if(i>0) setActiveTab(tabKeys[i-1]); };
  
  // Reset form when dialog opens/closes or when initialStudent changes
  useEffect(()=>{ 
    const initial = composeInitial();
    setNewStudent(initial);
    
    // Debug log when editing a student
    if (initialStudent) {
      console.log('?? Editing student - Initial data:', {
        name: initialStudent.name,
        enrolledCourse: (initialStudent as any).enrolledCourse,
        enrolledCourseName: initialStudent.enrolledCourseName,
        cohortId: initialStudent.cohortId,
        courseStartDate: initialStudent.courseStartDate
      });
      console.log('?? Composed initial state:', {
        enrolledCourse: (initial as any).enrolledCourse,
        cohortId: initial.cohortId
      });
    }
  },[initialStudent]);
  
  // Reset form when dialog is opened fresh (not editing)
  useEffect(() => {
    // Always reset to first tab whenever the dialog is (re)opened, whether creating or editing.
    // This ensures that if the user was on the last tab, closes, and reopens, they start at the first tab.
    if (open) {
      setActiveTab('student-info');
    }
    if (open && !initialStudent) {
      const initial = composeInitial();
      setNewStudent(initial);
      setInitialFormState(initial as Partial<Student>);
      setHasUnsavedChanges(false);
      setCurrentDraftId(null); // Reset draft ID for new students
      setCountryCode('+91'); // Reset to India
      setSelectedCountryName('India');
      setGuardianCountryCode('+91'); // Reset guardian to India
      // Clear any previous validation highlights when opening fresh
      setErrorFields(new Set());
      setShowValidationAlert(false);
      console.log('?? Opening new student dialog - draftId reset to null');
      // Record an initial snapshot used to determine whether the user
      // has made any meaningful edits (mirrors attendance dialog approach)
      initialSnapshotRef.current = {
        firstName: initial.firstName || '',
        lastName: initial.lastName || '',
        email: initial.email || '',
        dob: initial.dob || '',
        mobile: initial.mobile || '',
        gender: initial.gender || '',
        courseOfInterestId: initial.courseOfInterestId || '',
        enrolledCourse: (initial as any).enrolledCourse || '',
        cohortId: initial.cohortId || '',
        country: (initial as any).country || '',
        stateProvince: (initial as any).stateProvince || '',
        registrationDate: initial.registrationDate || '',
        address: initial.address || ''
      };
    } else if (open && initialStudent) {
      setInitialFormState(initialStudent);
      setHasUnsavedChanges(false);
      setCurrentDraftId(draftId || null); // Set draft ID when editing existing draft
      // Set country codes from initialStudent if available
      if (initialStudent.countryCode) setCountryCode(initialStudent.countryCode);
      if (initialStudent.guardianCountryCode) setGuardianCountryCode(initialStudent.guardianCountryCode);
      // Set country name from country code
      if ((initialStudent as any).country) {
        getCachedCountries().then(countries => {
          const country = countries.find((c: any) => c.cca2 === (initialStudent as any).country);
          if (country) {
            setSelectedCountryName(country.name?.common);
          }
        }).catch(err => {
          console.error('Failed to load country name:', err);
        });
      }
      // Clear validation highlights when opening for edit
      setErrorFields(new Set());
      setShowValidationAlert(false);
      console.log('?? Opening existing student/draft - draftId:', draftId);
      // Set snapshot based on the provided initialStudent so edits are
      // compared against the pre-existing data when deciding "dirty".
      initialSnapshotRef.current = {
        firstName: initialStudent.firstName || initialStudent.name || '',
        lastName: initialStudent.lastName || '',
        email: initialStudent.email || '',
        dob: initialStudent.dob || '',
        mobile: initialStudent.mobile || '',
        gender: initialStudent.gender || '',
        courseOfInterestId: initialStudent.courseOfInterestId || '',
        enrolledCourse: (initialStudent as any).enrolledCourse || '',
        cohortId: initialStudent.cohortId || '',
        country: (initialStudent as any).country || '',
        stateProvince: (initialStudent as any).stateProvince || '',
        registrationDate: initialStudent.registrationDate || '',
        address: initialStudent.address || ''
      };
    }
  }, [open, initialStudent, draftId]);
  
  // Track changes in form data using a focused snapshot similar to the
  // attendance dialog: only count the form as dirty when one of the
  // important fields has been edited by the user. This avoids showing the
  // unsaved-changes popup when the dialog was opened and only programmatic
  // defaults (like registrationDate / country code) are present.
  const isDirty = useMemo(() => {
    if (!open) return false;
    const s = initialSnapshotRef.current || {};
    
    // For new students (not editing), check if any user-facing fields have actual values
    // Ignore programmatic defaults like country code and registration date
    if (!initialStudent) {
      const hasUserInput = (
        (newStudent.firstName || '').trim() !== '' ||
        (newStudent.lastName || '').trim() !== '' ||
        (newStudent.email || '').trim() !== '' ||
        (newStudent.dob || '') !== '' ||
        (newStudent.mobile || '').trim() !== '' ||
        (newStudent.gender || '') !== '' ||
        (newStudent.courseOfInterestId || '') !== '' ||
        (newStudent.address || '').trim() !== ''
      );
      return hasUserInput;
    }
    
    // For editing existing students, compare against initial snapshot
    return (
      (newStudent.firstName || '') !== (s.firstName || '') ||
      (newStudent.lastName || '') !== (s.lastName || '') ||
      (newStudent.email || '') !== (s.email || '') ||
      (newStudent.dob || '') !== (s.dob || '') ||
      (newStudent.mobile || '') !== (s.mobile || '') ||
      (newStudent.gender || '') !== (s.gender || '') ||
      (newStudent.courseOfInterestId || '') !== (s.courseOfInterestId || '') ||
      ((newStudent as any).enrolledCourse || '') !== (s.enrolledCourse || '') ||
      (newStudent.cohortId || '') !== (s.cohortId || '') ||
      ((newStudent as any).country || '') !== (s.country || '') ||
      ((newStudent as any).stateProvince || '') !== (s.stateProvince || '') ||
      (newStudent.registrationDate || '') !== (s.registrationDate || '') ||
      (newStudent.address || '') !== (s.address || '')
    );
  }, [newStudent, open, initialStudent]);

  // Mirror isDirty into the state used elsewhere in the component
  useEffect(() => {
    setHasUnsavedChanges(!!isDirty);
  }, [isDirty]);
  
  // Sync selectedCountryName with country code in newStudent
  useEffect(() => {
    const countryCode = (newStudent as any).country;
    if (countryCode && open) {
      getCachedCountries().then(countries => {
        const country = countries.find((c: any) => c.cca2 === countryCode);
        if (country && country.name?.common !== selectedCountryName) {
          setSelectedCountryName(country.name?.common);
        }
      }).catch(err => {
        console.error('Failed to sync country name:', err);
      });
    }
  }, [(newStudent as any).country, open]);
  
  const [courseList,setCourseList]=useState<Course[]>(prefetchedCourses||[]); const [isLoadingCourses,setIsLoadingCourses]=useState(false); const [cohortList,setCohortList]=useState<Cohort[]>([]); const [cohortsLoading,setCohortsLoading]=useState(false); const [error,setError]=useState<string|null>(null); const [retry,setRetry]=useState(0);
  
  // Function to manually reload courses
  const reloadCourses = async () => {
    setIsLoadingCourses(true);
    setError(null);
    try {
      const data = await fetchCourses();
      setCourseList(Array.isArray(data) ? data.filter(c => c && c.id) : []);
      toast({
        title: "? Courses Refreshed",
        description: "Course list has been updated successfully.",
        duration: 2000,
      });
    } catch (e: any) {
      setError(e.message || 'Failed to load courses');
      toast({
        title: "? Refresh Failed",
        description: e.message || 'Failed to load courses',
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoadingCourses(false);
    }
  };
  
  // Initialize phone code mapping on component mount
  useEffect(() => {
    initializePhoneCodeMapping().catch(err => {
      console.error('Failed to initialize phone code mapping:', err);
    });
  }, []);
  
  // Load all students for duplicate checking
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStudentsLoading(true);
      try {
        const response = await fetch('/api/dashboard/student/students');
        if (response.ok) {
          const data = await response.json();
          if (!cancelled) {
            setStudents(Array.isArray(data) ? data : []);
          }
        }
      } catch {
        if (!cancelled) setStudents([]);
      } finally {
        if (!cancelled) setStudentsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  

  

  
  // Helper to check if guardian fields are required based on student's age
  const isGuardianRequired = () => {
    if (!newStudent.dob) return false;
    const birthDate = new Date(newStudent.dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age < 18;
  };

  // Get minimum phone number length for a country
  function getMinPhoneDigits(countryIso: string | undefined): number {
    if (!countryIso) return 10; // Default minimum
    
    // Common minimum lengths for various countries
    const minDigits: Record<string, number> = {
      'US': 10, // United States
      'CA': 10, // Canada
      'GB': 10, // United Kingdom
      'IN': 10, // India
      'AU': 9,  // Australia
      'DE': 10, // Germany
      'FR': 9,  // France
      'IT': 9,  // Italy
      'ES': 9,  // Spain
      'BR': 10, // Brazil
      'MX': 10, // Mexico
      'JP': 10, // Japan
      'CN': 11, // China
      'KR': 10, // South Korea
      'SG': 8,  // Singapore
      'MY': 9,  // Malaysia
      'TH': 9,  // Thailand
      'PH': 10, // Philippines
      'ID': 10, // Indonesia
      'VN': 9,  // Vietnam
      'AE': 9,  // UAE
      'SA': 9,  // Saudi Arabia
      'ZA': 9,  // South Africa
      'NZ': 9,  // New Zealand
      'CH': 9,  // Switzerland
      'NL': 9,  // Netherlands
      'BE': 9,  // Belgium
      'SE': 9,  // Sweden
      'NO': 8,  // Norway
      'DK': 8,  // Denmark
      'FI': 9,  // Finland
      'PL': 9,  // Poland
      'RU': 10, // Russia
      'TR': 10, // Turkey
      'EG': 10, // Egypt
      'PK': 10, // Pakistan
      'BD': 10, // Bangladesh
      'LK': 9,  // Sri Lanka
      'NP': 10, // Nepal
    };
    
    return minDigits[countryIso.toUpperCase()] || 8; // Default to 8 if country not found
  }

  // Validate mobile number using libphonenumber-js for accurate international rules
  function validateMobileForCountry(countryIso: string | undefined, mobileValue?: string) {
    if (!mobileValue) return null;
    
    // Check minimum digits first
    const digitsOnly = mobileValue.replace(/\D/g, '');
    const minDigits = getMinPhoneDigits(countryIso);
    if (digitsOnly.length < minDigits) {
      return `Please enter at least ${minDigits} digits for ${countryIso || 'this country'}`;
    }
    
    try {
  // parsePhoneNumberFromString accepts undefined country to attempt global parsing
  // Cast the runtime string to CountryCode | undefined so TypeScript accepts it
  const countryArg = (countryIso ? countryIso.toUpperCase() : undefined) as CountryCode | undefined;
  const phone = parsePhoneNumberFromString(mobileValue, countryArg);
      if (!phone) {
        return `Please enter a valid phone number${countryIso ? ` for ${countryIso}` : ''}`;
      }
      if (!phone.isValid()) {
        return `Please enter a valid phone number${countryIso ? ` for ${countryIso}` : ''}`;
      }
      return null;
    } catch (err) {
      return `Please enter a valid phone number${countryIso ? ` for ${countryIso}` : ''}`;
    }
  }
  
  // Central validation status (used for button enable + inline missing list)
  const validationStatus = useMemo(() => {
    const missing: string[] = [];
    const errors: Record<string,string> = {};
    const labels: Record<string,string> = {
  firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email Address',
      dob: 'Date of Birth',
      mobile: 'Mobile Number',
      gender: 'Gender',
      courseOfInterestId: 'Course of Interest',
      address: 'Address',
  country: 'Country',
  stateProvince: 'State/Province',
      registrationDate: 'Registration Date',
      guardianFirstName: 'Guardian First Name',
      guardianRelationship: 'Guardian Relationship',
      guardianContact: 'Guardian Contact Number'
    };

    const addError = (key: string, message?: string) => {
      if (!errors[key]) {
        const label = labels[key] || key;
        errors[key] = message || `${label} is required`;
        missing.push(message && message !== `${label} is required` ? message : label);
      }
    };

    // Base required fields
    const baseRequired: {key:string; value:any}[] = [
      { key:'firstName', value:newStudent.firstName?.trim() },
      { key:'lastName', value:newStudent.lastName?.trim() },
      { key:'email', value:newStudent.email?.trim() },
      { key:'dob', value:newStudent.dob },
      { key:'mobile', value:newStudent.mobile?.trim() },
      { key:'gender', value:newStudent.gender },
      { key:'courseOfInterestId', value:newStudent.courseOfInterestId },
      { key:'country', value:(newStudent as any).country },
      { key:'stateProvince', value:(newStudent as any).stateProvince },
      { key:'registrationDate', value:newStudent.registrationDate }
    ];
    baseRequired.forEach(f => { if(!f.value) addError(f.key); });

    // Email format validation
    if (newStudent.email) {
      const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
      if (!emailRegex.test(newStudent.email.trim())) {
        addError('email', 'Please enter a valid email address (e.g. john@example.com)');
      } else {
        // Check for duplicate email (exclude current student when editing)
        const duplicateEmail = students.find(s => 
          s.email?.toLowerCase() === newStudent.email?.toLowerCase() && 
          s.id !== initialStudent?.id && 
          s.studentId !== initialStudent?.studentId
        );
        if (duplicateEmail) {
          addError('email', `This email is already registered to ${duplicateEmail.name || duplicateEmail.studentId || 'another student'}`);
        }
      }
    }

    // Mobile number validation (country-specific)
    if (newStudent.mobile) {
      const mobileErr = validateMobileForCountry((newStudent as any).country, newStudent.mobile);
      if (mobileErr) {
        addError('mobile', mobileErr);
      } else {
        // Check for duplicate mobile (exclude current student when editing)
        const normalizedMobile = newStudent.mobile.replace(/\D/g, '');
        const duplicateMobile = students.find(s => {
          const existingMobile = s.mobile?.replace(/\D/g, '');
          return existingMobile === normalizedMobile && 
                 s.id !== initialStudent?.id && 
                 s.studentId !== initialStudent?.studentId;
        });
        if (duplicateMobile) {
          addError('mobile', `This mobile number is already registered to ${duplicateMobile.name || duplicateMobile.studentId || 'another student'}`);
        }
      }
    }

    // DOB must not be a future date
    if (newStudent.dob) {
      try {
        const dobDate = new Date(newStudent.dob);
        const today = new Date();
        // Compare only date parts
        const dobOnly = new Date(dobDate.getFullYear(), dobDate.getMonth(), dobDate.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        if (dobOnly.getTime() > todayOnly.getTime()) {
          addError('dob', 'Date of Birth cannot be in the future');
        }
      } catch (e) {
        // ignore parse errors here; other validations will catch missing/invalid values
      }
    }

    // Guardian validation if required (validate presence and format)
    if (isGuardianRequired()) {
      if (!newStudent.guardianFirstName?.trim()) addError('guardianFirstName');
      if (!newStudent.guardian?.relationship) addError('guardianRelationship');
      if (!newStudent.guardian?.contact?.trim()) {
        addError('guardianContact', 'Please enter a valid guardian contact number');
      } else {
        // Attempt to determine guardian country ISO from selected guardian phone code, fallback to student's country
        const gCountryIso = getCountryByPhoneCode(guardianCountryCode) || (newStudent as any).country;
        const guardianErr = validateMobileForCountry(gCountryIso, newStudent.guardian.contact);
        if (guardianErr) addError('guardianContact', guardianErr);
      }
    }

    return { errors, missing, valid: missing.length === 0 };
  }, [newStudent, students, initialStudent, guardianCountryCode, isGuardianRequired]);
  
  // Gated error highlighting: only show after user attempts next/submit
  const [errorFields, setErrorFields] = useState<Set<string>>(new Set());
  const showFieldError = (field:string) => errorFields.has(field) && !!validationStatus.errors?.[field];
  
  // Course draft popup state
  const [showCourseDraftPopup, setShowCourseDraftPopup] = useState(false);
  const [createdCourseName, setCreatedCourseName] = useState('');
  const [createdCourseLevel, setCreatedCourseLevel] = useState('');
  
  // Validation popup state
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [missingFieldsList, setMissingFieldsList] = useState<string[]>([]);
  
  useEffect(()=>{ if(prefetchedCourses?.length) setCourseList(prefetchedCourses.filter(c=>c&&c.id)); },[prefetchedCourses]);
  useEffect(()=>{ if(prefetchedCourses?.length) return; let cancelled=false; (async()=>{ setIsLoadingCourses(true); setError(null); try{ const data=await fetchCourses(); if(!cancelled) setCourseList(Array.isArray(data)?data.filter(c=>c&&c.id):[]);}catch(e:any){ if(!cancelled){ setError(e.message||'Failed to load courses'); if(retry<2) setTimeout(()=>setRetry(r=>r+1),800); }} finally { if(!cancelled) setIsLoadingCourses(false);} })(); return ()=>{cancelled=true}; },[prefetchedCourses,retry]);
  // Load cohorts whenever the enrolled course changes
  useEffect(()=>{ 
    const enrolledCourse = (newStudent as any).enrolledCourse;
    console.log('?? Cohort loading effect triggered:', { enrolledCourse, hasValue: !!enrolledCourse });
    
    if(!enrolledCourse){ 
      setCohortList([]); 
      console.log('?? No enrolled course - clearing cohort list');
      return;
    } 
    let cancelled=false; 
    (async()=>{ 
      setCohortsLoading(true);
      console.log('?? Loading cohorts for course:', enrolledCourse);
      try{ 
        const data=await fetchCohorts(enrolledCourse); 
        if(!cancelled) {
          setCohortList(Array.isArray(data)?data.filter(c=>c&&c.id):[]);
          console.log('? Loaded cohorts:', data?.length || 0, 'cohorts');
        }
      }catch(err){ 
        if(!cancelled) {
          setCohortList([]);
          console.error('? Failed to load cohorts:', err);
        }
      } finally{ 
        if(!cancelled) setCohortsLoading(false);
      } 
    })(); 
  },[(newStudent as any).enrolledCourse]);
  
  // Auto-fill course start date when cohorts are loaded and the student has a cohort selected
  // This handles the case when editing an existing student with a cohort already assigned
  useEffect(() => {
    if (cohortList.length > 0 && newStudent.cohortId && !cohortsLoading) {
      const selectedCohort = cohortList.find(c => c.id === newStudent.cohortId);
      if (selectedCohort && selectedCohort.startDate) {
        // Only update if the current courseStartDate doesn't match the cohort's startDate
        if (newStudent.courseStartDate !== selectedCohort.startDate) {
          console.log('?? Auto-filling course start date from existing cohort:', selectedCohort.startDate);
          setNewStudent(p => ({
            ...p,
            courseStartDate: selectedCohort.startDate
          }));
        }
      }
    }
  }, [cohortList, newStudent.cohortId, cohortsLoading]);
  
  const setNamePart=(part:'firstName'|'middleName'|'lastName',value:string)=> setNewStudent(prev=>{ const sanitized = value.replace(/[0-9]/g, ''); const next={...prev,[part]:sanitized} as NewStudentType; next.name=[next.firstName,next.middleName,next.lastName].filter(Boolean).join(' '); return next; });
  const updateGuardianName=(part:'guardianFirstName'|'guardianMiddleName'|'guardianLastName',value:string)=> setNewStudent(prev=>{ const sanitized = value.replace(/[0-9]/g, ''); const next={...prev,[part]:sanitized} as NewStudentType; const full=[next.guardianFirstName,next.guardianMiddleName,next.guardianLastName].filter(Boolean).join(' '); next.guardian={...next.guardian,fullName:full}; return next; });
  const updateGuardian=(changes:Partial<Parent>)=> setNewStudent(prev=>({...prev,guardian:{...prev.guardian,...changes}}));
  const handleCourseSelect=(courseId:string)=>{ 
    if(courseId.startsWith('__placeholder__')) return; 
    const sel=courseList.find(c=>c.id===courseId); 
    if (sel) {
      setNewStudent(p=>({
        ...p,
        courseOfInterestId:courseId,
        enrolledCourseName:sel.name||p.enrolledCourseName,
        cohortId:'' // Clear cohort selection when course changes
      }));
      console.log('? Selected course:', sel.name);
    } else {
  setNewStudent(p=>({...p,courseOfInterestId:courseId,enrolledCourseName:p.enrolledCourseName,cohortId:''}));
    }
  };
  
  // Sync phone code when country changes
  const handleCountryChange = (countryCode: string, countryName?: string) => {
    setNewStudent(p => ({ ...p, country: countryCode, stateProvince: '' }));
    setSelectedCountryName(countryName);

    // Auto-update phone code based on selected country
    const phoneCode = getPhoneCodeByCountry(countryCode);
    if (phoneCode) {
      setCountryCode(phoneCode);
      console.log(`?? Auto-synced phone code: ${phoneCode} for country ${countryCode} (${countryName})`);
    } else {
      console.warn(`?? No phone code mapping found for country: ${countryCode} (${countryName})`);
    }
  };
  
  // Sync country when phone code changes
  const handlePhoneCodeChange = (phoneCode: string) => {
    setCountryCode(phoneCode);
    
    // Auto-update country based on selected phone code
    const countryIso = getCountryByPhoneCode(phoneCode);
    if (countryIso && countryIso !== (newStudent as any).country) {
      setNewStudent(p => ({ ...p, country: countryIso, stateProvince: '' }));
      console.log(`?? Auto-synced country: ${countryIso} for phone code ${phoneCode}`);
    } else if (!countryIso) {
      console.warn(`?? No country mapping found for phone code: ${phoneCode}`);
    }
  };
  
  // Sync guardian phone code when guardian country would be added (for future enhancement)
  const handleGuardianPhoneCodeChange = (phoneCode: string) => {
    setGuardianCountryCode(phoneCode);
    // Guardian doesn't have a separate country field, so we just update the phone code
  };
  
  const handleCourseDraftCreated = (courseName: string, level: string) => {
    setCreatedCourseName(courseName);
    setCreatedCourseLevel(level);
    setShowCourseDraftPopup(true);
  };
  
  const nextId=()=>{ 
    // Generate a temporary ID - the backend will assign the proper sequential ID
    return `TEMP_${Date.now()}`;
  };
  const handleAddStudent = async (e:React.FormEvent) => { 
    e.preventDefault();

    // Required field validation
    const requiredFields: Record<string, any> = {
      firstName: newStudent.firstName?.trim(),
      lastName: newStudent.lastName?.trim(),
      email: newStudent.email?.trim(),
      dob: newStudent.dob,
      mobile: newStudent.mobile?.trim(),
      gender: newStudent.gender,
      courseOfInterestId: newStudent.courseOfInterestId,
      country: (newStudent as any).country,
      stateProvince: (newStudent as any).stateProvince,
      registrationDate: newStudent.registrationDate
    };

    const missing = Object.entries(requiredFields)
      .filter(([, v]) => !v)
      .map(([k]) => k);
    if (missing.length) {
      const labels: Record<string,string> = {
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email Address',
        dob: 'Date of Birth',
        mobile: 'Mobile Number',
        gender: 'Gender',
        courseOfInterestId: 'Course of Interest',
    registrationDate: 'Registration Date',
    country: 'Country',
    stateProvince: 'State/Province'
      };
      setMissingFieldsList(missing.map(f=>labels[f]||f));
      setValidationMessage('Please fill in all required fields to continue.');
      setShowValidationAlert(true);
      return;
    }

    // Email format
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (newStudent.email && !emailRegex.test(newStudent.email)) {
      setMissingFieldsList([]);
      setValidationMessage('Please enter a valid email address format (e.g., john@example.com).');
      setShowValidationAlert(true);
      return;
    }

    // Check for duplicate email
    if (newStudent.email) {
      const duplicateEmail = students.find(s => 
        s.email?.toLowerCase() === newStudent.email?.toLowerCase() && 
        s.id !== initialStudent?.id && 
        s.studentId !== initialStudent?.studentId
      );
      if (duplicateEmail) {
        setMissingFieldsList([]);
        setValidationMessage(`This email address is already registered to ${duplicateEmail.name || duplicateEmail.studentId || 'another student'}. Please use a different email.`);
        setShowValidationAlert(true);
        return;
      }
    }

    // Mobile number digits (basic)
    if (newStudent.mobile) {
      const mobileErr = validateMobileForCountry((newStudent as any).country, newStudent.mobile);
      if (mobileErr) {
        setMissingFieldsList([]);
        setValidationMessage(mobileErr);
        setShowValidationAlert(true);
        return;
      }
      
      // Check for duplicate mobile
      const normalizedMobile = newStudent.mobile.replace(/\D/g, '');
      const duplicateMobile = students.find(s => {
        const existingMobile = s.mobile?.replace(/\D/g, '');
        return existingMobile === normalizedMobile && 
               s.id !== initialStudent?.id && 
               s.studentId !== initialStudent?.studentId;
      });
      if (duplicateMobile) {
        setMissingFieldsList([]);
        setValidationMessage(`This mobile number is already registered to ${duplicateMobile.name || duplicateMobile.studentId || 'another student'}. Please use a different number.`);
        setShowValidationAlert(true);
        return;
      }
    }

    // Date of Birth must not be in the future
    if (newStudent.dob) {
      try {
        const birthDate = new Date(newStudent.dob);
        const today = new Date();
        const birthOnly = new Date(birthDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        if (birthOnly.getTime() > todayOnly.getTime()) {
          setMissingFieldsList([]);
          setValidationMessage('Date of Birth cannot be in the future.');
          setShowValidationAlert(true);
          return;
        }
      } catch (e) {
        // ignore parsing error here; other validations will handle it
      }
    }

    // Guardian if under 18
    if (newStudent.dob) {
      const birthDate = new Date(newStudent.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
      if (age < 18) {
          const guardianMissing: string[] = [];
          if (!newStudent.guardianFirstName?.trim()) guardianMissing.push('Guardian First Name');
          if (!newStudent.guardian.relationship) guardianMissing.push('Guardian Relationship');
          if (!newStudent.guardian?.contact?.trim()) {
            guardianMissing.push('Guardian Contact Number');
          } else {
            // Validate guardian contact format using libphonenumber-js
            const gCountryIso = getCountryByPhoneCode(guardianCountryCode) || (newStudent as any).country;
            const gErr = validateMobileForCountry(gCountryIso, newStudent.guardian.contact);
            if (gErr) {
              setMissingFieldsList([]);
              setValidationMessage(gErr);
              setShowValidationAlert(true);
              return;
            }
          }
          if (guardianMissing.length) {
            setMissingFieldsList(guardianMissing);
            setValidationMessage('Guardian details are required for students under 18 years of age.');
            setShowValidationAlert(true);
            return;
          }
      }
    }

    // IDs - When creating from a draft (currentDraftId exists), generate a NEW temporary ID
    // When editing an existing student, use their existing ID
    const id = (currentDraftId ? nextId() : (initialStudent?.id || initialStudent?.studentId)) || nextId();
    const studentId = (currentDraftId ? nextId() : (initialStudent?.studentId || initialStudent?.id)) || id;

    // Guardian assembly
    const guardianFull = [newStudent.guardianFirstName, newStudent.guardianMiddleName, newStudent.guardianLastName].filter(Boolean).join(' ');
    const guardian: Parent = { ...newStudent.guardian, fullName: guardianFull, linkedStudentId: studentId || id };

    const student: Student = {
      id,
      studentId,
      name: newStudent.name || [newStudent.firstName, newStudent.middleName, newStudent.lastName].filter(Boolean).join(' ') || guardianFull || (studentId || id),
      firstName: newStudent.firstName?.trim(),
      middleName: newStudent.middleName?.trim(),
      lastName: newStudent.lastName?.trim(),
      gender: newStudent.gender || '',
      dob: newStudent.dob || '',
      mobile: newStudent.mobile || '',
      countryCode: countryCode,
      email: newStudent.email!,
      address: newStudent.address || '',
      courseOfInterestId: newStudent.courseOfInterestId!, // Course of Interest ID
      enrolledCourse: (newStudent as any).enrolledCourse || '', // Enrolled Course ID
      enrolledCourseName: (newStudent as any).enrolledCourseName || '', // Enrolled Course Name
      category: '',
      courseType: '',
      courseLevel: '',
      registrationDate: newStudent.registrationDate || todayLocal(),
      courseStartDate: newStudent.courseStartDate || '',
  cohortId: newStudent.cohortId || '',
  country: (newStudent as any).country || '',
  stateProvince: (newStudent as any).stateProvince || '',
      referredBy: newStudent.referredBy || '',
      referringStudentName: newStudent.referringStudentName,
      referringStudentId: newStudent.referringStudentId,
      guardian,
      guardianFirstName: newStudent.guardianFirstName?.trim(),
      guardianMiddleName: newStudent.guardianMiddleName?.trim(),
      guardianLastName: newStudent.guardianLastName?.trim(),
      guardianCountryCode: guardianCountryCode,
      communicationPreferences: newStudent.communicationPreferences,
    };
    
    // If this was created from a draft, delete the draft FIRST before creating the student
    if (currentDraftId) {
      try {
        console.log('??? Attempting to delete draft:', currentDraftId);
        const { StudentDraftsAPI } = await import('@/lib/dashboard/student/student-drafts-api');
        await StudentDraftsAPI.deleteDraft(currentDraftId);
        console.log('? Draft deleted successfully:', currentDraftId);
        
        // Trigger event to update draft lists
        StudentDraftsAPI.triggerDraftsUpdatedEvent(undefined, 'deleted');
        
        // Now create the student
        onAdd(student);
        
        // Show success toast
        toast({
          title: "? Student Added",
          description: `Student "${student.name}" has been created and draft has been removed.`,
          duration: 3000,
        });
      } catch (error) {
        console.error('? Failed to delete draft after student creation:', error);
        
        // Still create the student even if draft deletion fails
        onAdd(student);
        
        // Show error toast about draft
        toast({
          title: "?? Draft Not Removed",
          description: `Student "${student.name}" was created, but the draft could not be removed. Please delete it manually.`,
          variant: "destructive",
          duration: 5000,
        });
      }
    } else if (!initialStudent) {
      // Regular student creation (not from draft and not editing)
      onAdd(student);
      
      // Only show toast for new student creation, not for edits (parent handles edit toast)
      toast({
        title: "? Student Added",
        description: `Student "${student.name}" has been created successfully.`,
        duration: 3000,
      });
    } else {
      // Edit operation
      onAdd(student);
      // Parent component will show the "Student Updated" toast
    }
  };
  const renderCourseOptions=()=>{ 
    if(coursesLoading||isLoadingCourses) return <SelectItem value="__placeholder__loading_courses" disabled>Loading courses...</SelectItem>; 
    if(error) return <SelectItem value="__placeholder__error_courses" disabled className="text-red-500">{error}</SelectItem>; 
    if(!courseList.length) return <SelectItem value="__placeholder__no_courses" disabled>No courses found</SelectItem>; 
    
    return courseList.map(c=> <SelectItem key={c.id} value={c.id}><div className="flex flex-col"><span className="font-medium">{c.courseId ? `${c.courseId} - ${c.name}${c.level ? ` - ${c.level}` : ''}` : `${c.name}${c.level ? ` - ${c.level}` : ''}`}</span><span className="text-xs text-gray-500 dark:text-white">{[c.category,c.duration].filter(Boolean).join(' � ')}</span></div></SelectItem>); 
  };
  
  // Render options for enrolled course (only Active or Upcoming courses)
  const renderEnrolledCourseOptions=()=>{ 
    if(coursesLoading||isLoadingCourses) return <SelectItem value="__placeholder__loading_courses" disabled>Loading courses...</SelectItem>; 
    if(error) return <SelectItem value="__placeholder__error_courses" disabled className="text-red-500">{error}</SelectItem>; 
    if(!courseList.length) return <SelectItem value="__placeholder__no_courses" disabled>No courses found</SelectItem>; 
    
    // Filter to only show Active or Upcoming courses
    const enrollableCourses = courseList.filter(c => 
      c.status === 'Active' || c.status === 'Upcoming'
    );
    
    if(enrollableCourses.length === 0) return <SelectItem value="__placeholder__no_active_courses" disabled>No active or upcoming courses available</SelectItem>;
    
    return enrollableCourses.map(c=> <SelectItem key={c.id} value={c.id}><div className="flex flex-col"><span className="font-medium">{c.courseId ? `${c.courseId} - ${c.name}${c.level ? ` - ${c.level}` : ''}` : `${c.name}${c.level ? ` - ${c.level}` : ''}`}</span><span className="text-xs text-gray-500 dark:text-white">{[c.category,c.type,c.duration].filter(Boolean).join(' � ')}</span></div></SelectItem>); 
  };
  const renderCohortOptions=()=>{ if(!newStudent.courseOfInterestId) return <SelectItem value="__placeholder__select_course_first" disabled>Select a course first</SelectItem>; if(cohortsLoading) return <SelectItem value="__placeholder__loading_cohorts" disabled>Loading cohorts...</SelectItem>; if(!cohortList.length) return <SelectItem value="__placeholder__no_cohorts" disabled>No cohorts found</SelectItem>; return cohortList.map(co=> { const seatsInfo=`${(co.enrolledStudents?.length||0)}/${co.capacity||0}`; const cohortLabel = [co.id, co.name, co.instructor || 'TBA', co.timing || '--'].filter(Boolean).join(' - '); return <SelectItem key={co.id} value={co.id} className="flex flex-col items-start py-2"><div className="w-full flex flex-col"><div className="font-medium flex items-center justify-between w-full"><span>{cohortLabel}</span><span className="text-xs text-gray-500 dark:text-white">{seatsInfo}</span></div></div></SelectItem>; }); };
  
  // Dynamic width for Course of Interest select
  const courseMeasureRef = useRef<HTMLSpanElement | null>(null);
  const [courseSelectWidth, setCourseSelectWidth] = useState<number>(240);
  useEffect(() => {
    if (!newStudent.courseOfInterestId) { setCourseSelectWidth(240); return; }
    const sel = courseList.find(c => c.id === newStudent.courseOfInterestId);
    if (!sel) return;
    const label = sel.courseId ? `${sel.courseId} - ${sel.name}${sel.level ? ` - ${sel.level}` : ''}` : `${sel.name}${sel.level ? ` - ${sel.level}` : ''}`;
    if (courseMeasureRef.current) {
      courseMeasureRef.current.textContent = label;
      const w = courseMeasureRef.current.offsetWidth;
      const padded = Math.min(Math.max(w + 56, 200), 640); // add padding & clamp
      setCourseSelectWidth(padded);
    }
  }, [newStudent.courseOfInterestId, courseList]);
  
  // Intercept ANY attempt to close (nextOpen === false) if there are unsaved changes
  const handleDialogClose = (nextOpen: boolean) => {
    if (!nextOpen && hasUnsavedChanges) {
      // If this is a NEW student (not editing) and the form equals the default initial
      // don't show the unsaved dialog � treat as no changes made by the user.
      if (!initialStudent) {
        try {
          const defaultInitial = composeInitial();
          if (!hasMeaningfulChanges(newStudent as NewStudentType, defaultInitial)) {
            // Nothing meaningful entered � close directly
            onOpenChange(nextOpen);
            return;
          }
        } catch (e) {
          // If composeInitial throws for any reason, fall back to showing the dialog
          console.warn('Failed to compare with default initial state', e);
        }
      }
      setShowUnsavedDialog(true);
      setPendingClose(true);
      return; // Block close until user chooses an action
    }
    onOpenChange(nextOpen);
    if (!nextOpen) {
      // Fully closed without unsaved changes or after resolving them
      setPendingClose(false);
      setShowUnsavedDialog(false);
    }
  };
  
  // Handle unsaved changes dialog actions
  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
    setPendingClose(false);
  };
  
  const handleSaveAsDraft = async () => {
    try {
      // Close the unsaved-changes popup immediately to avoid double-clicks
      setShowUnsavedDialog(false);
      setPendingClose(false);
      // Proceed with saving the draft (guarded inside saveDraft)
      await saveDraft();
      setHasUnsavedChanges(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast({
        title: "? Failed to Save Draft",
        description: "Unable to save draft. Please try again or continue editing.",
        variant: "destructive",
        duration: 5000,
      });
      // Keep dialog open on error
    }
  };
  
  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    setPendingClose(false);
    onOpenChange(false);
  };

  const saveDraft = async () => {
    // Idempotency guard � prevent multiple concurrent saves
    if (savingDraftRef.current) return;
    savingDraftRef.current = true;
    setIsSavingDraft(true);
    try {
      const { StudentDraftsAPI } = await import('@/lib/dashboard/student/student-drafts-api');
      const draft = { ...newStudent };
      const studentName = newStudent.firstName && newStudent.lastName 
        ? `${newStudent.firstName} ${newStudent.lastName}` 
        : newStudent.name || 'Untitled Student';
      
      console.log('?? Saving draft - currentDraftId:', currentDraftId);
      
      let savedDraft;
      
      if (currentDraftId) {
        // Update existing draft
        console.log('?? Updating existing draft:', currentDraftId);
        savedDraft = await StudentDraftsAPI.updateDraft(currentDraftId, {
          name: studentName,
          instructor: newStudent.courseOfInterestId || 'No Course Selected',
          level: newStudent.category || 'Beginner',
          data: draft
        });
        
        // Trigger custom event for other components to update
        StudentDraftsAPI.triggerDraftsUpdatedEvent(undefined, 'updated', savedDraft);
        
        // Show success toast for update
        toast({
          title: "? Draft Updated",
          description: `Student draft "${studentName}" has been updated successfully.`,
          duration: 3000,
        });
      } else {
        // Create new draft
        console.log('? Creating new draft');
        savedDraft = await StudentDraftsAPI.createDraft({
          name: studentName,
          instructor: newStudent.courseOfInterestId || 'No Course Selected',
          level: newStudent.category || 'Beginner',
          data: draft
        });

        // Trigger custom event for other components to update
        StudentDraftsAPI.triggerDraftsUpdatedEvent(undefined, 'created', savedDraft);
        
        // Update current draft ID for subsequent saves
        setCurrentDraftId(savedDraft.id);
        console.log('? New draft created with ID:', savedDraft.id);
        
        // Show success toast for creation
        toast({
          title: "? Draft Saved",
          description: `Student draft "${studentName}" has been saved successfully.`,
          duration: 3000,
        });
      }
      
  // Close the dialog after successful save
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save draft:', error);
      // Fallback to localStorage if server fails
      try {
        const draft = { ...newStudent };
        localStorage.setItem('draft-new-student', JSON.stringify(draft));
        toast({
          title: "?? Draft Saved Locally",
          description: "Draft saved to browser storage. Will sync when connection is restored.",
          duration: 4000,
        });
        
        // Close the dialog even for local save
        onOpenChange(false);
      } catch (localError) {
        console.error('Failed to save draft locally:', localError);
        toast({
          title: "? Save Failed",
          description: "Unable to save draft. Please try again.",
          variant: "destructive",
          duration: 5000,
        });
        // Don't close dialog on complete failure - let user try again
      }
    } finally {
      savingDraftRef.current = false;
      setIsSavingDraft(false);
    }
  };

  // (isFormValid replaced by validationStatus.valid)
  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent 
          className="max-w-3xl max-h-[80vh] overflow-y-auto bg-white border border-[#8A2BE2]/20 shadow-xl rounded-xl flex flex-col p-2"
          onInteractOutside={(e) => {
            // Prevent closing by clicking outside if there are unsaved changes
            if (hasUnsavedChanges) {
              // For new forms with no meaningful entries, allow close
              if (!initialStudent) {
                try {
                  const defaultInitial = composeInitial();
                  if (!hasMeaningfulChanges(newStudent as NewStudentType, defaultInitial)) return;
                } catch (e) { /* fallthrough to showing dialog */ }
              }
              e.preventDefault();
              setShowUnsavedDialog(true);
              setPendingClose(true);
            }
          }}
          onEscapeKeyDown={(e) => {
            // Prevent closing with ESC key if there are unsaved changes
            if (hasUnsavedChanges) {
              if (!initialStudent) {
                try {
                  const defaultInitial = composeInitial();
                  if (!hasMeaningfulChanges(newStudent as NewStudentType, defaultInitial)) return;
                } catch (err) { /* show dialog below */ }
              }
              e.preventDefault();
              setShowUnsavedDialog(true);
              setPendingClose(true);
            }
          }}
        >
          <DialogHeader className="pb-0 border-b border-transparent flex-shrink-0">
            <div className="flex items-start justify-between w-full">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  
                  <DialogTitle className="text-xl font-bold">
                    {draftId ? 'Create Student from Draft' : (initialStudent ? 'Edit Student' : 'Add New Student')}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-[13px] md:text-sm text-gray-600 dark:text-white leading-snug">
                  {draftId ? 'Complete and create a new student from this saved draft.' : (initialStudent ? 'Edit and update the existing student profile.' : 'Create a comprehensive student profile.')}
                </DialogDescription>
              </div>
              <div className="flex items-start gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1 mr-10 border border-purple-300/70 bg-white text-purple-600 hover:bg-purple-50 hover:text-purple-700 shadow-sm font-medium pl-2 pr-3"
                  onClick={saveDraft}
                  disabled={isSavingDraft}
                >
                  
                  <Save className="w-4 h-4" />
                  <span className="text-sm">{currentDraftId ? 'Update Draft' : 'Save Draft'}</span>
                </Button>
                {/* Removed redundant close button to avoid double X */}
              </div>
            </div>
            
          </DialogHeader>
          <div className="flex-1 py-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2">
              {/* Styled tabs to match page-level (Dashboard/Students) tab UI */}
              <TabsList className="grid w-full grid-cols-4 mb-3 bg-transparent gap-2 p-0 h-auto">
                <TabsTrigger
                  value="student-info"
                  className="flex items-center justify-center gap-2 px-4 py-2 border-2 rounded-lg font-medium text-[#DE7D14] border-[#DE7D14] data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:border-purple-600 data-[state=inactive]:bg-white data-[state=inactive]:text-[#DE7D14] hover:bg-purple-700 hover:text-white"
                >
                  Student Information
                </TabsTrigger>
                <TabsTrigger
                  value="course-details"
                  className="flex items-center justify-center gap-2 px-4 py-2 border-2 rounded-lg font-medium text-[#DE7D14] border-[#DE7D14] data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:border-purple-600 data-[state=inactive]:bg-white data-[state=inactive]:text-[#DE7D14] hover:bg-purple-700 hover:text-white"
                >
                  Course Details
                </TabsTrigger>
                <TabsTrigger
                  value="communication"
                  className="flex items-center justify-center gap-2 px-4 py-2 border-2 rounded-lg font-medium text-[#DE7D14] border-[#DE7D14] data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:border-purple-600 data-[state=inactive]:bg-white data-[state=inactive]:text-[#DE7D14] hover:bg-purple-700 hover:text-white"
                >
                  Communication & Referral
                </TabsTrigger>
                <TabsTrigger
                  value="guardian-details"
                  className="flex items-center justify-center gap-2 px-4 py-2 border-2 rounded-lg font-medium text-[#DE7D14] border-[#DE7D14] data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:border-purple-600 data-[state=inactive]:bg-white data-[state=inactive]:text-[#DE7D14] hover:bg-purple-700 hover:text-white"
                >
                  Guardian Details
                </TabsTrigger>
              </TabsList>
              <form onSubmit={handleAddStudent} className="space-y-2">
                <TabsContent value="student-info">
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                   
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {/* Student ID - Non-editable field */}
                      <div>
                        <Label className="text-sm font-medium text-black ">Student ID</Label>
                        <Input 
                          value={displayStudentId} 
                          disabled 
                          className="mt-1 border bg-gray-50 dark:bg-gray-800 cursor-not-allowed" 
                          
                              
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-white">First Name <span className="text-red-500">*</span></Label>
                        <Input name="firstName" value={newStudent.firstName||''} onChange={e=> setNamePart('firstName', e.target.value)} required className={cn('mt-1', showFieldError('firstName') && 'border-red-500 focus-visible:ring-red-500')} placeholder="e.g. John" />
                        {showFieldError('firstName') && <p className="text-xs text-red-600 mt-1">{validationStatus.errors.firstName}</p>}
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-white">Middle Name</Label>
                        <Input name="middleName" value={newStudent.middleName||''} onChange={e=> setNamePart('middleName', e.target.value)} className="mt-1" placeholder="e.g. Michael" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-white">Last Name <span className="text-red-500">*</span></Label>
                        <Input name="lastName" value={newStudent.lastName||''} onChange={e=> setNamePart('lastName', e.target.value)} required className={cn('mt-1', showFieldError('lastName') && 'border-red-500 focus-visible:ring-red-500')} placeholder="e.g. Doe" />
                        {showFieldError('lastName') && <p className="text-xs text-red-600 mt-1">{validationStatus.errors.lastName}</p>}
                      </div>
                      {/* Gender (searchable & creatable) */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-white">
                          Gender <span className="text-red-500">*</span>
                        </Label>
                        <GenderCombobox
                          value={newStudent.gender || ''}
                          onChange={(v)=> setNewStudent(p=>({...p, gender: v}))}
                          error={showFieldError('gender')}
                        />
                        {showFieldError('gender') && <p className="text-xs text-red-600 mt-1">{validationStatus.errors.gender}</p>}
                      </div>
                      <div>
                        <FormattedDateInput
                          id="dob"
                          label="Date of Birth"
                          value={newStudent.dob || ''}
                          onChange={(isoDate) => setNewStudent(p => ({...p, dob: isoDate}))}
                          required
                          error={showFieldError('dob')}
                          displayFormat="dd-MMM-yyyy"
                          placeholder="dd-mmm-yyyy"
                          max={todayLocal()}
                        />
                        {showFieldError('dob') && <p className="text-xs text-red-600 mt-1">{validationStatus.errors.dob}</p>}
                      </div>
                      <div className="md:col-span-2 lg:col-span-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <FormattedDateInput
                              id="registrationDate"
                              label="Registration Date"
                              value={newStudent.registrationDate || ''}
                              onChange={(isoDate) => setNewStudent(p => ({...p, registrationDate: isoDate}))}
                              required
                              error={showFieldError('registrationDate')}
                              displayFormat="dd-MMM-yyyy"
                              placeholder="dd-mmm-yyyy"
                            />
                            {showFieldError('registrationDate') && <p className="text-xs text-red-600 mt-1">{validationStatus.errors.registrationDate}</p>}
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-white">Email Address <span className="text-red-500">*</span></Label>
                            <Input name="email" type="email" value={newStudent.email||''} onChange={e=> setNewStudent(p=>({...p,email:e.target.value}))} required className={cn('mt-1', showFieldError('email') && 'border-red-500 focus-visible:ring-red-500')} placeholder="e.g. john@example.com" />
                            {showFieldError('email') && <p className="text-xs text-red-600 mt-1">{validationStatus.errors.email}</p>}
                          </div>
                        </div>
                      </div>
                      <div className="md:col-span-2 lg:col-span-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="">
                            <div className="relative">
                              <Label className="text-sm font-medium text-gray-700 dark:text-white">Course of Interest <span className="text-red-500">*</span></Label>
                              <span ref={courseMeasureRef} className="invisible absolute -z-10 whitespace-nowrap px-3 py-2 text-sm" />
                              <CourseSearchCombobox
                                value={newStudent.courseOfInterestId || ''}
                                onChange={handleCourseSelect}
                                courses={courseList}
                                loading={isLoadingCourses || !!coursesLoading}
                                error={error}
                                width={courseSelectWidth}
                                hasError={showFieldError('courseOfInterestId')}
                                onCourseDraftCreated={handleCourseDraftCreated}
                                onRefresh={reloadCourses}
                              />
                              {showFieldError('courseOfInterestId') && <p className="text-xs text-red-600 mt-1">{validationStatus.errors.courseOfInterestId}</p>}
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-white">Country <span className="text-red-500">*</span></Label>
                            <CountrySelect
                              country={(newStudent as any).country || ''}
                              onChange={(code, name) => handleCountryChange(code, name)}
                              hasError={showFieldError('country')}
                            />
                            {showFieldError('country') && <p className="text-xs text-red-600 mt-1">{validationStatus.errors.country}</p>}
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-white">Mobile Number <span className="text-red-500">*</span></Label>
                            <div className="flex gap-2 mt-1">
                              <PhoneCountryCodeSelect value={countryCode} onChange={handlePhoneCodeChange} />
                              <Input 
                                name="mobile"
                                value={newStudent.mobile||''} 
                                onChange={e=> setNewStudent(p=>({...p,mobile:e.target.value}))} 
                                required 
                                className={cn('flex-1', showFieldError('mobile') && 'border-red-500 focus-visible:ring-red-500')} 
                                placeholder="e.g. 9876543210"
                                type="tel"
                                maxLength={15}
                              />
                            </div>
                            {showFieldError('mobile') && <p className="text-xs text-red-600 mt-1">{validationStatus.errors.mobile}</p>}
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-white">State/Province <span className="text-red-500">*</span></Label>
                            <StateSelect
                              countryName={selectedCountryName}
                              state={(newStudent as any).stateProvince || ''}
                              onChange={(st)=> setNewStudent(p=> ({...p, stateProvince: st}))}
                              hasError={showFieldError('stateProvince')}
                            />
                            {showFieldError('stateProvince') && <p className="text-xs text-red-600 mt-1">{validationStatus.errors.stateProvince}</p>}
                          </div>
                        </div>
                      </div>
                      <div className="md:col-span-2 lg:col-span-3">
                        <Label className="text-sm font-medium text-gray-700 dark:text-white">Address</Label>
                        <Textarea name="address" value={newStudent.address||''} onChange={e=> setNewStudent(p=>({...p,address:e.target.value}))} className={cn('mt-1 w-full', showFieldError('address') && 'border-red-500 focus-visible:ring-red-500')} rows={3} placeholder="e.g. 123 Main St, City" />
                        {showFieldError('address') && <p className="text-xs text-red-600 mt-1">{validationStatus.errors.address}</p>}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="course-details">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                      
                      <div className="space-y-2">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-white">Course (Enrolled)</Label>
                          <CourseSearchCombobox
                            value={(newStudent as any).enrolledCourse || ''}
                            onChange={(courseId)=> {
                              if(courseId.startsWith('__placeholder__')) return;
                              
                              // Handle clearing the enrolled course
                              if (!courseId || courseId === '') {
                                setNewStudent(p=>({
                                  ...p,
                                  enrolledCourse: '',
                                  enrolledCourseName: '',
                                  cohortId: '', // Clear cohort when enrolled course is removed
                                  courseStartDate: '' // Clear course start date too
                                }));
                                console.log('??? Cleared enrolled course and cohort');
                                return;
                              }
                              
                              const sel = courseList.find(c=>c.id===courseId);
                              if (sel) {
                                setNewStudent(p=>({
                                  ...p,
                                  enrolledCourse: courseId,
                                  enrolledCourseName: sel.name || p.enrolledCourseName,
                                  cohortId: '', // Clear cohort when enrolled course changes
                                  courseStartDate: '' // Clear course start date when course changes
                                }));
                                console.log('? Selected enrolled course and cleared cohort:', {
                                  courseName: sel.name,
                                  clearedCohort: true,
                                  clearedStartDate: true
                                });
                              }
                            }}
                            courses={courseList.filter(c => c.status === 'Active' || c.status === 'Upcoming')}
                            loading={isLoadingCourses || !!coursesLoading}
                            error={error}
                            width={undefined}
                            hasError={false}
                            onCourseDraftCreated={handleCourseDraftCreated}
                            onRefresh={reloadCourses}
                          />
                        </div>
                        <div><Label className="text-sm font-medium text-gray-700 dark:text-white">Cohorts</Label>
                          <CohortSearchCombobox
                            value={newStudent.cohortId || ''}
                            onChange={(cohortId)=> {
                              // Find the selected cohort
                              const selectedCohort = cohortList.find(c => c.id === cohortId);
                              
                              // Auto-fill course start date from cohort (always update since field is read-only)
                              if (selectedCohort && selectedCohort.startDate) {
                                setNewStudent(p => ({
                                  ...p,
                                  cohortId: cohortId,
                                  courseStartDate: selectedCohort.startDate
                                }));
                                console.log('? Auto-filled course start date from cohort:', selectedCohort.startDate);
                              } else {
                                setNewStudent(p => ({...p, cohortId: cohortId}));
                              }
                            }}
                            cohorts={cohortList}
                            loading={cohortsLoading}
                            disabled={!(newStudent as any).enrolledCourse}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <FormattedDateInput
                              id="courseStartDate"
                              label="Course Start Date"
                              value={newStudent.courseStartDate || ''}
                              onChange={(isoDate) => setNewStudent(p => ({...p, courseStartDate: isoDate}))}
                              disabled
                              displayFormat="dd-MMM-yyyy"
                              placeholder="Auto-filled from cohort"
                              className="bg-gray-50 cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="communication">
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                    
                    <div className="space-y-2">
                      <div><Label className="text-sm font-medium text-gray-700 dark:text-white">Referred By</Label>
                        <ReferredByCombobox
                          value={newStudent.referredBy || ''}
                          onChange={(v)=> setNewStudent(p=>({...p,referredBy:v, ...(v!=='Student'? { referringStudentId:undefined, referringStudentName:undefined }: {}) }))}
                        />
                      </div>
                      {newStudent.referredBy==='Student' && <div><Label className="text-sm font-medium text-gray-700 dark:text-white">Select Referring Student</Label><Select value={newStudent.referringStudentId||''} onValueChange={v=> { const rs=students.find(s=>s.studentId===v || s.id===v); if(rs) setNewStudent(p=>({...p,referringStudentId:rs.studentId || rs.id, referringStudentName: rs.name })); }}><SelectTrigger className="mt-1"><SelectValue placeholder={studentsLoading ? "Loading students..." : "Select student"} /></SelectTrigger><SelectContent>{studentsLoading ? <SelectItem value="__placeholder__loading" disabled>Loading students...</SelectItem> : students.length === 0 ? <SelectItem value="__placeholder__no_students" disabled>No students found</SelectItem> : students.map(s=> <SelectItem key={s.studentId || s.id} value={s.studentId || s.id || ''}>{(s.studentId || s.id)} - {s.name}</SelectItem>)}</SelectContent></Select></div>}
                      <div><Label className="text-sm font-medium text-gray-700 dark:text-white mb-2 block">Communication Channels</Label><div className="grid grid-cols-3 gap-2">{['Email','SMS','WhatsApp'].map(ch=> { const checked=newStudent.communicationPreferences?.channels?.includes(ch)||false; return <div key={ch} className="flex items-center space-x-2"><Checkbox id={`comm-${ch}`} checked={checked} onCheckedChange={ck=> setNewStudent(p=> { const cur=p.communicationPreferences?.channels||[]; const channels=ck? [...cur,ch]: cur.filter(c=>c!==ch); return { ...p, communicationPreferences:{ enabled:true, channels } }; })} /><Label htmlFor={`comm-${ch}`} className="text-sm">{ch}</Label></div>; })}</div></div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="guardian-details">
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                   
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-white">First Name{isGuardianRequired() && <span className="text-red-500">*</span>}</Label>
                        <Input name="guardianFirstName" value={newStudent.guardianFirstName||''} onChange={e=> updateGuardianName('guardianFirstName', e.target.value)} className={cn('mt-1', showFieldError('guardianFirstName') && 'border-red-500 focus-visible:ring-red-500')} />
                        {showFieldError('guardianFirstName') && <p className="text-xs text-red-600 mt-1">{validationStatus.errors.guardianFirstName}</p>}
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-white">Middle Name</Label>
                        <Input name="guardianMiddleName" value={newStudent.guardianMiddleName||''} onChange={e=> updateGuardianName('guardianMiddleName', e.target.value)} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-white">Last Name{isGuardianRequired() && <span className="text-red-500">*</span>}</Label>
                        <Input name="guardianLastName" value={newStudent.guardianLastName||''} onChange={e=> updateGuardianName('guardianLastName', e.target.value)} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-white">Relationship{isGuardianRequired() && <span className="text-red-500">*</span>}</Label>
                        <RelationshipCombobox
                          value={newStudent.guardian.relationship || ''}
                          onChange={(v)=> updateGuardian({ relationship: v })}
                        />
                        {showFieldError('guardianRelationship') && <p className="text-xs text-red-600 mt-1">{validationStatus.errors.guardianRelationship}</p>}
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-white">Contact Number{isGuardianRequired() && <span className="text-red-500">*</span>}</Label>
                        <div className="flex gap-2 mt-1">
                          <PhoneCountryCodeSelect value={guardianCountryCode} onChange={handleGuardianPhoneCodeChange} />
                          <Input 
                            name="guardianContact"
                            value={newStudent.guardian.contact||''} 
                            onChange={e=> updateGuardian({ contact:e.target.value })} 
                            className={cn('flex-1', showFieldError('guardianContact') && 'border-red-500 focus-visible:ring-red-500')} 
                            placeholder="e.g. 9876543210"
                            type="tel"
                            maxLength={15}
                          />
                        </div>
                        {showFieldError('guardianContact') && <p className="text-xs text-red-600 mt-1">{validationStatus.errors.guardianContact}</p>}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <div className="flex justify-between items-center gap-4 pt-3 border-t border-gray-200">
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => handleDialogClose(false)}
                      className="border-gray-300 text-gray-600 dark:text-white hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                    {activeTab!=='student-info' && (
                      <Button type="button" variant="outline" onClick={prevTab}>Previous</Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={saveDraft} disabled={isSavingDraft} className="h-10 gap-2 border border-purple-300/70 bg-white text-purple-600 hover:bg-purple-50 hover:text-purple-700 font-medium disabled:opacity-60 disabled:cursor-not-allowed">
                      <Save className="w-4 h-4" />
                      <span className="text-sm">{currentDraftId ? 'Update Draft' : 'Save Draft'}</span>
                    </Button>
                    {activeTab!==tabKeys[tabKeys.length-1]
                      ? <Button type="button" className="bg-[#8A2BE2] hover:bg-[#7A1FD2]" onClick={nextTab}>Next</Button>
                      : <div className="flex flex-col items-end gap-1" onClick={()=> { if(!validationStatus.valid) { // expose all invalid fields and jump
                          setErrorFields(new Set(Object.keys(validationStatus.errors||{})));
                          const order=['firstName','lastName','email','dob','mobile','gender','address','courseOfInterestId','guardianFirstName','guardianRelationship','guardianContact'];
                          const first=order.find(f=> validationStatus.errors?.[f]);
                          if(first){ const map:any={ firstName:'student-info', lastName:'student-info', email:'student-info', dob:'student-info', mobile:'student-info', gender:'student-info', address:'student-info', courseOfInterestId:'student-info', guardianFirstName:'guardian-details', guardianRelationship:'guardian-details', guardianContact:'guardian-details' }; setActiveTab(map[first]||'student-info'); setTimeout(()=>{ const el=document.querySelector(`[name="${first}"]`) as HTMLElement|null; el?.focus(); },40); }
                        } }}>
                          <Button 
                            type="submit" 
                            disabled={!validationStatus.valid}
                            className="bg-[#8A2BE2] hover:bg-[#7A1FD2] disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                            title={!validationStatus.valid ? "Please fill in all required fields to continue" : undefined}
                          >
                            {draftId ? 'Create Student' : (initialStudent ? 'Save Changes' : 'Add Student')}
                          </Button>
                        </div>
                    }
                  </div>
                </div>
              </form>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Dialog */}
      <Dialog open={showUnsavedDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-md" data-no-close>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Unsaved Changes</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-white mt-2">
              You have unsaved changes in your student form. What would you like to do?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={handleContinueEditing}
              className="flex-1"
            >
              Continue Editing
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSaveAsDraft}
              disabled={isSavingDraft}
              className="flex-1 border-purple-300 text-purple-600 hover:bg-purple-50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Save as Draft
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDiscardChanges}
              className="flex-1"
            >
              Discard Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Course Draft Created Popup */}
      <Dialog open={showCourseDraftPopup} onOpenChange={setShowCourseDraftPopup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#8A2BE2]">Course Draft Created!</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-white mt-2">
              A course draft has been successfully created with the name "<strong className="text-[#8A2BE2]">{createdCourseName}</strong>" and level "<strong className="text-[#DE7D14]">{createdCourseLevel}</strong>".
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-orange-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-700">
              Do you want to check and manage your course drafts?
            </p>
          </div>
          <div className="flex gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowCourseDraftPopup(false)}
              className="flex-1 border-purple-300 text-purple-600 hover:bg-purple-50"
            >
              No, Continue
            </Button>
            <Button 
              onClick={() => {
                window.open('https://uniq-brio-service.vercel.app/services/courses', '_blank');
                setShowCourseDraftPopup(false);
              }}
              className="flex-1 bg-gradient-to-r from-[#8A2BE2] to-[#DE7D14] hover:from-[#7A1FD2] hover:to-[#C96D0A] text-white"
            >
              Yes, Check Courses
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Validation Alert Dialog */}
      
    </>
  );
}
