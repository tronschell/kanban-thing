'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, Modal, ModalFooter, Select } from '@/components/ui'
import {
  DEFAULT_LIFESPAN_DAYS,
  LIFESPAN_OPTIONS,
  daysUntil,
  expiryDateFor,
  formatExpiryDate,
} from '@/lib/board-lifespan'

interface BoardLifespanModalProps {
  open: boolean
  onClose: () => void
  boardId: string
  expiresAt: string
  onExtended: (expiresAt: string) => void
}

interface ExtendResult {
  status: string
  expires_at?: string
}

export function BoardLifespanModal({
  open,
  onClose,
  boardId,
  expiresAt,
  onExtended,
}: BoardLifespanModalProps) {
  const [days, setDays] = useState(DEFAULT_LIFESPAN_DAYS)
  const [error, setError] = useState('')
  const [isExtending, setIsExtending] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!open) return
    setDays(DEFAULT_LIFESPAN_DAYS)
    setError('')
  }, [open])

  const daysLeft = daysUntil(expiresAt)

  const handleExtend = async () => {
    setIsExtending(true)
    setError('')

    const { data, error: rpcError } = await supabase.rpc('board_extend', {
      board_id_param: boardId,
      password_attempt: localStorage.getItem(`board_password_${boardId}`) ?? '',
      days_param: days,
    })

    setIsExtending(false)
    const result = data as ExtendResult | null

    if (rpcError || !result?.expires_at || result.status !== 'ok') {
      console.error('Error extending board:', rpcError ?? result)
      setError(
        result?.status === 'wrong_password'
          ? 'The stored board password no longer works. Reopen the board and enter it again.'
          : 'Could not extend this board. Try again.'
      )
      return
    }

    onExtended(result.expires_at)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Board lifespan" size="sm">
      <p className="text-sm text-muted">
        Expires {formatExpiryDate(new Date(expiresAt))}.{' '}
        {daysLeft === 0
          ? 'Less than a day left.'
          : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left.`}
      </p>

      <div className="mt-4">
        <label htmlFor="extend-days" className="block text-xs font-medium text-muted mb-1.5">
          Extend by
        </label>
        <Select
          id="extend-days"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          disabled={isExtending}
        >
          {LIFESPAN_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option} days
            </option>
          ))}
        </Select>
        <p className="mt-1 text-xs text-subtle">
          New expiry {expiryDateFor(days)}. Counted from today. Extending never shortens a board,
          and 90 days is the longest a single extension can add.
        </p>
      </div>

      <p role="alert" className="mt-1 min-h-4 text-xs text-danger">
        {error}
      </p>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={isExtending}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleExtend} disabled={isExtending}>
          {isExtending ? 'Extending' : 'Extend board'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
