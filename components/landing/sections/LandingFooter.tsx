'use client'

import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function LandingFooter() {
  const footerSections = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Demo', href: '#demo-form' },
        { label: 'Roadmap', href: '/roadmap' }
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Blog', href: '/blog' },
        { label: 'Careers', href: '/careers' },
        { label: 'Contact', href: '/contact' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { label: 'Help Center', href: '/help' },
        { label: 'Video Tutorials', href: '/tutorials' },
        { label: 'API Documentation', href: '/api-docs' },
        { label: 'Community Forum', href: '/community' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/legal/privacy' },
        { label: 'Terms of Service', href: '/legal/terms' },
        { label: 'Refund Policy', href: '/legal/refund' },
        { label: 'Cookie Policy', href: '/legal/cookies' }
      ]
    }
  ]

  const socialLinks = [
    { icon: <Facebook className="w-5 h-5" />, href: 'https://facebook.com/uniqbrio', label: 'Facebook' },
    { icon: <Twitter className="w-5 h-5" />, href: 'https://twitter.com/uniqbrio', label: 'Twitter' },
    { icon: <Instagram className="w-5 h-5" />, href: 'https://instagram.com/uniqbrio', label: 'Instagram' },
    { icon: <Linkedin className="w-5 h-5" />, href: 'https://linkedin.com/company/uniqbrio', label: 'LinkedIn' },
    { icon: <Youtube className="w-5 h-5" />, href: 'https://youtube.com/@uniqbrio', label: 'YouTube' }
  ]

  return (
    <footer className="bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F] text-white pt-16 pb-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <div className="relative h-12 w-48">
                <Image
                  src="/logo.png"
                  alt="UniqBrio"
                  fill
                  className="object-contain object-left"
                />
              </div>
            </div>
            <p className="text-gray-400 mb-4 leading-relaxed">
              Mentoring Businesses • Nurturing Learners
            </p>
            <div className="flex items-center gap-2 text-sm mb-6">
              <span className="text-2xl">🇮🇳</span>
              <p className="text-gray-400">
                Made with love in India for Indian academies
              </p>
            </div>

            {/* Newsletter Signup */}
            <div className="mb-6">
              <p className="text-sm font-semibold mb-3">Get updates & tips</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#6708C0] focus:ring-2 focus:ring-[#6708C0]/20"
                />
                <button className="px-4 py-2 bg-gradient-to-r from-[#6708C0] to-[#4A90E2] rounded-lg hover:shadow-lg transition-all duration-300">
                  <Mail className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {footerSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="font-bold text-lg mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-[#6708C0] transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mb-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Copyright */}
          <p className="text-gray-400 text-sm text-center md:text-left">
            © 2025 UniqBrio Technologies Pvt Ltd. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social, idx) => (
              <a
                key={idx}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#6708C0] flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 pt-8 border-t border-white/10">
          <div className="grid md:grid-cols-3 gap-6 text-center md:text-left">
            <div>
              <p className="text-xs text-gray-500 mb-1">Registered Office</p>
              <p className="text-sm text-gray-400">
                Bangalore, Karnataka, India
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Business Hours</p>
              <p className="text-sm text-gray-400">
                Mon-Sat: 9:00 AM - 7:00 PM IST
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Support Email</p>
              <p className="text-sm text-gray-400">
                support@uniqbrio.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
