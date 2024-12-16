import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useBoardAuth(boardId: string | null) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      if (!boardId) {
        setIsLoading(false)
        return
      }

      try {
        // First check if board has a password
        const { data: board } = await supabase
          .from('boards')
          .select('password_hash')
          .eq('id', boardId)
          .single()

        // If no password required, user is authenticated
        if (!board?.password_hash) {
          setIsAuthenticated(true)
          setIsLoading(false)
          return
        }

        // Check localStorage for stored access
        const hasStoredAccess = localStorage.getItem(`board_access_${boardId}`) === 'true'
        const storedPassword = localStorage.getItem(`board_password_${boardId}`)

        if (hasStoredAccess && storedPassword) {
          // Verify the stored password
          const { data: isValid } = await supabase.rpc('verify_and_set_board_password', {
            board_id_param: boardId,
            password_attempt: storedPassword
          })

          setIsAuthenticated(isValid)
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Error checking board auth:', error)
        setIsAuthenticated(false)
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [boardId])

  return { isAuthenticated, isLoading }
} 