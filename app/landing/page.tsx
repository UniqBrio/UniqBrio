import type { Metadata } from 'next'
import LandingPageContent from '@/components/landing/LandingPageContent'
import './landing.css'

export const metadata: Metadata = {
  title: 'UniqBrio – All-in-One Software for Dance, Cricket, Music & Martial Arts Academies in India',
  description: 'Grow your academy without admin chaos. Automated payments, scheduling, attendance & parent communication in one beautiful dashboard. Book your free demo today.',
  keywords: 'academy management software, dance studio software, cricket academy management, music school software, martial arts academy software, India',
  openGraph: {
    title: 'UniqBrio – All-in-One Software for Indian Academies',
    description: 'Spend more time coaching. Zero time chasing payments.',
    type: 'website',
    locale: 'en_IN',
  },
}

export default function LandingPage() {
  return <LandingPageContent />
}
