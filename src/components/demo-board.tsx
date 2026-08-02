'use client'

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, useReducedMotion } from 'framer-motion'
import { Badge } from '@/components/ui'
import { LABEL_COLORS } from '@/lib/colors'
import { cn } from '@/lib/utils'

interface DemoCard {
  id: string
  columnId: string
  title: string
  description?: string
  color: string
  due?: { label: string; variant: 'neutral' | 'danger' }
}

const COLUMNS = [
  { id: 'todo', name: 'To Do' },
  { id: 'doing', name: 'In Progress' },
  { id: 'done', name: 'Done' },
]

const TRAVELLER_ID = 'demo-traveller'

const INITIAL_CARDS: DemoCard[] = [
  {
    id: TRAVELLER_ID,
    columnId: 'todo',
    title: 'Cut onboarding to three fields',
    color: '#30a46c',
    due: { label: 'Tomorrow', variant: 'neutral' },
  },
  { id: 'todo-1', columnId: 'todo', title: 'Rewrite the pricing FAQ', color: '#8e4ec6' },
  {
    id: 'todo-2',
    columnId: 'todo',
    title: 'Audit the empty states',
    description: 'Backlog, calendar and timeline',
    color: '#f76b15',
  },
  {
    id: 'doing-1',
    columnId: 'doing',
    title: 'Ship the mobile nav fix',
    color: '#e5484d',
    due: { label: 'Today', variant: 'danger' },
  },
  { id: 'doing-2', columnId: 'doing', title: 'Write the release notes', color: '#3e63dd' },
  { id: 'done-1', columnId: 'done', title: 'Set the board password', color: '#30a46c' },
  {
    id: 'done-2',
    columnId: 'done',
    title: 'Send the link to the team',
    description: 'Design, support and ops',
    color: '#f5b800',
  },
]

const DWELL_MS = 4200
const RESUME_AFTER_DROP_MS = 12000
const MAX_TILT_DEG = 7

const cardClass = 'relative rounded-card border px-2.5 py-2 focus-ring'
const layoutTransition = { duration: 0.62, ease: [0.32, 0.72, 0, 1] } as const

const LIST_PREFIX = 'list:'
const listDroppableId = (columnId: string) => `${LIST_PREFIX}${columnId}`

const cardsIn = (cards: DemoCard[], columnId: string) =>
  cards.filter((card) => card.columnId === columnId)

const columnOf = (cards: DemoCard[], id: string) =>
  id.startsWith(LIST_PREFIX)
    ? id.slice(LIST_PREFIX.length)
    : (cards.find((card) => card.id === id)?.columnId ?? null)

function moveCard(cards: DemoCard[], cardId: string, toColumnId: string, toIndex: number) {
  const moved = cards.find((card) => card.id === cardId)
  if (!moved) return cards

  const remaining = cards.filter((card) => card.id !== cardId)
  const target = cardsIn(remaining, toColumnId)
  target.splice(toIndex, 0, { ...moved, columnId: toColumnId })

  return [...remaining.filter((card) => card.columnId !== toColumnId), ...target]
}

function CardFace({ card }: { card: DemoCard }) {
  return (
    <>
      <span
        aria-hidden
        className="absolute inset-y-1 left-0 w-[3px] rounded-full"
        style={{ backgroundColor: card.color }}
      />
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
      </div>
      {card.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted">{card.description}</p>
      )}
      {card.due && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <Badge variant={card.due.variant}>{card.due.label}</Badge>
        </div>
      )}
    </>
  )
}

function DemoSortableCard({ card, animate }: { card: DemoCard; animate: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    attributes: { roleDescription: 'Example card' },
  })

  return (
    <motion.li
      layout={animate}
      layoutId={animate ? card.id : undefined}
      transition={{ layout: layoutTransition }}
    >
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Translate.toString(transform), transition }}
        {...attributes}
        {...listeners}
        data-card
        className={cn(
          cardClass,
          isDragging
            ? 'border-dashed border-strong bg-surface'
            : 'cursor-grab border-subtle bg-surface-raised hover:border-strong'
        )}
      >
        <div className={cn(isDragging && 'invisible')}>
          <CardFace card={card} />
        </div>
      </div>
    </motion.li>
  )
}

