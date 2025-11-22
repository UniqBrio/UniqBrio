export interface InstructorBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: string;
  earnedAt: Date;
}
export interface ContentFormat {
  type: string;
  url: string;
  metadata?: Record<string, any>;
  accessCount?: number;
}

export interface Course {
  _id?: string; // MongoDB ObjectId
  courseId?: string;
  customId?: string; // Custom course identifier
  instructorBadges?: InstructorBadge[];
  streakRewards?: StreakReward[];
  videoSettings?: {
    quality?: string;
    captions?: boolean;
    playbackSpeed?: number;
    speedControl?: boolean;
// ...existing code...
    qualityOptions?: string[];
    subtitlesEnabled?: boolean;
    chaptersEnabled?: boolean;
  };
  contentFormats?: ContentFormat[];
  adaptiveContent?: boolean;
  microModules?: {
    id: string;
    title: string;
    duration: number;
    content: string;
    type: string;
  location?: string;
    prerequisites: string[];
    completionRate: number;
  }[];
  timezoneSupport?: boolean;
  studentAvailability?: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }[];
  dressCode?: string;
  studentGuidelines?: string;
  coachFoodRecommendations?: string;
  additionalEnquiries?: string;
  specialInstructions?: string;
  dynamicPricing?: DynamicPricing;
  affiliateTracking?: {
    enabled: boolean;
    referralCode: string;
    commissionRate: number;
    totalReferrals: number;
    totalCommission: number;
  };
  emiPlans?: EMIPlan[];
  scholarships?: Scholarship[];
  taxInfo?: TaxInfo;
  id: string;
  name: string;
  description: string;
  level: string;
  type: string;
  instructor: string;
  instructorId: string;
  duration: string;
  schedule: string;
  enrolledStudents: number;
  maxStudents: number;
  location?: string;
  price: number;
  priceINR: number;
  paymentCategory?: string;
  currency: "USD" | "INR";
  rating: number;
  status: "Active" | "Inactive" | "Completed" | "Cancelled" | "Draft" | "Upcoming";
  tags: string[];
  modules: Module[];
  completionRate: number;
  chapters: { name: string; description: string; referencePdf?: File; assignmentPdf?: File }[];
  schedulePeriod: {
    startDate: string;
    endDate: string;
    totalWeeks: string;
  };
  sessionDetails: {
    sessionDuration: string;
    maxClasses: string;
  };
  frequencies: { days: string[]; start: string; end: string; sessions: string }[];
  referralCode?: string;
  commissionRate?: string;
  referralStart?: string;
  referralEnd?: string;
  referralStatus?: string;
  
  // Ongoing Training Pricing
  // Note: For Ongoing Training courses, price (priceINR) is per payment frequency (not one-time)
  paymentFrequency?: string;  // Required for Ongoing Training: biweekly, monthly, quarterly, yearly
  trainingDuration?: number;  // Optional: Total duration for Ongoing Training
  pricingPeriods?: {
    id: string;
    startMonth: number;
    endMonth: number;
    price: string;
    description?: string;
  }[];
  
  courseCategory?: string;
  frequencyDetails?: { selectedDays: string[]; dayTimes: any };
  faqs: { question: string; answer: string; isEditing: boolean }[];
  reminderSettings: {
    pushEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    frequency?: string;
    customSchedule: { type: string; daysBefore: string; hoursBefore: string; timeOfDay: string; enabled: boolean; customType?: string }[];
    customDays?: string;
    customInterval?: string;
  };
  freeGifts: string[];

  // Analytics
  cohortAnalysis: CohortData[]
  learningBehavior: LearningBehavior
  roiCalculator: ROIData
  dropoffPrediction: DropoffPrediction

  // Instructor Tools
  sharedResources: SharedResource[]
  versionControl: VersionControl[]
  materialAnalytics: MaterialAnalytics

  // Integration & Security
  credentialVerification: boolean
  marketplaceEnabled: boolean
  ltiIntegration: boolean
  contentSecurity: ContentSecurity
  offlineAccess: OfflineAccess

  // Community & Networking
  industryPartners: IndustryPartner[]
  events: Event[]
  alumniNetwork: AlumniData[]

  // Marketing
  promotionTemplates: PromotionTemplate[]
  seasonalPromos: SeasonalPromo[]
  growthAnalytics: GrowthAnalytics
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}

export interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

export interface EMIPlan {
  id: string
  name: string
  installments: number
  interestRate: number
  processingFee: number
  eligibilityCriteria: string[]
  isActive: boolean
}

export interface TaxInfo {
  gstRate: number;
  educationTaxRate: number;
  pan: string;
  autoGeneration: boolean;
  invoicePrefix: string;
  lastInvoiceNumber: number;
  taxDocuments: TaxDocument[];
  gstEnabled: boolean;
}

export interface TaxDocument {
  id: string
  type: "GST" | "Education Tax" | "Invoice"
  documentUrl: string
  generatedAt: Date
  name: string;
  url: string;
  date: string;
}

export interface Scholarship {
  id: string
  name: string
  amount: number
  percentage?: number
  criteria: string[]
  status: "Active" | "Expired" | "Pending"
  applicants: string[]
  recipients: string[]
}

export interface DynamicPricing {
  enabled: boolean
  demandMultiplier: number
  performanceBonus: number
  enrollmentThreshold: number
  currentPrice: number
  suggestedPrice: number
}

