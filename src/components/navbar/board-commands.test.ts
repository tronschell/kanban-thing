import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Card, Column } from '@/types'
import { runBoardCommand, type BoardCommandContext } from './board-commands'

const { saveCards } = vi.hoisted(() => ({
  saveCards:
    vi.fn<(supabase: unknown, boardId: string, cards: Card[]) => Promise<string>>(
      async () => 'ok'
    ),
}))

vi.mock('@/lib/supabase/client', () => ({ createClient: () => ({}) }))

vi.mock('@/lib/board-writes', () => ({
  saveCards,
  cardRow: (card: Card) => card,
  readBoard: vi.fn(),
  writeMessage: (_result: string, fallback: string) => fallback,
}))

const column = (name: string, position: number): Column => ({
  id: `column-${position}`,
  board_id: 'board-1',
  name,
  position,
  created_at: '2026-01-01T00:00:00.000Z',
})

const columns = [column('Backlog', 0), column('To Do', 1), column('In Progress', 2), column('Done', 3)]

const card = (title: string, columnId: string): Card => ({
  id: `card-${title}`,
  title,
  description: null,
  color: null,
  due_date: null,
  position: 0,
  column_id: columnId,
  created_at: '2026-01-01T00:00:00.000Z',
})

const context = (cards: Card[] = []): BoardCommandContext => ({
  boardId: 'board-1',
  columns,
  cards,
  backlogColumnId: 'column-0',
})

const savedCard = () => saveCards.mock.calls[0][2][0]

beforeEach(() => {
  saveCards.mockClear()
})

describe('move separator resolution', () => {
  it('reaches the "To Do" column even though its name starts with "to"', async () => {
    const cards = [card('Fix login', 'column-2')]

    const response = await runBoardCommand('move Fix login to To Do', context(cards))

    expect(response).toEqual({ success: true, message: 'Moved "Fix login" to To Do' })
    expect(savedCard().column_id).toBe('column-1')
  })

  it('keeps a "to" that belongs to the card title', async () => {
    const cards = [card('Deploy to staging', 'column-1')]

    const response = await runBoardCommand('move Deploy to staging to Done', context(cards))

    expect(response).toEqual({ success: true, message: 'Moved "Deploy to staging" to Done' })
    expect(savedCard().column_id).toBe('column-3')
  })
})

describe('create separator resolution', () => {
  it('does not split a title on the English word "in"', async () => {
    const response = await runBoardCommand('create Log in to Jira', context())

    expect(response).toEqual({ success: true, message: 'Created "Log in to Jira" in Backlog' })
    expect(savedCard().title).toBe('Log in to Jira')
    expect(savedCard().column_id).toBe('column-0')
  })

  it('splits on the "in" that names a real column', async () => {
    const response = await runBoardCommand('create Sign in in Backlog', context())

    expect(response).toEqual({ success: true, message: 'Created "Sign in" in Backlog' })
    expect(savedCard().title).toBe('Sign in')
  })
})

describe('flag boundary', () => {
  it('keeps a double hyphen that sits inside a word', async () => {
    const response = await runBoardCommand('create Rewrite the auth--flow module', context())

    expect(response.success).toBe(true)
    expect(savedCard().title).toBe('Rewrite the auth--flow module')
  })

  it('still strips real flags', async () => {
    const response = await runBoardCommand('create Ship it in Done --color #ff0000', context())

    expect(response).toEqual({ success: true, message: 'Created "Ship it" in Done' })
    expect(savedCard().title).toBe('Ship it')
    expect(savedCard().color).toBe('#ff0000')
  })
})
