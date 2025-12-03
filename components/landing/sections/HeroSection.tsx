'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Check, Calendar, Users, CreditCard } from 'lucide-react'

export default function HeroSection() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const scrollToDemo = () => {
    const demoSection = document.getElementById('demo-form')
    demoSection?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-[#f5fbff] via-[#faf5ff] to-[#fff8f0] px-4 md:px-8 lg:px-12 py-12 md:py-20 pt-32">
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
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* LEFT COLUMN: Headline + CTAs (Z-pattern starts here) */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-left space-y-8"
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
              Empower your sports academy with our all-in-one solution. Effortlessly manage students, athletes, payments, leads, communications etc. while streamlining multi-center operations for seamless growth and success.
            </motion.p>

            {/* 2 CTAs - Side by side (Z-pattern continues) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              {/* Primary CTA - Accent color */}
              <motion.button
                onClick={scrollToDemo}
                className="group relative px-8 py-4 bg-gradient-to-r from-[#DE7D14] to-[#FF9A3D] text-white font-bold text-lg rounded-xl shadow-xl overflow-hidden"
                whileHover={{ scale: 1.05, boxShadow: '0 20px 60px rgba(222,125,20,0.4)' }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Get A Demo
                </span>
                {/* Ripple effect */}
                <motion.span
                  className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20"
                  animate={{ scale: [0, 2], opacity: [0.2, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                />
              </motion.button>

              {/* Secondary CTA - Outline style */}
              <motion.button
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-transparent border-2 border-[#4A90E2] text-[#4A90E2] font-bold text-lg rounded-xl hover:bg-[#4A90E2] hover:text-white transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="flex items-center justify-center gap-2">
                  <ArrowRight className="w-5 h-5" />
                  Start Free Trial
                </span>
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
                <span>Setup in 5 minutes</span>
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT COLUMN: Dashboard Screenshot (Z-pattern diagonal) */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* Device mockups showing real product */}
            <div className="relative">
              {/* Main tablet/mobile mockup */}
              <div className="relative">
                {/* Mobile device frame - showing stats dashboard */}
                <motion.div
                  className="absolute top-0 right-0 w-64 md:w-80 bg-white rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-800 z-20"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  {/* Status bar */}
                  <div className="bg-white px-6 py-2 flex items-center justify-between text-xs">
                    <span className="font-semibold">9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-3 border border-gray-800 rounded-sm"></div>
                      <div className="w-1 h-3 bg-gray-800 rounded-sm"></div>
                    </div>
                  </div>

                  {/* Top bar with logo and "Admin" */}
                  <div className="bg-white px-6 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="text-lg font-bold bg-gradient-to-r from-[#6708C0] to-[#DE7D14] bg-clip-text text-transparent">
                      UniqBrio
                    </div>
                    <span className="text-xs text-gray-500">Admin ▼</span>
                  </div>

                  {/* Stats grid */}
                  <div className="bg-gradient-to-br from-gray-50 to-white p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {/* Students */}
                      <div className="bg-white p-4 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-5 h-5 text-[#DE7D14]" />
                          <span className="text-2xl font-bold text-[#DE7D14]">1531</span>
                        </div>
                        <span className="text-xs text-gray-600">Students</span>
                      </div>

                      {/* Centers */}
                      <div className="bg-white p-4 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-5 h-5 text-[#DE7D14]" />
                          <span className="text-2xl font-bold text-[#DE7D14]">2</span>
                        </div>
                        <span className="text-xs text-gray-600">Centers</span>
                      </div>

                      {/* Payments */}
                      <div className="bg-white p-4 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="w-5 h-5 text-[#DE7D14]" />
                          <span className="text-2xl font-bold text-[#DE7D14]">3</span>
                        </div>
                        <span className="text-xs text-gray-600">Payments</span>
                      </div>

                      {/* Events */}
                      <div className="bg-white p-4 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-5 h-5 text-[#DE7D14]" />
                          <span className="text-2xl font-bold text-[#DE7D14]">33</span>
                        </div>
                        <span className="text-xs text-gray-600">Events</span>
                      </div>
                    </div>

                    {/* Today's Activity section */}
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                      <h3 className="font-bold text-sm mb-3">Today's Activity</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400"></div>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full"></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400"></div>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Tablet/desktop mockup behind - showing payments screen */}
                <motion.div
                  className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-gray-300 ml-0 mt-12"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  {/* Browser chrome */}
                  <div className="bg-gray-100 px-4 py-2 flex items-center gap-2 border-b border-gray-200">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                  </div>

                  {/* Sidebar and content */}
                  <div className="flex h-80">
                    {/* Red sidebar */}
                    <div className="w-16 bg-gradient-to-b from-[#FF4444] to-[#CC0000] flex flex-col items-center py-6 gap-6">
                      <div className="w-10 h-10 bg-white/20 rounded-lg"></div>
                      <div className="w-10 h-10 bg-white/20 rounded-lg"></div>
                      <div className="w-10 h-10 bg-white/90 rounded-lg"></div>
                      <div className="w-10 h-10 bg-white/20 rounded-lg"></div>
                    </div>

                    {/* Main content - Payments */}
                    <div className="flex-1 bg-gradient-to-br from-gray-50 to-white p-6">
                      <div className="mb-4">
                        <h2 className="text-2xl font-bold mb-2">Payments</h2>
                        <div className="flex items-center gap-4 mb-4">
                          <span className="text-sm text-gray-600">Order Summary</span>
                          <div className="w-24 h-6 bg-gray-200 rounded"></div>
                        </div>
                      </div>

                      {/* User avatars list */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400"></div>
                          <div className="flex-1">
                            <div className="h-2 bg-gray-200 rounded w-32 mb-1"></div>
                            <div className="h-2 bg-gray-100 rounded w-24"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400"></div>
                          <div className="flex-1">
                            <div className="h-2 bg-gray-200 rounded w-32 mb-1"></div>
                            <div className="h-2 bg-gray-100 rounded w-24"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Floating stat badges */}
              <motion.div
                className="absolute -bottom-8 -left-8 bg-white px-6 py-3 rounded-xl shadow-xl border border-gray-200"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-gray-700">Live Updates</span>
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
              { number: '30-Day', label: 'Free Trial' },
              { number: '24/7', label: 'Support Available' },
              { number: '10 Min', label: 'Quick Setup' },
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
