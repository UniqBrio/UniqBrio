export interface Course {
  id: string;
  name: string;
  status: string;
  instructor: string;
  courseCategory: string;
  level: string;
  type: string;
  tags?: string[];
  skills?: string[];
  prerequisites?: string;
  learningOutcomes?: string;
  maxStudents?: number;
  description?: string;
  schedulePeriod?: {
    totalWeeks?: number;
    startDate?: string;
    endDate?: string;
  };
  sessionDetails?: {
    sessionDuration?: number;
    maxClasses?: number;
  };
  frequencies?: string[];
  location?: string;
  virtualClassroomUrl?: string;
  priceINR?: number;
  discountPrice?: number;
  referralCode?: string;
  commissionRate?: number;
  referralStart?: string;
  referralEnd?: string;
  reminderSettings?: {
    pushEnabled?: boolean;
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    frequency?: string;
  };
}
