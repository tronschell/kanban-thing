'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
} from '@/components/ui'
import { checklistProgress } from '@/lib/checklist'
import { formatDueDate, isDueSoon } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import type { Card } from '@/types'

export interface CardActions {
  moveTargets: { id: string; name: string }[]
  onOpenCard: (card: Card) => void
  onEditCard: (card: Card) => void
  onDeleteCard: (card: Card) => void
  onMoveCard: (card: Card, columnId: string) => void
}

function CardFace({ card, menu }: { card: Card; menu?: React.ReactNode }) {
  const progress = checklistProgress(card.description ?? '')

  return (
    <>
      {card.color && (
        <span
          aria-hidden
          className="absolute inset-y-1 left-0 w-[3px] rounded-full"
          style={{ backgroundColor: card.color }}
        />
      )}
      <span aria-hidden data-card-glyphs />
      <div className="flex items-start gap-2">
        <p
          data-card-title
          className={cn(
            'min-w-0 flex-1 line-clamp-2 text-sm text-fg',
            !card.description && 'font-medium'
          )}
        >
          {card.title}
        </p>
        {menu}
      </div>
      {card.description && <p className="mt-1 line-clamp-2 text-xs text-muted">{card.description}</p>}
      {(card.due_date || progress) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {progress && (
            <Badge className="font-mono tabular-nums">
              <span aria-hidden>
                {progress.done}/{progress.total}
              </span>
              <span className="sr-only">
                {`${progress.done} of ${progress.total} checklist items done`}
              </span>
            </Badge>
          )}
          {card.due_date && (
            <Badge variant={isDueSoon(card.due_date) ? 'danger' : 'neutral'}>
              {formatDueDate(card.due_date)}
            </Badge>
          )}
        </div>
      )}
    </>
  )
}

export function CardPreview({ card }: { card: Card }) {
  return (
    <div
      data-card
      className="relative scale-[1.02] rounded-card border border-subtle bg-surface-raised px-2.5 py-2 opacity-90 shadow-drag"
    >
      <CardFace card={card} />
    </div>
  )
}

export function SortableCard({
  card,
  moveTargets,
  onOpenCard,
  onEditCard,
  onDeleteCard,
  onMoveCard,
}: { card: Card } & CardActions) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card' },
    attributes: { role: 'listitem' },
  })

  const menu = (
    // The drag listeners sit on the whole card, so the menu has to keep its own events to itself.
    <span
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton
            label={`Options for ${card.title}`}
            size="sm"
            icon={<MoreHorizontal />}
            className="-mr-1 opacity-0 transition-opacity duration-fast ease-out group-hover:opacity-100 focus-visible:opacity-100"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onEditCard(card)}>
            <Pencil />
            Edit card
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {moveTargets
            .filter((target) => target.id !== card.column_id)
            .map((target) => (
              <DropdownMenuItem key={target.id} onSelect={() => onMoveCard(card, target.id)}>
                Move to {target.name}
              </DropdownMenuItem>
            ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => onDeleteCard(card)}>
            <Trash2 />
            Delete card
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  )

  return (
    <li
      ref={setNodeRef}
      style={{ transform: isDragging ? undefined : CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={() => onOpenCard(card)}
      data-card
      className={cn(
        'group relative rounded-card border px-2.5 py-2 focus-ring',
        isDragging
          ? 'border-dashed border-strong bg-surface'
          : 'cursor-grab border-subtle bg-surface-raised hover:border-strong'
      )}
    >
      <div className={cn(isDragging && 'invisible')}>
        <CardFace card={card} menu={menu} />
      </div>
    </li>
  )
}
