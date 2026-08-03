import type { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PageNav } from "@/components/page-nav"
import { baseUrl } from "@/lib/metadata"

interface GuidePageProps {
  title: string
  breadcrumb: string
  path: string
  lead: string
  published: string
  children: ReactNode
}

const structuredData = ({
  title,
  breadcrumb,
  path,
  lead,
  published,
}: Omit<GuidePageProps, "children">) => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: title,
      description: lead,
      datePublished: published,
      author: { "@id": `${baseUrl}/#organization` },
      publisher: { "@id": `${baseUrl}/#organization` },
      mainEntityOfPage: `${baseUrl}${path}`,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
        { "@type": "ListItem", position: 2, name: "Guides", item: `${baseUrl}/guides` },
        { "@type": "ListItem", position: 3, name: breadcrumb, item: `${baseUrl}${path}` },
      ],
    },
  ],
})

export function GuidePage({
  title,
  breadcrumb,
  path,
  lead,
  published,
  children,
}: GuidePageProps) {
  return (
    <div className="min-h-screen bg-canvas">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            structuredData({ title, breadcrumb, path, lead, published }),
          ),
        }}
      />
      <header className="border-b border-subtle">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="focus-ring rounded text-sm font-semibold text-fg"
          >
            KanbanThing
          </Link>
          <Button asChild size="sm">
            <Link href="/onboarding">Create board</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-16">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-xs text-subtle">
            <li>
              <Link
                href="/"
                className="focus-ring rounded transition-colors duration-fast hover:text-fg"
              >
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link
                href="/guides"
                className="focus-ring rounded transition-colors duration-fast hover:text-fg"
              >
                Guides
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-muted">
              {breadcrumb}
            </li>
          </ol>
        </nav>

        <h1 className="mt-5 text-4xl font-semibold text-fg md:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-[62ch] text-md text-muted">{lead}</p>

        <div className="mt-12 gap-x-14 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start">
          <PageNav />

          <div>
            <div className="prose" data-page-content>
              {children}
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-subtle pt-8">
              <Button asChild variant="primary">
                <Link href="/onboarding">Create a board</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/guides">All guides</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
