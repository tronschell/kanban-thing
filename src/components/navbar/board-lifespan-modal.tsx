'use client'

import { Button, Modal, ModalFooter } from '@/components/ui'
import { daysUntil, formatExpiryDate } from '@/lib/board-lifespan'

interface BoardLifespanModalProps {
  open: boolean
  onClose: () => void
  expiresAt: string
}

export function BoardLifespanModal({ open, onClose, expiresAt }: BoardLifespanModalProps) {
  const daysLeft = daysUntil(expiresAt)

  return (
    <Modal open={open} onClose={onClose} title="Board lifespan" size="sm">
      <p className="text-sm text-fg">
        Expires {formatExpiryDate(new Date(expiresAt))}.{' '}
        {daysLeft === 0
          ? 'Less than a day left.'
          : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left.`}
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
