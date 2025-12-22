import { z } from "zod";

const postalCodeSchema = z
  .string()
  .trim()
  .min(1, { message: "Please enter your postal/zip/pin code." })
  .min(3, { message: "Postal/Zip/Pin Code must be at least 3 characters." })
  .max(10, { message: "Postal/Zip/Pin Code cannot exceed 10 characters." })
  .regex(/^[a-zA-Z0-9\s-]+$/, {
    message: "Postal/Zip/Pin Code can only contain letters, numbers, spaces, and hyphens.",
  });

export const businessInfoSchema = z.object({
  businessName: z
    .string()
    .min(2, { message: "Business name must include at least two characters." }),
  legalEntityName: z.string().optional(),
  businessEmail: z.string().email({ message: "Enter a valid business email address." }),
  phoneNumber: z
    .string()
    .min(10, { message: "Phone number must include at least 10 digits." }),
  industryType: z
    .string()
    .min(1, { message: "Please select your industry type." }),
  servicesOffered: z
    .array(z.string())
    .min(1, { message: "Please choose at least one service." }),
  studentSize: z.string().min(1, { message: "Please select your student/client size." }),
  staffCount: z.string().min(1, { message: "Please select your staff count." }),
  country: z.string().min(1, { message: "Please select a country." }),
  state: z.string().min(1, { message: "Please select a state or province." }),
  city: z.string().min(1, { message: "Please enter your city." }),
  address: z.string().min(1, { message: "Please enter your complete business address." }),
  website: z.string().optional(),
  preferredLanguage: z.string().min(1, { message: "Please choose a preferred language." }),
  logo: z.any().optional(),
  profilePicture: z.any().optional(),
  businessNameFile: z.any().optional(),
  pincode: postalCodeSchema,
  taxId: z.string().optional(),
});

export const adminInfoSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must include at least two characters." }),
  email: z.string().email({ message: "Enter a valid email address." }),
  phone: z.string().min(10, { message: "Phone number must include at least 10 digits." }),
});

export const preferencesSchema = z
  .object({
    referralSource: z.string().min(1, { message: "Please tell us how you heard about UniqBrio." }),
    otherReferral: z.string().optional(),
    featuresOfInterest: z.array(z.string()).optional(),
  })
  .refine((data) => {
    // If referralSource is "other", otherReferral must be provided and non-empty
    if (data.referralSource === "other") {
      return data.otherReferral && data.otherReferral.trim().length > 0;
    }
    return true;
  }, {
    message: "Please let us know how you heard about us.",
    path: ["otherReferral"],
  });
