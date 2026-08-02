import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { BoardLibrary } from '@/components/board-library'
import { generateMetadata } from '@/lib/metadata'

export const metadata: Metadata = {
  ...generateMetadata({
    title: 'Your boards',
    description: 'The kanban boards you have opened in this browser, and how long each one has left.',
    path: '/boards',
  }),
  robots: { index: false, follow: false },
}

export default function BoardsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-subtle">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="focus-ring rounded text-sm font-semibold text-fg">
            KanbanThing
          </Link>
          <Button asChild variant="primary" size="sm">
            <Link href="/onboarding">Create board</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1">
        <BoardLibrary />
      </main>
    </div>
  )
}
