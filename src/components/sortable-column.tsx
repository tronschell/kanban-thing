'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import type { Card, Column } from '@/types'
import { CardList } from './board/card-list'
import type { CardActions } from './sortable-card'

interface SortableColumnProps extends CardActions {
  column: Column
  cards: Card[]
  onAddCard: (columnId: string) => void
  onRenameColumn: (column: Column) => void
  onDeleteColumn: (column: Column) => void
}

export function SortableColumn({
  column,
  cards,
  onAddCard,
  onRenameColumn,
  onDeleteColumn,
  ...actions
}: SortableColumnProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: column.id, data: { type: 'column' } })

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      aria-label={column.name}
      data-column
      className={cn(
        'relative flex min-w-0 w-column shrink-0 flex-col rounded-panel border border-subtle bg-surface',
        isDragging && 'z-10'
      )}
    >
      <header data-column-head className="flex items-center gap-2 px-2 py-2">
        <IconButton
          ref={setActivatorNodeRef}
          label={`Reorder ${column.name}`}
          size="sm"
          icon={<GripVertical />}
          className="-ml-1 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        />
        <h2
          data-column-name
          className="min-w-0 flex-1 truncate text-xs font-medium uppercase tracking-wide text-muted"
        >
          {column.name}
        </h2>
        <span data-column-count className="font-mono text-2xs tabular-nums">
          {cards.length}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton label={`Options for ${column.name}`} size="sm" icon={<MoreHorizontal />} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onAddCard(column.id)}>
              <Plus />
              Add card
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onRenameColumn(column)}>
              <Pencil />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => onDeleteColumn(column)}>
              <Trash2 />
              Delete column
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <CardList columnId={column.id} cards={cards} emptyLabel="No cards" {...actions} />

      <button
        onClick={() => onAddCard(column.id)}
        className="touch-target focus-ring m-2 mt-0 flex items-center gap-1.5 rounded-control px-2 py-1.5 text-xs text-subtle hover:bg-surface-hover hover:text-fg"
      >
        <Plus className="size-3.5" />
        Add card
      </button>
    </section>
  )
}
