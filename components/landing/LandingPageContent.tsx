'use client'

import { useState, useEffect } from 'react'
import HeroSection from './sections/HeroSection'
import LandingHeader from './LandingHeader'
import UrgencyBanner from './elements/UrgencyBanner'
import DemoPopup from './DemoPopup'
import VideoSection from './sections/VideoSection'

import VisionMissionSection from 'components/landing/sections/VisionMissionSection'
import ProblemSection from 'components/landing/sections/ProblemSection'
import SolutionOverviewSection from 'components/landing/sections/SolutionOverviewSection'
import FeaturesSection from 'components/landing/sections/FeaturesSection'
import HowItWorksSection from 'components/landing/sections/HowItWorksSection'
import PricingSection from 'components/landing/sections/PricingSection'
import FAQSection from 'components/landing/sections/FAQSection'
import LandingFooter from 'components/landing/sections/LandingFooter'
import FloatingElements from 'components/landing/elements/FloatingElements'


export default function LandingPageContent() {
  const [showConfetti, setShowConfetti] = useState(false)
  const [isDemoPopupOpen, setIsDemoPopupOpen] = useState(false)

  return (
    <div className="landing-page min-h-screen bg-[#FAFAFA]">
      <LandingHeader onBookDemo={() => setIsDemoPopupOpen(true)} />
           <UrgencyBanner />
      
      <div id="hero">
        <HeroSection />
      </div>
      <VisionMissionSection />
      <ProblemSection />
      
      
      <div id="features">
        <FeaturesSection />
      </div>
      
      <div id="how-it-works">
        <HowItWorksSection />
      </div>      
      <div id="pricing">
        <PricingSection />
      </div>
      <div id="faq">
        <FAQSection />
      </div>
      <LandingFooter />
      <FloatingElements onFormSuccess={() => setShowConfetti(true)} showConfetti={showConfetti} />
      <DemoPopup isOpen={isDemoPopupOpen} onClose={() => setIsDemoPopupOpen(false)} />
    </div>
  )
}
