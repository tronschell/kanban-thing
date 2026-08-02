'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Square, SquareCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  boardPassword,
  deleteBoard,
  forgetBoardPassword,
  rememberBoardPassword,
  renameBoard,
  setBoardPassword,
} from '@/lib/board-writes'
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
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      setName(boardName)
      setError('')
    }
  }, [open, boardName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setIsSaving(true)
    setError('')

    const result = await renameBoard(supabase, boardId, trimmed).catch(() => null)
    setIsSaving(false)

    if (result === 'wrong_password') return setError('The board password is no longer correct.')
    if (result === 'not_found') return setError('This board no longer exists.')
    if (result !== 'ok') return setError('Could not rename this board. Try again.')

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
          aria-invalid={Boolean(error)}
          aria-describedby="rename-board-error"
          autoFocus
        />
        <p id="rename-board-error" role="alert" className="mt-1 min-h-4 text-xs text-danger">
          {error}
        </p>
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

    const password = boardPassword(boardId)
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

    if (password) rememberBoardPassword(result.board_id, password)

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
  const [hasPassword, setHasPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!open) return
    let cancelled = false

    setPassword('')
    setError('')
    setCurrentPassword(boardPassword(boardId))

    supabase
      .rpc('board_requires_password', { board_id_param: boardId })
      .then(({ data }) => !cancelled && setHasPassword(data === true))

    return () => {
      cancelled = true
    }
  }, [open, boardId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')

    const result = await setBoardPassword(
      supabase,
      boardId,
      hasPassword ? currentPassword : '',
      password
    ).catch(() => null)
    setIsSaving(false)

    if (result === 'wrong_password') return setError('Current password is incorrect')
    if (result === 'not_found') return setError('This board no longer exists.')
    if (result !== 'ok') return setError('Could not update the password. Try again.')

    if (password) rememberBoardPassword(boardId, password)
    else forgetBoardPassword(boardId)

    onClose()
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
        {hasPassword && (
          <div className="mb-3">
            <label
              htmlFor="current-board-password"
              className="block text-xs font-medium text-muted mb-1.5"
            >
              Current password
            </label>
            <Input
              id="current-board-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current board password"
              aria-invalid={Boolean(error)}
              autoFocus
            />
          </div>
        )}

        <label htmlFor="new-board-password" className="block text-xs font-medium text-muted mb-1.5">
          New password
        </label>
        <Input
          id="new-board-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Leave empty to remove the password"
          aria-invalid={Boolean(error)}
          aria-describedby="new-board-password-error"
          autoFocus={!hasPassword}
        />
        <p id="new-board-password-error" role="alert" className="mt-1 min-h-4 text-xs text-danger">
          {error}
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? 'Saving' : hasPassword && !password ? 'Remove password' : 'Save password'}
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
    const result = await deleteBoard(supabase, boardId).catch(() => null)

    if (result === 'wrong_password') {
      setError('The board password is no longer correct.')
      setIsDeleting(false)
      return
    }

    if (result === null) {
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
