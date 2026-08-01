'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui'

const formatTimeLeft = (expiresAt: string) => {
  const remaining = new Date(expiresAt).getTime() - Date.now()
  if (remaining <= 0) return 'Expired'

  const days = Math.floor(remaining / 86400000)
  const hours = Math.floor((remaining % 86400000) / 3600000)
  return `${days}d ${hours}h`
}

export function BoardExpirationTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    setTimeLeft(formatTimeLeft(expiresAt))
    const timer = setInterval(() => setTimeLeft(formatTimeLeft(expiresAt)), 60000)
    return () => clearInterval(timer)
  }, [expiresAt])

  if (!timeLeft) return null

  if (timeLeft === 'Expired') {
    return <Badge variant="danger">Expired</Badge>
  }

  return (
    <Badge>
      <span className="text-subtle">Expires in</span>
      <span className="font-mono tabular-nums">{timeLeft}</span>
    </Badge>
  )
}
