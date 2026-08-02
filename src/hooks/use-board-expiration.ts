import { useEffect, useState } from 'react'

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
