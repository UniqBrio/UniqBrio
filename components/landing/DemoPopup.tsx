'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, ArrowRight, Clock, CheckCircle, Star, Search, Check, ChevronDown } from 'lucide-react'
import confetti from 'canvas-confetti'

interface DemoPopupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function DemoPopup({ isOpen, onClose, onSuccess }: DemoPopupProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    academyType: '',
    numStudents: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [spotsRemaining, setSpotsRemaining] = useState(42)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const academyTypes = [
    'Dance Academy',
    'Cricket Academy',
    'Music School',
    'Martial Arts / Karate / Taekwondo',
    'Badminton Academy',
    'Yoga Studio',
    'Swimming School',
    'Football Academy',
    'Basketball Academy',
    'Tennis Academy',
    'Gymnastics Academy',
    'Art & Craft Studio',
    'Drama & Theatre School',
    'Singing Academy',
    'Chess Academy',
    'Skating Academy',
    'Table Tennis Academy',
  ]

  const filteredAcademyTypes = academyTypes.filter(type =>
    type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Fetch bookings count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/demo-bookings-count', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
        const data = await response.json()
        if (data.success) {
          setSpotsRemaining(data.spotsRemaining)
        }
      } catch (error) {
        console.error('Error fetching bookings count:', error)
      }
    }
    
    if (isOpen) {
      fetchCount()
    }
  }, [isOpen])

  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    
    try {
      // Validate required fields
      if (!formData.name || !formData.email || !formData.phone || !formData.academyType) {
        setIsSubmitting(false)
        setError('Please fill in all required fields')
        return
      }

      // Call API to create demo booking
      const response = await fetch('/api/book-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          academyType: formData.academyType.trim(),
          numStudents: formData.numStudents ? parseInt(formData.numStudents) : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to book demo')
      }

      setIsSubmitting(false)
      setIsSuccess(true)

      // Trigger confetti celebration
      const duration = 3000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min
      }

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)
        confetti(Object.assign({}, defaults, { 
          particleCount, 
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } 
        }))
        confetti(Object.assign({}, defaults, { 
          particleCount, 
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } 
        }))
      }, 250)

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
      
      // Reset and close after success
      setTimeout(() => {
        setIsSuccess(false)
        setFormData({ name: '', email: '', phone: '', academyType: '', numStudents: '' })
        setSearchQuery('')
        onClose()
      }, 3000)
    } catch (err) {
      setIsSubmitting(false)
      setError(err instanceof Error ? err.message : 'Failed to book demo. Please try again.')
      console.error('Error booking demo:', err)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleAcademyTypeSelect = (type: string) => {
    setFormData(prev => ({ ...prev, academyType: type }))
    setSearchQuery(type)
    setShowDropdown(false)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setFormData(prev => ({ ...prev, academyType: e.target.value }))
    setShowDropdown(true)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] p-2 md:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative w-full max-w-5xl full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Content Container with Minimalist Gradient */}
              <div className="relative overflow-hidden rounded-3xl shadow-2xl h-full">
                {/* Clean gradient background */}
                <div
                  className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-500 to-violet-400"
                />
                
                {/* Subtle animated orbs */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-10 left-10 w-96 h-96 bg-white rounded-full blur-3xl animate-blob"></div>
                  <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl animate-blob animation-delay-2000"></div>
                </div>

                {/* Minimalist close button */}
                <button
                  onClick={onClose}
                  aria-label="Close demo popup"
                  className="absolute top-6 right-6 z-50 w-9 h-9 bg-white/95 hover:bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow transition-all hover:scale-105"
                >
                  <X className="w-4 h-4 text-gray-700" />
                </button>

                <div className="relative z-10">

                  {/* Two Column Layout - Full Height */}
                  <div className="grid lg:grid-cols-2 gap-0">
                    {/* Left Column - Header + Benefits */}
                    <div className="text-white p-6 md:p-8 lg:p-10 flex flex-col justify-center">
                      {/* Urgency Badge */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                        className="inline-block bg-white/95 text-purple-600 px-4 py-2 rounded-full font-medium text-xs mb-4 shadow-sm self-start"
                      >
                        <Clock className="inline w-3.5 h-3.5 mr-1.5" />
                        Only {spotsRemaining} spots remaining today
                      </motion.div>

                      <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 leading-tight tracking-tight">
                        Be one of the first 100 academies to go live tomorrow – <span className="text-yellow-300">10 December 2025</span>
                      </h2>

                      <p className="text-xs md:text-sm mb-4 opacity-90 font-light">
                        Personal onboarding + lifetime pricing locked
                      </p>

                      <div className="flex items-center gap-3 md:gap-4 flex-wrap text-[10px] md:text-xs mb-5 opacity-90">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full"></div>
                          <span className="font-light">No credit card required</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full"></div>
                          <span className="font-light">100% Free demo</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full"></div>
                          <span className="font-light">30-minute call</span>
                        </div>
                      </div>

                      {/* Benefits Section */}
                      <div className="space-y-3">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 md:p-4 border border-white/20">
                          <h3 className="text-base md:text-lg font-bold mb-2">What You'll Get:</h3>
                          <ul className="space-y-2">
                            {[
                              'Personal 30-minute demo tailored to your academy',
                              'See exactly how UniqBrio works for your sport/art',
                              'Get answers to all your questions',
                              'Lock in lifetime pricing (limited time)',
                              'Priority onboarding support',
                            ].map((benefit, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <div className="w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                                  </svg>
                                </div>
                                <span className="text-[11px] md:text-xs font-light leading-relaxed">
                                  {benefit}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Social Proof */}
                      <div className="mt-4 bg-white/10 backdrop-blur-md rounded-xl p-3 md:p-4 border border-white/20">
                        <p className="text-xs md:text-sm mb-2 font-semibold">
                          Join these academy owners who booked:
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[
                            'https://i.pravatar.cc/150?img=12',
                            'https://i.pravatar.cc/150?img=5',
                            'https://i.pravatar.cc/150?img=33',
                            'https://i.pravatar.cc/150?img=1',
                            'https://i.pravatar.cc/150?img=9',
                            'https://i.pravatar.cc/150?img=20',
                            'https://i.pravatar.cc/150?img=47',
                            'https://i.pravatar.cc/150?img=32',
                            'https://i.pravatar.cc/150?img=16',
                            'https://i.pravatar.cc/150?img=44',
                          ].map((avatarUrl, i) => (
                            <img
                              key={i}
                              src={avatarUrl}
                              alt={`Academy owner ${i + 1}`}
                              className="w-8 h-8 rounded-full bg-white shadow-md object-cover border-2 border-white"
                            />
                          ))}
                          <div className="ml-1 text-xs md:text-sm font-semibold">
                            +{Math.max(0, 100 - spotsRemaining - 10)} more
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Form */}
                    <div className="bg-white p-4 md:p-6 lg:p-8 flex flex-col justify-center">
                      {isSuccess ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-center py-6"
                        >
                          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2.5">
                            <motion.svg
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 0.5 }}
                              className="w-7 h-7 text-green-600"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                            >
                              <motion.path
                                d="M5 13l4 4L19 7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </motion.svg>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1.5">🎉 Demo Booked Successfully!</h3>
                          <p className="text-gray-600 text-xs mb-2">
                            Thank you for booking a demo with UniqBrio!
                          </p>
                          <p className="text-gray-600 text-xs">
                            We'll reach out within 24 hours to schedule your personalized 30-minute demo session.
                          </p>
                        </motion.div>
                      ) : (
                        <div>
                          <div className="text-center mb-4">
                            <Calendar className="w-9 h-9 mx-auto mb-2 text-purple-600" />
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1.5 tracking-tight">
                              Book Your Free 30-Min Demo
                            </h3>
                            
                          </div>

                          <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                                Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Wisdom Academy"
                                required
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl bg-gray-50/50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all"
                              />
                            </div>

                            <div>
                              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                                Phone Number <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+91 98765 43210"
                                required
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl bg-gray-50/50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all"
                              />
                            </div>

                            <div>
                              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                                Email Address <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="priya@academy.com"
                                required
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl bg-gray-50/50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all"
                              />
                            </div>

                            <div>
                              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                                Academy Type <span className="text-red-500">*</span>
                              </label>
                              <div className="relative" ref={dropdownRef}>
                                <button
                                  type="button"
                                  onClick={() => setShowDropdown(!showDropdown)}
                                  className="w-full h-10 px-3 py-2 text-sm text-left border border-gray-300 rounded-xl bg-gray-50/50 hover:bg-white hover:border-gray-400 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all flex items-center justify-between"
                                >
                                  <span className={`truncate ${!formData.academyType ? 'text-gray-500' : ''}`}>
                                    {formData.academyType || 'Select category'}
                                  </span>
                                  <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0 text-gray-500" />
                                </button>
                                
                                {showDropdown && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2"
                                  >
                                    <div className="mb-2" onClick={e => e.stopPropagation()}>
                                      <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                          type="text"
                                          value={searchQuery}
                                          onChange={handleSearchChange}
                                          placeholder="Search or type new category..."
                                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                          onClick={e => e.stopPropagation()}
                                        />
                                      </div>
                                    </div>
                                    <div className="max-h-[120px] overflow-y-auto">
                                      {filteredAcademyTypes.length > 0 ? (
                                        filteredAcademyTypes.map((type, idx) => (
                                          <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleAcademyTypeSelect(type)}
                                            className={`w-full text-left px-4 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors ${
                                              formData.academyType === type ? 'bg-purple-100' : ''
                                            }`}
                                          >
                                            {type}
                                          </button>
                                        ))
                                      ) : searchQuery ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleAcademyTypeSelect(searchQuery)
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors text-purple-600 font-medium"
                                        >
                                          Add "{searchQuery}" as new category
                                        </button>
                                      ) : null}
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                                Number of Students 
                              </label>
                              <input
                                type="number"
                                name="numStudents"
                                value={formData.numStudents}
                                onChange={handleChange}
                                placeholder="50"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl bg-gray-50/50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all"
                              />
                            </div>

                            {error && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm"
                              >
                                <p className="font-medium">⚠️ {error}</p>
                              </motion.div>
                            )}

                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm md:text-base py-2.5 md:py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                              {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                  />
                                  Booking...
                                </span>
                              ) : (
                                <>
                                  Book My Free Demo Now
                                  <ArrowRight className="inline ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                              )}
                            </button>

                            <p className="text-[10px] md:text-xs text-center text-gray-500 mt-2 leading-relaxed font-light">
                              🔒 Your information is 100% secure and will never be shared.
                              <br />
                              We'll reach out within 24 hours to schedule your demo.
                            </p>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
