import { Metadata } from 'next'
import { generateMetadata } from '@/lib/metadata'
import TermsContent from './terms-content'

export const metadata: Metadata = generateMetadata({
  title: 'Terms of Service - KanbanThing',
  description: 'Read the terms of service for KanbanThing. Learn about the usage terms, limitations, and disclaimers for our Kanban board application.',
  path: '/terms'
})

export default function TermsPage() {
  return <TermsContent />
} 