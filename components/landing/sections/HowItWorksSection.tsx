'use client'

import { motion } from 'framer-motion'
import { UserPlus, Settings, Zap, TrendingUp } from 'lucide-react'

interface HowItWorksSectionProps {
  onBookDemo?: () => void
}

export default function HowItWorksSection({ onBookDemo }: HowItWorksSectionProps) {
  const steps = [
    {
      number: 1,
      title: 'Sign Up',
      description: 'Create your account in 2 minutes',
      detail: 'No credit card required. Just your name, email, and academy details. We\'ll set up your dashboard instantly.',
      icon: <UserPlus className="w-8 h-8" />,
      color: '#4A90E2'
    },
    {
      number: 2,
      title: 'Customize',
      description: 'Add your courses, instructors, and students',
      detail: 'Import from Excel or add manually. Set up your batches, fee structures, and schedules with our guided setup wizard.',
      icon: <Settings className="w-8 h-8" />,
      color: '#6708C0'
    },
    {
      number: 3,
      title: 'Automate',
      description: 'Set your schedules and payment rules',
      detail: 'Configure recurring schedules, automatic payment reminders, and attendance tracking. Then sit back and relax.',
      icon: <Zap className="w-8 h-8" />,
      color: '#FF9A3D'
    },
    {
      number: 4,
      title: 'Grow',
      description: 'Focus on teaching while UniqBrio handles the rest',
      detail: 'Unlock parent portals so artists track progress, not payments—nurture talent, not spreadsheets.',
      icon: <TrendingUp className="w-8 h-8" />,
      color: '#10B981'
    }
  ]

  return (
    <section className="py-20 px-4 md:px-8 bg-gradient-to-b from-white to-[#FAFAFA] relative overflow-hidden">
      {/* Background decorative gradient path */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#6708C0', stopOpacity: 0.1 }} />
              <stop offset="50%" style={{ stopColor: '#4A90E2', stopOpacity: 0.1 }} />
              <stop offset="100%" style={{ stopColor: '#10B981', stopOpacity: 0.1 }} />
            </linearGradient>
          </defs>
          <path
            d="M 100 500 Q 300 300 500 500 T 900 500"
            fill="none"
            stroke="url(#pathGradient)"
            strokeWidth="100"
            opacity="0.3"
          />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
            Get Started in <span className="text-[#6708C0]">4 Simple Steps</span>
          </h2>
          <p className="text-xl text-[#718096]">From chaos to clarity in less than 2 minutes</p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting Path */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-[#6708C0] via-[#4A90E2] to-[#10B981] transform -translate-y-1/2 z-0"></div>

          <div className="grid md:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="relative"
              >
                <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  {/* Step Number Circle */}
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.2 + 0.3, type: 'spring', stiffness: 200 }}
                    className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                    style={{ 
                      background: `linear-gradient(135deg, ${step.color}, ${step.color}dd)` 
                    }}
                  >
                    {step.number}
                  </motion.div>

                  {/* Icon */}
                  <div 
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: `${step.color}20` }}
                  >
                    <div style={{ color: step.color }}>
                      {step.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-[#1A1A1A] text-center mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm font-semibold text-[#6708C0] text-center mb-3">
                    {step.description}
                  </p>
                  <p className="text-sm text-[#718096] text-center leading-relaxed">
                    {step.detail}
                  </p>

                  {/* Arrow for mobile */}
                  {idx < steps.length - 1 && (
                    <div className="md:hidden flex justify-center mt-4">
                      <div className="text-3xl text-[#6708C0]">↓</div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        
      </div>
    </section>
  )
}
