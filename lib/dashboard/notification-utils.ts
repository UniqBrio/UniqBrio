export interface DashboardNotification {
  id: string
  title?: string
  message?: string
  type?: string
  timestamp?: string
  read?: boolean
}

const relativeIso = (minutesAgo: number) => {
  const timestamp = Date.now() - minutesAgo * 60 * 1000
  return new Date(timestamp).toISOString()
}

export const createSampleNotifications = (): DashboardNotification[] => [
  {
    id: "sample-payment",
    type: "payment_received",
    title: "Payment received",
    message: "Arjun Pai just paid INR 12,500 for Robotics 101",
    timestamp: relativeIso(5),
    read: false,
  },
  {
    id: "sample-student",
    type: "student_added",
    title: "New student enrolled",
    message: "Meera S. joined the Design Sprint bootcamp",
    timestamp: relativeIso(18),
    read: false,
  },
  {
    id: "sample-course",
    type: "course_added",
    title: "Course published",
    message: "Growth Marketing Cohort is now live",
    timestamp: relativeIso(45),
    read: true,
  },
]
