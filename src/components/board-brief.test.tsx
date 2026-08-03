import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import BoardBrief from '@/components/board-brief'

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ rpc }),
}))

afterEach(cleanup)

beforeEach(() => {
  localStorage.clear()
  rpc.mockReset()
  rpc.mockImplementation((name: string) =>
    Promise.resolve(
      name === 'board_brief'
        ? { data: { status: 'ok', brief: null }, error: null }
        : { data: 'ok', error: null }
    )
  )
})

describe('BoardBrief', () => {
  it('reports an empty brief inline without calling the save RPC', async () => {
    render(<BoardBrief boardId="board-1" />)

    await waitFor(() => expect(screen.getByRole('button', { name: 'Add a board brief' })).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Add a board brief' }))

    const textarea = screen.getByLabelText('Brief')
    fireEvent.click(screen.getByRole('button', { name: 'Save brief' }))

    await waitFor(() => expect(screen.getByText('Brief is required')).toBeTruthy())
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(textarea.getAttribute('aria-invalid')).toBe('true')
    expect(textarea.getAttribute('aria-describedby')).toBe('board-brief-error')
    expect(document.activeElement).toBe(textarea)
    expect(screen.getByRole('button', { name: 'Save brief' })).toBeTruthy()
  })
})
