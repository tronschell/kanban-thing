'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAnalytics } from '@/hooks/use-analytics'
import { Button, Input } from '@/components/ui'
import PasswordValidator from 'password-validator'

const passwordSchema = new PasswordValidator()
  .min(6)
  .max(100)
  .not()
  .spaces()
  .is()
  .not()
  .oneOf(['password', 'Password123', 'admin', '123456', 'qwerty'])

const PASSWORD_ERRORS: Record<string, string> = {
  min: 'Password must be at least 6 characters long',
  max: 'Password is too long',
  spaces: 'Password should not contain spaces',
  oneOf: 'This password is too common',
}

const DEFAULT_COLUMNS = ['To Do', 'In Progress', 'Done']

export default function UserOnboarding() {
  const [boardName, setBoardName] = useState('')
  const [password, setPassword] = useState('')
  const [nameError, setNameError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { trackEvent } = useAnalytics()

  const validatePassword = (value: string) => {
    const failed = passwordSchema.validate(value, { list: true }) as string[]
    setPasswordError(failed.length ? PASSWORD_ERRORS[failed[0]] ?? 'Invalid password' : '')
    return failed.length === 0
  }

  const validateName = (value: string) => {
    const valid = value.trim().length >= 3
    setNameError(valid ? '' : 'Board name must be at least 3 characters')
    return valid
  }

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')

    const name = boardName.trim()
    if (!validateName(boardName) || !validatePassword(password) || isCreating) return

    setIsCreating(true)
    try {
      const { data: board, error: boardError } = await supabase
        .from('boards')
        .insert({ name })
        .select('id')
        .single()

      if (boardError || !board?.id) throw boardError ?? new Error('Failed to create board')

      const passwordResponse = await fetch('/api/board/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId: board.id, password, action: 'set' }),
      })

      if (!passwordResponse.ok) {
        await supabase.from('boards').delete().eq('id', board.id)
        throw new Error('Failed to set the board password')
      }

      const { error: columnsError } = await supabase.from('columns').insert(
        DEFAULT_COLUMNS.map((columnName, position) => ({
          board_id: board.id,
          name: columnName,
          position,
        }))
      )

      if (columnsError) {
        await supabase.from('boards').delete().eq('id', board.id)
        throw columnsError
      }

      localStorage.setItem(`board_password_${board.id}`, password)
      localStorage.setItem(`board_access_${board.id}`, 'true')
      localStorage.setItem('kanban_user_id', board.id)

      await supabase.rpc('set_session_board_password', { password_param: password })

      trackEvent('create_board', { board_id: board.id, board_name: name })

      router.replace(`/board?id=${board.id}`)
    } catch (error) {
      console.error('Error creating board:', error)
      setSubmitError('Could not create the board. Please try again.')
      setIsCreating(false)
    }
  }

  return (
    <div className="flex min-h-[70vh] w-full flex-1 items-center justify-center bg-canvas p-4">
      <form
        onSubmit={handleCreateBoard}
        className="w-full max-w-sm rounded-panel border border-subtle bg-surface-raised p-5"
      >
        <h1 className="text-md font-semibold text-fg">Create your board</h1>
        <p className="mt-1 text-xs text-muted">
          No account needed. The password is how you and your team get back in.
        </p>

        <div className="mt-4">
          <label htmlFor="board-name" className="block text-xs font-medium text-muted mb-1.5">
            Board name
          </label>
          <Input
            id="board-name"
            value={boardName}
            onChange={(e) => {
              setBoardName(e.target.value)
              if (nameError) validateName(e.target.value)
            }}
            placeholder="Product roadmap"
            aria-invalid={Boolean(nameError)}
            aria-describedby="board-name-error"
            disabled={isCreating}
            autoFocus
            required
          />
          <p id="board-name-error" role="alert" className="mt-1 min-h-4 text-xs text-danger">
            {nameError}
          </p>
        </div>

        <div className="mt-2">
          <label htmlFor="board-password" className="block text-xs font-medium text-muted mb-1.5">
            Board password
          </label>
          <Input
            id="board-password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              validatePassword(e.target.value)
            }}
            placeholder="At least 6 characters"
            aria-invalid={Boolean(passwordError)}
            aria-describedby="board-password-error"
            disabled={isCreating}
            required
          />
          <p id="board-password-error" role="alert" className="mt-1 min-h-4 text-xs text-danger">
            {passwordError}
          </p>
        </div>

        <Button type="submit" variant="primary" size="lg" className="mt-2 w-full" disabled={isCreating}>
          {isCreating ? 'Creating board' : 'Create board'}
        </Button>

        <p role="alert" className="mt-1 min-h-4 text-center text-xs text-danger">
          {submitError}
        </p>
      </form>
    </div>
  )
}
