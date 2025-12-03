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
      label: 'Scheduling',
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
      label: 'Student Portal',
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
      label: 'Communication',
      icon: <MessageSquare className="w-5 h-5" />,
      color: '#FF9A3D',
      gradient: 'from-orange-400 to-yellow-500'
    }
  ]

  const heroFeatures = {
    scheduling: {
      title: '🗓 Smart Scheduling',
      subtitle: 'Drag, drop, done. No more double bookings.',
      benefits: [
        'Visual drag-and-drop calendar',
        'Automatic conflict detection',
        'Recurring batch schedules',
        'Instructor availability tracking',
        'Real-time sync across all devices'
      ],
      screenshot: '📅'
    },
    payments: {
      title: '💳 Auto-Billing',
      subtitle: 'Get paid on time, every time. Automatic invoices & reminders.',
      benefits: [
        'Automated invoice generation',
        'Smart payment reminders',
        'Multiple payment methods (UPI, Cards, Net Banking)',
        'Fee collection tracking',
        'Overdue payment alerts'
      ],
      screenshot: '💰'
    },
    portal: {
      title: '📱 Parent Portal',
      subtitle: 'Give parents 24/7 access to progress, attendance, and payments.',
      benefits: [
        'Real-time attendance updates',
        'Progress photos and videos',
        'Fee payment history',
        'Direct messaging with instructors',
        'Mobile-first design'
      ],
      screenshot: '👨‍👩‍👧'
    },
    analytics: {
      title: '📊 Analytics Dashboard',
      subtitle: 'See what\'s working. Track revenue, retention, and attendance.',
      benefits: [
        'Revenue trends and forecasts',
        'Student retention metrics',
        'Attendance patterns',
        'Batch performance insights',
        'Export reports for tax season'
      ],
      screenshot: '📈'
    },
    communication: {
      title: '💬 Unified Communication',
      subtitle: 'One platform for all parent-instructor communication.',
      benefits: [
        'In-app messaging',
        'Batch-wise announcements',
        'Photo & video sharing',
        'Event notifications',
        'No more WhatsApp chaos'
      ],
      screenshot: '📢'
    }
  }

  const allKeyFeatures = [
    { name: 'Course Management', description: 'Create and manage unlimited courses, batches, and levels' },
    { name: 'Instructor Scheduling', description: 'Assign instructors and track their availability' },
    { name: 'Student Enrollment', description: 'Quick enrollment with bulk import options' },
    { name: 'Attendance Tracking', description: 'Digital attendance with selfie verification' },
    { name: 'Fee Management', description: 'Flexible fee structures with discount support' },
    { name: 'Payment Processing', description: 'Integrated Razorpay for seamless transactions' },
    { name: 'Parent Communication', description: 'Direct messaging and announcements' },
    { name: 'Progress Tracking', description: 'Document student progress with photos/videos' },
    { name: 'Reports & Analytics', description: 'Comprehensive dashboards and exportable reports' },
    { name: 'Multi-Branch Support', description: 'Manage multiple locations from one account' },
    { name: 'Role-Based Access', description: 'Secure permissions for admins, instructors, parents' },
    { name: 'Mobile Responsive', description: 'Works perfectly on all devices' },
    { name: 'Merchandise Store', description: 'Sell uniforms and equipment (Scale plan)' },
    { name: 'Payroll Management', description: 'Track instructor payments (Scale plan)' },
    { name: 'Custom Branding', description: 'White-label your portal with academy branding' },
    { name: 'API Integration', description: 'Connect with your existing tools' }
  ]

  return (
    <section id="features" className="py-20 px-4 md:px-8 bg-gradient-to-b from-white to-[#FAFAFA]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
            Everything in <span className="text-[#4A90E2]">One Dashboard</span>
          </h2>
          <p className="text-xl text-[#718096] max-w-3xl mx-auto mb-8">
            No more juggling 47 different apps. UniqBrio brings it all together.
          </p>
          
          {/* GROUP INTO 3 - Core value props */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-[#4A90E2]" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Schedule</h3>
              <p className="text-[#718096]">Smart calendar, zero conflicts</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[#6708C0]" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Manage</h3>
              <p className="text-[#718096]">Students, staff, all in one place</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-[#DE7D14]" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Grow</h3>
              <p className="text-[#718096]">Auto-billing, instant payments</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Tabbed Features */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tab Headers */}
          <div className="overflow-x-auto mb-8">
            <TabsList className="inline-flex h-auto p-2 bg-white rounded-xl shadow-lg min-w-full md:min-w-0 md:mx-auto">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#6708C0] data-[state=active]:to-[#4A90E2] data-[state=active]:text-white transition-all duration-300"
                >
                  {tab.icon}
                  <span className="whitespace-nowrap">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {Object.keys(heroFeatures).map((key) => (
              <TabsContent key={key} value={key} className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl shadow-2xl overflow-hidden"
                >
                  <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12">
                    {/* Left: Content */}
                    <div>
                      <h3 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-3">
                        {heroFeatures[key as keyof typeof heroFeatures].title}
                      </h3>
                      <p className="text-xl text-[#718096] mb-6">
                        {heroFeatures[key as keyof typeof heroFeatures].subtitle}
                      </p>
                      
                      <div className="space-y-3">
                        {heroFeatures[key as keyof typeof heroFeatures].benefits.map((benefit, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onHoverStart={() => setHoveredBenefit(idx)}
                            onHoverEnd={() => setHoveredBenefit(null)}
                            whileHover={{ x: 8 }}
                            className="flex items-start gap-3 group cursor-pointer"
                          >
                            <motion.div 
                              className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0 mt-0.5 relative"
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
                            <p className="text-[#4A5568] leading-relaxed group-hover:text-[#1A1A1A] transition-colors">
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

                    {/* Right: Screenshot/Visual */}
                    <div className="flex items-center justify-center">
                      <div className="relative w-full aspect-square bg-gradient-to-br from-purple-100 via-blue-100 to-orange-100 rounded-2xl flex items-center justify-center">
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
                          className="text-9xl"
                        >
                          {heroFeatures[key as keyof typeof heroFeatures].screenshot}
                        </motion.div>
                        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg">
                          <p className="text-sm text-[#718096] text-center">
                            📸 Screenshot placeholder – Real dashboard coming soon
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
            ))}
          </AnimatePresence>
        </Tabs>

        {/* All Key Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <h3 className="text-3xl font-bold text-center text-[#1A1A1A] mb-12">
            <span className="text-[#6708C0]">16+</span> Powerful Features to Run Your Academy
          </h3>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {allKeyFeatures.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-5 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
              >
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#6708C0] mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-bold text-[#1A1A1A] mb-1">{feature.name}</h4>
                    <p className="text-sm text-[#718096]">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
