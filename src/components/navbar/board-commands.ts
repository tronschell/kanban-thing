import type { Dispatch, SetStateAction } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cardRow, readBoard, saveCards, writeMessage } from '@/lib/board-writes'
import { dayToDueDate, dueDateToDay } from '@/lib/date-utils'
import { Card, Column } from '@/types'

export interface CommandResponse {
  success: boolean
  message: string
}

export interface BoardCommandContext {
  boardId: string
  columns: Column[]
  cards: Card[]
  backlogColumnId?: string | null
  setBoardCards?: Dispatch<SetStateAction<Card[]>>
  setBacklogCards?: Dispatch<SetStateAction<Card[]>>
}

const ALIASES: Record<string, string> = {
  cr: 'create',
  dl: 'delete',
  mv: 'move',
  l: 'list',
  h: 'help',
}

const KNOWN = ['create', 'move', 'delete', 'list', 'find', 'stuck', 'due']

const EMPTY_DUE: Record<string, string> = {
  overdue: 'Nothing overdue.',
  today: 'Nothing due today.',
  week: 'Nothing due this week.',
}

const HELP = `create (cr) {title} [in {column}] [--desc "text"] [--due YYYY-MM-DD] [--color #hex]
move (mv) {title} to {column}
delete (dl) {title}
list (l)
find {text}
stuck [days]
due [today|week|overdue]
clear
help (h)

Without "in {column}" a new card lands in Backlog.`

const failure = (message: string): CommandResponse => ({ success: false, message })
const ok = (message: string): CommandResponse => ({ success: true, message })

const findColumn = (columns: Column[], name: string) =>
  columns.find((column) => column.name.toLowerCase() === name.trim().toLowerCase())

const splitAtColumn = (words: string[], keyword: string, columns: Column[]) => {
  let best: { title: string; column: Column } | undefined
  for (let index = 1; index < words.length - 1; index++) {
    if (words[index].toLowerCase() !== keyword) continue
    const column = findColumn(columns, words.slice(index + 1).join(' '))
    if (!column) continue
    if (!best || column.name.length >= best.column.name.length) {
      best = { title: words.slice(0, index).join(' '), column }
    }
  }
  return best
}

const unknownColumn = (columns: Column[], name: string) =>
  failure(
    `Column "${name}" not found. Available: ${columns.map((column) => `"${column.name}"`).join(', ')}`
  )

const nameOfColumn = (columns: Column[], columnId: string) =>
  columns.find((column) => column.id === columnId)?.name ?? 'Unknown'

const nextPosition = (cards: Card[], columnId: string) =>
  cards
    .filter((card) => card.column_id === columnId)
    .reduce((next, card) => Math.max(next, card.position + 1), 0)

const cardsTitled = (cards: Card[], title: string) =>
  cards.filter((card) => card.title.toLowerCase() === title.toLowerCase())

const localDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const isRealDay = (day: string) => {
  const [year, month, date] = day.split('-').map(Number)
  return localDay(new Date(year, month - 1, date)) === day
}

const listFor = (ctx: BoardCommandContext, columnId: string) =>
  columnId === ctx.backlogColumnId ? ctx.setBacklogCards : ctx.setBoardCards

const addCard = (ctx: BoardCommandContext, card: Card) =>
  listFor(ctx, card.column_id)?.((prev) => [...prev, card])

const removeCard = (ctx: BoardCommandContext, card: Card) =>
  listFor(ctx, card.column_id)?.((prev) => prev.filter((item) => item.id !== card.id))

