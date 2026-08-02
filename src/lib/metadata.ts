import type { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.kanbanthing.com'

const ogImage = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: 'KanbanThing - Simple Free Kanban Board Tool',
}

interface GenerateMetadataProps {
  title: string
  description: string
  path: string
  type?: 'website' | 'article'
}

export function generateMetadata({
  title,
  description,
  path,
  type = 'website'
}: GenerateMetadataProps): Metadata {
  const url = `${baseUrl}${path}`

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'KanbanThing',
      type,
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
} 