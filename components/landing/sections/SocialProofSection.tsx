'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

export default function SocialProofSection() {
  const [studentsManaged, setStudentsManaged] = useState(0)
  const [revenueProcessed, setRevenueProcessed] = useState(0)

  // Animated counters
  useEffect(() => {
    const studentsInterval = setInterval(() => {
      setStudentsManaged((prev) => {
        if (prev >= 10000) return 10000
        return prev + 200
      })
    }, 20)

    const revenueInterval = setInterval(() => {
      setRevenueProcessed((prev) => {
        if (prev >= 50) return 50
        return prev + 1
      })
    }, 40)

    return () => {
      clearInterval(studentsInterval)
      clearInterval(revenueInterval)
    }
  }, [])

  const stats = [
    { value: `${studentsManaged.toLocaleString('en-IN')}+`, label: 'Students Managed', icon: '👨‍🎓' },
    { value: `₹${revenueProcessed}L+`, label: 'Processed Monthly', icon: '💰' },
    { value: '99.9%', label: 'Uptime', icon: '⚡' },
    { value: '500+', label: 'Academies Trust Us', icon: '🏆' }
  ]

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Owner, Nrityanjali Dance Academy',
      location: 'Mumbai',
      students: 85,
      image: '👩',
      quote: 'UniqBrio reduced my admin time by 15 hours every week. I can finally focus on choreography and my students!',
      rating: 5,
      highlight: 'Saved 15 hours/week'
    },
    {
      name: 'Raj Patel',
      role: 'Director, Champions Cricket Academy',
      location: 'Ahmedabad',
      students: 120,
      image: '👨',
      quote: 'We collected ₹2.5 lakhs more this year just because automated reminders stopped payment delays. Game changer!',
      rating: 5,
      highlight: 'Extra ₹2.5L collected'
    },
    {
      name: 'Kavita Menon',
      role: 'Founder, Sangeet Sadhana Music School',
      location: 'Bangalore',
      students: 50,
      image: '👩‍🏫',
      quote: 'Parents love the portal! They can check progress anytime. No more 200 WhatsApp messages daily.',
      rating: 5,
      highlight: 'Zero WhatsApp chaos'
    },
    {
      name: 'Vikram Singh',
      role: 'Head Coach, Elite Taekwondo Dojo',
      location: 'Delhi',
      students: 95,
      image: '🥋',
      quote: 'The analytics helped me identify which batches needed more attention. Student retention up by 35%!',
      rating: 5,
      highlight: '35% better retention'
    }
  ]

  const logoWall = [
    'Dance Academy 1', 'Cricket Academy 2', 'Music School 3', 'Martial Arts 4',
    'Sports Academy 5', 'Arts Institute 6', 'Yoga Studio 7', 'Swimming School 8'
  ]

  return (
    <section className="py-20 px-4 md:px-8 bg-gradient-to-b from-[#FAFAFA] to-white">
      <div className="max-w-7xl mx-auto">
        {/* Stats Counter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-gradient-to-br from-white to-purple-50 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 text-center"
              >
                <div className="text-5xl mb-3">{stat.icon}</div>
                <div className="text-3xl md:text-4xl font-bold text-[#6708C0] mb-2">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-[#718096] font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
            Loved by <span className="text-[#6708C0]">500+ Academy Owners</span>
          </h2>
          <p className="text-xl text-[#718096]">Real stories from real academies across India</p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
            >
              {/* Background Quote Mark */}
              <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Quote className="w-32 h-32 text-[#6708C0]" />
              </div>

              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6708C0] to-[#4A90E2] flex items-center justify-center text-3xl">
                      {testimonial.image}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-[#1A1A1A]">{testimonial.name}</h4>
                      <p className="text-sm text-[#718096]">{testimonial.role}</p>
                      <p className="text-xs text-[#DE7D14] font-semibold">
                        {testimonial.location} • {testimonial.students} students
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-[#FFD700] text-[#FFD700]" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-[#4A5568] leading-relaxed mb-4 italic">
                  "{testimonial.quote}"
                </p>

                {/* Highlight Badge */}
                <div className="inline-block px-4 py-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-full text-sm font-bold">
                  ✓ {testimonial.highlight}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Video Testimonial Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-purple-100 to-orange-100 p-8 rounded-2xl text-center mb-16"
        >
          <div className="max-w-3xl mx-auto">
            <div className="text-6xl mb-4">🎥</div>
            <h3 className="text-2xl font-bold text-[#1A1A1A] mb-2">
              Watch: How Bharatanatyam Academy Saved 20 Hours/Week
            </h3>
            <p className="text-[#718096] mb-4">
              See how Chennai-based Natya Kala Academy transformed their operations
            </p>
            <div className="aspect-video bg-white rounded-xl flex items-center justify-center text-[#718096]">
              [Video Testimonial Embed Placeholder]
            </div>
          </div>
        </motion.div>

        {/* Logo Wall */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-[#718096] font-semibold mb-8">Trusted by leading academies across India</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {logoWall.map((academy, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center h-24 grayscale hover:grayscale-0"
              >
                <div className="text-sm font-semibold text-[#718096]">
                  {academy} Logo
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
