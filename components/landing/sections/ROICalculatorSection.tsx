'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calculator, TrendingUp, Clock, IndianRupee, Sparkles, ArrowRight } from 'lucide-react'

interface ROICalculatorSectionProps {
  onBookDemo?: () => void
}

export default function ROICalculatorSection({ onBookDemo }: ROICalculatorSectionProps) {
  const [students, setStudents] = useState(50)
  const [timeSaved, setTimeSaved] = useState(3.5)
  const [hourlyRate, setHourlyRate] = useState(400)
  const [savings, setSavings] = useState({ hours: 0, money: 0 })

  useEffect(() => {
    // Calculate savings
    const minutesPerDay = students * timeSaved
    const hoursPerDay = minutesPerDay / 60
    const workingDaysPerMonth = 22
    const hoursPerMonth = hoursPerDay * workingDaysPerMonth
    const moneyPerMonth = hoursPerMonth * hourlyRate

    setSavings({
      hours: Math.round(hoursPerMonth * 10) / 10,
      money: Math.round(moneyPerMonth / 100) * 100, // Round to nearest 100
    })
  }, [students, timeSaved, hourlyRate])

  return (
    <section className="relative py-20 md:py-28 px-4 md:px-8 lg:px-12 bg-gradient-to-br from-[#f5fbff] via-[#faf5ff] to-[#fff8f0] overflow-hidden">
      {/* Subtle gradient background matching hero section */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(103,8,192,0.06),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(222,125,20,0.06),transparent_50%)]" />
      
      {/* Animated background blobs - matching landing page */}
      <motion.div
        className="absolute top-20 left-20 w-96 h-96 rounded-full filter blur-3xl opacity-8"
        style={{ background: 'linear-gradient(135deg, #e9d5ff 0%, #ddd6fe 100%)' }}
        animate={{ 
          scale: [1, 1.1, 1],
          x: [0, 30, 0],
          y: [0, -20, 0]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-96 h-96 rounded-full filter blur-3xl opacity-8"
        style={{ background: 'linear-gradient(135deg, #fed7aa 0%, #fde68a 100%)' }}
        animate={{ 
          scale: [1, 1.1, 1],
          x: [0, -30, 0],
          y: [0, 20, 0]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-[#6708C0]/20 mb-6 shadow-sm"
          >
            <Calculator className="w-5 h-5 text-[#6708C0]" />
            <span className="text-sm font-semibold text-[#6708C0] uppercase tracking-wide">
              ROI Calculator
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1A1A1A] mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            See exactly how much{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6708C0] to-[#8B5CF6]">
              UniqBrio
            </span>{' '}
            will save your academy
          </motion.h2>

          {/* Sub-headline */}
          <motion.p
            className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Most academies save <span className="font-bold text-[#6708C0]">60–80 hours</span> of admin work per month. Plug in your numbers:
          </motion.p>
        </motion.div>

        {/* Calculator Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 md:p-12 mb-12"
        >
          {/* Input Fields */}
          <div className="space-y-12 mb-12">
            {/* Number of Students */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <label className="flex items-center gap-3 text-xl font-bold text-[#1A1A1A] mb-2">
                    <div className="p-2.5 bg-gradient-to-br from-[#6708C0] to-[#8B5CF6] rounded-xl shadow-lg">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    How many active students do you have?
                  </label>
                </div>
                <motion.div 
                  className="text-right px-6 py-3 bg-gradient-to-br from-[#6708C0] to-[#8B5CF6] rounded-2xl shadow-xl"
                  key={students}
                  initial={{ scale: 1.15 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, type: "spring" }}
                >
                  <div className="text-5xl font-black text-white">{students}</div>
                  <div className="text-sm text-white/80 mt-1 font-semibold">students</div>
                </motion.div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 h-4 bg-gray-200 rounded-full" />
                <motion.div 
                  className="absolute inset-y-0 left-0 h-4 bg-gradient-to-r from-[#6708C0] to-[#8B5CF6] rounded-full shadow-lg"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((students - 10) / (500 - 10)) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={students}
                  onChange={(e) => setStudents(Number(e.target.value))}
                  className="relative w-full h-4 bg-transparent appearance-none cursor-pointer slider z-10"
                />
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm font-semibold text-gray-600 px-3 py-1 bg-gray-100 rounded-full">10</span>
                <span className="text-sm font-semibold text-gray-600 px-3 py-1 bg-gray-100 rounded-full">500</span>
              </div>
            </motion.div>

            {/* Time Saved Per Student */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <label className="flex items-center gap-3 text-xl font-bold text-[#1A1A1A] mb-2">
                    <div className="p-2.5 bg-gradient-to-br from-[#6708C0] to-[#8B5CF6] rounded-xl shadow-lg">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    Minutes saved per student per day
                  </label>
                  <p className="text-sm text-gray-600 ml-14 font-medium">
                    (attendance, fees follow-up, messaging, etc.)
                  </p>
                </div>
                <motion.div 
                  className="text-right px-6 py-3 bg-gradient-to-br from-[#6708C0] to-[#8B5CF6] rounded-2xl shadow-xl"
                  key={timeSaved}
                  initial={{ scale: 1.15 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, type: "spring" }}
                >
                  <div className="text-5xl font-black text-white">{timeSaved}</div>
                  <div className="text-sm text-white/80 mt-1 font-semibold">minutes</div>
                </motion.div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 h-4 bg-gray-200 rounded-full" />
                <motion.div 
                  className="absolute inset-y-0 left-0 h-4 bg-gradient-to-r from-[#6708C0] to-[#8B5CF6] rounded-full shadow-lg"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((timeSaved - 1) / (10 - 1)) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={timeSaved}
                  onChange={(e) => setTimeSaved(Number(e.target.value))}
                  className="relative w-full h-4 bg-transparent appearance-none cursor-pointer slider z-10"
                />
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm font-semibold text-gray-600 px-3 py-1 bg-gray-100 rounded-full">1 min</span>
                <span className="text-sm font-semibold text-gray-600 px-3 py-1 bg-gray-100 rounded-full">10 min</span>
              </div>
            </motion.div>

            {/* Hourly Rate */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <label className="flex items-center gap-3 text-xl font-bold text-[#1A1A1A] mb-2">
                    <div className="p-2.5 bg-gradient-to-br from-[#6708C0] to-[#8B5CF6] rounded-xl shadow-lg">
                      <IndianRupee className="w-6 h-6 text-white" />
                    </div>
                    What is your (or your admin's) hourly rate?
                  </label>
                </div>
                <motion.div 
                  className="text-right px-6 py-3 bg-gradient-to-br from-[#6708C0] to-[#8B5CF6] rounded-2xl shadow-xl"
                  key={hourlyRate}
                  initial={{ scale: 1.15 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, type: "spring" }}
                >
                  <div className="text-5xl font-black text-white">₹{hourlyRate}</div>
                  <div className="text-sm text-white/80 mt-1 font-semibold">per hour</div>
                </motion.div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 h-4 bg-gray-200 rounded-full" />
                <motion.div 
                  className="absolute inset-y-0 left-0 h-4 bg-gradient-to-r from-[#6708C0] to-[#8B5CF6] rounded-full shadow-lg"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((hourlyRate - 200) / (2000 - 200)) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
                <input
                  type="range"
                  min="200"
                  max="2000"
                  step="50"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="relative w-full h-4 bg-transparent appearance-none cursor-pointer slider z-10"
                />
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm font-semibold text-gray-600 px-3 py-1 bg-gray-100 rounded-full">₹200</span>
                <span className="text-sm font-semibold text-gray-600 px-3 py-1 bg-gray-100 rounded-full">₹2000</span>
              </div>
            </motion.div>
          </div>

          {/* Results Box */}
          <motion.div
            key={`${savings.hours}-${savings.money}`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
            className="relative rounded-3xl p-1 shadow-2xl overflow-hidden"
          >
            {/* Animated gradient border */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-[#6708C0] via-[#DE7D14] to-[#6708C0] rounded-3xl"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: '200% 200%' }}
            />
            
            <div className="relative bg-gradient-to-br from-[#6708C0]/95 via-[#7B2CBF]/95 to-[#8B5CF6]/95 backdrop-blur-xl rounded-3xl p-8 md:p-12">
              {/* Floating orbs background */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl">
                <motion.div
                  className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"
                  animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute bottom-10 right-10 w-40 h-40 bg-[#DE7D14]/20 rounded-full blur-2xl"
                  animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              
              <div className="relative z-10 text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full mb-6 border border-white/30"
                >
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                  <span className="text-sm font-bold text-white uppercase tracking-wider">Your Savings</span>
                </motion.div>
                
                <h3 className="text-xl md:text-2xl font-semibold text-white/90 mb-8">
                  You'll save approximately
                </h3>
                
                {/* Floating cards for stats */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <motion.div
                    key={`hours-${savings.hours}`}
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                    <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all duration-300">
                      <Clock className="w-10 h-10 text-yellow-300 mx-auto mb-4" />
                      <div className="text-6xl md:text-7xl font-black text-white mb-2">{savings.hours}</div>
                      <div className="text-xl font-bold text-white/80">Hours Saved</div>
                      <div className="text-sm text-white/60 mt-2">per month</div>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    key={`money-${savings.money}`}
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, type: "spring", bounce: 0.4, delay: 0.1 }}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#DE7D14]/30 to-[#FF9A3D]/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                    <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all duration-300">
                      <IndianRupee className="w-10 h-10 text-[#FFD700] mx-auto mb-4" />
                      <div className="text-6xl md:text-7xl font-black text-white mb-2">₹{savings.money.toLocaleString('en-IN')}</div>
                      <div className="text-xl font-bold text-white/80">Money Saved</div>
                      <div className="text-sm text-white/60 mt-2">per month</div>
                    </div>
                  </motion.div>
                </div>
                
                {/* Bottom message */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6"
                >
                  <p className="text-2xl md:text-3xl font-bold text-white mb-2">
                    That's like getting a <span className="text-yellow-300">full-time admin</span> for free! 🎉
                  </p>
                  <p className="text-white/70 text-lg">Focus on teaching, not admin work</p>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Disclaimer */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            className="text-sm text-gray-500 text-center mt-6 italic"
          >
            * Based on average time savings reported by academy owners during our validation interviews
          </motion.p>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.h3
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1A1A1A] mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            Stop paying for your own{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#DE7D14] to-[#FF9A3D]">
              admin prison
            </span>
          </motion.h3>
          
          <motion.p
            className="text-xl md:text-2xl text-gray-600 mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            Join UniqBrio and lock in lifetime savings before{' '}
            <span className="font-bold text-[#DE7D14]">31 Dec 2025</span>
          </motion.p>

          <motion.button
            onClick={() => onBookDemo ? onBookDemo() : window.open('/signup', '_blank')}
            className="group relative inline-flex items-center gap-3 px-10 py-6 bg-gradient-to-r from-[#DE7D14] to-[#FF9A3D] text-white font-bold text-xl rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden"
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.9 }}
          >
            {/* Animated background shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
              animate={{ x: ['-200%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
            
            <Sparkles className="w-6 h-6" />
            <span className="relative z-10">Get a Demo</span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="w-6 h-6" />
            </motion.div>
          </motion.button>

          <motion.p
            className="text-sm text-gray-500 mt-6 flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Limited time offer • Secure your spot now
          </motion.p>
        </motion.div>
      </div>

      {/* Enhanced slider styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
          cursor: grab;
          box-shadow: 0 4px 20px rgba(103, 8, 192, 0.6), 0 0 0 4px rgba(103, 8, 192, 0.2);
          border: 3px solid #6708c0;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .slider::-moz-range-thumb {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
          cursor: grab;
          box-shadow: 0 4px 20px rgba(103, 8, 192, 0.6), 0 0 0 4px rgba(103, 8, 192, 0.2);
          border: 3px solid #6708c0;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 6px 24px rgba(103, 8, 192, 0.7), 0 0 0 6px rgba(103, 8, 192, 0.3);
        }

        .slider::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 6px 24px rgba(103, 8, 192, 0.7), 0 0 0 6px rgba(103, 8, 192, 0.3);
        }

        .slider::-webkit-slider-thumb:active {
          transform: scale(1.1);
          cursor: grabbing;
          box-shadow: 0 2px 12px rgba(103, 8, 192, 0.8), 0 0 0 4px rgba(103, 8, 192, 0.4);
        }

        .slider::-moz-range-thumb:active {
          transform: scale(1.1);
          cursor: grabbing;
          box-shadow: 0 2px 12px rgba(103, 8, 192, 0.8), 0 0 0 4px rgba(103, 8, 192, 0.4);
        }
      `}</style>
    </section>
  )
}
