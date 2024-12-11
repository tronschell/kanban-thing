'use client'

import { useState } from 'react'
import { LoadingSpinner } from './ui/loading-spinner'
import { Button } from './ui/button'

interface PasswordProtectionProps {
  boardId: string
  onSuccess: () => void
}

export function PasswordProtection({ boardId, onSuccess }: PasswordProtectionProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      console.log('Attempting verification with:', { boardId, password })

      const response = await fetch('/api/board/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boardId,
          password,
          action: 'verify'
        })
      })

      const data = await response.json()
      console.log('Verification response:', { response, data })

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify password')
      }

      if (data.success === true) {
        localStorage.setItem(`board_access_${boardId}`, 'true')
        onSuccess()
      } else {
        setError('Incorrect password')
      }
    } catch (err) {
      console.error('Password verification error:', err)
      setError('Failed to verify password')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          This board is password protected
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Enter Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <Button
            type="submit"
            variant="outline"
            className="w-full bg-white hover:bg-gray-100 dark:bg-white dark:hover:bg-gray-200 
              text-gray-900 dark:text-gray-900 border-gray-300"
          >
            Submit
          </Button>
        </form>
      </div>
    </div>
  )
} 