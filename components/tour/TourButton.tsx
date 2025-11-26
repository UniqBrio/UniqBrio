"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Play, X } from "lucide-react";
import { TourOverlay } from "./TourOverlay";
import { getTourProgress, resetTour } from "./tour-data";
import { useCustomColors } from "@/lib/use-custom-colors";

export function TourButton() {
  const { primaryColor } = useCustomColors();
  const pathname = usePathname();
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);

  // Only show on dashboard home page
  const isHomePage = pathname === "/dashboard";

  useEffect(() => {
    // Check if user has completed the tour
    const progress = getTourProgress();
    if (!progress || !progress.completed) {
      // Show welcome popup for first-time users only on home page
      const hasSeenWelcome = localStorage.getItem('tourWelcomeSeen');
      if (!hasSeenWelcome && isHomePage) {
        setShowWelcome(true);
        localStorage.setItem('tourWelcomeSeen', 'true');
      }
    }
  }, [isHomePage]);

  const startTour = () => {
    resetTour();
    setCurrentStep(0);
    setIsTourActive(true);
    setShowWelcome(false);
  };

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleSkip = () => {
    setIsTourActive(false);
    setShowWelcome(false);
  };

  const handleClose = () => {
    setIsTourActive(false);
  };

  return (
    <>
      {/* Welcome Popup - only on home page */}
      {showWelcome && !isTourActive && isHomePage && (
        <div className="fixed top-20 right-6 w-96 z-[9999] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
            <div
              className="px-6 py-4 text-white relative"
              style={{ backgroundColor: primaryColor }}
            >
              <button
                onClick={() => setShowWelcome(false)}
                className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold pr-8">Welcome to UniqBrio! 🎉</h3>
            </div>

            <div className="px-6 py-6">
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">
                Would you like to take a guided tour of your dashboard? We'll walk you through all the features and help you get started.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={startTour}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white font-medium rounded-md transition-all hover:shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Play className="w-4 h-4" />
                  Start Tour
                </button>
                <button
                  onClick={() => setShowWelcome(false)}
                  className="px-4 py-2.5 text-gray-700 dark:text-gray-300 font-medium border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Tour Button - only on home page */}
      {!isTourActive && !showWelcome && isHomePage && (
        <button
          onClick={startTour}
          className="fixed top-20 right-6 z-[9998] flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 animate-in slide-in-from-right-4 duration-300"
          style={{ backgroundColor: primaryColor }}
          title="Start Home Tour"
        >
          <Play className="w-4 h-4" />
          <span className="text-sm">Home Tour</span>
        </button>
      )}

      {/* Tour Overlay */}
      <TourOverlay
        isActive={isTourActive}
        onClose={handleClose}
        currentStep={currentStep}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSkip={handleSkip}
      />
    </>
  );
}
