'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Zap, Star, Sparkles, Crown, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PricingSectionProps {
  onBookDemo?: () => void
}

export default function PricingSection({ onBookDemo }: PricingSectionProps) {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null)
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly')
  const plans = [
    {
      name: 'Free',
      price: '₹0',
      period: 'forever',
      bestFor: '<10 active students',
      description: 'Perfect for new academies just getting started',
      features: [
        'Up to 10 active students',
        'Basic scheduling & attendance',
        '1 branch location',
        'Email support',
        'Mobile app access',
        'Parent notifications'
      ],
      cta: 'Start Free',
      highlighted: false,
      color: '#718096'
    },
    {
      name: 'Grow',
      price: '₹1,099',
      period: '/month',
      yearlyPrice: '₹11,988',
      yearlySavings: 'Save ₹1,200/year',
      bestFor: 'Dance, cricket, badminton & arts academies',
      description: 'Everything you need to run a thriving academy',
      features: [
        'Unlimited students',
        'All scheduling features',
        'Automated payments & reminders',
        'Parent portal with progress tracking',
        'Advanced analytics & reports',
        'Multiple instructors',
        'WhatsApp integration',
        'Priority support',
        'Custom branding',
        'Up to 3 branches'
      ],
      cta: 'Start Free Trial',
      highlighted: true,
      badge: 'Most Popular',
      color: '#6708C0'
    },
    {
      name: 'Scale',
      price: '₹3,599',
      period: '/month',
      yearlyPrice: '₹43,188',
      yearlySavings: 'Save ₹2,400/year',
      bestFor: 'Multi-branch or 200+ students',
      description: 'For established academies ready to scale',
      features: [
        'Everything in Grow, plus:',
        'Unlimited branches',
        'Payroll management',
        'Merchandise store',
        'Custom reports & exports',
        'API access',
        'White-label branding',
        'Dedicated account manager',
        'Phone support',
        'Custom integrations'
      ],
      cta: 'Start Free Trial',
      highlighted: false,
      color: '#DE7D14'
    }
  ]

  return (
    <section className="py-20 px-4 md:px-8 bg-gradient-to-b from-[#FAFAFA] to-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
            Simple, <span className="text-[#6708C0]">Transparent Pricing</span>
          </h2>
          <p className="text-xl text-[#718096] mb-6">
            Start free. Upgrade anytime. Cancel anytime.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className={`text-lg font-medium ${selectedBilling === 'monthly' ? 'text-[#1A1A1A]' : 'text-[#718096]'}`}>
              Monthly
            </span>
            <motion.button
              onClick={() => setSelectedBilling(selectedBilling === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-16 h-8 bg-gray-200 rounded-full cursor-pointer"
              animate={{ backgroundColor: selectedBilling === 'yearly' ? '#10B981' : '#E2E8F0' }}
            >
              <motion.div
                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                animate={{ left: selectedBilling === 'yearly' ? '36px' : '4px' }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </motion.button>
            <span className={`text-lg font-medium ${selectedBilling === 'yearly' ? 'text-[#1A1A1A]' : 'text-[#718096]'}`}>
              Yearly
            </span>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: selectedBilling === 'yearly' ? 1 : 0 }}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold"
            >
              Save 17%! 🎉
            </motion.div>
          </div>
          
          <AnimatePresence mode="wait">
            {selectedBilling === 'yearly' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="inline-block bg-gradient-to-r from-green-100 to-blue-100 px-6 py-3 rounded-full"
              >
                <p className="text-[#10B981] font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Pay annually → Get 2 months FREE + personal onboarding call
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Special Launch Offer Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-purple-50 to-blue-50 text-[#1A1A1A] p-6 rounded-2xl text-center mb-12 shadow-md"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-6 h-6 text-[#6708C0] animate-pulse" />
            <p className="text-2xl font-bold">Launch Exclusive Offer</p>
            <Zap className="w-6 h-6 text-[#6708C0] animate-pulse" />
          </div>
          <p className="text-lg">
            First 100 Indian academies lock this pricing <span className="font-bold underline">forever</span> – even if we raise prices later!
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              onHoverStart={() => setHoveredPlan(plan.name)}
              onHoverEnd={() => setHoveredPlan(null)}
              whileHover={{ y: -12 }}
              className={`relative bg-white rounded-2xl shadow-xl overflow-hidden ${
                plan.highlighted ? 'ring-4 ring-[#6708C0] transform md:scale-105 md:-translate-y-4' : ''
              } transition-all duration-300 cursor-pointer`}
            >
              {/* Animated gradient border on hover */}
              {hoveredPlan === plan.name && (
                <motion.div
                  className="absolute inset-0 opacity-20"
                  animate={{
                    background: [
                      `linear-gradient(0deg, ${plan.color} 0%, transparent 100%)`,
                      `linear-gradient(180deg, ${plan.color} 0%, transparent 100%)`,
                      `linear-gradient(0deg, ${plan.color} 0%, transparent 100%)`
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              {/* Badge with icon */}
              {plan.badge && (
                <motion.div 
                  className="absolute top-0 right-0 bg-gradient-to-r from-[#DE7D14] to-[#FF9A3D] text-white px-6 py-2 rounded-bl-2xl font-bold flex items-center gap-1 z-10"
                  animate={hoveredPlan === plan.name ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.5, repeat: hoveredPlan === plan.name ? Infinity : 0 }}
                >
                  <Star className="w-4 h-4 fill-white" />
                  {plan.badge}
                  <Sparkles className="w-3 h-3 ml-1" />
                </motion.div>
              )}

              {/* Plan icon indicator */}
              <div className="absolute top-6 left-6 z-10">
                {plan.name === 'Free' && <TrendingUp className="w-8 h-8 text-gray-400" />}
                {plan.name === 'Grow' && <Zap className="w-8 h-8 text-[#6708C0]" />}
                {plan.name === 'Scale' && <Crown className="w-8 h-8 text-[#DE7D14]" />}
              </div>

              <div className="p-8 relative z-10">
                {/* Plan Name */}
                <motion.h3 
                  className="text-2xl font-bold mb-2 mt-8"
                  style={{ color: plan.color }}
                  animate={hoveredPlan === plan.name ? { x: [0, 5, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {plan.name}
                </motion.h3>

                {/* Best For */}
                <p className="text-sm text-[#718096] font-semibold mb-4 h-10">
                  Best for: {plan.bestFor}
                </p>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <motion.span 
                      className="text-5xl font-bold text-[#1A1A1A]"
                      animate={hoveredPlan === plan.name ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      {plan.price}
                    </motion.span>
                    <span className="text-[#718096]">{plan.period}</span>
                  </div>
                  {plan.yearlyPrice && selectedBilling === 'yearly' && (
                    <motion.div 
                      className="mt-2"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <p className="text-sm text-[#718096]">
                        or <span className="font-bold text-[#1A1A1A]">{plan.yearlyPrice}/year</span>
                      </p>
                      <p className="text-xs text-[#10B981] font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {plan.yearlySavings}
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-[#718096] mb-6">{plan.description}</p>

                {/* CTA Button */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => onBookDemo ? onBookDemo() : document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth' })}
                    className={`w-full mb-6 font-bold py-6 text-lg rounded-xl transition-all duration-300 ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-[#6708C0] to-[#4A90E2] hover:from-[#5607A0] hover:to-[#3A80D2] text-white shadow-xl hover:shadow-2xl'
                        : 'bg-white text-[#6708C0] border-2 border-[#6708C0] hover:bg-[#6708C0] hover:text-white'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </motion.div>

                {/* Features List */}
                <div className="space-y-3">
                  <p className="text-xs text-[#718096] font-semibold uppercase mb-3">What You Get:</p>
                  {plan.features.map((feature, featureIdx) => (
                    <motion.div 
                      key={featureIdx} 
                      className="flex items-start gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: featureIdx * 0.05 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm text-[#4A5568]">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Bottom accent */}
              {plan.highlighted && (
                <div className="h-2 bg-gradient-to-r from-[#6708C0] to-[#4A90E2]"></div>
              )}
            </motion.div>
          ))}
        </div>

        
      </div>
    </section>
  )
}
