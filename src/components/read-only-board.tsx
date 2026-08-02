'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Eye } from 'lucide-react'
import { Badge, Button, Skeleton } from '@/components/ui'
import { BoardExpirationTimer } from '@/components/board-expiration-timer'
import { useHoursLeft } from '@/hooks/use-board-expiration'
import Navbar from '@/components/navbar'
import { createClient } from '@/lib/supabase/client'
import { formatDueDate, isDueSoon } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import type { Card, Column } from '@/types'

const BACKLOG_NAME = 'Backlog'

interface SharedBoard {
  status: string
  board: { id: string; name: string; expires_at: string }
  columns: Column[]
  cards: Card[]
}

function ReadOnlyCard({ card }: { card: Card }) {
  return (
    <li
      data-card
      className="relative rounded-card border border-subtle bg-surface-raised px-2.5 py-2"
    >
      {card.color && (
        <span
          aria-hidden
          className="absolute inset-y-1 left-0 w-[3px] rounded-full"
          style={{ backgroundColor: card.color }}
        />
      )}
      <span aria-hidden data-card-glyphs />
      <p
        data-card-title
        className={cn('line-clamp-2 text-sm text-fg', !card.description && 'font-medium')}
      >
        {card.title}
      </p>
      {card.description && <p className="mt-1 line-clamp-2 text-xs text-muted">{card.description}</p>}
      {card.due_date && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <Badge variant={isDueSoon(card.due_date) ? 'danger' : 'neutral'}>
            {formatDueDate(card.due_date)}
          </Badge>
        </div>
      )}
    </li>
  )
}

function ReadOnlyColumn({
  name,
  cards,
  emptyLabel,
}: {
  name: string
  cards: Card[]
  emptyLabel: string
}) {
  return (
    <section
      aria-label={name}
      data-column
      className="flex w-column shrink-0 flex-col rounded-panel border border-subtle bg-surface"
    >
      <header data-column-head className="flex items-center gap-2 px-2 py-2">
        <h2
          data-column-name
          className="min-w-0 flex-1 truncate text-xs font-medium uppercase tracking-wide text-muted"
        >
          {name}
        </h2>
        <span data-column-count className="font-mono text-2xs tabular-nums">
          {cards.length}
        </span>
      </header>
      <ul
        data-card-list
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2 pt-0 scrollbar-thin"
      >
        {cards.map((card) => (
          <ReadOnlyCard key={card.id} card={card} />
        ))}
        {cards.length === 0 && (
          <li
            data-card-empty
            className="rounded-card border border-dashed border-subtle py-6 text-center text-xs text-subtle"
          >
            {emptyLabel}
          </li>
        )}
      </ul>
    </section>
  )
}

export default function ReadOnlyBoard({
  boardId,
  viewToken,
}: {
  boardId: string
  viewToken: string
}) {
  const supabase = useMemo(createClient, [])
  const [board, setBoard] = useState<SharedBoard | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadSharedBoard = async () => {
      const { data } = await supabase.rpc('board_read_shared', {
        board_id_param: boardId,
        view_token_param: viewToken,
      })
      if (cancelled) return

      const shared = data as SharedBoard | null
      setBoard(shared?.status === 'ok' ? shared : null)
      setIsLoading(false)
    }

    loadSharedBoard()
    return () => {
      cancelled = true
    }
  }, [boardId, viewToken, supabase])

  if (isLoading) {
    return (
      <div className="flex h-full flex-col overflow-hidden bg-canvas">
        <div className="flex flex-1 gap-3 px-3 pb-3 pt-3">
          {[0, 1, 2].map((column) => (
            <div
              key={column}
              className="w-column shrink-0 rounded-panel border border-subtle bg-surface p-2"
            >
              <Skeleton className="mb-2 h-5 w-24" />
              <div className="flex flex-col gap-2">
                {[0, 1, 2, 3].map((card) => (
                  <Skeleton key={card} className="h-12 w-full rounded-card" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-canvas px-4 text-center">
        <h1 className="text-xl font-semibold text-fg">Board not found</h1>
        <p className="text-sm text-muted">This board may have expired or never existed.</p>
        <Button asChild variant="primary">
          <Link href="/">Go to home page</Link>
        </Button>
      </div>
    )
  }

  const backlog = board.columns
    .filter((column) => column.name === BACKLOG_NAME)
    .sort((a, b) => a.id.localeCompare(b.id))[0]
  const columns = board.columns.filter((column) => column.name !== BACKLOG_NAME)
  const cardsIn = (columnId: string) => board.cards.filter((card) => card.column_id === columnId)
  const hoursLeft = useHoursLeft(board.board.expires_at)

  return (
    <div className="flex h-full flex-col overflow-hidden bg-canvas">
      <Navbar
        readOnly
        boardId={boardId}
        boardName={board.board.name}
        expiresAt={board.board.expires_at}
      />

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-subtle bg-surface px-3 py-2">
        <Eye aria-hidden className="size-3.5 shrink-0 text-muted" />
        <p className="text-xs text-muted">View only. Changes are not possible from this link.</p>
        <span aria-hidden className="text-subtle">
          &middot;
        </span>
        <p className="min-w-0 truncate text-xs font-medium text-fg">{board.board.name}</p>
        {hoursLeft !== null && <BoardExpirationTimer hoursLeft={hoursLeft} />}
      </div>

      <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto px-3 py-3 scrollbar-thin">
        {backlog && (
          <ReadOnlyColumn name="Backlog" cards={cardsIn(backlog.id)} emptyLabel="Nothing queued" />
        )}
        {columns.map((column) => (
          <ReadOnlyColumn
            key={column.id}
            name={column.name}
            cards={cardsIn(column.id)}
            emptyLabel="No cards"
          />
        ))}
      </div>
    </div>
  )
}
