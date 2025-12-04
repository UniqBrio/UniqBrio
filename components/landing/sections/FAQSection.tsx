'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface FAQSectionProps {
  onBookDemo?: () => void
}

export default function FAQSection({ onBookDemo }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: 'Do I need technical skills to use UniqBrio?',
      answer: 'Not at all! UniqBrio is designed for busy academy owners, not tech experts. If you can use WhatsApp, you can use UniqBrio. We also provide personal onboarding calls and video tutorials to get you started in minutes.'
    },
    {
      question: 'How long does it take to set up?',
      answer: 'Most academies are up and running in under 10 minutes. You can import your existing student data from Excel, or add them manually. Our setup wizard guides you through every step – courses, batches, instructors, and fee structures.'
    },
    
    {
      question: 'Can I try it before committing?',
      answer: 'Absolutely! We offer a completely free plan for academies with under 10 students (forever free). For larger academies, start with a 14-day free trial of our Grow or Scale plans – no credit card required. Cancel anytime if it\'s not right for you.'
    },
    {
      question: 'How does payment collection work?',
      answer: 'UniqBrio integrates with Razorpay and Stripe, allowing parents to pay via UPI, credit/debit cards, or net banking. You can also track cash/cheque payments manually. Automated reminders reduce payment delays by 80%, and you get paid directly to your bank account.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes! We use bank-grade encryption (256-bit SSL) and store data on secure servers in India. We\'re fully GDPR compliant and never share your data with third parties. You own your data and can export it anytime.'
    },
    {
      question: 'What happens if I need help?',
      answer: 'We\'re here for you! Free plan users get email support (24-48 hour response). Grow plan users get priority email support. Scale plan users get a dedicated account manager and phone support. Plus, we have a comprehensive help center with video tutorials.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, absolutely. There are no lock-in contracts. If UniqBrio isn\'t the right fit, cancel with one click from your dashboard. You\'ll still have access until the end of your billing period, and we can export all your data for you.'
    }
  ]

  return (
    <section className="py-20 px-4 md:px-8 bg-gradient-to-b from-white to-[#FAFAFA]">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
            Questions? <span className="text-[#6708C0]">We've Got Answers</span>
          </h2>
          <p className="text-xl text-[#718096]">Everything you need to know about UniqBrio</p>
        </motion.div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full p-6 text-left flex items-start justify-between gap-4 hover:bg-purple-50 transition-colors duration-200"
              >
                <span className="font-bold text-lg text-[#1A1A1A] flex-1">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === idx ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="w-6 h-6 text-[#6708C0]" />
                </motion.div>
              </button>

              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 text-[#4A5568] leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Still Have Questions CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center bg-gradient-to-r from-purple-100 to-orange-100 p-8 rounded-2xl"
        >
          <h3 className="text-2xl font-bold text-[#1A1A1A] mb-2">
            Still have questions?
          </h3>
          <p className="text-[#718096] mb-4">
            Book a free demo call and we'll answer everything!
          </p>
          <button
            onClick={() => onBookDemo ? onBookDemo() : document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-gradient-to-r from-[#6708C0] to-[#4A90E2] text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Book Your Free Demo →
          </button>
        </motion.div>
      </div>
    </section>
  )
}
