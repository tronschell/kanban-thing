'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
