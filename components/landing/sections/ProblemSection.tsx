'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, FileSpreadsheet, ClipboardList, Users, AlertCircle, X, Check } from 'lucide-react'
import { Slider } from '@/components/ui/slider'

export default function ProblemSection() {
  const [sliderValue, setSliderValue] = useState([0])
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  const painPoints = [
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: 'Sending 200–300 payment reminders on WhatsApp',
      color: '#FF9A3D',
      stat: '200-300',
      label: 'reminders/month'
    },
    {
      icon: <FileSpreadsheet className="w-8 h-8" />,
      title: 'Fixing batch clashes in Excel till midnight',
      color: '#FF9A3D',
      stat: '47',
      label: 'Excel sheets'
    },
    {
      icon: <ClipboardList className="w-8 h-8" />,
      title: 'Marking attendance in a paper register',
      color: '#FF9A3D',
      stat: '2-3',
      label: 'hours daily'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Managing 15 different parent groups',
      color: '#FF9A3D',
      stat: '15+',
      label: 'WhatsApp groups'
    }
  ]

  return (
    <section className="py-20 px-4 md:px-8 bg-gradient-to-b from-white to-[#FAFAFA]">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-2 bg-red-100 text-red-600 rounded-full text-sm font-semibold mb-4">
            <AlertCircle className="inline w-4 h-4 mr-2" />
            Sound Familiar?
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
            Evenings spent...
          </h2>
        </motion.div>

        {/* Pain Points Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {painPoints.map((point, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              onHoverStart={() => setHoveredCard(index)}
              onHoverEnd={() => setHoveredCard(null)}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative bg-white p-6 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer"
            >
              {/* Animated background gradient on hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-red-50 to-orange-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
              
              {/* X icon that appears on hover */}
              <AnimatePresence>
                {hoveredCard === index && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    className="absolute top-2 right-2 z-10"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                      <X className="w-5 h-5 text-white" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative z-10">
                {/* Icon with pulse animation */}
                <motion.div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto relative"
                  style={{ backgroundColor: `${point.color}20` }}
                  animate={hoveredCard === index ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: hoveredCard === index ? Infinity : 0 }}
                >
                  <div style={{ color: point.color }}>
                    {point.icon}
                  </div>
                  {/* Ripple effect */}
                  {hoveredCard === index && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2"
                      style={{ borderColor: point.color }}
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </motion.div>

                {/* Stats */}
                <motion.div
                  className="text-center mb-3"
                  animate={hoveredCard === index ? { y: [-2, 0, -2] } : {}}
                  transition={{ duration: 1, repeat: hoveredCard === index ? Infinity : 0 }}
                >
                  <div className="text-3xl font-bold text-red-600">{point.stat}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">{point.label}</div>
                </motion.div>

                {/* Title */}
                <p className="text-center text-[#1A1A1A] font-medium leading-relaxed text-sm">
                  {point.title}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empathy Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-purple-100 to-orange-100 p-8 rounded-2xl text-center mb-12"
        >
          <p className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-2">
            You started your academy to teach,
          </p>
          <p className="text-2xl md:text-3xl font-bold text-[#6708C0]">
            not to do admin.
          </p>
        </motion.div>

        {/* Before vs After Slider */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-white rounded-2xl overflow-hidden shadow-2xl"
        >
          <div className="grid md:grid-cols-2">
            {/* Before */}
            <motion.div 
              className={`p-8 transition-all duration-300 ${sliderValue[0] < 50 ? 'opacity-100' : 'opacity-40'}`}
              animate={sliderValue[0] < 50 ? { scale: 1 } : { scale: 0.95 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <motion.div 
                  className="px-4 py-1 bg-red-500 text-white rounded-full text-sm font-bold flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <X className="w-4 h-4" />
                  BEFORE
                </motion.div>
                <span className="text-2xl">😰</span>
              </div>
              <div className="space-y-4">
                {[
                  { icon: <FileSpreadsheet className="w-4 h-4" />, text: 'Cluttered desk with papers everywhere' },
                  { icon: <ClipboardList className="w-4 h-4" />, text: '47 different Excel sheets' },
                  { icon: <AlertCircle className="w-4 h-4" />, text: 'Working till midnight on admin' },
                  { icon: <Users className="w-4 h-4" />, text: 'Missing payments and student updates' }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    className="flex items-start gap-3 group"
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="text-red-500">{item.icon}</div>
                    </div>
                    <p className="text-[#4A5568]">{item.text}</p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 text-6xl opacity-20">📊📋📄</div>
            </motion.div>

            {/* After */}
            <motion.div 
              className={`p-8 bg-gradient-to-br from-green-50 to-blue-50 transition-all duration-300 ${sliderValue[0] > 50 ? 'opacity-100' : 'opacity-40'}`}
              animate={sliderValue[0] > 50 ? { scale: 1 } : { scale: 0.95 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <motion.div 
                  className="px-4 py-1 bg-[#10B981] text-white rounded-full text-sm font-bold flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <Check className="w-4 h-4" />
                  AFTER
                </motion.div>
                <span className="text-2xl">😊</span>
              </div>
              <div className="space-y-4">
                {[
                  { icon: <Check className="w-4 h-4" />, text: 'One clean, beautiful dashboard' },
                  { icon: <Check className="w-4 h-4" />, text: 'Everything automated' },
                  { icon: <Check className="w-4 h-4" />, text: 'Evenings free for family & students' },
                  { icon: <Check className="w-4 h-4" />, text: 'Parents & students always updated' }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    className="flex items-start gap-3 group"
                    initial={{ x: 20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ x: -5 }}
                  >
                    <div className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="text-white">{item.icon}</div>
                    </div>
                    <p className="text-[#1A1A1A] font-medium">{item.text}</p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 text-6xl opacity-20">✨🚀🎉</div>
            </motion.div>
          </div>

          {/* Slider Control */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-64">
            <Slider
              value={sliderValue}
              onValueChange={setSliderValue}
              max={100}
              step={1}
              className="cursor-pointer"
            />
            <div className="flex justify-between mt-2 text-xs text-[#718096]">
              <span>Before</span>
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="font-semibold"
              >
                👆 Drag to compare
              </motion.span>
              <span>After</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
