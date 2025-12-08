'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, CreditCard, Users, BarChart3, UserCog, Check, Sparkles, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import Image from 'next/image'

export default function FeaturesSection() {
  const [activeTab, setActiveTab] = useState('scheduling')
  const [hoveredBenefit, setHoveredBenefit] = useState<number | null>(null)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const tabs = [
    {
      id: 'scheduling',
      label: 'Courses',
      icon: <Calendar className="w-5 h-5" />,
      color: '#8B5CF6',
      gradient: 'from-purple-500 to-purple-600',
      image: '/placeholder-course.jpg' // You can replace with actual dashboard screenshot
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: <CreditCard className="w-5 h-5" />,
      color: '#10B981',
      gradient: 'from-green-500 to-emerald-500',
      image: '/placeholder-payment.jpg'
    },
    {
      id: 'portal',
      label: 'Students',
      icon: <Users className="w-5 h-5" />,
      color: '#6708C0',
      gradient: 'from-purple-500 to-pink-500',
      image: '/placeholder-student.jpg'
    },
    {
      id: 'staff',
      label: 'Staff',
      icon: <UserCog className="w-5 h-5" />,
      color: '#8B5CF6',
      gradient: 'from-violet-500 to-purple-500',
      image: '/placeholder-staff.jpg'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      color: '#DE7D14',
      gradient: 'from-orange-500 to-amber-500',
      image: '/placeholder-analytics.jpg'
    }
  ]

  // Auto-scroll functionality
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setActiveTab((current) => {
        const currentIndex = tabs.findIndex(tab => tab.id === current)
        const nextIndex = (currentIndex + 1) % tabs.length
        return tabs[nextIndex].id
      })
    }, 5000) // Change tab every 5 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const handlePrevious = () => {
    setIsAutoPlaying(false)
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab)
    const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1
    setActiveTab(tabs[prevIndex].id)
  }

  const handleNext = () => {
    setIsAutoPlaying(false)
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab)
    const nextIndex = (currentIndex + 1) % tabs.length
    setActiveTab(tabs[nextIndex].id)
  }

  const handleTabClick = (tabId: string) => {
    setIsAutoPlaying(false)
    setActiveTab(tabId)
  }

  const heroFeatures = {
    scheduling: {
      title: '🗓 Course & Batch Management',
      subtitle: 'Create courses, manage batches with cohorts, and track everything in one place.',
      benefits: [
        'Create unlimited courses with custom details',
        'Organize batches with cohort management',
        'Set course fees and registration fees',
        'Draft system to save work in progress',
        'Track course status and enrollment limits'
      ],
      screenshot: '/course.png'
    },
    payments: {
      title: '💳 Complete Payment Management',
      subtitle: 'Track fees, record payments, and manage student finances effortlessly.',
      benefits: [
        'Course and registration fee tracking',
        'Multiple payment options (One-time, Installments, Monthly)',
        'Razorpay integration for online payments',
        'Automated outstanding amount calculations',
        'Payment history and invoice management'
      ],
      screenshot: '💰'
    },
    portal: {
      title: '📱 Student & Enrollment Management',
      subtitle: 'Manage students, enrollments, and track their progress seamlessly.',
      benefits: [
        'Complete student profile management',
        'Bulk import and export of student data',
        'Selfie-based attendance tracking',
        'Automated notifications to parents',
        'Student-cohort relationships'
      ],
      screenshot: '👨‍👩‍👧'
    },
    staff: {
      title: '👥 Staff & Instructor Management',
      subtitle: 'Manage instructors and non-teaching staff with profiles, schedules, and payroll.',
      benefits: [
        'Instructor profiles with certifications',
        'Staff management with role assignments',
        'Payroll tracking and payment info',
        'Leave and attendance management',
        'Performance tracking and analytics'
      ],
      screenshot: '👨‍🏫'
    },
    analytics: {
      title: '📊 Analytics & Reports',
      subtitle: 'Comprehensive analytics with audit logs and data export capabilities.',
      benefits: [
        'Course-wise payment summaries',
        'Financial reports and trends',
        'Audit logs for all activities',
        'Data export in CSV format',
        'Real-time dashboard metrics'
      ],
      screenshot: '📈'
    }
  }

  const allKeyFeatures = [
    { name: 'Course and cohort Management', description: 'Create and manage courses and organize students into cohorts' },
    { name: 'Student Management', description: 'Complete student profiles with enrollment tracking' },
    { name: 'Attendance Tracking', description: 'Track student attendance with selfie verification' },
    { name: 'Fee Management', description: 'Set course fees and registration fees' },
    { name: 'Payment Plans', description: 'One-time, installments, or monthly subscriptions' },
    { name: 'Financial Analytics', description: 'Course-wise and cohort-level payment reports' },
    { name: 'Staff Management', description: 'Manage instructor and non-instructor profiles and schedules' },
    { name: 'Audit Logs', description: 'Track all platform activities with detailed logs' },
    { name: 'Data Export', description: 'Export your data anytime in CSV format' }
  ]

  return (
    <section id="features" className="py-20 px-4 md:px-8 bg-gradient-to-b from-white via-[#FAFAFA] to-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#6708C0]/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#8B5CF6]/5 rounded-full blur-3xl -z-10"></div>
      
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="inline-block mb-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6708C0]/10 to-[#8B5CF6]/10 rounded-full border border-[#6708C0]/20">
              <Sparkles className="w-4 h-4 text-[#6708C0]" />
              <span className="text-sm font-semibold text-[#6708C0]">Built & Ready to Use</span>
            </div>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
            Everything in <span className="bg-gradient-to-r from-[#6708C0] to-[#8B5CF6] bg-clip-text text-transparent">One Dashboard</span>
          </h2>
          <p className="text-xl text-[#718096] max-w-3xl mx-auto mb-12">
            No more juggling 47 different apps. UniqBrio brings it all together.
          </p>
          
          {/* GROUP INTO 3 - Core value props with enhanced design */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
              <div className="relative bg-white/80 backdrop-blur-sm border border-purple-100 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Courses & Batches</h3>
                <p className="text-[#718096]">Organize courses, cohorts & students</p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
              <div className="relative bg-white/80 backdrop-blur-sm border border-purple-100 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Student Management</h3>
                <p className="text-[#718096]">Enrollments, attendance & progress</p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
              <div className="relative bg-white/80 backdrop-blur-sm border border-orange-100 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Payment Tracking</h3>
                <p className="text-[#718096]">Fees, invoices & analytics</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Tabbed Features - Vertical Layout with Auto-scroll */}
        <Tabs value={activeTab} onValueChange={handleTabClick} className="w-full">
          <div className="grid lg:grid-cols-[280px_1fr] gap-8">
            {/* Vertical Tab Headers */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              {/* Up Arrow */}
              <div className="mb-3">
                <button
                  onClick={handlePrevious}
                  className="w-full h-10 flex items-center justify-center text-[#6708C0] hover:text-[#8B5CF6] transition-transform"
                  aria-label="Previous"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <TabsList className="flex flex-col h-auto p-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 w-full">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-3 px-6 py-4 rounded-xl font-semibold text-[#4A5568] w-full justify-start transition-all duration-300 hover:scale-[1.02] hover:bg-white/80 text-left data-[state=active]:bg-[#6708C0]/10 data-[state=active]:text-[#1A1A1A] data-[state=active]:border data-[state=active]:border-[#6708C0]/25 data-[state=active]:shadow-none"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#6708C0]/10 text-[#6708C0] data-[state=active]:bg-[#6708C0]/20 data-[state=active]:text-[#6708C0]">
                      {tab.icon}
                    </div>
                    <span>{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Down Arrow */}
              <div className="mt-3">
                <button
                  onClick={handleNext}
                  className="w-full h-10 flex items-center justify-center text-[#6708C0] hover:text-[#8B5CF6] transition-transform"
                  aria-label="Next"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Indicator */}
              <div className="mt-4 flex gap-2 justify-center">
                {tabs.map((tab) => (
                  <motion.div
                    key={tab.id}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      activeTab === tab.id ? 'w-8 bg-gradient-to-r from-[#6708C0] to-[#8B5CF6]' : 'w-1 bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Tab Content - Enhanced with Images */}
            <div className="self-stretch">
              <AnimatePresence mode="wait">
                {Object.keys(heroFeatures).map((key) => (
                  <TabsContent key={key} value={key} className="mt-0">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.5 }}
                      className="relative h-full flex flex-col bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
                    >
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#6708C0]/5 via-transparent to-[#8B5CF6]/5 pointer-events-none"></div>
                      
                      <div className="relative grid md:grid-cols-2 gap-6 p-6 md:p-8 h-full">
                        {/* Left: Content */}
                        <div className="flex flex-col justify-center">
                          <h3 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-3">
                            {heroFeatures[key as keyof typeof heroFeatures].title}
                          </h3>
                          <p className="text-xl text-[#718096] mb-8">
                            {heroFeatures[key as keyof typeof heroFeatures].subtitle}
                          </p>
                          
                          <div className="space-y-4">
                            {heroFeatures[key as keyof typeof heroFeatures].benefits.map((benefit, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                onHoverStart={() => setHoveredBenefit(idx)}
                                onHoverEnd={() => setHoveredBenefit(null)}
                                whileHover={{ x: 8 }}
                                className="flex items-start gap-3 group cursor-pointer bg-white/50 p-3 rounded-xl hover:bg-white hover:shadow-md transition-all duration-300"
                              >
                                <motion.div 
                                  className="w-6 h-6 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center flex-shrink-0 mt-0.5 relative shadow-md"
                                  animate={hoveredBenefit === idx ? { scale: [1, 1.2, 1] } : {}}
                                  transition={{ duration: 0.3 }}
                                >
                                  <Check className="w-4 h-4 text-white" />
                                  {/* Ripple effect on hover */}
                                  {hoveredBenefit === idx && (
                                    <motion.div
                                      className="absolute inset-0 rounded-full border-2 border-[#10B981]"
                                      initial={{ scale: 1, opacity: 1 }}
                                      animate={{ scale: 1.8, opacity: 0 }}
                                      transition={{ duration: 0.6, repeat: Infinity }}
                                    />
                                  )}
                                </motion.div>
                                <p className="text-[#4A5568] leading-relaxed group-hover:text-[#1A1A1A] font-medium transition-colors">
                                  {benefit}
                                </p>
                                <motion.div
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={hoveredBenefit === idx ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                                >
                                  <ArrowRight className="w-4 h-4 text-[#10B981] mt-1" />
                                </motion.div>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Right: Dashboard Screenshot/Visual */}
                        <div className="flex items-center justify-center">
                          <div className="relative w-full max-h-[360px] aspect-[4/3]">
                            {/* Background glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-200 via-pink-200 to-orange-200 rounded-3xl blur-2xl opacity-50"></div>
                            
                            {/* Main card with dashboard preview */}
                            <motion.div 
                              className="relative w-full h-full bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-3xl flex items-center justify-center border-2 border-white shadow-2xl overflow-hidden"
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.5 }}
                            >
                              {/* Placeholder for dashboard screenshot - replace with actual images */}
                              <div className="relative w-full h-full flex items-center justify-center p-6">
                                <motion.div
                                  animate={{
                                    scale: [1, 1.05, 1],
                                  }}
                                  transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                  className="relative w-full h-full bg-white rounded-2xl shadow-2xl p-4 overflow-hidden"
                                >
                                  {/* Simulated Dashboard UI */}
                                  <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center">
                                    {heroFeatures[key as keyof typeof heroFeatures].screenshot.startsWith('/') ? (
                                      <div className="relative w-full h-full">
                                        <Image
                                          src={heroFeatures[key as keyof typeof heroFeatures].screenshot}
                                          alt={heroFeatures[key as keyof typeof heroFeatures].title}
                                          fill
                                          className="object-contain p-4"
                                          priority
                                        />
                                      </div>
                                    ) : (
                                      <div className="text-center">
                                        <motion.div
                                          animate={{
                                            rotate: [0, 5, -5, 0]
                                          }}
                                          transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                          }}
                                          className="text-8xl mb-4 drop-shadow-lg"
                                        >
                                          {heroFeatures[key as keyof typeof heroFeatures].screenshot}
                                        </motion.div>
                                        <div className="space-y-2">
                                          <div className="h-3 bg-gradient-to-r from-[#6708C0] to-[#8B5CF6] rounded-full w-32 mx-auto"></div>
                                          <div className="h-2 bg-gray-300 rounded-full w-24 mx-auto"></div>
                                          <div className="h-2 bg-gray-300 rounded-full w-28 mx-auto"></div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              </div>
                              
                              {/* Badge overlay */}
                              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100">
                                <div className="flex items-center justify-center gap-2">
                                  <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                  >
                                    <Sparkles className="w-4 h-4 text-[#6708C0]" />
                                  </motion.div>
                                  <p className="text-sm font-semibold bg-gradient-to-r from-[#6708C0] to-[#4A90E2] bg-clip-text text-transparent">
                                    Live in Your Dashboard
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </TabsContent>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </Tabs>

        {/* All Key Features Grid - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24"
        >
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="inline-block mb-4"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6708C0] to-[#8B5CF6] text-white rounded-full shadow-lg">
                <Check className="w-4 h-4" />
                <span className="text-sm font-semibold">All Features Included</span>
              </div>
            </motion.div>
            
            <h3 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-3">
              <span className="bg-gradient-to-r from-[#6708C0] to-[#8B5CF6] bg-clip-text text-transparent">9 +</span> Core Features Built & Ready
            </h3>
            <p className="text-lg text-[#718096] max-w-2xl mx-auto">
              Everything you need to run your academy efficiently, available now
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {allKeyFeatures.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative"
              >
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#6708C0]/10 to-[#8B5CF6]/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                
                {/* Card */}
                <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#6708C0]/30 h-full">
                  <div className="flex items-start gap-4">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#6708C0] to-[#8B5CF6] mt-1.5 flex-shrink-0 shadow-md group-hover:scale-125 transition-transform duration-300"></div>
                    <div className="flex-1">
                      <h4 className="font-bold text-[#1A1A1A] mb-2 text-lg group-hover:text-[#6708C0] transition-colors">{feature.name}</h4>
                      <p className="text-sm text-[#718096] leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                  
                  {/* Checkmark icon on hover */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    whileHover={{ opacity: 1, scale: 1 }}
                    className="absolute top-4 right-4"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center shadow-md">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
