import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function useBoardExpiration(boardId: string | undefined) {
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchBoardExpiration() {
      if (!boardId) return

      const { data, error } = await supabase
        .from('boards')
        .select('expires_at')
        .eq('id', boardId)
        .single()

      if (!error && data) {
        setExpiresAt(data.expires_at)
      }
    }

    fetchBoardExpiration()
  }, [boardId])

  return expiresAt
} 