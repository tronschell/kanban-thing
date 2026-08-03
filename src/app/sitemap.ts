import type { MetadataRoute } from 'next'
import { baseUrl } from '@/lib/metadata'

/** Google ignores changefreq and priority, and a stale lastmod is worse than none. */
const paths = [
  '/',
  '/about',
  '/agents',
  '/cli',
  '/guides',
  '/guides/kanban-columns',
  '/guides/retrospective-board',
  '/guides/personal-kanban',
  '/guides/read-only-board-links',
  '/terms',
  '/privacy',
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({ url: `${baseUrl}${path}` }))
}
