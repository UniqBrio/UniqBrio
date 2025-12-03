'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, CreditCard, Users, BarChart3, MessageSquare, Check, Sparkles, ArrowRight } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export default function FeaturesSection() {
  const [activeTab, setActiveTab] = useState('scheduling')
  const [hoveredBenefit, setHoveredBenefit] = useState<number | null>(null)

  const tabs = [
    {
      id: 'scheduling',
      label: 'Courses',
      icon: <Calendar className="w-5 h-5" />,
      color: '#4A90E2',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: <CreditCard className="w-5 h-5" />,
      color: '#10B981',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      id: 'portal',
      label: 'Students',
      icon: <Users className="w-5 h-5" />,
      color: '#6708C0',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      color: '#DE7D14',
      gradient: 'from-orange-500 to-amber-500'
    },
    {
      id: 'communication',
      label: 'Multi-Branch',
      icon: <MessageSquare className="w-5 h-5" />,
      color: '#FF9A3D',
      gradient: 'from-orange-400 to-yellow-500'
    }
  ]

  const heroFeatures = {
    scheduling: {
      title: '🗓 Course & Batch Management',
      subtitle: 'Create courses, manage batches with cohorts, and track everything in one place.',
      benefits: [
        'Create unlimited courses with custom details',
        'Organize batches with cohort management',
        'Set course fees and registration fees',
        'Track course status and enrollment limits',
        'Multi-level course organization'
      ],
      screenshot: '📅'
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
        'Easy enrollment with course assignment',
        'Track student attendance and progress',
        'Bulk student import options',
        'Student-cohort relationships'
      ],
      screenshot: '👨‍👩‍👧'
    },
    analytics: {
      title: '📊 Payment Analytics & Reports',
      subtitle: 'Track revenue, collection rates, and payment trends across all courses.',
      benefits: [
        'Course-wise payment summaries',
        'Cohort-level financial breakdowns',
        'Collection rate tracking',
        'Outstanding amount monitoring',
        'Exportable payment reports'
      ],
      screenshot: '📈'
    },
    communication: {
      title: '💬 Multi-Branch Support',
      subtitle: 'Manage multiple academy locations from a single dashboard.',
      benefits: [
        'Complete tenant isolation for data security',
        'Branch-wise student and course management',
        'Unified payment tracking across locations',
        'Role-based access control',
        'Separate branding per location'
      ],
      screenshot: '📢'
    }
  }

  const allKeyFeatures = [
    { name: 'Course Management', description: 'Create and manage unlimited courses with details' },
    { name: 'Cohort & Batch System', description: 'Organize students into cohorts and batches' },
    { name: 'Student Enrollment', description: 'Quick enrollment with bulk import options' },
    { name: 'Attendance Tracking', description: 'Track student attendance with selfie verification' },
    { name: 'Fee Management', description: 'Set course fees and registration fees' },
    { name: 'Payment Processing', description: 'Integrated Razorpay for online transactions' },
    { name: 'Payment Plans', description: 'One-time, installments, or monthly subscriptions' },
    { name: 'Financial Reports', description: 'Course-wise and cohort-level payment analytics' },
    { name: 'Outstanding Tracking', description: 'Automatic calculation of pending amounts' },
    { name: 'Multi-Branch Support', description: 'Manage multiple academy locations' },
    { name: 'Role-Based Access', description: 'Secure permissions for different user roles' },
    { name: 'Mobile Responsive', description: 'Works perfectly on all devices' }
  ]

  return (
    <section id="features" className="py-20 px-4 md:px-8 bg-gradient-to-b from-white via-[#FAFAFA] to-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#6708C0]/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#4A90E2]/5 rounded-full blur-3xl -z-10"></div>
      
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6708C0]/10 to-[#4A90E2]/10 rounded-full border border-[#6708C0]/20">
              <Sparkles className="w-4 h-4 text-[#6708C0]" />
              <span className="text-sm font-semibold text-[#6708C0]">Built & Ready to Use</span>
            </div>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
            Everything in <span className="bg-gradient-to-r from-[#6708C0] to-[#4A90E2] bg-clip-text text-transparent">One Dashboard</span>
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
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
              <div className="relative bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
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

        {/* Tabbed Features */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tab Headers - Enhanced */}
          <div className="overflow-x-auto mb-8 pb-2">
            <TabsList className="inline-flex h-auto p-1.5 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 min-w-full md:min-w-0 md:mx-auto">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#6708C0] data-[state=active]:to-[#4A90E2] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  {tab.icon}
                  <span className="whitespace-nowrap">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Content - Enhanced */}
          <AnimatePresence mode="wait">
            {Object.keys(heroFeatures).map((key) => (
              <TabsContent key={key} value={key} className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
                >
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#6708C0]/5 via-transparent to-[#4A90E2]/5 pointer-events-none"></div>
                  
                  <div className="relative grid md:grid-cols-2 gap-8 p-8 md:p-12">
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

                    {/* Right: Screenshot/Visual - Enhanced */}
                    <div className="flex items-center justify-center">
                      <div className="relative w-full aspect-square">
                        {/* Background glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-200 via-blue-200 to-orange-200 rounded-3xl blur-2xl opacity-50"></div>
                        
                        {/* Main card */}
                        <div className="relative w-full h-full bg-gradient-to-br from-purple-50 via-blue-50 to-orange-50 rounded-3xl flex items-center justify-center border-2 border-white shadow-2xl overflow-hidden">
                          <motion.div
                            animate={{
                              scale: [1, 1.1, 1],
                              rotate: [0, 5, -5, 0]
                            }}
                            transition={{
                              duration: 4,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="text-9xl drop-shadow-2xl"
                          >
                            {heroFeatures[key as keyof typeof heroFeatures].screenshot}
                          </motion.div>
                          
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
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
            ))}
          </AnimatePresence>
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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6708C0] to-[#4A90E2] text-white rounded-full shadow-lg">
                <Check className="w-4 h-4" />
                <span className="text-sm font-semibold">All Features Included</span>
              </div>
            </motion.div>
            
            <h3 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-3">
              <span className="bg-gradient-to-r from-[#6708C0] to-[#4A90E2] bg-clip-text text-transparent">12</span> Core Features Built & Ready
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
                <div className="absolute inset-0 bg-gradient-to-br from-[#6708C0]/10 to-[#4A90E2]/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                
                {/* Card */}
                <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#6708C0]/30 h-full">
                  <div className="flex items-start gap-4">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#6708C0] to-[#4A90E2] mt-1.5 flex-shrink-0 shadow-md group-hover:scale-125 transition-transform duration-300"></div>
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
