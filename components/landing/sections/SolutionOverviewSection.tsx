'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Clock, LayoutDashboard, MessageCircle, Users } from 'lucide-react'

export default function SolutionOverviewSection() {
  const comparisonData = [
    {
      before: '200–300 payment reminders/month',
      after: '100% automated → ₹60,000–₹1,50,000 extra collected every year',
      icon: <TrendingUp className="w-6 h-6" />,
      color: '#10B981'
    },
    {
      before: '15–20 hours/week on admin',
      after: 'Reclaimed for coaching, family or launching new batches',
      icon: <Clock className="w-6 h-6" />,
      color: '#4A90E2'
    },
    {
      before: '47 different apps & WhatsApp groups',
      after: 'One clean, beautiful dashboard',
      icon: <LayoutDashboard className="w-6 h-6" />,
      color: '#6708C0'
    },
    {
      before: 'Parents messaging you non-stop',
      after: 'One in-app feed + progress photos & videos',
      icon: <MessageCircle className="w-6 h-6" />,
      color: '#FF9A3D'
    },
    {
      before: 'Students leaving due to disorganisation',
      after: '25–40% higher retention → steady revenue growth',
      icon: <Users className="w-6 h-6" />,
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
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
            How UniqBrio <span className="text-[#6708C0]">Changes Everything</span>
          </h2>
          <p className="text-xl text-[#718096] max-w-3xl mx-auto">
            Real numbers. Real impact. From chaos to clarity.
          </p>
        </motion.div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="min-w-[800px] bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Table Header */}
            <div className="grid grid-cols-3 bg-gradient-to-r from-[#6708C0] to-[#4A90E2] text-white">
              <div className="p-6 border-r border-white/20">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">😰</span>
                  <h3 className="text-xl font-bold">Life Before UniqBrio</h3>
                </div>
              </div>
              <div className="p-6 col-span-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✨</span>
                  <h3 className="text-xl font-bold">Life After UniqBrio – Real Numbers</h3>
                </div>
              </div>
            </div>

            {/* Table Rows */}
            {comparisonData.map((row, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`grid grid-cols-3 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors duration-300`}
              >
                {/* Before Column */}
                <div className="p-6 border-r border-gray-200 flex items-center">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-[#4A5568] leading-relaxed">{row.before}</p>
                  </div>
                </div>

                {/* After Column */}
                <div className="p-6 col-span-2 flex items-center">
                  <div className="flex items-start gap-4 w-full">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${row.color}20` }}
                    >
                      <div style={{ color: row.color }}>
                        {row.icon}
                      </div>
                    </div>
                    <p className="text-[#1A1A1A] font-semibold text-lg leading-relaxed flex-1">
                      {row.after}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Footer CTA */}
            <div className="bg-gradient-to-r from-[#DE7D14] to-[#FF9A3D] p-6 text-center">
              <p className="text-white text-xl font-bold">
                Ready to transform your academy? <span className="underline">Book your demo now</span> 👇
              </p>
            </div>
          </motion.div>
        </div>

        {/* Visual Explainer Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="inline-block bg-gradient-to-r from-purple-100 to-orange-100 px-6 py-3 rounded-full">
            <p className="text-[#6708C0] font-semibold">
              💡 See it in action – Watch our 90-second explainer below
            </p>
          </div>
          
          {/* Video Demonstration */}
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="relative aspect-video bg-gradient-to-br from-purple-100 via-blue-100 to-orange-100 rounded-2xl overflow-hidden shadow-2xl">
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/8lSoprr1aHA?start=1"
                title="UniqBrio Platform Overview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
