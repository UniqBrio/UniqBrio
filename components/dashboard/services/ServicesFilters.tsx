"use client"

import { Input } from "@/components/dashboard/ui/input"
import { Label } from "@/components/dashboard/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Button } from "@/components/dashboard/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { Calendar } from "@/components/dashboard/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { CalendarIcon, Search } from "lucide-react"
import { format } from "date-fns"

interface Filter {
  category: string
  instructor: string
  status: string
  mode: string
  startDateFrom: Date | undefined
  startDateTo: Date | undefined
  branch: string
}

interface ServicesFiltersProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  filter: Filter
  setFilter: (filter: Filter) => void
  categories: string[]
  instructors: string[]
  statuses: string[]
  modes: string[]
  branches: string[]
  onReset: () => void
}

export default function ServicesFilters({
  searchTerm,
  setSearchTerm,
  filter,
  setFilter,
  categories,
  instructors,
  statuses,
  modes,
  branches,
  onReset
}: ServicesFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
        <CardDescription>Filter services by various criteria</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400 dark:text-white" />
              <Input
                id="search"
                placeholder="Search by name, ID, or instructor..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={filter.category} onValueChange={(value) => setFilter({ ...filter, category: value })}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="instructor">Instructor</Label>
            <Select value={filter.instructor} onValueChange={(value) => setFilter({ ...filter, instructor: value })}>
              <SelectTrigger id="instructor">
                <SelectValue placeholder="Select instructor" />
              </SelectTrigger>
              <SelectContent>
                {instructors.map((instructor) => (
                  <SelectItem key={instructor} value={instructor}>
                    {instructor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={filter.status} onValueChange={(value) => setFilter({ ...filter, status: value })}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mode">Mode</Label>
            <Select value={filter.mode} onValueChange={(value) => setFilter({ ...filter, mode: value })}>
              <SelectTrigger id="mode">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                {modes.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="branch">Branch</Label>
            <Select value={filter.branch} onValueChange={(value) => setFilter({ ...filter, branch: value })}>
              <SelectTrigger id="branch">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Start Date From</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filter.startDateFrom ? format(filter.startDateFrom, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filter.startDateFrom}
                  onSelect={(date) => setFilter({ ...filter, startDateFrom: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label>Start Date To</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filter.startDateTo ? format(filter.startDateTo, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filter.startDateTo}
                  onSelect={(date) => setFilter({ ...filter, startDateTo: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onReset}>
            Reset Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
