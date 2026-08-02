'use client'

import { Badge } from '@/components/ui'
import { EXPIRY_WARNING_HOURS, countdownLabel } from '@/lib/board-lifespan'

export function BoardExpirationTimer({ hoursLeft }: { hoursLeft: number }) {
  if (hoursLeft <= 0) return <Badge variant="danger">Expired</Badge>

  return (
    <Badge variant={hoursLeft <= EXPIRY_WARNING_HOURS ? 'danger' : 'neutral'}>
      Expires in
      <span className="font-mono tabular-nums">{countdownLabel(hoursLeft)}</span>
    </Badge>
  )
}
