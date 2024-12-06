import { Metadata } from 'next'
import { generateMetadata } from '@/lib/metadata'
import PrivacyContent from './privacy-content'

export const metadata: Metadata = generateMetadata({
  title: 'Privacy Policy - KanbanThing',
  description: 'Our privacy policy explains how we handle your data at KanbanThing, including board data, analytics, and cookie usage.',
  path: '/privacy'
})

export default function PrivacyPage() {
  return <PrivacyContent />
} 