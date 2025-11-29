"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Badge } from "@/components/dashboard/ui/badge"
import { Button } from "@/components/dashboard/ui/button"
import { Edit, Save, Star } from "lucide-react"
import Image from "next/image"

interface Props {
  isEditing: boolean
  onPrimaryAction: () => void
}

export default function PerformanceCard({ isEditing, onPrimaryAction }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="inline-flex items-center gap-2">
          <Star className="h-5 w-5" />
          AI-Enhanced Performance Reviews{" "}
          <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block" />
        </CardTitle>
        
      </CardHeader>
      <CardContent>
        <div className="opacity-50 pointer-events-none select-none" aria-disabled="true">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">4.8</div>
              <p className="text-sm text-gray-600 dark:text-white">Overall Rating</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">95%</div>
              <p className="text-sm text-gray-600 dark:text-white">Student Satisfaction</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">A+</div>
              <p className="text-sm text-gray-600 dark:text-white">Performance Grade</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">AI Analysis Summary</h4>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm">
                  Based on student feedback and performance metrics, Dr. Johnson demonstrates exceptional teaching
                  abilities with consistent high ratings. Students particularly appreciate her clear explanations
                  and patient approach to complex mathematical concepts.
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Key Strengths</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Badge className="bg-green-100 text-green-800">Clear Communication</Badge>
                <Badge className="bg-green-100 text-green-800">Student Engagement</Badge>
                <Badge className="bg-green-100 text-green-800">Punctuality</Badge>
                <Badge className="bg-green-100 text-green-800">Subject Expertise</Badge>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Areas for Growth</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Badge className="bg-yellow-100 text-yellow-800">Technology Integration</Badge>
                <Badge className="bg-yellow-100 text-yellow-800">Group Activities</Badge>
              </div>
            </div>
          </div>
        </div>
        </div>
      </CardContent>
    </Card>
  )
}
