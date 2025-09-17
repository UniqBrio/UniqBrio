"use client"
// Extend window type for analytics
declare global {
  interface Window {
    analytics?: any;
  }
}

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import BusinessInfoStep from "./steps/business-info-step"
import AdminInfoStep from "./steps/admin-info-step"
import PreferencesStep from "./steps/preferences-step"
import SuccessStep from "./steps/success-step"
// import { Logo } from "@/components/logo"
import { Logo } from "@/components/ui/logo"
import { useFormState, type FormState, type UpdateFormState } from "./use-form-state"
import Confetti from "react-confetti"
import { businessInfoSchema, adminInfoSchema, preferencesSchema } from "@/lib/validations/registration"
import { z } from "zod"
import TourPage from "../tour/page"

export default function RegistrationForm() {
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [readyToSubmit, setReadyToSubmit] = useState(false);
  const router = useRouter()
  useEffect(() => {
    if (showWelcomePopup) {
      const timer = setTimeout(() => {
        setShowWelcomePopup(false);
        if (readyToSubmit) {
          setReadyToSubmit(false);
          handleSubmit();
        }
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [showWelcomePopup, readyToSubmit]);
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [showHomeTour, setShowHomeTour] = useState(false);
  const { formState, updateFormState, resetForm } = useFormState()

  // Load saved progress from localStorage on component mount
  useEffect(() => {
    const savedProgress = localStorage.getItem("uniqbrio_registration_progress")
    if (savedProgress) {
      try {
        const parsedProgress = JSON.parse(savedProgress)
        updateFormState(parsedProgress)
      } catch (error) {
        console.error("Failed to parse saved progress:", error)
      }
    }
  }, [])

  // Save progress to localStorage whenever formState changes
  useEffect(() => {
    localStorage.setItem("uniqbrio_registration_progress", JSON.stringify(formState))
  }, [formState])

  const steps = [
    { name: "Business Information", component: BusinessInfoStep },
    { name: "Owner/Admin Information", component: AdminInfoStep },
    { name: "Setup Preferences", component: PreferencesStep },
  ]

  const validateStep = useCallback(
    async (step: number) => {
      try {
        if (step === 0) {
          await businessInfoSchema.parseAsync(formState.businessInfo)
        } else if (step === 1) {
          await adminInfoSchema.parseAsync(formState.adminInfo)
        } else if (step === 2) {
          await preferencesSchema.parseAsync(formState.preferences)
        }
        return true
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Group errors by field for more comprehensive feedback
          const errorsByField: Record<string | number, string[]> = {}
          error.errors.forEach((err) => {
            const field = err.path[err.path.length - 1]
            if (!errorsByField[field]) {
              errorsByField[field] = []
            }
            errorsByField[field].push(err.message)
          })

          // Show toast with the first error
          const firstError = error.errors[0]
          toast({
            title: "Validation Error",
            description: (
              <div className="space-y-2">
                <p>{firstError.message}</p>
                {Object.keys(errorsByField).length > 1 && (
                  <p className="text-xs text-muted-foreground">
                    {Object.keys(errorsByField).length - 1} more field(s) need attention
                  </p>
                )}
              </div>
            ),
            variant: "destructive",
          })
        }
        return false
      }
    },
    [formState, toast],
  )

  const handleNext = async () => {
    const isValid = await validateStep(currentStep)

    if (isValid) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        // Show welcome popup before submitting
        setShowWelcomePopup(true)
        setReadyToSubmit(true)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // Remove file objects from businessInfo before sending
      const { businessInfo, ...rest } = formState;
      const {
        logo,
        profilePicture,
        businessNameFile,
        ...serializableBusinessInfo
      } = businessInfo;
      const payload = {
        businessInfo: serializableBusinessInfo,
        ...rest,
      };
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Registration failed");
      }
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
      let errorMsg = "There was an error creating your business. Please try again.";
      if (error instanceof Error) {
        errorMsg = error.message;
      }
      // Try to get backend error message from response
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        error.response instanceof Response
      ) {
        try {
          const data = await error.response.json();
          if (data.error) errorMsg = data.error;
        } catch {}
      }
      console.error("Registration failed:", errorMsg);
      toast({
        title: "Registration Failed",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const progressPercentage = ((currentStep + 1) / (steps.length + 1)) * 100

  let CurrentStepComponent = steps[currentStep].component;
  if (registrationComplete && showHomeTour) {
    CurrentStepComponent = TourPage;
  } else if (registrationComplete) {
    CurrentStepComponent = SuccessStep;
  }

  return (
    <Card className="w-full shadow-lg relative">
      <CardHeader className="space-y-2 text-center">
        <div className="flex justify-center mb-4">
          <Logo className="h-12 w-auto" />
        </div>
        <CardTitle className="text-2xl md:text-3xl font-bold">Please Register Your Academy</CardTitle>
        <CardDescription className="text-base">Mentoring Businesses, Nurturing Learners</CardDescription>
        <CardDescription className="text-sm">Join UniqBrio to streamline your academy management</CardDescription>
        <div className="pt-2">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            {steps.map((step, index) => (
              <span key={index} className={`${currentStep >= index ? "text-primary font-medium" : ""}`}>
                Step {index + 1}
              </span>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CurrentStepComponent formState={formState} updateFormState={updateFormState as UpdateFormState} />
            
          </motion.div>
        </AnimatePresence>
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
      <CardFooter className="flex justify-between px-6 py-4 border-t">
        {!registrationComplete && (
          <>
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 0 || isSubmitting || showWelcomePopup}>
              Back
            </Button>
            {currentStep === steps.length - 1 ? (
              <Button
                disabled={isSubmitting || showWelcomePopup}
                onClick={() => {
                  setShowWelcomePopup(true);
                  setReadyToSubmit(true);
                }}
                className="bg-primary text-white border-2 border-primary hover:bg-primary/90 transition font-semibold px-6 py-2 rounded-lg"
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
                ) : "Welcome to UniqBrio"}
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={isSubmitting || showWelcomePopup}>
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
                ) : "Next"}
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  )
}
