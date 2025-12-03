'use client'

import { motion } from 'framer-motion'
import { Play, Video } from 'lucide-react'

export default function VideoSection() {
  return (
    <section className="py-12 md:py-16 px-4 md:px-8 bg-gradient-to-b from-white to-[#F5F3FF]">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="inline-block"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#6708C0]/10 rounded-full mb-3">
              <Video className="w-4 h-4 text-[#6708C0]" />
              <span className="text-xs font-semibold text-[#6708C0]">See It In Action</span>
            </div>
          </motion.div>

          <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-3">
            Watch How <span className="text-[#6708C0]">UniqBrio</span> Works
          </h2>
          <p className="text-base text-[#4A5568] max-w-2xl mx-auto">
            A quick walkthrough of our platform features
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          {/* Video Container with Shadow and Border */}
          <div className="relative rounded-xl overflow-hidden shadow-xl border-2 border-[#6708C0]/20 bg-black">
            {/* Aspect Ratio Container */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/8lSoprr1aHA?start=1"
                title="UniqBrio Platform Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -top-4 -left-4 w-20 h-20 bg-[#6708C0]/10 rounded-full blur-2xl -z-10"></div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#DE7D14]/10 rounded-full blur-2xl -z-10"></div>
        </motion.div>

        {/* Key Highlights Below Video */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 grid md:grid-cols-3 gap-4"
        >
          {[
            { icon: '🎯', title: 'Complete Walkthrough', desc: 'See every feature' },
            { icon: '⚡', title: 'Quick Setup', desc: 'Start in 10 minutes' },
            { icon: '💡', title: 'Real Use Cases', desc: 'Actual workflows' }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.5 + idx * 0.1 }}
              className="text-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <h3 className="text-base font-bold text-[#1A1A1A] mb-1">{item.title}</h3>
              <p className="text-xs text-[#718096]">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
