import type { MetadataRoute } from 'next'
import { baseUrl } from '@/lib/metadata'

/** Google ignores changefreq and priority, and reads lastmod only while it stays accurate. */
const pages = [
  { path: '/', lastModified: '2026-08-02' },
  { path: '/about', lastModified: '2026-08-02' },
  { path: '/cli', lastModified: '2026-08-02' },
  { path: '/guides', lastModified: '2026-08-02' },
  { path: '/guides/kanban-columns', lastModified: '2026-08-02' },
  { path: '/guides/retrospective-board', lastModified: '2026-08-02' },
  { path: '/guides/personal-kanban', lastModified: '2026-08-02' },
  { path: '/guides/read-only-board-links', lastModified: '2026-08-02' },
  { path: '/terms', lastModified: '2026-08-02' },
  { path: '/privacy', lastModified: '2026-08-02' },
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map(({ path, lastModified }) => ({
    url: `${baseUrl}${path}`,
    lastModified,
  }))
}