export interface AffiliateTracking {
  enabled: boolean
  referralCode: string
  commissionRate: number
  totalReferrals: number
  totalCommission: number
}

export interface ReminderSettings {
  pushEnabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean
  frequency: "daily" | "3days" | "weekly"
  customSchedule: ReminderSchedule[]
}

export interface ReminderSchedule {
  type: "class" | "test" | "payment" | "assignment" | "other"
  customType?: string
  daysBefore: number | string
  hoursBefore?: number | string
  timeOfDay: string
  enabled: boolean
}

export interface MicroModule {
  id: string
  title: string
  duration: number // in minutes
  content: string
  type: "video" | "text" | "interactive" | "quiz"
  prerequisites: string[]
  completionRate: number
}



export interface StreakReward {
  id: string
  name: string
  description: string
  streakDays: number
  rewardType: "badge" | "content" | "discount" | "certificate"
  rewardValue: string
  icon: string
}

export interface CohortData {
  cohortId: string
  startDate: Date
  endDate: Date
  studentCount: number
  averageScore: number
  completionRate: number
  dropoutRate: number
  satisfactionScore: number
}

export interface LearningBehavior {
  bestLearningTimes: string[]
  engagementWindows: EngagementWindow[]
  preferredContentTypes: string[]
  averageSessionDuration: number
  peakActivityDays: string[]
}

export interface EngagementWindow {
  startTime: string
  endTime: string
  engagementScore: number
  dayOfWeek: string
}

export interface ROIData {
  courseCost: number
  expectedSalaryIncrease: number
  timeToROI: number // in months
  industryAverageSalary: number
  skillDemandScore: number
}

export interface DropoffPrediction {
  riskScore: number // 0-100
  riskFactors: string[]
  interventionSuggestions: string[]
  predictedDropoffDate?: Date
}

export interface SharedResource {
  id: string
  title: string
  type: "slide" | "rubric" | "template" | "document"
  url: string
  sharedBy: string
  sharedAt: Date
  downloads: number
  rating: number
}

export interface VersionControl {
  id: string
  resourceId: string
  version: string
  changes: string
  updatedBy: string
  updatedAt: Date
  isActive: boolean
}

export interface MaterialAnalytics {
  resourceId: string
  views: number
  downloads: number
  averageRating: number
  successRate: number
  engagementTime: number
}

export interface ContentSecurity {
  watermarkEnabled: boolean
  downloadProtection: boolean
  screenRecordingProtection: boolean
  accessLogging: boolean
  licenseTracking: boolean
}

export interface OfflineAccess {
  enabled: boolean
  downloadLimit: number
  currentDownloads: number
  expiryDays: number
  accessLogs: OfflineAccessLog[]
}

export interface OfflineAccessLog {
  userId: string
  resourceId: string
  downloadedAt: Date
  accessedAt: Date
  deviceInfo: string
}

export interface IndustryPartner {
  id: string
  name: string
  logo: string
  description: string
  jobOpenings: JobOpening[]
  internships: Internship[]
  isActive: boolean
}

export interface JobOpening {
  id: string
  title: string
  description: string
  requirements: string[]
  salary: string
  location: string
  type: "full-time" | "part-time" | "contract"
  postedAt: Date
  expiresAt: Date
}

export interface Internship {
  id: string
  title: string
  description: string
  duration: string
  stipend: number
  requirements: string[]
  location: string
  postedAt: Date
  expiresAt: Date
}

export interface Event {
  id: string
  title: string
  description: string
  type: "webinar" | "workshop" | "networking" | "conference"
  date: Date
  duration: number
  speaker: Speaker
  maxAttendees: number
  registeredAttendees: string[]
  isPublic: boolean
}

export interface Speaker {
  id: string
  name: string
  title: string
  company: string
  bio: string
  avatar: string
  socialLinks: Record<string, string>
}

export interface AlumniData {
  userId: string
  graduationYear: number
  currentRole: string
  currentCompany: string
  industry: string
  location: string
  isPublic: boolean
  achievements: string[]
}

export interface PromotionTemplate {
  id: string
  name: string
  template: string
  variables: string[]
  channels: ("email" | "social" | "website")[]
  isActive: boolean
}

export interface SeasonalPromo {
  id: string
  name: string
  description: string
  discountPercentage: number
  startDate: Date
  endDate: Date
  conditions: string[]
  isActive: boolean
}

export interface GrowthAnalytics {
  enrollmentTrend: TrendData[]
  revenueTrend: TrendData[]
  completionTrend: TrendData[]
  satisfactionTrend: TrendData[]
}

export interface TrendData {
  date: string
  value: number
  change: number
}

export interface AvailabilitySlot {
  dayOfWeek: number
  startTime: string
  endTime: string
  isAvailable: boolean
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  criteria: string
  earnedAt?: Date
}

export interface Module {
  id: string
  title: string
  description: string
  duration: string
  status: "Not Started" | "In Progress" | "Completed"
  resources: Resource[]
  assignments: Assignment[]
}

export interface Resource {
  id: string
  title: string
  type: "Video" | "PDF" | "Audio" | "Link" | "Interactive"
  url: string
  duration?: number
  size?: number
}

export interface Assignment {
  id: string
  title: string
  dueDate: string
  status: "Not Started" | "Submitted" | "Graded"
  grade?: number
  maxGrade: number
}
