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
  onDontShowAgain?: () => void;
}

export function TourOverlay({
  isActive,
  onClose,
  currentStep,
  onNext,
  onPrevious,
  onSkip,
  onDontShowAgain,
}: TourOverlayProps) {
  const { primaryColor } = useCustomColors();
  const router = useRouter();
  const pathname = usePathname();
  const [popupPosition, setPopupPosition] = useState({ top: 100, left: 300 });

  const step = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;

  // Highlight sidebar item and position popup next to it
  useEffect(() => {
    if (!isActive || !step || !step.sidebarSelector) return;

    // Remove previous highlights
    document.querySelectorAll('[data-tour-highlight]').forEach(el => {
      el.removeAttribute('data-tour-highlight');
      (el as HTMLElement).style.cssText = '';
    });

    // Find the sidebar item - target the actual link/anchor element
    const sidebarItem = document.querySelector(`${step.sidebarSelector}`);
    if (sidebarItem) {
      // Find the parent container (the flex div wrapper)
      const parentContainer = sidebarItem.closest('.flex.items-center') || sidebarItem.parentElement;
      const targetElement = parentContainer || sidebarItem;
      
      targetElement.setAttribute('data-tour-highlight', 'true');
      (targetElement as HTMLElement).style.cssText = `
        background: linear-gradient(90deg, ${primaryColor}40, ${primaryColor}20) !important;
        border-left: 4px solid ${primaryColor} !important;
        box-shadow: 0 0 20px ${primaryColor}60 !important;
        transform: translateX(4px) !important;
        transition: all 0.3s ease !important;
        border-radius: 6px !important;
      `;

      // Calculate position next to the sidebar item - use the actual element's position
      const rect = (targetElement as HTMLElement).getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const popupHeight = 350; // Approximate popup height
      const popupWidth = 384; // w-96 = 384px
      
      let top, left;
      
      // Check if element is in the header (top 100px of viewport)
      const isHeaderElement = rect.top < 100;
      
      if (isHeaderElement) {
        // For header elements, position popup below the element
        top = rect.bottom + window.scrollY + 10; // 10px gap below element
        
        // Position horizontally - align right edge with element or center on it
        left = Math.min(
          rect.left + rect.width / 2 - popupWidth / 2, // Center on element
          viewportWidth - popupWidth - 20 // Don't go off right edge
        );
        left = Math.max(20, left); // Don't go off left edge
      } else {
        // For sidebar elements, position to the right as before
        top = rect.top + window.scrollY;
        
        // Adjust if popup would go off screen bottom
        if (rect.top + popupHeight > viewportHeight) {
          top = Math.max(20, viewportHeight - popupHeight - 20 + window.scrollY);
        }
        
        // Position to right of sidebar
        left = rect.right + 20;
      }
      
      setPopupPosition({
        top: top,
        left: left
      });

      // Scroll element into view if needed
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Cleanup on unmount or step change
    return () => {
      document.querySelectorAll('[data-tour-highlight]').forEach(el => {
        el.removeAttribute('data-tour-highlight');
        (el as HTMLElement).style.cssText = '';
      });
    };
  }, [currentStep, isActive, step, primaryColor]);

  if (!isActive || !step) return null;

  const handleNext = () => {
    onNext();
  };

  const handleFinish = () => {
    saveTourProgress(currentStep, true);
    // Remove all highlights
    document.querySelectorAll('[data-tour-highlight]').forEach(el => {
      el.removeAttribute('data-tour-highlight');
      (el as HTMLElement).style.cssText = '';
    });
    onClose();
  };

  return (
    <>
      {/* Tour card - positioned dynamically next to sidebar item */}
      <div 
        className="fixed w-96 z-[9999] transition-all duration-500 ease-in-out"
        style={{
          top: `${popupPosition.top}px`,
          left: `${popupPosition.left}px`,
        }}
      >
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
          </div>

          {/* Footer with navigation buttons */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={onPrevious}
                disabled={isFirstStep}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              {isLastStep ? (
                <button
                  onClick={handleFinish}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed animate-pulse"
                  style={{ backgroundColor: primaryColor }}
                >
                  🎊 Finish Tour
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-md transition-all hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: primaryColor }}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2">
              {onDontShowAgain && (
                <button
                  onClick={onDontShowAgain}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                  Don't Show Again
                </button>
              )}
              <button
                onClick={onSkip}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              >
                <SkipForward className="w-3 h-3" />
                Skip Tour
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
