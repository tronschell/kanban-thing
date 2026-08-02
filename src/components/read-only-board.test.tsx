import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const { shared } = vi.hoisted(() => {
  const column = (id: string, name: string) => ({
    id,
    board_id: 'board-1',
    name,
    position: 0,
    created_at: '2026-01-01T00:00:00.000Z',
  })
  const card = (id: string, columnId: string) => ({
    id,
    title: id,
    description: null,
    color: null,
    due_date: null,
    position: 0,
    column_id: columnId,
    created_at: '2026-01-01T00:00:00.000Z',
  })

  return {
    shared: {
      status: 'ok',
      board: { id: 'board-1', name: 'Shared board', expires_at: '2026-12-01T00:00:00.000Z' },
      columns: [column('a', 'Backlog'), column('b', 'Backlog'), column('c', 'Doing')],
      cards: [card('card-1', 'a'), card('card-2', 'b'), card('card-3', 'c')],
    },
  }
})

vi.mock('@/components/navbar', () => ({ default: () => null }))
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ rpc: async () => ({ data: shared }) }),
}))

import ReadOnlyBoard from './read-only-board'

describe('ReadOnlyBoard', () => {
  it('leaves no card unreachable when a board has duplicate Backlog columns', async () => {
    render(<ReadOnlyBoard boardId="board-1" viewToken="token" />)
    await screen.findByText('card-1')

    const unreachable = shared.cards.filter((card) => screen.queryByText(card.title) === null)
    expect(unreachable.map((card) => card.id)).toEqual([])
  })
})
