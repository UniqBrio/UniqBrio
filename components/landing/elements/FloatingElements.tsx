'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Sparkles } from 'lucide-react'
import Confetti from 'react-confetti'
import { getBookingsCount } from '@/lib/spotsRemaining'

interface FloatingElementsProps {
  onFormSuccess?: () => void
  showConfetti?: boolean
  onBookDemo?: () => void
}

export default function FloatingElements({ onFormSuccess, showConfetti, onBookDemo }: FloatingElementsProps) {
  const [showWhatsApp, setShowWhatsApp] = useState(false)
  const [showBadge, setShowBadge] = useState(true)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const [bookingsCount] = useState(() => getBookingsCount())

  useEffect(() => {
    // Show WhatsApp button after 3 seconds
    const timer = setTimeout(() => setShowWhatsApp(true), 3000)

    // Fetch bookings count - commented out since we're using random count
    // const fetchCount = async () => {
    //   try {
    //     const response = await fetch('/api/demo-bookings-count', {
    //       cache: 'no-store',
    //       headers: {
    //         'Cache-Control': 'no-cache',
    //       },
    //     })
    //     const data = await response.json()
    //     if (data.success) {
    //       setBookingsCount(data.count)
    //     }
    //   } catch (error) {
    //     console.error('Error fetching bookings count:', error)
    //   }
    // }
    // fetchCount()

    // Poll for updates every 30 seconds
    // const interval = setInterval(fetchCount, 30000)

    // Update window size for confetti
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timer)
      // clearInterval(interval)
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
            href={`https://wa.me/918056329742?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with our assistant on WhatsApp"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:shadow-3xl transition-all duration-300 group"
          >
            <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-white">
              <img
                src="/whatsapp.png"
                alt="WhatsApp"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Pulse effect (subtle, behind avatar) */}
            <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-10 animate-ping"></span>

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
            onClick={() => onBookDemo?.()}
            className="fixed bottom-6 left-6 z-40 bg-white rounded-2xl shadow-2xl p-4 max-w-xs cursor-pointer hover:shadow-3xl transition-shadow"
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowBadge(false)
              }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-white hover:bg-gray-900 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#6708C0] to-[#4A90E2] rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1A1A1A]">
                  🔥 {bookingsCount} academies
                </p>
                <p className="text-xs text-[#718096]">
                  booked their demo
                </p>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
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
                'https://i.pravatar.cc/150?img=15',
                'https://i.pravatar.cc/150?img=25',
                'https://i.pravatar.cc/150?img=30',
              ].slice(0, bookingsCount).map((avatarUrl, i) => (
                <img
                  key={i}
                  src={avatarUrl}
                  alt={`Academy owner ${i + 1}`}
                  className="w-8 h-8 rounded-full object-cover border-2 border-purple-200 shadow-sm"
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
