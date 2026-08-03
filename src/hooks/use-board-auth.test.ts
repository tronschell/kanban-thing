import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { act } from 'react'
import {
  boardPassword,
  forgetBoardPassword,
  rememberBoardPassword,
} from '@/lib/board-writes'

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))

vi.mock('@/lib/supabase/client', () => ({ createClient: () => ({ rpc }) }))

import { useBoardAuth } from './use-board-auth'

describe('board password probe', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    rpc.mockReset()
    forgetBoardPassword('board-1')
    localStorage.clear()
    sessionStorage.clear()
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

  it('keeps the password in the tab session and clears it when locked', async () => {
    rpc
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: 'ok', error: null })

    const { result } = renderHook(() => useBoardAuth('board-1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.requiresPassword).toBe(true)

    await act(async () => {
      await result.current.unlock('secret')
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(sessionStorage.getItem('board_password_board-1')).toBe('secret')

    act(() => result.current.lock())

    expect(result.current.isAuthenticated).toBe(false)
    expect(sessionStorage.getItem('board_password_board-1')).toBeNull()
    expect(sessionStorage.getItem('board_access_board-1')).toBeNull()
    expect(rpc).toHaveBeenCalledTimes(2)
  })

  it('marks the board password-required after unlocking following a failed probe', async () => {
    rpc
      .mockResolvedValueOnce({ data: null, error: new Error('probe unavailable') })
      .mockResolvedValueOnce({ data: 'ok', error: null })

    const { result } = renderHook(() => useBoardAuth('board-1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.requiresPassword).toBeNull()

    await act(async () => {
      await result.current.unlock('secret')
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.requiresPassword).toBe(true)
  })

  it('keeps a newly entered password in memory when session storage rejects writes', () => {
    const setItem = vi.spyOn(sessionStorage, 'setItem').mockImplementation(() => {
      throw new Error('session storage blocked')
    })

    rememberBoardPassword('board-1', 'secret')

    expect(boardPassword('board-1')).toBe('secret')
    expect(localStorage.getItem('board_password_board-1')).toBeNull()
    expect(localStorage.getItem('board_access_board-1')).toBeNull()

    setItem.mockRestore()
  })

  it('migrates an existing local password into the tab session on first use', () => {
    localStorage.setItem('board_password_board-1', 'legacy-secret')
    localStorage.setItem('board_access_board-1', 'true')

    expect(boardPassword('board-1')).toBe('legacy-secret')
    expect(sessionStorage.getItem('board_password_board-1')).toBe('legacy-secret')
    expect(localStorage.getItem('board_password_board-1')).toBeNull()
    expect(localStorage.getItem('board_access_board-1')).toBeNull()
  })
})
