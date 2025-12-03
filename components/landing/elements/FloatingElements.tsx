'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Sparkles } from 'lucide-react'
import Confetti from 'react-confetti'

interface FloatingElementsProps {
  onFormSuccess?: () => void
  showConfetti?: boolean
}

export default function FloatingElements({ onFormSuccess, showConfetti }: FloatingElementsProps) {
  const [showWhatsApp, setShowWhatsApp] = useState(false)
  const [showBadge, setShowBadge] = useState(true)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    // Show WhatsApp button after 3 seconds
    const timer = setTimeout(() => setShowWhatsApp(true), 3000)

    // Update window size for confetti
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const whatsappMessage = encodeURIComponent(
    "Hi! I'd like to book a demo of UniqBrio for my academy. Can you help me get started?"
  )

  return (
    <>
      {/* Confetti on form success */}
      <AnimatePresence>
        {showConfetti && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={500}
            gravity={0.3}
          />
        )}
      </AnimatePresence>

      {/* Floating WhatsApp Button */}
      <AnimatePresence>
        {showWhatsApp && (
          <motion.a
            href={`https://wa.me/919876543210?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-[#25D366] rounded-full shadow-2xl flex items-center justify-center text-white hover:shadow-3xl transition-all duration-300 group"
          >
            <MessageCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />
            
            {/* Pulse effect */}
            <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20"></span>
            
            {/* Tooltip */}
            <div className="absolute right-full mr-4 bg-white text-[#1A1A1A] px-4 py-2 rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <p className="text-sm font-semibold">Chat with us on WhatsApp!</p>
              <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rotate-45"></div>
            </div>
          </motion.a>
        )}
      </AnimatePresence>

      {/* Floating Badge - "X academies booked today" */}
      <AnimatePresence>
        {showBadge && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 100 }}
            className="fixed bottom-24 left-6 z-40 bg-white rounded-2xl shadow-2xl p-4 max-w-xs"
          >
            <button
              onClick={() => setShowBadge(false)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-white hover:bg-gray-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#6708C0] to-[#4A90E2] rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1A1A1A]">
                  🔥 58 academies
                </p>
                <p className="text-xs text-[#718096]">
                  booked their demo today
                </p>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-200 to-orange-200 flex items-center justify-center text-sm"
                >
                  {['👨', '👩', '🧑', '👨‍🏫', '👩‍🏫'][i]}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to top button - appears after scrolling down */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 left-6 z-40 w-12 h-12 bg-[#6708C0] rounded-full shadow-xl flex items-center justify-center text-white hover:bg-[#5607A0] transition-all duration-300"
      >
        <span className="text-2xl">↑</span>
      </motion.button>

      {/* Quick Animation: Closing 47 tabs → Opening UniqBrio */}
      {/* This could be triggered on first visit */}
      <AnimatePresence>
        {/* Add animation logic here if needed */}
      </AnimatePresence>
    </>
  )
}
