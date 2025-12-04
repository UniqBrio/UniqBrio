'use client'

import { motion } from 'framer-motion'
import { Calendar, ArrowRight, Clock } from 'lucide-react'

interface FinalCTASectionProps {
  onBookDemo?: () => void
}

export default function FinalCTASection({ onBookDemo }: FinalCTASectionProps) {
  return (
    <section id="demo-form" className="py-20 px-4 md:px-8 relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#DE7D14] via-[#6708C0] to-[#4A90E2]"></div>
      
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-20 right-20 w-64 h-64 bg-white rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-10 left-1/2 w-64 h-64 bg-white rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-white mb-12"
        >
          {/* Urgency Badge */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="inline-block bg-white text-[#DE7D14] px-6 py-3 rounded-full font-bold text-lg mb-6 shadow-2xl"
          >
            <Clock className="inline w-5 h-5 mr-2 animate-pulse" />
            Only 58 spots remaining today!
          </motion.div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Be one of the first 100 academies
            <br />
            to go live tomorrow –{' '}
            <span className="text-yellow-300">10 December 2025</span>
          </h2>

          <p className="text-xl md:text-2xl mb-4 opacity-95">
            Personal onboarding + lifetime pricing locked
          </p>

          <div className="flex items-center justify-center gap-6 flex-wrap text-lg mb-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#10B981] rounded-full"></div>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#10B981] rounded-full"></div>
              <span>100% Free demo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#10B981] rounded-full"></div>
              <span>30-minute call</span>
            </div>
          </div>
        </motion.div>

        {/* Demo Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-2xl mx-auto"
        >
          <div className="text-center mb-8">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-[#6708C0]" />
            <h3 className="text-3xl font-bold text-[#1A1A1A] mb-2">
              Book Your Free 30-Min Demo
            </h3>
            <p className="text-[#718096]">
              See UniqBrio in action. Get answers to all your questions.
            </p>
          </div>

          {/* Embedded Form - Replace with actual Tally.so or Typeform */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#1A1A1A] mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Wisdom Academy"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#6708C0] focus:ring-2 focus:ring-[#6708C0]/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1A1A1A] mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#6708C0] focus:ring-2 focus:ring-[#6708C0]/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1A1A1A] mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="priya@academy.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#6708C0] focus:ring-2 focus:ring-[#6708C0]/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1A1A1A] mb-2">
                Academy Type <span className="text-red-500">*</span>
              </label>
              <select className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#6708C0] focus:ring-2 focus:ring-[#6708C0]/20 outline-none transition-all">
                <option value="">Select your academy type</option>
                <option value="dance">Dance Academy</option>
                <option value="cricket">Cricket Academy</option>
                <option value="music">Music School</option>
                <option value="martial-arts">Martial Arts / Karate / Taekwondo</option>
                <option value="badminton">Badminton Academy</option>
                <option value="yoga">Yoga Studio</option>
                <option value="swimming">Swimming School</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1A1A1A] mb-2">
                Number of Students (Optional)
              </label>
              <input
                type="number"
                placeholder="50"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#6708C0] focus:ring-2 focus:ring-[#6708C0]/20 outline-none transition-all"
              />
            </div>

            <button
              type="button"
              onClick={() => onBookDemo ? onBookDemo() : document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full bg-gradient-to-r from-[#DE7D14] to-[#FF9A3D] text-white font-bold text-lg py-4 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 group"
            >
              Book My Free Demo Now
              <ArrowRight className="inline ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-xs text-center text-[#718096] mt-4">
              🔒 Your information is 100% secure and will never be shared.
              <br />
              We'll reach out within 24 hours to schedule your demo.
            </p>
          </div>
        </motion.div>

        {/* Social Proof Below Form */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-white"
        >
          <p className="text-lg mb-4">
            Join these academy owners who booked their demo today:
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl shadow-lg"
              >
                {['👨', '👩', '🧑', '👨‍🏫', '👩‍🏫'][i % 5]}
              </div>
            ))}
            <div className="ml-2 text-lg font-semibold">
              +48 more today
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
