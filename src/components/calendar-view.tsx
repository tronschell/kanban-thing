'use client'

import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight, MoreHorizontal, Pencil, X } from 'lucide-react'

import DueDatePicker from '@/components/due-date-picker'
import { dayToDueDate, dueDateToDay } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  Modal,
} from '@/components/ui'
import type { Card, Column } from '@/types'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEK_OPTIONS = { weekStartsOn: 1 } as const
const CARDS_PER_CELL = 3

const dayKey = (date: Date) => format(date, 'yyyy-MM-dd')

const weeksOfMonth = (month: Date) => {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), WEEK_OPTIONS),
    end: endOfWeek(endOfMonth(month), WEEK_OPTIONS),
  })
  return Array.from({ length: days.length / 7 }, (_, week) => days.slice(week * 7, week * 7 + 7))
}

interface CardActions {
  onOpenCard: (card: Card) => void
  onPickDueDate: (card: Card) => void
  onClearDueDate: (card: Card) => void
}

function CardBody({ card, columnName }: { card: Card; columnName?: string }) {
  return (
    <div className="min-w-0 flex-1">
      {card.color && (
        <span
          aria-hidden
          className="absolute inset-y-1 left-0 w-[3px] rounded-full"
          style={{ backgroundColor: card.color }}
        />
      )}
      <span className="block line-clamp-2 text-xs text-fg">{card.title}</span>
      {columnName && <span className="mt-0.5 block truncate text-2xs text-subtle">{columnName}</span>}
    </div>
  )
}

function CardMenu({ card, actions }: { card: Card; actions: CardActions }) {
  return (
    // Drag listeners sit on the card face, so the menu has to keep its own events to itself.
    <span
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton
            label={`Options for ${card.title}`}
            size="sm"
            icon={<MoreHorizontal />}
            className="-mr-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => actions.onOpenCard(card)}>
            <Pencil />
            Open card
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => actions.onPickDueDate(card)}>
            <CalendarDays />
            {card.due_date ? 'Change due date' : 'Set due date'}
          </DropdownMenuItem>
          {card.due_date && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={() => actions.onClearDueDate(card)}>
                <X />
                Remove due date
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  )
}

function DraggableCard({
  card,
  columnName,
  actions,
}: {
  card: Card
  columnName?: string
  actions: CardActions
}) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: card.id })

  return (
    <li
      ref={setNodeRef}
      className={cn(
        'group relative rounded-card border py-1 pl-2 pr-1',
        isDragging
          ? 'border-dashed border-strong bg-surface'
          : 'border-subtle bg-surface-raised hover:border-strong'
      )}
    >
      <div className={cn('flex items-start gap-1', isDragging && 'invisible')}>
        <button
          type="button"
          {...listeners}
          {...attributes}
          onClick={() => actions.onOpenCard(card)}
          className="focus-ring flex min-w-0 flex-1 cursor-grab rounded-control text-left"
        >
          <CardBody card={card} columnName={columnName} />
        </button>
        <CardMenu card={card} actions={actions} />
      </div>
    </li>
  )
}

// The expanded-day modal repeats cards the cell already renders, and a second
// useDraggable on the same id would clash, so these cards are not draggable.
function StaticCard({
  card,
  columnName,
  actions,
}: {
  card: Card
  columnName?: string
  actions: CardActions
}) {
  return (
    <li className="group relative flex items-start gap-1 rounded-card border border-subtle bg-surface-raised py-1.5 pl-2.5 pr-1">
      <button
        type="button"
        onClick={() => actions.onOpenCard(card)}
        className="focus-ring flex min-w-0 flex-1 rounded-control text-left"
      >
        <CardBody card={card} columnName={columnName} />
      </button>
      <CardMenu card={card} actions={actions} />
    </li>
  )
}

