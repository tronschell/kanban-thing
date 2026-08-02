import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))

vi.mock('@/lib/supabase/client', () => ({ createClient: () => ({ rpc }) }))

import { useBoardAuth } from './use-board-auth'

describe('board password probe', () => {
  beforeEach(() => {
    rpc.mockReset()
    localStorage.clear()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('stays locked when the probe errors', async () => {
    rpc.mockResolvedValue({ data: null, error: new Error('boom') })

    const { result } = renderHook(() => useBoardAuth('board-1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.checkFailed).toBe(true)
  })

  it('unlocks when the board does not exist so the read reports not-found', async () => {
    rpc.mockResolvedValue({ data: null, error: null })

    const { result } = renderHook(() => useBoardAuth('board-1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.checkFailed).toBe(false)
  })
})
