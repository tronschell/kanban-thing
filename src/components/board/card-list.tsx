'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import type { Card } from '@/types'
import { SortableCard, type CardActions } from '../sortable-card'
import { listDroppableId } from './dnd'

export function CardList({
  columnId,
  cards,
  emptyLabel,
  ...actions
}: { columnId: string; cards: Card[]; emptyLabel: string } & CardActions) {
  const { setNodeRef, isOver } = useDroppable({ id: listDroppableId(columnId) })

  return (
    <SortableContext items={cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
      <ul
        ref={setNodeRef}
        data-card-list
        className={cn(
          'flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto p-2 pt-0 scrollbar-thin',
          isOver && 'bg-surface-active'
        )}
      >
        {cards.map((card) => (
          <SortableCard key={card.id} card={card} {...actions} />
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
    </SortableContext>
  )
}