function DemoColumn({
  column,
  cards,
  animate,
}: {
  column: (typeof COLUMNS)[number]
  cards: DemoCard[]
  animate: boolean
}) {
  const { setNodeRef } = useDroppable({ id: listDroppableId(column.id) })

  return (
    <div
      data-column
      className="relative flex w-[9.5rem] shrink-0 flex-col rounded-panel border border-subtle bg-surface sm:w-column"
    >
      <div data-column-head className="flex items-center gap-2 px-2 py-2">
        <h2
          data-column-name
          className="min-w-0 flex-1 truncate text-xs font-medium uppercase tracking-wide text-muted"
        >
          {column.name}
        </h2>
        <span data-column-count className="font-mono text-2xs tabular-nums">
          {cards.length}
        </span>
      </div>

      <SortableContext
        items={cards.map((card) => card.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul
          ref={setNodeRef}
          data-card-list
          className="flex min-h-[15rem] flex-1 flex-col gap-2 p-2 pt-0 sm:min-h-[17rem]"
        >
          {cards.map((card) => (
            <DemoSortableCard key={card.id} card={card} animate={animate} />
          ))}
        </ul>
      </SortableContext>
    </div>
  )
}

export function DemoBoard() {
  const reduceMotion = useReducedMotion()
  const [cards, setCards] = useState(INITIAL_CARDS)
  const [activeId, setActiveId] = useState<string | null>(null)
  const tiltRef = useRef<HTMLDivElement>(null)
  const pausedUntil = useRef(0)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    if (reduceMotion) return

    const timer = setInterval(() => {
      if (Date.now() < pausedUntil.current) return
      setCards((current) => {
        const from = current.find((card) => card.id === TRAVELLER_ID)?.columnId
        if (!from) return current
        const next = COLUMNS[(COLUMNS.findIndex((c) => c.id === from) + 1) % COLUMNS.length]
        return moveCard(current, TRAVELLER_ID, next.id, 0)
      })
    }, DWELL_MS)

    return () => clearInterval(timer)
  }, [reduceMotion])

  const flatten = (smooth: boolean) => {
    const element = tiltRef.current
    if (!element) return
    element.style.transition = smooth ? 'transform 300ms var(--ease-out)' : 'none'
    element.style.transform = ''
  }

  const handleTiltMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const element = tiltRef.current
    if (!element || activeId || reduceMotion || event.pointerType !== 'mouse') return

    const box = element.getBoundingClientRect()
    const offsetX = (event.clientX - box.left) / box.width - 0.5
    const offsetY = (event.clientY - box.top) / box.height - 0.5
    element.style.transition = 'none'
    element.style.transform = `perspective(1600px) rotateX(${(-offsetY * MAX_TILT_DEG).toFixed(
      2
    )}deg) rotateY(${(offsetX * MAX_TILT_DEG).toFixed(2)}deg)`
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    // A 3D ancestor transform desynchronises dnd-kit's pointer maths from its measured rects.
    flatten(false)
    pausedUntil.current = Number.POSITIVE_INFINITY
    setActiveId(String(active.id))
  }

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    setCards((current) => {
      const from = columnOf(current, String(active.id))
      const to = columnOf(current, String(over.id))
      if (!from || !to || from === to) return current
      const target = cardsIn(current, to)
      const overIndex = target.findIndex((card) => card.id === over.id)
      return moveCard(current, String(active.id), to, overIndex === -1 ? target.length : overIndex)
    })
  }

  const settle = () => {
    pausedUntil.current = Date.now() + RESUME_AFTER_DROP_MS
    setActiveId(null)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    settle()
    if (!over) return

    const columnId = columnOf(cards, String(over.id))
    if (!columnId || columnOf(cards, String(active.id)) !== columnId) return

    const target = cardsIn(cards, columnId)
    const toIndex = target.findIndex((card) => card.id === over.id)
    if (toIndex !== -1) setCards(moveCard(cards, String(active.id), columnId, toIndex))
  }

  const activeCard = cards.find((card) => card.id === activeId)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
      <div
        ref={tiltRef}
        onPointerMove={handleTiltMove}
        onPointerLeave={() => flatten(true)}
        className="overflow-hidden rounded-panel border border-subtle bg-surface"
      >
        <div className="flex items-center gap-2 border-b border-subtle bg-surface-raised px-3 py-2.5">
          <span aria-hidden className="flex items-center gap-1.5">
            {[LABEL_COLORS[0], LABEL_COLORS[2], LABEL_COLORS[3]].map((color) => (
              <span
                key={color}
                className="size-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
            ))}
          </span>
          <span className="ml-1 truncate text-xs text-subtle">Website relaunch</span>
        </div>

        <div
          role="group"
          aria-label="Example board. Drag a card into another column, or focus a card and press space then the arrow keys."
          className="p-3"
        >
          <DndContext
            id="demo-board"
            sensors={sensors}
            measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={settle}
          >
            <div className="flex gap-3 lg:justify-center">
              {COLUMNS.map((column) => (
                <DemoColumn
                  key={column.id}
                  column={column}
                  cards={cardsIn(cards, column.id)}
                  animate={!reduceMotion && !activeId}
                />
              ))}
            </div>

            <DragOverlay>
              {activeCard && (
                <div
                  data-card
                  className="relative scale-[1.02] rounded-card border border-subtle bg-surface-raised px-2.5 py-2 opacity-90 shadow-drag"
                >
                  <CardFace card={activeCard} />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  )
}
