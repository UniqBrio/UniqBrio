"use client"

import { useState } from "react"
import MainLayout from "@/components/dashboard/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/dashboard/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import { Input } from "@/components/dashboard/ui/input"
import { Button } from "@/components/dashboard/ui/button"
import { Search, Book, MessageCircle, FileText, Video, Mail, Phone, HelpCircle } from "lucide-react"

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const faqCategories = [
    {
      category: "Getting Started",
      items: [
        {
          question: "How do I create my first course?",
          answer: "Navigate to the 'Courses' section from the sidebar, click on 'Add New Course', and fill in the required information including course name, description, duration, and pricing. You can also add instructors and set the course schedule."
        },
        {
          question: "How do I add students to a course?",
          answer: "Go to the specific course page, click on 'Manage Students', and either add students individually or import them in bulk using a CSV file. Students will receive an email notification once enrolled."
        },
        {
          question: "What are cohorts and how do I use them?",
          answer: "Cohorts are groups of students that progress through a course together. You can create cohorts in the 'Cohorts' section, set start dates, and assign instructors. This helps manage different batches of the same course."
        }
      ]
    },
    {
      category: "Schedule Management",
      items: [
        {
          question: "How do I schedule a class session?",
          answer: "From the 'Schedule' page, click 'Add Session', select the course, instructor, date, and time. The system will check instructor availability and prevent double-booking. You can also set recurring sessions for regular classes."
        },
        {
          question: "Can I reschedule or cancel a session?",
          answer: "Yes, navigate to the session in the schedule view, click on it, and select 'Reschedule' or 'Cancel'. All enrolled students will be automatically notified of the change via email."
        },
        {
          question: "How do I manage instructor availability?",
          answer: "Instructors can set their availability in their profile settings. As an admin, you can view and manage instructor schedules in the 'Staff' section to ensure optimal class scheduling."
        }
      ]
    },
    {
      category: "User Management",
      items: [
        {
          question: "How do I add new users to the platform?",
          answer: "Go to the 'Users' section, select the user type (Student, Instructor, or Staff), click 'Add New User', and fill in their details. You can also import multiple users via CSV upload."
        },
        {
          question: "How do I reset a user's password?",
          answer: "In the Users section, find the user, click on their profile, and select 'Reset Password'. The user will receive an email with instructions to set a new password."
        },
        {
          question: "What are the different user roles?",
          answer: "The platform has four main roles: Super Admin (full system access), Admin (manage courses and users), Instructor (teach classes and grade students), and Student (access enrolled courses and materials)."
        }
      ]
    },
    {
      category: "Leave Management",
      items: [
        {
          question: "How do I request leave as an instructor?",
          answer: "Go to the 'Leave' section in your dashboard, click 'Request Leave', select the dates, provide a reason, and submit. Your supervisor will be notified and can approve or deny the request."
        },
        {
          question: "How do I approve leave requests?",
          answer: "Navigate to the 'Leave Management' section as an admin or supervisor. You'll see pending requests that you can review, approve, or reject with comments."
        },
        {
          question: "What happens to scheduled classes during approved leave?",
          answer: "When leave is approved, you'll be prompted to either reschedule the affected sessions or assign a substitute instructor. Students are automatically notified of any changes."
        }
      ]
    },
    {
      category: "Reports & Analytics",
      items: [
        {
          question: "How do I view course performance reports?",
          answer: "Access the 'Analytics' dashboard from the sidebar. You can view enrollment trends, completion rates, student performance, and instructor effectiveness metrics."
        },
        {
          question: "Can I export reports?",
          answer: "Yes, most reports have an 'Export' button that allows you to download data in CSV or PDF format for further analysis or record-keeping."
        },
        {
          question: "How do I track student attendance?",
          answer: "Instructors can mark attendance during each session. View attendance reports in the Analytics section, filtered by course, student, or date range."
        }
      ]
    },
    {
      category: "Settings & Configuration",
      items: [
        {
          question: "How do I customize notification settings?",
          answer: "Go to Settings > Notifications. You can enable/disable various notification types including email, SMS, and in-app notifications for different events."
        },
        {
          question: "Can I change the platform theme?",
          answer: "Yes, in Settings > Appearance, you can switch between light and dark modes, and customize brand colors if you have admin privileges."
        },
        {
          question: "How do I configure payment settings?",
          answer: "Navigate to Settings > Payments to configure payment gateways, set up pricing rules, manage refund policies, and view transaction history."
        }
      ]
    }
  ]

  const quickLinks = [
    {
      icon: Book,
      title: "User Documentation",
      description: "Comprehensive guides and tutorials",
      action: "View Docs"
    },
    {
      icon: Video,
      title: "Video Tutorials",
      description: "Step-by-step video guides",
      action: "Watch Videos"
    },
    {
      icon: FileText,
      title: "API Documentation",
      description: "Developer resources and API reference",
      action: "View API Docs"
    },
    {
      icon: MessageCircle,
      title: "Community Forum",
      description: "Connect with other users",
      action: "Join Forum"
    }
  ]

  const filteredFAQs = faqCategories.map(category => ({
    ...category,
    items: category.items.filter(item =>
      searchQuery === "" ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0)

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className="flex flex-col items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-purple-700 flex items-center gap-2">
                <HelpCircle className="h-8 w-8" />
                Help Center
              </h1>
              <p className="text-gray-500 mt-1">
                Find answers to your questions and learn how to use UniqBrio effectively
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search for help..."
                  className="pl-10 h-12 text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer border-purple-200">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <link.icon className="h-6 w-6 text-purple-600" />
                    </div>
                    <CardTitle className="text-lg">{link.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">{link.description}</CardDescription>
                  <Button variant="outline" size="sm" className="w-full border-orange-400 text-orange-600 hover:bg-orange-50">
                    {link.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="faq" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-transparent gap-2 p-0 h-auto">
              <TabsTrigger
                value="faq"
                className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-orange-400 bg-transparent text-orange-600 font-medium data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-orange-400 data-[state=inactive]:text-orange-600 hover:bg-orange-50 data-[state=active]:hover:bg-purple-600"
              >
                <MessageCircle className="h-4 w-4" />
                FAQs
              </TabsTrigger>
              <TabsTrigger
                value="guides"
                className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-orange-400 bg-transparent text-orange-600 font-medium data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-orange-400 data-[state=inactive]:text-orange-600 hover:bg-orange-50 data-[state=active]:hover:bg-purple-600"
              >
                <Book className="h-4 w-4" />
                Guides
              </TabsTrigger>
              <TabsTrigger
                value="contact"
                className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-orange-400 bg-transparent text-orange-600 font-medium data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-orange-400 data-[state=inactive]:text-orange-600 hover:bg-orange-50 data-[state=active]:hover:bg-purple-600"
              >
                <Phone className="h-4 w-4" />
                Contact Support
              </TabsTrigger>
            </TabsList>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-6">
            <Card className="border-purple-200">
              <CardHeader className="border-b border-purple-200 bg-white">
                <CardTitle className="text-purple-700">Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Browse common questions organized by category
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {filteredFAQs.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFAQs.map((category, catIndex) => (
                      <div key={catIndex} className="mb-6">
                        <h3 className="text-xl font-semibold mb-3 text-purple-700">
                          {category.category}
                        </h3>
                        {category.items.map((item, itemIndex) => (
                          <AccordionItem
                            key={`${catIndex}-${itemIndex}`}
                            value={`${catIndex}-${itemIndex}`}
                          >
                            <AccordionTrigger className="text-left hover:text-purple-700">
                              {item.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                              {item.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </div>
                    ))}
                  </Accordion>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      No FAQs found matching "{searchQuery}"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Guides Tab */}
          <TabsContent value="guides" className="space-y-4">
            <div className="grid gap-4">
              <Card className="border-purple-200">
                <CardHeader className="bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardTitle className="text-purple-700">Getting Started Guide</CardTitle>
                  <CardDescription>New to UniqBrio? Start here</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Complete your profile setup</li>
                    <li>Familiarize yourself with the dashboard</li>
                    <li>Create your first course or enroll as a student</li>
                    <li>Explore the schedule and calendar features</li>
                    <li>Set up your notification preferences</li>
                  </ol>
                  <Button className="mt-4 bg-purple-600 hover:bg-purple-700">View Full Guide</Button>
                </CardContent>
              </Card>

              <Card className="border-purple-200">
                <CardHeader className="bg-gradient-to-br from-orange-50 to-orange-100">
                  <CardTitle className="text-orange-700">Course Management</CardTitle>
                  <CardDescription>Learn how to manage courses effectively</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Creating and configuring courses</li>
                    <li>• Managing course content and materials</li>
                    <li>• Setting up enrollment and pricing</li>
                    <li>• Tracking student progress and performance</li>
                    <li>• Generating course reports</li>
                  </ul>
                  <Button className="mt-4 bg-orange-600 hover:bg-orange-700">View Full Guide</Button>
                </CardContent>
              </Card>

              <Card className="border-purple-200">
                <CardHeader className="bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardTitle className="text-purple-700">Schedule & Calendar</CardTitle>
                  <CardDescription>Master scheduling and time management</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Creating and managing class sessions</li>
                    <li>• Handling conflicts and availability</li>
                    <li>• Setting up recurring sessions</li>
                    <li>• Managing instructor assignments</li>
                    <li>• Rescheduling and cancellations</li>
                  </ul>
                  <Button className="mt-4 bg-purple-600 hover:bg-purple-700">View Full Guide</Button>
                </CardContent>
              </Card>

              <Card className="border-purple-200">
                <CardHeader className="bg-gradient-to-br from-orange-50 to-orange-100">
                  <CardTitle className="text-orange-700">Advanced Features</CardTitle>
                  <CardDescription>Unlock the full potential of the platform</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Using analytics and reporting tools</li>
                    <li>• Automating workflows and notifications</li>
                    <li>• Integrating with external systems</li>
                    <li>• Customizing the platform settings</li>
                    <li>• Managing bulk operations</li>
                  </ul>
                  <Button className="mt-4 bg-orange-600 hover:bg-orange-700">View Full Guide</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contact Support Tab */}
          <TabsContent value="contact" className="space-y-4">
            <Card className="border-purple-200">
              <CardHeader className="border-b border-purple-200 bg-white">
                <CardTitle className="text-purple-700">Contact Support</CardTitle>
                <CardDescription>
                  Can't find what you're looking for? Get in touch with our support team
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Mail className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Email Support</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Get a response within 24 hours
                      </p>
                      <a href="mailto:support@uniqbrio.com" className="text-sm text-purple-600 hover:underline">
                        support@uniqbrio.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Phone className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Phone Support</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Monday - Friday, 9 AM - 6 PM
                      </p>
                      <a href="tel:+1234567890" className="text-sm text-orange-600 hover:underline">
                        +1 (234) 567-890
                      </a>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-4">Send us a message</h4>
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Subject</label>
                      <Input placeholder="What do you need help with?" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Message</label>
                      <textarea
                        className="w-full min-h-[120px] px-3 py-2 border rounded-md resize-none"
                        placeholder="Describe your issue or question in detail..."
                      />
                    </div>
                    <Button type="submit" className="w-full md:w-auto bg-purple-600 hover:bg-purple-700">
                      Send Message
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-700">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">All systems operational</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </MainLayout>
  )
}
