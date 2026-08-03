import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { generateMetadata } from "@/lib/metadata"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = generateMetadata({
  title: "How to Run a Kanban Board: Practical Guides",
  description:
    "Short, practical guides to running a kanban board: choosing columns, running a retrospective, working solo, and sharing a board without giving away edit access.",
  path: "/guides",
})

const guides = [
  {
    href: "/guides/kanban-columns",
    title: "How to choose the columns on a kanban board",
    summary:
      "Why three columns is the right default, the test for when to split one, how to keep Done meaning a single thing, and how to spot from the board itself that the layout is wrong.",
    reads: "If your board has stopped telling you anything useful.",
  },
  {
    href: "/guides/retrospective-board",
    title: "How to run a retrospective on a shared board",
    summary:
      "A four-column setup, why gathering material before the meeting is worth more than any facilitation technique, how to turn discussion into actions with owners, and how to keep the record afterwards.",
    reads: "If you are running the meeting on Friday.",
  },
  {
    href: "/guides/personal-kanban",
    title: "Personal kanban: running a board for one",
    summary:
      "A board for one person needs different columns from a team board, a much harder limit on what is in flight, and a fifteen-minute weekly review. All three, plus what a solo board is bad at.",
    reads: "If you are the only person who will ever open it.",
  },
  {
    href: "/guides/read-only-board-links",
    title: "Sharing a board: edit links, read-only links and passwords",
    summary:
      "What each kind of link lets the holder do, why a read-only link needs no password, how revoking works, and what to do when somebody should no longer have access.",
    reads: "Before you paste a board link into a group chat.",
  },
]

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-canvas">
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
        <h1 className="text-4xl font-semibold text-fg md:text-5xl">Guides</h1>
        <p className="mt-5 max-w-[62ch] text-md text-muted">
          Four short pieces on getting a kanban board to earn its place. They
          are about how to run a board rather than which buttons this one has —
          that is what{" "}
          <Link
            href="/about"
            className="focus-ring rounded text-accent underline underline-offset-4"
          >
            the about page
          </Link>{" "}
          is for — but where a specific feature makes a method easier, it says
          so.
        </p>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2">
          {guides.map((guide) => (
            <li key={guide.href}>
              <Link
                href={guide.href}
                className="focus-ring flex h-full flex-col rounded-panel border border-subtle bg-surface p-6 transition-colors duration-fast hover:border-strong"
              >
                <h2 className="text-lg font-medium text-fg">{guide.title}</h2>
                <p className="mt-3 text-sm text-muted">{guide.summary}</p>
                <p className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-subtle">
                  <ArrowRight aria-hidden className="size-3.5" />
                  {guide.reads}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <h2 className="mt-14 text-2xl font-semibold text-fg">
          Where to start
        </h2>
        <p className="mt-4 max-w-[62ch] text-md text-muted">
          If you have never run a board before, read{" "}
          <Link
            href="/guides/kanban-columns"
            className="focus-ring rounded text-accent underline underline-offset-4"
          >
            the columns guide
          </Link>{" "}
          and skip the rest until something goes wrong. Columns are the only
          decision that is expensive to get wrong, because every other habit on
          a board is downstream of them. If you already have a board and it has
          quietly stopped being useful, the diagnosis is usually in there too.
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-subtle pt-8">
          <Button asChild variant="primary">
            <Link href="/onboarding">Create a board</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
