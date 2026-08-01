'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAnalytics } from '@/hooks/use-analytics'
import { Button, Input, Select } from '@/components/ui'
import { DEFAULT_LIFESPAN_DAYS, LIFESPAN_OPTIONS, expiryDateFor } from '@/lib/board-lifespan'
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
  const [lifespanDays, setLifespanDays] = useState(DEFAULT_LIFESPAN_DAYS)
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
      const { data: boardId, error: createError } = await supabase.rpc('board_create', {
        name_param: name,
        password_param: password,
        extra_columns: DEFAULT_COLUMNS,
        days_param: lifespanDays,
      })

      if (createError || !boardId) throw createError ?? new Error('Failed to create board')

      localStorage.setItem(`board_password_${boardId}`, password)
      localStorage.setItem(`board_access_${boardId}`, 'true')
      localStorage.setItem('kanban_user_id', boardId)

      trackEvent('create_board', { board_id: boardId, board_name: name })

      router.replace(`/board?id=${boardId}`)
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

        <div className="mt-2">
          <label htmlFor="board-lifespan" className="block text-xs font-medium text-muted mb-1.5">
            Board lifespan
          </label>
          <Select
            id="board-lifespan"
            value={lifespanDays}
            onChange={(e) => setLifespanDays(Number(e.target.value))}
            disabled={isCreating}
          >
            {LIFESPAN_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} days
              </option>
            ))}
          </Select>
          <p className="mt-1 min-h-4 text-xs text-subtle">
            Expires {expiryDateFor(lifespanDays)}. You can extend it any time from the board menu.
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
