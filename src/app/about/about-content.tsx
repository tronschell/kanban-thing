'use client'

import Link from 'next/link'
import Script from 'next/script'
import { GradientBackground } from '@/components/ui/gradient-background'

export default function AboutContent() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    mainEntity: {
      '@type': 'SoftwareApplication',
      name: 'KanbanThing',
      applicationCategory: 'ProjectManagementApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      description: 'A simple, free, and efficient Kanban board application designed to help individuals and teams organize their work effectively.'
    }
  }

  return (
    <>
      <Script
        id="about-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen flex flex-col bg-gray-950">
        <GradientBackground />
        
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto bg-gray-900/40 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-2xl">
            <h1 className="text-4xl font-bold text-white mb-8">About KanbanThing</h1>
            
            <div className="prose prose-invert max-w-none">
              <p>
                KanbanThing is a simple, free, and efficient Kanban board application designed to help individuals 
                and teams organize their work effectively. Built with modern web technologies, it offers 
                a seamless experience for managing tasks and projects.
              </p>

              <h2>Key Features</h2>
              <ul>
                <li>No sign-up required - start organizing instantly</li>
                <li>Shareable boards - collaborate with anyone via a simple link</li>
                <li>Drag-and-drop interface</li>
                <li>Dark mode support</li>
                <li>Mobile-friendly design</li>
              </ul>

              <h2>Technology Stack</h2>
              <p>
                KanbanThing is built using Next.js, React, TypeScript, and Tailwind CSS. 
                It leverages Supabase for the backend and real-time updates.
              </p>

              <div className="mt-8">
                <Link 
                  href="/" 
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}