import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'

vi.mock('@/lib/supabase/client', () => ({ createClient: () => ({}) }))

vi.mock('@/lib/board-writes', () => ({
  readBoard: async () => ({
    status: 'ok',
    columns: [
      { id: 'doing', name: 'Doing', position: 0 },
      { id: 'done', name: 'Done', position: 1 },
    ],
    cards: [
      {
        id: 'card-1',
        title: 'Ship the digest',
        due_date: '2026-08-01T00:00:00.000Z',
        created_at: '2026-08-01T09:00:00.000Z',
        column_id: 'doing',
      },
    ],
    card_history: [],
  }),
}))

import PulseView from './pulse-view'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('PulseView clock', () => {
  it('moves a card into Late once the day rolls over while mounted', async () => {
    vi.useFakeTimers()
    vi.setSystemTime('2026-08-01T23:50:00')

    render(<PulseView boardId="board-1" />)
    await act(async () => {})

    expect(screen.queryByLabelText('Late')).toBeNull()
    expect(screen.getByText(/0 late/)).toBeTruthy()

    vi.setSystemTime('2026-08-02T09:00:00')
    await act(async () => {
      vi.advanceTimersByTime(60000)
    })

    expect(screen.queryByLabelText('Late')).not.toBeNull()
    expect(screen.getByText(/1 late/)).toBeTruthy()
  })
})
