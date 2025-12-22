"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/dashboard/ui/label"
import { Input } from "@/components/dashboard/ui/input"
import { Button } from "@/components/dashboard/ui/button"
import { Textarea } from "@/components/dashboard/ui/textarea"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Separator } from "@/components/dashboard/ui/separator"
import { toast } from "@/hooks/dashboard/use-toast"
import { Save, X, Pencil, ChevronDown, RefreshCcw } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/dashboard/ui/dropdown-menu"
import InstructorDropdown from "@/components/dashboard/ui/instructor-dropdown"

interface BasicInfoTabProps {
  formData: any
  onFormChange: (field: string, value: any) => void
  instructorOptions?: any[]
  courseTypeOptions?: string[]
  tagOptions?: string[]
  freeGiftOptions?: string[]
  showDeleteConfirmation?: (title: string, description: string, onConfirm: () => void, itemName: string) => void
  allowManualCourseId?: boolean
  onGenerateCourseId?: () => void
  courseIdHint?: string
  errorFields?: string[]
  clearErrorField?: (field: string) => void
}

export default function BasicInfoTab({ 
  formData, 
  onFormChange,
  instructorOptions = [],
  courseTypeOptions = ['Online', 'Offline', 'Hybrid'],
  tagOptions = ['Art', 'Painting', 'Music', 'Dance', 'Sports', 'Technology', 'Science'],
  freeGiftOptions = ['Badge', 'Keychain', 'Certificate', 'T-Shirt', 'Stickers'],
  showDeleteConfirmation = () => {},
  allowManualCourseId = false,
  onGenerateCourseId,
  courseIdHint,
  errorFields = [],
  clearErrorField
}: BasicInfoTabProps) {
  
  const [searchTerm, setSearchTerm] = useState('')
  const [freeGiftSearchTerm, setFreeGiftSearchTerm] = useState('')
  const [levelSearchTerm, setLevelSearchTerm] = useState('')
  const [typeSearchTerm, setTypeSearchTerm] = useState('')
  const [categorySearchTerm, setCategorySearchTerm] = useState('')

  const [locationSearchTerm, setLocationSearchTerm] = useState('')
  const [statusSearchTerm, setStatusSearchTerm] = useState('')
  
  // Error states for inline validation
  const [courseNameError, setCourseNameError] = useState('')
  const [descriptionError, setDescriptionError] = useState('')
  const [levelError, setLevelError] = useState('')
  const [typeError, setTypeError] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [locationError, setLocationError] = useState('')
  const [statusError, setStatusError] = useState('')
  const [tagsError, setTagsError] = useState('')
  const [guidelinesError, setGuidelinesError] = useState('')
  const [freeGiftsError, setFreeGiftsError] = useState('')
  const [faqQuestionError, setFaqQuestionError] = useState<{[key: string]: string}>({})
  const [faqAnswerError, setFaqAnswerError] = useState<{[key: string]: string}>({})

  // Comprehensive regex validation functions for all form fields
  
  // Course Name: Allow letters, numbers, spaces, hyphens, apostrophes, ampersands, and common symbols
  const validateCourseName = (name: string) => {
    const nameRegex = /^[a-zA-Z0-9\s\-'&.()]+$/;
    return name === '' || nameRegex.test(name);
  };

  // Instructor Name: Allow letters, spaces, hyphens, apostrophes, and periods (Dr., Mr., etc.)
  const validateInstructorName = (name: string) => {
    const instructorRegex = /^[a-zA-Z\s\-'.]+$/;
    return name === '' || instructorRegex.test(name);
  };

  // Location: Allow letters, numbers, spaces, hyphens, commas, and common address characters
  const validateLocation = (location: string) => {
    const locationRegex = /^[a-zA-Z0-9\s\-,./()#]+$/;
    return location === '' || locationRegex.test(location);
  };

  // Max Students: Allow only positive numbers
  const validateMaxStudents = (value: string) => {
    const maxStudentsRegex = /^[1-9][0-9]*$/;
    return value === '' || maxStudentsRegex.test(value);
  };

  // Description: Allow letters, numbers, spaces, and comprehensive punctuation
  const validateDescription = (description: string) => {
    const descRegex = /^[a-zA-Z0-9\s.,!?;:()\-_'"\n\r&@#%/\\[\]{}+=*]+$/;
    return description === '' || descRegex.test(description);
  };

  // Student Guidelines: Allow comprehensive text with formatting characters
  const validateGuidelines = (guidelines: string) => {
    const guidelinesRegex = /^[a-zA-Z0-9\s.,!?;:()\-_'"\n\r&@#%/\\[\]{}+=*•–—]+$/;
    return guidelines === '' || guidelinesRegex.test(guidelines);
  };

  // FAQ Content: Allow comprehensive text for questions and answers
  const validateFaqContent = (content: string) => {
    const faqRegex = /^[a-zA-Z0-9\s.,!?;:()\-_'"\n\r&@#%/\\[\]{}+=*]+$/;
    return content === '' || faqRegex.test(content);
  };

  // Tags: Allow letters, numbers, spaces, hyphens
  const validateTag = (tag: string) => {
    const tagRegex = /^[a-zA-Z0-9\s\-]+$/;
    return tag === '' || tagRegex.test(tag);
  };

  // URL Validation (for virtual classroom URLs)
  const validateUrl = (url: string) => {
    const urlRegex = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/;
    return url === '' || urlRegex.test(url);
  };

  // Price/Numbers: Allow only positive numbers with optional decimals
  const validatePrice = (price: string) => {
    const priceRegex = /^\d+(\.\d{1,2})?$/;
    return price === '' || priceRegex.test(price);
  };

  // Duration: Allow numbers with optional units (e.g., "8 weeks", "3 months")
  const validateDuration = (duration: string) => {
    const durationRegex = /^[0-9]+(\s*(weeks?|months?|days?|hours?))?$/i;
    return duration === '' || durationRegex.test(duration);
  };

  // Phone/Contact: Allow numbers, spaces, hyphens, parentheses, and plus sign
  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\d\s\-+()]+$/;
    return phone === '' || phoneRegex.test(phone);
  };

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return email === '' || emailRegex.test(email);
  };

  // Alphanumeric with special chars (for codes, IDs)
  const validateCode = (code: string) => {
    const codeRegex = /^[a-zA-Z0-9\-_]+$/;
    return code === '' || codeRegex.test(code);
  }

  const defaultStatusOptions = [
    "Active",
    "Draft",
    "Inactive",
    "Completed",
    "Cancelled",
    "Upcoming",
    "In Progress"
  ]

  const [locationOptions, setLocationOptions] = useState<string[]>([])
  const [locationsLoading, setLocationsLoading] = useState(true)
  
  // Dropdown options state
  const [levelOptions, setLevelOptions] = useState<string[]>([])
  const [typeOptions, setTypeOptions] = useState<string[]>([])
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])
  const [availableTagOptions, setAvailableTagOptions] = useState<string[]>([])
  const [availableFreeGiftOptions, setAvailableFreeGiftOptions] = useState<string[]>([])
  const [dropdownsLoading, setDropdownsLoading] = useState(true)
  
  const defaultCategoryOptions = [
    "Regular",
    "Special",
    "Ongoing Training"
  ]
  
  const defaultLevelOptions = [
    "Beginner",
    "Intermediate",
    "Advanced",
    "Expert",
    "Pro"
  ]

  // Fetch locations from API
  const fetchLocations = async () => {
    try {
      console.log('🔄 Fetching locations from API...')
      const response = await fetch('/api/dashboard/services/courses?locations=true', {
        credentials: 'include',
      })
      const data = await response.json()
      console.log('📍 Locations API response:', data)
      if (data.success) {
        setLocationOptions(data.locations)
        console.log('✅ Loaded', data.locations.length, 'locations:', data.locations)
      }
    } catch (error) {
      console.error('❌ Error fetching locations:', error)
      // Fallback to default locations if API fails
      setLocationOptions([
        "Studio A",
        "Pool Area",
        "Music Room",
        "Classroom 101",
        "Basketball Court",
        "Dance Studio",
        "Virtual - Zoom",
        "Virtual - Microsoft Teams",
        "Virtual - Google Meet",
        "Virtual - WebEx",
        "Virtual - Other"
      ])
    } finally {
      setLocationsLoading(false)
    }
  }

  // Fetch dropdown options from consolidated API
  const fetchDropdownOptions = async (type: string) => {
    try {
      console.log(`🔄 Fetching ${type} options from API...`)
      const response = await fetch(`/api/dashboard/services/courses?dropdown-options=true&type=${type}`, {
        credentials: 'include',
      })
      const data = await response.json()

      console.log(` ${type} API response:`, data)
      if (data.success) {
        return data.options || []
      }
    } catch (error) {
      console.error(`❌ Error fetching ${type} options:`, error)
    }
    return []
  }

  // Fetch all dropdown options
  const fetchAllDropdownOptions = async () => {
    try {
      setDropdownsLoading(true)
      const [levels, types, categories, tags, freeGifts] = await Promise.all([
        fetchDropdownOptions('levels'),
        fetchDropdownOptions('types'), 
        fetchDropdownOptions('categories'),
        fetchDropdownOptions('tags'),
        fetchDropdownOptions('freeGifts')
      ])
      
      setLevelOptions(levels)
      setTypeOptions(types)
      setCategoryOptions(categories)
      setAvailableTagOptions(tags)
      setAvailableFreeGiftOptions(freeGifts)
      
      console.log('✅ All dropdown options loaded')
    } catch (error) {
      console.error('❌ Error fetching dropdown options:', error)
      // Fallback to defaults
      setLevelOptions(defaultLevelOptions)
      setTypeOptions(courseTypeOptions)
      setCategoryOptions(defaultCategoryOptions)
      setAvailableTagOptions(tagOptions)
      setAvailableFreeGiftOptions(freeGiftOptions)
    } finally {
      setDropdownsLoading(false)
    }
  }

  // Add new dropdown option
  const addNewDropdownOption = async (type: string, value: string) => {
    try {
      console.log(`➕ Adding new ${type} option:`, value)
      const response = await fetch('/api/dashboard/services/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'add-dropdown-option', type, value }),
      })
      const data = await response.json()
      console.log(` Add ${type} API response:`, data)
      if (data.success) {
        // Refresh the specific dropdown options
        const updatedOptions = await fetchDropdownOptions(type)
        switch (type) {
          case 'levels':
            setLevelOptions(updatedOptions)
            break
          case 'types':
            setTypeOptions(updatedOptions)
            break
          case 'categories':
            setCategoryOptions(updatedOptions)
            break
          case 'tags':
            setAvailableTagOptions(updatedOptions)
            break
          case 'freeGifts':
            setAvailableFreeGiftOptions(updatedOptions)
            break
        }
        
        toast({
          title: `${type} Option Added`,
          description: `"${value}" has been added to the ${type} options.`,
        })
      }
    } catch (error) {
      console.error(`❌ Error adding ${type} option:`, error)
      toast({
        title: "Error",
        description: `Failed to add ${type} option. Please try again.`,
        variant: "destructive"
      })
    }
  }

  // Add new location to database and refresh list
  const addNewLocation = async (locationName: string) => {
    try {
      console.log('➕ Adding new location:', locationName)
      const response = await fetch('/api/dashboard/services/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'add-location', name: locationName }),
      })
      const data = await response.json()
      console.log('📍 Add location API response:', data)
      if (data.success) {
        // Refresh the location list
        console.log('🔄 Refreshing location list...')
        await fetchLocations()
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('locationAdded', {
          detail: { locationName }
        }))
        toast({
          title: "Location Added",
          description: `"${locationName}" has been added to the location list.`,
        })
      }
    } catch (error) {
      console.error('❌ Error adding location:', error)
      toast({
        title: "Error",
        description: "Failed to add location. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Fetch all options on component mount
  useEffect(() => {
    fetchLocations()
    fetchAllDropdownOptions()

    // Listen for location updates from other components
    const handleLocationAdded = (event: CustomEvent) => {
      console.log('🔔 Location added event received in course form:', event.detail)
      fetchLocations()
    }

    window.addEventListener('locationAdded', handleLocationAdded as EventListener)
    
    return () => {
      window.removeEventListener('locationAdded', handleLocationAdded as EventListener)
    }
  }, [])

  // Add a manual refresh function for locations
  const refreshLocations = () => {
    setLocationsLoading(true)
    fetchLocations()
  }

                                      return (
                                      <div className="space-y-2 sm:space-y-3 md:space-y-4 compact-form text-sm sm:text-[15px] pb-4 sm:pb-6 md:pb-8 px-2 sm:px-0">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 text-sm sm:text-[15px]">
                                            {/* Course ID (read-only, only if editing or available) */}
                                            {(allowManualCourseId || formData.courseId || formData.id) && (
                                              <div className="space-y-1 sm:space-y-1.5">
                                                <Label htmlFor="courseId" className="flex items-center justify-between text-xs sm:text-sm">
                                                  <span className="text-xs sm:text-sm">Course ID</span>
                                                  {courseIdHint && (
                                                    <span className="text-[10px] sm:text-[11px] text-gray-500 font-normal hidden sm:inline">{courseIdHint}</span>
                                                  )}
                                                </Label>
                                                <div className="flex gap-1.5 sm:gap-2">
                                                  <Input
                                                    id="courseId"
                                                    value={formData.courseId || formData.id || ''}
                                                    readOnly={!allowManualCourseId}
                                                    onChange={allowManualCourseId ? (e) => onFormChange('id', e.target.value) : undefined}
                                                    className={`${allowManualCourseId ? 'border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500' : 'bg-gray-100 cursor-not-allowed border border-gray-300'} rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-[15px]`}
                                                  />
                                                  {onGenerateCourseId && (
                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      size="icon"
                                                      className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 flex-shrink-0"
                                                      onClick={(event) => {
                                                        event.preventDefault()
                                                        onGenerateCourseId()
                                                      }}
                                                      title="Generate new Course ID"
                                                    >
                                                      <RefreshCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                    </Button>
                                                  )}
                                                </div>
                                                {allowManualCourseId ? (
                                                  <p className="text-[10px] sm:text-[11px] text-gray-500">Update the code to match offline or ERP IDs.</p>
                                                ) : (
                                                  <p className="text-[10px] sm:text-[11px] text-gray-500">Automatically generated based on your settings.</p>
                                                )}
                                              </div>
                                            )}
                                            <div>
                                              <Label htmlFor="courseName" className="mb-0.5 sm:mb-1 font-medium text-xs sm:text-sm">Course Name <span className="text-red-500">*</span></Label>
                                              <Input
                                                id="courseName"
                                                placeholder="Enter course name"
                                                value={formData.name || ''}
                                                onChange={e => {
                                                  const newValue = e.target.value;
                                                  if (validateCourseName(newValue)) {
                                                    onFormChange('name', newValue);
                                                    setCourseNameError('');
                                                    clearErrorField?.('name');
                                                  } else {
                                                    setCourseNameError('Only letters, numbers, spaces, hyphens, apostrophes, ampersands, and periods allowed');
                                                  }
                                                }}
                                                onBlur={() => {
                                                  if (!formData.name || !formData.name.trim()) {
                                                    setCourseNameError('Course name is required');
                                                  }
                                                }}
                                                className={`border rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-[15px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                                  courseNameError || errorFields.includes('name') ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                                                }`}
                                              />
                                              {(courseNameError || errorFields.includes('name')) && (
                                                <p className="text-red-500 text-[10px] sm:text-xs mt-0.5 sm:mt-1">{courseNameError || 'Course name is required'}</p>
                                              )}
                                            </div>
                                            <div>
                                              <Label htmlFor="status" className="mb-0.5 sm:mb-1 font-medium text-xs sm:text-sm">Course Status <span className="text-red-500">*</span></Label>
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button
                                                    variant="outline"
                                                    className={`w-full text-left justify-between text-sm sm:text-[15px] py-1 sm:py-1.5 px-2 sm:px-3 border-2 hover:bg-gray-50 hover:border-gray-400 focus:!border-purple-500 focus:!ring-2 focus:!ring-purple-500 focus:outline-none data-[state=open]:!border-purple-500 data-[state=open]:!ring-2 data-[state=open]:!ring-purple-500 ${errorFields.includes('status') ? 'border-red-500 focus:!ring-red-500 focus:!border-red-500' : ''}`}
                                                  >
                                                    {formData.status || 'Active'}
                                                    <ChevronDown className="ml-1 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-48 p-2 text-[15px]">
                                                  <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                                                    <Input
                                                      placeholder="Search status..."
                                                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                      value={statusSearchTerm}
                                                      onChange={e => {
                                                        const newValue = e.target.value;
                                                        // Only allow letters, spaces, and hyphens for status search
                                                        const statusRegex = /^[a-zA-Z\s\-]*$/;
                                                        if (statusRegex.test(newValue)) {
                                                          setStatusSearchTerm(newValue);
                                                          setStatusError('');
                                                        } else {
                                                          setStatusError('Only letters, spaces, and hyphens allowed');
                                                        }
                                                      }}
                                                      onKeyDown={(e) => e.stopPropagation()}
                                                    />
                                                    {statusError && (
                                                      <p className="text-red-500 text-xs mt-1">{statusError}</p>
                                                    )}
                                                  </div>
                                                  <div className="max-h-[120px] overflow-y-auto">
                                                    {defaultStatusOptions
                                                      .filter(status => status.toLowerCase().includes(statusSearchTerm.toLowerCase()))
                                                      .map(status => (
                                                        <DropdownMenuItem
                                                          key={status}
                                                          className={`px-4 py-2 cursor-pointer hover:bg-gray-100 text-[15px] ${
                                                            formData.status === status ? 'bg-purple-100' : ''
                                                          }`}
                                                          onSelect={() => {
                                                            onFormChange('status', status);
                                                            setStatusSearchTerm('');
                                                            clearErrorField?.('status');
                                                          }}
                                                        >
                                                          {status}
                                                        </DropdownMenuItem>
                                                      ))}
                                                  </div>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                                {errorFields.includes('status') && (
                                                  <p className="text-red-500 text-[10px] sm:text-xs mt-0.5">Status is required</p>
                                                )}
                                            </div>
                                            <div>
                                              <InstructorDropdown
                                                value={formData.instructorId}
                                                onValueChange={(instructorId) => {
                                                  // Find the instructor to get both ID and name
                                                  onFormChange('instructorId', instructorId)
                                                  // Also store the instructor name for backward compatibility
                                                  fetch(`/api/dashboard/services/user-management/instructors?fields=minimal`, {
                                                    credentials: 'include',
                                                  })
                                                    .then(res => res.json())
                                                    .then(data => {
                                                      if (data.success) {
                                                        const instructor = data.instructors.find((inst: any) => inst.id === instructorId)
                                                        if (instructor) {
                                                          onFormChange('instructor', instructor.name)
                                                        }
                                                      }
                                                    })
                                                    .catch(console.error)
                                                }}
                                                label="Instructor"
                                                placeholder="Select instructor"
                                                required={true}
                                              />
                                                {errorFields.includes('instructor') && (
                                                  <p className="text-red-500 text-[10px] sm:text-xs mt-0.5">Instructor is required</p>
                                                )}
                                            </div>
                                            <div>
                                              <Label htmlFor="location" className="font-medium text-xs sm:text-sm mb-0.5 sm:mb-1 block">Location</Label>
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button
                                                    variant="outline"
                                                    className={`w-full text-left justify-between border-2 hover:bg-gray-50 hover:border-gray-400 focus:!border-purple-500 focus:!ring-2 focus:!ring-purple-500 focus:outline-none data-[state=open]:!border-purple-500 data-[state=open]:!ring-2 data-[state=open]:!ring-purple-500 ${!formData.location ? 'text-gray-400' : ''}`}
                                                  >
                                                    {formData.location || 'Select location'}
                                                    <ChevronDown className="ml-2 h-4 w-4" />
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-64 p-2 text-[15px]">
                                                  <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                                                    <Input
                                                      placeholder="Search or type new location..."
                                                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                      value={locationSearchTerm}
                                                      onChange={e => {
                                                        const value = e.target.value;
                                                        // Must contain at least 4 alphabets (can have spaces and numbers)
                                                        const alphabetCount = (value.match(/[a-zA-Z]/g) || []).length;
                                                        const isValid = /^[a-zA-Z0-9\s]*$/.test(value) && 
                                                                      (alphabetCount >= 4 || value === '' || /^[a-zA-Z\s]*$/.test(value));
                                                        
                                                        if (isValid) {
                                                          setLocationSearchTerm(value);
                                                          setLocationError('');
                                                        } else {
                                                          setLocationError('Only letters, numbers, and spaces allowed (min 4 letters)');
                                                        }
                                                      }}
                                                      onKeyDown={(e) => e.stopPropagation()}
                                                    />
                                                    {locationError && (
                                                      <p className="text-red-500 text-xs mt-1">{locationError}</p>
                                                    )}
                                                  </div>
                                                  <div className="max-h-[200px] overflow-y-auto">
                                                    {locationsLoading ? (
                                                      <div className="px-4 py-2 text-gray-500 text-[15px]">Loading locations...</div>
                                                    ) : (
                                                      locationOptions
                                                        .filter(location => location.toLowerCase().includes(locationSearchTerm.toLowerCase()))
                                                        .map(location => (
                                                          <DropdownMenuItem
                                                            key={location}
                                                            className={`px-4 py-2 cursor-pointer hover:bg-gray-100 text-[15px] ${
                                                              formData.location === location ? 'bg-purple-100' : ''
                                                            }`}
                                                            onSelect={() => {
                                                              onFormChange('location', location);
                                                              setLocationSearchTerm('');
                                                              clearErrorField?.('location');
                                                            }}
                                                          >
                                                            {location}
                                                          </DropdownMenuItem>
                                                        ))
                                                    )}
                                                    {locationSearchTerm && 
                                                      !locationOptions.find(
                                                        location => location.toLowerCase() === locationSearchTerm.toLowerCase()
                                                      ) && (
                                                        <DropdownMenuItem
                                                          className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-purple-600 text-[15px]"
                                                          onSelect={async () => {
                                                            const newLocation = locationSearchTerm;
                                                            onFormChange('location', newLocation);
                                                            setLocationSearchTerm('');
                                                            // Add to database and refresh list
                                                            await addNewLocation(newLocation);
                                                          }}
                                                        >
                                                          Add "{locationSearchTerm}" as new location
                                                        </DropdownMenuItem>
                                                      )}
                                                  </div>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                            </div>
                                            <div>
                                              <Label htmlFor="maxStudents" className="font-medium text-xs sm:text-sm mb-0.5 sm:mb-1 block">Max No. of Students <span className="text-red-500">*</span></Label>
                                              <Input
                                                id="maxStudents"
                                                type="number"
                                                min="1"
                                                value={formData.maxStudents || ''}
                                                onKeyDown={e => {
                                                  if (e.key === '-') {
                                                    e.preventDefault();
                                                  }
                                                  // Allow clearing the field with backspace/delete
                                                  if ((e.key === 'Backspace' || e.key === 'Delete') && e.currentTarget.value.length === 1) {
                                                    onFormChange('maxStudents', '');
                                                    e.preventDefault();
                                                  }
                                                }}
                                                onChange={e => {
                                                  const value = e.target.value;
                                                  // Allow empty value for clearing
                                                  if (value === '') {
                                                    onFormChange('maxStudents', '');
                                                    return;
                                                  }
                                                  const numValue = parseInt(value);
                                                  if (!isNaN(numValue) && numValue > 0) {
                                                    onFormChange('maxStudents', numValue.toString());
                                                    clearErrorField?.('maxStudents');
                                                  } else if (value === '0' || numValue === 0) {
                                                    // Don't set 0 values, keep field empty
                                                    onFormChange('maxStudents', '');
                                                  }
                                                }}
                                                className={`border rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-[15px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                                  errorFields.includes('maxStudents') ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                                                }`}
                                              />
                                              {errorFields.includes('maxStudents') && (
                                                <p className="text-red-500 text-[10px] sm:text-xs mt-0.5">Max students is required</p>
                                              )}
                                            </div>
                                          </div>

                                          <div>
                                      <Label htmlFor="description" className="mb-0.5 sm:mb-1 font-medium text-xs sm:text-sm">Description <span className="text-red-500">*</span></Label>
                                            <Textarea
                                              id="description"
                                              placeholder="Describe your course in detail..."
                                              rows={3}
                                              value={formData.description || ''}
                                              onChange={e => {
                                                const newValue = e.target.value;
                                                if (validateDescription(newValue)) {
                                                  onFormChange('description', newValue);
                                                  setDescriptionError('');
                                                    clearErrorField?.('description');
                                                } else {
                                                  setDescriptionError('Only letters, numbers, spaces, and standard punctuation marks allowed');
                                                }
                                              }}
                                              onBlur={() => {
                                                if (!formData.description || !formData.description.trim()) {
                                                  setDescriptionError('Description is required');
                                                }
                                              }}
                                              className={`border rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-[15px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                                descriptionError || errorFields.includes('description') ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                                              }`}
                                            />
                                            {(descriptionError || errorFields.includes('description')) && (
                                              <p className="text-red-500 text-[10px] sm:text-xs mt-0.5 sm:mt-1">{descriptionError || 'Description is required'}</p>
                                            )}
                                          </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 text-sm sm:text-[15px]">
                                            <div>
                                              <Label htmlFor="level" className="mb-0.5 sm:mb-1 font-medium text-xs sm:text-sm">Course Level <span className="text-red-500">*</span></Label>
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button
                                                    variant="outline"
                                                    className={`w-full text-left justify-between text-sm sm:text-[15px] py-1 sm:py-1.5 px-2 sm:px-3 border-2 hover:bg-gray-50 hover:border-gray-400 focus:!border-purple-500 focus:!ring-2 focus:!ring-purple-500 focus:outline-none data-[state=open]:!border-purple-500 data-[state=open]:!ring-2 data-[state=open]:!ring-purple-500 ${!formData.level ? 'text-gray-400' : ''} ${errorFields.includes('level') ? 'border-red-500 focus:!ring-red-500 focus:!border-red-500' : ''}`}
                                                  >
                                                    {formData.level || 'Select level'}
                                                    <ChevronDown className="ml-2 h-4 w-4" />
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-48 p-2 text-[15px]">
                                                  <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                                                    <Input
                                                      placeholder="Search or type new level..."
                                                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                      value={levelSearchTerm}
                                                      onChange={e => {
                                                        const value = e.target.value;
                                                        // Allow only alphabets and spaces for level
                                                        if (/^[a-zA-Z\s]*$/.test(value)) {
                                                          setLevelSearchTerm(value);
                                                          setLevelError('');
                                                        } else {
                                                          setLevelError('Only letters and spaces allowed');
                                                        }
                                                      }}
                                                      onKeyDown={(e) => e.stopPropagation()}
                                                    />
                                                    {levelError && (
                                                      <p className="text-red-500 text-xs mt-1">{levelError}</p>
                                                    )}
                                                  </div>
                                                  <div className="max-h-[120px] overflow-y-auto">
                                                    {levelOptions
                                                      .filter(level => level.toLowerCase().includes(levelSearchTerm.toLowerCase()))
                                                      .map(level => (
                                                        <DropdownMenuItem
                                                          key={level}
                                                          className={`px-4 py-2 cursor-pointer hover:bg-gray-100 text-[15px] ${
                                                            formData.level === level ? 'bg-purple-100' : ''
                                                          }`}
                                                          onSelect={() => {
                                                            onFormChange('level', level);
                                                            setLevelSearchTerm('');
                                                            clearErrorField?.('level');
                                                          }}
                                                        >
                                                          {level}
                                                        </DropdownMenuItem>
                                                      ))}
                                                    {levelSearchTerm && 
                                                      !levelOptions.find(
                                                        level => level.toLowerCase() === levelSearchTerm.toLowerCase()
                                                      ) && (
                                                        <DropdownMenuItem
                                                          className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-purple-600 text-[15px]"
                                                          onSelect={async () => {
                                                            await addNewDropdownOption('levels', levelSearchTerm);
                                                            onFormChange('level', levelSearchTerm);
                                                            setLevelSearchTerm('');
                                                          }}
                                                        >
                                                          Add "{levelSearchTerm}" as new level
                                                        </DropdownMenuItem>
                                                      )}
                                                  </div>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                            </div>
                                            <div>
                                              <Label htmlFor="type" className="font-medium text-xs sm:text-sm mb-0.5 sm:mb-1 block">Course Type <span className="text-red-500">*</span></Label>
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button
                                                    variant="outline"
                                                    className={`w-full text-left justify-between border-2 hover:bg-gray-50 hover:border-gray-400 focus:!border-purple-500 focus:!ring-2 focus:!ring-purple-500 focus:outline-none data-[state=open]:!border-purple-500 data-[state=open]:!ring-2 data-[state=open]:!ring-purple-500 ${!formData.type ? 'text-gray-400' : ''} ${errorFields.includes('type') ? 'border-red-500 focus:!ring-red-500 focus:!border-red-500' : ''}`}
                                                  >
                                                    {formData.type || 'Select type'}
                                                    <ChevronDown className="ml-2 h-4 w-4" />
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-64 p-2 text-[15px]">
                                                  <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                                                    <Input
                                                      placeholder="Search or type new type..."
                                                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                      value={typeSearchTerm}
                                                      onChange={e => {
                                                        const value = e.target.value;
                                                        // Allow only alphabets and spaces for type
                                                        if (/^[a-zA-Z\s]*$/.test(value)) {
                                                          setTypeSearchTerm(value);
                                                          setTypeError('');
                                                        } else {
                                                          setTypeError('Only letters and spaces allowed');
                                                        }
                                                      }}
                                                      onKeyDown={(e) => e.stopPropagation()}
                                                    />
                                                    {typeError && (
                                                      <p className="text-red-500 text-xs mt-1">{typeError}</p>
                                                    )}
                                                  </div>
                                                  <div className="max-h-[200px] overflow-y-auto">
                                                    {typeOptions
                                                      .filter(type => type.toLowerCase().includes(typeSearchTerm.toLowerCase()))
                                                      .map(type => (
                                                        <DropdownMenuItem
                                                          key={type}
                                                          className={`px-4 py-2 cursor-pointer hover:bg-gray-100 text-[15px] ${
                                                            formData.type === type ? 'bg-purple-100' : ''
                                                          }`}
                                                          onSelect={() => {
                                                            onFormChange('type', type);
                                                            setTypeSearchTerm('');
                                                            clearErrorField?.('type');
                                                          }}
                                                        >
                                                          {type}
                                                        </DropdownMenuItem>
                                                      ))}
                                                    {typeSearchTerm && 
                                                      !typeOptions.find(
                                                        type => type.toLowerCase() === typeSearchTerm.toLowerCase()
                                                      ) && (
                                                        <DropdownMenuItem
                                                          className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-purple-600 text-[15px]"
                                                          onSelect={async () => {
                                                            await addNewDropdownOption('types', typeSearchTerm);
                                                            onFormChange('type', typeSearchTerm);
                                                            setTypeSearchTerm('');
                                                          }}
                                                        >
                                                          Add "{typeSearchTerm}" as new type
                                                        </DropdownMenuItem>
                                                      )}
                                                  </div>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                            </div>
                                            <div>
                                              <Label htmlFor="courseCategory" className="font-medium text-xs sm:text-sm mb-0.5 sm:mb-1 block">Course Category <span className="text-red-500">*</span></Label>
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button
                                                    variant="outline"
                                                    className={`w-full text-left justify-between border-2 hover:bg-gray-50 hover:border-gray-400 focus:!border-purple-500 focus:!ring-2 focus:!ring-purple-500 focus:outline-none data-[state=open]:!border-purple-500 data-[state=open]:!ring-2 data-[state=open]:!ring-purple-500 ${!formData.courseCategory ? 'text-gray-400' : ''} ${errorFields.includes('courseCategory') ? 'border-red-500 focus:!ring-red-500 focus:!border-red-500' : ''}`}
                                                  >
                                                    {formData.courseCategory || 'Select category'}
                                                    <ChevronDown className="ml-2 h-4 w-4" />
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-64 p-2 text-[15px]">
                                                  <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                                                    <Input
                                                      placeholder="Search or type new category..."
                                                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                      value={categorySearchTerm}
                                                      onChange={e => {
                                                        const value = e.target.value;
                                                        // Allow only alphabets and spaces for categories
                                                        if (/^[a-zA-Z\s]*$/.test(value)) {
                                                          setCategorySearchTerm(value);
                                                          setCategoryError('');
                                                        } else {
                                                          setCategoryError('Only letters and spaces allowed');
                                                        }
                                                      }}
                                                      onKeyDown={(e) => e.stopPropagation()}
                                                    />
                                                    {categoryError && (
                                                      <p className="text-red-500 text-xs mt-1">{categoryError}</p>
                                                    )}
                                                  </div>
                                                  <div className="max-h-[200px] overflow-y-auto">
                                                    {categoryOptions
                                                      .filter(category => category.toLowerCase().includes(categorySearchTerm.toLowerCase()))
                                                      .map(category => (
                                                        <DropdownMenuItem
                                                          key={category}
                                                          className={`px-4 py-2 cursor-pointer hover:bg-gray-100 text-[15px] ${
                                                            formData.courseCategory === category ? 'bg-purple-100' : ''
                                                          }`}
                                                          onSelect={() => {
                                                            onFormChange('courseCategory', category);
                                                            setCategorySearchTerm('');
                                                            clearErrorField?.('courseCategory');
                                                          }}
                                                        >
                                                          {category}
                                                        </DropdownMenuItem>
                                                      ))}
                                                    {categorySearchTerm && 
                                                      !categoryOptions.find(
                                                        category => category.toLowerCase() === categorySearchTerm.toLowerCase()
                                                      ) && (
                                                        <DropdownMenuItem
                                                          className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-purple-600 text-[15px]"
                                                          onSelect={async () => {
                                                            await addNewDropdownOption('categories', categorySearchTerm);
                                                            onFormChange('courseCategory', categorySearchTerm);
                                                            setCategorySearchTerm('');
                                                          }}
                                                        >
                                                          Add "{categorySearchTerm}" as new category
                                                        </DropdownMenuItem>
                                                      )}
                                                  </div>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                            </div>
                                          </div>

                                          <div>
                                            <div>
                                              <Label htmlFor="tags" className="mb-0.5 sm:mb-1 font-medium text-xs sm:text-sm">Tags <span className="text-red-500">*</span></Label>
                                            </div>
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button
                                                  variant="outline"
                                                  className={`mt-2 text-left text-[15px] border-2 hover:bg-gray-50 hover:border-gray-400 focus:!border-purple-500 focus:!ring-2 focus:!ring-purple-500 focus:outline-none data-[state=open]:!border-purple-500 data-[state=open]:!ring-2 data-[state=open]:!ring-purple-500 ${errorFields.includes('tags') ? 'border-red-500 focus:!ring-red-500 focus:!border-red-500' : ''}`}
                                                  style={{
                                                    minWidth: '120px',
                                                    width: (formData.tags?.length || 0) === 0
                                                      ? '120px'
                                                      : `${Math.min(480, 120 + (formData.tags || []).join(', ').length * 8)}px`,
                                                    maxWidth: '100%',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    transition: 'width 0.2s',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between'
                                                  }}
                                                >
                                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }} className={!formData.tags?.length ? 'text-gray-400' : ''}>
                                                    {(formData.tags?.length || 0) > 0
                                                      ? formData.tags.join(', ')
                                                      : 'Select tags'}
                                                  </span>
                                                  <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent side="bottom" align="start" className="w-48 p-2">
                                                <div className="flex items-center mb-2 gap-1">
                                                  <Input
                                                    placeholder="Search or add tags..."
                                                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                    value={searchTerm}
                                                    onChange={e => {
                                                      const value = e.target.value;
                                                      // Allow only alphabets and spaces for tags
                                                      if (/^[a-zA-Z\s]*$/.test(value)) {
                                                        setSearchTerm(value);
                                                        setTagsError('');
                                                      } else {
                                                        setTagsError('Only letters and spaces allowed');
                                                      }
                                                    }}
                                                  />
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-xs px-1 py-1 border border-gray-300 text-[15px]"
                                                    onClick={() => onFormChange('tags', [])}
                                                    disabled={(formData.tags?.length || 0) === 0}
                                                  >
                                                    Clear All
                                                  </Button>
                                    ```            </div>
                                                <div
                                                  style={{
                                                    minHeight: '32px',
                                                    maxHeight:
                                                      ((formData.tags?.length || 0) + availableTagOptions.length) <= 2
                                                        ? '48px'
                                                        : `${Math.min(160, ((formData.tags?.length || 0) + availableTagOptions.length) * 32)}px`,
                                                    overflowY: ((formData.tags?.length || 0) + availableTagOptions.length) > 4 ? 'auto' : 'visible',
                                                    transition: 'max-height 0.2s',
                                                  }}
                                                  className="overflow-y-auto text-[15px]"
                                                >
                                                  {availableTagOptions
                                                    .filter((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
                                                    .map((tag: string) => (
                                                      <div key={tag} className="flex items-center gap-1 py-1 text-[15px]">
                                                        <Checkbox
                                                          checked={(formData.tags || []).includes(tag)}
                                                          onCheckedChange={(checked: boolean) => {
                                                            const currentTags = formData.tags || [];
                                                            const newTags = checked
                                                              ? [...currentTags, tag]
                                                              : currentTags.filter((t: string) => t !== tag);
                                                            onFormChange('tags', newTags);
                                                            clearErrorField?.('tags');
                                                          }}
                                                          id={`tag-${tag}`}
                                                        />
                                                        <Label htmlFor={`tag-${tag}`}>{tag}</Label>
                                                      </div>
                                                    ))}
                                                  {/* Show user-added tags (not in availableTagOptions) with delete option */}
                                                  {(formData.tags || [])
                                                    .filter((tag: string) => !availableTagOptions.includes(tag) && tag.toLowerCase().includes(searchTerm.toLowerCase()))
                                                    .map((tag: string) => (
                                                      <div key={tag} className="flex items-center gap-2 py-1">
                                                        <Checkbox
                                                          checked={(formData.tags || []).includes(tag)}
                                                          onCheckedChange={(checked: boolean) => {
                                                            const currentTags = formData.tags || [];
                                                            const newTags = checked
                                                              ? [...currentTags, tag]
                                                              : currentTags.filter((t: string) => t !== tag);
                                                            onFormChange('tags', newTags);
                                                            clearErrorField?.('tags');
                                                          }}
                                                          id={`tag-user-${tag}`}
                                                        />
                                                        <Label htmlFor={`tag-user-${tag}`}>{tag}</Label>
                                                      </div>
                                                    ))}
                                                  {availableTagOptions.filter((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && searchTerm.trim() !== '' && (
                                                    <div className="flex items-center gap-2 py-1 text-[15px]">
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="px-2 py-1 text-[15px]"
                                                        onClick={async () => {
                                                          await addNewDropdownOption('tags', searchTerm.trim());
                                                          const currentTags = formData.tags || [];
                                                          onFormChange('tags', [...currentTags, searchTerm.trim()]);
                                                          clearErrorField?.('tags');
                                                        }}
                                                      >
                                                        Add "{searchTerm.trim()}" as new tag
                                                      </Button>
                                                    </div>
                                                  )}
                                                </div>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                      <div className="text-[13px] text-gray-500 mt-0.5">Select one or more tags.</div>
                                      {(tagsError || errorFields.includes('tags')) && <p className="text-red-500 text-xs mt-1">{tagsError || 'At least one tag is required'}</p>}
                                          </div>

                                      <Separator className="my-2" />

                                      <div className="space-y-2">
                                      <h4 className="font-medium text-[15px]">Course Guidelines & Instructions</h4>
                                            
                                            <div>
                                              <Textarea 
                                                id="studentGuidelines" 
                                                placeholder="Student Guidelines or special instructions (comprehensive text with formatting)..." 
                                                rows={2} 
                                                className="border border-gray-300 rounded-md px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                value={formData.studentGuidelines || ''}
                                                onChange={e => {
                                                  const newValue = e.target.value;
                                                  if (validateGuidelines(newValue)) {
                                                    onFormChange('studentGuidelines', newValue);
                                                    setGuidelinesError('');
                                                  } else {
                                                    setGuidelinesError('Only letters, numbers, spaces, and standard punctuation marks including bullets allowed');
                                                  }
                                                }}
                                              />
                                              {guidelinesError && (
                                                <p className="text-red-500 text-xs mt-1">{guidelinesError}</p>
                                              )}
                                            </div>
                                            
                                            <div>
                                              <Label htmlFor="freeGifts" className="font-medium">Free Gifts</Label>
                                            </div>
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button
                                                  variant="outline"
                                                  className="mt-2 text-left text-[15px] border-2 hover:bg-gray-50 hover:border-gray-400 focus:!border-purple-500 focus:!ring-2 focus:!ring-purple-500 focus:outline-none data-[state=open]:!border-purple-500 data-[state=open]:!ring-2 data-[state=open]:!ring-purple-500"
                                                  style={{
                                                    minWidth: '120px',
                                                    width: (formData.freeGifts?.length || 0) === 0
                                                      ? '120px'
                                                      : `${Math.min(480, 120 + (formData.freeGifts || []).join(', ').length * 8)}px`,
                                                    maxWidth: '100%',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    transition: 'width 0.2s',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between'
                                                  }}
                                                >
                                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }} className={!formData.freeGifts?.length ? 'text-gray-400' : ''}>
                                                    {(formData.freeGifts && formData.freeGifts.length > 0)
                                                      ? formData.freeGifts.join(', ')
                                                      : 'Select free gifts'}
                                                  </span>
                                                  <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                                                </Button>
                                              </DropdownMenuTrigger>
                                                <DropdownMenuContent side="bottom" align="start" className="w-64 p-2 text-[15px]">
                                                <div className="flex items-center mb-2 gap-2">
                                                  <Input
                                                    placeholder="Search or add gifts..."
                                                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                    value={freeGiftSearchTerm}
                                                    onChange={e => {
                                                      const value = e.target.value;
                                                      // Allow only alphabets and spaces for free gifts
                                                      if (/^[a-zA-Z\s]*$/.test(value)) {
                                                        setFreeGiftSearchTerm(value);
                                                        setFreeGiftsError('');
                                                      } else {
                                                        setFreeGiftsError('Only letters and spaces allowed');
                                                      }
                                                    }}
                                                  />
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-xs px-2 py-1 border border-gray-300 text-[15px]"
                                                    onClick={() => onFormChange('freeGifts', [])}
                                                    disabled={!(formData.freeGifts && formData.freeGifts.length)}
                                                  >
                                                    Clear All
                                                  </Button>
                                                </div>
                                                {freeGiftsError && (
                                                  <p className="text-red-500 text-xs mt-1 mb-2">{freeGiftsError}</p>
                                                )}
                                                <div
                                                  style={{
                                                    minHeight: '32px',
                                                    maxHeight:
                                                      ((formData.freeGifts?.length || 0) + availableFreeGiftOptions.length) <= 2
                                                        ? '48px'
                                                        : `${Math.min(160, ((formData.freeGifts?.length || 0) + availableFreeGiftOptions.length) * 32)}px`,
                                                    overflowY: ((formData.freeGifts?.length || 0) + availableFreeGiftOptions.length) > 4 ? 'auto' : 'visible',
                                                    transition: 'max-height 0.2s',
                                                  }}
                                                  className="overflow-y-auto text-[15px]"
                                                >
                                                  {availableFreeGiftOptions
                                                    .filter(gift => gift.toLowerCase().includes(freeGiftSearchTerm.toLowerCase()))
                                                    .map(gift => (
                                                      <div key={gift} className="flex items-center gap-2 py-1 text-[15px]">
                                                        <Checkbox
                                                          checked={(formData.freeGifts || []).includes(gift)}
                                                          onCheckedChange={checked => {
                                                            const currentGifts = formData.freeGifts || [];
                                                            const newGifts = checked
                                                              ? [...currentGifts, gift]
                                                              : currentGifts.filter((g: string) => g !== gift);
                                                            onFormChange('freeGifts', newGifts);
                                                          }}
                                                          id={`gift-${gift}`}
                                                        />
                                                        <Label htmlFor={`gift-${gift}`}>{gift}</Label>
                                                      </div>
                                                    ))}
                                                  {/* Show user-added gifts (not in availableFreeGiftOptions) with delete option */}
                                                  {(formData.freeGifts || [])
                                                    .filter((gift: string) => !availableFreeGiftOptions.includes(gift) && gift.toLowerCase().includes(freeGiftSearchTerm.toLowerCase()))
                                                    .map((gift: string) => (
                                                      <div key={gift} className="flex items-center gap-2 py-1">
                                                        <Checkbox
                                                          checked={(formData.freeGifts || []).includes(gift)}
                                                          onCheckedChange={checked => {
                                                            const currentGifts = formData.freeGifts || [];
                                                            const newGifts = checked
                                                              ? [...currentGifts, gift]
                                                              : currentGifts.filter((g: string) => g !== gift);
                                                            onFormChange('freeGifts', newGifts);
                                                          }}
                                                          id={`gift-user-${gift}`}
                                                        />
                                                        <Label htmlFor={`gift-user-${gift}`}>{gift}</Label>
                                                      </div>
                                                    ))}
                                                  {availableFreeGiftOptions.filter(gift => gift.toLowerCase().includes(freeGiftSearchTerm.toLowerCase())).length === 0 && freeGiftSearchTerm.trim() !== '' && (
                                                    <div className="flex items-center gap-2 py-1 text-[15px]">
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="px-2 py-1 text-[15px]"
                                                        onClick={async () => {
                                                          await addNewDropdownOption('freeGifts', freeGiftSearchTerm.trim());
                                                          const currentGifts = formData.freeGifts || [];
                                                          onFormChange('freeGifts', [...currentGifts, freeGiftSearchTerm.trim()]);
                                                        }}
                                                      >
                                                        Add "{freeGiftSearchTerm.trim()}" as new gift
                                                      </Button>
                                                    </div>
                                                  )}
                                                </div>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                      <div className="text-[13px] text-gray-500 mt-1">Select one or more free gifts.</div>

                                            {/* FAQ Section */}
                                            <div className="space-y-4">
                                              <div className="flex items-center justify-between">
                                                <h4 className="font-medium text-[15px]">Frequently Asked Questions</h4>
                                                <Button className="text-[15px]"
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => {
                                                    const currentFaqs = formData.faqs || [];
                                                    const newFaq = { id: `${Date.now()}-${Math.floor(Math.random()*1e6)}`, question: '', answer: '', isEditing: true };
                                                    onFormChange('faqs', [...currentFaqs, newFaq]);
                                                  }}
                                                >+ Add FAQ</Button>
                                              </div>
                                              {(formData.faqs || []).map((faq: any, idx: number) => (
                                                <div key={faq.id || `faq-${idx}`} className="border rounded-md p-3 mb-2 relative text-[15px]">
                                                  {faq.isEditing ? (
                                                    <>
                                                      {/* Save/Delete icons in top right */}
                                                      <div className="absolute top-0 right-2 flex gap-2 z-10">
                                                        <Button
                                                          type="button"
                                                          title='Save'
                                                          variant="ghost"
                                                          size="sm"
                                                          onClick={() => {
                                                            const updated = [...(formData.faqs || [])];
                                                            updated[idx].isEditing = false;
                                                            onFormChange('faqs', updated);
                                                          }}
                                                        >
                                                          <Save className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                          type="button"
                                                          title='Remove'
                                                          variant="ghost"
                                                          size="sm"
                                                          className="text-red-500"
                                                          onClick={() => {
                                                            showDeleteConfirmation(
                                                              "Remove FAQ",
                                                              "Are you sure you want to remove this FAQ?",
                                                              () => {
                                                                const updated = (formData.faqs || []).filter((_: any, i: number) => i !== idx);
                                                                onFormChange('faqs', updated);
                                                              },
                                                              faq.question || "Untitled FAQ"
                                                            );
                                                          }}
                                                        >
                                                          <span role="img" aria-label="Remove">❌</span>
                                                        </Button>
                                                      </div>
                                                      <Label className="font-medium">Question</Label>
                                                      <Input
                                                        value={faq.question}
                                                        onChange={e => {
                                                          const newValue = e.target.value;
                                                          if (newValue === '' || validateFaqContent(newValue)) {
                                                            const updated = [...(formData.faqs || [])];
                                                            updated[idx] = { ...updated[idx], question: newValue };
                                                            onFormChange('faqs', updated);
                                                            setFaqQuestionError(prev => {
                                                              const newErrors = {...prev};
                                                              delete newErrors[faq.id || `faq-${idx}`];
                                                              return newErrors;
                                                            });
                                                          } else {
                                                            setFaqQuestionError(prev => ({
                                                              ...prev,
                                                              [faq.id || `faq-${idx}`]: 'Only letters, numbers, spaces, and basic punctuation marks allowed'
                                                            }));
                                                          }
                                                        }}
                                                        placeholder="Enter FAQ question (letters, numbers, basic punctuation only)"
                                                        className="mb-2 border border-gray-300 rounded-md px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                      />
                                                      {faqQuestionError[faq.id || `faq-${idx}`] && (
                                                        <p className="text-red-500 text-xs mt-1 mb-2">{faqQuestionError[faq.id || `faq-${idx}`]}</p>
                                                      )}
                                                      <Label className="font-medium">Answer</Label>
                                                      <Textarea
                                                        value={faq.answer}
                                                        onChange={e => {
                                                          const newValue = e.target.value;
                                                          if (newValue === '' || validateFaqContent(newValue)) {
                                                            const updated = [...(formData.faqs || [])];
                                                            updated[idx] = { ...updated[idx], answer: newValue };
                                                            onFormChange('faqs', updated);
                                                            setFaqAnswerError(prev => {
                                                              const newErrors = {...prev};
                                                              delete newErrors[faq.id || `faq-${idx}`];
                                                              return newErrors;
                                                            });
                                                          } else {
                                                            setFaqAnswerError(prev => ({
                                                              ...prev,
                                                              [faq.id || `faq-${idx}`]: 'Only letters, numbers, spaces, and basic punctuation marks allowed'
                                                            }));
                                                          }
                                                        }}
                                                        placeholder="Enter FAQ answer (letters, numbers, basic punctuation only)"
                                                        rows={2}
                                                        className="border border-gray-300 rounded-md px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                      />
                                                      {faqAnswerError[faq.id || `faq-${idx}`] && (
                                                        <p className="text-red-500 text-xs mt-1">{faqAnswerError[faq.id || `faq-${idx}`]}</p>
                                                      )}
                                                    </>
                                                  ) : (
                                                    <>
                                                      {/* Edit/Delete icons in top right */}
                                                      <div className="absolute top-0 right-2 flex gap-2 z-10">
                                                        <Button
                                                          type="button"
                                                          variant="ghost"
                                                          title='Edit'
                                                          size="sm"
                                                          onClick={() => {
                                                            const updated = [...(formData.faqs || [])];
                                                            updated[idx].isEditing = true;
                                                            onFormChange('faqs', updated);
                                                          }}
                                                        >
                                                          <Pencil className="h-4 w-4 "/>
                                                          </Button>
                                                        <Button
                                                          type="button"
                                                          variant="ghost"
                                                          size="sm"
                                                          className="text-red-500"
                                                          onClick={() => {
                                                            showDeleteConfirmation(
                                                              "Remove FAQ",
                          "Are you sure you want to remove this FAQ?",
                          () => {
                            const updated = (formData.faqs || []).filter((_: any, i: number) => i !== idx);
                            onFormChange('faqs', updated);
                          },
                          faq.question || "Untitled FAQ"
                        );
                      }}
                    >
                      <span role="img" aria-label="Remove">❌</span>
                    </Button>
                  </div>
                  <div className="mb-2"><strong>Q:</strong> {faq.question}</div>
                  <div className="mb-2"><strong>A:</strong> {faq.answer}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