export async function runBoardCommand(
  input: string,
  ctx: BoardCommandContext
): Promise<CommandResponse> {
  const words = input.trim().split(/\s+/)
  const action = ALIASES[words[0].toLowerCase()] ?? words[0].toLowerCase()

  if (action === 'help') return ok(HELP)
  if (action === 'clear') return ok('')
  if (!KNOWN.includes(action)) return failure('Unknown command. Type help for the list.')

  const supabase = createClient()
  const columns = ctx.columns
  if (columns.length === 0) return failure('The board is still loading.')
  const snapshot = ctx.cards

  try {
    if (action === 'create') {
      const flagsAt = input.search(/\s--/)
      const head = (flagsAt === -1 ? input : input.slice(0, flagsAt)).trim().split(/\s+/).slice(1)
      const split = splitAtColumn(head, 'in', columns)

      const title = split?.title ?? head.join(' ')
      if (!title) return failure('Usage: create {title} [in {column}]')

      const column = split?.column ?? findColumn(columns, 'Backlog')
      if (!column) return unknownColumn(columns, 'Backlog')

      const description = input.match(/--desc\s+"([^"]+)"/i)?.[1] ?? null
      const color = input.match(/--color\s+(#[0-9a-f]{6}|#[0-9a-f]{3})\b/i)?.[1] ?? null
      if (!color && /--color\b/i.test(input)) return failure('Usage: --color #hex')

      const dueDay = input.match(/--due\s+(\d{4}-\d{2}-\d{2})\b/)?.[1] ?? null
      if ((!dueDay || !isRealDay(dueDay)) && /--due\b/i.test(input)) {
        return failure('Usage: --due YYYY-MM-DD')
      }

      const created: Card = {
        id: crypto.randomUUID(),
        column_id: column.id,
        title,
        description,
        color,
        due_date: dueDay ? dayToDueDate(dueDay) : null,
        position: nextPosition(snapshot, column.id),
        created_at: new Date().toISOString(),
      }

      const result = await saveCards(supabase, ctx.boardId, [cardRow(created)])
      if (result !== 'ok') return failure(writeMessage(result, 'The command failed.'))
      addCard(ctx, created)

      return ok(`Created "${title}" in ${column.name}`)
    }

    if (action === 'move') {
      const split = splitAtColumn(words.slice(1), 'to', columns)
      if (!split) {
        const toAt = words.map((word) => word.toLowerCase()).lastIndexOf('to')
        if (toAt < 2 || toAt === words.length - 1) {
          return failure('Usage: move {title} to {column}')
        }
        return unknownColumn(columns, words.slice(toAt + 1).join(' '))
      }

      const { title, column } = split
      const matches = cardsTitled(snapshot, title)
      if (matches.length === 0) return failure(`Card "${title}" not found`)
      if (matches.length > 1) {
        return failure(`${matches.length} cards match "${title}". Use a longer title.`)
      }

      const card = matches[0]
      if (card.column_id === column.id) return ok(`"${card.title}" is already in ${column.name}`)

      const moved = { ...card, column_id: column.id, position: nextPosition(snapshot, column.id) }
      const result = await saveCards(supabase, ctx.boardId, [cardRow(moved)])
      if (result !== 'ok') return failure(writeMessage(result, 'The command failed.'))

      removeCard(ctx, card)
      addCard(ctx, moved)

      return ok(`Moved "${card.title}" to ${column.name}`)
    }

    if (action === 'delete') {
      const title = words.slice(1).join(' ')
      if (!title) return failure('Usage: delete {title}')

      const matches = cardsTitled(snapshot, title)
      if (matches.length === 0) return failure(`Card "${title}" not found`)
      if (matches.length > 1) {
        return failure(`${matches.length} cards match "${title}". Use a longer title.`)
      }

      const result = await saveCards(supabase, ctx.boardId, [], [matches[0].id])
      if (result !== 'ok') return failure(writeMessage(result, 'The command failed.'))

      removeCard(ctx, matches[0])

      return ok(`Deleted "${matches[0].title}"`)
    }

    if (action === 'list') {
      return ok(
        columns
          .map((column) => {
            const titles = snapshot
              .filter((card) => card.column_id === column.id)
              .map((card) => `  - ${card.title}`)
            return `${column.name.toUpperCase()}:\n${titles.join('\n') || '  - (empty)'}`
          })
          .join('\n\n')
      )
    }

    if (action === 'find') {
      const needle = words.slice(1).join(' ').toLowerCase()
      if (!needle) return failure('Usage: find {text}')

      const hits = snapshot.filter(
        (card) =>
          card.title.toLowerCase().includes(needle) ||
          (card.description ?? '').toLowerCase().includes(needle)
      )
      if (hits.length === 0) return ok('No matches.')

      return ok(
        hits.map((card) => `${nameOfColumn(columns, card.column_id)} · ${card.title}`).join('\n')
      )
    }

    if (action === 'stuck') {
      const days = words[1] === undefined ? 7 : Number(words[1])
      if (!Number.isFinite(days) || days < 0) return failure('Usage: stuck [days]')

      const board = await readBoard(supabase, ctx.boardId, true)
      if (board.status !== 'ok') {
        return failure(writeMessage(board.status, 'The command failed.'))
      }

      const movedAt = new Map<string, number>()
      for (const entry of board.card_history) {
        const at = new Date(entry.timestamp).getTime()
        movedAt.set(entry.card_id, Math.max(movedAt.get(entry.card_id) ?? 0, at))
      }
      const lastActivity = (card: Card) =>
        Math.max(new Date(card.created_at).getTime(), movedAt.get(card.id) ?? 0)

      const rightmost = columns[columns.length - 1]?.id
      const hits = snapshot
        .filter((card) => card.column_id !== ctx.backlogColumnId && card.column_id !== rightmost)
        .map((card) => ({
          card,
          age: Math.floor((Date.now() - lastActivity(card)) / 86400000),
        }))
        .filter((entry) => entry.age >= days)
        .sort((a, b) => b.age - a.age)

      if (hits.length === 0) return ok(`Nothing stuck for ${days} days or more.`)

      return ok(
        hits
          .map(
            ({ card, age }) =>
              `${age}d · ${nameOfColumn(columns, card.column_id)} · ${card.title}`
          )
          .join('\n')
      )
    }

    if (action === 'due') {
      const filter = (words[1] ?? 'overdue').toLowerCase()
      if (!['today', 'week', 'overdue'].includes(filter)) {
        return failure('Usage: due [today|week|overdue]')
      }

      const today = localDay(new Date())
      const weekEnd = localDay(new Date(Date.now() + 7 * 86400000))
      const inRange = (day: string) => {
        if (filter === 'overdue') return day < today
        if (filter === 'today') return day === today
        return day >= today && day <= weekEnd
      }

      const hits = snapshot
        .filter((card) => card.due_date && inRange(dueDateToDay(card.due_date)))
        .sort((a, b) => dueDateToDay(a.due_date!).localeCompare(dueDateToDay(b.due_date!)))

      if (hits.length === 0) return ok(EMPTY_DUE[filter])

      return ok(
        hits
          .map(
            (card) =>
              `${dueDateToDay(card.due_date!)} · ${nameOfColumn(columns, card.column_id)} · ${card.title}`
          )
          .join('\n')
      )
    }

    return failure('Unknown command. Type help for the list.')
  } catch (error) {
    console.error('Terminal command error:', error)
    return failure('The command failed. Check the console for details.')
  }
}
