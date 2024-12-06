import { Metadata } from 'next'
import { generateMetadata } from '@/lib/metadata'
import AboutContent from './about-content'

export const metadata: Metadata = generateMetadata({
  title: 'About KanbanThing - Simple Kanban Board Tool',
  description: 'Learn about KanbanThing, a simple and efficient Kanban board application designed to help individuals and teams organize their work effectively.',
  path: '/about'
})

export default function AboutPage() {
  return <AboutContent />
} 