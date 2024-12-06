'use client'

import Link from 'next/link'
import Script from 'next/script'
import { GradientBackground } from '@/components/ui/gradient-background'

export default function PrivacyContent() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    mainEntity: {
      '@type': 'PrivacyPolicy',
      name: 'KanbanThing Privacy Policy',
      publisher: {
        '@type': 'Organization',
        name: 'KanbanThing'
      }
    }
  }

  return (
    <>
      <Script
        id="privacy-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen flex flex-col bg-gray-950">
        <GradientBackground />
        {/* Your existing privacy content JSX */}
      </div>
    </>
  )
}