"use client"

import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/dashboard/ui/dialog"
import { Badge } from "@/components/dashboard/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Separator } from "@/components/dashboard/ui/separator"
import { useCustomColors } from '@/lib/use-custom-colors'

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

interface ServiceViewDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  service: Service | null
}

export default function ServiceViewDialog({ isOpen, onOpenChange, service }: ServiceViewDialogProps) {
  const { secondaryColor } = useCustomColors();
  
  if (!service) return null

  const enrollmentPercentage = (service.enrolled / service.capacity) * 100

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {service.name}
            <Badge
              variant={service.status === "Active" ? "default" : "secondary"}
              className={service.status === "Active" ? "bg-green-500" : "bg-gray-500"}
            >
              {service.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>Service ID: {service.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-white">Category</p>
                  <p className="text-base">{service.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-white">Level</p>
                  <p className="text-base">{service.level}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-white">Mode</p>
                  <p className="text-base">{service.mode}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-white">Branch</p>
                  <p className="text-base">{service.branch}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-white">Location</p>
                  <p className="text-base">{service.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-white">Price</p>
                  <p className="text-base font-semibold">${service.price}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enrollment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-white">Capacity</p>
                  <p className="text-2xl font-bold">{service.capacity}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-white">Enrolled</p>
                  <p className="text-2xl font-bold text-blue-600">{service.enrolled}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-white">Available Spots</p>
                  <p className="text-2xl font-bold text-green-600">{service.capacity - service.enrolled}</p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-white">Enrollment Progress</p>
                  <p className="text-sm text-gray-500 dark:text-white">{enrollmentPercentage.toFixed(1)}%</p>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{ 
                      width: `${enrollmentPercentage}%`,
                      backgroundColor: enrollmentPercentage > 80 ? secondaryColor : "#22c55e"
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Information */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-white">Instructor</p>
                  <p className="text-base">{service.instructor}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-white">Start Date</p>
                  <p className="text-base">{format(service.startDate, 'dd-MMM-yy')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-white">End Date</p>
                  <p className="text-base">{format(service.endDate, 'dd-MMM-yy')}</p>
                </div>
              </div>
              
              {service.timeSlot && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-white">Time Slot</p>
                  <p className="text-base">{service.timeSlot}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sessions */}
          {service.sessions && service.sessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sessions ({service.sessions.length})</CardTitle>
                <CardDescription>Detailed session schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {service.sessions.map((session, index) => (
                    <div key={session.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">Session {index + 1}</h4>
                        <Badge variant="outline">{session.id}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-white">Time</p>
                          <p className="text-base">{session.timeFrom} - {session.timeTo}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-white">Days</p>
                          <p className="text-base">{session.days.join(", ")}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-white">Instructor</p>
                          <p className="text-base">{session.instructor}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-white">Location</p>
                          <p className="text-base">{session.location}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {service.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-relaxed">{service.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {service.tags && service.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {service.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
