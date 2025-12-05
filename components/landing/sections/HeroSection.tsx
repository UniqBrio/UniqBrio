'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Check } from 'lucide-react'

interface HeroSectionProps {
  onBookDemo?: () => void
}

export default function HeroSection({ onBookDemo }: HeroSectionProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const scrollToDemo = () => {
    if (onBookDemo) return onBookDemo()
    const demoSection = document.getElementById('demo-form')
    demoSection?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#f5fbff] via-[#faf5ff] to-[#fff8f0] px-4 md:px-8 lg:px-12 pt-8 md:pt-12 lg:pt-20">
      {/* Subtle gradient background with noise texture for premium feel */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(103,8,192,0.06),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(222,125,20,0.06),transparent_50%)]" />
      
      {/* Subtle animated blobs - very soft */}
      <motion.div
        className="absolute top-20 left-20 w-96 h-96 rounded-full filter blur-3xl opacity-8"
        style={{ background: 'linear-gradient(135deg, #e9d5ff 0%, #ddd6fe 100%)' }}
        animate={{ 
          x: mousePosition.x * 0.015,
          y: mousePosition.y * 0.015
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-96 h-96 rounded-full filter blur-3xl opacity-8"
        style={{ background: 'linear-gradient(135deg, #fed7aa 0%, #fde68a 100%)' }}
        animate={{ 
          x: mousePosition.x * -0.01,
          y: mousePosition.y * -0.01
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      />

      {/* Z-PATTERN LAYOUT: Two-column grid */}
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          
          {/* LEFT COLUMN: Headline + CTAs (Z-pattern starts here) */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-left space-y-4 md:space-y-8"
          >
            {/* Small brand tagline */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-block"
            >
              <p className="text-sm md:text-base text-[#6708C0] font-bold uppercase tracking-wide">
                # All-in-one Academy & Club Management Solution
              </p>
            </motion.div>

            {/* Main Headlines - Left-aligned, typographic hierarchy */}
            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-[#1A1A1A] leading-[1.1]"
              >
                Elevate Play.
              </motion.h1>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-[#1A1A1A] leading-[1.1]"
              >
                Simplify Management.
              </motion.h2>
            </div>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg md:text-xl text-[#4A5568] leading-relaxed max-w-xl"
            >
              Empower your academy with our all-in-one solution. Effortlessly manage students, athletes, payments,communications etc. while streamlining multi-center operations for seamless growth and success.
            </motion.p>

            {/* 2 CTAs - Side by side (Z-pattern continues) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 relative"
            >
              {/* Primary CTA - Start Free Trial */}
              <motion.button
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="group relative px-8 py-4 bg-gradient-to-r from-[#6708C0] to-[#8B5CF6] text-white font-bold text-lg rounded-xl shadow-xl overflow-visible"
                whileHover={{ scale: 1.08, boxShadow: '0 25px 70px rgba(103,8,192,0.5)' }}
                whileTap={{ scale: 0.92 }}
                animate={{
                  boxShadow: [
                    '0 10px 40px rgba(103,8,192,0.3)',
                    '0 15px 50px rgba(103,8,192,0.4)',
                    '0 10px 40px rgba(103,8,192,0.3)'
                  ]
                }}
                transition={{
                  boxShadow: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                  Start Free Trial
                </span>
                
                {/* Pulsing background */}
                <motion.span
                  className="absolute inset-0 bg-white rounded-xl"
                  animate={{ 
                    opacity: [0, 0.2, 0],
                    scale: [0.95, 1.05, 0.95]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {/* Shimmer effect */}
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                  animate={{ x: ['-200%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
                />
                
                {/* Animated cursor pointer */}
                <motion.div
                  className="absolute -right-3 -bottom-3 z-20"
                  initial={{ opacity: 0, scale: 0, rotate: -20 }}
                  animate={{ 
                    opacity: [0, 1, 1, 1, 0],
                    scale: [0.3, 1.2, 1, 1, 0.3],
                    rotate: [-20, -10, 0, -10, -20],
                    y: [0, 5, 0, 3, 0]
                  }}
                  transition={{
                    duration: 3,
                    delay: 5,
                    repeat: Infinity,
                    repeatDelay: 4,
                    times: [0, 0.2, 0.5, 0.8, 1]
                  }}
                >
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <motion.path
                      d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                      fill="#6708C0"
                      stroke="#4A1D96"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.circle
                      cx="12"
                      cy="12"
                      r="2"
                      fill="#4A1D96"
                      animate={{ r: [2, 3, 2], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </svg>
                </motion.div>
                
                {/* Click ripple circles */}
                {[0, 0.15, 0.3].map((delay, i) => (
                  <motion.span
                    key={i}
                    className="absolute -right-3 -bottom-3 w-10 h-10 border-3 border-white rounded-full"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 0.9, 0],
                      scale: [0, 2 + i * 0.5, 3 + i * 0.5]
                    }}
                    transition={{
                      duration: 1.2,
                      delay: 6.5 + delay,
                      repeat: Infinity,
                      repeatDelay: 6,
                      ease: "easeOut"
                    }}
                  />
                ))}
                
                {/* "14 DAYS" badge */}
                <motion.div
                  className="absolute -top-2 -left-2 bg-gradient-to-r from-[#6708C0] to-[#8B5CF6] text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-20"
                  animate={{ 
                    y: [-2, -8, -2],
                    rotate: [5, -5, 5]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  14 DAYS
                </motion.div>
              </motion.button>

              {/* Secondary CTA - Get A Demo in orange */}
              <motion.button
                onClick={scrollToDemo}
                className="group relative px-8 py-4 bg-gradient-to-r from-[#DE7D14] to-[#FF9A3D] text-white font-bold text-lg rounded-xl shadow-xl overflow-visible"
                whileHover={{ scale: 1.08, boxShadow: '0 25px 70px rgba(222,125,20,0.5)' }}
                whileTap={{ scale: 0.92 }}
                animate={{
                  boxShadow: [
                    '0 10px 40px rgba(222,125,20,0.3)',
                    '0 15px 50px rgba(222,125,20,0.4)',
                    '0 10px 40px rgba(222,125,20,0.3)'
                  ]
                }}
                transition={{
                  boxShadow: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                  Get A Demo
                </span>
                
                {/* Pulsing glow effect */}
                <motion.span
                  className="absolute inset-0 bg-white rounded-xl"
                  animate={{ 
                    opacity: [0, 0.2, 0],
                    scale: [0.95, 1.05, 0.95]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {/* Shimmer effect */}
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                  animate={{ x: ['-200%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
                />
                
                {/* Animated cursor/hand icon - more prominent */}
                <motion.div
                  className="absolute -right-3 -bottom-3 z-20"
                  initial={{ opacity: 0, scale: 0, rotate: -20 }}
                  animate={{ 
                    opacity: [0, 1, 1, 1, 0],
                    scale: [0.3, 1.2, 1, 1, 0.3],
                    rotate: [-20, -10, 0, -10, -20],
                    y: [0, 5, 0, 3, 0]
                  }}
                  transition={{
                    duration: 3,
                    delay: 2,
                    repeat: Infinity,
                    repeatDelay: 4,
                    times: [0, 0.2, 0.5, 0.8, 1]
                  }}
                >
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 2L8.5 7.5L3 9L8.5 10.5L10 16L11.5 10.5L17 9L11.5 7.5L10 2Z" fill="white" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <motion.path 
                      d="M19 12L18 15L15 16L18 17L19 20L20 17L23 16L20 15L19 12Z" 
                      fill="white" 
                      stroke="white" 
                      strokeWidth="1.5"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </svg>
                </motion.div>
                
                {/* Multiple click ripple circles */}
                {[0, 0.15, 0.3].map((delay, i) => (
                  <motion.span
                    key={i}
                    className="absolute -right-3 -bottom-3 w-10 h-10 border-3 border-white rounded-full"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 0.9, 0],
                      scale: [0, 2 + i * 0.5, 3 + i * 0.5]
                    }}
                    transition={{
                      duration: 1.2,
                      delay: 3.5 + delay,
                      repeat: Infinity,
                      repeatDelay: 6,
                      ease: "easeOut"
                    }}
                  />
                ))}
                
                {/* Bouncing "FREE" badge */}
                <motion.div
                  className="absolute -top-2 -left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-20"
                  animate={{ 
                    y: [-2, -8, -2],
                    rotate: [-5, 5, -5]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  FREE
                </motion.div>
              </motion.button>
            </motion.div>

            {/* Trust indicators - Small text below CTAs */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap items-center gap-6 text-sm text-[#718096]"
            >
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-[#10B981]" />
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-[#10B981]" />
                <span>No credit card needed</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-[#10B981]" />
                <span>Setup in 7 minutes</span>
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT COLUMN: Product screenshots positioned next to headline */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="relative w-full">
              {/* Upper image (Course) — sits near headline on the right */}
              <motion.div
                className="relative ml-auto w-[80%] md:w-[84%] lg:w-[88%] z-20"
                initial={{ opacity: 0, y: -20, rotate: 1 }}
                animate={{ opacity: 1, y: 0, rotate: 1 }}
                transition={{ duration: 0.9, delay: 0.4 }}
                whileHover={{ scale: 1.02, rotate: 0 }}
              >
                <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl overflow-hidden">
                  <img
                    src="/course.png"
                    alt="UniqBrio Course Management"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </motion.div>

              {/* Lower image (Services) — tucked under CTAs on the right */}
              <motion.div
                className="relative -mt-20 md:-mt-32 lg:-mt-40 left-0 md:left-4 w-[74%] md:w-[78%] lg:w-[82%] z-10"
                initial={{ opacity: 0, y: 20, rotate: -1 }}
                animate={{ opacity: 1, y: 0, rotate: -1 }}
                transition={{ duration: 0.9, delay: 0.6 }}
                whileHover={{ scale: 1.02, rotate: 0 }}
              >
                <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl overflow-hidden">
                  <img
                    src="/services.png"
                    alt="UniqBrio Services Dashboard"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>

        </div>

        {/* DIAGONAL FLOW: Animated counter stats at bottom (Z-pattern completes) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 md:mt-24"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '14-Day', label: 'Free Trial' },
              { number: '24/7', label: 'Support Available' },
              { number: '7 Min', label: 'Quick Setup' },
              { number: '100%', label: 'Data Security' }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.9 + idx * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="p-4"
              >
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#6708C0] to-[#DE7D14] bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-[#718096]">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
