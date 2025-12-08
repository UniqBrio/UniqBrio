'use client'

import { useState } from 'react'
import { Facebook, Instagram, Youtube, Mail, MapPin, Clock, Phone, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import LegalModal from '@/components/landing/LegalModal'

interface LandingFooterProps {
  onBookDemo?: () => void
}

export default function LandingFooter({ onBookDemo }: LandingFooterProps) {
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'privacy' | 'terms' | 'cookies' | null }>({
    isOpen: false,
    type: null
  })
  const footerSections = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Book Demo', href: '#demo-form' },
        
      ]
    },
      
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: 'privacy', isModal: true },
        { label: 'Terms of Service', href: 'terms', isModal: true },
        { label: 'Cookie Policy', href: 'cookies', isModal: true }
      ]
    }
  ]

  const socialLinks = [
    { icon: <Facebook className="w-5 h-5" />, href: 'https://www.facebook.com/uniqbrio', label: 'Facebook' },
    { icon: <Instagram className="w-5 h-5" />, href: 'https://www.instagram.com/uniqbrio/#', label: 'Instagram' },
    { icon: <Youtube className="w-5 h-5" />, href: 'https://www.youtube.com/@uniqbrio', label: 'YouTube' }
  ]

  return (
    <footer className="bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F] text-white pt-12 pb-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-8">
          {/* Brand Column */}
          <div className="lg:col-span-6">
            <div className="mb-3">
              <div className="relative h-10 w-40">
                <Image
                  src="/UniqBrio-Logo (White).png"
                  alt="UniqBrio"
                  fill
                  className="object-contain object-left"
                />
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-3 leading-relaxed">
              Mentoring Businesses • Nurturing Learners
            </p>
            <div className="flex items-center gap-2 text-xs mb-4">
             
              <p className="text-gray-400">
                Made with love in India for Indian academies
              </p>
            </div>

            {/* Newsletter Signup */}
            <div className="mb-2">
              <p className="text-sm font-semibold mb-2">Get updates & tips</p>
              <div className="flex gap-2 max-w-sm">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 px-3 py-2 text-sm rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#6708C0] focus:ring-2 focus:ring-[#6708C0]/20"
                />
                <button className="px-3 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#6708C0] rounded-lg hover:shadow-lg transition-all duration-300">
                  <Mail className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {footerSections.map((section, idx) => (
            <div key={idx} className="lg:col-span-2">
              <h3 className="font-bold text-base mb-3">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    {link.href === '#demo-form' ? (
                      <button
                        onClick={() => onBookDemo?.()}
                        className="text-gray-400 hover:text-[#6708C0] transition-colors duration-200 text-sm"
                      >
                        {link.label}
                      </button>
                    ) : (link as any).isModal ? (
                      <button
                        onClick={() => setLegalModal({ isOpen: true, type: link.href as 'privacy' | 'terms' | 'cookies' })}
                        className="text-gray-400 hover:text-[#6708C0] transition-colors duration-200 text-sm"
                      >
                        {link.label}
                      </button>
                    ) : link.href.startsWith('#') ? (
                      <button
                        onClick={() => document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' })}
                        className="text-gray-400 hover:text-[#6708C0] transition-colors duration-200 text-sm"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-gray-400 hover:text-[#6708C0] transition-colors duration-200 text-sm"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Info Column */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-base mb-3">Contact Us</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-white flex-shrink-0" />
                <p className="text-sm text-gray-400">Tamil Nadu, India</p>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white flex-shrink-0" />
                <p className="text-sm text-gray-400">Mon-Fri: 9 AM - 6 PM IST</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-white flex-shrink-0" />
                <a href="tel:+918056329742" className="text-sm text-gray-400 hover:text-[#6708C0] transition-colors">
                  +91 8056329742
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-white flex-shrink-0" />
                <a href="mailto:support@uniqbrio.com" className="text-sm text-gray-400 hover:text-[#6708C0] transition-colors">
                  support@uniqbrio.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-gray-400 text-xs text-center md:text-left">
            © 2025 UniqBrio Technologies Pvt Ltd. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            {socialLinks.map((social, idx) => (
              <a
                key={idx}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#6708C0] flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

      </div>

      {/* Legal Modal */}
      {legalModal.type && (
        <LegalModal
          isOpen={legalModal.isOpen}
          onClose={() => setLegalModal({ isOpen: false, type: null })}
          type={legalModal.type}
        />
      )}
    </footer>
  )
}
