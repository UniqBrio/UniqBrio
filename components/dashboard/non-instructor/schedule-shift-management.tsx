"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Button } from "@/components/dashboard/ui/button"
import { Badge } from "@/components/dashboard/ui/badge"
import { Calendar } from "@/components/dashboard/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/dashboard/ui/dialog"
import { Input } from "@/components/dashboard/ui/input"
import { Label } from "@/components/dashboard/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Textarea } from "@/components/dashboard/ui/textarea"
import { CalendarIcon, Clock, Users, AlertTriangle, Plus, Edit, Trash2, UserCheck, RefreshCw } from "lucide-react"
import { useCustomColors } from "@/lib/use-custom-colors"

interface ScheduleEvent {
  id: string
  title: string
  type: "teaching" | "sports" | "arts" | "meeting"
  time: string
  duration: string
  students: number
  room: string
  subject?: string
  conflicts?: string[]
}

export default function ScheduleShiftManagement() {
  const { primaryColor, secondaryColor } = useCustomColors();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [events, setEvents] = useState<ScheduleEvent[]>([
    {
      id: "1",
      title: "Mathematics - Grade 10",
      type: "teaching",
      time: "09:00 AM",
      duration: "1h 30m",
      students: 25,
      room: "Room 101",
      subject: "Algebra",
    },
    {
      id: "2",
      title: "Physics Lab",
      type: "teaching",
      time: "11:00 AM",
      duration: "2h",
      students: 20,
      room: "Lab 1",
      subject: "Mechanics",
    },
    {
      id: "3",
      title: "Basketball Training",
      type: "sports",
      time: "02:00 PM",
      duration: "1h",
      students: 15,
      room: "Gymnasium",
    },
    {
      id: "4",
      title: "Art Workshop",
      type: "arts",
      time: "04:00 PM",
      duration: "1h 30m",
      students: 12,
      room: "Art Studio",
      conflicts: ["Room double-booked"],
    },
  ])

  const getEventStyles = (type: string) => {
    switch (type) {
      case "teaching":
        return { backgroundColor: `${secondaryColor}1a`, color: secondaryColor, borderColor: `${secondaryColor}33` } as React.CSSProperties
      case "sports":
        return { backgroundColor: `${primaryColor}1a`, color: primaryColor, borderColor: `${primaryColor}33` } as React.CSSProperties
      case "arts":
        return { backgroundColor: `#3B82F61a`, color: `#1E40AF`, borderColor: `#3B82F633` } as React.CSSProperties
      case "meeting":
        return { backgroundColor: `#22C55E1a`, color: `#15803D`, borderColor: `#22C55E33` } as React.CSSProperties
      default:
        return { backgroundColor: `#F3F4F6`, color: `#111827`, borderColor: `#E5E7EB` } as React.CSSProperties
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "teaching":
        return "??"
      case "sports":
        return "?"
      case "arts":
        return "??"
      case "meeting":
        return "??"
      default:
        return "??"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Schedule & Shift Management</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input id="title" placeholder="Enter event title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Event Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teaching">Teaching</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="arts">Arts</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input id="time" type="time" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input id="duration" placeholder="1h 30m" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="room">Room/Location</Label>
                <Input id="room" placeholder="Room number or location" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="Additional notes" />
              </div>
              <Button className="w-full">Create Event</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-md border" />

            <div className="mt-4 space-y-2">
              <h4 className="font-semibold">Color Codes</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: secondaryColor }}></div>
                  <span className="text-sm">Teaching</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: primaryColor }}></div>
                  <span className="text-sm">Sports</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-sm">Arts</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-sm">Meeting</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Events */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>
              {selectedDate?.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className={`p-4 rounded-lg border-2`} style={getEventStyles(event.type)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getEventIcon(event.type)}</span>
                      <div>
                        <h4 className="font-semibold">{event.title}</h4>
                        <div className="flex items-center gap-4 text-sm mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.time} ({event.duration})
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {event.students} students
                          </span>
                          <span>{event.room}</span>
                        </div>
                        {event.subject && (
                          <Badge variant="outline" className="mt-2">
                            {event.subject}
                          </Badge>
                        )}
                        {event.conflicts && (
                          <div className="flex items-center gap-1 mt-2 text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm">{event.conflicts[0]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" style={{ color: primaryColor }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost">
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Suggestions & Conflict Detection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
                      Conflict Detection{" "}
                      <span className="text-green-600 font-semibold">(Coming Soon)</span>
                    </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-red-800">Room Conflict</span>
                </div>
                <p className="text-sm text-red-700 mt-1">Art Studio is double-booked at 4:00 PM today</p>
                <Button size="sm" variant="outline" className="mt-2 bg-transparent">
                  Resolve Conflict
                </Button>
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium text-yellow-800">Schedule Gap</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">2-hour gap between Physics Lab and Basketball Training</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
                      Smart Suggestions{" "}
                      <span className="text-green-600 font-semibold">(Coming Soon)</span>
                    </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-blue-800">Substitute Available</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Dr. Smith is available to cover your 2:00 PM class if needed
                </p>
                <Button size="sm" variant="outline" className="mt-2 bg-transparent">
                  Request Substitute
                </Button>
              </div>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-green-800">Optimal Schedule</span>
                </div>
                <p className="text-sm text-green-700 mt-1">Consider moving Art Workshop to 3:00 PM for better flow</p>
                <Button size="sm" variant="outline" className="mt-2 bg-transparent">
                  Apply Suggestion
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Substitute Management */}
      <Card>
        <CardHeader>
          <CardTitle>
                      Substitute Assignment & Temporary Transfers{" "}
                      <span className="text-green-600 font-semibold">(Coming Soon)</span>
                    </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Request Substitute</h4>
                <p className="text-sm text-gray-600 dark:text-white mb-3">Need someone to cover your class?</p>
                <Button size="sm" className="w-full">
                  Find Substitute
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Available to Substitute</h4>
                <p className="text-sm text-gray-600 dark:text-white mb-3">Help colleagues by covering their classes</p>
                <Button size="sm" variant="outline" className="w-full bg-transparent">
                  Mark Available
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Temporary Transfer</h4>
                <p className="text-sm text-gray-600 dark:text-white mb-3">Request transfer to another branch</p>
                <Button size="sm" variant="outline" className="w-full bg-transparent">
                  Request Transfer
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
