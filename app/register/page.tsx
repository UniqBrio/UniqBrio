"use client"
// Extend window type for analytics
declare global {
  interface Window {
    analytics?: any;
  }
}

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import BusinessInfoStep from "./steps/business-info-step"
import AdminInfoStep from "./steps/admin-info-step"
import PreferencesStep from "./steps/preferences-step"
import SuccessStep from "./steps/success-step"
import { Logo } from "@/components/ui/logo"
import { useFormState, type FormState, type UpdateFormState } from "./use-form-state"
import Confetti from "react-confetti"
import { businessInfoSchema, adminInfoSchema, preferencesSchema } from "@/lib/validations/registration"
import { z } from "zod"
import TourPage from "../tour/page"
import { motion } from "framer-motion"

export default function RegistrationForm() {
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const router = useRouter()
  useEffect(() => {
    if (!showWelcomePopup) return;
    const timer = setTimeout(() => setShowWelcomePopup(false), 4000);
    return () => clearTimeout(timer);
  }, [showWelcomePopup]);
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [showHomeTour, setShowHomeTour] = useState(false);
  const { formState, updateFormState, resetForm } = useFormState()
  const { businessInfo, adminInfo, preferences } = formState
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({})

  // Fetch user data from session and prefill form
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.authenticated && data.session) {
            console.log("[Registration] Prefilling form with session data:", data.session);
            
            // Set isAuthenticated flag to prevent token refresh handler from clearing session
            localStorage.setItem("isAuthenticated", "true");
            
            // Prefill admin info from session
            updateFormState((prev) => ({
              adminInfo: {
                ...prev.adminInfo,
                fullName: data.session.name || prev.adminInfo.fullName || "",
                email: data.session.email || prev.adminInfo.email || "",
                phone: data.session.phone || prev.adminInfo.phone || "",
              },
            }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch user session data:", error);
      }
    };

    // Load saved progress from localStorage on component mount
    const savedProgress = localStorage.getItem("uniqbrio_registration_progress")
    if (savedProgress) {
      try {
        const parsedProgress = JSON.parse(savedProgress)
        if (parsedProgress?.businessInfo) {
          parsedProgress.businessInfo.logo = null
          parsedProgress.businessInfo.profilePicture = null
          parsedProgress.businessInfo.businessNameFile = null
        }
        updateFormState(parsedProgress)
      } catch (error) {
        console.error("Failed to parse saved progress:", error)
      }
    }

    // Fetch and prefill user data from session
    fetchUserData();
  }, [])

  // Save progress to localStorage whenever formState changes
  useEffect(() => {
    const stateToPersist = {
      ...formState,
      businessInfo: {
        ...formState.businessInfo,
        logo: null,
        profilePicture: null,
        businessNameFile: null,
      },
    }

    localStorage.setItem("uniqbrio_registration_progress", JSON.stringify(stateToPersist))
  }, [formState])

  const validateAllSteps = useCallback(async () => {
    try {
      await businessInfoSchema.parseAsync(formState.businessInfo)
      await adminInfoSchema.parseAsync(formState.adminInfo)
      await preferencesSchema.parseAsync(formState.preferences)
      setFieldErrors({})
      return { valid: true as const }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const flattened: Record<string, string> = {}
        error.errors.forEach((err) => {
          const field = err.path[err.path.length - 1]
          if (typeof field === "string" && !flattened[field]) {
            flattened[field] = err.message
          }
        })
        setFieldErrors(flattened)
        return { valid: false as const, errors: flattened }
      }

      return { valid: false as const, errors: {} }
    }
  }, [formState])

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const { [field]: _, ...rest } = prev
      return rest
    })
  }

  const formatValue = (value: string | null | undefined) => {
    if (typeof value !== "string") return value ? String(value) : "-"
    const trimmed = value.trim()
    return trimmed ? trimmed : "-"
  }

  const formatLabel = (value: string | null | undefined) => {
    const base = formatValue(value)
    if (typeof base !== "string" || base === "-") return base
    return base
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const formatLabelList = (items: string[] | undefined | null) => {
    if (!items || items.length === 0) return "-"
    return items
      .map((item) => formatLabel(item) as string)
      .join(", ")
  }

  const fieldFocusSelectors = useMemo<Record<string, string[]>>(
    () => ({
      businessName: ["#businessName"],
      businessEmail: ["#businessEmail"],
      phoneNumber: ["#phoneNumber"],
      industryType: ["#industryType", '[data-field="industryType"]'],
      servicesOffered: ["#servicesOffered", '[data-field="servicesOffered"]'],
      studentSize: ["#studentSize", '[data-field="studentSize"]'],
      staffCount: ["#staffCount", '[data-field="staffCount"]'],
      country: ["#country", '[data-field="country"]'],
      state: ["#state", '[data-field="state"]'],
      city: ["#city"],
      address: ["#address"],
      pincode: ["#pincode"],
      preferredLanguage: ["#preferredLanguage", '[data-field="preferredLanguage"]'],
      fullName: ["#fullName"],
      email: ["#email"],
      phone: ["#phone"],
      referralSource: ["#referralSource", '[data-field="referralSource"]'],
      otherReferral: ["#otherReferral", '[data-field="otherReferral"]'],
    }),
    [],
  )

  const focusFirstInvalidField = useCallback(
    (entries: Array<[string, string]>) => {
      if (typeof window === "undefined") return

      for (const [field] of entries) {
        const selectors = fieldFocusSelectors[field] ?? [`#${field}`, `[data-field="${field}"]`]
        for (const selector of selectors) {
          if (!selector) continue
          const element = document.querySelector<HTMLElement>(selector)
          if (!element) continue

          try {
            element.focus({ preventScroll: true })
          } catch {
            element.focus()
          }

          element.scrollIntoView({ behavior: "smooth", block: "center" })
          return
        }
      }

      window.scrollTo({ top: 0, behavior: "smooth" })
    },
    [fieldFocusSelectors],
  )

  const readVisibleField = (field: string) => {
    const selectors = fieldFocusSelectors[field] ?? [`#${field}`, `[data-field="${field}"]`]
    for (const selector of selectors) {
      const el = document.querySelector<HTMLElement>(selector)
      if (!el) continue
      // prefer input/textarea value when available
      if ((el as HTMLInputElement).value) return (el as HTMLInputElement).value
      const text = el.textContent?.trim()
      if (text && text !== "") return text
    }
    return ""
  }

  const getFriendlyErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
      const rawMessage = err.message || ""
      const trimmedMessage = rawMessage.trim()
      const normalized = trimmedMessage.toLowerCase()

      // File upload errors
      if (normalized.includes("413") || normalized.includes("too large")) {
        return "Your uploaded files are too large. Please use images under 2 MB."
      }

      // Network errors
      if (normalized.includes("timeout")) {
        return "The request is taking longer than expected. Please try again."
      }

      if (normalized.includes("failed to fetch") || normalized.includes("network error")) {
        return "Unable to connect to server. Please check your internet connection and try again."
      }

      // Validation errors (pass through as they're already user-friendly)
      if (normalized.includes("required") || 
          normalized.includes("invalid") || 
          normalized.includes("must be") ||
          normalized.includes("please")) {
        return trimmedMessage
      }

      // Registration already complete
      if (normalized.includes("already completed") || normalized.includes("already registered")) {
        return "Your academy is already registered. Please log in to access your dashboard."
      }

      // Database/server errors - hide technical details
      if (normalized.includes("status 500") || normalized.includes("internal server")) {
        return "We're experiencing technical difficulties. Please try again in a few moments."
      }

      if (normalized.includes("status 400") || normalized.includes("bad request")) {
        return "Some information is missing or incorrect. Please review your details and try again."
      }

      if (normalized.includes("status 404")) {
        return "We couldn't find your account. Please verify your email address."
      }

      if (normalized.includes("status 403") || normalized.includes("not verified")) {
        return "Please verify your email address before completing registration."
      }

      // Generic error with status code - make it friendly
      if (normalized.includes("failed with status") || normalized.includes("registration failed")) {
        return "Unable to complete registration. Please try again or contact support if the issue persists."
      }

      // If message seems user-friendly (no tech jargon), return it
      if (!normalized.includes("error:") && 
          !normalized.includes("exception") && 
          !normalized.includes("stack") &&
          trimmedMessage.length < 150) {
        return trimmedMessage
      }
    }

    return "Unable to complete registration. Please try again or contact support."
  }

  const handleRegister = async () => {
    if (isSubmitting) return
    // Quick guard: if state is empty, don't open review — focus state first
    if (!formState.businessInfo.state || String(formState.businessInfo.state).trim() === "") {
      const msg = "Please select a state or province."
      setFieldErrors((prev) => ({ ...prev, state: msg }))
      focusFirstInvalidField([["state", msg]])
      return
    }

    const result = await validateAllSteps()

    if (result.valid) {
      // Build preview values from formState (authoritative) so modal reflects actual data
      try {
        const preview: Record<string, string> = {
          businessName: formatValue(businessInfo.businessName),
          legalEntityName: formatValue(businessInfo.legalEntityName),
          businessEmail: formatValue(businessInfo.businessEmail),
          phoneNumber: formatValue(businessInfo.phoneNumber),
          industryType: formatLabel(businessInfo.industryType),
          servicesOffered: formatLabelList(businessInfo.servicesOffered),
          studentSize: formatLabel(businessInfo.studentSize),
          staffCount: formatLabel(businessInfo.staffCount),
          country: formatLabel(businessInfo.country),
          state: formatLabel(businessInfo.state),
          city: formatValue(businessInfo.city),
          pincode: formatValue(businessInfo.pincode),
          address: formatValue(businessInfo.address),
          website: formatValue(businessInfo.website),
          preferredLanguage: formatLabel(businessInfo.preferredLanguage),
          taxId: formatValue(businessInfo.taxId),
          fullName: formatValue(adminInfo.fullName),
          email: formatValue(adminInfo.email),
          phone: formatValue(adminInfo.phone),
          referralSource: formatLabel(preferences.referralSource),
          otherReferral: formatValue(preferences.otherReferral),
        }

        setPreviewValues(preview)
      } catch (e) {
        console.warn("[Registration] Failed to build preview values", e)
      }

      setReviewOpen(true)
      return
    }

    const errors = result.errors ?? {}
    const entries = Object.entries(errors)

    if (entries.length > 0) {
      setFieldErrors((prev) => ({
        ...prev,
        ...Object.fromEntries(entries),
      }))
    }

    focusFirstInvalidField(entries)
  }

  const handleSubmit = async () => {
    setReviewOpen(false)
    setIsSubmitting(true)

    try {
      // Upload images to R2 bucket first
      const { businessInfo, adminInfo, preferences } = formState;
      const {
        logo,
        profilePicture,
        businessNameFile,
        ...serializableBusinessInfo
      } = businessInfo;

      const logoFile = logo instanceof File ? logo : null;
      const profilePictureFile = profilePicture instanceof File ? profilePicture : null;
      const businessNameUploadFile = businessNameFile instanceof File ? businessNameFile : null;

      let uploadedImageUrls: {
        businessLogoUrl?: string;
        businessNameUploadUrl?: string;
        profilePictureUrl?: string;
      } = {};

      // Upload business images if any are provided
      if (logoFile || businessNameUploadFile || profilePictureFile) {
        const imageFormData = new FormData();
        
        if (logoFile) {
          imageFormData.append("businessLogo", logoFile);
        }
        if (businessNameUploadFile) {
          imageFormData.append("businessNameUpload", businessNameUploadFile);
        }
        if (profilePictureFile) {
          imageFormData.append("profilePicture", profilePictureFile);
        }
        imageFormData.append("businessName", businessInfo.businessName || "academy");
        imageFormData.append("userEmail", adminInfo.email || ""); // Include email for first-time users

        console.log("[Registration] Uploading business images...");
        // Use raw fetch here to capture raw response body for diagnostics when server returns non-JSON
        const resp = await fetch("/api/business-upload", {
          method: "POST",
          body: imageFormData,
          credentials: "include",
        });
        const respText = await resp.text();
        console.log("[Registration] /api/business-upload status:", resp.status, "response:", respText);

        let uploadData: any = null;
        try {
          uploadData = respText ? JSON.parse(respText) : null;
        } catch (e) {
          throw new Error(`Upload failed: ${resp.status} - ${respText}`);
        }

        if (!resp.ok || !uploadData || !uploadData.success) {
          throw new Error(uploadData?.error || `Failed to upload images (status ${resp.status})`);
        }

        uploadedImageUrls = {
          businessLogoUrl: uploadData.businessLogoUrl,
          businessNameUploadUrl: uploadData.businessNameUploadUrl,
          profilePictureUrl: uploadData.profilePictureUrl,
        };

        console.log("[Registration] Images uploaded successfully:", uploadedImageUrls);
      }

      // Prepare payload with uploaded image URLs
      const { socialProfile: _socialProfile, agreeToTerms: _agreeToTerms, newsletter: _newsletter, ...serializableAdminInfo } = adminInfo;

      const payload = {
        businessInfo: {
          ...serializableBusinessInfo,
          ...uploadedImageUrls,
        },
        adminInfo: serializableAdminInfo,
        preferences,
      };

      console.log("[Registration] Submitting registration with image URLs...");
      
      // Debug: Check what cookies are actually present in document.cookie
      // Note: httpOnly cookies won't appear here but will still be sent by browser
      console.log("[Registration Client] Readable cookies (non-httpOnly):", document.cookie);
      console.log("[Registration Client] Note: Session cookie is httpOnly and won't appear above, but should be sent automatically");
      
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Important: Send cookies with the request
        body: JSON.stringify(payload),
      })

      const responseText = await response.text()
      console.log("[Registration] /api/register status:", response.status, "body:", responseText)

      let data: any = null
      try {
        data = responseText ? JSON.parse(responseText) : null
      } catch (e) {
        throw new Error(`Registration failed: ${response.status} - ${responseText}`)
      }

      if (!response.ok || !data?.success) {
        const serverError = data?.error || "Registration failed"
        console.error("[Registration] Server error:", { 
          status: response.status, 
          error: serverError, 
          details: data?.details 
        })
        // Throw user-friendly error based on status code
        if (response.status === 500) {
          throw new Error("Unable to complete registration due to a server issue.")
        } else if (response.status === 400) {
          throw new Error(serverError) // 400 errors are usually validation, show them
        } else if (response.status === 403) {
          throw new Error("Please verify your email before completing registration.")
        } else {
          throw new Error(serverError)
        }
      }

      setShowWelcomePopup(true);
      toast({
        title: "Registration Successful!",
        description: (
          <div>
            <div>Academy ID: <b>{data.academyId}</b></div>
            <div>User ID: <b>{data.userId}</b></div>
          </div>
        ),
        variant: "default",
      });
      setRegistrationComplete(true);
      localStorage.removeItem("uniqbrio_registration_progress");
      // Set flag for dashboard tour
      window.localStorage.setItem("justRegistered", "true");

      // Update user context/localStorage for persistent info
      const userRaw = localStorage.getItem("uniqbrio-user");
      let user = userRaw ? JSON.parse(userRaw) : {};
      user = {
        ...user,
        id: data.userId,
        academyId: data.academyId,
        registrationComplete: true,
        // Optionally add more info from registration form
      };
      localStorage.setItem("uniqbrio-user", JSON.stringify(user));

      // Redirect to dashboard after successful registration
      router.push("/dashboard");
    } catch (error) {
      const friendlyMessage = getFriendlyErrorMessage(error);
      console.error("[Registration] Registration failed:", error);
      console.error("[Registration] Error type:", error instanceof Error ? error.constructor.name : typeof error);
      toast({
        title: "Registration Incomplete",
        description: friendlyMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (registrationComplete && showHomeTour) {
    return <TourPage />;
  }
  
  if (registrationComplete) {
    return <SuccessStep />;
  }

  return (
    <>
      <Card className="w-full max-w-5xl mx-auto shadow-lg relative">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-0">
            <Logo className="h-24 w-auto" />
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold">Please Register Your Academy</CardTitle>
          <CardDescription className="text-base">Mentoring Businesses, Nurturing Learners</CardDescription>
          <CardDescription className="text-sm">Join UniqBrio to streamline your academy management</CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-4">
          <div className="space-y-8">
            {/* Business Information Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold border-b pb-2">Business Information</h3>
              <BusinessInfoStep
                formState={formState}
                updateFormState={updateFormState as UpdateFormState}
                externalErrors={fieldErrors}
                clearFieldError={clearFieldError}
              />
            </div>

            {/* Admin Information Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold border-b pb-2">Owner/Admin Information</h3>
              <AdminInfoStep
                formState={formState}
                updateFormState={updateFormState as UpdateFormState}
                externalErrors={fieldErrors}
                clearFieldError={clearFieldError}
              />
            </div>

            {/* Preferences Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold border-b pb-2">Setup Preferences</h3>
              <PreferencesStep
                formState={formState}
                updateFormState={updateFormState as UpdateFormState}
                externalErrors={fieldErrors}
                clearFieldError={clearFieldError}
              />
            </div>
          </div>

          {showWelcomePopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              {/* Confetti animation */}
              <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={250} recycle={false} />
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center relative"
                style={{ minWidth: 320 }}
              >
                {/* Popper animation */}
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                  <motion.div
                    initial={{ y: -40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="flex gap-2"
                  >
                  <span className="text-4xl">🎉</span>
                  <span className="text-4xl">🎊</span>
                  <span className="text-4xl">🎉</span>
                </motion.div>
              </div>
              <h2 className="text-2xl font-bold mb-2 mt-6 text-center">Welcome to UniqBrio!</h2>
              <p className="text-lg text-muted-foreground text-center">We're excited to have you onboard!</p>
              <p className="text-lg text-muted-foreground text-center">We love to serve you</p>
            </motion.div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end px-6 py-4 border-t">
        <Button
          disabled={isSubmitting || showWelcomePopup}
          onClick={handleRegister}
          className="bg-primary text-white border-2 border-primary hover:bg-primary/90 transition font-semibold px-8 py-2 rounded-lg"
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Creating your workspace...
            </span>
          ) : "Register Your Academy"}
        </Button>
      </CardFooter>
      </Card>

      <Dialog open={reviewOpen} onOpenChange={(open) => {
        if (isSubmitting) return
        setReviewOpen(open)
      }}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Review your details</DialogTitle>
            <DialogDescription>
              Confirm everything looks right before you submit. You can close this dialog to make changes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 overflow-y-auto pr-4 flex-1">
            <section className="space-y-4">
              <h4 className="text-lg font-semibold border-b pb-2">Business Information</h4>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Business Name</p>
                  <p className="font-medium text-sm">{previewValues.businessName ?? formatValue(businessInfo.businessName)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Legal Entity Name</p>
                  <p className="font-medium text-sm">{previewValues.legalEntityName ?? formatValue(businessInfo.legalEntityName)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Business Email</p>
                  <p className="font-medium text-sm break-all">{previewValues.businessEmail ?? formatValue(businessInfo.businessEmail)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Contact Number</p>
                  <p className="font-medium text-sm">{previewValues.phoneNumber ?? formatValue(businessInfo.phoneNumber)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Industry Type</p>
                  <p className="font-medium text-sm">{previewValues.industryType ?? formatLabel(businessInfo.industryType)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Services Offered</p>
                  <p className="font-medium text-sm">{previewValues.servicesOffered ?? formatLabelList(businessInfo.servicesOffered)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Student Size</p>
                  <p className="font-medium text-sm">{previewValues.studentSize ?? formatLabel(businessInfo.studentSize)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Staff Count</p>
                  <p className="font-medium text-sm">{previewValues.staffCount ?? formatLabel(businessInfo.staffCount)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Country</p>
                  <p className="font-medium text-sm">{previewValues.country ?? formatLabel(businessInfo.country)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">State</p>
                  <p className="font-medium text-sm">{previewValues.state ?? formatLabel(businessInfo.state)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">City</p>
                  <p className="font-medium text-sm">{previewValues.city ?? formatValue(businessInfo.city)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Postal Code</p>
                  <p className="font-medium text-sm">{previewValues.pincode ?? formatValue(businessInfo.pincode)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Address</p>
                  <p className="font-medium text-sm">{previewValues.address ?? formatValue(businessInfo.address)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Website</p>
                  <p className="font-medium text-sm break-all">{previewValues.website ?? formatValue(businessInfo.website)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Preferred Language</p>
                  <p className="font-medium text-sm">{previewValues.preferredLanguage ?? formatLabel(businessInfo.preferredLanguage)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Tax ID</p>
                  <p className="font-medium text-sm">{previewValues.taxId ?? formatValue(businessInfo.taxId)}</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-lg font-semibold border-b pb-2">Owner/Admin Information</h4>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Full Name</p>
                  <p className="font-medium text-sm">{formatValue(adminInfo.fullName)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                  <p className="font-medium text-sm break-all">{formatValue(adminInfo.email)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Phone Number</p>
                  <p className="font-medium text-sm">{formatValue(adminInfo.phone)}</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-lg font-semibold border-b pb-2">Setup Preferences</h4>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">How did you hear about us?</p>
                  <p className="font-medium text-sm">{formatLabel(preferences.referralSource)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Other Referral Details</p>
                  <p className="font-medium text-sm">{formatValue(preferences.otherReferral)}</p>
                </div>
              </div>
            </section>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReviewOpen(false)}
              disabled={isSubmitting}
            >
              Back to form
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit registration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
