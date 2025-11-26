"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X, ChevronLeft, ChevronRight, Play, SkipForward } from "lucide-react";
import { tourSteps, saveTourProgress, resetTour } from "./tour-data";
import { useCustomColors } from "@/lib/use-custom-colors";

interface TourOverlayProps {
  isActive: boolean;
  onClose: () => void;
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

export function TourOverlay({
  isActive,
  onClose,
  currentStep,
  onNext,
  onPrevious,
  onSkip,
}: TourOverlayProps) {
  const { primaryColor } = useCustomColors();
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  const step = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;

  useEffect(() => {
    if (!isActive || !step) return;

    // Navigate to the step's route if not already there
    const targetRoute = step.route;
    const isExternal = targetRoute.startsWith('http');
    
    if (!isExternal && pathname !== targetRoute) {
      setIsNavigating(true);
      router.push(targetRoute);
      // Small delay to allow page to load
      setTimeout(() => setIsNavigating(false), 500);
    }
  }, [currentStep, isActive, step, pathname, router]);

  if (!isActive || !step) return null;

  const handleNext = () => {
    if (step.route.startsWith('http')) {
      // For external links, open in new tab but continue tour
      window.open(step.route, '_blank');
    }
    onNext();
  };

  const handleFinish = () => {
    saveTourProgress(currentStep, true);
    onClose();
  };

  return (
    <>
      {/* Tour card */}
      <div className="fixed top-20 right-6 w-96 z-[9999] animate-in slide-in-from-top-4 duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div
            className="px-6 py-4 text-white relative"
            style={{ backgroundColor: primaryColor }}
          >
            <button
              onClick={onSkip}
              className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close tour"
              title="Close Tour"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="pr-8 flex items-center gap-3">
              <div className="text-4xl animate-bounce">{step.emoji}</div>
              <div className="flex-1">
                <div className="text-xs font-medium mb-1 opacity-90">
                  Step {currentStep + 1} of {tourSteps.length}
                </div>
                <h3 className="text-xl font-bold">{step.title}</h3>
              </div>
            </div>
          </div>

          {/* Enhanced Progress bar with gradient and sparkle effects */}
          <div className="h-2 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
            <div
              className="h-full transition-all duration-500 ease-out relative"
              style={{
                width: `${((currentStep + 1) / tourSteps.length) * 100}%`,
                background: 'linear-gradient(90deg, #8b5cf6 0%, #f97316 100%)',
                boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)',
              }}
            >
              {/* Animated shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
              
              {/* Sparkle effects at the edge */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-full">
                {/* Main glow */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-400 rounded-full blur-sm animate-pulse" />
              </div>
            </div>
          </div>
          
          <style jsx>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}</style>

          {/* Content */}
          <div className="px-6 py-6">
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {step.description}
            </p>

            {isNavigating && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                <span>Loading page...</span>
              </div>
            )}
          </div>

          {/* Footer with navigation buttons */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={onPrevious}
                disabled={isFirstStep || isNavigating}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              {isLastStep ? (
                <button
                  onClick={handleFinish}
                  disabled={isNavigating}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed animate-pulse"
                  style={{ backgroundColor: primaryColor }}
                >
                  🎊 Finish Tour
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={isNavigating}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-md transition-all hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: primaryColor }}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Skip button inside card */}
            <button
              onClick={onSkip}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            >
              <SkipForward className="w-3 h-3" />
              Skip Tour
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
