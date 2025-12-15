"use client"

import { useState } from "react"
import { useCustomColors } from "@/lib/use-custom-colors"
import { format } from "date-fns"
import { Label } from "@/components/dashboard/ui/label"
import { Input } from "@/components/dashboard/ui/input"
import { Button } from "@/components/dashboard/ui/button"
import { Switch } from "@/components/dashboard/ui/switch"
import { Separator } from "@/components/dashboard/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import { X, Smartphone, Mail, MessageCircle, ChevronDown } from "lucide-react"
import { CaretSortIcon } from "@radix-ui/react-icons"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
} from "@/components/dashboard/ui/dropdown-menu"

interface ScheduleTabProps {
  formData: any
  onFormChange: (field: string, value: any) => void
  showDeleteConfirmation?: (title: string, description: string, onConfirm: () => void, itemName: string) => void
}

export default function ScheduleTab({ 
  formData, 
  onFormChange,
  showDeleteConfirmation = () => {}
}: ScheduleTabProps) {
  const { primaryColor, secondaryColor } = useCustomColors();
  const [reminderTypeSearch, setReminderTypeSearch] = useState('');
  const defaultReminderTypes = ['class', 'exam', 'assignment', 'workshop'];
  
  // Date input focus states for custom formatting display
  const [startDateFocused, setStartDateFocused] = useState(false);
  const [endDateFocused, setEndDateFocused] = useState(false);

  // Helper function to format dates for display
  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'dd-MMM-yy');
    } catch {
      return dateStr;
    }
  };
  
  const updateSchedulePeriod = (field: string, value: string) => {
    const currentStartDate = field === 'startDate' ? value : formData.schedulePeriod?.startDate;
    const currentEndDate = field === 'endDate' ? value : formData.schedulePeriod?.endDate;
    
    // Always update the field value, regardless of validation
    const updated = { ...formData.schedulePeriod, [field]: value };

    // Calculate totalWeeks only if both dates are present and valid
    if (currentStartDate && currentEndDate) {
      const startDate = new Date(currentStartDate);
      const endDate = new Date(currentEndDate);

      // Check if both dates are valid and end date is after start date
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate <= endDate) {
        const diffTime = endDate.getTime() - startDate.getTime();
        // Add 1 to make the period inclusive and round to handle DST
        const durationInDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
        updated.totalWeeks = Math.ceil(durationInDays / 7);
      } else {
        updated.totalWeeks = 0;
      }
    } else {
      updated.totalWeeks = 0;
    }
    onFormChange('schedulePeriod', updated);
  };

  const updateSessionDetails = (field: string, value: string) => {
    const updated = { ...formData.sessionDetails, [field]: value };
    onFormChange('sessionDetails', updated);
  };

  const validateTimeRange = (startTime: string, endTime: string): boolean => {
    if (!startTime || !endTime) return true;
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    if (startHours > endHours) return false;
    if (startHours === endHours && startMinutes >= endMinutes) return false;
    return true;
  };

  const updateFrequencies = (frequencies: any[]) => {
    onFormChange('frequencies', frequencies);
  };

  const updateReminderSettings = (field: string, value: any) => {
    const updated = { ...formData.reminderSettings, [field]: value };
    onFormChange('reminderSettings', updated);
  };

  return (
    <div className="space-y-2 sm:space-y-3 md:space-y-4 compact-form px-2 sm:px-0">
      {/* Schedule Period */}
      <div className="mb-2 sm:mb-3">
        <h4 className="font-medium mb-1 sm:mb-1.5 text-xs sm:text-sm">Schedule Period</h4>
        <div className={`grid grid-cols-1 ${formData.courseCategory === 'Ongoing Training' ? 'md:grid-cols-1' : 'md:grid-cols-3'} gap-2`}>
          <div>
            <Label className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">
              Start Date <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type="date"
                value={formData.schedulePeriod?.startDate || ''}
                onChange={e => updateSchedulePeriod('startDate', e.target.value)}
                onFocus={() => setStartDateFocused(true)}
                onBlur={() => setStartDateFocused(false)}
                className={`border rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:border-transparent ${
                  !formData.schedulePeriod?.startDate 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300'
                } ${startDateFocused || !formData.schedulePeriod?.startDate ? '' : 'text-transparent'}`}
                style={!formData.schedulePeriod?.startDate ? undefined : { borderColor: '#d1d5db' }}
                onFocusCapture={(e) => {
                  if (formData.schedulePeriod?.startDate) {
                    e.currentTarget.style.borderColor = primaryColor;
                    e.currentTarget.style.boxShadow = `0 0 0 1px ${primaryColor}66`;
                  }
                }}
                onBlurCapture={(e) => {
                  if (formData.schedulePeriod?.startDate) {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                  setStartDateFocused(false);
                }}
                required
              />
              {!startDateFocused && formData.schedulePeriod?.startDate && (
                <div className="absolute inset-0 flex items-center px-2 sm:px-3 text-xs sm:text-sm pointer-events-none text-gray-900 dark:text-white">
                  {formatDateForDisplay(formData.schedulePeriod.startDate)}
                </div>
              )}
            </div>
          </div>
          
          {formData.courseCategory !== 'Ongoing Training' && (
            <>
              <div>
                <Label className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">
                  End Date <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={formData.schedulePeriod?.endDate || ''}
                    onChange={e => updateSchedulePeriod('endDate', e.target.value)}
                    onFocus={() => setEndDateFocused(true)}
                    onBlur={() => setEndDateFocused(false)}
                    className={`border rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:border-transparent ${
                      !formData.schedulePeriod?.endDate 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    } ${endDateFocused || !formData.schedulePeriod?.endDate ? '' : 'text-transparent'}`}
                    style={!formData.schedulePeriod?.endDate ? undefined : { borderColor: '#d1d5db' }}
                    onFocusCapture={(e) => {
                      if (formData.schedulePeriod?.endDate) {
                        e.currentTarget.style.borderColor = primaryColor;
                        e.currentTarget.style.boxShadow = `0 0 0 1px ${primaryColor}66`;
                      }
                    }}
                    onBlurCapture={(e) => {
                      if (formData.schedulePeriod?.endDate) {
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                      setEndDateFocused(false);
                    }}
                    required
                  />
                  {!endDateFocused && formData.schedulePeriod?.endDate && (
                    <div className="absolute inset-0 flex items-center px-2 sm:px-3 text-xs sm:text-sm pointer-events-none text-gray-900 dark:text-white">
                      {formatDateForDisplay(formData.schedulePeriod.endDate)}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Course Duration (weeks)</Label>
                <Input
                  type="number"
                  min="0"
                  value={
                    formData.schedulePeriod?.startDate && formData.schedulePeriod?.endDate
                      ? formData.schedulePeriod?.totalWeeks || 0
                      : 0
                  }
                  readOnly
                  className="bg-gray-100 cursor-not-allowed border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
                />
              </div>
            </>
          )}
        </div>
        
        {formData.courseCategory === 'Ongoing Training' && formData.schedulePeriod?.startDate && (
          <p className="text-[10px] sm:text-xs text-gray-600 dark:text-white mt-1.5 sm:mt-2">
            This ongoing training program starts on {formatDateForDisplay(formData.schedulePeriod.startDate)} and continues with monthly billing.
          </p>
        )}
        
        {formData.courseCategory !== 'Ongoing Training' && formData.schedulePeriod?.startDate && formData.schedulePeriod?.endDate && (
          <>
            {(() => {
              const startDate = new Date(formData.schedulePeriod.startDate);
              const endDate = new Date(formData.schedulePeriod.endDate);
              const isStartValid = !isNaN(startDate.getTime());
              const isEndValid = !isNaN(endDate.getTime());
              
              if (!isStartValid || !isEndValid) {
                return (
                  <p className="text-red-500 text-xs sm:text-sm mt-1.5 sm:mt-2">Please enter valid dates</p>
                );
              }
              
              if (startDate > endDate) {
                return (
                  <p className="text-red-500 text-xs sm:text-sm mt-1.5 sm:mt-2">Start date cannot be after end date</p>
                );
              }
              
              return null;
            })()}
          </>
        )}
      </div>

      {/* Session Details */}
      <div className="mb-2 sm:mb-3">
        <h4 className="font-medium mb-1 sm:mb-1.5 text-xs sm:text-sm">Session Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
          <div>
            <Label className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Session Duration (hours)</Label>
            <Input 
              type="number" 
              min="1" 
              step="0.5" 
              value={formData.sessionDetails?.sessionDuration || ''} 
              onKeyDown={e => {
                if (e.key === '-') {
                  e.preventDefault();
                }
                // Allow clearing the field with backspace/delete
                if ((e.key === 'Backspace' || e.key === 'Delete') && e.currentTarget.value.length === 1) {
                  updateSessionDetails('sessionDuration', '');
                  e.preventDefault();
                }
              }}
              onChange={e => {
                const value = e.target.value;
                // Allow empty value for clearing
                if (value === '') {
                  updateSessionDetails('sessionDuration', '');
                  return;
                }
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && numValue > 0) {
                  updateSessionDetails('sessionDuration', numValue.toString());
                }
              }} 
              className="border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:border-transparent" 
              onFocus={(e) => {
                e.currentTarget.style.borderColor = primaryColor;
                e.currentTarget.style.boxShadow = `0 0 0 2px ${primaryColor}40`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '';
                e.currentTarget.style.boxShadow = '';
              }}
            />
          </div>
          <div>
            <Label className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Max Sessions in a week</Label>
            <Input 
              type="number" 
              min="1" 
              value={formData.sessionDetails?.maxClasses || ''} 
              onKeyDown={e => {
                if (e.key === '-') {
                  e.preventDefault();
                }
                // Allow clearing the field with backspace/delete
                if ((e.key === 'Backspace' || e.key === 'Delete') && e.currentTarget.value.length === 1) {
                  updateSessionDetails('maxClasses', '');
                  e.preventDefault();
                }
              }}
              onChange={e => {
                const value = e.target.value;
                // Allow empty value for clearing
                if (value === '') {
                  updateSessionDetails('maxClasses', '');
                  return;
                }
                const numValue = parseInt(value);
                if (!isNaN(numValue) && numValue > 0) {
                  updateSessionDetails('maxClasses', numValue.toString());
                }
              }} 
              className="border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:border-transparent" 
              onFocus={(e) => {
                e.currentTarget.style.borderColor = primaryColor;
                e.currentTarget.style.boxShadow = `0 0 0 2px ${primaryColor}40`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '';
                e.currentTarget.style.boxShadow = '';
              }}
            />
          </div>
        </div>
      </div>

      {/* Schedule Frequency */}
      <div className="mb-2 sm:mb-3">
        <div className="flex justify-between items-center mb-1 sm:mb-1.5">
          <h4 className="font-medium text-xs sm:text-sm">Schedule Frequencies</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-xs"
            onClick={() => updateFrequencies([
              ...(formData.frequencies || []),
              { days: [], start: '', end: '', sessions: '' }
            ])}
          >
            + Add Frequency
          </Button>
        </div>
        {(formData.frequencies && formData.frequencies.length > 0)
          ? formData.frequencies.map((freq: any, idx: number) => (
              <div key={`frequency-${idx}-${freq.name || freq.type || 'new'}`} className="border rounded-lg p-2 sm:p-3 bg-gray-50 mb-2 sm:mb-3 relative text-[10px] sm:text-xs">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Use setTimeout to ensure this runs after any current state updates
                          setTimeout(() => {
                            showDeleteConfirmation(
                              "Remove Frequency",
                              "Are you sure you want to remove this frequency schedule?",
                              () => {
                                updateFrequencies(formData.frequencies.filter((_: any, i: number) => i !== idx));
                              },
                              `Schedule ${idx + 1}`
                            );
                          }, 0);
                        }}
                        aria-label="Remove Frequency"
                      >
                        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Remove Frequency</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <label key={day} className="flex items-center gap-1 text-[10px] sm:text-xs">
                      <input
                        type="checkbox"
                        checked={freq.days?.includes(day) || false}
                        onChange={e => {
                          const checked = e.target.checked;
                          const updated = formData.frequencies.map((fr: any, i: number) =>
                            i === idx
                              ? {
                                  ...fr,
                                  days: checked
                                    ? [...(fr.days || []), day]
                                    : (fr.days || []).filter((d: string) => d !== day)
                                }
                              : fr
                          );
                          updateFrequencies(updated);
                        }}
                      />
                      {day}
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 sm:gap-3 items-end">
                  <div>
                    <Label className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Start Time</Label>
                    <div className="space-y-0.5 sm:space-y-1">
                      <Input
                        type="time"
                        value={freq.start || ''}
                        onChange={e => {
                          const newStartTime = e.target.value;
                          if (!validateTimeRange(newStartTime, freq.end)) {
                            return; // Don't update if start time is after end time
                          }
                          const updated = formData.frequencies.map((fr: any, i: number) =>
                            i === idx ? { ...fr, start: newStartTime } : fr
                          );
                          updateFrequencies(updated);
                        }}
                        className="border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-transparent"
                      />
                      {freq.start && freq.end && !validateTimeRange(freq.start, freq.end) && (
                        <p className="text-red-500 text-[9px] sm:text-xs">Start time must be before end time</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">End Time</Label>
                    <div className="space-y-0.5 sm:space-y-1">
                      <Input
                        type="time"
                        value={freq.end || ''}
                        onChange={e => {
                          const newEndTime = e.target.value;
                          if (!validateTimeRange(freq.start, newEndTime)) {
                            return; // Don't update if end time is before start time
                          }
                          const updated = formData.frequencies.map((fr: any, i: number) =>
                            i === idx ? { ...fr, end: newEndTime } : fr
                          );
                          updateFrequencies(updated);
                        }}
                        className="border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs focus:outline-none focus:ring-1 focus:border-transparent"
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = primaryColor;
                          e.currentTarget.style.boxShadow = `0 0 0 2px ${primaryColor}40`;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '';
                          e.currentTarget.style.boxShadow = '';
                        }}
                      />
                      {freq.start && freq.end && !validateTimeRange(freq.start, freq.end) && (
                        <p className="text-red-500 text-[9px] sm:text-xs">End time must be after start time</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Sessions (per day)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={freq.sessions || ''}
                      onKeyDown={e => {
                        if (e.key === '-') {
                          e.preventDefault();
                        }
                        // Allow clearing the field with backspace/delete
                        if ((e.key === 'Backspace' || e.key === 'Delete') && e.currentTarget.value.length === 1) {
                          const updated = formData.frequencies.map((fr: any, i: number) =>
                            i === idx ? { ...fr, sessions: '' } : fr
                          );
                          updateFrequencies(updated);
                          e.preventDefault();
                        }
                      }}
                      onChange={e => {
                        const value = e.target.value;
                        // Allow empty value for clearing
                        if (value === '') {
                          const updated = formData.frequencies.map((fr: any, i: number) =>
                            i === idx ? { ...fr, sessions: '' } : fr
                          );
                          updateFrequencies(updated);
                          return;
                        }
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue > 0) {
                          const updated = formData.frequencies.map((fr: any, i: number) =>
                            i === idx ? { ...fr, sessions: numValue.toString() } : fr
                          );
                          updateFrequencies(updated);
                        }
                      }}
                      className="border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs focus:outline-none focus:ring-1 focus:border-transparent"
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = primaryColor;
                        e.currentTarget.style.boxShadow = `0 0 0 2px ${primaryColor}40`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '';
                        e.currentTarget.style.boxShadow = '';
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          : (
              <div className="border rounded-lg p-2 sm:p-3 bg-gray-50 mb-2 sm:mb-3 relative text-[10px] sm:text-xs">
                <div className="mb-0.5 sm:mb-1 font-medium">No frequencies added yet.</div>
              </div>
          )}
      </div>

      <Separator />

      {/* Reminder Schedule Section */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-xs sm:text-sm">Reminder Schedule</h4>
          {(formData.frequencies && formData.frequencies.length > 0) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-xs"
              onClick={() => {
                const updated = [
                  ...(formData.reminderSettings?.customSchedule || []),
                  { type: 'class', daysBefore: '', hoursBefore: '', timeOfDay: '', enabled: true }
                ];
                updateReminderSettings('customSchedule', updated);
              }}
            >+ Add Reminder</Button>
          )}
        </div>
        {(formData.frequencies && formData.frequencies.length > 0) && (
          <>
            {formData.reminderSettings?.customSchedule?.map((reminder: any, idx: number) => (
              <div key={`reminder-${idx}-${reminder.type || 'new'}`} className="border rounded-md p-1 sm:p-1.5 mb-1 sm:mb-1.5 flex flex-row gap-1.5 sm:gap-2 items-center relative text-[10px] sm:text-xs">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-28 sm:w-32 justify-between text-left text-[10px] sm:text-xs py-1 sm:py-1.5 px-1.5 sm:px-2"
                    >
                      {reminder.type || 'Select Type'}
                      <ChevronDown className="ml-0.5 sm:ml-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40 p-0">
                    <div className="flex items-center border-b px-2 py-1">
                      
                      <input
                        type="text"
                        placeholder="Search or add type..."
                        value={reminderTypeSearch}
                        onChange={(e) => {
                          e.stopPropagation();
                          setReminderTypeSearch(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="flex h-5 sm:h-6 w-full rounded-md border border-input px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                    <DropdownMenuGroup>
                      {defaultReminderTypes
                        .filter(type => type.toLowerCase().includes(reminderTypeSearch.toLowerCase()))
                        .map(type => (
                          <DropdownMenuItem
                            key={type}
                            onClick={() => {
                              const updated = [...(formData.reminderSettings?.customSchedule || [])];
                              updated[idx].type = type;
                              updateReminderSettings('customSchedule', updated);
                              setReminderTypeSearch('');
                            }}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </DropdownMenuItem>
                        ))}
                      {reminderTypeSearch && !defaultReminderTypes.some(type => 
                        type.toLowerCase() === reminderTypeSearch.toLowerCase()
                      ) && (
                        <DropdownMenuItem
                          onClick={() => {
                            const updated = [...(formData.reminderSettings?.customSchedule || [])];
                            updated[idx].type = reminderTypeSearch;
                            updateReminderSettings('customSchedule', updated);
                            setReminderTypeSearch('');
                          }}
                        >
                          Add "{reminderTypeSearch}"
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                {reminder.type === 'other' && (
                    <Input
                      type="text"
                      value={reminder.customType || ''}
                      onChange={e => {
                        const updated = [...(formData.reminderSettings?.customSchedule || [])];
                        updated[idx].customType = e.target.value;
                        updateReminderSettings('customSchedule', updated);
                      }}
                      placeholder="Reminder type"
                      className="w-28 sm:w-32 border border-gray-300 rounded-md px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-xs focus:outline-none focus:ring-1 focus:border-transparent"
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = primaryColor;
                        e.currentTarget.style.boxShadow = `0 0 0 2px ${primaryColor}40`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '';
                        e.currentTarget.style.boxShadow = '';
                      }}
                    />
                )}
                <Input
                  type="number"
                  min="0"
                  value={reminder.daysBefore}
                  onKeyDown={e => {
                    if (e.key === '-') {
                      e.preventDefault();
                    }
                    // Allow clearing the field with backspace/delete
                    if ((e.key === 'Backspace' || e.key === 'Delete') && e.currentTarget.value.length === 1) {
                      const updated = [...(formData.reminderSettings?.customSchedule || [])];
                      updated[idx].daysBefore = '';
                      updateReminderSettings('customSchedule', updated);
                      e.preventDefault();
                    }
                  }}
                  onChange={e => {
                    const value = e.target.value;
                    // Allow empty value for clearing
                    if (value === '') {
                      const updated = [...(formData.reminderSettings?.customSchedule || [])];
                      updated[idx].daysBefore = '';
                      updateReminderSettings('customSchedule', updated);
                      return;
                    }
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue >= 0) {
                      const updated = [...(formData.reminderSettings?.customSchedule || [])];
                      updated[idx].daysBefore = numValue.toString();
                      updateReminderSettings('customSchedule', updated);
                    }
                  }}
                  placeholder="Days before"
                  className="w-20 sm:w-24 border border-gray-300 rounded-md px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-xs focus:outline-none focus:ring-1 focus:border-transparent"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = primaryColor;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${primaryColor}40`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '';
                    e.currentTarget.style.boxShadow = '';
                  }}
                />
                <Input
                  type="number"
                  min="0"
                  value={reminder.hoursBefore}
                  onKeyDown={e => {
                    if (e.key === '-') {
                      e.preventDefault();
                    }
                    // Allow clearing the field with backspace/delete
                    if ((e.key === 'Backspace' || e.key === 'Delete') && e.currentTarget.value.length === 1) {
                      const updated = [...(formData.reminderSettings?.customSchedule || [])];
                      updated[idx].hoursBefore = '';
                      updateReminderSettings('customSchedule', updated);
                      e.preventDefault();
                    }
                  }}
                  onChange={e => {
                    const value = e.target.value;
                    // Allow empty value for clearing
                    if (value === '') {
                      const updated = [...(formData.reminderSettings?.customSchedule || [])];
                      updated[idx].hoursBefore = '';
                      updateReminderSettings('customSchedule', updated);
                      return;
                    }
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue >= 0) {
                      const updated = [...(formData.reminderSettings?.customSchedule || [])];
                      updated[idx].hoursBefore = numValue.toString();
                      updateReminderSettings('customSchedule', updated);
                    }
                  }}
                  placeholder="Hours before"
                  className="w-20 sm:w-24 border border-gray-300 rounded-md px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-xs focus:outline-none focus:ring-1 focus:border-transparent"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = primaryColor;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${primaryColor}40`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '';
                    e.currentTarget.style.boxShadow = '';
                  }}
                />
                <Switch
                  checked={reminder.enabled}
                  onCheckedChange={checked => {
                    const updated = [...(formData.reminderSettings?.customSchedule || [])];
                    updated[idx].enabled = checked;
                    updateReminderSettings('customSchedule', updated);
                  }}
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="absolute top-1 sm:top-2 right-1 sm:right-2 text-red-500 hover:text-red-700"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          showDeleteConfirmation(
                            "Remove Reminder",
                            "Are you sure you want to remove this reminder schedule?",
                            () => {
                              const updated = (formData.reminderSettings?.customSchedule || []).filter((_: any, i: number) => i !== idx);
                              updateReminderSettings('customSchedule', updated);
                            },
                            `Reminder ${idx + 1}`
                          );
                        }}
                        aria-label="Remove Reminder"
                      >
                        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Remove Reminder</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))}
          </>
        )}
      </div>
       
      <Separator />
      
      <div className="space-y-2 sm:space-y-3">
        <h4 className="font-medium text-xs sm:text-sm">Notification Settings</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <div className="flex items-center space-x-1 sm:space-x-1.5 text-[10px] sm:text-xs">
            <Switch 
              id="pushNotifications" 
              checked={formData.reminderSettings?.pushEnabled || false}
              onCheckedChange={(checked) => updateReminderSettings('pushEnabled', checked)}
            />
            <Label htmlFor="pushNotifications" className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs">
              <Smartphone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              In App 
            </Label>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-1.5 text-[10px] sm:text-xs">
            <Switch 
              id="smsNotifications" 
              checked={formData.reminderSettings?.smsEnabled || false}
              onCheckedChange={(checked) => updateReminderSettings('smsEnabled', checked)}
            />
            <Label htmlFor="smsNotifications" className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs">
              <MessageCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              SMS 
            </Label>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-1.5 text-[10px] sm:text-xs">
            <Switch 
              id="whatsappNotifications" 
              checked={formData.reminderSettings?.whatsappEnabled || false}
              onCheckedChange={(checked) => updateReminderSettings('whatsappEnabled', checked)}
            />
            <Label htmlFor="whatsappNotifications" className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs">
              <Smartphone className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-500" />
              WhatsApp 
            </Label>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-1.5 text-[10px] sm:text-xs">
            <Switch 
              id="emailNotifications" 
              checked={formData.reminderSettings?.emailEnabled || false}
              onCheckedChange={(checked) => updateReminderSettings('emailEnabled', checked)}
            />
            <Label htmlFor="emailNotifications" className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs">
              <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Email 
            </Label>
          </div>
        </div>
      </div>
    </div>
  )
}
