import { z } from "zod";

export const businessInfoSchema = z.object({
  businessName: z.string().min(2),
  legalEntityName: z.string().optional(),
  businessEmail: z.string().email(),
  phoneNumber: z.string().min(10),
  industryType: z.string().min(1),
  servicesOffered: z.array(z.string()).min(1),
  studentSize: z.string().min(1),
  staffCount: z.string().min(1),
  country: z.string().min(1),
  state: z.string().min(1),
  city: z.string().min(1),
  address: z.string().min(1),
  website: z.string().optional(),
  preferredLanguage: z.string().min(1),
  logo: z.any().optional(),
  profilePicture: z.any().optional(),
  businessNameFile: z.any().optional(),
  pincode: z.string().min(1),
  taxId: z.string().optional(),
});

export const adminInfoSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  // role removed
  socialProfile: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, { message: "You must agree to the terms and conditions" }),
  newsletter: z.boolean().optional(),
});

export const preferencesSchema = z.object({
  referralSource: z.string().min(1),
  otherReferral: z.string().optional(),
  featuresOfInterest: z.array(z.string()).optional(),
});
