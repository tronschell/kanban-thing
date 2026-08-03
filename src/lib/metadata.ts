import type { Metadata } from 'next'

export const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.kanbanthing.com'

const ogImage = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: 'KanbanThing - Free Online Kanban Board',
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
      site: '@kanbanthing',
      creator: '@kanbanthing',
      title,
      description,
      images: [ogImage],
    },
  }
} 