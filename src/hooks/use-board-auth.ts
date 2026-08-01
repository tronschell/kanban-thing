import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useBoardAuth(boardId: string | null) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = useMemo(createClient, [])

  useEffect(() => {
    let cancelled = false

    const checkAuth = async () => {
      if (!boardId) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        const { data: board } = await supabase
          .from('boards')
          .select('password_hash')
          .eq('id', boardId)
          .single()

        if (cancelled) return

        if (!board?.password_hash) {
          setIsAuthenticated(true)
          setIsLoading(false)
          return
        }

        const hasStoredAccess = localStorage.getItem(`board_access_${boardId}`) === 'true'
        const storedPassword = localStorage.getItem(`board_password_${boardId}`)

        if (hasStoredAccess && storedPassword) {
          const { data: isValid } = await supabase.rpc('verify_and_set_board_password', {
            board_id_param: boardId,
            password_attempt: storedPassword,
          })
          if (cancelled) return
          setIsAuthenticated(isValid)
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        if (cancelled) return
        console.error('Error checking board auth:', error)
        setIsAuthenticated(false)
      }

      setIsLoading(false)
    }

    checkAuth()
    return () => {
      cancelled = true
    }
  }, [boardId, supabase])

  return { isAuthenticated, isLoading }
}
