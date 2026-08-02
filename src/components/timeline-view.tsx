'use client'

import { useEffect, useMemo, useState } from 'react'
import { format, subDays } from 'date-fns'
import { ArrowRight, GitCommit } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { readBoard } from '@/lib/board-writes'
import { formatDueDate, isDueSoon } from '@/lib/date-utils'
import { Badge, Button, Modal, Select, Skeleton } from '@/components/ui'
import type { CardHistory } from '@/types'

interface TimelineCard {
  id: string
  title: string
  description: string | null
  color: string | null
  due_date: string | null
  created_at: string
  column_name: string
  card_history: CardHistory[]
}

interface Entry {
  id: string
  timestamp: string
  label: string
  created: boolean
}

type Range = '7' | '30' | '90' | 'all'
type SortBy = 'updated' | 'created'

const VISIBLE_ENTRIES = 4
const TICK_MS = 60000

const entriesOf = (card: TimelineCard): Entry[] =>
  [
    ...card.card_history.map(history => ({
      id: history.id,
      timestamp: history.timestamp,
      label: `Moved from ${history.from_column} to ${history.to_column}`,
      created: false,
    })),
    { id: `${card.id}-created`, timestamp: card.created_at, label: 'Card created', created: true },
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

const lastActivityOf = (card: TimelineCard) =>
  Math.max(
    new Date(card.created_at).getTime(),
    ...card.card_history.map(history => new Date(history.timestamp).getTime())
  )

function EntryRow({ entry }: { entry: Entry }) {
  const Icon = entry.created ? GitCommit : ArrowRight
  return (
    <li className="flex items-start gap-2">
      <Icon aria-hidden className="mt-0.5 size-3 shrink-0 text-subtle" />
      <time
        dateTime={entry.timestamp}
        className="shrink-0 text-2xs font-mono tabular-nums text-subtle"
      >
        {format(new Date(entry.timestamp), 'MMM d HH:mm')}
      </time>
      <span className="min-w-0 flex-1 text-xs text-muted">{entry.label}</span>
    </li>
  )
}

function CardTimeline({ card }: { card: TimelineCard }) {
  const [showAll, setShowAll] = useState(false)
  const entries = entriesOf(card)
  const hidden = entries.length - VISIBLE_ENTRIES

  return (
    <li className="relative rounded-card border border-subtle bg-surface-raised px-2.5 py-2 pl-3">
      {card.color && (
        <span
          aria-hidden
          className="absolute inset-y-1 left-0 w-[3px] rounded-full"
          style={{ backgroundColor: card.color }}
        />
      )}

      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 text-sm text-fg">{card.title}</p>
        <time className="shrink-0 text-2xs font-mono tabular-nums text-subtle">
          {format(lastActivityOf(card), 'MMM d')}
        </time>
      </div>

      {card.description && <p className="mt-1 text-xs text-muted line-clamp-2">{card.description}</p>}

      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        <Badge>{card.column_name}</Badge>
        {card.due_date && (
          <Badge variant={isDueSoon(card.due_date) ? 'danger' : 'neutral'}>
            {formatDueDate(card.due_date)}
          </Badge>
        )}
      </div>

      <ol className="mt-2 flex flex-col gap-1 border-t border-subtle pt-2">
        {entries.slice(0, VISIBLE_ENTRIES).map(entry => (
          <EntryRow key={entry.id} entry={entry} />
        ))}
      </ol>

      {hidden > 0 && (
        <Button variant="ghost" size="sm" className="mt-1 px-1" onClick={() => setShowAll(true)}>
          Show {hidden} more
        </Button>
      )}

      <Modal open={showAll} onClose={() => setShowAll(false)} title={card.title}>
        <ol className="flex flex-col gap-1">
          {entries.map(entry => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </ol>
      </Modal>
    </li>
  )
}

function TimelineSkeleton() {
  return (
    <ul className="flex flex-col gap-2">
      {Array.from({ length: 5 }, (_, i) => (
        <li key={i} className="rounded-card border border-subtle bg-surface-raised px-2.5 py-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="mt-2 h-3 w-24" />
          <Skeleton className="mt-2.5 h-3 w-full" />
          <Skeleton className="mt-1.5 h-3 w-3/4" />
        </li>
      ))}
    </ul>
  )
}

export default function TimelineView({ boardId }: { boardId: string }) {
  const [cards, setCards] = useState<TimelineCard[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [range, setRange] = useState<Range>('30')
  const [sortBy, setSortBy] = useState<SortBy>('updated')
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setFailed(false)

      const board = await readBoard(createClient(), boardId, true).catch(error => {
        console.error('Failed to load card history', error)
        return null
      })
      if (cancelled) return

      if (board === null || board.status !== 'ok') {
        setCards([])
        setFailed(true)
        setLoading(false)
        return
      }

      const columnNames = new Map(board.columns.map(column => [column.id, column.name]))
      const historyByCard = new Map<string, CardHistory[]>()
      for (const entry of board.card_history) {
        historyByCard.set(entry.card_id, [...(historyByCard.get(entry.card_id) ?? []), entry])
      }

      setCards(
        board.cards.map(card => ({
          id: card.id,
          title: card.title,
          description: card.description,
          color: card.color,
          due_date: card.due_date,
          created_at: card.created_at,
          column_name: columnNames.get(card.column_id) ?? '',
          card_history: historyByCard.get(card.id) ?? [],
        }))
      )
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [boardId])

  const visible = useMemo(() => {
    const activity = (card: TimelineCard) =>
      sortBy === 'created' ? new Date(card.created_at).getTime() : lastActivityOf(card)
    const cutoff = range === 'all' ? 0 : subDays(now, Number(range)).getTime()

    return cards.filter(card => activity(card) >= cutoff).sort((a, b) => activity(b) - activity(a))
  }, [cards, range, sortBy, now])

  if (loading) return <TimelineSkeleton />

  if (failed) {
    return (
      <p className="rounded-card border border-dashed border-subtle py-6 text-center text-xs text-subtle">
        Could not read this board&apos;s history.
      </p>
    )
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Select
          aria-label="Time range"
          value={range}
          onChange={event => setRange(event.target.value as Range)}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="all">All time</option>
        </Select>
        <Select
          aria-label="Sort by"
          value={sortBy}
          onChange={event => setSortBy(event.target.value as SortBy)}
        >
          <option value="updated">Last updated</option>
          <option value="created">Date created</option>
        </Select>
        <span className="ml-auto text-2xs font-mono tabular-nums text-subtle">
          {visible.length}
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-card border border-dashed border-subtle py-6 text-center text-xs text-subtle">
          No card activity in this period.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map(card => (
            <CardTimeline key={card.id} card={card} />
          ))}
        </ul>
      )}
    </div>
  )
}
