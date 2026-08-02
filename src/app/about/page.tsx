import type { Metadata } from "next"
import Link from "next/link"
import { generateMetadata } from "@/lib/metadata"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = generateMetadata({
  title: "About KanbanThing - Simple Kanban Board Tool",
  description:
    "Learn about KanbanThing, a simple and efficient Kanban board application designed to help individuals and teams organize their work effectively.",
  path: "/about",
})

const structuredData = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  mainEntity: {
    "@type": "SoftwareApplication",
    name: "KanbanThing",
    applicationCategory: "ProjectManagementApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "A simple, free, and efficient Kanban board application/tool designed to help individuals and teams organize their work effectively.",
  },
}

export default function AboutPage() {
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
          About KanbanThing
        </h1>

        <div className="prose mt-8">
          <p>
            KanbanThing is a free kanban board you can start using in about ten
            seconds. You name a board, choose a password, and get a link. Anyone
            you send that link to can open the same board and move the same
            cards. There is no account, no email address, and nothing to
            install.
          </p>

          <h2>What it does</h2>
          <ul>
            <li>
              Columns you can add, rename and reorder, starting from To Do, In
              Progress and Done
            </li>
            <li>
              Cards with a description, a color and a due date, moved by drag
              and drop or from the card menu
            </li>
            <li>A backlog for work that is not scheduled yet</li>
            <li>
              A calendar view of the same cards by due date, and a timeline
              view by most recent activity
            </li>
            <li>A password on every board, set when the board is created</li>
            <li>Light and dark appearance, following your system setting</li>
          </ul>

          <h2>What it does not do</h2>
          <p>
            There are no accounts, no teams, no permissions and no paid tier.
            Boards are deleted 60 days after they are created, so anything you
            want to keep should be copied out before then. If you need
            long-lived project history, KanbanThing is the wrong tool and that
            is on purpose.
          </p>

          <h2>How it is built</h2>
          <p>
            KanbanThing is built with Next.js, React, TypeScript and Tailwind
            CSS, with Supabase for storage. It is made and maintained by Tron
            Schell.
          </p>
        </div>

        <Button asChild variant="ghost" className="mt-10">
          <Link href="/">Back to home</Link>
        </Button>
      </main>
    </div>
  )
}
