'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Square, SquareCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, Modal, ModalFooter } from '@/components/ui'

interface RenameBoardModalProps {
  open: boolean
  onClose: () => void
  boardId: string
  boardName: string
  onRenamed: (name: string) => void
}

export function RenameBoardModal({
  open,
  onClose,
  boardId,
  boardName,
  onRenamed,
}: RenameBoardModalProps) {
  const [name, setName] = useState(boardName)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (open) setName(boardName)
  }, [open, boardName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setIsSaving(true)
    const { error } = await supabase.from('boards').update({ name: trimmed }).eq('id', boardId)
    setIsSaving(false)

    if (error) {
      console.error('Error renaming board:', error)
      return
    }

    onRenamed(trimmed)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Rename board" size="sm">
      <form onSubmit={handleSubmit}>
        <label htmlFor="board-name" className="block text-xs font-medium text-muted mb-1.5">
          Board name
        </label>
        <Input
          id="board-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Board name"
          autoFocus
        />
        <ModalFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving || !name.trim()}>
            {isSaving ? 'Saving' : 'Rename'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

interface DuplicateBoardModalProps {
  open: boolean
  onClose: () => void
  boardId: string
  boardName: string
}

export function DuplicateBoardModal({
  open,
  onClose,
  boardId,
  boardName,
}: DuplicateBoardModalProps) {
  const [name, setName] = useState('')
  const [includeCards, setIncludeCards] = useState(true)
  const [error, setError] = useState('')
  const [isDuplicating, setIsDuplicating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!open) return
    setName(`${boardName} (copy)`)
    setIncludeCards(true)
    setError('')
  }, [open, boardName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsDuplicating(true)
    setError('')

    const password = localStorage.getItem(`board_password_${boardId}`) ?? ''
    const { data, error: rpcError } = await supabase.rpc('board_duplicate', {
      board_id_param: boardId,
      password_attempt: password,
      new_name: name.trim(),
      include_cards: includeCards,
    })

    const result = data as { status?: string; board_id?: string } | null

    if (rpcError || !result) {
      console.error('Error duplicating board:', rpcError)
      setError('Could not duplicate this board. Try again.')
      setIsDuplicating(false)
      return
    }

    if (result.status !== 'ok' || !result.board_id) {
      setError(
        result.status === 'wrong_password'
          ? 'The stored board password no longer works. Reopen the board and try again.'
          : 'Could not duplicate this board. Try again.'
      )
      setIsDuplicating(false)
      return
    }

    if (password) {
      localStorage.setItem(`board_password_${result.board_id}`, password)
      localStorage.setItem(`board_access_${result.board_id}`, 'true')
    }

    router.push(`/board?id=${result.board_id}`)
  }

  return (
    <Modal open={open} onClose={onClose} title="Duplicate board" size="sm">
      <form onSubmit={handleSubmit}>
        <label
          htmlFor="duplicate-board-name"
          className="block text-xs font-medium text-muted mb-1.5"
        >
          New board name
        </label>
        <Input
          id="duplicate-board-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Board name"
          aria-invalid={Boolean(error)}
          aria-describedby="duplicate-board-error"
          autoFocus
        />

        <Button
          variant="ghost"
          role="checkbox"
          aria-checked={includeCards}
          onClick={() => setIncludeCards((checked) => !checked)}
          className="mt-3 w-full justify-start px-1.5"
        >
          {includeCards ? <SquareCheck className="text-accent" /> : <Square />}
          Include cards
        </Button>

        <p className="mt-3 text-xs text-subtle">
          The copy keeps the same password and starts a fresh 60-day lifespan.
        </p>
        <p id="duplicate-board-error" role="alert" className="mt-1 min-h-4 text-xs text-danger">
          {error}
        </p>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose} disabled={isDuplicating}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isDuplicating || !name.trim()}>
            {isDuplicating ? 'Duplicating' : 'Duplicate'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

interface SetPasswordModalProps {
  open: boolean
  onClose: () => void
  boardId: string
}

export function SetPasswordModal({ open, onClose, boardId }: SetPasswordModalProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setPassword('')
      setError('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')

    try {
      const response = await fetch('/api/board/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId, password, action: 'set' }),
      })

      if (!response.ok) throw new Error('Failed to set password')

      localStorage.setItem(`board_password_${boardId}`, password)
      localStorage.setItem(`board_access_${boardId}`, 'true')

      onClose()
    } catch (err) {
      console.error('Error setting board password:', err)
      setError('Could not update the password. Try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Board password"
      description="Anyone opening the board link has to enter this password."
      size="sm"
    >
      <form onSubmit={handleSubmit}>
        <label htmlFor="new-board-password" className="block text-xs font-medium text-muted mb-1.5">
          Password
        </label>
        <Input
          id="new-board-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New board password"
          aria-invalid={Boolean(error)}
          aria-describedby="new-board-password-error"
          autoFocus
        />
        <p id="new-board-password-error" role="alert" className="mt-1 min-h-4 text-xs text-danger">
          {error}
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving || !password}>
            {isSaving ? 'Saving' : 'Save password'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

interface DeleteBoardModalProps {
  open: boolean
  onClose: () => void
  boardId: string
}

export function DeleteBoardModal({ open, onClose, boardId }: DeleteBoardModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (open) setError('')
  }, [open])

  const handleDelete = async () => {
    setIsDeleting(true)
    const { error: deleteError } = await supabase.rpc('delete_board_cascade', {
      board_id_param: boardId,
    })

    if (deleteError) {
      console.error('Error deleting board:', deleteError)
      setError('Could not delete this board. Try again.')
      setIsDeleting(false)
      return
    }

    router.push('/')
  }

  return (
    <Modal open={open} onClose={onClose} title="Delete board" size="sm">
      <p className="text-sm text-muted">
        This deletes the board, its columns and every card on it. It cannot be undone.
      </p>
      <p role="alert" className="mt-1 min-h-4 text-xs text-danger">
        {error}
      </p>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? 'Deleting' : 'Delete board'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
