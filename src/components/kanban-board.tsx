'use client'

import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import type { Card, Column } from '@/types'
import { cardsIn } from './board/dnd'
import { SortableColumn } from './sortable-column'
import type { CardActions } from './sortable-card'

interface KanbanBoardProps extends CardActions {
  columns: Column[]
  cards: Card[]
  onAddCard: (columnId: string) => void
  onAddColumn: () => void
  onRenameColumn: (column: Column) => void
  onDeleteColumn: (column: Column) => void
}

export default function KanbanBoard({
  columns,
  cards,
  onAddColumn,
  ...columnProps
}: KanbanBoardProps) {
  return (
    <>
      <SortableContext
        items={columns.map((column) => column.id)}
        strategy={horizontalListSortingStrategy}
      >
        {columns.map((column) => (
          <SortableColumn
            key={column.id}
            column={column}
            cards={cardsIn(cards, column.id)}
            {...columnProps}
          />
        ))}
      </SortableContext>

      <button
        onClick={onAddColumn}
        className="focus-ring flex h-9 w-column shrink-0 items-center gap-1.5 rounded-panel border border-dashed border-subtle px-3 text-xs text-subtle hover:border-strong hover:text-fg"
      >
        <Plus className="size-3.5" />
        Add column
      </button>
    </>
  )
}
