'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StickyHeaderCTAProps {
  onBookDemo?: () => void
}

export default function StickyHeaderCTA({ onBookDemo }: StickyHeaderCTAProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky CTA after scrolling past hero (roughly 80vh)
      if (window.scrollY > window.innerHeight * 0.8) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToDemo = () => {
    if (onBookDemo) return onBookDemo()
    document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex items-center gap-2">
              <h1 
                className="text-xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #6708C0 0%, #4A90E2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                UniqBrio
              </h1>
              <span className="text-sm text-gray-600 hidden sm:inline">
                | One Dashboard for Your Academy
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="hidden sm:inline-block text-[#4A90E2] font-semibold text-sm hover:underline"
              >
                Pricing
              </button>
              
              <motion.button
                onClick={scrollToDemo}
                className="px-6 py-2 bg-gradient-to-r from-[#DE7D14] to-[#FF9A3D] text-white font-bold text-sm rounded-lg shadow-lg flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Book Free Demo</span>
                <span className="sm:hidden">Demo</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
