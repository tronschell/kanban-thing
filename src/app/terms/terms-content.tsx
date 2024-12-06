'use client'

import Link from 'next/link'
import Script from 'next/script'
import { GradientBackground } from '@/components/ui/gradient-background'

export default function TermsContent() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    mainEntity: {
      '@type': 'TermsAndConditions',
      name: 'KanbanThing Terms of Service',
      publisher: {
        '@type': 'Organization',
        name: 'KanbanThing'
      }
    }
  }

  return (
    <>
      <Script
        id="terms-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen flex flex-col bg-gray-950">
        <GradientBackground />
        
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto bg-gray-900/40 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-2xl">
            <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
            
            <div className="prose prose-invert max-w-none">
              <h2>1. Terms</h2>
              <p>
                By accessing KanbanThing, you agree to be bound by these terms of service and agree that 
                you are responsible for compliance with any applicable local laws.
              </p>

              <h2>2. Use License</h2>
              <p>
                Permission is granted to temporarily use KanbanThing for personal, non-commercial 
                transitory viewing only.
              </p>

              <h2>3. Disclaimer</h2>
              <p>
                The materials on KanbanThing are provided on an 'as is' basis. KanbanThing makes no 
                warranties, expressed or implied, and hereby disclaims and negates all other warranties.
              </p>

              <h2>4. Limitations</h2>
              <p>
                In no event shall KanbanThing or its suppliers be liable for any damages arising out of 
                the use or inability to use KanbanThing.
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