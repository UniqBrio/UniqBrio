"use client"

import { useEffect } from "react"
import confetti from "canvas-confetti"

interface ConfettiCelebrationProps {
  message?: string
  onComplete?: () => void
}

export default function ConfettiCelebration({ 
  message = "Welcome to the family! Let's grow your academy together 🎉",
  onComplete 
}: ConfettiCelebrationProps) {
  
  useEffect(() => {
    // Fire confetti from multiple angles
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        clearInterval(interval)
        if (onComplete) {
          setTimeout(onComplete, 500)
        }
        return
      }

      const particleCount = 50 * (timeLeft / duration)
      
      // Fire from left
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      
      // Fire from right
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)

    return () => {
      clearInterval(interval)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center transform animate-in fade-in zoom-in duration-500 border border-gray-200 dark:border-gray-700">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to UniqBrio!
        </h2>
        <p className="text-lg text-purple-700 dark:text-purple-400 font-medium">
          {message}
        </p>
      </div>
    </div>
  )
}
