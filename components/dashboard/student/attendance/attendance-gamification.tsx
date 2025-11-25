"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import { Switch } from "@/components/dashboard/ui/switch"
import { Label } from "@/components/dashboard/ui/label"
import { Button } from "@/components/dashboard/ui/button"
import { Progress } from "@/components/dashboard/ui/progress"
import { Badge } from "@/components/dashboard/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import {
  Award,
  Trophy,
  Star,
  Calendar,
  Clock,
  CheckCircle,
  Users,
  Medal,
  Crown,
  Eye,
  Badge as BadgeIcon,
  ToggleLeft,
} from "lucide-react"


export function AttendanceGamification() {
  const [gamificationEnabled, setGamificationEnabled] = useState(true)
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(true)
  const [certificatesEnabled, setCertificatesEnabled] = useState(true)

  return (
    <div className="space-y-6 ">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold inline-flex items-center gap-2">Attendance Gamification <Image src="/Coming soon.svg" alt="Coming Soon" width={16} height={16} className="inline-block" /></h2>
          <p className="text-gray-500 dark:text-white">Motivate students with rewards and recognition</p>
        </div>
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Switch
                  id="gamification-toggle"
                  checked={gamificationEnabled}
                  onCheckedChange={setGamificationEnabled}
                  aria-label="Enable Gamification"
                />
              </TooltipTrigger>
              <TooltipContent>Enable Gamification</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <Tabs defaultValue="badges" className="space-y-4">
        <TabsList>
          <TabsTrigger value="badges">Badges & Achievements</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="rewards">Rewards & Certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Attendance Badges</CardTitle>
                  <CardDescription>Badges awarded for attendance milestones</CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" aria-label="Customize Badges">
                        <BadgeIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Customize Badges</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-2 border-purple-200 bg-purple-50">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                      <Award className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-purple-700">Perfect Week</h3>
                    <p className="text-sm text-purple-600 mt-1">100% attendance for a week</p>
                    <Badge className="mt-3 bg-purple-200 text-purple-800 hover:bg-purple-300">Common</Badge>
                  </CardContent>
                </Card>

                <Card className="border-2 border-blue-200 bg-blue-50">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                      <Calendar className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-blue-700">Perfect Month</h3>
                    <p className="text-sm text-blue-600 mt-1">100% attendance for a month</p>
                    <Badge className="mt-3 bg-blue-200 text-blue-800 hover:bg-blue-300">Uncommon</Badge>
                  </CardContent>
                </Card>

                <Card className="border-2 border-orange-200 bg-orange-50">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                      <Trophy className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="font-bold text-orange-700">Perfect Quarter</h3>
                    <p className="text-sm text-orange-600 mt-1">100% attendance for a quarter</p>
                    <Badge className="mt-3 bg-orange-200 text-orange-800 hover:bg-orange-300">Rare</Badge>
                  </CardContent>
                </Card>

                <Card className="border-2 border-green-200 bg-green-50">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
                      <Clock className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="font-bold text-green-700">Early Bird</h3>
                    <p className="text-sm text-green-600 mt-1">Arrived early 5 days in a row</p>
                    <Badge className="mt-3 bg-green-200 text-green-800 hover:bg-green-300">Uncommon</Badge>
                  </CardContent>
                </Card>

                <Card className="border-2 border-amber-200 bg-amber-50">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                      <CheckCircle className="h-8 w-8 text-amber-600" />
                    </div>
                    <h3 className="font-bold text-amber-700">Consistency King</h3>
                    <p className="text-sm text-amber-600 mt-1">No late arrivals for a month</p>
                    <Badge className="mt-3 bg-amber-200 text-amber-800 hover:bg-amber-300">Uncommon</Badge>
                  </CardContent>
                </Card>

                <Card className="border-2 border-red-200 bg-red-50">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-3">
                      <Crown className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="font-bold text-red-700">Attendance Legend</h3>
                    <p className="text-sm text-red-600 mt-1">Perfect attendance for a year</p>
                    <Badge className="mt-3 bg-red-200 text-red-800 hover:bg-red-300">Legendary</Badge>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Progress</CardTitle>
              <CardDescription>Track progress towards the next achievement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Award className="h-5 w-5 mr-2 text-purple-600" />
                      <span className="font-medium">Perfect Week</span>
                    </div>
                    <span className="text-sm font-medium">4/5 days</span>
                  </div>
                  <Progress value={80} className="h-2" />
                  <p className="text-xs text-gray-500 dark:text-white">1 more day to earn this badge</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                      <span className="font-medium">Perfect Month</span>
                    </div>
                    <span className="text-sm font-medium">18/20 days</span>
                  </div>
                  <Progress value={90} className="h-2" />
                  <p className="text-xs text-gray-500 dark:text-white">2 more days to earn this badge</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-green-600" />
                      <span className="font-medium">Early Bird</span>
                    </div>
                    <span className="text-sm font-medium">3/5 days</span>
                  </div>
                  <Progress value={60} className="h-2" />
                  <p className="text-xs text-gray-500 dark:text-white">2 more early arrivals to earn this badge</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Attendance Leaderboard</CardTitle>
                  <CardDescription>Top students with the best attendance records</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                   <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Switch
                          id="leaderboard-toggle"
                          checked={leaderboardEnabled}
                          onCheckedChange={setLeaderboardEnabled}
                          aria-label="Show Leaderboard"
                        />
                      </TooltipTrigger>
                      <TooltipContent>Show Leaderboard</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {leaderboardEnabled ? (
                <div className="space-y-4">
                  <div className="flex justify-center space-x-4 mb-6">
                    <div className="flex flex-col items-center order-2">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center mb-2 border-4 border-amber-200">
                        <Crown className="h-10 w-10 text-white" />
                      </div>
                      <div className="text-center">
                        <div className="font-bold">Emily Davis</div>
                        <div className="text-sm text-gray-500 dark:text-white">100%</div>
                        <Badge className="mt-1 bg-amber-100 text-amber-800">1st Place</Badge>
                      </div>
                    </div>

                    <div className="flex flex-col items-center order-1 mt-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center mb-2 border-4 border-gray-200">
                        <Medal className="h-8 w-8 text-white" />
                      </div>
                      <div className="text-center">
                        <div className="font-bold">John Smith</div>
                        <div className="text-sm text-gray-500 dark:text-white">98%</div>
                        <Badge className="mt-1 bg-gray-100 text-gray-800 dark:text-white">2nd Place</Badge>
                      </div>
                    </div>

                    <div className="flex flex-col items-center order-3 mt-8">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center mb-2 border-4 border-amber-200">
                        <Award className="h-8 w-8 text-white" />
                      </div>
                      <div className="text-center">
                        <div className="font-bold">Michael Brown</div>
                        <div className="text-sm text-gray-500 dark:text-white">95%</div>
                        <Badge className="mt-1 bg-amber-100 text-amber-800">3rd Place</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center p-3 bg-gray-50 rounded-md">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        <span className="font-bold text-gray-700 dark:text-white">4</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Jessica Wilson</div>
                        <div className="text-xs text-gray-500 dark:text-white">93% attendance</div>
                      </div>
                      <Star className="h-5 w-5 text-amber-400" />
                    </div>

                    <div className="flex items-center p-3 bg-gray-50 rounded-md">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        <span className="font-bold text-gray-700 dark:text-white">5</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Daniel Lee</div>
                        <div className="text-xs text-gray-500 dark:text-white">92% attendance</div>
                      </div>
                      <Star className="h-5 w-5 text-amber-400" />
                    </div>

                    <div className="flex items-center p-3 bg-purple-50 rounded-md border-2 border-purple-200">
                      <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center mr-3">
                        <span className="font-bold text-purple-700">12</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">You</div>
                        <div className="text-xs text-gray-500 dark:text-white">85% attendance</div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-green-600 mr-1">? 3</span>
                        <Star className="h-5 w-5 text-purple-400" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Users className="h-16 w-16 text-gray-300 dark:text-white mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 dark:text-white">Leaderboard Disabled</h3>
                  <p className="text-sm text-gray-500 dark:text-white text-center mt-1 max-w-md">
                    Enable the leaderboard to show students with the best attendance records and encourage healthy
                    competition.
                  </p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="mt-4"
                          onClick={() => setLeaderboardEnabled(true)}
                          size="icon"
                          aria-label="Enable Leaderboard"
                        >
                          <ToggleLeft className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Enable Leaderboard</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Attendance Certificates</CardTitle>
                  <CardDescription>Issue certificates for attendance achievements</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Switch
                          id="certificates-toggle"
                          checked={certificatesEnabled}
                          onCheckedChange={setCertificatesEnabled}
                          aria-label="Enable Certificates"
                        />
                      </TooltipTrigger>
                      <TooltipContent>Enable Certificates</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {certificatesEnabled ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-2 border-purple-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-purple-700">Perfect Attendance</h3>
                          <Badge className="bg-purple-100 text-purple-800">Monthly</Badge>
                        </div>
                        <div className="aspect-video bg-gradient-to-r from-purple-50 to-purple-100 rounded-md flex items-center justify-center mb-4 border border-purple-200">
                          <div className="text-center p-4">
                            <Award className="h-12 w-12 text-purple-600 mx-auto mb-2" />
                            <div className="text-lg font-bold text-purple-800">Certificate of Achievement</div>
                            <div className="text-sm text-purple-600">Perfect Attendance Award</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500 dark:text-white">Issued to students with 100% monthly attendance</div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" aria-label="Preview">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Preview</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-orange-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-orange-700">Attendance Excellence</h3>
                          <Badge className="bg-orange-100 text-orange-800">Quarterly</Badge>
                        </div>
                        <div className="aspect-video bg-gradient-to-r from-orange-50 to-orange-100 rounded-md flex items-center justify-center mb-4 border border-orange-200">
                          <div className="text-center p-4">
                            <Trophy className="h-12 w-12 text-orange-600 mx-auto mb-2" />
                            <div className="text-lg font-bold text-orange-800">Certificate of Excellence</div>
                            <div className="text-sm text-orange-600">Attendance Excellence Award</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500 dark:text-white">Issued to students with 95%+ quarterly attendance</div>
                          v<TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" aria-label="Preview">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Preview</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Certificate Settings</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch id="auto-issue" defaultChecked />
                        <Label htmlFor="auto-issue">Automatically issue certificates</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="email-certificates" defaultChecked />
                        <Label htmlFor="email-certificates">Email certificates to students/parents</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="display-portal" defaultChecked />
                        <Label htmlFor="display-portal">Display in student portal</Label>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Award className="h-16 w-16 text-gray-300 dark:text-white mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 dark:text-white">Certificates Disabled</h3>
                  <p className="text-sm text-gray-500 dark:text-white text-center mt-1 max-w-md">
                    Enable certificates to recognize and reward students for their attendance achievements.
                  </p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="mt-4"
                          onClick={() => setCertificatesEnabled(true)}
                          size="icon"
                          aria-label="Enable Certificates"
                        >
                          <ToggleLeft className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Enable Certificates</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Rewards</CardTitle>
              <CardDescription>Configure additional rewards for attendance achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                      <Star className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Attendance Points</h4>
                      <p className="text-sm text-gray-500 dark:text-white">Award points for consistent attendance</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                      <Trophy className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Achievement Showcase</h4>
                      <p className="text-sm text-gray-500 dark:text-white">Display achievements on student profiles</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center mr-4">
                      <Medal className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Physical Rewards</h4>
                      <p className="text-sm text-gray-500 dark:text-white">Enable physical rewards for top performers</p>
                    </div>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
