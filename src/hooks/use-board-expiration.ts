import { createClient } from '@/lib/supabase/client'
import { useEffect, useMemo, useState } from 'react'

export function useBoardExpiration(boardId: string | undefined) {
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const supabase = useMemo(createClient, [])

  useEffect(() => {
    if (!boardId) return
    let cancelled = false

    const fetchBoardExpiration = async () => {
      const { data, error } = await supabase
        .from('boards')
        .select('expires_at')
        .eq('id', boardId)
        .single()

      if (cancelled || error || !data) return
      setExpiresAt(data.expires_at)
    }

    fetchBoardExpiration()
    return () => {
      cancelled = true
    }
  }, [boardId, supabase])

  return expiresAt
}

export function useHoursLeft(expiresAt: string | null) {
  const [hoursLeft, setHoursLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!expiresAt) {
      setHoursLeft(null)
      return
    }
    const tick = () => setHoursLeft((new Date(expiresAt).getTime() - Date.now()) / 3600000)

    tick()
    const timer = setInterval(tick, 60000)
    return () => clearInterval(timer)
  }, [expiresAt])

  return hoursLeft
}
