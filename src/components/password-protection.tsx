'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, Input } from '@/components/ui'

interface PasswordProtectionProps {
  boardId: string
  onSuccess: () => void
}

export function PasswordProtection({ boardId, onSuccess }: PasswordProtectionProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)
    setError('')

    try {
      const response = await fetch('/api/board/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId, password, action: 'verify' }),
      })

      if (!response.ok) {
        setError('Could not verify the password. Try again.')
        return
      }

      const { success } = await response.json()

      if (!success) {
        setError('Incorrect password')
        return
      }

      localStorage.setItem(`board_access_${boardId}`, 'true')
      localStorage.setItem(`board_password_${boardId}`, password)

      await supabase.rpc('verify_and_set_board_password', {
        board_id_param: boardId,
        password_attempt: password,
      })

      onSuccess()
    } catch (err) {
      console.error('Error verifying password:', err)
      setError('Could not verify the password. Try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center bg-canvas p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-panel border border-subtle bg-surface-raised p-5"
      >
        <h1 className="text-md font-semibold text-fg">This board is password protected</h1>
        <p className="mt-1 text-xs text-muted">
          Enter the board password to continue.
        </p>

        <div className="mt-4">
          <label htmlFor="board-password" className="block text-xs font-medium text-muted mb-1.5">
            Password
          </label>
          <Input
            id="board-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Board password"
            aria-invalid={Boolean(error)}
            aria-describedby="board-password-error"
            autoFocus
            required
          />
          <p id="board-password-error" role="alert" className="mt-1 min-h-4 text-xs text-danger">
            {error}
          </p>
        </div>

        <Button type="submit" variant="primary" className="mt-2 w-full" disabled={isVerifying}>
          {isVerifying ? 'Verifying' : 'Unlock board'}
        </Button>
      </form>
    </div>
  )
}
