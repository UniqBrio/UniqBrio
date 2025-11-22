export interface Event {
  id: string
  name: string
  sport: string
  // UI-friendly alias for sport category; stored in DB as `sport`
  category?: string
  // optional on frontend; backend defaults to 'Other' when omitted
  type?: "Tournament" | "Workshop" | "Coaching Session" | "Friendly Match" | "Training Camp" | "Championship" | "Seminar" | "Tryout" | "Other"
  description?: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  registrationDeadline: string
  venue: string
  staff: string
  participants: number
  maxParticipants: number
  skillLevel: "Beginner" | "Intermediate" | "Advanced" | "All Levels"
  format: "Individual" | "Team" | "Mixed"
  ageGroup: string
  equipment?: string
  entryFee?: number
  prizes?: string
  rules?: string
  status?: "Upcoming" | "Ongoing" | "Completed"
  isPublished: boolean
  publishedDate?: string
  createdAt: string
  revenue?: number
}

export interface EventFilters {
  statuses: string[]
  sports: string[]
  eventTypes: string[]
  skillLevels: string[]
  formats: string[]
  staffMembers: string[]
  dateRange: { start: string; end: string }
}
