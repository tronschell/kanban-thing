import type { Metadata } from "next"
import Link from "next/link"
import { generateMetadata } from "@/lib/metadata"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = generateMetadata({
  title: "Terms of Service - KanbanThing",
  description:
    "Read the terms of service for KanbanThing. Learn about the usage terms, limitations, and disclaimers for our Kanban board application.",
  path: "/terms",
})

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  mainEntity: {
    "@type": "TermsAndConditions",
    name: "KanbanThing Terms of Service",
    publisher: {
      "@type": "Organization",
      name: "KanbanThing",
    },
  },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <header className="border-b border-subtle">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
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

      <main className="mx-auto w-full max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-semibold text-fg md:text-5xl">
          Terms of Service
        </h1>

        <div className="prose mt-8">
          <h2>1. Terms</h2>
          <p>
            By accessing KanbanThing, you agree to be bound by these terms of
            service and agree that you are responsible for compliance with any
            applicable local laws.
          </p>

          <h2>2. Use license</h2>
          <p>
            Permission is granted to temporarily use KanbanThing for personal,
            non-commercial transitory viewing only.
          </p>

          <h2>3. Your boards and their content</h2>
          <p>
            You are responsible for what you put on a board and for who you give
            a board link to. Anyone with the link and the board password can
            read and change everything on that board. Do not store passwords,
            payment details, or other sensitive information on a board.
          </p>

          <h2>4. Board lifespan</h2>
          <p>
            Boards are deleted two months after they are created. Export or copy
            anything you want to keep before then. We do not guarantee that a
            board, or any card on it, will still exist at any later point.
          </p>

          <h2>5. Disclaimer</h2>
          <p>
            The materials on KanbanThing are provided on an &apos;as is&apos;
            basis. KanbanThing makes no warranties, expressed or implied, and
            hereby disclaims and negates all other warranties.
          </p>

          <h2>6. Limitations</h2>
          <p>
            In no event shall KanbanThing or its suppliers be liable for any
            damages arising out of the use or inability to use KanbanThing,
            including loss of data.
          </p>

          <h2>7. Changes</h2>
          <p>
            These terms may be updated at any time. Continued use of
            KanbanThing after a change means you accept the updated terms.
          </p>
        </div>

        <Button asChild variant="ghost" className="mt-10">
          <Link href="/">Back to home</Link>
        </Button>
      </main>
    </div>
  )
}
