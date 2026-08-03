'use client'

import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import type { Card } from '@/types'
import { CardList } from './board/card-list'
import type { CardActions } from './sortable-card'

interface BacklogProps extends CardActions {
  columnId: string
  cards: Card[]
  emptyLabel: string
  onAddCard: (columnId: string) => void
}

export default function Backlog({ columnId, cards, emptyLabel, onAddCard, ...actions }: BacklogProps) {
  const { setNodeRef } = useDroppable({ id: columnId })

  return (
    <section
      ref={setNodeRef}
      aria-label="Backlog"
      data-column
      data-column-id={columnId}
      className="flex min-w-0 w-column shrink-0 flex-col rounded-panel border border-subtle bg-surface"
    >
      <header data-column-head className="flex items-center gap-2 px-2 py-2">
        <h2
          data-column-name
          className="min-w-0 flex-1 truncate text-xs font-medium uppercase tracking-wide text-muted"
        >
          Backlog
        </h2>
        <span data-column-count className="font-mono text-2xs tabular-nums">
          {cards.length}
        </span>
      </header>

      <CardList columnId={columnId} cards={cards} emptyLabel={emptyLabel} {...actions} />

      <button
        onClick={() => onAddCard(columnId)}
        data-add-card-for={columnId}
        className="touch-target focus-ring m-2 mt-0 flex items-center gap-1.5 rounded-control px-2 py-1.5 text-xs text-subtle hover:bg-surface-hover hover:text-fg"
      >
        <Plus className="size-3.5" />
        Add card
      </button>
    </section>
  )
}
