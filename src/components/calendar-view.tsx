'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { formatDueDate, isDueSoon } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { Badge, Button, IconButton, Modal, Skeleton } from '@/components/ui'

interface DueCard {
  id: string
  title: string
  color: string | null
  due_date: string
  column_name: string
}

type DueCardRow = Omit<DueCard, 'column_name'> & {
  columns: { name: string } | null
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const CARDS_PER_CELL = 3

const dayKey = (date: Date) => format(date, 'yyyy-MM-dd')

const weeksOfMonth = (month: Date) => {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  })
  return Array.from({ length: days.length / 7 }, (_, week) => days.slice(week * 7, week * 7 + 7))
}

function ColorRail({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="absolute inset-y-1 left-0 w-[3px] rounded-full"
      style={{ backgroundColor: color }}
    />
  )
}

function DayCell({ day, month, cards, onExpand }: {
  day: Date
  month: Date
  cards: DueCard[]
  onExpand: () => void
}) {
  const inMonth = isSameMonth(day, month)
  const hidden = cards.length - CARDS_PER_CELL

  return (
    <td
      aria-current={isToday(day) ? 'date' : undefined}
      className={cn(
        'h-24 w-[14.28%] border border-subtle p-1 align-top',
        inMonth ? 'bg-surface' : 'bg-canvas'
      )}
    >
      <span
        className={cn(
          'block px-0.5 text-2xs font-mono tabular-nums',
          isToday(day) ? 'font-medium text-accent' : inMonth ? 'text-muted' : 'text-subtle'
        )}
      >
        {format(day, 'd')}
        {isToday(day) && <span className="sr-only"> (today)</span>}
      </span>

      {cards.length > 0 && (
        <ul className="mt-1 flex flex-col gap-1">
          {cards.slice(0, CARDS_PER_CELL).map(card => (
            <li
              key={card.id}
              className="relative rounded-card border border-subtle bg-surface-raised py-1 pl-2 pr-1.5"
            >
              {card.color && <ColorRail color={card.color} />}
              <p className="text-xs text-fg line-clamp-2">{card.title}</p>
            </li>
          ))}
        </ul>
      )}

      {hidden > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onExpand}
          className="mt-1 h-5 w-full px-1 font-mono tabular-nums text-2xs"
        >
          {hidden} more
        </Button>
      )}
    </td>
  )
}

function CardRow({ card }: { card: DueCard }) {
  return (
    <li className="relative rounded-card border border-subtle bg-surface-raised px-2.5 py-2 pl-3">
      {card.color && <ColorRail color={card.color} />}
      <p className="text-sm text-fg">{card.title}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        <Badge>{card.column_name}</Badge>
        <Badge variant={isDueSoon(card.due_date) ? 'danger' : 'neutral'}>
          {formatDueDate(card.due_date)}
        </Badge>
      </div>
    </li>
  )
}

function CalendarSkeleton() {
  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-3 flex items-center gap-2">
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: 42 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-none" />
        ))}
      </div>
    </div>
  )
}

export default function CalendarView({ boardId }: { boardId: string }) {
  const [cards, setCards] = useState<DueCard[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [expandedDay, setExpandedDay] = useState<Date | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      const { data, error } = await createClient()
        .from('cards')
        .select('id, title, color, due_date, columns!inner(name, board_id)')
        .eq('columns.board_id', boardId)
        .not('due_date', 'is', null)

      if (cancelled) return
      if (error) console.error('Failed to load due dates', error)

      setCards(
        ((data ?? []) as unknown as DueCardRow[]).map(card => ({
          id: card.id,
          title: card.title,
          color: card.color,
          due_date: card.due_date,
          column_name: card.columns?.name ?? '',
        }))
      )
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [boardId])

  const cardsByDay = useMemo(() => {
    const grouped = new Map<string, DueCard[]>()
    for (const card of cards) {
      // the stored timestamp's date part is the calendar day formatDueDate resolves to
      const key = card.due_date.slice(0, 10)
      grouped.set(key, [...(grouped.get(key) ?? []), card])
    }
    return grouped
  }, [cards])

  const weeks = useMemo(() => weeksOfMonth(month), [month])
  const monthLabel = format(month, 'MMMM yyyy')
  const monthIsEmpty = weeks.every(week => week.every(day => !cardsByDay.get(dayKey(day))))

  if (loading) return <CalendarSkeleton />

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="min-w-0 flex-1 truncate text-md font-semibold text-fg">{monthLabel}</h2>
        <Button size="sm" onClick={() => setMonth(startOfMonth(new Date()))}>
          Today
        </Button>
        <IconButton
          label="Previous month"
          size="sm"
          icon={<ChevronLeft />}
          onClick={() => setMonth(prev => addMonths(prev, -1))}
        />
        <IconButton
          label="Next month"
          size="sm"
          icon={<ChevronRight />}
          onClick={() => setMonth(prev => addMonths(prev, 1))}
        />
      </div>

      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">Cards by due date, {monthLabel}</caption>
        <thead>
          <tr>
            {WEEKDAYS.map(weekday => (
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
          {weeks.map(week => (
            <tr key={dayKey(week[0])}>
              {week.map(day => (
                <DayCell
                  key={dayKey(day)}
                  day={day}
                  month={month}
                  cards={cardsByDay.get(dayKey(day)) ?? []}
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

      <Modal
        open={expandedDay !== null}
        onClose={() => setExpandedDay(null)}
        title={expandedDay ? format(expandedDay, 'EEEE, MMMM d') : ''}
      >
        <ul className="flex flex-col gap-2">
          {(expandedDay ? cardsByDay.get(dayKey(expandedDay)) ?? [] : []).map(card => (
            <CardRow key={card.id} card={card} />
          ))}
        </ul>
      </Modal>
    </div>
  )
}
