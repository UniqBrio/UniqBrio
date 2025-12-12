import { PlanKey } from "./types"

export const PLANS: Record<PlanKey, { 
  name: string; 
  monthly: number; 
  yearly: number; 
  originalMonthly?: number;
  originalYearly?: string;
  badge?: string; 
  icon?: string;
  description: string;
  tagline: string;
  features: string[];
  additionalFeatures?: string[];
  scaleOnly?: string[]; 
  studentLimit?: string;
  savingsMonthly?: string;
  savingsYearly?: string;
} > = {
  free: {
    name: "Free",
    monthly: 0,
    yearly: 0,
    icon: "trending-up",
    description: "Best for: <15 active students",
    tagline: "Perfect for new academies or testing UniqBrio risk-free",
    features: [
      "Up to 14 active students",
      "Basic scheduling & attendance",
      "1 branch location",
      "Email support",
      "No credit card required",
    ],
    studentLimit: "8 of 14 students",
  },
  grow: {
    name: "Grow",
    monthly: 1099,
    yearly: 11988,
    originalYearly: "999",
    savingsYearly: "Save ₹1,200/year",
    badge: "Most Popular",
    icon: "zap",
    description: "Best for: Dance, cricket, badminton & arts academies",
    tagline: "Everything you need to run a thriving academy",
    features: [
      "Unlimited students",
      "All scheduling features",
      "Automated payment reminders",
      "Advanced analytics & reports",
      "Multiple instructors",
      "Priority support",
      "Custom branding",
    ],
    additionalFeatures: [
      "Unlimited students",
      "All scheduling features",
      "Automated payment reminders",
      "Advanced analytics & reports",
      "Multiple instructors",
      "Priority support",
      "Custom branding",
    ],
  },
  scale: {
    name: "Scale",
    monthly: 5799,
    yearly: 59988,
    originalYearly: "4,999",
    savingsYearly: "Save ₹9,600/year",
    icon: "crown",
    description: "Best for: Multi-branch or 200+ students",
    tagline: "For established academies ready to scale",
    features: [
      "Payroll management",
      "Merchandise store",
      "Custom reports & exports",
      "White-label branding",
      "Dedicated account manager",
      "Phone support",
      "Custom integrations",
    ],
    additionalFeatures: [
      "Payroll management",
      "Merchandise store",
      "Custom reports & exports",
      "White-label branding",
      "Dedicated account manager",
      "Phone support",
      "Custom integrations",
    ],
    scaleOnly: [
      "Payroll management",
      "Merchandise store",
      "White-label branding",
      "Dedicated account manager",
      "Custom integrations",
    ],
  },
}
