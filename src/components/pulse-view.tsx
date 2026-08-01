'use client'

import { useEffect, useMemo, useState } from 'react'
import { differenceInDays, formatDistanceToNow } from 'date-fns'
import { ArrowRight, Check, Copy } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { dueDateToDay, formatDueDate } from '@/lib/date-utils'
import { Badge, Button, Skeleton } from '@/components/ui'

const STUCK_DAYS = 7
const WINDOW_DAYS = 7
const DIGEST_ROWS = 10
const BACKLOG_NAME = 'Backlog'

interface Move {
  from_column: string
  to_column: string
  timestamp: string
}

interface PulseColumn {
  id: string
  name: string
  position: number
}

interface PulseCard {
  id: string
  title: string
  due_date: string | null
  created_at: string
  column_id: string
  card_history: Move[]
}

interface StuckRow {
  id: string
  title: string
  column: string
  days: number
}

interface LateRow {
  id: string
  title: string
  due_date: string
}

interface MovedRow {
  id: string
  title: string
  from: string
  to: string
  timestamp: string
}

interface LandedRow {
  id: string
  title: string
  timestamp: string
}

const lastColumnChange = (card: PulseCard) =>
  card.card_history.length === 0
    ? new Date(card.created_at).getTime()
    : Math.max(...card.card_history.map(move => new Date(move.timestamp).getTime()))

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`

const relative = (timestamp: string) =>
  formatDistanceToNow(new Date(timestamp), { addSuffix: true })

function digestSection(title: string, rows: string[]) {
  if (rows.length === 0) return ''
  const shown = rows.slice(0, DIGEST_ROWS).map(row => `- ${row}`)
  if (rows.length > DIGEST_ROWS) shown.push(`- and ${rows.length - DIGEST_ROWS} more`)
  return `\n\n${title}\n${shown.join('\n')}`
}

function Section({ title, count, children }: {
  title: string
  count: number
  children: React.ReactNode
}) {
  if (count === 0) return null
  return (
    <section aria-label={title} className="mt-4">
      <h2 className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
        {title}
        <span className="text-2xs font-mono tabular-nums text-subtle">{count}</span>
      </h2>
      <ul className="flex flex-col gap-1.5">{children}</ul>
    </section>
  )
}

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-card border border-subtle bg-surface-raised px-2.5 py-2">
      <p className="min-w-0 flex-1 text-sm text-fg">{title}</p>
      {children}
    </li>
  )
}

function PulseSkeleton() {
  return (
    <div>
      <Skeleton className="h-5 w-72" />
      <div className="mt-4 flex flex-col gap-1.5">
        <Skeleton className="h-4 w-24" />
        {[0, 1, 2, 3].map(row => (
          <Skeleton key={row} className="h-9 w-full rounded-card" />
        ))}
      </div>
    </div>
  )
}

export default function PulseView({ boardId }: { boardId: string }) {
  const [columns, setColumns] = useState<PulseColumn[]>([])
  const [cards, setCards] = useState<PulseCard[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setFailed(false)
      const supabase = createClient()

      const { data: columnRows, error: columnError } = await supabase
        .from('columns')
        .select('id, name, position')
        .eq('board_id', boardId)
        .order('position')

      if (cancelled) return
      if (columnError) {
        console.error('Failed to load board columns', columnError)
        setFailed(true)
        setLoading(false)
        return
      }

      const loadedColumns = (columnRows ?? []) as PulseColumn[]
      const { data: cardRows, error: cardError } = await supabase
        .from('cards')
        .select('id, title, due_date, created_at, column_id, card_history(from_column, to_column, timestamp)')
        .in('column_id', loadedColumns.map(column => column.id))

      if (cancelled) return
      if (cardError) {
        console.error('Failed to load card activity', cardError)
        setFailed(true)
        setLoading(false)
        return
      }

      setColumns(loadedColumns)
      setCards(
        ((cardRows ?? []) as unknown as (Omit<PulseCard, 'card_history'> & {
          card_history: Move[] | null
        })[]).map(card => ({ ...card, card_history: card.card_history ?? [] }))
      )
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [boardId])

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const pulse = useMemo(() => {
    const now = Date.now()
    const windowStart = now - WINDOW_DAYS * 86400000
    const backlogIds = new Set(
      columns.filter(column => column.name === BACKLOG_NAME).map(column => column.id)
    )
    const ordered = columns.filter(column => !backlogIds.has(column.id))
    // "Right-most" is only meaningful once a board has somewhere for work to land.
    const finalColumn = ordered.length >= 2 ? ordered[ordered.length - 1] : null
    const nameOf = new Map(columns.map(column => [column.id, column.name]))
    const today = new Date().toISOString().slice(0, 10)

    const stuck: StuckRow[] = cards
      .filter(card => !backlogIds.has(card.column_id) && card.column_id !== finalColumn?.id)
      .map(card => ({
        id: card.id,
        title: card.title,
        column: nameOf.get(card.column_id) ?? '',
        days: differenceInDays(now, lastColumnChange(card)),
      }))
      .filter(row => row.days > STUCK_DAYS)
      .sort((a, b) => b.days - a.days)

    const late: LateRow[] = cards
      .filter(card => card.due_date && dueDateToDay(card.due_date) < today)
      .map(card => ({ id: card.id, title: card.title, due_date: card.due_date! }))
      .sort((a, b) => a.due_date.localeCompare(b.due_date))

    const recentMoves = cards.flatMap(card =>
      card.card_history
        .filter(move => new Date(move.timestamp).getTime() >= windowStart)
        .map(move => ({ card, move }))
    )

    const moved: MovedRow[] = recentMoves
      .map(({ card, move }) => ({
        id: `${card.id}-${move.timestamp}`,
        title: card.title,
        from: move.from_column,
        to: move.to_column,
        timestamp: move.timestamp,
      }))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

    const landed: LandedRow[] = finalColumn
      ? recentMoves
          .filter(({ move }) => move.to_column === finalColumn.name)
          .map(({ card, move }) => ({ id: card.id, title: card.title, timestamp: move.timestamp }))
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      : []

    const summary = `${plural(cards.length, 'card')}. ${stuck.length} stuck, ${late.length} late, ${moved.length} moved this week.`

    return { summary, stuck, late, moved, landed }
  }, [cards, columns])

  const copySummary = async () => {
    const digest =
      pulse.summary +
      digestSection(
        'Stuck',
        pulse.stuck.map(row => `${row.title} (in ${row.column} for ${plural(row.days, 'day')})`)
      ) +
      digestSection(
        'Late',
        pulse.late.map(row => `${row.title} (due ${formatDueDate(row.due_date)})`)
      ) +
      digestSection(
        'Moved this week',
        pulse.moved.map(row => `${row.title}: ${row.from} -> ${row.to}, ${relative(row.timestamp)}`)
      ) +
      digestSection(
        'Landed',
        pulse.landed.map(row => `${row.title} (${relative(row.timestamp)})`)
      )

    try {
      await navigator.clipboard.writeText(digest)
      setCopied(true)
    } catch (error) {
      console.error('Failed to copy pulse summary:', error)
    }
  }

  if (loading) return <PulseSkeleton />

  if (failed) {
    return (
      <p className="rounded-card border border-dashed border-subtle py-6 text-center text-xs text-subtle">
        Could not read this board&apos;s activity.
      </p>
    )
  }

  if (cards.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-subtle py-6 text-center text-xs text-subtle">
        No cards on this board yet.
      </p>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-md text-fg">{pulse.summary}</p>
          <p className="mt-0.5 text-xs text-subtle">
            Counted from column moves only. Card edits are not tracked.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={copySummary} aria-live="polite">
          {copied ? <Check /> : <Copy />}
          {copied ? 'Copied' : 'Copy summary'}
        </Button>
      </div>

      <Section title="Stuck" count={pulse.stuck.length}>
        {pulse.stuck.map(row => (
          <Row key={row.id} title={row.title}>
            <span className="shrink-0 text-2xs text-subtle">
              in {row.column} for{' '}
              <span className="font-mono tabular-nums">{row.days}</span> days
            </span>
          </Row>
        ))}
      </Section>

      <Section title="Late" count={pulse.late.length}>
        {pulse.late.map(row => (
          <Row key={row.id} title={row.title}>
            <Badge variant="danger">{formatDueDate(row.due_date)}</Badge>
          </Row>
        ))}
      </Section>

      <Section title="Moved this week" count={pulse.moved.length}>
        {pulse.moved.map(row => (
          <Row key={row.id} title={row.title}>
            <span className="flex shrink-0 items-center gap-1 text-2xs text-subtle">
              {row.from}
              <ArrowRight aria-hidden className="size-3" />
              <span className="sr-only">to</span>
              {row.to}
            </span>
            <time
              dateTime={row.timestamp}
              className="shrink-0 text-2xs font-mono tabular-nums text-subtle"
            >
              {relative(row.timestamp)}
            </time>
          </Row>
        ))}
      </Section>

      <Section title="Landed" count={pulse.landed.length}>
        {pulse.landed.map(row => (
          <Row key={row.id} title={row.title}>
            <time
              dateTime={row.timestamp}
              className="shrink-0 text-2xs font-mono tabular-nums text-subtle"
            >
              {relative(row.timestamp)}
            </time>
          </Row>
        ))}
      </Section>
    </div>
  )
}
