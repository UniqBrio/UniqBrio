'use client'

import { motion } from 'framer-motion'
import { Target, Heart } from 'lucide-react'

export default function VisionMissionSection() {
  return (
    <section className="py-20 px-4 md:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Vision */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="absolute top-4 right-4 text-4xl opacity-20">
              <Target className="w-16 h-16 text-[#6708C0]" />
            </div>
            <div className="relative z-10">
              <div className="inline-block p-3 bg-[#6708C0] rounded-xl mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">Our Vision</h2>
              <p className="text-lg text-[#4A5568] leading-relaxed">
                To connect the passion for arts and sports with the productivity of smart management tools 
                — helping every academy excel at inspiring and training the next generation of talent.
              </p>
            </div>
          </motion.div>

          {/* Mission */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative p-8 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="absolute top-4 right-4 text-4xl opacity-20">
              <Heart className="w-16 h-16 text-[#DE7D14]" />
            </div>
            <div className="relative z-10">
              <div className="inline-block p-3 bg-[#DE7D14] rounded-xl mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">Our Mission</h2>
              <p className="text-lg text-[#4A5568] leading-relaxed">
                To transform arts & sports academies across India by providing a comprehensive, human, 
                easy-to-use platform that removes administrative burnout and lets owners focus 100% 
                on nurturing learners.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
