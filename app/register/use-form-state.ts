export type UpdateFormState = (update: Partial<FormState>) => void;

import { useState } from "react";

export interface BusinessInfo {
  businessName: string;
  legalEntityName: string;
  businessEmail: string;
  phoneNumber: string;
  industryType: string;
  servicesOffered: string[];
  studentSize: string;
  staffCount: string;
  country: string;
  state: string;
  city: string;
  address: string;
  website: string;
  preferredLanguage: string;
  logo: File | null;
  profilePicture: File | null;
  businessNameFile: File | null;
  pincode: string;
  taxId: string;
  // R2 uploaded image URLs (set after upload)
  businessLogoUrl?: string;
  businessNameUploadUrl?: string;
  profilePictureUrl?: string;
}

export interface AdminInfo {
  fullName: string;
  email: string;
  phone: string;
  // role: string; // Removed role from admin info
  socialProfile?: string;
  agreeToTerms: boolean;
  newsletter: boolean;
}

export interface Preferences {
  referralSource: string;
  otherReferral?: string;
  featuresOfInterest: string[];
}

export interface FormState {
  businessInfo: BusinessInfo;
  adminInfo: AdminInfo;
  preferences: Preferences;
}

export function useFormState() {
  const [formState, setFormState] = useState<FormState>({
    businessInfo: {
      businessName: "",
      legalEntityName: "",
      businessEmail: "",
      phoneNumber: "",
      industryType: "",
      servicesOffered: [],
      studentSize: "",
      staffCount: "",
      country: "",
      state: "",
      city: "",
      address: "",
      website: "",
      preferredLanguage: "",
      logo: null,
      profilePicture: null,
      businessNameFile: null,
      pincode: "",
      taxId: "",
    },
    adminInfo: {
      fullName: "",
      email: "",
      phone: "",
  // role: "", // Removed role from initial state
      socialProfile: "",
      agreeToTerms: false,
      newsletter: false,
    },
    preferences: {
      referralSource: "",
      otherReferral: "",
      featuresOfInterest: [],
    },
  });

  function updateFormState(update: Partial<FormState>) {
    setFormState((prev) => ({
      ...prev,
      ...update,
    }));
  }

  function resetForm() {
    setFormState({
      businessInfo: {
        businessName: "",
        legalEntityName: "",
        businessEmail: "",
        phoneNumber: "",
        industryType: "",
        servicesOffered: [],
        studentSize: "",
        staffCount: "",
        country: "",
        state: "",
        city: "",
        address: "",
        website: "",
        preferredLanguage: "",
        logo: null,
        profilePicture: null,
        businessNameFile: null,
        pincode: "",
        taxId: "",
      },
      adminInfo: {
        fullName: "",
        email: "",
        phone: "",
  // role: "", // Removed role from reset state
        socialProfile: "",
        agreeToTerms: false,
        newsletter: false,
      },
      preferences: {
        referralSource: "",
        otherReferral: "",
        featuresOfInterest: [],
      },
    });
  }

  return { formState, updateFormState, resetForm };
}
