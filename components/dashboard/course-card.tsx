"use client"

import { Card, CardContent, CardHeader } from "@/components/dashboard/ui/card"
import { Badge } from "@/components/dashboard/ui/badge"
import { Button } from "@/components/dashboard/ui/button"
import { Progress } from "@/components/dashboard/ui/progress"
import {
  Star,
  Users,
  Clock,
  BookOpen,
  Eye,
  MoreHorizontal,
  Trophy,
  Shield,
  WifiOff,
  TrendingUp,
  Award,
  CreditCard,
  Briefcase,
  BarChart3,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/dashboard/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import type { Course } from "@/types/dashboard/course"

interface CourseCardProps {
  course: Course
  onView: () => void
}

export default function CourseCard({ course, onView }: CourseCardProps) {
  // Use instructorName if available, else fallback to instructor
  const instructorDisplay = course.instructor || 'Unknown Instructor';
  const formatCurrency = (amount: number, currency: "USD" | "INR") => {
    if (currency === "INR") {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(amount)
    } else {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 border-green-200"
      case "Upcoming":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Completed":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "Draft":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const enrollmentPercentage = (Number(course.enrolledStudents || 0) / Number(course.maxStudents || 1)) * 100

  return (
    <TooltipProvider>
      <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-orange-400 hover:border-orange-500 relative overflow-hidden">
        {/* Status indicator */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 ${
            course.status === "Active"
              ? "bg-green-500"
              : course.status === "Upcoming"
                ? "bg-blue-500"
                : course.status === "Completed"
                  ? "bg-gray-500"
                  : "bg-orange-500"
          }`}
        />

        {/* Feature indicators */}
        <div className="absolute top-3 right-3 flex gap-1">
          {course.dynamicPricing?.enabled && (
            <Tooltip>
              <TooltipTrigger>
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-3 w-3 text-purple-600" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Dynamic Pricing Enabled</p>
              </TooltipContent>
            </Tooltip>
          )}

          {course.contentSecurity.watermarkEnabled && (
            <Tooltip>
              <TooltipTrigger>
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <Shield className="h-3 w-3 text-blue-600" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Content Protected</p>
              </TooltipContent>
            </Tooltip>
          )}

          {course.offlineAccess.enabled && (
            <Tooltip>
              <TooltipTrigger>
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <WifiOff className="h-3 w-3 text-green-600" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Offline Access Available</p>
              </TooltipContent>
            </Tooltip>
          )}

                    {(course.streakRewards?.length ?? 0) > 0 && (
            <Tooltip>
              <TooltipTrigger>
                <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Trophy className="h-3 w-3 text-yellow-600" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Gamification Enabled</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight mb-2 group-hover:text-purple-700 transition-colors">
                {course.name || 'Untitled Course'}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{course.description || 'No description provided.'}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-3">
                {(course.tags && course.tags.length > 0)
                  ? course.tags.slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))
                  : <Badge variant="outline" className="text-xs">No tags</Badge>
                }
                {course.tags && course.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{course.tags.length - 3}
                  </Badge>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Edit Course
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analytics
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Users className="mr-2 h-4 w-4" />
                  Manage Students
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">Delete Course</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Instructor and Level */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-3 w-3 text-purple-600" />
              </div>
              <span className="text-gray-600">{instructorDisplay}</span>
            </div>
            <Badge
              variant="outline"
              className={
                course.level === "Easy"
                  ? "border-green-200 text-green-700"
                  : course.level === "Medium"
                    ? "border-yellow-200 text-yellow-700"
                    : "border-red-200 text-red-700"
              }
            >
              {course.level || 'Unspecified Level'}
            </Badge>
          </div>

          {/* Course Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{course.name || 'Untitled Course'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-700 font-bold text-lg">{course.priceINR ? `?${course.priceINR}` : 'INR'}</span>
            </div>
          </div>

          {/* Enrollment Progress */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Enrollment</span>
              <span className="font-medium">
                {Number(course.enrolledStudents || 0)}/{Number(course.maxStudents || 0)}
              </span>
            </div>
            <Progress value={enrollmentPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{isNaN(enrollmentPercentage) ? '0%' : Math.round(enrollmentPercentage) + '%'} filled</span>
              {Number(course.maxStudents || 0) - Number(course.enrolledStudents || 0) > 0 && (
                <span>{Number(course.maxStudents || 0) - Number(course.enrolledStudents || 0)} spots left</span>
              )}
            </div>
          </div>

          {/* Completion Rate */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Completion Rate</span>
              <span className="font-medium">{course.completionRate}%</span>
            </div>
            <Progress value={course.completionRate} className="h-2" />
          </div>

          {/* Rating and Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{course.rating}</span>
              <span className="text-sm text-gray-500">({course.enrolledStudents} reviews)</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg text-purple-600">{formatCurrency(course.priceINR, "INR")}</div>
                 {course.dynamicPricing?.enabled &&
                course.dynamicPricing.suggestedPrice !== undefined &&
                course.dynamicPricing.suggestedPrice !== course.priceINR && (
                  <div className="text-xs text-gray-500 line-through">
                    {formatCurrency(course.dynamicPricing.suggestedPrice, "INR")}
                  </div>
                )}
            </div>
          </div>

          {/* Enhanced Features Row */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex gap-2">
     {(course.emiPlans?.length ?? 0) > 0 && (
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <CreditCard className="h-3 w-3" />
                      EMI
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                     <p>{course.emiPlans?.length ?? 0} EMI plans available</p>
                   
                  </TooltipContent>
                </Tooltip>
              )}

                 {(course.scholarships?.length ?? 0) > 0 && (
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <Award className="h-3 w-3" />
                      Scholarship
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
            <p>{course.scholarships?.length ?? 0} scholarships available</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {course.industryPartners.length > 0 && (
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center gap-1 text-xs text-purple-600">
                      <Briefcase className="h-3 w-3" />
                      Jobs
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{course.industryPartners[0].jobOpenings.length} job openings</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            <Button size="sm" onClick={onView}>
              View Course
              <Eye className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
// Patch: Ensure Course.status allows 'Upcoming'
// If your Course type uses a union, add 'Upcoming' to it in types/course.ts
