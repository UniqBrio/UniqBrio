'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calculator, TrendingUp, Clock, IndianRupee } from 'lucide-react'
import Image from 'next/image'

export default function ROICalculatorPage() {
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <motion.div
              className="flex items-center cursor-pointer"
              onClick={() => (window.location.href = '/')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative h-10 w-32 sm:h-12 sm:w-48">
                <Image
                  src="/logo.png"
                  alt="UniqBrio"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </motion.div>

            <motion.button
              onClick={() => (window.location.href = '/')}
              className="px-6 py-2 text-[#6708C0] hover:text-[#8B5CF6] font-semibold transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ← Back to Home
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-16 px-4 md:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.div
              className="inline-flex items-center gap-2 mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Calculator className="w-8 h-8 text-[#6708C0]" />
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1A1A1A] mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              See exactly how much UniqBrio will save your academy every month
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-gray-600 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Most academies save 60–80 hours of admin work per month. Plug in
              your numbers:
            </motion.p>
          </motion.div>

          {/* Calculator Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-8"
          >
            {/* Input Fields */}
            <div className="space-y-10 mb-12">
              {/* Number of Students */}
              <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-[#1A1A1A] mb-4">
                  <TrendingUp className="w-5 h-5 text-[#6708C0]" />
                  How many active students do you have?
                </label>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={students}
                  onChange={(e) => setStudents(Number(e.target.value))}
                  className="w-full h-3 bg-gradient-to-r from-[#6708C0] to-[#8B5CF6] rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-gray-500">10 students</span>
                  <span className="text-3xl font-bold text-[#6708C0]">
                    {students}
                  </span>
                  <span className="text-sm text-gray-500">500 students</span>
                </div>
              </div>

              {/* Time Saved Per Student */}
              <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-[#1A1A1A] mb-4">
                  <Clock className="w-5 h-5 text-[#6708C0]" />
                  Minutes saved per student per day
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  (attendance, fees follow-up, messaging, etc.)
                </p>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={timeSaved}
                  onChange={(e) => setTimeSaved(Number(e.target.value))}
                  className="w-full h-3 bg-gradient-to-r from-[#6708C0] to-[#8B5CF6] rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-gray-500">1 min</span>
                  <span className="text-3xl font-bold text-[#6708C0]">
                    {timeSaved} min
                  </span>
                  <span className="text-sm text-gray-500">10 min</span>
                </div>
              </div>

              {/* Hourly Rate */}
              <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-[#1A1A1A] mb-4">
                  <IndianRupee className="w-5 h-5 text-[#6708C0]" />
                  What is your (or your admin's) hourly rate?
                </label>
                <input
                  type="range"
                  min="200"
                  max="2000"
                  step="50"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full h-3 bg-gradient-to-r from-[#6708C0] to-[#8B5CF6] rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-gray-500">₹200/hr</span>
                  <span className="text-3xl font-bold text-[#6708C0]">
                    ₹{hourlyRate}/hr
                  </span>
                  <span className="text-sm text-gray-500">₹2000/hr</span>
                </div>
              </div>
            </div>

            {/* Results Box */}
            <motion.div
              key={`${savings.hours}-${savings.money}`}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-[#6708C0] to-[#8B5CF6] rounded-2xl p-8 text-white text-center shadow-xl"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                You'll save approximately
              </h2>
              <div className="text-5xl md:text-6xl font-bold mb-2">
                {savings.hours} hours
              </div>
              <div className="text-3xl md:text-4xl font-bold mb-4">
                & ₹{savings.money.toLocaleString('en-IN')}
              </div>
              <p className="text-xl md:text-2xl font-semibold opacity-90">
                every month
              </p>
              <div className="mt-6 pt-6 border-t border-white/30">
                <p className="text-lg md:text-xl opacity-90">
                  That's like getting a full-time admin for free.
                </p>
              </div>
            </motion.div>

            {/* Disclaimer */}
            <p className="text-sm text-gray-500 text-center mt-6 italic">
              Based on average time savings reported by academy owners during
              our validation interviews.
            </p>
          </motion.div>

          {/* Final CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-6">
              Stop paying for your own admin prison.
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join UniqBrio and lock in lifetime savings before 31 Dec 2025
            </p>

            <motion.button
              onClick={() => (window.location.href = '/signup')}
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-[#DE7D14] to-[#FF9A3D] text-white font-bold text-xl rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300"
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Join Waitlist – Get 40% Lifetime Discount</span>
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </motion.button>

            <p className="text-sm text-gray-500 mt-6">
              Limited time offer • Secure your spot now
            </p>
          </motion.div>
        </div>
      </main>

      {/* Custom CSS for slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(103, 8, 192, 0.4);
          border: 3px solid #6708c0;
        }

        .slider::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(103, 8, 192, 0.4);
          border: 3px solid #6708c0;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  )
}
