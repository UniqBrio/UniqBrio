'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, FileSpreadsheet, ClipboardList, Users, AlertCircle, X, Check, Sparkles } from 'lucide-react'
import { Slider } from '@/components/ui/slider'

interface ProblemSectionProps {
  onBookDemo?: () => void
}

export default function ProblemSection({ onBookDemo }: ProblemSectionProps) {
  const [sliderValue, setSliderValue] = useState([0])
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  // Auto-animate slider
  useEffect(() => {
    const interval = setInterval(() => {
      setSliderValue(prev => {
        const current = prev[0]
        if (current >= 100) {
          return [0]
        }
        return [current + 1]
      })
    }, 50) // Adjust speed here (lower = faster)

    return () => clearInterval(interval)
  }, [])

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
          <p className="text-2xl md:text-3xl font-bold text-[#6708C0] mb-6">
            not to do admin.
          </p>
          
          {/* Get Rid of It Button */}
          <motion.button
            onClick={() => onBookDemo && onBookDemo()}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#DE7D14] to-[#FF9A3D] text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Animated background shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
              animate={{ x: ['-200%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
            
            <Sparkles className="w-5 h-5" />
            <span className="relative z-10">Get Rid of It</span>
            
            {/* Pulsing glow effect */}
            <motion.span
              className="absolute inset-0 bg-white rounded-xl"
              animate={{ 
                opacity: [0, 0.15, 0],
                scale: [0.95, 1.05, 0.95]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.button>
        </motion.div>

        {/* Unified Box with 2 Columns: Before/After + Video */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-100"
        >
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column: Before vs After Slider */}
            <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-2xl overflow-hidden shadow-lg">
              <div className="grid grid-cols-2">
                {/* Before */}
                <motion.div 
                  className={`p-6 transition-all duration-300 ${sliderValue[0] < 50 ? 'opacity-100' : 'opacity-40'}`}
                  animate={sliderValue[0] < 50 ? { scale: 1 } : { scale: 0.95 }}
                >
                  <div className="flex items-center gap-2 mb-6">
                    <motion.div 
                      className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-bold flex items-center gap-1"
                      whileHover={{ scale: 1.05 }}
                    >
                      <X className="w-3 h-3" />
                      BEFORE
                    </motion.div>
                    <span className="text-xl">😰</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { icon: <FileSpreadsheet className="w-4 h-4" />, text: 'Cluttered desk with papers everywhere' },
                      { icon: <ClipboardList className="w-4 h-4" />, text: '47 different Excel sheets' },
                      { icon: <AlertCircle className="w-4 h-4" />, text: 'Working till midnight on admin' },
                      { icon: <Users className="w-4 h-4" />, text: 'Missing payments and student updates' }
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        className="flex items-start gap-2 group"
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ x: 5 }}
                      >
                        <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="text-red-500">{item.icon}</div>
                        </div>
                        <p className="text-[#4A5568] text-sm leading-tight">{item.text}</p>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-4 text-4xl opacity-20">📊📋📄</div>
                </motion.div>

                {/* After */}
                <motion.div 
                  className={`p-6 bg-gradient-to-br from-green-50 to-purple-50 transition-all duration-300 ${sliderValue[0] > 50 ? 'opacity-100' : 'opacity-40'}`}
                  animate={sliderValue[0] > 50 ? { scale: 1 } : { scale: 0.95 }}
                >
                  <div className="flex items-center gap-2 mb-6">
                    <motion.div 
                      className="px-3 py-1 bg-[#10B981] text-white rounded-full text-xs font-bold flex items-center gap-1"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Check className="w-3 h-3" />
                      AFTER
                    </motion.div>
                    <span className="text-xl">😊</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { icon: <Check className="w-4 h-4" />, text: 'One clean, beautiful dashboard' },
                      { icon: <Check className="w-4 h-4" />, text: 'Everything automated' },
                      { icon: <Check className="w-4 h-4" />, text: 'Evenings free for family & students' },
                      { icon: <Check className="w-4 h-4" />, text: 'Parents & students always updated' }
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        className="flex items-start gap-2 group"
                        initial={{ x: 20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ x: -5 }}
                      >
                        <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="text-white">{item.icon}</div>
                        </div>
                        <p className="text-[#1A1A1A] font-medium text-sm leading-tight">{item.text}</p>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-4 text-4xl opacity-20">✨🚀🎉</div>
                </motion.div>
              </div>

              {/* Slider Control with Animated Emojis */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-64">
                <div className="relative">
                  {/* Left Emoji - Stressed */}
                  <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 text-3xl"
                    animate={{
                      opacity: sliderValue[0] < 50 ? [0.5, 1, 0.5] : 0.2,
                    }}
                    transition={{
                      duration: 2,
                      repeat: sliderValue[0] < 50 ? Infinity : 0,
                      ease: "easeInOut"
                    }}
                  >
                    😰
                  </motion.div>

                  {/* Slider */}
                  <Slider
                    value={sliderValue}
                    onValueChange={setSliderValue}
                    max={100}
                    step={1}
                    className="cursor-pointer"
                  />

                  {/* Right Emoji - Happy */}
                  <motion.div
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 text-3xl"
                    animate={{
                      opacity: sliderValue[0] > 50 ? 1 : 0.2,
                    }}
                    transition={{
                      duration: 0.5,
                      ease: "easeInOut"
                    }}
                  >
                    😊
                  </motion.div>
                </div>

                {/* Label below slider */}
                <div className="text-center mt-3">
                  <span className="text-xs font-semibold text-[#6708C0]">
                    Auto-comparing
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Video Demo */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">🎥</span>
                <h3 className="text-2xl font-bold text-[#1A1A1A]">
                  See the Solution in Action
                </h3>
              </div>
              <div className="relative rounded-xl overflow-hidden shadow-xl border-2 border-[#6708C0]/20 bg-black">
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
              <p className="text-sm text-[#718096] mt-4 text-center">
                Watch how UniqBrio eliminates all these problems in minutes
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
