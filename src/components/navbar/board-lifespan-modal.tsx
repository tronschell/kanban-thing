'use client'

import { Button, Modal, ModalFooter } from '@/components/ui'
import { daysUntil, formatExpiryDate } from '@/lib/board-lifespan'

interface BoardLifespanModalProps {
  open: boolean
  onClose: () => void
  expiresAt: string | null
}

const expiryLine = (expiresAt: string) => {
  const date = formatExpiryDate(new Date(expiresAt))
  if (new Date(expiresAt).getTime() <= Date.now())
    return `Expired ${date}. This board has expired and will be deleted.`

  const daysLeft = daysUntil(expiresAt)
  if (daysLeft === 0) return `Expires ${date}. Less than a day left.`
  return `Expires ${date}. ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left.`
}

export function BoardLifespanModal({ open, onClose, expiresAt }: BoardLifespanModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Board lifespan" size="sm">
      <p className="text-sm text-fg">
        {expiresAt ? expiryLine(expiresAt) : 'Loading expiry date…'}
      </p>
      <p className="mt-2 text-sm text-muted">
        A board lives for the span it was created with, up to 60 days. That date cannot be moved.
        On it, this board and every card on it are deleted permanently.
      </p>
      <p className="mt-2 text-sm text-muted">
        To keep this work, export the board, or duplicate it into a fresh board that starts its own
        60 days.
      </p>
      <ModalFooter>
        <Button onClick={onClose}>Close</Button>
      </ModalFooter>
    </Modal>
  )
}
