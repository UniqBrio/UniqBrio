"use client"

import { useState } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Label } from "@/components/dashboard/ui/label"
import { Textarea } from "@/components/dashboard/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/dashboard/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import { 
  Users, 
  GraduationCap, 
  Briefcase, 
  UserCircle, 
  Calendar, 
  CheckSquare, 
  Info,
  Bell,
  Activity,
  Megaphone
} from "lucide-react"

interface NotificationTemplateDialogProps {
  type: "cohort" | "instructor" | "non-instructor" | "student" | "schedule" | "task"
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationTemplateDialog({ type, open, onOpenChange }: NotificationTemplateDialogProps) {
  const getConfig = () => {
    switch (type) {
      case "cohort":
        return {
          icon: Users,
          title: "Cohort Notification Templates",
          description: "Preview and customize notification templates for cohort-related activities",
          templates: {
            email: [
              {
                label: "Cohort Created",
                color: "purple",
                subject: "New Cohort Created - {{cohortName}}",
                body: `Hi {{recipientName}},

A new cohort has been created:

� Cohort: {{cohortName}}
� Course: {{courseName}}
� Start Date: {{startDate}}
� End Date: {{endDate}}
� Capacity: {{capacity}}
� Instructor: {{instructorName}}
� Created by: {{createdBy}}

View cohort details in the dashboard.`
              },
              {
                label: "Cohort Updated",
                color: "blue",
                subject: "Cohort Updated - {{cohortName}}",
                body: `Hi {{recipientName}},

The cohort {{cohortName}} has been updated.

Changes made:
� {{changesList}}

Updated by: {{updatedBy}}

Review the changes in the cohort management section.`
              },
              {
                label: "Cohort Deleted",
                color: "red",
                subject: "Cohort Removed - {{cohortName}}",
                body: `Hi {{recipientName}},

The following cohort has been deleted:

� Cohort: {{cohortName}}
� Course: {{courseName}}
� Deleted by: {{deletedBy}}
� Date: {{deletionDate}}

Note: All associated sessions and enrollments have been archived.`
              },
              {
                label: "Member Added",
                color: "green",
                subject: "New Member Added to {{cohortName}}",
                body: `Hi {{recipientName}},

A new member has been added to cohort {{cohortName}}:

� Student: {{studentName}}
� Email: {{studentEmail}}
� Enrollment Date: {{enrollmentDate}}
� Added by: {{addedBy}}

Current cohort size: {{currentSize}}/{{capacity}}`
              },
              {
                label: "Member Removed",
                color: "orange",
                subject: "Member Removed from {{cohortName}}",
                body: `Hi {{recipientName}},

A member has been removed from cohort {{cohortName}}:

� Student: {{studentName}}
� Removal Date: {{removalDate}}
� Reason: {{removalReason}}
� Removed by: {{removedBy}}

Current cohort size: {{currentSize}}/{{capacity}}`
              },
              {
                label: "Capacity Warning",
                color: "amber",
                subject: "Cohort Capacity Alert - {{cohortName}}",
                body: `Hi {{recipientName}},

The cohort {{cohortName}} is nearing its capacity:

� Current Size: {{currentSize}}/{{capacity}}
� Utilization: {{utilizationPercentage}}%
� Course: {{courseName}}
� Instructor: {{instructorName}}

Please review enrollment or consider increasing capacity.`
              }
            ],
            inapp: [
              {
                label: "Cohort Created",
                color: "purple",
                icon: Users,
                title: "New Cohort Created",
                message: "{{cohortName}} for {{courseName}} has been created. Start date: {{startDate}}"
              },
              {
                label: "Cohort Updated",
                color: "blue",
                icon: Activity,
                title: "Cohort Updated",
                message: "{{cohortName}} was updated by {{updatedBy}}"
              },
              {
                label: "Cohort Deleted",
                color: "red",
                icon: Bell,
                title: "Cohort Deleted",
                message: "{{cohortName}} has been removed from the system."
              },
              {
                label: "Member Added",
                color: "green",
                icon: Users,
                title: "New Member Added",
                message: "{{studentName}} joined {{cohortName}}"
              },
              {
                label: "Member Removed",
                color: "orange",
                icon: Users,
                title: "Member Removed",
                message: "{{studentName}} removed from {{cohortName}}"
              },
              {
                label: "Capacity Warning",
                color: "amber",
                icon: Bell,
                title: "Capacity Alert",
                message: "{{cohortName}} is at {{utilizationPercentage}}% capacity"
              }
            ]
          },
          variables: [
            { name: "{{cohortName}}", description: "Cohort name" },
            { name: "{{courseName}}", description: "Course name" },
            { name: "{{startDate}}", description: "Cohort start date" },
            { name: "{{endDate}}", description: "Cohort end date" },
            { name: "{{capacity}}", description: "Maximum capacity" },
            { name: "{{currentSize}}", description: "Current enrollment" },
            { name: "{{instructorName}}", description: "Assigned instructor" },
            { name: "{{studentName}}", description: "Student name" },
          ]
        }
      case "instructor":
        return {
          icon: GraduationCap,
          title: "Instructor Notification Templates",
          description: "Preview and customize notification templates for instructor-related activities",
          templates: {
            email: [
              {
                label: "New Instructor Added",
                color: "purple",
                subject: "Welcome New Instructor - {{instructorName}}",
                body: `Hi {{recipientName}},

A new instructor has been added to the system:

� Name: {{instructorName}}
� Email: {{instructorEmail}}
� Phone: {{instructorPhone}}
� Specialization: {{specialization}}
� Languages: {{languages}}
� Added by: {{addedBy}}
� Date: {{addedDate}}

Please ensure onboarding procedures are completed.`
              },
              {
                label: "Instructor Updated",
                color: "blue",
                subject: "Instructor Profile Updated - {{instructorName}}",
                body: `Hi {{recipientName}},

Instructor profile has been updated:

� Instructor: {{instructorName}}
� Changes: {{changesList}}
� Updated by: {{updatedBy}}
� Date: {{updateDate}}

Review the updated profile in the instructor management section.`
              },
              {
                label: "Instructor Deleted",
                color: "red",
                subject: "Instructor Removed - {{instructorName}}",
                body: `Hi {{recipientName}},

The following instructor has been removed from the system:

� Name: {{instructorName}}
� Email: {{instructorEmail}}
� Deleted by: {{deletedBy}}
� Date: {{deletionDate}}

Note: All assigned sessions have been flagged for reassignment.`
              }
            ],
            inapp: [
              {
                label: "New Instructor Added",
                color: "purple",
                icon: GraduationCap,
                title: "New Instructor Added",
                message: "{{instructorName}} has joined the team"
              },
              {
                label: "Instructor Updated",
                color: "blue",
                icon: Activity,
                title: "Instructor Updated",
                message: "{{instructorName}}'s profile was updated"
              },
              {
                label: "Instructor Deleted",
                color: "red",
                icon: Bell,
                title: "Instructor Removed",
                message: "{{instructorName}} has been removed from the system"
              }
            ]
          },
          variables: [
            { name: "{{instructorName}}", description: "Instructor name" },
            { name: "{{instructorEmail}}", description: "Instructor email" },
            { name: "{{instructorPhone}}", description: "Instructor phone" },
            { name: "{{specialization}}", description: "Area of expertise" },
            { name: "{{languages}}", description: "Languages spoken" },
            { name: "{{addedBy}}", description: "Added by user" },
            { name: "{{updatedBy}}", description: "Updated by user" },
            { name: "{{deletedBy}}", description: "Deleted by user" },
          ]
        }
      case "non-instructor":
        return {
          icon: Briefcase,
          title: "Non-Instructor Notification Templates",
          description: "Preview and customize notification templates for non-instructor staff activities",
          templates: {
            email: [
              {
                label: "New Non-Instructor Added",
                color: "purple",
                subject: "New Staff Member Added - {{staffName}}",
                body: `Hi {{recipientName}},

A new staff member has been added:

� Name: {{staffName}}
� Email: {{staffEmail}}
� Phone: {{staffPhone}}
� Role: {{role}}
� Department: {{department}}
� Added by: {{addedBy}}
� Date: {{addedDate}}

Please complete the onboarding process.`
              },
              {
                label: "Non-Instructor Updated",
                color: "blue",
                subject: "Staff Profile Updated - {{staffName}}",
                body: `Hi {{recipientName}},

Staff member profile has been updated:

� Staff: {{staffName}}
� Changes: {{changesList}}
� Updated by: {{updatedBy}}
� Date: {{updateDate}}

Review the changes in the staff management section.`
              },
              {
                label: "Non-Instructor Deleted",
                color: "red",
                subject: "Staff Member Removed - {{staffName}}",
                body: `Hi {{recipientName}},

The following staff member has been removed:

� Name: {{staffName}}
� Role: {{role}}
� Department: {{department}}
� Deleted by: {{deletedBy}}
� Date: {{deletionDate}}

All access permissions have been revoked.`
              }
            ],
            inapp: [
              {
                label: "New Non-Instructor Added",
                color: "purple",
                icon: Briefcase,
                title: "New Staff Member",
                message: "{{staffName}} has joined as {{role}}"
              },
              {
                label: "Non-Instructor Updated",
                color: "blue",
                icon: Activity,
                title: "Staff Updated",
                message: "{{staffName}}'s profile was updated"
              },
              {
                label: "Non-Instructor Deleted",
                color: "red",
                icon: Bell,
                title: "Staff Removed",
                message: "{{staffName}} has been removed from the system"
              }
            ]
          },
          variables: [
            { name: "{{staffName}}", description: "Staff member name" },
            { name: "{{staffEmail}}", description: "Staff email" },
            { name: "{{staffPhone}}", description: "Staff phone" },
            { name: "{{role}}", description: "Job role" },
            { name: "{{department}}", description: "Department" },
            { name: "{{addedBy}}", description: "Added by user" },
            { name: "{{updatedBy}}", description: "Updated by user" },
            { name: "{{deletedBy}}", description: "Deleted by user" },
          ]
        }
      case "student":
        return {
          icon: UserCircle,
          title: "Student Notification Templates",
          description: "Preview and customize notification templates for student-related activities",
          templates: {
            email: [
              {
                label: "Student Added",
                color: "purple",
                subject: "New Student Enrolled - {{studentName}}",
                body: `Hi {{recipientName}},

A new student has been enrolled:

� Name: {{studentName}}
� Email: {{studentEmail}}
� Phone: {{studentPhone}}
� Cohort: {{cohortName}}
� Course: {{courseName}}
� Enrollment Date: {{enrollmentDate}}
� Added by: {{addedBy}}

Welcome the new student to the program.`
              },
              {
                label: "Student Updated",
                color: "blue",
                subject: "Student Profile Updated - {{studentName}}",
                body: `Hi {{recipientName}},

Student profile has been updated:

� Student: {{studentName}}
� Changes: {{changesList}}
� Updated by: {{updatedBy}}
� Date: {{updateDate}}

Review the changes in student records.`
              },
              {
                label: "Student Deleted",
                color: "red",
                subject: "Student Removed - {{studentName}}",
                body: `Hi {{recipientName}},

The following student has been removed:

� Name: {{studentName}}
� Course: {{courseName}}
� Cohort: {{cohortName}}
� Deleted by: {{deletedBy}}
� Date: {{deletionDate}}

All student records have been archived.`
              },
              {
                label: "Enrollment Changes",
                color: "blue",
                subject: "Enrollment Update - {{studentName}}",
                body: `Hi {{recipientName}},

Student enrollment has been modified:

� Student: {{studentName}}
� Previous Cohort: {{previousCohort}}
� New Cohort: {{newCohort}}
� Change Date: {{changeDate}}
� Changed by: {{changedBy}}

Update all relevant records accordingly.`
              }
            ],
            inapp: [
              {
                label: "Student Added",
                color: "purple",
                icon: UserCircle,
                title: "New Student Enrolled",
                message: "{{studentName}} enrolled in {{cohortName}}"
              },
              {
                label: "Student Updated",
                color: "blue",
                icon: Activity,
                title: "Student Updated",
                message: "{{studentName}}'s profile was updated"
              },
              {
                label: "Student Deleted",
                color: "red",
                icon: Bell,
                title: "Student Removed",
                message: "{{studentName}} has been removed from the system"
              },
              {
                label: "Enrollment Changes",
                color: "blue",
                icon: UserCircle,
                title: "Enrollment Changed",
                message: "{{studentName}} moved to {{newCohort}}"
              }
            ]
          },
          variables: [
            { name: "{{studentName}}", description: "Student name" },
            { name: "{{studentEmail}}", description: "Student email" },
            { name: "{{studentPhone}}", description: "Student phone" },
            { name: "{{cohortName}}", description: "Cohort name" },
            { name: "{{courseName}}", description: "Course name" },
            { name: "{{enrollmentDate}}", description: "Enrollment date" },
            { name: "{{previousCohort}}", description: "Previous cohort" },
            { name: "{{newCohort}}", description: "New cohort" },
          ]
        }
      case "schedule":
        return {
          icon: Calendar,
          title: "Schedule Notification Templates",
          description: "Preview and customize notification templates for schedule and session-related activities",
          templates: {
            email: [
              {
                label: "Session Created",
                color: "purple",
                subject: "New Session Scheduled - {{sessionTitle}}",
                body: `Hi {{recipientName}},

A new session has been scheduled:

� Session: {{sessionTitle}}
� Course: {{courseName}}
� Cohort: {{cohortName}}
� Instructor: {{instructorName}}
� Date: {{sessionDate}}
� Time: {{startTime}} - {{endTime}}
� Location: {{location}}
� Created by: {{createdBy}}

Please mark your calendar.`
              },
              {
                label: "Session Updated",
                color: "blue",
                subject: "Session Updated - {{sessionTitle}}",
                body: `Hi {{recipientName}},

The session {{sessionTitle}} has been updated:

Changes made:
� {{changesList}}

� Cohort: {{cohortName}}
� Instructor: {{instructorName}}
� Date: {{sessionDate}}
� Time: {{startTime}} - {{endTime}}
� Updated by: {{updatedBy}}

Please note the changes.`
              },
              {
                label: "Session Cancelled",
                color: "red",
                subject: "Session Cancelled - {{sessionTitle}}",
                body: `Hi {{recipientName}},

The following session has been cancelled:

� Session: {{sessionTitle}}
� Course: {{courseName}}
� Cohort: {{cohortName}}
� Original Date: {{sessionDate}}
� Original Time: {{startTime}} - {{endTime}}
� Reason: {{cancellationReason}}
� Cancelled by: {{cancelledBy}}

A rescheduling notice will follow if applicable.`
              },
              {
                label: "Session Rescheduled",
                color: "orange",
                subject: "Session Rescheduled - {{sessionTitle}}",
                body: `Hi {{recipientName}},

The session {{sessionTitle}} has been rescheduled:

Previous Schedule:
� Date: {{previousDate}}
� Time: {{previousTime}}

New Schedule:
� Date: {{newDate}}
� Time: {{newTime}}
� Location: {{location}}

� Cohort: {{cohortName}}
� Instructor: {{instructorName}}
� Rescheduled by: {{rescheduledBy}}

Please update your calendar.`
              },
              {
                label: "Instructor Reassigned",
                color: "blue",
                subject: "Instructor Change - {{sessionTitle}}",
                body: `Hi {{recipientName}},

The instructor for session {{sessionTitle}} has been changed:

� Session: {{sessionTitle}}
� Date: {{sessionDate}}
� Time: {{startTime}} - {{endTime}}
� Previous Instructor: {{previousInstructor}}
� New Instructor: {{newInstructor}}
� Changed by: {{changedBy}}

The new instructor has been notified.`
              },
              {
                label: "Upcoming Reminder",
                color: "amber",
                subject: "Reminder: Upcoming Session - {{sessionTitle}}",
                body: `Hi {{recipientName}},

Reminder: You have an upcoming session:

� Session: {{sessionTitle}}
� Course: {{courseName}}
� Cohort: {{cohortName}}
� Instructor: {{instructorName}}
� Date: {{sessionDate}}
� Time: {{startTime}} - {{endTime}}
� Location: {{location}}

Starting in {{timeUntilSession}}.`
              }
            ],
            inapp: [
              {
                label: "Session Created",
                color: "purple",
                icon: Calendar,
                title: "New Session Scheduled",
                message: "{{sessionTitle}} scheduled for {{sessionDate}} at {{startTime}}"
              },
              {
                label: "Session Updated",
                color: "blue",
                icon: Activity,
                title: "Session Updated",
                message: "{{sessionTitle}} has been updated"
              },
              {
                label: "Session Cancelled",
                color: "red",
                icon: Bell,
                title: "Session Cancelled",
                message: "{{sessionTitle}} on {{sessionDate}} has been cancelled"
              },
              {
                label: "Session Rescheduled",
                color: "orange",
                icon: Calendar,
                title: "Session Rescheduled",
                message: "{{sessionTitle}} moved to {{newDate}} at {{newTime}}"
              },
              {
                label: "Instructor Reassigned",
                color: "blue",
                icon: GraduationCap,
                title: "Instructor Changed",
                message: "{{newInstructor}} will now teach {{sessionTitle}}"
              },
              {
                label: "Upcoming Reminder",
                color: "amber",
                icon: Bell,
                title: "Upcoming Session",
                message: "{{sessionTitle}} starts in {{timeUntilSession}}"
              }
            ]
          },
          variables: [
            { name: "{{sessionTitle}}", description: "Session title" },
            { name: "{{courseName}}", description: "Course name" },
            { name: "{{cohortName}}", description: "Cohort name" },
            { name: "{{instructorName}}", description: "Instructor name" },
            { name: "{{sessionDate}}", description: "Session date" },
            { name: "{{startTime}}", description: "Start time" },
            { name: "{{endTime}}", description: "End time" },
            { name: "{{location}}", description: "Session location" },
          ]
        }
      case "task":
        return {
          icon: CheckSquare,
          title: "Task Notification Templates",
          description: "Preview and customize notification templates for task management activities",
          templates: {
            email: [
              {
                label: "Task Created",
                color: "purple",
                subject: "New Task Assigned - {{taskTitle}}",
                body: `Hi {{recipientName}},

A new task has been assigned to you:

� Task: {{taskTitle}}
� Description: {{taskDescription}}
� Priority: {{priority}}
� Due Date: {{dueDate}}
� Assigned by: {{assignedBy}}
� Category: {{category}}

Please review and complete the task by the due date.`
              },
              {
                label: "Task Updated",
                color: "blue",
                subject: "Task Updated - {{taskTitle}}",
                body: `Hi {{recipientName}},

The task {{taskTitle}} has been updated:

Changes made:
� {{changesList}}

� Priority: {{priority}}
� Due Date: {{dueDate}}
� Status: {{status}}
� Updated by: {{updatedBy}}

Please review the updated task details.`
              },
              {
                label: "Task Completed",
                color: "green",
                subject: "Task Completed - {{taskTitle}}",
                body: `Hi {{recipientName}},

The task {{taskTitle}} has been marked as completed:

� Task: {{taskTitle}}
� Completed by: {{completedBy}}
� Completion Date: {{completionDate}}
� Time Taken: {{timeTaken}}

Great work on completing this task!`
              },
              {
                label: "Task Deleted",
                color: "red",
                subject: "Task Removed - {{taskTitle}}",
                body: `Hi {{recipientName}},

The following task has been deleted:

� Task: {{taskTitle}}
� Due Date: {{dueDate}}
� Deleted by: {{deletedBy}}
� Deletion Date: {{deletionDate}}
� Reason: {{deletionReason}}

No further action is required.`
              },
              {
                label: "Due Date Reminder",
                color: "amber",
                subject: "Task Due Soon - {{taskTitle}}",
                body: `Hi {{recipientName}},

Reminder: The following task is due soon:

� Task: {{taskTitle}}
� Description: {{taskDescription}}
� Priority: {{priority}}
� Due Date: {{dueDate}}
� Time Remaining: {{timeRemaining}}

Please complete the task before the deadline.`
              },
              {
                label: "Overdue Alert",
                color: "red",
                subject: "Overdue Task Alert - {{taskTitle}}",
                body: `Hi {{recipientName}},

The following task is now overdue:

� Task: {{taskTitle}}
� Priority: {{priority}}
� Due Date: {{dueDate}}
� Days Overdue: {{daysOverdue}}
� Status: {{status}}

Please complete this task as soon as possible.`
              }
            ],
            inapp: [
              {
                label: "Task Created",
                color: "purple",
                icon: CheckSquare,
                title: "New Task Assigned",
                message: "{{taskTitle}} - Due {{dueDate}}"
              },
              {
                label: "Task Updated",
                color: "blue",
                icon: Activity,
                title: "Task Updated",
                message: "{{taskTitle}} has been updated"
              },
              {
                label: "Task Completed",
                color: "green",
                icon: CheckSquare,
                title: "Task Completed",
                message: "{{taskTitle}} was completed by {{completedBy}}"
              },
              {
                label: "Task Deleted",
                color: "red",
                icon: Bell,
                title: "Task Removed",
                message: "{{taskTitle}} has been deleted"
              },
              {
                label: "Due Date Reminder",
                color: "amber",
                icon: Bell,
                title: "Task Due Soon",
                message: "{{taskTitle}} is due in {{timeRemaining}}"
              },
              {
                label: "Overdue Alert",
                color: "red",
                icon: Bell,
                title: "Task Overdue",
                message: "{{taskTitle}} is {{daysOverdue}} days overdue"
              }
            ]
          },
          variables: [
            { name: "{{taskTitle}}", description: "Task title" },
            { name: "{{taskDescription}}", description: "Task description" },
            { name: "{{priority}}", description: "Task priority" },
            { name: "{{dueDate}}", description: "Due date" },
            { name: "{{status}}", description: "Task status" },
            { name: "{{assignedBy}}", description: "Assigned by user" },
            { name: "{{completedBy}}", description: "Completed by user" },
            { name: "{{timeRemaining}}", description: "Time until due" },
          ]
        }
      default:
        return null
    }
  }

  const config = getConfig()
  if (!config) return null

  const Icon = config.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-purple-600" />
            {config.title}
          </DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="inapp">In-App</TabsTrigger>
          </TabsList>
          
          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="space-y-4">
              {config.templates.email.map((template, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className={`bg-${template.color}-100 text-${template.color}-700 px-2 py-1 rounded text-xs`}>
                      {template.label}
                    </span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <Label htmlFor={`${type}-${index}-subject`}>Subject</Label>
                    <Textarea
                      id={`${type}-${index}-subject`}
                      className="min-h-[40px] bg-white"
                      defaultValue={template.subject}
                    />
                    <Label htmlFor={`${type}-${index}-body`}>Message Body</Label>
                    <Textarea
                      id={`${type}-${index}-body`}
                      className="min-h-[200px] bg-white font-mono text-xs"
                      defaultValue={template.body}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="inapp" className="space-y-4 mt-4">
            <div className="space-y-4">
              {config.templates.inapp.map((template, index) => {
                const TemplateIcon = template.icon
                return (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <span className={`bg-${template.color}-100 text-${template.color}-700 px-2 py-1 rounded text-xs`}>
                        {template.label}
                      </span>
                    </h4>
                    <div className="bg-white p-4 rounded border">
                      <div className="flex items-start gap-3">
                        <div className={`bg-${template.color}-100 p-2 rounded-full`}>
                          <TemplateIcon className={`h-5 w-5 text-${template.color}-600`} />
                        </div>
                        <div className="flex-1 text-sm">
                          <p className="font-semibold">{template.title}</p>
                          <p className="text-gray-600 mt-1">
                            {template.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">{"{{timeAgo}}"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h4 className="font-semibold text-sm mb-2 text-purple-900">Available Variables</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {config.variables.map((variable, index) => (
              <div key={index}>
                <code className="bg-white px-2 py-1 rounded">{variable.name}</code> - {variable.description}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function NotificationTemplateButton({ type }: { type: "cohort" | "instructor" | "non-instructor" | "student" | "schedule" | "task" }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(true)}>
        <Info className="h-5 w-5 text-purple-600" />
      </Button>
      <NotificationTemplateDialog type={type} open={open} onOpenChange={setOpen} />
    </>
  )
}
