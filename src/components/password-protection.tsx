'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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
    
    try {
      const response = await fetch('/api/board/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId,
          password,
          action: 'verify'
        })
      })

      const { success, password: verifiedPassword } = await response.json()

      if (success) {
        // Store both access flag and password
        localStorage.setItem(`board_access_${boardId}`, 'true')
        localStorage.setItem(`board_password_${boardId}`, verifiedPassword)

        // Set the password in Supabase context
        await supabase.rpc('verify_and_set_board_password', {
          board_id_param: boardId,
          password_attempt: verifiedPassword
        })

        onSuccess()
      } else {
        setError('Incorrect password')
      }
    } catch (error) {
      console.error('Error verifying password:', error)
      setError('Failed to verify password')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4 dark:text-white">
          This board is password protected
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter board password"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={isVerifying}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isVerifying ? 'Verifying...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  )
} 