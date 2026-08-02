import type { MetadataRoute } from 'next'
import { baseUrl } from '@/lib/metadata'

const pages = [
  { path: '/', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/guides', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/guides/kanban-columns', changeFrequency: 'yearly', priority: 0.6 },
  { path: '/guides/retrospective-board', changeFrequency: 'yearly', priority: 0.6 },
  { path: '/guides/personal-kanban', changeFrequency: 'yearly', priority: 0.6 },
  { path: '/guides/read-only-board-links', changeFrequency: 'yearly', priority: 0.6 },
  { path: '/terms', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/privacy', changeFrequency: 'monthly', priority: 0.5 },
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map(({ path, changeFrequency, priority }) => ({
    url: `${baseUrl}${path}`,
    changeFrequency,
    priority,
  }))
}
