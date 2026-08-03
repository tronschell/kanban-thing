import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  boardPassword,
  forgetBoardPassword,
  rememberBoardPassword,
  type WriteResult,
} from '@/lib/board-writes'

export function useBoardAuth(boardId: string | null) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [checkFailed, setCheckFailed] = useState(false)
  const [requiresPassword, setRequiresPassword] = useState<boolean | null>(null)
  const supabase = useMemo(createClient, [])

  useEffect(() => {
    let cancelled = false

    const checkAuth = async () => {
      if (!boardId) {
        setRequiresPassword(false)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setCheckFailed(false)

      try {
        const { data: needsPassword, error } = await supabase.rpc('board_requires_password', {
          board_id_param: boardId,
        })
        if (cancelled) return

        if (error) {
          console.error('Error checking board auth:', error)
          setRequiresPassword(null)
          setCheckFailed(true)
          setIsAuthenticated(false)
          setIsLoading(false)
          return
        }

        // null means the board does not exist: let board_read report not-found instead of
        // showing a password form for a board nobody can ever unlock.
        if (needsPassword !== true) {
          forgetBoardPassword(boardId)
          setRequiresPassword(false)
          setIsAuthenticated(true)
          setIsLoading(false)
          return
        }

        setRequiresPassword(true)
        const stored = boardPassword(boardId)
        if (!stored) {
          setIsAuthenticated(false)
          setIsLoading(false)
          return
        }

        const { data: status } = await supabase.rpc('board_check_password', {
          board_id_param: boardId,
          password_attempt: stored,
        })
        if (cancelled) return

        if (status === 'wrong_password') forgetBoardPassword(boardId)
        setIsAuthenticated(status === 'ok')
      } catch (error) {
        if (cancelled) return
        console.error('Error checking board auth:', error)
        setRequiresPassword(null)
        setIsAuthenticated(false)
      }

      setIsLoading(false)
    }

    checkAuth()
    return () => {
      cancelled = true
    }
  }, [boardId, supabase])

  const unlock = useCallback(
    async (password: string): Promise<WriteResult> => {
      if (!boardId) return 'not_found'

      const { data, error } = await supabase.rpc('board_check_password', {
        board_id_param: boardId,
        password_attempt: password,
      })
      if (error) throw error

      const status = data as WriteResult
      if (status === 'ok') {
        rememberBoardPassword(boardId, password)
        setRequiresPassword(true)
        setIsAuthenticated(true)
      }
      return status
    },
    [boardId, supabase]
  )

  const lock = useCallback(() => {
    if (boardId) forgetBoardPassword(boardId)
    setCheckFailed(false)
    setIsAuthenticated(false)
  }, [boardId])

  const setPasswordRequired = useCallback((required: boolean) => {
    setRequiresPassword(required)
  }, [])

  return {
    isAuthenticated,
    isLoading,
    checkFailed,
    requiresPassword,
    unlock,
    lock,
    setPasswordRequired,
  }
}
