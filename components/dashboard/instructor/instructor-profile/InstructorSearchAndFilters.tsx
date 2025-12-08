"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Search, Filter, ArrowUp, ArrowDown, ArrowUpDown, Upload, Download, Check, X } from "lucide-react"
import "./SearchAndFilters.css"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/dashboard/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { GridListToggle } from "@/components/dashboard/GridListToggle"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import type { Instructor, InstructorFilters } from "@/types/dashboard/staff/instructor"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Label } from "@/components/dashboard/ui/label"
import { useToast } from "@/hooks/dashboard/use-toast"

interface InstructorSearchAndFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (order: "asc" | "desc") => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  selectedFilters: InstructorFilters;
  setSelectedFilters: (filters: InstructorFilters) => void;
  pendingFilters: InstructorFilters;
  setPendingFilters: (filters: InstructorFilters) => void;
  instructors: Instructor[];
  setInstructors: (instructors: Instructor[] | ((prev: Instructor[]) => Instructor[])) => void;
  filteredInstructors?: Instructor[];
  roleOptions: string[];
  onAddInstructor?: () => void;
}

export default function InstructorSearchAndFilters({
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  viewMode,
  setViewMode,
  selectedFilters,
  setSelectedFilters,
  pendingFilters,
  setPendingFilters,
  instructors,
  setInstructors,
  filteredInstructors,
  roleOptions,
  onAddInstructor
}: InstructorSearchAndFiltersProps) {
  const { toast } = useToast()
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [filterAction, setFilterAction] = useState<string | null>(null);
  // Radix Checkbox Root renders a button element
  const firstCheckboxRef = useRef<HTMLButtonElement | null>(null);

  // Default filter options based on common instructor data
  const genderOptions = ["Male", "Female", "Other"];
  const statusOptions = ["Active", "Inactive", "On Leave"];
  const departmentOptions = ["Arts & Crafts", "Music", "Dance", "Sports", "Academic", "Technology"];

  const hasActiveFilters = () => {
    return (
      selectedFilters.role.length > 0 ||
      selectedFilters.gender.length > 0 ||
      selectedFilters.status.length > 0 ||
      selectedFilters.department.length > 0 ||
      selectedFilters.experience[0] > 0 ||
      selectedFilters.experience[1] < 50
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedFilters.role.length > 0) count++;
    if (selectedFilters.gender.length > 0) count++;
    if (selectedFilters.status.length > 0) count++;
    if (selectedFilters.department.length > 0) count++;
    if (selectedFilters.experience[0] > 0 || selectedFilters.experience[1] < 50) count++;
    return count;
  };

  const applyFilters = () => {
    setSelectedFilters(pendingFilters);
    setFilterDropdownOpen(false);
    setFilterAction("apply");
    setTimeout(() => setFilterAction(null), 500);
  };

  const clearFilters = () => {
    const clearedFilters: InstructorFilters = {
      role: [],
      gender: [],
      experience: [0, 50],
      status: [],
      department: []
    };
    setPendingFilters(clearedFilters);
    setSelectedFilters(clearedFilters);
    setFilterDropdownOpen(false);
    setFilterAction("clear");
    setTimeout(() => setFilterAction(null), 500);
  };

  // Toggle helper for click/keyboard on labels
  const toggleSelection = (
    list: string[],
    value: string,
    key: keyof InstructorFilters
  ) => {
    const exists = list.includes(value)
    setPendingFilters({
      ...pendingFilters,
      [key]: exists ? list.filter(v => v !== value) : [...list, value]
    })
  }

  return (
    <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">List of Instructors</h1>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-gray-400 dark:text-white" />
            <Input
              placeholder="Search instructors..."
              className="pl-8 h-8 text-sm w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
        <Button 
          className="bg-[#7C3AED] hover:bg-[#6D28D9] text-sm px-3 py-1"
          onClick={onAddInstructor}
        >
          Add Instructor
        </Button>
        <div className="w-px h-4 bg-gray-300"></div>
        {/* Filter Button and Panel */}
        <Popover 
          open={filterDropdownOpen} 
          onOpenChange={setFilterDropdownOpen}
        >
          <PopoverTrigger asChild>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 flex items-center gap-1 relative"
                    aria-label="Filter options"
                    tabIndex={0}
                  >
                    <span className="relative inline-block">
                      <Filter className="h-3.5 w-3.5 text-purple-500" />
                      {hasActiveFilters() && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold leading-none" style={{fontSize: '6px'}}>
                            {getActiveFilterCount()}
                          </span>
                        </span>
                      )}
                      {filterAction === "apply" && (
                        <Check className="absolute -top-0.5 -right-0.5 h-3 w-3 text-green-500 bg-white rounded-full" />
                      )}
                      {filterAction === "clear" && (
                        <X className="absolute -top-0.5 -right-0.5 h-3 w-3 text-red-500 bg-white rounded-full" />
                      )}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Filter</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </PopoverTrigger>
          <PopoverContent 
            className="w-72 p-4 filter-panel" 
            onCloseAutoFocus={(event) => {
              event.preventDefault();
            }}
            onEscapeKeyDown={() => setFilterDropdownOpen(false)}
            onInteractOutside={() => setFilterDropdownOpen(false)}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              firstCheckboxRef.current?.focus();
            }}
          >
            {/* Filter by Role */}
            <div className="mb-2 font-semibold text-sm" role="group" aria-label="Filter by Role">Filter by Role</div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mb-3 items-center" role="group">
              {roleOptions.map((role, index) => {
                const id = `role-${index}`;
                const checked = pendingFilters.role.includes(role);
                return (
                  <div
                    key={role}
                    className="flex items-center space-x-2 cursor-pointer select-none"
                    onClick={(e) => {
                      // Avoid double toggling when clicking the checkbox itself
                      if ((e.target as HTMLElement).closest('button[role="checkbox"]')) return;
                      toggleSelection(pendingFilters.role, role, 'role')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleSelection(pendingFilters.role, role, 'role')
                      }
                    }}
                    tabIndex={0}
                    aria-checked={checked}
                    role="checkbox"
                  >
                    <Checkbox
                      ref={index === 0 ? firstCheckboxRef : undefined}
                      id={id}
                      checked={checked}
                      onCheckedChange={(val) => {
                        const isChecked = val === true;
                        if (isChecked) {
                          setPendingFilters({
                            ...pendingFilters,
                            role: [...pendingFilters.role, role]
                          });
                        } else {
                          setPendingFilters({
                            ...pendingFilters,
                            role: pendingFilters.role.filter((t) => t !== role)
                          });
                        }
                      }}
                    />
                    <Label htmlFor={id} className="text-xs">{role}</Label>
                  </div>
                )
              })}
            </div>

            {/* Filter by Gender */}
            <div className="mb-2 font-semibold text-sm" role="group" aria-label="Filter by Gender">Filter by Gender</div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mb-3 items-center">
              {genderOptions.map((gender, index) => {
                const id = `gender-${index}`;
                const checked = pendingFilters.gender.includes(gender);
                return (
                  <div
                    key={gender}
                    className="flex items-center space-x-2 cursor-pointer select-none"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button[role="checkbox]"]')) return;
                      toggleSelection(pendingFilters.gender, gender, 'gender')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleSelection(pendingFilters.gender, gender, 'gender')
                      }
                    }}
                    tabIndex={0}
                    aria-checked={checked}
                    role="checkbox"
                  >
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={(val) => {
                        const isChecked = val === true;
                        if (isChecked) {
                          setPendingFilters({
                            ...pendingFilters,
                            gender: [...pendingFilters.gender, gender]
                          });
                        } else {
                          setPendingFilters({
                            ...pendingFilters,
                            gender: pendingFilters.gender.filter((g) => g !== gender)
                          });
                        }
                      }}
                    />
                    <Label htmlFor={id} className="text-xs">{gender}</Label>
                  </div>
                )
              })}
            </div>

            {/* Filter by Status */}
            <div className="mb-2 font-semibold text-sm" role="group" aria-label="Filter by Status">Filter by Status</div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mb-3 items-center">
              {statusOptions.map((status, index) => {
                const id = `status-${index}`;
                const checked = pendingFilters.status.includes(status);
                return (
                  <div
                    key={status}
                    className="flex items-center space-x-2 cursor-pointer select-none"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button[role="checkbox]"]')) return;
                      toggleSelection(pendingFilters.status, status, 'status')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleSelection(pendingFilters.status, status, 'status')
                      }
                    }}
                    tabIndex={0}
                    aria-checked={checked}
                    role="checkbox"
                  >
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={(val) => {
                        const isChecked = val === true;
                        if (isChecked) {
                          setPendingFilters({
                            ...pendingFilters,
                            status: [...pendingFilters.status, status]
                          });
                        } else {
                          setPendingFilters({
                            ...pendingFilters,
                            status: pendingFilters.status.filter((s) => s !== status)
                          });
                        }
                      }}
                    />
                    <Label htmlFor={id} className="text-xs">{status}</Label>
                  </div>
                )
              })}
            </div>

            {/* Filter by Department */}
            <div className="mb-2 font-semibold text-sm" role="group" aria-label="Filter by Department">Filter by Department</div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mb-3 items-center">
              {departmentOptions.map((dept, index) => {
                const id = `department-${index}`;
                const checked = pendingFilters.department.includes(dept);
                return (
                  <div
                    key={dept}
                    className="flex items-center space-x-2 cursor-pointer select-none"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button[role="checkbox]"]')) return;
                      toggleSelection(pendingFilters.department, dept, 'department')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleSelection(pendingFilters.department, dept, 'department')
                      }
                    }}
                    tabIndex={0}
                    aria-checked={checked}
                    role="checkbox"
                  >
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={(val) => {
                        const isChecked = val === true;
                        if (isChecked) {
                          setPendingFilters({
                            ...pendingFilters,
                            department: [...pendingFilters.department, dept]
                          });
                        } else {
                          setPendingFilters({
                            ...pendingFilters,
                            department: pendingFilters.department.filter((d) => d !== dept)
                          });
                        }
                      }}
                    />
                    <Label htmlFor={id} className="text-xs">{dept}</Label>
                  </div>
                )
              })}
            </div>
            
            {/* Experience Range */}
            <div className="mb-2 font-semibold text-sm">Experience Range (Years)</div>
            <div className="flex flex-wrap gap-2 mb-3">
              <input
                type="number"
                className="w-20 px-2 py-1 text-xs border rounded"
                placeholder="Min"
                value={pendingFilters.experience[0]}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setPendingFilters({
                    ...pendingFilters,
                    experience: [value, pendingFilters.experience[1]]
                  });
                }}
              />
              <span className="text-xs text-gray-500 dark:text-white self-center">to</span>
              <input
                type="number"
                className="w-20 px-2 py-1 text-xs border rounded"
                placeholder="Max"
                value={pendingFilters.experience[1]}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 50;
                  setPendingFilters({
                    ...pendingFilters,
                    experience: [pendingFilters.experience[0], value]
                  });
                }}
              />
            </div>

            <div className="flex justify-between gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                Clear All
              </Button>
              <Button
                size="sm"
                onClick={applyFilters}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
              >
                Apply Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort Field Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 flex items-center gap-1">
                    <span className="text-xs flex items-center gap-1">
                      <ArrowUpDown className="h-3 w-3" />
                      {sortBy === "name" && "Name"}
                      {sortBy === "role" && "Role"}
                      {sortBy === "experience" && "Experience"}
                      {sortBy === "gender" && "Gender"}
                      {sortOrder === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Sort</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            {[
              { value: "name", label: "Name" },
              { value: "role", label: "Role" },                                
              { value: "experience", label: "Experience" },
              { value: "gender", label: "Gender" },
            ].map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={sortBy === option.value ? "bg-purple-50" : ""}
              >
                <span>{option.label}</span>
                {sortBy === option.value && (
                  <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Order</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => setSortOrder("asc")}
            >
              <span className="flex items-center gap-2">
                Ascending
                <ArrowUp className="h-4 w-4" />
              </span>
              {sortOrder === "asc" && (
                <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortOrder("desc")}
            >
              <span className="flex items-center gap-2">
                Descending
                <ArrowDown className="h-4 w-4" />
              </span>
              {sortOrder === "desc" && (
                <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Grid/List View Toggle */}
        <GridListToggle viewMode={viewMode} setViewMode={setViewMode} />

        {/* Import/Export Buttons */}
        <div className="flex flex-wrap gap-2">
          <input
            id="import-instructor-csv-input"
            type="file"
            accept="text/csv,.csv"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              
              if (file.name.endsWith('.csv')) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                  const csvData = e.target?.result as string;
                  const lines = csvData.split('\n').filter(line => line.trim());
                  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                  const headersLower = headers.map(h => h.toLowerCase());
                  const findIdx = (options: string[]): number => {
                    for (const opt of options) {
                      const idx = headersLower.indexOf(opt.toLowerCase());
                      if (idx !== -1) return idx;
                    }
                    return -1;
                  };
                  
                  const newInstructors: Instructor[] = [];
                  for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                    const instructor: Instructor = {
                      id: values[findIdx(['Instructor ID','ID'])] || `INSTR${String(Date.now()).slice(-6)}`,
                      name: values[findIdx(['Instructor Name','Name'])] || '',
                      role: values[findIdx(['Role'])] || '',
                      gender: values[findIdx(['Gender'])] as 'Male' | 'Female' | 'Other' || 'Other',
                      experience: (() => {
                        const idx = findIdx(['Experience (years)','Experience (Years)','Experience']);
                        const parsed = idx >= 0 ? parseInt(values[idx]) : NaN;
                        return Number.isNaN(parsed) ? 0 : parsed;
                      })(),
                    };
                    newInstructors.push(instructor);
                  }
                  
                  setInstructors(prev => [...prev, ...newInstructors]);
                  toast({ title: 'Import complete', description: `Imported ${newInstructors.length} instructors.` })
                };
                reader.readAsText(file);
              } else {
                toast({ title: 'Unsupported file', description: 'Only CSV files are allowed.', variant: 'destructive' });
              }
            }}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    document.getElementById('import-instructor-csv-input')?.click();
                  }}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Upload files</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
              // Export only the currently shown (filtered/searched) instructors
              const shownInstructors = typeof filteredInstructors !== 'undefined' && filteredInstructors.length ? filteredInstructors : instructors;
              if (!shownInstructors.length) {
                toast({ title: 'Nothing to export', description: 'No instructors to export.' })
                return;
              }

              // Define export columns for instructors (includes all mandatory fields from add instructor form)
              const exportColumns = [
                { header: 'Instructor ID', key: 'id' },
                { header: 'Instructor Name', key: 'name' },
                { header: 'Role', key: 'role' },
                { header: 'Gender', key: 'gender' },
                { header: 'Experience (years)', key: 'experience' },
                { header: 'Email', key: 'email' },
                { header: 'Phone', key: 'phone' },
                { header: 'Contract Type', key: 'contractType' },
                { header: 'Job Level', key: 'jobLevel' },
                { header: 'Date of Birth', key: 'dateOfBirth' },
                { header: 'Joining Date', key: 'joiningDate' }
              ];

              const formatValue = (value: any, key: string) => {
                if (value === undefined || value === null) return '';
                if (Array.isArray(value)) return value.join('; ');
                if (typeof value === 'object') return JSON.stringify(value);
                return String(value);
              };

              // Create CSV header row
              const headerRow = exportColumns.map(col => col.header).join(',');
              
              // Create data rows
              const dataRows = shownInstructors.map(instructor => {
                return exportColumns.map(col => {
                  const value = formatValue(instructor[col.key as keyof Instructor], col.key);
                  return `"${value.replace(/"/g, '""')}"`;
                }).join(',');
              });

              // Combine header and data rows
              const csvStr = [headerRow, ...dataRows].join('\n');
              
              // Create and trigger download
              const now = new Date();
              const day = String(now.getDate()).padStart(2, '0');
              const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][now.getMonth()];
              const yr = now.getFullYear();
              const date = `${day}-${mon}-${yr}`;
              const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvStr);
              const dlAnchor = document.createElement('a');
              dlAnchor.setAttribute("href", dataStr);
              dlAnchor.setAttribute("download", `instructors_export_${date}.csv`);
              document.body.appendChild(dlAnchor);
              dlAnchor.click();
              document.body.removeChild(dlAnchor);
                }}
                >
                  <Download className="mr-2 h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Export</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Add Instructor Button */}
          {onAddInstructor && (
            <Button
              onClick={onAddInstructor}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              size="sm"
            >
              Add Instructor
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