function DayCell({
  day,
  month,
  cards,
  actions,
  onExpand,
}: {
  day: Date
  month: Date
  cards: Card[]
  actions: CardActions
  onExpand: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dayKey(day) })
  const inMonth = isSameMonth(day, month)
  const today = isToday(day)
  const overdue = cards.length > 0 && isBefore(day, startOfDay(new Date()))
  const hidden = cards.length - CARDS_PER_CELL

  return (
    <td
      ref={setNodeRef}
      aria-current={today ? 'date' : undefined}
      className={cn(
        'h-24 w-[14.28%] border border-subtle p-1 align-top',
        isOver ? 'bg-surface-hover' : inMonth || cards.length > 0 ? 'bg-surface' : 'bg-canvas'
      )}
    >
      <div className="flex items-center gap-1 px-0.5">
        <span
          className={cn(
            'font-mono text-2xs tabular-nums',
            today ? 'font-medium text-accent' : inMonth ? 'text-muted' : 'text-subtle'
          )}
        >
          {format(day, 'd')}
          {today && <span className="sr-only"> (today)</span>}
        </span>
        {overdue && (
          <Badge variant="danger" className="min-w-0 truncate">
            {cards.length} overdue
          </Badge>
        )}
      </div>

      {cards.length > 0 && (
        <ul className="mt-1 flex flex-col gap-1">
          {cards.slice(0, CARDS_PER_CELL).map((card) => (
            <DraggableCard key={card.id} card={card} actions={actions} />
          ))}
        </ul>
      )}

      {hidden > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onExpand}
          className="mt-1 h-5 w-full px-1 font-mono text-2xs tabular-nums"
        >
          {hidden} more
        </Button>
      )}
    </td>
  )
}

