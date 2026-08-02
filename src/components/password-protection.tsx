'use client'

import { useState } from 'react'
import { Button, Input } from '@/components/ui'
import type { WriteResult } from '@/lib/board-writes'

interface PasswordProtectionProps {
  unlock: (password: string) => Promise<WriteResult>
  /** Why the board locked itself mid-session, when it did. */
  notice?: string | null
}

export function PasswordProtection({ unlock, notice }: PasswordProtectionProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)
    setError('')

    try {
      const result = await unlock(password)
      if (result === 'wrong_password') setError('Incorrect password')
      if (result === 'not_found') setError('This board no longer exists.')
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

        {notice && (
          <p role="alert" className="mt-3 rounded-control border border-danger bg-danger-soft px-2.5 py-2 text-xs text-danger">
            {notice}
          </p>
        )}

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
