"use client"

import { useState } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Label } from "@/components/dashboard/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Textarea } from "@/components/dashboard/ui/textarea"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { Calendar } from "@/components/dashboard/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dashboard/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import { Badge } from "@/components/dashboard/ui/badge"
import { CalendarIcon, X, Plus } from "lucide-react"
import { format } from "date-fns"

interface Service {
  id: string
  name: string
  category: string
  status: "Active" | "Inactive"
  instructor: string
  capacity: number
  enrolled: number
  price: number
  startDate: Date
  endDate: Date
  level: string
  location: string
  description: string
  mode: "Online" | "Offline"
  timeSlot: string
  branch: string
  tags: string[]
  sessions: Session[]
}

interface Session {
  id: string
  serviceId: string
  timeFrom: string
  timeTo: string
  days: string[]
  instructor: string
  location: string
}

interface ServiceFormDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  service: Partial<Service> | null
  isEditMode: boolean
  onSave: (service: Partial<Service>) => void
  categories: string[]
  instructors: string[]
  branches: string[]
  levels: string[]
}

export default function ServiceFormDialog({
  isOpen,
  onOpenChange,
  service,
  isEditMode,
  onSave,
  categories,
  instructors,
  branches,
  levels
}: ServiceFormDialogProps) {
  const [formData, setFormData] = useState<Partial<Service>>(
    service || {
      name: "",
      category: "Arts",
      status: "Active",
      instructor: "",
      capacity: 20,
      enrolled: 0,
      price: 0,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      level: "Beginner",
      location: "",
      description: "",
      mode: "Offline",
      timeSlot: "",
      branch: "Main Branch",
      tags: [],
      sessions: [],
    }
  )

  const [newSession, setNewSession] = useState<Partial<Session>>({
    timeFrom: "09:00",
    timeTo: "10:00",
    days: ["Monday"],
    instructor: "",
    location: "",
  })

  const [newTag, setNewTag] = useState("")
  const [isStartDateCalendarOpen, setIsStartDateCalendarOpen] = useState(false)
  const [isEndDateCalendarOpen, setIsEndDateCalendarOpen] = useState(false)

  const handleSave = () => {
    onSave(formData)
    onOpenChange(false)
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()]
      })
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || []
    })
  }

  const handleAddSession = () => {
    if (!formData.sessions) {
      formData.sessions = []
    }
    
    const sessionId = `${formData.id || 'NEW'}-${formData.sessions.length + 1}`
    const newSessionWithId: Session = {
      ...(newSession as Session),
      id: sessionId,
      serviceId: formData.id || 'NEW'
    }

    setFormData({
      ...formData,
      sessions: [...formData.sessions, newSessionWithId]
    })

    setNewSession({
      timeFrom: "09:00",
      timeTo: "10:00",
      days: ["Monday"],
      instructor: "",
      location: "",
    })
  }

  const handleRemoveSession = (sessionId: string) => {
    setFormData({
      ...formData,
      sessions: formData.sessions?.filter(session => session.id !== sessionId) || []
    })
  }

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Service" : "Add New Service"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the service details." : "Fill in the details to create a new service."}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Service Details</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter service name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
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
                <Select
                  value={formData.instructor}
                  onValueChange={(value) => setFormData({ ...formData, instructor: value })}
                >
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
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  placeholder="Enter capacity"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter price"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData({ ...formData, level: value })}
                >
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mode">Mode</Label>
                <Select
                  value={formData.mode}
                  onValueChange={(value) => setFormData({ ...formData, mode: value as "Online" | "Offline" })}
                >
                  <SelectTrigger id="mode">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="Offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Select
                  value={formData.branch}
                  onValueChange={(value) => setFormData({ ...formData, branch: value })}
                >
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
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Enter location"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timeSlot">Time Slot</Label>
                <Input
                  id="timeSlot"
                  value={formData.timeSlot}
                  onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                  placeholder="e.g., Mon, Wed 4:00 PM - 6:00 PM"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover open={isStartDateCalendarOpen} onOpenChange={setIsStartDateCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, "dd-MMM-yy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => {
                        setFormData({ ...formData, startDate: date })
                        if (date) setIsStartDateCalendarOpen(false)
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover open={isEndDateCalendarOpen} onOpenChange={setIsEndDateCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, "dd-MMM-yy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => {
                        setFormData({ ...formData, endDate: date })
                        if (date) setIsEndDateCalendarOpen(false)
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter service description"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button type="button" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary" className="pr-1">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-auto p-0"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="sessions" className="space-y-4 py-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Add Session</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="sessionFrom">Time From</Label>
                    <Input
                      id="sessionFrom"
                      type="time"
                      value={newSession.timeFrom}
                      onChange={(e) => setNewSession({ ...newSession, timeFrom: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionTo">Time To</Label>
                    <Input
                      id="sessionTo"
                      type="time"
                      value={newSession.timeTo}
                      onChange={(e) => setNewSession({ ...newSession, timeTo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionInstructor">Session Instructor</Label>
                    <Select
                      value={newSession.instructor}
                      onValueChange={(value) => setNewSession({ ...newSession, instructor: value })}
                    >
                      <SelectTrigger id="sessionInstructor">
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
                    <Label htmlFor="sessionLocation">Session Location</Label>
                    <Input
                      id="sessionLocation"
                      value={newSession.location}
                      onChange={(e) => setNewSession({ ...newSession, location: e.target.value })}
                      placeholder="Enter session location"
                    />
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label>Days of Week</Label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${day}`}
                          checked={newSession.days?.includes(day)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewSession({
                                ...newSession,
                                days: [...(newSession.days || []), day]
                              })
                            } else {
                              setNewSession({
                                ...newSession,
                                days: newSession.days?.filter(d => d !== day) || []
                              })
                            }
                          }}
                        />
                        <Label htmlFor={`day-${day}`} className="text-sm">
                          {day}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button onClick={handleAddSession} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Session
                </Button>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Current Sessions</h3>
                <div className="space-y-2 mt-2">
                  {formData.sessions?.map((session) => (
                    <div key={session.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {session.timeFrom} - {session.timeTo}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-white">
                            {session.days.join(", ")}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-white">
                            Instructor: {session.instructor}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-white">
                            Location: {session.location}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveSession(session.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!formData.sessions || formData.sessions.length === 0) && (
                    <p className="text-gray-500 dark:text-white text-center py-4">No sessions added yet</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isEditMode ? "Update Service" : "Create Service"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