function UnscheduledRail({
  cards,
  columnNames,
  actions,
}: {
  cards: Card[]
  columnNames: Map<string, string>
  actions: CardActions
}) {
  return (
    <section
      aria-label="Unscheduled cards"
      className="flex w-full shrink-0 flex-col rounded-panel border border-subtle bg-surface p-2 md:w-column"
    >
      <header className="flex items-center gap-2 px-1 pb-2">
        <h3 className="min-w-0 flex-1 truncate text-xs font-medium uppercase tracking-wide text-muted">
          Unscheduled
        </h3>
        <span className="font-mono text-2xs tabular-nums text-subtle">{cards.length}</span>
      </header>

      {cards.length === 0 ? (
        <p className="rounded-card border border-dashed border-subtle py-6 text-center text-xs text-subtle">
          Every card has a due date.
        </p>
      ) : (
        <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto scrollbar-thin">
          {cards.map((card) => (
            <DraggableCard
              key={card.id}
              card={card}
              columnName={columnNames.get(card.column_id)}
              actions={actions}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

interface CalendarViewProps {
  cards: Card[]
  columns: Column[]
  onOpenCard: (card: Card) => void
  onSetDueDate: (card: Card, dueDate: string | null) => void
}

export default function CalendarView({
  cards,
  columns,
  onOpenCard,
  onSetDueDate,
}: CalendarViewProps) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [expandedDay, setExpandedDay] = useState<Date | null>(null)
  const [pickingFor, setPickingFor] = useState<Card | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  )

  const columnNames = useMemo(
    () => new Map(columns.map((column) => [column.id, column.name])),
    [columns]
  )

  const unscheduled = useMemo(() => cards.filter((card) => !card.due_date), [cards])

  const cardsByDay = useMemo(() => {
    const grouped = new Map<string, Card[]>()
    for (const card of cards) {
      if (!card.due_date) continue
      const key = dueDateToDay(card.due_date)
      grouped.set(key, [...(grouped.get(key) ?? []), card])
    }
    return grouped
  }, [cards])

  const actions: CardActions = {
    onOpenCard: (card) => {
      setExpandedDay(null)
      onOpenCard(card)
    },
    onPickDueDate: (card) => {
      setExpandedDay(null)
      setPickingFor(card)
    },
    onClearDueDate: (card) => {
      setExpandedDay(null)
      onSetDueDate(card, null)
    },
  }

  const handleDragStart = ({ active }: DragStartEvent) => setDraggingId(String(active.id))

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggingId(null)
    if (!over) return

    const card = cards.find((item) => item.id === active.id)
    const day = String(over.id)
    if (!card || (card.due_date && dueDateToDay(card.due_date) === day)) return

    onSetDueDate(card, dayToDueDate(day))
  }

  const weeks = useMemo(() => weeksOfMonth(month), [month])
  const monthLabel = format(month, 'MMMM yyyy')
  const monthIsEmpty = weeks.every((week) => week.every((day) => !cardsByDay.get(dayKey(day))))
  const draggingCard = cards.find((card) => card.id === draggingId)
  const expandedCards = expandedDay ? cardsByDay.get(dayKey(expandedDay)) ?? [] : []

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggingId(null)}
    >
      <div className="mx-auto flex max-w-[1240px] flex-col gap-3 md:flex-row">
        <UnscheduledRail cards={unscheduled} columnNames={columnNames} actions={actions} />

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="min-w-0 flex-1 truncate text-md font-semibold text-fg">{monthLabel}</h2>
            <Button size="sm" onClick={() => setMonth(startOfMonth(new Date()))}>
              Today
            </Button>
            <IconButton
              label="Previous month"
              size="sm"
              icon={<ChevronLeft />}
              onClick={() => setMonth((prev) => addMonths(prev, -1))}
            />
            <IconButton
              label="Next month"
              size="sm"
              icon={<ChevronRight />}
              onClick={() => setMonth((prev) => addMonths(prev, 1))}
            />
          </div>

          <table className="w-full table-fixed border-collapse">
            <caption className="sr-only">
              Cards by due date, {monthLabel}. Drag a card onto a day to schedule it, or use the
              card menu to set a due date.
            </caption>
            <thead>
              <tr>
                {WEEKDAYS.map((weekday) => (
                  <th
                    key={weekday}
                    scope="col"
                    className="px-1 pb-1.5 text-xs font-medium uppercase tracking-wide text-muted"
                  >
                    {weekday}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => (
                <tr key={dayKey(week[0])}>
                  {week.map((day) => (
                    <DayCell
                      key={dayKey(day)}
                      day={day}
                      month={month}
                      cards={cardsByDay.get(dayKey(day)) ?? []}
                      actions={actions}
                      onExpand={() => setExpandedDay(day)}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {monthIsEmpty && (
            <p className="mt-3 rounded-card border border-dashed border-subtle py-6 text-center text-xs text-subtle">
              Nothing is due in {monthLabel}.
            </p>
          )}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {draggingCard && (
          <div className="relative rounded-card border border-subtle bg-surface-raised py-1 pl-2 pr-2 opacity-90 shadow-drag">
            <CardBody card={draggingCard} />
          </div>
        )}
      </DragOverlay>

      <Modal
        open={expandedDay !== null}
        onClose={() => setExpandedDay(null)}
        title={expandedDay ? format(expandedDay, 'EEEE, MMMM d') : ''}
      >
        <ul className="flex flex-col gap-2">
          {expandedCards.map((card) => (
            <StaticCard
              key={card.id}
              card={card}
              columnName={columnNames.get(card.column_id)}
              actions={actions}
            />
          ))}
        </ul>
      </Modal>

      <Modal
        open={pickingFor !== null}
        onClose={() => setPickingFor(null)}
        title="Set due date"
        description={pickingFor?.title}
        size="sm"
      >
        <DueDatePicker
          id="calendar-due-date"
          value={pickingFor?.due_date ? dueDateToDay(pickingFor.due_date) : ''}
          onChange={(day) => {
            if (pickingFor) onSetDueDate(pickingFor, day ? dayToDueDate(day) : null)
            setPickingFor(null)
          }}
        />
      </Modal>
    </DndContext>
  )
}
