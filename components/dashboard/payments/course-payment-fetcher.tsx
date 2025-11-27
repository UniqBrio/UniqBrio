"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card";
import { Button } from "@/components/dashboard/ui/button";
import { Input } from "@/components/dashboard/ui/input";
import { Label } from "@/components/dashboard/ui/label";
import { Badge } from "@/components/dashboard/ui/badge";
import { Loader2, Search, RefreshCw, BookOpen, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/dashboard/use-toast";
import { useCurrency } from "@/contexts/currency-context";

interface CoursePaymentDetails {
  courseId: string;
  name: string;
  courseCategory: string;
  courseType: string;
  priceINR?: number;
  registrationFee?: number;
  level?: string;
  duration?: string;
  status?: string;
}

export default function CoursePaymentFetcher() {
  const { currency } = useCurrency();
  const { toast } = useToast();
  const [courseId, setCourseId] = useState("");
  const [courseDetails, setCourseDetails] = useState<CoursePaymentDetails | null>(null);
  const [multipleCourses, setMultipleCourses] = useState<CoursePaymentDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [multipleLoading, setMultipleLoading] = useState(false);

  // Sample course IDs for testing (you can replace with actual IDs from your database)
  const sampleCourseIds = ["COURSE0001", "COURSE0002", "COURSE0003"];

  /**
   * Fetch single course payment details
   */
  const fetchSingleCourse = async () => {
    if (!courseId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a course ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/payments/course-payment-details?courseId=${encodeURIComponent(courseId.trim())}`, {
        credentials: 'include'
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch course details');
      }

      setCourseDetails(result.data);
      toast({
        title: "Success",
        description: `Fetched details for course: ${result.data.name}`,
      });
    } catch (error) {
      console.error('Error fetching course details:', error);
      setCourseDetails(null);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to fetch course details',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch multiple courses payment details
   */
  const fetchMultipleCourses = async () => {
    setMultipleLoading(true);
    try {
      const response = await fetch('/api/dashboard/payments/course-payment-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          courseIds: sampleCourseIds
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch multiple course details');
      }

      setMultipleCourses(result.data);
      
      if (result.missingCourseIds && result.missingCourseIds.length > 0) {
        toast({
          title: "Partial Success",
          description: `Found ${result.data.length} courses. Missing: ${result.missingCourseIds.join(', ')}`,
        });
      } else {
        toast({
          title: "Success",
          description: `Fetched details for ${result.data.length} courses`,
        });
      }
    } catch (error) {
      console.error('Error fetching multiple course details:', error);
      setMultipleCourses([]);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to fetch course details',
        variant: "destructive",
      });
    } finally {
      setMultipleLoading(false);
    }
  };

  /**
   * Clear results
   */
  const clearResults = () => {
    setCourseDetails(null);
    setMultipleCourses([]);
    setCourseId("");
  };

  return (
    <div className="space-y-6">
      {/* Single Course Fetcher */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Fetch Single Course Payment Details
          </CardTitle>
          <CardDescription>
            Enter a course ID to fetch payment category and course type from the courses collection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="courseId">Course ID</Label>
              <Input
                id="courseId"
                placeholder="e.g., COURSE0001"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    fetchSingleCourse();
                  }
                }}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={fetchSingleCourse} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Fetch Details
              </Button>
            </div>
          </div>

          {courseDetails && (
            <div className="mt-4 p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Course Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Course ID</Label>
                  <div className="font-mono text-sm">{courseDetails.courseId}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Course Name</Label>
                  <div className="text-sm">{courseDetails.name}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Payment Category</Label>
                  <Badge variant="outline" className="text-sm">
                    {courseDetails.courseCategory}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Course Type</Label>
                  <Badge variant="secondary" className="text-sm">
                    {courseDetails.courseType}
                  </Badge>
                </div>
                {courseDetails.priceINR && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Course Fee ({currency})</Label>
                    <div className="text-sm font-semibold flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ?{courseDetails.priceINR.toLocaleString()}
                    </div>
                  </div>
                )}
                {courseDetails.registrationFee && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Registration Fee ({currency})</Label>
                    <div className="text-sm font-semibold flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ?{courseDetails.registrationFee.toLocaleString()}
                    </div>
                  </div>
                )}
                {courseDetails.level && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Level</Label>
                    <div className="text-sm">{courseDetails.level}</div>
                  </div>
                )}
                {courseDetails.duration && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Duration</Label>
                    <div className="text-sm">{courseDetails.duration}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Multiple Courses Fetcher */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Fetch Multiple Courses
          </CardTitle>
          <CardDescription>
            Fetch payment details for multiple courses at once: {sampleCourseIds.join(', ')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={fetchMultipleCourses} disabled={multipleLoading}>
              {multipleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fetch Multiple Courses
            </Button>
            <Button onClick={clearResults} variant="outline">
              Clear Results
            </Button>
          </div>

          {multipleCourses.length > 0 && (
            <div className="mt-4 space-y-3">
              <h4 className="font-semibold">Found {multipleCourses.length} Courses</h4>
              <div className="grid gap-3">
                {multipleCourses.map((course) => (
                  <div key={course.courseId} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{course.name}</div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {course.courseId}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs">
                          {course.courseCategory}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {course.courseType}
                        </Badge>
                      </div>
                    </div>
                    {(course.priceINR || course.registrationFee) && (
                      <div className="flex gap-4 text-sm">
                        {course.priceINR && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Course: ?{course.priceINR.toLocaleString()}
                          </span>
                        )}
                        {course.registrationFee && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Registration: ?{course.registrationFee.toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
          <CardDescription>
            How to use the course payment helper functions in your code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h5 className="font-medium mb-2">1. Fetch Single Course Details</h5>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`import { fetchCoursePaymentDetails } from '@/lib/dashboard/payments/course-payment-client';

const courseDetails = await fetchCoursePaymentDetails('COURSE0001');
if (courseDetails) {
  console.log('Payment Category:', courseDetails.courseCategory);
  console.log('Course Type:', courseDetails.courseType);
  console.log('Price:', courseDetails.priceINR);
}`}
              </pre>
            </div>

            <div>
              <h5 className="font-medium mb-2">2. Get Just Payment Category</h5>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`import { getCoursePaymentCategory } from '@/lib/dashboard/payments/course-payment-client';

const category = await getCoursePaymentCategory('COURSE0001');
console.log('Category:', category); // e.g., "Premium", "Regular"`}
              </pre>
            </div>

            <div>
              <h5 className="font-medium mb-2">3. Get Just Course Type</h5>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`import { getCourseType } from '@/lib/dashboard/payments/course-payment-client';

const type = await getCourseType('COURSE0001');
console.log('Type:', type); // e.g., "Online", "Offline", "Hybrid"`}
              </pre>
            </div>

            <div>
              <h5 className="font-medium mb-2">4. Fetch Multiple Courses</h5>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`import { fetchMultipleCoursePaymentDetails } from '@/lib/dashboard/payments/course-payment-client';

const result = await fetchMultipleCoursePaymentDetails([
  'COURSE0001', 'COURSE0002', 'COURSE0003'
]);
console.log('Found courses:', result.courses);
console.log('Missing course IDs:', result.missingCourseIds);`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}